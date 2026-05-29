import { AuthForm } from '@/components/AuthForm';
import { Header } from '@/components/Header';

export default function RegisterPage() {
  return (
    <main>
      <Header />
      <section className="container hero">
        <div>
          <span className="badge">10 créditos grátis</span>
          <h1>Crie sua conta.</h1>
          <p>Cadastre-se, envie documentos de referência e gere anúncios seguindo o fluxo obrigatório.</p>
        </div>
        <AuthForm mode="register" />
      </section>
    </main>
  );
}
