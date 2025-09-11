import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiResponse } from './validations';

export function handleApiError(error: any): NextResponse {
  console.error('API Error:', error);

  // Validation errors (Zod)
  if (error instanceof ZodError) {
    const validationErrors = error.issues.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message
    }));
    
    return NextResponse.json({
      success: false,
      error: 'Validation failed',
      details: validationErrors
    }, { status: 400 });
  }

  // Prisma unique constraint error
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'field';
    return NextResponse.json({
      success: false,
      error: `${field} already exists`
    }, { status: 409 });
  }

  // Prisma not found error
  if (error.code === 'P2025') {
    return NextResponse.json({
      success: false,
      error: 'Resource not found'
    }, { status: 404 });
  }

  // Default error
  return NextResponse.json({
    success: false,
    error: 'Internal server error'
  }, { status: 500 });
}

export function createSuccessResponse<T>(data: T, message?: string): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message
  };
  
  return NextResponse.json(response);
}

export function createErrorResponse(error: string, status: number = 400): NextResponse {
  return NextResponse.json({
    success: false,
    error
  }, { status });
}

export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}

// Import JWT helpers for API authentication
import { verifyJWTTokenEdge, extractBearerToken, JWTPayload } from './jwt-edge';
import type { NextRequest } from 'next/server';

/**
 * Authenticate user from request headers or cookies
 */
export async function authenticateRequest(request: NextRequest): Promise<{
  isAuthenticated: boolean;
  user?: JWTPayload;
  error?: string;
}> {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  let token: string | null = null;
  
  if (authHeader) {
    token = extractBearerToken(authHeader);
  }
  
  // Fallback to cookies
  if (!token) {
    const authCookie = request.cookies.get('auth-token');
    token = authCookie?.value || null;
  }
  
  if (!token) {
    return {
      isAuthenticated: false,
      error: 'No authentication token provided'
    };
  }
  
  const payload = await verifyJWTTokenEdge(token);
  
  if (!payload) {
    return {
      isAuthenticated: false,
      error: 'Invalid or expired token'
    };
  }
  
  if (!payload.isActive) {
    return {
      isAuthenticated: false,
      error: 'Account is not active'
    };
  }
  
  return {
    isAuthenticated: true,
    user: payload
  };
}

/**
 * Require authentication and optionally specific roles
 */
export async function requireAuth(
  request: NextRequest,
  allowedRoles?: string[]
): Promise<{ user: JWTPayload } | NextResponse> {
  const auth = await authenticateRequest(request);
  
  if (!auth.isAuthenticated || !auth.user) {
    return createErrorResponse(auth.error || 'Authentication required', 401);
  }
  
  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(auth.user.roleName)) {
    return createErrorResponse(
      `Access denied. Required roles: ${allowedRoles.join(', ')}`,
      403
    );
  }
  
  return { user: auth.user };
}
