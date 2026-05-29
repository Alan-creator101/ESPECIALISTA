import Link from 'next/link';
import { Header } from '@/components/Header';

export default function Home() {
  return (
    <main>
      <Header />
      <section className="container hero">
        <div>
          <span className="badge">IA sênior para Mercado Livre e marketplaces</span>
          <h1>Otimize anúncios para vender mais com lucro.</h1>
          <p>
            Um SaaS que combina estratégia de marketplace, controle de margem, SEO, CTR, conversão e RAG sobre sua base de conhecimento para gerar anúncios sem respostas genéricas.
          </p>
          <div className="nav-links">
            <Link className="button" href="/register">Criar conta grátis</Link>
            <Link className="button secondary" href="/login">Acessar painel</Link>
          </div>
        </div>
        <div className="card highlight stack">
          <h2>Fluxo obrigatório da IA</h2>
          <p>1. Produto e dados essenciais → 2. Quatro ângulos resumidos → 3. Escolha da versão → 4. Anúncio completo → 5. Salvar, descontar créditos e exportar.</p>
          <div className="kpis">
            <div className="card kpi"><strong>CTR</strong><p>imagem e título</p></div>
            <div className="card kpi"><strong>SEO</strong><p>busca real</p></div>
            <div className="card kpi"><strong>R$</strong><p>margem</p></div>
            <div className="card kpi"><strong>RAG</strong><p>documentos</p></div>
          </div>
        </div>
      </section>
      <section className="container grid">
        {['Controle de margem por custo, frete, comissão, ads e impostos', 'Planos pagos e créditos por geração', 'Admin para planos, usuários e ajustes de crédito'].map((item) => (
          <div className="card" key={item}><h3>{item}</h3><p>Construído para operação real de marketplace, não apenas geração de texto.</p></div>
        ))}
      </section>
    </main>
  );
}
