import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/emailService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// REQ-B-15.2: API endpoint untuk pengiriman email verifikasi lupa password
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate input
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
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

    // Check if email exists in the system
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true
      }
    });

    if (!existingUser) {
      // For security reasons, don't reveal that email doesn't exist
      return NextResponse.json({
        success: true,
        message: 'If the email exists in our system, a password reset code has been sent.',
        data: { email }
      });
    }

    if (!existingUser.isActive) {
      return NextResponse.json({
        success: false,
        error: 'Account is deactivated. Please contact support.'
      }, { status: 403 });
    }

    // Check rate limiting - max 5 attempts per hour per email
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentAttempts = await (prisma as any).emailVerification.count({
      where: {
        email,
        type: 'PASSWORD_RESET',
        createdAt: {
          gte: oneHourAgo
        }
      }
    });

    if (recentAttempts >= 5) {
      return NextResponse.json({
        success: false,
        error: 'Too many password reset attempts. Please try again in 1 hour.'
      }, { status: 429 });
    }

    // Send verification email
    const result = await sendVerificationEmail(email, 'PASSWORD_RESET', {
      fullName: existingUser.fullName
    }, existingUser.id);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to send verification email'
      }, { status: 500 });
    }

    // Log successful attempt
    console.log(`Password reset verification email sent to: ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Password reset verification email sent successfully',
      data: {
        email,
        ...(process.env.NODE_ENV === 'development' && { verificationCode: result.code })
      }
    });

  } catch (error) {
    console.error('Error in password reset verification email:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Verify password reset code
export async function PUT(request: NextRequest) {
  try {
    const { email, code } = await request.json();

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
    const verification = await verifyCode(email, code, 'PASSWORD_RESET');

    if (!verification) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired verification code'
      }, { status: 400 });
    }

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return NextResponse.json({
        success: false,
        error: 'Account not found or deactivated'
      }, { status: 404 });
    }

    // Log successful verification
    console.log(`Password reset verification successful for: ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Password reset verification successful',
      data: {
        email,
        userId: user.id,
        verifiedAt: verification.updatedAt,
        // Generate a temporary token for password reset (valid for 15 minutes)
        resetToken: Buffer.from(`${user.id}:${Date.now()}`).toString('base64')
      }
    });

  } catch (error) {
    console.error('Error in password reset verification:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
