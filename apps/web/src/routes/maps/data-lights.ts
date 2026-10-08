import { frac, point, regionOf } from './base';
import type { Feature, LonLat } from './base';
import { makePath, pathAt, roadPath, routeThrough } from './roads';

/**
 * Street lighting demo: poles are placed along avenues (alternating sides, irregular spacing), grouped in
 * electrical circuits served by transformers. Two circuits are shut down to tell a story: dark stretches.
 */
export const LIGHT_STATUS = ['Operacional', 'Inspeção necessária', 'Manutenção', 'Falha'];
export const LAMPS = {
  'LED 120 W': { w: 120, lm: 15600, reach: 30, tone: 'led' },
  'LED 80 W': { w: 80, lm: 10400, reach: 24, tone: 'warm' },
  'Vapor de sódio 250 W': { w: 250, lm: 27500, reach: 32, tone: 'sodium' },
  'Vapor metálico 150 W': { w: 150, lm: 13500, reach: 26, tone: 'metal' },
} as const;
export type LampTech = keyof typeof LAMPS;

interface Avenue { code: string; name: string; bairro: string; led: number; stops: LonLat[] }
const AVENUES: Avenue[] = [
  { code: 'PA', name: 'Av. Paulista', bairro: 'Bela Vista', led: .98, stops: [[-46.6612, -23.5566], [-46.6520, -23.5628], [-46.6420, -23.5703]] },
  { code: 'RB', name: 'Av. Rebouças', bairro: 'Cerqueira César', led: .9, stops: [[-46.6650, -23.5555], [-46.6738, -23.5642], [-46.6925, -23.5690]] },
  { code: 'FL', name: 'Av. Brig. Faria Lima', bairro: 'Pinheiros', led: .99, stops: [[-46.6925, -23.5662], [-46.6895, -23.5760], [-46.6860, -23.5875]] },
  { code: 'MS', name: 'Av. Marquês de São Vicente', bairro: 'Barra Funda', led: .72, stops: [[-46.6690, -23.5262], [-46.6990, -23.5235], [-46.7280, -23.5305]] },
  { code: 'TI', name: 'Av. Tiradentes', bairro: 'Luz', led: .45, stops: [[-46.6335, -23.5300], [-46.6310, -23.5410], [-46.6285, -23.5495]] },
  { code: 'ES', name: 'Av. do Estado', bairro: 'Cambuci', led: .42, stops: [[-46.6290, -23.5345], [-46.6180, -23.5560], [-46.6150, -23.5750], [-46.6145, -23.6000]] },
  { code: 'RL', name: 'Radial Leste', bairro: 'Tatuapé', led: .55, stops: [[-46.6300, -23.5472], [-46.5800, -23.5455], [-46.5300, -23.5430]] },
  { code: 'CG', name: 'Av. Celso Garcia', bairro: 'Belém', led: .38, stops: [[-46.6010, -23.5385], [-46.5650, -23.5400], [-46.5280, -23.5425]] },
  { code: 'AS', name: 'Av. Santo Amaro', bairro: 'Vila Olímpia', led: .8, stops: [[-46.6960, -23.5795], [-46.7040, -23.6100], [-46.7110, -23.6450]] },
  { code: 'SU', name: 'Av. Sumaré', bairro: 'Perdizes', led: .7, stops: [[-46.6800, -23.5390], [-46.6770, -23.5470], [-46.6762, -23.5525]] },
  { code: 'IN', name: 'Av. Inajar de Souza', bairro: 'Freguesia do Ó', led: .5, stops: [[-46.6900, -23.4895], [-46.6970, -23.5050], [-46.7000, -23.5205]] },
  { code: 'CS', name: 'Av. Cruzeiro do Sul', bairro: 'Santana', led: .62, stops: [[-46.6250, -23.5205], [-46.6262, -23.5120], [-46.6270, -23.5055]] },
  { code: 'LV', name: 'Av. Lins de Vasconcelos', bairro: 'Cambuci', led: .6, stops: [[-46.6130, -23.5640], [-46.6140, -23.5760], [-46.6160, -23.5880]] },
  { code: 'FM', name: 'Av. Francisco Matarazzo', bairro: 'Água Branca', led: .85, stops: [[-46.6850, -23.5260], [-46.6600, -23.5275], [-46.6420, -23.5300]] },
];
export const AVENUE_NAMES = AVENUES.map((a) => a.name);
const TOTAL = 3200;
const FAILURES = ['Lâmpada queimada', 'Reator danificado', 'Fotocélula travada', 'Poste abalroado', 'Cabo subterrâneo rompido'];
const COST: Record<string, number> = { 'Lâmpada queimada': 180, 'Reator danificado': 420, 'Fotocélula travada': 95, 'Poste abalroado': 5200, 'Cabo subterrâneo rompido': 3800 };
const OFFLINE_CIRCUITS = new Set(['C-ES2', 'C-RL3']);

