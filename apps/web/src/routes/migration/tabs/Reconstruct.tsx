import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Icon, SegmentedControl } from '@biweb/ui';
import { BUILDER_PATH, RECON, SUGGESTIONS, boardOf } from '../analysis';
import type { ReconTarget } from '../analysis';
import { ITEMS, MAPS, PROCESSES, REPORTS, pageId, visualsOfPage } from '../data';
import { TARGET_BUILDER } from '../model';
import type { Builder } from '../model';
import { effectiveStrategy, useMig } from '../store';
import type { TabId } from '../store';
import { Board, Glyph } from './Board';
import { useNavigate } from '@tanstack/react-router';
import { CompatBadge, OpenIn, Progress, Section, StrategyChip } from '../ui';

const GROUPS: { id: Builder; title: string; sub: string }[] = [{ id: 'report', title: 'Report Builder', sub: 'Relatórios e páginas' }, { id: 'map', title: 'Map Builder', sub: 'Mapas detectados' }, { id: 'workflow', title: 'Workflow Builder', sub: 'Agendas, alertas e exportações' }, { id: 'data', title: 'Data Workspace · LDE', sub: 'Modelos de dados' }];
const statusOf = (n: number) => n >= 100 ? { t: 'success' as const, l: 'Reconstruído' } : n > 0 ? { t: 'accent' as const, l: `${n}%` } : { t: 'neutral' as const, l: 'Pendente' };

/** Estação Original → Blueprint → BIWEB: o objeto selecionado atravessa as três etapas. */
function Transit({ name, progress }: { name: string; progress: number }) {
  const ok = progress >= 100;
  return <div className={`ms-transit${ok ? ' is-rebuilt' : ' is-mapped'}`} aria-label={`Original, Blueprint, BIWEB · ${ok ? 'reconstruído' : 'mapeado'}`} key={`${name}-${ok}`}>
    <span>Original</span><i /><span>Blueprint</span><i /><span className={ok ? 'is-ok' : ''}>BIWEB</span><em><b>{name}</b></em></div>;
}

