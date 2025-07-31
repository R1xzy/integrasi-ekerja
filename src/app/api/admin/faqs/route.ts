import { NextRequest, NextResponse } from 'next/server';
import { createAuthMiddleware } from '@/lib/jwt';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';
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
    // For FAQ retrieval, allow access without authentication (public FAQ)
    // But if admin is requesting, show all including inactive
    const authHeader = request.headers.get('authorization');
    let isAdmin = false;
    
    if (authHeader) {
      const auth = createAuthMiddleware(['admin']);
      const authResult = auth(authHeader);
      isAdmin = authResult.success;
    }

    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    
    // Parse data table parameters (search, sort, pagination)
    const tableParams = parseDataTableParams(url.searchParams);
    
    // Validate sort field
    const validatedSortBy = validateSortField(tableParams.sortBy, SORT_FIELDS.faqs);

    // Build where clause
    const whereClause: Record<string, any> = {};
    
    if (!isAdmin) {
      whereClause.isActive = true; // Only show active FAQs for non-admin users
    }
    
    if (category) {
      whereClause.category = category;
    }

    // Add search functionality
    if (tableParams.search) {
      const searchWhere = buildSearchWhere(tableParams.search, SEARCH_FIELDS.faqs);
      whereClause.AND = [whereClause, searchWhere];
    }

    // Get total count for pagination
    const total = await prisma.faq.count({ where: whereClause });

    // Build order by clause - default to displayOrder asc, then createdAt desc
    let orderBy;
    if (validatedSortBy) {
      orderBy = buildOrderBy(validatedSortBy, tableParams.sortOrder);
    } else {
      orderBy = [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ];
    }

    // Get FAQs with pagination
    const faqs = await prisma.faq.findMany({
      where: whereClause,
      orderBy,
      skip: calculateSkip(tableParams.page, tableParams.limit),
      take: tableParams.limit
    });

    // Create standardized response
    const response = createDataTableResponse(faqs, total, tableParams);
    
    return createSuccessResponse({
      ...response,
      isAdmin,
      category
    }, 'FAQs retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const body = await request.json();
    const { question, answer, category, displayOrder, isActive } = body;

    // Validation
    if (!question || question.trim().length === 0) {
      return createErrorResponse('Question is required', 400);
    }

    if (!answer || answer.trim().length === 0) {
      return createErrorResponse('Answer is required', 400);
    }

    if (question.length > 500) {
      return createErrorResponse('Question too long (max 500 characters)', 400);
    }

    if (answer.length > 2000) {
      return createErrorResponse('Answer too long (max 2000 characters)', 400);
    }

    // Create new FAQ
    const faq = await prisma.faq.create({
      data: {
        question: question.trim(),
        answer: answer.trim(),
        category: category?.trim() || null,
        displayOrder: displayOrder || 0,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return createSuccessResponse(faq, 'FAQ created successfully');

  } catch (error) {
    return handleApiError(error);
  }
}
