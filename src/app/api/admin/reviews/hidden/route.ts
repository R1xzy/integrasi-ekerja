import { NextRequest, NextResponse } from 'next/server';
import { createAuthMiddleware } from '@/lib/jwt';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

// REQ-B-7.5: Admin retrieve hidden reviews
export async function GET(request: NextRequest) {
  try {
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const providerId = searchParams.get('providerId');
    const customerId = searchParams.get('customerId');
    const reportedOnly = searchParams.get('reportedOnly') === 'true';

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return createErrorResponse('Invalid pagination parameters', 400);
    }

    const skip = (page - 1) * limit;

    // Build where clause for hidden reviews
    const whereClause: any = {
      isShow: false // Only hidden reviews
    };

    if (providerId) {
      whereClause.providerId = parseInt(providerId);
    }

    if (customerId) {
      whereClause.customerId = parseInt(customerId);
    }

    if (reportedOnly) {
      whereClause.isReported = true;
    }

    // Get hidden reviews with pagination
    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where: whereClause,
        include: {
          customer: {
            select: { 
              id: true, 
              fullName: true, 
              email: true,
              phoneNumber: true 
            }
          },
          provider: {
            select: { 
              id: true, 
              fullName: true, 
              email: true,
              phoneNumber: true 
            }
          },
          order: {
            select: { 
              id: true, 
              scheduledDate: true,
              jobAddress: true,
              status: true,
              providerService: {
                select: {
                  serviceTitle: true,
                  category: {
                    select: { name: true }
                  }
                }
              }
            }
          },
          moderator: {
            select: { 
              id: true, 
              fullName: true, 
              email: true 
            }
          },
          reviewReports: {
            select: {
              id: true,
              reason: true,
              status: true,
              createdAt: true,
              reportedByUser: {
                select: {
                  id: true,
                  fullName: true,
                  email: true
                }
              }
            }
          }
        } as any,
        orderBy: {
          updatedAt: 'desc'
        },
        skip: skip,
        take: limit
      }) as any,
      prisma.review.count({
        where: whereClause
      })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return createSuccessResponse({
      reviews: reviews.map((review: any) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        isShow: review.isShow,
        isReported: review.isReported,
        adminNotes: review.adminNotes,
        moderatedAt: review.moderatedAt,
        moderatedBy: review.moderatedBy,
        customer: review.customer,
        provider: review.provider,
        order: review.order,
        moderator: review.moderator,
        reviewReports: review.reviewReports,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt
      })),
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount,
        limit: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      filters: {
        providerId: providerId ? parseInt(providerId) : null,
        customerId: customerId ? parseInt(customerId) : null,
        reportedOnly: reportedOnly
      }
    }, `Found ${totalCount} hidden reviews`);

  } catch (error) {
    console.error('Get hidden reviews error:', error);
    return handleApiError(error);
  }
}
