import { NextRequest, NextResponse } from 'next/server';
import { createAuthMiddleware } from '@/lib/jwt';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

interface RouteParams {
  params: { id: string }
}

// REQ-B-5.5: Customer Verification of Provider Data
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate Bearer token - customers only can verify
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['customer']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const customerId = parseInt(authResult.user!.userId);
    const { id } = await params;
    const orderId = parseInt(id);
    const { verificationStatus, notes } = await request.json();

    // Validate verification status
    const validStatuses = ['verified', 'rejected'];
    if (!validStatuses.includes(verificationStatus)) {
      return createErrorResponse('Invalid verification status. Must be "verified" or "rejected"', 400);
    }

    // Check if order exists and belongs to this customer
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: customerId
      }
    });

    if (!order) {
      return createErrorResponse('Order not found or access denied', 404);
    }

    // Check if order is in valid status for verification
    const validOrderStatuses = ['IN_PROGRESS', 'COMPLETED'];
    if (!validOrderStatuses.includes(order.status)) {
      return createErrorResponse('Cannot verify order in current status', 400);
    }

    // Update order with verification information
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        customerVerificationStatus: verificationStatus,
        customerVerificationNotes: notes || null,
        customerVerificationTime: new Date(),
        // If rejected, revert order status to require attention
        status: verificationStatus === 'rejected' ? 'IN_PROGRESS' : 
               verificationStatus === 'verified' && order.status === 'COMPLETED' ? 'COMPLETED' : order.status,
        updatedAt: new Date()
      } as any
    }) as any;

    // Get related data for response
    const [customer, provider, providerService] = await Promise.all([
      prisma.user.findUnique({
        where: { id: order.customerId },
        select: { id: true, fullName: true, email: true, phoneNumber: true }
      }),
      prisma.user.findUnique({
        where: { id: order.providerId },
        select: { id: true, fullName: true, email: true, phoneNumber: true }
      }),
      prisma.providerService.findUnique({
        where: { id: order.providerServiceId },
        select: { 
          id: true, 
          serviceTitle: true, 
          price: true,
          category: {
            select: { name: true }
          }
        }
      })
    ]);

    // Log the verification
    console.log(`Customer ${customerId} ${verificationStatus} provider for order ${orderId}`);

    return createSuccessResponse({
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        verificationStatus: updatedOrder.customerVerificationStatus,
        verificationNotes: updatedOrder.customerVerificationNotes,
        verificationTime: updatedOrder.customerVerificationTime,
        customer,
        provider,
        service: providerService,
        scheduledDate: updatedOrder.scheduledDate,
        updatedAt: updatedOrder.updatedAt
      }
    }, `Provider ${verificationStatus} successfully`);

  } catch (error) {
    console.error('Customer verification error:', error);
    return handleApiError(error);
  }
}

// Get verification status and details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate Bearer token - customer and provider can view
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['customer', 'provider']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const userId = parseInt(authResult.user!.userId);
    const { id } = await params;
    const orderId = parseInt(id);

    // Get order with verification info
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [
          { customerId: userId },
          { providerId: userId }
        ]
      }
    }) as any;

    if (!order) {
      return createErrorResponse('Order not found or access denied', 404);
    }

    // Get related data
    const [customer, provider, providerService] = await Promise.all([
      prisma.user.findUnique({
        where: { id: order.customerId },
        select: { id: true, fullName: true, email: true }
      }),
      prisma.user.findUnique({
        where: { id: order.providerId },
        select: { id: true, fullName: true, email: true }
      }),
      prisma.providerService.findUnique({
        where: { id: order.providerServiceId },
        select: { 
          id: true, 
          serviceTitle: true,
          category: {
            select: { name: true }
          }
        }
      })
    ]);

    return createSuccessResponse({
      orderId: order.id,
      orderStatus: order.status,
      verificationStatus: order.customerVerificationStatus,
      verificationNotes: order.customerVerificationNotes,
      verificationTime: order.customerVerificationTime,
      attendanceStatus: order.providerAttendanceStatus,
      attendanceTime: order.providerArrivalTime,
      scheduledDate: order.scheduledDate,
      customer,
      provider,
      service: providerService
    }, 'Verification status retrieved successfully');

  } catch (error) {
    console.error('Get verification status error:', error);
    return handleApiError(error);
  }
}
