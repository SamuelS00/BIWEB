import { useShallow } from 'zustand/react/shallow';
import { Button, IconButton, NumberField, SegmentedControl, Select, Switch } from '@biweb/ui';
import { getTable } from '../../data/registry';
import { aggregate } from '../../data/query';
import type { CfRule, Comp, CondFormat, DemoState, MatrixProps, TableProps } from '../doc';
import { COMP_META } from '../doc';
import { useEditor } from '../store';
import { NoSelection, Row, Section, useProp } from './shared';
import { RulesTab } from './RulesTab';

/** Three tones from two cut points. `higherIsBetter` decides which end is red. */
export const tiers = (lo: number, hi: number, higherIsBetter: boolean): CfRule[] => (higherIsBetter
  ? [{ op: '<', v: lo, tone: 'critical' }, { op: 'between', v: lo, v2: hi, tone: 'warning' }, { op: '>', v: hi, tone: 'healthy' }]
  : [{ op: '<', v: lo, tone: 'healthy' }, { op: 'between', v: lo, v2: hi, tone: 'warning' }, { op: '>', v: hi, tone: 'critical' }]);
const KINDS = [{ id: 'rules', label: 'Cores por regra' }, { id: 'icons', label: 'Ícones por regra' }, { id: 'scale', label: 'Escala de cor' }, { id: 'bars', label: 'Barras de dados' }];

/** Columns that can carry a conditional format for this component. */
function targets(c: Comp): { name: string; label: string }[] {
  if (!c.data) return [];
  const t = getTable(c.data.dataset, c.data.table), by = (n: string) => t.fields.find((f) => f.name === n);
  const names = c.type === 'table' ? (c.props as unknown as TableProps).columns : c.type === 'matrix' ? [(c.props as unknown as MatrixProps).measure] : c.type === 'chart' ? [String(c.props.y)] : [];
  return names.map(by).filter((f): f is NonNullable<typeof f> => !!f && f.kind === 'measure').map((f) => ({ name: f.name, label: f.label }));
}
function suggestCuts(c: Comp, field: string): [number, number] {
  if (!c.data) return [10, 20];
  const t = getTable(c.data.dataset, c.data.table), vals = t.rows.map((r) => Number(r[field])).filter(Number.isFinite).sort((a, b) => a - b);
  if (!vals.length) { const a = aggregate(t.rows, { ds: c.data.dataset, table: c.data.table, measure: field, agg: 'avg' })[0]?.value ?? 10; return [a * 0.8, a * 1.2]; }
  const q = (p: number) => vals[Math.floor((vals.length - 1) * p)]!, r = (n: number) => Math.round(n * 100) / 100;
  return [r(q(0.33)), r(q(0.66))];
}

