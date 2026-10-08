import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Banner, Button, Checkbox, Icon, IconButton, NumberField, SegmentedControl, Select, Switch } from '@biweb/ui';
import { distinct, labelOf, OP_LABEL } from '../../data/query';
import { getDataset, getField, getTable } from '../../data/registry';
import type { Filter, FilterOp } from '../../data/types';
import { describeFilter } from '../../viz/filters';
import { COMP_META, type Comp, type FilterProps } from '../doc';
import { useEditor } from '../store';
import { NoSelection, Row, Section } from './shared';

/** Drill hierarchies available per table: declared on the fields (e.g. Região › Estado › Cidade › Loja) plus curated ones. */
function hierarchies(ds: string, table: string): { id: string; label: string; path: string[] }[] {
  const t = getTable(ds, table), out: { id: string; label: string; path: string[] }[] = [];
  const tagged = t.fields.filter((f) => f.hierarchy);
  for (const tag of new Set(tagged.map((f) => f.hierarchy))) { const path = tagged.filter((f) => f.hierarchy === tag).map((f) => f.name); out.push({ id: path.join('>'), label: path.map((n) => getField(ds, table, n)?.label ?? n).join(' → '), path }); }
  const named = (path: string[], label: string) => { if (path.every((n) => t.fields.some((f) => f.name === n))) out.push({ id: path.join('>'), label, path }); };
  if (table === 'vendas') { named(['regiao', 'canal', 'categoria'], 'Região → Canal → Categoria'); named(['categoria', 'canal'], 'Categoria → Canal'); }
  if (table === 'clientes') { named(['regiao', 'segmento'], 'Região → Segmento'); named(['canal', 'segmento'], 'Canal → Segmento'); }
  if (table === 'enlaces') { named(['camada', 'regiao', 'id'], 'Camada → Região → Enlace'); named(['regiao', 'id'], 'Região → Enlace'); named(['tecnologia', 'regiao'], 'Tecnologia → Região'); }
  if (table === 'nos') { named(['tipo', 'regiao', 'id'], 'Tipo → Região → Nó'); named(['regiao', 'id'], 'Região → Nó'); }
  if (table === 'eventos') { named(['tipo', 'regiao'], 'Tipo → Região'); named(['regiao', 'elementoNome'], 'Região → Elemento'); }
  return out;
}

function Targets({ c, comps }: { c: Comp; comps: Comp[] }) {
  const targets = c.props.targets as 'all' | string[];
  const others = comps.filter((x) => x.id !== c.id && COMP_META[x.type].data && x.type !== 'filter' && x.type !== 'slicer');
  const set = (v: 'all' | string[]) => useEditor.getState().update(c.id, (d) => { d.props.targets = v; }, 'Alterar alvos do filtro');
  return (
    <Section title="Filtra quais componentes">
      <Row label="Alcance"><Select label="Alcance" hideLabel value={targets === 'all' ? 'all' : 'some'} onChange={(v: string) => set(v === 'all' ? 'all' : others.map((x) => x.id))} options={[{ id: 'all', label: 'Toda a página' }, { id: 'some', label: 'Componentes escolhidos' }]} /></Row>
      {targets !== 'all' && <div className="ed-checks">{others.map((o) => <Checkbox key={o.id} isSelected={targets.includes(o.id)} onChange={(v) => set(v ? [...targets, o.id] : targets.filter((x) => x !== o.id))}>{o.name}</Checkbox>)}</div>}
    </Section>
  );
}

const STYLE_OPTS = [{ id: 'dropdown', label: 'Lista suspensa', kinds: ['dimension', 'geo'] }, { id: 'search', label: 'Busca por texto', kinds: ['dimension', 'geo'] }, { id: 'hierarchy', label: 'Hierarquia (região › estado › cidade)', kinds: ['dimension', 'geo'] },
  { id: 'range', label: 'Intervalo numérico', kinds: ['measure'] }, { id: 'daterange', label: 'Intervalo de datas', kinds: ['date'] }, { id: 'relative', label: 'Janela relativa (últimos N dias)', kinds: ['date'] }];
