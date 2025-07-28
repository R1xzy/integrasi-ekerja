import { NextRequest, NextResponse } from 'next/server';
import { createAuthMiddleware } from '@/lib/jwt';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

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

    // Build where clause
    const whereClause: Record<string, any> = {};
    
    if (!isAdmin) {
      whereClause.isActive = true; // Only show active FAQs for non-admin users
    }
    
    if (category) {
      whereClause.category = category;
    }

    // Get FAQs
    const faqs = await prisma.faq.findMany({
      where: whereClause,
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return createSuccessResponse({
      faqs,
      count: faqs.length,
      isAdmin
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
