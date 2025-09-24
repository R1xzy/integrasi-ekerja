import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createAuthMiddleware } from '@/lib/jwt';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';
import { calculateFinalAmount } from '@/lib/utils-backend'; // Helper baru

interface RouteParams {
  params: { id: string; detailId: string };
}

// Handler untuk Customer menyetujui/menolak biaya tambahan
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['customer', 'provider']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const orderId = parseInt(params.id);
    const detailId = parseInt(params.detailId);
    const customerId = parseInt(authResult.user!.userId);
    const { status } = await request.json();

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return createErrorResponse('Invalid status provided', 400);
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, customerId: customerId },
    });

    if (!order) {
      return createErrorResponse('Order not found or access denied', 404);
    }
    
    // 1. Update status item biaya tambahan
    const updatedDetail = await prisma.orderDetail.update({
      where: { id: detailId },
      data: { status },
    });

    // 2. Hitung ulang total biaya akhir (finalAmount)
    const newFinalAmount = await calculateFinalAmount(orderId);

    // 3. Update finalAmount di tabel Order utama
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { finalAmount: newFinalAmount },
    });

    return createSuccessResponse({
      detail: updatedDetail,
      order: { finalAmount: updatedOrder.finalAmount }
    }, `Cost detail status updated to ${status}`);

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
