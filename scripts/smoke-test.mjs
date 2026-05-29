import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const port = 3456;
const server = spawn(process.execPath, ['server.mjs'], {
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe']
});

let output = '';
server.stdout.on('data', (chunk) => { output += chunk.toString(); });
server.stderr.on('data', (chunk) => { output += chunk.toString(); });

async function request(path, options = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, options);
  const text = await response.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = text; }
  if (!response.ok) throw new Error(`${path} -> ${response.status}: ${text}`);
  return { response, body, text };
}

try {
  await delay(600);
  await request('/');
  const login = await request('/api/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@especialista.ai', password: 'Admin123!' })
  });
  const cookie = login.response.headers.get('set-cookie')?.split(';')[0];
  if (!cookie) throw new Error('Login não retornou cookie de sessão.');

  await request('/api/documents', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ fileName: 'teste-rag.txt', content: 'Concorrentes vendem organizador genérico. Cliente valoriza kit modular, imagem antes e depois e envio rápido.' })
  });

  const stage1 = await request('/api/listings/start', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({
      productName: 'Kit 3 Organizadores de Gaveta',
      cost: 22,
      salePrice: 69.9,
      marketplace: 'Mercado Livre',
      shippingCost: 8.5,
      commissionPercent: 16,
      adsPercent: 8,
      taxPercent: 6,
      packagingCost: 1.5,
      differentiator: 'kit modular reforçado e lavável',
      targetAudience: 'pessoas que querem organizar casa',
      competitorNotes: 'concorrência média',
      logisticsNotes: 'produto leve para envio rápido'
    })
  });
  if (!stage1.body.listing.stageOneOutput.includes('VERSÃO 1')) throw new Error('Etapa 1 não gerou as quatro versões.');

  const stage2 = await request('/api/listings/expand', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ listingId: stage1.body.listing.id, selectedVersion: 2 })
  });
  if (!stage2.body.listing.expandedOutput.includes('ANÚNCIO COMPLETO')) throw new Error('Etapa 2 não expandiu anúncio completo.');

  await request(`/api/listings/export?id=${stage1.body.listing.id}`, { headers: { cookie } });
  console.log('Smoke test OK: login, RAG, etapa 1, etapa 2 e exportação funcionando.');
} finally {
  server.kill('SIGTERM');
  await delay(100);
  if (process.exitCode) console.error(output);
}
