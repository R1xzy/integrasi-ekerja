// api/services/public/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Public endpoint untuk detail service tanpa auth
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serviceId = parseInt(params.id);

    if (isNaN(serviceId)) {
      return NextResponse.json({ 
        error: 'Invalid service ID' 
      }, { status: 400 });
    }

    // Get service detail dengan semua data yang dibutuhkan
    const service = await prisma.providerService.findUnique({
      where: { 
        id: serviceId,
        isAvailable: true // hanya service yang tersedia
      },
      include: {
        provider: {
          select: {
            id: true,
            fullName: true,
            profilePictureUrl: true,
            verificationStatus: true,
            email: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        orders: {
          where: {
            status: 'COMPLETED'
          },
          include: {
            review: {
              where: {
                isShow: true // hanya review yang tidak disembunyikan
              },
              select: {
                id: true,
                rating: true,
                comment: true,
                createdAt: true,
                customer: {
                  select: {
                    id: true,
                    fullName: true,
                    profilePictureUrl: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!service) {
      return NextResponse.json({ 
        error: 'Service not found or not available' 
      }, { status: 404 });
    }

    // Hitung statistik rating dan pesanan selesai
    const completedOrders = service.orders.length;
    const reviewsWithRating = service.orders
      .map(order => order.review)
      .filter(review => review !== null);

    const totalRating = reviewsWithRating.reduce((sum, review) => {
      return sum + (review?.rating || 0);
    }, 0);

    const averageRating = reviewsWithRating.length > 0 
      ? parseFloat((totalRating / reviewsWithRating.length).toFixed(1))
      : 0;

    // Format ulasan untuk response
    const reviews = reviewsWithRating.map(review => ({
      id: review?.id,
      rating: review?.rating,
      comment: review?.comment,
      createdAt: review?.createdAt,
      customer: {
        id: review?.customer.id,
        fullName: review?.customer.fullName,
        profilePictureUrl: review?.customer.profilePictureUrl
      }
    })).filter(review => review.id); // filter out null reviews

    // Response data sesuai requirement
    const responseData = {
      // ID layanan untuk params saat membuat pesanan
      id: service.id,
      
      // Nama layanan
      serviceName: service.serviceTitle,
      
      // Deskripsi layanan  
      description: service.description,
      
      // Nama provider layanan tersebut
      providerName: service.provider.fullName,
      providerId: service.provider.id,
      providerProfilePicture: service.provider.profilePictureUrl,
      providerVerificationStatus: service.provider.verificationStatus,
      
      // Harga layanan
      price: service.price,
      priceUnit: service.priceUnit,
      
      // Kategori
      category: {
        id: service.category.id,
        name: service.category.name,
        description: service.category.description
      },
      
      // Rating
      rating: {
        average: averageRating,
        count: reviewsWithRating.length
      },
      
      // Pesanan selesai dari layanan tersebut
      completedOrdersCount: completedOrders,
      
      // Ulasan dari pesanan (dengan pagination sederhana)
      reviews: reviews.slice(0, 10), // ambil 10 review terbaru
      totalReviews: reviews.length,
      
      // Info tambahan
      isAvailable: service.isAvailable,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching service detail:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}