/** Conditional formatting: color scale, data bars, tone rules or status icons, per column. Works the same in tables, matrices and charts. */
export function CfEditor({ c }: { c: Comp }) {
  const set = useProp(c), cf = ((c.props.cf as CondFormat[] | undefined) ?? []), cols = targets(c);
  if (!cols.length) return null;
  const patch = (id: string, p: Partial<CondFormat>) => set('cf', cf.map((x) => (x.id === id ? { ...x, ...p } : x)), 'Editar formatação condicional');
  const add = () => { const f = cols.find((x) => !cf.some((y) => y.field === x.name)) ?? cols[0]!, [lo, hi] = suggestCuts(c, f.name); set('cf', [...cf, { id: `cf${Date.now()}`, field: f.name, kind: 'rules', rules: tiers(lo, hi, true) } satisfies CondFormat], 'Adicionar formatação condicional'); };
  return (
    <Section title={`Formatação condicional${cf.length ? ` · ${cf.length}` : ''}`} right={<Button size="sm" icon="plus" onPress={add}>Adicionar</Button>}>
      {!cf.length && <p className="ed-help">Destaque o que importa: vermelho abaixo da meta, barras de volume, escala de calor.</p>}
      {cf.map((x) => {
        const hb = x.rules?.[0]?.tone !== 'healthy', lo = x.rules?.[0]?.v ?? 10, hi = x.rules?.[2]?.v ?? x.rules?.[1]?.v2 ?? 20;
        return (
          <div key={x.id} className="ed-cf">
            <div className="ed-cf-head">
              <Select label="Coluna" hideLabel value={x.field} onChange={(v: string) => { const [a, b] = suggestCuts(c, v); patch(x.id, { field: v, rules: tiers(a, b, hb) }); }} options={cols.map((f) => ({ id: f.name, label: f.label }))} />
              <Select label="Tipo de formatação" hideLabel value={x.kind} onChange={(v: string) => patch(x.id, { kind: v as CondFormat['kind'], rules: x.rules ?? tiers(lo, hi, true) })} options={KINDS} />
              <IconButton icon="close" size="sm" label="Remover formatação" onPress={() => set('cf', cf.filter((y) => y.id !== x.id), 'Remover formatação condicional')} />
            </div>
            {(x.kind === 'rules' || x.kind === 'icons') && (
              <div className="ed-cf-rules">
                <SegmentedControl label="Qual lado é melhor" value={hb ? 'hi' : 'lo'} onChange={(v) => patch(x.id, { rules: tiers(lo, hi, v === 'hi') })} options={[{ id: 'hi', label: 'Maior é melhor' }, { id: 'lo', label: 'Menor é melhor' }]} />
                <div className="ed-cf-tiers"><span className="t-bad">{hb ? 'Crítico' : 'Saudável'} &lt;</span><NumberField label="Primeiro corte" hideLabel quiet value={lo} step={0.5} onChange={(v) => patch(x.id, { rules: tiers(v, Math.max(v, hi), hb) })} /><span className="t-warn">Atenção até</span><NumberField label="Segundo corte" hideLabel quiet value={hi} step={0.5} onChange={(v) => patch(x.id, { rules: tiers(Math.min(lo, v), v, hb) })} /><span className={hb ? 't-ok' : 't-bad'}>{hb ? 'Saudável' : 'Crítico'} &gt;</span></div>
              </div>
            )}
            {x.kind === 'scale' && <Row label="Inverter cores"><Switch isSelected={!!x.reverse} onChange={(v) => patch(x.id, { reverse: v })} aria-label="Inverter">{null}</Switch></Row>}
          </div>
        );
      })}
    </Section>
  );
}

const STATES: { id: DemoState | 'normal'; label: string }[] = [{ id: 'normal', label: 'Normal' }, { id: 'loading', label: 'Carregando' }, { id: 'error', label: 'Erro' }, { id: 'noaccess', label: 'Sem permissão' }, { id: 'stale', label: 'Dados desatualizados' }];
export function AdvancedTab() {
  const sel = useEditor(useShallow((s) => s.page()?.comps.filter((x) => s.selection.includes(x.id)) ?? []));
  const c = sel.length === 1 ? sel[0] : undefined, set = useProp(c ?? ({ id: '' } as Comp));
  return (
    <div className="ed-tab">
      {c ? (
        <>
          <div className="ed-tab-title">{COMP_META[c.type].label} · {c.name}</div>
          {['chart', 'table', 'matrix'].includes(c.type) && <CfEditor c={c} />}
          {COMP_META[c.type].data && (
            <Section title="Tempo real e estados">
              {['chart', 'table', 'kpi'].includes(c.type) && <Row label="Ao vivo"><Switch isSelected={!!c.props.live} onChange={(v) => set('live', v, v ? 'Ligar tempo real' : 'Desligar tempo real')} aria-label="Ao vivo">{null}</Switch></Row>}
              {['chart', 'table', 'kpi'].includes(c.type) && <Row label="Estado de demonstração"><Select label="Estado do widget" hideLabel value={(c.props.state as string | undefined) ?? 'normal'} onChange={(v: string) => set('state', v === 'normal' ? undefined : v, `Estado: ${STATES.find((s) => s.id === v)?.label}`)} options={STATES.map((s) => ({ id: s.id, label: s.label }))} /></Row>}
              <p className="ed-help">Todo visual possui carregando, vazio, erro, sem permissão, desatualizado, ao vivo, filtrado e selecionado. Use «Estado de demonstração» para ver cada um.</p>
            </Section>
          )}
          {c.type === 'chart' && <Section title="Desempenho"><Row label="Limite de linhas lidas"><NumberField label="Limite de pontos" hideLabel quiet value={Number(c.props.limit ?? 0)} minValue={0} maxValue={2000} unit="itens" onChange={(v) => set('limit', v, 'Limite de pontos')} /></Row><p className="ed-help">As consultas rodam no modelo semântico; o navegador só desenha o resultado agregado.</p></Section>}
        </>
      ) : <NoSelection text="Selecione um componente para formatação condicional, tempo real e estados. Abaixo, as regras de negócio do relatório." />}
      <Section title="Regras de negócio"><RulesTab /></Section>
    </div>
  );
}
