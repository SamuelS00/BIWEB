import { Button, IconButton, NumberField, Select, SegmentedControl, Switch, TextField } from '@biweb/ui';
import { AGG_LABEL } from '../../data/query';
import type { Agg } from '../../data/types';
import { PERIOD_LABEL } from '../../viz/engine/model';
import type { Comp, KpiProps, PeriodKey } from '../doc';
import { fieldOpts, fieldsOf, Row, Section, useProp, Well } from './shared';

const isMeasure = (f: { kind: string }) => f.kind === 'measure';
const PERIODS = (Object.keys(PERIOD_LABEL) as PeriodKey[]).map((id) => ({ id, label: PERIOD_LABEL[id] }));
const AGGS: Agg[] = ['sum', 'avg', 'min', 'max', 'count', 'distinct'];

/** KPI data: the measure, its time window and what it is compared with. */
export function KpiWells({ c, agg }: { c: Comp; agg: React.ReactNode }) {
  const set = useProp(c), k = c.props as unknown as KpiProps, hasDate = fieldsOf(c).some((f) => f.kind === 'date');
  return (
    <>
      <Well c={c} label="Valor" value={k.measure} onChange={(v) => set('measure', v, 'Trocar medida do KPI')} hint="Arraste uma medida" />
      {agg}
      {hasDate && <Row label="Período"><Select label="Período do KPI" hideLabel value={k.period ?? 'all'} onChange={(v: PeriodKey) => set('period', v, `Período: ${PERIOD_LABEL[v]}`)} options={PERIODS} /></Row>}
      <Row label="Comparar com"><Select label="Comparar com" hideLabel value={k.compare} onChange={(v: string) => set('compare', v, 'Trocar comparação')} options={[{ id: 'none', label: 'Nada' }, ...(hasDate && k.period && k.period !== 'all' ? [{ id: 'prev', label: 'Ano anterior' }] : []), { id: 'target', label: 'Meta' }, ...(hasDate && k.period && k.period !== 'all' ? [{ id: 'both', label: 'Meta e ano anterior' }] : [])]} /></Row>
      {(k.compare === 'target' || k.compare === 'both') && <Well c={c} label="Meta (campo)" optional value={k.targetField} accept={isMeasure} onChange={(v) => set('targetField', v || undefined, 'Meta do KPI')} hint="Arraste o campo da meta, ou informe um valor na aba Visual" />}
    </>
  );
}

export function KpiVisual({ c }: { c: Comp }) {
  const set = useProp(c), k = c.props as unknown as KpiProps, sec = k.secondary ?? [];
  const hasT = k.compare === 'target' || k.compare === 'both';
  return (
    <>
      <Section title="KPI">
        {hasT && !k.targetField && <Row label="Meta"><NumberField label="Meta" hideLabel quiet value={k.target ?? 0} step={0.1} onChange={(v) => set('target', v, 'Alterar meta')} /></Row>}
        {hasT && <Row label="Bom quando"><SegmentedControl label="Bom quando" value={k.lowerIsBetter ? 'below' : k.targetDir} onChange={(v) => { set('targetDir', v, 'Direção da meta'); set('lowerIsBetter', v === 'below', 'Direção da meta'); }} options={[{ id: 'above', label: 'Acima' }, { id: 'below', label: 'Abaixo' }]} /></Row>}
        <Row label="Tendência"><Switch isSelected={k.spark} onChange={(v) => set('spark', v, v ? 'Mostrar tendência' : 'Ocultar tendência')} aria-label="Tendência">{null}</Switch></Row>
        {k.spark && !k.period && <Row label="Série"><Select label="Série da tendência" hideLabel value={k.sparkMeasure} onChange={(v: string) => set('sparkMeasure', v, 'Trocar série da tendência')} options={[{ id: 'disponibilidade', label: 'Disponibilidade' }, { id: 'utilizacao', label: 'Utilização' }, { id: 'atenuacao_dB', label: 'Atenuação' }]} /></Row>}
        <Row label="Ao vivo"><Switch isSelected={!!k.live} onChange={(v) => set('live', v, v ? 'Ligar tempo real' : 'Desligar tempo real')} aria-label="Ao vivo">{null}</Switch></Row>
      </Section>
      <Section title={`Métricas secundárias${sec.length ? ` · ${sec.length}` : ''}`} right={<Button size="sm" icon="plus" isDisabled={sec.length >= 3} onPress={() => set('secondary', [...sec, { label: 'Pedidos', measure: fieldsOf(c).find((f) => f.kind === 'measure')?.name ?? '', agg: 'sum' as Agg }], 'Adicionar métrica secundária')}>Adicionar</Button>}>
        {!sec.length && <p className="ed-help">Mostre 1 ou 2 números de apoio sob o valor principal (ex.: pedidos, ticket médio).</p>}
        {sec.map((q, i) => (
          <div key={i} className="ed-ref">
            <TextField label="Rótulo" hideLabel quiet value={q.label} onChange={(v) => set('secondary', sec.map((x, j) => (j === i ? { ...x, label: v } : x)), 'Editar métrica secundária')} />
            <Select label="Medida" hideLabel value={q.measure} onChange={(v: string) => set('secondary', sec.map((x, j) => (j === i ? { ...x, measure: v } : x)), 'Editar métrica secundária')} options={fieldOpts(c, isMeasure)} />
            <Select label="Agregação" hideLabel value={q.agg} onChange={(v: Agg) => set('secondary', sec.map((x, j) => (j === i ? { ...x, agg: v } : x)), 'Editar métrica secundária')} options={AGGS.map((a) => ({ id: a, label: AGG_LABEL[a] }))} />
            <IconButton icon="close" size="sm" label="Remover métrica" onPress={() => set('secondary', sec.filter((_, j) => j !== i), 'Remover métrica secundária')} />
          </div>
        ))}
      </Section>
    </>
  );
}
