import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createAuthMiddleware } from '@/lib/jwt';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviewId = parseInt(params.id);
    
    if (isNaN(reviewId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid review ID' },
        { status: 400 }
      );
    }

    // Validate Bearer token - customer only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['customer']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const customerId = parseInt(authResult.user!.userId);

    const body = await request.json();
    const { rating, comment } = body;

    // Validate input
    if (!rating && !comment) {
      return NextResponse.json(
        { success: false, error: 'At least rating or comment must be provided' },
        { status: 400 }
      );
    }

    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if review exists and belongs to the customer
    const existingReview = await prisma.review.findFirst({
      where: {
        id: reviewId,
        customerId: customerId
      },
      include: {
        order: {
          select: {
            status: true
          }
        }
      }
    });

    if (!existingReview) {
      return NextResponse.json(
        { success: false, error: 'Review not found or access denied' },
        { status: 404 }
      );
    }

    // Check if order is still completed (business rule)
    if (existingReview.order.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Cannot update review. Order is not completed.' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (rating) updateData.rating = rating;
    if (comment) updateData.comment = comment;

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: updateData,
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

    return createSuccessResponse(updatedReview, 'Review updated successfully');

  } catch (error) {
    console.error('Error updating review:', error);
    return handleApiError(error);
  }
}
