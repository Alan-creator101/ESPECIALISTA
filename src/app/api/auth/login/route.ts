import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { credentialsSchema } from '@/lib/validators';

export async function POST(request: Request) {
  try {
    const body = credentialsSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
    }

    await createSession(user.id);
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, credits: user.credits } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao entrar.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
