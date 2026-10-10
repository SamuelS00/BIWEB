/** Motor de amostras determinístico do Data Workspace: gera linhas e perfis coerentes a partir da definição das colunas. */
export type Gen = 'uuid' | 'int' | 'seq' | 'name' | 'cpf' | 'cnpj' | 'email' | 'phone' | 'cep' | 'uf' | 'date' | 'datetime' | 'money' | 'qty' | 'bool' | 'enum' | 'text' | 'code' | 'lat' | 'lng' | 'pct';
export type Cell = string | number | boolean | null;

export interface ColDef {
  name: string; gen: Gen; phys: string; flag?: 'PK' | 'FK';
  /** Valores para gen "enum" (separados por |). */
  opts?: string[];
  sem: string; concept?: string; pii: boolean; klass: 'Pessoal' | 'Sensível' | 'Interno' | 'Público';
  via: 'Regra' | 'Estatística' | 'Conhecimento' | 'Assistido por IA' | 'Decisão humana';
  conf: number; suggested?: boolean; nullPct?: number; invalidPct?: number;
}

export function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const FIRST = ['Ana', 'Bruno', 'Carla', 'Diego', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João', 'Karina', 'Lucas', 'Mariana', 'Nicolas', 'Olívia', 'Paulo', 'Renata', 'Samuel', 'Tatiana', 'Vinícius'];
const LAST = ['Almeida', 'Barbosa', 'Cardoso', 'Dias', 'Esteves', 'Ferreira', 'Gomes', 'Lima', 'Martins', 'Nogueira', 'Oliveira', 'Pereira', 'Ribeiro', 'Silva', 'Teixeira'];
const UFS = ['SP', 'SP', 'SP', 'RJ', 'RJ', 'MG', 'MG', 'PR', 'RS', 'BA', 'SC', 'PE', 'CE', 'GO', 'DF'];
const WORDS = ['Instalação de fibra', 'Troca de roteador', 'Reparo de cabo', 'Visita técnica', 'Migração de plano', 'Ativação de ponto', 'Manutenção preventiva', 'Substituição de ONU'];
const pad = (n: number, w: number) => String(n).padStart(w, '0');
const pick = <T,>(r: () => number, a: T[]): T => a[Math.floor(r() * a.length)] as T;

function cpfDigits(r: () => number) { return pad(Math.floor(r() * 1e11), 11); }

export function gen(c: ColDef, r: () => number, i: number): Cell {
  if (c.nullPct && r() * 100 < c.nullPct) return null;
  switch (c.gen) {
    case 'uuid': { const h = () => Math.floor(r() * 65536).toString(16).padStart(4, '0'); return `${h()}${h()}-${h()}-4${h().slice(1)}-a${h().slice(1)}-${h()}${h()}${h()}`; }
    case 'seq': return 100000 + i;
    case 'int': return Math.floor(r() * 90000) + 1000;
    case 'name': return `${pick(r, FIRST)} ${pick(r, LAST)}`;
    case 'cpf': { const d = cpfDigits(r); if (c.invalidPct && r() * 100 < c.invalidPct) return d.slice(0, 9); return r() < 0.94 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : d; }
    case 'cnpj': { const d = pad(Math.floor(r() * 1e14), 14); return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`; }
    case 'email': return `${pick(r, FIRST).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}.${pick(r, LAST).toLowerCase()}${Math.floor(r() * 90)}@${pick(r, ['gmail.com', 'outlook.com', 'novalink.com.br', 'empresa.com.br'])}`;
    case 'phone': return `(${pick(r, ['11', '21', '31', '41', '51', '71'])}) 9${pad(Math.floor(r() * 1e4), 4)}-${pad(Math.floor(r() * 1e4), 4)}`;
    case 'cep': return `${pad(Math.floor(r() * 99999), 5)}-${pad(Math.floor(r() * 999), 3)}`;
    case 'uf': return pick(r, UFS);
    case 'date': return `${2023 + Math.floor(r() * 4)}-${pad(1 + Math.floor(r() * 12), 2)}-${pad(1 + Math.floor(r() * 28), 2)}`;
    case 'datetime': return `${2026}-${pad(1 + Math.floor(r() * 10), 2)}-${pad(1 + Math.floor(r() * 28), 2)} ${pad(Math.floor(r() * 24), 2)}:${pad(Math.floor(r() * 60), 2)}:${pad(Math.floor(r() * 60), 2)}`;
    case 'money': return Math.round((20 + Math.pow(r(), 2.4) * 4800) * 100) / 100;
    case 'qty': return 1 + Math.floor(Math.pow(r(), 2) * 12);
    case 'pct': return Math.round(r() * 1000) / 10;
    case 'bool': return r() < 0.82;
    case 'enum': { const o = c.opts ?? ['A', 'B']; return o[Math.floor(Math.pow(r(), 1.6) * o.length)] ?? null; }
    case 'text': return pick(r, WORDS);
    case 'code': return `${pick(r, ['AX', 'BX', 'CT', 'FR'])}-${pad(Math.floor(r() * 9999), 4)}`;
    case 'lat': return Math.round((-23.9 + r() * 1.1) * 1e5) / 1e5;
    case 'lng': return Math.round((-46.9 + r() * 1.0) * 1e5) / 1e5;
  }
}

const cache = new Map<string, Cell[][]>();
export function sampleRows(assetId: string, cols: ColDef[], n = 1500): Cell[][] {
  const key = `${assetId}:${n}:${cols.length}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const r = rng(assetId);
  const rows: Cell[][] = [];
  for (let i = 0; i < n; i++) rows.push(cols.map((c) => gen(c, r, i)));
  cache.set(key, rows);
  return rows;
}

export interface Profile {
  nullPct: number; distinct: number; distinctPct: number; dupPct: number; candidateKey: boolean;
  kind: 'numeric' | 'category' | 'date' | 'string' | 'boolean';
  min?: string; max?: string; avg?: string; len?: { min: number; avg: number; max: number };
  top: { v: string; pct: number }[]; hist: { label: string; v: number }[]; patterns: { p: string; pct: number }[];
}
const mask = (s: string) => s.replace(/[0-9]/g, '9').replace(/[a-zà-ú]/g, 'a').replace(/[A-ZÀ-Ú]/g, 'A').slice(0, 26);
const fmt = (n: number) => (Math.abs(n) >= 1000 ? n.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : n.toLocaleString('pt-BR', { maximumFractionDigits: 2 }));
const pcache = new Map<string, Profile>();

export function profileOf(assetId: string, cols: ColDef[], ci: number): Profile {
  const c = cols[ci]!;
  const k = `${assetId}.${c.name}`;
  const hit = pcache.get(k);
  if (hit) return hit;
  const rows = sampleRows(assetId, cols);
  const vals = rows.map((r) => r[ci] ?? null);
  const nn = vals.filter((v): v is string | number | boolean => v !== null);
  const counts = new Map<string, number>();
  nn.forEach((v) => counts.set(String(v), (counts.get(String(v)) ?? 0) + 1));
  const distinct = counts.size, total = vals.length;
  const dups = nn.length - distinct;
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([v, n]) => ({ v, pct: Math.round((n / total) * 1000) / 10 }));
  const kind: Profile['kind'] = c.gen === 'bool' ? 'boolean' : (c.gen === 'date' || c.gen === 'datetime') ? 'date' : (['money', 'qty', 'int', 'pct', 'seq', 'lat', 'lng'] as Gen[]).includes(c.gen) ? 'numeric' : (c.gen === 'enum' || c.gen === 'uf') ? 'category' : 'string';
  const p: Profile = { nullPct: Math.round(((total - nn.length) / total) * 1000) / 10, distinct, distinctPct: Math.round((distinct / Math.max(1, nn.length)) * 1000) / 10, dupPct: Math.round((dups / Math.max(1, total)) * 1000) / 10, candidateKey: distinct === nn.length && nn.length === total, kind, top, hist: [], patterns: [] };
  if (kind === 'numeric') {
    const ns = nn as number[], mn = Math.min(...ns), mx = Math.max(...ns), avg = ns.reduce((s, x) => s + x, 0) / ns.length;
    p.min = fmt(mn); p.max = fmt(mx); p.avg = fmt(avg);
    const B = 12, w = (mx - mn) / B || 1, h = new Array<number>(B).fill(0);
    ns.forEach((x) => { const i = Math.min(B - 1, Math.floor((x - mn) / w)); h[i] = (h[i] ?? 0) + 1; });
    p.hist = h.map((v, i) => ({ label: fmt(mn + i * w), v }));
  } else if (kind === 'date') {
    const ss = (nn as string[]).slice().sort();
    p.min = ss[0]; p.max = ss[ss.length - 1];
    const m = new Map<string, number>();
    ss.forEach((s) => m.set(s.slice(0, 7), (m.get(s.slice(0, 7)) ?? 0) + 1));
    p.hist = [...m.entries()].sort().slice(-18).map(([label, v]) => ({ label, v }));
  } else if (kind === 'boolean') {
    p.hist = ['true', 'false'].map((label) => ({ label, v: counts.get(label) ?? 0 }));
  } else if (kind === 'category') {
    p.hist = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, v]) => ({ label, v }));
  } else {
    const ls = (nn as string[]).map((s) => String(s).length);
    p.len = { min: Math.min(...ls), avg: Math.round(ls.reduce((s, x) => s + x, 0) / ls.length), max: Math.max(...ls) };
    const lh = new Map<number, number>();
    ls.forEach((l) => lh.set(l, (lh.get(l) ?? 0) + 1));
    p.hist = [...lh.entries()].sort((a, b) => a[0] - b[0]).map(([label, v]) => ({ label: String(label), v }));
    const pm = new Map<string, number>();
    (nn as string[]).forEach((s) => { const m = mask(String(s)); pm.set(m, (pm.get(m) ?? 0) + 1); });
    p.patterns = [...pm.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([pp, n]) => ({ p: pp, pct: Math.round((n / nn.length) * 1000) / 10 }));
  }
  pcache.set(k, p);
  return p;
}

export const nf = (n: number) => n.toLocaleString('pt-BR');
export const compact = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(2).replace('.', ',')} bi` : n >= 1e6 ? `${(n / 1e6).toFixed(2).replace('.', ',')} mi` : n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace('.', ',')} mil` : String(n));