/** Filter Builder: shape, scope (page or whole report), selection mode, default and which visuals it drives. */
function FilterBuilder({ c, comps }: { c: Comp; comps: Comp[] }) {
  const p = c.props as unknown as FilterProps, f = getField(c.data!.dataset, c.data!.table, p.field), set = (patch: Record<string, unknown>, label: string) => useEditor.getState().update(c.id, (d) => { Object.assign(d.props, patch); }, label);
  const t = getTable(c.data!.dataset, c.data!.table), tagged = t.fields.filter((x) => x.hierarchy && x.hierarchy === f?.hierarchy).map((x) => x.name);
  const ok = STYLE_OPTS.find((s) => s.id === (p.style ?? 'dropdown'))?.kinds.includes(f?.kind ?? 'dimension') ?? true;
  return (
    <>
      <Section title="Tipo de filtro">
        <Row label="Formato"><Select label="Formato do filtro" hideLabel value={p.style ?? 'dropdown'} onChange={(v: string) => set(v === 'hierarchy' ? { style: v, hierarchy: tagged.length > 1 ? tagged : [p.field] } : { style: v }, 'Trocar tipo de filtro')} options={STYLE_OPTS.map((s) => ({ id: s.id, label: s.label }))} /></Row>
        {!ok && <Banner tone="warning">Este formato não combina com {f?.label ?? 'o campo'} ({f?.kind === 'measure' ? 'medida' : f?.kind === 'date' ? 'data' : 'dimensão'}). Troque o campo na aba Dados ou o formato.</Banner>}
        {(p.style === 'dropdown' || p.style === undefined) && <Row label="Seleção"><SegmentedControl label="Seleção" value={p.multi ? 'multi' : 'single'} onChange={(v) => set({ multi: v === 'multi' }, v === 'multi' ? 'Seleção múltipla' : 'Seleção única')} options={[{ id: 'single', label: 'Única' }, { id: 'multi', label: 'Múltipla' }]} /></Row>}
        {p.style === 'hierarchy' && <Row label="Níveis"><div className="ed-hier">{(p.hierarchy ?? []).map((n, i) => <span key={n}>{i > 0 && <Icon name="chevronRight" size={12} />}{getField(c.data!.dataset, c.data!.table, n)?.label ?? n}</span>)}{tagged.length < 2 && <small className="bw-muted">Este campo não tem hierarquia declarada.</small>}</div></Row>}
        {p.style === 'range' && <Row label="Limites"><div className="bw-prop-pair"><NumberField label="Mínimo" hideLabel quiet prefix="mín" value={p.rangeMin ?? 0} onChange={(v) => set({ rangeMin: v }, 'Mínimo do intervalo')} /><NumberField label="Máximo" hideLabel quiet prefix="máx" value={p.rangeMax ?? 100} onChange={(v) => set({ rangeMax: v }, 'Máximo do intervalo')} /></div></Row>}
        <Row label="Vale para"><SegmentedControl label="Escopo do filtro" value={p.scope ?? 'page'} onChange={(v) => set({ scope: v }, v === 'report' ? 'Filtro vale para todo o relatório' : 'Filtro vale só para a página')} options={[{ id: 'page', label: 'Esta página' }, { id: 'report', label: 'Relatório' }]} /></Row>
        <p className="ed-help">Relatório → página → visual: o filtro do relatório vale em todas as páginas; o da página, só nela; o do visual, só nele.</p>
      </Section>
      <Targets c={c} comps={comps} />
    </>
  );
}

