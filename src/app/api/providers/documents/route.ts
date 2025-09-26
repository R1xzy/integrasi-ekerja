import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse, requireAuth } from '@/lib/api-helpers';
// Impor helper untuk upload file yang sudah ada di proyek Anda
import { generateUniqueFilename, validateFileType, ALLOWED_DOCUMENT_TYPES } from '@/lib/utils-backend';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Validate Bearer token - provider only
    const authResult = await requireAuth(request, ['provider']);
    if (authResult instanceof Response) return authResult;

    const providerId = parseInt(authResult.user.userId as string);

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


// --- [FUNGSI POST YANG SUDAH DIPERBAIKI] ---
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 POST /api/providers/documents - Starting request');
    
    const authResult = await requireAuth(request, ['provider']);
    if (authResult instanceof Response) return authResult;
    
    const providerId = parseInt(authResult.user.userId as string);
    console.log('✅ Auth successful for user ID:', providerId);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentTypeFromFrontend = formData.get('documentType') as string;

    if (!file) {
      return createErrorResponse('File tidak ditemukan dalam request', 400);
    }

    // ... (Validasi file dan penyimpanan file tidak berubah, sudah benar)
    if (!validateFileType(file.name, ALLOWED_DOCUMENT_TYPES)) return createErrorResponse(`Tipe file tidak valid. Diizinkan: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`, 400);
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) return createErrorResponse(`File terlalu besar. Maksimal: ${maxSize / 1024 / 1024}MB`, 400);
    const checkFilenameExists = async (filename: string): Promise<boolean> => {
        const docExists = await prisma.providerDocument.findFirst({ where: { fileUrl: { contains: filename } } });
        return !!docExists;
    };
    const secureFilename = await generateUniqueFilename(file.name, authResult.user.userId as string, checkFilenameExists);
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, secureFilename);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));
    const fileUrl = `/uploads/documents/${secureFilename}`;
    console.log('✅ File berhasil disimpan di:', fileUrl);

    // --- [PERBAIKAN UTAMA DI SINI] ---
    // Tentukan nilai enum yang valid. Kita asumsikan "verification" bisa dikategorikan sebagai 'OTHER'.
    // Anda bisa mengubah ini menjadi 'KTP' atau 'CERTIFICATE' jika lebih sesuai.
    const validDocumentType = 'OTHER';

    console.log(`💾 Membuat entri dokumen di database dengan tipe: ${validDocumentType}`);
    const document = await prisma.providerDocument.create({
      data: {
        providerId: providerId,
        documentType: validDocumentType, // Menggunakan nilai enum yang valid
        documentName: file.name,
        fileUrl: fileUrl,
        
        // Anda bisa mengisi field lain jika perlu
      }
    });
    // ------------------------------------
    
    console.log('✅ Dokumen berhasil dibuat di database dengan ID:', document.id);

    return createSuccessResponse(document, 'Dokumen berhasil diunggah');

  } catch (error) {
    console.error('💥 Error in POST /api/providers/documents:', error);
    return handleApiError(error);
  }
}