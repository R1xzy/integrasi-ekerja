import { NextRequest, NextResponse } from 'next/server';
import { createAuthMiddleware } from '@/lib/jwt';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const resolvedParams = await params;
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const settingKey = decodeURIComponent(resolvedParams.key);

    // Get specific setting
    const setting = await prisma.setting.findUnique({
      where: { settingKey }
    });

    if (!setting) {
      return createErrorResponse('Setting not found', 404);
    }

    return createSuccessResponse(setting, 'Setting retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const resolvedParams = await params;
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const settingKey = decodeURIComponent(resolvedParams.key);
    const body = await request.json();
    const { settingValue, description } = body;

    // Validation
    if (!settingValue || settingValue.trim().length === 0) {
      return createErrorResponse('Setting value is required', 400);
    }

    if (settingValue.length > 1000) {
      return createErrorResponse('Setting value too long (max 1000 characters)', 400);
    }

    // Check if setting exists
    const existingSetting = await prisma.setting.findUnique({
      where: { settingKey }
    });

    if (!existingSetting) {
      return createErrorResponse('Setting not found', 404);
    }

    // Update setting
    const updatedSetting = await prisma.setting.update({
      where: { settingKey },
      data: {
        settingValue: settingValue.trim(),
        description: description?.trim() || null
      }
    });

    return createSuccessResponse(updatedSetting, 'Setting updated successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const resolvedParams = await params;
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const settingKey = decodeURIComponent(resolvedParams.key);

    // Check if setting exists
    const existingSetting = await prisma.setting.findUnique({
      where: { settingKey }
    });

    if (!existingSetting) {
      return createErrorResponse('Setting not found', 404);
    }

    // Delete setting
    await prisma.setting.delete({
      where: { settingKey }
    });

    return createSuccessResponse(null, 'Setting deleted successfully');

  } catch (error) {
    return handleApiError(error);
  }
}
