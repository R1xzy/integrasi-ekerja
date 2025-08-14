import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createPaginatedResponse } from '@/lib/api-helpers';
import { parsePaginationParams, calculateSkip, calculateProviderRating } from '@/lib/utils-backend';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const { page, limit } = parsePaginationParams(url.searchParams);
    const skip = calculateSkip(page, limit);
    
    // Filter parameters
    const categoryId = url.searchParams.get('categoryId');
    const district = url.searchParams.get('district');
    const search = url.searchParams.get('search');
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');
    const verified = url.searchParams.get('verified') === 'true';
    const sortBy = url.searchParams.get('sortBy') || 'createdAt'; // createdAt, price, rating
    const sortOrder = url.searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
    
    // Build where clause
    const where: any = {
      isAvailable: true,
      provider: {
        isActive: true,
        ...(verified && { verificationStatus: 'VERIFIED' })
      }
    };
    
    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }
    
    if (search) {
      where.OR = [
        { serviceTitle: { contains: search } },
        { description: { contains: search } },
        { provider: { fullName: { contains: search } } }
      ];
    }
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    
    // Get services with basic provider info
    const services = await prisma.providerService.findMany({
      where,
      include: {
        category: true,
        provider: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profilePictureUrl: true,
            providerBio: true,
            verificationStatus: true,
            address: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: sortBy === 'rating' ? { createdAt: sortOrder } : { [sortBy]: sortOrder }
    });
    
    // Calculate rating for each provider [C-11]
    const servicesWithRating = await Promise.all(
      services.map(async (service) => {
        const rating = await calculateProviderRating(service.providerId, prisma);
        
        // Count total reviews for this provider
        const reviewCount = await prisma.review.count({
          where: {
            providerId: service.providerId,
            isShow: true // Only count visible reviews [C-11]
          }
        });
        
        return {
          ...service,
          provider: {
            ...service.provider,
            rating,
            reviewCount
          }
        };
      })
    );
    
    // Sort by rating if requested (since we calculated it after query)
    if (sortBy === 'rating') {
      servicesWithRating.sort((a, b) => {
        const ratingA = a.provider.rating;
        const ratingB = b.provider.rating;
        return sortOrder === 'desc' ? ratingB - ratingA : ratingA - ratingB;
      });
    }
    
    // Get total count for pagination
    const total = await prisma.providerService.count({ where });
    
    return createPaginatedResponse(servicesWithRating, page, limit, total);
    
  } catch (error) {
    return handleApiError(error);
  }
}

// GET service categories for filtering
export async function POST(req: NextRequest) {
  try {
    const categories = await prisma.serviceCategory.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        iconUrl: true,
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
    
    return createPaginatedResponse(categories, 1, categories.length, categories.length);
    
  } catch (error) {
    return handleApiError(error);
  }
}
