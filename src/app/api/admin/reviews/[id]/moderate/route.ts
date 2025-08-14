import { NextRequest, NextResponse } from 'next/server';
import { createAuthMiddleware } from '@/lib/jwt';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

interface RouteParams {
  params: { id: string }
}

// REQ-B-7.3: Admin toggle review visibility status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const { isShow, adminNotes } = await request.json();

    // Validate isShow parameter
    if (typeof isShow !== 'boolean') {
      return createErrorResponse('isShow must be a boolean value', 400);
    }

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        customer: {
          select: { id: true, fullName: true, email: true }
        },
        provider: {
          select: { id: true, fullName: true, email: true }
        },
        order: {
          select: { id: true, scheduledDate: true }
        }
      }
    });

    if (!review) {
      return createErrorResponse('Review not found', 404);
    }

    // Update review visibility status
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        isShow: isShow,
        adminNotes: adminNotes || null,
        moderatedAt: new Date(),
        moderatedBy: adminId,
        updatedAt: new Date()
      } as any,
      include: {
        customer: {
          select: { id: true, fullName: true, email: true }
        },
        provider: {
          select: { id: true, fullName: true, email: true }
        },
        order: {
          select: { id: true, scheduledDate: true }
        }
      }
    }) as any;

    // Log the moderation action
    console.log(`Admin ${adminId} ${isShow ? 'approved' : 'hidden'} review ${reviewId}`);

    return createSuccessResponse({
      review: {
        id: updatedReview.id,
        rating: updatedReview.rating,
        comment: updatedReview.comment,
        isShow: updatedReview.isShow,
        adminNotes: updatedReview.adminNotes,
        moderatedAt: updatedReview.moderatedAt,
        moderatedBy: updatedReview.moderatedBy,
        customer: updatedReview.customer,
        provider: updatedReview.provider,
        order: updatedReview.order,
        createdAt: updatedReview.createdAt,
        updatedAt: updatedReview.updatedAt
      }
    }, `Review ${isShow ? 'approved and made visible' : 'hidden from public view'}`);

  } catch (error) {
    console.error('Admin review moderation error:', error);
    return handleApiError(error);
  }
}

// Get review details for admin
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const reviewId = parseInt(params.id);

    // Get review with all details
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        customer: {
          select: { id: true, fullName: true, email: true, phoneNumber: true }
        },
        provider: {
          select: { id: true, fullName: true, email: true, phoneNumber: true }
        },
        order: {
          select: { 
            id: true, 
            scheduledDate: true,
            jobAddress: true,
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

    return createSuccessResponse({
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        isShow: review.isShow,
        adminNotes: review.adminNotes,
        moderatedAt: review.moderatedAt,
        moderatedBy: review.moderatedBy,
        customer: review.customer,
        provider: review.provider,
        order: review.order,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt
      }
    }, 'Review details retrieved successfully');

  } catch (error) {
    console.error('Get review details error:', error);
    return handleApiError(error);
  }
}
