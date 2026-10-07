/**
 * Leitura e interpretação de fontes no assistente de importação.
 * Arquivos pequenos (CSV, JSON, GeoJSON, KML, KMZ) são lidos de verdade no navegador; o arquivo de exemplo e as
 * conexões (API, banco) usam a Rede Metropolitana SP. O dataset criado no protótipo é sempre o de exemplo.
 */
import { network } from '../data/registry';
import type { LonLat, NetStatus } from '../net/generate';

export type Fmt = 'CSV' | 'XLSX' | 'JSON' | 'GeoJSON' | 'KML' | 'KMZ' | 'SHP' | 'API' | 'DB';
export type TargetId = 'nome' | 'tipo' | 'status' | 'geometria' | 'capacidade' | 'proprietario' | 'atenuacao' | 'id' | 'keep' | 'ignore';

export interface GeoPt { lon: number; lat: number; name: string; kind: 'POP' | 'Torre' | 'Equipamento' | 'Ponto' }
export interface GeoLine { coords: LonLat[]; status: NetStatus | 'none'; name: string }
export interface GeoPoly { coords: LonLat[]; name: string }
export interface GeoData { points: GeoPt[]; lines: GeoLine[]; polygons: GeoPoly[] }

export interface SourceField { name: string; sample: string; suggested: TargetId; synthetic?: boolean }
export interface Analysis {
  origin: 'demo' | 'file' | 'connection';
  format: Fmt;
  fileName: string;
  sizeLabel?: string;
  /** Tabular (CSV/JSON): linhas e colunas; geográfico: contagem por geometria. */
  rows: number; columns: number;
  points: number; lines: number; polygons: number; routes: number;
  lat: boolean; lon: boolean; alt: boolean;
  geoColumns: string[];
  properties: string[];
  idPatterns: { pattern: string; count: number }[];
  network: { origem: string; destino: string } | null;
  fields: SourceField[];
  geo: GeoData;
  resultLine: string;
  tables: { name: string; count: number; kind: 'point' | 'line' | 'polygon' | 'table' }[];
}

export const nf = (n: number) => n.toLocaleString('pt-BR');
export const plural = (n: number, one: string, many: string) => `${nf(n)} ${n === 1 ? one : many}`;

export const FILE_FORMATS: Record<string, Fmt> = { csv: 'CSV', tsv: 'CSV', txt: 'CSV', xlsx: 'XLSX', xls: 'XLSX', json: 'JSON', geojson: 'GeoJSON', kml: 'KML', kmz: 'KMZ', shp: 'SHP', zip: 'SHP' };
export function formatOf(fileName: string): Fmt | null {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return FILE_FORMATS[ext] ?? null;
}
export const sizeLabel = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1024 ** 2 ? `${(bytes / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} KB` : `${(bytes / 1024 ** 2).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`;

/* ---------------- heurísticas ---------------- */

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const LAT = ['lat', 'latitude', 'y', 'coordy'];
const LON = ['lon', 'lng', 'long', 'longitude', 'x', 'coordx'];
const ALT = ['alt', 'altitude', 'elevacao', 'elevation', 'z', 'alturam', 'altura'];
const findCol = (cols: string[], names: string[]) => cols.find((c) => names.includes(norm(c)));

const SUGGEST: [TargetId, string[]][] = [
  ['id', ['id', 'codigo', 'cod', 'identificador', 'uid', 'fid', 'objectid']],
  ['nome', ['name', 'nome', 'title', 'titulo', 'label', 'descricao']],
  ['tipo', ['type', 'tipo', 'kind', 'categoria', 'classe']],
  ['status', ['status', 'situacao', 'estado', 'state']],
  ['geometria', ['geometry', 'geometria', 'geom', 'wkt', 'coordinates', 'coordenadas']],
  ['capacidade', ['capacity', 'capacidade', 'banda', 'bandwidth', 'capacidadegbps']],
  ['proprietario', ['owner', 'proprietario', 'dono', 'responsavel']],
  ['atenuacao', ['attenuation', 'atenuacao', 'atenuacaodb', 'perda', 'loss', 'db']],
];
export function suggestTarget(name: string, used: Set<TargetId>): TargetId {
  const n = norm(name);
  for (const [t, names] of SUGGEST) if (!used.has(t) && names.includes(n)) return t;
  return 'keep';
}
function suggestAll(fields: { name: string; sample: string; synthetic?: boolean }[]): SourceField[] {
  const used = new Set<TargetId>();
  return fields.map((f) => { const s = suggestTarget(f.name, used); if (s !== 'keep') used.add(s); return { ...f, suggested: s }; });
}

