import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// REQ-B-14.3: API endpoint untuk akses Customer yang berisikan pesanan selesai tetapi belum memberikan ulasan
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Get completed orders without reviews
    const [ordersWithoutReview, totalOrders] = await Promise.all([
      prisma.order.findMany({
        where: {
          customerId: customer.id,
          status: 'COMPLETED',
          review: null
        },
        include: {
          provider: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              verificationStatus: true,
              profilePictureUrl: true
            }
          },
          providerService: {
            include: {
              category: true
            }
          },
          payment: true,
          orderDetails: {
            include: {
              addedByUser: {
                select: {
                  id: true,
                  fullName: true,
                  role: true
                }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.order.count({
        where: {
          customerId: customer.id,
          status: 'COMPLETED',
          review: null
        }
      })
    ]);

    // Calculate how many days since completion for each order
    const ordersWithTimeSinceCompletion = ordersWithoutReview.map(order => {
      const daysSinceCompletion = Math.floor(
        (new Date().getTime() - order.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: order.id,
        provider: {
          id: order.provider.id,
          fullName: order.provider.fullName,
          email: order.provider.email,
          phoneNumber: order.provider.phoneNumber,
          verificationStatus: order.provider.verificationStatus,
          profilePictureUrl: order.provider.profilePictureUrl
        },
        service: {
          id: order.providerService.id,
          title: order.providerService.serviceTitle,
          description: order.providerService.description,
          price: order.providerService.price,
          category: {
            id: order.providerService.category.id,
            name: order.providerService.category.name,
            iconUrl: order.providerService.category.iconUrl
          }
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
        additionalDetails: order.orderDetails.map(detail => ({
          id: detail.id,
          description: detail.description,
          quantity: detail.quantity,
          pricePerUnit: detail.pricePerUnit,
          status: detail.status,
          addedBy: detail.addedByUser
        })),
        payment: order.payment ? {
          id: order.payment.id,
          status: order.payment.status,
          amount: order.payment.amount,
          paymentMethod: order.payment.paymentMethod,
          paidAt: order.payment.paidAt
        } : null,
        completionInfo: {
          completedAt: order.updatedAt,
          daysSinceCompletion,
          reviewDeadline: daysSinceCompletion >= 30 ? 'Expired' : `${30 - daysSinceCompletion} days left`,
          isReviewOverdue: daysSinceCompletion > 7,
          reviewUrgency: daysSinceCompletion <= 3 ? 'High' : 
                       daysSinceCompletion <= 7 ? 'Medium' : 
                       daysSinceCompletion <= 14 ? 'Low' : 'Expired'
        },
        canReview: daysSinceCompletion <= 30, // Allow review for 30 days
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };
    });

    // Group orders by urgency
    const groupedByUrgency = {
      high: ordersWithTimeSinceCompletion.filter(order => order.completionInfo.reviewUrgency === 'High'),
      medium: ordersWithTimeSinceCompletion.filter(order => order.completionInfo.reviewUrgency === 'Medium'),
      low: ordersWithTimeSinceCompletion.filter(order => order.completionInfo.reviewUrgency === 'Low'),
      expired: ordersWithTimeSinceCompletion.filter(order => order.completionInfo.reviewUrgency === 'Expired')
    };

    // Get summary statistics
    const summary = {
      totalOrdersWithoutReview: totalOrders,
      urgencyBreakdown: {
        high: groupedByUrgency.high.length,
        medium: groupedByUrgency.medium.length,
        low: groupedByUrgency.low.length,
        expired: groupedByUrgency.expired.length
      },
      oldestPendingReview: ordersWithoutReview.length > 0 ? 
        Math.max(...ordersWithTimeSinceCompletion.map(order => order.completionInfo.daysSinceCompletion)) : 0,
      averageDaysSinceCompletion: ordersWithoutReview.length > 0 ?
        Math.round(ordersWithTimeSinceCompletion.reduce((sum, order) => 
          sum + order.completionInfo.daysSinceCompletion, 0) / ordersWithTimeSinceCompletion.length) : 0
    };

    return NextResponse.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          fullName: customer.fullName,
          email: customer.email
        },
        summary,
        orders: ordersWithTimeSinceCompletion,
        groupedByUrgency,
        pagination: {
          page,
          limit,
          total: totalOrders,
          totalPages: Math.ceil(totalOrders / limit)
        },
        reviewGuidelines: {
          reviewWindow: '30 days after completion',
          recommendedTimeframe: 'Within 7 days',
          whatToInclude: [
            'Quality of service provided',
            'Timeliness and punctuality',
            'Professional communication',
            'Value for money',
            'Overall satisfaction'
          ]
        }
      }
    });

  } catch (error) {
    console.error('Error fetching completed orders without review:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
