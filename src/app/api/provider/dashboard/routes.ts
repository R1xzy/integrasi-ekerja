import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, requireAuth } from '@/lib/api-helpers';
import { subMonths } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['provider']);
    if (authResult instanceof Response) return authResult;

    const providerId = parseInt(authResult.user.userId as string);

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = subMonths(startOfThisMonth, 1);

    const [
      providerData,
      thisMonthOrders,
      lastMonthOrders,
      allTimeStats,
      activeOrdersCount,
      ratingAgg,
      recentOrders,
      myTopServices
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: providerId },
        select: { fullName: true }
      }),
      prisma.order.findMany({
        where: { providerId: providerId, createdAt: { gte: startOfThisMonth } },
      }),
      prisma.order.findMany({
        where: { providerId: providerId, createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } },
      }),
      prisma.order.aggregate({
        _count: { id: true },
        where: { providerId: providerId, NOT: { status: 'CANCELLED_BY_CUSTOMER' } },
      }),
      prisma.order.count({
        where: { providerId: providerId, status: { in: ['ACCEPTED', 'IN_PROGRESS'] } },
      }),
      prisma.review.aggregate({
        _avg: { rating: true },
        where: { providerId: providerId, isShow: true },
      }),
      prisma.order.findMany({
        where: { providerId: providerId },
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { fullName: true } },
          providerService: { select: { serviceTitle: true } },
        },
      }),
      prisma.providerService.findMany({
        where: { providerId: providerId },
        take: 3,
        orderBy: { orders: { _count: 'desc' } },
        include: {
          _count: { select: { orders: true } },
        },
      })
    ]);

    const thisMonthRevenue = thisMonthOrders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + (o.finalAmount || 0), 0);
    
    const responseData = {
        providerName: providerData?.fullName || '',
        statistics: {
            totalOrders: { value: allTimeStats._count.id },
            activeOrders: { value: activeOrdersCount },
            averageRating: { value: ratingAgg._avg.rating?.toFixed(1) || 'N/A' },
            monthlyRevenue: {
                value: thisMonthRevenue,
            }
        },
        recentOrders: recentOrders,
        myServices: myTopServices
    };
    return createSuccessResponse(responseData, 'Dashboard data for provider retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
}