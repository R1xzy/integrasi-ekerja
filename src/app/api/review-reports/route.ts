import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createAuthMiddleware } from '@/lib/jwt';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    // Validate Bearer token - any authenticated user except admin (admin can't report reviews)
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['customer', 'provider']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
        console.error(`[REPORT_LOG] Authentication Failed: ${authResult.message}`);
        return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    const reportedByUserId = parseInt(authResult.user!.userId);
    // 📢 LOG 1: Cek User ID Pelapor
    console.log(`[REPORT_LOG] User ID Pelapor (reportedByUserId): ${reportedByUserId}`);

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
        console.error(`[REPORT_LOG] FAILED to parse JSON body: ${error}`);
        return createErrorResponse('Invalid JSON body', 400);
    }

    const { reviewId, reason } = body;
    
    // 📢 LOG 2: Cek Data Mentah yang Diterima
    console.log(`[REPORT_LOG] Data Diterima: reviewId=${reviewId} (Tipe: ${typeof reviewId}), reason=${reason} (Tipe: ${typeof reason})`);

    // Pastikan reviewId adalah angka integer
    const reviewIdNumber = typeof reviewId === 'number' ? reviewId : parseInt(reviewId);

    // Validate required fields and ensure reviewId is a valid number
    if (!reviewIdNumber || isNaN(reviewIdNumber) || !reason) {
        console.error(`[REPORT_LOG] VALIDATION FAILED (400): reviewIdNumber=${reviewIdNumber}, isNaN=${isNaN(reviewIdNumber)}, reason=${!!reason}`);
        return createErrorResponse('Missing or invalid required fields: reviewId (must be a valid number), reason', 400);
    }
    
    // 📢 LOG 3: Konfirmasi Review ID yang akan Dicari
    console.log(`[REPORT_LOG] Review ID Final yang dicari: ${reviewIdNumber}`);


    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: reviewIdNumber  },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true
          }
        },
        provider: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    if (!review) {
        console.error(`[REPORT_LOG] REVIEW NOT FOUND (404) for ID: ${reviewIdNumber}`);
        return createErrorResponse('Review not found', 404);
    }
    
    // 📢 LOG 4: Cek Kepemilikan Review
    console.log(`[REPORT_LOG] Review details: customerId=${review.customerId}, providerId=${review.providerId}`);


    // Check if user can report this review (can't report own reviews)


    // Check if review is already reported by this user
    const existingReport = await prisma.reviewReport.findFirst({
      where: {
        reviewId: reviewIdNumber ,
        reportedByUserId
      }
    });

    if (existingReport) {
        console.warn(`[REPORT_LOG] BLOCKED (400): Review ID ${reviewIdNumber} already reported by User ${reportedByUserId}.`);
        return createErrorResponse('You have already reported this review', 400);
    }

    // 📢 LOG 5: Siap Membuat Laporan
    console.log(`[REPORT_LOG] SUCCESS: All checks passed. Creating report for Review ID ${reviewIdNumber}.`);

    // Create review report
    const reviewReport = await prisma.reviewReport.create({
    // ... (data pembuatan laporan) ...
      data: {
        reviewId: reviewIdNumber,
        reportedByUserId,
        reason: reason.trim(),
        status: 'PENDING_REVIEW'
      },
      include: {
        review: {
          include: {
            customer: { select: { id: true, fullName: true } },
            provider: { select: { id: true, fullName: true } }
          }
        },
        reportedByUser: { select: { id: true, fullName: true } }
      }
    });

    // Mark the review as reported and automatically hide it (C-10 & REQ-B-7.2)
    await prisma.review.update({
      where: { id: reviewIdNumber  },
      data: { 
        isReported: true,
        isShow: false // Automatically hide reported reviews
      }
    });
    
    // 📢 LOG 6: Proses Selesai
    console.log(`[REPORT_LOG] FINISHED: Review ID ${reviewIdNumber} report submitted and hidden.`);

    return createSuccessResponse(reviewReport, 'Review report submitted successfully. Review has been automatically hidden.');

  } catch (error) {
    console.error('[REPORT_LOG] UNHANDLED EXCEPTION:', error);
    return handleApiError(error);
  }
}
export async function GET(request: NextRequest) {
  try {
    // Validate Bearer token - admin only
    const authHeader = request.headers.get('authorization');
    const auth = createAuthMiddleware(['admin']);
    const authResult = auth(authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.message || 'Authentication failed', authResult.status || 401);
    }

    // Parse query parameters
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '10')));
    const skip = (page - 1) * limit;
    const status = url.searchParams.get('status');

    // Build where clause
    let where: any = {};
    
    if (status) {
      where.status = status;
    }

    // Get review reports
    const reviewReports = await prisma.reviewReport.findMany({
      where,
      include: {
        review: {
          include: {
            customer: {
              select: {
                id: true,
                fullName: true
              }
            },
            provider: {
              select: {
                id: true,
                fullName: true
              }
            },
            order: {
              select: {
                id: true,
                providerService: {
                  select: {
                    serviceTitle: true
                  }
                }
              }
            }
          }
        },
        reportedByUser: {
          select: {
            id: true,
            fullName: true
          }
        },
        resolvedByAdmin: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    // Get total count for pagination
    const total = await prisma.reviewReport.count({ where });

    const response = {
      success: true,
      data: reviewReports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      message: `Found ${reviewReports.length} review reports`
    };

    return NextResponse.json(response);

  } catch (error) {
    return handleApiError(error);
  }
}
