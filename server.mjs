import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash, randomBytes, randomUUID } from 'node:crypto';

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = join(process.cwd(), 'data');
const DB_FILE = join(DATA_DIR, 'db.json');
const COOKIE = 'especialista_session';
const now = () => new Date().toISOString();

const SYSTEM_BEHAVIOR = `IA estrategista sênior de marketplace: Mercado Livre, Shopee, Amazon e Magalu. Prioridades: conversão, CTR, clareza, SEO e diferenciação. Sempre analisa produto, público, concorrência, demanda, preço, margem, comissão, frete, ads e logística. Fluxo obrigatório em duas etapas: 1) quatro versões resumidas; 2) expansão apenas após escolha.`;

async function ensureDb() {
  await mkdir(DATA_DIR, { recursive: true });
  if (!existsSync(DB_FILE)) {
    const admin = createUser('Admin', 'admin@especialista.ai', 'Admin123!', 'ADMIN');
    await saveDb({
      users: [admin],
      sessions: [],
      listings: [],
      documents: [],
      creditLedger: [{ id: randomUUID(), userId: admin.id, delta: 50, reason: 'ADMIN_SEED', createdAt: now() }],
      plans: [
        { id: randomUUID(), name: 'Starter', priceCents: 4900, monthlyCredits: 40, features: '40 créditos, RAG e exportação', active: true },
        { id: randomUUID(), name: 'Growth', priceCents: 9900, monthlyCredits: 120, features: '120 créditos, admin, RAG e exportação', active: true },
        { id: randomUUID(), name: 'Scale', priceCents: 19900, monthlyCredits: 350, features: '350 créditos para operação de escala', active: true }
      ]
    });
  }
}

async function loadDb() {
  await ensureDb();
  return JSON.parse(await readFile(DB_FILE, 'utf8'));
}

async function saveDb(db) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DB_FILE, JSON.stringify(db, null, 2));
}

function createUser(name, email, password, role = 'USER') {
  const salt = randomBytes(16).toString('hex');
  return {
    id: randomUUID(),
    name,
    email: email.toLowerCase(),
    passwordHash: `${salt}:${hashPassword(password, salt)}`,
    role,
    credits: role === 'ADMIN' ? 50 : 10,
    planId: null,
    createdAt: now(),
    updatedAt: now()
  };
}

function hashPassword(password, salt) {
  return createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

function verifyPassword(password, passwordHash) {
  const [salt, hash] = passwordHash.split(':');
  return hashPassword(password, salt) === hash;
}

function send(res, status, body, headers = {}) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, { 'content-type': typeof body === 'string' ? 'text/html; charset=utf-8' : 'application/json; charset=utf-8', ...headers });
  res.end(payload);
}

function json(res, status, body) {
  send(res, status, body, { 'content-type': 'application/json; charset=utf-8' });
}

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map((item) => {
    const [key, ...value] = item.trim().split('=');
    return [key, decodeURIComponent(value.join('='))];
  }));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return Object.fromEntries(new URLSearchParams(raw)); }
}

async function currentUser(req, db) {
  const token = parseCookies(req)[COOKIE];
  if (!token) return null;
  const session = db.sessions.find((item) => item.token === token && new Date(item.expiresAt) > new Date());
  if (!session) return null;
  return db.users.find((user) => user.id === session.userId) || null;
}

function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

function requireNumber(value, fallback = 0) {
  const number = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(number) ? number : fallback;
}

function margin(input) {
  const commission = input.salePrice * (input.commissionPercent / 100);
  const ads = input.salePrice * (input.adsPercent / 100);
  const taxes = input.salePrice * (input.taxPercent / 100);
  const totalCost = input.cost + commission + input.shippingCost + input.packagingCost + ads + taxes;
  const profit = input.salePrice - totalCost;
  const marginPercent = input.salePrice > 0 ? (profit / input.salePrice) * 100 : 0;
  const classification = profit <= 0 ? 'Destruidor de margem' : marginPercent < 12 ? 'Sustentação' : 'Lucrativo';
  return { commission, ads, taxes, totalCost, profit, marginPercent, classification };
}

