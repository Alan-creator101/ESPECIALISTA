import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';

export async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="container nav">
      <Link href="/" className="logo">Especialista<span>AI</span></Link>
      <nav className="nav-links">
        {user ? (
          <>
            <Link className="button secondary" href="/dashboard">Dashboard</Link>
            {user.role === 'ADMIN' && <Link className="button secondary" href="/admin">Admin</Link>}
            <span className="badge">{user.credits} créditos</span>
          </>
        ) : (
          <>
            <Link className="button secondary" href="/login">Entrar</Link>
            <Link className="button" href="/register">Começar</Link>
          </>
        )}
      </nav>
    </header>
  );
}
