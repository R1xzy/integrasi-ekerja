import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createAuthMiddleware } from '@/lib/jwt';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

// REQ-B-5.4: API endpoint untuk mengubah status kehadiran Provider di lokasi
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } } // Perbaikan 1: Signature fungsi yang benar
) {
  try {
    console.log('🔄 PUT /api/orders/[id]/attendance - Provider attendance update');
    
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['provider']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication required', authResult.status || 401);
    }

    const providerId = parseInt(authResult.user!.userId);
    const orderId = parseInt(params.id); // Perbaikan 1: Mengambil ID dari params
    
    if (isNaN(orderId)) {
        return createErrorResponse('Invalid Order ID', 400);
    }
    
    const body = await request.json();

    console.log('🆔 Provider ID:', providerId, 'Order ID:', orderId);
    console.log('📦 Request body:', JSON.stringify(body, null, 2));

    const { attendanceStatus, arrivalTime, providerNotes } = body;

    if (!attendanceStatus) {
      return createErrorResponse('Attendance status is required', 400);
    }

    const validStatuses = ['ON_THE_WAY', 'ARRIVED', 'WORKING', 'COMPLETED'];
    if (!validStatuses.includes(attendanceStatus)) {
      return createErrorResponse(`Invalid attendance status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        provider: true, // Relasi langsung ke provider
        customer: true
      }
    });

    if (!order) {
      return createErrorResponse('Order not found', 404);
    }

    if (order.providerId !== providerId) {
      return createErrorResponse('Access denied. This order does not belong to you', 403);
    }

    if (order.status !== 'ACCEPTED' && order.status !== 'IN_PROGRESS') {
        return createErrorResponse('Can only update attendance for accepted or in-progress orders', 400);
    }

    const updateData: any = {
      providerAttendanceStatus: attendanceStatus,
      updatedAt: new Date()
    };

    if (attendanceStatus === 'ARRIVED' && arrivalTime) {
      updateData.providerArrivalTime = new Date(arrivalTime);
    } else if (attendanceStatus === 'ARRIVED' && !order.providerArrivalTime) {
      updateData.providerArrivalTime = new Date();
    }

    if (providerNotes) {
      updateData.providerNotes = providerNotes;
    }

    // Perbaikan 2: Pastikan hanya nilai enum yang valid yang digunakan untuk 'status'
    if (attendanceStatus === 'WORKING') {
      updateData.status = 'IN_PROGRESS'; // Ini adalah nilai yang valid
    } else if (attendanceStatus === 'COMPLETED') {
      updateData.status = 'COMPLETED'; // Ini juga nilai yang valid
    }

    console.log('💾 Updating order with data:', JSON.stringify(updateData, null, 2));

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

// Fungsi GET (tidak perlu diubah, tapi sertakan untuk kelengkapan)
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