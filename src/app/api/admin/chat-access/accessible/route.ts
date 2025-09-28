import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/api-helpers';

const prisma = new PrismaClient();

// GET: List all conversations that admin has access to
export async function GET(request: NextRequest) {
  try {
    // Use auth helper to verify admin role
    const authResult = await requireAuth(request, ['admin']);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const admin = authResult.user;
    const adminId = parseInt(admin.userId as string);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get all approved and non-expired chat access for this admin
    const now = new Date();
    const accessibleChats = await (prisma as any).chatAdminAccess.findMany({
      where: {
        requestedByAdmin: adminId,
        status: 'APPROVED',
        expiresAt: {
          gt: now // Not expired
        }
      },
      include: {
        conversation: {
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
            },
            messages: {
              select: {
                id: true,
                sentAt: true
              },
              orderBy: {
                sentAt: 'desc'
              },
              take: 1
            },
            _count: {
              select: {
                messages: true
              }
            }
          }
        }
      },
      orderBy: {
        approvedAt: 'desc'
      },
      skip: offset,
      take: limit
    });

    // Transform data for response
    const formattedChats = accessibleChats.map((access: any) => ({
      id: access.conversation.id,
      orderId: access.conversation.orderId,
      customer: access.conversation.order.customer,
      provider: access.conversation.order.provider,
      service: {
        name: access.conversation.order.providerService.serviceTitle,
        category: access.conversation.order.providerService.category.name
      },
      accessExpiresAt: access.expiresAt,
      grantedAt: access.approvedAt,
      lastMessageAt: access.conversation.messages[0]?.sentAt || null,
      messageCount: access.conversation._count.messages
    }));

    // Get total count for pagination
    const totalCount = await (prisma as any).chatAdminAccess.count({
      where: {
        requestedByAdmin: adminId,
        status: 'APPROVED',
        expiresAt: {
          gt: now
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: formattedChats,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching accessible chats:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}