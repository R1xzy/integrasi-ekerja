import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { updateProfileSchema } from '@/lib/validations';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';
import { createAuthMiddleware } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    // Validate Bearer token - any authenticated user can get their profile
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware();
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication required', authResult.status || 401);
    }

    const userId = parseInt(authResult.user!.userId);

    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        providerServices: {
          include: {
            category: true
          }
        },
        providerPortfolios: true,
        providerDocuments: true
      }
    });
    
    if (!userProfile) {
      return createErrorResponse('User not found', 404);
    }
    
    // Remove sensitive data
    const { passwordHash, ...userWithoutPassword } = userProfile;
    
    return createSuccessResponse(userWithoutPassword, 'Profile retrieved successfully');
    
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Validate Bearer token - any authenticated user can update their profile
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware();
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication required', authResult.status || 401);
    }

    const userId = parseInt(authResult.user!.userId);
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);
    
    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...validatedData,
        updatedAt: new Date()
      },
      include: {
        role: true
      }
    });
    
    // Remove sensitive data
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    
    return createSuccessResponse(userWithoutPassword, 'Profile updated successfully');
    
  } catch (error) {
    return handleApiError(error);
  }
}