/** Padrões de identificador: dígitos viram #, prefixos com muitas variações viram "*". */
export function idPatterns(values: string[], top = 4): { pattern: string; count: number }[] {
  const sig = new Map<string, number>();
  for (const v of values) { const s = v.replace(/\d/g, '#'); sig.set(s, (sig.get(s) ?? 0) + 1); }
  const out = new Map<string, number>();
  for (const [s, c] of sig) {
    if (c >= 3 && /#/.test(s)) { out.set(s, (out.get(s) ?? 0) + c); continue; }
    const m = /^([^\s\-_]+)([\s\-_])/.exec(s);
    const key = m ? `${m[1]}${m[2]}*` : s;
    out.set(key, (out.get(key) ?? 0) + c);
  }
  return [...out].map(([pattern, count]) => ({ pattern, count })).filter((p) => p.count >= 2).sort((a, b) => b.count - a.count).slice(0, top);
}

const NET_PAIRS: [string, string][] = [['origem', 'destino'], ['from', 'to'], ['source', 'target'], ['origin', 'destination'], ['a', 'b'], ['pontaa', 'pontab'], ['noa', 'nob']];
function detectNetworkProps(props: string[]): { origem: string; destino: string } | null {
  for (const [a, b] of NET_PAIRS) {
    const pa = props.find((p) => norm(p) === a), pb = props.find((p) => norm(p) === b);
    if (pa && pb) return { origem: pa, destino: pb };
  }
  return null;
}
/** Sem propriedades origem/destino: é rede se a maioria das linhas termina em pontos conhecidos. */
function detectNetworkGeometry(geo: GeoData): boolean {
  if (geo.lines.length < 2 || geo.points.length < 2) return false;
  const key = (c: LonLat) => `${c[0].toFixed(4)},${c[1].toFixed(4)}`;
  const pts = new Set(geo.points.map((p) => key([p.lon, p.lat])));
  let hit = 0;
  for (const l of geo.lines) { const a = l.coords[0], b = l.coords[l.coords.length - 1]; if (a && b && pts.has(key(a)) && pts.has(key(b))) hit++; }
  return hit / geo.lines.length >= 0.5;
}
const statusOf = (v: unknown): NetStatus | 'none' => {
  const s = norm(String(v ?? ''));
  if (['normal', 'ok', 'ativo', 'up', 'operacional'].includes(s)) return 'normal';
  if (['warning', 'alerta', 'atencao', 'degradado'].includes(s)) return 'warning';
  if (['critical', 'critico', 'falha', 'down'].includes(s)) return 'critical';
  if (['offline', 'inativo', 'desligado'].includes(s)) return 'offline';
  return 'none';
};
const sample = (v: unknown) => { if (v == null) return ''; const s = typeof v === 'object' ? JSON.stringify(v) : String(v); return s.length > 40 ? `${s.slice(0, 39)}…` : s; };
const fmtCoord = (c: LonLat) => { const f = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }); return `${f(c[1])}; ${f(c[0])}`; };

/* ---------------- exemplo: rede_sp.kmz ---------------- */

