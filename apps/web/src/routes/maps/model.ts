import type { Dataset, Row, Table, Relationship } from '../../data/types';
import { distanceKm, frac, point, regionOf, stations } from './base';
import type { Feature, Geometry } from './base';
import { roadPath, routeThrough } from './roads';
import { LIGHT_STATUS, lightCircuits, lightOrders, lightTrafos, poles } from './data-lights';
import { coverage, expansion, storms, weather } from './data-extra';
import { createSim } from './field-sim';

export type { Feature, Geometry };
export { distanceKm, LIGHT_STATUS };
export type ReportId = 'network' | 'theft' | 'lights' | 'incidents' | 'field' | 'coverage' | 'expansion' | 'weather';
export type Basemap = 'Light' | 'Dark' | 'Street' | 'Terrain' | '3D Urban' | 'Satellite';
export type LayerRender = 'lights' | 'sector' | 'storm' | 'progress';
export interface Layer {
  id: string; name: string; dataset: string; table: string; visible: boolean;
  color: string; colorBy: string; size: number; opacity: number; icon: 'circle' | 'diamond' | 'square';
  popup: boolean; tooltip: boolean; click: 'inspect' | 'focus'; label: string;
  features: Feature[];
  /** Layers with their own renderer (night lights, radar, sectors, build progress). */
  render?: LayerRender;
  /** Saved documents omit the features of unmodified built-in layers and restore them on load. */
  builtin?: boolean;
  /** Hide the layer while the map is zoomed out beyond this level. */
  minZoom?: number;
}
export interface MapDocument {
  version: 1; id: ReportId; name: string; basemap: Basemap; dimension: '2d' | '3d';
  aggregation: 'Eventos' | 'Heatmap' | 'Clusters'; layers: Layer[]; legend: boolean;
  bands: number[]; related: boolean; overdueOnly?: boolean;
  relationships?: Record<string, Relationship[]>;
  scope?: { status: string; region: string; type: string; route: string; hour: number };
}
export type MapCategory = 'Rede' | 'Segurança' | 'Infraestrutura urbana' | 'Operações';
export interface MapMeta {
  id: ReportId; name: string; short: string; question: string; base: Basemap; technique: string;
  category: MapCategory; accent: string; tags: string[]; live?: boolean; blurb: string; camera: [number, number, number]; icon: 'pin' | 'bolt' | 'layers' | 'timeline' | 'target' | 'cube' | 'kpi' | 'model';
}
export const REPORTS: MapMeta[] = [
  { id: 'network', name: 'Network Intelligence / OPS', short: 'Network OPS', question: 'Onde a qualidade do sinal exige uma intervenção?', base: 'Dark', technique: 'Topologia · fluxo · 2.5D', category: 'Rede', accent: '#4aa3d8', tags: ['Fibra', 'Atenuação', 'Rotas'], icon: 'model',
    blurb: 'Anéis ópticos sobre o traçado das vias, margem de potência por trecho e simulação de rompimento com rota alternativa.',
    camera: [-46.665, -23.545, 10.9] },
  { id: 'theft', name: 'Cable Theft Intelligence', short: 'Furto de cabos', question: 'Onde os cortes reincidem e o que existe por perto?', base: 'Street', technique: 'Ocorrências · proximidade', category: 'Segurança', accent: '#cb7063', tags: ['Reincidência', 'Patrulha', 'Proximidade'], icon: 'target',
    blurb: 'Pontos de reincidência, delegacias e ferros-velhos em contexto, com rota de patrulha sugerida entre os focos.',
    camera: [-46.655, -23.55, 11.2] },
  { id: 'lights', name: 'Street Light Management', short: 'Iluminação pública', question: 'Quais trechos da cidade estão no escuro e o que precisa de manutenção?', base: 'Dark', technique: '3.200 postes · circuitos · noite', category: 'Infraestrutura urbana', accent: '#f1c25b', tags: ['3.200 postes', 'Circuitos', 'Noite'], icon: 'bolt',
    blurb: 'A cidade à noite: cada poste acende no horário da fotocélula, circuitos inteiros apagados, transformadores e ordens de manutenção.',
    camera: [-46.63, -23.555, 12.2] },
  { id: 'incidents', name: 'Incident Intelligence', short: 'Incidentes', question: 'Como a concentração de incidentes evolui ao longo do dia?', base: 'Dark', technique: 'Densidade · tempo', category: 'Operações', accent: '#d98a4a', tags: ['Heatmap', 'Linha do tempo'], icon: 'timeline',
    blurb: 'Densidade espacial de incidentes hora a hora, com composição por tipo e regiões que concentram a operação.',
    camera: [-46.64, -23.55, 11.2] },
  { id: 'field', name: 'Field Operations & Routes', short: 'Equipes em campo', question: 'Quem está mais perto do chamado e quais rotas estão atrasadas?', base: 'Street', technique: 'Tempo real · despacho · rotas', category: 'Operações', accent: '#5dbb8a', tags: ['Tempo real', 'Despacho', 'SLA'], live: true, icon: 'pin',
    blurb: 'Central de despacho simulada: equipes percorrem as ruas, chamados chegam, SLAs estouram e o feed de atividade corre ao vivo.',
    camera: [-46.545, -23.56, 11.8] },
  { id: 'coverage', name: 'Coverage & Signal Quality', short: 'Cobertura de sinal', question: 'Onde o cliente está sem sinal ou com setores saturados?', base: 'Dark', technique: 'Setores · RSRP · ocupação', category: 'Rede', accent: '#9d81d6', tags: ['4G / 5G', 'RSRP', 'Congestão'], icon: 'layers',
    blurb: 'Setores de cada torre coloridos por qualidade de sinal, congestionamento ao longo do dia e zonas de sombra com reclamações.',
    camera: [-46.63, -23.595, 11.3] },
  { id: 'expansion', name: 'Fiber Expansion Planner', short: 'Expansão de fibra', question: 'Quais obras estão no prazo e que áreas serão atendidas primeiro?', base: 'Street', technique: 'Obras · cronograma · homes passed', category: 'Rede', accent: '#3fb6a8', tags: ['Obras', 'Cronograma', 'FTTH'], icon: 'kpi',
    blurb: 'Cronograma navegável: rotas ganham cor e avanço conforme as semanas passam, licenças bloqueadas e áreas FTTH priorizadas.',
    camera: [-46.67, -23.57, 11] },
  { id: 'weather', name: 'Weather & Risk', short: 'Clima e risco', question: 'Quais sites serão atingidos pela próxima tempestade e quando?', base: 'Dark', technique: 'Radar · previsão · risco', category: 'Operações', accent: '#6f8bff', tags: ['Radar', 'Previsão', 'Energia'], icon: 'cube',
    blurb: 'Células de tempestade avançando hora a hora sobre a malha: sites em risco, ETA de impacto e pontos históricos de alagamento.',
    camera: [-46.68, -23.56, 10.6] },
];
export const COLORS = ['#489b8a', '#cc9b45', '#cb7063', '#ad4860'];
export const STATUS = ['Normal', 'Atenção', 'Crítico', 'Urgente'];
export const CENTER = [-46.645, -23.55];

