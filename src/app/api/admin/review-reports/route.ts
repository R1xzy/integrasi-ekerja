import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createAuthMiddleware } from '@/lib/jwt';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

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
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
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
            order: {
              include: {
                provider: {
                  select: {
                    id: true,
                    fullName: true
                  }
                },
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
            role: {
              select: {
                id: true,
                roleName: true
              }
            }
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

    // Format the response to match frontend interface
    const formattedReports = reviewReports.map(report => ({
      id: report.id,
      reviewId: report.reviewId,
      reportReason: report.reason,
      reportDescription: report.reason, // Use reason field as description
      reportedAt: report.createdAt.toISOString(),
      status: report.status,
      review: {
        id: report.review.id,
        rating: report.review.rating,
        comment: report.review.comment,
        isShow: report.review.isShow,
        createdAt: report.review.createdAt.toISOString(),
        customer: {
          id: report.review.customer.id,
          fullName: report.review.customer.fullName
        },
        order: {
          id: report.review.order.id,
          provider: {
            id: report.review.order.provider.id,
            fullName: report.review.order.provider.fullName
          }
        }
      },
      reporter: report.reportedByUser ? {
        id: report.reportedByUser.id,
        fullName: report.reportedByUser.fullName
      } : null
    }));

    const response = {
      success: true,
      data: formattedReports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      message: `Found ${formattedReports.length} review reports`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching review reports:', error);
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const adminId = parseInt(authResult.user!.userId);

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON body', 400);
    }

    const { reportId, action, adminNotes } = body;

    // Validate required fields
    if (!reportId || !action) {
      return createErrorResponse('Missing required fields: reportId, action', 400);
    }

    if (!['approve', 'dismiss'].includes(action)) {
      return createErrorResponse('Invalid action. Must be "approve" or "dismiss"', 400);
    }

    // Get the report
    const report = await prisma.reviewReport.findUnique({
      where: { id: parseInt(reportId) },
      include: {
        review: true
      }
    });

    if (!report) {
      return createErrorResponse('Review report not found', 404);
    }

    // Update report status
    const updatedReport = await prisma.reviewReport.update({
      where: { id: parseInt(reportId) },
      data: {
        status: action === 'approve' ? 'RESOLVED_REVIEW_REMOVED' : 'RESOLVED_REVIEW_KEPT',
        resolvedByAdminId: adminId,
        adminNotes: adminNotes || null,
        resolvedAt: new Date()
      }
    });

    // If approved, hide the review
    if (action === 'approve') {
      await prisma.review.update({
        where: { id: report.reviewId },
        data: { 
          isShow: false,
          isReported: true 
        }
      });
    }

    return createSuccessResponse(updatedReport, `Review report ${action}d successfully`);

  } catch (error) {
    console.error('Error updating review report:', error);
    return handleApiError(error);
  }
}