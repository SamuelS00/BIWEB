import { distanceKm, frac, offsetM, point, regionOf, sectorPolygon, stations } from './base';
import type { Feature, LonLat } from './base';
import { roadPath } from './roads';

/* ───────────── Cobertura e qualidade de sinal ───────────── */
export const QUALITY = ['Excelente', 'Boa', 'Regular', 'Fraca'] as const;
export interface Tower { id: string; name: string; lon: number; lat: number; tech: '5G NR · 3,5 GHz' | '4G LTE · 1800 MHz'; rotation: number }
const towers: Tower[] = Array.from({ length: 24 }, (_, i) => {
  const col = i % 6, row = Math.floor(i / 6);
  return { id: `ERB-${String(210 + i)}`, name: `ERB ${['Lapa', 'Pompeia', 'Paulista', 'Mooca', 'Tatuapé', 'Penha', 'Pinheiros', 'Vila Mariana', 'Brooklin', 'Santana', 'Barra Funda', 'Butantã', 'Osasco Centro', 'Presidente Altino', 'Santo Amaro', 'Ipiranga', 'Itaim', 'Casa Verde', 'Bela Vista', 'Aclimação', 'Saúde', 'Jabaquara', 'Cidade Jardim', 'Morumbi'][i]}`, lon: -46.8 + col * .066 + (frac(i + 4) - .5) * .026, lat: -23.5 - row * .047 + (frac(i + 40) - .5) * .02, tech: frac(i + 9) < .42 ? '5G NR · 3,5 GHz' : '4G LTE · 1800 MHz', rotation: Math.round(frac(i + 70) * 120) };
});
/** Sector load follows the day: lunch and evening peaks. */
export const loadProfile = (hour: number) => .42 + .5 * Math.max(Math.exp(-((hour - 12.5) ** 2) / 5), 1.1 * Math.exp(-((hour - 19.5) ** 2) / 6)) + (hour > 6 && hour < 9 ? .12 : 0);
export function sectorState(base: number, rsrp: number, hour: number) {
  const prb = Math.min(99, Math.round(base * loadProfile(hour)));
  const score = (prb > 92 ? 3 : prb > 80 ? 2 : prb > 66 ? 1 : 0), signal = rsrp < -108 ? 3 : rsrp < -100 ? 2 : rsrp < -92 ? 1 : 0;
  const sev = Math.max(score, signal);
  return { prb, sev, qualidade: QUALITY[signal]!, status: ['Normal', 'Atenção', 'Crítico', 'Urgente'][sev]! };
}
const sectors: Feature[] = towers.flatMap((t, i) => [0, 1, 2].map((k) => {
  const az = (t.rotation + k * 120) % 360, rsrp = Math.round(-76 - frac(i * 3 + k) * 36 + (t.tech.startsWith('5G') ? 4 : 0)), base = Math.round(48 + frac(i * 5 + k + 2) * 60);
  const reach = t.tech.startsWith('5G') ? 1.5 + frac(i + k) * .8 : 2 + frac(i + k + 8) * 1.1;
  const st = sectorState(base, rsrp, 19);
  return { id: `${t.id}-S${k + 1}`, geometry: { type: 'Polygon' as const, coordinates: sectorPolygon(t.lon, t.lat, az, 104, reach) }, properties: { nome: `${t.name} · setor ${k + 1}`, tipo: 'Setor', torre: t.id, azimute: az, alcance_km: +reach.toFixed(1), tecnologia: t.tech, rsrp_dbm: rsrp, ocupacao_base: base, ocupacao_prb: st.prb, usuarios: Math.round(base * 11 + frac(i + k) * 90), qualidade: st.qualidade, status: st.status, regiao: regionOf(t.lon), centro: [t.lon, t.lat] } };
}));
const towerFeatures = towers.map((t) => point(t.id, t.lon, t.lat, { nome: t.name, tipo: 'Torre', tecnologia: t.tech, altura_m: 28 + Math.round(frac(t.lon * 900) * 22), status: 'Normal', regiao: regionOf(t.lon), setores: 3 }));
const shadowZones: Feature[] = [[-46.775, -23.585, 3.4], [-46.568, -23.612, 4.1], [-46.62, -23.472, 2.9], [-46.704, -23.6585, 3.3]].map(([lon, lat, w], i) => ({ id: `SOMBRA-${i + 1}`, geometry: { type: 'Polygon' as const, coordinates: Array.from({ length: 11 }, (_, k) => { const a = k / 10 * Math.PI * 2, r = w! * (.72 + frac(i * 9 + k) * .4) * 400; return offsetM(lon!, lat!, Math.cos(a) * r * 1.35, Math.sin(a) * r); }) }, properties: { nome: `Zona de sombra ${i + 1}`, tipo: 'Zona de sombra', status: i % 2 ? 'Crítico' : 'Urgente', area_km2: +(w! * .9).toFixed(1), clientes_afetados: Math.round(2400 + frac(i) * 5200), regiao: regionOf(lon!), rsrp_medio: -112 - i * 2 } }));
const complaints = Array.from({ length: 140 }, (_, i) => {
  const z = shadowZones[i % 4]!, c = z.geometry.coordinates[Math.floor(frac(i) * 10)]!;
  const near = i % 5 !== 0, lon = near ? c[0]! + (frac(i + 3) - .5) * .02 : -46.8 + frac(i + 80) * .32, lat = near ? c[1]! + (frac(i + 9) - .5) * .014 : -23.5 - frac(i + 90) * .17;
  return point(`RCL-${5200 + i}`, lon, lat, { nome: ['Sem sinal em casa', 'Ligações caindo', 'Internet móvel lenta', 'Sem 5G'][i % 4], tipo: 'Reclamação', status: ['Normal', 'Atenção', 'Crítico'][i % 3], hora: Math.floor(frac(i + 31) * 24), regiao: regionOf(lon), canal: ['App', 'Call center', 'Loja'][i % 3] });
});
export const coverage = { towers, sectors, towerFeatures, shadowZones, complaints };

