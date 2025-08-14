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

    const providerId = parseInt(params.id);

    if (isNaN(providerId)) {
      return createErrorResponse('Invalid provider ID', 400);
    }

    // Check if provider exists
    const provider = await prisma.user.findUnique({
      where: { id: providerId, roleId: 2 }, // roleId 2 = provider
      select: {
        id: true,
        fullName: true,
        profilePictureUrl: true,
        verificationStatus: true
      }
    });

    if (!provider) {
      return createErrorResponse('Provider not found', 404);
    }

    // Get provider portfolio
    const portfolio = await prisma.providerPortfolio.findMany({
      where: { providerId },
      orderBy: { completedAt: 'desc' }
    });

    const responseData = {
      provider,
      portfolio,
      totalItems: portfolio.length
    };

    return createSuccessResponse(responseData, `Found ${portfolio.length} portfolio items for provider`);

  } catch (error) {
    return handleApiError(error);
  }
}
