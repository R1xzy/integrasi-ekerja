import { NextRequest, NextResponse } from 'next/server';
import { createAuthMiddleware } from '@/lib/jwt';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['customer', 'provider']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse('Authentication failed', 401);
    }

    const userId = parseInt(authResult.user!.userId);

    const conversations = await prisma.chatConversation.findMany({
      where: {
        participants: {
          some: { userId: userId }
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

    return createSuccessResponse(conversations, 'Chat conversations retrieved successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['customer', 'provider']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse('Authentication failed', 401);
    }

    const userId = parseInt(authResult.user!.userId);
    const { participantUserId, conversationTitle } = await request.json();

    if (!participantUserId) {
      return createErrorResponse('participantUserId is required', 400);
    }

    const conversation = await prisma.$transaction(async (tx) => {
      const newConversation = await tx.chatConversation.create({
        data: {
          conversationTitle: conversationTitle || 'New Chat'
        }
      });

      await tx.chatParticipant.createMany({
        data: [
          { conversationId: newConversation.id, userId: userId },
          { conversationId: newConversation.id, userId: parseInt(participantUserId) }
        ]
      });

      return newConversation;
    });

    return NextResponse.json({
      success: true,
      data: conversation,
      message: 'Chat conversation created successfully'
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
