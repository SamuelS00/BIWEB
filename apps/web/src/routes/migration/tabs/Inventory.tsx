import { useMemo, useRef, useState } from 'react';
import { Badge, Button, Checkbox, Icon, SegmentedControl, TextField } from '@biweb/ui';
import { INVENTORY_COUNTS, ITEMS, MEASURES, REPORTS, SAMPLES, TREE, VISUALS, WS_ID, relatives, visualsOfPage } from '../data';
import { KIND_LABEL, compatLabel } from '../model';
import type { Compat, Item, Kind, TreeEntry } from '../model';
import { useMig } from '../store';
import type { TabId } from '../store';
import { chainOf, countsFor } from '../Inspector';
import { SUMMARY_TREES } from '../analysis';
import { platformOf } from '../model';
import { CompatBadge, OpenIn, Section, nf } from '../ui';

const KIND_ICON: Partial<Record<Kind, Parameters<typeof Icon>[0]['name']>> = { workspace: 'layers', folder: 'container', report: 'report', page: 'pages', visual: 'chart', dataset: 'data', table: 'table', measure: 'kpi', map: 'pin', process: 'bolt' };

/* ───── Árvore: expandir/recolher, busca e seleção parcial (escopo) ───── */
const PARENT = new Map<string, string>(); const BYID = new Map<string, TreeEntry>();
(function idx(list: TreeEntry[], parent?: string) { for (const n of list) { BYID.set(n.id, n); if (parent) PARENT.set(n.id, parent); if (n.children) idx(n.children, n.id); } })(TREE);
const ancestors = (id: string) => { const out: string[] = []; let c = PARENT.get(id); while (c) { out.push(c); c = PARENT.get(c); } return out; };
const descendants = (id: string): string[] => (BYID.get(id)?.children ?? []).flatMap((c) => [c.id, ...descendants(c.id)]);
const isOff = (id: string, ex: Set<string>) => ex.has(id) || ancestors(id).some((a) => ex.has(a));
const SELECTABLE: Kind[] = ['report', 'page', 'dataset', 'measure', 'map', 'process'];
const ALL_SELECTABLE = [...BYID.values()].filter((n) => SELECTABLE.includes(n.kind) && !n.id.startsWith('grp:') && !n.id.startsWith('src:'));

/** Reativa um nó desligado por um ancestral: remove o ancestral e desliga só os irmãos fora do caminho. */
function turnOn(id: string, ex: Set<string>) {
  const out = new Set(ex);
  for (const d of [id, ...descendants(id)]) out.delete(d);
  for (const a of [...ancestors(id)].reverse()) {
    if (!out.has(a)) continue;
    out.delete(a);
    const path = new Set([id, ...ancestors(id)]);
    for (const c of BYID.get(a)?.children ?? []) if (!path.has(c.id)) out.add(c.id);
  }
  return out;
}

