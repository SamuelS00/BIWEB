import type { Feature, Geometry } from './model';
import type { Row } from '../../data/types';

export function parseCSV(text: string): Row[] {
  const first = text.replace(/^\uFEFF/, '').split(/\r?\n/)[0] ?? '';
  const delimiter = first.includes(';') ? ';' : ',';
  const records: string[][] = []; let row: string[] = [], value = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i+1] === '"') { value += '"'; i++; } else quoted = !quoted; }
    else if (c === delimiter && !quoted) { row.push(value); value = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) { if (c === '\r' && text[i+1] === '\n') i++; row.push(value); if (row.some(Boolean)) records.push(row); row = []; value = ''; }
    else value += c;
  }
  if (quoted) throw new Error('CSV com aspas não fechadas. Revise o arquivo.');
  row.push(value); if (row.some(Boolean)) records.push(row);
  const headers = records.shift()?.map((h) => h.trim());
  if (!headers?.length || new Set(headers).size !== headers.length || headers.some((h) => !h)) throw new Error('O CSV precisa de cabeçalhos únicos e preenchidos.');
  return records.map((r, i) => { if (r.length !== headers.length) throw new Error(`Linha ${i+2}: número de colunas diferente do cabeçalho.`); return Object.fromEntries(headers.map((h,j) => [h,r[j]!])); });
}
function geometry(type: unknown, coordinates: unknown): Geometry {
  if (!['Point','LineString','Polygon'].includes(String(type))) throw new Error(`Geometria ${String(type)} ainda não suportada. Use Point, LineString ou Polygon.`);
  const list = type === 'Point' ? [coordinates] : type === 'Polygon' ? (coordinates as unknown[])?.[0] : coordinates;
  if (!Array.isArray(list) || !list.length || list.some((p) => !Array.isArray(p) || p.length < 2 || typeof p[0] !== 'number' || typeof p[1] !== 'number' || !Number.isFinite(p[0]) || !Number.isFinite(p[1]) || Math.abs(p[0]) > 180 || Math.abs(p[1]) > 90)) throw new Error('Coordenadas inválidas. Use WGS84 (longitude, latitude).');
  if (type === 'LineString' && list.length < 2) throw new Error('Uma linha precisa de ao menos dois pontos.');
  if (type === 'Polygon' && ((coordinates as unknown[]).length > 1 || list.length < 4 || JSON.stringify(list[0]) !== JSON.stringify(list.at(-1)))) throw new Error('Use polígonos fechados sem anéis internos nesta versão.');
  return { type: type as Geometry['type'], coordinates: list as number[][] };
}
export function parseGeoJSON(text: string): Feature[] {
  const json = JSON.parse(text);
  const list = json.type === 'FeatureCollection' ? json.features : json.type === 'Feature' ? [json] : [{ geometry: json }];
  if (!Array.isArray(list)) throw new Error('FeatureCollection inválida.');
  return list.map((f: { id?: string; geometry?: { type: unknown; coordinates: unknown }; properties?: Row }, i: number) => {
    if (!f.geometry) throw new Error(`Feição ${i+1} sem geometria.`);
    const g = geometry(f.geometry.type, f.geometry.coordinates);
    return { id: String(f.id ?? f.properties?.id ?? `IMPORT-${i+1}`), geometry: g, properties: { ...f.properties, ...(g.type === 'Point' ? { longitude: g.coordinates[0]![0], latitude: g.coordinates[0]![1] } : {}) } };
  });
}
export function parseKML(text: string): Feature[] {
  const xml = new DOMParser().parseFromString(text, 'application/xml');
  if (xml.querySelector('parsererror')) throw new Error('KML inválido.');
  const placemarks = [...xml.getElementsByTagNameNS('*', 'Placemark')];
  return placemarks.map((p, i) => {
    if (p.getElementsByTagNameNS('*', 'MultiGeometry').length) throw new Error('Separe MultiGeometry em feições individuais antes de importar.');
    const type = (['Point','LineString','Polygon'] as const).find((t) => p.getElementsByTagNameNS('*', t).length);
    if (!type) throw new Error(`Placemark ${i+1} sem geometria suportada.`);
    if (p.getElementsByTagNameNS('*', 'innerBoundaryIs').length) throw new Error('Polígonos com anéis internos não são suportados nesta versão.');
    const coords = p.getElementsByTagNameNS('*', 'coordinates')[0]?.textContent?.trim().split(/\s+/).map((c) => c.split(',').slice(0,2).map(Number)) ?? [];
    return { id: p.id || `KML-${i+1}`, geometry: geometry(type, type === 'Point' ? coords[0] : type === 'Polygon' ? [coords] : coords), properties: { nome: p.getElementsByTagNameNS('*','name')[0]?.textContent ?? `Feição ${i+1}` } };
  });
}
