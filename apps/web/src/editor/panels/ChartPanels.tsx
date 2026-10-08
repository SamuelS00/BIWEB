import { useState } from 'react';
import { Banner, Button, Icon, IconButton, NumberField, SegmentedControl, Select, Switch, TextField } from '@biweb/ui';
import { AGG_LABEL } from '../../data/query';
import type { Agg } from '../../data/types';
import { chartPreset } from '../../viz/engine/defaults';
import { adaptKind, CATEGORIES, guidance, KIND_BY_ID, KIND_ICON, KINDS } from '../../viz/engine/kinds';
import { PERIOD_LABEL, REF_LABEL } from '../../viz/engine/model';
import type { Annotation, ChartKind, ChartProps, Comp, PeriodKey, RefKind, RefLine } from '../doc';
import { useEditor } from '../store';
import { fieldOpts, fieldsOf, Row, Section, useProp, Well } from './shared';

const AGGS: Agg[] = ['sum', 'avg', 'min', 'max', 'count', 'distinct'];
const isMeasure = (f: { kind: string }) => f.kind === 'measure';
const isDim = (f: { kind: string }) => f.kind !== 'measure';
const GRAINS = [{ id: 'day', label: 'Dia' }, { id: 'week', label: 'Sem.' }, { id: 'month', label: 'Mês' }, { id: 'quarter', label: 'Tri.' }, { id: 'year', label: 'Ano' }] as const;
const PERIODS = (Object.keys(PERIOD_LABEL) as PeriodKey[]).map((id) => ({ id, label: PERIOD_LABEL[id] }));

