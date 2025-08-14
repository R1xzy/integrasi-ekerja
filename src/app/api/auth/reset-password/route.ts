import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'), // [C-15]
  token: z.string().optional() // For future implementation with email verification
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = resetPasswordSchema.parse(body);
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    
    if (!user) {
      // Don't reveal if email exists for security
      return createSuccessResponse(null, 'If the email exists, a password reset has been processed');
    }
    
    if (!user.isActive) {
      return createErrorResponse('Account is not active', 401);
    }
    
    // Hash new password [A-1]
    const passwordHash = await bcrypt.hash(validatedData.newPassword, 12);
    
    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        updatedAt: new Date()
      }
    });
    
    return createSuccessResponse(null, 'Password reset successfully');
    
  } catch (error) {
    return handleApiError(error);
  }
}
