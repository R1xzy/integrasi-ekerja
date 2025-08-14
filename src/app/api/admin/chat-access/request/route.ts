import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// REQ-B-8.3: API endpoint bagi Admin untuk merequest melihat isi chat customer dengan provider
export async function POST(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { id: parseInt(decoded.userId) },
      include: { role: true }
    });

    if (!admin || admin.role.roleName !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { conversationId, reason } = body;

    // Validate required fields
    if (!conversationId) {
      return NextResponse.json({ 
        error: 'conversationId is required' 
      }, { status: 400 });
    }

    // Check if conversation exists
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              include: { role: true }
            }
          }
        },
        order: true
      }
    });

    if (!conversation) {
      return NextResponse.json({ 
        error: 'Conversation not found' 
      }, { status: 404 });
    }

    // Find customer in conversation
    const customerParticipant = conversation.participants.find(
      p => p.user.role.roleName === 'customer'
    );

    if (!customerParticipant) {
      return NextResponse.json({ 
        error: 'No customer found in this conversation' 
      }, { status: 400 });
    }

    // Check if there's already an active request
    const existingRequest = await (prisma as any).chatAdminAccess.findFirst({
      where: {
        conversationId,
        status: 'PENDING'
      }
    });

    if (existingRequest) {
      return NextResponse.json({ 
        error: 'There is already a pending access request for this conversation' 
      }, { status: 400 });
    }

    // Create chat access request
    const chatAccessRequest = await (prisma as any).chatAdminAccess.create({
      data: {
        conversationId,
        requestedByAdmin: admin.id,
        customerId: customerParticipant.userId,
        reason: reason || 'Admin needs to review this conversation',
        status: 'PENDING'
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

    return NextResponse.json({
      success: true,
      message: 'Chat access request created successfully',
      data: {
        requestId: chatAccessRequest.id,
        conversationId: chatAccessRequest.conversationId,
        requestedBy: chatAccessRequest.admin,
        customer: chatAccessRequest.customer,
        reason: chatAccessRequest.reason,
        status: chatAccessRequest.status,
        createdAt: chatAccessRequest.createdAt,
        conversation: {
          id: chatAccessRequest.conversation.id,
          title: chatAccessRequest.conversation.conversationTitle,
          orderId: chatAccessRequest.conversation.orderId,
          participants: chatAccessRequest.conversation.participants.map((p: any) => ({
            userId: p.user.id,
            fullName: p.user.fullName,
            email: p.user.email,
            role: p.user.role.roleName
          }))
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating chat access request:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// GET: List chat access requests for admin
export async function GET(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { id: parseInt(decoded.userId) },
      include: { role: true }
    });

    if (!admin || admin.role.roleName !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status.toUpperCase();
    }

    // Get chat access requests
    const [requests, total] = await Promise.all([
      (prisma as any).chatAdminAccess.findMany({
        where,
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
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      (prisma as any).chatAdminAccess.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: requests.map((req: any) => ({
        requestId: req.id,
        conversationId: req.conversationId,
        requestedBy: req.admin,
        customer: req.customer,
        reason: req.reason,
        status: req.status,
        accessToken: req.accessToken,
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
