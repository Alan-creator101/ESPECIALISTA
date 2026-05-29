'use client';

import { FormEvent, useState } from 'react';
import type { KnowledgeDocument, Listing, Plan } from '@prisma/client';

type Props = {
  user: { name: string; credits: number };
  listings: Listing[];
  documents: KnowledgeDocument[];
  plans: Plan[];
};

export function DashboardClient({ user, listings: initialListings, documents, plans }: Props) {
  const [listings, setListings] = useState(initialListings);
  const [activeListing, setActiveListing] = useState<Listing | null>(initialListings[0] || null);
  const [version, setVersion] = useState('1');
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function startListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading('stage1');
    setError('');
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch('/api/listings/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    setLoading('');
    if (!response.ok) return setError(data.error || 'Erro ao gerar etapa 1.');
    setListings([data.listing, ...listings]);
    setActiveListing(data.listing);
  }

  async function expandListing() {
    if (!activeListing) return;
    setLoading('stage2');
    setError('');
    const response = await fetch('/api/listings/expand', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ listingId: activeListing.id, selectedVersion: Number(version) })
    });
    const data = await response.json();
    setLoading('');
    if (!response.ok) return setError(data.error || 'Erro ao expandir etapa 2.');
    setActiveListing(data.listing);
    setListings(listings.map((listing) => (listing.id === data.listing.id ? data.listing : listing)));
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading('upload');
    setMessage('');
    setError('');
    const response = await fetch('/api/documents', { method: 'POST', body: new FormData(event.currentTarget) });
    const data = await response.json();
    setLoading('');
    if (!response.ok) return setError(data.error || 'Erro no upload.');
    setMessage(`Documento ${data.document.fileName} indexado com ${data.document.chunks} chunks.`);
  }

  async function subscribe(planId: string) {
    setLoading(`plan-${planId}`);
    setError('');
    const response = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ planId })
    });
    const data = await response.json();
    setLoading('');
    if (!response.ok) return setError(data.error || 'Erro ao contratar plano.');
    setMessage('Plano contratado e créditos adicionados.');
  }

  function exportListing(format: 'markdown' | 'json') {
    if (!activeListing) return;
    window.open(`/api/listings/export-download?listingId=${activeListing.id}&format=${format}`, '_blank');
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: '1.2fr 0.8fr' }}>
      <div className="stack">
        <form className="card stack" onSubmit={startListing}>
          <h2>Novo anúncio</h2>
          <div className="form-grid">
            <label>Nome do produto<input name="productName" required placeholder="Ex.: Kit 3 Organizadores" /></label>
            <label>Marketplace<select name="marketplace" defaultValue="Mercado Livre"><option>Mercado Livre</option><option>Shopee</option><option>Amazon</option><option>Magalu</option></select></label>
            <label>Custo produto<input name="cost" type="number" step="0.01" required /></label>
            <label>Preço de venda<input name="salePrice" type="number" step="0.01" required /></label>
            <label>Frete<input name="shippingCost" type="number" step="0.01" required /></label>
            <label>Comissão %<input name="commissionPercent" type="number" step="0.01" required /></label>
            <label>Ads %<input name="adsPercent" type="number" step="0.01" defaultValue="8" /></label>
            <label>Impostos %<input name="taxPercent" type="number" step="0.01" defaultValue="6" /></label>
            <label>Embalagem<input name="packagingCost" type="number" step="0.01" defaultValue="1.50" /></label>
            <label>Público-alvo<input name="targetAudience" placeholder="Ex.: mães, lojistas, gamers" /></label>
            <label className="full">Diferencial<textarea name="differentiator" required placeholder="O que faz seu produto vencer o concorrente?" /></label>
            <label className="full">Concorrência<textarea name="competitorNotes" placeholder="Preços, sellers, saturação, avaliações..." /></label>
            <label className="full">Logística<textarea name="logisticsNotes" placeholder="Full, flex, prazo, peso, risco de avaria..." /></label>
          </div>
          <button disabled={loading === 'stage1'}>{loading === 'stage1' ? 'Gerando 4 versões...' : 'Gerar etapa 1 (1 crédito)'}</button>
        </form>

        {activeListing && (
          <div className="card stack">
            <h2>Resultado</h2>
            <div className="pre">{activeListing.expandedOutput || activeListing.stageOneOutput}</div>
            {!activeListing.expandedOutput ? (
              <div className="nav-links">
                <select value={version} onChange={(event) => setVersion(event.target.value)} style={{ maxWidth: 180 }}>
                  <option value="1">Versão 1 — Dor</option>
                  <option value="2">Versão 2 — Benefício</option>
                  <option value="3">Versão 3 — Diferencial</option>
                  <option value="4">Versão 4 — Uso específico</option>
                </select>
                <button onClick={expandListing} disabled={loading === 'stage2'}>{loading === 'stage2' ? 'Expandindo...' : 'Expandir anúncio (2 créditos)'}</button>
              </div>
            ) : (
              <div className="nav-links">
                <button onClick={() => exportListing('markdown')}>Exportar Markdown</button>
                <button onClick={() => exportListing('json')}>Exportar JSON</button>
              </div>
            )}
          </div>
        )}
      </div>

      <aside className="stack">
        <div className="card highlight"><h2>Olá, {user.name}</h2><p><strong>{user.credits}</strong> créditos disponíveis.</p></div>
        {error && <div className="card error">{error}</div>}
        {message && <div className="card success">{message}</div>}
        <form className="card stack" onSubmit={uploadDocument}>
          <h2>Base de conhecimento RAG</h2>
          <p>Envie PDFs, TXT, CSV ou MD com personas, políticas, concorrentes, pesquisas e FAQs.</p>
          <input name="file" type="file" required accept=".txt,.csv,.md,.pdf,text/*,application/pdf" />
          <button disabled={loading === 'upload'}>{loading === 'upload' ? 'Indexando...' : 'Enviar documento'}</button>
          <p>{documents.length} documentos indexados.</p>
        </form>
        <div className="card stack">
          <h2>Planos pagos</h2>
          {plans.length === 0 && <p>Admin ainda não cadastrou planos.</p>}
          {plans.map((plan) => <div className="card stack" key={plan.id}><h3>{plan.name}</h3><p>R$ {(plan.priceCents / 100).toFixed(2)} / mês · {plan.monthlyCredits} créditos</p><p>{plan.features}</p><button onClick={() => subscribe(plan.id)} disabled={loading === `plan-${plan.id}`}>{loading === `plan-${plan.id}` ? 'Processando...' : 'Contratar plano'}</button></div>)}
        </div>
        <div className="card stack">
          <h2>Histórico</h2>
          {listings.map((listing) => <button className="button secondary" key={listing.id} onClick={() => setActiveListing(listing)}>{listing.productName}</button>)}
        </div>
      </aside>
    </div>
  );
}
