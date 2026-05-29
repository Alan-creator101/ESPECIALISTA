import OpenAI from 'openai';
import { MARKETPLACE_SYSTEM_PROMPT } from './marketplacePrompt';

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'missing-key' });

export async function runMarketplaceAI(userPrompt: string) {
  if (!process.env.OPENAI_API_KEY) {
    return `[MODO DEMO - configure OPENAI_API_KEY]\n\n${mockStrategy(userPrompt)}`;
  }

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    temperature: 0.35,
    messages: [
      { role: 'system', content: MARKETPLACE_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ]
  });

  return response.choices[0]?.message?.content || 'Não foi possível gerar a estratégia.';
}

export async function embedText(text: string) {
  if (!process.env.OPENAI_API_KEY) {
    return demoEmbedding(text);
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000)
  });

  return response.data[0].embedding;
}

function demoEmbedding(text: string) {
  const vector = new Array(64).fill(0);
  for (let i = 0; i < text.length; i += 1) {
    vector[i % vector.length] += text.charCodeAt(i) / 255;
  }
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / norm);
}

function mockStrategy(prompt: string) {
  const product = prompt.match(/Produto: (.*)/)?.[1] || 'Produto informado';
  return `Diagnóstico objetivo: ${product} deve ser validado por margem, CTR de imagem principal, preço final com frete e força da concorrência. Sem chave OpenAI, este é um retorno de demonstração para validar o fluxo.

Classificações:
- Tipo: técnico / conversão por benefício
- Nível: intermediário
- Concorrência: média
- Engine de viabilidade: oportunidade
- Margem: validar antes de escalar ads

VERSÃO 1 — DOR
- Título SEO: ${product.slice(0, 32)} Contra Dor Principal
- Promessa: reduzir a fricção mais urgente do comprador sem comprometer margem.
- Ideia central: atacar a objeção e mostrar solução clara.

VERSÃO 2 — BENEFÍCIO
- Título SEO: ${product.slice(0, 30)} Mais Resultado
- Promessa: entregar ganho direto e fácil de entender.
- Ideia central: benefício antes de característica para elevar conversão.

VERSÃO 3 — DIFERENCIAL
- Título SEO: ${product.slice(0, 28)} Diferencial Forte
- Promessa: destacar o motivo racional para comprar deste anúncio.
- Ideia central: separar o produto dos genéricos da busca.

VERSÃO 4 — USO ESPECÍFICO
- Título SEO: ${product.slice(0, 26)} Para Uso Diário
- Promessa: mostrar aplicação concreta e reduzir dúvida de compatibilidade.
- Ideia central: conectar o produto a uma situação real de compra.

Qual versão deseja desenvolver? (1, 2, 3 ou 4)`;
}
