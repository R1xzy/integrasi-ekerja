// src/app/api/chat/messages/route.ts

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse, requireAuth } from '@/lib/api-helpers';
import { encryptChatMessage, decryptChatMessage } from '@/lib/utils-backend';

// REQ-B-8.2: Send encrypted chat message
export async function POST(request: NextRequest) {
  console.log("\n--- [CHAT API] Menerima request untuk mengirim pesan ---");
  
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    
    const userId = parseInt(authResult.user.userId as string);
    console.log(`[CHAT API] Autentikasi berhasil untuk user ID: ${userId}`);

    const body = await request.json();
    const { conversationId, message } = body;

    if (!conversationId || !message) {
      return createErrorResponse('ConversationId dan message diperlukan', 400);
    }

    // Verify user is participant in this conversation
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        conversationId: parseInt(conversationId),
        userId: userId
      }
    });

    if (!participant) {
      return createErrorResponse('Anda tidak memiliki akses ke percakapan ini', 403);
    }

    // Encrypt the message content before saving to database
    const encryptedMessage = encryptChatMessage(message);
    console.log(`[CHAT API] Pesan berhasil dienkripsi untuk conversationId: ${conversationId}`);

    // Save encrypted message to database
    const chatMessage = await prisma.chatMessage.create({
      data: {
        conversationId: parseInt(conversationId),
        senderId: userId,
        messageContent: encryptedMessage // Store encrypted content
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            profilePictureUrl: true
          }
        }
      }
    });

    console.log(`[CHAT API] Pesan berhasil disimpan dengan ID: ${chatMessage.id}`);

    // Return the message with original content for the sender
    const response = {
      id: chatMessage.id,
      conversationId: chatMessage.conversationId,
      senderId: chatMessage.senderId,
      messageContent: message, // Return original message to sender
      sentAt: chatMessage.sentAt,
      readAt: chatMessage.readAt,
      sender: chatMessage.sender
    };

    return createSuccessResponse(response, 'Pesan berhasil dikirim');

  } catch (error) {
    console.error("❌ [CHAT API] Error mengirim pesan:", error);
    return handleApiError(error);
  }
}

// REQ-B-8.2: Get encrypted chat messages and decrypt for display
export async function GET(request: NextRequest) {
  console.log("\n--- [CHAT API] Menerima request untuk mengambil pesan ---");
  
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    
    const userId = parseInt(authResult.user.userId as string);
    console.log(`[CHAT API] Autentikasi berhasil untuk user ID: ${userId}`);

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!conversationId) {
      return createErrorResponse('ConversationId diperlukan', 400);
    }

    // Verify user is participant in this conversation
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        conversationId: parseInt(conversationId),
        userId: userId
      }
    });

    if (!participant) {
      return createErrorResponse('Anda tidak memiliki akses ke percakapan ini', 403);
    }

    // Get encrypted messages from database
    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId: parseInt(conversationId)
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            profilePictureUrl: true
          }
        }
      },
      orderBy: {
        sentAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Decrypt messages for display
    const decryptedMessages = messages.map(message => ({
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      messageContent: decryptChatMessage(message.messageContent), // Decrypt for display
      sentAt: message.sentAt,
      readAt: message.readAt,
      sender: message.sender
    }));

    const totalMessages = await prisma.chatMessage.count({
      where: {
        conversationId: parseInt(conversationId)
      }
    });

    const response = {
      messages: decryptedMessages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total: totalMessages,
        totalPages: Math.ceil(totalMessages / limit)
      }
    };

    console.log(`[CHAT API] Berhasil mengambil ${decryptedMessages.length} pesan untuk conversationId: ${conversationId}`);
    return createSuccessResponse(response, 'Pesan berhasil diambil');

  } catch (error) {
    console.error("❌ [CHAT API] Error mengambil pesan:", error);
    return handleApiError(error);
  }
}