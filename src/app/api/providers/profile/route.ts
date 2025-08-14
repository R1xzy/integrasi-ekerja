import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createAuthMiddleware } from '@/lib/jwt';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    // Validate Bearer token - provider only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['provider']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication required', authResult.status || 401);
    }

    const providerId = parseInt(authResult.user!.userId);

    // Get provider profile
    const provider = await prisma.user.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        address: true,
        profilePictureUrl: true,
        providerBio: true,
        verificationStatus: true,
        verifiedAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            roleName: true
          }
        }
      }
    });

    if (!provider) {
      return createErrorResponse('Provider not found', 404);
    }

    return createSuccessResponse(provider, 'Provider profile retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Validate Bearer token - provider only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['provider']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication required', authResult.status || 401);
    }

    const providerId = parseInt(authResult.user!.userId);
    const body = await request.json();

    // Validate input
    const { fullName, phoneNumber, address, providerBio } = body;

    if (!fullName || !phoneNumber) {
      return createErrorResponse('Full name and phone number are required', 400);
    }

    // Update provider profile
    const updatedProvider = await prisma.user.update({
      where: { id: providerId },
      data: {
        fullName,
        phoneNumber,
        address: address || null,
        providerBio: providerBio || null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        address: true,
        profilePictureUrl: true,
        providerBio: true,
        verificationStatus: true,
        verifiedAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            roleName: true
          }
        }
      }
    });

    return createSuccessResponse(updatedProvider, 'Provider profile updated successfully');

  } catch (error) {
    return handleApiError(error);
  }
}
