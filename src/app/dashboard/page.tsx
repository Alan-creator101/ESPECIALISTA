import { redirect } from 'next/navigation';
import { Header } from '@/components/Header';
import { DashboardClient } from '@/components/DashboardClient';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [listings, documents, plans] = await Promise.all([
    prisma.listing.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 12 }),
    prisma.knowledgeDocument.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 8 }),
    prisma.plan.findMany({ where: { active: true }, orderBy: { priceCents: 'asc' } })
  ]);

  return (
    <main>
      <Header />
      <section className="container stack" style={{ paddingBottom: 48 }}>
        <div className="card highlight">
          <h1>Painel de otimização</h1>
          <p>Informe dados essenciais. A IA primeiro gera somente 4 versões resumidas; o anúncio completo só aparece após a escolha da versão.</p>
        </div>
        <DashboardClient user={{ name: user.name, credits: user.credits }} listings={listings} documents={documents} plans={plans} />
      </section>
    </main>
  );
}