const ANCHORS: [string, number, number][] = [['Lapa', -46.705, -23.524], ['Pinheiros', -46.693, -23.568], ['Santa Cecília', -46.650, -23.538], ['Bela Vista', -46.648, -23.563], ['Mooca', -46.599, -23.567], ['Tatuapé', -46.575, -23.540], ['Santana', -46.627, -23.505], ['Brooklin', -46.695, -23.610], ['Penha', -46.540, -23.525], ['Vila Maria', -46.585, -23.510]];
const bairroOf = (lon: number, lat: number) => ANCHORS.reduce((best, a) => { const d = (a[1] - lon) ** 2 + (a[2] - lat) ** 2; return d < best.d ? { d, n: a[0] } : best; }, { d: Infinity, n: '' }).n;

const fmtDate = (n: number) => `${String(1 + Math.floor(frac(n) * 27)).padStart(2, '0')}/${String(1 + Math.floor(frac(n + 3) * 9)).padStart(2, '0')}/2026`;

function build() {
  const paths = AVENUES.map((a, i) => makePath(routeThrough(a.stops, i * 31 + 5)));
  const totalKm = paths.reduce((n, p) => n + p.total, 0), AVENUE_SHARE = Math.round(TOTAL * .58);
  const counts = paths.map((p) => Math.floor(AVENUE_SHARE * p.total / totalKm));
  counts[counts.length - 1]! += AVENUE_SHARE - counts.reduce((n, c) => n + c, 0);
  const poles: Feature[] = [], circuits: Feature[] = [], trafos: Feature[] = [], orders: Record<string, unknown>[] = [];
  let serial = 38219, order = 1;
  const makePole = (av: Avenue, lon: number, lat: number, circuit: string, trafo: string, street: string) => {
    const r = frac(serial * 2.1 + 7), led = r < av.led * (street === av.name ? 1 : .8);
    const tech: LampTech = led ? (frac(serial + 5) < .62 ? 'LED 120 W' : 'LED 80 W') : (frac(serial + 9) < .8 ? 'Vapor de sódio 250 W' : 'Vapor metálico 150 W');
    const lamp = LAMPS[tech], dark = OFFLINE_CIRCUITS.has(circuit), sr = frac(serial * 3.7 + 1);
    const status = dark ? 3 : sr < .036 ? 3 : sr < .09 ? 2 : sr < .17 ? 1 : 0;
    const failure = dark ? 'Cabo subterrâneo rompido' : FAILURES[Math.floor(frac(serial + 21) * FAILURES.length)]!;
    const open = status ? 2 + Math.floor(frac(serial + 33) * (status === 3 ? 70 : 90)) : 0, sla = status === 3 ? 48 : status === 2 ? 72 : 120;
    const id = `SP-${String(serial).padStart(6, '0')}`;
    const f = point(id, lon, lat, {
      poste_id: id, nome: `Poste ${serial}`, tipo: 'Poste', via: street, bairro: bairroOf(lon, lat), regiao: regionOf(lon), circuito: circuit, trafo,
      tecnologia: tech, potencia: `${lamp.w} W`, potencia_w: lamp.w, fluxo_lm: lamp.lm, alcance_m: lamp.reach, tom: lamp.tone,
      status: LIGHT_STATUS[status], falha: status === 3 ? failure : status === 2 ? 'Ordem de manutenção' : status === 1 ? (frac(serial + 4) < .5 ? 'Fluxo luminoso abaixo do esperado' : 'Oscilação intermitente') : '',
      lux_medido: status === 3 ? 0 : Math.round((led ? 21 : 15) * (status === 1 ? .55 : 1) * (.85 + frac(serial + 12) * .3)),
      instalacao: led ? 2019 + Math.floor(frac(serial + 2) * 7) : 2004 + Math.floor(frac(serial + 2) * 13),
      vida_util_pct: Math.min(99, Math.round((led ? 8 + frac(serial) * 52 : 55 + frac(serial) * 44))),
      consumo_kwh_mes: Math.round(lamp.w * 11.5 * 30 * 1.06 / 1000), ultima_manutencao: fmtDate(serial), fotocelula_min: Math.round((frac(serial + 17) - .5) * 24),
      chamado: status ? `CH-IP-${String(4100 + serial % 5000)}` : '', aberto_ha_h: open, sla_h: status ? sla : 0, vencida: status > 0 && open > sla,
      custo_estimado: status === 3 ? COST[failure] ?? 180 : status === 2 ? 240 : 0,
    });
    poles.push(f);
    if (status && (serial % 3 === 0 || status === 3 && !dark)) orders.push({ id: `OS-${3000 + order++}`, poste_id: id, data: `0${1 + serial % 7}/10/2026`, tipo: status === 3 ? failure : 'Inspeção elétrica', status: open > sla ? 'Vencida' : 'Aberta' });
    serial++;
    return f;
  };
  const place = (path: ReturnType<typeof makePath>, d: number, k: number, lateral: number): LonLat => {
    const at = pathAt(path, d), h = at.heading * Math.PI / 180, side = k % 2 ? 1 : -1, off = side * lateral / 111320;
    return [at.lon + Math.cos(h) * off / Math.cos(at.lat * Math.PI / 180), at.lat - Math.sin(h) * off];
  };
  AVENUES.forEach((av, ai) => {
    const path = paths[ai]!, count = counts[ai]!, perCircuit = 34 + ai % 5 * 3, step = path.total / count;
    const byCircuit = new Map<string, Feature[]>(), allByCircuit = new Map<string, Feature[]>(), chunkAt = (k: number) => Math.floor(k / perCircuit) + 1;
    for (let k = 0; k < count; k++) {
      const d = (k + .5) * step + (frac(serial * 1.3) - .5) * step * .4, [lon, lat] = place(path, d, k, 9 + frac(serial) * 4), chunk = chunkAt(k), circuit = `C-${av.code}${chunk}`, trafo = `TR-${av.code}${Math.ceil(chunk / 2)}`;
      const f = makePole(av, lon, lat, circuit, trafo, av.name);
      byCircuit.set(circuit, [...(byCircuit.get(circuit) ?? []), f]); allByCircuit.set(circuit, [...(allByCircuit.get(circuit) ?? []), f]);
    }
    // Side streets branch off the avenue at right angles, as a staircase of blocks, and share the circuit of their junction.
    const sideBudget = Math.round((TOTAL - AVENUE_SHARE) * path.total / totalKm), streets = Math.max(2, Math.round(sideBudget / 17));
    let used = 0;
    for (let j = 0; j < streets && used < sideBudget; j++) {
      const t = (j + .3 + frac(ai * 17 + j * 3) * .5) / streets, junction = pathAt(path, path.total * t), k = Math.floor(path.total * t / step), chunk = Math.min(chunkAt(k), Math.ceil(count / perCircuit));
      const circuit = `C-${av.code}${chunk}`, trafo = `TR-${av.code}${Math.ceil(chunk / 2)}`, dir = (junction.heading + (j % 2 ? 90 : -90) + (frac(ai * 5 + j) - .5) * 40) * Math.PI / 180;
      const lengthKm = .32 + frac(ai * 7 + j * 11) * .5, end: LonLat = [junction.lon + Math.sin(dir) * lengthKm / (111.32 * Math.cos(junction.lat * Math.PI / 180)), junction.lat + Math.cos(dir) * lengthKm / 111.32];
      const street = makePath(roadPath([junction.lon, junction.lat], end, ai * 101 + j * 13)), n = Math.min(Math.floor(street.total / .042), sideBudget - used);
      for (let m = 1; m <= n; m++) {
        const [lon, lat] = place(street, m * street.total / (n + 1), m, 7 + frac(serial) * 3);
        allByCircuit.set(circuit, [...(allByCircuit.get(circuit) ?? []), makePole(av, lon, lat, circuit, trafo, `Rua lateral ${av.code}-${j + 1}`)]); used++;
      }
    }
    for (const [circuit, line] of byCircuit) {
      const list = allByCircuit.get(circuit)!, failures = list.filter((f) => f.properties.status === 'Falha').length, down = OFFLINE_CIRCUITS.has(circuit);
      circuits.push({ id: circuit, geometry: { type: 'LineString', coordinates: line.map((f) => f.geometry.coordinates[0]!) }, properties: { circuito: circuit, nome: `Circuito ${circuit} · ${av.name}`, tipo: 'Circuito', via: av.name, trafo: line[0]!.properties.trafo, postes: list.length, falhas: failures, status: down ? 'Falha' : failures > 3 ? 'Manutenção' : failures ? 'Inspeção necessária' : 'Operacional', potencia_kw: Math.round(list.reduce((n, f) => n + Number(f.properties.potencia_w), 0) / 10) / 100, regiao: line[0]!.properties.regiao, aberto_ha_h: down ? 31 : 0, chamado: down ? `CH-IP-${9100 + circuits.length}` : '' } });
    }
    for (const tid of new Set([...allByCircuit.values()].map((l) => String(l[0]!.properties.trafo)))) {
      const members = circuits.filter((c) => c.properties.trafo === tid), first = members[0]!.geometry.coordinates[0]!;
      const load = Math.round(54 + frac(tid.charCodeAt(3) + tid.charCodeAt(4) * 3) * 40);
      trafos.push(point(tid, first[0]! - .0008, first[1]! + .0007, { nome: `Transformador ${tid}`, tipo: 'Transformador', circuitos: members.length, potencia_kva: 75, carga_pct: load, status: members.some((c) => OFFLINE_CIRCUITS.has(String(c.id))) ? 'Falha' : load > 88 ? 'Inspeção necessária' : 'Operacional', regiao: regionOf(first[0]!), via: av.name }));
    }
  });
  // Rounding in the side-street budget can leave a few poles short: top up on the busiest avenue so the total is exact.
  const last = AVENUES[0]!, lastPath = paths[0]!;
  for (let k = 0; poles.length < TOTAL; k++) { const [lon, lat] = place(lastPath, lastPath.total * (.02 + frac(k * 3.3) * .96), k, 18); makePole(last, lon, lat, 'C-PA1', 'TR-PA1', 'Rua lateral PA-X'); }
  poles.length = Math.min(poles.length, TOTAL);
  return { poles, circuits, trafos, orders };
}
const built = build();
export const poles = built.poles;
export const lightCircuits = built.circuits;
export const lightTrafos = built.trafos;
export const lightOrders = built.orders;

/** Photocell + dimming: 0 by day, ramps up at dusk (earlier/later per pole), LEDs dim in the small hours. */
export function lampLevel(hour: number, offsetMin = 0, tone = 'led'): number {
  const h = ((hour % 24) + 24) % 24, shift = offsetMin / 60, dusk = 17.85 + shift, dawn = 5.95 + shift;
  const warmup = tone === 'sodium' || tone === 'metal' ? .55 : .25;
  let level: number;
  if (h >= dusk) level = Math.min(1, (h - dusk) / warmup);
  else if (h < dawn) level = Math.min(1, (dawn - h) / .3);
  else return 0;
  if (tone !== 'led' && tone !== 'warm') return level;
  const late = h >= 23 || h < 4.5 ? 1 : h >= 22.5 ? (h - 22.5) / .5 : h < 5 ? (5 - h) / .5 : 0;
  return level * (1 - .32 * late);
}
