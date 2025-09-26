import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createAuthMiddleware } from '@/lib/jwt';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const { chatId: chatIdParam } = await params;
    const chatId = parseInt(chatIdParam);

    if (isNaN(chatId)) {
      return createErrorResponse('Invalid chat ID', 400);
    }

    // Check if admin has access to this conversation
    const access = await prisma.chatAdminAccess.findFirst({
      where: {
        conversationId: chatId,
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
      }
    });

    if (!access) {
      return createErrorResponse('Access denied or conversation not found', 403);
    }

    // Check if access has expired
    if (access.expiresAt && new Date() > access.expiresAt) {
      // Update status to expired
      await prisma.chatAdminAccess.update({
        where: { id: access.id },
        data: { status: 'EXPIRED' }
      });

      return createErrorResponse('Access has expired', 403);
    }

    // Get chat messages
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')));
    const skip = (page - 1) * limit;

    const [messages, totalMessages] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { conversationId: chatId },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              role: {
                select: {
                  roleName: true
                }
              }
            }
          }
        },
        orderBy: { sentAt: 'asc' },
        skip,
        take: limit
      }),
      prisma.chatMessage.count({
        where: { conversationId: chatId }
      })
    ]);

    const response = {
      conversation: {
        id: access.conversation.id,
        orderId: access.conversation.orderId,
        customer: access.customer,
        provider: access.conversation.order?.provider || null,
        service: {
          name: access.conversation.order?.providerService?.serviceTitle || 'Unknown Service'
        }
      },
      access: {
        grantedAt: access.approvedAt?.toISOString() || access.createdAt.toISOString(),
        expiresAt: access.expiresAt?.toISOString() || null
      },
      messages: messages.map(msg => ({
        id: msg.id,
        senderId: msg.senderId,
        messageContent: msg.messageContent,
        sentAt: msg.sentAt.toISOString(),
        sender: {
          id: msg.sender.id,
          fullName: msg.sender.fullName,
          role: msg.sender.role
        }
      })),
      pagination: {
        page,
        limit,
        total: totalMessages,
        totalPages: Math.ceil(totalMessages / limit)
      }
    };

    return createSuccessResponse(response, `Found ${messages.length} messages`);

  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return handleApiError(error);
  }
}