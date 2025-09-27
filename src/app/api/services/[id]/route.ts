import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

// Tipe data untuk membantu TypeScript dalam kalkulasi
interface ReviewWithRating {
  rating: number;
}

/**
 * GET handler untuk mengambil detail layanan publik.
 * Endpoint ini tidak memerlukan autentikasi.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serviceId = parseInt(params.id);
    if (isNaN(serviceId)) {
      return createErrorResponse('Service ID tidak valid', 400);
    }

    // Menggunakan `findFirst` untuk dapat memfilter berdasarkan ID dan status aktif
    const service = await prisma.providerService.findFirst({
      where: {
        id: serviceId,
        isActive: true, // Hanya layanan yang aktif yang bisa dilihat publik
        provider: {
          isVerified: true, // Hanya dari provider terverifikasi
        }
      },
      include: {
        category: {
          select: { name: true },
        },
        provider: {
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
                profilePictureUrl: true,
              },
            },
          },
        },
        reviews: {
          where: { isShow: true },
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: {
                fullName: true,
                profilePictureUrl: true,
              },
            },
          },
        },
      },
    });

    if (!service) {
      return createErrorResponse('Layanan tidak ditemukan atau tidak aktif', 404);
    }

    // Menghitung total ulasan provider secara terpisah
    const providerTotalReviews = await prisma.review.count({
      where: { 
        providerId: service.providerId,
        isShow: true 
      },
    });

    // Menghitung rating rata-rata spesifik untuk layanan ini
    const totalRating = service.reviews.reduce(
      (acc: number, review: ReviewWithRating) => acc + review.rating, 0
    );
    const averageRating = service.reviews.length > 0 ? totalRating / service.reviews.length : 0;

    // Memformat data respons agar sesuai dengan kebutuhan frontend
    const responseData = {
      id: service.id,
      serviceName: service.serviceTitle,
      description: service.description,
      price: service.basePrice,
      category: service.category,
      provider: {
        id: service.provider.id,
        fullName: service.provider.user.fullName,
        profilePictureUrl: service.provider.user.profilePictureUrl,
        reviewCount: providerTotalReviews, // Total ulasan provider
        rating: averageRating, // Rating rata-rata untuk LAYANAN INI
      },
      reviews: service.reviews, // Ulasan spesifik untuk LAYANAN INI
    };

    return createSuccessResponse(responseData, 'Detail layanan berhasil diambil');
  } catch (error) {
    return handleApiError(error);
  }
}