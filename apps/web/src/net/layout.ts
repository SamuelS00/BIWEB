import type { Network } from './generate';

/**
 * Layout esquemático (topologia): POPs num anel de backbone ordenado pela posição geográfica,
 * torres em leque do lado de fora do POP que as atende, equipamentos do lado de dentro.
 * Coordenadas normalizadas em [0, 1]. Determinístico.
 */
const cache = new WeakMap<Network, Map<string, [number, number]>>();
export function schematic(net: Network): Map<string, [number, number]> {
  const hit = cache.get(net);
  if (hit) return hit;
  const pos = new Map<string, [number, number]>();
  const pops = net.nodes.filter((n) => n.tipo === 'POP');
  const ctr = [-46.64, -23.56];
  const ang = (lon: number, lat: number) => Math.atan2(lat - ctr[1]!, (lon - ctr[0]!) * 0.92);
  const ring = [...pops].sort((a, b) => ang(a.lon, a.lat) - ang(b.lon, b.lat));
  const popAngle = new Map<string, number>();
  ring.forEach((p, i) => { const a = -Math.PI / 2 + (i / ring.length) * Math.PI * 2; popAngle.set(p.id, a); pos.set(p.id, [0.5 + Math.cos(a) * 0.3, 0.5 + Math.sin(a) * 0.3]); });
  // torre → POP que a atende (enlace Metro torre–POP)
  const servedBy = new Map<string, string>();
  for (const l of net.links) {
    if (l.camada !== 'Metro') continue;
    const [a, b] = [l.origem, l.destino];
    if (a.startsWith('Torre') && b.startsWith('POP')) servedBy.set(a, b);
    if (b.startsWith('Torre') && a.startsWith('POP')) servedBy.set(b, a);
  }
  const groups = new Map<string, string[]>();
  for (const t of net.nodes.filter((n) => n.tipo === 'Torre')) { const p = servedBy.get(t.id) ?? ring[0]!.id; if (!groups.has(p)) groups.set(p, []); groups.get(p)!.push(t.id); }
  const span = (Math.PI * 2) / ring.length;
  for (const [p, ts] of groups) {
    const a0 = popAngle.get(p)!;
    ts.sort();
    ts.forEach((t, i) => {
      const k = ts.length === 1 ? 0 : i / (ts.length - 1) - 0.5;
      const a = a0 + k * span * 0.85, r = 0.405 + (i % 2) * 0.045;
      pos.set(t, [0.5 + Math.cos(a) * r, 0.5 + Math.sin(a) * r]);
    });
  }
  const kids = new Map<string, string[]>();
  for (const e of net.nodes.filter((n) => n.tipo === 'Equipamento')) { if (!kids.has(e.pai!)) kids.set(e.pai!, []); kids.get(e.pai!)!.push(e.id); }
  for (const [parent, es] of kids) {
    const pp = pos.get(parent)!;
    const isPop = parent.startsWith('POP');
    const a0 = Math.atan2(pp[1] - 0.5, pp[0] - 0.5);
    es.forEach((e, i) => {
      const k = es.length === 1 ? 0 : i / (es.length - 1) - 0.5;
      const a = a0 + k * (isPop ? 0.32 : 0.5);
      const r = isPop ? 0.215 : Math.hypot(pp[0] - 0.5, pp[1] - 0.5) + 0.05;
      pos.set(e, [0.5 + Math.cos(a) * r, 0.5 + Math.sin(a) * r]);
    });
  }
  cache.set(net, pos);
  return pos;
}
