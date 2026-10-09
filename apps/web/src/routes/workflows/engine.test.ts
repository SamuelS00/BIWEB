import { describe, expect, it } from 'vitest';
import { applyOps, autoLayout, decide, fastForward, optimizations, retryNode, startRun, stepRun, validate } from './engine';
import { seedWorkflows } from './seeds';
import { respond } from './copilot';

const wfs = seedWorkflows(), byId = (id: string) => wfs.find((w) => w.id === id)!;

describe('workflow engine', () => {
  it('todos os fluxos de demonstração são válidos', () => {
    for (const w of wfs) expect(validate(w).filter((i) => i.level === 'error'), w.id).toEqual([]);
  });
  it('falha em Converter datas, bloqueia a jusante e conclui após retry com correção', () => {
    const w = byId('ingestao');
    let r = fastForward(w, startRun(w, 1, 't'));
    expect(r.status).toBe('failed');
    expect(r.nodes.dates!.err?.rows).toBe(12842);
    expect(r.nodes.join!.state).toBe('waiting');
    w.nodes.find((n) => n.id === 'dates')!.cfg.onInvalid = 'Quarentena';
    r = fastForward(w, retryNode(w, r, 'dates'));
    expect(r.status).toBe('success');
    expect(r.nodes.ds!.rowsOut).toBeGreaterThan(800000);
  });
  it('ramos paralelos executam juntos', () => {
    const w = byId('ingestao');
    let r = startRun(w, 1, 't');
    while (r.nodes.split!.state !== 'success') r = stepRun(w, r, 0.1);
    r = stepRun(w, r, 0.2);
    expect(r.nodes.trim!.state).toBe('running');
    expect(r.nodes.ord!.state).toBe('running');
  });
  it('decisão se/senão ignora o ramo não escolhido', () => {
    const r = fastForward(byId('incidente-rede'), startRun(byId('incidente-rede'), 2, 't'));
    expect(r.nodes.inc!.state).toBe('success');
    expect(r.nodes.reg!.state).toBe('skipped');
  });
  it('tarefa humana pausa e continua após decisão', () => {
    const w = byId('aprovacao');
    let r = fastForward(w, startRun(w, 3, 't'), 600, { stopWhenPaused: true });
    expect(r.status).toBe('paused');
    r = decide(w, r, 'rev', 'returned');
    r = fastForward(w, r);
    expect(r.nodes.pub!.state).toBe('skipped');
    expect(r.nodes.ret!.state).toBe('success');
  });
  it('aresta de erro trata a falha', () => {
    const w = JSON.parse(JSON.stringify(byId('relatorio'))) as typeof wfs[0];
    w.nodes.find((n) => n.id === 'val')!.sim = { fail: { reason: 'x', rows: 1, hint: '' } };
    const r = fastForward(w, startRun(w, 4, 't'));
    expect(r.nodes.err!.state).toBe('success');
    expect(r.nodes.sem!.state).toBe('waiting');
  });
  it('layout automático e operações mantêm o grafo consistente', () => {
    const w = byId('incidente-rede'), pos = autoLayout(w);
    expect(pos.inc!.x).toBeGreaterThan(pos.sev!.x);
    const m = respond('Adicione uma validação aqui', { wf: w, selection: ['an'] });
    const next = applyOps(w, m.proposal!.ops);
    expect(next.nodes.length).toBe(w.nodes.length + 1);
    expect(validate(next).filter((i) => i.level === 'error')).toEqual([]);
  });
  it('organizar não deixa nós sobrepostos', () => {
    const w = byId('ingestao'), next = applyOps(w, [{ t: 'layout' }]), seen = new Set(next.nodes.map((n) => `${n.x},${n.y}`));
    expect(seen.size).toBe(next.nodes.length);
  });
  it('detecta oportunidades de otimização', () => {
    expect(optimizations(byId('ingestao')).some((o) => o.title === 'Carga incremental')).toBe(true);
  });
});
