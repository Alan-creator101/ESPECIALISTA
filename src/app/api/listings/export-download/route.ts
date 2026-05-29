import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const listingId = url.searchParams.get('listingId');
    const format = url.searchParams.get('format') || 'markdown';
    if (!listingId) throw new Error('listingId é obrigatório.');

    const listing = await prisma.listing.findFirst({ where: { id: listingId, userId: user.id } });
    if (!listing) throw new Error('Anúncio não encontrado.');
    await prisma.listing.update({ where: { id: listing.id }, data: { status: 'EXPORTED' } });

    const filename = listing.productName.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    if (format === 'json') {
      return new NextResponse(JSON.stringify(listing, null, 2), {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'content-disposition': `attachment; filename="${filename}.json"`
        }
      });
    }

    return new NextResponse(listing.expandedOutput || listing.stageOneOutput, {
      headers: {
        'content-type': 'text/markdown; charset=utf-8',
        'content-disposition': `attachment; filename="${filename}.md"`
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao exportar.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
