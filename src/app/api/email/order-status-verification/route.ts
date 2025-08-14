import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/emailService';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// REQ-B-15.3: API endpoint untuk pengiriman email verifikasi perubahan status pesanan
export async function POST(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { orderId, newStatus, customerEmail } = await request.json();

    // Validate input
    if (!orderId || !newStatus || !customerEmail) {
      return NextResponse.json({
        success: false,
        error: 'Order ID, new status, and customer email are required'
      }, { status: 400 });
    }

    // Get order details with related data
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            isActive: true
          }
        },
        provider: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        providerService: {
          select: {
            id: true,
            serviceTitle: true,
            description: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }

    // Verify that the customer email matches
    if (order.customer.email !== customerEmail) {
      return NextResponse.json({
        success: false,
        error: 'Customer email does not match order'
      }, { status: 400 });
    }

    if (!order.customer.isActive) {
      return NextResponse.json({
        success: false,
        error: 'Customer account is deactivated'
      }, { status: 403 });
    }

    // Validate status change permissions
    const user = await prisma.user.findUnique({
      where: { id: parseInt(decoded.userId) },
      include: { role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has permission to change order status
    const isProvider = user.role.roleName === 'provider' && order.providerId === user.id;
    const isAdmin = user.role.roleName === 'admin';
    const isCustomer = user.role.roleName === 'customer' && order.customerId === user.id;

    if (!isProvider && !isAdmin && !isCustomer) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to change order status'
      }, { status: 403 });
    }

    // Validate status transition
    const validStatusTransitions: { [key: string]: string[] } = {
      'PENDING_ACCEPTANCE': ['ACCEPTED', 'REJECTED_BY_PROVIDER'],
      'ACCEPTED': ['IN_PROGRESS', 'CANCELLED_BY_CUSTOMER'],
      'IN_PROGRESS': ['COMPLETED', 'CANCELLED_BY_CUSTOMER', 'DISPUTED'],
      'COMPLETED': ['DISPUTED'],
      'DISPUTED': ['COMPLETED', 'CANCELLED_BY_CUSTOMER']
    };

    const currentStatus = order.status;
    const allowedTransitions = validStatusTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      return NextResponse.json({
        success: false,
        error: `Invalid status transition from ${currentStatus} to ${newStatus}`
      }, { status: 400 });
    }

    // Check rate limiting - max 3 attempts per hour per order
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentAttempts = await (prisma as any).emailVerification.count({
      where: {
        email: customerEmail,
        type: 'ORDER_STATUS_CHANGE',
        createdAt: {
          gte: oneHourAgo
        }
      }
    });

    if (recentAttempts >= 3) {
      return NextResponse.json({
        success: false,
        error: 'Too many verification attempts for order status change. Please try again in 1 hour.'
      }, { status: 429 });
    }

    // Format status for display
    const statusDisplayMap: { [key: string]: string } = {
      'PENDING_ACCEPTANCE': 'Menunggu Konfirmasi Provider',
      'ACCEPTED': 'Diterima Provider',
      'REJECTED_BY_PROVIDER': 'Ditolak Provider',
      'IN_PROGRESS': 'Sedang Dikerjakan',
      'COMPLETED': 'Selesai',
      'CANCELLED_BY_CUSTOMER': 'Dibatalkan Customer',
      'DISPUTED': 'Dalam Sengketa'
    };

    // Send verification email
    const result = await sendVerificationEmail(
      customerEmail, 
      'ORDER_STATUS_CHANGE', 
      {
        orderNumber: order.id,
        newStatus: statusDisplayMap[newStatus] || newStatus,
        customerName: order.customer.fullName,
        providerName: order.provider.fullName,
        serviceName: order.providerService.serviceTitle
      },
      order.customer.id
    );

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to send verification email'
      }, { status: 500 });
    }

    // Log successful attempt
    console.log(`Order status change verification email sent for order #${orderId} to: ${customerEmail}`);

    return NextResponse.json({
      success: true,
      message: 'Order status change verification email sent successfully',
      data: {
        orderId: order.id,
        currentStatus,
        proposedStatus: newStatus,
        customerEmail,
        ...(process.env.NODE_ENV === 'development' && { verificationCode: result.code })
      }
    });

  } catch (error) {
    console.error('Error in order status change verification email:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Verify order status change code and apply the status change
export async function PUT(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { orderId, code, newStatus, customerEmail } = await request.json();

    // Validate input
    if (!orderId || !code || !newStatus || !customerEmail) {
      return NextResponse.json({
        success: false,
        error: 'Order ID, verification code, new status, and customer email are required'
      }, { status: 400 });
    }

    // Import verification function
    const { verifyCode } = await import('@/lib/emailService');
    
    // Verify the code
    const verification = await verifyCode(customerEmail, code, 'ORDER_STATUS_CHANGE');

    if (!verification) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired verification code'
      }, { status: 400 });
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        provider: {
          select: {
            id: true,
            fullName: true
          }
        },
        providerService: {
          select: {
            serviceTitle: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }

    // Verify customer email matches
    if (order.customer.email !== customerEmail) {
      return NextResponse.json({
        success: false,
        error: 'Customer email does not match order'
      }, { status: 400 });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        status: newStatus,
        information: `Status changed via email verification at ${new Date().toISOString()}`
      },
      include: {
        customer: {
          select: {
            fullName: true,
            email: true
          }
        },
        provider: {
          select: {
            fullName: true
          }
        },
        providerService: {
          select: {
            serviceTitle: true
          }
        }
      }
    });

    // Log successful status change
    console.log(`Order #${orderId} status changed from ${order.status} to ${newStatus} via email verification`);

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        orderId: updatedOrder.id,
        previousStatus: order.status,
        newStatus: updatedOrder.status,
        customer: updatedOrder.customer,
        provider: updatedOrder.provider,
        service: updatedOrder.providerService,
        updatedAt: updatedOrder.updatedAt
      }
    });

  } catch (error) {
    console.error('Error in order status change verification:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