export function Reconstruct({ onGo }: { onGo: (t: TabId, sel?: string) => void }) {
  const st = useMig(), ps = st.cur(), project = st.projects.find((p) => p.id === st.pid)!;
  const [mode, setMode] = useState<'rebuild' | 'modernize'>('rebuild'), [tid, setTid] = useState('rt:exec'), [pg, setPg] = useState(pageId('exec', 'Regional'));
  /* seleção vinda de outras telas (inventário, copilot, mapeamentos) */
  useEffect(() => {
    const it = ITEMS.get(st.sel); if (!it) return;
    if (it.kind === 'report') { setTid(`rt:${it.id.slice(4)}`); const r = REPORTS.find((x) => `rep:${x.id}` === it.id); if (r) setPg(pageId(r.id, r.pages[0]![0])); }
    else if (it.kind === 'page') { setTid(`rt:${it.parent!.slice(4)}`); setPg(it.id); }
    else if (it.kind === 'visual' && it.parent) { const p = ITEMS.get(it.parent); if (p?.parent) { setTid(`rt:${p.parent.slice(4)}`); setPg(p.id); } }
    else if (it.kind === 'map' || it.kind === 'process') setTid(`rt:${it.id}`);
  }, [st.sel]);
  const t = RECON.find((x) => x.id === tid) ?? RECON[0]!;
  const rep = REPORTS.find((r) => `rt:${r.id}` === t.id);
  return <div className="ms-rec">
    <aside className="ms-rec-list" aria-label="Destinos da reconstrução">
      {GROUPS.map((g) => { const list = RECON.filter((r) => r.builder === g.id); const done = list.filter((r) => (ps.recon[r.id] ?? 0) >= 100).length; return <section key={g.id}>
        <header><b>{g.title}</b><small>{done}/{list.length} · {g.sub}</small></header>
        <ul>{list.map((r) => { const n = ps.recon[r.id] ?? 0, s = statusOf(n); return <li key={r.id}><button type="button" className={r.id === t.id ? 'is-on' : ''} onClick={() => { setTid(r.id); setMode('rebuild'); if (r.itemId) st.set({ sel: r.itemId }); }}><span><b>{r.name}</b><small>{r.from}</small></span>{n > 0 && n < 100 ? <Progress value={n} /> : <Badge tone={s.t}>{s.l}</Badge>}</button></li>; })}</ul></section>; })}
      <button type="button" className={`ms-rec-modern${mode === 'modernize' ? ' is-on' : ''}`} onClick={() => setMode('modernize')}><Icon name="bolt" size={12} /><span><b>Modernização</b><small>{SUGGESTIONS.filter((s) => !ps.suggestions[s.id]).length} sugestões pendentes</small></span></button>
    </aside>
    <div className="ms-rec-main">
      {mode === 'modernize' ? <Modernize onGo={onGo} /> : <>
        <Transit name={t.name} progress={ps.recon[t.id] ?? 0} />
        <header className="ms-rec-head"><div><span className="ms-kind">{TARGET_BUILDER[t.builder].label}</span><h2>{t.name}</h2></div><span className="flex-1" />
          {t.itemId && <StrategyChip s={effectiveStrategy(ps, project, t.itemId).value} from={effectiveStrategy(ps, project, t.itemId).from} />}
          <Button size="sm" icon="play" isDisabled={(ps.recon[t.id] ?? 0) >= 100} onPress={() => st.reconstruct(t.id)}>{(ps.recon[t.id] ?? 0) > 0 && (ps.recon[t.id] ?? 0) < 100 ? 'Reconstruindo…' : (ps.recon[t.id] ?? 0) >= 100 ? 'Reconstruído' : 'Reconstruir'}</Button>
          <BuilderLink t={t} /></header>
        <Pieces t={t} n={ps.recon[t.id] ?? 0} />
        {t.builder === 'report' && rep && <ReportRecon repId={rep.id} pg={pg} setPg={setPg} />}
        {t.builder === 'map' && <MapRecon id={t.itemId!} />}
        {t.builder === 'workflow' && <WorkflowRecon id={t.itemId!} />}
        {t.builder === 'data' && <DataRecon t={t} onGo={onGo} />}
      </>}
    </div>
  </div>;
}

function BuilderLink({ t }: { t: ReconTarget }) {
  const navigate = useNavigate(), p = BUILDER_PATH(t.builder, t.ref);
  return <Button size="sm" variant="primary" icon={t.builder === 'report' ? 'report' : t.builder === 'map' ? 'pin' : t.builder === 'workflow' ? 'share' : 'data'} onPress={() => { void navigate({ to: p.to, params: p.params } as never); }}>{TARGET_BUILDER[t.builder].open}</Button>;
}
function Pieces({ t, n }: { t: ReconTarget; n: number }) {
  const done = Math.floor((n / 100) * t.pieces.length + (n >= 100 ? 1 : 0));
  return <ul className="ms-pieces" aria-label="O que está sendo reconstruído">{t.pieces.map((p, i) => <li key={p} className={i < done ? 'is-done' : i === done && n > 0 ? 'is-now' : ''}>{i < done ? <Icon name="check" size={12} /> : i === done && n > 0 ? <i className="ms-spin" /> : <i className="ms-hollow" />}{p}</li>)}</ul>;
}

