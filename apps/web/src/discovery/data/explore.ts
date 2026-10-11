/**
 * Auxiliares puros do Explore: classificação de consulta, bandas de confiança, fontes candidatas e resultados.
 * Tudo é demonstrativo e determinístico (lê de seed.ts; nada aqui consulta fonte real).
 */
import { CHANGES, ENTITIES, EVIDENCE, RELATIONSHIPS, RESULT_FIBER, SOURCES } from './seed';
import { observationsOf, inWeek } from './derive';
import type { EntityCandidate, SourceDescriptor } from './types';

export type QueryKind = 'fiber' | 'competitors' | 'public' | 'sp' | 'changes' | 'bi' | 'none';
export interface QueryPlan { kind: QueryKind; /** consulta ampla: mostra o Research Plan antes de executar */ plan: boolean }

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function classifyQuery(q: string): QueryPlan {
  const s = norm(q);
  if (!s.trim()) return { kind: 'none', plan: false };
  if (s.includes('profundamente') || s.includes('deep') || s.includes('mercado de bi')) return { kind: 'bi', plan: true };
  if (s.includes('mudancas')) return { kind: 'changes', plan: false };
  if (s.includes('fibra')) return { kind: 'fiber', plan: false };
  if (s.includes('ai analytics') || s.includes('concorrentes')) return { kind: 'competitors', plan: false };
  if (s.includes('dados publicos') || s.includes('publicos')) return { kind: 'public', plan: false };
  if (s.includes('novas unidades') || s.includes('sao paulo')) return { kind: 'sp', plan: false };
  return { kind: 'none', plan: false };
}

export const PLAN_STEPS = ['Identify major vendors', 'Discover official sources', 'Find public market references', 'Extract product information', 'Compare capabilities', 'Validate evidence', 'Build market landscape'];
export const RUN_STEPS = ['Understanding intent', 'Expanding search concepts', 'Discovering candidate sources', 'Evaluating relevance', 'Extracting entities', 'Cross-checking evidence', 'Building result'];

export type Band = 'high' | 'medium' | 'review';
export const bandOf = (c: number): Band => (c >= 90 ? 'high' : c >= 75 ? 'medium' : 'review');
export const BAND_LABEL: Record<Band, string> = { high: 'High confidence', medium: 'Medium confidence', review: 'Needs review' };

export function bandCounts(list: { confidence: number }[]) {
  const r = { found: list.length, high: 0, medium: 0, review: 0 };
  for (const e of list) r[bandOf(e.confidence)]++;
  return r;
}

const byIds = (ids: string[]) => ids.map((id) => ENTITIES.find((e) => e.id === id)).filter((e): e is EntityCandidate => !!e);
const COMPETITORS = ['powerbi', 'tableau', 'qlik', 'looker', 'domo', 'coa', 'cob', 'coc'];
const BI_VENDORS = ['powerbi', 'tableau', 'qlik', 'looker', 'domo'];

export function resultEntities(kind: QueryKind): EntityCandidate[] {
  switch (kind) {
    case 'fiber': return byIds(RESULT_FIBER.entityIds);
    case 'sp': return byIds(RESULT_FIBER.entityIds).filter((e) => (e.hq ?? '').endsWith(', SP'));
    case 'competitors': return byIds(COMPETITORS);
    case 'bi': return byIds(BI_VENDORS);
    default: return [];
  }
}

/** Contagens exibidas no checklist (demo). Para o resultado de fibra: 184 candidatas, 61 selecionadas, 348 observações, 27 empresas. */
export const COUNTS: Record<QueryKind, { cands: number; sel: number; obs: number; ents: number }> = {
  fiber: { cands: 184, sel: 61, obs: 348, ents: 27 }, competitors: { cands: 87, sel: 74, obs: 126, ents: 8 }, bi: { cands: 96, sel: 38, obs: 212, ents: 5 },
  sp: { cands: 58, sel: 24, obs: 96, ents: 6 }, public: { cands: 42, sel: 9, obs: 0, ents: 0 }, changes: { cands: 63, sel: 41, obs: 44, ents: 6 }, none: { cands: 0, sel: 0, obs: 0, ents: 0 },
};

export type SourceClass = 'Relevant' | 'Low relevance' | 'Duplicate' | 'Blocked' | 'Policy restricted';
export interface Candidate { src: SourceDescriptor; cls: SourceClass }