export function demoAnalysis(origin: 'demo' | 'connection' = 'demo', format: Fmt = 'KMZ', fileName = 'rede_sp.kmz'): Analysis {
  const n = network();
  const link = n.links[0]!, node = n.nodes.find((x) => x.tipo === 'Torre') ?? n.nodes[0]!;
  const fields: SourceField[] = [
    { name: 'Name', sample: node.nome, suggested: 'nome' },
    { name: 'Type', sample: node.tipo, suggested: 'tipo' },
    { name: 'Status', sample: node.status, suggested: 'status' },
    { name: 'Geometry', sample: `Point (${fmtCoord([node.lon, node.lat])})`, suggested: 'geometria' },
    { name: 'Capacity', sample: `${link.capacidade} Gbps`, suggested: 'capacidade' },
    { name: 'Owner', sample: link.proprietario, suggested: 'proprietario' },
    { name: 'Attenuation', sample: `${link.atenuacao_dB.toLocaleString('pt-BR')} dB`, suggested: 'atenuacao' },
    { name: 'Id', sample: link.id, suggested: 'id' },
  ];
  return {
    origin, format, fileName, sizeLabel: origin === 'demo' ? '2,4 MB' : undefined,
    rows: 0, columns: 0, points: n.nodes.length, lines: n.links.length, polygons: n.regions.length, routes: n.routes.length,
    lat: true, lon: true, alt: true, geoColumns: ['lat', 'lon', 'alt', 'geometria'],
    properties: ['Id', 'Name', 'Type', 'Status', 'Capacity', 'Owner', 'Attenuation', 'origem', 'destino', 'regiao', 'tecnologia'],
    idPatterns: idPatterns([...n.nodes.map((x) => x.id), ...n.links.map((x) => x.id)]),
    network: { origem: 'origem', destino: 'destino' },
    fields,
    geo: {
      points: n.nodes.map((x) => ({ lon: x.lon, lat: x.lat, name: x.nome, kind: x.tipo })),
      lines: n.links.map((l) => ({ coords: l.geometria, status: l.status, name: l.nome })),
      polygons: n.regions.map((r) => ({ coords: r.poligono, name: r.nome })),
    },
    resultLine: `Encontramos ${plural(n.nodes.length, 'nó', 'nós')} · ${plural(n.links.length, 'enlace', 'enlaces')} · ${plural(n.regions.length, 'região', 'regiões')} · ${plural(n.routes.length, 'rota', 'rotas')}`,
    tables: [
      { name: 'Nós', count: n.nodes.length, kind: 'point' }, { name: 'Enlaces', count: n.links.length, kind: 'line' },
      { name: 'Regiões', count: n.regions.length, kind: 'polygon' }, { name: 'Rotas', count: n.routes.length, kind: 'line' },
    ],
  };
}

/* ---------------- tabular: CSV e JSON ---------------- */

function splitCsvLine(line: string, d: string): string[] {
  const out: string[] = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === d) { out.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  out.push(cur.trim());
  return out;
}
const toNum = (v: unknown) => { if (typeof v === 'number') return v; if (typeof v !== 'string' || !v.trim()) return NaN; return Number(v.replace(',', '.')); };

