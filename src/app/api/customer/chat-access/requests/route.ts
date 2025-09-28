import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/api-helpers';

const prisma = new PrismaClient();

// GET: List chat access requests for customer
export async function GET(request: NextRequest) {
  try {
    // Use auth helper to verify customer role
    const authResult = await requireAuth(request, ['customer']);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const customer = authResult.user;
    const customerId = parseInt(customer.userId as string);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'PENDING', 'APPROVED', 'REJECTED' or null for all
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {
      customerId: customerId
    };

    if (status) {
      where.status = status.toUpperCase();
    }

    // Get chat access requests for this customer
    const [requests, totalCount] = await Promise.all([
      (prisma as any).chatAdminAccess.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          conversation: {
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
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      (prisma as any).chatAdminAccess.count({ where })
    ]);

    // Transform data for response
    const formattedRequests = requests.map((req: any) => ({
      id: req.id,
      orderId: req.conversation.orderId,
      requestedBy: req.admin,
      reason: req.reason,
      status: req.status,
      accessExpiresAt: req.expiresAt,
      requestedAt: req.createdAt,
      respondedAt: req.approvedAt,
      customerResponse: req.customerResponse,
      order: {
        id: req.conversation.orderId,
        provider: req.conversation.order.provider,
        service: {
          name: req.conversation.order.providerService.serviceTitle,
          category: req.conversation.order.providerService.category.name
        }
      }
    }));

    return NextResponse.json({
      success: true,
      data: formattedRequests,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching chat access requests:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}