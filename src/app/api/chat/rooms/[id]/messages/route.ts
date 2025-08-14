import { NextRequest, NextResponse } from 'next/server';
import { createAuthMiddleware } from '@/lib/jwt';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate Bearer token - authenticated users only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['customer', 'provider']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const userId = parseInt(authResult.user!.userId);
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

    return createSuccessResponse({
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        hasMore: messages.length === limit
      }
    }, 'Messages retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate Bearer token - authenticated users only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['customer', 'provider']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const userId = parseInt(authResult.user!.userId);
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

    // Create new message
    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: userId,
        messageContent: messageContent.trim()
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

    return createSuccessResponse(message, 'Message sent successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

// Mark messages as read
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate Bearer token - authenticated users only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['customer', 'provider']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const userId = parseInt(authResult.user!.userId);
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