function tabular(fileName: string, format: Fmt, size: number, cols: string[], records: Record<string, unknown>[]): Analysis {
  const latC = findCol(cols, LAT), lonC = findCol(cols, LON), altC = findCol(cols, ALT);
  const points: GeoPt[] = [];
  const nameC = cols.find((c) => ['name', 'nome', 'title', 'titulo', 'label'].includes(norm(c)));
  if (latC && lonC) for (const r of records) {
    const la = toNum(r[latC]), lo = toNum(r[lonC]);
    if (Number.isFinite(la) && Number.isFinite(lo) && Math.abs(la) <= 90 && Math.abs(lo) <= 180) points.push({ lat: la, lon: lo, name: nameC ? String(r[nameC] ?? '') : '', kind: 'Ponto' });
  }
  const first = records[0] ?? {};
  const raw: { name: string; sample: string }[] = cols.filter((c) => c !== latC && c !== lonC).map((c) => ({ name: c, sample: sample(first[c]) }));
  if (latC && lonC) raw.push({ name: `${latC}, ${lonC}`, sample: points[0] ? fmtCoord([points[0].lon, points[0].lat]) : '' });
  const fields = suggestAll(raw);
  const geomRow = fields.find((f) => f.name === `${latC}, ${lonC}`);
  if (geomRow && !fields.some((f) => f !== geomRow && f.suggested === 'geometria')) geomRow.suggested = 'geometria';
  if (!fields.some((f) => f.suggested === 'id')) fields.push({ name: '#linha (gerado)', sample: '1, 2, 3…', suggested: 'id', synthetic: true });
  const idC = fields.find((f) => f.suggested === 'id' && !f.synthetic)?.name ?? nameC;
  const network = detectNetworkProps(cols);
  const base = fileName.replace(/\.[^.]+$/, '');
  return {
    origin: 'file', format, fileName, sizeLabel: sizeLabel(size),
    rows: records.length, columns: cols.length, points: points.length, lines: 0, polygons: 0, routes: 0,
    lat: !!latC, lon: !!lonC, alt: !!altC, geoColumns: [latC, lonC, altC].filter((x): x is string => !!x),
    properties: cols, idPatterns: idC ? idPatterns(records.map((r) => String(r[idC] ?? '')).filter(Boolean)) : [],
    network, fields, geo: { points, lines: [], polygons: [] },
    resultLine: `Encontramos ${plural(records.length, 'linha', 'linhas')} e ${plural(cols.length, 'coluna', 'colunas')}${points.length ? ` · ${plural(points.length, 'ponto', 'pontos')} com coordenadas` : ''}`,
    tables: [{ name: base || 'Registros', count: records.length, kind: points.length ? 'point' : 'table' }],
  };
}

function parseCsv(text: string, fileName: string, size: number): Analysis {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  const head = lines[0];
  if (!head) throw new Error('o arquivo está vazio');
  const d = [',', ';', '\t', '|'].map((c) => [c, head.split(c).length] as const).sort((a, b) => b[1] - a[1])[0]![0];
  const cols = splitCsvLine(head, d).map((c, i) => c || `coluna_${i + 1}`);
  if (cols.length < 2) throw new Error('não encontramos colunas separadas por vírgula, ponto e vírgula ou tabulação');
  const records = lines.slice(1).map((l) => { const v = splitCsvLine(l, d); return Object.fromEntries(cols.map((c, i) => [c, v[i] ?? ''])); });
  return tabular(fileName, 'CSV', size, cols, records);
}

/* ---------------- GeoJSON ---------------- */

type Json = unknown;
const isObj = (v: Json): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const asLL = (c: unknown): LonLat | null => Array.isArray(c) && typeof c[0] === 'number' && typeof c[1] === 'number' ? [c[0], c[1]] : null;
const asLine = (c: unknown): LonLat[] => Array.isArray(c) ? c.map(asLL).filter((x): x is LonLat => !!x) : [];

