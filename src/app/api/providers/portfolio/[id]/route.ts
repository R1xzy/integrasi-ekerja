import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createAuthMiddleware } from '@/lib/jwt';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Validate Bearer token - provider or customer can view portfolio
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['provider', 'customer']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const portfolioId = parseInt(params.id);

    if (isNaN(portfolioId)) {
      return createErrorResponse('Invalid portfolio ID', 400);
    }

    // Get portfolio item details
    const portfolioItem = await prisma.providerPortfolio.findUnique({
      where: { id: portfolioId },
      include: {
        provider: {
          select: {
            id: true,
            fullName: true,
            profilePictureUrl: true,
            verificationStatus: true
          }
        }
      }
    });

    if (!portfolioItem) {
      return createErrorResponse('Portfolio item not found', 404);
    }

    // If it's a provider, they can only view their own portfolio
    if (authResult.user!.roleName === 'provider') {
      const providerId = parseInt(authResult.user!.userId);
      if (portfolioItem.providerId !== providerId) {
        return createErrorResponse('Access denied. You can only view your own portfolio items', 403);
      }
    }

    return createSuccessResponse(portfolioItem, 'Portfolio item retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Validate Bearer token - provider only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['provider']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const portfolioId = parseInt(params.id);
    const providerId = parseInt(authResult.user!.userId);

    if (isNaN(portfolioId)) {
      return createErrorResponse('Invalid portfolio ID', 400);
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON body', 400);
    }

    const { projectTitle, description, imageUrl, completedAt } = body;

    // Validate required fields
    if (!projectTitle) {
      return createErrorResponse('Missing required field: projectTitle', 400);
    }

    // Check if portfolio item exists and belongs to this provider
    const existingPortfolio = await prisma.providerPortfolio.findUnique({
      where: { id: portfolioId },
    });

    if (!existingPortfolio) {
      return createErrorResponse('Portfolio item not found', 404);
    }

    if (existingPortfolio.providerId !== providerId) {
      return createErrorResponse('Access denied. You can only update your own portfolio items', 403);
    }

    // Parse completedAt date if provided
    let completedDate: Date | null = existingPortfolio.completedAt;
    if (completedAt !== undefined) {
      if (completedAt === null) {
        completedDate = null;
      } else {
        try {
          completedDate = new Date(completedAt);
          if (isNaN(completedDate.getTime())) {
            return createErrorResponse('Invalid date format for completedAt', 400);
          }
        } catch (error) {
          return createErrorResponse('Invalid date format for completedAt', 400);
        }
      }
    }

    // Update the portfolio item
    const updatedPortfolio = await prisma.providerPortfolio.update({
      where: { id: portfolioId },
      data: {
        projectTitle: projectTitle.trim(),
        description: description?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        completedAt: completedDate,
        updatedAt: new Date()
      }
    });

    return createSuccessResponse(updatedPortfolio, 'Portfolio item updated successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Validate Bearer token - provider only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['provider']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const portfolioId = parseInt(params.id);
    const providerId = parseInt(authResult.user!.userId);

    if (isNaN(portfolioId)) {
      return createErrorResponse('Invalid portfolio ID', 400);
    }

    // Check if portfolio item exists and belongs to this provider
    const existingPortfolio = await prisma.providerPortfolio.findUnique({
      where: { id: portfolioId },
    });

    if (!existingPortfolio) {
      return createErrorResponse('Portfolio item not found', 404);
    }

    if (existingPortfolio.providerId !== providerId) {
      return createErrorResponse('Access denied. You can only delete your own portfolio items', 403);
    }

    // Delete the portfolio item
    await prisma.providerPortfolio.delete({
      where: { id: portfolioId }
    });

    return createSuccessResponse(null, 'Portfolio item deleted successfully');

  } catch (error) {
    return handleApiError(error);
  }
}
