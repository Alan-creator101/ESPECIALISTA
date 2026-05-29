import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { chargeCredit } from '@/lib/credits';
import { prisma } from '@/lib/prisma';
import { runMarketplaceAI } from '@/lib/openai';
import { retrieveContext } from '@/lib/rag';
import { stageOnePrompt } from '@/lib/marketplacePrompt';
import { listingSchema } from '@/lib/validators';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = listingSchema.parse(await request.json());
    const ragContext = await retrieveContext(user.id, `${input.productName} ${input.marketplace} ${input.differentiator}`);
    const prompt = stageOnePrompt(input, ragContext);
    const output = await runMarketplaceAI(prompt);

    const listing = await prisma.listing.create({
      data: { ...input, userId: user.id, stageOneOutput: output }
    });

    await chargeCredit(user.id, 1, { listingId: listing.id, step: 'stage_one' });
    return NextResponse.json({ listing });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao gerar versões.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
