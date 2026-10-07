import { useState } from 'react';
import { Badge, Button, FieldTypeIcon, Icon, IconButton, NumberField, SegmentedControl, Select, TextField } from '@biweb/ui';
import { AGG_LABEL, distinct, labelOf, OP_LABEL } from '../../data/query';
import { getTable, useData } from '../../data/registry';
import type { Agg, Filter, FilterOp } from '../../data/types';
import type { ChartProps, Comp, KpiProps, MatrixProps, Scene3DProps, StatusProps, TableProps, TimelineProps } from '../doc';
import { COMP_META } from '../doc';
import { useEditor } from '../store';
import { fieldOpts, fieldsOf, kindOf, NoSelection, Row, Section, useProp, Well } from './shared';

const AGGS: Agg[] = ['sum', 'avg', 'min', 'max', 'count', 'distinct'];
const isMeasure = (f: { kind: string }) => f.kind === 'measure';
const isDim = (f: { kind: string }) => f.kind !== 'measure';

/** Árvore do dataset: tabelas e campos arrastáveis para os slots do componente. */
function DatasetTree() {
  const datasets = useData((s) => s.datasets);
  const docDs = useEditor((s) => s.doc?.datasets ?? []);
  const [open, setOpen] = useState<string[]>(['enlaces']);
  const [q, setQ] = useState('');
  return (
    <>
      {datasets.map((d) => {
        const inDoc = docDs.includes(d.id);
        return (
          <div key={d.id} className="ed-ds">
            <div className="ed-ds-head">
              <Icon name="data" size={16} /><b>{d.name}</b>{d.certified && <Badge tone="success" icon="check">Certificado</Badge>}{d.imported && <Badge tone="accent">Importado</Badge>}
              <span className="flex-1" />
              {!inDoc && <Button size="sm" onPress={() => useEditor.getState().commit(`Adicionar dataset ${d.name}`, (x) => { x.datasets.push(d.id); })}>Usar</Button>}
            </div>
            <span className="bw-cap bw-muted ed-ds-src">{d.source.kind} · {d.source.label} · {d.tables.length} tabelas</span>
            {inDoc && (
              <>
                <div className="bw-search ed-ds-search"><TextField label="Buscar campo" hideLabel quiet icon="search" placeholder="Buscar campo" value={q} onChange={setQ} /></div>
                {d.tables.map((t) => {
                  const fs = t.fields.filter((f) => !f.hidden && (!q || f.label.toLowerCase().includes(q.toLowerCase())));
                  if (q && !fs.length) return null;
                  const isOpen = open.includes(t.id) || !!q;
                  return (
                    <div key={t.id} className="ed-tbl">
                      <button type="button" className="ed-tbl-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? open.filter((x) => x !== t.id) : [...open, t.id])}>
                        <Icon name={isOpen ? 'chevronDown' : 'chevronRight'} size={12} /><Icon name="table" size={12} />{t.name}<span className="bw-num bw-muted">{t.rows.length.toLocaleString('pt-BR')}</span>
                      </button>
                      {isOpen && fs.map((f) => (
                        <div key={f.name} className="ed-fld" draggable title={f.description ?? `Arraste para um slot · ${f.label}`}
                          onDragStart={(e) => { e.dataTransfer.setData('application/x-biweb-field', JSON.stringify({ table: t.id, field: f.name })); e.dataTransfer.effectAllowed = 'copy'; }}>
                          <FieldTypeIcon kind={kindOf(f)} /><span>{f.label}</span><span className="bw-mono bw-muted">{f.name}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        );
      })}
    </>
  );
}

function LocalFilters({ c }: { c: Comp }) {
  const [field, setField] = useState<string>('');
  const fs = fieldsOf(c);
  const f = fs.find((x) => x.name === field);
  const [op, setOp] = useState<FilterOp>('=');
  const [val, setVal] = useState('');
  const vals = f && f.kind !== 'measure' ? distinct(c.data!.dataset, c.data!.table, f.name).slice(0, 60) : [];
  const add = () => {
    if (!f) return;
    const value: unknown = f.kind === 'measure' ? Number(val.replace(',', '.')) : op === 'in' ? [val] : val;
    useEditor.getState().update(c.id, (d) => { d.localFilters.push({ field: f.name, op, value }); }, `Filtro local ${f.label}`);
    setVal('');
  };
  const show = (x: Filter) => { const ff = fs.find((y) => y.name === x.field); return `${ff?.label ?? x.field} ${OP_LABEL[x.op]} ${Array.isArray(x.value) ? x.value.map((v) => labelOf(v, ff)).join(', ') : labelOf(x.value, ff)}`; };
  return (
    <Section title={`Filtros deste componente${c.localFilters.length ? ` · ${c.localFilters.length}` : ''}`}>
      {c.localFilters.map((x, i) => (
        <div key={i} className="ed-lf"><Icon name="filter" size={12} /><span>{show(x)}</span><IconButton icon="close" size="sm" label="Remover filtro" onPress={() => useEditor.getState().update(c.id, (d) => { d.localFilters.splice(i, 1); }, 'Remover filtro local')} /></div>
      ))}
      <div className="ed-lf-add">
        <Select label="Campo do filtro" hideLabel placeholder="Campo" value={field || undefined} onChange={(v: string) => { setField(v); const ff = fs.find((y) => y.name === v); setOp(ff?.kind === 'measure' ? '>' : '='); setVal(''); }} options={fieldOpts(c)} />
        {f && <Select label="Operador" hideLabel value={op} onChange={(v: FilterOp) => setOp(v)} options={(f.kind === 'measure' ? ['>', '>=', '<', '<=', '=', '!='] as FilterOp[] : ['=', '!=', 'contains'] as FilterOp[]).map((o) => ({ id: o, label: OP_LABEL[o] }))} />}
        {f && (f.kind === 'measure' || op === 'contains' ? <TextField label="Valor" hideLabel placeholder="Valor" value={val} onChange={setVal} /> : <Select label="Valor" hideLabel placeholder="Valor" value={val || undefined} onChange={(v: string) => setVal(v)} options={vals.map((v) => ({ id: String(v), label: labelOf(v, f) }))} />)}
        {f && <Button size="sm" icon="plus" isDisabled={!val} onPress={add}>Adicionar</Button>}
      </div>
    </Section>
  );
}

function Binding({ c }: { c: Comp }) {
  const set = useProp(c);
  const datasets = useData((s) => s.datasets);
  const docDs = useEditor((s) => s.doc?.datasets ?? []);
  const ds = datasets.find((d) => d.id === c.data!.dataset) ?? datasets[0]!;
  const p = c.props;
  const tableSel = (
    <>
      <Row label="Dataset"><Select label="Dataset" hideLabel value={c.data!.dataset} onChange={(v: string) => useEditor.getState().update(c.id, (d) => { d.data!.dataset = v; }, 'Trocar dataset')} options={datasets.filter((d) => docDs.includes(d.id) || d.id === c.data!.dataset).map((d) => ({ id: d.id, label: d.name }))} /></Row>
      <Row label="Tabela"><Select label="Tabela" hideLabel value={c.data!.table} onChange={(v: string) => useEditor.getState().update(c.id, (d) => { d.data!.table = v; }, `Trocar tabela para ${getTable(ds.id, v).name}`)} options={ds.tables.map((t) => ({ id: t.id, label: `${t.name} · ${t.rows.length.toLocaleString('pt-BR')}` }))} /></Row>
    </>
  );
  const agg = (k = 'agg') => <Row label="Agregação"><Select label="Agregação" hideLabel value={p[k] as Agg} onChange={(v: Agg) => set(k, v, `Agregação: ${AGG_LABEL[v]}`)} options={AGGS.map((a) => ({ id: a, label: AGG_LABEL[a] }))} /></Row>;
  let wells: React.ReactNode = null;
  switch (c.type) {
    case 'kpi': { const k = p as unknown as KpiProps; wells = <><Well c={c} label="Valor" value={k.measure} onChange={(v) => set('measure', v, 'Trocar medida do KPI')} hint="Arraste uma medida" />{agg()}</>; break; }
    case 'chart': {
      const k = p as unknown as ChartProps;
      wells = k.kind === 'scatter' ? (
        <><Well c={c} label="Eixo X" value={k.x} accept={isMeasure} onChange={(v) => set('x', v, 'Trocar eixo X')} hint="Arraste uma medida" /><Well c={c} label="Eixo Y" value={k.y} accept={isMeasure} onChange={(v) => set('y', v, 'Trocar eixo Y')} hint="Arraste uma medida" /><Well c={c} label="Cor (legenda)" optional value={k.series} accept={isDim} onChange={(v) => set('series', v || undefined, 'Trocar legenda')} hint="Arraste uma dimensão" /></>
      ) : (
        <>
          <Well c={c} label={k.kind === 'pie' ? 'Fatias' : 'Eixo X (categoria ou data)'} value={k.x} accept={isDim} onChange={(v) => set('x', v, 'Trocar eixo X')} hint="Arraste uma dimensão ou data" />
          <Well c={c} label="Valores" value={k.y} onChange={(v) => { set('y', v, 'Trocar valores'); const f = fieldsOf(c).find((x) => x.name === v); if (f && f.kind !== 'measure' && k.agg !== 'count' && k.agg !== 'distinct') set('agg', 'count', 'Agregação: Contagem'); }} hint="Arraste uma medida" />
          {agg()}
          {k.kind !== 'pie' && <Well c={c} label="Legenda (séries)" optional value={k.series} accept={isDim} onChange={(v) => set('series', v || undefined, 'Trocar legenda')} hint="Arraste uma dimensão" />}
          {fieldsOf(c).find((f) => f.name === k.x)?.kind === 'date'
            ? <Row label="Grão"><SegmentedControl label="Grão de tempo" value={k.grain} onChange={(v) => set('grain', v, 'Trocar grão')} options={[{ id: 'day', label: 'Dia' }, { id: 'week', label: 'Semana' }]} /></Row>
            : <><Row label="Ordenar"><Select label="Ordenar" hideLabel value={k.sort} onChange={(v: string) => set('sort', v, 'Trocar ordenação')} options={[{ id: 'value', label: 'Maiores primeiro' }, { id: 'asc', label: 'Menores primeiro' }, { id: 'label', label: 'Alfabética' }, { id: 'none', label: 'Original' }]} /></Row>
              <Row label="Mostrar"><NumberField label="Limite de categorias" hideLabel quiet value={k.limit} minValue={1} maxValue={50} unit="itens" onChange={(v) => set('limit', v, 'Trocar limite')} /></Row></>}
        </>
      );
      break;
    }
    case 'table': {
      const k = p as unknown as TableProps;
      const fs = fieldsOf(c);
      wells = (
        <Section title={`Colunas · ${k.columns.length}`}>
          <div className="ed-cols">
            {k.columns.map((col, i) => { const f = fs.find((x) => x.name === col); return f ? (
              <div key={col} className="ed-col"><FieldTypeIcon kind={kindOf(f)} /><span>{f.label}</span>
                <IconButton icon="arrowLeft" size="sm" label="Mover para a esquerda" isDisabled={i === 0} onPress={() => set('columns', k.columns.map((x, j) => (j === i - 1 ? col : j === i ? k.columns[i - 1]! : x)), 'Reordenar colunas')} />
                <IconButton icon="close" size="sm" label={`Remover ${f.label}`} onPress={() => set('columns', k.columns.filter((x) => x !== col), `Remover coluna ${f.label}`)} />
              </div>) : null; })}
          </div>
          <Well c={c} label="Adicionar coluna" value={undefined} onChange={(v) => !k.columns.includes(v) && set('columns', [...k.columns, v], 'Adicionar coluna')} hint="Arraste um campo" />
          <Row label="Ordenar por"><Select label="Ordenar por" hideLabel value={k.sortBy ?? ''} onChange={(v: string) => set('sortBy', v || undefined, 'Trocar ordenação')} options={fieldOpts(c, undefined, 'Sem ordenação')} /></Row>
        </Section>
      );
      break;
    }
    case 'matrix': { const k = p as unknown as MatrixProps; wells = <><Well c={c} label="Linhas" value={k.rows} accept={isDim} onChange={(v) => set('rows', v, 'Trocar linhas')} hint="Arraste uma dimensão" /><Well c={c} label="Colunas" value={k.cols} accept={isDim} onChange={(v) => set('cols', v, 'Trocar colunas')} hint="Arraste uma dimensão" /><Well c={c} label="Valores" value={k.measure} onChange={(v) => set('measure', v, 'Trocar valores')} hint="Arraste uma medida" />{agg()}</>; break; }
    case 'filter': case 'slicer': wells = <Well c={c} label="Campo" value={String(p.field)} accept={isDim} onChange={(v) => { set('field', v, 'Trocar campo do filtro'); useEditor.getState().setFilter(c.id, []); const f = fieldsOf(c).find((x) => x.name === v); if (f) useEditor.getState().update(c.id, (d) => { d.style.title = f.label; d.name = f.label; }, 'Trocar campo do filtro'); }} hint="Arraste uma dimensão" />; break;
    case 'timeline': { const k = p as unknown as TimelineProps; wells = <><Well c={c} label="Data" value={k.dateField} accept={(f) => f.kind === 'date'} onChange={(v) => set('dateField', v)} hint="Arraste uma data" /><Well c={c} label="Cor por" value={k.groupBy} accept={isDim} onChange={(v) => set('groupBy', v, 'Trocar agrupamento')} hint="Arraste uma dimensão" /><Row label="Período"><Select label="Período" hideLabel value={String(k.days)} onChange={(v: string) => set('days', Number(v), 'Trocar período')} options={[{ id: '7', label: '7 dias' }, { id: '14', label: '14 dias' }, { id: '30', label: '30 dias' }]} /></Row></>; break; }
    case 'status': { const k = p as unknown as StatusProps; wells = <><Row label="Modo"><SegmentedControl label="Modo" value={k.mode} onChange={(v) => set('mode', v, 'Trocar modo do indicador')} options={[{ id: 'counts', label: 'Contagem' }, { id: 'element', label: 'Elemento' }]} /></Row>{k.mode === 'element' ? <Row label="Elemento"><Select label="Elemento" hideLabel value={k.element} onChange={(v: string) => set('element', v, 'Trocar elemento')} options={getTable(c.data!.dataset, c.data!.table).rows.slice(0, 200).map((r) => ({ id: String(r.id), label: String(r.id) }))} /></Row> : <Well c={c} label="Campo de status" value={k.field} accept={isDim} onChange={(v) => set('field', v)} hint="Arraste o campo status" />}</>; break; }
    case 'scene3d': { const k = p as unknown as Scene3DProps; wells = <Row label="Foco"><Select label="Torre em foco" hideLabel value={k.focus} onChange={(v: string) => set('focus', v, `Focar ${v}`)} options={getTable(c.data!.dataset, 'nos').rows.filter((r) => r.tipo === 'Torre').map((r) => ({ id: String(r.id), label: String(r.id) }))} /></Row>; break; }
    case 'map': wells = <p className="ed-help">O mapa usa as tabelas Enlaces, Nós, Regiões, Rotas e Eventos do dataset. Camadas e cores ficam na aba Visual.</p>; break;
  }
  return (
    <>
      <Section title="Fonte">{tableSel}</Section>
      <Section title="Campos">{wells}</Section>
      {c.type !== 'map' && c.type !== 'scene3d' && <LocalFilters c={c} />}
    </>
  );
}

export function DataTab() {
  const sel = useEditor((s) => (s.selection.length === 1 ? s.page()?.comps.find((c) => c.id === s.selection[0]) : undefined));
  return (
    <div className="ed-tab">
      {sel && sel.data ? <><div className="ed-tab-title">{COMP_META[sel.type].label} · {sel.name}</div><Binding c={sel} /></>
        : sel ? <NoSelection text={`${COMP_META[sel.type].label} não usa dados. Selecione um gráfico, tabela, KPI, mapa ou filtro.`} /> : <NoSelection text="Selecione um componente para ligar campos. Arraste campos da árvore abaixo para os slots." />}
      <Section title="Dados do relatório"><DatasetTree /></Section>
      <Relationships />
    </div>
  );
}

function Relationships() {
  const ds = useData((s) => s.datasets[0]!);
  return (
    <Section title={`Relacionamentos · ${ds.relationships.length}`}>
      {ds.relationships.map((r) => <div key={r.from + r.to} className="ed-rel"><span className="bw-mono">{r.from}</span><Icon name="arrowRight" size={12} /><span className="bw-mono">{r.to}</span><span className="bw-cap bw-muted">N:1</span></div>)}
    </Section>
  );
}
