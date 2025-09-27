// src/app/api/files/[encryptionId]/route.ts

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse, requireAuth } from '@/lib/api-helpers';
import { decryptFilename } from '@/lib/utils-backend';

// REQ-B-2.4: Get file information with decrypted filename for display
export async function GET(request: NextRequest, { params }: { params: { encryptionId: string } }) {
  console.log("\n--- [FILE INFO API] Menerima request untuk informasi file ---");
  
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    
    const userId = parseInt(authResult.user.userId as string);
    const encryptionId = parseInt(params.encryptionId);
    
    console.log(`[FILE INFO API] User ID: ${userId}, Encryption ID: ${encryptionId}`);

    // Get file encryption metadata
    const fileEncryption = await (prisma as any).fileEncryption.findUnique({
      where: { id: encryptionId },
      include: {
        uploader: {
          select: { id: true, fullName: true }
        }
      }
    });

    if (!fileEncryption) {
      return createErrorResponse('File tidak ditemukan', 404);
    }

    // Check if user has access to this file (either uploader or admin)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    if (!user) {
      return createErrorResponse('User tidak ditemukan', 404);
    }

    const isAdmin = user.role.roleName === 'Admin';
    const isOwner = fileEncryption.uploadedBy === userId;

    if (!isAdmin && !isOwner) {
      return createErrorResponse('Anda tidak memiliki akses ke file ini', 403);
    }

    // Return file info with decrypted filename for display
    const response = {
      id: fileEncryption.id,
      encryptedFilename: fileEncryption.encryptedFilename,
      originalFilename: decryptFilename(fileEncryption.encryptedFilename, fileEncryption.originalFilename),
      displayName: fileEncryption.originalFilename, // For user display
      fileType: fileEncryption.fileType,
      fileUrl: `/uploads/${fileEncryption.fileType === 'image' ? 'images' : 'documents'}/${fileEncryption.encryptedFilename}`,
      uploadedBy: fileEncryption.uploader,
      createdAt: fileEncryption.createdAt
    };

    console.log(`[FILE INFO API] File info berhasil diambil untuk encryption ID: ${encryptionId}`);
    return createSuccessResponse(response, 'Informasi file berhasil diambil');

  } catch (error) {
    console.error("❌ [FILE INFO API] Error mengambil informasi file:", error);
    return handleApiError(error);
  }
}