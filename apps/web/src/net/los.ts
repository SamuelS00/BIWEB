/**
 * Linha de visada (LOS) entre torres sobre o relevo de terrain() (elevation() + morros locais).
 * Modelo simples: reta entre os topos das antenas (cota do terreno + altura da torre), perfil amostrado
 * ao longo do segmento; folga = cota da reta − cota do terreno. Sem curvatura da Terra nem zona de Fresnel
 * (em enlaces de 2–6 km ambas somam poucos metros).
 */
import { network } from '../data/registry';
import { elevation, km, type NetNode } from './generate';

export interface LosPoint { d_km: number; ground_m: number; los_m: number }
export interface LosResult {
  distance_km: number;
  profile: LosPoint[];
  blocked: boolean;
  worst: LosPoint & { clearance_m: number };
  /** Metros a acrescentar em UMA das antenas (a que exige menos, ver `raiseAt`) para a folga mínima ficar ≥ `margin`. 0 se já está livre. */
  requiredExtra_m: number;
  raiseAt: 'from' | 'to';
  /** Cotas dos topos das antenas (m acima do nível do mar). */
  fromTop_m: number;
  toTop_m: number;
}
export interface LosOptions { antennaExtra?: number; samples?: number; /** folga mínima exigida (m); padrão 0 */ margin?: number }

/**
 * Relevo de detalhe: elevation() da rede é suave (ondas de 5–12 km); para a visada e o gêmeo 3D somamos
 * morros locais de 1–3 km (±40 m), determinísticos. Use sempre terrain() — e não elevation() — para que
 * a cena 3D e o perfil de visada mostrem o mesmo chão.
 */
export function terrain(lon: number, lat: number): number {
  const X = lon * 102, Y = lat * 111, s = 10; // km aproximados; s = fase fixa
  return elevation(lon, lat) + 22 * Math.sin(X * 2.1 + Y * 0.9 + s) * Math.cos(Y * 1.7 - X * 0.4 + s * 0.7)
    + 12 * Math.sin(X * 3.9 - Y * 3.1 + s * 1.3) + 8 * Math.cos(X * 5.3 + Y * 4.7 + s * 2.1);
}

const byId = (() => { let m: Map<string, NetNode> | null = null; return (id: string) => (m ??= new Map(network().nodes.map((n) => [n.id, n]))).get(id); })();

export function lineOfSight(fromId: string, toId: string, opts: LosOptions = {}): LosResult {
  const a = byId(fromId), b = byId(toId);
  if (!a || !b) throw new Error(`lineOfSight: nó desconhecido (${a ? toId : fromId})`);
  const samples = Math.max(8, opts.samples ?? 96), extra = opts.antennaExtra ?? 0, margin = opts.margin ?? 0;
  const dist = km([a.lon, a.lat], [b.lon, b.lat]);
  const ha = terrain(a.lon, a.lat) + a.altura_m + extra, hb = terrain(b.lon, b.lat) + b.altura_m + extra;
  const profile: LosPoint[] = [];
  let worst: LosPoint & { clearance_m: number } = { d_km: 0, ground_m: 0, los_m: ha, clearance_m: Infinity };
  let needTo = 0, needFrom = 0;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const g = terrain(a.lon + (b.lon - a.lon) * t, a.lat + (b.lat - a.lat) * t);
    const l = ha + (hb - ha) * t;
    const p = { d_km: dist * t, ground_m: g, los_m: l };
    profile.push(p);
    if (i === 0 || i === samples) continue; // as próprias torres não obstruem
    const c = l - g;
    if (c < worst.clearance_m) worst = { ...p, clearance_m: c };
    if (c < margin) { needTo = Math.max(needTo, (margin - c) / t); needFrom = Math.max(needFrom, (margin - c) / (1 - t)); }
  }
  const raiseAt = needTo <= needFrom ? 'to' : 'from';
  return { distance_km: dist, profile, blocked: worst.clearance_m < margin, worst, requiredExtra_m: Math.ceil(Math.min(needTo, needFrom)), raiseAt, fromTop_m: ha, toTop_m: hb };
}

