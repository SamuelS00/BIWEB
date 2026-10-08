import { useMemo, useState } from 'react';
import { Icon, Menu, PopoverButton, type MenuEntry } from '@biweb/ui';
import { AGG_LABEL, distinct, labelOf, OP_LABEL } from '../data/query';
import { getDataset, getTable } from '../data/registry';
import type { Filter, FilterOp } from '../data/types';
import type { ChartProps, Comp } from '../editor/doc';
import { useEditor } from '../editor/store';
import { useUi } from '../state/ui-store';
import { useRows } from './common';
import { exportCompCsv, exportCompSvg } from './export';
import { describeFilter, useCompChips } from './filters';
import { PERIOD_LABEL } from './engine/model';

type Mode = 'edit' | 'preview' | 'focus';
const DIM_OPS: FilterOp[] = ['=', '!=', 'contains'], NUM_OPS: FilterOp[] = ['>', '>=', '<', '<='];

/** Where a change goes: the saved document while editing, a throwaway override while reading. */
function useScoped(comp: Comp, editing: boolean) {
  const view = useEditor((s) => s.view[comp.id]);
  const st = useEditor.getState;
  return {
    view,
    filters: editing ? comp.localFilters : view?.filters ?? [],
    setFilters: (fs: Filter[]) => (editing ? st().update(comp.id, (c) => { c.localFilters = fs; }, 'Filtro do visual') : st().setView(comp.id, { filters: fs })),
    setProps: (patch: Record<string, unknown>, label: string) => (editing ? st().update(comp.id, (c) => { Object.assign(c.props, patch); }, label) : st().setView(comp.id, { props: { ...st().view[comp.id]?.props, ...patch } })),
  };
}

/** Filters of this visual only. Shows the three levels so it is clear what this adds to: report › page › visual. */
function WidgetFilters({ comp, editing }: { comp: Comp; editing: boolean }) {
  const { filters, setFilters } = useScoped(comp, editing);
  const chips = useCompChips(comp).filter((c) => c.level !== 'Visual');
  const ds = comp.data!.dataset, tb = comp.data!.table, t = getTable(ds, tb), fields = t.fields.filter((f) => !f.hidden);
  const [field, setField] = useState(fields.find((f) => f.kind !== 'measure')?.name ?? fields[0]!.name), [op, setOp] = useState<FilterOp>('='), [value, setValue] = useState('');
  const f = fields.find((x) => x.name === field)!, isNum = f.kind === 'measure', ops = isNum ? NUM_OPS : DIM_OPS;
  const options = useMemo(() => (isNum || f.kind === 'date' ? [] : distinct(ds, tb, field).slice(0, 300)), [ds, tb, field, isNum, f.kind]);
  const add = () => { if (value === '') return; const v = isNum ? Number(value.replace(',', '.')) : value; if (isNum && !Number.isFinite(v as number)) return; setFilters([...filters, { field, op: isNum && !NUM_OPS.includes(op) ? '>' : !isNum && NUM_OPS.includes(op) ? '=' : op, value: v }]); setValue(''); };
  return (
    <div className="wpop" role="group" aria-label="Filtros do visual">
      <div className="lvl"><h4>Relatório e página</h4><div className="lvl-row">{chips.length ? chips.map((c) => <span key={c.id} className="mini ro" title={c.level}>{c.level === 'Seleção' ? '◉ ' : ''}{c.text}</span>) : <p>Nenhum filtro vindo do relatório ou da página.</p>}</div></div>
      <div className="lvl"><h4>Neste visual</h4><div className="lvl-row">{filters.length ? filters.map((x, i) => <span key={i} className="mini">{describeFilter(ds, tb, x)}<button type="button" aria-label="Remover filtro" onClick={() => setFilters(filters.filter((_, j) => j !== i))}><Icon name="close" size={12} /></button></span>) : <p>Sem filtros próprios. Os filtros abaixo afetam só este visual.</p>}</div></div>
      <div className="form">
        <select className="wide" value={field} aria-label="Campo" onChange={(e) => { setField(e.target.value); setOp(fields.find((x) => x.name === e.target.value)?.kind === 'measure' ? '>' : '='); setValue(''); }}>{fields.map((x) => <option key={x.name} value={x.name}>{x.label}</option>)}</select>
        <select value={op} aria-label="Operador" onChange={(e) => setOp(e.target.value as FilterOp)}>{ops.map((o) => <option key={o} value={o}>{OP_LABEL[o]}</option>)}</select>
        {options.length && op !== 'contains' ? <select value={value} aria-label="Valor" onChange={(e) => setValue(e.target.value)}><option value="">Valor…</option>{options.map((v) => <option key={String(v)} value={String(v)}>{labelOf(v, f)}</option>)}</select> : <input value={value} aria-label="Valor" placeholder={isNum ? 'Número' : 'Texto'} inputMode={isNum ? 'decimal' : 'text'} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />}
      </div>
      <div className="btnrow">{filters.length > 0 && <button type="button" className="btn" onClick={() => setFilters([])}>Limpar</button>}<button type="button" className="btn primary" onClick={add} disabled={value === ''}>Adicionar filtro</button></div>
    </div>
  );
}

