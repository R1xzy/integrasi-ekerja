import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { loginSchema } from '@/lib/validations';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';
import { generateJWTTokenEdge } from '@/lib/jwt-edge';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = loginSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: { role: true }
    });

    if (!user) {
      return createErrorResponse('Invalid email or password', 401);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.passwordHash);

    if (!isPasswordValid) {
      return createErrorResponse('Invalid email or password', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      return createErrorResponse('Account is not active', 401);
    }

    // Generate JWT token sesuai [REQ-B-1.2]
    const token = await generateJWTTokenEdge(user);

    // Return user data dengan token (without password)
    const { passwordHash, ...userWithoutPassword } = user;

    // Prepare user session data for cookies
    const userSession = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role?.roleName || 'user',
      isActive: user.isActive
    };

    // Create response with cookies
    const response = createSuccessResponse({
      user: userWithoutPassword,
      token: token,
      tokenType: 'Bearer',
      expiresIn: '2h' // Sesuai [C-19]
    }, 'Login successful');

    // Set secure httpOnly cookies for authentication
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2, // 2 hours
      path: '/'
    });

    response.cookies.set('user-session', JSON.stringify(userSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', 
      maxAge: 60 * 60 * 2, // 2 hours
      path: '/'
    });

    return response;

  } catch (error) {
    return handleApiError(error);
  }
}
