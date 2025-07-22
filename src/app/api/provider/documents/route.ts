import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { documentSchema } from '@/lib/validations';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';
import { requireRole } from '@/lib/auth-helpers';

// CREATE - Add new document (Provider only)
export const POST = requireRole(['provider'])(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const validatedData = documentSchema.parse(body);
    
    const document = await prisma.providerDocument.create({
      data: {
        ...validatedData,
        providerId: parseInt(user.id)
      }
    });
    
    return createSuccessResponse(document, 'Document added successfully');
    
  } catch (error) {
    return handleApiError(error);
  }
});

// READ - Get provider documents
export const GET = requireRole(['provider', 'admin'])(async (req: NextRequest, user) => {
  try {
    const url = new URL(req.url);
    const providerId = url.searchParams.get('providerId');
    
    // If admin, can view any provider's documents, otherwise only own
    const targetProviderId = user.role === 'admin' && providerId 
      ? parseInt(providerId) 
      : parseInt(user.id);
    
    const documents = await prisma.providerDocument.findMany({
      where: { providerId: targetProviderId },
      orderBy: { createdAt: 'desc' }
    });
    
    return createSuccessResponse(documents);
    
  } catch (error) {
    return handleApiError(error);
  }
});
