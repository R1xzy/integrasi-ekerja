import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { portfolioSchema } from '@/lib/validations';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';
import { requireRole } from '@/lib/auth-helpers';

// CREATE - Add new portfolio (Provider only)
export const POST = requireRole(['provider'])(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const validatedData = portfolioSchema.parse(body);
    
    const portfolio = await prisma.providerPortfolio.create({
      data: {
        ...validatedData,
        providerId: parseInt(user.id),
        completedAt: validatedData.completedAt ? new Date(validatedData.completedAt) : null
      }
    });
    
    return createSuccessResponse(portfolio, 'Portfolio created successfully');
    
  } catch (error) {
    return handleApiError(error);
  }
});

// READ - Get provider portfolios
export const GET = requireRole(['provider', 'admin', 'customer'])(async (req: NextRequest, user) => {
  try {
    const url = new URL(req.url);
    const providerId = url.searchParams.get('providerId');
    
    // If provider role, can only see own portfolios unless viewing another provider's portfolio
    const targetProviderId = (user.role === 'provider' && !providerId) 
      ? parseInt(user.id) 
      : providerId ? parseInt(providerId) : undefined;
    
    const portfolios = await prisma.providerPortfolio.findMany({
      where: providerId ? { providerId: targetProviderId } : {},
      include: {
        provider: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: { completedAt: 'desc' }
    });
    
    return createSuccessResponse(portfolios);
    
  } catch (error) {
    return handleApiError(error);
  }
});
