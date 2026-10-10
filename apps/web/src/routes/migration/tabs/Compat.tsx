import { useMemo, useState } from 'react';
import { Banner, Icon, SegmentedControl } from '@biweb/ui';
import { ITEMS, REPORTS, SAMPLES, compatCategories, reportId } from '../data';
import type { Cat } from '../data';
import { COMPAT, STRATEGIES, compatLabel, platformOf } from '../model';
import type { Compat as C, Item, Strategy } from '../model';
import { effectiveStrategy, useMig } from '../store';
import type { TabId } from '../store';
import { CompatBadge, Conf, MixBar, Section, StrategyChip, nf } from '../ui';

type View = 'cats' | 'items' | 'strategy';
const KIND_OF: Record<string, string[]> = { model: ['table'], metrics: ['measure'], visuals: ['visual'], maps: ['map'], refresh: ['process'] };
const SAMPLE_OF: Record<string, string> = { filters: 'filter', interactions: 'action', navigation: 'navigation', security: 'security' };

function rowsFor(cat: string): { id: string; name: string; type: string; target: string; compat: C; item?: Item; conf?: number }[] {
  if (KIND_OF[cat]) return [...ITEMS.values()].filter((x) => KIND_OF[cat]!.includes(x.kind) && x.type !== 'Fonte de dados').map((x) => ({ id: x.id, name: x.name, type: x.type ?? x.kind, target: x.target, compat: x.compat, item: x, conf: x.confidence }));
  if (cat === 'custom') return [...ITEMS.values()].filter((x) => x.kind === 'visual' && /Custom|Python|R visual/.test(x.type ?? '')).map((x) => ({ id: x.id, name: x.name, type: x.type ?? '', target: x.target, compat: x.compat, item: x, conf: x.confidence }));
  const s = SAMPLES[SAMPLE_OF[cat] ?? '']; return (s ?? []).map((x) => ({ id: x.id, name: x.name, type: x.meta, target: 'Equivalente BIWEB', compat: x.compat }));
}