/* ───────────── Expansão de fibra ───────────── */
export const PHASES = ['Projeto', 'Licenciamento', 'Em obra', 'Concluído'] as const;
export function phaseAt(week: number, start: number, duration: number) {
  const pct = Math.max(0, Math.min(1, (week - start) / duration));
  return { pct, fase: pct >= 1 ? 'Concluído' : pct > 0 ? 'Em obra' : week >= start - 3 ? 'Licenciamento' : 'Projeto' } as { pct: number; fase: typeof PHASES[number] };
}
const named = (n: string) => stations.find((s) => s[0] === n)!;
const proj = (id: string, nome: string, a: LonLat, b: LonLat, start: number, duration: number, extra: Record<string, unknown>): Feature => {
  const pts = roadPath(a, b, id.length * 7 + start);
  const km = pts.slice(1).reduce((n, q, i) => n + distanceKm(pts[i]!, q), 0);
  return { id, geometry: { type: 'LineString', coordinates: pts }, properties: { nome, tipo: 'Rota de fibra', km: +km.toFixed(1), inicio_semana: start, duracao_sem: duration, hp_previstos: Math.round(km * 410), capex_mil: Math.round(km * 118), regiao: regionOf(a[0]), status: 'Normal', ...extra } };
};
const L = (n: string): LonLat => [named(n)[1], named(n)[2]];
const routes: Feature[] = [
  proj('EXP-001', 'Anel Leste · Mooca → Itaquera', L('Mooca'), L('Itaquera'), 1, 9, { licenca: 'Aprovada', equipes: 3, risco: 'Baixo' }),
  proj('EXP-002', 'Marginal Oeste · Osasco → Barueri', L('Osasco'), L('Barueri'), 3, 11, { licenca: 'Aprovada', equipes: 4, risco: 'Médio' }),
  proj('EXP-003', 'Backhaul Sul · Santo Amaro → Pinheiros', L('Santo Amaro'), L('Pinheiros'), 6, 8, { licenca: 'Em análise', equipes: 2, risco: 'Alto', atraso_sem: 1 }),
  proj('EXP-004', 'Lateral Norte · Santana → Barra Funda', L('Santana'), L('Barra Funda'), 9, 7, { licenca: 'Aprovada', equipes: 2, risco: 'Baixo' }),
  proj('EXP-005', 'Corredor Paulista · Paulista → Pinheiros', L('Paulista'), L('Pinheiros'), 12, 9, { licenca: 'Pendente', equipes: 3, risco: 'Alto', atraso_sem: 3 }),
  proj('EXP-006', 'Ramal Lapa · Lapa → Barra Funda', L('Lapa'), L('Barra Funda'), 15, 6, { licenca: 'Em análise', equipes: 2, risco: 'Médio' }),
  proj('EXP-007', 'Radial Sudeste · Mooca → Paulista', L('Mooca'), L('Paulista'), 17, 8, { licenca: 'Pendente', equipes: 3, risco: 'Médio', atraso_sem: 2 }),
  proj('EXP-008', 'Ligação Oeste · Lapa → Osasco', L('Lapa'), L('Osasco'), 20, 9, { licenca: 'Pendente', equipes: 4, risco: 'Baixo' }),
];
const hpAreas: Feature[] = [['Vila Maria', -46.585, -23.510, 5200], ['Penha', -46.540, -23.525, 4300], ['Brooklin', -46.695, -23.610, 6100], ['Perdizes', -46.678, -23.535, 3800], ['Jabaquara', -46.640, -23.646, 4700], ['Carapicuíba', -46.835, -23.520, 3900], ['Vila Prudente', -46.580, -23.585, 4600]].map(([nome, lon, lat, hp], i) => ({ id: `FTTH-${i + 1}`, geometry: { type: 'Polygon', coordinates: [[-1, -.8], [1.1, -.9], [1.2, .9], [-.9, 1]].concat([[-1, -.8]]).map(([x, y]) => offsetM(lon as number, lat as number, x! * 950, y! * 800)) }, properties: { nome: `${nome} · FTTH`, tipo: 'Área FTTH', hp_previstos: hp, viabilidade: ['Alta', 'Média', 'Alta', 'Média', 'Baixa', 'Média', 'Alta'][i], taxa_adesao_prev: [38, 31, 42, 29, 22, 33, 36][i], inicio_semana: 4 + i * 3, status: 'Normal', regiao: regionOf(lon as number) } }));
const yards: Feature[] = routes.map((r, i) => { const c = r.geometry.coordinates[Math.floor(r.geometry.coordinates.length / 2)]!; return point(`CAN-${i + 1}`, c[0]! + .004, c[1]! - .003, { nome: `Canteiro ${i + 1}`, tipo: 'Canteiro', equipes: r.properties.equipes, status: 'Normal', inicio_semana: r.properties.inicio_semana, regiao: r.properties.regiao }); });
export const expansion = { routes, hpAreas, yards };

