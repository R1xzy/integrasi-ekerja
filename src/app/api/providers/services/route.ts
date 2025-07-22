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

    // Get provider services
    const services = await prisma.providerService.findMany({
      where: { providerId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            iconUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return createSuccessResponse(services, `Found ${services.length} services`);

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
    const body = await request.json();

    // Validate required fields
    const { categoryId, serviceTitle, description, price, priceUnit, isAvailable } = body;

    if (!categoryId || !serviceTitle || !description || !price || !priceUnit) {
      return createErrorResponse('Missing required fields', 400);
    }

    // Check if category exists
    const category = await prisma.serviceCategory.findUnique({
      where: { id: parseInt(categoryId) }
    });

    if (!category) {
      return createErrorResponse('Service category not found', 404);
    }

    // Create service
    const service = await prisma.providerService.create({
      data: {
        providerId,
        categoryId: parseInt(categoryId),
        serviceTitle,
        description,
        price: parseFloat(price),
        priceUnit,
        isAvailable: isAvailable !== false
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            iconUrl: true
          }
        }
      }
    });

    return createSuccessResponse(service, 'Service created successfully');

  } catch (error) {
    return handleApiError(error);
  }
}
