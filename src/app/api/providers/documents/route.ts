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
      return createErrorResponse(authResult.message || 'Authentication required', authResult.status || 401);
    }

    const providerId = parseInt(authResult.user!.userId);

    // Get provider documents
    const documents = await prisma.providerDocument.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' }
    });

    return createSuccessResponse(documents, `Found ${documents.length} documents`);

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
      return createErrorResponse(authResult.message || 'Authentication required', authResult.status || 401);
    }

    const providerId = parseInt(authResult.user!.userId);
    const body = await request.json();

    // Validate required fields
    const { documentType, documentName, fileUrl, issuingOrganization, credentialId } = body;

    if (!documentType || !documentName || !fileUrl) {
      return createErrorResponse('Document type, name, and file URL are required', 400);
    }

    // Validate document type
    const validDocumentTypes = ['KTP', 'CERTIFICATE', 'LICENSE', 'OTHER'];
    if (!validDocumentTypes.includes(documentType)) {
      return createErrorResponse(`Invalid document type. Must be one of: ${validDocumentTypes.join(', ')}`, 400);
    }

    // Create document
    const document = await prisma.providerDocument.create({
      data: {
        providerId,
        documentType,
        documentName,
        fileUrl,
        issuingOrganization: issuingOrganization || null,
        credentialId: credentialId || null,
        issuedAt: null
      }
    });

    return createSuccessResponse(document, 'Document added successfully');

  } catch (error) {
    return handleApiError(error);
  }
}
