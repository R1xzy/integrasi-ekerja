import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Auth/me: Checking cookies...');
    const authToken = request.cookies.get('auth-token');
    const userSession = request.cookies.get('user-session');
    
    console.log('Auth/me: authToken:', authToken ? 'exists' : 'missing');
    console.log('Auth/me: userSession:', userSession ? 'exists' : 'missing');

    if (!authToken || !userSession) {
      console.log('Auth/me: No valid cookies found');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse user session data
    const userData = JSON.parse(userSession.value);
    console.log('Auth/me: Parsed user data:', userData);

    return NextResponse.json({
      user: userData,
      isAuthenticated: true
    });

  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    );
  }
}
