import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';
import { createAuthMiddleware } from '@/lib/jwt';
import { generateSecureFilename, validateFileType, ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES } from '@/lib/utils-backend';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Validate Bearer token - any authenticated user can upload
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware();
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication required', authResult.status || 401);
    }
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('type') as string; // 'image' or 'document'
    
    if (!file) {
      return createErrorResponse('No file provided', 400);
    }
    
    // Validate file type
    const allowedTypes = fileType === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES;
    if (!validateFileType(file.name, allowedTypes)) {
      return createErrorResponse(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`, 400);
    }
    
    // Validate file size (max 5MB for images, 10MB for documents)
    const maxSize = fileType === 'image' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return createErrorResponse(`File too large. Max size: ${maxSize / 1024 / 1024}MB`, 400);
    }
    
    // Generate secure filename [C-18, A-4]
    const secureFilename = generateSecureFilename(file.name);
    
    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', fileType === 'image' ? 'images' : 'documents');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    // Save file
    const filePath = path.join(uploadDir, secureFilename);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));
    
    // Return file URL
    const fileUrl = `/uploads/${fileType === 'image' ? 'images' : 'documents'}/${secureFilename}`;
    
    return createSuccessResponse({ 
      fileUrl,
      filename: secureFilename,
      originalName: file.name,
      size: file.size,
      uploadedBy: authResult.user!.userId,
      uploadedAt: new Date().toISOString()
    }, 'File uploaded successfully');
    
  } catch (error) {
    return handleApiError(error);
  }
}
