import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createAuthMiddleware } from '@/lib/jwt';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

export async function PUT(request: NextRequest, { params }: { params: { id: string; detailId: string } }) {
  try {
    // Validate Bearer token - customer or provider
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['customer', 'provider']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const orderId = parseInt(params.id);
    const detailId = parseInt(params.detailId);
    const userId = parseInt(authResult.user!.userId);
    const userRole = authResult.user!.roleName;

    if (isNaN(orderId) || isNaN(detailId)) {
      return createErrorResponse('Invalid order ID or detail ID', 400);
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON body', 400);
    }

    const { status } = body;

    // Validate required fields
    if (!status) {
      return createErrorResponse('Missing required field: status', 400);
    }

    // Validate status values
    const validStatuses = ['PROPOSED', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return createErrorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // Check if order detail exists
    const orderDetail = await prisma.orderDetail.findUnique({
      where: { id: detailId },
      include: {
        order: {
          select: {
            id: true,
            customerId: true,
            providerId: true,
            status: true
          }
        },
        addedByUser: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    if (!orderDetail) {
      return createErrorResponse('Order detail not found', 404);
    }

    if (orderDetail.orderId !== orderId) {
      return createErrorResponse('Order detail does not belong to the specified order', 400);
    }

    // Check access permissions
    if (userRole === 'customer' && orderDetail.order.customerId !== userId) {
      return createErrorResponse('Access denied. You can only update details of your own orders', 403);
    }
    
    if (userRole === 'provider' && orderDetail.order.providerId !== userId) {
      return createErrorResponse('Access denied. You can only update details of orders assigned to you', 403);
    }

    // Business logic: Only the opposite party can approve/reject
    // If added by customer, only provider can approve/reject
    // If added by provider, only customer can approve/reject
    if (status !== 'PROPOSED') {
      const isAddedByCustomer = orderDetail.addedByUser.id === orderDetail.order.customerId;
      const isAddedByProvider = orderDetail.addedByUser.id === orderDetail.order.providerId;

      if (userRole === 'customer' && isAddedByCustomer) {
        return createErrorResponse('You cannot approve/reject order details you added yourself. Only the provider can approve/reject your additions', 403);
      }

      if (userRole === 'provider' && isAddedByProvider) {
        return createErrorResponse('You cannot approve/reject order details you added yourself. Only the customer can approve/reject your additions', 403);
      }
    }

    // Check if order status allows updating details
    const allowedOrderStatuses = ['PENDING_ACCEPTANCE', 'ACCEPTED', 'IN_PROGRESS'];
    if (!allowedOrderStatuses.includes(orderDetail.order.status)) {
      return createErrorResponse('Cannot update order detail status. Order must be pending acceptance, accepted, or in progress', 400);
    }

    // Update order detail status
    const updatedOrderDetail = await prisma.orderDetail.update({
      where: { id: detailId },
      data: { status },
      include: {
        addedByUser: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    return createSuccessResponse(updatedOrderDetail, 'Order detail status updated successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; detailId: string } }) {
  try {
    // Validate Bearer token - customer or provider
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['customer', 'provider']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const orderId = parseInt(params.id);
    const detailId = parseInt(params.detailId);
    const userId = parseInt(authResult.user!.userId);
    const userRole = authResult.user!.roleName;

    if (isNaN(orderId) || isNaN(detailId)) {
      return createErrorResponse('Invalid order ID or detail ID', 400);
    }

    // Check if order detail exists
    const orderDetail = await prisma.orderDetail.findUnique({
      where: { id: detailId },
      include: {
        order: {
          select: {
            id: true,
            customerId: true,
            providerId: true,
            status: true
          }
        }
      }
    });

    if (!orderDetail) {
      return createErrorResponse('Order detail not found', 404);
    }

    if (orderDetail.orderId !== orderId) {
      return createErrorResponse('Order detail does not belong to the specified order', 400);
    }

    // Check access permissions - only the user who added the detail can delete it
    if (orderDetail.addedByUserId !== userId) {
      return createErrorResponse('Access denied. You can only delete order details you added yourself', 403);
    }

    // Check if order status allows deleting details
    const allowedOrderStatuses = ['PENDING_ACCEPTANCE', 'ACCEPTED', 'IN_PROGRESS'];
    if (!allowedOrderStatuses.includes(orderDetail.order.status)) {
      return createErrorResponse('Cannot delete order detail. Order must be pending acceptance, accepted, or in progress', 400);
    }

    // Only allow deletion of PROPOSED or REJECTED details
    if (orderDetail.status === 'APPROVED') {
      return createErrorResponse('Cannot delete approved order details', 400);
    }

    // Delete order detail
    await prisma.orderDetail.delete({
      where: { id: detailId }
    });

    return createSuccessResponse(null, 'Order detail deleted successfully');

  } catch (error) {
    return handleApiError(error);
  }
}