export function Compat({ onGo }: { onGo: (t: TabId, sel?: string) => void }) {
  const st = useMig(), ps = st.cur(), project = st.projects.find((p) => p.id === st.pid)!, full = project.detail === 'full';
  const [view, setView] = useState<View>('cats'), [cat, setCat] = useState('visuals'), [flt, setFlt] = useState<C | 'all'>('all'), [rep, setRep] = useState<string>('all');
  const cats = useMemo(() => (full ? compatCategories() : summaryCats(project)), [full, project]);
  const totals = useMemo(() => cats.filter((c) => c.id !== 'custom').reduce((a, c) => ({ native: a.native + c.native, equivalent: a.equivalent + c.equivalent, redesign: a.redesign + c.redesign, review: a.review + c.review }), { native: 0, equivalent: 0, redesign: 0, review: 0 }), [cats]);
  const rows = useMemo(() => rowsFor(cat).filter((r) => (flt === 'all' || r.compat === flt) && (rep === 'all' || !r.item || r.item.path.includes(REPORTS.find((x) => x.id === rep)?.name ?? ''))), [cat, flt, rep]);
  const cur = cats.find((c) => c.id === cat);
  const pl = platformOf(project.platform);
  return <div className="ms-compat">
    <div className="ms-sum" role="group" aria-label="Resumo de compatibilidade">
      {COMPAT.map((c) => { const n = c.id === 'unsupported' ? 0 : totals[c.id as 'native']; return <button key={c.id} type="button" className={`is-${c.id}${flt === c.id ? ' is-on' : ''}`} onClick={() => { setFlt(flt === c.id ? 'all' : c.id); setView('items'); }}><b>{nf(n)}</b><span>{c.label}</span><MixBar mix={{ native: c.id === 'native' ? 1 : 0, equivalent: c.id === 'equivalent' ? 1 : 0, redesign: c.id === 'redesign' ? 1 : 0, review: c.id === 'review' ? 1 : 0 }} height={3} /></button>; })}
    </div>
    <div className="ms-compat-bar"><SegmentedControl label="Visão" value={view} onChange={setView} options={full ? [{ id: 'cats', label: 'Por categoria' }, { id: 'items', label: 'Itens' }, { id: 'strategy', label: 'Estratégias' }] : [{ id: 'cats', label: 'Por categoria' }]} />
      <span className="ms-hint">{full ? `${nf(totals.native + totals.equivalent + totals.redesign + totals.review)} objetos avaliados em ${cats.length} categorias` : `Estimativa para ${pl.name}. A análise detalhada de itens está no projeto de demonstração.`}</span></div>

    {view === 'cats' && <div className="ms-cats">
      <table className="ms-grid is-cats"><thead><tr><th>Categoria</th><th>Total</th><th>Distribuição</th>{COMPAT.slice(0, 4).map((c) => <th key={c.id}>{c.label}</th>)}</tr></thead>
        <tbody>{cats.map((c, i) => <tr key={c.id} tabIndex={0} aria-selected={cat === c.id} onClick={() => { setCat(c.id); setFlt('all'); setView(full ? 'items' : 'cats'); }} onKeyDown={(e) => { if (e.key === 'Enter') { setCat(c.id); setView(full ? 'items' : 'cats'); } }}>
          <td><b>{c.label}</b><small>{c.note}</small></td><td className="num">{nf(c.total)}</td><td className="ms-cell-mix"><MixBar mix={c} height={8} /></td>
          {(['native', 'equivalent', 'redesign', 'review'] as const).map((k) => <td key={k} className={`num${c[k] ? '' : ' is-zero'}`}>{c[k] || '–'}</td>)}</tr>)}</tbody></table>
      <p className="ms-hint">Os percentuais não bastam: cada categoria mostra o que passa direto, o que muda de forma e o que depende de uma decisão.</p></div>}

    {view === 'items' && <div className="ms-items">
      <div className="ms-items-tools">
        <div className="ms-chips is-tabs" role="tablist" aria-label="Categoria">{cats.map((c: Cat) => <button key={c.id} role="tab" aria-selected={cat === c.id} onClick={() => setCat(c.id)}>{c.label}<span>{c.total}</span></button>)}</div>
        <div className="ms-items-filters"><SegmentedControl label="Compatibilidade" value={flt} onChange={setFlt} options={[{ id: 'all', label: 'Todos' }, { id: 'native', label: 'Nativo' }, { id: 'equivalent', label: 'Equivalente' }, { id: 'redesign', label: 'Redesenhar' }, { id: 'review', label: 'Revisão' }]} />
          {cat === 'visuals' && <select aria-label="Relatório" value={rep} onChange={(e) => setRep(e.target.value)} className="ms-select"><option value="all">Todos os relatórios</option>{REPORTS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>}</div></div>
      {rows.length ? <div className="ms-table-scroll"><table className="ms-grid"><thead><tr><th>Item</th><th>Origem</th><th>Alvo no BIWEB</th><th>Compatibilidade</th><th>Estratégia</th><th>Confiança</th></tr></thead>
        <tbody>{rows.slice(0, 120).map((r) => <tr key={r.id} tabIndex={0} aria-selected={st.sel === r.id} className={st.sel === r.id ? 'is-sel' : ''} onClick={() => { if (r.item) st.set({ sel: r.id, rightTab: 'inspector', rightOpen: true }); }} onKeyDown={(e) => { if (e.key === 'Enter' && r.item) st.set({ sel: r.id }); }}>
          <td><b>{r.name}</b></td><td>{r.type}</td><td>{r.target}</td><td><CompatBadge c={r.compat} /></td><td>{r.item ? <StrategyChip s={effectiveStrategy(ps, project, r.id).value} /> : <span className="ms-muted">–</span>}</td><td>{r.conf ? <Conf n={r.conf} /> : <span className="ms-muted">–</span>}</td></tr>)}</tbody></table>
        {rows.length > 120 && <p className="ms-hint">Exibindo 120 de {nf(rows.length)}. Use os filtros para refinar.</p>}</div>
        : <div className="ms-clear">{flt === 'all' ? <p className="ms-hint">Sem itens nessa categoria.</p> : <Banner tone="success">{flt === 'review' || flt === 'redesign' ? 'Todos os componentes selecionados têm alvo compatível.' : 'Nenhum item neste filtro.'}</Banner>}</div>}
      {cur && cur.id === 'visuals' && flt === 'all' && rep === 'all' && <p className="ms-hint">VISUALIZAÇÕES · {cur.native} nativos · {cur.equivalent} equivalentes · {cur.redesign} para redesenhar · {cur.review} exigem revisão.</p>}
    </div>}

    {view === 'strategy' && (full ? <Strategies /> : <p className="ms-hint">Estratégia do projeto: <StrategyChip s={project.strategy} />. Exceções por item ficam disponíveis no projeto de demonstração.</p>)}
  </div>;
}

function summaryCats(project: { scope: { visuals: number; measures: number; datasets: number; maps: number; processes: number }; mix: { native: number; equivalent: number; redesign: number; review: number } }): Cat[] {
  const row = (id: string, label: string, total: number, note: string): Cat => { const m = project.mix, eq = Math.round(total * m.equivalent / 100), rd = Math.round(total * m.redesign / 100), rv = Math.round(total * m.review / 100); return { id, label, total, native: Math.max(0, total - eq - rd - rv), equivalent: eq, redesign: rd, review: rv, note }; };
  const s = project.scope; return [row('visuals', 'Visualizações', s.visuals, 'Visuais, tabelas e cartões'), row('metrics', 'Métricas', s.measures, 'Cálculos e medidas'), row('model', 'Modelo de dados', s.datasets * 6, 'Tabelas e relacionamentos'), row('maps', 'Mapas', s.maps, 'Candidatos a Map Workspace'), row('refresh', 'Refresh e processos', s.processes, 'Candidatos a Workflow')].filter((c) => c.total > 0);
}

/** Estratégia por projeto, relatório, página e visual: Fidelity, Native ou Modernize. */
function Strategies() {
  const st = useMig(), ps = st.cur(), project = st.projects.find((p) => p.id === st.pid)!;
  const overrides = Object.entries(ps.strategies).map(([id, v]) => ({ id, v, it: ITEMS.get(id) })).filter((x) => x.it);
  const opts = STRATEGIES.map((s) => ({ id: s.id, label: s.label }));
  return <div className="ms-strats">
    <Section title="Projeto" hint="Valor padrão para tudo que não tiver exceção">
      <div className="ms-strat-line"><SegmentedControl label="Estratégia do projeto" value={project.strategy} onChange={(v: Strategy) => st.setProjectStrategy(project.id, v)} options={opts} /><p className="ms-hint">{STRATEGIES.find((s) => s.id === project.strategy)?.detail}</p></div></Section>
    <Section title="Por relatório" hint="Herdam do projeto, a menos que você escolha">
      <table className="ms-grid"><thead><tr><th>Relatório</th><th>Efetiva</th><th>Definir</th></tr></thead><tbody>{REPORTS.map((r) => { const id = reportId(r.id), e = effectiveStrategy(ps, project, id); return <tr key={id}><td><b>{r.name}</b><small>{r.pages.length} páginas</small></td><td><StrategyChip s={e.value} from={e.from} /></td>
        <td><SegmentedControl label={`Estratégia de ${r.name}`} value={e.value} onChange={(v: Strategy) => st.setStrategy(id, v)} options={opts} /></td></tr>; })}</tbody></table></Section>
    <Section title="Exceções" hint="Página e visual com estratégia própria">
      {overrides.length ? <ul className="ms-lines">{overrides.map(({ id, v, it }) => <li key={id}><b>{it!.name}</b><span>{it!.path.slice(-2).join(' › ')}</span><StrategyChip s={v} /><button type="button" className="bw-link" onClick={() => st.setStrategy(id, null)}>Remover</button></li>)}</ul> : <p className="ms-hint">Nenhuma exceção. Selecione uma página ou um visual no Inventário para definir.</p>}</Section>
    <p className="ms-hint"><Icon name="info" size={12} /> Exemplo: Projeto em <b>Native</b>, Network Map em <b>Modernize</b>, tabela Revenue Table em <b>Fidelity</b>.</p>
  </div>;
}
void compatLabel;
