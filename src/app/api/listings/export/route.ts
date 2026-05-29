import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { listingId, format = 'markdown' } = (await request.json()) as { listingId: string; format?: 'markdown' | 'json' };
    const listing = await prisma.listing.findFirst({ where: { id: listingId, userId: user.id } });
    if (!listing) throw new Error('Anúncio não encontrado.');

    await prisma.listing.update({ where: { id: listing.id }, data: { status: 'EXPORTED' } });
    if (format === 'json') return NextResponse.json({ listing });

    return new NextResponse(listing.expandedOutput || listing.stageOneOutput, {
      headers: {
        'content-type': 'text/markdown; charset=utf-8',
        'content-disposition': `attachment; filename="${listing.productName.replace(/[^a-z0-9]+/gi, '-')}.md"`
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao exportar anúncio.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
