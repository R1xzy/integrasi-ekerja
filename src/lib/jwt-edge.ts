/**
 * JWT utilities compatible with both Edge Runtime and Node.js runtime
 */

import { SignJWT, jwtVerify, type JWTPayload as JoseJWTPayload } from 'jose';

// JWT Secret - dalam production harus di environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '2h'; // Sesuai constraint [C-19] - 2 jam

// Convert secret to Uint8Array for jose library
const encoder = new TextEncoder();
const secret = encoder.encode(JWT_SECRET);

export interface JWTPayload extends JoseJWTPayload {
  userId: string;
  email: string;
  roleId: string;
  roleName: string;
  isActive: boolean;
}

/**
 * Generate JWT token untuk user login using jose (Edge Runtime compatible)
 * Sesuai [REQ-B-1.2] dan [C-19]
 */
export async function generateJWTTokenEdge(user: {
  id: number;
  email: string;
  role: { id: number; roleName: string };
  isActive: boolean;
}): Promise<string> {
  const payload = {
    userId: user.id.toString(),
    email: user.email,
    roleId: user.role.id.toString(),
    roleName: user.role.roleName,
    isActive: user.isActive,
  };

  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('e-kerja-api')
    .setAudience('e-kerja-app')
    .setExpirationTime('2h')
    .sign(secret);

  return jwt;
}

/**
 * Verify dan decode JWT token using jose (Edge Runtime compatible)
 * Untuk middleware authentication
 */
export async function verifyJWTTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'e-kerja-api',
      audience: 'e-kerja-app'
    });
    
    return payload as unknown as JWTPayload;
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
 * Middleware untuk protected routes (Edge Runtime compatible)
 * Sesuai [REQ-B-1.4]
 */
export function createAuthMiddlewareEdge(allowedRoles?: string[]) {
  return async (authHeader: string | null) => {
    const token = extractBearerToken(authHeader);
    
    if (!token) {
      return { success: false, message: 'Authorization token required', status: 401 };
    }

    const payload = await verifyJWTTokenEdge(token);
    
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
