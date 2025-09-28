import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/api-helpers';
import crypto from 'crypto';

const prisma = new PrismaClient();

// PUT: Grant or revoke admin access to specific conversation
export async function PUT(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    // Use auth helper to verify customer role
    const authResult = await requireAuth(request, ['customer']);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const customer = authResult.user;
    const customerId = parseInt(customer.userId as string);
    const conversationId = parseInt(params.conversationId);

    if (isNaN(conversationId)) {
      return NextResponse.json({ 
        error: 'Invalid conversation ID' 
      }, { status: 400 });
    }

    const body = await request.json();
    const { grantAccess, accessHours = 24 } = body;

    if (typeof grantAccess !== 'boolean') {
      return NextResponse.json({ 
        error: 'grantAccess must be a boolean value' 
      }, { status: 400 });
    }

    // Check if conversation exists and customer is participant
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
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
                serviceTitle: true
              }
            }
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ 
        error: 'Conversation not found or you do not have access to it' 
      }, { status: 404 });
    }

    if (grantAccess) {
      // Grant access - create or update access record
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + accessHours);
      
      // Generate access token for security
      const accessToken = crypto.randomBytes(32).toString('hex');

      // Check if there's an existing access record
      const existingAccess = await (prisma as any).chatAdminAccess.findFirst({
        where: {
          conversationId: conversationId,
          customerId: customerId,
          status: 'APPROVED'
        }
      });

      let accessRecord;

      if (existingAccess) {
        // Update existing access
        accessRecord = await (prisma as any).chatAdminAccess.update({
          where: { id: existingAccess.id },
          data: {
            accessToken: accessToken,
            expiresAt: expiresAt,
            approvedAt: new Date(),
            updatedAt: new Date()
          }
        });
      } else {
        // Create new access record (for direct customer grant)
        accessRecord = await (prisma as any).chatAdminAccess.create({
          data: {
            conversationId: conversationId,
            requestedByAdmin: 1, // Default admin ID - this should be configurable
            customerId: customerId,
            status: 'APPROVED',
            accessToken: accessToken,
            reason: 'Direct access granted by customer',
            customerResponse: 'Approved',
            expiresAt: expiresAt,
            approvedAt: new Date()
          }
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Admin access granted successfully',
        data: {
          conversationId: conversationId,
          accessGranted: true,
          expiresAt: accessRecord.expiresAt,
          grantedAt: accessRecord.approvedAt
        }
      });

    } else {
      // Revoke access - expire all active access records
      await (prisma as any).chatAdminAccess.updateMany({
        where: {
          conversationId: conversationId,
          customerId: customerId,
          status: 'APPROVED',
          expiresAt: {
            gt: new Date()
          }
        },
        data: {
          expiresAt: new Date(), // Set expiry to now
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Admin access revoked successfully',
        data: {
          conversationId: conversationId,
          accessGranted: false,
          revokedAt: new Date()
        }
      });
    }

  } catch (error) {
    console.error('Error toggling conversation access:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// GET: Get access status for specific conversation
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    // Use auth helper to verify customer role
    const authResult = await requireAuth(request, ['customer']);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const customer = authResult.user;
    const customerId = parseInt(customer.userId as string);
    const conversationId = parseInt(params.conversationId);

    if (isNaN(conversationId)) {
      return NextResponse.json({ 
        error: 'Invalid conversation ID' 
      }, { status: 400 });
    }

    // Check if conversation exists and customer is participant
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: customerId
          }
        }
      },
      include: {
        order: true,
        adminAccess: {
          where: {
            customerId: customerId,
            status: 'APPROVED'
          },
          orderBy: {
            approvedAt: 'desc'
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ 
        error: 'Conversation not found or you do not have access to it' 
      }, { status: 404 });
    }

    // Check for active access
    const now = new Date();
    const activeAccess = conversation.adminAccess.find((access: any) => 
      access.expiresAt && new Date(access.expiresAt) > now
    );

    return NextResponse.json({
      success: true,
      data: {
        conversationId: conversationId,
        orderId: conversation.orderId,
        hasActiveAccess: !!activeAccess,
        accessDetails: activeAccess ? {
          expiresAt: activeAccess.expiresAt,
          grantedAt: activeAccess.approvedAt,
          accessToken: activeAccess.accessToken
        } : null,
        allAccessRecords: conversation.adminAccess.map((access: any) => ({
          id: access.id,
          status: access.status,
          expiresAt: access.expiresAt,
          grantedAt: access.approvedAt,
          isActive: access.expiresAt && new Date(access.expiresAt) > now
        }))
      }
    });

  } catch (error) {
    console.error('Error getting conversation access status:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}