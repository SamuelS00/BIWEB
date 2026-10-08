import { fmt } from '../data/query';
import type { Field, Row } from '../data/types';

const cell = (v: unknown) => `"${String(v ?? '').replaceAll('"', '""')}"`;
function download(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name.replace(/[^\w.-]+/g, '_'); a.click(); URL.revokeObjectURL(url);
}
/** Exports exactly what the user sees: visible columns, current filters and sort, values as formatted. */
export function exportRowsCsv(name: string, cols: Field[], rows: Row[]) {
  download(name, [cols.map((c) => cell(c.label)).join(';'), ...rows.map((r) => cols.map((c) => cell(typeof r[c.name] === 'number' ? fmt(r[c.name], c.format) : r[c.name])).join(';'))].join('\n'));
}
export function exportTableCsv(name: string, header: string[], body: (string | number)[][]) {
  download(name, [header.map(cell).join(';'), ...body.map((r) => r.map(cell).join(';'))].join('\n'));
}

import { rowsOf } from '../data/query';
import { getTable } from '../data/registry';
import type { Comp } from '../editor/doc';
import { useEditor } from '../editor/store';

/** CSV of the widget's underlying rows after every active filter (report, page, selection and the widget's own). */
export function exportCompCsv(comp: Comp) {
  if (!comp.data) return;
  const st = useEditor.getState(), t = getTable(comp.data.dataset, comp.data.table);
  const rows = rowsOf(comp.data.dataset, t.id, { rules: st.doc?.rules ?? [], filters: st.filtersFor(comp) });
  exportRowsCsv(`${comp.name}.csv`, t.fields.filter((f) => !f.hidden).slice(0, 14), rows);
  st.toast({ text: `${rows.length.toLocaleString('pt-BR')} linhas exportadas`, tone: 'success' });
}
const STYLE_PROPS = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'font-family', 'font-size', 'font-weight', 'text-anchor'] as const;
/** SVG with the computed colors baked in, so it renders the same outside the app. */
export function exportCompSvg(comp: Comp) {
  const src = document.querySelector<SVGSVGElement>(`[data-comp="${comp.id}"] svg.vz-svg`);
  if (!src) { useEditor.getState().toast({ text: 'Este visual não tem imagem vetorial para exportar', tone: 'info' }); return; }
  const clone = src.cloneNode(true) as SVGSVGElement, a = [src, ...src.querySelectorAll('*')], b = [clone, ...clone.querySelectorAll('*')];
  a.forEach((el, i) => { const cs = getComputedStyle(el), t = b[i] as SVGElement; for (const p of STYLE_PROPS) { const v = cs.getPropertyValue(p); if (v) t.style.setProperty(p, v); } t.removeAttribute('class'); });
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); clone.style.background = getComputedStyle(src.closest('.cf') ?? src).backgroundColor;
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
  const link = document.createElement('a'); link.href = url; link.download = `${comp.name}.svg`.replace(/[^\w.-]+/g, '_'); link.click(); URL.revokeObjectURL(url);
}
