import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { providerServiceSchema } from '@/lib/validations';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';
import { requireRole } from '@/lib/auth-helpers';

// UPDATE - Update service (Provider only for own services, Admin for all)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const handler = requireRole(['provider', 'admin'])(async (req: NextRequest, user) => {
    try {
      const serviceId = parseInt(params.id);
      const body = await req.json();
      const validatedData = providerServiceSchema.partial().parse(body);
      
      // Check if service exists and belongs to user (for providers)
      const existingService = await prisma.providerService.findUnique({
        where: { id: serviceId }
      });
      
      if (!existingService) {
        return createErrorResponse('Service not found', 404);
      }
      
      // Provider can only update own services
      if (user.role === 'provider' && existingService.providerId !== parseInt(user.id)) {
        return createErrorResponse('You can only update your own services', 403);
      }
      
      const updatedService = await prisma.providerService.update({
        where: { id: serviceId },
        data: {
          ...validatedData,
          updatedAt: new Date()
        },
        include: {
          category: true,
          provider: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      });
      
      return createSuccessResponse(updatedService, 'Service updated successfully');
      
    } catch (error) {
      return handleApiError(error);
    }
  });
  
  return handler(req);
}

// DELETE - Delete service (Provider only for own services, Admin for all)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const handler = requireRole(['provider', 'admin'])(async (req: NextRequest, user) => {
    try {
      const serviceId = parseInt(params.id);
      
      // Check if service exists and belongs to user (for providers)
      const existingService = await prisma.providerService.findUnique({
        where: { id: serviceId }
      });
      
      if (!existingService) {
        return createErrorResponse('Service not found', 404);
      }
      
      // Provider can only delete own services
      if (user.role === 'provider' && existingService.providerId !== parseInt(user.id)) {
        return createErrorResponse('You can only delete your own services', 403);
      }
      
      // Check if service has active orders
      const activeOrders = await prisma.order.findFirst({
        where: {
          providerServiceId: serviceId,
          status: {
            in: ['PENDING_ACCEPTANCE', 'ACCEPTED', 'IN_PROGRESS']
          }
        }
      });
      
      if (activeOrders) {
        return createErrorResponse('Cannot delete service with active orders', 409);
      }
      
      await prisma.providerService.delete({
        where: { id: serviceId }
      });
      
      return createSuccessResponse(null, 'Service deleted successfully');
      
    } catch (error) {
      return handleApiError(error);
    }
  });
  
  return handler(req);
}

// GET - Get single service
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const handler = requireRole(['provider', 'admin', 'customer'])(async (req: NextRequest, user) => {
    try {
      const serviceId = parseInt(params.id);
      
      const service = await prisma.providerService.findUnique({
        where: { id: serviceId },
        include: {
          category: true,
          provider: {
            select: {
              id: true,
              fullName: true,
              email: true,
              verificationStatus: true,
              providerBio: true
            }
          }
        }
      });
      
      if (!service) {
        return createErrorResponse('Service not found', 404);
      }
      
      return createSuccessResponse(service);
      
    } catch (error) {
      return handleApiError(error);
    }
  });
  
  return handler(req);
}