/** Original → BIWEB → Compare, com o diff relevante. O Report Builder real é aberto pelo botão. */
function ReportRecon({ repId, pg, setPg }: { repId: string; pg: string; setPg: (p: string) => void }) {
  const st = useMig(), rep = REPORTS.find((r) => r.id === repId)!, [view, setView] = useState<'orig' | 'biweb' | 'compare'>('compare'), [pick, setPick] = useState<string>();
  const page = rep.pages.find(([n]) => pageId(rep.id, n) === pg) ? pg : pageId(rep.id, rep.pages[0]![0]);
  const widgets = useMemo(() => boardOf(page), [page]), vis = visualsOfPage(page), it = ITEMS.get(page);
  const changed = vis.filter((v) => v.compat === 'redesign' || v.compat === 'review'), picked = vis.find((v) => v.id === pick);
  const strat = effectiveStrategy(st.cur(), st.projects.find((p) => p.id === st.pid)!, page);
  const diff: [string, string, 'ok' | 'minor' | 'changed' | 'review'][] = [['LAYOUT', strat.value === 'fidelity' ? 'Praticamente idêntico' : 'Pequenas diferenças (grade de 12 colunas)', strat.value === 'fidelity' ? 'ok' : 'minor'], ['DADOS', 'Valores iguais', 'ok'], ['FILTROS', 'Iguais', 'ok'], ['INTERAÇÕES', changed.some((c) => c.compat === 'review') ? 'Uma interação precisa de revisão' : 'Equivalentes', changed.some((c) => c.compat === 'review') ? 'review' : 'ok'], ['VISUAL', changed.length ? `${changed.length} alterado${changed.length > 1 ? 's' : ''}` : 'Sem alterações', changed.length ? 'changed' : 'ok']];
  return <div className="ms-recon-report">
    <div className="ms-rec-tools"><div className="ms-chips is-tabs" role="tablist" aria-label="Páginas">{rep.pages.map(([n, c]) => { const id = pageId(rep.id, n); return <button key={id} role="tab" aria-selected={page === id} onClick={() => { setPg(id); setPick(undefined); st.set({ sel: id }); }}>{n}<span>{c}</span></button>; })}</div>
      <SegmentedControl label="Comparação" value={view} onChange={setView} options={[{ id: 'orig', label: 'Original' }, { id: 'biweb', label: 'BIWEB' }, { id: 'compare', label: 'Compare' }]} /></div>
    <div className={`ms-boards is-${view}`} key={`${page}${view}`}>
      {view !== 'biweb' && <figure><figcaption>Original · Power BI</figcaption><Board widgets={widgets} mode="orig" onPick={setPick} picked={pick} changed={view === 'compare'} /></figure>}
      {view === 'compare' && <div className="ms-boards-arrow" aria-hidden="true"><Icon name="arrowRight" size={16} /></div>}
      {view !== 'orig' && <figure><figcaption>Reconstruído · BIWEB Report Builder</figcaption><Board widgets={widgets} mode="biweb" onPick={setPick} picked={pick} changed={view === 'compare'} /></figure>}
    </div>
    {view === 'compare' && <Section title="Diferenças relevantes" hint={`${it?.name} · estratégia ${strat.value}`}>
      <ul className="ms-diff">{diff.map(([k, v, s]) => <li key={k} className={`is-${s}`}><b>{k}</b><span>{v}</span></li>)}</ul>
      {changed.map((v) => <div key={v.id} className="ms-diff-why"><Icon name="info" size={12} /><div><b>{v.name}</b> <CompatBadge c={v.compat} /><p>{v.reason ?? `${v.type} reconstruído como ${v.target}.`}</p><small>Estratégia de migração: {effectiveStrategy(st.cur(), st.projects.find((p) => p.id === st.pid)!, v.id).value}</small></div></div>)}
      {!changed.length && <p className="ms-hint">Todos os visuais desta página têm equivalente direto.</p>}</Section>}
    {picked && <Section title={picked.name} hint={picked.type}><div className="ms-pick"><Glyph k="col" /><div><b>{picked.type} → {picked.target}</b><p>{picked.reason ?? 'Equivalente direto no catálogo de visualizações do BIWEB.'}</p><OpenIn builder="report" refId={ITEMS.get(picked.id)?.targetRef ?? ''} /></div></div></Section>}
  </div>;
}

