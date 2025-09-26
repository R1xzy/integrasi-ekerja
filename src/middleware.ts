import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWTTokenEdge, extractBearerToken } from '@/lib/jwt-edge';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get authentication from cookies or Authorization header
  const authTokenCookie = request.cookies.get('auth-token');
  const authHeader = request.headers.get('authorization');
  const userSessionCookie = request.cookies.get('user-session');
  
  // Try to get token from cookies first, then from header
  let token: string | undefined = authTokenCookie?.value;
  if (!token && authHeader) {
    const bearerToken = extractBearerToken(authHeader);
    token = bearerToken || undefined;
  }
  
  // Check if user is authenticated
  let isAuthenticated = false;
  let userRole = null;
  let userId = null;
  
  if (token) {
    const payload = await verifyJWTTokenEdge(token);
    if (payload && payload.isActive) {
      isAuthenticated = true;
      userRole = payload.roleName;
      userId = payload.userId;
    }
  }
  
  // Fallback to session cookie if JWT validation failed
  if (!isAuthenticated && userSessionCookie) {
    try {
      const userData = JSON.parse(userSessionCookie.value);
      if (userData.role) {
        userRole = userData.role;
        userId = userData.id;
        // Only consider authenticated if we have valid session data
        isAuthenticated = true;
      }
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
    
    if (pathname.startsWith('/customer') && userRole !== 'customer') {
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