export function classOf(s: SourceDescriptor, relevant: Set<string>): SourceClass {
  if (s.blocked === 'policy') return 'Policy restricted';
  if (s.health === 'blocked' || s.blocked === 'robots' || s.blocked === 'auth-required') return 'Blocked';
  if (s.originalOf) return 'Duplicate';
  return relevant.has(s.id) ? 'Relevant' : 'Low relevance';
}

const RELEVANT: Record<QueryKind, string[]> = {
  fiber: ['s-f01', 's-f02', 's-f03', 's-f04', 's-anatel', 's-news-teletime', 's-report-pdf', 's-f05', 's-f06'],
  sp: ['s-f01', 's-f09', 's-anatel', 's-news-teletime', 's-ibge', 's-syn-orig'],
  competitors: ['s-coa-pricing', 's-coa-docs', 's-pbi-pricing', 's-tab-pricing', 's-qlik-blog', 's-look-docs', 's-domo-docs', 's-coa-notes', 's-pbi-notes'],
  bi: ['s-pbi-pricing', 's-tab-pricing', 's-qlik-docs', 's-look-docs', 's-domo-docs', 's-domo-news', 's-gov-offices'],
  public: ['s-gov-offices', 's-anatel', 's-ibge', 's-cnpj', 's-api-cep'],
  changes: ['s-coa-pricing', 's-pbi-pricing', 's-qlik-blog', 's-tab-notes'],
  none: [],
};
const EXTRA: Record<QueryKind, string[]> = {
  fiber: ['s-syn-1', 's-syn-2', 's-syn-3', 's-blk-robots', 's-blk-auth', 's-blk-rate', 's-blk-policy', 's-gen-140', 's-gen-141', 's-gen-142'],
  sp: ['s-syn-1', 's-syn-2', 's-blk-robots', 's-blk-policy', 's-gen-150', 's-gen-151'],
  competitors: ['s-blk-rm', 's-blk-policy', 's-gen-160', 's-gen-161', 's-gen-162'],
  bi: ['s-blk-auth', 's-blk-policy', 's-gen-170', 's-gen-171', 's-gen-172'],
  public: ['s-blk-policy', 's-blk-rate', 's-gen-180', 's-gen-181'],
  changes: ['s-blk-rm', 's-gen-190', 's-gen-191'],
  none: [],
};

export function candidateSources(kind: QueryKind): Candidate[] {
  const rel = new Set(RELEVANT[kind]);
  const ids = [...RELEVANT[kind], ...EXTRA[kind]];
  const out: Candidate[] = [];
  for (const id of ids) { const src = SOURCES.find((s) => s.id === id); if (src) out.push({ src, cls: classOf(src, rel) }); }
  return out;
}

/** Fontes de referência para "Find Public Data": colunas derivadas de forma determinística. */
export interface PublicRow { src: SourceDescriptor; description: string; fields: string[]; coverage: number; license: string; access: string; country: string; freshness: string }
const PUB_META: Record<string, { description: string; fields: string[]; coverage: number; country: string }> = {
  's-gov-offices': { description: 'Registry of company offices and branches', fields: ['CNPJ', 'City', 'State', 'Address'], coverage: 78, country: 'Brazil' },
  's-anatel': { description: 'Telecom operators, licences and network indicators', fields: ['Operator', 'Licence', 'Coverage', 'Subscribers'], coverage: 92, country: 'Brazil' },
  's-ibge': { description: 'National address registry used to geocode locations', fields: ['Address', 'Municipality', 'Lat/Lon'], coverage: 96, country: 'Brazil' },
  's-cnpj': { description: 'Company registration data (legal name, activity, headquarters)', fields: ['CNPJ', 'Legal name', 'Industry (CNAE)', 'Headquarters'], coverage: 88, country: 'Brazil' },
  's-api-cep': { description: 'Postal code lookup API', fields: ['Postal code', 'Street', 'City'], coverage: 99, country: 'Brazil' },
};
export function publicRows(): PublicRow[] {
  const ref = SOURCES.filter((s) => s.authority === 'REFERENCE' && !s.blocked);
  const named = ref.filter((s) => PUB_META[s.id]);
  const gen = ref.filter((s) => !PUB_META[s.id] && s.id.startsWith('s-gen-')).slice(0, 3);
  return [...named, ...gen].map((src, i) => {
    const m = PUB_META[src.id];
    return {
      src, description: m?.description ?? `Reference dataset (${src.type})`, fields: m?.fields ?? ['Name', 'Identifier', 'Location'], coverage: m?.coverage ?? 60 + ((i * 7) % 25),
      license: src.policy.license, access: src.policy.access, country: m?.country ?? 'Brazil', freshness: src.lastCheckedMin >= 1440 ? `${Math.round(src.lastCheckedMin / 1440)} d` : `${src.lastCheckedMin} min`,
    };
  });
}

