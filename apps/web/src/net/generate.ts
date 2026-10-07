/**
 * Rede Metropolitana SP — dataset de referência, gerado de forma determinística (mesma semente → mesmos IDs e números).
 * 128 nós (POPs, torres, equipamentos) · 346 enlaces · 42 regiões · 18 rotas · eventos dos últimos 30 dias · histórico diário.
 * Dados fictícios; as coordenadas aproximam bairros e municípios reais da Grande São Paulo.
 */
export type NetStatus = 'normal' | 'warning' | 'critical' | 'offline';
export type Criticidade = 'Alta' | 'Média' | 'Baixa';
export type LonLat = [number, number];

export interface NetNode {
  id: string; nome: string; tipo: 'POP' | 'Torre' | 'Equipamento'; subtipo: string; status: NetStatus;
  capacidade: number; utilizacao: number; atenuacao_dB: number; disponibilidade: number;
  proprietario: string; tecnologia: string; criticidade: Criticidade; regiao: string;
  lat: number; lon: number; altura_m: number; pai?: string; alarmes: number;
}
export interface NetLink {
  id: string; nome: string; tipo: 'Fibra' | 'Rádio'; camada: 'Backbone' | 'Metro' | 'Acesso'; status: NetStatus;
  capacidade: number; utilizacao: number; atenuacao_dB: number; disponibilidade: number;
  proprietario: string; tecnologia: string; criticidade: Criticidade; regiao: string;
  origem: string; destino: string; extensao_km: number; fibras: number; lat: number; lon: number; geometria: LonLat[];
}
export interface NetRegion { id: string; nome: string; lat: number; lon: number; poligono: LonLat[]; municipio: string; clientes: number }
export interface NetRoute {
  id: string; nome: string; origem: string; destino: string; nos: string[]; enlaces: string[]; distancia_km: number;
  status: NetStatus; latencia_ms: number; disponibilidade: number; desvio?: { enlaces: string[]; distancia_km: number; motivo: string };
  alteracoes: { ts: number; texto: string }[];
}
export interface NetEvent {
  id: string; ts: number; tipo: 'Rompimento de fibra' | 'Atenuação alta' | 'Queda de energia' | 'Manutenção programada' | 'Saturação' | 'Alarme de equipamento';
  elemento: string; elementoNome: string; severidade: NetStatus; regiao: string; descricao: string; duracao_min: number; resolvido: boolean; lat: number; lon: number;
}
export interface HistoryPoint { dia: number; utilizacao: number; atenuacao_dB: number; disponibilidade: number }

/** "Agora" do protótipo: fixo para que tudo seja reprodutível. */
export const NOW = Date.UTC(2026, 9, 6, 11, 0); // 06/10/2026 08:00 (BRT)
const DAY = 86_400_000;

