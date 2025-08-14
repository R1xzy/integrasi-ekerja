import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiResponse } from './validations';

export function handleApiError(error: any): NextResponse {
  console.error('API Error:', error);

  // Validation errors (Zod)
  if (error instanceof ZodError) {
    const validationErrors = error.issues.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message
    }));
    
    return NextResponse.json({
      success: false,
      error: 'Validation failed',
      details: validationErrors
    }, { status: 400 });
  }

  // Prisma unique constraint error
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'field';
    return NextResponse.json({
      success: false,
      error: `${field} already exists`
    }, { status: 409 });
  }

  // Prisma not found error
  if (error.code === 'P2025') {
    return NextResponse.json({
      success: false,
      error: 'Resource not found'
    }, { status: 404 });
  }

  // Default error
  return NextResponse.json({
    success: false,
    error: 'Internal server error'
  }, { status: 500 });
}

export function createSuccessResponse<T>(data: T, message?: string): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message
  };
  
  return NextResponse.json(response);
}

export function createErrorResponse(error: string, status: number = 400): NextResponse {
  return NextResponse.json({
    success: false,
    error
  }, { status });
}

export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}
