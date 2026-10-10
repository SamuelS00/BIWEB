import { beforeEach, describe, expect, it } from 'vitest';
import { REVIEW } from './analysis';
import { effectiveStrategy, pendingReview, readiness, useMig } from './store';
import { respond } from './copilot';

const fresh = () => { useMig.setState({ ps: {}, pid: 'mp_commercial_ops' }); useMig.getState().open('mp_commercial_ops'); };
describe('store do Migration Studio', () => {
  beforeEach(fresh);
  it('publicação parcial até a fila zerar, depois tudo pronto', () => {
    const st = useMig.getState();
    expect(readiness(st.cur()).pending).toBe(REVIEW.length);
    expect(readiness(st.cur()).reports.ready).toBeLessThan(12);
    for (const r of REVIEW) st.decideReview(r.id, 'accepted');
    const rd = readiness(useMig.getState().cur());
    expect(rd.pending).toBe(0); expect(rd.reports.ready).toBe(12); expect(rd.maps.ready).toBe(3); expect(rd.workflows.ready).toBe(2); expect(rd.models.ready).toBe(4);
    useMig.getState().publish();
    expect(useMig.getState().cur().published).toBe(true);
    expect(useMig.getState().projects.find((p) => p.id === 'mp_commercial_ops')?.status).toBe('completed');
  });
  it('estratégia herda visual → página → relatório → projeto', () => {
    const st = useMig.getState(), project = st.projects[0]!;
    expect(effectiveStrategy(st.cur(), project, 'vz:netmap:map:1').value).toBe('modernize');
    expect(effectiveStrategy(st.cur(), project, 'vz:exec:regional:1').value).toBe('native');
    st.setStrategy('pg:exec:regional', 'fidelity');
    expect(effectiveStrategy(useMig.getState().cur(), project, 'vz:exec:regional:1')).toEqual({ value: 'fidelity', from: 'Regional' });
  });
  it('o Copilot propõe antes de alterar e só altera ao aplicar', () => {
    const st = useMig.getState();
    st.set({ sel: 'rep:exec' });
    const m = respond('Use Native Mode para este relatório', 'rep:exec', st);
    expect(m?.proposal).toBeUndefined();
    const m2 = respond('Use Fidelity para este relatório', 'rep:exec', st);
    expect(m2?.proposal?.status).toBe('pending');
    expect(st.cur().strategies['rep:exec']).toBeUndefined();
    st.patch((s) => ({ chat: [...s.chat, m2!] }));
    st.applyProposal(m2!.id);
    expect(useMig.getState().cur().strategies['rep:exec']).toBe('fidelity');
  });
  it('projeto novo começa vazio e a fila continua a mesma', () => {
    const id = useMig.getState().create({ name: 'X', platform: 'powerbi', workspace: 'W', strategy: 'native', scope: { reports: 3, pages: 9, visuals: 40, measures: 8, datasets: 2, maps: 0, processes: 0 }, objects: 3 });
    expect(useMig.getState().analyzing[id]).toBe(true);
    useMig.getState().finishAnalysis(id);
    expect(useMig.getState().analyzing[id]).toBe(false);
    expect(pendingReview(useMig.getState().cur()).length).toBe(REVIEW.length);
  });
});
