import { NextRequest, NextResponse } from 'next/server';
import { createAuthMiddleware } from '@/lib/jwt';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

interface RouteParams {
  params: { id: string }
}

// REQ-B-7.4: Customer edit review content
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate Bearer token - customer only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['customer']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const customerId = parseInt(authResult.user!.userId);
    const { id } = await params;
    const reviewId = parseInt(id);
    const { rating, comment } = await request.json();

    // Validate rating (must be 1-5)
    if (!rating || rating < 1 || rating > 5) {
      return createErrorResponse('Rating must be between 1 and 5', 400);
    }

    // Check if review exists and belongs to customer
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        order: {
          select: { 
            id: true, 
            status: true,
            customerId: true
          }
        }
      }
    });

    if (!existingReview) {
      return createErrorResponse('Review not found', 404);
    }

    // Verify review belongs to the authenticated customer
    if (existingReview.customerId !== customerId) {
      return createErrorResponse('Unauthorized: You can only edit your own reviews', 403);
    }

    // Check if review editing is allowed (within 7 days of creation)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    if (existingReview.createdAt < sevenDaysAgo) {
      return createErrorResponse('Review can only be edited within 7 days of creation', 400);
    }

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: rating,
        comment: comment || null,
        updatedAt: new Date()
      },
      include: {
        provider: {
          select: { id: true, fullName: true, email: true }
        },
        order: {
          select: { 
            id: true, 
            scheduledDate: true,
            providerService: {
              select: {
                serviceTitle: true,
                category: {
                  select: { name: true }
                }
              }
            }
          }
        }
      }
    }) as any;

    return createSuccessResponse({
      review: {
        id: updatedReview.id,
        rating: updatedReview.rating,
        comment: updatedReview.comment,
        isShow: updatedReview.isShow,
        provider: updatedReview.provider,
        order: updatedReview.order,
        createdAt: updatedReview.createdAt,
        updatedAt: updatedReview.updatedAt
      }
    }, 'Review updated successfully');

  } catch (error) {
    console.error('Customer edit review error:', error);
    return handleApiError(error);
  }
}

// Get review details for customer editing
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate Bearer token - customer only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['customer']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const customerId = parseInt(authResult.user!.userId);
    const { id } = await params;
    const reviewId = parseInt(id);

    // Get review with details
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        provider: {
          select: { id: true, fullName: true, email: true }
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
        }
      }
    }) as any;

    if (!review) {
      return createErrorResponse('Review not found', 404);
    }

    // Verify review belongs to the authenticated customer
    if (review.customerId !== customerId) {
      return createErrorResponse('Unauthorized: You can only view your own reviews', 403);
    }

    // Check if editing is still allowed
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const canEdit = review.createdAt >= sevenDaysAgo;

    return createSuccessResponse({
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        isShow: review.isShow,
        provider: review.provider,
        order: review.order,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        canEdit: canEdit,
        editDeadline: new Date(review.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000)
      }
    }, 'Review details retrieved successfully');

  } catch (error) {
    console.error('Get customer review error:', error);
    return handleApiError(error);
  }
}