/** Report and page filters, always applied; widget filters live in each visual's toolbar and Data tab. */
function LevelFilters() {
  const doc = useEditor((s) => s.doc)!, page = useEditor((s) => s.page())!, ds = doc.datasets[0] ?? 'ds_rede_sp', tables = getDataset(ds).tables;
  const [level, setLevel] = useState<'report' | 'page'>('page'), [table, setTable] = useState(tables[0]!.id), [field, setField] = useState(''), [op, setOp] = useState<FilterOp>('='), [val, setVal] = useState('');
  const t = getTable(ds, table), fields = t.fields.filter((f) => !f.hidden), f = fields.find((x) => x.name === field) ?? fields[0]!, isNum = f.kind === 'measure' || f.kind === 'date';
  const values = isNum ? [] : distinct(ds, table, f.name).slice(0, 200);
  const st = useEditor.getState;
  const apply = (lv: 'report' | 'page', fn: (list: Filter[]) => Filter[]) => st().commit(lv === 'report' ? 'Filtro do relatório' : 'Filtro da página', (d) => { if (lv === 'report') d.filters = fn(d.filters ?? []); else { const pg = d.pages.find((x) => x.id === page.id); if (pg) pg.filters = fn(pg.filters ?? []); } });
  const add = () => { if (val === '') return; const value: unknown = f.kind === 'measure' ? Number(val.replace(',', '.')) : op === 'in' ? [val] : val; if (typeof value === 'number' && !Number.isFinite(value)) return; apply(level, (l) => [...l, { field: f.name, op: isNum && !['>', '>=', '<', '<='].includes(op) ? '>=' : op, value }]); setVal(''); };
  const block = (lv: 'report' | 'page', title: string, list: Filter[]) => (
    <div className={`ed-lvl is-${lv}`}><h5>{title}</h5>
      {!list.length && <p className="ed-help">Nenhum filtro.</p>}
      {list.map((x, i) => <div key={i} className="ed-lf"><Icon name="filter" size={12} /><span>{describeFilter(ds, table, x)}</span><IconButton icon="close" size="sm" label="Remover filtro" onPress={() => apply(lv, (l) => l.filter((_, j) => j !== i))} /></div>)}
    </div>
  );
  return (
    <Section title="Filtros por nível">
      {block('report', 'Relatório · todas as páginas', doc.filters ?? [])}
      {block('page', `Página · ${page.name}`, page.filters ?? [])}
      <div className="ed-lvl is-widget"><h5>Visual · em cada visual (barra de ferramentas ▸ Filtrar)</h5><p className="ed-help">Filtros do visual afetam só ele e somam-se aos de cima.</p></div>
      <Row label="Adicionar em"><SegmentedControl label="Nível do novo filtro" value={level} onChange={setLevel} options={[{ id: 'report', label: 'Relatório' }, { id: 'page', label: 'Página' }]} /></Row>
      <div className="ed-lf-add">
        <Select label="Tabela" hideLabel value={table} onChange={(v: string) => { setTable(v); setField(''); setVal(''); }} options={tables.map((x) => ({ id: x.id, label: x.name }))} />
        <Select label="Campo" hideLabel value={f.name} onChange={(v: string) => { setField(v); const nf = fields.find((x) => x.name === v); setOp(nf?.kind === 'measure' ? '>=' : '='); setVal(''); }} options={fields.map((x) => ({ id: x.name, label: x.label }))} />
        <Select label="Operador" hideLabel value={op} onChange={(v: FilterOp) => setOp(v)} options={((f.kind === 'measure' || f.kind === 'date' ? ['>=', '<=', '>', '<', '='] : ['=', '!=', 'contains']) as FilterOp[]).map((o) => ({ id: o, label: OP_LABEL[o] }))} />
        {isNum || op === 'contains' ? <input className="ed-input" aria-label="Valor" placeholder={f.kind === 'date' ? 'AAAA-MM-DD' : 'Valor'} value={val} onChange={(e) => setVal(e.target.value)} /> : <Select label="Valor" hideLabel placeholder="Valor" value={val || undefined} onChange={(v: string) => setVal(v)} options={values.map((v) => ({ id: String(v), label: labelOf(v, f) }))} />}
        <Button size="sm" icon="plus" isDisabled={!val} onPress={() => { if (f.kind === 'date') { const ts = Date.parse(`${val}T00:00:00Z`); if (!Number.isFinite(ts)) return; apply(level, (l) => [...l, { field: f.name, op: (op === '=' ? '>=' : op) as FilterOp, value: ts }]); setVal(''); } else add(); }}>Adicionar filtro</Button>
      </div>
    </Section>
  );
}

