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
    // Validate Bearer token - admin only
    /*const authResult = await requireAuth(request, ['admin']);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }*/

    const url = new URL(request.url);
    
    // Parse data table parameters (search, sort, pagination)
    const tableParams = parseDataTableParams(url.searchParams);
    
    // Additional filters
    const status = url.searchParams.get('status');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const minAmount = url.searchParams.get('minAmount');
    const maxAmount = url.searchParams.get('maxAmount');
    
    // Validate sort field
    const validatedSortBy = validateSortField(tableParams.sortBy, SORT_FIELDS.orders);

    // Build where clause
    const whereClause: Record<string, any> = {};
    
    if (status) {
      whereClause.status = status;
    }

    if (dateFrom || dateTo) {
      whereClause.orderDate = {};
      if (dateFrom) {
        whereClause.orderDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        whereClause.orderDate.lte = new Date(dateTo);
      }
    }

    if (minAmount || maxAmount) {
      whereClause.finalAmount = {};
      if (minAmount) {
        whereClause.finalAmount.gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        whereClause.finalAmount.lte = parseFloat(maxAmount);
      }
    }

    // Add search functionality
    if (tableParams.search) {
      const searchWhere = buildSearchWhere(tableParams.search, SEARCH_FIELDS.orders);
      whereClause.AND = [searchWhere];
    }

    // Get total count for pagination
    const total = await prisma.order.count({ where: whereClause });

    // Build order by clause
    const orderBy = validatedSortBy 
      ? buildOrderBy(validatedSortBy, tableParams.sortOrder)
      : { orderDate: 'desc' };

    // Get orders with pagination
    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        id: true,
        orderDate: true,
        scheduledDate: true,
        status: true,
        jobAddress: true,
        district: true,
        subDistrict: true,
        ward: true,
        jobDescriptionNotes: true,
        finalAmount: true,
        information: true,
        createdAt: true,
        updatedAt: true,
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
            price: true,
            category: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy,
      skip: calculateSkip(tableParams.page, tableParams.limit),
      take: tableParams.limit
    });

    // Create standardized response
    const response = createDataTableResponse(orders, total, tableParams);
    
    return createSuccessResponse({
      ...response,
      filters: {
        status,
        dateFrom,
        dateTo,
        minAmount,
        maxAmount
      }
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
