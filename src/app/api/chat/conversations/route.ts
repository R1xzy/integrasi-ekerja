// src/app/api/chat/conversations/route.ts

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse, requireAuth } from '@/lib/api-helpers';

// Create new chat conversation
export async function POST(request: NextRequest) {
  console.log("\n--- [CHAT CONVERSATION API] Menerima request untuk membuat percakapan baru ---");
  
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    
    const userId = parseInt(authResult.user.userId as string);
    console.log(`[CHAT CONVERSATION API] Autentikasi berhasil untuk user ID: ${userId}`);

    const body = await request.json();
    const { orderId, participantIds, conversationTitle } = body;

    if (!orderId || !participantIds || !Array.isArray(participantIds)) {
      return createErrorResponse('orderId dan participantIds (array) diperlukan', 400);
    }

    // Verify the order exists and user has access
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        customer: { select: { id: true, fullName: true } },
        provider: { select: { id: true, fullName: true } }
      }
    });

    if (!order) {
      return createErrorResponse('Order tidak ditemukan', 404);
    }

    // Verify user is either customer or provider of this order
    if (order.customerId !== userId && order.providerId !== userId) {
      return createErrorResponse('Anda tidak memiliki akses ke order ini', 403);
    }

    // Check if conversation already exists for this order
    const existingConversation = await prisma.chatConversation.findFirst({
      where: { orderId: parseInt(orderId) }
    });

    if (existingConversation) {
      return createErrorResponse('Percakapan untuk order ini sudah ada', 400);
    }

    // Create new conversation
    const conversation = await prisma.chatConversation.create({
      data: {
        orderId: parseInt(orderId),
        conversationTitle: conversationTitle || `Chat Order #${orderId}`
      }
    });

    // Add participants
    const participantData = participantIds.map((participantId: number) => ({
      conversationId: conversation.id,
      userId: participantId
    }));

    await prisma.chatParticipant.createMany({
      data: participantData
    });

    console.log(`[CHAT CONVERSATION API] Percakapan berhasil dibuat dengan ID: ${conversation.id}`);

    const response = {
      id: conversation.id,
      orderId: conversation.orderId,
      conversationTitle: conversation.conversationTitle,
      createdAt: conversation.createdAt,
      participants: participantIds
    };

    return createSuccessResponse(response, 'Percakapan berhasil dibuat');

  } catch (error) {
    console.error("❌ [CHAT CONVERSATION API] Error membuat percakapan:", error);
    return handleApiError(error);
  }
}

// Get user's conversations
export async function GET(request: NextRequest) {
  console.log("\n--- [CHAT CONVERSATION API] Menerima request untuk mengambil percakapan ---");
  
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    
    const userId = parseInt(authResult.user.userId as string);
    console.log(`[CHAT CONVERSATION API] Autentikasi berhasil untuk user ID: ${userId}`);

    // Get conversations where user is a participant
    const conversations = await prisma.chatConversation.findMany({
      where: {
        participants: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        order: {
          include: {
            customer: { select: { id: true, fullName: true, profilePictureUrl: true } },
            provider: { select: { id: true, fullName: true, profilePictureUrl: true } }
          }
        },
        participants: {
          include: {
            user: { select: { id: true, fullName: true, profilePictureUrl: true } }
          }
        },
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: {
            messageContent: true,
            sentAt: true,
            sender: { select: { fullName: true } }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedConversations = conversations.map(conversation => ({
      id: conversation.id,
      orderId: conversation.orderId,
      conversationTitle: conversation.conversationTitle,
      createdAt: conversation.createdAt,
      order: conversation.order,
      participants: conversation.participants.map(p => p.user),
      lastMessage: conversation.messages[0] ? {
        content: '[Pesan Terenkripsi]', // Don't decrypt in list view for security
        sentAt: conversation.messages[0].sentAt,
        senderName: conversation.messages[0].sender.fullName
      } : null
    }));

    console.log(`[CHAT CONVERSATION API] Berhasil mengambil ${formattedConversations.length} percakapan untuk user: ${userId}`);

    return createSuccessResponse({ conversations: formattedConversations }, 'Percakapan berhasil diambil');

  } catch (error) {
    console.error("❌ [CHAT CONVERSATION API] Error mengambil percakapan:", error);
    return handleApiError(error);
  }
}