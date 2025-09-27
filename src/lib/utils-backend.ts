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

// File encryption/decryption utilities for REQ-B-2.4
const ENCRYPTION_KEY = process.env.FILE_ENCRYPTION_KEY || 'default-file-encryption-key-32-chars-long';
const ALGORITHM = 'aes-256-gcm';

export interface EncryptedFileInfo {
  encryptedFilename: string;
  originalFilename: string;
  encryptionIV: string;
  authTag: string;
}

export function encryptFilename(originalName: string, userId?: string): EncryptedFileInfo {
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  
  // Generate unique IV for each encryption
  const iv = crypto.randomBytes(16);
  
  // Create cipher with proper key handling
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32)), iv);
  
  // Encrypt the original filename with user context
  const dataToEncrypt = `${baseName}-${userId || 'anonymous'}-${Date.now()}`;
  let encrypted = cipher.update(dataToEncrypt, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Generate random hash for additional obfuscation
  const randomHash = crypto.randomBytes(8).toString('hex');
  const finalEncryptedName = `${encrypted.substring(0, 16)}_${randomHash}${ext}`;
  
  return {
    encryptedFilename: finalEncryptedName,
    originalFilename: originalName,
    encryptionIV: iv.toString('hex'),
    authTag: randomHash
  };
}

export function decryptFilename(encryptedFilename: string, originalFilename: string): string {
  // For frontend display, return the original filename
  // The encrypted filename is only used for storage
  return originalFilename;
}

// Encryption utilities for chat messages (REQ-B-8.2)
const CHAT_ENCRYPTION_KEY = process.env.CHAT_ENCRYPTION_KEY || 'default-chat-encryption-key-32-chars-long';

// Simple but secure encryption for chat messages
export function encryptChatMessage(message: string): string {
  try {
    // Generate random IV for each encryption
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(CHAT_ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32)), iv);
    
    // Add timestamp and random salt for additional security
    const timestamp = Date.now().toString();
    const salt = crypto.randomBytes(8).toString('hex');
    const dataToEncrypt = `${timestamp}:${salt}:${message}`;
    
    let encrypted = cipher.update(dataToEncrypt, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Prepend IV to encrypted data
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Error encrypting chat message:', error);
    return message; // Fallback to original message if encryption fails
  }
}

export function decryptChatMessage(encryptedMessage: string): string {
  try {
    // Check if message contains IV (new format)
    if (!encryptedMessage.includes(':')) {
      return '[Pesan Terenkripsi - Format Tidak Valid]';
    }
    
    // Extract IV and encrypted data
    const parts = encryptedMessage.split(':');
    if (parts.length < 2) {
      return '[Pesan Terenkripsi - Format Tidak Valid]';
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(CHAT_ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32)), iv);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Extract the original message from timestamp:salt:message format
    const messageParts = decrypted.split(':');
    if (messageParts.length >= 3) {
      // Remove timestamp and salt, join the rest as the message
      return messageParts.slice(2).join(':');
    }
    
    return decrypted; // Fallback if format is different
  } catch (error) {
    console.error('Error decrypting chat message:', error);
    return '[Pesan Terenkripsi - Gagal Dekripsi]';
  }
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