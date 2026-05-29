import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Role, CreditReason } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { registerSchema } from '@/lib/validators';

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());
    const passwordHash = await bcrypt.hash(body.password, 12);
    const role = body.email === process.env.ADMIN_EMAIL ? Role.ADMIN : Role.USER;

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        passwordHash,
        role,
        credits: 10,
        creditEvents: {
          create: { delta: 10, reason: CreditReason.SIGNUP_BONUS, metadata: JSON.stringify({ source: 'signup' }) }
        }
      }
    });

    await createSession(user.id);
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, credits: user.credits } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao cadastrar.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
