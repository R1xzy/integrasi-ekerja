import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createAuthMiddleware } from '@/lib/jwt';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    // Validate Bearer token - any authenticated user except admin (admin can't report reviews)
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['customer', 'provider']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const reportedByUserId = parseInt(authResult.user!.userId);

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON body', 400);
    }

    const { reviewId, reason } = body;

    // Validate required fields
    if (!reviewId || !reason) {
      return createErrorResponse('Missing required fields: reviewId, reason', 400);
    }

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: parseInt(reviewId) },
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
        }
      }
    });

    if (!review) {
      return createErrorResponse('Review not found', 404);
    }

    // Check if user can report this review (can't report own reviews)
    if (review.customerId === reportedByUserId || review.providerId === reportedByUserId) {
      return createErrorResponse('You cannot report your own reviews', 400);
    }

    // Check if review is already reported by this user
    const existingReport = await prisma.reviewReport.findFirst({
      where: {
        reviewId: parseInt(reviewId),
        reportedByUserId
      }
    });

    if (existingReport) {
      return createErrorResponse('You have already reported this review', 400);
    }

    // Create review report
    const reviewReport = await prisma.reviewReport.create({
      data: {
        reviewId: parseInt(reviewId),
        reportedByUserId,
        reason: reason.trim(),
        status: 'PENDING_REVIEW'
      },
      include: {
        review: {
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
            }
          }
        },
        reportedByUser: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    // Mark the review as reported
    await prisma.review.update({
      where: { id: parseInt(reviewId) },
      data: { isReported: true }
    });

    return createSuccessResponse(reviewReport, 'Review report submitted successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    // Parse query parameters
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '10')));
    const skip = (page - 1) * limit;
    const status = url.searchParams.get('status');

    // Build where clause
    let where: any = {};
    
    if (status) {
      where.status = status;
    }

    // Get review reports
    const reviewReports = await prisma.reviewReport.findMany({
      where,
      include: {
        review: {
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
                providerService: {
                  select: {
                    serviceTitle: true
                  }
                }
              }
            }
          }
        },
        reportedByUser: {
          select: {
            id: true,
            fullName: true
          }
        },
        resolvedByAdmin: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    // Get total count for pagination
    const total = await prisma.reviewReport.count({ where });

    const response = {
      success: true,
      data: reviewReports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      message: `Found ${reviewReports.length} review reports`
    };

    return NextResponse.json(response);

  } catch (error) {
    return handleApiError(error);
  }
}
