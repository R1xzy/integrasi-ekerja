import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, requireAuth } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    // Validate Bearer token - admin only
    const authResult = await requireAuth(request, ['admin']);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }
    
    const { user } = authResult;

    // Get dashboard statistics
    const [
      totalUsers,
      totalCustomers,
      totalProviders,
      totalOrders,
      totalServices,
      totalReviews,
      totalPayments,
      totalRevenue,
      pendingVerifications,
      pendingReports,
      recentOrders,
      topProviders,
      topServices
    ] = await Promise.all([
      // User statistics
      prisma.user.count(),
      prisma.user.count({
        where: {
          role: { roleName: 'customer' }
        }
      }),
      prisma.user.count({
        where: {
          role: { roleName: 'provider' }
        }
      }),

      // Order statistics
      prisma.order.count(),
      prisma.providerService.count(),
      prisma.review.count(),

      // Payment statistics
      prisma.payment.count(),
      prisma.payment.aggregate({
        _sum: {
          amount: true
        },
        where: {
          status: 'SUCCESS'
        }
      }),

      // Pending items requiring admin attention
      prisma.user.count({
        where: {
          verificationStatus: 'PENDING'
        }
      }),
      prisma.reviewReport.count({
        where: {
          status: 'PENDING_REVIEW'
        }
      }),

      // Recent orders (last 10)
      prisma.order.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          customer: {
            select: {
              id: true,
              fullName: true
            }
          },
          provider: {
            select: {
              id: true,
              fullName: true
            }
          },
          providerService: {
            include: {
              category: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }),

      // Top providers by order count (last 30 days)
      prisma.user.findMany({
        where: {
          role: { roleName: 'provider' },
          providerOrders: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          }
        },
        include: {
          _count: {
            select: {
              providerOrders: {
                where: {
                  createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                  }
                }
              }
            }
          }
        },
        orderBy: {
          providerOrders: {
            _count: 'desc'
          }
        },
        take: 5
      }),

      // Top services by order count (last 30 days)
      prisma.serviceCategory.findMany({
        include: {
          _count: {
            select: {
              providerServices: {
                where: {
                  orders: {
                    some: {
                      createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                      }
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          providerServices: {
            _count: 'desc'
          }
        },
        take: 5
      })
    ]);

    return createSuccessResponse({
      statistics: {
        users: {
          total: totalUsers,
          customers: totalCustomers,
          providers: totalProviders
        },
        orders: {
          total: totalOrders,
          recent: recentOrders
        },
        services: {
          total: totalServices,
          topCategories: topServices
        },
        reviews: {
          total: totalReviews
        },
        payments: {
          total: totalPayments,
          revenue: totalRevenue._sum.amount || 0
        },
        pending: {
          verifications: pendingVerifications,
          reports: pendingReports
        },
        topProviders
      }
    }, 'Dashboard data retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
}
