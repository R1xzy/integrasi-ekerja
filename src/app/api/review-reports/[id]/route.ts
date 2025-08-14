import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createAuthMiddleware } from '@/lib/jwt';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const reportId = parseInt(params.id);
    const adminId = parseInt(authResult.user!.userId);

    if (isNaN(reportId)) {
      return createErrorResponse('Invalid report ID', 400);
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON body', 400);
    }

    const { status, adminNotes } = body;

    // Validate required fields
    if (!status) {
      return createErrorResponse('Missing required field: status', 400);
    }

    // Validate status values
    const validStatuses = ['RESOLVED_REVIEW_KEPT', 'RESOLVED_REVIEW_REMOVED'];
    if (!validStatuses.includes(status)) {
      return createErrorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // Check if review report exists
    const reviewReport = await prisma.reviewReport.findUnique({
      where: { id: reportId },
      include: {
        review: true
      }
    });

    if (!reviewReport) {
      return createErrorResponse('Review report not found', 404);
    }

    // Check if report is already resolved
    if (reviewReport.status !== 'PENDING_REVIEW') {
      return createErrorResponse('Review report has already been resolved', 400);
    }

    // Start transaction to update both report and review
    const result = await prisma.$transaction(async (tx) => {
      // Update review report
      const updatedReport = await tx.reviewReport.update({
        where: { id: reportId },
        data: {
          status,
          adminNotes: adminNotes?.trim() || null,
          resolvedByAdminId: adminId,
          resolvedAt: new Date()
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
          },
          resolvedByAdmin: {
            select: {
              id: true,
              fullName: true
            }
          }
        }
      });

      // Update review based on admin decision
      if (status === 'RESOLVED_REVIEW_REMOVED') {
        // Hide the review
        await tx.review.update({
          where: { id: reviewReport.reviewId },
          data: { isShow: false }
        });
      } else if (status === 'RESOLVED_REVIEW_KEPT') {
        // Keep the review visible and reset reported status
        await tx.review.update({
          where: { id: reviewReport.reviewId },
          data: { 
            isShow: true,
            isReported: false // Reset reported status since it's been reviewed and kept
          }
        });
      }

      return updatedReport;
    });

    return createSuccessResponse(result, 'Review report resolved successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const reportId = parseInt(params.id);

    if (isNaN(reportId)) {
      return createErrorResponse('Invalid report ID', 400);
    }

    // Get review report details
    const reviewReport = await prisma.reviewReport.findUnique({
      where: { id: reportId },
      include: {
        review: {
          include: {
            customer: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            },
            provider: {
              select: {
                id: true,
                fullName: true,
                email: true
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
        },
        reportedByUser: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        resolvedByAdmin: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    if (!reviewReport) {
      return createErrorResponse('Review report not found', 404);
    }

    return createSuccessResponse(reviewReport, 'Review report retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
}
