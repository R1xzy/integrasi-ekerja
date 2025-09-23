import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse, requireAuth } from '@/lib/api-helpers';
import { z } from 'zod';

const attendanceSchema = z.object({
  attendanceStatus: z.enum(['ON_THE_WAY', 'ARRIVED', 'WORKING', 'COMPLETED']),
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireAuth(request, ['provider']);
    if (authResult instanceof Response) {
      return authResult;
    }

    // PERBAIKAN 1: 'params.id' tidak perlu di-await secara eksplisit
    // karena definisi fungsi modern sudah menanganinya, tapi kita pastikan
    // variabelnya didefinisikan dengan benar.
    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      return createErrorResponse('Invalid Order ID', 400);
    }
    
    const providerId = parseInt(authResult.user.userId as string); 
    
    const body = await request.json();
    const validatedData = attendanceSchema.parse(body);

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        providerId: providerId,
      },
    });

    if (!order) {
      return createErrorResponse('Order not found or you are not authorized for this order', 404);
    }
    
    if (order.status !== 'ACCEPTED') {
        return createErrorResponse(`Cannot update attendance for an order with status: ${order.status}`, 400);
    }

    const updateData: any = {
      providerAttendanceStatus: validatedData.attendanceStatus,
    };

    if (validatedData.attendanceStatus === 'ARRIVED') {
        // PERBAIKAN 2: Memastikan nilai status sesuai dengan ENUM di Prisma Schema
        // Berdasarkan schema Anda, nilai yang benar adalah 'PROVIDER_SELF_VERIFIED'
        updateData.status = 'PROVIDER_SELF_VERIFIED'; 
        updateData.providerArrivalTime = new Date();
    }
    
    const updatedOrder = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: updateData,
    });

    return createSuccessResponse(updatedOrder, 'Provider attendance updated successfully');

  } catch (error) {
    console.error('💥 Error updating provider attendance:', error);
    return handleApiError(error);
  }
}