/** Evidência mais direta de uma entidade: observação própria ou evidência de alguma fonte dela. */
export function evidenceOfEntity(id: string): string | undefined {
  const o = observationsOf(id).find((x) => x.evidenceIds.length > 0);
  if (o) return o.evidenceIds[0];
  const srcIds = SOURCES.filter((s) => s.entityId === id).map((s) => s.id);
  return EVIDENCE.find((e) => srcIds.includes(e.sourceId))?.id;
}

export const changesCount = (id: string) => CHANGES.filter((c) => c.entityId === id).length;
export const weekChanges = () => CHANGES.filter(inWeek);

/** Grafo do resultado: organizações do resultado + vizinhos (≤ 40 nós). */
export interface GNode { id: string; x: number; y: number; w: number; h: number; ent: EntityCandidate; core: boolean }
export interface GEdge { id: string; from: string; to: string; label?: string; dim: boolean }
export function resultGraph(list: EntityCandidate[], cap = 40): { nodes: GNode[]; edges: GEdge[] } {
  const core = new Set(list.map((e) => e.id));
  const ids = new Set(core);
  for (const r of RELATIONSHIPS) {
    if (ids.size >= cap) break;
    if (core.has(r.from) && !ids.has(r.to) && ENTITIES.some((e) => e.id === r.to)) ids.add(r.to);
    else if (core.has(r.to) && !ids.has(r.from) && ENTITIES.some((e) => e.id === r.from)) ids.add(r.from);
  }
  const ents = [...ids].map((id) => ENTITIES.find((e) => e.id === id)).filter((e): e is EntityCandidate => !!e).slice(0, cap);
  const hub = ents.find((e) => e.id === 'br');
  const rest = ents.filter((e) => e !== hub);
  const W = 132, H = 40;
  const nodes: GNode[] = [];
  if (hub) nodes.push({ id: hub.id, x: -W / 2, y: -H / 2, w: W, h: H, ent: hub, core: core.has(hub.id) });
  const inner = Math.min(rest.length, hub ? 10 : 8);
  rest.forEach((e, i) => {
    const ring = i < inner ? 0 : 1, idx = ring === 0 ? i : i - inner, cnt = ring === 0 ? inner : rest.length - inner;
    const r = ring === 0 ? 230 : 420, a = (idx / Math.max(1, cnt)) * Math.PI * 2 - Math.PI / 2 + (ring ? 0.2 : 0);
    nodes.push({ id: e.id, x: Math.round(Math.cos(a) * r * 1.35 - W / 2), y: Math.round(Math.sin(a) * r - H / 2), w: W, h: H, ent: e, core: core.has(e.id) });
  });
  const edges: GEdge[] = [];
  const has = new Set(nodes.map((n) => n.id));
  RELATIONSHIPS.forEach((r, i) => { if (has.has(r.from) && has.has(r.to)) edges.push({ id: `r${i}`, from: r.from, to: r.to, label: r.kind, dim: false }); });
  if (hub) for (const n of nodes) if (n.id !== hub.id && n.ent.type === 'Organization' && !edges.some((e) => (e.from === n.id && e.to === hub.id) || (e.to === n.id && e.from === hub.id))) edges.push({ id: `b${n.id}`, from: n.id, to: hub.id, dim: true });
  return { nodes, edges };
}

/** Agrupa pontos próximos (graus) para o mapa: clusters com contagem. */
export interface Cluster { id: string; lat: number; lon: number; members: EntityCandidate[] }
export function clusterGeo(list: EntityCandidate[], maxDeg = 1.6): Cluster[] {
  const out: Cluster[] = [];
  for (const e of list) {
    if (!e.geo) continue;
    const hit = out.find((c) => Math.hypot(c.lat - e.geo!.lat, c.lon - e.geo!.lon) < maxDeg);
    if (hit) { const n = hit.members.length; hit.lat = (hit.lat * n + e.geo.lat) / (n + 1); hit.lon = (hit.lon * n + e.geo.lon) / (n + 1); hit.members.push(e); }
    else out.push({ id: `c${out.length}`, lat: e.geo.lat, lon: e.geo.lon, members: [e] });
  }
  return out;
}