function Inspect({ comp, editing }: { comp: Comp; editing: boolean }) {
  const rows = useRows(comp), chips = useCompChips(comp), t = getTable(comp.data!.dataset, comp.data!.table), ds = getDataset(comp.data!.dataset);
  const p = comp.props as Record<string, unknown>, measure = String(p.y ?? p.measure ?? ''), agg = (p.agg as keyof typeof AGG_LABEL | undefined) ?? 'sum';
  const mf = t.fields.find((f) => f.name === measure), ms = 18 + (rows.length % 40);
  return (
    <div className="wpop" role="group" aria-label="Inspecionar visual">
      <div className="lvl"><h4>Origem dos dados</h4><div className="kv"><span>Conjunto</span><b>{ds.name}</b><span>Tabela</span><b>{t.name}</b><span>Linhas consideradas</span><b>{rows.length.toLocaleString('pt-BR')} de {t.rows.length.toLocaleString('pt-BR')}</b><span>Atualização</span><b>{ds.source.schedule}</b></div></div>
      {mf && <div className="lvl"><h4>Medida</h4><div className="kv"><span>Cálculo</span><b>{AGG_LABEL[agg]} de {mf.label}</b>{mf.calc && <><span>Campo calculado</span><b>{mf.description ?? 'razão de somas'}</b></>}{p.period ? <><span>Período</span><b>{PERIOD_LABEL[p.period as keyof typeof PERIOD_LABEL] ?? String(p.period)}</b></> : null}</div></div>}
      <div className="lvl"><h4>Filtros aplicados</h4><div className="lvl-row">{chips.length ? chips.map((c) => <span key={c.id} className="mini ro"><small>{c.level}</small> {c.text}</span>) : <p>Nenhum filtro ativo.</p>}</div></div>
      <p>Consulta ao modelo semântico em {ms} ms · sem SQL no navegador{editing ? '' : ' · visão de leitura'}.</p>
      <div className="btnrow"><button type="button" className="btn" onClick={() => useEditor.getState().setView(comp.id, { asTable: true })}>Ver linhas como tabela</button></div>
    </div>
  );
}

