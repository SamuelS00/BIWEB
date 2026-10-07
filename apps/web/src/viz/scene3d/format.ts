import type { NetStatus } from '../../net/generate';

export const STATUS_WORD: Record<NetStatus, string> = { normal: 'Normal', warning: 'Atenção', critical: 'Crítico', offline: 'Fora do ar' };
export const fmt = (v: number, digits = 0) => v.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
export const fmtTime = (ts: number) =>
  new Date(ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

export interface Palette {
  surface: string; title: string; subtitle: string; border: string;
  land: string; boundary: string; label: string; grid: string; axis: string;
  normal: string; warning: string; critical: string; offline: string; cat1: string;
}
const FALLBACK: Palette = {
  surface: '#ffffff', title: '#1a1d22', subtitle: '#5c636d', border: '#e1e4e8',
  land: '#eef1f4', boundary: '#d3d9e0', label: '#5c636d', grid: '#eceef0', axis: '#5c636d',
  normal: '#4f76a3', warning: '#b27300', critical: '#c4302b', offline: '#6b7380', cat1: '#1f63a8',
};
const VARS: Record<keyof Palette, string> = {
  surface: '--dash-widget-surface', title: '--dash-title', subtitle: '--dash-subtitle', border: '--dash-widget-border',
  land: '--viz-map-land', boundary: '--viz-map-boundary', label: '--viz-map-label', grid: '--viz-grid', axis: '--viz-axis',
  normal: '--viz-status-normal', warning: '--viz-status-warning', critical: '--viz-status-critical', offline: '--viz-status-offline', cat1: '--viz-cat-1',
};
/** Lê os tokens de runtime no contêiner (o tema do dashboard vem de um ancestral .dash-theme-*). */
export function readPalette(el: Element): Palette {
  const cs = getComputedStyle(el);
  const out = { ...FALLBACK };
  for (const k of Object.keys(VARS) as (keyof Palette)[]) { const v = cs.getPropertyValue(VARS[k]).trim(); if (v) out[k] = v; }
  return out;
}