function classify(input, m, context) {
  const text = `${input.productName} ${input.differentiator} ${input.targetAudience} ${context}`.toLowerCase();
  const technical = /compat|modelo|técnic|tecnic|voltagem|medida|sensor|usb|bluetooth|peça/.test(text);
  const emotional = /presente|decor|beleza|pet|infantil|moda|premium/.test(text);
  const urgent = /reparo|dor|segurança|urgente|quebrou|proteção/.test(text);
  const replenishment = /kit|refil|descart|unidade|pacote|consumo|reposição/.test(text);
  const impulse = input.salePrice < 80 || /oferta|brinde|novidade/.test(text);
  const competition = /muito|forte|saturad|vários|varios|concorr/.test(String(input.competitorNotes).toLowerCase()) ? 'Forte' : input.salePrice < 60 ? 'Forte' : 'Média';
  const level = input.salePrice > 250 || /premium|profissional/.test(text) ? 'Premium' : input.salePrice > 80 ? 'Intermediário' : 'Popular';
  const viability = m.profit <= 0 ? 'Inviável' : m.marginPercent > 25 && competition !== 'Forte' ? 'Vencedor' : m.marginPercent > 18 ? 'Escala' : 'Oportunidade';
  return {
    type: [urgent && 'Urgência', replenishment && 'Reposição', emotional && 'Emocional', impulse && 'Impulso', technical && 'Técnico', 'Genérico'].filter(Boolean).join(' / '),
    level,
    competition,
    viability,
    dominant: competition === 'Forte' ? 'CTR + diferenciação na primeira imagem' : 'Conversão + margem',
    positioning: m.classification === 'Destruidor de margem' ? 'Reprecificar antes de escalar' : `Posicionar como ${level.toLowerCase()} com promessa objetiva e prova do diferencial`
  };
}

function retrieveContext(db, userId, query) {
  const docs = db.documents.filter((doc) => doc.userId === userId);
  const terms = query.toLowerCase().split(/\W+/).filter((term) => term.length > 2);
  return docs
    .map((doc) => ({ doc, score: terms.reduce((sum, term) => sum + (doc.content.toLowerCase().includes(term) ? 1 : 0), 0) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ doc }) => `Fonte: ${doc.fileName}\n${doc.content.slice(0, 900)}`)
    .join('\n\n---\n\n');
}

function title(product, suffix) {
  const base = `${product} ${suffix}`.replace(/\s+/g, ' ').trim();
  return base.length <= 60 ? base : base.slice(0, 57).trim() + '...';
}

function stageOne(input, context) {
  const m = margin(input);
  const c = classify(input, m, context);
  const warning = m.profit <= 0 ? '\n⚠️ ALERTA: não escalar. O preço atual destrói margem; reprecifique antes de comprar tráfego.' : '';
  return `DIAGNÓSTICO ESTRATÉGICO\nProduto: ${input.productName}\nPúblico-alvo: ${input.targetAudience || 'comprador com intenção ativa no marketplace'}\nConcorrência: ${c.competition}\nDemanda: validar por impressões, perguntas e vendas dos líderes.\nPreço: R$ ${input.salePrice.toFixed(2)}\nMargem: R$ ${m.profit.toFixed(2)} (${m.marginPercent.toFixed(1)}%) — ${m.classification}\nComissão: R$ ${m.commission.toFixed(2)} | Frete: R$ ${input.shippingCost.toFixed(2)} | Ads: R$ ${m.ads.toFixed(2)} | Impostos: R$ ${m.taxes.toFixed(2)}\nCTR: imagem principal deve mostrar produto + benefício em até 3 segundos.\nConversão: reduzir objeções de compatibilidade, entrega, garantia e diferencial.\nSEO: usar palavra-chave forte no início, sem repetição.\nLogística: ${input.logisticsNotes || 'priorizar prazo curto, embalagem segura e disponibilidade de estoque.'}${warning}\n\nCLASSIFICAÇÕES\nTipo de produto: ${c.type}\nNível: ${c.level}\nConcorrência: ${c.competition}\nEngine de viabilidade: ${c.viability}\nVariável dominante: ${c.dominant}\nMelhor posicionamento: ${c.positioning}\n\nVERSÃO 1 — DOR\n- Título SEO: ${title(input.productName, 'Resolve Dor Rápido')}\n- Promessa: eliminar a dor principal do comprador sem criar risco de prejuízo.\n- Ideia central: abrir o anúncio mostrando o problema que o produto resolve e a segurança da compra.\n\nVERSÃO 2 — BENEFÍCIO\n- Título SEO: ${title(input.productName, 'Mais Praticidade')}\n- Promessa: entregar benefício direto, fácil de entender e com foco em conversão.\n- Ideia central: vender o resultado antes das características técnicas.\n\nVERSÃO 3 — DIFERENCIAL\n- Título SEO: ${title(input.productName, 'Com Diferencial Real')}\n- Promessa: provar por que este anúncio é melhor que opções genéricas.\n- Ideia central: destacar ${input.differentiator} como motivo racional de compra.\n\nVERSÃO 4 — USO ESPECÍFICO\n- Título SEO: ${title(input.productName, 'Para Uso Diário')}\n- Promessa: conectar o produto a uma situação real de uso e reduzir dúvida.\n- Ideia central: mostrar aplicação prática para o público-alvo e aumentar decisão rápida.\n\nQual versão deseja desenvolver? (1, 2, 3 ou 4)`;
}