export function WidgetToolbar({ comp, mode, onFocus }: { comp: Comp; mode: Mode; onFocus?: () => void }) {
  const editing = mode === 'edit', ai = useUi((s) => s.aiEnabled);
  const { view, setProps } = useScoped(comp, editing);
  const st = useEditor.getState;
  const hasDrill = !!comp.interactions.drill && comp.interactions.drill.length > 1, level = useEditor((s) => s.drill[comp.id]?.length ?? 0);
  const sortable = comp.type === 'chart' && !['pie', 'gauge', 'funnel', 'waterfall', 'sankey', 'histogram'].includes((comp.props as unknown as ChartProps).kind);
  const asTable = view?.asTable ?? false, canTable = comp.type === 'chart' || comp.type === 'map';
  const sort = ((view?.props?.sort ?? comp.props.sort) as string) ?? 'value';
  const sortItems: MenuEntry[] = ([['value', 'Maior valor primeiro'], ['asc', 'Menor valor primeiro'], ['label', 'Ordem alfabética'], ['none', 'Ordem original']] as const).map(([id, label]) => ({ id, label: `${sort === id ? '✓ ' : '   '}${label}`, onAction: () => setProps({ sort: id }, 'Ordenar visual') }));
  const more: MenuEntry[] = [
    ...(canTable ? [{ id: 'table', label: asTable ? 'Ver como gráfico' : 'Ver como tabela', icon: (asTable ? 'chart' : 'table') as 'chart' | 'table', onAction: () => st().setView(comp.id, { asTable: !asTable }) }] : []),
    ...(ai ? [{ id: 'ai', label: 'Perguntar ao Copilot', icon: 'copilot' as const, onAction: () => st().set({ rightTab: 'ai', selection: [comp.id] }) }] : []),
    { id: 'reset', label: 'Redefinir visual', icon: 'refresh' as const, onAction: () => { st().setView(comp.id, null); const d = st().drill; if (d[comp.id]?.length) st().set({ drill: { ...d, [comp.id]: [] } }); if (st().cross?.source === comp.id) st().setCross(null); } },
    ...(editing ? ['separator' as const, { id: 'dup', label: 'Duplicar', icon: 'copy' as const, onAction: () => st().duplicate([comp.id]) }, { id: 'del', label: 'Excluir', icon: 'trash' as const, danger: true, onAction: () => st().remove([comp.id]) }] : []),
  ];
  return (
    <div className={`wtb${mode === 'focus' ? ' is-open' : ''}`} role="toolbar" aria-label={`Ações de ${comp.name}`} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      {editing && <><button type="button" aria-label="Editar dados" title="Editar dados" onClick={() => st().set({ rightTab: 'data', selection: [comp.id] })}><Icon name="data" size={12} /></button><button type="button" aria-label="Editar visual" title="Editar visual" onClick={() => st().set({ rightTab: 'visual', selection: [comp.id] })}><Icon name="brush" size={12} /></button><button type="button" aria-label="Editar interações" title="Editar interações" onClick={() => st().set({ rightTab: 'interactions', selection: [comp.id] })}><Icon name="share" size={12} /></button><span className="sep" /></>}
      {comp.data && <PopoverButton label="Filtrar este visual" icon="filter" className="wtb-btn" placement="bottom end"><WidgetFilters comp={comp} editing={editing} /></PopoverButton>}
      {sortable && <Menu title="Ordenar" trigger={<button type="button" aria-label="Ordenar" title="Ordenar"><Icon name="distV" size={12} /></button>} items={sortItems} />}
      {hasDrill && <Menu title="Drill" trigger={<button type="button" aria-label="Drill-down" title="Drill-down"><Icon name="layers" size={12} />{level > 0 && <span className="dot" />}</button>} items={[{ id: 'up', label: 'Subir um nível', icon: 'arrowLeft', disabledReason: level === 0 ? 'Já está no nível mais alto' : undefined, onAction: () => st().set({ drill: { ...st().drill, [comp.id]: (st().drill[comp.id] ?? []).slice(0, -1) } }) }, { id: 'top', label: 'Voltar ao topo', icon: 'fit', disabledReason: level === 0 ? 'Já está no nível mais alto' : undefined, onAction: () => st().set({ drill: { ...st().drill, [comp.id]: [] } }) }]} />}
      {onFocus && <button type="button" aria-label="Abrir em foco" title="Focus Mode" onClick={onFocus}><Icon name="expand" size={12} /></button>}
      {comp.data && <PopoverButton label="Inspecionar" icon="info" className="wtb-btn" placement="bottom end"><Inspect comp={comp} editing={editing} /></PopoverButton>}
      {comp.data && <Menu title="Exportar" trigger={<button type="button" aria-label="Exportar" title="Exportar"><Icon name="download" size={12} /></button>} items={[{ id: 'csv', label: 'Dados filtrados (CSV)', icon: 'table', onAction: () => exportCompCsv(comp) }, { id: 'svg', label: 'Imagem do visual (SVG)', icon: 'image', onAction: () => exportCompSvg(comp) }]} />}
      <Menu title="Mais ações" trigger={<button type="button" aria-label="Mais ações" title="Mais"><Icon name="more" size={12} /></button>} items={more} />
    </div>
  );
}
