import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { providerServiceSchema } from '@/lib/validations';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';
import { requireRole } from '@/lib/auth-helpers';

// CREATE - Add new service (Provider only)
export const POST = requireRole(['provider'])(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const validatedData = providerServiceSchema.parse(body);
    
    // Check if provider already has service in this category
    const existingService = await prisma.providerService.findUnique({
      where: {
        providerId_categoryId: {
          providerId: parseInt(user.id),
          categoryId: validatedData.categoryId
        }
      }
    });
    
    if (existingService) {
      return createErrorResponse('You already have a service in this category', 409);
    }
    
    const service = await prisma.providerService.create({
      data: {
        ...validatedData,
        providerId: parseInt(user.id)
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
    
    return createSuccessResponse(service, 'Service created successfully');
    
  } catch (error) {
    return handleApiError(error);
  }
});

// READ - Get provider services
export const GET = requireRole(['provider', 'admin', 'customer'])(async (req: NextRequest, user) => {
  try {
    const url = new URL(req.url);
    const providerId = url.searchParams.get('providerId');
    
    // If provider role, can only see own services unless admin
    const targetProviderId = (user.role === 'provider' && !providerId) 
      ? parseInt(user.id) 
      : providerId ? parseInt(providerId) : undefined;
    
    const services = await prisma.providerService.findMany({
      where: providerId ? { providerId: targetProviderId } : {},
      include: {
        category: true,
        provider: {
          select: {
            id: true,
            fullName: true,
            email: true,
            verificationStatus: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return createSuccessResponse(services);
    
  } catch (error) {
    return handleApiError(error);
  }
});
