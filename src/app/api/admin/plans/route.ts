import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const plans = await prisma.plan.findMany({ orderBy: { priceCents: 'asc' } });
  return NextResponse.json({ plans });
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as { name: string; priceCents: number; monthlyCredits: number; features: string };
    const plan = await prisma.plan.upsert({
      where: { name: body.name },
      update: body,
      create: body
    });
    return NextResponse.json({ plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao salvar plano.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