/* ───────────── timeline por mapa ───────────── */
export interface TimelineSpec { label: string; unit: 'hora' | 'semana'; min: number; max: number; step: number; start: number; filterProp?: string; playMs: number; liveMs: number }
const CLOCK = { unit: 'hora' as const, min: 0, max: 23, step: 1, playMs: 900, liveMs: 3000 };
export const TIMELINES: Partial<Record<ReportId, TimelineSpec>> = {
  incidents: { ...CLOCK, label: 'Período dos incidentes', start: 23, filterProp: 'hora' },
  theft: { ...CLOCK, label: 'Período das ocorrências', start: 23, filterProp: 'hora' },
  lights: { unit: 'hora', label: 'Hora da noite', min: 0, max: 23.75, step: .25, start: 20.5, playMs: 160, liveMs: 400 },
  coverage: { unit: 'hora', label: 'Hora do dia', min: 0, max: 23, step: 1, start: 19, filterProp: 'hora', playMs: 700, liveMs: 2000 },
  weather: { unit: 'hora', label: 'Hora da previsão', min: 9, max: 23.75, step: .25, start: 15, playMs: 220, liveMs: 600 },
  expansion: { unit: 'semana', label: 'Semana do cronograma', min: 1, max: 26, step: 1, start: 10, playMs: 650, liveMs: 1200 },
};
export function formatTime(spec: TimelineSpec | undefined, v: number) {
  if (spec?.unit === 'semana') return `Semana ${Math.round(v)}`;
  const h = Math.floor(v), m = Math.round((v - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m === 60 ? 0 : m).padStart(2, '0')}`;
}

/* ───────────── dados base ───────────── */
const stationFeatures = stations.map(([nome, lon, lat], i) => point(`EST-${i + 1}`, lon, lat, { nome, tipo: 'Estação', status: 'Normal', regiao: i < 4 ? 'Oeste' : 'Centro', clientes: 4200 + Math.round(frac(i + 3) * 9000), potencia_kw: 6 + i % 4 }));
const pairs = [[3, 2], [2, 0], [0, 1], [1, 7], [7, 6], [6, 8], [8, 4], [4, 9], [9, 0], [9, 5], [5, 8], [1, 4], [2, 9]];
const links: Feature[] = pairs.map(([a, b], i) => {
  const from = stationFeatures[a!]!, to = stationFeatures[b!]!;
  const attenuation = [8, 12, 19, 26, 11, 15, 9, 13, 8, 21, 28, 9, 17][i]!;
  const coords = roadPath(from.geometry.coordinates[0]! as [number, number], to.geometry.coordinates[0]! as [number, number], i * 11 + 3);
  const km = coords.slice(1).reduce((n, q, k) => n + distanceKm(coords[k]!, q), 0);
  return { id: `OPS-${String(380 + i).padStart(4, '0')}`, geometry: { type: 'LineString', coordinates: coords }, properties: { nome: `${from.properties.nome} → ${to.properties.nome}`, rota: i < 4 ? 'SP-04' : i < 8 ? 'SP-07' : 'SP-12', origem: from.properties.nome, destino: to.properties.nome, atenuacao_a: attenuation, atenuacao_b: attenuation + 1.6, margem: +(25 - attenuation).toFixed(1), status: STATUS[attenuation < 12 ? 0 : attenuation < 18 ? 1 : attenuation < 24 ? 2 : 3], tipo: 'Fibra óptica', regiao: i < 4 ? 'Oeste' : 'Centro', extensao_km: +km.toFixed(1), capacidade_gbps: i % 3 === 0 ? 100 : 40, utilizacao_pct: 38 + Math.round(frac(i * 5) * 52), fibras: [48, 96, 144][i % 3], latencia_ms: +(km * .005 + .6 + frac(i) * 1.2).toFixed(1) } };
});
/** Hour of day drawn from a weighted profile, deterministic per event. */
const NIGHT_PROFILE = [9, 10, 10, 9, 7, 4, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 4, 5, 6, 8, 9];
const DAY_PROFILE = [2, 1, 1, 1, 2, 3, 6, 9, 11, 8, 6, 6, 7, 6, 6, 7, 9, 12, 13, 10, 7, 5, 4, 3];
function hourFrom(profile: number[], i: number) {
  const total = profile.reduce((a, b) => a + b, 0); let r = frac(i * 3.7 + 1) * total;
  for (let h = 0; h < 24; h++) { r -= profile[h]!; if (r <= 0) return h; }
  return 23;
}
function events(prefix: string, count: number, type: string, profile: number[]): Feature[] {
  return Array.from({ length: count }, (_, i) => {
    const center = stations[i % stations.length]!, hora = hourFrom(profile, i);
    return point(`${prefix}-${2841 + i}`, center[1] + (frac(i + 1) - .5) * .042, center[2] + (frac(i + 600) - .5) * .035, {
      nome: `${type} ${i + 1}`, tipo: i % 3 === 0 ? 'Corte' : i % 3 === 1 ? 'Furto' : 'Falha de energia',
      status: STATUS[i % 4], regiao: i % 10 < 4 ? 'Oeste' : i % 10 < 7 ? 'Leste' : 'Centro',
      hora, data: '07/10/2026', horario: `${String(hora).padStart(2, '0')}:${String(i * 7 % 60).padStart(2, '0')}`,
      endereco: `Via demonstrativa ${i + 1} · ${center[0]}`, extensao_m: 80 + i * 13 % 800, delegacia: `${7 + i % 4}º DP`, reincidencias: 1 + i % 5,
    });
  });
}
const theft = events('CT', 96, 'Ocorrência', NIGHT_PROFILE);
const incidents = events('INC', 360, 'Incidente', DAY_PROFILE);
const teamSeed = createSim().teams;
const teamFeatures = teamSeed.map((t) => point(t.id, t.lon, t.lat, { nome: `Equipe ${t.name}`, tipo: 'Veículo', status: 'Normal', tarefas: 2, atraso_min: 0, regiao: regionOf(t.lon), veiculo: t.vehicle, especialidade: t.skill, base: t.baseName }));
const baseFeatures = teamSeed.map((t, i) => point(`BASE-${i + 1}`, t.base[0], t.base[1], { nome: `Base ${t.baseName}`, tipo: 'Base', status: 'Normal', regiao: regionOf(t.base[0]), equipes: 1 }));
const zones: Feature[] = teamSeed.map((t, i) => ({ id: `AREA-${i}`, geometry: { type: 'Polygon', coordinates: [[t.base[0] - .03, t.base[1] - .022], [t.base[0] + .034, t.base[1] - .02], [t.base[0] + .036, t.base[1] + .02], [t.base[0] - .026, t.base[1] + .023], [t.base[0] - .03, t.base[1] - .022]] }, properties: { nome: `Zona de atuação · ${t.baseName}`, tipo: 'Zona', status: 'Normal', regiao: regionOf(t.base[0]), equipe: t.id } }));
/** Patrol route suggested for the cable-theft map: the three worst clusters, joined by streets. */
const hotspots = stations.slice(0, 5).map((s, i) => ({ s, n: theft.filter((f) => f.properties.endereco && String(f.properties.endereco).endsWith(s[0])).length + i % 2 })).sort((a, b) => b.n - a.n).slice(0, 4).map((x) => [x.s[1], x.s[2]] as [number, number]);
const patrol: Feature = { id: 'PATRULHA-1', geometry: { type: 'LineString', coordinates: routeThrough(hotspots, 4) }, properties: { nome: 'Rota de patrulha sugerida', tipo: 'Patrulha', status: 'Normal', regiao: 'Centro', paradas: hotspots.length } };

function table(id: string, features: Feature[], name = id, description = 'Dados geográficos demonstrativos'): Table {
  const rows = features.map((f) => ({ ...f.properties, id: f.id, geometria: f.geometry.coordinates }));
  return { id, name, description, key: 'id', rows, fields: Object.keys(rows[0] ?? {}).map((n) => ({ name: n, label: n, kind: ['latitude', 'longitude'].includes(n) ? 'geo' : 'dimension' })) };
}
const stormFeatures = storms.map((s) => point(s.id, s.lon0, s.lat0, { ...s, nome: s.nome, tipo: 'Célula', status: 'Normal', regiao: regionOf(s.lon0) }));
export const DEMO_DATASET: Dataset = {
  id: 'ds_map_operations', name: 'Operações geográficas · São Paulo', description: 'Cenários demonstrativos do Map Builder', owner: 'BIWEB',
  source: { kind: 'JSON', label: 'Demonstração local', refreshedAt: 1791360000000, schedule: 'Manual' },
  tables: [table('postes', poles, 'Postes'), table('circuitos', lightCircuits, 'Circuitos'), table('trafos', lightTrafos, 'Transformadores'), table('ocorrencias', theft, 'Ocorrências'), table('incidentes', incidents, 'Incidentes'),
    table('estacoes', stationFeatures, 'Estações'), table('trechos', links, 'Trechos'), table('equipes', teamFeatures, 'Equipes'), table('torres', coverage.towerFeatures, 'Torres'), table('setores', coverage.sectors, 'Setores celulares'),
    table('expansao', expansion.routes, 'Rotas de expansão'), table('sites_clima', weather.sites, 'Sites monitorados'),
    { id: 'rotas', name: 'Rotas OPS', description: 'Agrupamento lógico dos trechos', key: 'id', fields: ['id', 'nome', 'trechos'].map((name) => ({ name, label: name, kind: 'dimension' })), rows: ['SP-04', 'SP-07', 'SP-12'].map((id) => ({ id, nome: `Rota metropolitana ${id}`, trechos: links.filter((l) => l.properties.rota === id).length })) },
    { id: 'leituras', name: 'Leituras ópticas', description: 'Histórico simulado de atenuação', key: 'id', fields: ['id', 'trecho_id', 'hora', 'atenuacao_dB'].map((name) => ({ name, label: name, kind: 'dimension' })), rows: links.flatMap((l) => [0, 1, 2].map((n) => ({ id: `${l.id}-${n}`, trecho_id: l.id, hora: `0${6 + n}:00`, atenuacao_dB: Number(l.properties.atenuacao_a) - 2 + n }))) },
    { id: 'manutencoes', name: 'Manutenções', description: 'Ordens ligadas pelo poste_id', key: 'id', fields: ['id', 'poste_id', 'data', 'tipo', 'status'].map((name) => ({ name, label: name, kind: 'dimension' })), rows: lightOrders }],
  relationships: [
    { from: 'manutencoes.poste_id', to: 'postes.id', label: 'Manutenções → postes' },
    { from: 'postes.circuito', to: 'circuitos.id', label: 'Poste → circuito' },
    { from: 'circuitos.trafo', to: 'trafos.id', label: 'Circuito → transformador' },
    { from: 'trechos.origem', to: 'estacoes.nome', label: 'Estação de origem' },
    { from: 'trechos.destino', to: 'estacoes.nome', label: 'Estação de destino' },
    { from: 'trechos.rota', to: 'rotas.id', label: 'Rota → trechos' },
    { from: 'leituras.trecho_id', to: 'trechos.id', label: 'Leituras → trecho' },
    { from: 'setores.torre', to: 'torres.id', label: 'Setor → torre' },
  ],
};
export function layer(name: string, features: Feature[], tableId = '', color = COLORS[0]!, extra: Partial<Layer> = {}): Layer {
  return { id: `${tableId || 'layer'}-${name}`, name, dataset: DEMO_DATASET.id, table: tableId, visible: true, color, colorBy: features.some((f) => f.properties.status != null) ? 'status' : '', size: 5, opacity: 100, icon: 'circle', popup: true, tooltip: true, click: 'inspect', label: 'nome', features, ...extra };
}
const ctx = (name: string, features: Feature[], tableId: string, color: string, extra: Partial<Layer> = {}) => layer(name, features, tableId, color, { colorBy: '', size: 4, ...extra });
export function createDocument(id: ReportId): MapDocument {
  const report = REPORTS.find((r) => r.id === id)!;
  const layers: Layer[] = id === 'network' ? [layer('Estações', stationFeatures, 'estacoes'), layer('Trechos ópticos', links, 'trechos')]
    : id === 'theft' ? [layer('Ocorrências de corte / furto', theft, 'ocorrencias', COLORS[2]), layer('Rede afetada', links.slice(0, 6), 'trechos'), ctx('Delegacias', stations.slice(0, 5).map(([n, x, y], i) => point(`DP-${7 + i}`, x + .008, y + .009, { nome: `${7 + i}º DP · ${n}`, tipo: 'Delegacia' })), '', '#667bb0', { icon: 'square' }), ctx('Ferros-velhos · contexto', stations.slice(0, 5).map(([n, x, y], i) => point(`FV-${i}`, x - .012, y + .006, { nome: `Reciclagem · ${n}`, tipo: 'Ferro-velho' })), '', '#a19078', { icon: 'diamond' }), layer('Rota de patrulha sugerida', [patrol], '', '#59b6d6', { colorBy: '', size: 5 })]
    : id === 'lights' ? [layer('Postes de São Paulo', poles, 'postes', '#f1c25b', { render: 'lights', size: 4 }), layer('Circuitos elétricos', lightCircuits, 'circuitos', '#7c8aa5', { size: 3, opacity: 70, visible: false }), layer('Transformadores', lightTrafos, 'trafos', '#9fb3d9', { icon: 'square', size: 3, minZoom: 13 })]
    : id === 'incidents' ? [layer('Incidentes operacionais', incidents, 'incidentes', COLORS[2])]
    : id === 'field' ? [layer('Zonas de atuação', zones, '', '#5dbb8a', { colorBy: '', opacity: 60 }), ctx('Bases e depósitos', baseFeatures, '', '#8fa7a0', { icon: 'square' })]
    : id === 'coverage' ? [layer('Setores celulares', coverage.sectors, 'setores', '#9d81d6', { render: 'sector', size: 4 }), ctx('Torres', coverage.towerFeatures, 'torres', '#e9ecf5', { icon: 'diamond', size: 4 }), layer('Reclamações de sinal', coverage.complaints, '', COLORS[2], { size: 3 }), layer('Zonas de sombra', coverage.shadowZones, '', '#d9567a', { colorBy: '', opacity: 85 })]
    : id === 'expansion' ? [layer('Rotas de expansão', expansion.routes, 'expansao', '#3fb6a8', { render: 'progress', size: 5 }), layer('Áreas FTTH priorizadas', expansion.hpAreas, '', '#8fd0c6', { colorBy: '', opacity: 70 }), ctx('Canteiros', expansion.yards, '', '#f0c35b', { icon: 'square', size: 5 })]
    : [layer('Células de tempestade', stormFeatures, '', '#6f8bff', { render: 'storm', colorBy: '' }), layer('Sites e energia', weather.sites, 'sites_clima', COLORS[0]!, { size: 5 }), layer('Pontos de alagamento', weather.floodPoints, '', '#59b6d6', { icon: 'diamond', size: 4 }), layer('Alertas da Defesa Civil', weather.alerts, '', '#e6a23c', { colorBy: '', opacity: 70 })];
  layers.forEach((l) => { l.builtin = true; });
  return { version: 1, id, name: report.name, basemap: report.base, dimension: id === 'network' ? '3d' : '2d', aggregation: id === 'incidents' ? 'Heatmap' : id === 'lights' ? 'Eventos' : 'Eventos', layers, legend: true, bands: [12, 18, 24], related: true };
}
export function severity(f: Feature, bands = [12, 18, 24]): number {
  if (typeof f.properties.atenuacao_a === 'number') return bands.filter((b) => Number(f.properties.atenuacao_a) >= b).length;
  const s = String(f.properties.status); return Math.max(0, STATUS.indexOf(s), LIGHT_STATUS.indexOf(s));
}
export interface Mapping { latitude: string; longitude: string; label: string; color: string }
export function mapRows(rows: Row[], mapping: Mapping, key: string): { features: Feature[]; rejected: number } {
  const features: Feature[] = []; let rejected = 0;
  rows.forEach((r, i) => {
    const lat = Number(r[mapping.latitude]), lon = Number(r[mapping.longitude]);
    if (r[mapping.latitude] == null || r[mapping.longitude] == null || String(r[mapping.latitude]).trim() === '' || String(r[mapping.longitude]).trim() === '' || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) { rejected++; return; }
    features.push(point(String(r[key] ?? i), lon, lat, r));
  });
  return { features, rejected };
}
export function relatedRows(dataset: Dataset, tableId: string, row: Row) {
  return dataset.relationships.flatMap((r) => {
    const [a, ak] = r.from.split('.'), [b, bk] = r.to.split('.');
    const own = a === tableId ? ak : b === tableId ? bk : undefined;
    const other = a === tableId ? b : a, foreign = a === tableId ? bk : ak;
    if (!own || !foreign || row[own] == null) return [];
    const t = dataset.tables.find((x) => x.id === other);
    return [{ label: r.label, table: other!, rows: t?.rows.filter((x) => x[foreign] != null && String(x[foreign]) === String(row[own])) ?? [] }];
  });
}

/** Categorical mappings use the requested field, while status uses the shared semantic bands. */
export function featureColor(layer: Layer, feature: Feature, bands: number[]): string {
  if (!layer.colorBy) return layer.color;
  if (layer.colorBy === 'status') return COLORS[severity(feature, bands)]!;
  const value = String(feature.properties[layer.colorBy] ?? '');
  const palette = ['#668daf', '#9d81b5', '#b49a61', '#539c91', '#b37b87', '#758d5d'];
  let hash = 0;
  for (const c of value) hash = (hash * 31 + c.charCodeAt(0)) | 0;
  return palette[(hash >>> 0) % palette.length]!;
}

/** Saved documents are portable configuration plus local geographic features. */
export function isMapDocument(value: unknown): value is MapDocument {
  if (!value || typeof value !== 'object') return false;
  const d = value as MapDocument;
  return d.version === 1 && REPORTS.some((r) => r.id === d.id) && typeof d.name === 'string'
    && ['Light', 'Dark', 'Street', 'Satellite', 'Terrain', '3D Urban'].includes(d.basemap)
    && ['2d', '3d'].includes(d.dimension) && ['Eventos', 'Heatmap', 'Clusters'].includes(d.aggregation)
    && typeof d.legend === 'boolean' && typeof d.related === 'boolean'
    && Array.isArray(d.bands) && d.bands.length === 3 && d.bands.every((n, i) => Number.isFinite(n) && (i === 0 || n > d.bands[i - 1]!))
    && Array.isArray(d.layers) && d.layers.every((l) => l && typeof l === 'object') && new Set(d.layers.map((l) => l.id)).size === d.layers.length
    && d.layers.every((l) => typeof l.id === 'string' && typeof l.name === 'string' && typeof l.dataset === 'string'
      && typeof l.color === 'string' && typeof l.colorBy === 'string' && typeof l.label === 'string'
      && Number.isFinite(l.size) && l.size >= 2 && l.size <= 12 && Number.isFinite(l.opacity) && l.opacity >= 0 && l.opacity <= 100
      && Array.isArray(l.features) && l.features.every((f) => f && typeof f === 'object') && new Set(l.features.map((f) => f.id)).size === l.features.length
      && l.features.every((f) => typeof f.id === 'string' && f.properties && typeof f.properties === 'object'
        && f.geometry && ['Point', 'LineString', 'Polygon'].includes(f.geometry.type)
        && Array.isArray(f.geometry.coordinates) && f.geometry.coordinates.length > 0
        && f.geometry.coordinates.every((p) => Array.isArray(p) && p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]) && Math.abs(p[0]!) <= 180 && Math.abs(p[1]!) <= 90)));
}

/** Compact a document for storage: untouched built-in layers are restored from code on load. */
export function compactDocument(doc: MapDocument): MapDocument {
  const fresh = createDocument(doc.id);
  return { ...doc, layers: doc.layers.map((l) => {
    const original = fresh.layers.find((x) => x.id === l.id);
    return l.builtin && original && original.features.length === l.features.length && JSON.stringify(original.features) === JSON.stringify(l.features) ? { ...l, features: [] } : l;
  }) };
}
export function restoreDocument(doc: MapDocument): MapDocument {
  const fresh = createDocument(doc.id);
  return { ...doc, layers: doc.layers.map((l) => l.builtin && !l.features.length ? { ...l, features: fresh.layers.find((x) => x.id === l.id)?.features ?? [] } : l) };
}
