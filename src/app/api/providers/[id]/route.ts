import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';
import { calculateProviderRating } from '@/lib/utils-backend';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const providerId = parseInt(params.id);
    
    // Get provider details
    const provider = await prisma.user.findFirst({
      where: {
        id: providerId,
        role: { roleName: 'provider' },
        isActive: true
      },
      include: {
        role: true,
        providerServices: {
          where: { isAvailable: true },
          include: {
            category: true
          }
        },
        providerPortfolios: {
          orderBy: { completedAt: 'desc' }
        },
        providerDocuments: {
          where: {
            documentType: 'SERTIFIKAT_PELATIHAN'
          }
        }
      }
    });
    
    if (!provider) {
      return createErrorResponse('Provider not found', 404);
    }
    
    // Calculate provider rating [C-11]
    const rating = await calculateProviderRating(providerId, prisma);
    
    // Get recent reviews with customer info
    const reviews = await prisma.review.findMany({
      where: {
        providerId,
        isShow: true // Only show visible reviews [C-11]
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            profilePictureUrl: true
          }
        },
        order: {
          select: {
            id: true,
            jobAddress: true,
            scheduledDate: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10 // Recent 10 reviews
    });
    
    // Count total reviews
    const reviewCount = await prisma.review.count({
      where: {
        providerId,
        isShow: true
      }
    });
    
    // Count completed orders
    const completedOrders = await prisma.order.count({
      where: {
        providerId,
        status: 'COMPLETED'
      }
    });
    
    // Remove sensitive data
    const { passwordHash, ...providerWithoutPassword } = provider;
    
    // Build response
    const providerDetails = {
      ...providerWithoutPassword,
      rating,
      reviewCount,
      completedOrders,
      reviews
    };
    
    return createSuccessResponse(providerDetails);
    
  } catch (error) {
    return handleApiError(error);
  }
}
