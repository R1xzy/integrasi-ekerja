import { NextRequest, NextResponse } from 'next/server';
import { createAuthMiddleware } from '@/lib/jwt';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const categoryId = parseInt(params.id);

    // Get service category with statistics
    const category = await prisma.serviceCategory.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            providerServices: true
          }
        },
        providerServices: {
          include: {
            provider: {
              select: {
                id: true,
                fullName: true
              }
            },
            _count: {
              select: {
                orders: true
              }
            }
          }
        }
      }
    });

    if (!category) {
      return createErrorResponse('Service category not found', 404);
    }

    return createSuccessResponse(category, 'Service category retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const categoryId = parseInt(params.id);
    const body = await request.json();
    const { name, description, iconUrl } = body;

    // Validation
    if (!name || name.trim().length === 0) {
      return createErrorResponse('Category name is required', 400);
    }

    if (name.length > 100) {
      return createErrorResponse('Category name too long (max 100 characters)', 400);
    }

    // Check if category exists
    const existingCategory = await prisma.serviceCategory.findUnique({
      where: { id: categoryId }
    });

    if (!existingCategory) {
      return createErrorResponse('Service category not found', 404);
    }

    // Check if name is taken by another category
    const duplicateCategory = await prisma.serviceCategory.findFirst({
      where: {
        name: name.trim(),
        id: { not: categoryId }
      }
    });

    if (duplicateCategory) {
      return createErrorResponse('Category name already exists', 409);
    }

    // Update service category
    const updatedCategory = await prisma.serviceCategory.update({
      where: { id: categoryId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        iconUrl: iconUrl?.trim() || null
      }
    });

    return createSuccessResponse(updatedCategory, 'Service category updated successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const categoryId = parseInt(params.id);

    // Check if category exists
    const existingCategory = await prisma.serviceCategory.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            providerServices: true
          }
        }
      }
    });

    if (!existingCategory) {
      return createErrorResponse('Service category not found', 404);
    }

    // Check if category has associated services
    if (existingCategory._count.providerServices > 0) {
      return createErrorResponse('Cannot delete category with existing services. Please reassign or delete the services first.', 400);
    }

    // Delete service category
    await prisma.serviceCategory.delete({
      where: { id: categoryId }
    });

    return createSuccessResponse(null, 'Service category deleted successfully');

  } catch (error) {
    return handleApiError(error);
  }
}
