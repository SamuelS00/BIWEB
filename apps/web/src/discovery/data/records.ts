/**
 * Dados derivados (determinísticos, demonstrativos) das telas de registro: matriz de comparação, status vivo das observações,
 * rótulos de evidência e diff de snapshots. Tudo é calculado a partir de seed.ts; nada aqui inventa evidência.
 */
import { CHANGES, ENTITIES, EVIDENCE_PACKS, NOW, OBSERVATIONS, SOURCES, score } from './seed';
import { changesOf, entityById, evidenceById, observationsOf, sourceById } from './derive';
import type { Evidence, EvidencePack, Observation } from './types';

const minAgoOf = (stampStr: string) => Math.max(0, Math.round((NOW - Date.parse(`${stampStr.replace(' ', 'T')}${stampStr.length <= 10 ? 'T00:00' : ''}Z`)) / 60000));
export const monthDay = (stampStr: string) => { const [, m, d] = stampStr.slice(0, 10).split('-'); return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(m) - 1] ?? m} ${Number(d)}`; };

/* ---------- Conflitos × observações ---------- */
/** Observações que representam cada lado de um conflito: a UI de conflitos é a fonte de verdade do status exibido. */
export const CONFLICT_OBS: Record<string, { a: string; b: string }> = { cf1: { a: 'o-coa-offices-a', b: 'o-coa-offices-b' }, cf2: { a: 'o-domo-price-a', b: 'o-domo-price-b' } };
export type LiveStatus = Observation['status'];
export function liveStatus(o: Observation, resolved: Record<string, 'a' | 'b'>): LiveStatus {
  for (const [cid, pair] of Object.entries(CONFLICT_OBS)) {
    const r = resolved[cid]; if (!r) continue;
    if (o.id === pair[r]) return 'confirmed';
    if (o.id === pair[r === 'a' ? 'b' : 'a']) return 'superseded';
  }
  return o.status;
}
export const STATUS_LABEL: Record<LiveStatus, string> = { confirmed: 'Confirmed', 'needs-verification': 'Needs verification', conflicted: 'Conflicted', superseded: 'Superseded' };

/* ---------- Evidência ---------- */
export function evidenceTitle(e: Evidence): string {
  const s = sourceById(e.sourceId);
  if (!s) return 'Evidence';
  if (/release/i.test(s.url)) return 'Release Notes';
  if (s.type === 'News') return 'Industry Article';
  if (s.type === 'Documentation') return s.authority === 'PRIMARY' ? 'Official Product Documentation' : 'Documentation';
  if (s.type === 'Pricing Page') return 'Official Pricing Page';
  if (s.type === 'Official Website') return 'Official Website';
  if (s.type === 'Open Data' || s.type === 'Public Database' || s.type === 'Government') return 'Public Dataset';
  if (s.type === 'Document') return 'Annual Report (PDF)';
  if (s.type === 'RSS') return 'Official Blog';
  return s.type;
}
/** Fontes independentes: espelhos contam como a fonte original. */
export const independentSources = (ids: string[]) => new Set(ids.map((id) => { const s = sourceById(evidenceById(id)?.sourceId ?? ''); return s?.originalOf ?? s?.id ?? id; }));
export const mirrorsOf = (sourceId: string) => SOURCES.filter((s) => s.originalOf === sourceId);
export function packObservation(p: EvidencePack): Observation | undefined {
  return observationsOf(p.subjectId).find((o) => o.evidenceIds.some((e) => p.evidence.includes(e)));
}
const STRENGTH = { high: 96, medium: 75, low: 50 } as const;
/** Quando não existe observação ligada, a confiança do pack é calculada pelos papéis e forças das evidências. */
export function packConfidence(p: EvidencePack) {
  const evs = p.evidence.map((id) => evidenceById(id)).filter((e): e is Evidence => !!e);
  const indep = independentSources(p.evidence).size;
  const auth = evs.length ? Math.round(evs.reduce((a, e) => a + STRENGTH[e.strength] - (e.role === 'Secondary' ? 6 : 0), 0) / evs.length) : 40;
  return { authority: auth, freshness: 90, corroboration: Math.min(95, 30 + indep * 30), extraction: 90, entityMatch: 95, contradictions: p.contradictions === 'None' || p.contradictions.startsWith('None') ? 'none' : 'minor' } as const;
}
export const packScore = (p: EvidencePack) => { const o = packObservation(p); return o ? score(o.confidence) : score({ ...packConfidence(p) }); };

/* ---------- Matriz de comparação ---------- */
export const COMPARE_ROWS = ['Products', 'Features', 'AI', 'Maps', 'Automation', 'Integrations', 'Pricing model', 'Last relevant change'] as const;
export type CompareRow = (typeof COMPARE_ROWS)[number];
export interface CompareCell { value: string; evidenceIds: string[]; confidence: number | null; confirmedMin: number | null }
const uniq = <T,>(a: T[]) => [...new Set(a)];
export function compareCell(entityId: string, row: CompareRow): CompareCell {
  const e = entityById(entityId); const none: CompareCell = { value: 'Not observed yet', evidenceIds: [], confidence: null, confirmedMin: null };
  if (!e) return none;
  const obs = observationsOf(entityId), chg = changesOf(entityId);
  const fromChange = (c: (typeof CHANGES)[number]): CompareCell => ({ value: c.after, evidenceIds: c.evidenceIds, confidence: c.evidenceIds.length ? (c.confidence === 'high' ? 92 : 78) : null, confirmedMin: c.detectedMin });
  const fromObs = (o: Observation, v?: string): CompareCell => ({ value: v ?? o.value, evidenceIds: o.evidenceIds, confidence: score(o.confidence), confirmedMin: minAgoOf(o.observedAt) });
  switch (row) {
    case 'Products': {
      const o = obs.find((x) => /price/i.test(x.claim));
      return { value: e.products.join(', ') || '—', evidenceIds: o?.evidenceIds ?? [], confidence: o ? score(o.confidence) : null, confirmedMin: o ? minAgoOf(o.observedAt) : e.lastConfirmedMin };
    }
    case 'Features': { const cs = chg.filter((c) => c.kind === 'Capability added'); return cs.length ? { ...fromChange(cs[0]!), value: uniq(cs.map((c) => c.after)).join(', '), evidenceIds: uniq(cs.flatMap((c) => c.evidenceIds)) } : none; }
    case 'AI': { const c = chg.find((x) => x.scope === 'AI'); const o = obs.find((x) => /AI|anomaly/i.test(x.claim)); return o ? fromObs(o) : c ? fromChange(c) : none; }
    case 'Maps': { const c = chg.find((x) => x.scope === 'Maps'); return c ? fromChange(c) : none; }
    case 'Automation': { const c = chg.find((x) => /automation|workflow/i.test(`${x.scope} ${x.after}`)); return c ? fromChange(c) : none; }
    case 'Integrations': {
      const c = chg.find((x) => x.kind === 'Integration added');
      return e.integrations.length ? { value: e.integrations.join(', '), evidenceIds: c?.evidenceIds ?? [], confidence: c?.evidenceIds.length ? 90 : null, confirmedMin: c?.detectedMin ?? e.lastConfirmedMin } : none;
    }
    case 'Pricing model': {
      const o = obs.find((x) => /pricing model/i.test(x.claim)) ?? obs.find((x) => /price/i.test(x.claim));
      if (o) return fromObs(o, o.claim === 'Price' ? `${o.subject.split('/')[1]?.trim() ?? 'Plan'}: ${o.value}` : o.value);
      const c = chg.find((x) => x.category === 'Pricing'); return c ? fromChange(c) : none;
    }
    case 'Last relevant change': { const c = chg[0]; return c ? { ...fromChange(c), value: `${c.kind}: ${c.semantic}` } : none; }
  }
}

/* ---------- Diff de snapshots ---------- */
export interface DiffLine { t: 'same' | 'add' | 'del'; s: string }
/** Diff de linhas por LCS (os snapshots são pequenos). */
export function lineDiff(a: string[], b: string[]): DiffLine[] {
  const n = a.length, m = b.length, L: number[][] = Array.from({ length: n + 1 }, () => Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i]![j] = a[i] === b[j] ? L[i + 1]![j + 1]! + 1 : Math.max(L[i + 1]![j]!, L[i]![j + 1]!);
  const out: DiffLine[] = []; let i = 0, j = 0;
  while (i < n && j < m) { if (a[i] === b[j]) { out.push({ t: 'same', s: a[i]! }); i++; j++; } else if (L[i + 1]![j]! >= L[i]![j + 1]!) out.push({ t: 'del', s: a[i++]! }); else out.push({ t: 'add', s: b[j++]! }); }
  while (i < n) out.push({ t: 'del', s: a[i++]! }); while (j < m) out.push({ t: 'add', s: b[j++]! });
  return out;
}

/* ---------- Extrator personalizado (prévia) ---------- */
export const EXTRACT_FIELDS = ['Product Name', 'Plan', 'Price', 'Features', 'Availability'] as const;
export const PRODUCT_SCHEMA: [string, string, string][] = [
  ['product_name', 'string', 'Canonical product name'], ['pricing_model', 'enum', 'Subscription, consumption, per user, contact sales'], ['starting_price', 'money', 'Lowest disclosed price, with currency and period'],
  ['features[]', 'string[]', 'Capabilities listed by the publisher'], ['integrations[]', 'string[]', 'Named systems the product connects to'], ['availability', 'enum', 'Available, beta, waitlist, retired'], ['last_updated', 'date', 'When the publisher last changed the page'],
];
export interface ExtractRow { plan: string; price: string; features: string; availability: string }
/** Extrai linhas "Plano — preço" do snapshot mais recente. Sem padrão reconhecido, devolve vazio (nada é inventado). */
export function previewExtract(lines: string[]): { product: string; rows: ExtractRow[] } {
  const feats = lines.find((l) => /^includes/i.test(l))?.replace(/^includes\s*/i, '') ?? '—';
  const rows = lines.filter((l) => / — /.test(l)).map((l): ExtractRow => { const [plan = '', price = ''] = l.split(' — '); return { plan, price, features: feats, availability: /contact sales/i.test(price) ? 'Contact Sales' : 'Available' }; });
  return { product: '', rows };
}
export { ENTITIES, EVIDENCE_PACKS, OBSERVATIONS };
