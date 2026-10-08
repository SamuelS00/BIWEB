import { describe, it, expect } from 'vitest';
import { buildVendasDataset } from './vendas';
import { aggregate } from './query';
import { useData } from './registry';

describe('vendas dataset', () => {
  const t0 = performance.now(), ds = buildVendasDataset(), ms = performance.now() - t0;
  const vendas = ds.tables.find((t) => t.id === 'vendas')!;
  it('is built quickly and has 24 months of daily rows', () => { expect(ms).toBeLessThan(800); expect(vendas.rows.length).toBe(730 * 5 * 3 * 4); });
  it('registers next to the network dataset', () => { expect(useData.getState().datasets.map((d) => d.id)).toContain('ds_vendas'); });
  it('has plausible annual revenue, growth year over year and margin', () => {
    const byYear = aggregate(vendas.rows, { ds: 'ds_vendas', table: 'vendas', groupBy: 'data', measure: 'receita', agg: 'sum', grain: 'year', sort: 'none' });
    expect(byYear.length).toBeGreaterThanOrEqual(2);
    const last12 = vendas.rows.filter((r) => Number(r.data) > Date.UTC(2025, 9, 6)).reduce((a, r) => a + Number(r.receita), 0), prev12 = vendas.rows.filter((r) => Number(r.data) <= Date.UTC(2025, 9, 6)).reduce((a, r) => a + Number(r.receita), 0);
    expect(last12).toBeGreaterThan(5e8); expect(last12).toBeLessThan(1.2e9); expect(last12 / prev12).toBeGreaterThan(1.05); expect(last12 / prev12).toBeLessThan(1.3);
  });
  it('computes calculated fields as ratios of sums', () => {
    const m = aggregate(vendas.rows, { ds: 'ds_vendas', table: 'vendas', groupBy: 'categoria', measure: 'margem_pct', agg: 'sum' });
    expect(m.length).toBe(4); for (const s of m) { expect(s.value).toBeGreaterThan(10); expect(s.value).toBeLessThan(50); }
    const total = aggregate(vendas.rows, { ds: 'ds_vendas', table: 'vendas', measure: 'atingimento', agg: 'sum' })[0]!.value; expect(total).toBeGreaterThan(85); expect(total).toBeLessThan(110);
  });
  it('groups dates by month, quarter and year', () => {
    const m = aggregate(vendas.rows, { ds: 'ds_vendas', table: 'vendas', groupBy: 'data', measure: 'receita', agg: 'sum', grain: 'month', sort: 'none' });
    expect(m.length).toBe(25); expect(m.every((x, i) => i === 0 || Number(x.key) > Number(m[i - 1]!.key))).toBe(true);
  });
});
