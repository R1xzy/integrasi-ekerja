import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse, requireAuth } from '@/lib/api-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Validate Bearer token - customer, provider, or admin
    const authResult = await requireAuth(request, ['customer', 'provider', 'admin']);
    if (authResult instanceof Response) return authResult;

    const { id } = await params;
    const orderId = parseInt(id);
    const userId = parseInt(authResult.user.userId as string);
    const userRole = authResult.user.roleName as string;

    if (isNaN(orderId)) {
      return createErrorResponse('Invalid order ID', 400);
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true
          }
        },
        provider: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true
          }
        },
        providerService: {
          select: {
            id: true,
            serviceTitle: true,
            description: true,
            price: true,
            priceUnit: true,
            category: {
              select: {
                id: true,
                name: true,
                iconUrl: true
              }
            }
          }
        },
        orderDetails: {
          include: {
            addedByUser: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        },
        payment: true,
        review: true
      }
    });

    if (!order) {
      return createErrorResponse('Order not found', 404);
    }

    // Check access permissions
    if (userRole === 'customer' && order.customerId !== userId) {
      return createErrorResponse('Access denied. You can only view your own orders', 403);
    }
    
    if (userRole === 'provider' && order.providerId !== userId) {
      return createErrorResponse('Access denied. You can only view orders assigned to you', 403);
    }

    return createSuccessResponse(order, 'Order retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Validate Bearer token - provider or admin
    const authResult = await requireAuth(request, ['provider', 'admin']);
    if (authResult instanceof Response) return authResult;

    const { id } = await params;
    const orderId = parseInt(id);
    const userId = parseInt(authResult.user.userId as string);
    const userRole = authResult.user.roleName as string;

    if (isNaN(orderId)) {
      return createErrorResponse('Invalid order ID', 400);
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON body', 400);
    }

    const { status, information } = body;

    // Validate required fields
    if (!status) {
      return createErrorResponse('Missing required field: status', 400);
    }

    // Validate status values
    const validStatuses = [
      'PENDING_ACCEPTANCE',
      'ACCEPTED',
      'REJECTED_BY_PROVIDER',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED_BY_CUSTOMER',
      'DISPUTED'
    ];

    if (!validStatuses.includes(status)) {
      return createErrorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true
          }
        },
        provider: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    if (!existingOrder) {
      return createErrorResponse('Order not found', 404);
    }

    // Check permissions
    if (userRole === 'provider' && existingOrder.providerId !== userId) {
      return createErrorResponse('Access denied. You can only update orders assigned to you', 403);
    }

    // Validate status transitions for providers
    if (userRole === 'provider') {
      const providerAllowedStatuses = ['ACCEPTED', 'REJECTED_BY_PROVIDER', 'IN_PROGRESS', 'COMPLETED'];
      if (!providerAllowedStatuses.includes(status)) {
        return createErrorResponse(`Providers can only set status to: ${providerAllowedStatuses.join(', ')}`, 400);
      }

      // Special validation for rejection
      if (status === 'REJECTED_BY_PROVIDER' && !information) {
        return createErrorResponse('Rejection reason (information) is required when rejecting an order', 400);
      }
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        information: information?.trim() || existingOrder.information,
        updatedAt: new Date()
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true
          }
        },
        provider: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true
          }
        },
        providerService: {
          select: {
            id: true,
            serviceTitle: true,
            description: true,
            price: true,
            priceUnit: true
          }
        }
      }
    });

    return createSuccessResponse(updatedOrder, 'Order status updated successfully');

  } catch (error) {
    return handleApiError(error);
  }
}