/** Field wells for a chart, driven by the roles of its kind: each visual asks only for what it needs. */
export function ChartWells({ c }: { c: Comp }) {
  const set = useProp(c), k = c.props as unknown as ChartProps, def = KIND_BY_ID[k.kind], fs = fieldsOf(c);
  const dateField = fs.find((f) => f.name === k.x)?.kind === 'date', hasDate = fs.some((f) => f.kind === 'date');
  const measureAxis = k.kind === 'scatter' || k.kind === 'bubble' || k.kind === 'histogram';
  const tips = k.tooltipFields ?? [];
  const wells: Record<string, React.ReactNode> = {
    x: <Well key="x" c={c} label={def.labels.x} value={k.x} accept={measureAxis ? isMeasure : undefined} onChange={(v) => set('x', v, 'Trocar eixo X')} hint={measureAxis ? 'Arraste uma medida' : 'Arraste uma dimensão ou data'} />,
    y: k.kind === 'histogram' ? null : <Well key="y" c={c} label={def.labels.y} value={k.y} onChange={(v) => { set('y', v, 'Trocar valores'); const f = fs.find((x) => x.name === v); if (f && f.kind !== 'measure' && k.agg !== 'count' && k.agg !== 'distinct') set('agg', 'count', 'Agregação: Contagem'); }} hint="Arraste uma medida" />,
    y2: <Well key="y2" c={c} label={def.labels.y2 ?? 'Medida secundária'} optional={k.kind !== 'combo'} value={k.y2 || undefined} accept={isMeasure} onChange={(v) => set('y2', v || undefined, 'Trocar medida secundária')} hint="Arraste uma medida" />,
    series: <Well key="s" c={c} label={def.labels.series ?? 'Legenda (séries)'} optional={!def.needsSeries} value={k.series} accept={isDim} onChange={(v) => set('series', v || undefined, 'Trocar legenda')} hint="Arraste uma dimensão" />,
    target: <Well key="t" c={c} label="Meta (medida)" optional value={k.target} accept={isMeasure} onChange={(v) => { set('target', v || undefined, 'Trocar meta'); if (v && !k.compare) set('compare', 'target', 'Comparar com a meta'); }} hint="Arraste o campo da meta" />,
  };
  return (
    <>
      {def.roles.filter((r) => r !== 'tooltip').map((r) => wells[r])}
      {def.roles.includes('tooltip') && (
        <div className="ed-well"><div className="ed-well-head"><span className="bw-label">Tooltip (campos extras)</span><span className="bw-cap bw-muted">opcional</span></div>
          {tips.map((t) => <div key={t} className="ed-col"><span>{fs.find((f) => f.name === t)?.label ?? t}</span><IconButton icon="close" size="sm" label={`Remover ${t}`} onPress={() => set('tooltipFields', tips.filter((x) => x !== t), 'Remover campo do tooltip')} /></div>)}
          <Select label="Adicionar ao tooltip" hideLabel placeholder="Adicionar campo…" onChange={(v: string) => v && !tips.includes(v) && set('tooltipFields', [...tips, v], 'Adicionar campo ao tooltip')} options={fieldOpts(c, isMeasure)} />
        </div>
      )}
      {k.kind !== 'histogram' && <Row label="Agregação"><Select label="Agregação" hideLabel value={k.agg} onChange={(v: Agg) => set('agg', v, `Agregação: ${AGG_LABEL[v]}`)} options={AGGS.map((a) => ({ id: a, label: AGG_LABEL[a] }))} /></Row>}
      {dateField && <Row label="Agrupar por"><SegmentedControl label="Grão de tempo" value={k.grain} onChange={(v) => set('grain', v, 'Trocar grão')} options={GRAINS.map((g) => ({ ...g }))} /></Row>}
      {hasDate && <Row label="Período"><Select label="Período" hideLabel value={k.period ?? 'all'} onChange={(v: PeriodKey) => set('period', v, `Período: ${PERIOD_LABEL[v]}`)} options={PERIODS} /></Row>}
      {def.supportsCompare && (hasDate || k.target) && <Row label="Comparar com"><Select label="Comparar com" hideLabel value={k.compare ?? 'none'} onChange={(v: string) => set('compare', v, 'Trocar comparação')} options={[{ id: 'none', label: 'Nada' }, ...(hasDate ? [{ id: 'prev', label: 'Ano anterior' }] : []), ...(k.target ? [{ id: 'target', label: 'Meta' }] : []), ...(hasDate && k.target ? [{ id: 'both', label: 'Meta e ano anterior' }] : [])]} /></Row>}
      {k.kind === 'waterfall' && <Row label="Fechar total em"><TextField label="Rótulos que fecham total" hideLabel quiet value={(k.totals ?? []).join(', ')} placeholder="ex.: Receita líquida, EBITDA" onChange={(v) => set('totals', v.split(',').map((x) => x.trim()).filter(Boolean), 'Subtotais da cascata')} /></Row>}
      {k.kind === 'histogram' && <Row label="Faixas"><NumberField label="Número de faixas" hideLabel quiet value={k.bins ?? 14} minValue={4} maxValue={40} unit="faixas" onChange={(v) => set('bins', v, 'Número de faixas')} /></Row>}
      {!dateField && !measureAxis && k.kind !== 'waterfall' && <><Row label="Ordenar"><Select label="Ordenar" hideLabel value={k.sort} onChange={(v: string) => set('sort', v, 'Trocar ordenação')} options={[{ id: 'value', label: 'Maiores primeiro' }, { id: 'asc', label: 'Menores primeiro' }, { id: 'label', label: 'Alfabética' }, { id: 'none', label: 'Original' }]} /></Row>
        <Row label="Mostrar"><NumberField label="Limite de categorias" hideLabel quiet value={k.limit} minValue={0} maxValue={500} unit={k.limit ? 'itens' : 'todos'} onChange={(v) => set('limit', v, 'Trocar limite')} /></Row></>}
    </>
  );
}

