import { redirect } from 'next/navigation';
import { Header } from '@/components/Header';
import { AdminClient } from '@/components/AdminClient';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'ADMIN') redirect('/dashboard');

  const [users, plans] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, credits: true, createdAt: true, plan: true, _count: { select: { listings: true, documents: true } } }
    }),
    prisma.plan.findMany({ orderBy: { priceCents: 'asc' } })
  ]);

  return (
    <main>
      <Header />
      <section className="container stack" style={{ paddingBottom: 48 }}>
        <div className="card highlight"><h1>Painel admin</h1><p>Gerencie planos pagos, usuários, créditos e acompanhe uso do SaaS.</p></div>
        <AdminClient users={users} plans={plans} />
      </section>
    </main>
  );
}
