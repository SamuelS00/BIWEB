import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Icon, SegmentedControl } from '@biweb/ui';
import { SUGGESTED } from './copilot';
import { ITEMS, MEASURES, REPORTS, VISUALS, impactOf, relatives } from './data';
import { KIND_LABEL, STRATEGIES } from './model';
import type { Item, Strategy } from './model';
import { effectiveStrategy, useMig } from './store';
import type { Msg, RightTab, TabId } from './store';
import { CompatBadge, Conf, OpenIn, StrategyChip, nf } from './ui';

/** Cadeia estrutural do item até a fonte: relatório → página → visual → métrica → tabela → fonte. */
export function chainOf(it: Item): Item[] {
  const up: Item[] = [];
  let cur: Item | undefined = it;
  while (cur?.parent) { cur = ITEMS.get(cur.parent); if (cur && (cur.kind === 'page' || cur.kind === 'report')) up.unshift(cur); }
  const out: Item[] = [...up, it];
  const feed = (id: string) => relatives(id, 'up').map((x) => ITEMS.get(x)).filter((x): x is Item => !!x);
  if (it.kind === 'visual') { const m = feed(it.id).find((x) => x.kind === 'measure'); if (m) { out.push(m); const t = feed(m.id).find((x) => x.kind === 'table'); if (t) { out.push(t); const s = feed(t.id).find((x) => x.type === 'Fonte de dados'); if (s) out.push(s); } } }
  else if (it.kind === 'measure') { const t = feed(it.id).find((x) => x.kind === 'table'); if (t) { out.push(t); const s = feed(t.id).find((x) => x.type === 'Fonte de dados'); if (s) out.push(s); } }
  else if (it.kind === 'table') { const s = feed(it.id).find((x) => x.type === 'Fonte de dados'); if (s) out.push(s); }
  return out;
}

export function countsFor(it: Item) {
  const own = (id: string) => VISUALS.filter((v) => v.page.startsWith(id === 'rep' ? `pg:${it.id.slice(4)}:` : it.id));
  void own;
  const vis = it.kind === 'report' ? VISUALS.filter((v) => v.page.startsWith(`pg:${it.id.slice(4)}:`)) : it.kind === 'page' ? VISUALS.filter((v) => v.page === it.id) : [];
  const ms = new Set<string>(), tb = new Set<string>(), src = new Set<string>();
  for (const v of vis) for (const a of relatives(v.id, 'up')) { const x = ITEMS.get(a); if (x?.kind === 'measure') ms.add(a); if (x?.kind === 'table') tb.add(a); if (x?.type === 'Fonte de dados') src.add(a); }
  const rep = it.kind === 'report' ? REPORTS.find((r) => `rep:${r.id}` === it.id) : undefined;
  const pages = it.kind === 'report' ? rep?.pages.length ?? 0 : it.kind === 'page' ? 1 : 0;
  const exec = it.id === 'rep:exec';
  return [['Páginas', pages], ['Visuais', vis.length], ['Medidas', exec ? 31 : ms.size], ['Tabelas', exec ? 12 : tb.size], ['Relacionamentos', exec ? 14 : Math.max(tb.size - 1, 0) + (it.kind === 'report' ? 2 : 0)], ['Fontes de dados', exec ? 3 : src.size], ['Filtros', exec ? 8 : Math.round(vis.length / 5)], ['Bookmarks', exec ? 4 : Math.round(vis.length / 12)]] as [string, number][];
}

export function Inspector({ onTab }: { onTab: (t: TabId, sel?: string) => void }) {
  const { sel, rightTab, set, projects, pid } = useMig();
  const ps = useMig((s) => s.ps[s.pid]);
  const project = projects.find((p) => p.id === pid)!;
  const it = ITEMS.get(sel);
  const tabs: { id: RightTab; label: string }[] = [{ id: 'inspector', label: 'Inspetor' }, { id: 'deps', label: 'Dependências' }, { id: 'copilot', label: 'Copilot' }];
  return <aside className="ms-right" aria-label="Painel do item selecionado">
    <div className="wf-tabs" role="tablist">{tabs.map((t) => <button key={t.id} role="tab" aria-selected={rightTab === t.id} onClick={() => set({ rightTab: t.id })}>{t.id === 'copilot' && <Icon name="copilot" size={12} />}{t.label}{t.id === 'copilot' && ps && ps.chat.some((m) => m.proposal?.status === 'pending') ? <i className="wf-tab-dot is-paused" /> : null}</button>)}</div>
    <div className="ms-right-body">
      {rightTab === 'inspector' && (it && ps ? <ItemPanel it={it} onTab={onTab} /> : <NoSel project={project.name} />)}
      {rightTab === 'deps' && (it ? <Deps it={it} /> : <NoSel project={project.name} />)}
      {rightTab === 'copilot' && <CopilotPanel it={it} />}
    </div>
  </aside>;
}

