import { describe, it, expect } from 'vitest';
import { buildModel, histogram, boxStats, periodWindow, shiftYear, inWindow, maxDate, refValue, summary } from './model';
import { getTable } from '../../data/registry';
import type { ChartProps } from '../../editor/doc';

const base: ChartProps = { kind: 'combo', x: 'data', y: 'receita', agg: 'sum', sort: 'none', limit: 0, legend: true, labels: false, tooltip: true, grain: 'month', responsive: 'fit', target: 'meta', compare: 'both' };
const ds = 'ds_vendas', rows = getTable(ds, 'vendas').rows, end = maxDate(ds, 'vendas', 'data');

describe('chart model', () => {
  it('builds monthly points with target, previous year, share and extra measures', () => {
    const w = periodWindow('last12m', end)!, cur = inWindow(rows, 'data', w), prev = inWindow(rows, 'data', [shiftYear(w[0]), shiftYear(w[1])]);
    const m = buildModel({ ds, table: 'vendas', rows: cur, prevRows: prev, x: 'data', props: { ...base, tooltipFields: ['margem_pct', 'pedidos'] } });
    expect(m.isTime).toBe(true); expect(m.pts.length).toBeGreaterThanOrEqual(12); expect(m.hasPrev).toBe(true); expect(m.hasTarget).toBe(true);
    const mid = m.pts[6]!; expect(mid.target).toBeGreaterThan(0); expect(mid.prev).toBeGreaterThan(0); expect(mid.extra.margem_pct).toBeGreaterThan(10); expect(mid.extra.pedidos).toBeGreaterThan(0);
    expect(m.pts.reduce((a, b) => a + b.share, 0)).toBeCloseTo(1, 5);
    const yoy = m.pts.reduce((a, b) => a + b.value, 0) / m.pts.reduce((a, b) => a + (b.prev ?? 0), 0); expect(yoy).toBeGreaterThan(1.05); expect(yoy).toBeLessThan(1.3);
  });
  it('splits a category by series and keeps ratio measures correct', () => {
    const m = buildModel({ ds, table: 'vendas', rows, x: 'regiao', props: { ...base, kind: 'stacked', series: 'canal', y: 'margem_pct', grain: 'day', sort: 'value', target: undefined, compare: 'none' } });
    expect(m.seriesKeys.length).toBe(3); expect(m.pts[0]!.value).toBeGreaterThan(10); expect(m.pts[0]!.value).toBeLessThan(50);
  });
  it('explains previous → current as a waterfall, ending on the real totals', () => {
    const w = periodWindow('last12m', end)!, cur = inWindow(rows, 'data', w), prev = inWindow(rows, 'data', [shiftYear(w[0]), shiftYear(w[1])]);
    const m = buildModel({ ds, table: 'vendas', rows: cur, prevRows: prev, x: 'categoria', props: { ...base, kind: 'waterfall', x: 'categoria', grain: 'day', compare: 'prev', target: undefined } });
    expect(m.pts[0]!.label).toBe('Ano anterior'); expect(m.pts.at(-1)!.label).toBe('Atual');
    const deltas = m.pts.slice(1, -1).reduce((a, b) => a + b.value, 0); expect(m.pts[0]!.end! + deltas).toBeCloseTo(m.pts.at(-1)!.end!, 0);
  });
  it('closes a DRE waterfall on subtotal labels', () => {
    const dre = getTable(ds, 'dre').rows.filter((r) => Number(r.data) === Date.UTC(2026, 8, 1));
    const m = buildModel({ ds, table: 'dre', rows: dre, x: 'linha', props: { ...base, kind: 'waterfall', x: 'linha', y: 'valor', grain: 'day', sort: 'none', target: undefined, compare: 'none', totals: ['Receita bruta', 'Receita líquida', 'EBITDA'] } });
    const liq = m.pts.find((q) => q.label === 'Receita líquida')!, bruta = m.pts[0]!, ded = m.pts[1]!;
    expect(liq.total).toBe(true); expect(liq.end).toBeCloseTo(bruta.value + ded.value, 0); expect(m.pts.at(-1)!.total).toBe(true); expect(m.pts.at(-1)!.end!).toBeGreaterThan(0);
  });
});
describe('statistics and periods', () => {
  it('computes histogram, quartiles and outliers', () => {
    const h = histogram([1, 2, 2, 3, 3, 3, 4, 4, 5, 20], 5); expect(h.counts.reduce((a, b) => a + b, 0)).toBe(10); expect(h.counts[0]).toBeGreaterThan(h.counts[4]!);
    const b = boxStats([1, 2, 2, 3, 3, 3, 4, 4, 5, 20]); expect(b.outliers).toEqual([20]); expect(b.median).toBe(3);
  });
  it('anchors windows to the newest date and shifts a year', () => {
    expect(periodWindow('all', end)).toBeNull(); expect(periodWindow('last30d', end)![1]).toBe(end); expect(shiftYear(Date.UTC(2026, 9, 6))).toBe(Date.UTC(2025, 9, 6)); expect(shiftYear(Date.UTC(2024, 1, 29))).toBe(Date.UTC(2023, 1, 28));
  });
  it('resolves reference lines', () => {
    const pts = [1, 2, 3, 4].map((v) => ({ key: v, label: String(v), value: v, series: {}, share: 0, extra: {} }));
    expect(refValue({ id: 'a', kind: 'avg' }, pts)).toBe(2.5); expect(refValue({ id: 'b', kind: 'target', value: 9 }, pts)).toBe(9); expect(refValue({ id: 'c', kind: 'forecast' }, pts)).toBeCloseTo(5, 5); expect(summary([]).n).toBe(0);
  });
});
