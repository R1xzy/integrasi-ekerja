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

    // Get chat access requests for this customer
    const requests = await prisma.chatAdminAccess.findMany({
      where: {
        customerId: customerId
      },
      include: {
        admin: {
          select: {
            id: true,
            fullName: true
          }
        },
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
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedRequests = requests.map(request => ({
      id: request.id,
      orderId: request.conversation?.order?.id || request.conversationId,
      requestedBy: request.admin,
      reason: request.reason,
      status: request.status,
      accessExpiresAt: request.expiresAt?.toISOString() || null,
      requestedAt: request.createdAt.toISOString(),
      respondedAt: request.approvedAt?.toISOString() || null,
      order: request.conversation?.order ? {
        id: request.conversation.order.id,
        provider: request.conversation.order.provider,
        service: {
          name: request.conversation.order.providerService?.serviceTitle || 'Unknown Service'
        }
      } : null
    }));

    return createSuccessResponse(formattedRequests, `Found ${formattedRequests.length} chat access requests`);

  } catch (error) {
    console.error('Error fetching chat access requests:', error);
    return handleApiError(error);
  }
}