const NoSel = ({ project }: { project: string }) => <div className="ms-nosel"><Icon name="target" size={20} /><b>Nenhum item selecionado</b><p>Selecione um relatório, visual, medida ou mapa para ver compatibilidade, destino e dependências de {project}.</p></div>;

function ItemPanel({ it, onTab }: { it: Item; onTab: (t: TabId, sel?: string) => void }) {
  const st = useMig(), ps = st.cur(), project = st.projects.find((p) => p.id === st.pid)!;
  const eff = effectiveStrategy(ps, project, it.id), own = ps.strategies[it.id];
  const chain = chainOf(it), counts = it.kind === 'report' || it.kind === 'page' ? countsFor(it) : null;
  const canStrat = ['report', 'page', 'visual', 'map'].includes(it.kind);
  const act = (label: string, icon: Parameters<typeof Button>[0]['icon'], fn: () => void) => <Button size="sm" icon={icon} onPress={fn}>{label}</Button>;
  return <div className="ms-insp">
    <header><span className="ms-kind">{KIND_LABEL[it.kind]}{it.type && it.type !== KIND_LABEL[it.kind] ? ` · ${it.type}` : ''}</span><h2>{it.name}</h2>
      <div className="ms-insp-badges"><CompatBadge c={it.compat} />{canStrat && <StrategyChip s={eff.value} from={eff.from} />}{it.confidence != null && <Conf n={it.confidence} />}</div></header>
    {chain.length > 1 && <section><h3>Caminho</h3><ol className="ms-chain">{chain.map((c, i) => <li key={c.id}><button type="button" className={c.id === it.id ? 'is-cur' : ''} onClick={() => st.set({ sel: c.id })}><small>{KIND_LABEL[c.kind]}</small>{c.name}</button>{i < chain.length - 1 && <Icon name="arrowRight" size={12} />}</li>)}</ol></section>}
    <section><h3>Destino no BIWEB</h3>
      <div className="ms-target"><Icon name="arrowRight" size={12} /><div><b>{it.target}</b>{it.reason && <p>{it.reason}</p>}</div></div>
      {it.builder && it.targetRef !== undefined && <div className="ms-insp-actions"><OpenIn builder={it.builder} refId={it.targetRef ?? ''} /></div>}</section>
    {counts && <section><h3>Conteúdo</h3><dl className="ms-counts">{counts.map(([k, v]) => <div key={k}><dd>{nf(v)}</dd><dt>{k}</dt></div>)}</dl></section>}
    {Object.keys(it.meta).length > 0 && <section><h3>Propriedades</h3><dl className="ms-props">{Object.entries(it.meta).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{typeof v === 'number' ? nf(v) : v}</dd></div>)}</dl></section>}
    {it.expr && <section><h3>Expressão original</h3><pre className="ms-code">{it.expr}</pre></section>}
    {canStrat && <section><h3>Estratégia</h3>
      <SegmentedControl label="Estratégia do item" value={eff.value} onChange={(v: Strategy) => st.setStrategy(it.id, v)} options={STRATEGIES.map((s) => ({ id: s.id, label: s.label }))} />
      <p className="ms-hint">{own ? 'Definida neste item.' : `Herdada de ${eff.from}.`} {STRATEGIES.find((s) => s.id === eff.value)?.desc}{own && <> <button type="button" className="bw-link" onClick={() => st.setStrategy(it.id, null)}>Voltar ao herdado</button></>}</p></section>}
    <section><h3>Comandos</h3><div className="ms-insp-actions is-wrap">
      {it.kind === 'report' && <>{act('Ask Copilot', 'copilot', () => st.ask('Explique este relatório'))}{act('Analisar', 'search', () => onTab('blueprint', it.id))}{act('Reconstruir', 'play', () => onTab('reconstruct', it.id))}</>}
      {it.kind === 'page' && <>{act('Explain', 'copilot', () => st.ask('Explique esta página'))}{act('Comparar', 'layers', () => onTab('reconstruct', it.id))}</>}
      {it.kind === 'measure' && <>{act('Explain', 'copilot', () => st.ask('Explique esta medida'))}{act('Find dependencies', 'share', () => st.set({ rightTab: 'deps' }))}{act('Translate', 'text', () => onTab('semantics', it.id))}</>}
      {it.kind === 'visual' && <>{act('Find equivalent', 'search', () => st.ask('Encontre o equivalente no BIWEB'))}{act('Modernize', 'bolt', () => st.ask('Modernize este visual'))}{act('Open mapping', 'list', () => onTab('mappings', it.id))}</>}
      {it.kind === 'map' && act('Rebuild in Map Workspace', 'pin', () => st.ask('Migre esse mapa utilizando o Map Builder'))}
      {it.kind === 'process' && act('Convert to Workflow', 'share', () => st.ask('Converta essas operações em Workflow'))}
      {(it.kind === 'table' || it.kind === 'dataset') && <>{act('Explain', 'copilot', () => st.ask('Explique este item'))}{act('Ver no modelo', 'model', () => onTab('data'))}</>}
      {!['report', 'page', 'measure', 'visual', 'map', 'process', 'table', 'dataset'].includes(it.kind) && act('Ask Copilot', 'copilot', () => st.ask('Explique este item'))}
    </div></section>
  </div>;
}

