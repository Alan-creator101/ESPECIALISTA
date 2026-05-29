import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { chargeCredit } from '@/lib/credits';
import { prisma } from '@/lib/prisma';
import { runMarketplaceAI } from '@/lib/openai';
import { retrieveContext } from '@/lib/rag';
import { stageTwoPrompt } from '@/lib/marketplacePrompt';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { listingId, selectedVersion } = (await request.json()) as { listingId: string; selectedVersion: number };
    if (![1, 2, 3, 4].includes(selectedVersion)) throw new Error('Escolha uma versão entre 1 e 4.');

    const listing = await prisma.listing.findFirst({ where: { id: listingId, userId: user.id } });
    if (!listing) throw new Error('Anúncio não encontrado.');

    const ragContext = await retrieveContext(user.id, `${listing.productName} versão ${selectedVersion}`);
    const output = await runMarketplaceAI(stageTwoPrompt(listing.stageOneOutput, selectedVersion, ragContext));
    const updated = await prisma.listing.update({
      where: { id: listing.id },
      data: { selectedVersion, expandedOutput: output, status: 'EXPANDED' }
    });

    await chargeCredit(user.id, 2, { listingId: listing.id, step: 'stage_two', selectedVersion });
    return NextResponse.json({ listing: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao expandir anúncio.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
