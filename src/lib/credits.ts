import { CreditReason } from '@prisma/client';
import { prisma } from './prisma';

export async function chargeCredit(userId: string, amount: number, metadata: Record<string, unknown>) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuário não encontrado.');
    if (user.credits < amount) throw new Error('Créditos insuficientes. Faça upgrade do plano.');

    const updated = await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: amount } }
    });

    await tx.creditLedger.create({
      data: {
        userId,
        delta: -amount,
        reason: CreditReason.LISTING_GENERATION,
        metadata: JSON.stringify(metadata)
      }
    });

    return updated;
  });
}

export async function addCredits(userId: string, amount: number, reason: CreditReason, metadata?: Record<string, unknown>) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } }
    });
    await tx.creditLedger.create({
      data: { userId, delta: amount, reason, metadata: metadata ? JSON.stringify(metadata) : undefined }
    });
    return updated;
  });
}
