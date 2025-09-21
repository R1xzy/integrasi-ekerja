// src/app/api/password/reset/route.ts

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';
import bcryptjs from 'bcryptjs'; // <-- PERUBAHAN 1: Menggunakan 'bcryptjs'
import { z } from 'zod';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token diperlukan'),
  newPassword: z.string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password harus mengandung huruf besar, huruf kecil, dan angka'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword } = resetPasswordSchema.parse(body);

    // Cari token/kode verifikasi yang valid di database
    // Pastikan nama tabel dan kolom sesuai dengan schema.prisma Anda
    const verification = await prisma.emailVerification.findFirst({
        where: {
            code: token,
            type: 'PASSWORD_RESET',
            isUsed: false,
            expiresAt: { gte: new Date() },
        },
        include: { user: true }
    });
    
    if (!verification || !verification.user) {
      return createErrorResponse('Token reset tidak valid atau telah kedaluwarsa.', 400);
    }
    
    // Hash password baru menggunakan bcryptjs agar konsisten
    const passwordHash = await bcryptjs.hash(newPassword, 12); // <-- PERUBAHAN 2: Memanggil bcryptjs.hash

    // Update password dan tandai token sebagai sudah digunakan
    await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: verification.userId! },
            data: { passwordHash }, // Simpan hash yang baru
        });

        await tx.emailVerification.update({
            where: { id: verification.id },
            data: { isUsed: true },
        });
    });

    return createSuccessResponse(null, 'Password Anda telah berhasil direset. Silakan login kembali.');
    
  } catch (error) {
    return handleApiError(error);
  }
}