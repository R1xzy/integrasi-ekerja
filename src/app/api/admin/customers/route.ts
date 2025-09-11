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
    const authResult = await requireAuth(request, ['admin']);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const url = new URL(request.url);
    
    // Parse data table parameters (search, sort, pagination)
    const tableParams = parseDataTableParams(url.searchParams);
    
    // Additional filters
    const isActive = url.searchParams.get('isActive');
    const verificationStatus = url.searchParams.get('verificationStatus');
    
    // Validate sort field
    const validatedSortBy = validateSortField(tableParams.sortBy, SORT_FIELDS.users);

    // Build where clause
    const whereClause: Record<string, any> = {
      role: {
        roleName: 'customer'
      }
    };
    
    if (isActive !== null) {
      whereClause.isActive = isActive === 'true';
    }

    // Add search functionality
    if (tableParams.search) {
      const searchWhere = buildSearchWhere(tableParams.search, SEARCH_FIELDS.users);
      whereClause.AND = [searchWhere];
    }

    // Get total count for pagination
    const total = await prisma.user.count({ where: whereClause });

    // Build order by clause
    const orderBy = validatedSortBy 
      ? buildOrderBy(validatedSortBy, tableParams.sortOrder)
      : { createdAt: 'desc' };

    // Get customers with pagination
    const customers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Count related data
        _count: {
          select: {
            customerOrders: true,
            customerReviews: true
          }
        }
      },
      orderBy,
      skip: calculateSkip(tableParams.page, tableParams.limit),
      take: tableParams.limit
    });

    // Create standardized response
    const response = createDataTableResponse(customers, total, tableParams);
    
    return createSuccessResponse(response, 'Customers retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

// Update customer status
export async function PATCH(request: NextRequest) {
  try {
    // Validate Bearer token - admin only
    const authResult = await requireAuth(request, ['admin']);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const body = await request.json();
    const { customerId, isActive } = body;

    if (!customerId) {
      return createErrorResponse('Customer ID is required', 400);
    }

    if (typeof isActive !== 'boolean') {
      return createErrorResponse('isActive must be a boolean', 400);
    }

    // Check if customer exists
    const customer = await prisma.user.findFirst({
      where: { 
        id: customerId,
        role: {
          roleName: 'customer'
        }
      }
    });

    if (!customer) {
      return createErrorResponse('Customer not found', 404);
    }

    // Update customer status
    const updatedCustomer = await prisma.user.update({
      where: { id: customerId },
      data: { isActive },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return createSuccessResponse(updatedCustomer, `Customer ${isActive ? 'activated' : 'deactivated'} successfully`);

  } catch (error) {
    return handleApiError(error);
  }
}
