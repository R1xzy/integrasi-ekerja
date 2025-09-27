// src/app/api/test/database-encryption/route.ts

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { encryptChatMessage, decryptChatMessage } from '@/lib/utils-backend';
import { createSuccessResponse, createErrorResponse, requireAuth } from '@/lib/api-helpers';

// Test endpoint untuk validasi enkripsi langsung ke database
export async function POST(request: NextRequest) {
  console.log("\n--- [TEST DATABASE ENCRYPTION API] Testing database encryption ---");
  
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    
    const userId = parseInt(authResult.user.userId as string);
    const body = await request.json();
    const { action, conversationId, message, messageId } = body;

    if (!action) {
      return createErrorResponse('Action diperlukan (create_conversation, send_message, get_messages)', 400);
    }

    switch (action) {
      case 'create_conversation':
        return await testCreateConversation(userId, body);
      case 'send_message':
        return await testSendEncryptedMessage(userId, conversationId, message);
      case 'get_messages':
        return await testGetDecryptedMessages(userId, conversationId);
      case 'raw_database':
        return await testRawDatabaseView(conversationId);
      default:
        return createErrorResponse('Action tidak valid', 400);
    }

  } catch (error) {
    console.error("❌ [TEST DATABASE ENCRYPTION API] Error:", error);
    return createErrorResponse('Internal server error', 500);
  }
}

// Test membuat conversation baru
async function testCreateConversation(userId: number, data: any) {
  console.log(`[TEST DATABASE ENCRYPTION] Creating test conversation for user: ${userId}`);
  
  try {
    // Buat conversation test
    const conversation = await prisma.chatConversation.create({
      data: {
        conversationTitle: `Test Encryption Conversation - ${Date.now()}`,
        orderId: null // Test conversation tanpa order
      }
    });

    // Tambahkan user sebagai participant
    await prisma.chatParticipant.create({
      data: {
        conversationId: conversation.id,
        userId: userId
      }
    });

    console.log(`[TEST DATABASE ENCRYPTION] Test conversation created with ID: ${conversation.id}`);
    
    return createSuccessResponse({
      conversationId: conversation.id,
      conversationTitle: conversation.conversationTitle,
      createdAt: conversation.createdAt,
      participantId: userId
    }, 'Test conversation created successfully');

  } catch (error) {
    console.error(`[TEST DATABASE ENCRYPTION] Error creating conversation:`, error);
    return createErrorResponse('Failed to create test conversation', 500);
  }
}

// Test mengirim pesan terenkripsi
async function testSendEncryptedMessage(userId: number, conversationId: number, message: string) {
  if (!conversationId || !message) {
    return createErrorResponse('conversationId dan message diperlukan', 400);
  }

  console.log(`[TEST DATABASE ENCRYPTION] Sending encrypted message to conversation: ${conversationId}`);
  console.log(`[TEST DATABASE ENCRYPTION] Original message: "${message}"`);
  
  try {
    // Verifikasi user adalah participant
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        conversationId: conversationId,
        userId: userId
      }
    });

    if (!participant) {
      return createErrorResponse('User bukan participant dari conversation ini', 403);
    }

    // Enkripsi pesan
    const encryptedMessage = encryptChatMessage(message);
    console.log(`[TEST DATABASE ENCRYPTION] Encrypted message: "${encryptedMessage}"`);

    // Simpan ke database dengan pesan terenkripsi
    const chatMessage = await prisma.chatMessage.create({
      data: {
        conversationId: conversationId,
        senderId: userId,
        messageContent: encryptedMessage // Simpan dalam bentuk terenkripsi
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    console.log(`[TEST DATABASE ENCRYPTION] Message saved to database with ID: ${chatMessage.id}`);

    return createSuccessResponse({
      messageId: chatMessage.id,
      conversationId: chatMessage.conversationId,
      senderId: chatMessage.senderId,
      originalMessage: message,
      encryptedInDatabase: encryptedMessage,
      sentAt: chatMessage.sentAt,
      sender: chatMessage.sender
    }, 'Encrypted message sent successfully');

  } catch (error) {
    console.error(`[TEST DATABASE ENCRYPTION] Error sending message:`, error);
    return createErrorResponse('Failed to send encrypted message', 500);
  }
}

// Test mengambil dan dekripsi pesan
async function testGetDecryptedMessages(userId: number, conversationId: number) {
  if (!conversationId) {
    return createErrorResponse('conversationId diperlukan', 400);
  }

  console.log(`[TEST DATABASE ENCRYPTION] Getting decrypted messages from conversation: ${conversationId}`);
  
  try {
    // Verifikasi user adalah participant
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        conversationId: conversationId,
        userId: userId
      }
    });

    if (!participant) {
      return createErrorResponse('User bukan participant dari conversation ini', 403);
    }

    // Ambil pesan terenkripsi dari database
    const encryptedMessages = await prisma.chatMessage.findMany({
      where: {
        conversationId: conversationId
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: {
        sentAt: 'asc'
      }
    });

    console.log(`[TEST DATABASE ENCRYPTION] Retrieved ${encryptedMessages.length} encrypted messages`);

    // Dekripsi setiap pesan
    const decryptedMessages = encryptedMessages.map(msg => {
      const decryptedContent = decryptChatMessage(msg.messageContent);
      console.log(`[TEST DATABASE ENCRYPTION] Message ${msg.id}: "${msg.messageContent}" -> "${decryptedContent}"`);
      
      return {
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        encryptedInDatabase: msg.messageContent,
        decryptedContent: decryptedContent,
        sentAt: msg.sentAt,
        sender: msg.sender
      };
    });

    return createSuccessResponse({
      conversationId: conversationId,
      totalMessages: decryptedMessages.length,
      messages: decryptedMessages
    }, 'Messages decrypted successfully');

  } catch (error) {
    console.error(`[TEST DATABASE ENCRYPTION] Error getting messages:`, error);
    return createErrorResponse('Failed to get decrypted messages', 500);
  }
}

