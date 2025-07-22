import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verificationSchema } from '@/lib/validations';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';
import { requireRole } from '@/lib/auth-helpers';

// UPDATE - Admin verifies provider [C-2]
export const PUT = requireRole(['admin'])(async (req: NextRequest, user) => {
  try {
    const url = new URL(req.url);
    const providerId = url.searchParams.get('providerId');
    
    if (!providerId) {
      return createErrorResponse('Provider ID is required', 400);
    }
    
    const body = await req.json();
    const validatedData = verificationSchema.parse(body);
    
    // Check if provider exists and is actually a provider
    const provider = await prisma.user.findFirst({
      where: {
        id: parseInt(providerId),
        role: { roleName: 'provider' }
      },
      include: { role: true }
    });
    
    if (!provider) {
      return createErrorResponse('Provider not found', 404);
    }
    
    // Update verification status
    const updatedProvider = await prisma.user.update({
      where: { id: parseInt(providerId) },
      data: {
        verificationStatus: validatedData.status,
        verifiedBy: parseInt(user.id),
        verifiedAt: validatedData.status === 'VERIFIED' ? new Date() : null,
        updatedAt: new Date()
      },
      include: {
        role: true,
        verifier: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });
    
    // Remove sensitive data
    const { passwordHash, ...providerWithoutPassword } = updatedProvider;
    
    return createSuccessResponse(providerWithoutPassword, 'Provider verification updated successfully');
    
  } catch (error) {
    return handleApiError(error);
  }
});

// GET - Get providers pending verification (Admin only)
export const GET = requireRole(['admin'])(async (req: NextRequest, user) => {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || 'PENDING';
    
    const providers = await prisma.user.findMany({
      where: {
        role: { roleName: 'provider' },
        verificationStatus: status as any
      },
      include: {
        role: true,
        providerDocuments: true,
        verifier: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Remove sensitive data from all providers
    const providersWithoutPassword = providers.map(({ passwordHash, ...provider }) => provider);
    
    return createSuccessResponse(providersWithoutPassword);
    
  } catch (error) {
    return handleApiError(error);
  }
});
