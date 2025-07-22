import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { registerSchema } from '@/lib/validations';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    const validatedData = registerSchema.parse(body);
    
    // Check if email already exists [C-16]
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          ...(validatedData.phoneNumber ? [{ phoneNumber: validatedData.phoneNumber }] : [])
        ]
      }
    });
    
    if (existingUser) {
      if (existingUser.email === validatedData.email) {
        return createErrorResponse('Email already exists', 409);
      }
      if (existingUser.phoneNumber === validatedData.phoneNumber) {
        return createErrorResponse('Phone number already exists', 409);
      }
    }
    
    // Validate role exists
    const role = await prisma.role.findUnique({
      where: { id: validatedData.roleId }
    });
    
    if (!role) {
      return createErrorResponse('Invalid role', 400);
    }
    
    // Hash password [A-1]
    const passwordHash = await bcrypt.hash(validatedData.password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        fullName: validatedData.fullName,
        email: validatedData.email,
        passwordHash,
        phoneNumber: validatedData.phoneNumber || null,
        roleId: validatedData.roleId,
        // For providers, set default verification status
        verificationStatus: role.roleName === 'provider' ? 'PENDING' : 'VERIFIED'
      },
      include: {
        role: true
      }
    });
    
    // Remove sensitive data
    const { passwordHash: _, ...userWithoutPassword } = user;
    
    return createSuccessResponse(userWithoutPassword, 'User registered successfully');
    
  } catch (error) {
    return handleApiError(error);
  }
}
