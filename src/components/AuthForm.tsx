'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch(`/api/auth/${mode}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) return setError(data.error || 'Erro inesperado.');
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <form className="card stack" onSubmit={submit}>
      <h2>{mode === 'login' ? 'Entrar' : 'Cadastrar'}</h2>
      {mode === 'register' && <label>Nome<input name="name" required minLength={2} /></label>}
      <label>E-mail<input name="email" type="email" required /></label>
      <label>Senha<input name="password" type="password" required minLength={8} /></label>
      {error && <p className="error">{error}</p>}
      <button disabled={loading}>{loading ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
    </form>
  );
}
