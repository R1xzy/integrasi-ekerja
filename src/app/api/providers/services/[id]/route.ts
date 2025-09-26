import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createAuthMiddleware } from '@/lib/jwt';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Validate Bearer token - provider or customer can view services
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['provider', 'customer']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const resolvedParams = await params;
    const serviceId = parseInt(resolvedParams.id);

    if (isNaN(serviceId)) {
      return createErrorResponse('Invalid service ID', 400);
    }

    // Get service details
    const service = await prisma.providerService.findUnique({
      where: { id: serviceId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            iconUrl: true
          }
        },
        provider: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            address: true,
            providerBio: true,
            profilePictureUrl: true,
            verificationStatus: true
          }
        }
      }
    });

    if (!service) {
      return createErrorResponse('Service not found', 404);
    }

    // If it's a provider, they can only view their own services
    if (authResult.user!.roleName === 'provider') {
      const providerId = parseInt(authResult.user!.userId);
      if (service.providerId !== providerId) {
        return createErrorResponse('Access denied. You can only view your own services', 403);
      }
    }

    return createSuccessResponse(service, 'Service retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Validate Bearer token - provider only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['provider']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const resolvedParams = await params;
    const serviceId = parseInt(resolvedParams.id);
    const providerId = parseInt(authResult.user!.userId);

    if (isNaN(serviceId)) {
      return createErrorResponse('Invalid service ID', 400);
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON body', 400);
    }

    const { serviceTitle, description, price, categoryId } = body;

    // Validate required fields
    if (!serviceTitle || !description || price === undefined) {
      return createErrorResponse('Missing required fields: serviceTitle, description, price', 400);
    }

    if (typeof price !== 'number' || price < 0) {
      return createErrorResponse('Price must be a valid positive number', 400);
    }

    // Check if service exists and belongs to this provider
    const existingService = await prisma.providerService.findUnique({
      where: { id: serviceId },
    });

    if (!existingService) {
      return createErrorResponse('Service not found', 404);
    }

    if (existingService.providerId !== providerId) {
      return createErrorResponse('Access denied. You can only update your own services', 403);
    }

    // Update the service
    const updatedService = await prisma.providerService.update({
      where: { id: serviceId },
      data: {
        serviceTitle: serviceTitle.trim(),
        description: description.trim(),
        price: parseFloat(price.toString()),
        categoryId: categoryId ? parseInt(categoryId.toString()) : existingService.categoryId,
        updatedAt: new Date()
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

    return createSuccessResponse(updatedService, 'Service updated successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Validate Bearer token - provider only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['provider']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const resolvedParams = await params;
    const serviceId = parseInt(resolvedParams.id);
    const providerId = parseInt(authResult.user!.userId);

    if (isNaN(serviceId)) {
      return createErrorResponse('Invalid service ID', 400);
    }

    // Check if service exists and belongs to this provider
    const existingService = await prisma.providerService.findUnique({
      where: { id: serviceId },
    });

    if (!existingService) {
      return createErrorResponse('Service not found', 404);
    }

    if (existingService.providerId !== providerId) {
      return createErrorResponse('Access denied. You can only delete your own services', 403);
    }

    // Delete the service
    await prisma.providerService.delete({
      where: { id: serviceId }
    });

    return createSuccessResponse(null, 'Service deleted successfully');

  } catch (error) {
    return handleApiError(error);
  }
}
