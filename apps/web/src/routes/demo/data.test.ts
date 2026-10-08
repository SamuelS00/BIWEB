import { describe, it, expect } from 'vitest';
import { analyse, anomalies, burnWindows, funnelCounts, retention, slaState, SERVICES, COHORTS } from './data';

describe('anomaly detection', () => {
  it('flags the injected burst and groups it into one anomaly with a higher score than noise', () => {
    const found = anomalies(analyse('Oeste', 'Latência', 40, 96, 3.2, 0));
    expect(found.length).toBeGreaterThan(0); expect(found[0]!.peak.value).toBeGreaterThan(80); expect(found[0]!.duration).toBeGreaterThanOrEqual(10);
  });
  it('detects fewer anomalies as sensitivity gets stricter, and is reproducible', () => {
    const loose = anomalies(analyse('Leste', 'Latência', 40, 96, 2, 0)).length, strict = anomalies(analyse('Leste', 'Latência', 40, 96, 5, 0)).length;
    expect(loose).toBeGreaterThanOrEqual(strict); expect(anomalies(analyse('Leste', 'Latência', 40, 96, 3, 0))).toEqual(anomalies(analyse('Leste', 'Latência', 40, 96, 3, 0)));
  });
  it('treats a drop in availability as the bad direction', () => {
    const pts = analyse('Oeste', 'Disponibilidade', 40, 96, 3.2, 0); expect(pts.some((p) => p.flagged)).toBe(true);
  });
});
describe('error budget', () => {
  it('ranks the gateway as the most consumed and critical, others stay healthy', () => {
    const states = SERVICES.map((s) => ({ s, st: slaState(s) })), top = [...states].sort((a, b) => b.st.consumed - a.st.consumed)[0]!;
    expect(top.s.id).toBe('gateway'); expect(top.st.status).toBe('Crítico'); expect(states.filter((x) => x.st.status === 'Saudável').length).toBeGreaterThanOrEqual(3);
  });
  it('a simulated outage raises consumption and fires the 1 h alert window', () => {
    const s = SERVICES[1]!, before = slaState(s), after = slaState(s, 6);
    expect(after.consumed).toBeGreaterThan(before.consumed + .15); expect(burnWindows(s, 6)[0]!.value).toBeGreaterThan(14.4); expect(burnWindows(s, 0)[0]!.value).toBeLessThan(14.4);
  });
});
describe('customer behavior', () => {
  it('has a monotonic funnel and partners convert better than paid campaigns', () => {
    for (const seg of ['Todos os clientes', 'Parceiros', 'Campanha paga'] as const) { const f = funnelCounts(seg); expect(f.every((n, i) => i === 0 || n < f[i - 1]!)).toBe(true); }
    const rate = (s: 'Parceiros' | 'Campanha paga') => { const f = funnelCounts(s); return f[4]! / f[0]!; }; expect(rate('Parceiros')).toBeGreaterThan(rate('Campanha paga'));
  });
  it('starts every cohort at 100%, never increases, and leaves future months empty', () => {
    COHORTS.forEach((_, c) => { expect(retention('Todos os clientes', c, 0)).toBe(100); let last = 100; for (let m = 1; m < COHORTS.length - c; m++) { const v = retention('Todos os clientes', c, m)!; expect(v).toBeLessThanOrEqual(last + 6); last = v; } expect(retention('Todos os clientes', c, COHORTS.length - c)).toBeNull(); });
  });
});
