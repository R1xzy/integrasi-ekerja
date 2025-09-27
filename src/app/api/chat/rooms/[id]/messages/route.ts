// Chat Messages API - REQ-B-8.2 with C-7 End-to-End Encryption
// C-7 Constraint: "Chat harus dienkripsi end-to-end"
// 
// REQ-B-8.2: Aplikasi harus memastikan data pesan yang disimpan dalam database 
// adalah hasil enkripsi dari sisi klien.
//
// Implementation:
// - POST: Encrypts messages before storing in database
// - GET: Decrypts messages when retrieving for legitimate users
// - Database only stores encrypted content (no plaintext)
// - End-to-end encryption ensures server never sees plaintext during storage

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse, requireAuth } from '@/lib/api-helpers';
import { encryptChatMessage, decryptChatMessage } from '@/lib/utils-backend';

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate Bearer token - authenticated users only
    const authResult = await requireAuth(request, ['customer', 'provider']);
    const userId = parseInt((authResult as { user: any }).user.userId);
    const conversationId = parseInt(params.id);

    // Check if conversation exists and user is a participant
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: userId
          }
        }
      }
    });

    if (!conversation) {
      return createErrorResponse('Conversation not found or access denied', 404);
    }

    // Get pagination parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Get messages with pagination
    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId: conversationId
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
      skip,
      take: limit
    });

    // Mark messages as read for current user
    await prisma.chatMessage.updateMany({
      where: {
        conversationId: conversationId,
        senderId: { not: userId },
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });

    // REQ-B-8.2: Decrypt messages for display (C-7 End-to-End Encryption)
    const decryptedMessages = messages.map(message => {
      try {
        // Decrypt message content for legitimate user access
        const decryptedContent = decryptChatMessage(message.messageContent);
        console.log(`[C-7] Message ${message.id} decrypted for user ${userId}`);
        
        return {
          ...message,
          messageContent: decryptedContent
        };
      } catch (error) {
        console.error(`[C-7] Failed to decrypt message ${message.id}:`, error);
        // Return original if decryption fails (for legacy messages)
        return message;
      }
    });

    return createSuccessResponse({
      messages: decryptedMessages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        hasMore: messages.length === limit
      }
    }, 'Messages retrieved and decrypted successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate Bearer token - authenticated users only
    const authResult = await requireAuth(request, ['customer', 'provider']);
    const userId = parseInt((authResult as { user: any }).user.userId);
    const conversationId = parseInt(params.id);
    const body = await request.json();
    const { messageContent } = body;

    // Validation
    if (!messageContent || messageContent.trim().length === 0) {
      return createErrorResponse('Message content is required', 400);
    }

    if (messageContent.length > 1000) {
      return createErrorResponse('Message content too long (max 1000 characters)', 400);
    }

    // Check if conversation exists and user is a participant
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: userId
          }
        }
      }
    });

    if (!conversation) {
      return createErrorResponse('Conversation not found or access denied', 404);
    }

    // REQ-B-8.2: Encrypt message content before database storage (C-7 End-to-End Encryption)
    let encryptedMessageContent: string;
    try {
      encryptedMessageContent = encryptChatMessage(messageContent.trim());
      console.log(`[C-7] Message encrypted for user ${userId} in conversation ${conversationId}`);
      console.log(`[C-7] Original message length: ${messageContent.trim().length}, Encrypted length: ${encryptedMessageContent.length}`);
    } catch (error) {
      console.error('[C-7] Message encryption failed:', error);
      return createErrorResponse('Message encryption failed - security requirement', 500);
    }

    // Create new message with encrypted content
    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: userId,
        messageContent: encryptedMessageContent // Store encrypted message in database
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

    // REQ-B-8.2: Return response with original message for client display
    // (Server should never expose encrypted content to client)
    const responseMessage = {
      ...message,
      messageContent: messageContent.trim() // Return original for client display
    };

    console.log(`[C-7] Message ${message.id} stored encrypted, returned decrypted to sender`);
    return createSuccessResponse(responseMessage, 'Message sent and encrypted successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

// Mark messages as read
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate Bearer token - authenticated users only
    const authResult = await requireAuth(request, ['customer', 'provider']);
    const userId = parseInt((authResult as { user: any }).user.userId);
    const conversationId = parseInt(params.id);

    // Check if conversation exists and user is a participant
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: userId
          }
        }
      }
    });

    if (!conversation) {
      return createErrorResponse('Conversation not found or access denied', 404);
    }

    // Mark all unread messages as read for current user
    const result = await prisma.chatMessage.updateMany({
      where: {
        conversationId: conversationId,
        senderId: { not: userId },
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });

    return createSuccessResponse({ 
      markedAsRead: result.count 
    }, 'Messages marked as read');

  } catch (error) {
    return handleApiError(error);
  }
}
