import { NextResponse } from 'next/server';
import { CreditReason } from '@prisma/client';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { planId } = (await request.json()) as { planId: string };
    const plan = await prisma.plan.findFirst({ where: { id: planId, active: true } });
    if (!plan) throw new Error('Plano não encontrado ou inativo.');

    const updated = await prisma.$transaction(async (tx) => {
      const account = await tx.user.update({
        where: { id: user.id },
        data: { planId: plan.id, credits: { increment: plan.monthlyCredits } }
      });
      await tx.creditLedger.create({
        data: {
          userId: user.id,
          delta: plan.monthlyCredits,
          reason: CreditReason.PLAN_RENEWAL,
          metadata: JSON.stringify({ planId: plan.id, priceCents: plan.priceCents, provider: 'mock-checkout' })
        }
      });
      return account;
    });

    return NextResponse.json({ user: updated, checkout: { status: 'paid', provider: 'mock-checkout' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao contratar plano.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
