import type { Feature } from './model';

export interface Reroute { cut: Feature; ids: string[]; nodes: string[]; km: number; extraKm: number; loadGbps: number; overloaded: { id: string; util: number }[]; clients: number }
interface Edge { to: string; id: string; km: number; util: number; cap: number }

/** Shortest alternative between the two ends of a cut link (Dijkstra on length), with a capacity check. */
export function reroute(links: Feature[], cutId: string, clients: Record<string, number> = {}): Reroute | null {
  const cut = links.find((l) => l.id === cutId); if (!cut) return null;
  const from = String(cut.properties.origem), to = String(cut.properties.destino), adj = new Map<string, Edge[]>();
  const add = (a: string, e: Edge) => adj.set(a, [...(adj.get(a) ?? []), e]);
  for (const l of links) {
    if (l.id === cutId) continue;
    const a = String(l.properties.origem), b = String(l.properties.destino), e = { id: l.id, km: Number(l.properties.extensao_km ?? 1), util: Number(l.properties.utilizacao_pct ?? 50), cap: Number(l.properties.capacidade_gbps ?? 40) };
    add(a, { ...e, to: b }); add(b, { ...e, to: a });
  }
  const dist = new Map<string, number>([[from, 0]]), prev = new Map<string, { node: string; edge: Edge }>(), todo = new Set([from, ...adj.keys()]);
  while (todo.size) {
    let u: string | undefined, best = Infinity;
    for (const n of todo) { const d = dist.get(n) ?? Infinity; if (d < best) { best = d; u = n; } }
    if (u === undefined || best === Infinity) break;
    todo.delete(u); if (u === to) break;
    for (const e of adj.get(u) ?? []) { const nd = best + e.km; if (nd < (dist.get(e.to) ?? Infinity)) { dist.set(e.to, nd); prev.set(e.to, { node: u, edge: e }); } }
  }
  if (!prev.has(to)) return null;
  const edges: Edge[] = [], nodes = [to];
  for (let n = to; n !== from;) { const p = prev.get(n)!; edges.unshift(p.edge); nodes.unshift(p.node); n = p.node; }
  const load = Number(cut.properties.utilizacao_pct ?? 50) / 100 * Number(cut.properties.capacidade_gbps ?? 40), km = edges.reduce((s, e) => s + e.km, 0);
  return { cut, ids: edges.map((e) => e.id), nodes, km, extraKm: km - Number(cut.properties.extensao_km ?? 0), loadGbps: load, overloaded: edges.map((e) => ({ id: e.id, util: Math.round((e.util / 100 * e.cap + load) / e.cap * 100) })).filter((x) => x.util > 100), clients: (clients[from] ?? 0) + (clients[to] ?? 0) };
}
