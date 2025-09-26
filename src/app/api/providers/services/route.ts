import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse, requireAuth } from '@/lib/api-helpers';


export async function GET(request: NextRequest) {
  try {
    // Validate Bearer token - provider only
    const authResult = await requireAuth(request, ['provider']);
    if (authResult instanceof Response) return authResult;

    const providerId = parseInt(authResult.user.userId as string);

    // 1. Ambil data layanan, termasuk hitungan pesanan (orders)
    const servicesWithCount = await prisma.providerService.findMany({
      where: { providerId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            iconUrl: true
          }
        },
        // PERBAIKAN: Hanya menghitung 'orders' (relasi langsung ProviderService)
        _count: {
            select: {
                orders: true,
            }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // 2. Iterasi dan Hitung Rata-rata Rating serta Review Count (Agregasi Berlapis)
    const servicesWithStats = await Promise.all(servicesWithCount.map(async (service) => {
        
        // Agregasi Review: Cari reviews yang order-nya terhubung ke service ini
        const reviewAggregation = await prisma.review.aggregate({
            _avg: {
                rating: true, // Ambil rata-rata rating
            },
            _count: {
                id: true, // Hitung jumlah review
            },
            where: {
                // PERBAIKAN: Mencari review yang Order-nya terhubung ke ProviderService ini
                order: { 
                    providerServiceId: service.id,
                },
                isShow: true, // Hanya hitung review yang terlihat
            },
        });
        
        // PERBAIKAN 3: Menangani 'possibly undefined'
        const averageRating = reviewAggregation._avg.rating ?? 0;
        const reviewCount = reviewAggregation._count.id;
        
        // PERBAIKAN 4: Destrukturisasi _count dengan aman
        const { _count, ...restService } = service; 
        
        return {
            ...restService,
            ordersCount: _count.orders, // Gunakan hasil hitungan orders
            reviewCount,
            // Mengformat rating ke 1 desimal, fallback jika 0
            averageRating: parseFloat(averageRating.toFixed(1)),
        };
    }));


    return createSuccessResponse(servicesWithStats, `Found ${servicesWithStats.length} services with stats`);

  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate Bearer token - provider only
    const authResult = await requireAuth(request, ['provider']);
    if (authResult instanceof Response) return authResult;

    const providerId = parseInt(authResult.user.userId as string);
    const body = await request.json();

    // Validate required fields
    const { categoryId, serviceTitle, description, price, priceUnit, isAvailable } = body;

    if (!categoryId || !serviceTitle || !description || !price || !priceUnit) {
      return createErrorResponse('Missing required fields', 400);
    }

    // Check if category exists
    const category = await prisma.serviceCategory.findUnique({
      where: { id: parseInt(categoryId) }
    });

    if (!category) {
      return createErrorResponse('Service category not found', 404);
    }

    // Create service
    const service = await prisma.providerService.create({
      data: {
        providerId,
        categoryId: parseInt(categoryId),
        serviceTitle,
        description,
        price: parseFloat(price),
        priceUnit,
        isAvailable: isAvailable !== false
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            iconUrl: true
          }
        }
      }
    });

    return createSuccessResponse(service, 'Service created successfully');

  } catch (error) {
    return handleApiError(error);
  }
}
