import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createAuthMiddleware } from '@/lib/jwt';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Validate Bearer token - admin only sesuai [C-2]
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication required', authResult.status || 401);
    }

    const adminId = parseInt(authResult.user!.userId);
    const providerId = parseInt(params.id);
    const body = await request.json();

    const { verificationStatus, notes } = body;

    if (!verificationStatus) {
      return createErrorResponse('Verification status is required', 400);
    }

    // Validate verification status
    const validStatuses = ['PENDING', 'VERIFIED', 'REJECTED'];
    if (!validStatuses.includes(verificationStatus)) {
      return createErrorResponse(`Invalid verification status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // Check if provider exists
    const provider = await prisma.user.findUnique({
      where: { 
        id: providerId,
        role: { roleName: 'provider' }
      },
      include: { role: true }
    });

    if (!provider) {
      return createErrorResponse('Provider not found', 404);
    }

    // Update verification status
    const updatedProvider = await prisma.user.update({
      where: { id: providerId },
      data: {
        verificationStatus,
        verifiedBy: verificationStatus === 'VERIFIED' ? adminId : null,
        verifiedAt: verificationStatus === 'VERIFIED' ? new Date() : null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        verificationStatus: true,
        verifiedBy: true,
        verifiedAt: true,
        role: {
          select: {
            id: true,
            roleName: true
          }
        }
      }
    });

    // Log verification activity (optional)
    console.log(`Admin ${adminId} ${verificationStatus.toLowerCase()} provider ${providerId}. Notes: ${notes || 'None'}`);

    return createSuccessResponse({
      provider: updatedProvider,
      notes: notes || null,
      verifiedBy: {
        id: adminId,
        email: authResult.user!.email
      }
    }, `Provider ${verificationStatus.toLowerCase()} successfully`);

  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Validate Bearer token - admin only untuk melihat verification detail
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication required', authResult.status || 401);
    }

    const providerId = parseInt(params.id);

    // Get provider verification details
    const provider = await prisma.user.findUnique({
      where: { 
        id: providerId,
        role: { roleName: 'provider' }
      },
      include: {
        role: true,
        verifier: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        providerDocuments: true
      }
    });

    if (!provider) {
      return createErrorResponse('Provider not found', 404);
    }

    return createSuccessResponse(provider, 'Provider verification details retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
}