// Test melihat data mentah di database (untuk verifikasi enkripsi)
async function testRawDatabaseView(conversationId: number) {
  if (!conversationId) {
    return createErrorResponse('conversationId diperlukan', 400);
  }

  console.log(`[TEST DATABASE ENCRYPTION] Viewing raw database data for conversation: ${conversationId}`);
  
  try {
    // Ambil data mentah tanpa dekripsi
    const rawMessages = await prisma.chatMessage.findMany({
      where: {
        conversationId: conversationId
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: {
        sentAt: 'asc'
      }
    });

    console.log(`[TEST DATABASE ENCRYPTION] Retrieved ${rawMessages.length} raw messages from database`);

    const rawData = rawMessages.map(msg => ({
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      messageContent_RAW: msg.messageContent, // Data mentah terenkripsi
      sentAt: msg.sentAt,
      sender: msg.sender,
      isEncrypted: msg.messageContent.length > 50 && !msg.messageContent.includes(' '), // Basic check
      contentLength: msg.messageContent.length
    }));

    return createSuccessResponse({
      conversationId: conversationId,
      totalMessages: rawData.length,
      rawDatabaseData: rawData,
      note: 'This shows the actual encrypted data stored in database'
    }, 'Raw database data retrieved');

  } catch (error) {
    console.error(`[TEST DATABASE ENCRYPTION] Error viewing raw data:`, error);
    return createErrorResponse('Failed to view raw database data', 500);
  }
}

// GET endpoint untuk informasi testing
export async function GET() {
  const testingInfo = {
    description: 'Test database encryption untuk chat messages',
    availableActions: [
      {
        action: 'create_conversation',
        description: 'Membuat conversation baru untuk testing',
        requiredFields: [],
        example: {
          action: 'create_conversation'
        }
      },
      {
        action: 'send_message',
        description: 'Mengirim pesan terenkripsi ke database',
        requiredFields: ['conversationId', 'message'],
        example: {
          action: 'send_message',
          conversationId: 1,
          message: 'Test message yang akan dienkripsi'
        }
      },
      {
        action: 'get_messages',
        description: 'Mengambil dan dekripsi pesan dari database',
        requiredFields: ['conversationId'],
        example: {
          action: 'get_messages',
          conversationId: 1
        }
      },
      {
        action: 'raw_database',
        description: 'Melihat data mentah terenkripsi di database',
        requiredFields: ['conversationId'],
        example: {
          action: 'raw_database',
          conversationId: 1
        }
      }
    ],
    usage: {
      method: 'POST',
      endpoint: '/api/test/database-encryption',
      contentType: 'application/json',
      authentication: 'Required (Bearer token)'
    }
  };
  
  return createSuccessResponse(testingInfo, 'Database encryption testing information');
}