export function InteractionsTab() {
  const comps = useEditor(useShallow((s) => s.page()?.comps ?? []));
  const selection = useEditor((s) => s.selection);
  const docPages = useEditor((s) => s.doc?.pages);
  const pages = useMemo(() => docPages?.map((p) => ({ id: p.id, name: p.name })) ?? [], [docPages]);
  const cross = useEditor((s) => s.cross);
  const fv = useEditor((s) => s.filterValues);
  const c = selection.length === 1 ? comps.find((x) => x.id === selection[0]) : undefined;
  const st = useEditor.getState();
  const upd = (label: string, fn: (d: Comp) => void) => c && st.update(c.id, (d) => fn(d as Comp), label);
  const filters = comps.filter((x) => x.type === 'filter' || x.type === 'slicer');
  const emitters = comps.filter((x) => x.interactions.emitCross && COMP_META[x.type].data && x.type !== 'filter' && x.type !== 'slicer');
  const activeFilters = filters.filter((f) => (fv[f.id] ?? []).length);
  const receivers = c ? comps.filter((x) => x.id !== c.id && COMP_META[x.type].data && x.type !== 'filter' && x.type !== 'slicer' && x.type !== 'text') : [];
  const affects = c?.interactions.affects ?? 'all', mode = c?.interactions.crossMode ?? 'filter';
  const hs = c?.data ? hierarchies(c.data.dataset, c.data.table) : [];
  const destField = c?.type === 'chart' ? String(c.interactions.drill?.[0] ?? c.props.x) : '';
  return (
    <div className="ed-tab">
      {c ? (
        <>
          <div className="ed-tab-title">{COMP_META[c.type].label} · {c.name}</div>
          {(c.type === 'filter' || c.type === 'slicer') ? (c.type === 'filter' ? <FilterBuilder c={c} comps={comps} /> : <Targets c={c} comps={comps} />) : COMP_META[c.type].data ? (
            <>
              <Section title="Ao clicar numa marca">
                <Row label="Efeito"><SegmentedControl label="Efeito do clique" value={c.interactions.emitCross ? mode : 'off'} onChange={(v) => upd(v === 'off' ? 'Desligar interação' : v === 'highlight' ? 'Cross-highlight' : 'Cross-filter', (d) => { d.interactions.emitCross = v !== 'off'; if (v !== 'off') d.interactions.crossMode = v as 'filter' | 'highlight'; })} options={[{ id: 'filter', label: 'Filtrar' }, { id: 'highlight', label: 'Destacar' }, { id: 'off', label: 'Nada' }]} /></Row>
                <p className="ed-help">{!c.interactions.emitCross ? 'Clicar não afeta os outros visuais.' : mode === 'filter' ? 'Filtrar: os outros visuais passam a mostrar só a seleção.' : 'Destacar: os outros visuais continuam completos e só realçam a seleção (cross-highlight).'}</p>
                <Row label="Reage a filtros"><Switch isSelected={c.interactions.receive} onChange={(v) => upd(v ? 'Reagir a filtros' : 'Ignorar filtros', (d) => { d.interactions.receive = v; })} aria-label="Reage a filtros e seleções">{null}</Switch></Row>
              </Section>
              {c.interactions.emitCross && receivers.length > 0 && (
                <Section title="A seleção afeta" right={<Button size="sm" onPress={() => upd('Afetar todos', (d) => { d.interactions.affects = 'all'; })}>Todos</Button>}>
                  <div className="ed-ix-matrix">{receivers.map((o) => { const on = affects === 'all' || affects.includes(o.id); return (
                    <div key={o.id} className="ed-ix-row"><Checkbox isSelected={on} onChange={(v) => upd(`${v ? 'Afetar' : 'Não afetar'} ${o.name}`, (d) => { const cur = d.interactions.affects === undefined || d.interactions.affects === 'all' ? receivers.map((x) => x.id) : d.interactions.affects; d.interactions.affects = v ? [...new Set([...cur, o.id])] : cur.filter((x) => x !== o.id); })}>{null}</Checkbox><span className="flex-1">{o.name}</span><button type="button" className="bw-iconbtn bw-iconbtn--sm" aria-label={`Selecionar ${o.name}`} onClick={() => st.select([o.id])}><Icon name="target" size={12} /></button></div>); })}</div>
                </Section>
              )}
            </>
          ) : null}
          {c.type === 'chart' && c.data && (
            <Section title="Drill-down">
              <Row label="Hierarquia"><Select label="Hierarquia de drill-down" hideLabel value={c.interactions.drill?.join('>') ?? ''} onChange={(v: string) => { const h = hs.find((x) => x.id === v); upd(h ? `Drill-down ${h.label}` : 'Sem drill-down', (d) => { d.interactions.drill = h?.path; if (h) d.props.x = h.path[0]!; }); st.set({ drill: { ...st.drill, [c.id]: [] } }); }} options={[{ id: '', label: 'Sem drill-down' }, ...hs.map((h) => ({ id: h.id, label: h.label }))]} /></Row>
              {c.interactions.drill ? <p className="ed-help">Clique numa barra para descer um nível. O caminho aparece acima do gráfico (Brasil / São Paulo / …) com «Voltar» e níveis clicáveis.</p> : <p className="ed-help">{hs.length ? 'Escolha uma hierarquia para o gráfico descer de nível a cada clique.' : 'Esta tabela não tem hierarquia declarada.'}</p>}
            </Section>
          )}
          {['card', 'kpi', 'chart', 'status', 'image', 'text', 'matrix', 'table'].includes(c.type) && pages.length > 1 && (
            <Section title="Drill-through · abrir outra página">
              <Row label="Ao clicar, abrir"><Select label="Página de destino" hideLabel value={c.interactions.navigateTo ?? ''} onChange={(v: string) => upd(v ? `Navegar para ${pages.find((p) => p.id === v)?.name}` : 'Sem navegação', (d) => { d.interactions.navigateTo = v || undefined; })} options={[{ id: '', label: 'Nenhuma' }, ...pages.filter((p) => p.id !== st.pageId).map((p) => ({ id: p.id, label: p.name }))]} /></Row>
              {c.interactions.navigateTo && <><Row label="Levar o contexto"><Switch isSelected={c.interactions.carryContext !== false} onChange={(v) => upd(v ? 'Levar contexto' : 'Não levar contexto', (d) => { d.interactions.carryContext = v; })} aria-label="Levar o contexto">{null}</Switch></Row>
                <p className="ed-help">{c.interactions.carryContext !== false ? `A página de destino recebe ${destField ? `«${getField(c.data?.dataset ?? '', c.data?.table ?? '', destField)?.label ?? destField} = valor clicado»` : 'o valor clicado'} e mostra «Voltar» no topo.` : 'A página de destino abre sem filtros vindos daqui.'}</p></>}
              <p className="ed-help">Funciona na visualização. Em cards, aparece um link para a página.</p>
            </Section>
          )}
        </>
      ) : <NoSelection text="Selecione um componente para configurar cross-filter, drill-down e navegação. Abaixo, filtros por nível e o mapa de interações." />}

      {!c && <LevelFilters />}
      <Section title="Mapa de interações da página">
        {filters.length === 0 && emitters.length === 0 && <p className="ed-help">Sem filtros nem componentes que filtram nesta página.</p>}
        {filters.map((f) => (
          <div key={f.id} className="ed-ix">
            <button type="button" className="ed-ix-src" onClick={() => st.select([f.id])}><Icon name="filter" size={12} />{f.name}</button>
            <Icon name="arrowRight" size={12} />
            <span className="ed-ix-dst">{(f.props.targets as 'all' | string[]) === 'all' ? 'toda a página' : `${(f.props.targets as string[]).length} componentes`}{f.props.scope === 'report' ? ' · relatório' : ''}</span>
          </div>
        ))}
        {emitters.map((e) => { const aff = e.interactions.affects, n = comps.filter((x) => x.id !== e.id && x.interactions.receive && COMP_META[x.type].data && (!aff || aff === 'all' || aff.includes(x.id))).length; return (
          <div key={e.id} className="ed-ix">
            <button type="button" className="ed-ix-src" onClick={() => st.select([e.id])}><Icon name="target" size={12} />{e.name}</button>
            <Icon name="arrowRight" size={12} />
            <span className="ed-ix-dst">{e.interactions.crossMode === 'highlight' ? 'destaca' : 'filtra'} {n} {n === 1 ? 'componente' : 'componentes'}{e.interactions.navigateTo ? ' · abre página' : ''}</span>
          </div>); })}
      </Section>
      <Section title="Estado atual" right={(cross || activeFilters.length > 0) ? <Button size="sm" onPress={() => st.clearAll()}>Limpar tudo</Button> : undefined}>
        {!cross && activeFilters.length === 0 && <p className="ed-help">Nenhum filtro ou seleção ativo.</p>}
        {activeFilters.map((f) => { const fld = getField(f.data!.dataset, f.data!.table, String(f.props.field)); return <div key={f.id} className="ed-lf"><Icon name="filter" size={12} /><span>{fld?.label}: {(fv[f.id] ?? []).map((v) => labelOf(v, fld)).join(', ')}</span></div>; })}
        {cross && <div className="ed-lf"><Icon name="target" size={12} /><span>{cross.label} ({cross.mode === 'highlight' ? 'destaque' : 'filtro'} de {comps.find((x) => x.id === cross.source)?.name})</span></div>}
      </Section>
    </div>
  );
}
