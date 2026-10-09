import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from '@tanstack/react-router';
import { Badge, Button, Icon, IconButton, SegmentedControl } from '@biweb/ui';
import { useUi } from '../../state/ui-store';
import { Canvas } from './Canvas';
import type { Filters } from './Canvas';
import { CopilotPanel } from './CopilotPanel';
import { PublishDialog, RowsDialog, VersionsDialog } from './Dialogs';
import { Inspector } from './Inspector';
import { NodeLibrary } from './Library';
import { Dock, RunPanel, runTone } from './RunPanel';
import { applyOps, fmtN, nextRun } from './engine';
import { dirtyCount, docOf, useWf, viewDoc } from './store';
import './workflows.css';

type RTab = 'inspector' | 'run' | 'copilot';
const KIND_LABEL: Record<string, string> = { batch: 'Lote', realtime: 'Tempo real', scheduled: 'Agendado', event: 'Por evento', human: 'Com pessoas', operations: 'Operações' };

function LiveStats({ eps, lag }: { eps: number; lag: number }) {
  const [t, setT] = useState(0), [t0] = useState(() => Date.now() - 3 * 3600e3 - 12 * 60e3);
  useEffect(() => { const i = setInterval(() => setT((x) => x + 1), 1000); return () => clearInterval(i); }, []);
  const up = Math.floor((Date.now() - t0) / 1000), e = Math.round(eps * (1 + Math.sin(t / 3) * 0.05)), l = Math.max(0.2, lag + Math.sin(t / 2) * 0.15);
  return <span className="wf-live"><Badge tone="success"><i className="wf-live-dot" />LIVE</Badge><span><b>{fmtN(e)}</b> eventos/s</span><span>atraso <b>{l.toFixed(1).replace('.', ',')} s</b></span><span>há <b>{Math.floor(up / 3600)}h {String(Math.floor((up % 3600) / 60)).padStart(2, '0')}m</b></span></span>;
}

