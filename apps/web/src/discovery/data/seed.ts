/**
 * Fonte única dos dados demonstrativos do Discovery Studio (BDE). Tudo é MOCK/DEMO e determinístico:
 * nenhuma fonte foi consultada de verdade, preços e mudanças são fictícios. Telas leem daqui (via derive.ts).
 */
import type {
  Authority, BlockReason, ChangeEvent, ChangeKind, Confidence, Conflict, DiscoveryResult, EnrichmentProposal, EntityCandidate, Evidence, EvidencePack, ExternalDocument,
  FetchSnapshot, Level, Observation, Relationship, ResearchDataset, ResearchMission, Run, SourceDescriptor, SourcePolicy, SourceType, Watchlist,
} from './types';

export const WORKSPACE = 'NovaLink Operations';
/** "Agora" da demonstração: 2026-10-11 14:42 (UTC usado só como relógio fixo). */
export const NOW = Date.UTC(2026, 9, 11, 14, 42);
const pad = (n: number) => String(n).padStart(2, '0');
/** "2026-10-11 14:32" para N minutos atrás. */
export const stamp = (minAgo: number) => { const d = new Date(NOW - minAgo * 60000); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`; };
export const day = (daysAgo: number) => stamp(daysAgo * 1440).slice(0, 10);
export const WEEK_MIN = 7 * 1440;

function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rand = rng(20261011);
const pick = <T,>(a: readonly T[]): T => a[Math.floor(rand() * a.length)]!;
const int = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));

/** Confiança: autoridade, frescor, corroboração, extração, correspondência de entidade, contradições. */
export const cf = (authority: number, freshness: number, corroboration: number, extraction: number, entityMatch: number, contradictions: Confidence['contradictions'] = 'none'): Confidence => ({ authority, freshness, corroboration, extraction, entityMatch, contradictions });
export function score(c: Confidence): number {
  const base = c.authority * 0.35 + c.freshness * 0.2 + c.corroboration * 0.2 + c.extraction * 0.15 + c.entityMatch * 0.1;
  return Math.round(base * (c.contradictions === 'none' ? 1 : c.contradictions === 'minor' ? 0.93 : 0.75));
}
export const levelOf = (v: number): Level => (v >= 85 ? 'high' : v >= 65 ? 'medium' : 'low');

const POLICY: SourcePolicy = { access: 'Public', robots: 'Respected', rateLimit: '1 req / 5 s', retentionDays: 90, license: 'Recorded · site terms', attribution: 'Required', personalData: 'Restricted' };

/* ---------- Entidades ---------- */
const FIBER: [string, string, string, number, number, number][] = [
  ['Fibramax Telecom', 'São Paulo', 'SP', -23.55, -46.63, 14], ['Conecta Sul Fibra', 'Porto Alegre', 'RS', -30.03, -51.23, 9], ['OptiNet Brasil', 'Rio de Janeiro', 'RJ', -22.91, -43.17, 11],
  ['LumiNet Telecom', 'Belo Horizonte', 'MG', -19.92, -43.94, 8], ['Rede Horizonte', 'Curitiba', 'PR', -25.43, -49.27, 7], ['NortFibra', 'Belém', 'PA', -1.46, -48.5, 5],
  ['Vitória Fibra', 'Vitória', 'ES', -20.32, -40.34, 6], ['Alvorada Telecom', 'Brasília', 'DF', -15.79, -47.88, 10], ['TeleVale Fibra', 'São José dos Campos', 'SP', -23.22, -45.9, 6],
  ['Cerrado Link', 'Goiânia', 'GO', -16.68, -49.25, 7], ['Atlântica Net', 'Salvador', 'BA', -12.97, -38.5, 9], ['Pampas Fibra', 'Pelotas', 'RS', -31.77, -52.34, 4],
  ['Serra Digital', 'Caxias do Sul', 'RS', -29.17, -51.18, 5], ['Planalto Telecom', 'Brasília', 'DF', -15.83, -47.92, 6], ['Costa Azul Fibra', 'Florianópolis', 'SC', -27.6, -48.55, 8],
  ['Amazônia Link', 'Manaus', 'AM', -3.12, -60.02, 4], ['Mineira Fibra Óptica', 'Uberlândia', 'MG', -18.92, -48.28, 5], ['BrasilFibra Corp', 'São Paulo', 'SP', -23.56, -46.66, 16],
  ['Sertão Net', 'Fortaleza', 'CE', -3.73, -38.52, 5], ['Litoral Conecta', 'Santos', 'SP', -23.96, -46.33, 4], ['Ipê Telecom', 'Campinas', 'SP', -22.9, -47.06, 7],
  ['Araguaia Fibra', 'Palmas', 'TO', -10.18, -48.33, 3], ['Diamante Telecom', 'Diamantina', 'MG', -18.24, -43.6, 3], ['Tupã Networks', 'Recife', 'PE', -8.05, -34.88, 6],
  ['Capital Fibra', 'Campo Grande', 'MS', -20.47, -54.62, 4], ['Guanabara Net', 'Niterói', 'RJ', -22.88, -43.1, 5], ['Paulista Backbone', 'São Paulo', 'SP', -23.5, -46.7, 12],
];
const FIBER_SERVICES = ['Fiber monitoring (OTDR)', 'Backhaul', 'Metro fiber', 'FTTH', 'Dark fiber', 'Network operations center', 'Managed wavelength'];
/** Distribuição pedida: 18 alta confiança, 7 média, 2 precisam de revisão. */
const FIBER_CONF = [98, 97, 97, 96, 96, 95, 95, 94, 94, 93, 93, 92, 92, 91, 91, 90, 90, 90, 88, 86, 85, 83, 80, 78, 76, 71, 64];

export const ENTITIES: EntityCandidate[] = [];
const ent = (e: EntityCandidate) => { ENTITIES.push(e); return e; };

const bi = (id: string, name: string, aliases: string[], site: string, hq: string, products: string[], integ: string[], locs: number, conf: number, since: string, extra: Partial<EntityCandidate> = {}) =>
  ent({ id, name, type: 'Organization', aliases, website: site, confidence: conf, verified: true, since, lastConfirmedMin: int(20, 600), hq, industry: 'Business Intelligence', products, integrations: integ, locations: locs, sources: int(9, 16), evidenceCoverage: int(88, 97), missionIds: ['m1', 'm5'], ...extra });
bi('powerbi', 'Power BI', ['Microsoft Power BI', 'PowerBI'], 'powerbi.microsoft.com', 'Redmond', ['Power BI Pro', 'Power BI Premium', 'Fabric'], ['Excel', 'Azure Synapse', 'PostgreSQL'], 12, 99, '2025',
  { resolution: { canonical: 'Microsoft', names: ['Microsoft Corp.', 'Microsoft Corporation', 'MSFT', 'microsoft.com'], evidence: ['Official domain match', 'Known alias', 'Structured data (schema.org)'], match: 99 } });
bi('tableau', 'Tableau', ['Salesforce Tableau', 'Tableau Software'], 'tableau.com', 'Seattle', ['Tableau Cloud', 'Tableau Server', 'Tableau Pulse'], ['Salesforce', 'Snowflake', 'PostgreSQL'], 9, 98, '2025');
bi('qlik', 'Qlik', ['Qlik Sense', 'QlikTech'], 'qlik.com', 'King of Prussia', ['Qlik Cloud', 'Qlik Sense', 'Talend'], ['Snowflake', 'SAP', 'PostgreSQL'], 8, 97, '2025');
bi('looker', 'Looker', ['Google Looker', 'Looker Studio'], 'cloud.google.com/looker', 'Mountain View', ['Looker', 'Looker Studio'], ['BigQuery', 'PostgreSQL'], 7, 97, '2025');
bi('domo', 'Domo', ['Domo Inc.'], 'domo.com', 'American Fork', ['Domo Platform', 'Domo Everywhere'], ['Snowflake', 'Salesforce'], 5, 94, '2026');
bi('coa', 'Company A', ['Company A Inc.', 'CompanyA', 'companya.com'], 'companya.com', 'São Paulo', ['Analytics X', 'Data Y'], ['PostgreSQL', 'Snowflake'], 6, 96, '2025',
  { evidenceCoverage: 94, sources: 12, lastConfirmedMin: 12, missionIds: ['m1', 'm5', 'm3'] });
bi('cob', 'Company B', ['Company B Ltd.'], 'companyb.example', 'Belo Horizonte', ['Insight Studio'], ['MySQL'], 3, 90, '2026', { sources: 7, missionIds: ['m5'] });
bi('coc', 'Company C', ['Company C S.A.'], 'companyc.example', 'Curitiba', ['FlowBI'], ['Snowflake', 'PostgreSQL'], 4, 88, '2026', { sources: 6, missionIds: ['m5'] });

FIBER.forEach(([name, city, uf, lat, lon, locs], i) => {
  const conf = FIBER_CONF[i] ?? 80;
  ent({
    id: `f${pad(i + 1)}`, name, type: 'Organization', aliases: [name.replace(' Telecom', ' Tel.'), `${name.split(' ')[0]!.toLowerCase()}.example`], website: `${name.split(' ')[0]!.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}.example`,
    confidence: conf, verified: conf >= 90, since: i % 3 === 0 ? '2025' : '2026', lastConfirmedMin: int(30, 4000), hq: `${city}, ${uf}`, industry: 'Telecommunications', products: [FIBER_SERVICES[i % FIBER_SERVICES.length]!, FIBER_SERVICES[(i + 2) % FIBER_SERVICES.length]!],
    integrations: [], locations: locs, geo: { lat, lon }, sources: conf >= 90 ? int(4, 8) : conf >= 75 ? int(2, 4) : 1, evidenceCoverage: Math.max(40, conf - int(0, 12)), missionIds: ['m2'],
  });
});
// Produtos, tecnologias e mercado que aparecem no grafo da Company A.
const sub = (id: string, name: string, type: EntityCandidate['type'], conf: number) => ent({ id, name, type, aliases: [], confidence: conf, verified: conf >= 90, since: '2026', lastConfirmedMin: int(60, 900), products: [], integrations: [], locations: 0, sources: int(2, 5), evidenceCoverage: 90, missionIds: ['m1'] });
sub('ax', 'Analytics X', 'Product', 96); sub('dy', 'Data Y', 'Product', 95); sub('snow', 'Snowflake', 'Technology', 99); sub('pg', 'PostgreSQL', 'Technology', 99);
sub('br', 'Brazil', 'Market', 99); sub('rad', 'Realtime anomaly detection', 'Product', 94);

export const RELATIONSHIPS: Relationship[] = [
  { from: 'coa', to: 'ax', kind: 'offers' }, { from: 'coa', to: 'dy', kind: 'offers' }, { from: 'coa', to: 'snow', kind: 'integrates' }, { from: 'coa', to: 'pg', kind: 'integrates' },
  { from: 'coa', to: 'br', kind: 'operates in' }, { from: 'coa', to: 'rad', kind: 'announced' }, { from: 'coa', to: 'cob', kind: 'competes with' }, { from: 'cob', to: 'br', kind: 'operates in' },
  { from: 'powerbi', to: 'tableau', kind: 'competes with' }, { from: 'tableau', to: 'qlik', kind: 'competes with' }, { from: 'qlik', to: 'looker', kind: 'competes with' },
  { from: 'tableau', to: 'snow', kind: 'integrates' }, { from: 'qlik', to: 'snow', kind: 'integrates' }, { from: 'powerbi', to: 'pg', kind: 'integrates' },
  { from: 'f01', to: 'br', kind: 'operates in' }, { from: 'f18', to: 'br', kind: 'operates in' }, { from: 'f28', to: 'f01', kind: 'partners with' }, { from: 'f03', to: 'f18', kind: 'competes with' },
];

/* ---------- Fontes ---------- */
export const SOURCES: SourceDescriptor[] = [];
const src = (s: Partial<SourceDescriptor> & Pick<SourceDescriptor, 'id' | 'name' | 'url' | 'type' | 'authority'>) => {
  const full: SourceDescriptor = { health: 'healthy', lastCheckedMin: int(2, 180), observedSince: '2026-07-14', snapshots: int(20, 90), changes: int(0, 9), usedBy: ['m1'], policy: POLICY, ...s };
  SOURCES.push(full); return full;
};
src({ id: 's-coa-pricing', name: 'companya.com/pricing', url: 'https://companya.com/pricing', type: 'Pricing Page', authority: 'PRIMARY', lastCheckedMin: 18, snapshots: 84, changes: 7, usedBy: ['m1', 'm5', 'm3'], entityId: 'coa' });
src({ id: 's-coa-site', name: 'companya.com', url: 'https://companya.com', type: 'Official Website', authority: 'PRIMARY', lastCheckedMin: 22, snapshots: 61, changes: 4, usedBy: ['m1', 'm5'], entityId: 'coa' });
src({ id: 's-coa-docs', name: 'docs.companya.com', url: 'https://docs.companya.com', type: 'Documentation', authority: 'PRIMARY', lastCheckedMin: 40, snapshots: 52, changes: 6, entityId: 'coa' });
src({ id: 's-coa-notes', name: 'companya.com/release-notes', url: 'https://companya.com/release-notes', type: 'Documentation', authority: 'PRIMARY', lastCheckedMin: 35, snapshots: 38, changes: 5, entityId: 'coa' });
src({ id: 's-coa-news', name: 'Industry Weekly · Company A launches realtime detection', url: 'https://industryweekly.example/company-a-realtime', type: 'News', authority: 'SECONDARY', entityId: 'coa', snapshots: 3, changes: 0 });
src({ id: 's-pbi-pricing', name: 'powerbi.microsoft.com/pricing', url: 'https://powerbi.microsoft.com/pricing', type: 'Pricing Page', authority: 'PRIMARY', lastCheckedMin: 34, snapshots: 77, changes: 9, entityId: 'powerbi', usedBy: ['m1', 'm5'] });
src({ id: 's-pbi-notes', name: 'Power BI · What\'s new', url: 'https://learn.microsoft.com/power-bi/fundamentals/desktop-latest-update', type: 'Documentation', authority: 'PRIMARY', entityId: 'powerbi', snapshots: 70, changes: 11 });
src({ id: 's-tab-pricing', name: 'tableau.com/pricing', url: 'https://www.tableau.com/pricing', type: 'Pricing Page', authority: 'PRIMARY', entityId: 'tableau', snapshots: 66, changes: 5 });
src({ id: 's-tab-notes', name: 'Tableau · Release notes', url: 'https://help.tableau.com/current/releasenotes', type: 'Documentation', authority: 'PRIMARY', entityId: 'tableau', snapshots: 58, changes: 8 });
src({ id: 's-qlik-blog', name: 'qlik.com/blog', url: 'https://www.qlik.com/blog', type: 'RSS', authority: 'PRIMARY', entityId: 'qlik', snapshots: 44, changes: 6 });
src({ id: 's-qlik-docs', name: 'help.qlik.com', url: 'https://help.qlik.com', type: 'Documentation', authority: 'PRIMARY', entityId: 'qlik', snapshots: 49, changes: 7 });
src({ id: 's-look-docs', name: 'cloud.google.com/looker/docs', url: 'https://cloud.google.com/looker/docs', type: 'Documentation', authority: 'PRIMARY', entityId: 'looker', snapshots: 51, changes: 6 });
src({ id: 's-domo-docs', name: 'domo.com/docs', url: 'https://www.domo.com/docs', type: 'Documentation', authority: 'PRIMARY', entityId: 'domo', snapshots: 33, changes: 3 });
src({ id: 's-domo-news', name: 'Analytics Today · Domo pricing model', url: 'https://analyticstoday.example/domo-capacity', type: 'News', authority: 'SECONDARY', entityId: 'domo', snapshots: 2, changes: 0 });
src({ id: 's-gov-offices', name: 'dados.gov.br · Cadastro de escritórios', url: 'https://dados.gov.br/dataset/cadastro-escritorios', type: 'Open Data', authority: 'REFERENCE', lastCheckedMin: 1440, snapshots: 11, changes: 1, usedBy: ['m1', 'm3'] });
src({ id: 's-anatel', name: 'Anatel · Painel de Dados', url: 'https://informacoes.anatel.gov.br/paineis', type: 'Government', authority: 'REFERENCE', snapshots: 28, changes: 4, usedBy: ['m2', 'm4'] });
src({ id: 's-anatel-pub', name: 'Anatel · Diário e resoluções', url: 'https://www.gov.br/anatel/pt-br/legislacao', type: 'Government', authority: 'PRIMARY', snapshots: 40, changes: 9, usedBy: ['m4'] });
src({ id: 's-ibge', name: 'IBGE · Cadastro Nacional de Endereços', url: 'https://www.ibge.gov.br/estatisticas/cnefe', type: 'Public Database', authority: 'REFERENCE', snapshots: 6, changes: 0, usedBy: ['m3', 'm2'] });
src({ id: 's-cnpj', name: 'Receita Federal · Dados Abertos CNPJ', url: 'https://dados.gov.br/dataset/cnpj', type: 'Open Data', authority: 'REFERENCE', snapshots: 12, changes: 1, usedBy: ['m3'] });
src({ id: 's-news-teletime', name: 'Teletime · Fibra óptica', url: 'https://teletime.example/fibra', type: 'RSS', authority: 'SECONDARY', usedBy: ['m2'], snapshots: 90, changes: 3 });
src({ id: 's-gh-collector', name: 'github.com/opentelemetry/opentelemetry-collector', url: 'https://github.com/open-telemetry/opentelemetry-collector', type: 'Repository', authority: 'PRIMARY', usedBy: ['m5'], snapshots: 30, changes: 12 });
src({ id: 's-report-pdf', name: 'Annual Report 2025.pdf', url: 'https://fibramax.example/ri/annual-report-2025.pdf', type: 'Document', authority: 'PRIMARY', entityId: 'f01', usedBy: ['m2'], snapshots: 1, changes: 0 });
src({ id: 's-api-cep', name: 'API pública de CEP', url: 'https://cep.example/api', type: 'Public API', authority: 'REFERENCE', usedBy: ['m3'], snapshots: 8, changes: 0 });
// Fontes bloqueadas: a UI mostra o motivo e não contorna.
src({ id: 's-blk-robots', name: 'carrier-directory.example/listings', url: 'https://carrier-directory.example/listings', type: 'Public Database', authority: 'DISCOVERY', health: 'blocked', blocked: 'robots', usedBy: ['m2'], snapshots: 0, changes: 0 });
src({ id: 's-blk-auth', name: 'market-reports.example/premium', url: 'https://market-reports.example/premium', type: 'Document', authority: 'SECONDARY', health: 'blocked', blocked: 'auth-required', usedBy: ['m2'], snapshots: 0, changes: 0 });
src({ id: 's-blk-rate', name: 'telco-stats.example/api', url: 'https://telco-stats.example/api', type: 'Public API', authority: 'REFERENCE', health: 'degraded', blocked: 'rate-limit', usedBy: ['m2'], snapshots: 14, changes: 0 });
src({ id: 's-blk-policy', name: 'social-network.example/companies', url: 'https://social-network.example/companies', type: 'Public Database', authority: 'DISCOVERY', health: 'blocked', blocked: 'policy', usedBy: ['m3'], snapshots: 0, changes: 0 });
src({ id: 's-blk-down', name: 'old-portal.example', url: 'https://old-portal.example', type: 'Official Website', authority: 'SECONDARY', health: 'degraded', blocked: 'unavailable', usedBy: ['m2'], snapshots: 20, changes: 1 });
src({ id: 's-blk-rm', name: 'press.competitor.example/2024-launch', url: 'https://press.competitor.example/2024-launch', type: 'News', authority: 'SECONDARY', health: 'blocked', blocked: 'removed', usedBy: ['m1'], snapshots: 2, changes: 1 });
// Fontes oficiais das empresas de fibra e sindicação (1 original + 11 espelhos = 1 evidência independente).
FIBER.slice(0, 10).forEach(([name], i) => src({ id: `s-f${pad(i + 1)}`, name: `${ENTITIES.find((e) => e.id === `f${pad(i + 1)}`)!.website}/produtos`, url: `https://${ENTITIES.find((e) => e.id === `f${pad(i + 1)}`)!.website}/produtos`, type: 'Official Website', authority: 'PRIMARY', entityId: `f${pad(i + 1)}`, usedBy: ['m2'] }));
src({ id: 's-syn-orig', name: 'Teletime · Fibramax expande backbone', url: 'https://teletime.example/fibramax-backbone', type: 'News', authority: 'SECONDARY', usedBy: ['m2'], snapshots: 1, changes: 0 });
for (let i = 1; i <= 11; i++) src({ id: `s-syn-${i}`, name: `mirror${i}.news.example/fibramax-backbone`, url: `https://mirror${i}.news.example/fibramax-backbone`, type: 'News', authority: 'DISCOVERY', originalOf: 's-syn-orig', usedBy: ['m2'], snapshots: 1, changes: 0 });
// Completa os 184 monitorados com fontes geradas (semeadas).
const TYPES: SourceType[] = ['Official Website', 'Documentation', 'News', 'RSS', 'Open Data', 'Public API', 'Repository', 'Pricing Page', 'Government'];
const AUTH: Authority[] = ['PRIMARY', 'SECONDARY', 'SECONDARY', 'REFERENCE', 'DISCOVERY'];
const SOURCE_MISSIONS = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12'];
for (let i = SOURCES.length; i < 184; i++) {
  const host = `${pick(['atlas', 'nimbus', 'vector', 'orbit', 'prisma', 'delta', 'meridian', 'quartz', 'harbor'])}${i}.example`;
  src({ id: `s-gen-${i}`, name: `${host}/${pick(['produtos', 'docs', 'noticias', 'dados', 'api', 'releases'])}`, url: `https://${host}`, type: pick(TYPES), authority: pick(AUTH), usedBy: [pick(SOURCE_MISSIONS)], snapshots: int(2, 60), changes: int(0, 5) });
}

/** Conteúdo dos snapshots das fontes principais (mudança semântica vem da comparação). */
export function snapshotsOf(sourceId: string): FetchSnapshot[] {
  const s = SOURCES.find((x) => x.id === sourceId);
  const mk = (i: number, lines: string[], note?: string): FetchSnapshot => ({ id: `${sourceId}@${i}`, sourceId, at: stamp(i * 1440 + (i === 0 ? 18 : 600)), lines, note });
  if (sourceId === 's-coa-pricing') return [
    mk(0, ['Plans', 'Starter — $49/month', 'Business — $399/month', 'Enterprise — Starting at $2,500/month', 'Includes SSO, audit log, realtime anomaly detection'], 'Pricing disclosed'),
    mk(1, ['Plans', 'Starter — $49/month', 'Business — $399/month', 'Enterprise — Contact Sales', 'Includes SSO, audit log, realtime anomaly detection']),
    mk(2, ['Plans', 'Starter — $49/month', 'Business — $399/month', 'Enterprise — Contact Sales', 'Includes SSO, audit log']),
    mk(3, ['Plans', 'Starter — $49/month', 'Business — $399/month', 'Enterprise — Contact Sales', 'Includes SSO, audit log']),
    mk(9, ['Plans', 'Starter — $39/month', 'Business — $349/month', 'Enterprise — Contact Sales']),
  ];
  if (sourceId === 's-pbi-pricing') return [
    mk(0, ['Power BI Pro — $14/user/month', 'Premium Per User — $24/user/month', 'Fabric capacity — from $262/month'], 'Pricing changed'),
    mk(1, ['Power BI Pro — $10/user/month', 'Premium Per User — $20/user/month', 'Fabric capacity — from $262/month']),
    mk(5, ['Power BI Pro — $10/user/month', 'Premium Per User — $20/user/month']),
  ];
  return [0, 1, 2, 4, 7].map((i) => mk(i, [`${s?.name ?? sourceId}`, i === 0 ? 'Content refreshed; no relevant semantic change' : 'Content unchanged']));
}

/* ---------- Evidência, observações e packs ---------- */
export const EVIDENCE: Evidence[] = [];
const ev = (id: string, sourceId: string, role: Evidence['role'], strength: Level, kind: Evidence['kind'], excerpt: string, locator: string, minAgo: number): string => {
  EVIDENCE.push({ id, sourceId, role, strength, kind, excerpt, locator, capturedAt: stamp(minAgo), snapshotId: `${sourceId}@${minAgo < 1440 ? 0 : Math.floor(minAgo / 1440)}` }); return id;
};
ev('e-coa-price', 's-coa-pricing', 'Primary', 'high', 'web', 'Enterprise — Starting at $2,500/month', 'Pricing table › Enterprise › Price', 360);
ev('e-pbi-price', 's-pbi-pricing', 'Primary', 'high', 'web', 'Power BI Pro — $14/user/month', 'Pricing table › Pro', 34);
ev('e-coa-rad-docs', 's-coa-docs', 'Primary', 'high', 'web', 'Realtime anomaly detection monitors streaming metrics and raises alerts within seconds.', 'Docs › Features › Realtime anomaly detection', 2880);
ev('e-coa-rad-notes', 's-coa-notes', 'Primary', 'high', 'web', 'v8.2 — New: realtime anomaly detection (beta) for streaming datasets.', 'Release notes › v8.2 › New', 3000);
ev('e-coa-rad-news', 's-coa-news', 'Secondary', 'medium', 'web', 'Company A introduced realtime anomaly detection this week, targeting operations teams.', 'Article › paragraph 2', 2700);
ev('e-coa-off-site', 's-coa-site', 'Primary', 'high', 'web', 'Our 12 offices across Brazil.', 'About › Offices › heading', 1500);
ev('e-coa-off-data', 's-gov-offices', 'Secondary', 'medium', 'structured', 'record 5481 · office_count = 10', 'Dataset › row 5481 › office_count', 58000);
ev('e-domo-docs', 's-domo-docs', 'Primary', 'high', 'web', 'Domo pricing is consumption-based, billed per credit.', 'Docs › Pricing & billing', 4300);
ev('e-domo-news', 's-domo-news', 'Secondary', 'medium', 'web', 'Domo charges per user, according to partners.', 'Article › paragraph 4', 9000);
ev('e-fibra-pdf', 's-report-pdf', 'Primary', 'high', 'pdf', 'Revenue BRL 1.2 bn · 14 regional hubs · fiber route 38,000 km', 'Page 12 › Regional footprint (region B3)', 5000);
ev('e-syn', 's-syn-orig', 'Secondary', 'medium', 'web', 'Fibramax is expanding its backbone with 4,000 km of new fiber.', 'Article › headline', 800);
ev('e-qlik-ai', 's-qlik-blog', 'Primary', 'high', 'web', 'Qlik announces agentic AI assistant for Qlik Cloud.', 'Blog › post title', 1200);
ev('e-tab-pricing', 's-tab-pricing', 'Primary', 'high', 'web', 'Tableau Cloud — Standard edition pricing page restructured.', 'Pricing › editions', 900);
ev('e-look-docs', 's-look-docs', 'Primary', 'high', 'web', 'Updated: Looker API 4.0 reference.', 'Docs › API › reference', 1900);
ev('e-pbi-conn', 's-pbi-notes', 'Primary', 'high', 'web', 'New connector: Fabric Real-Time Hub (preview).', 'What\'s new › Connectors', 1000);

export const OBSERVATIONS: Observation[] = [];
const ob = (o: Omit<Observation, 'status'> & { status?: Observation['status'] }) => OBSERVATIONS.push({ status: score(o.confidence) >= 80 ? 'confirmed' : 'needs-verification', ...o });
ob({ id: 'o-coa-price', subjectId: 'coa', subject: 'Company A / Enterprise Plan', claim: 'Price', value: 'USD 2,500/month', observedAt: stamp(360), sourceId: 's-coa-pricing', evidenceIds: ['e-coa-price'], confidence: cf(98, 95, 75, 96, 95), extraction: 'Structured HTML', corroboration: 2, missionId: 'm1',
  history: [{ at: '2026-08-12', value: 'USD 1,999/month' }, { at: '2026-09-14', value: 'USD 2,199/month' }, { at: '2026-10-11', value: 'USD 2,500/month', evidenceId: 'e-coa-price' }] });
ob({ id: 'o-coa-price-prev', subjectId: 'coa', subject: 'Company A / Enterprise Plan', claim: 'Pricing disclosure', value: 'Contact Sales → Starting at $2,500/month', observedAt: stamp(360), sourceId: 's-coa-pricing', evidenceIds: ['e-coa-price'], confidence: cf(98, 95, 70, 94, 95), extraction: 'Structured HTML', corroboration: 1, missionId: 'm1', history: [{ at: '2026-10-10', value: 'Contact Sales' }, { at: '2026-10-11', value: 'Starting at $2,500/month', evidenceId: 'e-coa-price' }] });
ob({ id: 'o-pbi-price', subjectId: 'powerbi', subject: 'Power BI / Pro', claim: 'Price', value: 'USD 14/user/month', observedAt: stamp(34), sourceId: 's-pbi-pricing', evidenceIds: ['e-pbi-price'], confidence: cf(98, 98, 80, 96, 99), extraction: 'Structured HTML', corroboration: 2, missionId: 'm1', history: [{ at: '2026-07-14', value: 'USD 10/user/month' }, { at: '2026-10-11', value: 'USD 14/user/month', evidenceId: 'e-pbi-price' }] });
ob({ id: 'o-coa-rad', subjectId: 'coa', subject: 'Company A', claim: 'Launched realtime anomaly detection', value: 'Realtime anomaly detection (beta)', observedAt: stamp(2880), sourceId: 's-coa-docs', evidenceIds: ['e-coa-rad-docs', 'e-coa-rad-notes', 'e-coa-rad-news'], confidence: cf(96, 90, 92, 92, 96), extraction: 'Unstructured text', corroboration: 3, missionId: 'm1',
  history: [{ at: '2026-10-09', value: 'Announced in release notes v8.2' }, { at: '2026-10-11', value: 'Confirmed by documentation and article' }], aiNote: 'A IA classificou o recurso como diferencial de produto (streaming). A evidência acima é o texto original; esta nota é interpretação.' });
ob({ id: 'o-coa-offices-a', subjectId: 'coa', subject: 'Company A', claim: 'Office locations', value: '12 (official website)', observedAt: stamp(1500), sourceId: 's-coa-site', evidenceIds: ['e-coa-off-site'], confidence: cf(98, 92, 55, 90, 96, 'minor'), extraction: 'Structured HTML', corroboration: 1, status: 'conflicted', missionId: 'm1', history: [{ at: '2026-09-02', value: '10' }, { at: '2026-10-10', value: '12' }] });
ob({ id: 'o-coa-offices-b', subjectId: 'coa', subject: 'Company A', claim: 'Office locations', value: '10 (public dataset)', observedAt: stamp(58000), sourceId: 's-gov-offices', evidenceIds: ['e-coa-off-data'], confidence: cf(70, 40, 55, 88, 80, 'minor'), extraction: 'API record', corroboration: 1, status: 'conflicted', missionId: 'm1', history: [{ at: '2026-09-02', value: '10' }] });
ob({ id: 'o-domo-price-a', subjectId: 'domo', subject: 'Domo', claim: 'Pricing model', value: 'Consumption-based (credits)', observedAt: stamp(4300), sourceId: 's-domo-docs', evidenceIds: ['e-domo-docs'], confidence: cf(98, 85, 55, 92, 99, 'minor'), extraction: 'Unstructured text', corroboration: 1, status: 'conflicted', missionId: 'm1', history: [{ at: '2026-10-08', value: 'Consumption-based (credits)' }] });
ob({ id: 'o-domo-price-b', subjectId: 'domo', subject: 'Domo', claim: 'Pricing model', value: 'Per user (news article)', observedAt: stamp(9000), sourceId: 's-domo-news', evidenceIds: ['e-domo-news'], confidence: cf(62, 60, 40, 70, 85, 'minor'), extraction: 'Unstructured text', corroboration: 1, status: 'conflicted', missionId: 'm1', history: [{ at: '2026-10-05', value: 'Per user' }] });
ob({ id: 'o-f01-rev', subjectId: 'f01', subject: 'Fibramax Telecom', claim: 'Fiber route length', value: '38,000 km', observedAt: stamp(5000), sourceId: 's-report-pdf', evidenceIds: ['e-fibra-pdf'], confidence: cf(98, 80, 60, 82, 98), extraction: 'Document', corroboration: 1, missionId: 'm2', history: [{ at: '2026-10-08', value: '38,000 km', evidenceId: 'e-fibra-pdf' }] });
ob({ id: 'o-f01-bb', subjectId: 'f01', subject: 'Fibramax Telecom', claim: 'Backbone expansion', value: '+4,000 km', observedAt: stamp(800), sourceId: 's-syn-orig', evidenceIds: ['e-syn'], confidence: cf(60, 95, 20, 85, 96), extraction: 'Unstructured text', corroboration: 1, status: 'needs-verification', missionId: 'm2', history: [{ at: '2026-10-11', value: '+4,000 km (1 original + 11 mirrors)' }], aiNote: '12 domínios publicam o mesmo texto: contam como uma evidência independente, não doze.' });
ob({ id: 'o-qlik-ai', subjectId: 'qlik', subject: 'Qlik', claim: 'AI capability announced', value: 'Agentic AI assistant', observedAt: stamp(1200), sourceId: 's-qlik-blog', evidenceIds: ['e-qlik-ai'], confidence: cf(96, 90, 55, 90, 97), extraction: 'Unstructured text', corroboration: 1, missionId: 'm1', history: [{ at: '2026-10-10', value: 'Agentic AI assistant' }] });
ob({ id: 'o-tab-price', subjectId: 'tableau', subject: 'Tableau', claim: 'Pricing page changed', value: 'Editions restructured', observedAt: stamp(900), sourceId: 's-tab-pricing', evidenceIds: ['e-tab-pricing'], confidence: cf(96, 92, 50, 86, 98), extraction: 'Structured HTML', corroboration: 1, missionId: 'm1', history: [{ at: '2026-10-11', value: 'Editions restructured' }] });
ob({ id: 'o-look-docs', subjectId: 'looker', subject: 'Looker', claim: 'Documentation updated', value: 'API 4.0 reference', observedAt: stamp(1900), sourceId: 's-look-docs', evidenceIds: ['e-look-docs'], confidence: cf(96, 85, 45, 90, 97), extraction: 'Unstructured text', corroboration: 1, missionId: 'm1', history: [{ at: '2026-10-10', value: 'API 4.0 reference' }] });
ob({ id: 'o-pbi-conn', subjectId: 'powerbi', subject: 'Power BI', claim: 'New connector', value: 'Fabric Real-Time Hub (preview)', observedAt: stamp(1000), sourceId: 's-pbi-notes', evidenceIds: ['e-pbi-conn'], confidence: cf(98, 92, 50, 92, 99), extraction: 'Unstructured text', corroboration: 1, missionId: 'm1', history: [{ at: '2026-10-10', value: 'Fabric Real-Time Hub (preview)' }] });
// Observações geradas para as 27 organizações de fibra (determinísticas a partir da entidade).
ENTITIES.filter((e) => e.id.startsWith('f')).forEach((e, i) => {
  const srcId = i < 10 ? `s-${e.id}` : 's-news-teletime';
  const evId = ev(`e-${e.id}-loc`, srcId, i < 10 ? 'Primary' : 'Secondary', i < 10 ? 'high' : 'medium', 'web', `${e.name}: ${e.locations} points of presence in ${e.hq}.`, 'Page › Coverage › list', 600 + i * 90);
  const good = e.confidence >= 90, mid = e.confidence >= 75;
  ob({ id: `o-${e.id}-loc`, subjectId: e.id, subject: e.name, claim: 'Points of presence', value: `${e.locations}`, observedAt: stamp(600 + i * 90), sourceId: srcId, evidenceIds: [evId], confidence: cf(good ? 96 : mid ? 70 : 50, good ? 92 : 75, good ? 80 : mid ? 55 : 25, 88, good ? 95 : mid ? 82 : 60), extraction: 'Structured HTML', corroboration: good ? 2 : 1, missionId: 'm2', history: [{ at: day(30), value: String(Math.max(1, e.locations - 1)) }, { at: day(1), value: String(e.locations) }] });
});

export const EVIDENCE_PACKS: EvidencePack[] = [
  { id: 'p-coa-rad', claim: 'Company A launched realtime anomaly detection.', subjectId: 'coa', evidence: ['e-coa-rad-docs', 'e-coa-rad-notes', 'e-coa-rad-news'], firstObserved: '2026-10-09', lastConfirmed: '2026-10-11', contradictions: 'None' },
  { id: 'p-coa-price', claim: 'Company A disclosed Enterprise pricing: starting at $2,500/month.', subjectId: 'coa', evidence: ['e-coa-price'], firstObserved: '2026-10-11', lastConfirmed: '2026-10-11', contradictions: 'None' },
  { id: 'p-pbi-price', claim: 'Power BI Pro price increased to $14/user/month.', subjectId: 'powerbi', evidence: ['e-pbi-price'], firstObserved: '2026-10-11', lastConfirmed: '2026-10-11', contradictions: 'None' },
  { id: 'p-coa-off', claim: 'Company A operates offices in Brazil (12 vs 10).', subjectId: 'coa', evidence: ['e-coa-off-site', 'e-coa-off-data'], firstObserved: '2026-09-02', lastConfirmed: '2026-10-10', contradictions: '1 open conflict' },
  { id: 'p-qlik-ai', claim: 'Qlik announced an agentic AI assistant.', subjectId: 'qlik', evidence: ['e-qlik-ai'], firstObserved: '2026-10-10', lastConfirmed: '2026-10-10', contradictions: 'None' },
  { id: 'p-fibra-bb', claim: 'Fibramax is expanding its backbone by 4,000 km.', subjectId: 'f01', evidence: ['e-syn'], firstObserved: '2026-10-11', lastConfirmed: '2026-10-11', contradictions: 'None (1 original + 11 mirrors)' },
];
export const DOCUMENTS: ExternalDocument[] = [
  { id: 'd-ar', name: 'Annual Report 2025.pdf', kind: 'PDF', sourceId: 's-report-pdf', pages: 84, extracted: [{ field: 'Revenue', value: 'BRL 1.2 bn' }, { field: 'Regions', value: '14 regional hubs' }, { field: 'Products', value: 'Backhaul, FTTH, Dark fiber' }, { field: 'Risks', value: 'Spectrum and right-of-way costs' }, { field: 'Investments', value: 'BRL 220 mn in backbone (2026)' }] },
];

/* ---------- Mudanças ---------- */
export const CHANGES: ChangeEvent[] = [];
const eName = (id: string) => ENTITIES.find((e) => e.id === id)?.name ?? id;
const chg = (id: string, kind: ChangeKind, entityId: string, scope: string, before: string, after: string, semantic: string, detectedMin: number, sourceId: string, evidenceIds: string[], confidence: Level, category: ChangeEvent['category'], missionId: string, important = false, extra: Partial<ChangeEvent> = {}) =>
  CHANGES.push({ id, kind, entityId, entity: eName(entityId), scope, before, after, semantic, detectedMin, sourceId, evidenceIds, confidence, category, missionId, important, ...extra });
chg('c-pbi-price', 'Pricing changed', 'powerbi', 'Pro', '$10/user/month', '$14/user/month', 'Price increased 40%', 34, 's-pbi-pricing', ['e-pbi-price'], 'high', 'Pricing', 'm1', true, { observationId: 'o-pbi-price', snapshotIds: ['s-pbi-pricing@1', 's-pbi-pricing@0'] });
chg('c-coa-price', 'Pricing changed', 'coa', 'Enterprise', 'Contact Sales', 'Starting at $2,500/month', 'Pricing disclosed', 360, 's-coa-pricing', ['e-coa-price'], 'high', 'Pricing', 'm1', true, { observationId: 'o-coa-price', snapshotIds: ['s-coa-pricing@1', 's-coa-pricing@0'] });
chg('c-coa-rad', 'Capability added', 'coa', 'AI', '—', 'Realtime anomaly detection (beta)', 'New capability discovered', 2880, 's-coa-docs', ['e-coa-rad-docs', 'e-coa-rad-notes', 'e-coa-rad-news'], 'high', 'Product', 'm1', true, { observationId: 'o-coa-rad' });
chg('c-pbi-conn', 'Integration added', 'powerbi', 'Connectors', '—', 'Fabric Real-Time Hub (preview)', 'New connector', 1000, 's-pbi-notes', ['e-pbi-conn'], 'high', 'Product', 'm1', false, { observationId: 'o-pbi-conn' });
chg('c-tab-price', 'Pricing changed', 'tableau', 'Tableau Cloud', 'Creator / Explorer / Viewer', 'Standard / Enterprise / Tableau+ editions', 'Pricing page restructured', 900, 's-tab-pricing', ['e-tab-pricing'], 'high', 'Pricing', 'm1', true, { observationId: 'o-tab-price' });
chg('c-qlik-ai', 'Capability added', 'qlik', 'AI', '—', 'Agentic AI assistant', 'AI capability announced', 1200, 's-qlik-blog', ['e-qlik-ai'], 'high', 'Product', 'm1', true, { observationId: 'o-qlik-ai' });
chg('c-look-docs', 'Documentation updated', 'looker', 'API', 'API 3.1 reference', 'API 4.0 reference', 'Documentation updated', 1900, 's-look-docs', ['e-look-docs'], 'high', 'Documentation', 'm1', false, { observationId: 'o-look-docs' });
const BI_EXTRA: [string, ChangeKind, string, string, string, string, ChangeEvent['category']][] = [
  ['powerbi', 'Documentation updated', 'Desktop', 'Update notes', 'Update notes (Oct)', 'Documentation updated', 'Documentation'], ['tableau', 'Integration added', 'Connectors', '—', 'Snowflake Iceberg connector', 'New connector', 'Product'],
  ['qlik', 'Integration added', 'Connectors', '—', 'Talend data products', 'New integration', 'Product'], ['looker', 'Capability added', 'Maps', '—', 'Geospatial viz refresh', 'Map capability updated', 'Product'],
  ['domo', 'Capability added', 'Apps', '—', 'Domo App Studio templates', 'New templates', 'Product'], ['domo', 'Documentation updated', 'Billing', 'Billing v1', 'Billing v2', 'Documentation updated', 'Documentation'],
  ['domo', 'Pricing changed', 'Platform', 'Seat tiers', 'Credit tiers', 'Pricing model reframed', 'Pricing'],
];
BI_EXTRA.forEach(([e, k, sc, b, a, sem, cat], i) => chg(`c-bi-${i + 1}`, k, e, sc, b, a, sem, 2100 + i * 700, `s-${e === 'powerbi' ? 'pbi-notes' : e === 'tableau' ? 'tab-notes' : e === 'qlik' ? 'qlik-docs' : e === 'looker' ? 'look-docs' : e === 'domo' ? 'domo-docs' : 'coa-docs'}`, [], 'medium', cat, 'm1'));
// Mudanças mais antigas da Company A (fora da semana): aparecem na linha do tempo da entidade.
chg('c-coa-docs', 'Documentation updated', 'coa', 'API', '—', 'Added API endpoint /v2/anomalies', 'Documentation added API endpoint', 7 * 1440 + 3 * 1440, 's-coa-docs', [], 'medium', 'Documentation', 'm1');
chg('c-coa-int', 'Integration added', 'coa', 'Connectors', '—', 'PostgreSQL connector announced', 'New integration announced', 7 * 1440 + 10 * 1440, 's-coa-notes', [], 'medium', 'Product', 'm1');
// Demais missões (completa 42 mudanças relevantes na semana).
const OTHER: [string, string, ChangeKind, string, string, string, string, ChangeEvent['category']][] = [
  ['m2', 'f01', 'Capability added', 'Backbone', '—', '+4,000 km of fiber', 'Backbone expansion announced', 'News'], ['m2', 'f03', 'Location changed', 'Rio de Janeiro', '9 PoPs', '11 PoPs', 'Coverage expanded', 'Product'], ['m2', 'f18', 'Product renamed', 'Services', 'Monitoring Plus', 'Fiber Guard', 'Product renamed', 'Product'],
  ['m2', 'f28', 'Capability added', 'Services', '—', 'Managed wavelength', 'New service', 'Product'], ['m2', 'f08', 'Location changed', 'Brasília', '8 PoPs', '10 PoPs', 'Coverage expanded', 'Product'], ['m2', 'f11', 'Integration added', 'Partners', '—', 'Backhaul partnership', 'New partnership', 'News'],
  ['m2', 'f20', 'Location changed', 'Campinas', '6 PoPs', '7 PoPs', 'Coverage expanded', 'Product'], ['m2', 'f15', 'Feature removed', 'Services', 'Legacy ADSL', '—', 'Service retired', 'Product'], ['m2', 'f02', 'Location changed', 'Porto Alegre', '8 PoPs', '9 PoPs', 'Coverage expanded', 'Product'],
  ['m2', 'f25', 'Capability added', 'Services', '—', 'Dark fiber', 'New service', 'Product'], ['m2', 'f07', 'Documentation updated', 'Coverage', 'Coverage map v1', 'Coverage map v2', 'Coverage map updated', 'Documentation'],
  ['m3', 'coa', 'Location changed', 'Headquarters', 'São Paulo (Itaim)', 'São Paulo (Pinheiros)', 'Headquarters address updated', 'News'], ['m3', 'f01', 'Product renamed', 'Brand', 'Fibramax', 'Fibramax Telecom', 'Brand name updated', 'News'], ['m3', 'f09', 'Location changed', 'Headquarters', 'São José dos Campos', 'São Paulo', 'Headquarters moved', 'News'],
  ['m4', 'f01', 'Documentation updated', 'Regulation', 'Resolução 765', 'Resolução 765 (rev.)', 'Regulation revised', 'Documentation'], ['m4', 'f18', 'Documentation updated', 'Regulation', 'Consulta 12/2026 open', 'Consulta 12/2026 closed', 'Public consultation closed', 'Documentation'],
  ['m4', 'f03', 'Documentation updated', 'Deadlines', 'Deadline 2026-12-01', 'Deadline 2027-01-15', 'Compliance deadline moved', 'Documentation'], ['m4', 'f08', 'Capability added', 'Regulation', '—', 'New spectrum rules', 'New regulation published', 'News'],
  ['m4', 'f20', 'Documentation updated', 'Regulation', 'Norma 04/2025', 'Norma 04/2025 (alt.)', 'Regulation amended', 'Documentation'], ['m4', 'f11', 'Documentation updated', 'Regulation', '—', 'Reporting obligations', 'New obligation', 'Documentation'],
  ['m5', 'snow', 'Capability added', 'Iceberg', '—', 'Iceberg tables GA', 'Capability reached GA', 'Product'], ['m5', 'pg', 'Documentation updated', 'Release', 'PostgreSQL 17.0', 'PostgreSQL 18 beta', 'New major version in beta', 'Documentation'], ['m5', 'cob', 'Capability added', 'AI', '—', 'Natural-language query', 'New AI capability', 'Product'],
  ['m5', 'coc', 'Integration added', 'Connectors', '—', 'Snowflake connector', 'New integration', 'Product'], ['m5', 'snow', 'Documentation updated', 'Docs', 'Cortex preview', 'Cortex GA', 'Documentation updated', 'Documentation'], ['m5', 'pg', 'Integration added', 'Extensions', '—', 'pgvector 0.8', 'New extension release', 'Product'],
  ['m6', 'f12', 'Pricing changed', 'Plans', 'R$ 99/month', 'R$ 109/month', 'Price increased 10%', 'Pricing'],
  ['m10', 'f09', 'Location changed', 'São Paulo', '5 PoPs', '6 PoPs', 'New unit opened in São Paulo', 'Product'],
];
OTHER.forEach(([m, e, k, sc, b, a, sem, cat], i) => chg(`c-o-${i + 1}`, k, e, sc, b, a, sem, 400 + i * 330, SOURCES.find((s) => s.entityId === e)?.id ?? 's-news-teletime', [], 'medium', cat, m, false));

/* ---------- Conflitos ---------- */
export const CONFLICTS: Conflict[] = [
  { id: 'cf1', entityId: 'coa', entity: 'Company A', field: 'Office locations', a: { label: 'Official Website', value: '12', updated: '2026-10-10', sourceId: 's-coa-site' }, b: { label: 'Public Dataset', value: '10', updated: '2026-09-02', sourceId: 's-gov-offices' }, recommended: 'a', reason: 'Primary source + newer observation' },
  { id: 'cf2', entityId: 'domo', entity: 'Domo', field: 'Pricing model', a: { label: 'Official Documentation', value: 'Consumption-based (credits)', updated: '2026-10-08', sourceId: 's-domo-docs' }, b: { label: 'News article', value: 'Per user', updated: '2026-10-05', sourceId: 's-domo-news' }, recommended: 'a', reason: 'Primary source + newer observation' },
  { id: 'cf3', entityId: 'f05', entity: 'Rede Horizonte', field: 'Headquarters', a: { label: 'Official Website', value: 'Curitiba, PR', updated: '2026-10-02', sourceId: 's-f05' }, b: { label: 'Public Dataset', value: 'Joinville, SC', updated: '2026-08-19', sourceId: 's-anatel' }, recommended: 'a', reason: 'Primary source + newer observation' },
];

/* ---------- Missões, watchlists, datasets, runs ---------- */
const spec = (objective: string, entities: string[], sources: string[], extract: string[], frequency: ResearchMission['spec']['frequency'], deliver: string): ResearchMission['spec'] => ({ objective, entities, sources, extract, frequency, deliver, minEvidence: 2, preferredSource: 'Official', confidenceThreshold: 80 });
export const MISSIONS: ResearchMission[] = [
  { id: 'm1', name: 'BI Competitive Intelligence', template: 'Competitive Intelligence', spec: spec('Monitor BI competitors', ['Power BI', 'Tableau', 'Qlik', 'Looker', 'Domo', 'Company A'], ['official', 'documentation', 'pricing', 'release notes', 'news'], ['pricing', 'features', 'integrations', 'announcements'], 'Daily', 'competitive_intelligence_dataset'), status: 'active', lastRunMin: 42, nextRun: 'Tomorrow 08:00', entities: 6, sourcesMonitored: 87, observations: 1482, changesWeek: 0, entityIds: ['powerbi', 'tableau', 'qlik', 'looker', 'domo', 'coa'] },
  { id: 'm2', name: 'Fiber Network Market Brazil', template: 'Market Exploration', spec: spec('Map companies that offer fiber optic monitoring in Brazil', ['Fiber operators'], ['official', 'news', 'regulatory', 'open data'], ['products', 'locations', 'partnerships'], 'Weekly', 'fiber_market_brazil'), status: 'active', lastRunMin: 11, nextRun: 'Monday 07:00', entities: 27, sourcesMonitored: 41, observations: 348, changesWeek: 0, entityIds: ENTITIES.filter((e) => e.id.startsWith('f')).map((e) => e.id) },
  { id: 'm3', name: 'Company Enrichment', template: 'Company Enrichment', spec: spec('Enrich NovaLink customers with public company data', ['LDE customers'], ['official', 'open data', 'public API'], ['website', 'industry', 'headquarters', 'locations', 'products'], 'Weekly', 'enrichment_proposals_to_lde'), status: 'active', lastRunMin: 190, nextRun: 'Today 18:00', entities: 8, sourcesMonitored: 12, observations: 214, changesWeek: 0, entityIds: ['coa'] },
  { id: 'm4', name: 'Regulatory Watch', template: 'Regulatory Intelligence', spec: spec('Track telecom regulation affecting fiber operators', ['Anatel'], ['regulatory', 'official publications', 'open data'], ['new regulations', 'deadlines', 'affected entities'], 'Daily', 'workflow_trigger'), status: 'active', lastRunMin: 75, nextRun: 'Tomorrow 06:00', entities: 4, sourcesMonitored: 9, observations: 96, changesWeek: 0, entityIds: [] },
  { id: 'm5', name: 'Technology Landscape', template: 'Technology Landscape', spec: spec('Map technologies, projects and vendors in data platforms', ['Snowflake', 'PostgreSQL', 'OpenTelemetry'], ['public repositories', 'documentation', 'research'], ['technologies', 'vendors', 'integrations'], 'Weekly', 'technology_landscape'), status: 'active', lastRunMin: 600, nextRun: 'Monday 07:00', entities: 14, sourcesMonitored: 22, observations: 301, changesWeek: 0, entityIds: ['snow', 'pg'] },
  { id: 'm6', name: 'Cloud Pricing Benchmark', template: 'Competitive Intelligence', spec: spec('Benchmark cloud pricing for analytics workloads', ['Cloud vendors'], ['pricing', 'documentation'], ['pricing'], 'Daily', 'pricing_benchmark'), status: 'active', lastRunMin: 130, nextRun: 'Tomorrow 08:00', entities: 5, sourcesMonitored: 10, observations: 188, changesWeek: 0, entityIds: [] },
  { id: 'm7', name: 'Data Residency Rules', template: 'Regulatory Intelligence', spec: spec('Track data residency and LGPD guidance', ['ANPD'], ['regulatory'], ['new regulations', 'deadlines'], 'Weekly', 'workflow_trigger'), status: 'active', lastRunMin: 880, nextRun: 'Monday 06:00', entities: 2, sourcesMonitored: 6, observations: 64, changesWeek: 0, entityIds: [] },
  { id: 'm8', name: 'Partner Ecosystem Scan', template: 'Market Exploration', spec: spec('Who partners with BI vendors in Brazil?', ['BI partners'], ['official', 'news'], ['partnerships', 'locations'], 'Monthly', 'partner_landscape'), status: 'active', lastRunMin: 2200, nextRun: 'Nov 01', entities: 19, sourcesMonitored: 14, observations: 142, changesWeek: 0, entityIds: [] },
  { id: 'm9', name: 'Public Data for Customer 360', template: 'Find Public Data', spec: spec('Which public datasets can enrich Customer?', ['Customer'], ['open data', 'government'], ['fields', 'license', 'freshness'], 'One time', 'public_data_catalog'), status: 'active', lastRunMin: 5000, nextRun: '—', entities: 7, sourcesMonitored: 8, observations: 77, changesWeek: 0, entityIds: [] },
  { id: 'm10', name: 'Fiber Expansion Announcements SP', template: 'Market Exploration', spec: spec('Which companies opened new units in São Paulo?', ['Fiber operators'], ['news', 'official'], ['locations', 'announcements'], 'Daily', 'sp_expansion_map'), status: 'active', lastRunMin: 55, nextRun: 'Tomorrow 07:00', entities: 12, sourcesMonitored: 18, observations: 166, changesWeek: 0, entityIds: [] },
  { id: 'm11', name: 'ISP Open Data Coverage', template: 'Find Public Data', spec: spec('Find open coverage data for ISPs', ['ISPs'], ['open data', 'government'], ['coverage', 'license'], 'Monthly', 'isp_coverage'), status: 'active', lastRunMin: 7000, nextRun: 'Nov 03', entities: 9, sourcesMonitored: 7, observations: 58, changesWeek: 0, entityIds: [] },
  { id: 'm12', name: 'Analytics Hiring Signals', template: 'Technology Landscape', spec: spec('Observe hiring signals for analytics vendors', ['BI vendors'], ['official', 'news'], ['jobs', 'technologies'], 'Weekly', 'hiring_signals'), status: 'active', lastRunMin: 1300, nextRun: 'Monday 07:00', entities: 6, sourcesMonitored: 9, observations: 120, changesWeek: 0, entityIds: [] },
];
MISSIONS.forEach((m) => { m.changesWeek = CHANGES.filter((c) => c.missionId === m.id && c.detectedMin < WEEK_MIN).length; });

export const WATCHLISTS: Watchlist[] = [
  { id: 'w1', name: 'BI Competitors', entityIds: ['powerbi', 'tableau', 'qlik', 'looker', 'domo'], sources: 72, frequency: 'Daily', monitors: ['Pricing', 'Products', 'Features', 'Release Notes', 'Documentation', 'Integrations', 'Announcements'], missionId: 'm1' },
  { id: 'w2', name: 'Company A (deep watch)', entityIds: ['coa'], sources: 12, frequency: 'Daily', monitors: ['Pricing', 'Features', 'Documentation', 'Integrations'], missionId: 'm1' },
  { id: 'w3', name: 'Fiber operators — São Paulo', entityIds: ['f01', 'f09', 'f18', 'f20', 'f28'], sources: 24, frequency: 'Daily', monitors: ['Locations', 'Products', 'Announcements'], missionId: 'm10' },
  { id: 'w4', name: 'Telecom regulation', entityIds: [], sources: 9, frequency: 'Daily', monitors: ['Regulations', 'Deadlines', 'Publications'], missionId: 'm4' },
];

export const DATASETS: ResearchDataset[] = [
  { id: 'ds1', name: 'Competitive Intelligence', version: 4, companies: 6, fields: 42, coverage: 91, changesSinceLast: 12, missionId: 'm1', geo: false, updated: stamp(42) },
  { id: 'ds2', name: 'Fiber Market Brazil', version: 2, companies: 27, fields: 31, coverage: 88, changesSinceLast: 5, missionId: 'm2', geo: true, updated: stamp(11) },
  { id: 'ds3', name: 'Telecom Regulation Register', version: 3, companies: 0, fields: 14, coverage: 96, changesSinceLast: 6, missionId: 'm4', geo: false, updated: stamp(75) },
  { id: 'ds4', name: 'Technology Landscape', version: 1, companies: 14, fields: 22, coverage: 84, changesSinceLast: 6, missionId: 'm5', geo: false, updated: stamp(600) },
];

export const RESULT_FIBER: DiscoveryResult = { id: 'r1', query: 'Empresas que oferecem monitoramento de fibra óptica no Brasil', found: 27, high: 18, medium: 7, review: 2, entityIds: ENTITIES.filter((e) => e.id.startsWith('f')).map((e) => e.id) };

export const RUNS: Run[] = [
  { id: 'DR-2841', name: 'Fiber Network Market Brazil', missionId: 'm2', started: stamp(11), durationS: 504, evaluated: 184, relevant: 61, documents: 18, entities: 27, observations: 348, conflicts: 4, stage: 5 },
  { id: 'DR-2840', name: 'BI Competitive Intelligence', missionId: 'm1', started: stamp(42), durationS: 612, evaluated: 87, relevant: 74, documents: 9, entities: 6, observations: 126, conflicts: 2, stage: 8 },
  { id: 'DR-2839', name: 'Regulatory Watch', missionId: 'm4', started: stamp(75), durationS: 140, evaluated: 9, relevant: 6, documents: 4, entities: 4, observations: 18, conflicts: 0, stage: 8 },
  { id: 'DR-2838', name: 'Company Enrichment', missionId: 'm3', started: stamp(190), durationS: 322, evaluated: 12, relevant: 12, documents: 0, entities: 8, observations: 41, conflicts: 0, stage: 8 },
  { id: 'DR-2837', name: 'Fiber Expansion Announcements SP', missionId: 'm10', started: stamp(55), durationS: 211, evaluated: 18, relevant: 11, documents: 3, entities: 12, observations: 29, conflicts: 1, stage: 8 },
  { id: 'DR-2836', name: 'Technology Landscape', missionId: 'm5', started: stamp(600), durationS: 480, evaluated: 22, relevant: 17, documents: 6, entities: 14, observations: 51, conflicts: 0, stage: 8 },
];
export const RUN_STAGES = ['Plan', 'Discover', 'Acquire', 'Extract', 'Resolve', 'Verify', 'Synthesize', 'Deliver'] as const;

/** Funil operacional da Overview. */
export const FLOW = [['Discover', 184], ['Acquire', 161], ['Extract', 154], ['Verify', 143], ['Connected', 128], ['Delivered', 37]] as const;
export const OBS_WEEK = 2412;

/* ---------- Enriquecimento ---------- */
const prop = (field: string, value: string, sourceId: string, confidence: number, observed: string, policy = 'Public · attribution required') => ({ field, value, sourceId, confidence, observed, policy });
export const PROPOSALS: EnrichmentProposal[] = [
  { id: 'ep1', internalEntity: 'Nova Telecom Ltda.', match: 98, current: [{ field: 'CNPJ', value: '12.345.678/0001-90' }, { field: 'Company Name', value: 'Nova Telecom Ltda.' }, { field: 'Revenue', value: 'R$ 48,2 mi' }], status: 'proposed', proposed: [
    prop('Website', 'novatelecom.example', 's-cnpj', 97, day(0)), prop('Industry', 'Telecommunications', 's-cnpj', 96, day(0)), prop('Headquarters', 'Campinas, SP', 's-cnpj', 95, day(0)),
    prop('Locations', '6 offices (SP, MG, PR)', 's-gov-offices', 84, day(5), 'Public · aggregated'), prop('Product categories', 'FTTH, Managed wavelength', 's-f01', 88, day(1)),
  ] },
  ...['Alfa Logística S.A.', 'Beta Agro Ltda.', 'Cobalto Energia S.A.', 'Delta Saúde Ltda.', 'Eixo Varejo S.A.', 'Foco Educação Ltda.', 'Gama Indústria S.A.'].map((n, i): EnrichmentProposal => ({
    id: `ep${i + 2}`, internalEntity: n, match: 93 - i * 2, current: [{ field: 'CNPJ', value: `${20 + i}.000.000/0001-${10 + i}` }, { field: 'Company Name', value: n }], status: 'proposed',
    proposed: [prop('Website', `${n.split(' ')[0]!.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}.example`, 's-cnpj', 90 - i, day(1)), prop('Industry', ['Logistics', 'Agribusiness', 'Energy', 'Healthcare', 'Retail', 'Education', 'Manufacturing'][i]!, 's-cnpj', 92 - i, day(1)), prop('Headquarters', ['Santos, SP', 'Cuiabá, MT', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG', 'Recife, PE', 'Curitiba, PR', 'Joinville, SC'][i]!, 's-cnpj', 90 - i, day(1))],
  })),
];

export const EXPLORE_EXAMPLES = [
  'Empresas que oferecem monitoramento de fibra óptica no Brasil', 'Concorrentes com funcionalidades de AI Analytics', 'Encontre dados públicos para enriquecer nossos clientes',
  'Quais empresas abriram novas unidades em São Paulo?', 'Quais mudanças ocorreram nos produtos dos concorrentes?',
];
export const BLOCK_LABEL: Record<BlockReason, string> = { robots: 'Blocked by robots.txt', policy: 'Policy restricted', 'rate-limit': 'Rate limit reached', 'auth-required': 'Authentication required', unavailable: 'Source unavailable', removed: 'Content removed' };
export const BLOCK_NOTE: Record<BlockReason, string> = {
  robots: 'The site disallows automated access to this path. The BDE respects robots.txt and does not retry.', policy: 'Collection from this source is not permitted by the workspace policy (terms or personal-data rules).',
  'rate-limit': 'The configured rate limit was reached. The BDE waits for the window to reopen; it never rotates identities or raises the limit.', 'auth-required': 'The content requires a login. The BDE only reads public or explicitly authorized sources.',
  unavailable: 'The source did not respond. The last good snapshot is kept; a new check is scheduled.', removed: 'The page was removed by its publisher. Existing evidence keeps its snapshot as provenance.',
};
