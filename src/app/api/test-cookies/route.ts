import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('Test cookies endpoint called');
  
  // Get all cookies
  const cookies = request.cookies.getAll();
  console.log('All cookies:', cookies);
  
  // Specifically check our auth cookies
  const authToken = request.cookies.get('auth-token');
  const userSession = request.cookies.get('user-session');
  
  console.log('Auth token:', authToken);
  console.log('User session:', userSession);
  
  return NextResponse.json({
    message: 'Cookie test',
    allCookies: cookies,
    authToken: authToken?.value || null,
    userSession: userSession?.value || null,
    cookieCount: cookies.length
  });
}
