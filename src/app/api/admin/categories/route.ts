import { NextRequest, NextResponse } from 'next/server';
import { createAuthMiddleware } from '@/lib/jwt';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    // Get all service categories with statistics
    const categories = await prisma.serviceCategory.findMany({
      include: {
        _count: {
          select: {
            providerServices: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return createSuccessResponse(categories, 'Service categories retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const body = await request.json();
    const { categoryName, description } = body;

    // Validation
    if (!categoryName || categoryName.trim().length === 0) {
      return createErrorResponse('Category name is required', 400);
    }

    if (categoryName.length > 100) {
      return createErrorResponse('Category name too long (max 100 characters)', 400);
    }

    // Check if category already exists
    const existingCategory = await prisma.serviceCategory.findUnique({
      where: { name: categoryName.trim() }
    });

    if (existingCategory) {
      return createErrorResponse('Service category already exists', 409);
    }

    // Create new service category
    const category = await prisma.serviceCategory.create({
      data: {
        name: categoryName.trim(),
        description: description?.trim() || null
      }
    });

    return createSuccessResponse(category, 'Service category created successfully');

  } catch (error) {
    return handleApiError(error);
  }
}
