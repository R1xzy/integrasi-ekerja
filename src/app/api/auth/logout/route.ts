import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, handleApiError } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    // Create response
    const response = createSuccessResponse(null, 'Logout successful');

    // Clear authentication cookies
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    });

    response.cookies.set('user-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  // Handle GET request for logout (redirect method)
  try {
    const response = NextResponse.redirect(new URL('/login', request.url));
    
    // Clear authentication cookies
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    response.cookies.set('user-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
