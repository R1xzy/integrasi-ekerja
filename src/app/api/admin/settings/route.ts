import { NextRequest, NextResponse } from 'next/server';
import { createAuthMiddleware } from '@/lib/jwt';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    // Get all application settings
    const settings = await prisma.setting.findMany({
      orderBy: {
        settingKey: 'asc'
      }
    });

    // Convert to key-value object for easier consumption
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.settingKey] = {
        value: setting.settingValue,
        description: setting.description
      };
      return acc;
    }, {} as Record<string, { value: string; description?: string | null }>);

    return createSuccessResponse({
      settings: settingsObject,
      count: settings.length
    }, 'Application settings retrieved successfully');

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
    const { settingKey, settingValue, description } = body;

    // Validation
    if (!settingKey || settingKey.trim().length === 0) {
      return createErrorResponse('Setting key is required', 400);
    }

    if (!settingValue || settingValue.trim().length === 0) {
      return createErrorResponse('Setting value is required', 400);
    }

    if (settingKey.length > 100) {
      return createErrorResponse('Setting key too long (max 100 characters)', 400);
    }

    if (settingValue.length > 1000) {
      return createErrorResponse('Setting value too long (max 1000 characters)', 400);
    }

    // Check if setting already exists
    const existingSetting = await prisma.setting.findUnique({
      where: { settingKey: settingKey.trim() }
    });

    if (existingSetting) {
      return createErrorResponse('Setting key already exists', 409);
    }

    // Create new setting
    const setting = await prisma.setting.create({
      data: {
        settingKey: settingKey.trim(),
        settingValue: settingValue.trim(),
        description: description?.trim() || null
      }
    });

    return createSuccessResponse(setting, 'Application setting created successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const body = await request.json();
    const { settings } = body;

    // Validation
    if (!settings || !Array.isArray(settings)) {
      return createErrorResponse('Settings array is required', 400);
    }

    if (settings.length === 0) {
      return createErrorResponse('At least one setting is required', 400);
    }

    // Validate each setting
    for (const setting of settings) {
      if (!setting.settingKey || !setting.settingValue) {
        return createErrorResponse('Each setting must have settingKey and settingValue', 400);
      }
    }

    // Update settings in transaction
    const updatedSettings = await prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const setting of settings) {
        const result = await tx.setting.upsert({
          where: { settingKey: setting.settingKey },
          update: {
            settingValue: setting.settingValue,
            description: setting.description || null
          },
          create: {
            settingKey: setting.settingKey,
            settingValue: setting.settingValue,
            description: setting.description || null
          }
        });
        results.push(result);
      }
      
      return results;
    });

    return createSuccessResponse({
      settings: updatedSettings,
      count: updatedSettings.length
    }, 'Application settings updated successfully');

  } catch (error) {
    return handleApiError(error);
  }
}
