import { NextRequest, NextResponse } from 'next/server';
import { createAuthMiddleware } from '@/lib/jwt';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['customer']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const customerId = parseInt(authResult.user!.userId);
    const reviewId = parseInt(resolvedParams.id);
    const body = await request.json();
    const { rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return createErrorResponse('Rating must be between 1 and 5', 400);
    }

    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { order: true }
    });

    if (!existingReview) {
      return createErrorResponse('Review not found', 404);
    }

    if (existingReview.customerId !== customerId) {
      return createErrorResponse('Unauthorized to edit this review', 403);
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: rating,
        comment: comment || null
      },
      include: {
        customer: {
          select: { fullName: true, profilePictureUrl: true }
        },
        provider: {
          select: { fullName: true }
        },
        order: {
          select: { id: true }
        }
      }
    });

    return createSuccessResponse(updatedReview, 'Review updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['customer']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const customerId = parseInt(authResult.user!.userId);
    const reviewId = parseInt(resolvedParams.id);

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        customer: {
          select: { fullName: true, profilePictureUrl: true }
        },
        provider: {
          select: { fullName: true }
        },
        order: {
          select: { id: true }
        }
      }
    });

    if (!review) {
      return createErrorResponse('Review not found', 404);
    }

    if (review.customerId !== customerId) {
      return createErrorResponse('Unauthorized to view this review', 403);
    }

    return createSuccessResponse(review, 'Review retrieved successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
