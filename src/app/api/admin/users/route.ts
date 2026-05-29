import { NextResponse } from 'next/server';
import { CreditReason } from '@prisma/client';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addCredits } from '@/lib/credits';

export async function GET() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, credits: true, createdAt: true, plan: true, _count: { select: { listings: true, documents: true } } }
    });
    return NextResponse.json({ users });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro administrativo.';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const { userId, credits } = (await request.json()) as { userId: string; credits: number };
    const user = await addCredits(userId, Number(credits), CreditReason.ADMIN_ADJUSTMENT, { source: 'admin_panel' });
    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao ajustar créditos.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
