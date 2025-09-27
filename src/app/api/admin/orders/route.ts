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
// src/app/api/admin/orders/route.ts


export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['admin']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // --- 1. MENGHITUNG STATISTIK PESANAN (DIGABUNGKAN) ---
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

    // --- 2. LOGIKA FILTER, SORT, DAN PAGINATION ANDA (TETAP SAMA) ---
    const url = new URL(request.url);
    const tableParams = parseDataTableParams(url.searchParams);
    // ... (Filter, sort, where clause Anda tidak perlu diubah)
    const status = url.searchParams.get('status');
    const validatedSortBy = validateSortField(tableParams.sortBy, SORT_FIELDS.orders);
    const whereClause: Record<string, any> = {};
    if (status) {
      whereClause.status = status;
    }
    if (tableParams.search) {
      whereClause.AND = [buildSearchWhere(tableParams.search, SEARCH_FIELDS.orders)];
    }
    const orderBy = validatedSortBy 
      ? buildOrderBy(validatedSortBy, tableParams.sortOrder)
      : { createdAt: 'desc' };


    // --- 3. PERBAIKAN PADA QUERY UTAMA ---
    const orders = await prisma.order.findMany({
      where: whereClause,
      // Menggunakan 'include' agar lebih jelas dan pasti mengambil semua data relasi
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            profilePictureUrl: true,
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
      orderBy,
      skip: calculateSkip(tableParams.page, tableParams.limit),
      take: tableParams.limit
    });

    // Menambahkan nomor pesanan unik
    const ordersWithNumber = orders.map(order => ({
        ...order,
        orderNumber: `ORD-${order.id.toString().padStart(6, '0')}`
    }));

    // --- 4. MEMBUAT RESPON SESUAI KEBUTUHAN FRONTEND ---
    return createSuccessResponse({
      orders: ordersWithNumber,
      // Menyertakan statistik di dalam respons
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