function parseGeoJson(obj: Record<string, unknown>, fileName: string, size: number): Analysis {
  const feats = obj.type === 'FeatureCollection' && Array.isArray(obj.features) ? obj.features.filter(isObj) : obj.type === 'Feature' ? [obj] : [];
  if (!feats.length) throw new Error('nenhuma feição encontrada na FeatureCollection');
  const geo: GeoData = { points: [], lines: [], polygons: [] };
  const props = new Set<string>(); let alt = false; let pts = 0, lns = 0, pls = 0;
  const firstProps: Record<string, unknown> = {};
  const ids: string[] = [];
  for (const f of feats) {
    const p = isObj(f.properties) ? f.properties : {};
    for (const [k, v] of Object.entries(p)) { props.add(k); if (!(k in firstProps)) firstProps[k] = v; }
    const name = String(p.name ?? p.nome ?? p.Name ?? f.id ?? '');
    if (f.id != null) ids.push(String(f.id)); else if (p.id != null) ids.push(String(p.id));
    const g = isObj(f.geometry) ? f.geometry : null;
    if (!g) continue;
    const c = g.coordinates;
    const each = (type: string, cc: unknown) => {
      if (type === 'Point') { const ll = asLL(cc); if (ll) { pts++; geo.points.push({ lon: ll[0], lat: ll[1], name, kind: 'Ponto' }); if (Array.isArray(cc) && cc.length > 2) alt = true; } }
      else if (type === 'LineString') { lns++; geo.lines.push({ coords: asLine(cc), status: statusOf(p.status ?? p.Status), name }); }
      else if (type === 'Polygon') { pls++; geo.polygons.push({ coords: Array.isArray(cc) ? asLine(cc[0]) : [], name }); }
    };
    if (g.type === 'Point' || g.type === 'LineString' || g.type === 'Polygon') each(g.type, c);
    else if (g.type === 'MultiPoint' && Array.isArray(c)) c.forEach((x) => each('Point', x));
    else if (g.type === 'MultiLineString' && Array.isArray(c)) c.forEach((x) => each('LineString', x));
    else if (g.type === 'MultiPolygon' && Array.isArray(c)) c.forEach((x) => each('Polygon', x));
  }
  const properties = [...props];
  const fields = suggestAll([...properties.map((k) => ({ name: k, sample: sample(firstProps[k]) })), { name: 'geometry', sample: geo.points[0] ? `Point (${fmtCoord([geo.points[0].lon, geo.points[0].lat])})` : geo.lines[0] ? 'LineString' : 'Polygon' }]);
  if (!fields.some((f) => f.suggested === 'id')) fields.push({ name: 'id da feição (gerado)', sample: '1, 2, 3…', suggested: 'id', synthetic: true });
  const network = detectNetworkProps(properties) ?? (detectNetworkGeometry(geo) ? { origem: 'extremidade inicial', destino: 'extremidade final' } : null);
  return {
    origin: 'file', format: 'GeoJSON', fileName, sizeLabel: sizeLabel(size), rows: feats.length, columns: properties.length,
    points: pts, lines: lns, polygons: pls, routes: 0, lat: pts + lns + pls > 0, lon: pts + lns + pls > 0, alt,
    geoColumns: ['geometry'], properties, idPatterns: idPatterns(ids.length ? ids : geo.points.map((p) => p.name).filter(Boolean)), network, fields, geo,
    resultLine: `Encontramos ${plural(pts, 'ponto', 'pontos')} · ${plural(lns, 'linha', 'linhas')} · ${plural(pls, 'polígono', 'polígonos')}`,
    tables: geoTables(pts, lns, pls, !!network),
  };
}
const geoTables = (pts: number, lns: number, pls: number, net: boolean): Analysis['tables'] => [
  ...(pts ? [{ name: net ? 'Nós' : 'Pontos', count: pts, kind: 'point' as const }] : []),
  ...(lns ? [{ name: net ? 'Enlaces' : 'Linhas', count: lns, kind: 'line' as const }] : []),
  ...(pls ? [{ name: 'Regiões', count: pls, kind: 'polygon' as const }] : []),
];

/* ---------------- KML e KMZ ---------------- */