function Tree({ query, mode }: { query: string; mode: 'tree' | 'type' }) {
  const st = useMig(), ps = st.cur(), ex = useMemo(() => new Set(ps.excluded), [ps.excluded]);
  const [open, setOpen] = useState<Set<string>>(new Set([WS_ID, 'fld:Sales', 'rep:exec', 'pg:exec:regional']));
  const ref = useRef<HTMLDivElement>(null);
  const q = query.trim().toLowerCase();
  const match = useMemo(() => { if (!q) return null; const ok = new Set<string>(); for (const n of BYID.values()) if (n.label.toLowerCase().includes(q)) { ok.add(n.id); ancestors(n.id).forEach((a) => ok.add(a)); } return ok; }, [q]);
  const rows: { n: TreeEntry; depth: number }[] = [];
  const walk = (list: TreeEntry[], depth: number) => { for (const n of list) { if (match && !match.has(n.id)) continue; rows.push({ n, depth }); if (n.children && (match ? true : open.has(n.id))) walk(n.children, depth + 1); } };
  walk(TREE, 0);
  const toggle = (id: string) => setOpen((o) => { const x = new Set(o); if (x.has(id)) x.delete(id); else x.add(id); return x; });
  const setOn = (n: TreeEntry, on: boolean) => { const cur = new Set(ps.excluded); if (on) st.patch(() => ({ excluded: [...turnOn(n.id, cur)] })); else { for (const d of descendants(n.id)) cur.delete(d); cur.add(n.id); st.patch(() => ({ excluded: [...cur] })); } };
  const partial = (id: string) => !isOff(id, ex) && descendants(id).some((d) => ex.has(d));
  const key = (e: React.KeyboardEvent, i: number) => {
    const r = rows[i]!, el = ref.current!;
    const focus = (j: number) => { (el.querySelectorAll<HTMLElement>('[role=treeitem]')[Math.max(0, Math.min(rows.length - 1, j))])?.focus(); };
    if (e.key === 'ArrowDown') { e.preventDefault(); focus(i + 1); } else if (e.key === 'ArrowUp') { e.preventDefault(); focus(i - 1); }
    else if (e.key === 'ArrowRight' && r.n.children) { e.preventDefault(); if (!open.has(r.n.id)) toggle(r.n.id); else focus(i + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); if (r.n.children && open.has(r.n.id)) toggle(r.n.id); else { const p = PARENT.get(r.n.id); const j = rows.findIndex((x) => x.n.id === p); if (j >= 0) focus(j); } }
    else if (e.key === 'Enter') { st.set({ sel: r.n.id }); } else if (e.key === ' ') { e.preventDefault(); if (SELECTABLE.includes(r.n.kind)) setOn(r.n, isOff(r.n.id, ex)); }
  };
  void mode;
  return <div className="ms-tree" role="tree" aria-label="Inventário do workspace" ref={ref}>
    {rows.map(({ n, depth }, i) => {
      const off = isOff(n.id, ex), selectable = SELECTABLE.includes(n.kind) || n.kind === 'folder' || n.kind === 'workspace';
      return <div key={n.id} role="treeitem" tabIndex={st.sel === n.id || (i === 0 && !rows.some((r) => r.n.id === st.sel)) ? 0 : -1} aria-level={depth + 1} aria-selected={st.sel === n.id} aria-expanded={n.children ? open.has(n.id) || !!match : undefined}
        className={`ms-tree-row${st.sel === n.id ? ' is-sel' : ''}${off ? ' is-off' : ''}`} style={{ paddingLeft: 6 + depth * 14 }} onClick={() => st.set({ sel: n.id })} onKeyDown={(e) => key(e, i)}>
        <button type="button" tabIndex={-1} className="ms-tree-chev" aria-label={open.has(n.id) ? 'Recolher' : 'Expandir'} style={{ visibility: n.children ? 'visible' : 'hidden' }} onClick={(e) => { e.stopPropagation(); toggle(n.id); }}><Icon name={open.has(n.id) || !!match ? 'chevronDown' : 'chevronRight'} size={12} /></button>
        {selectable && <span className="ms-tree-check" onClick={(e) => e.stopPropagation()}><Checkbox aria-label={`Migrar ${n.label}`} isSelected={!off} isIndeterminate={partial(n.id)} onChange={(v) => setOn(n, v)}>{''}</Checkbox></span>}
        <Icon name={KIND_ICON[n.kind] ?? 'list'} size={12} />
        <span className="ms-tree-name">{n.label}</span>
        {n.compat && n.compat !== 'native' && <i className={`ms-compat-dot is-${n.compat}`} title={compatLabel(n.compat)} />}
        {n.count != null && <small>{n.count}</small>}
      </div>;
    })}
    {!rows.length && <p className="ms-hint" style={{ padding: 12 }}>Nada encontrado para “{query}”.</p>}
  </div>;
}

