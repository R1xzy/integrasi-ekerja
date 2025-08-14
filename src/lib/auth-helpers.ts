import { NextRequest, NextResponse } from 'next/server';
import { verifyJWTToken, JWTPayload } from './jwt';

export interface AuthenticatedUser {
  id: string;
  email: string;
  roleId: string;
  roleName: string;
  isActive: boolean;
}

export async function getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = verifyJWTToken(token);
    
    if (!payload) {
      return null;
    }

    return {
      id: payload.userId,
      email: payload.email,
      roleId: payload.roleId,
      roleName: payload.roleName,
      isActive: payload.isActive,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export function requireAuth(handler: (req: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return handler(req, user);
  };
}

export function requireRole(allowedRoles: string[]) {
  return function(handler: (req: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>) {
    return async (req: NextRequest) => {
      const user = await getAuthenticatedUser(req);
      
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (!allowedRoles.includes(user.roleName)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      return handler(req, user);
    };
  };
}
