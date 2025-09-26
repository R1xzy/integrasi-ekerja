import { NextRequest, NextResponse } from 'next/server';
import { createAuthMiddleware } from '@/lib/jwt';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Allow public access to individual FAQ if it's active
    const resolvedParams = await params;
    const faqId = parseInt(resolvedParams.id);
    const authHeader = request.headers.get('authorization');
    let isAdmin = false;
    
    if (authHeader) {
      const auth = createAuthMiddleware(['admin']);
      const authResult = auth(authHeader);
      isAdmin = authResult.success;
    }

    // Build where clause
    const whereClause: Record<string, any> = { id: faqId };
    
    if (!isAdmin) {
      whereClause.isActive = true; // Only show active FAQ for non-admin users
    }

    // Get FAQ
    const faq = await prisma.faq.findFirst({
      where: whereClause
    });

    if (!faq) {
      return createErrorResponse('FAQ not found', 404);
    }

    return createSuccessResponse(faq, 'FAQ retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate Bearer token - admin only
    /*const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }*/

    const resolvedParams = await params;
    const faqId = parseInt(resolvedParams.id);
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

    // Check if FAQ exists
    const existingFaq = await prisma.faq.findUnique({
      where: { id: faqId }
    });

    if (!existingFaq) {
      return createErrorResponse('FAQ not found', 404);
    }

    // Update FAQ
    const updatedFaq = await prisma.faq.update({
      where: { id: faqId },
      data: {
        question: question.trim(),
        answer: answer.trim(),
        category: category?.trim() || null,
        displayOrder: displayOrder !== undefined ? displayOrder : existingFaq.displayOrder,
        isActive: isActive !== undefined ? isActive : existingFaq.isActive
      }
    });

    return createSuccessResponse(updatedFaq, 'FAQ updated successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate Bearer token - admin only
    /*const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }*/

    const resolvedParams = await params;
    const faqId = parseInt(resolvedParams.id);

    // Check if FAQ exists
    const existingFaq = await prisma.faq.findUnique({
      where: { id: faqId }
    });

    if (!existingFaq) {
      return createErrorResponse('FAQ not found', 404);
    }

    // Delete FAQ
    await prisma.faq.delete({
      where: { id: faqId }
    });

    return createSuccessResponse(null, 'FAQ deleted successfully');

  } catch (error) {
    return handleApiError(error);
  }
}
