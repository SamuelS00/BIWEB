import { beforeEach, describe, expect, it } from 'vitest';
import { planFor } from './copilot';
import { useEditor } from './store';
import { blankReport } from './templates';

const st = () => useEditor.getState();
const run = (text: string) => { const plan = planFor(text); const tx = `t${Math.random()}`; plan.steps.forEach((s) => s.run(tx)); return plan; };
const comps = () => st().page()!.comps;
beforeEach(() => { const d = blankReport(); d.datasets = ['ds_vendas']; st().load(d); });

describe('Copilot builds with the same components the editor edits', () => {
  it('adds revenue by month as a real, bound chart', () => {
    const plan = planFor('Adicione receita por mês.');
    expect(plan.steps.length).toBeGreaterThan(0); expect(comps()).toHaveLength(0); // nothing changes before apply
    run('Adicione receita por mês.');
    const c = comps()[0]!; expect(c.type).toBe('chart'); expect(c.data).toEqual({ dataset: 'ds_vendas', table: 'vendas' });
    expect(c.props).toMatchObject({ x: 'data', y: 'receita', grain: 'month', kind: 'bar' });
  });
  it('turns a chart into horizontal bars, adds YoY, tooltip margin and a reference line, all as one undo step each', () => {
    run('Adicione receita por mês.'); const id = comps()[0]!.id; st().select([id]);
    run('Transforme isso em barras horizontais.'); expect(comps()[0]!.props.kind).toBe('hbar');
    run('Adicione comparação com ano anterior.'); expect(comps()[0]!.props.compare).toBe('prev'); expect(comps()[0]!.props.period).toBe('last12m');
    run('Mostre margem no tooltip.'); expect(comps()[0]!.props.tooltipFields).toContain('margem_pct');
    st().update(id, (d) => { d.props.kind = 'line'; }); run('Adicione uma linha de média.'); expect((comps()[0]!.props.refs as { kind: string }[])[0]!.kind).toBe('avg');
    st().undo(); expect((comps()[0]!.props.refs as unknown[] | undefined) ?? []).toHaveLength(0);
  });
  it('creates a region filter bound to the page and links a chart to other visuals', () => {
    run('Crie um filtro por região.'); const f = comps().find((c) => c.type === 'filter')!; expect(f.props).toMatchObject({ field: 'regiao', targets: 'all' }); expect(f.data?.dataset).toBe('ds_vendas');
    run('Adicione receita por mês.'); const chart = comps().find((c) => c.type === 'chart')!; st().update(chart.id, (d) => { d.props.kind = 'bar'; });
    run('Crie uma tabela de lojas'); // not understood: must not change anything
    st().select([chart.id]); const before = comps().length;
    const plan = planFor('Faça esse gráfico filtrar o mapa.'); expect(plan.steps).toHaveLength(0); expect(comps()).toHaveLength(before);
  });
  it('builds a whole executive page that stays editable and can be undone in one step', () => {
    const plan = planFor('Crie uma página executiva.'); expect(plan.intent).toMatch(/executiva/i);
    const pagesBefore = st().doc!.pages.length; run('Crie uma página executiva.');
    expect(st().doc!.pages.length).toBe(pagesBefore + 1); const cs = comps(); expect(cs.filter((c) => c.type === 'kpi')).toHaveLength(4); expect(cs.some((c) => c.type === 'chart' && c.props.kind === 'combo')).toBe(true); expect(cs.every((c) => !c.data || c.data.dataset === 'ds_vendas')).toBe(true);
  });
  it('annotates a month on a time chart', () => {
    run('Adicione receita por mês.'); st().select([comps()[0]!.id]); run('Anote Black Friday em novembro de 2025');
    const notes = comps()[0]!.props.notes as { at: number; label: string }[]; expect(notes[0]!.at).toBe(Date.UTC(2025, 10, 1)); expect(notes[0]!.label).toMatch(/Black Friday/);
  });
});
