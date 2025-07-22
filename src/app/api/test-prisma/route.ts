import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Test endpoint to verify Prisma models
export async function GET(req: NextRequest) {
  try {
    // Test providerDocument model
    const docTest = await prisma.providerDocument.findMany({ take: 1 });
    
    // Test review with isShow field
    const reviewTest = await prisma.review.findMany({ 
      where: { isShow: true },
      take: 1 
    });
    
    // Test user with providerDocuments relation
    const userTest = await prisma.user.findMany({
      include: { providerDocuments: true },
      take: 1
    });
    
    return NextResponse.json({
      success: true,
      message: 'All Prisma models working correctly',
      tests: {
        providerDocument: docTest.length >= 0,
        reviewIsShow: reviewTest.length >= 0,
        userRelation: userTest.length >= 0
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
}