function mulberry32(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const r2 = (v: number) => Math.round(v * 100) / 100;
const r1 = (v: number) => Math.round(v * 10) / 10;

export function km(a: LonLat, b: LonLat) {
  const R = 6371, dLat = ((b[1] - a[1]) * Math.PI) / 180, dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a[1] * Math.PI) / 180) * Math.cos((b[1] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
/** Relevo aproximado da Grande SP (m), suave e determinístico — usado no gêmeo digital 3D e na linha de visada. */
export function elevation(lon: number, lat: number) {
  const x = (lon + 46.65) * 40, y = (lat + 23.56) * 40;
  return 760 + 38 * Math.sin(x * 1.3 + 0.4) * Math.cos(y * 1.1) + 22 * Math.sin(x * 2.9 + y * 2.1) + 14 * Math.cos(y * 3.7 - x * 0.8)
    + 60 * Math.exp(-(((lon + 46.75) * 18) ** 2 + ((lat + 23.43) * 18) ** 2)) /* Serra da Cantareira */ - 25 * Math.exp(-(((lat + 23.53) * 30) ** 2)) /* várzea do Tietê */;
}

const REGIONS: [string, number, number, string][] = [
  ['Sé', -23.550, -46.634, 'São Paulo'], ['República', -23.544, -46.642, 'São Paulo'], ['Pinheiros', -23.567, -46.692, 'São Paulo'], ['Butantã', -23.571, -46.728, 'São Paulo'],
  ['Lapa', -23.522, -46.704, 'São Paulo'], ['Barra Funda', -23.526, -46.666, 'São Paulo'], ['Santana', -23.502, -46.625, 'São Paulo'], ['Tucuruvi', -23.480, -46.604, 'São Paulo'],
  ['Vila Maria', -23.512, -46.580, 'São Paulo'], ['Penha', -23.528, -46.543, 'São Paulo'], ['Tatuapé', -23.540, -46.576, 'São Paulo'], ['Mooca', -23.559, -46.599, 'São Paulo'],
  ['Ipiranga', -23.589, -46.607, 'São Paulo'], ['Vila Mariana', -23.589, -46.636, 'São Paulo'], ['Saúde', -23.618, -46.637, 'São Paulo'], ['Jabaquara', -23.646, -46.641, 'São Paulo'],
  ['Santo Amaro', -23.654, -46.710, 'São Paulo'], ['Campo Limpo', -23.646, -46.759, 'São Paulo'], ['Capão Redondo', -23.672, -46.779, 'São Paulo'], ["M'Boi Mirim", -23.700, -46.770, 'São Paulo'],
  ['Cidade Ademar', -23.680, -46.660, 'São Paulo'], ['Itaquera', -23.540, -46.456, 'São Paulo'], ['Guaianases', -23.541, -46.411, 'São Paulo'], ['São Mateus', -23.611, -46.478, 'São Paulo'],
  ['São Miguel', -23.498, -46.444, 'São Paulo'], ['Ermelino Matarazzo', -23.495, -46.480, 'São Paulo'], ['Freguesia do Ó', -23.500, -46.696, 'São Paulo'], ['Pirituba', -23.486, -46.725, 'São Paulo'],
  ['Perus', -23.404, -46.754, 'São Paulo'], ['Casa Verde', -23.510, -46.660, 'São Paulo'], ['Jaçanã', -23.464, -46.581, 'São Paulo'], ['Vila Prudente', -23.583, -46.580, 'São Paulo'],
  ['Sapopemba', -23.603, -46.508, 'São Paulo'], ['Aricanduva', -23.560, -46.513, 'São Paulo'], ['Cidade Tiradentes', -23.582, -46.403, 'São Paulo'], ['Barueri', -23.511, -46.876, 'Barueri'],
  ['Osasco', -23.532, -46.792, 'Osasco'], ['Carapicuíba', -23.523, -46.836, 'Carapicuíba'], ['Santo André', -23.663, -46.538, 'Santo André'], ['São Bernardo', -23.694, -46.565, 'São Bernardo do Campo'],
  ['São Caetano', -23.623, -46.551, 'São Caetano do Sul'], ['Guarulhos', -23.454, -46.533, 'Guarulhos'],
];
const POP_REGIONS = ['Sé', 'Barueri', 'Osasco', 'Pinheiros', 'Lapa', 'Santana', 'Tatuapé', 'Penha', 'Ipiranga', 'Santo Amaro', 'Jabaquara', 'Itaquera', 'São Miguel', 'Guarulhos', 'Santo André', 'São Bernardo', 'Campo Limpo', 'Pirituba'];
const OWNERS = ['Virtsel Infra', 'Virtsel Infra', 'Virtsel Infra', 'MetroFibra (cessão)', 'TorreSul Compartilhada', 'Concessionária de Energia'];
const slug = (s: string) => s.replace(/'/g, '').replace(/\s+/g, '-');

/** Voronoi por recorte de semiplanos (n = 42), limitado por um 20-gono em torno de cada centro → contorno orgânico da metrópole. */
function voronoi(centers: LonLat[], radiusDeg = 0.075): LonLat[][] {
  const kx = Math.cos((23.55 * Math.PI) / 180); // corrige a escala de longitude
  return centers.map((c, i) => {
    let poly: LonLat[] = Array.from({ length: 20 }, (_, k) => { const a = (k / 20) * Math.PI * 2; return [c[0] + (Math.cos(a) * radiusDeg) / kx, c[1] + Math.sin(a) * radiusDeg] as LonLat; });
    centers.forEach((o, j) => {
      if (i === j) return;
      const mx = (c[0] + o[0]) / 2, my = (c[1] + o[1]) / 2, nx = (o[0] - c[0]) * kx * kx, ny = o[1] - c[1];
      const side = (p: LonLat) => (p[0] - mx) * nx + (p[1] - my) * ny; // > 0: lado do vizinho
      const out: LonLat[] = [];
      for (let k = 0; k < poly.length; k++) {
        const a = poly[k]!, b = poly[(k + 1) % poly.length]!, sa = side(a), sb = side(b);
        if (sa <= 0) out.push(a);
        if ((sa <= 0) !== (sb <= 0)) { const t = sa / (sa - sb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
      }
      poly = out;
    });
    return poly.map(([x, y]) => [Math.round(x * 1e5) / 1e5, Math.round(y * 1e5) / 1e5] as LonLat);
  });
}

function statusFrom(atn: number, util: number, rnd: () => number): NetStatus {
  if (atn > 20 || util > 93) return 'critical';
  if (atn > 15 || util > 82) return 'warning';
  return rnd() < 0.03 ? 'warning' : 'normal';
}
const disp = (s: NetStatus, rnd: () => number) => r2(s === 'offline' ? 96.2 + rnd() * 1.5 : s === 'critical' ? 98.4 + rnd() * 0.9 : s === 'warning' ? 99.3 + rnd() * 0.5 : 99.8 + rnd() * 0.19);

export interface Network { nodes: NetNode[]; links: NetLink[]; regions: NetRegion[]; routes: NetRoute[]; events: NetEvent[] }

export function generateNetwork(seed = 20261006): Network {
  const rnd = mulberry32(seed);
  const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)]!;
  const centers = REGIONS.map(([, lat, lon]) => [lon, lat] as LonLat);
  const polys = voronoi(centers);
  const regions: NetRegion[] = REGIONS.map(([nome, lat, lon, municipio], i) => ({ id: `REG-${String(i + 1).padStart(2, '0')}`, nome, lat, lon, municipio, poligono: polys[i]!, clientes: Math.round(8000 + rnd() * 52000) }));
  const regionAt = (lon: number, lat: number) => regions.reduce((b, r) => (km([lon, lat], [r.lon, r.lat]) < km([lon, lat], [b.lon, b.lat]) ? r : b), regions[0]!).nome;
  const jitter = (r: NetRegion, d: number): LonLat => [r.lon + (rnd() - 0.5) * d * 1.1, r.lat + (rnd() - 0.5) * d];

  // ---- nós ----
  const nodes: NetNode[] = [];
  const base = (lon: number, lat: number) => ({ lon: Math.round(lon * 1e5) / 1e5, lat: Math.round(lat * 1e5) / 1e5, regiao: regionAt(lon, lat), proprietario: pick(OWNERS.slice(0, 3)) });
  for (const name of POP_REGIONS) {
    const r = regions.find((x) => x.nome === name)!;
    const [lon, lat] = jitter(r, 0.006);
    const util = Math.round(45 + rnd() * 40);
    nodes.push({ id: `POP-${slug(name)}`, nome: `POP-${slug(name)}`, tipo: 'POP', subtipo: name === 'Sé' || name === 'Barueri' ? 'POP core' : 'POP metro', status: 'normal', capacidade: name === 'Sé' || name === 'Barueri' ? 400 : 100,
      utilizacao: util, atenuacao_dB: 0, disponibilidade: 99.99, tecnologia: 'DWDM / IP-MPLS', criticidade: 'Alta', altura_m: 12, alarmes: 0, ...base(lon, lat), proprietario: 'Virtsel Infra' });
  }
  // 62 torres espalhadas pelas regiões (mais densas no centro expandido)
  const towerRegions = regions.flatMap((r, i) => (i < 35 ? [r, r] : [r])).sort(() => rnd() - 0.5).slice(0, 62);
  towerRegions.forEach((r, i) => {
    const [lon, lat] = jitter(r, 0.022);
    const util = Math.round(25 + rnd() * 70);
    nodes.push({ id: `Torre SP-${String(i + 1).padStart(3, '0')}`, nome: `Torre SP-${String(i + 1).padStart(3, '0')}`, tipo: 'Torre', subtipo: rnd() < 0.3 ? 'Rooftop' : 'Greenfield',
      status: 'normal', capacidade: pick([10, 10, 25, 40]), utilizacao: util, atenuacao_dB: 0, disponibilidade: 99.9, tecnologia: pick(['5G NR 3,5 GHz', '4G LTE 2,6 GHz', '5G NR 3,5 GHz', 'Micro-ondas 18 GHz']),
      criticidade: util > 75 ? 'Alta' : util > 50 ? 'Média' : 'Baixa', altura_m: Math.round(28 + rnd() * 34), alarmes: 0, ...base(lon, lat), proprietario: pick(['Virtsel Infra', 'TorreSul Compartilhada', 'Virtsel Infra']) });
  });
  // 48 equipamentos ancorados em POPs e torres
  const parents = [...nodes.filter((n) => n.tipo === 'POP'), ...nodes.filter((n) => n.tipo === 'Torre').slice(0, 20)];
  const kinds = [['OLT', 'GPON / XGS-PON'], ['RTR', 'IP-MPLS 100G'], ['SW', 'Ethernet 10G'], ['DWDM', 'DWDM 96 canais']] as const;
  for (let i = 0; i < 48; i++) {
    const p = parents[i % parents.length]!;
    const [k, tech] = kinds[(i + Math.floor(i / parents.length)) % kinds.length]!;
    const local = p.tipo === 'POP' ? p.nome.replace('POP-', '') : p.nome.replace('Torre ', '');
    const util = Math.round(30 + rnd() * 65);
    nodes.push({ id: `${k} ${local}-${String(Math.floor(i / parents.length) + 1).padStart(2, '0')}`, nome: `${k} ${local}-${String(Math.floor(i / parents.length) + 1).padStart(2, '0')}`, tipo: 'Equipamento', subtipo: k,
      status: 'normal', capacidade: k === 'DWDM' ? 400 : k === 'RTR' ? 100 : 10, utilizacao: util, atenuacao_dB: 0, disponibilidade: 99.95, tecnologia: tech, criticidade: p.criticidade,
      altura_m: 2, pai: p.id, alarmes: 0, ...base(p.lon + (rnd() - 0.5) * 0.004, p.lat + (rnd() - 0.5) * 0.003), regiao: p.regiao, proprietario: p.proprietario });
  }

  // ---- enlaces ----
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const links: NetLink[] = [];
  const has = new Set<string>();
  const ll = (n: NetNode): LonLat => [n.lon, n.lat];
  const nearest = (n: NetNode, pool: NetNode[], k: number) => pool.filter((o) => o.id !== n.id).sort((a, b) => km(ll(n), ll(a)) - km(ll(n), ll(b))).slice(0, k);
  const add = (a: NetNode, b: NetNode, camada: NetLink['camada'], tipo: NetLink['tipo'] = 'Fibra') => {
    const key = [a.id, b.id].sort().join('|');
    if (has.has(key) || a.id === b.id) return false;
    has.add(key);
    const d = km(ll(a), ll(b));
    // geometria: segue "ruas" (desvios ortogonais suaves); rádio é reto
    const geo: LonLat[] = [ll(a)];
    if (tipo === 'Fibra') {
      const steps = Math.max(2, Math.min(6, Math.round(d / 1.6)));
      for (let s = 1; s < steps; s++) { const t = s / steps; geo.push([a.lon + (b.lon - a.lon) * t + (rnd() - 0.5) * 0.006, a.lat + (b.lat - a.lat) * t + (rnd() - 0.5) * 0.005]); }
    }
    geo.push(ll(b));
    const ext = tipo === 'Fibra' ? d * 1.18 : d;
    const atn = tipo === 'Fibra' ? r1(ext * 0.28 + 1.2 + rnd() * 3 + (rnd() < 0.09 ? 9 + rnd() * 10 : 0)) : r1(4 + rnd() * 6 + (rnd() < 0.06 ? 10 : 0));
    const cap = camada === 'Backbone' ? 400 : camada === 'Metro' ? 100 : tipo === 'Rádio' ? 2 : 10;
    const util = Math.round(18 + rnd() * 62 + (rnd() < 0.12 ? 18 : 0));
    const status = statusFrom(atn, util, rnd);
    const id = `ENL-${String(links.length + 1).padStart(4, '0')}`;
    links.push({ id, nome: `${a.nome} ↔ ${b.nome}`, tipo, camada, status, capacidade: cap, utilizacao: Math.min(99, util), atenuacao_dB: atn, disponibilidade: disp(status, rnd),
      proprietario: camada === 'Backbone' ? 'Virtsel Infra' : pick(OWNERS.slice(0, 4)), tecnologia: tipo === 'Rádio' ? 'Micro-ondas 18 GHz' : camada === 'Backbone' ? 'DWDM 100G' : camada === 'Metro' ? 'Ethernet 100G' : pick(['GPON', 'Ethernet 10G', 'XGS-PON']),
      criticidade: camada === 'Backbone' ? 'Alta' : camada === 'Metro' ? 'Média' : (util > 75 ? 'Média' : 'Baixa'), regiao: a.regiao, origem: a.id, destino: b.id,
      extensao_km: r2(ext), fibras: tipo === 'Rádio' ? 0 : camada === 'Backbone' ? 144 : camada === 'Metro' ? 48 : 12,
      lat: Math.round(((a.lat + b.lat) / 2) * 1e4) / 1e4, lon: Math.round(((a.lon + b.lon) / 2) * 1e4) / 1e4, geometria: geo.map(([x, y]) => [Math.round(x * 1e5) / 1e5, Math.round(y * 1e5) / 1e5]) });
    return true;
  };
  const pops = nodes.filter((n) => n.tipo === 'POP'), towers = nodes.filter((n) => n.tipo === 'Torre'), equips = nodes.filter((n) => n.tipo === 'Equipamento');
  // anel de backbone: ordena POPs pelo ângulo em torno do centro
  const ctr: LonLat = [-46.64, -23.56];
  const ring = [...pops].sort((a, b) => Math.atan2(a.lat - ctr[1], a.lon - ctr[0]) - Math.atan2(b.lat - ctr[1], b.lon - ctr[0]));
  ring.forEach((p, i) => add(p, ring[(i + 1) % ring.length]!, 'Backbone'));
  const se = byId.get('POP-Sé')!;
  for (const p of pops) if (p.id !== se.id && km(ll(p), ll(se)) < 12) add(p, se, 'Backbone');
  for (const p of pops) for (const q of nearest(p, pops, 3)) add(p, q, 'Metro');
  for (const t of towers) { add(t, nearest(t, pops, 1)[0]!, 'Metro'); for (const q of nearest(t, towers, 2)) add(t, q, 'Acesso', rnd() < 0.35 ? 'Rádio' : 'Fibra'); }
  for (const e of equips) add(e, byId.get(e.pai!)!, 'Acesso');
  // completa até 346 com segmentos de acesso entre vizinhos próximos
  const all = [...towers, ...pops];
  for (let k = 3; links.length < 346 && k < 12; k++) for (const t of all) { if (links.length >= 346) break; const q = nearest(t, all, k)[k - 1]; if (q) add(t, q, 'Acesso', rnd() < 0.25 ? 'Rádio' : 'Fibra'); }
  links.length = Math.min(links.length, 346);

  // ---- eventos (30 dias) e estado atual ----
  const events: NetEvent[] = [];
  const evTypes: NetEvent['tipo'][] = ['Rompimento de fibra', 'Atenuação alta', 'Queda de energia', 'Manutenção programada', 'Saturação', 'Alarme de equipamento'];
  // rompimentos ativos: 4 enlaces offline agora (Barueri, Osasco, Itaquera, Santo Amaro)
  const breakIn = ['Barueri', 'Osasco', 'Itaquera', 'Santo Amaro'];
  for (const reg of breakIn) {
    const l = links.find((x) => x.tipo === 'Fibra' && x.regiao === reg && x.status !== 'offline' && x.camada !== 'Backbone');
    if (!l) continue;
    l.status = 'offline'; l.utilizacao = 0; l.disponibilidade = disp('offline', rnd);
    events.push({ id: '', ts: NOW - Math.round((0.5 + rnd() * 5) * 3_600_000), tipo: 'Rompimento de fibra', elemento: l.id, elementoNome: l.nome, severidade: 'offline', regiao: reg,
      descricao: `Perda total de sinal no ${l.id} (${l.extensao_km.toLocaleString('pt-BR')} km). Equipe de campo acionada.`, duracao_min: 0, resolvido: false, lat: l.lat, lon: l.lon });
  }
  for (let i = 0; i < 136; i++) {
    const tipo = evTypes[Math.floor(rnd() ** 1.3 * evTypes.length)]!;
    const onLink = tipo === 'Rompimento de fibra' || tipo === 'Atenuação alta' || tipo === 'Saturação' || rnd() < 0.3;
    const el = onLink ? links[Math.floor(rnd() * links.length)]! : nodes[Math.floor(rnd() * nodes.length)]!;
    const ts = NOW - Math.round(rnd() ** 0.8 * 30 * DAY);
    const sev: NetStatus = tipo === 'Rompimento de fibra' ? 'offline' : tipo === 'Manutenção programada' ? 'warning' : rnd() < 0.4 ? 'critical' : 'warning';
    const dur = Math.round(tipo === 'Rompimento de fibra' ? 180 + rnd() * 420 : 15 + rnd() * 160);
    events.push({ id: '', ts, tipo, elemento: el.id, elementoNome: el.nome, severidade: sev, regiao: el.regiao, duracao_min: dur, resolvido: NOW - ts > dur * 60_000 || sev === 'warning',
      descricao: tipo === 'Rompimento de fibra' ? 'Rompimento por obra de terceiros; emenda executada.' : tipo === 'Atenuação alta' ? 'Atenuação acima do limite de projeto; conector limpo.' : tipo === 'Queda de energia' ? 'Falta de energia da concessionária; operou em bateria.' : tipo === 'Manutenção programada' ? 'Janela de manutenção (00h–04h).' : tipo === 'Saturação' ? 'Pico de tráfego acima de 90% por mais de 15 min.' : 'Alarme de temperatura na placa de linha.',
      lat: el.lat, lon: el.lon });
  }
  events.sort((a, b) => b.ts - a.ts).forEach((e, i) => { e.id = `EVT-${String(events.length - i).padStart(4, '0')}`; });
  // 2 equipamentos fora do ar por falta de energia (eventos ativos)
  for (const id of equips.filter((e) => e.regiao === 'Itaquera' || e.regiao === 'Guarulhos').slice(0, 2).map((e) => e.id)) {
    const n = byId.get(id)!; n.status = 'offline'; n.utilizacao = 0;
    events.push({ id: '', ts: NOW - Math.round((1 + rnd() * 3) * 3_600_000), tipo: 'Queda de energia', elemento: n.id, elementoNome: n.nome, severidade: 'offline', regiao: n.regiao,
      descricao: 'Falta de energia da concessionária; banco de baterias esgotado. Gerador a caminho.', duracao_min: 0, resolvido: false, lat: n.lat, lon: n.lon });
  }
  events.sort((a, b) => b.ts - a.ts).forEach((e, i) => { e.id = `EVT-${String(events.length - i).padStart(4, '0')}`; });
  // nós herdam alarmes e pior status dos enlaces/eventos ativos
  for (const e of events) if (!e.resolvido) { const n = byId.get(e.elemento); if (n) { n.alarmes++; if (n.status === 'normal' && e.tipo !== 'Queda de energia') n.status = e.severidade === 'offline' ? 'critical' : e.severidade; } }
  for (const l of links) for (const id of [l.origem, l.destino]) { const n = byId.get(id)!; if (l.status === 'offline' || l.status === 'critical') n.alarmes++; }
  for (const n of nodes) {
    if (n.utilizacao > 90 && n.status === 'normal') n.status = 'warning';
    if (n.alarmes >= 3 && n.status !== 'critical' && n.status !== 'offline') n.status = 'critical';
    n.disponibilidade = disp(n.status, rnd);
  }
  // Torre SP-023: a torre-vitrine do gêmeo digital (alta, 5G, um alarme moderado)
  const t23 = byId.get('Torre SP-023');
  if (t23) { t23.altura_m = 54; t23.tecnologia = '5G NR 3,5 GHz'; t23.status = 'warning'; t23.alarmes = Math.max(1, t23.alarmes); t23.criticidade = 'Alta'; t23.utilizacao = 84; }

  // ---- rotas (18): menor caminho por fibra entre pares de POPs ----
  const adj = new Map<string, { to: string; link: NetLink }[]>();
  for (const l of links) { if (l.tipo !== 'Fibra') continue; for (const [a, b] of [[l.origem, l.destino], [l.destino, l.origem]] as const) { if (!adj.has(a)) adj.set(a, []); adj.get(a)!.push({ to: b, link: l }); } }
  const dijkstra = (src: string, dst: string, avoid?: Set<string>) => {
    const dist = new Map<string, number>([[src, 0]]), prev = new Map<string, { from: string; link: NetLink }>(), done = new Set<string>();
    while (true) {
      let u: string | undefined, best = Infinity;
      for (const [k, v] of dist) if (!done.has(k) && v < best) { best = v; u = k; }
      if (!u || u === dst) break;
      done.add(u);
      for (const e of adj.get(u) ?? []) { if (avoid?.has(e.link.id) || e.link.status === 'offline' && avoid) continue; const nd = best + e.link.extensao_km; if (nd < (dist.get(e.to) ?? Infinity)) { dist.set(e.to, nd); prev.set(e.to, { from: u, link: e.link }); } }
    }
    if (!prev.has(dst)) return null;
    const ls: NetLink[] = [], ns = [dst];
    for (let c = dst; c !== src;) { const p = prev.get(c)!; ls.unshift(p.link); ns.unshift(p.from); c = p.from; }
    return { links: ls, nodes: ns, km: r2(dist.get(dst)!) };
  };
  const pairs: [string, string][] = [['Barueri', 'Sé'], ['Osasco', 'Sé'], ['Guarulhos', 'Sé'], ['Santo André', 'Sé'], ['São Bernardo', 'Ipiranga'], ['Itaquera', 'Tatuapé'], ['São Miguel', 'Penha'],
    ['Santo Amaro', 'Pinheiros'], ['Campo Limpo', 'Santo Amaro'], ['Pirituba', 'Lapa'], ['Santana', 'Sé'], ['Jabaquara', 'Ipiranga'], ['Barueri', 'Pinheiros'], ['Guarulhos', 'São Miguel'],
    ['Lapa', 'Santana'], ['Itaquera', 'Santo André'], ['Osasco', 'Campo Limpo'], ['Penha', 'Guarulhos']];
  const routes: NetRoute[] = [];
  const worst = (s: NetStatus[]): NetStatus => (s.includes('offline') ? 'offline' : s.includes('critical') ? 'critical' : s.includes('warning') ? 'warning' : 'normal');
  for (const [a, b] of pairs) {
    const src = `POP-${slug(a)}`, dst = `POP-${slug(b)}`;
    const p = dijkstra(src, dst);
    if (!p) continue;
    const st = worst(p.links.map((l) => l.status));
    const route: NetRoute = { id: `ROT-${String(routes.length + 1).padStart(2, '0')}`, nome: `Rota ${a} → ${b}`, origem: src, destino: dst, nos: p.nodes, enlaces: p.links.map((l) => l.id), distancia_km: p.km, status: st,
      latencia_ms: r2(p.km * 0.005 + p.links.length * 0.35), disponibilidade: r2(p.links.reduce((acc, l) => acc * (l.disponibilidade / 100), 1) * 100), alteracoes: [] };
    const broken = p.links.filter((l) => l.status === 'offline' || l.status === 'critical');
    if (broken.length) {
      const alt = dijkstra(src, dst, new Set(broken.map((l) => l.id)));
      if (alt) route.desvio = { enlaces: alt.links.map((l) => l.id), distancia_km: alt.km, motivo: broken[0]!.status === 'offline' ? `Rompimento no ${broken[0]!.id}` : `Atenuação crítica no ${broken[0]!.id}` };
    }
    const h = mulberry32(hash(route.id));
    route.alteracoes = [
      { ts: NOW - Math.round((20 + h() * 9) * DAY), texto: 'Rota provisionada no inventário' },
      { ts: NOW - Math.round((8 + h() * 10) * DAY), texto: `Capacidade ampliada para ${pick([100, 200, 400])}G` },
      ...(route.desvio ? [{ ts: NOW - Math.round(h() * 5 * 3_600_000), texto: `Tráfego desviado: ${route.desvio.motivo}` }] : []),
    ].sort((x, y) => x.ts - y.ts);
    routes.push(route);
  }
  return { nodes, links, regions, routes, events };
}

/** Histórico diário (30 dias) de um elemento, derivado do id — estável entre sessões. */
export function historyOf(id: string, cur: { utilizacao: number; atenuacao_dB: number; disponibilidade: number }): HistoryPoint[] {
  const h = mulberry32(hash(id));
  const trend = (h() - 0.4) * 0.6;
  return Array.from({ length: 30 }, (_, i) => {
    const d = 29 - i, w = Math.sin((i / 7) * Math.PI * 2) * 4;
    return { dia: NOW - d * DAY, utilizacao: Math.max(0, Math.min(99, Math.round(cur.utilizacao - d * trend + w + (h() - 0.5) * 8))),
      atenuacao_dB: r1(Math.max(0.5, cur.atenuacao_dB - d * trend * 0.08 + (h() - 0.5) * 1.2)), disponibilidade: r2(Math.min(100, cur.disponibilidade + d * 0.002 + (h() - 0.5) * 0.05)) };
  });
}
