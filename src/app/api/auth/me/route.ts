import { NextRequest, NextResponse } from 'next/server';
import { createAuthMiddleware } from '@/lib/jwt';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('Auth/me: Checking Bearer token...');
    
    // Get Authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Auth/me: authHeader:', authHeader ? 'exists' : 'missing');

    // Use JWT middleware untuk validasi
    const auth = createAuthMiddleware();
    const authResult = auth(authHeader);

    if (!authResult.success) {
      console.log('Auth/me: Authentication failed:', authResult.message);
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    // Get fresh user data dari database
    const user = await prisma.user.findUnique({
      where: { id: parseInt(authResult.user!.userId) },
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
        userId: authResult.user!.userId,
        roleName: authResult.user!.roleName,
        isActive: authResult.user!.isActive
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
