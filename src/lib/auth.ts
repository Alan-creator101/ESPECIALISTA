import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import { prisma } from './prisma';

const COOKIE_NAME = 'especialista_session';
const encoder = new TextEncoder();

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) {
    throw new Error('JWT_SECRET precisa ter pelo menos 32 caracteres.');
  }
  return encoder.encode(value);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = await jwtVerify(token, secret());
    const userId = payload.payload.sub;
    if (!userId) return null;
    return prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true }
    });
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Não autenticado.');
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'ADMIN') throw new Error('Acesso restrito ao administrador.');
  return user;
}
