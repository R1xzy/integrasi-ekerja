import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

// PUT - Change user password
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const userPayload = authResult.user;
    const { currentPassword, newPassword } = await request.json();

    // Validasi input
    if (!currentPassword || !newPassword) {
      return createErrorResponse('Current password dan new password harus diisi', 400);
    }

    if (newPassword.length < 6) {
      return createErrorResponse('Password baru minimal 6 karakter', 400);
    }

    // Get current user dengan password hash
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userPayload.userId) },
      select: {
        id: true,
        passwordHash: true
      }
    });

    if (!user) {
      return createErrorResponse('User tidak ditemukan', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return createErrorResponse('Password saat ini tidak benar', 400);
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      }
    });

    return createSuccessResponse(
      { success: true }, 
      'Password berhasil diubah'
    );

  } catch (error) {
    console.error('Error changing password:', error);
    return createErrorResponse('Terjadi kesalahan saat mengubah password', 500);
  }
}