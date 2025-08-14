import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET: View chat messages with access token
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
    const accessToken = searchParams.get('accessToken');
    const conversationId = searchParams.get('conversationId');

    if (!accessToken || !conversationId) {
      return NextResponse.json({ 
        error: 'accessToken and conversationId are required' 
      }, { status: 400 });
    }

    // Verify access token and check if it's still valid
    const chatAccess = await (prisma as any).chatAdminAccess.findFirst({
      where: {
        accessToken,
        conversationId: parseInt(conversationId),
        status: 'APPROVED',
        requestedByAdmin: admin.id
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
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    if (!chatAccess) {
      return NextResponse.json({ 
        error: 'Invalid access token or conversation not found' 
      }, { status: 404 });
    }

    // Check if access token has expired
    if (chatAccess.expiresAt && new Date() > chatAccess.expiresAt) {
      // Update status to expired
      await (prisma as any).chatAdminAccess.update({
        where: { id: chatAccess.id },
        data: { status: 'EXPIRED' }
      });

      return NextResponse.json({ 
        error: 'Access token has expired' 
      }, { status: 403 });
    }

    // Get chat messages
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const [messages, totalMessages] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { conversationId: parseInt(conversationId) },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { sentAt: 'asc' },
        skip: offset,
        take: limit
      }),
      prisma.chatMessage.count({
        where: { conversationId: parseInt(conversationId) }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        conversation: {
          id: chatAccess.conversation.id,
          title: chatAccess.conversation.conversationTitle,
          orderId: chatAccess.conversation.orderId,
          createdAt: chatAccess.conversation.createdAt,
          participants: chatAccess.conversation.participants.map((p: any) => ({
            userId: p.user.id,
            fullName: p.user.fullName,
            email: p.user.email,
            role: p.user.role.roleName
          }))
        },
        access: {
          requestId: chatAccess.id,
          grantedBy: chatAccess.customer,
          expiresAt: chatAccess.expiresAt,
          approvedAt: chatAccess.approvedAt
        },
        messages: messages.map(msg => ({
          id: msg.id,
          content: msg.messageContent,
          sender: {
            id: msg.sender.id,
            fullName: msg.sender.fullName,
            role: msg.sender.role.roleName
          },
          sentAt: msg.sentAt,
          readAt: msg.readAt
        })),
        pagination: {
          page,
          limit,
          total: totalMessages,
          totalPages: Math.ceil(totalMessages / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
