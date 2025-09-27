import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

// PUT - Update profil user
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const userPayload = authResult.user;

    const { fullName, phoneNumber, address } = await request.json();

    // Validasi input
    if (!fullName || fullName.trim().length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nama lengkap harus diisi' 
      }, { status: 400 });
    }

    // Update profil user
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userPayload.userId) },
      data: {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber?.trim() || null,
        address: address?.trim() || null,
        updatedAt: new Date()
      },
      include: {
        role: {
          select: {
            roleName: true
          }
        }
      }
    });

    // Remove password hash dari response
    const { passwordHash, ...safeUser } = updatedUser;

    return createSuccessResponse({
      user: safeUser
    }, 'Profil berhasil diperbarui');

  } catch (error) {
    console.error('Error updating profile:', error);
    return createErrorResponse('Terjadi kesalahan saat memperbarui profil', 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    // --- PERBAIKAN DI SINI ---
    // Mengambil email dari hasil otentikasi, bukan id.
    const userEmail = authResult.user.email;

    if (!userEmail) {
        return createErrorResponse('Token tidak valid atau tidak mengandung email', 401);
    }

    // Mencari pengguna berdasarkan email, bukan id
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        address: true,
        profilePictureUrl: true,
        role: {
          select: {
            roleName: true,
          },
        },
      },
    });

    if (!user) {
      return createErrorResponse('User tidak ditemukan', 404);
    }

    return createSuccessResponse(user, 'Profil berhasil diambil');

  } catch (error) {
    return handleApiError(error);
  }
}

// Fungsi PATCH tetap sama
export async function PATCH(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);
        if (authResult instanceof NextResponse) return authResult;

        const userId = authResult.user.id; // Asumsi PATCH mungkin butuh ID, jika tidak bisa diubah juga
        const body = await request.json();
        
        const { fullName, phoneNumber, address } = body;

        const updatedUser = await prisma.user.update({
            where: { id: userId }, // Perhatikan, ini mungkin perlu diubah ke email juga jika id tidak ada
            data: {
                fullName,
                phoneNumber,
                address,
            },
             select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                address: true,
            },
        });

        return createSuccessResponse(updatedUser, 'Profil berhasil diperbarui');

    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return createErrorResponse('Data tidak valid', 400);
        }
        return handleApiError(error);
    }
}