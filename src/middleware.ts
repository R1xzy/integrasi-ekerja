import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get authentication cookies
  const authToken = request.cookies.get('auth-token');
  const userSession = request.cookies.get('user-session');
  
  // Check if user is authenticated
  const isAuthenticated = authToken && userSession;
  
  // Parse user role if authenticated
  let userRole = null;
  if (isAuthenticated && userSession) {
    try {
      const userData = JSON.parse(userSession.value);
      userRole = userData.role;
    } catch (error) {
      console.error('Error parsing user session:', error);
    }
  }

  // Protected routes that require authentication
  const protectedRoutes = ['/orders', '/dashboard', '/provider/dashboard', '/provider/orders', '/provider/services', '/provider/profile'];
  
  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute && !isAuthenticated) {
    // Redirect to login if not authenticated
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control
  if (isAuthenticated && userRole) {
    // Admin dashboard access
    if (pathname.startsWith('/dashboard') && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Provider dashboard access (only protect provider dashboard routes, not public /providers page)
    if (pathname.startsWith('/provider/') && userRole !== 'provider') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Customer orders access (only customers can access /orders)
    if (pathname.startsWith('/orders') && userRole !== 'customer') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Redirect authenticated users away from login/register pages
  if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else if (userRole === 'provider') {
      return NextResponse.redirect(new URL('/provider/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
