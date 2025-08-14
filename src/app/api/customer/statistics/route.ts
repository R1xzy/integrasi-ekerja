import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// REQ-B-13.2: API endpoint untuk akses Customer tanpa login yang mampu mengembalikan statistik platform
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const categoryId = searchParams.get('categoryId');

    // Build where clause for filtering
    const whereClause: any = {};
    
    if (providerId) {
      whereClause.providerId = parseInt(providerId);
    }
    
    if (categoryId) {
      whereClause.providerService = {
        categoryId: parseInt(categoryId)
      };
    }

    // Get all orders based on filters
    const allOrders = await prisma.order.findMany({
      where: whereClause,
      include: {
        review: true,
        provider: {
          select: {
            id: true,
            fullName: true,
            verificationStatus: true
          }
        },
        providerService: {
          include: {
            category: true
          }
        }
      }
    });

    // Calculate statistics
    const totalOrders = allOrders.length;
    
    const acceptedOrders = allOrders.filter(order => 
      ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(order.status)
    ).length;
    
    const completedOrders = allOrders.filter(order => 
      order.status === 'COMPLETED'
    );
    
    const completedWithReview = completedOrders.filter(order => 
      order.review !== null
    ).length;

    // Calculate average rating
    const reviewsWithRating = allOrders
      .filter(order => order.review !== null)
      .map(order => order.review!.rating);
    
    const averageRating = reviewsWithRating.length > 0 
      ? reviewsWithRating.reduce((sum, rating) => sum + rating, 0) / reviewsWithRating.length
      : 0;

    // Get top providers (if no specific provider filter)
    let topProviders: any[] = [];
    if (!providerId) {
      const providerStats = await prisma.user.findMany({
        where: {
          role: {
            roleName: 'provider'
          },
          verificationStatus: 'VERIFIED'
        },
        include: {
          providerOrders: {
            include: {
              review: true
            }
          },
          providerServices: {
            include: {
              category: true
            }
          }
        },
        take: 10
      });

      topProviders = providerStats
        .map(provider => {
          const orders = provider.providerOrders;
          const completedOrders = orders.filter(order => order.status === 'COMPLETED');
          const reviews = orders.filter(order => order.review !== null);
          const avgRating = reviews.length > 0 
            ? reviews.reduce((sum, order) => sum + order.review!.rating, 0) / reviews.length
            : 0;

          return {
            id: provider.id,
            fullName: provider.fullName,
            totalOrders: orders.length,
            completedOrders: completedOrders.length,
            averageRating: Math.round(avgRating * 100) / 100,
            totalReviews: reviews.length,
            services: provider.providerServices.map(service => ({
              id: service.id,
              title: service.serviceTitle,
              category: service.category.name,
              price: service.price
            }))
          };
        })
        .filter(provider => provider.totalOrders > 0)
        .sort((a, b) => b.averageRating - a.averageRating);
    }

    // Get service categories statistics
    const categoryStats = await prisma.serviceCategory.findMany({
      include: {
        providerServices: {
          include: {
            orders: {
              include: {
                review: true
              }
            }
          }
        }
      }
    });

    const categoriesWithStats = categoryStats.map(category => {
      const allCategoryOrders = category.providerServices.flatMap(service => service.orders);
      const categoryReviews = allCategoryOrders.filter(order => order.review !== null);
      const categoryAvgRating = categoryReviews.length > 0
        ? categoryReviews.reduce((sum, order) => sum + order.review!.rating, 0) / categoryReviews.length
        : 0;

      return {
        id: category.id,
        name: category.name,
        description: category.description,
        iconUrl: category.iconUrl,
        totalOrders: allCategoryOrders.length,
        completedOrders: allCategoryOrders.filter(order => order.status === 'COMPLETED').length,
        averageRating: Math.round(categoryAvgRating * 100) / 100,
        totalReviews: categoryReviews.length,
        totalProviders: category.providerServices.length
      };
    }).sort((a, b) => b.totalOrders - a.totalOrders);

    // Get recent reviews (latest 10)
    const recentReviews = await prisma.review.findMany({
      where: {
        isShow: true,
        ...(providerId && { providerId: parseInt(providerId) })
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
        order: {
          include: {
            providerService: {
              include: {
                category: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      success: true,
      data: {
        filters: {
          providerId: providerId ? parseInt(providerId) : null,
          categoryId: categoryId ? parseInt(categoryId) : null
        },
        platformStatistics: {
          totalOrders,
          acceptedOrders,
          completedOrders: completedOrders.length,
          completedWithReview,
          averageRating: Math.round(averageRating * 100) / 100,
          totalReviews: reviewsWithRating.length,
          totalProviders: topProviders.length || await prisma.user.count({
            where: {
              role: { roleName: 'provider' },
              verificationStatus: 'VERIFIED'
            }
          })
        },
        topProviders: topProviders.slice(0, 5), // Show top 5 providers
        serviceCategories: categoriesWithStats,
        recentReviews: recentReviews.map(review => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          customer: {
            fullName: review.customer.fullName
          },
          provider: {
            fullName: review.provider.fullName
          },
          service: {
            title: review.order.providerService.serviceTitle,
            category: review.order.providerService.category.name
          }
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching customer statistics:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
