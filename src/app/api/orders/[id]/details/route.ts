import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createAuthMiddleware } from '@/lib/jwt';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Validate Bearer token - customer or provider
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['customer', 'provider']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const orderId = parseInt(params.id);
    const userId = parseInt(authResult.user!.userId);
    const userRole = authResult.user!.roleName;

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

    const { description, quantity, pricePerUnit } = body;

    // Validate required fields
    if (!description || !quantity || !pricePerUnit) {
      return createErrorResponse('Missing required fields: description, quantity, pricePerUnit', 400);
    }

    if (quantity <= 0 || pricePerUnit < 0) {
      return createErrorResponse('Quantity must be greater than 0 and pricePerUnit must be non-negative', 400);
    }

    // Check if order exists and user has access
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        customerId: true,
        providerId: true,
        status: true
      }
    });

    if (!order) {
      return createErrorResponse('Order not found', 404);
    }

    // Check access permissions
    if (userRole === 'customer' && order.customerId !== userId) {
      return createErrorResponse('Access denied. You can only add details to your own orders', 403);
    }
    
    if (userRole === 'provider' && order.providerId !== userId) {
      return createErrorResponse('Access denied. You can only add details to orders assigned to you', 403);
    }

    // Check if order status allows adding details
    const allowedStatuses = ['PENDING_ACCEPTANCE', 'ACCEPTED', 'IN_PROGRESS'];
    if (!allowedStatuses.includes(order.status)) {
      return createErrorResponse('Cannot add order details. Order status must be pending acceptance, accepted, or in progress', 400);
    }

    // Create order detail
    const orderDetail = await prisma.orderDetail.create({
      data: {
        orderId,
        description: description.trim(),
        quantity: parseInt(quantity.toString()),
        pricePerUnit: parseFloat(pricePerUnit.toString()),
        addedByUserId: userId,
        status: 'PROPOSED' // Default status for new order details
      },
      include: {
        addedByUser: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    return createSuccessResponse(orderDetail, 'Order detail added successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Validate Bearer token - customer, provider, or admin
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['customer', 'provider', 'admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const orderId = parseInt(params.id);
    const userId = parseInt(authResult.user!.userId);
    const userRole = authResult.user!.roleName;

    if (isNaN(orderId)) {
      return createErrorResponse('Invalid order ID', 400);
    }

    // Check if order exists and user has access
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        customerId: true,
        providerId: true
      }
    });

    if (!order) {
      return createErrorResponse('Order not found', 404);
    }

    // Check access permissions
    if (userRole === 'customer' && order.customerId !== userId) {
      return createErrorResponse('Access denied. You can only view details of your own orders', 403);
    }
    
    if (userRole === 'provider' && order.providerId !== userId) {
      return createErrorResponse('Access denied. You can only view details of orders assigned to you', 403);
    }

    // Get order details
    const orderDetails = await prisma.orderDetail.findMany({
      where: { orderId },
      include: {
        addedByUser: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Calculate totals
    const totalApproved = orderDetails
      .filter(detail => detail.status === 'APPROVED')
      .reduce((sum, detail) => sum + (detail.quantity * detail.pricePerUnit), 0);

    const totalProposed = orderDetails
      .filter(detail => detail.status === 'PROPOSED')
      .reduce((sum, detail) => sum + (detail.quantity * detail.pricePerUnit), 0);

    const summary = {
      totalItems: orderDetails.length,
      totalApproved,
      totalProposed,
      grandTotal: totalApproved + totalProposed
    };

    const response = {
      orderDetails,
      summary
    };

    return createSuccessResponse(response, `Found ${orderDetails.length} order details`);

  } catch (error) {
    return handleApiError(error);
  }
}
