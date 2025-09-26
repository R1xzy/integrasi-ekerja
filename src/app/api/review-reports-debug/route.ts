import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG: review-reports endpoint called ===');
    
    // Log headers
    console.log('Headers:', {
      authorization: request.headers.get('authorization') ? 'Bearer [token]' : 'None',
      contentType: request.headers.get('content-type'),
    });
    
    // Parse body
    let body;
    try {
      body = await request.json();
      console.log('Request body:', body);
    } catch (error) {
      console.error('Failed to parse JSON body:', error);
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON body',
        debug: 'Failed to parse request body as JSON'
      }, { status: 400 });
    }
    
    const { reviewId, reason } = body;
    
    // Validate required fields
    if (!reviewId || !reason) {
      console.log('Missing fields - reviewId:', reviewId, 'reason:', reason);
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: reviewId, reason',
        debug: { receivedReviewId: reviewId, receivedReason: reason }
      }, { status: 400 });
    }
    
    // For now, just return success for testing
    console.log('=== DEBUG: Would submit report for review', reviewId, 'with reason:', reason);
    
    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully (DEBUG MODE)',
      data: {
        reviewId,
        reason,
        status: 'PENDING_REVIEW'
      }
    });
    
  } catch (error) {
    console.error('=== DEBUG: API Error ===', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      debug: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}