/** Montante e jusante: reaproveita a linguagem de lineage do Data Workspace. */
function Deps({ it }: { it: Item }) {
  const st = useMig();
  const up = relatives(it.id, 'up').map((x) => ITEMS.get(x)).filter((x): x is Item => !!x), im = impactOf(it.id);
  const byKind = (k: string) => up.filter((x) => x.kind === k);
  const sel = (id: string) => st.set({ sel: id });
  const nodes = (list: Item[], max = 6) => list.slice(0, max).map((x) => <li key={x.id}><button type="button" onClick={() => sel(x.id)}><small>{KIND_LABEL[x.kind]}</small>{x.name}</button></li>);
  return <div className="ms-insp">
    <header><span className="ms-kind">Impacto</span><h2>{it.name}</h2><p className="ms-hint">“Se eu migrar ou mudar isso, o que mais é afetado?”</p></header>
    <section><h3>Montante · de onde vem <Badge>{up.length}</Badge></h3>
      {up.length ? <ul className="ms-dep">{nodes(byKind('measure'))}{nodes(byKind('table'))}{nodes(up.filter((x) => x.kind === 'dataset' && x.type !== 'Fonte de dados'))}{nodes(up.filter((x) => x.type === 'Fonte de dados'))}</ul> : <p className="ms-hint">Origem do dado: nada acima deste item.</p>}</section>
    <section><h3>Jusante · o que depende <Badge>{im.visuals.length + im.reports.length + im.procs.length + im.measures.length}</Badge></h3>
      {im.measures.length > 0 && <><h4>Medidas derivadas</h4><ul className="ms-dep">{nodes(im.measures, 5)}</ul></>}
      {im.reports.length > 0 ? <ul className="ms-tree-dep">{im.reports.slice(0, 8).map((r) => { const vs = im.visuals.filter((v) => v.path.includes(r.name)); return <li key={r.id}><button type="button" onClick={() => sel(r.id)}><Icon name="report" size={12} />{r.name}<Badge>{vs.length} visuais</Badge></button>{vs.length > 0 && <ul>{vs.slice(0, 3).map((v) => <li key={v.id}><button type="button" onClick={() => sel(v.id)}>{v.name}</button></li>)}{vs.length > 3 && <li className="is-more">+ {vs.length - 3} visuais</li>}</ul>}</li>; })}</ul> : <p className="ms-hint">Nada depende deste item.</p>}
      {im.procs.length > 0 && <><h4>Operações</h4><ul className="ms-dep">{nodes(im.procs)}</ul></>}</section>
    {it.kind === 'measure' && <p className="ms-hint">{MEASURES.find((m) => `ms:${m.id}` === it.id)?.deps?.length ? 'Alterar esta medida recalcula as derivadas listadas acima.' : 'Medida base: alterações propagam para todos os visuais acima.'}</p>}
  </div>;
}

