import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createAuthMiddleware } from '@/lib/jwt';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

// DELETE /api/admin/reviews/[id] - Delete review permanently
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const resolvedParams = await params;
    const reviewId = parseInt(resolvedParams.id);

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

    // Delete related review reports first (if any)
    await prisma.reviewReport.deleteMany({
      where: { reviewId: reviewId }
    });

    // Delete the review
    await prisma.review.delete({
      where: { id: reviewId }
    });
    
    return createSuccessResponse(
      { id: reviewId }, 
      'Review has been permanently deleted'
    );

  } catch (error) {
    return handleApiError(error);
  }
}