import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { updateProfileSchema } from '@/lib/validations';
import { handleApiError, createSuccessResponse, createErrorResponse, requireAuth } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    // Validate Bearer token - any authenticated user can get their profile
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    
    const userId = parseInt(authResult.user.userId as string);

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
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    
    const userId = parseInt(authResult.user.userId as string);
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
