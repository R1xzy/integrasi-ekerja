import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  roleId: number;
}

export async function getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.name!,
      role: session.user.role,
      roleId: session.user.roleId,
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

      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      return handler(req, user);
    };
  };
}