/** Grid of visualization types grouped by the question each answers. Changing type keeps every compatible field. */
export function KindPicker({ c }: { c: Comp }) {
  const k = c.props as unknown as ChartProps, [open, setOpen] = useState(false), fs = fieldsOf(c), issues = guidance(k, fs), cur = KIND_BY_ID[k.kind];
  const pick = (kind: ChartKind) => {
    const { patch, notes } = adaptKind(k, kind, fs), old = chartPreset(k.kind, c.data?.dataset ?? ''), untouched = !!old && c.style.title === old.title;
    const xl = fs.find((f) => f.name === (patch.x ?? k.x))?.label, yl = fs.find((f) => f.name === (patch.y ?? k.y))?.label;
    useEditor.getState().update(c.id, (d) => { Object.assign(d.props, patch); if (untouched && xl && yl) { d.style.title = kind === 'histogram' ? `Distribuição de ${xl}` : `${yl} por ${xl}`; d.style.subtitle = KIND_BY_ID[kind].label.toLowerCase(); d.name = d.style.title; } }, `Trocar para ${KIND_BY_ID[kind].label}`);
    setOpen(false);
    if (notes.length) useEditor.getState().toast({ text: notes[0]!, tone: 'info' });
  };
  return (
    <Section title="Tipo de visual">
      <button type="button" className="ed-kindcur" aria-expanded={open} onClick={() => setOpen(!open)}><Icon name={KIND_ICON[k.kind]} size={16} /><span><b>{cur.label}</b><small>{cur.question}</small></span><Icon name={open ? 'chevronDown' : 'chevronRight'} size={12} /></button>
      {open && <div className="ed-kindgrid" role="listbox" aria-label="Tipos de visual">{CATEGORIES.map((cat) => { const items = KINDS.filter((x) => x.category === cat); return items.length ? <div key={cat}><span className="bw-label">{cat}</span><div>{items.map((x) => <button key={x.id} type="button" role="option" aria-selected={x.id === k.kind} title={x.question} className={x.id === k.kind ? 'is-on' : ''} onClick={() => pick(x.id)}><Icon name={KIND_ICON[x.id]} size={12} />{x.label}</button>)}</div></div> : null; })}</div>}
      {issues.length > 0 && <Banner tone="warning">{issues.map((t) => <div key={t}>{t}</div>)}</Banner>}
    </Section>
  );
}

const REF_KINDS: RefKind[] = ['target', 'sla', 'threshold', 'avg', 'median', 'forecast', 'max', 'min'];
export function RefLinesEditor({ c }: { c: Comp }) {
  const set = useProp(c), k = c.props as unknown as ChartProps, refs = k.refs ?? [];
  const patch = (id: string, p: Partial<RefLine>) => set('refs', refs.map((r) => (r.id === id ? { ...r, ...p } : r)), 'Editar linha de referência');
  return (
    <Section title={`Linhas de referência${refs.length ? ` · ${refs.length}` : ''}`} right={<Button size="sm" icon="plus" onPress={() => set('refs', [...refs, { id: `r${Date.now()}`, kind: 'avg' } satisfies RefLine], 'Adicionar linha de referência')}>Adicionar</Button>}>
      {!refs.length && <p className="ed-help">Média, mediana, meta, SLA, limite ou projeção: uma linha que dá contexto ao valor.</p>}
      {refs.map((r) => (
        <div key={r.id} className="ed-ref">
          <Select label="Tipo da linha" hideLabel value={r.kind} onChange={(v: RefKind) => patch(r.id, { kind: v })} options={REF_KINDS.map((x) => ({ id: x, label: REF_LABEL[x] }))} />
          {['target', 'sla', 'threshold'].includes(r.kind) && <NumberField label="Valor" hideLabel quiet value={r.value ?? 0} step={0.1} onChange={(v) => patch(r.id, { value: v })} />}
          <TextField label="Rótulo" hideLabel quiet value={r.label ?? ''} placeholder="Rótulo" onChange={(v) => patch(r.id, { label: v })} />
          <IconButton icon="close" size="sm" label="Remover linha" onPress={() => set('refs', refs.filter((x) => x.id !== r.id), 'Remover linha de referência')} />
        </div>
      ))}
    </Section>
  );
}

