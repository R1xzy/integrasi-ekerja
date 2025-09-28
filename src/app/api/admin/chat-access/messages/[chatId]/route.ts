import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/api-helpers';
import { decryptChatMessage } from '@/lib/utils-backend';

const prisma = new PrismaClient();

// GET: Get messages for a specific chat conversation with admin access validation
export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    // Use auth helper to verify admin role
    const authResult = await requireAuth(request, ['admin']);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const admin = authResult.user;
    const adminId = parseInt(admin.userId as string);
    const chatId = parseInt(params.chatId);

    if (isNaN(chatId)) {
      return NextResponse.json({ 
        error: 'Invalid chat ID' 
      }, { status: 400 });
    }

    // Check if admin has access to this conversation
    const now = new Date();
    const chatAccess = await (prisma as any).chatAdminAccess.findFirst({
      where: {
        conversationId: chatId,
        requestedByAdmin: adminId,
        status: 'APPROVED',
        expiresAt: {
          gt: now // Not expired
        }
      }
    });

    if (!chatAccess) {
      return NextResponse.json({ 
        error: 'Access denied. You do not have permission to view this conversation or your access has expired.' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Get conversation info
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: chatId },
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            },
            provider: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            },
            providerService: {
              select: {
                serviceTitle: true,
                category: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ 
        error: 'Conversation not found' 
      }, { status: 404 });
    }

    // Get messages with pagination
    const [messages, totalCount] = await Promise.all([
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
        skip: offset,
        take: limit
      }),
      prisma.chatMessage.count({
        where: { conversationId: chatId }
      })
    ]);

    // Decrypt messages for admin viewing
    const decryptedMessages = messages.map(message => {
      let decryptedContent = message.messageContent;
      
      try {
        // Try to decrypt the message content
        decryptedContent = decryptChatMessage(message.messageContent);
      } catch (error) {
        // If decryption fails, assume it's plain text (for backward compatibility)
        console.log('Message appears to be plain text or decryption failed:', message.id);
      }

      return {
        id: message.id,
        senderId: message.senderId,
        messageContent: decryptedContent,
        sentAt: message.sentAt,
        readAt: message.readAt,
        sender: {
          id: message.sender.id,
          fullName: message.sender.fullName,
          role: {
            roleName: message.sender.role.roleName
          }
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        conversation: {
          id: conversation.id,
          orderId: conversation.orderId,
          title: conversation.conversationTitle,
          customer: conversation.order?.customer,
          provider: conversation.order?.provider,
          service: conversation.order?.providerService ? {
            name: conversation.order.providerService.serviceTitle,
            category: conversation.order.providerService.category.name
          } : null
        },
        messages: decryptedMessages,
        access: {
          expiresAt: chatAccess.expiresAt,
          grantedAt: chatAccess.approvedAt
        }
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}