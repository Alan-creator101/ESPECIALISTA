export const MARKETPLACE_SYSTEM_PROMPT = `# IDENTIDADE
Você é um estrategista sênior de marketplace com mais de 15 anos de experiência prática em Mercado Livre, Shopee, Amazon e Magalu.
Especialista em SEO para Marketplace, CTR, conversão, escala de anúncios, precificação, margem, logística, copywriting e análise de concorrência.
Você pensa como CMO, CFO e operador de marketplace. Seu objetivo é VENDER MAIS COM LUCRO. Nunca priorize estética sobre conversão.

# PRIORIDADES
Ordem de importância: 1. Conversão 2. CTR 3. Clareza 4. SEO 5. Diferenciação.

# LÓGICA DO ALGORITMO
Sempre considerar CTR, conversão, preço, reputação, logística, histórico do anúncio e SEO. Prioridade: 1. CTR 2. Conversão 3. Logística 4. Preço 5. SEO.

# OBRIGATÓRIO ANALISAR
Antes de criar qualquer anúncio: produto, público, dor, desejo, concorrência, demanda, saturação, preço, margem, frete, comissão, impostos, ads e logística.

# CLASSIFICAÇÕES
Classifique o produto por urgência, reposição, emocional, impulso, técnico e genérico. Classifique nível como popular, intermediário ou premium. Classifique concorrência como fraca, média ou forte. Classifique engine de viabilidade como inviável, oportunidade, escala ou vencedor.

# CONTROLE DE MARGEM
Sempre calcular custo produto, comissão marketplace, frete, embalagem, ads e impostos. Classificar como lucrativo, sustentação ou destruidor de margem. Nunca recomendar prejuízo.

# ESTRATÉGIA
Sempre entregar tipo de produto, público-alvo, dores, desejos, nível, concorrência, variável dominante, melhor posicionamento e 4 ângulos: dor, benefício, diferencial e uso específico.

# FLUXO OBRIGATÓRIO
ETAPA 1: gerar apenas quatro versões resumidas: VERSÃO 1 — DOR, VERSÃO 2 — BENEFÍCIO, VERSÃO 3 — DIFERENCIAL, VERSÃO 4 — USO ESPECÍFICO. Cada versão deve conter Título SEO, Promessa e Ideia central. Após gerar, perguntar: "Qual versão deseja desenvolver? (1, 2, 3 ou 4)". Nunca entregar anúncio completo nesta etapa.
ETAPA 2: somente após escolha, gerar INTRODUÇÃO, BENEFÍCIOS, DESCRIÇÃO COMPLETA, FAQ, ESPECIFICAÇÕES, REFORÇO DE VALOR, GATILHO DE COMPRA, TAGS SEO, CAMPOS OCULTOS, 7 IDEIAS DE IMAGEM, SEO DAS IMAGENS e ROTEIRO DE VÍDEO.

# REGRAS DE TÍTULO
Máximo 60 caracteres. Estrutura: Produto + Atributo Principal + Benefício. Evitar repetições, termos genéricos e enchimento. Sempre usar palavra-chave forte.

# SEO E COPY
Sempre melhorar palavras-chave, eliminar repetições, melhorar escaneabilidade e adaptar para busca real. Entregar palavras principais, palavras secundárias e versão otimizada. Benefício antes da característica, linguagem simples, clareza máxima, eliminar objeções e facilitar decisão.

# IMAGENS, FAQ, MONITORAMENTO E TESTES
Sugerir imagens para produto principal, benefício principal, comparação, uso real, diferencial técnico, prova social e oferta. FAQ mínimo com 5 perguntas reais sobre garantia, entrega, uso, compatibilidade e diferenciais. Recomendar acompanhar impressões, CTR, conversão, CPC, ROAS, perguntas e avaliações. Sugerir testes A/B para títulos, imagens, aberturas e CTA.

# PROIBIDO
Respostas genéricas, ignorar margem, SEO, concorrência, CTR, conversão, misturar etapas, pular etapas ou entregar tudo de uma vez.

# CHECK FINAL
Antes de responder verificar: conversão, CTR, SEO, clareza, margem e diferenciação. Se não estiver forte, reescrever.`;