const iso = (ts: number) => new Date(ts).toISOString().slice(0, 10);
export function NotesEditor({ c }: { c: Comp }) {
  const set = useProp(c), k = c.props as unknown as ChartProps, notes = k.notes ?? [];
  const patch = (id: string, p: Partial<Annotation>) => set('notes', notes.map((n) => (n.id === id ? { ...n, ...p } : n)), 'Editar anotação');
  return (
    <Section title={`Anotações${notes.length ? ` · ${notes.length}` : ''}`} right={<Button size="sm" icon="plus" onPress={() => set('notes', [...notes, { id: `n${Date.now()}`, at: Date.UTC(2026, 8, 1), label: 'Evento', tone: 'info' } satisfies Annotation], 'Adicionar anotação')}>Adicionar</Button>}>
      {!notes.length && <p className="ed-help">Marque no tempo o que explica a curva: campanha, incidente, mudança de política.</p>}
      {notes.map((n) => (
        <div key={n.id} className="ed-ref ed-note">
          <input type="date" aria-label="Data da anotação" value={iso(n.at)} onChange={(e) => { const t = Date.parse(`${e.target.value}T00:00:00Z`); if (Number.isFinite(t)) patch(n.id, { at: t }); }} />
          <TextField label="Texto da anotação" hideLabel quiet value={n.label} onChange={(v) => patch(n.id, { label: v })} />
          <Select label="Tom" hideLabel value={n.tone ?? 'info'} onChange={(v: string) => patch(n.id, { tone: v as Annotation['tone'] })} options={[{ id: 'info', label: 'Info' }, { id: 'warning', label: 'Atenção' }, { id: 'danger', label: 'Crítico' }]} />
          <IconButton icon="close" size="sm" label="Remover anotação" onPress={() => set('notes', notes.filter((x) => x.id !== n.id), 'Remover anotação')} />
        </div>
      ))}
    </Section>
  );
}

export function ChartVisual({ c }: { c: Comp }) {
  const set = useProp(c), k = c.props as unknown as ChartProps, def = KIND_BY_ID[k.kind];
  return (
    <>
      <KindPicker c={c} />
      <Section title="Elementos">
        <Row label="Legenda"><Switch isSelected={k.legend} onChange={(v) => set('legend', v, v ? 'Mostrar legenda' : 'Ocultar legenda')} aria-label="Legenda">{null}</Switch></Row>
        <Row label="Rótulos de dados"><Switch isSelected={k.labels} onChange={(v) => set('labels', v, v ? 'Mostrar rótulos' : 'Ocultar rótulos')} aria-label="Rótulos de dados">{null}</Switch></Row>
        <Row label="Tooltip"><Switch isSelected={k.tooltip} onChange={(v) => set('tooltip', v, v ? 'Ligar tooltip' : 'Desligar tooltip')} aria-label="Tooltip">{null}</Switch></Row>
        {def.supportsZoom && <Row label="Zoom por arrasto"><Switch isSelected={k.zoom ?? true} onChange={(v) => set('zoom', v, v ? 'Ligar zoom' : 'Desligar zoom')} aria-label="Zoom por arrasto">{null}</Switch></Row>}
        {def.time && <Row label="Média móvel"><NumberField label="Média móvel" hideLabel quiet value={k.movingAvg ?? 0} minValue={0} maxValue={30} unit={k.movingAvg ? 'pontos' : 'desligada'} onChange={(v) => set('movingAvg', v || undefined, 'Média móvel')} /></Row>}
        {k.kind === 'gauge' && <Row label="Faixas"><div className="bw-prop-pair"><NumberField label="Atenção a partir de" hideLabel quiet prefix="⚠" step={0.05} value={(k.thresholds ?? [0.6, 0.9])[0]} minValue={0} maxValue={1} onChange={(v) => set('thresholds', [v, (k.thresholds ?? [0.6, 0.9])[1]], 'Faixas do medidor')} /><NumberField label="Saudável a partir de" hideLabel quiet prefix="✓" step={0.05} value={(k.thresholds ?? [0.6, 0.9])[1]} minValue={0} maxValue={1.5} onChange={(v) => set('thresholds', [(k.thresholds ?? [0.6, 0.9])[0], v], 'Faixas do medidor')} /></div></Row>}
        {(k.kind === 'hbar' || k.kind === 'bar') && <Row label="Cor por sinal"><Switch isSelected={k.colorBy === 'sign'} onChange={(v) => set('colorBy', v ? 'sign' : undefined, 'Cor por sinal')} aria-label="Cor por sinal">{null}</Switch></Row>}
      </Section>
      {def.supportsRefs && <RefLinesEditor c={c} />}
      {def.time && <NotesEditor c={c} />}
    </>
  );
}
