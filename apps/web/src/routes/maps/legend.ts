import { COLORS, LIGHT_STATUS, STATUS } from './model';
import type { MapDocument } from './model';
import type { LightsMode } from './LightsLayer';
import { PHASE_COLORS, QUALITY_COLORS } from './renderers';

export interface LegendItem { label: string; color: string; note?: string; ring?: boolean }
export interface Legend { title: string; items: LegendItem[]; hint?: string }

/** Each map explains its own encoding instead of sharing one generic legend. */
export function legendFor(doc: MapDocument, lightsMode: LightsMode): Legend {
  const b = doc.bands, status = (names: string[], notes?: (i: number) => string | undefined) => names.map((label, i) => ({ label, color: COLORS[i]!, note: notes?.(i) }));
  switch (doc.id) {
    case 'network': return { title: 'Condição do sinal', items: status(STATUS, (i) => `${i === 0 ? `< ${b[0]}` : i === 3 ? `≥ ${b[2]}` : `${b[i - 1]}–${b[i]}`} dB`), hint: 'Espessura = gravidade · pulsos = sentido do fluxo' };
    case 'lights': return lightsMode === 'night'
      ? { title: 'Noite em São Paulo', items: [{ label: 'LED', color: '#c4deff' }, { label: 'Sódio', color: '#ff8e2c' }, { label: 'Metálico', color: '#d0ffe2' }, { label: 'Em falha', color: '#ff5a4d', ring: true }, { label: 'Manutenção', color: '#ffb347', ring: true }], hint: 'Brilho acompanha a fotocélula e a dimerização' }
      : { title: lightsMode === 'heat' ? 'Concentração de falhas' : 'Estado da iluminação', items: status(LIGHT_STATUS) };
    case 'coverage': return { title: 'Qualidade do sinal (RSRP)', items: Object.entries(QUALITY_COLORS).map(([label, color]) => ({ label, color })), hint: 'Contorno = ocupação de recursos (PRB)' };
    case 'expansion': return { title: 'Fase da obra', items: Object.entries(PHASE_COLORS).map(([label, color]) => ({ label, color })), hint: 'Tracejado = traçado planejado · cheio = construído' };
    case 'weather': return { title: 'Intensidade e risco', items: [{ label: 'Chuva leve', color: '#3b8cff' }, { label: 'Moderada', color: '#42d17c' }, { label: 'Forte', color: '#f5d33f' }, { label: 'Severa', color: '#ff3c4a' }], hint: 'Tracejado = previsão das próximas 3 h' };
    case 'field': return { title: 'Equipes e chamados', items: [{ label: 'Disponível', color: '#46c28b' }, { label: 'A caminho', color: '#4aa3f0' }, { label: 'Em atendimento', color: '#a78bfa' }, { label: 'Atrasada', color: '#ef5b5b' }, { label: 'Offline', color: '#8b8f99' }], hint: 'Pinos P1–P4 = prioridade do chamado' };
    default: return { title: 'Condição operacional', items: status(STATUS) };
  }
}