/** Lê o diretório central do ZIP e devolve o primeiro .kml (doc.kml de preferência), descompactado. */
export async function unzipKml(buf: ArrayBuffer): Promise<string> {
  const v = new DataView(buf);
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 22 - 65535); i--) if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('o arquivo não é um KMZ válido (ZIP sem diretório central)');
  const count = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const dec = new TextDecoder();
  const entries: { name: string; method: number; size: number; local: number }[] = [];
  for (let k = 0; k < count; k++) {
    if (p + 46 > buf.byteLength || v.getUint32(p, true) !== 0x02014b50) throw new Error('diretório do ZIP corrompido');
    const method = v.getUint16(p + 10, true), size = v.getUint32(p + 20, true);
    const nl = v.getUint16(p + 28, true), el = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), local = v.getUint32(p + 42, true);
    entries.push({ name: dec.decode(new Uint8Array(buf, p + 46, nl)), method, size, local });
    p += 46 + nl + el + cl;
  }
  const e = entries.find((x) => /(^|\/)doc\.kml$/i.test(x.name)) ?? entries.find((x) => /\.kml$/i.test(x.name));
  if (!e) throw new Error('nenhum arquivo .kml dentro do KMZ');
  if (v.getUint32(e.local, true) !== 0x04034b50) throw new Error('cabeçalho local do ZIP inválido');
  const start = e.local + 30 + v.getUint16(e.local + 26, true) + v.getUint16(e.local + 28, true);
  const data = new Uint8Array(buf, start, e.size);
  if (e.method === 0) return dec.decode(data);
  if (e.method !== 8) throw new Error(`método de compressão ${e.method} não suportado`);
  if (typeof DecompressionStream === 'undefined') throw new Error('este navegador não descompacta ZIP');
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Response(stream).text();
}

const kids = (el: Element, tag: string) => Array.from(el.getElementsByTagName(tag));
const firstText = (el: Element, tag: string) => el.getElementsByTagName(tag)[0]?.textContent?.trim() ?? '';
function coordsOf(el: Element): { coords: LonLat[]; alt: boolean } {
  const t = firstText(el, 'coordinates');
  let alt = false;
  const coords = t.split(/\s+/).filter(Boolean).map((tok) => { const n = tok.split(',').map(Number); if (n.length > 2 && n[2] !== 0) alt = true; return [n[0], n[1]] as LonLat; })
    .filter((c) => Number.isFinite(c[0]) && Number.isFinite(c[1]));
  return { coords, alt };
}

export function parseKml(text: string, fileName: string, size: number, format: 'KML' | 'KMZ'): Analysis {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('o KML não é um XML válido');
  const marks = kids(doc.documentElement, 'Placemark');
  if (!marks.length) throw new Error('nenhum Placemark encontrado no KML');
  const geo: GeoData = { points: [], lines: [], polygons: [] };
  const props = new Set<string>(); const firstVals: Record<string, string> = {}; let alt = false; const names: string[] = [];
  for (const m of marks) {
    const name = firstText(m, 'name');
    if (name) names.push(name);
    const pv: Record<string, string> = {};
    for (const d of [...kids(m, 'Data'), ...kids(m, 'SimpleData')]) {
      const k = d.getAttribute('name'); if (!k) continue;
      const val = (d.tagName === 'Data' ? firstText(d, 'value') : d.textContent?.trim()) ?? '';
      props.add(k); pv[k] = val; if (!(k in firstVals)) firstVals[k] = val;
    }
    for (const g of kids(m, 'Point')) { const c = coordsOf(g); alt ||= c.alt; const ll = c.coords[0]; if (ll) geo.points.push({ lon: ll[0], lat: ll[1], name, kind: 'Ponto' }); }
    for (const g of kids(m, 'LineString')) { const c = coordsOf(g); alt ||= c.alt; geo.lines.push({ coords: c.coords, status: statusOf(pv.status ?? pv.Status), name }); }
    for (const g of kids(m, 'Polygon')) { const outer = g.getElementsByTagName('outerBoundaryIs')[0] ?? g; const c = coordsOf(outer); alt ||= c.alt; geo.polygons.push({ coords: c.coords, name }); }
  }
  const properties = ['name', ...props];
  const first = marks[0]!;
  const fields = suggestAll([
    { name: 'name', sample: firstText(first, 'name') }, ...[...props].map((k) => ({ name: k, sample: sample(firstVals[k]) })),
    { name: 'coordinates', sample: geo.points[0] ? `Point (${fmtCoord([geo.points[0].lon, geo.points[0].lat])})` : geo.lines[0] ? 'LineString' : 'Polygon' },
  ]);
  const coordRow = fields[fields.length - 1]!;
  if (!fields.some((f) => f.suggested === 'geometria')) coordRow.suggested = 'geometria';
  if (!fields.some((f) => f.suggested === 'id')) fields.push({ name: 'Placemark id (gerado)', sample: '1, 2, 3…', suggested: 'id', synthetic: true });
  const network = detectNetworkProps([...props]) ?? (detectNetworkGeometry(geo) ? { origem: 'extremidade inicial', destino: 'extremidade final' } : null);
  const pts = geo.points.length, lns = geo.lines.length, pls = geo.polygons.length;
  return {
    origin: 'file', format, fileName, sizeLabel: sizeLabel(size), rows: marks.length, columns: properties.length,
    points: pts, lines: lns, polygons: pls, routes: 0, lat: pts + lns + pls > 0, lon: pts + lns + pls > 0, alt,
    geoColumns: ['coordinates'], properties, idPatterns: idPatterns(names), network, fields, geo,
    resultLine: `Encontramos ${plural(pts, 'ponto', 'pontos')} · ${plural(lns, 'linha', 'linhas')} · ${plural(pls, 'polígono', 'polígonos')}`,
    tables: geoTables(pts, lns, pls, !!network),
  };
}

