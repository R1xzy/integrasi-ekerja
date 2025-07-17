import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password harus diisi' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Akun Anda tidak aktif' },
        { status: 401 }
      );
    }

    // Return user data (without password)
    const { passwordHash, ...userWithoutPassword } = user;
    
    console.log('Login: Full user object:', JSON.stringify(user, null, 2));
    console.log('Login: User role:', user.role);
    console.log('Login: Role name:', user.role?.roleName);

    // Create response with user data
    const response = NextResponse.json({
      message: 'Login berhasil',
      user: userWithoutPassword
    });

    // Set authentication cookies
    const cookieOptions = {
      httpOnly: true,
      secure: false, // Set to false for development
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    };

    // For development, also set non-httpOnly cookies for client access
    const clientCookieOptions = {
      httpOnly: false,
      secure: false,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    };

    // Set auth token cookie (simplified - in production use JWT)
    console.log('Login: Setting auth-token cookie for user:', user.id);
    response.cookies.set('auth-token', user.id.toString(), cookieOptions);
    response.cookies.set('auth-token-client', user.id.toString(), clientCookieOptions);
    
    // Set user session cookie with basic user info
    const sessionData = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role.roleName
    };
    console.log('Login: Setting user-session cookie:', sessionData);
    const sessionDataString = JSON.stringify(sessionData);
    response.cookies.set('user-session', sessionDataString, cookieOptions);
    response.cookies.set('user-session-client', encodeURIComponent(sessionDataString), clientCookieOptions);

    console.log('Login: Cookies set successfully');
    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