function stageTwo(listing, selectedVersion) {
  const input = listing.input;
  const m = margin(input);
  const angle = ['Dor', 'Benefício', 'Diferencial', 'Uso específico'][selectedVersion - 1];
  const mainKeyword = input.productName.split(' ').slice(0, 4).join(' ');
  return `ANÚNCIO COMPLETO — VERSÃO ${selectedVersion}: ${angle.toUpperCase()}\n\nINTRODUÇÃO\nCompre ${input.productName} com foco em resultado, segurança e decisão simples. Este anúncio foi estruturado para destacar o benefício principal, reduzir objeções e proteger margem.\n\nBENEFÍCIOS\n- Resolve a necessidade principal com clareza.\n- Diferencial competitivo: ${input.differentiator}.\n- Compra mais segura com informações objetivas.\n- Melhor leitura para mobile e busca do ${input.marketplace}.\n- Posicionamento sem prometer prejuízo: margem estimada ${m.classification}.\n\nDESCRIÇÃO COMPLETA\nO ${input.productName} é indicado para ${input.targetAudience || 'quem busca uma solução prática e confiável'}. A copy deve começar pelo benefício, depois provar o diferencial e finalizar removendo objeções de entrega, uso, compatibilidade e garantia. Evite frases genéricas: destaque o que muda na vida do comprador e por que comprar agora neste anúncio.\n\nFAQ\n1. Tem garantia? Sim. Informe a garantia real do vendedor/fabricante e deixe isso visível.\n2. A entrega é rápida? Depende da modalidade do marketplace; priorize envio imediato e logística full/flex quando possível.\n3. Como usar? Use conforme a finalidade indicada e inclua instruções simples nas imagens.\n4. É compatível com meu caso? Confira medidas/modelo/variação antes da compra; se tiver dúvida, pergunte no campo de perguntas.\n5. Qual o diferencial? ${input.differentiator}.\n\nESPECIFICAÇÕES\n- Produto: ${input.productName}\n- Marketplace: ${input.marketplace}\n- Público: ${input.targetAudience || 'intenção de compra ativa'}\n- Preço: R$ ${input.salePrice.toFixed(2)}\n- Margem estimada: R$ ${m.profit.toFixed(2)} (${m.marginPercent.toFixed(1)}%)\n\nREFORÇO DE VALOR\nVocê não está comprando apenas o produto; está comprando praticidade, redução de risco e uma solução com diferencial claro frente aos genéricos.\n\nGATILHO DE COMPRA\nSe o produto atende sua necessidade, compre agora para garantir disponibilidade e envio no menor prazo possível.\n\nTAGS SEO\n${mainKeyword}, ${input.marketplace}, oferta, original, pronta entrega, garantia, ${input.differentiator.split(' ').slice(0, 5).join(' ')}\n\nCAMPOS OCULTOS\npalavras principais: ${mainKeyword}\npalavras secundárias: benefício, diferencial, compatibilidade, garantia, pronta entrega\nversão otimizada: ${title(input.productName, input.differentiator.split(' ').slice(0, 3).join(' '))}\n\n7 IDEIAS DE IMAGEM\n1. Produto principal com fundo limpo e benefício em texto curto.\n2. Benefício principal em antes/depois.\n3. Comparação contra produto genérico.\n4. Uso real por ${input.targetAudience || 'cliente ideal'}.\n5. Close no diferencial técnico.\n6. Prova social: avaliações, volume ou garantia.\n7. Oferta: envio rápido + compra segura.\n\nSEO DAS IMAGENS\nUse nomes como ${mainKeyword.toLowerCase().replace(/\s+/g, '-')}-beneficio.webp, ${mainKeyword.toLowerCase().replace(/\s+/g, '-')}-uso-real.webp e ${mainKeyword.toLowerCase().replace(/\s+/g, '-')}-diferencial.webp.\n\nROTEIRO DE VÍDEO\nGancho: cansado de escolher produto igual sem saber qual vale a pena?\nProblema: opções genéricas não deixam claro benefício, compatibilidade e prazo.\nSolução: apresente ${input.productName}.\nDemonstração: mostre uso real e diferencial.\nBenefícios: clareza, praticidade e compra segura.\nCTA: compre agora pelo marketplace.\n\nMONITORAMENTO\nAcompanhe impressões, CTR, conversão, CPC, ROAS, perguntas e avaliações.\n\nTESTES A/B\nTeste título, imagem principal, abertura da descrição e CTA.`;
}

