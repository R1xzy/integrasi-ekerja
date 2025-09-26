import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db'; // Menggunakan prisma instance Anda
import { requireAuth, handleApiError, createSuccessResponse } from '@/lib/api-helpers'; // Menggunakan helper Anda

export async function GET(request: NextRequest) {
  try {
    // 1. Otentikasi dan verifikasi peran provider (menggunakan helper Anda)
    const authResult = await requireAuth(request, ['provider']);
    if (authResult instanceof Response) return authResult;

    const providerId = parseInt(authResult.user.userId as string);

    // 2. Ambil data provider untuk mendapatkan tanggal bergabung dan status verifikasi
    const provider = await prisma.user.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider tidak ditemukan' }, { status: 404 });
    }

    // --- [PERBAIKAN LOGIKA PERHITUNGAN YANG LEBIH EFISIEN] ---

    // 3. Hitung Total Pesanan langsung dari database
    // Ini jauh lebih cepat daripada mengambil semua pesanan lalu menghitungnya di code.
    const totalOrders = await prisma.order.count({
      where: {
        providerId: provider.id,
        // Kita hitung semua pesanan yang tidak secara eksplisit ditolak atau dibatalkan
        NOT: {
          status: {
            in: ['REJECTED_BY_PROVIDER', 'CANCELLED_BY_CUSTOMER']
          }
        }
      }
    });

    // 4. Hitung Rata-rata Rating langsung dari tabel Review
    // Ini adalah cara paling akurat dan efisien untuk mendapatkan rata-rata.
    const ratingAggregation = await prisma.review.aggregate({
      _avg: {
        rating: true, // Minta Prisma untuk menghitung rata-rata dari kolom 'rating'
      },
      where: {
        providerId: provider.id,
        isShow: true, // Hanya ulasan yang ditampilkan yang dihitung
      },
    });
    
    // Ambil hasilnya, jika null (belum ada review), anggap 0
    const averageRating = ratingAggregation._avg.rating ?? 0;

    // -----------------------------------------------------------------

    // 5. Siapkan data yang akan dikirim ke frontend
    const statistics = {
      totalOrders: totalOrders,
      averageRating: averageRating,
      joinDate: provider.createdAt.toISOString(), // Ambil langsung dari data provider
      verificationStatus: provider.verificationStatus, // Ambil langsung dari data provider
    };

    // Gunakan helper response sukses Anda
    return createSuccessResponse(statistics, 'Statistik provider berhasil diambil');

  } catch (error) {
    // Gunakan helper error Anda
    return handleApiError(error);
  }
}