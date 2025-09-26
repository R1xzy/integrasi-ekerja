import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createAuthMiddleware } from '@/lib/jwt';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    // Validate Bearer token - customer only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['customer']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const customerId = parseInt(authResult.user!.userId);

    // Get conversations for this customer with admin access info
    const conversations = await prisma.chatConversation.findMany({
      where: {
        participants: {
          some: {
            userId: customerId
          }
        }
      },
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
        adminAccess: {
          where: {
            customerId: customerId,
            status: 'APPROVED'
          },
          orderBy: { approvedAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedConversations = conversations.map(conversation => {
      const activeAccess = conversation.adminAccess[0];
      
      return {
        id: conversation.id,
        orderId: conversation.orderId,
        isAdminAccessible: !!activeAccess && 
          activeAccess.expiresAt && 
          new Date(activeAccess.expiresAt) > new Date(),
        accessExpiresAt: activeAccess?.expiresAt?.toISOString() || null,
        order: conversation.order ? {
          id: conversation.order.id,
          provider: conversation.order.provider,
          service: {
            name: conversation.order.providerService.serviceTitle
          }
        } : null
      };
    });

    return createSuccessResponse(formattedConversations, `Found ${formattedConversations.length} conversations`);

  } catch (error: unknown) {
      console.error('Error fetching conversations:', error);
      return handleApiError(error);
    }
}

export async function PUT(request: NextRequest) {
  try {
    // Validate Bearer token - customer only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['customer']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const customerId = parseInt(authResult.user!.userId);
    
    // Get conversation ID from URL
    const url = new URL(request.url);
    const conversationId = url.pathname.split('/').pop();

    if (!conversationId || isNaN(parseInt(conversationId))) {
      return createErrorResponse('Invalid conversation ID', 400);
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON body', 400);
    }

    const { grantAccess, accessHours = 24 } = body;

    if (typeof grantAccess !== 'boolean') {
      return createErrorResponse('grantAccess must be a boolean', 400);
    }

    // Verify conversation belongs to customer
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: parseInt(conversationId),
        participants: {
          some: {
            userId: customerId
          }
        }
      }
    });

    if (!conversation) {
      return createErrorResponse('Conversation not found or access denied', 404);
    }

    if (grantAccess) {
      // Grant access - create or update admin access record
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + accessHours);

      // Check if there's an existing access record
      const existingAccess = await prisma.chatAdminAccess.findFirst({
        where: {
          conversationId: parseInt(conversationId),
          customerId: customerId,
          status: 'APPROVED'
        }
      });

      if (existingAccess) {
        // Update existing record
        await prisma.chatAdminAccess.update({
          where: { id: existingAccess.id },
          data: {
            expiresAt: expiresAt,
            approvedAt: new Date()
          }
        });
      } else {
        // Create new access record
        await prisma.chatAdminAccess.create({
          data: {
            conversationId: parseInt(conversationId),
            customerId: customerId,
            requestedByAdmin: 1, // Default admin ID, adjust as needed
            reason: 'Manual access granted by customer',
            status: 'APPROVED',
            expiresAt: expiresAt,
            approvedAt: new Date()
          }
        });
      }

      return createSuccessResponse(null, 'Admin access granted successfully');

      } else {
        // Revoke access - update status to REJECTED and set expiry to now
        await prisma.chatAdminAccess.updateMany({
          where: {
            conversationId: parseInt(conversationId),
            customerId: customerId,
            status: 'APPROVED'
          },
          data: {
            status: 'REJECTED',
            expiresAt: new Date() // Set expiry to now
          }
        });      return createSuccessResponse(null, 'Admin access revoked successfully');
    }

  } catch (error) {
    console.error('Error updating conversation access:', error);
    return handleApiError(error);
  }
}