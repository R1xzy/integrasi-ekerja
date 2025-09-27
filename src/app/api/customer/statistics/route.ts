// src/app/api/customer/statistics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, requireAuth } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    // Memastikan hanya customer yang login yang bisa mengakses
    const authResult = await requireAuth(request, ['customer']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const customerId = authResult.user.id;

    const [
      activeOrders,
      completedOrders,
      reviewsGiven,
      totalSpending,
      recentOrders
    ] = await prisma.$transaction([
      // 1. Hitung pesanan aktif (semua yang belum selesai atau batal)
      prisma.order.count({
        where: {
          customerId,
          status: { in: ['PENDING_ACCEPTANCE', 'ACCEPTED', 'IN_PROGRESS'] },
        },
      }),
      // 2. Hitung pesanan selesai
      prisma.order.count({
        where: {
          customerId,
          status: 'COMPLETED',
        },
      }),
      // 3. Hitung ulasan yang telah diberikan
      prisma.review.count({
        where: {
          customerId,
        },
      }),
      // 4. Hitung total pengeluaran dari pesanan yang selesai
      prisma.order.aggregate({
        _sum: {
          finalAmount: true,
        },
        where: {
          customerId,
          status: 'COMPLETED',
        },
      }),
      // 5. Ambil 4 pesanan terbaru
      prisma.order.findMany({
        where: {
          customerId,
        },
        take: 4,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          providerService: {
            select: {
              serviceTitle: true,
            },
          },
        },
      }),
    ]);

    return createSuccessResponse({
      activeOrders,
      completedOrders,
      reviewsGiven,
      totalSpending: totalSpending._sum.finalAmount || 0,
      recentOrders,
    }, 'Customer statistics retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
}