// ---- par de demonstração (determinístico) ----
export const LOS_ANCHOR = 'Torre SP-023';
/** Folga abaixo da qual o enlace é tratado como obstruído quando nenhum par está fisicamente bloqueado. */
const FALLBACK_MARGIN = 10;

function pickDemo(): { from: string; to: string; relay?: string; margin: number } {
  const nodes = network().nodes;
  const anchor = nodes.find((n) => n.id === LOS_ANCHOR) ?? nodes.find((n) => n.tipo === 'Torre');
  if (!anchor) return { from: LOS_ANCHOR, to: LOS_ANCHOR, margin: 0 };
  const towers = nodes.filter((n) => n.tipo === 'Torre' && n.id !== anchor.id);
  const ll = (n: NetNode): [number, number] => [n.lon, n.lat];
  const cands = towers.filter((t) => { const d = km(ll(anchor), ll(t)); return d >= 2 && d <= 6; })
    .map((t) => ({ t, r: lineOfSight(anchor.id, t.id) }))
    .sort((x, y) => x.r.worst.clearance_m - y.r.worst.clearance_m || x.t.id.localeCompare(y.t.id));
  if (!cands.length) return { from: anchor.id, to: anchor.id, margin: 0 };
  const margin = cands.some((c) => c.r.worst.clearance_m < 0) ? 0 : FALLBACK_MARGIN;
  const blocked = cands.filter((c) => c.r.worst.clearance_m < margin);
  const relayFor = (to: NetNode) => towers
    .filter((r) => r.id !== to.id && km(ll(anchor), ll(r)) <= 8 && km(ll(to), ll(r)) <= 8)
    .map((r) => ({ r, a: lineOfSight(anchor.id, r.id), b: lineOfSight(r.id, to.id) }))
    .filter((x) => x.a.worst.clearance_m >= margin && x.b.worst.clearance_m >= margin)
    .sort((x, y) => x.a.distance_km + x.b.distance_km - (y.a.distance_km + y.b.distance_km))[0]?.r;
  for (const c of blocked) { const relay = relayFor(c.t); if (relay) return { from: anchor.id, to: c.t.id, relay: relay.id, margin }; }
  return { from: anchor.id, to: (blocked[0] ?? cands[0]!).t.id, margin };
}

const demo = pickDemo();
export const LOS_DEMO: { from: string; to: string; relay?: string } = demo.relay ? { from: demo.from, to: demo.to, relay: demo.relay } : { from: demo.from, to: demo.to };
/** Folga mínima usada para classificar o par de demonstração (0 m se há bloqueio físico pelo relevo). */
export const LOS_MARGIN_M = demo.margin;

/** Análise do par de demonstração com a mesma regra usada na escolha. */
export function losDemo(): LosResult { return lineOfSight(LOS_DEMO.from, LOS_DEMO.to, { margin: LOS_MARGIN_M }); }

const n1 = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const n0 = (v: number) => Math.round(v).toLocaleString('pt-BR');

export function losSummary(): string {
  const r = losDemo();
  const { from, to, relay } = LOS_DEMO;
  if (from === to) return 'Não há torres entre 2 e 6 km para analisar a linha de visada.';
  if (!r.blocked) return `A linha de visada entre a ${from} e a ${to} está livre: folga mínima de ${n0(r.worst.clearance_m)} m a ${n1(r.worst.d_km)} km.`;
  const verb = LOS_MARGIN_M > 0 ? `tem folga de apenas ${n0(Math.max(0, r.worst.clearance_m))} m sobre o relevo` : 'é obstruída pelo relevo';
  const who = r.raiseAt === 'to' ? `a antena da ${to}` : `a antena da ${from}`;
  const fix = `seria preciso elevar ${who} em ${n0(r.requiredExtra_m)} m`;
  return `A linha de visada entre a ${from} e a ${to} ${verb} a ${n1(r.worst.d_km)} km (${n0(r.worst.ground_m)} m): ${fix}${relay ? ` ou usar a ${relay} como repetidora` : ''}.`;
}