function normalizeListing(body) {
  return {
    productName: String(body.productName || '').trim(),
    cost: requireNumber(body.cost),
    salePrice: requireNumber(body.salePrice),
    marketplace: String(body.marketplace || 'Mercado Livre'),
    shippingCost: requireNumber(body.shippingCost),
    commissionPercent: requireNumber(body.commissionPercent),
    adsPercent: requireNumber(body.adsPercent, 8),
    taxPercent: requireNumber(body.taxPercent, 6),
    packagingCost: requireNumber(body.packagingCost, 1.5),
    differentiator: String(body.differentiator || '').trim(),
    targetAudience: String(body.targetAudience || '').trim(),
    competitorNotes: String(body.competitorNotes || '').trim(),
    logisticsNotes: String(body.logisticsNotes || '').trim()
  };
}

async function route(req, res) {
  const db = await loadDb();
  const url = new URL(req.url, `http://${req.headers.host}`);
  const user = await currentUser(req, db);

  if (req.method === 'HEAD' && url.pathname === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end();
  }
  if (req.method === 'GET' && url.pathname === '/') return send(res, 200, html());
  if (req.method === 'GET' && url.pathname === '/api/me') return json(res, user ? 200 : 401, { user: publicUser(user), system: SYSTEM_BEHAVIOR });

  if (req.method === 'POST' && url.pathname === '/api/register') {
    const body = await readBody(req);
    if (!body.name || !body.email || !body.password || String(body.password).length < 8) return json(res, 400, { error: 'Informe nome, e-mail e senha com pelo menos 8 caracteres.' });
    if (db.users.some((item) => item.email === String(body.email).toLowerCase())) return json(res, 409, { error: 'E-mail já cadastrado.' });
    const created = createUser(String(body.name), String(body.email), String(body.password));
    db.users.push(created);
    db.creditLedger.push({ id: randomUUID(), userId: created.id, delta: 10, reason: 'SIGNUP_BONUS', createdAt: now() });
    const token = randomUUID();
    db.sessions.push({ token, userId: created.id, expiresAt: new Date(Date.now() + 7 * 864e5).toISOString() });
    await saveDb(db);
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'set-cookie': `${COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax` });
    return res.end(JSON.stringify({ user: publicUser(created) }));
  }

  if (req.method === 'POST' && url.pathname === '/api/login') {
    const body = await readBody(req);
    const found = db.users.find((item) => item.email === String(body.email || '').toLowerCase());
    if (!found || !verifyPassword(String(body.password || ''), found.passwordHash)) return json(res, 401, { error: 'Credenciais inválidas.' });
    const token = randomUUID();
    db.sessions.push({ token, userId: found.id, expiresAt: new Date(Date.now() + 7 * 864e5).toISOString() });
    await saveDb(db);
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'set-cookie': `${COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax` });
    return res.end(JSON.stringify({ user: publicUser(found) }));
  }

  if (req.method === 'POST' && url.pathname === '/api/logout') {
    if (user) db.sessions = db.sessions.filter((item) => item.userId !== user.id);
    await saveDb(db);
    res.writeHead(200, { 'content-type': 'application/json', 'set-cookie': `${COOKIE}=; Max-Age=0; Path=/` });
    return res.end(JSON.stringify({ ok: true }));
  }

  if (!user) return json(res, 401, { error: 'Faça login para continuar.' });

  if (req.method === 'GET' && url.pathname === '/api/state') {
    return json(res, 200, {
      user: publicUser(user),
      listings: db.listings.filter((item) => item.userId === user.id).reverse(),
      documents: db.documents.filter((item) => item.userId === user.id).map(({ content, ...doc }) => ({ ...doc, size: content.length })),
      plans: db.plans.filter((plan) => plan.active),
      users: user.role === 'ADMIN' ? db.users.map(publicUser) : []
    });
  }

  if (req.method === 'POST' && url.pathname === '/api/listings/start') {
    if (user.credits < 1) return json(res, 402, { error: 'Créditos insuficientes.' });
    const input = normalizeListing(await readBody(req));
    if (!input.productName || !input.differentiator || input.salePrice <= 0) return json(res, 400, { error: 'Produto, preço de venda e diferencial são obrigatórios.' });
    const context = retrieveContext(db, user.id, `${input.productName} ${input.differentiator}`);
    const output = stageOne(input, context);
    const listing = { id: randomUUID(), userId: user.id, input, stageOneOutput: output, selectedVersion: null, expandedOutput: null, status: 'DRAFT', createdAt: now(), updatedAt: now() };
    db.listings.push(listing);
    user.credits -= 1;
    user.updatedAt = now();
    db.creditLedger.push({ id: randomUUID(), userId: user.id, delta: -1, reason: 'LISTING_STAGE_ONE', listingId: listing.id, createdAt: now() });
    await saveDb(db);
    return json(res, 200, { listing, user: publicUser(user) });
  }

  if (req.method === 'POST' && url.pathname === '/api/listings/expand') {
    if (user.credits < 2) return json(res, 402, { error: 'Créditos insuficientes para expandir.' });
    const body = await readBody(req);
    const listing = db.listings.find((item) => item.id === body.listingId && item.userId === user.id);
    const selectedVersion = Number(body.selectedVersion);
    if (!listing || ![1, 2, 3, 4].includes(selectedVersion)) return json(res, 400, { error: 'Anúncio ou versão inválida.' });
    listing.selectedVersion = selectedVersion;
    listing.expandedOutput = stageTwo(listing, selectedVersion);
    listing.status = 'EXPANDED';
    listing.updatedAt = now();
    user.credits -= 2;
    user.updatedAt = now();
    db.creditLedger.push({ id: randomUUID(), userId: user.id, delta: -2, reason: 'LISTING_STAGE_TWO', listingId: listing.id, createdAt: now() });
    await saveDb(db);
    return json(res, 200, { listing, user: publicUser(user) });
  }

  if (req.method === 'GET' && url.pathname === '/api/listings/export') {
    const listing = db.listings.find((item) => item.id === url.searchParams.get('id') && item.userId === user.id);
    if (!listing) return json(res, 404, { error: 'Anúncio não encontrado.' });
    listing.status = 'EXPORTED';
    await saveDb(db);
    const content = listing.expandedOutput || listing.stageOneOutput;
    res.writeHead(200, { 'content-type': 'text/markdown; charset=utf-8', 'content-disposition': `attachment; filename="${listing.input.productName.replace(/\W+/g, '-')}.md"` });
    return res.end(content);
  }

  if (req.method === 'POST' && url.pathname === '/api/documents') {
    const body = await readBody(req);
    const content = String(body.content || '').trim();
    if (content.length < 20) return json(res, 400, { error: 'Documento precisa ter pelo menos 20 caracteres.' });
    const doc = { id: randomUUID(), userId: user.id, fileName: String(body.fileName || 'documento.txt'), mimeType: 'text/plain', content, chunks: Math.ceil(content.length / 1200), createdAt: now() };
    db.documents.push(doc);
    await saveDb(db);
    return json(res, 200, { document: { ...doc, content: undefined, size: content.length } });
  }

  if (req.method === 'POST' && url.pathname === '/api/billing/checkout') {
    const body = await readBody(req);
    const plan = db.plans.find((item) => item.id === body.planId && item.active);
    if (!plan) return json(res, 404, { error: 'Plano não encontrado.' });
    user.planId = plan.id;
    user.credits += plan.monthlyCredits;
    user.updatedAt = now();
    db.creditLedger.push({ id: randomUUID(), userId: user.id, delta: plan.monthlyCredits, reason: 'PLAN_RENEWAL_MOCK', planId: plan.id, createdAt: now() });
    await saveDb(db);
    return json(res, 200, { user: publicUser(user), checkout: { status: 'paid', provider: 'mock' } });
  }

  if (req.method === 'POST' && url.pathname === '/api/admin/plans') {
    if (user.role !== 'ADMIN') return json(res, 403, { error: 'Acesso restrito.' });
    const body = await readBody(req);
    const plan = { id: randomUUID(), name: String(body.name), priceCents: Number(body.priceCents), monthlyCredits: Number(body.monthlyCredits), features: String(body.features), active: true };
    db.plans.push(plan);
    await saveDb(db);
    return json(res, 200, { plan });
  }

  if (req.method === 'POST' && url.pathname === '/api/admin/credits') {
    if (user.role !== 'ADMIN') return json(res, 403, { error: 'Acesso restrito.' });
    const body = await readBody(req);
    const target = db.users.find((item) => item.id === body.userId);
    const delta = Number(body.credits);
    if (!target || !Number.isFinite(delta)) return json(res, 400, { error: 'Usuário ou crédito inválido.' });
    target.credits += delta;
    db.creditLedger.push({ id: randomUUID(), userId: target.id, delta, reason: 'ADMIN_ADJUSTMENT', createdAt: now() });
    await saveDb(db);
    return json(res, 200, { user: publicUser(target) });
  }

  return json(res, 404, { error: 'Rota não encontrada.' });
}

