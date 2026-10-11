import { describe, expect, it } from 'vitest';
import { CHANGES, CONFLICTS, ENTITIES, EVIDENCE, MISSIONS, OBSERVATIONS, PROPOSALS, RESULT_FIBER, SOURCES, WATCHLISTS, score } from './seed';
import { inWeek, stats } from './derive';

const live = { resolved: {}, proposals: {}, extraMissions: 0 };
describe('Discovery demo data consistency', () => {
  it('matches the Overview numbers', () => {
    const s = stats(live);
    expect([s.missions, s.sources, s.changesWeek, s.conflicts, s.proposals]).toEqual([12, 184, 42, 3, 8]);
  });
  it('resolving a conflict lowers the open count', () => { expect(stats({ ...live, resolved: { cf1: 'a' } }).conflicts).toBe(2); });
  it('fiber market result: 27 = 18 high + 7 medium + 2 review', () => {
    const f = ENTITIES.filter((e) => RESULT_FIBER.entityIds.includes(e.id));
    expect(f.length).toBe(27);
    expect([f.filter((e) => e.confidence >= 90).length, f.filter((e) => e.confidence >= 75 && e.confidence < 90).length, f.filter((e) => e.confidence < 75).length]).toEqual([18, 7, 2]);
  });
  it('mission and watchlist change counts agree', () => {
    expect(MISSIONS.find((m) => m.id === 'm1')?.changesWeek).toBe(14);
    const w = WATCHLISTS.find((x) => x.id === 'w1')!;
    expect(CHANGES.filter((c) => inWeek(c) && w.entityIds.includes(c.entityId) && c.missionId === w.missionId).length).toBe(12);
  });
  it('confidence is derived from components (example 92%)', () => {
    expect(score(OBSERVATIONS.find((o) => o.id === 'o-coa-price')!.confidence)).toBe(92);
  });
  it('every observation and change cites existing evidence/sources', () => {
    for (const o of OBSERVATIONS) { expect(SOURCES.some((s) => s.id === o.sourceId)).toBe(true); for (const e of o.evidenceIds) expect(EVIDENCE.some((x) => x.id === e)).toBe(true); }
    for (const c of CHANGES) expect(SOURCES.some((s) => s.id === c.sourceId)).toBe(true);
    for (const c of CONFLICTS) { expect(SOURCES.some((s) => s.id === c.a.sourceId)).toBe(true); expect(SOURCES.some((s) => s.id === c.b.sourceId)).toBe(true); }
  });
  it('ids are unique', () => {
    for (const list of [ENTITIES, SOURCES, OBSERVATIONS, CHANGES, EVIDENCE, PROPOSALS]) expect(new Set(list.map((x) => x.id)).size).toBe(list.length);
  });
});
