import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createAuthMiddleware } from '@/lib/jwt';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

// PUT /api/admin/reviews/[id]/visibility - Update review visibility
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const adminId = parseInt(authResult.user!.userId);
    const reviewId = parseInt(params.id);

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON body', 400);
    }

    const { is_show } = body;

    // Validate required fields
    if (typeof is_show !== 'boolean') {
      return createErrorResponse('Missing required field: is_show (boolean)', 400);
    }

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
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

    // Update review visibility
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        isShow: is_show,
        moderatedAt: new Date(),
        moderatedBy: adminId
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
            providerService: {
              select: {
                serviceTitle: true
              }
            }
          }
        }
      }
    });

    const action = is_show ? 'shown' : 'hidden';
    
    return createSuccessResponse(
      updatedReview, 
      `Review has been ${action} successfully`
    );

  } catch (error) {
    return handleApiError(error);
  }
}