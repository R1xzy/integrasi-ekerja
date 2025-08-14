import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// REQ-B-13.1: API endpoint untuk akses Provider yang mampu mengembalikan statistik pesanan dan rating
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

    // Check if user is provider
    const provider = await prisma.user.findUnique({
      where: { id: parseInt(decoded.userId) },
      include: { role: true }
    });

    if (!provider || provider.role.roleName !== 'provider') {
      return NextResponse.json({ error: 'Provider access required' }, { status: 403 });
    }

    // Get all orders for this provider
    const allOrders = await prisma.order.findMany({
      where: { providerId: provider.id },
      include: {
        review: true
      }
    });

    // Calculate statistics
    const totalOrders = allOrders.length;
    
    const acceptedOrders = allOrders.filter(order => 
      ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(order.status)
    ).length;
    
    const rejectedOrders = allOrders.filter(order => 
      order.status === 'REJECTED_BY_PROVIDER'
    ).length;
    
    const completedOrders = allOrders.filter(order => 
      order.status === 'COMPLETED'
    );
    
    const completedWithReview = completedOrders.filter(order => 
      order.review !== null
    ).length;
    
    const completedWithoutReview = completedOrders.filter(order => 
      order.review === null
    ).length;

    // Calculate average rating
    const reviewsWithRating = allOrders
      .filter(order => order.review !== null)
      .map(order => order.review!.rating);
    
    const averageRating = reviewsWithRating.length > 0 
      ? reviewsWithRating.reduce((sum, rating) => sum + rating, 0) / reviewsWithRating.length
      : 0;

    // Get monthly statistics for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyStats = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        providerId: provider.id,
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      _count: {
        id: true
      }
    });

    // Group by month
    const monthlyGrouped: { [key: string]: number } = {};
    
    allOrders.forEach(order => {
      if (order.createdAt >= sixMonthsAgo) {
        const monthKey = order.createdAt.toISOString().substring(0, 7); // YYYY-MM
        monthlyGrouped[monthKey] = (monthlyGrouped[monthKey] || 0) + 1;
      }
    });

    // Get recent orders (last 10)
    const recentOrders = await prisma.order.findMany({
      where: { providerId: provider.id },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        providerService: {
          include: {
            category: true
          }
        },
        review: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      success: true,
      data: {
        provider: {
          id: provider.id,
          fullName: provider.fullName,
          email: provider.email,
          verificationStatus: provider.verificationStatus
        },
        statistics: {
          totalOrders,
          acceptedOrders,
          rejectedOrders,
          completedOrders: completedOrders.length,
          completedWithReview,
          completedWithoutReview,
          averageRating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
          totalReviews: reviewsWithRating.length
        },
        monthlyStats: Object.entries(monthlyGrouped).map(([month, count]) => ({
          month,
          orderCount: count
        })).sort((a, b) => a.month.localeCompare(b.month)),
        recentOrders: recentOrders.map(order => ({
          id: order.id,
          customer: order.customer,
          serviceCategory: order.providerService.category.name,
          serviceTitle: order.providerService.serviceTitle,
          status: order.status,
          finalAmount: order.finalAmount,
          scheduledDate: order.scheduledDate,
          createdAt: order.createdAt,
          hasReview: order.review !== null,
          rating: order.review?.rating || null
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching provider statistics:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
