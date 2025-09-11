import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, requireAuth } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('Auth/me: Checking Bearer token...');
    
    // Use new auth helper
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const userPayload = authResult.user;

    // Get fresh user data dari database
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userPayload.userId) },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        address: true,
        profilePictureUrl: true,
        isActive: true,
        verifiedBy: true,
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

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    console.log('Auth/me: User authenticated successfully:', user.email);
    
    return createSuccessResponse({
      user: user,
      isAuthenticated: true,
      tokenInfo: {
        userId: userPayload.userId,
        roleName: userPayload.roleName,
        isActive: userPayload.isActive
      }
    }, 'User profile retrieved successfully');

  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    );
  }
}
