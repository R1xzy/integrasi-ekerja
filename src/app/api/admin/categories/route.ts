import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse, requireAuth } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    // Validate Bearer token - admin only
    const authResult = await requireAuth(request, ['admin']);
    if (authResult instanceof Response) return authResult;

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
    const authResult = await requireAuth(request, ['admin']);
    if (authResult instanceof Response) return authResult;

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
