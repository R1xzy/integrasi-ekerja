import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db'; // Diubah sesuai dengan struktur proyek Anda

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const field = searchParams.get('field');
    const value = searchParams.get('value');

    if (!field || !value) {
      return NextResponse.json(
        { success: false, error: 'Parameter "field" dan "value" dibutuhkan.' },
        { status: 400 }
      );
    }

    if (field !== 'email' && field !== 'phoneNumber') {
      return NextResponse.json(
        { success: false, error: 'Pengecekan hanya bisa untuk "email" atau "phoneNumber".' },
        { status: 400 }
      );
    }

    // Menggunakan 'prisma' sesuai dengan import yang baru
    const existingUser = await prisma.user.findFirst({
      where: {
        [field]: value,
      },
    });

    // Mengembalikan respons dengan status keunikan
    return NextResponse.json({ isUnique: !existingUser });

  } catch (error) {
    console.error('[CHECK_UNIQUENESS_API]', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}