export function WorkflowsPage() {
  const aiEnabled = useUi((s) => s.aiEnabled);
  const st = useWf();
  const { mode, view, runs, pick, id, activeProposal, sel, hist } = st;
  const navigate = useNavigate();
  const { workflowId } = useParams({ strict: false }) as { workflowId?: string };
  const base = st.cur(), wf = viewDoc(base, view);
  const [rTab, setR] = useState<RTab>('run'), [dTab, setD] = useState<'timeline' | 'logs' | 'table'>('timeline');
  const [filters, setFilters] = useState<Filters>({ q: '', flt: [] }), [follow, setFollow] = useState(false), [dockOpen, setDock] = useState(true);
  const [dlg, setDlg] = useState<null | 'publish' | 'versions' | 'rows'>(null);
  const editable = mode === 'edit' && view === 'draft';
  const wfRuns = runs[id] ?? [], run = wfRuns.find((r) => r.id === pick[id]) ?? wfRuns[0];
  const dirty = dirtyCount(base);

  useEffect(() => { if (workflowId && workflowId !== id && st.wfs.some((w) => w.id === workflowId)) st.open(workflowId); }, [workflowId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setR(mode === 'edit' ? 'inspector' : 'run'); }, [mode]);
  const leftOpen = mode === 'edit', [rightOpen, setRight] = useState(true);
  useEffect(() => { if (sel.length && rTab === 'run') setR('inspector'); }, [sel]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (activeProposal) { setR('copilot'); setRight(true); } }, [activeProposal]);

  /* relógio da simulação */
  useEffect(() => {
    let last = performance.now();
    const i = setInterval(() => { const now = performance.now(), dt = Math.min(1.5, (now - last) / 1000); last = now; useWf.getState().tick(dt * useWf.getState().speed); }, 100);
    return () => clearInterval(i);
  }, []);
  /* fluxos em tempo real recebem eventos continuamente */
  useEffect(() => {
    if (wf.kind !== 'realtime' || mode !== 'monitor') return;
    const i = setInterval(() => { const s = useWf.getState(), r = (s.runs[s.id] ?? [])[0]; if (!r || r.done) s.run(); }, 9000);
    return () => clearInterval(i);
  }, [wf.kind, mode, id]);

  /* prévia do Copilot no canvas */
  const ghost = useMemo(() => {
    const m = (st.chat[id] ?? []).find((x) => x.id === activeProposal), p = m?.proposal;
    if (!p || p.status !== 'pending') return null;
    const b = docOf(base);
    if (p.newWf) return base.nodes.length ? null : { doc: docOf(p.newWf), base: b };
    return { doc: applyOps(b, p.ops), base: b };
  }, [st.chat, id, activeProposal, base]);

  const pastN = hist[id]?.past.length ?? 0, futN = hist[id]?.future.length ?? 0;
  const trig = wf.nodes.find((n) => n.kind === 'schedule'), nx = trig ? nextRun(trig.cfg) : undefined;
  const failedNode = run && Object.entries(run.nodes).find(([, r]) => r.state === 'failed');
  const rowsFor = failedNode ? failedNode[1].err?.rows ?? 0 : 0;
  const pubV = base.versions.find((v) => v.state === 'published')?.v;
  const rt = run ? runTone(run.status) : undefined;


  if (workflowId && !st.wfs.some((w) => w.id === workflowId)) return <Navigate to="/workflows" replace />;
  return <div className={`wf-page ${leftOpen ? '' : 'no-left'} ${rightOpen ? '' : 'no-right'}`}>
    <header className="wf-head">
      <IconButton icon="arrowLeft" label="Voltar para os fluxos" size="sm" onPress={() => { void navigate({ to: '/workflows' }); }} />
      <div className="wf-title">
        <div className="wf-title-row"><h1>{wf.name}</h1>
          {wf.kind === 'realtime' ? <LiveStats eps={wf.live?.eps ?? 0} lag={wf.live?.lag ?? 1} /> : rt && mode === 'monitor' ? <Badge tone={rt.tone}>{rt.label} · #{run!.id}</Badge> : null}
          <Badge tone={(dirty || !base.published) && view === 'draft' ? 'warning' : 'neutral'}>{!base.published ? 'Rascunho · não publicado' : view === 'published' ? `Publicado v${pubV}` : dirty ? `Rascunho · ${dirty} alteraç${dirty > 1 ? 'ões' : 'ão'}` : `Publicado v${pubV}`}</Badge>
        </div>
        <p>{KIND_LABEL[wf.kind]} · {wf.description}{nx ? ` · próxima execução ${nx.when} (${nx.in})` : wf.schedule && wf.next ? ` · próxima ${wf.next}` : ''}</p>
      </div>
      <span className="flex-1" />
      <SegmentedControl label="Modo do fluxo" value={mode} onChange={(m) => { if (m === 'edit' && view === 'published') st.setView('draft'); st.setMode(m); }} options={[{ id: 'monitor', label: 'Monitorar' }, { id: 'edit', label: 'Editar' }]} />
      <SegmentedControl label="Versão exibida" value={view} onChange={st.setView} options={[{ id: 'draft', label: 'Rascunho' }, { id: 'published', label: 'Publicado' }]} />
      {aiEnabled && <Button icon="copilot" onPress={() => { setR('copilot'); st.ask('Explique esse fluxo'); }}>Explicar</Button>}
      <Button icon="clock" onPress={() => setDlg('versions')}>Versões</Button>
      <IconButton icon="layers" label={rightOpen ? 'Ocultar painel lateral' : 'Mostrar painel lateral'} size="sm" onPress={() => setRight(!rightOpen)} />
      {mode === 'monitor' ? <Button variant="primary" icon="play" onPress={() => { st.run(); setFollow(true); }}>Executar</Button> : <><Button icon="play" onPress={() => { st.run(true); setR('run'); }}>Testar</Button><Button variant="primary" icon="check" isDisabled={view !== 'draft'} onPress={() => setDlg('publish')}>Publicar</Button></>}
    </header>

    <aside className="wf-left" aria-label="Biblioteca de nós"><div className="wf-tabs" role="tablist"><button role="tab" aria-selected="true">Nós</button></div>{leftOpen && <NodeLibrary />}</aside>

    <section className="wf-center">
      {mode === 'edit' && <div className="wf-edit-tools" role="toolbar" aria-label="Ferramentas de edição">
        <IconButton icon="undo" label="Desfazer" shortcut="⌘Z" size="sm" isDisabled={!editable || !pastN} onPress={st.undo} />
        <IconButton icon="redo" label="Refazer" shortcut="⇧⌘Z" size="sm" isDisabled={!editable || !futN} onPress={st.redo} />
        <span className="wf-sep" />
        <IconButton icon="copy" label="Duplicar" shortcut="⌘D" size="sm" isDisabled={!editable || !sel.length} onPress={st.duplicate} />
        <IconButton icon="container" label="Agrupar seleção" shortcut="⌘G" size="sm" isDisabled={!editable || sel.length < 2} onPress={() => st.group()} />
        <IconButton icon="trash" label="Remover" shortcut="⌫" size="sm" isDisabled={!editable || (!sel.length && !st.selEdge)} onPress={st.removeSel} />
        <span className="wf-sep" />
        <Button size="sm" variant="ghost" icon="grid" isDisabled={!editable || !base.nodes.length} onPress={st.layout}>Organizar</Button>
        <span className="flex-1" />
        <small className="wf-muted">Arraste da porta de saída ● até outro nó para conectar · Shift seleciona · Espaço move o canvas · ⌘+rolagem dá zoom</small>
      </div>}
      <Canvas wf={wf} run={mode === 'monitor' ? run : undefined} mode={mode} editable={editable} ghost={ghost} filters={filters} follow={follow} onFilters={setFilters} onFollow={setFollow} />
      {mode === 'monitor' && <div className={`wf-dock-wrap ${dockOpen ? '' : 'is-closed'}`}>
        <button type="button" className="wf-dock-toggle" aria-expanded={dockOpen} onClick={() => setDock(!dockOpen)}><Icon name={dockOpen ? 'chevronDown' : 'chevronRight'} size={12} />Execução {run ? `#${run.id}` : ''}</button>
        {dockOpen && <Dock wf={wf} run={run} tab={dTab} onTab={setD} sel={sel} onSelect={(n) => { st.select([n]); setR('inspector'); }} />}
      </div>}
    </section>

    <aside className="wf-right" aria-label="Painel do fluxo">
      <div className="wf-tabs" role="tablist">
        <button role="tab" aria-selected={rTab === 'inspector'} onClick={() => setR('inspector')}>Inspetor</button>
        <button role="tab" aria-selected={rTab === 'run'} onClick={() => setR('run')}>Execução{run?.status === 'failed' ? <i className="wf-tab-dot is-failed" /> : run?.status === 'paused' ? <i className="wf-tab-dot is-paused" /> : null}</button>
        {aiEnabled && <button role="tab" aria-selected={rTab === 'copilot'} onClick={() => setR('copilot')}><Icon name="copilot" size={12} />Copilot</button>}
      </div>
      <div className="wf-right-body">
        {rTab === 'inspector' && <Inspector wf={wf} run={run} editable={editable} onRows={() => setDlg('rows')} onVersions={() => setDlg('versions')} onTab={setR} />}
        {rTab === 'run' && <RunPanel wf={wf} run={run} runs={wfRuns} onRows={() => setDlg('rows')} />}
        {rTab === 'copilot' && aiEnabled && <CopilotPanel wf={wf} />}
      </div>
    </aside>

    <PublishDialog wf={base} open={dlg === 'publish'} onClose={() => setDlg(null)} />
    <VersionsDialog key={id + (dlg === 'versions')} wf={base} open={dlg === 'versions'} onClose={() => setDlg(null)} />
    <RowsDialog open={dlg === 'rows'} onClose={() => setDlg(null)} rows={rowsFor} />
  </div>;
}
