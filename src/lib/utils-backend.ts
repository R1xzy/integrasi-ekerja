import crypto from 'crypto';
import path from 'path';

// File upload utilities
export function generateSecureFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(16).toString('hex');
  return `${hash}${ext}`;
}

export function validateFileType(filename: string, allowedTypes: string[]): boolean {
  const ext = path.extname(filename).toLowerCase();
  return allowedTypes.includes(ext);
}

export const ALLOWED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.webp'];
export const ALLOWED_DOCUMENT_TYPES = ['.pdf', '.jpg', '.jpeg', '.png'];

// Encryption utilities for chat (placeholder - implement with proper encryption)
export function encryptMessage(message: string, key: string): string {
  // TODO: Implement proper end-to-end encryption
  // For now, return the message as-is (implement in production)
  return message;
}

export function decryptMessage(encryptedMessage: string, key: string): string {
  // TODO: Implement proper end-to-end encryption
  // For now, return the message as-is (implement in production)
  return encryptedMessage;
}

// Rating calculation utility
export async function calculateProviderRating(providerId: number, db: any): Promise<number> {
  const reviews = await db.review.findMany({
    where: {
      providerId,
      isShow: true // Only include visible reviews [C-11]
    },
    select: {
      rating: true
    }
  });

  if (reviews.length === 0) return 0;

  const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
  return Number((totalRating / reviews.length).toFixed(1));
}

// Pagination helper
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export function parsePaginationParams(searchParams: URLSearchParams): Required<PaginationParams> {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  
  return { page, limit };
}

export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}