/* ───── Report Intelligence: o que este relatório realmente faz ───── */
const INTEL: Record<string, { purpose: string; dims: string[]; sources: string[]; filters: string[]; calcs: string[] }> = {
  exec: { purpose: 'Monitorar receita, margem e desempenho regional.', dims: ['Region', 'Product', 'Channel', 'Date'], sources: ['ERP Orders', 'CRM Customers'], filters: ['Region', 'Período', 'Channel'], calcs: ['Net Revenue', 'Gross Margin', 'Net Revenue YTD'] },
  region: { purpose: 'Comparar o desempenho entre regiões e estados.', dims: ['Region', 'State', 'City'], sources: ['Oracle Sales'], filters: ['Region', 'Período'], calcs: ['Rank by Region', 'Revenue YoY %'] },
  product: { purpose: 'Entender o mix, o preço e o ciclo de vida dos produtos.', dims: ['Product', 'Category', 'Channel'], sources: ['ERP Orders', 'Oracle Sales'], filters: ['Category', 'Top N'], calcs: ['Weighted Price', 'Top N Product Revenue'] },
  customer: { purpose: 'Acompanhar a base, a retenção e as coortes de clientes.', dims: ['Customer', 'Segment', 'Cohort'], sources: ['CRM Customers'], filters: ['Segment', 'Coorte'], calcs: ['Churn Rate', 'New Customers'] },
  margin: { purpose: 'Analisar margem, descontos e exceções de preço.', dims: ['Product', 'Discount band'], sources: ['ERP Orders'], filters: ['Faixa de margem'], calcs: ['Margin Bucket', 'COGS'] },
  targets: { purpose: 'Acompanhar o atingimento das metas por representante.', dims: ['Rep', 'Quarter'], sources: ['Targets.xlsx', 'Oracle Sales'], filters: ['Rep', 'Ano'], calcs: ['Target Attainment %'] },
  sla: { purpose: 'Monitorar o cumprimento de SLA por equipe.', dims: ['Team', 'Priority', 'Date'], sources: ['ERP Orders', 'Telecom NMS'], filters: ['Team', 'Prioridade'], calcs: ['SLA Compliance %', 'MTTR (h)'] },
  inc: { purpose: 'Acompanhar incidentes abertos, causa raiz e reincidência.', dims: ['Site', 'Root cause', 'Date'], sources: ['Telecom NMS'], filters: ['Status', 'Severidade'], calcs: ['Open Incidents', 'MTTR (h)'] },
  field: { purpose: 'Planejar visitas e rotas de equipes em campo.', dims: ['Crew', 'Site', 'Date'], sources: ['Telecom NMS'], filters: ['Equipe'], calcs: ['First-Time Fix %'] },
  net: { purpose: 'Acompanhar a saúde e a capacidade da rede.', dims: ['Site', 'Link', 'Date'], sources: ['Telecom NMS'], filters: ['Região', 'Tecnologia'], calcs: ['Network Availability %', 'Capacity Utilization %'] },
  netmap: { purpose: 'Visualizar sítios, enlaces e cobertura no território.', dims: ['Site', 'Region'], sources: ['Telecom NMS'], filters: ['Tecnologia', 'Status'], calcs: ['Links Below Threshold'] },
  weekly: { purpose: 'Resumir a semana para a diretoria.', dims: ['Week', 'Region'], sources: ['Oracle Sales', 'Telecom NMS'], filters: ['Semana'], calcs: ['Net Revenue', 'Gross Margin'] },
};