function MapRecon({ id }: { id: string }) {
  const m = MAPS.find((x) => x.id === id)!, st = useMig(), ps = st.cur();
  const rows: [string, string, string][] = [['Camadas', String(m.layers.length), m.layers.map((l) => l[0]).join(' · ')], ['Coordenadas', 'WGS84', 'Detectadas em lat/long dos dados'], ['Regiões', m.layers.filter((l) => l[1] === 'polígonos').length ? 'sim' : 'não', 'Polígonos por UF e cobertura'], ['Rotas', m.layers.some((l) => l[1] === 'linhas') ? 'sim' : 'não', 'Linhas ligando sítios e equipes'], ['Pontos', String(m.layers.filter((l) => l[1] === 'pontos').reduce((a, l) => a + Number(l[2]), 0)), 'Sítios, equipes ou ordens'], ['Relacionamentos', 'sim', 'Ponto pertence a região']];
  return <div className="ms-recon-map"><div className="ms-flow3">
    <div className="ms-flow3-card"><span className="ms-trans-tag">Mapa original</span><Glyph k="map" /><b>{ITEMS.get(m.visual)?.type}</b><small>{m.name}</small></div><Icon name="arrowRight" size={16} />
    <div className="ms-flow3-card is-mid"><span className="ms-trans-tag">Estrutura geográfica detectada</span><dl>{rows.slice(0, 4).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></div><Icon name="arrowRight" size={16} />
    <div className="ms-flow3-card is-new"><span className="ms-trans-tag">Sugerido</span><Glyph k="map" /><b>BIWEB Map Workspace</b><small>{m.ref === 'network' ? 'Network Intelligence' : m.ref === 'field' ? 'Field Ops' : 'Coverage Intelligence'}</small></div></div>
    <Section title="O que o BIWEB reconstrói" hint={(ps.recon[`rt:${id}`] ?? 0) >= 100 ? 'Concluído' : 'Prévia'}><table className="ms-grid"><tbody>{rows.map(([k, v, d]) => <tr key={k}><td><b>{k}</b></td><td>{v}</td><td className="ms-muted">{d}</td></tr>)}</tbody></table>
      {m.layers.some((l) => /custom/.test(String(l[0]))) && <p className="ms-callout"><Icon name="warning" size={12} />Camada de tiles personalizada não é replicada automaticamente: veja a fila de revisão.</p>}</Section>
  </div>;
}

function WorkflowRecon({ id }: { id: string }) {
  const p = PROCESSES.find((x) => x.id === id)!;
  const steps = id === 'proc:refresh' ? ['Schedule · diário 06:00', 'Refresh Dataset · Sales Model', 'Evaluate KPI · Net Revenue', 'Condition · abaixo da meta?', 'Notification · e-mail Comercial'] : ['Schedule · segunda 07:00', 'Export · PDF Executive Weekly', 'Condition · relatório publicado?', 'Notification · Diretoria'];
  return <div className="ms-recon-wf"><div className="ms-flow3">
    <div className="ms-flow3-card"><span className="ms-trans-tag">Power BI</span><ul>{p.parts.map((x) => <li key={x}>{x}</li>)}</ul></div><Icon name="arrowRight" size={16} />
    <div className="ms-flow3-card is-new wide"><span className="ms-trans-tag">BIWEB Workflow</span><ol className="ms-steps-flow">{steps.map((s, i) => <li key={s} style={{ animationDelay: `${i * 120}ms` }}><b>{s.split(' · ')[0]}</b><small>{s.split(' · ')[1]}</small></li>)}</ol></div></div>
    <p className="ms-hint">Elementos operacionais detectados: agendas de refresh, alertas, assinaturas, notificações, regras de limite e exportações. No BIWEB viram um único fluxo auditável, versionado e com execução simulada.</p></div>;
}

function DataRecon({ t, onGo }: { t: ReconTarget; onGo: (x: TabId) => void }) {
  return <div className="ms-recon-data"><p className="ms-hint">O modelo é reconstruído no Data Workspace pelo LDE: esquema, relacionamentos, métricas e qualidade. O Migration Studio apenas coordena e mostra a proposta.</p>
    <ul className="ms-lines">{[['Tabelas normalizadas', '6 de 6'], ['Relacionamentos', '5 confirmados · 1 ambíguo'], ['Métricas publicadas', `${t.name === 'Sales Model' ? 18 : 6} na camada semântica`], ['Qualidade', '2.140 CPFs fora do formato']].map(([a, b]) => <li key={a}><b>{a}</b><span>{b}</span></li>)}</ul>
    <div className="ms-row-actions"><Button size="sm" onPress={() => onGo('data')}>Ver modelo proposto</Button></div></div>;
}

function Modernize({ onGo }: { onGo: (t: TabId, sel?: string) => void }) {
  const st = useMig(), ps = st.cur(), project = st.projects.find((p) => p.id === st.pid)!;
  const accept = (id: string) => { const s = SUGGESTIONS.find((x) => x.id === id)!; st.decideSuggestion(id, 'accepted'); for (const x of s.itemIds) { const it = ITEMS.get(x); if (it && ['page', 'visual', 'map', 'process'].includes(it.kind)) st.setStrategy(x, 'modernize'); } st.flash('Sugestão aceita. A estratégia desses itens passou a Modernize.'); };
  return <div className="ms-modern">
    <header className="ms-rec-head"><div><span className="ms-kind">Modernização</span><h2>O que o BIWEB e a IA sugerem melhorar</h2></div></header>
    {project.strategy !== 'modernize' && <p className="ms-callout"><Icon name="info" size={12} />A estratégia do projeto é {project.strategy === 'native' ? 'Native' : 'Fidelity'}. As sugestões abaixo se aplicam aos itens em Modernize; aceitar uma delas muda a estratégia só dos itens afetados.</p>}
    <ul className="ms-suggest">{SUGGESTIONS.map((s) => { const d = ps.suggestions[s.id]; return <li key={s.id} className={d ? `is-${d}` : ''}>
      <div className="ms-suggest-prev" aria-hidden="true"><Preview kind={s.preview} /></div>
      <div className="ms-suggest-body"><h3>{s.title}</h3><dl><div><dt>Motivo</dt><dd>{s.reason}</dd></div><div><dt>Impacto</dt><dd>{s.impact}</dd></div><div><dt>Sugestão</dt><dd>{s.to}</dd></div></dl>
        <div className="ms-row-actions"><Button size="sm" variant="primary" icon={d === 'accepted' ? 'check' : undefined} isDisabled={d === 'accepted'} onPress={() => accept(s.id)}>{d === 'accepted' ? 'Aceita' : 'Aceitar'}</Button><Button size="sm" variant="ghost" onPress={() => st.decideSuggestion(s.id, d === 'ignored' ? null : 'ignored')}>{d === 'ignored' ? 'Ignorada' : 'Ignorar'}</Button><Button size="sm" variant="ghost" icon="copilot" onPress={() => st.ask('Modernize este dashboard')}>Perguntar</Button>{s.itemIds[0] && <Button size="sm" variant="ghost" onPress={() => onGo('inventory', s.itemIds[0])}>Ver no inventário</Button>}</div></div></li>; })}</ul></div>;
}
function Preview({ kind }: { kind: string }) {
  if (kind === 'consolidate') return <div className="ms-pv"><div className="ms-pv-before">{[0, 1, 2, 3, 4, 5].map((i) => <i key={i} />)}</div><Icon name="arrowRight" size={12} /><div className="ms-pv-after"><Glyph k="col" /></div></div>;
  if (kind === 'map') return <div className="ms-pv"><div className="ms-pv-before one"><Glyph k="treemap" /></div><Icon name="arrowRight" size={12} /><div className="ms-pv-after"><Glyph k="map" /></div></div>;
  if (kind === 'workflow') return <div className="ms-pv"><div className="ms-pv-before three"><i /><i /><i /></div><Icon name="arrowRight" size={12} /><div className="ms-pv-flow"><i /><i /><i /><i /></div></div>;
  return <div className="ms-pv"><div className="ms-pv-before two"><b>Gross Margin</b><b>Margin %</b></div><Icon name="arrowRight" size={12} /><div className="ms-pv-after"><b>Margin.Gross</b></div></div>;
}
