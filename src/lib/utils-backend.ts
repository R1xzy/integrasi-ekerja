import crypto from 'crypto';
import path from 'path';
import { prisma } from './db';

// File upload utilities
export function generateSecureFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(16).toString('hex');
  return `${hash}${ext}`;
}

// REQ-B-2.4: Generate encrypted filename with unpredictable pattern
export function generateEncryptedFilename(originalName: string, userId?: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now().toString();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  
  // Create a hash combining multiple unpredictable elements
  const hashInput = `${originalName}-${timestamp}-${userId || 'anonymous'}-${randomBytes}`;
  const hash = crypto.createHash('sha256').update(hashInput).digest('hex');
  
  // Take first 32 characters for filename + extension
  return `${hash.substring(0, 32)}${ext}`;
}

// REQ-B-2.5: Generate unique filename that doesn't exist in database
export async function generateUniqueFilename(
  originalName: string, 
  userId?: string,
  existingFilenameChecker?: (filename: string) => Promise<boolean>
): Promise<string> {
  let filename: string;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    filename = generateEncryptedFilename(originalName, userId);
    attempts++;
    
    // If no checker provided, assume it's unique
    if (!existingFilenameChecker) {
      break;
    }
    
    // Check if filename already exists
    const exists = await existingFilenameChecker(filename);
    if (!exists) {
      break;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique filename after maximum attempts');
    }
  } while (true);
  
  return filename;
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

export async function calculateFinalAmount(orderId: number): Promise<number> {
  // 1. Dapatkan harga dasar layanan dari pesanan
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { providerService: true },
  });

  if (!order) {
    throw new Error('Order not found for calculation');
  }

  const basePrice = order.providerService.price;

  // 2. Dapatkan semua biaya tambahan yang sudah disetujui
  const approvedDetails = await prisma.orderDetail.findMany({
    where: {
      orderId: orderId,
      status: 'APPROVED',
    },
  });

  // 3. Hitung total dari biaya tambahan
  const totalAdditionalCost = approvedDetails.reduce((sum, detail) => {
    return sum + (detail.quantity * detail.pricePerUnit);
  }, 0);

  // 4. Kembalikan total akhir
  return basePrice + totalAdditionalCost;
}