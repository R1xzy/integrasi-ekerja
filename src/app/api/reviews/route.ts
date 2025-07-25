import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createAuthMiddleware } from '@/lib/jwt';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    // Validate Bearer token - customer only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['customer']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const customerId = parseInt(authResult.user!.userId);

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON body', 400);
    }

    const { orderId, rating, comment } = body;

    // Validate required fields
    if (!orderId || !rating) {
      return createErrorResponse('Missing required fields: orderId, rating', 400);
    }

    // Validate rating range [C-9]: Rating must be between 1-5
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return createErrorResponse('Rating must be an integer between 1 and 5', 400);
    }

    // Check if order exists and belongs to the customer
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
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
        review: true // Check if review already exists
      }
    });

    if (!order) {
      return createErrorResponse('Order not found', 404);
    }

    // Validate that the order belongs to the customer
    if (order.customerId !== customerId) {
      return createErrorResponse('Access denied. You can only review your own orders', 403);
    }

    // Check if review already exists for this order
    if (order.review) {
      return createErrorResponse('Review already exists for this order', 400);
    }

    // Validate that order is completed [C-9]: Can only review completed orders
    if (order.status !== 'COMPLETED') {
      return createErrorResponse('Can only review completed orders', 400);
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        orderId: parseInt(orderId),
        customerId,
        providerId: order.providerId,
        rating: parseInt(rating.toString()),
        comment: comment?.trim() || null,
        isShow: true,
        isReported: false
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
          select: {
            id: true,
            scheduledDate: true,
            providerService: {
              select: {
                id: true,
                serviceTitle: true
              }
            }
          }
        }
      }
    });

    return createSuccessResponse(review, 'Review created successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate Bearer token - any authenticated user
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['customer', 'provider', 'admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const userId = parseInt(authResult.user!.userId);
    const userRole = authResult.user!.roleName;

    // Parse query parameters
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '10')));
    const skip = (page - 1) * limit;
    const providerId = url.searchParams.get('providerId');
    const customerId = url.searchParams.get('customerId');
    const minRating = url.searchParams.get('minRating');
    const maxRating = url.searchParams.get('maxRating');
    const isShow = url.searchParams.get('isShow');

    // Build where clause
    let where: any = {};

    // For customers, show their own reviews
    if (userRole === 'customer') {
      where.customerId = userId;
    }
    // For providers, show reviews about them
    else if (userRole === 'provider') {
      where.providerId = userId;
      where.isShow = true; // Providers only see visible reviews
    }
    // Admin can see all reviews with filters

    // Apply filters
    if (providerId && userRole === 'admin') {
      where.providerId = parseInt(providerId);
    }
    
    if (customerId && userRole === 'admin') {
      where.customerId = parseInt(customerId);
    }

    if (minRating || maxRating) {
      where.rating = {};
      if (minRating) where.rating.gte = parseInt(minRating);
      if (maxRating) where.rating.lte = parseInt(maxRating);
    }

    if (isShow !== null && userRole === 'admin') {
      where.isShow = isShow === 'true';
    }

    // Get reviews
    const reviews = await prisma.review.findMany({
      where,
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
          select: {
            id: true,
            scheduledDate: true,
            providerService: {
              select: {
                id: true,
                serviceTitle: true
              }
            }
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    // Get total count for pagination
    const total = await prisma.review.count({ where });

    const response = {
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      message: `Found ${reviews.length} reviews`
    };

    return NextResponse.json(response);

  } catch (error) {
    return handleApiError(error);
  }
}
