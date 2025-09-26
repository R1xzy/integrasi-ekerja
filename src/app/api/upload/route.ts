// src/app/api/upload/route.ts

import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { handleApiError, createSuccessResponse, createErrorResponse, requireAuth } from '@/lib/api-helpers';
import { generateUniqueFilename, validateFileType, ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES } from '@/lib/utils-backend';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  console.log("\n--- [UPLOAD API] Menerima request baru ---");
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    console.log(`[UPLOAD API] Autentikasi berhasil untuk user ID: ${authResult.user.userId}`);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadType = formData.get('uploadType') as string;
    
    console.log(`[UPLOAD API] Tipe unggahan yang diterima dari frontend: "${uploadType}"`);
    
    const fileType = uploadType === 'profile_picture' ? 'image' : 'document';

    if (!file) {
      console.error("[UPLOAD API] ERROR: File tidak ditemukan di formData.");
      return createErrorResponse('No file provided', 400);
    }
    
    // ... (Validasi dan kode lainnya tidak berubah)
    const allowedTypes = fileType === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES;
    if (!validateFileType(file.name, allowedTypes)) return createErrorResponse(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`, 400);
    const maxSize = fileType === 'image' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) return createErrorResponse(`File too large. Max size: ${maxSize / 1024 / 1024}MB`, 400);
    const checkFilenameExists = async (filename: string): Promise<boolean> => {
      const docExists = await (prisma as any).providerDocument.findFirst({ where: { fileUrl: { contains: filename } } });
      const portfolioExists = await prisma.providerPortfolio.findFirst({ where: { imageUrl: { contains: filename } } });
      const userExists = await prisma.user.findFirst({ where: { profilePictureUrl: { contains: filename } } });
      return !!(docExists || portfolioExists || userExists);
    };
    const secureFilename = await generateUniqueFilename(file.name, authResult.user.userId as string, checkFilenameExists);
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', fileType === 'image' ? 'images' : 'documents');
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, secureFilename);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));
    const fileUrl = `/uploads/${fileType === 'image' ? 'images' : 'documents'}/${secureFilename}`;
    
    // --- [BLOK DEBUGGING UTAMA] ---
    if (uploadType === 'profile_picture') {
        console.log("[UPLOAD API] Kondisi 'uploadType === profile_picture' TERPENUHI. Memulai update database...");
        
        const userIdToUpdate = parseInt(authResult.user.userId as string);
        console.log(`[UPLOAD API] Mencoba update user dengan ID: ${userIdToUpdate}`);
        console.log(`[UPLOAD API] URL baru yang akan disimpan: ${fileUrl}`);

        try {
            await prisma.user.update({
                where: {
                    id: userIdToUpdate
                },
                data: {
                    profilePictureUrl: fileUrl
                }
            });
            console.log("✅ [UPLOAD API] SUKSES: Database berhasil diperbarui.");
        } catch (dbError) {
            console.error("❌ [UPLOAD API] FATAL: Gagal saat update database!", dbError);
        }

    } else {
        console.log("[UPLOAD API] INFO: Kondisi 'uploadType === profile_picture' TIDAK TERPENUHI. Melewati update database.");
    }
    // ------------------------------------
    
    console.log("[UPLOAD API] Mengirim respons sukses ke frontend.");
    return createSuccessResponse({ fileUrl, filename: secureFilename }, 'File uploaded successfully');
    
  } catch (error) {
    console.error("❌ [UPLOAD API] Terjadi error di blok utama:", error);
    return handleApiError(error);
  }
}