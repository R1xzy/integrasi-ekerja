import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse } from '@/lib/api-helpers';

/**
 * GET /api/service-categories
 * Public endpoint untuk mendapatkan semua kategori layanan
 * [REQ-B-4.1] - Service discovery and filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Get all service categories dengan count services
    const categories = await prisma.serviceCategory.findMany({
      include: {
        _count: {
          select: {
            providerServices: {
              where: {
                isAvailable: true,
                provider: {
                  isActive: true,
                  verificationStatus: 'VERIFIED'
                }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Transform data untuk response yang lebih clean
    const categoriesWithCount = categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      iconUrl: category.iconUrl,
      serviceCount: category._count.providerServices,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }));

    return createSuccessResponse(categoriesWithCount, 'Service categories retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
}