function html() {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Especialista AI funcionando</title><style>${css()}</style></head><body><div id="app"></div><script>${clientJs()}</script></body></html>`;
}

function css() {
  return `:root{--bg:#07111f;--card:#101c2f;--muted:#91a3bb;--text:#eef6ff;--brand:#39e58c;--brand2:#5bc0ff;--danger:#ff6b6b;--border:rgba(255,255,255,.12)}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at top left,rgba(57,229,140,.18),transparent 35%),var(--bg);color:var(--text);font-family:Inter,system-ui,Segoe UI,sans-serif}.container{width:min(1180px,calc(100% - 32px));margin:auto}.nav{display:flex;justify-content:space-between;align-items:center;padding:22px 0}.logo{font-size:24px;font-weight:900;letter-spacing:-.04em}.logo span{color:var(--brand)}.row{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.hero{display:grid;grid-template-columns:1.05fr .95fr;gap:28px;padding:36px 0}.grid{display:grid;grid-template-columns:1.15fr .85fr;gap:18px}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.card{background:rgba(16,28,47,.9);border:1px solid var(--border);border-radius:24px;padding:22px;box-shadow:0 24px 80px rgba(0,0,0,.25)}.highlight{background:linear-gradient(145deg,rgba(57,229,140,.18),rgba(91,192,255,.10))}.stack{display:grid;gap:16px}.badge{display:inline-flex;padding:8px 12px;border-radius:999px;border:1px solid rgba(57,229,140,.4);color:var(--brand);font-weight:800}h1{font-size:clamp(40px,7vw,74px);line-height:.94;letter-spacing:-.07em;margin:0 0 18px}h2{font-size:30px;letter-spacing:-.04em;margin:0}h3{margin:0 0 6px}p{color:var(--muted);line-height:1.65}button,.button{border:0;border-radius:14px;padding:12px 16px;font-weight:900;background:linear-gradient(135deg,var(--brand),var(--brand2));color:#06111f;cursor:pointer}.secondary{background:rgba(255,255,255,.08);color:var(--text);border:1px solid var(--border)}input,textarea,select{width:100%;background:rgba(255,255,255,.06);border:1px solid var(--border);border-radius:14px;color:var(--text);padding:12px;font:inherit}label{display:grid;gap:7px;color:var(--muted);font-weight:700;font-size:14px}textarea{min-height:105px;resize:vertical}.form{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.full{grid-column:1/-1}.pre{white-space:pre-wrap;background:#050c17;border:1px solid var(--border);border-radius:18px;padding:18px;line-height:1.55;color:#dbeafe;max-height:620px;overflow:auto}.error{color:var(--danger);font-weight:900}.success{color:var(--brand);font-weight:900}.list button{width:100%;text-align:left;margin:4px 0}@media(max-width:900px){.hero,.grid,.form,.cards{grid-template-columns:1fr}}`;
}

function clientJs() {
  return String.raw`
const app = document.querySelector('#app');
let state = { user:null, listings:[], documents:[], plans:[], users:[] };
let active = null;
const api = (path, opts={}) => fetch(path, { headers:{'content-type':'application/json'}, ...opts }).then(async r => { const t = await r.text(); const d = t ? JSON.parse(t) : {}; if(!r.ok) throw new Error(d.error || 'Erro'); return d; });
async function load(){ try{ state = await api('/api/state'); }catch{ try{ const me = await api('/api/me'); state.user = me.user; }catch{} } render(); }
function money(c){ return 'R$ ' + (c/100).toFixed(2).replace('.', ','); }
function shell(content){ return '<main><header class="container nav"><div class="logo">Especialista<span>AI</span></div><div class="row">'+(state.user?'<span class="badge">'+state.user.credits+' créditos</span><button class="secondary" onclick="logout()">Sair</button>':'')+'</div></header>'+content+'</main>'; }
function render(){ if(!state.user) return renderPublic(); renderApp(); }
function renderPublic(){ app.innerHTML = shell('<section class="container hero"><div><span class="badge">Agora funcionando sem instalação de dependências</span><h1>SaaS de IA para anúncios de marketplace.</h1><p>Teste login, créditos, geração em duas etapas, RAG por documentos, planos, admin e exportação.</p><div class="cards"><div class="card"><h3>Login admin</h3><p>admin@especialista.ai<br>Admin123!</p></div><div class="card"><h3>Fluxo real</h3><p>Produto → 4 versões → escolha → anúncio completo.</p></div><div class="card"><h3>Margem</h3><p>Custo, comissão, frete, ads e impostos entram no diagnóstico.</p></div></div></div><div class="card stack"><h2>Entrar</h2><label>E-mail<input id="email" value="admin@especialista.ai"></label><label>Senha<input id="password" type="password" value="Admin123!"></label><button onclick="login()">Entrar</button><hr><h2>Criar conta</h2><label>Nome<input id="name" value="Operador"></label><label>E-mail<input id="newEmail" value="operador'+Date.now()+'@teste.com"></label><label>Senha<input id="newPassword" type="password" value="Teste123!"></label><button class="secondary" onclick="register()">Cadastrar com 10 créditos</button><p id="msg" class="error"></p></div></section>'); }
function renderApp(){ const l = active || state.listings[0]; app.innerHTML = shell('<section class="container stack"><div class="card highlight"><h1>Painel funcionando</h1><p>Gere etapa 1, escolha uma versão, expanda, salve, desconte créditos e exporte.</p></div><div class="grid"><div class="stack">'+listingForm()+result(l)+'</div><aside class="stack">'+ragBox()+plansBox()+historyBox()+adminBox()+'</aside></div></section>'); }
function listingForm(){ return '<form class="card stack" onsubmit="startListing(event)"><h2>Novo anúncio</h2><div class="form"><label>Produto<input name="productName" required value="Kit 3 Organizadores de Gaveta"></label><label>Marketplace<select name="marketplace"><option>Mercado Livre</option><option>Shopee</option><option>Amazon</option><option>Magalu</option></select></label><label>Custo<input name="cost" type="number" step="0.01" value="22"></label><label>Preço venda<input name="salePrice" type="number" step="0.01" value="69.90"></label><label>Frete<input name="shippingCost" type="number" step="0.01" value="8.50"></label><label>Comissão %<input name="commissionPercent" type="number" step="0.01" value="16"></label><label>Ads %<input name="adsPercent" type="number" step="0.01" value="8"></label><label>Impostos %<input name="taxPercent" type="number" step="0.01" value="6"></label><label>Embalagem<input name="packagingCost" type="number" step="0.01" value="1.50"></label><label>Público<input name="targetAudience" value="pessoas que querem organizar casa e guarda-roupa"></label><label class="full">Diferencial<textarea name="differentiator">kit reforçado, modular, lavável e com tamanhos diferentes para gavetas pequenas e grandes</textarea></label><label class="full">Concorrência<textarea name="competitorNotes">concorrência média com muitos anúncios genéricos e fotos parecidas</textarea></label><label class="full">Logística<textarea name="logisticsNotes">produto leve, baixo risco de avaria, ideal para envio rápido</textarea></label></div><button>Gerar etapa 1 (1 crédito)</button></form>'; }
function result(l){ if(!l) return '<div class="card"><h2>Resultado</h2><p>Preencha o formulário para ver a IA funcionando.</p></div>'; return '<div class="card stack"><h2>Resultado salvo</h2><div class="pre">'+escapeHtml(l.expandedOutput || l.stageOneOutput)+'</div>'+(l.expandedOutput?'<div class="row"><a class="button" href="/api/listings/export?id='+l.id+'" target="_blank">Exportar Markdown</a></div>':'<div class="row"><select id="version"><option value="1">1 — Dor</option><option value="2">2 — Benefício</option><option value="3">3 — Diferencial</option><option value="4">4 — Uso específico</option></select><button onclick="expandListing(\''+l.id+'\')">Expandir anúncio (2 créditos)</button></div>')+'</div>'; }
function ragBox(){ return '<form class="card stack" onsubmit="saveDoc(event)"><h2>RAG / Documentos</h2><p>Digite ou cole base de conhecimento. Ela será consultada nas próximas gerações.</p><label>Nome<input name="fileName" value="persona-e-concorrencia.txt"></label><label>Conteúdo<textarea name="content">Persona valoriza organização visual, compra por impulso quando a primeira imagem mostra antes e depois. Concorrentes usam títulos repetidos; destacar modularidade e kit reforçado.</textarea></label><button>Salvar documento</button><p>'+state.documents.length+' documentos indexados.</p></form>'; }
function plansBox(){ return '<div class="card stack"><h2>Planos pagos</h2>'+state.plans.map(p=>'<div class="card"><h3>'+p.name+'</h3><p>'+money(p.priceCents)+' / mês · '+p.monthlyCredits+' créditos</p><p>'+p.features+'</p><button onclick="subscribe(\''+p.id+'\')">Contratar mock</button></div>').join('')+'</div>'; }
function historyBox(){ return '<div class="card list"><h2>Histórico</h2>'+state.listings.map(l=>'<button class="secondary" onclick="setActive(\''+l.id+'\')">'+escapeHtml(l.input.productName)+' · '+l.status+'</button>').join('')+'</div>'; }
function adminBox(){ if(state.user.role!=='ADMIN') return ''; return '<div class="card stack"><h2>Admin</h2><form onsubmit="createPlan(event)" class="stack"><label>Plano<input name="name" value="Pro"></label><label>Preço centavos<input name="priceCents" type="number" value="14900"></label><label>Créditos<input name="monthlyCredits" type="number" value="220"></label><label>Features<textarea name="features">Plano criado pelo painel admin em funcionamento</textarea></label><button>Criar plano</button></form><p>'+state.users.length+' usuários cadastrados.</p></div>'; }
async function login(){ try{ await api('/api/login',{method:'POST',body:JSON.stringify({email:email.value,password:password.value})}); await load(); }catch(e){ msg.textContent=e.message; } }
async function register(){ try{ await api('/api/register',{method:'POST',body:JSON.stringify({name:name.value,email:newEmail.value,password:newPassword.value})}); await load(); }catch(e){ msg.textContent=e.message; } }
async function logout(){ await api('/api/logout',{method:'POST'}); state={user:null,listings:[],documents:[],plans:[],users:[]}; active=null; render(); }
async function startListing(e){ e.preventDefault(); const body = Object.fromEntries(new FormData(e.target).entries()); const d = await api('/api/listings/start',{method:'POST',body:JSON.stringify(body)}); state.user=d.user; state.listings.unshift(d.listing); active=d.listing; render(); }
async function expandListing(id){ const d = await api('/api/listings/expand',{method:'POST',body:JSON.stringify({listingId:id,selectedVersion:Number(document.querySelector('#version').value)})}); state.user=d.user; state.listings=state.listings.map(l=>l.id===id?d.listing:l); active=d.listing; render(); }
async function saveDoc(e){ e.preventDefault(); await api('/api/documents',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target).entries()))}); await load(); }
async function subscribe(planId){ const d = await api('/api/billing/checkout',{method:'POST',body:JSON.stringify({planId})}); state.user=d.user; await load(); }
async function createPlan(e){ e.preventDefault(); await api('/api/admin/plans',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target).entries()))}); await load(); }
function setActive(id){ active = state.listings.find(l=>l.id===id); render(); }
function escapeHtml(s){ return String(s||'').replace(/[&<>]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
load();`;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  createServer((req, res) => route(req, res).catch((error) => json(res, 500, { error: error.message }))).listen(PORT, () => {
    console.log(`Especialista AI funcionando em http://localhost:${PORT}`);
    console.log('Admin demo: admin@especialista.ai / Admin123!');
  });
}

export { route, stageOne, stageTwo, margin, normalizeListing };
