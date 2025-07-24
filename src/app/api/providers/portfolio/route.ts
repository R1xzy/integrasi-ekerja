import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createAuthMiddleware } from '@/lib/jwt';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    // Validate Bearer token - provider only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['provider']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const providerId = parseInt(authResult.user!.userId);

    // Get provider portfolio
    const portfolio = await prisma.providerPortfolio.findMany({
      where: { providerId },
      orderBy: { completedAt: 'desc' }
    });

    return createSuccessResponse(portfolio, `Found ${portfolio.length} portfolio items`);

  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate Bearer token - provider only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['provider']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const providerId = parseInt(authResult.user!.userId);

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

    // Parse completedAt date if provided
    let completedDate: Date | null = null;
    if (completedAt) {
      try {
        completedDate = new Date(completedAt);
        if (isNaN(completedDate.getTime())) {
          return createErrorResponse('Invalid date format for completedAt', 400);
        }
      } catch (error) {
        return createErrorResponse('Invalid date format for completedAt', 400);
      }
    }

    // Create new portfolio item
    const portfolioItem = await prisma.providerPortfolio.create({
      data: {
        providerId,
        projectTitle: projectTitle.trim(),
        description: description?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        completedAt: completedDate,
      }
    });

    return createSuccessResponse(portfolioItem, 'Portfolio item created successfully');

  } catch (error) {
    return handleApiError(error);
  }
}
