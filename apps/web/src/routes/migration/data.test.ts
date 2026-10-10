import { describe, expect, it } from 'vitest';
import { PROJECTS, RECON, REVIEW, CHECKS, BP_NODES, BP_EDGES } from './analysis';
import { DATASETS, FOLDERS, ITEMS, MAPS, MEASURES, PROCESSES, REPORTS, VISUALS, compatCategories, countsOf, impactOf, overallMix, relatives } from './data';

describe('inventário do projeto de demonstração', () => {
  it('fecha os totais do escopo anunciado', () => {
    expect(REPORTS).toHaveLength(12);
    expect(REPORTS.reduce((a, r) => a + r.pages.length, 0)).toBe(48);
    expect(VISUALS).toHaveLength(284);
    expect(MEASURES).toHaveLength(37);
    expect(DATASETS).toHaveLength(9);
    expect(DATASETS.reduce((a, d) => a + d.tables.length, 0)).toBe(41);
    expect(MAPS).toHaveLength(3);
    expect(PROCESSES).toHaveLength(2);
    expect(FOLDERS.length).toBe(4);
  });
  it('visuais somam por relatório e por página', () => {
    for (const r of REPORTS) for (const [n, c] of r.pages) expect(VISUALS.filter((v) => v.page === `pg:${r.id}:${n.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`)).toHaveLength(c);
  });
  it('distribui os visuais como a análise promete', () => {
    const c = countsOf('visual');
    expect(c.native).toBe(207); expect(c.equivalent).toBe(51); expect(c.redesign).toBe(20); expect(c.review).toBe(6);
  });
  it('é determinístico', () => { expect(VISUALS.slice(0, 12).map((v) => v.name).join('|')).toMatchSnapshot(); });
  it('a mistura geral fica perto de 73/18/7/2', () => {
    const m = overallMix(); console.log(JSON.stringify(m), JSON.stringify(compatCategories().map((c) => [c.id, c.total, c.native, c.equivalent, c.redesign, c.review])));
    expect(Math.abs(m.native - 73)).toBeLessThanOrEqual(1); expect(Math.abs(m.equivalent - 18)).toBeLessThanOrEqual(1); expect(Math.abs(m.redesign - 7)).toBeLessThanOrEqual(1); expect(Math.abs(m.review - 2)).toBeLessThanOrEqual(1);
  });
  it('Net Revenue alimenta o relatório executivo e visuais', () => {
    const im = impactOf('ms:net_revenue');
    expect(im.reports.map((r) => r.id)).toContain('rep:exec'); expect(im.visuals.length).toBeGreaterThan(5);
    expect(relatives('vz:exec:regional:1', 'up').some((x) => x === 'src:oracle' || x.startsWith('src:'))).toBe(true);
  });
  it('referências cruzadas existem', () => {
    for (const r of REVIEW) for (const b of r.blocks) expect(b.id.length).toBeGreaterThan(0);
    for (const r of REVIEW) if (r.itemId) expect(ITEMS.has(r.itemId)).toBe(true);
    for (const c of CHECKS) if (c.itemId) expect(ITEMS.has(c.itemId)).toBe(true);
    for (const n of BP_NODES) if (n.ref) expect(ITEMS.has(n.ref)).toBe(true);
    const ids = new Set(BP_NODES.map((n) => n.id)); for (const [a, b] of BP_EDGES) { expect(ids.has(a)).toBe(true); expect(ids.has(b)).toBe(true); }
    for (const t of RECON) if (t.itemId) expect(ITEMS.has(t.itemId)).toBe(true);
    expect(PROJECTS[0]!.scope.visuals).toBe(284);
  });
});
