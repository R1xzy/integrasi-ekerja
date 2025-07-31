import { NextRequest, NextResponse } from 'next/server';
import { createAuthMiddleware } from '@/lib/jwt';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const resolvedParams = await params;
    const providerId = parseInt(resolvedParams.id);

    // Get provider with detailed information
    const provider = await prisma.user.findFirst({
      where: { 
        id: providerId,
        role: {
          roleName: 'provider'
        }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        address: true,
        isActive: true,
        verificationStatus: true,
        providerBio: true,
        profilePictureUrl: true,
        createdAt: true,
        updatedAt: true,
        verifiedAt: true,
        verifier: {
          select: {
            fullName: true
          }
        },
        providerServices: {
          select: {
            id: true,
            serviceTitle: true,
            description: true,
            price: true,
            priceUnit: true,
            isAvailable: true,
            category: {
              select: {
                name: true
              }
            }
          },
          take: 10 // Latest 10 services
        },
        providerOrders: {
          select: {
            id: true,
            orderDate: true,
            status: true,
            finalAmount: true,
            customer: {
              select: {
                fullName: true
              }
            }
          },
          orderBy: {
            orderDate: 'desc'
          },
          take: 10 // Latest 10 orders
        },
        providerReviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            customer: {
              select: {
                fullName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5 // Latest 5 reviews
        },
        providerPortfolios: {
          select: {
            id: true,
            projectTitle: true,
            description: true,
            imageUrl: true,
            completedAt: true
          },
          orderBy: {
            completedAt: 'desc'
          },
          take: 5 // Latest 5 portfolios
        },
        providerDocuments: {
          select: {
            id: true,
            documentType: true,
            documentName: true,
            fileUrl: true,
            issuingOrganization: true,
            issuedAt: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            providerServices: true,
            providerOrders: true,
            providerReviews: true,
            providerPortfolios: true
          }
        }
      }
    });

    if (!provider) {
      return createErrorResponse('Provider not found', 404);
    }

    // Calculate average rating
    const avgRating = await prisma.review.aggregate({
      where: {
        providerId: providerId
      },
      _avg: {
        rating: true
      }
    });

    const providerWithStats = {
      ...provider,
      avgRating: avgRating._avg.rating || 0
    };

    return createSuccessResponse(providerWithStats, 'Provider details retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const resolvedParams = await params;
    const providerId = parseInt(resolvedParams.id);
    const body = await request.json();
    const { isActive, verificationStatus } = body;

    // Check if provider exists
    const provider = await prisma.user.findFirst({
      where: { 
        id: providerId,
        role: {
          roleName: 'provider'
        }
      }
    });

    if (!provider) {
      return createErrorResponse('Provider not found', 404);
    }

    // Prepare update data
    const updateData: any = {};
    
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

    if (verificationStatus && ['PENDING', 'VERIFIED', 'REJECTED'].includes(verificationStatus)) {
      updateData.verificationStatus = verificationStatus;
      
      if (verificationStatus === 'VERIFIED') {
        updateData.verifiedAt = new Date();
        updateData.verifiedBy = authResult.user?.userId;
      } else if (verificationStatus === 'REJECTED') {
        updateData.verifiedAt = null;
        updateData.verifiedBy = null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return createErrorResponse('No valid fields to update', 400);
    }

    // Update provider
    const updatedProvider = await prisma.user.update({
      where: { id: providerId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        verificationStatus: true,
        verifiedAt: true,
        updatedAt: true,
        verifier: {
          select: {
            fullName: true
          }
        }
      }
    });

    let message = 'Provider updated successfully';
    if (verificationStatus === 'VERIFIED') {
      message = 'Provider verified successfully';
    } else if (verificationStatus === 'REJECTED') {
      message = 'Provider verification rejected';
    } else if (typeof isActive === 'boolean') {
      message = `Provider ${isActive ? 'activated' : 'deactivated'} successfully`;
    }

    return createSuccessResponse(updatedProvider, message);

  } catch (error) {
    return handleApiError(error);
  }
}
