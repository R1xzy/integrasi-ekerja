import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse, requireAuth } from '@/lib/api-helpers';
import { encryptChatMessage, decryptChatMessage } from '@/lib/utils-backend';// Pastikan path ini sesuai dengan struktur proyek Anda
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['customer', 'provider', 'admin']);
    if (authResult instanceof Response) return authResult;
    const userId = parseInt(authResult.user.userId);

    const chatConversations = await prisma.chatConversation.findMany({
      where: {
        participants: { some: { userId: userId } }
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, fullName: true, profilePictureUrl: true, email: true } }
          }
        },
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: { id: true, messageContent: true, sentAt: true, sender: { select: { id: true, fullName: true } } }
        },
        order: { select: { id: true, providerService: { select: { serviceTitle: true } } } },
        _count: {
          select: {
            messages: { where: { readAt: null, senderId: { not: userId } } }
          }
        }
      },
      // --- LOGIKA PERBAIKAN DI SINI ---
      // Gunakan format array untuk mengurutkan berdasarkan beberapa kriteria
      orderBy: [
        {
          messages: {
            _count: 'desc'
          }
        },
        {
          createdAt: 'desc'
        }
      ]
      // --- AKHIR LOGIKA PERBAIKAN ---
    });

    const conversationsWithDetails = chatConversations.map((conversation: any) => ({
      id: conversation.id,
      conversationTitle: conversation.order?.providerService?.serviceTitle || conversation.conversationTitle,
      orderId: conversation.orderId,
      participants: conversation.participants.map((p: any) => ({
        userId: p.userId,
        fullName: p.user.fullName,
        profilePictureUrl: p.user.profilePictureUrl,
        email: p.user.email
      })),
      lastMessage: conversation.messages[0] ? {
    messageContent: decryptChatMessage(conversation.messages[0].messageContent),
    sentAt: conversation.messages[0].sentAt,
    senderId: conversation.messages[0].senderId,
} : null,
      unreadCount: conversation._count.messages,
      createdAt: conversation.createdAt
    }));

    return createSuccessResponse(conversationsWithDetails, 'Chat conversations retrieved successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['customer', 'provider']);
    if (authResult instanceof Response) return authResult;
    const userId = parseInt(authResult.user.userId);
    
    const body = await request.json();
    const { participantUserId, orderId, conversationTitle } = body;

    if (!participantUserId) return createErrorResponse('participantUserId is required', 400);
    const participantId = parseInt(participantUserId);
    if (participantId === userId) return createErrorResponse('Cannot create conversation with yourself', 400);

    const participantUser = await prisma.user.findUnique({ where: { id: participantId } });
    if (!participantUser) return createErrorResponse('Participant user not found', 404);

    const parsedOrderId = orderId ? parseInt(orderId) : null;

    if (parsedOrderId) {
      const order = await prisma.order.findUnique({ where: { id: parsedOrderId } });
      if (!order) return createErrorResponse('Order not found', 404);
      if (order.customerId !== userId && order.providerId !== userId) {
        return createErrorResponse('You are not authorized to create chat for this order', 403);
      }
    }
    
    // --- LOGIKA PERBAIKAN ---
    // 1. Ambil semua percakapan yang melibatkan kedua pengguna dengan orderId yang cocok
    const existingConversations = await prisma.chatConversation.findMany({
        where: {
            orderId: parsedOrderId,
            AND: [
                { participants: { some: { userId: userId } } },
                { participants: { some: { userId: participantId } } }
            ]
        },
        include: { 
            participants: { 
                include: { 
                    user: { select: { id: true, fullName: true, profilePictureUrl: true } } 
                } 
            },
            order: { select: { id: true, providerService: { select: { serviceTitle: true } } } }
        }
    });

    // 2. Dari hasil di atas, cari yang jumlah partisipannya TEPAT 2 orang.
    const exactMatch = existingConversations.find(c => c.participants.length === 2);

    if (exactMatch) {
      return createSuccessResponse(exactMatch, 'Conversation already exists');
    }
    // --- AKHIR LOGIKA PERBAIKAN ---

    const finalTitle = conversationTitle || (parsedOrderId ? `Chat Pesanan #${parsedOrderId}` : `Percakapan dengan ${participantUser.fullName}`);
    
    const newConversation = await prisma.chatConversation.create({
      data: {
        conversationTitle: finalTitle,
        orderId: parsedOrderId,
        participants: { create: [{ userId: userId }, { userId: participantId }] }
      },
      include: {
        participants: { include: { user: { select: { id: true, fullName: true, profilePictureUrl: true } } } },
        order: { select: { id: true, providerService: { select: { serviceTitle: true } } } }
      }
    });

    return NextResponse.json({
      success: true, data: newConversation, message: 'Chat conversation created successfully'
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}