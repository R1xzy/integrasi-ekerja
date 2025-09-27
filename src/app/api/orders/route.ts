import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse, requireAuth } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    // Validate Bearer token - customer only
    const authResult = await requireAuth(request, ['customer']);
    if (authResult instanceof Response) return authResult;

    const customerId = parseInt(authResult.user.userId as string);

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON body', 400);
    }

    const { 
      providerServiceId, 
      scheduledDate, 
      jobAddress, 
      district, 
      subDistrict, 
      ward, 
      jobDescriptionNotes,
      chosenPaymentMethod 
    } = body;

    // Validate required fields
    if (!providerServiceId || !scheduledDate || !jobAddress || !district || !subDistrict || !ward) {
      return createErrorResponse('Missing required fields: providerServiceId, scheduledDate, jobAddress, district, subDistrict, ward', 400);
    }

    // Validate scheduledDate
    let scheduledDateTime: Date;
    try {
      scheduledDateTime = new Date(scheduledDate);
      if (isNaN(scheduledDateTime.getTime())) {
        return createErrorResponse('Invalid date format for scheduledDate', 400);
      }
      
      // Check if scheduled date is in the future
      if (scheduledDateTime <= new Date()) {
        return createErrorResponse('Scheduled date must be in the future', 400);
      }
    } catch (error) {
      return createErrorResponse('Invalid date format for scheduledDate', 400);
    }

    // Check if provider service exists and is available
    const providerService = await prisma.providerService.findUnique({
      where: { id: parseInt(providerServiceId) },
      include: {
        provider: {
          select: {
            id: true,
            fullName: true,
            isActive: true,
            verificationStatus: true
          }
        }
      }
    });

    if (!providerService) {
      return createErrorResponse('Provider service not found', 404);
    }

    if (!providerService.isAvailable) {
      return createErrorResponse('This service is currently not available', 400);
    }

    if (!providerService.provider.isActive) {
      return createErrorResponse('Provider is currently inactive', 400);
    }

    // Validate payment method if provided
    if (chosenPaymentMethod && !['CASH', 'E_PAYMENT'].includes(chosenPaymentMethod)) {
      return createErrorResponse('Invalid payment method. Must be CASH or E_PAYMENT', 400);
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        customerId,
        providerId: providerService.providerId,
        providerServiceId: parseInt(providerServiceId),
        scheduledDate: scheduledDateTime,
        jobAddress: jobAddress.trim(),
        district: district.trim(),
        subDistrict: subDistrict.trim(),
        ward: ward.trim(),
        jobDescriptionNotes: jobDescriptionNotes?.trim() || null,
        chosenPaymentMethod: chosenPaymentMethod || null,
        status: 'PENDING_ACCEPTANCE'
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true
          }
        },
        provider: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true
          }
        },
        providerService: {
          select: {
            id: true,
            serviceTitle: true,
            description: true,
            price: true,
            priceUnit: true
          }
        }
      }
    });

    return createSuccessResponse(order, 'Order created successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate Bearer token - customer, provider, or admin
    const authResult = await requireAuth(request, ['customer', 'provider', 'admin']);
    if (authResult instanceof Response) return authResult;

    const userId = parseInt(authResult.user.userId as string);
    const userRole = authResult.user.roleName as string;

    // Parse query parameters
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '10')));
    const skip = (page - 1) * limit;
    const status = url.searchParams.get('status');

    // Build where clause based on user role
    let where: any = {};
    
    if (userRole === 'customer') {
      where.customerId = userId;
    } else if (userRole === 'provider') {
      where.providerId = userId;
    }
    // Admin can see all orders (no additional filter)

    if (status) {
      where.status = status;
    }

    // Get orders
    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true
          }
        },
        provider: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true
          }
        },
        providerService: {
          select: {
            id: true,
            serviceTitle: true,
            description: true,
            price: true,
            priceUnit: true
          }
        },
        review: true,
        orderDetails: true,
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentMethod: true,
            paidAt: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    // Get total count for pagination
    const total = await prisma.order.count({ where });

    const response = {
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      message: `Found ${orders.length} orders`
    };

    return NextResponse.json(response);

  } catch (error) {
    return handleApiError(error);
  }
}
