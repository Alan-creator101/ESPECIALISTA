# Especialista AI — SaaS de Otimização de Anúncios de Marketplace

SaaS full-stack em Next.js para criação de anúncios com IA estratégica para Mercado Livre, Shopee, Amazon e Magalu.

## Funcionalidades

- Frontend responsivo com landing page, autenticação, dashboard e painel admin.
- Backend via API Routes do Next.js.
- Banco SQLite com Prisma para usuários, planos, anúncios, créditos e documentos.
- Autenticação por sessão JWT em cookie HTTP-only.
- Sistema de créditos: cadastro ganha 10 créditos; etapa 1 consome 1 crédito; etapa 2 consome 2 créditos.
- Planos pagos cadastráveis no admin e checkout mock para ativar plano e renovar créditos.
- Integração OpenAI para geração e embeddings.
- Upload de documentos TXT/CSV/MD/PDF.
- RAG simples com chunking, embeddings e similaridade cosseno.
- Exportação de anúncio em Markdown ou JSON.

## Fluxo obrigatório da IA

1. Usuário informa dados essenciais do produto: nome, custo, preço de venda, marketplace, frete, comissão, diferencial, ads, impostos, embalagem, público, concorrência e logística.
2. A IA gera apenas quatro versões resumidas: Dor, Benefício, Diferencial e Uso específico.
3. Usuário escolhe uma versão.
4. A IA expande o anúncio completo.
5. O sistema salva no banco, desconta créditos e permite exportação.

## Como rodar

```bash
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run dev
```

Configure `OPENAI_API_KEY` para usar a IA real. Sem chave, o app retorna uma resposta demo para validação do fluxo.

## Admin

Defina `ADMIN_EMAIL` no `.env`. O usuário cadastrado com esse e-mail será criado como administrador.
