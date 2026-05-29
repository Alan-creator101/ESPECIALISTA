import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Especialista AI | Otimização de Anúncios de Marketplace',
  description: 'SaaS com IA, créditos, RAG e fluxo de anúncios para Mercado Livre, Shopee, Amazon e Magalu.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
