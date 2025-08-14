/**
 * Data Table Helper Utilities for REQ-B-12
 * Provides consistent query parameter handling for search, sort, and pagination
 */

export interface DataTableParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface DataTableResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  search?: string;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

/**
 * Parse data table query parameters from URLSearchParams
 */
export function parseDataTableParams(searchParams: URLSearchParams): DataTableParams {
  const search = searchParams.get('search') || undefined;
  const sortBy = searchParams.get('sortBy') || undefined;
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));

  return {
    search,
    sortBy,
    sortOrder,
    page,
    limit
  };
}

/**
 * Calculate skip value for pagination
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Create standardized data table response
 */
export function createDataTableResponse<T>(
  data: T[],
  total: number,
  params: DataTableParams
): DataTableResponse<T> {
  const totalPages = Math.ceil(total / params.limit);

  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1
    },
    search: params.search,
    sort: params.sortBy ? {
      field: params.sortBy,
      order: params.sortOrder || 'desc'
    } : undefined
  };
}

/**
 * Build Prisma orderBy clause from sort parameters
 */
export function buildOrderBy(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc'): any {
  if (!sortBy) {
    return { createdAt: 'desc' }; // Default sort
  }

  // Handle nested sorting (e.g., "user.fullName")
  if (sortBy.includes('.')) {
    const [relation, field] = sortBy.split('.');
    return {
      [relation]: {
        [field]: sortOrder
      }
    };
  }

  return { [sortBy]: sortOrder };
}

/**
 * Build Prisma where clause for text search across multiple fields
 */
export function buildSearchWhere(search: string, fields: readonly string[]): any {
  if (!search || search.trim().length === 0) {
    return {};
  }

  const searchTerm = search.trim();
  
  return {
    OR: fields.map(field => {
      // Handle nested fields (e.g., "user.fullName")
      if (field.includes('.')) {
        const [relation, nestedField] = field.split('.');
        return {
          [relation]: {
            [nestedField]: {
              contains: searchTerm
              // Note: MySQL doesn't support mode: 'insensitive', case sensitivity depends on collation
            }
          }
        };
      }

      return {
        [field]: {
          contains: searchTerm
          // Note: MySQL doesn't support mode: 'insensitive', case sensitivity depends on collation
        }
      };
    })
  };
}

/**
 * Validate sort field against allowed fields
 */
export function validateSortField(sortBy: string | undefined, allowedFields: readonly string[]): string | undefined {
  if (!sortBy) return undefined;
  
  // Check if sortBy is in allowed fields (including nested fields)
  const isAllowed = allowedFields.some(field => 
    field === sortBy || field.startsWith(sortBy + '.') || sortBy.startsWith(field + '.')
  );
  
  return isAllowed ? sortBy : undefined;
}

/**
 * Common search fields for different entities
 */
export const SEARCH_FIELDS = {
  users: ['fullName', 'email', 'phoneNumber'],
  providers: ['fullName', 'email', 'phoneNumber', 'providerBio'],
  orders: ['jobAddress', 'district', 'subDistrict', 'ward', 'customer.fullName', 'provider.fullName'],
  services: ['serviceTitle', 'description', 'provider.fullName', 'category.name'],
  reviews: ['comment', 'customer.fullName', 'provider.fullName'],
  faqs: ['question', 'answer', 'category']
} as const;

/**
 * Common sort fields for different entities
 */
export const SORT_FIELDS = {
  users: ['fullName', 'email', 'createdAt', 'isActive'],
  providers: ['fullName', 'email', 'createdAt', 'verificationStatus', 'isActive'],
  orders: ['orderDate', 'scheduledDate', 'status', 'finalAmount', 'customer.fullName', 'provider.fullName', 'createdAt'],
  services: ['serviceTitle', 'price', 'isAvailable', 'provider.fullName', 'category.name', 'createdAt'],
  reviews: ['rating', 'createdAt', 'customer.fullName', 'provider.fullName'],
  faqs: ['displayOrder', 'question', 'category', 'isActive', 'createdAt']
} as const;
