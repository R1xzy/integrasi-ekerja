// src/app/api/files/[documentId]/route.ts

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse, requireAuth } from '@/lib/api-helpers';

// REQ-B-2.4: Get provider document information with encrypted fileUrl
export async function GET(request: NextRequest, { params }: { params: { encryptionId: string } }) {
  console.log("\n--- [FILE INFO API] Menerima request untuk informasi file ---");
  
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    
    const userId = parseInt(authResult.user.userId as string);
    const documentId = parseInt(params.encryptionId); // Keep param name for backward compatibility
    
    console.log(`[FILE INFO API] User ID: ${userId}, Document ID: ${documentId}`);

    // Get provider document with encrypted fileUrl
    const providerDocument = await prisma.providerDocument.findUnique({
      where: { id: documentId },
      include: {
        provider: {
          select: { id: true, fullName: true }
        }
      }
    }) as any; // Cast to any temporarily for new fields

    if (!providerDocument) {
      return createErrorResponse('Dokumen tidak ditemukan', 404);
    }

    // Check if user has access to this document (either provider owner or admin)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    if (!user) {
      return createErrorResponse('User tidak ditemukan', 404);
    }

    const isAdmin = user.role.roleName === 'admin';
    const isOwner = providerDocument.providerId === userId;

    if (!isAdmin && !isOwner) {
      return createErrorResponse('Anda tidak memiliki akses ke dokumen ini', 403);
    }

    // Determine file type from originalFileName or documentName
    const fileExtension = providerDocument.originalFileName || providerDocument.documentName;
    const fileType = fileExtension?.toLowerCase().includes('.pdf') || 
                    fileExtension?.toLowerCase().includes('.doc') ? 'document' : 'image';

    // Return document info with encrypted filename
    const response = {
      id: providerDocument.id,
      encryptedFilename: providerDocument.fileUrl, // This contains encrypted filename
      originalFilename: providerDocument.originalFileName || providerDocument.documentName,
      displayName: providerDocument.originalFileName || providerDocument.documentName, // For user display
      documentName: providerDocument.documentName,
      documentType: providerDocument.documentType,
      fileType: fileType,
      fileUrl: `/uploads/${fileType === 'image' ? 'images' : 'documents'}/${providerDocument.fileUrl}`,
      uploadedBy: providerDocument.provider,
      createdAt: providerDocument.createdAt
    };

    console.log(`[FILE INFO API] Document info berhasil diambil untuk document ID: ${documentId}`);
    return createSuccessResponse(response, 'Informasi dokumen berhasil diambil');

  } catch (error) {
    console.error("❌ [FILE INFO API] Error mengambil informasi dokumen:", error);
    return handleApiError(error);
  }
}