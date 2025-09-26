import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createAuthMiddleware } from '@/lib/jwt';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    // Get all chat conversations that admin has access to
    const accessibleChats = await prisma.chatAdminAccess.findMany({
      where: {
        status: 'APPROVED'
      },
      include: {
        conversation: {
          include: {
            order: {
              include: {
                provider: {
                  select: {
                    id: true,
                    fullName: true
                  }
                },
                providerService: {
                  select: {
                    id: true,
                    serviceTitle: true
                  }
                }
              }
            },
            messages: {
              select: {
                id: true,
                sentAt: true
              },
              orderBy: { sentAt: 'desc' },
              take: 1
            }
          }
        },
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: { approvedAt: 'desc' }
    });

    // Get message counts for all conversations
    const conversationIds = accessibleChats.map(access => access.conversationId);
    const messageCounts = await Promise.all(
      conversationIds.map(id => 
        prisma.chatMessage.count({ where: { conversationId: id } })
      )
    );

    const formattedChats = accessibleChats.map((access, index) => ({
      id: access.conversationId,
      orderId: access.conversation.orderId,
      customer: access.customer,
      provider: access.conversation.order?.provider || null,
      service: {
        name: access.conversation.order?.providerService?.serviceTitle || 'Unknown Service'
      },
      accessExpiresAt: access.expiresAt?.toISOString() || null,
      grantedAt: access.approvedAt?.toISOString() || access.createdAt.toISOString(),
      lastMessageAt: access.conversation.messages[0]?.sentAt.toISOString() || null,
      messageCount: messageCounts[index]
    }));

    return createSuccessResponse(formattedChats, `Found ${formattedChats.length} accessible chats`);

  } catch (error) {
    console.error('Error fetching accessible chats:', error);
    return handleApiError(error);
  }
}