function Intelligence({ it }: { it: Item }) {
  const rep = REPORTS.find((r) => `rep:${r.id}` === it.id)!, i = INTEL[rep.id]!;
  const rows: [string, React.ReactNode][] = [['Propósito', i.purpose], ['Principais métricas', rep.topic.join(' · ')], ['Dimensões', i.dims.join(' · ')], ['Fontes', i.sources.join(' · ')], ['Filtros principais', i.filters.join(' · ')], ['Cálculos importantes', i.calcs.join(' · ')]];
  return <div className="ms-intel"><header><Icon name="copilot" size={12} /><b>Report Intelligence</b><small>O que este relatório realmente faz</small></header>
    <h4>{rep.name.toUpperCase()}</h4><dl>{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></div>;
}

type DTab = 'overview' | 'deps' | 'data' | 'visuals' | 'interactions';
function Detail({ it, onGo }: { it: Item; onGo: (t: TabId, sel?: string) => void }) {
  const st = useMig(), [tab, setTab] = useState<DTab>('overview');
  const counts = it.kind === 'report' || it.kind === 'page' ? countsFor(it) : null;
  const vis = it.kind === 'report' ? VISUALS.filter((v) => v.page.startsWith(`pg:${it.id.slice(4)}:`)) : it.kind === 'page' ? visualsOfPage(it.id) : [];
  const chain = chainOf(it);
  const up = relatives(it.id, 'up').map((x) => ITEMS.get(x)).filter((x): x is Item => !!x);
  const dTabs: { id: DTab; label: string }[] = [{ id: 'overview', label: 'Visão geral' }, { id: 'deps', label: 'Dependências' }, { id: 'data', label: 'Dados' }, { id: 'visuals', label: 'Visuais' }, { id: 'interactions', label: 'Interações' }];
  if (it.kind === 'workspace') return <WorkspaceGrid />;
  const hasTabs = it.kind === 'report' || it.kind === 'page';
  return <div className="ms-detail">
    <header className="ms-detail-head"><div><span className="ms-kind">{KIND_LABEL[it.kind]}{it.path.length ? ` · ${it.path.slice(1).join(' › ')}` : ''}</span><h2>{it.name}</h2></div><span className="flex-1" /><CompatBadge c={it.compat} />
      {it.builder && it.targetRef !== undefined && <OpenIn builder={it.builder} refId={it.targetRef ?? ''} />}<Button size="sm" variant="ghost" icon="copilot" onPress={() => st.ask('Explique este item')}>Ask Copilot</Button></header>
    {chain.length > 1 && <ol className="ms-chain is-wide" aria-label="Do alto nível ao elemento">{chain.map((c, i) => <li key={c.id}><button type="button" className={c.id === it.id ? 'is-cur' : ''} onClick={() => st.set({ sel: c.id })}><small>{KIND_LABEL[c.kind]}</small>{c.name}</button>{i < chain.length - 1 && <Icon name="arrowRight" size={12} />}</li>)}</ol>}
    {counts && <dl className="ms-counts is-row">{counts.map(([k, v]) => <div key={k}><dd>{nf(v)}</dd><dt>{k}</dt></div>)}</dl>}
    {hasTabs && <div className="ms-subtabs" role="tablist">{dTabs.map((t) => <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>)}</div>}
    {(!hasTabs || tab === 'overview') && <div className="ms-detail-body">
      {it.kind === 'report' && <Intelligence it={it} />}
      {it.reason && <p className="ms-callout"><Icon name="info" size={12} />{it.reason}</p>}
      {it.expr && <><h4>Expressão original</h4><pre className="ms-code">{it.expr}</pre><Button size="sm" icon="text" onPress={() => onGo('semantics', it.id)}>Ver tradução semântica</Button></>}
      {!it.expr && !hasTabs && <dl className="ms-props is-wide">{[['Destino', it.target], ...Object.entries(it.meta).map(([k, v]) => [k, String(v)])].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}
    </div>}
    {hasTabs && tab === 'deps' && <div className="ms-detail-body"><Lineage it={it} /></div>}
    {hasTabs && tab === 'data' && <div className="ms-detail-body"><h4>Medidas usadas</h4><div className="ms-chips">{[...new Set(up.filter((x) => x.kind === 'measure').map((x) => x.id))].slice(0, 24).map((id) => <button key={id} type="button" onClick={() => st.set({ sel: id })}>{ITEMS.get(id)?.name}</button>)}</div>
      <h4>Tabelas</h4><div className="ms-chips">{up.filter((x) => x.kind === 'table').slice(0, 24).map((x) => <button key={x.id} type="button" onClick={() => st.set({ sel: x.id })}>{x.name}</button>)}</div>
      <h4>Fontes</h4><div className="ms-chips">{up.filter((x) => x.type === 'Fonte de dados').map((x) => <button key={x.id} type="button" onClick={() => st.set({ sel: x.id })}>{x.name}</button>)}</div></div>}
    {hasTabs && tab === 'visuals' && <div className="ms-detail-body"><table className="ms-grid"><thead><tr><th>Visual</th><th>Tipo original</th><th>Alvo BIWEB</th><th>Compatibilidade</th></tr></thead><tbody>{vis.map((v) => <tr key={v.id} tabIndex={0} onClick={() => st.set({ sel: v.id })} onKeyDown={(e) => { if (e.key === 'Enter') st.set({ sel: v.id }); }}><td>{v.name}</td><td>{v.type}</td><td>{v.target}</td><td><CompatBadge c={v.compat} /></td></tr>)}</tbody></table></div>}
    {hasTabs && tab === 'interactions' && <div className="ms-detail-body"><ul className="ms-lines">{[['Cross-filter', `${Math.max(2, Math.round(vis.length * 0.7))} visuais respondem à seleção`, 'native'], ['Drill-down', 'Região → Estado → Cidade', 'native'], ['Drill-through', 'Abre Customers com o contexto', 'native'], ['Tooltip de página', 'Mini-relatório ao passar o cursor', 'equivalent'], ['Bookmarks', `${it.id === 'rep:exec' ? 4 : 1} visões salvas`, 'equivalent']].map(([a, b, c]) => <li key={a}><b>{a}</b><span>{b}</span><CompatBadge c={c as never} /></li>)}</ul></div>}
  </div>;
}

function Lineage({ it }: { it: Item }) {
  const up = relatives(it.id, 'up').map((x) => ITEMS.get(x)).filter((x): x is Item => !!x), by = (f: (x: Item) => boolean) => [...new Map(up.filter(f).map((x) => [x.id, x])).values()];
  const cols: [string, Item[]][] = [['Fontes', by((x) => x.type === 'Fonte de dados')], ['Modelos', by((x) => x.kind === 'dataset' && x.type !== 'Fonte de dados')], ['Medidas', by((x) => x.kind === 'measure')]];
  const st = useMig();
  return <div className="ms-lin">{cols.map(([t, list]) => <div key={t}><h4>{t} <Badge>{list.length}</Badge></h4><ul>{list.slice(0, 9).map((x) => <li key={x.id}><button type="button" onClick={() => st.set({ sel: x.id })}>{x.name}</button></li>)}{list.length > 9 && <li className="is-more">+ {list.length - 9}</li>}</ul></div>)}
    <div className="is-now"><h4>{KIND_LABEL[it.kind]}</h4><ul><li><b>{it.name}</b></li></ul></div></div>;
}

function WorkspaceGrid() {
  const st = useMig(), [kind, setKind] = useState<Kind | null>(null);
  const sample = kind ? SAMPLES[kind] : undefined, real = kind ? [...ITEMS.values()].filter((x) => x.kind === kind && x.type !== 'Fonte de dados') : [];
  const total = INVENTORY_COUNTS.find((c) => c.kind === kind)?.n ?? 0;
  return <div className="ms-detail"><header className="ms-detail-head"><div><span className="ms-kind">Inventário profundo</span><h2>Corporate Workspace</h2></div></header>
    <p className="ms-hint">Tudo que a análise encontrou, do workspace até a coluna. Selecione um tipo para listar.</p>
    <div className="ms-inv-grid">{INVENTORY_COUNTS.map((c) => <button key={c.kind} type="button" className={kind === c.kind ? 'is-on' : ''} onClick={() => setKind(c.kind === kind ? null : c.kind)}><b>{nf(c.n)}</b><span>{c.label}</span></button>)}</div>
    {kind && <div className="ms-detail-body"><table className="ms-grid"><thead><tr><th>Nome</th><th>Contexto</th><th>Compatibilidade</th></tr></thead><tbody>
      {real.slice(0, 60).map((x) => <tr key={x.id} tabIndex={0} onClick={() => st.set({ sel: x.id })} onKeyDown={(e) => { if (e.key === 'Enter') st.set({ sel: x.id }); }}><td>{x.name}</td><td>{x.path.slice(1).join(' › ') || x.type}</td><td><CompatBadge c={x.compat} /></td></tr>)}
      {sample?.map((x) => <tr key={x.id}><td>{x.name}</td><td>{x.parent} · {x.meta}</td><td><CompatBadge c={x.compat} /></td></tr>)}
      {!real.length && !sample && <tr><td colSpan={3} className="ms-hint">Este tipo está contabilizado no inventário e entra na análise de compatibilidade.</td></tr>}</tbody></table>
      <p className="ms-hint">{real.length ? `Exibindo ${Math.min(60, real.length)} de ${nf(total)}.` : sample ? `Amostra de ${sample.length} de ${nf(total)} no inventário completo.` : ''}</p></div>}</div>;
}

/** Projetos em análise resumida: lista de objetos descobertos, sem a árvore profunda do projeto de demonstração. */
function SummaryInventory({ onGo }: { onGo: (t: TabId, sel?: string) => void }) {
  const st = useMig(), project = st.projects.find((p) => p.id === st.pid)!, pl = platformOf(project.platform);
  const seeded = SUMMARY_TREES[project.id]?.[0]?.children;
  const names = seeded?.map((c) => c.label) ?? pl.items.slice(0, Math.max(1, project.scope.reports));
  const rows = names.map((n, i) => ({ id: `s${i}`, name: n, compat: (seeded?.[i]?.compat ?? (i % 7 === 3 ? 'redesign' : i % 5 === 4 ? 'equivalent' : 'native')) as Compat, pages: 2 + (i * 3 + n.length) % 4, visuals: 8 + (i * 7 + n.length) % 14 }));
  const [sel, setSel] = useState(rows[0]?.id);
  const cur = rows.find((r) => r.id === sel);
  return <div className="ms-detail"><header className="ms-detail-head"><div><span className="ms-kind">Inventário · análise resumida</span><h2>{project.workspace}</h2></div></header>
    <p className="ms-hint">{rows.length} {pl.nouns.reports} descobertos em {pl.name}. A árvore profunda (páginas, visuais, medidas e dependências) está no projeto de demonstração.</p>
    <div className="ms-table-scroll"><table className="ms-grid"><thead><tr><th>{pl.nouns.report[0]!.toUpperCase() + pl.nouns.report.slice(1)}</th><th>{pl.nouns.page}s</th><th>{pl.nouns.visual}s</th><th>Compatibilidade</th></tr></thead>
      <tbody>{rows.map((r) => <tr key={r.id} tabIndex={0} aria-selected={sel === r.id} onClick={() => setSel(r.id)} onKeyDown={(e) => { if (e.key === 'Enter') setSel(r.id); }}><td><b>{r.name}</b></td><td className="num">{r.pages}</td><td className="num">{r.visuals}</td><td><CompatBadge c={r.compat} /></td></tr>)}</tbody></table></div>
    {cur && <Section title={cur.name} hint={compatLabel(cur.compat)}><p className="ms-hint">{cur.compat === 'native' ? 'Todos os componentes têm alvo nativo no BIWEB.' : cur.compat === 'redesign' ? 'Contém visualização geográfica: candidata a Map Workspace.' : 'Contém componentes com equivalente, que mudam de forma na reconstrução.'}</p><div className="ms-row-actions"><Button size="sm" icon="copilot" onPress={() => st.ask(`Explique ${cur.name}`)}>Ask Copilot</Button><Button size="sm" onPress={() => onGo('compat')}>Ver compatibilidade</Button></div></Section>}
  </div>;
}

/** Inventário: árvore + conteúdo + (painel de item à direita). Seleção parcial define o escopo da migração. */
export function Inventory({ onGo }: { onGo: (t: TabId, sel?: string) => void }) {
  const st = useMig(), ps = st.cur(), [q, setQ] = useState(''), [mode, setMode] = useState<'tree' | 'type'>('tree');
  const detail = st.projects.find((p) => p.id === st.pid)?.detail;
  if (detail !== 'full') return <div className="ms-inv-summary"><SummaryInventory onGo={onGo} /></div>;
  const it = ITEMS.get(st.sel) ?? ITEMS.get(WS_ID)!;
  const ex = new Set(ps.excluded);
  const on = ALL_SELECTABLE.filter((n) => !isOff(n.id, ex)).length, all = ALL_SELECTABLE.length;
  return <div className="ms-inv">
    <aside className="ms-inv-tree" aria-label="Árvore do inventário">
      <div className="ms-inv-tools"><TextField label="Buscar no inventário" hideLabel icon="search" placeholder="Buscar relatório, página, medida…" value={q} onChange={setQ} />
        <SegmentedControl label="Visão" value={mode} onChange={setMode} options={[{ id: 'tree', label: 'Hierarquia' }, { id: 'type', label: 'Por tipo' }]} /></div>
      {mode === 'tree' ? <Tree query={q} mode={mode} /> : <div className="ms-bytype">{INVENTORY_COUNTS.map((c) => <button key={c.kind} type="button" onClick={() => { st.set({ sel: WS_ID }); setMode('tree'); }}><span>{c.label}</span><b>{nf(c.n)}</b></button>)}</div>}
      <footer className="ms-inv-foot"><div><b>Migrar selecionados</b><span>{on} de {all} itens</span></div>
        <div className="ms-prog"><i style={{ width: `${on / all * 100}%` }} /></div>
        <div className="ms-inv-foot-actions"><Button size="sm" variant="ghost" isDisabled={!ps.excluded.length} onPress={() => st.patch(() => ({ excluded: [] }))}>Selecionar tudo</Button><Button size="sm" variant="ghost" isDisabled={ps.excluded.length === 0} onPress={() => onGo('compat')}>Ver impacto</Button></div></footer>
    </aside>
    <section className="ms-inv-main" aria-label="Detalhe do item">
      {mode === 'type' ? <WorkspaceGrid /> : <Detail it={it} onGo={onGo} key={it.id} />}
      <Section title="Escopo da migração" hint="Não é preciso migrar tudo">
        <p className="ms-hint">Marque ou desmarque relatórios, páginas, modelos, medidas, mapas e processos na árvore. Itens fora do escopo não entram na reconstrução nem na publicação.{ps.excluded.length > 0 && ` ${ps.excluded.length} ${ps.excluded.length === 1 ? 'item fora' : 'itens fora'} do escopo.`}</p></Section>
    </section>
  </div>;
}
void MEASURES;
