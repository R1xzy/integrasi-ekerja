import { NextRequest, NextResponse } from 'next/server';
import { createAuthMiddleware } from '@/lib/jwt';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const resolvedParams = await params;
    const customerId = parseInt(resolvedParams.id);

    // Get customer with detailed information
    const customer = await prisma.user.findFirst({
      where: { 
        id: customerId,
        role: {
          roleName: 'customer'
        }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        customerOrders: {
          select: {
            id: true,
            orderDate: true,
            status: true,
            finalAmount: true,
            provider: {
              select: {
                fullName: true
              }
            }
          },
          orderBy: {
            orderDate: 'desc'
          },
          take: 10 // Latest 10 orders
        },
        customerReviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            provider: {
              select: {
                fullName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5 // Latest 5 reviews
        },
        _count: {
          select: {
            customerOrders: true,
            customerReviews: true
          }
        }
      }
    });

    if (!customer) {
      return createErrorResponse('Customer not found', 404);
    }

    return createSuccessResponse(customer, 'Customer details retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const resolvedParams = await params;
    const customerId = parseInt(resolvedParams.id);
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return createErrorResponse('isActive must be a boolean', 400);
    }

    // Check if customer exists
    const customer = await prisma.user.findFirst({
      where: { 
        id: customerId,
        role: {
          roleName: 'customer'
        }
      }
    });

    if (!customer) {
      return createErrorResponse('Customer not found', 404);
    }

    // Update customer status
    const updatedCustomer = await prisma.user.update({
      where: { id: customerId },
      data: { isActive },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        updatedAt: true
      }
    });

    return createSuccessResponse(updatedCustomer, `Customer ${isActive ? 'activated' : 'deactivated'} successfully`);

  } catch (error) {
    return handleApiError(error);
  }
}
