import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';
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