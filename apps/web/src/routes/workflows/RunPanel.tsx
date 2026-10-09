import { Badge, Button, Icon, SegmentedControl } from '@biweb/ui';
import type { Tone } from '@biweb/ui';
import { fmtBytes, fmtClock, fmtDur, fmtN, runDuration, runRecords, STATE_LABEL } from './engine';
import type { Run, RunStatus } from './engine';
import { ErrorCard } from './Inspector';
import { kindOf } from './model';
import type { NState, Workflow } from './model';
import { useWf } from './store';

const RUN_TONE: Record<RunStatus, { tone: Tone; label: string }> = { running: { tone: 'accent', label: 'Executando' }, success: { tone: 'success', label: 'Sucesso' }, failed: { tone: 'danger', label: 'Falhou' }, paused: { tone: 'warning', label: 'Pausado' }, warning: { tone: 'warning', label: 'Com avisos' } };
export const runTone = (s: RunStatus) => RUN_TONE[s];

function Stat({ k, v, tone }: { k: string; v: React.ReactNode; tone?: string }) { return <div className={tone}><small>{k}</small><b>{v}</b></div>; }

/** Painel “Execução”: execução selecionada, métricas, tarefas humanas, erros e histórico. */
export function RunPanel({ wf, run, runs, onRows }: { wf: Workflow; run?: Run; runs: Run[]; onRows: () => void }) {
  const st = useWf();
  if (!run) return <div className="wf-insp"><p className="wf-hint">Nenhuma execução ainda. Clique em <b>Executar</b> para iniciar e acompanhar cada nó em tempo real.</p></div>;
  const dur = run.done ? runDuration(run) : run.clock, rt = RUN_TONE[run.status], recs = runRecords(wf, run);
  const failed = Object.entries(run.nodes).filter(([, r]) => r.state === 'failed'), paused = Object.entries(run.nodes).filter(([, r]) => r.state === 'paused');
  const done = Object.values(run.nodes).filter((r) => ['success', 'warning', 'skipped', 'failed'].includes(r.state)).length, total = Object.keys(run.nodes).length;
  return <div className="wf-insp">
    <header className="wf-insp-head"><div><small>EXECUÇÃO {run.test ? '· TESTE' : ''}</small><h2>RUN #{run.id}</h2></div><span className="flex-1" /><Badge tone={rt.tone} icon={run.status === 'failed' ? 'warning' : run.status === 'success' ? 'check' : 'clock'}>{rt.label}</Badge></header>
    <section className="wf-runstat wf-runstat--big">
      <Stat k="Início" v={fmtClock(run.startedAt)} /><Stat k="Duração" v={fmtDur(dur)} /><Stat k="Status" v={rt.label} tone={`is-${run.status}`} /><Stat k="Registros" v={wf.unit === 'linhas' ? fmtN(recs) : `${fmtN(recs)} ${wf.unit}`} />
      <div className="wf-runbar" role="progressbar" aria-label="Progresso da execução" aria-valuenow={Math.round((done / total) * 100)}><i style={{ width: `${(done / total) * 100}%` }} /></div><small className="wf-muted">{done} de {total} nós · {run.trigger}</small>
    </section>
    {paused.map(([id, r]) => { const n = wf.nodes.find((x) => x.id === id)!, k = kindOf(n.kind); void r; return <section key={id} className="wf-task"><header><Badge tone="warning" icon="user">Tarefa humana</Badge></header><b>{n.name}</b><p>{String(n.cfg.who ?? n.cfg.what ?? k.desc)} {n.cfg.sla ? `· prazo ${n.cfg.sla}` : ''}</p><div className="wf-error-actions"><Button size="sm" variant="primary" onPress={() => st.decide(id, n.kind === 'waitaction' || n.kind === 'confirm' ? 'done' : 'approved')}>{n.kind === 'waitaction' ? 'Concluir ação' : 'Aprovar'}</Button>{(n.kind === 'review' || n.kind === 'approval') && <Button size="sm" onPress={() => st.decide(id, 'returned')}>Devolver</Button>}</div></section>; })}
    {failed.map(([id, r]) => <ErrorCard key={id} node={wf.nodes.find((n) => n.id === id)!} r={r} onRows={onRows} />)}
    <section className="wf-hist"><header><b>Execuções recentes</b><SegmentedControl label="Velocidade da simulação" value={String(st.speed)} onChange={(v) => st.setSpeed(Number(v))} options={[{ id: '1', label: '1×' }, { id: '4', label: '4×' }, { id: '16', label: '16×' }]} /></header>
      <ul>{runs.map((r) => { const t = RUN_TONE[r.status]; return <li key={r.id}><button type="button" className={r.id === run.id ? 'is-on' : ''} onClick={() => st.pickRun(r.id)}><i className={`wf-status-dot is-${r.status}`} /><span><b>#{r.id}</b><small>{fmtClock(r.startedAt)} · {r.trigger}</small></span><span className="wf-hist-r"><small>{fmtDur(r.done ? runDuration(r) : r.clock)}</small><small className={`is-${r.status}`}>{t.label}</small></span></button></li>; })}</ul></section>
  </div>;
}

const BAR: Record<NState, string> = { waiting: 'var(--border-control)', running: 'var(--accent)', success: 'var(--success)', warning: 'var(--warning)', failed: 'var(--danger)', paused: 'var(--warning)', skipped: 'var(--border-subtle)' };

/** Linha do tempo (gantt) e registros da execução. */
export function Dock({ wf, run, tab, onTab, onSelect, sel }: { wf: Workflow; run?: Run; tab: 'timeline' | 'logs' | 'table'; onTab: (t: 'timeline' | 'logs' | 'table') => void; onSelect: (id: string) => void; sel: string[] }) {
  const total = run ? Math.max(4, run.done ? runDuration(run) : run.clock + 2, ...Object.values(run.nodes).map((r) => (r.t0 ?? 0) + r.dur)) : 10;
  const rows = run ? wf.nodes.flatMap((n) => { const r = run.nodes[n.id]; return r ? [{ n, r }] : []; }).sort((a, b) => (a.r.t0 ?? 1e9) - (b.r.t0 ?? 1e9) || a.n.x - b.n.x) : [];
  return <section className="wf-dock" aria-label="Detalhes da execução">
    <header><SegmentedControl label="Visão da execução" value={tab} onChange={onTab} options={[{ id: 'timeline', label: 'Linha do tempo' }, { id: 'table', label: 'Nós' }, { id: 'logs', label: 'Registros' }]} />
      <span className="flex-1" />{run && <small className="wf-muted">{run.nodes && Object.values(run.nodes).filter((r) => r.state === 'running').length} em execução · relógio {fmtDur(run.clock)}</small>}</header>
    {!run ? <p className="wf-hint wf-pad">Execute o fluxo para ver a linha do tempo de cada nó.</p> : tab === 'timeline' ? <div className="wf-gantt" role="table" aria-label="Linha do tempo por nó">
      <div className="wf-gantt-axis">{[0, 0.25, 0.5, 0.75, 1].map((p) => <span key={p} style={{ left: `${p * 100}%` }}>{fmtDur(total * p)}</span>)}</div>
      {rows.map(({ n, r }) => <div key={n.id} role="row" className={`wf-gantt-row ${sel.includes(n.id) ? 'is-sel' : ''}`} onClick={() => onSelect(n.id)}>
        <span className="wf-gantt-name" title={n.name}>{n.name}</span>
        <div className="wf-gantt-track">{r.t0 != null && <i className={`is-${r.state}`} style={{ left: `${(r.t0 / total) * 100}%`, width: `${Math.max(0.8, (((r.t1 ?? run.clock) - r.t0) / total) * 100)}%`, background: BAR[r.state] }} />}</div>
        <small>{r.t1 != null && r.t0 != null ? fmtDur(r.t1 - r.t0) : r.state === 'running' ? '…' : '—'}</small></div>)}
    </div> : tab === 'table' ? <div className="wf-tablewrap"><table className="wf-table"><thead><tr><th>Nó</th><th>Estado</th><th>Duração</th><th>Entrada</th><th>Saída</th><th>Volume</th><th>Erros</th></tr></thead><tbody>
      {rows.map(({ n, r }) => <tr key={n.id} className={sel.includes(n.id) ? 'is-sel' : ''} onClick={() => onSelect(n.id)}><td>{n.name}</td><td><Badge tone={r.state === 'success' ? 'success' : r.state === 'failed' ? 'danger' : r.state === 'warning' || r.state === 'paused' ? 'warning' : r.state === 'running' ? 'accent' : 'neutral'}>{STATE_LABEL[r.state]}</Badge></td><td>{r.t1 != null && r.t0 != null ? fmtDur(r.t1 - r.t0) : '—'}</td><td>{r.rowsIn ? fmtN(r.rowsIn) : '—'}</td><td>{r.rowsOut ? fmtN(r.rowsOut) : '—'}</td><td>{r.bytes && wf.unit === 'linhas' ? fmtBytes(r.bytes) : '—'}</td><td>{r.err ? `${fmtN(r.err.rows)} · ${r.err.reason}` : r.warn ?? '—'}</td></tr>)}
    </tbody></table></div> : <ol className="wf-log">{run.log.slice().reverse().map((l, i) => <li key={i} className={`is-${l.level}`}><time>{fmtDur(l.t)}</time><span>{l.msg}</span></li>)}</ol>}
  </section>;
}
export { Icon };