/* ───────────── Clima e risco ───────────── */
export interface Storm { id: string; nome: string; lon0: number; lat0: number; vx: number; vy: number; r0: number; growth: number; born: number; dies: number; peak: number }
export const storms: Storm[] = [
  { id: 'TMP-1', nome: 'Célula Sudoeste', lon0: -46.93, lat0: -23.70, vx: .031, vy: .017, r0: 5.6, growth: .6, born: 11, dies: 22, peak: 96 },
  { id: 'TMP-2', nome: 'Linha de instabilidade', lon0: -46.88, lat0: -23.50, vx: .036, vy: -.002, r0: 4.4, growth: .42, born: 13, dies: 23, peak: 74 },
  { id: 'TMP-3', nome: 'Célula Leste', lon0: -46.40, lat0: -23.64, vx: -.019, vy: .011, r0: 3.8, growth: .36, born: 14, dies: 23.5, peak: 62 },
  { id: 'TMP-4', nome: 'Núcleo Norte', lon0: -46.70, lat0: -23.38, vx: .004, vy: -.014, r0: 3.2, growth: .42, born: 16, dies: 23.5, peak: 83 },
];
export function stormAt(s: Storm, hour: number) {
  if (hour < s.born || hour > s.dies) return null;
  const life = (hour - s.born) / (s.dies - s.born), strength = Math.sin(Math.PI * Math.min(1, life * 1.15)) ** .8;
  return { lon: s.lon0 + s.vx * (hour - s.born + 2), lat: s.lat0 + s.vy * (hour - s.born + 2), radiusKm: s.r0 + s.growth * (hour - s.born), mmh: Math.round(s.peak * strength), strength };
}
export function weatherRisk(lon: number, lat: number, hour: number) {
  let worst = 0, mm = 0, eta = Infinity, name = '';
  for (const s of storms) {
    const now = stormAt(s, hour); if (!now) continue;
    const d = distanceKm([lon, lat], [now.lon, now.lat]), inside = d < now.radiusKm, near = d < now.radiusKm * 1.8;
    const sev = inside ? (now.mmh > 70 ? 3 : 2) : near ? 1 : 0;
    if (sev > worst || sev === worst && now.mmh > mm) { worst = sev; mm = inside ? now.mmh : Math.round(now.mmh * .4); name = s.nome; }
    for (let h = hour; h <= hour + 3; h += .25) { const f = stormAt(s, h); if (f && distanceKm([lon, lat], [f.lon, f.lat]) < f.radiusKm) { eta = Math.min(eta, (h - hour) * 60); break; } }
  }
  return { sev: worst, mmh: mm, eta: Number.isFinite(eta) ? Math.round(eta) : null, storm: name, status: ['Normal', 'Atenção', 'Crítico', 'Urgente'][worst]! };
}
const weatherSites: Feature[] = [
  ...stations.map(([nome, lon, lat], i) => point(`SITE-${i + 1}`, lon, lat, { nome: `POP ${nome}`, tipo: 'POP', status: 'Normal', regiao: regionOf(lon), bateria_h: 4 + i % 4, gerador: i % 3 ? 'Sim' : 'Manutenção' })),
  ...towers.filter((_, i) => i % 3 === 0).map((t, i) => point(`SITE-T${i + 1}`, t.lon, t.lat, { nome: t.name, tipo: 'Torre', status: 'Normal', regiao: regionOf(t.lon), bateria_h: 2 + i % 3, gerador: i % 2 ? 'Sim' : 'Não' })),
];
const floodPoints: Feature[] = ([['Av. do Estado · Ipiranga', -46.6115, -23.5885], ['Marginal Tietê · Ponte do Limão', -46.7035, -23.5115], ['Córrego Anhangabaú', -46.6385, -23.5475], ['Av. Jacu-Pêssego', -46.4880, -23.5920], ['Rua Pedroso Alvarenga', -46.6845, -23.5855], ['Largo da Batata', -46.6935, -23.5665], ['Av. Aricanduva', -46.5260, -23.5640], ['Pinheiros · Ponte Cidade Jardim', -46.7215, -23.5780], ['Vila Leopoldina', -46.7355, -23.5315], ['Av. Nações Unidas · Santo Amaro', -46.7075, -23.6280]] as [string, number, number][]).map(([nome, lon, lat], i) => point(`ALG-${i + 1}`, lon, lat, { nome, tipo: 'Ponto de alagamento', status: 'Normal', regiao: regionOf(lon), historico: 2 + i % 5 }));
const alerts: Feature[] = [
  { id: 'ALR-1', geometry: { type: 'Polygon', coordinates: [[-46.95, -23.58], [-46.70, -23.58], [-46.66, -23.75], [-46.95, -23.75], [-46.95, -23.58]] }, properties: { nome: 'Alerta laranja · tempestade', tipo: 'Alerta', status: 'Crítico', regiao: 'Oeste', vigencia: '14h–20h' } },
  { id: 'ALR-2', geometry: { type: 'Polygon', coordinates: [[-46.60, -23.40], [-46.40, -23.40], [-46.40, -23.52], [-46.60, -23.52], [-46.60, -23.40]] }, properties: { nome: 'Alerta amarelo · chuva forte', tipo: 'Alerta', status: 'Atenção', regiao: 'Leste', vigencia: '17h–23h' } },
];
export const weather = { storms, sites: weatherSites, floodPoints, alerts };
