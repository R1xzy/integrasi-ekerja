import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, createSuccessResponse, requireAuth } from '@/lib/api-helpers';

// API GET khusus admin untuk melihat SEMUA percakapan
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const whereClause = {
      participants: {
        some: {
          user: {
            fullName: {
              contains: searchTerm,
              // ❌ DIHAPUS: Baris ini menyebabkan error di MySQL/SQLite
              // mode: 'insensitive', 
            },
          },
        },
      },
    };

    const [allConversations, totalCount] = await Promise.all([
      prisma.chatConversation.findMany({
        where: whereClause,
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  role: { select: { roleName: true } },
                },
              },
            },
          },
          order: {
            select: {
              id: true,
              providerService: { select: { serviceTitle: true } },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      prisma.chatConversation.count({ where: whereClause })
    ]);

    const formattedConversations = allConversations.map((conv) => {
      const customerParticipant = conv.participants.find(p => p.user.role.roleName === 'customer')?.user;
      const providerParticipant = conv.participants.find(p => p.user.role.roleName === 'provider')?.user;

      return {
        id: conv.id,
        orderId: conv.orderId,
        createdAt: conv.createdAt,
        customer: customerParticipant ? {
            id: customerParticipant.id,
            fullName: customerParticipant.fullName
        } : null,
        provider: providerParticipant ? {
            id: providerParticipant.id,
            fullName: providerParticipant.fullName
        } : null,
        order: conv.order ? {
          id: conv.order.id,
          service: {
            name: conv.order.providerService?.serviceTitle || 'Percakapan Umum',
          }
        } : null,
      };
    });

    return NextResponse.json({
        success: true,
        data: formattedConversations,
        pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
        }
    });

  } catch (error) {
    return handleApiError(error);
  }
}