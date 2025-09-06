import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { registerSchema } from '@/lib/validations';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('🔄 Registration request received:', JSON.stringify(body, null, 2));
    
    // Extract verification code from request
    const { verificationCode, ...registrationData } = body;
    
    // Validate verification code is provided
    if (!verificationCode) {
      return createErrorResponse('Email verification code is required. Please request verification code first.', 400);
    }
    
    console.log('🔐 Verification code provided:', verificationCode);
    
    // Validate request body (without verification code)
    const validatedData = registerSchema.parse(registrationData);
    console.log('✅ Registration data validated');
    
    // Verify email verification code first
    console.log('🔍 Verifying email verification code...');
    const { verifyCode } = await import('@/lib/emailService');
    
    const verification = await verifyCode(validatedData.email, verificationCode, 'REGISTRATION');
    
    if (!verification) {
      console.log('❌ Email verification failed');
      return createErrorResponse('Invalid or expired email verification code', 400);
    }
    
    console.log('✅ Email verification successful');
    
    // Check if email already exists [C-16]
    console.log('🔍 Checking if email already exists...');
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
        console.log('❌ Email already exists');
        return createErrorResponse('Email already exists', 409);
      }
      if (existingUser.phoneNumber === validatedData.phoneNumber) {
        console.log('❌ Phone number already exists');
        return createErrorResponse('Phone number already exists', 409);
      }
    }
    
    console.log('✅ Email and phone available');
    
    // Validate role exists
    console.log('🔍 Validating role...');
    const role = await prisma.role.findUnique({
      where: { id: validatedData.roleId }
    });
    
    if (!role) {
      console.log('❌ Invalid role');
      return createErrorResponse('Invalid role', 400);
    }
    
    console.log('✅ Role validated:', role.roleName);
    
    // Hash password [A-1]
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(validatedData.password, 12);
    
    // Create user
    console.log('💾 Creating user in database...');
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
    
    console.log('✅ User created successfully:', user.id);
    
    // Mark email verification as used by deleting it (security)
    console.log('🗑️ Cleaning up email verification code...');
    await (prisma as any).emailVerification.deleteMany({
      where: {
        email: validatedData.email,
        type: 'REGISTRATION'
      }
    });
    
    console.log('✅ Email verification code cleaned up');
    
    // Remove sensitive data
    const { passwordHash: _, ...userWithoutPassword } = user;
    
    return createSuccessResponse(userWithoutPassword, 'User registered successfully with verified email');
    
  } catch (error) {
    console.error('💥 Registration error:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    return handleApiError(error);
  }
}
