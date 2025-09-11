import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createAuthMiddleware } from '@/lib/jwt';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

// REQ-B-5.4: API endpoint untuk mengubah status kehadiran Provider di lokasi
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 PUT /api/orders/[id]/attendance - Provider attendance update');
    
    // Validate Bearer token - provider only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['provider']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication required', authResult.status || 401);
    }

    const providerId = parseInt(authResult.user!.userId);
    const orderId = parseInt(params.id);
    const body = await request.json();

    console.log('🆔 Provider ID:', providerId, 'Order ID:', orderId);
    console.log('📦 Request body:', JSON.stringify(body, null, 2));

    // Validate request body
    const { attendanceStatus, arrivalTime, providerNotes } = body;

    if (!attendanceStatus) {
      return createErrorResponse('Attendance status is required', 400);
    }

    // Validate attendance status
    const validStatuses = ['ON_THE_WAY', 'ARRIVED', 'WORKING', 'COMPLETED'];
    if (!validStatuses.includes(attendanceStatus)) {
      return createErrorResponse(`Invalid attendance status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    console.log('✅ Attendance status validated:', attendanceStatus);

    // Get order and validate
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        providerService: {
          include: {
            provider: true
          }
        },
        customer: true
      }
    });

    if (!order) {
      return createErrorResponse('Order not found', 404);
    }

    // Validate provider ownership
    if (order.providerService.provider.id !== providerId) {
      return createErrorResponse('Access denied. This order does not belong to you', 403);
    }

    // Validate order status - must be accepted
    if (order.status !== 'ACCEPTED') {
      return createErrorResponse('Can only update attendance for accepted orders', 400);
    }

    console.log('✅ Order validation passed');

    // Prepare update data
    const updateData: any = {
      providerAttendanceStatus: attendanceStatus,
      updatedAt: new Date()
    };

    // Set arrival time if status is ARRIVED and arrivalTime provided
    if (attendanceStatus === 'ARRIVED' && arrivalTime) {
      updateData.providerArrivalTime = new Date(arrivalTime);
    } else if (attendanceStatus === 'ARRIVED' && !order.providerArrivalTime) {
      // Auto-set arrival time if not already set
      updateData.providerArrivalTime = new Date();
    }

    // Set provider notes if provided
    if (providerNotes) {
      updateData.providerNotes = providerNotes;
    }

    // Auto-update order status based on attendance
    if (attendanceStatus === 'WORKING') {
      updateData.status = 'IN_PROGRESS';
    } else if (attendanceStatus === 'COMPLETED') {
      updateData.status = 'COMPLETED';
    }

    console.log('💾 Updating order with data:', JSON.stringify(updateData, null, 2));

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData
    });

    console.log('✅ Order attendance updated successfully');

    return createSuccessResponse({
      orderId: updatedOrder.id,
      attendanceStatus: updatedOrder.providerAttendanceStatus,
      arrivalTime: updatedOrder.providerArrivalTime,
      orderStatus: updatedOrder.status,
      providerNotes: updatedOrder.providerNotes,
      updatedAt: updatedOrder.updatedAt
    }, `Provider attendance updated to ${attendanceStatus}`);

  } catch (error) {
    console.error('💥 Error updating provider attendance:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    return handleApiError(error);
  }
}

// GET endpoint to check current attendance status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 GET /api/orders/[id]/attendance - Get attendance status');
    
    // Validate Bearer token - provider or customer
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['provider', 'customer']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication required', authResult.status || 401);
    }

    const userId = parseInt(authResult.user!.userId);
    const userRole = authResult.user!.roleName;
    const orderId = parseInt(params.id);

    console.log('🆔 User ID:', userId, 'Role:', userRole, 'Order ID:', orderId);

    // Get order with attendance info
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        providerService: {
          include: {
            provider: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true
              }
            }
          }
        },
        customer: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    if (!order) {
      return createErrorResponse('Order not found', 404);
    }

    // Validate access
    const isProvider = userRole === 'provider' && order.providerService.provider.id === userId;
    const isCustomer = userRole === 'customer' && order.customerId === userId;

    if (!isProvider && !isCustomer) {
      return createErrorResponse('Access denied. Order does not belong to you', 403);
    }

    console.log('✅ Access validated');

    return createSuccessResponse({
      orderId: order.id,
      orderStatus: order.status,
      attendanceStatus: order.providerAttendanceStatus,
      arrivalTime: order.providerArrivalTime,
      providerNotes: order.providerNotes,
      scheduledDate: order.scheduledDate,
      jobAddress: order.jobAddress,
      provider: order.providerService.provider,
      customer: order.customer
    }, 'Attendance status retrieved successfully');

  } catch (error) {
    console.error('💥 Error getting attendance status:', error);
    return handleApiError(error);
  }
}
