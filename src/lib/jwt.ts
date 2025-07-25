import jwt from 'jsonwebtoken';

// JWT Secret - dalam production harus di environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '2h'; // Sesuai constraint [C-19] - 2 jam

export interface JWTPayload {
  userId: string;
  email: string;
  roleId: string;
  roleName: string;
  isActive: boolean;
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT token untuk user login
 * Sesuai [REQ-B-1.2] dan [C-19]
 */
export function generateJWTToken(user: {
  id: number;
  email: string;
  role: { id: number; roleName: string };
  isActive: boolean;
}): string {
  const payload: JWTPayload = {
    userId: user.id.toString(),
    email: user.email,
    roleId: user.role.id.toString(),
    roleName: user.role.roleName,
    isActive: user.isActive,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'e-kerja-api',
    audience: 'e-kerja-app'
  });
}

/**
 * Verify dan decode JWT token
 * Untuk middleware authentication
 */
export function verifyJWTToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'e-kerja-api',
      audience: 'e-kerja-app'
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Extract Bearer token dari Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Middleware untuk protected routes
 * Sesuai [REQ-B-1.4]
 */
export function createAuthMiddleware(allowedRoles?: string[]) {
  return (authHeader: string | null) => {
    const token = extractBearerToken(authHeader);
    
    if (!token) {
      return { success: false, message: 'Authorization token required', status: 401 };
    }

    const payload = verifyJWTToken(token);
    
    if (!payload) {
      return { success: false, message: 'Invalid or expired token', status: 401 };
    }

    if (!payload.isActive) {
      return { success: false, message: 'Account is not active', status: 401 };
    }

    // Check role-based access
    if (allowedRoles && !allowedRoles.includes(payload.roleName)) {
      return { 
        success: false, 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`, 
        status: 403 
      };
    }

    return { success: true, user: payload };
  };
}
