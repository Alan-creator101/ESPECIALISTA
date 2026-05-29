# Especialista AI — SaaS de Otimização de Anúncios de Marketplace

Este repositório agora inclui um **modo funcional sem dependências externas** para você ver o SaaS rodando imediatamente no navegador.

## Como ver funcionando

```bash
npm install
npm run dev
```

Abra:

```text
http://localhost:3000
```

Login demo admin:

```text
admin@especialista.ai
Admin123!
```

> O banco local é um arquivo JSON em `data/db.json`, criado automaticamente na primeira execução.

## O que funciona no demo

- Frontend completo em uma SPA servida pelo Node.
- Backend HTTP em Node puro, sem pacotes externos.
- Autenticação com cookie de sessão HTTP-only.
- Cadastro de usuário com bônus de 10 créditos.
- Login admin demo com 50 créditos.
- Sistema de créditos:
  - etapa 1 consome 1 crédito;
  - etapa 2 consome 2 créditos;
  - plano pago mock adiciona créditos.
- Planos pagos mock no painel.
- Painel admin para criar planos.
- Área RAG para salvar documentos/base de conhecimento.
- Geração da etapa 1 com exatamente 4 versões resumidas:
  - Dor;
  - Benefício;
  - Diferencial;
  - Uso específico.
- Expansão da etapa 2 somente após escolha da versão.
- Cálculo de margem com custo, comissão, frete, embalagem, ads e impostos.
- Classificação de margem: Lucrativo, Sustentação ou Destruidor de margem.
- Exportação do anúncio em Markdown.

## Fluxo obrigatório implementado

1. Usuário informa produto e dados essenciais:
   - nome do produto;
   - custo;
   - preço de venda;
   - marketplace;
   - frete;
   - comissão;
   - ads;
   - impostos;
   - embalagem;
   - diferencial;
   - público;
   - concorrência;
   - logística.
2. O sistema gera apenas a etapa 1 com 4 versões resumidas.
3. Usuário escolhe uma versão.
4. O sistema gera a etapa 2 com anúncio completo.
5. O anúncio fica salvo no banco JSON.
6. Créditos são descontados no ledger local.
7. O anúncio pode ser exportado.

## Teste automatizado

```bash
npm test
```

O teste sobe o servidor, faz login, salva documento RAG, gera etapa 1, expande etapa 2 e valida exportação.

## Observação sobre OpenAI/Next/Prisma

A versão anterior tinha scaffold Next.js/Prisma/OpenAI, mas o ambiente bloqueou instalação de dependências (`403` no registry para `@prisma/client`). Para atender ao pedido de ver em funcionamento, adicionei este modo Node puro executável imediatamente. Os arquivos do scaffold continuam no repositório como base para uma evolução com dependências reais quando o registry estiver liberado.
