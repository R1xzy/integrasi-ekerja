// src/app/api/password/forgot/route.ts

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';
import { sendVerificationEmail } from '@/lib/emailService';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Format email tidak valid'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Untuk keamanan, kita tidak memberitahu apakah email terdaftar atau tidak.
    // Cukup kirim respons sukses agar tidak bisa digunakan untuk menebak email pengguna.
    if (!user || !user.isActive) {
      console.log(`Password reset request for non-existent or inactive user: ${email}`);
      return createSuccessResponse(
        null,
        'Anda akan menerima email untuk mereset password.'
      );
    }

    // Fungsi ini akan membuat token/kode, menyimpannya di DB, dan mengirim email.
    // Pastikan link di dalam template email mengarah ke `/password/resetpassword?token={kode}`
    const result = await sendVerificationEmail(
      user.email,
      'PASSWORD_RESET',
      { fullName: user.fullName },
      user.id
    );

    if (!result.success) {
      return createErrorResponse(result.error || 'Gagal mengirim email verifikasi.', 500);
    }

    return createSuccessResponse(
      null,
      'Jika email Anda terdaftar, Anda akan menerima email untuk mereset password.'
    );

  } catch (error) {
    return handleApiError(error);
  }
}