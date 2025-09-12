import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse, requireAuth } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    // Validate Bearer token - authenticated users only
    const authResult = await requireAuth(request, ['customer', 'provider']);
    const userId = parseInt((authResult as { user: any }).user.userId);

    // Get all chat conversations where user is a participant
    const chatConversations = await prisma.chatConversation.findMany({
      where: {
        participants: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                profilePictureUrl: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            sentAt: 'desc'
          },
          take: 1,
          select: {
            id: true,
            messageContent: true,
            sentAt: true,
            sender: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        },
        order: {
          select: {
            id: true,
            jobDescriptionNotes: true,
            scheduledDate: true
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                readAt: null,
                senderId: {
                  not: userId
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format response data
    const conversationsWithDetails = chatConversations.map((conversation: any) => ({
      id: conversation.id,
      conversationTitle: conversation.conversationTitle,
      orderId: conversation.orderId,
      orderDetails: conversation.order,
      participants: conversation.participants.map((p: any) => ({
        userId: p.userId,
        fullName: p.user.fullName,
        profilePictureUrl: p.user.profilePictureUrl
      })),
      lastMessage: conversation.messages[0] || null,
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
    // Validate Bearer token - authenticated users only
    const authResult = await requireAuth(request, ['customer', 'provider']);
    const userId = parseInt((authResult as { user: any }).user.userId);
    const body = await request.json();
    const { participantUserId, orderId, conversationTitle } = body;

    // Validation
    if (!participantUserId) {
      return createErrorResponse('participantUserId is required', 400);
    }

    if (parseInt(participantUserId) === userId) {
      return createErrorResponse('Cannot create conversation with yourself', 400);
    }

    // Verify participant exists
    const participantUser = await prisma.user.findUnique({
      where: { id: parseInt(participantUserId) }
    });

    if (!participantUser) {
      return createErrorResponse('Participant user not found', 404);
    }

    // Verify order exists if provided
    let order = null;
    if (orderId) {
      order = await prisma.order.findUnique({
        where: { id: parseInt(orderId) },
        include: {
          customer: true,
          providerService: {
            include: {
              provider: true
            }
          }
        }
      });

      if (!order) {
        return createErrorResponse('Order not found', 404);
      }

      // Verify user is part of this order
      const isCustomer = order.customerId === userId;
      const isProvider = order.providerId === userId;
      
      if (!isCustomer && !isProvider) {
        return createErrorResponse('You are not authorized to create chat for this order', 403);
      }
    }

    // Check if conversation already exists between these users for this order
    let existingConversation = null;
    if (orderId) {
      existingConversation = await prisma.chatConversation.findFirst({
        where: {
          orderId: parseInt(orderId),
          participants: {
            every: {
              userId: {
                in: [userId, parseInt(participantUserId)]
              }
            }
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  profilePictureUrl: true
                }
              }
            }
          }
        }
      });
    }

    if (existingConversation) {
      return createSuccessResponse(existingConversation, 'Conversation already exists');
    }

    // Create new conversation with transaction
    const chatConversation = await prisma.$transaction(async (tx) => {
      // Create conversation
      const conversation = await tx.chatConversation.create({
        data: {
          conversationTitle: conversationTitle || `Chat about Order #${orderId || 'General'}`,
          orderId: orderId ? parseInt(orderId) : null
        }
      });

      // Add participants
      await tx.chatParticipant.createMany({
        data: [
          {
            conversationId: conversation.id,
            userId: userId
          },
          {
            conversationId: conversation.id,
            userId: parseInt(participantUserId)
          }
        ]
      });

      // Return conversation with participants
      return tx.chatConversation.findUnique({
        where: { id: conversation.id },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  profilePictureUrl: true
                }
              }
            }
          },
          order: {
            select: {
              id: true,
              jobDescriptionNotes: true,
              scheduledDate: true
            }
          }
        }
      });
    });

    return NextResponse.json({
      success: true,
      data: chatConversation,
      message: 'Chat conversation created successfully'
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}