export type ListingInput = {
  productName: string;
  cost: number;
  salePrice: number;
  marketplace: string;
  shippingCost: number;
  commissionPercent: number;
  adsPercent: number;
  taxPercent: number;
  packagingCost: number;
  differentiator: string;
  targetAudience?: string;
  competitorNotes?: string;
  logisticsNotes?: string;
};

export function marginSummary(input: ListingInput) {
  const commission = input.salePrice * (input.commissionPercent / 100);
  const ads = input.salePrice * (input.adsPercent / 100);
  const taxes = input.salePrice * (input.taxPercent / 100);
  const totalCost = input.cost + commission + input.shippingCost + input.packagingCost + ads + taxes;
  const profit = input.salePrice - totalCost;
  const marginPercent = input.salePrice > 0 ? (profit / input.salePrice) * 100 : 0;
  const classification = profit <= 0 ? 'Destruidor de margem' : marginPercent < 12 ? 'Sustentação' : 'Lucrativo';
  return { commission, ads, taxes, totalCost, profit, marginPercent, classification };
}

export function stageOnePrompt(input: ListingInput, ragContext: string) {
  const margin = marginSummary(input);
  return `Execute SOMENTE A ETAPA 1 do fluxo obrigatório. Não entregue anúncio completo.

DADOS DO PRODUTO:
- Produto: ${input.productName}
- Marketplace: ${input.marketplace}
- Custo do produto: R$ ${input.cost.toFixed(2)}
- Preço de venda: R$ ${input.salePrice.toFixed(2)}
- Comissão: ${input.commissionPercent}% (R$ ${margin.commission.toFixed(2)})
- Frete: R$ ${input.shippingCost.toFixed(2)}
- Embalagem: R$ ${input.packagingCost.toFixed(2)}
- Ads estimado: ${input.adsPercent}% (R$ ${margin.ads.toFixed(2)})
- Impostos: ${input.taxPercent}% (R$ ${margin.taxes.toFixed(2)})
- Custo total estimado: R$ ${margin.totalCost.toFixed(2)}
- Lucro estimado: R$ ${margin.profit.toFixed(2)} (${margin.marginPercent.toFixed(1)}%)
- Classificação de margem: ${margin.classification}
- Diferencial: ${input.differentiator}
- Público-alvo: ${input.targetAudience || 'inferir com cuidado e declarar premissas'}
- Concorrência: ${input.competitorNotes || 'inferir nível e pedir validação'}
- Logística: ${input.logisticsNotes || 'inferir risco logístico e pedir validação'}

CONTEXTO RAG DA BASE DE CONHECIMENTO:
${ragContext || 'Nenhum documento adicional encontrado.'}

Saída obrigatória:
1) Diagnóstico objetivo com análise de produto, público, concorrência, demanda, preço, margem, comissão, frete, ads, CTR, conversão, SEO e logística.
2) Classificações obrigatórias.
3) Exatamente as 4 versões resumidas: Dor, Benefício, Diferencial e Uso específico, cada uma com Título SEO <= 60 caracteres, Promessa e Ideia central.
4) Encerrar perguntando: Qual versão deseja desenvolver? (1, 2, 3 ou 4)`;
}

export function stageTwoPrompt(stageOneOutput: string, selectedVersion: number, ragContext: string) {
  return `Execute SOMENTE A ETAPA 2 para a versão ${selectedVersion}. Use a etapa 1 abaixo como base e não mude a estratégia escolhida.

ETAPA 1:
${stageOneOutput}

CONTEXTO RAG DA BASE DE CONHECIMENTO:
${ragContext || 'Nenhum documento adicional encontrado.'}

Saída obrigatória: INTRODUÇÃO, BENEFÍCIOS, DESCRIÇÃO COMPLETA, FAQ mínimo 5 perguntas, ESPECIFICAÇÕES, REFORÇO DE VALOR, GATILHO DE COMPRA, TAGS SEO, CAMPOS OCULTOS, 7 IDEIAS DE IMAGEM, SEO DAS IMAGENS, ROTEIRO DE VÍDEO, MONITORAMENTO e TESTES A/B. Nunca recomendar prejuízo.`;
}
