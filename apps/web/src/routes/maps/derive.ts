import type { Feature, Layer, MapDocument, ReportId } from './model';
import { STATUS, severity } from './model';
import { phaseAt, sectorState, weatherRisk } from './data-extra';

/**
 * Time-aware properties. Features hold their base state; the timeline (hour or week) derives the state
 * shown on the map, so every filter, legend and metric works on what the user is actually seeing.
 */
export function deriveFeature(id: ReportId, doc: MapDocument, layer: Layer, f: Feature, time: number): Feature {
  const p = f.properties;
  if (typeof p.atenuacao_a === 'number') return { ...f, properties: { ...p, status: STATUS[severity(f, doc.bands)] } };
  if (id === 'coverage' && layer.render === 'sector') {
    const s = sectorState(Number(p.ocupacao_base), Number(p.rsrp_dbm), time);
    return { ...f, properties: { ...p, ocupacao_prb: s.prb, qualidade: s.qualidade, status: s.status } };
  }
  if (id === 'expansion' && (p.inicio_semana != null)) {
    const delay = Number(p.atraso_sem ?? 0), start = Number(p.inicio_semana) + delay;
    const { pct, fase } = phaseAt(time, start, Number(p.duracao_sem ?? 8));
    const blocked = delay > 0 && fase !== 'Concluído' && time >= Number(p.inicio_semana) - 3;
    const status = layer.render === 'progress' ? (blocked ? (delay >= 3 ? 'Crítico' : 'Atenção') : 'Normal') : String(p.status);
    return { ...f, properties: { ...p, pct: Math.round(pct * 100), fase, status, bloqueada: blocked } };
  }
  if (id === 'weather' && layer.render !== 'storm' && f.geometry.type === 'Point') {
    const c = f.geometry.coordinates[0]!, r = weatherRisk(c[0]!, c[1]!, time);
    return { ...f, properties: { ...p, status: r.status, chuva_mm_h: r.mmh, eta_impacto_min: r.eta ?? '', celula: r.storm, risco: ['Baixo', 'Moderado', 'Alto', 'Severo'][r.sev] } };
  }
  return f;
}
