import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/emailService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// REQ-B-15.1: API endpoint untuk pengiriman email verifikasi registrasi
export async function POST(request: NextRequest) {
  try {
    const { email, fullName } = await request.json();

    // Validate input
    if (!email || !fullName) {
      return NextResponse.json({
        success: false,
        error: 'Email and full name are required'
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 });
    }

    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'Email is already registered'
      }, { status: 409 });
    }

    // Check rate limiting - max 3 attempts per hour per email
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentAttempts = await (prisma as any).emailVerification.count({
      where: {
        email,
        type: 'REGISTRATION',
        createdAt: {
          gte: oneHourAgo
        }
      }
    });

    if (recentAttempts >= 3) {
      return NextResponse.json({
        success: false,
        error: 'Too many verification attempts. Please try again in 1 hour.'
      }, { status: 429 });
    }

    // Send verification email
    const result = await sendVerificationEmail(email, 'REGISTRATION', {
      fullName
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to send verification email'
      }, { status: 500 });
    }

    // Log successful attempt
    console.log(`Registration verification email sent to: ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
      data: {
        email,
        ...(process.env.NODE_ENV === 'development' && { verificationCode: result.code })
      }
    });

  } catch (error) {
    console.error('Error in registration verification email:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Verify registration code
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    
    // Support both 'code' and 'verificationCode' field names for flexibility
    const code = body.code || body.verificationCode;

    // Validate input
    if (!email || !code) {
      return NextResponse.json({
        success: false,
        error: 'Email and verification code are required'
      }, { status: 400 });
    }

    // Import verification function
    const { verifyCode } = await import('@/lib/emailService');
    
    // Verify the code
    const verification = await verifyCode(email, code, 'REGISTRATION');

    if (!verification) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired verification code'
      }, { status: 400 });
    }

    // Log successful verification
    console.log(`Registration verification successful for: ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Email verification successful',
      data: {
        email,
        verifiedAt: verification.updatedAt
      }
    });

  } catch (error) {
    console.error('Error in registration verification:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