/* ---------------- entrada ---------------- */

export const MAX_BYTES = 25 * 1024 ** 2;
/** Lê um arquivo real. Lança Error com mensagem em pt-BR (minúscula, sem ponto final) quando não consegue. */
export async function analyzeFile(file: File): Promise<Analysis> {
  const format = formatOf(file.name);
  if (!format) throw new Error('formato não reconhecido');
  if (file.size > MAX_BYTES) throw new Error(`o protótipo lê arquivos de até ${sizeLabel(MAX_BYTES)}`);
  if (format === 'KMZ') return parseKml(await unzipKml(await file.arrayBuffer()), file.name, file.size, 'KMZ');
  const text = await file.text();
  if (format === 'KML') return parseKml(text, file.name, file.size, 'KML');
  if (format === 'CSV') return parseCsv(text, file.name, file.size);
  if (format === 'JSON' || format === 'GeoJSON') {
    let obj: unknown;
    try { obj = JSON.parse(text); } catch { throw new Error('o JSON não é válido'); }
    if (isObj(obj) && (obj.type === 'FeatureCollection' || obj.type === 'Feature')) return parseGeoJson(obj, file.name, file.size);
    const arr = Array.isArray(obj) ? obj : isObj(obj) ? Object.values(obj).find(Array.isArray) : null;
    if (!arr || !arr.length) throw new Error('esperávamos uma lista de registros ou uma FeatureCollection');
    const records = arr.filter(isObj);
    if (!records.length) throw new Error('a lista não contém objetos');
    const cols = [...new Set(records.slice(0, 200).flatMap((r) => Object.keys(r)))];
    return tabular(file.name, 'JSON', file.size, cols, records);
  }
  throw new Error('formato sem leitura no protótipo');
}

export const STAGES: Record<Fmt, string[]> = {
  KMZ: ['Lendo arquivo', 'Descompactando KMZ', 'Lendo KML', 'Detectando geometrias'],
  KML: ['Lendo arquivo', 'Lendo KML', 'Lendo propriedades', 'Detectando geometrias'],
  CSV: ['Lendo arquivo', 'Detectando separador', 'Lendo linhas', 'Detectando tipos e coordenadas'],
  JSON: ['Lendo arquivo', 'Validando JSON', 'Lendo registros', 'Detectando tipos e coordenadas'],
  GeoJSON: ['Lendo arquivo', 'Validando GeoJSON', 'Lendo feições', 'Detectando geometrias'],
  XLSX: ['Lendo arquivo', 'Lendo planilhas', 'Lendo linhas', 'Detectando tipos'],
  SHP: ['Lendo arquivo', 'Lendo geometrias', 'Lendo atributos', 'Detectando projeção'],
  API: ['Conectando', 'Autenticando', 'Lendo esquema', 'Detectando geometrias'],
  DB: ['Conectando', 'Lendo esquema', 'Amostrando tabelas', 'Detectando geometrias'],
};
