import { AuthForm } from '@/components/AuthForm';
import { Header } from '@/components/Header';

export default function LoginPage() {
  return (
    <main>
      <Header />
      <section className="container hero">
        <div>
          <span className="badge">Acesso</span>
          <h1>Entre no painel.</h1>
          <p>Continue gerando anúncios com estratégia, RAG e controle de créditos.</p>
        </div>
        <AuthForm mode="login" />
      </section>
    </main>
  );
}