function Card({ m }: { m: Msg }) {
  const st = useMig(), p = m.proposal!, done = p.status !== 'pending';
  return <div className={`wf-proposal is-${p.status}`}>
    <header><Icon name="copilot" size={12} /><b>{p.title}</b></header><p>{p.summary}</p>
    <ul className="wf-changes">{p.changes.slice(0, 7).map((l, i) => <li key={i} className={l[0] === '+' ? 'is-add' : l[0] === '−' ? 'is-del' : 'is-mod'}><b>{l[0]}</b>{l.slice(2)}</li>)}{p.changes.length > 7 && <li className="is-more">+ {p.changes.length - 7} outras alterações</li>}</ul>
    {!done ? <><div className="wf-proposal-actions"><Button size="sm" onPress={() => st.discardProposal(m.id)}>Descartar</Button><Button size="sm" variant="primary" icon="check" onPress={() => st.applyProposal(m.id)}>Aplicar</Button></div><small className="wf-muted">Prévia: nada muda até você aplicar. Tudo entra no histórico da migração.</small></>
      : <small className={`wf-muted is-${p.status}`}>{p.status === 'applied' ? 'Aplicado ao projeto' : 'Descartado'}</small>}
  </div>;
}

/** Copilot sempre ciente do projeto e do item selecionado: pedido → proposta → prévia → aplicar. */
function CopilotPanel({ it }: { it?: Item }) {
  const st = useMig(), msgs = st.cur().chat, [text, setText] = useState(''), end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs.length]);
  const send = (t = text) => { if (!t.trim()) return; st.ask(t.trim()); setText(''); };
  return <div className="wf-copilot">
    <div className="wf-chat" aria-live="polite">
      {!msgs.length && <div className="wf-chat-empty"><Icon name="copilot" size={20} /><b>Copilot da Migração</b><p>Conheço o projeto, a origem, o item selecionado, a compatibilidade, o blueprint e a validação. Toda mudança passa por proposta e prévia antes de aplicar.</p></div>}
      {msgs.map((m) => m.role === 'user' ? <div key={m.id} className="wf-msg is-user">{m.text}</div> : <div key={m.id} className="wf-msg is-ai">
        {m.kicker && <small className="wf-kicker">{m.kicker}</small>}<p>{m.text}</p>
        {m.list && <ul className="wf-msg-list">{m.list.map((l, i) => <li key={i}>{/^(Explique|Quais|Existem|Use|Modernize|Compare|Encontre|Migre|Converta|Esse|De onde|Por que)/.test(l) ? <button type="button" onClick={() => send(l)}>{l}</button> : l}</li>)}</ul>}
        {m.focus && m.focus.length > 0 && !m.proposal && <Button size="sm" variant="ghost" icon="target" onPress={() => st.set({ sel: m.focus![0]!, rightTab: 'inspector' })}>Mostrar no projeto</Button>}
        {m.proposal && <Card m={m} />}
      </div>)}
      <div ref={end} />
    </div>
    <div className="wf-suggest" role="group" aria-label="Sugestões">{SUGGESTED(it).map((s) => <button key={s} type="button" onClick={() => send(s)}>{s}</button>)}</div>
    <form className="wf-compose" onSubmit={(e) => { e.preventDefault(); send(); }}>
      <span className="wf-ctx"><Icon name="target" size={12} />Contexto: {it ? `${KIND_LABEL[it.kind]} · ${it.name}` : 'projeto inteiro'}</span>
      <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Ex.: por que esse visual precisa ser redesenhado?" aria-label="Pedir ao Copilot" rows={2} />
      <Button type="submit" variant="primary" size="sm" icon="send">Enviar</Button>
    </form>
  </div>;
}
