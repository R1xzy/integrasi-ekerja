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
    console.log('🔄 POST /api/providers/documents - Starting request');
    
    // Validate Bearer token - provider only
    const authHeader = request.headers.get('authorization');
    console.log('🔐 Auth header:', authHeader ? 'Present' : 'Missing');
    
    const auth = createAuthMiddleware(['provider']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      console.log('❌ Auth failed:', authResult.message);
      return createErrorResponse(authResult.message || 'Authentication required', authResult.status || 401);
    }
    
    console.log('✅ Auth successful for user ID:', authResult.user?.userId);

    const providerId = parseInt(authResult.user!.userId);
    console.log('🆔 Provider ID:', providerId);
    
    const body = await request.json();
    console.log('📦 Request body:', JSON.stringify(body, null, 2));

    // Validate required fields
    const { documentType, documentName, fileUrl, issuingOrganization, credentialId, issuedAt } = body;

    if (!documentType || !documentName || !fileUrl) {
      console.log('❌ Missing required fields');
      return createErrorResponse('Document type, name, and file URL are required', 400);
    }

    console.log('✅ Required fields present');

    // Validate document type
    const validDocumentTypes = ['KTP', 'CERTIFICATE', 'LICENSE', 'OTHER'];
    if (!validDocumentTypes.includes(documentType)) {
      console.log('❌ Invalid document type:', documentType);
      return createErrorResponse(`Invalid document type. Must be one of: ${validDocumentTypes.join(', ')}`, 400);
    }
    
    console.log('✅ Document type valid:', documentType);

    // Parse issuedAt if provided
    let parsedIssuedAt = null;
    if (issuedAt) {
      try {
        parsedIssuedAt = new Date(issuedAt);
        if (isNaN(parsedIssuedAt.getTime())) {
          console.log('❌ Invalid date:', issuedAt);
          return createErrorResponse('Invalid issuedAt date format', 400);
        }
        console.log('✅ Date parsed:', parsedIssuedAt);
      } catch (error) {
        console.log('❌ Date parsing error:', error);
        return createErrorResponse('Invalid issuedAt date format', 400);
      }
    }

    console.log('💾 Creating document in database...');
    
    // Create document
    const document = await prisma.providerDocument.create({
      data: {
        providerId,
        documentType,
        documentName,
        fileUrl,
        issuingOrganization: issuingOrganization || null,
        credentialId: credentialId || null,
        issuedAt: parsedIssuedAt
      }
    });
    
    console.log('✅ Document created successfully:', document.id);

    return createSuccessResponse(document, 'Document added successfully');

  } catch (error) {
    console.error('💥 Error in POST /api/providers/documents:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    return handleApiError(error);
  }
}
