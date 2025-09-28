import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/api-helpers';

const prisma = new PrismaClient();

// GET: List all customer's conversations with admin access status
export async function GET(request: NextRequest) {
  try {
    // Use auth helper to verify customer role
    const authResult = await requireAuth(request, ['customer', 'admin']);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const customer = authResult.user;
    const customerId = parseInt(customer.userId as string);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get all conversations where customer is a participant
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
        },
        adminAccess: {
          where: {
            customerId: customerId,
            status: 'APPROVED'
          },
          orderBy: {
            approvedAt: 'desc'
          },
          take: 1
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.chatConversation.count({
      where: {
        participants: {
          some: {
            userId: customerId
          }
        }
      }
    });

    // Transform data for response
    const now = new Date();
    const formattedConversations = conversations.map((conv: any) => {
      const activeAccess = conv.adminAccess[0];
      const hasActiveAccess = activeAccess && 
        activeAccess.expiresAt && 
        new Date(activeAccess.expiresAt) > now;

      return {
        id: conv.id,
        orderId: conv.orderId,
        isAdminAccessible: hasActiveAccess,
        accessExpiresAt: hasActiveAccess ? activeAccess.expiresAt : null,
        messageCount: conv._count.messages,
        createdAt: conv.createdAt,
        order: {
          id: conv.orderId,
          provider: conv.order.provider,
          service: {
            name: conv.order.providerService.serviceTitle,
            category: conv.order.providerService.category.name
          }
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedConversations,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching customer conversations:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}