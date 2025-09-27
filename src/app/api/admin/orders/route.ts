import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse, requireAuth } from '@/lib/api-helpers';
import { 
  parseDataTableParams, 
  calculateSkip, 
  createDataTableResponse, 
  buildOrderBy, 
  buildSearchWhere, 
  validateSortField,
  SEARCH_FIELDS,
  SORT_FIELDS 
} from '@/lib/data-table-helpers';
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['admin']);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    // --- Menghitung Statistik Pesanan ---
    const [
        totalOrders,
        completedOrders,
        inProgressOrders,
        pendingOrders,
        cancelledOrders
    ] = await prisma.$transaction([
        prisma.order.count(),
        prisma.order.count({ where: { status: 'COMPLETED' } }),
        prisma.order.count({ where: { status: 'IN_PROGRESS' } }),
        prisma.order.count({ where: { status: 'PENDING_ACCEPTANCE' } }),
        prisma.order.count({ where: { 
            status: { in: ['CANCELLED_BY_CUSTOMER', 'REJECTED_BY_PROVIDER'] } 
        }}),
    ]);
    
    // --- Mengambil semua pesanan (tanpa paginasi untuk saat ini) ---
    // Logika paginasi Anda sebelumnya dapat ditambahkan kembali di sini jika diperlukan
    const orders = await prisma.order.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            profilePictureUrl: true, // Mengambil URL foto profil
          },
        },
        provider: {
          select: {
            id: true,
            fullName: true,
          },
        },
        providerService: {
          select: {
            id: true,
            serviceTitle: true,
          },
        },
      },
    });

    // --- Membuat nomor pesanan unik jika belum ada ---
    const ordersWithNumber = orders.map(order => ({
        ...order,
        orderNumber: `ORD-${order.id.toString().padStart(6, '0')}`
    }));

    return createSuccessResponse({
      orders: ordersWithNumber,
      // Menambahkan statistik ke dalam respons
      totalOrders,
      completedOrders,
      inProgressOrders,
      pendingOrders,
      cancelledOrders,
    }, 'Orders retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

// Update order status (admin action)
export async function PATCH(request: NextRequest) {
  try {
    /*// Validate Bearer token - admin only
    const authResult = await requireAuth(request, ['admin']);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }*/

    const body = await request.json();
    const { orderId, status, adminNotes } = body;

    if (!orderId) {
      return createErrorResponse('Order ID is required', 400);
    }

    if (!status) {
      return createErrorResponse('Status is required', 400);
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'];
    if (!validStatuses.includes(status)) {
      return createErrorResponse('Invalid status', 400);
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { select: { fullName: true } },
        provider: { select: { fullName: true } }
      }
    });

    if (!order) {
      return createErrorResponse('Order not found', 404);
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        information: adminNotes ? `${order.information || ''}\n[ADMIN] ${adminNotes}`.trim() : order.information,
        updatedAt: new Date()
      },
      select: {
        id: true,
        status: true,
        information: true,
        updatedAt: true,
        customer: {
          select: {
            fullName: true
          }
        },
        provider: {
          select: {
            fullName: true
          }
        }
      }
    });

    return createSuccessResponse(updatedOrder, `Order status updated to ${status}`);

  } catch (error) {
    return handleApiError(error);
  }
}
