import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const prisma = new PrismaClient();

import { requireAuth } from '@/lib/api-helpers';

// REQ-B-8.4: API endpoint bagi Customer untuk mengenerate akses lihat chat kepada Admin
export async function POST(request: NextRequest) {
  try {
    // Use new auth helper
    const authResult = await requireAuth(request, ['customer']);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const customer = authResult.user;
    const customerId = parseInt(customer.userId as string);

    const body = await request.json();
    const { requestId, action, response, accessHours } = body;

    // Validate required fields
    if (!requestId || !action) {
      return NextResponse.json({ 
        error: 'requestId and action are required' 
      }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ 
        error: 'action must be either "approve" or "reject"' 
      }, { status: 400 });
    }

    // Find the chat access request
    const accessRequest = await (prisma as any).chatAdminAccess.findUnique({
      where: { id: requestId },
      include: {
        conversation: true,
        admin: {
          select: {
            id: true,
            fullName: true,
            email: true
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

    if (!accessRequest) {
      return NextResponse.json({ 
        error: 'Chat access request not found' 
      }, { status: 404 });
    }

    // Check if customer is authorized to respond to this request
    if (accessRequest.customerId !== customerId) {
      return NextResponse.json({ 
        error: 'You are not authorized to respond to this request' 
      }, { status: 403 });
    }

    // Check if request is still pending
    if (accessRequest.status !== 'PENDING') {
      return NextResponse.json({ 
        error: 'This request has already been responded to' 
      }, { status: 400 });
    }

    let updateData: any = {
      status: action === 'approve' ? 'APPROVED' : 'REJECTED',
      customerResponse: response,
      approvedAt: new Date()
    };

    // If approved, generate access token and set expiration
    if (action === 'approve') {
      const accessToken = crypto.randomBytes(32).toString('hex');
      const hours = accessHours || 24; // Default 24 hours
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + hours);

      updateData.accessToken = accessToken;
      updateData.expiresAt = expiresAt;
    }

    // Update the access request
    const updatedRequest = await (prisma as any).chatAdminAccess.update({
      where: { id: requestId },
      data: updateData,
      include: {
        conversation: {
          include: {
            order: true,
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true
                  }
                }
              }
            }
          }
        },
        admin: {
          select: {
            id: true,
            fullName: true,
            email: true
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

    const responseMessage = action === 'approve' 
      ? 'Chat access approved successfully' 
      : 'Chat access request rejected';

    return NextResponse.json({
      success: true,
      message: responseMessage,
      data: {
        requestId: updatedRequest.id,
        conversationId: updatedRequest.conversationId,
        admin: updatedRequest.admin,
        customer: updatedRequest.customer,
        status: updatedRequest.status,
        accessToken: updatedRequest.accessToken,
        expiresAt: updatedRequest.expiresAt,
        customerResponse: updatedRequest.customerResponse,
        approvedAt: updatedRequest.approvedAt,
        conversation: {
          id: updatedRequest.conversation.id,
          title: updatedRequest.conversation.conversationTitle,
          orderId: updatedRequest.conversation.orderId,
          participants: updatedRequest.conversation.participants.map((p: any) => ({
            userId: p.user.id,
            fullName: p.user.fullName,
            email: p.user.email,
            role: p.user.role.roleName
          }))
        }
      }
    });

  } catch (error) {
    console.error('Error responding to chat access request:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// GET: List pending chat access requests for customer
export async function GET(request: NextRequest) {
  try {
    // Use new auth helper
    const authResult = await requireAuth(request, ['customer']);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const customer = authResult.user;
    const customerId = parseInt(customer.userId as string);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Get chat access requests for this customer
    const [requests, total] = await Promise.all([
      (prisma as any).chatAdminAccess.findMany({
        where: {
          customerId: customerId,
          status: status.toUpperCase()
        },
        include: {
          conversation: {
            include: {
              order: true,
              participants: {
                include: {
                  user: {
                    select: {
                      id: true,
                      fullName: true,
                      email: true,
                      role: true
                    }
                  }
                }
              }
            }
          },
          admin: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      (prisma as any).chatAdminAccess.count({
        where: {
          customerId: customerId,
          status: status.toUpperCase()
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: requests.map((req: any) => ({
        requestId: req.id,
        conversationId: req.conversationId,
        admin: req.admin,
        reason: req.reason,
        status: req.status,
        customerResponse: req.customerResponse,
        expiresAt: req.expiresAt,
        approvedAt: req.approvedAt,
        createdAt: req.createdAt,
        conversation: {
          id: req.conversation.id,
          title: req.conversation.conversationTitle,
          orderId: req.conversation.orderId,
          participants: req.conversation.participants.map((p: any) => ({
            userId: p.user.id,
            fullName: p.user.fullName,
            email: p.user.email,
            role: p.user.role.roleName
          }))
        }
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
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
