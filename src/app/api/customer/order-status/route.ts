import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// REQ-B-14.2: API endpoint untuk akses Customer yang mampu mengembalikan informasi status pesanan saat ini
export async function GET(request: NextRequest) {
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

    // Check if user is customer
    const customer = await prisma.user.findUnique({
      where: { id: parseInt(decoded.userId) },
      include: { role: true }
    });

    if (!customer || customer.role.roleName !== 'customer') {
      return NextResponse.json({ error: 'Customer access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      customerId: customer.id
    };

    if (status) {
      whereClause.status = status.toUpperCase();
    }

    // Get customer's orders with current status
    const [orders, totalOrders] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          provider: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              verificationStatus: true
            }
          },
          providerService: {
            include: {
              category: true
            }
          },
          review: true,
          payment: true
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.order.count({ where: whereClause })
    ]);

    // Count orders by status
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      where: { customerId: customer.id },
      _count: {
        id: true
      }
    });

    const statusSummary = {
      PENDING_ACCEPTANCE: 0,
      ACCEPTED: 0,
      REJECTED_BY_PROVIDER: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED_BY_CUSTOMER: 0,
      DISPUTED: 0
    };

    statusCounts.forEach(item => {
      statusSummary[item.status as keyof typeof statusSummary] = item._count.id;
    });

    // Count orders that need customer action
    const needsAction = {
      needsReview: await prisma.order.count({
        where: {
          customerId: customer.id,
          status: 'COMPLETED',
          review: null
        }
      }),
      needsPayment: await prisma.order.count({
        where: {
          customerId: customer.id,
          status: 'COMPLETED',
          payment: {
            status: 'PENDING'
          }
        }
      }),
      inProgress: await prisma.order.count({
        where: {
          customerId: customer.id,
          status: 'IN_PROGRESS'
        }
      })
    };

    return NextResponse.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          fullName: customer.fullName,
          email: customer.email
        },
        statusSummary,
        needsAction,
        orders: orders.map(order => ({
          id: order.id,
          provider: order.provider,
          service: {
            id: order.providerService.id,
            title: order.providerService.serviceTitle,
            description: order.providerService.description,
            price: order.providerService.price,
            category: order.providerService.category.name
          },
          orderDetails: {
            orderDate: order.orderDate,
            scheduledDate: order.scheduledDate,
            jobAddress: order.jobAddress,
            district: order.district,
            subDistrict: order.subDistrict,
            ward: order.ward,
            jobDescriptionNotes: order.jobDescriptionNotes,
            finalAmount: order.finalAmount,
            chosenPaymentMethod: order.chosenPaymentMethod
          },
          status: order.status,
          information: order.information,
          providerAttendance: {
            status: (order as any).providerAttendanceStatus,
            arrivalTime: (order as any).providerArrivalTime,
            notes: (order as any).providerNotes
          },
          customerVerification: {
            status: (order as any).customerVerificationStatus,
            notes: (order as any).customerVerificationNotes,
            time: (order as any).customerVerificationTime
          },
          canReview: order.status === 'COMPLETED' && order.review === null,
          canCancel: ['PENDING_ACCEPTANCE', 'ACCEPTED'].includes(order.status),
          canDispute: order.status === 'COMPLETED',
          hasReview: order.review !== null,
          review: order.review ? {
            id: order.review.id,
            rating: order.review.rating,
            comment: order.review.comment,
            createdAt: order.review.createdAt
          } : null,
          payment: order.payment ? {
            id: order.payment.id,
            status: order.payment.status,
            amount: order.payment.amount,
            paymentMethod: order.payment.paymentMethod,
            paidAt: order.payment.paidAt
          } : null,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        })),
        pagination: {
          page,
          limit,
          total: totalOrders,
          totalPages: Math.ceil(totalOrders / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching customer order status:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
