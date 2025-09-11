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
    const validatedSortBy = validateSortField(tableParams.sortBy, SORT_FIELDS.providers);

    // Build where clause
    const whereClause: Record<string, any> = {
      role: {
        roleName: 'provider'
      }
    };
    
    if (isActive !== null) {
      whereClause.isActive = isActive === 'true';
    }

    if (verificationStatus) {
      whereClause.verificationStatus = verificationStatus;
    }

    // Add search functionality
    if (tableParams.search) {
      const searchWhere = buildSearchWhere(tableParams.search, SEARCH_FIELDS.providers);
      whereClause.AND = [searchWhere];
    }

    // Get total count for pagination
    const total = await prisma.user.count({ where: whereClause });

    // Build order by clause
    const orderBy = validatedSortBy 
      ? buildOrderBy(validatedSortBy, tableParams.sortOrder)
      : { createdAt: 'desc' };

    // Get providers with pagination
    const providers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        verificationStatus: true,
        providerBio: true,
        createdAt: true,
        updatedAt: true,
        verifiedAt: true,
        verifier: {
          select: {
            fullName: true
          }
        },
        // Count related data
        _count: {
          select: {
            providerServices: true,
            providerOrders: true,
            providerReviews: true
          }
        }
      },
      orderBy,
      skip: calculateSkip(tableParams.page, tableParams.limit),
      take: tableParams.limit
    });

    // Create standardized response
    const response = createDataTableResponse(providers, total, tableParams);
    
    return createSuccessResponse(response, 'Providers retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

// Update provider status/verification
export async function PATCH(request: NextRequest) {
  try {
    // Validate Bearer token - admin only
    const authResult = await requireAuth(request, ['admin']);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const body = await request.json();
    const { providerId, isActive, verificationStatus } = body;

    if (!providerId) {
      return createErrorResponse('Provider ID is required', 400);
    }

    // Check if provider exists
    const provider = await prisma.user.findFirst({
      where: { 
        id: providerId,
        role: {
          roleName: 'provider'
        }
      }
    });

    if (!provider) {
      return createErrorResponse('Provider not found', 404);
    }

    // Prepare update data
    const updateData: any = {};
    
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

    if (verificationStatus && ['PENDING', 'VERIFIED', 'REJECTED'].includes(verificationStatus)) {
      updateData.verificationStatus = verificationStatus;
      
      if (verificationStatus === 'VERIFIED') {
        updateData.verifiedAt = new Date();
        updateData.verifiedBy = authResult.user?.userId;
      } else if (verificationStatus === 'REJECTED') {
        updateData.verifiedAt = null;
        updateData.verifiedBy = null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return createErrorResponse('No valid fields to update', 400);
    }

    // Update provider
    const updatedProvider = await prisma.user.update({
      where: { id: providerId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        verificationStatus: true,
        verifiedAt: true,
        updatedAt: true,
        verifier: {
          select: {
            fullName: true
          }
        }
      }
    });

    let message = 'Provider updated successfully';
    if (verificationStatus === 'VERIFIED') {
      message = 'Provider verified successfully';
    } else if (verificationStatus === 'REJECTED') {
      message = 'Provider verification rejected';
    } else if (typeof isActive === 'boolean') {
      message = `Provider ${isActive ? 'activated' : 'deactivated'} successfully`;
    }

    return createSuccessResponse(updatedProvider, message);

  } catch (error) {
    return handleApiError(error);
  }
}
