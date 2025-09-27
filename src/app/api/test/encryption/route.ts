// src/app/api/test/encryption/route.ts

import { NextRequest } from 'next/server';
import { encryptChatMessage, decryptChatMessage, encryptFilename } from '@/lib/utils-backend';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

// Test endpoint untuk validasi enkripsi chat dan file
export async function POST(request: NextRequest) {
  console.log("\n--- [TEST ENCRYPTION API] Testing encryption functionality ---");
  
  try {
    const body = await request.json();
    const { testType, data } = body;

    if (!testType || !data) {
      return createErrorResponse('testType dan data diperlukan', 400);
    }

    switch (testType) {
      case 'chat':
        return await testChatEncryption(data);
      case 'filename':
        return await testFilenameEncryption(data);
      default:
        return createErrorResponse('testType tidak valid. Gunakan "chat" atau "filename"', 400);
    }

  } catch (error) {
    console.error("❌ [TEST ENCRYPTION API] Error:", error);
    return createErrorResponse('Internal server error', 500);
  }
}

async function testChatEncryption(data: { message: string; userId?: string }) {
  console.log(`[TEST ENCRYPTION API] Testing chat encryption untuk message: "${data.message}"`);
  
  try {
    // Test enkripsi
    const encryptedMessage = encryptChatMessage(data.message);
    console.log(`[TEST ENCRYPTION API] Encrypted: ${encryptedMessage}`);
    
    // Test dekripsi
    const decryptedMessage = decryptChatMessage(encryptedMessage);
    console.log(`[TEST ENCRYPTION API] Decrypted: "${decryptedMessage}"`);
    
    // Validasi apakah enkripsi-dekripsi berhasil
    const isValid = decryptedMessage === data.message;
    
    const result = {
      originalMessage: data.message,
      encryptedMessage,
      decryptedMessage,
      isValid,
      encryptionLength: encryptedMessage.length,
      test: 'chat_encryption',
      status: isValid ? 'SUCCESS' : 'FAILED'
    };
    
    console.log(`[TEST ENCRYPTION API] Chat encryption test: ${isValid ? 'SUCCESS' : 'FAILED'}`);
    return createSuccessResponse(result, 'Chat encryption test completed');
    
  } catch (error) {
    console.error(`[TEST ENCRYPTION API] Chat encryption test failed:`, error);
    return createErrorResponse('Chat encryption test failed', 500);
  }
}

async function testFilenameEncryption(data: { filename: string; userId?: string }) {
  console.log(`[TEST ENCRYPTION API] Testing filename encryption untuk: "${data.filename}"`);
  
  try {
    // Test enkripsi filename
    const encryptedFileInfo = encryptFilename(data.filename, data.userId);
    console.log(`[TEST ENCRYPTION API] Original filename: ${data.filename}`);
    console.log(`[TEST ENCRYPTION API] Encrypted filename: ${encryptedFileInfo.encryptedFilename}`);
    
    const result = {
      originalFilename: data.filename,
      encryptedFilename: encryptedFileInfo.encryptedFilename,
      encryptionIV: encryptedFileInfo.encryptionIV,
      authTag: encryptedFileInfo.authTag,
      userId: data.userId || 'anonymous',
      test: 'filename_encryption',
      status: 'SUCCESS',
      metadata: {
        originalLength: data.filename.length,
        encryptedLength: encryptedFileInfo.encryptedFilename.length,
        hasExtension: data.filename.includes('.'),
        preservedExtension: encryptedFileInfo.encryptedFilename.includes('.') ? 
          encryptedFileInfo.encryptedFilename.split('.').pop() : null
      }
    };
    
    console.log(`[TEST ENCRYPTION API] Filename encryption test: SUCCESS`);
    return createSuccessResponse(result, 'Filename encryption test completed');
    
  } catch (error) {
    console.error(`[TEST ENCRYPTION API] Filename encryption test failed:`, error);
    return createErrorResponse('Filename encryption test failed', 500);
  }
}

// GET endpoint untuk mendapatkan informasi testing
export async function GET() {
  const testingInfo = {
    availableTests: [
      {
        type: 'chat',
        description: 'Test enkripsi dan dekripsi pesan chat',
        requiredFields: ['message'],
        optionalFields: ['userId'],
        example: {
          testType: 'chat',
          data: {
            message: 'Hello, this is a test message',
            userId: '123'
          }
        }
      },
      {
        type: 'filename',
        description: 'Test enkripsi nama file untuk upload',
        requiredFields: ['filename'],
        optionalFields: ['userId'],
        example: {
          testType: 'filename',
          data: {
            filename: 'document.pdf',
            userId: '123'
          }
        }
      }
    ],
    requirements: {
      'REQ-B-8.2': 'Chat messages must be encrypted end-to-end in database',
      'REQ-B-2.4': 'File names must be encrypted and stored uniquely'
    },
    usage: {
      method: 'POST',
      endpoint: '/api/test/encryption',
      contentType: 'application/json'
    }
  };
  
  return createSuccessResponse(testingInfo, 'Testing information retrieved');
}