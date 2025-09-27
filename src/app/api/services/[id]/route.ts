// src/app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, requireAuth } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['admin']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyRevenueRaw = await prisma.payment.groupBy({
      by: ['createdAt'],
      where: {
        status: 'SUCCESS',
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    
    const dailyRevenueMap = new Map<string, number>();
    dailyRevenueRaw.forEach(item => {
        const date = item.createdAt.toISOString().split('T')[0];
        const currentRevenue = dailyRevenueMap.get(date) || 0;
        dailyRevenueMap.set(date, currentRevenue + (item._sum.amount || 0));
    });

    const dailyRevenueChartData = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
        
        dailyRevenueChartData.push({
            name: dayName,
            Pendapatan: dailyRevenueMap.get(dateString) || 0,
        });
    }

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
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { role: { roleName: 'customer' } } }),
      prisma.user.count({ where: { role: { roleName: 'provider' } } }),
      prisma.order.count(),
      prisma.providerService.count(),
      prisma.review.count(),
      prisma.payment.count(),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'SUCCESS' } }),
      prisma.user.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.reviewReport.count({ where: { status: 'PENDING_REVIEW' } }),
      
      // --- PERBAIKAN PADA QUERY INI ---
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          // Menggunakan 'select' untuk mengambil kolom spesifik dari customer
          customer: {
            select: {
              fullName: true,
              profilePictureUrl: true, // Mengambil langsung dari kolom yang benar
            },
          },
          providerService: {
            select: {
              serviceTitle: true,
            },
          },
        },
      }),
    ]);

    return createSuccessResponse({
      statistics: {
        users: { total: totalUsers, customers: totalCustomers, providers: totalProviders },
        orders: { total: totalOrders, recent: recentOrders },
        services: { total: totalServices },
        reviews: { total: totalReviews },
        payments: { total: totalPayments, revenue: totalRevenue._sum.amount || 0 },
        pending: { verifications: pendingVerifications, reports: pendingReports },
        dailyRevenue: dailyRevenueChartData,
      },
    }, 'Dashboard data retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
}