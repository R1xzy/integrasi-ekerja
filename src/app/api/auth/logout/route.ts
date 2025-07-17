import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Create response
    const response = NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );

    // Clear authentication cookies
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: false, // Set to false for development
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    });

    response.cookies.set('user-session', '', {
      httpOnly: true,
      secure: false, // Set to false for development
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    });

    // Also clear client-side cookies
    response.cookies.set('auth-token-client', '', {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    });

    response.cookies.set('user-session-client', '', {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Handle GET request for logout (redirect method)
  try {
    const response = NextResponse.redirect(new URL('/', request.url));
    
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
    return NextResponse.redirect(new URL('/', request.url));
  }
}
