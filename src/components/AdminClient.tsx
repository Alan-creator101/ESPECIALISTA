'use client';

import { FormEvent, useState } from 'react';
import type { Plan } from '@prisma/client';

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  credits: number;
  createdAt: Date;
  plan: Plan | null;
  _count: { listings: number; documents: number };
};

export function AdminClient({ users, plans }: { users: AdminUser[]; plans: Plan[] }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function createPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch('/api/admin/plans', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...payload, priceCents: Number(payload.priceCents), monthlyCredits: Number(payload.monthlyCredits) })
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error || 'Erro ao salvar plano.');
    setMessage(`Plano ${data.plan.name} salvo.`);
  }

  async function adjustCredits(userId: string) {
    const credits = prompt('Quantos créditos adicionar? Use negativo para remover.');
    if (!credits) return;
    const response = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId, credits: Number(credits) })
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error || 'Erro ao ajustar créditos.');
    setMessage(`Créditos de ${data.user.email} atualizados.`);
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: '0.8fr 1.2fr' }}>
      <div className="stack">
        {message && <div className="card success">{message}</div>}
        {error && <div className="card error">{error}</div>}
        <form className="card stack" onSubmit={createPlan}>
          <h2>Criar/atualizar plano</h2>
          <label>Nome<input name="name" required placeholder="Growth" /></label>
          <label>Preço em centavos<input name="priceCents" type="number" required placeholder="9900" /></label>
          <label>Créditos mensais<input name="monthlyCredits" type="number" required placeholder="100" /></label>
          <label>Features<textarea name="features" required placeholder="RAG, exportação, suporte..." /></label>
          <button>Salvar plano</button>
        </form>
        <div className="card stack">
          <h2>Planos</h2>
          {plans.map((plan) => <p key={plan.id}><strong>{plan.name}</strong> · R$ {(plan.priceCents / 100).toFixed(2)} · {plan.monthlyCredits} créditos</p>)}
        </div>
      </div>
      <div className="card stack">
        <h2>Usuários</h2>
        {users.map((user) => (
          <div className="card" key={user.id}>
            <h3>{user.name} · {user.role}</h3>
            <p>{user.email}</p>
            <p>{user.credits} créditos · {user._count.listings} anúncios · {user._count.documents} documentos</p>
            <button onClick={() => adjustCredits(user.id)}>Ajustar créditos</button>
          </div>
        ))}
      </div>
    </div>
  );
}
