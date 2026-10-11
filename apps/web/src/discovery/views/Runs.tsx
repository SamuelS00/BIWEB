import { useMemo } from 'react';
import { Badge, Button, Icon } from '@biweb/ui';
import { BLOCK_LABEL, BLOCK_NOTE, DATASETS, DOCUMENTS, EVIDENCE, RELATIONSHIPS, RUNS, RUN_STAGES, SOURCES } from '../data/seed';
import type { BlockReason, Run } from '../data/types';
import { Canvas } from '../../dataworkspace/Canvas';
import { useDs } from '../store';
import { Grid, Section, StepList, TraceBtn, ViewHead, dpath, useGo, useSteps, type Col } from '../ui';
import './explore.css';

export const fmtDur = (s: number) => `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
const stageLabel = (r: Run) => (r.stage >= RUN_STAGES.length ? 'Completed' : RUN_STAGES[r.stage] ?? 'Running');
const missionName = (id: string) => useDs.getState().missions.find((m) => m.id === id)?.name ?? id;

export function RunsView({ id }: { id?: string }) {
  const r = RUNS.find((x) => x.id === id);
  return r ? <RunDetail r={r} /> : <RunList />;
}

function RunList() {
  const go = useGo();
  const sel = useDs((s) => s.sel);
  const cols: Col<Run>[] = [
    { key: 'i', label: 'Run', w: '86px', render: (r) => <b className="bw-mono">{r.id}</b> },
    { key: 'm', label: 'Mission', w: 'minmax(170px, 1.6fr)', render: (r) => <span className="ds-ex-trunc">{r.name}</span> },
    { key: 's', label: 'Started', w: '130px', render: (r) => r.started },
    { key: 'd', label: 'Duration', w: '72px', render: (r) => fmtDur(r.durationS) },
    { key: 'e', label: 'Evaluated', w: '74px', right: true, render: (r) => <span className="bw-num">{r.evaluated}</span> },
    { key: 'r', label: 'Relevant', w: '66px', right: true, render: (r) => <span className="bw-num">{r.relevant}</span> },
    { key: 'n', label: 'Entities', w: '64px', right: true, render: (r) => <span className="bw-num">{r.entities}</span> },
    { key: 'o', label: 'Observations', w: '92px', right: true, render: (r) => <span className="bw-num">{r.observations}</span> },
    { key: 'c', label: 'Conflicts', w: '66px', right: true, render: (r) => <span className="bw-num">{r.conflicts}</span> },
    { key: 'g', label: 'Stage', w: '104px', render: (r) => <Badge tone={r.stage >= RUN_STAGES.length ? 'success' : 'accent'} icon={r.stage >= RUN_STAGES.length ? 'check' : undefined}>{stageLabel(r)}</Badge> },
    { key: 'x', label: '', w: '58px', right: true, render: (r) => <Button size="sm" variant="ghost" aria-label={`Open run ${r.id}`} onPress={() => go(dpath('runs', r.id))}>Open</Button> },
  ];
  return (
    <div className="dw-view">
      <ViewHead title="Runs" sub="Every discovery run: Plan, Discover, Acquire, Extract, Resolve, Verify, Synthesize, Deliver." />
      <Grid cols={cols} rows={RUNS} id={(r) => r.id} selected={sel?.kind === 'run' ? sel.id : null} onRow={(r) => useDs.getState().select({ kind: 'run', id: r.id })} label="Discovery runs" />
    </div>
  );
}

function RunDetail({ r }: { r: Run }) {
  const go = useGo();
  const sel = useDs((s) => s.sel);
  const inProgress = r.stage < RUN_STAGES.length;
  // Verify (e demais etapas pendentes) avança devagar e termina.
  const extra = useSteps(RUN_STAGES.length - r.stage, 2400, inProgress);
  const at = Math.min(RUN_STAGES.length, r.stage + extra);
  const running = at < RUN_STAGES.length;
  const sub: Record<number, string> = { 5: `${Math.round(r.observations * 0.41)} / ${r.observations} observations cross-checked`, 6: 'Writing the research summary', 7: 'Preparing datasets for handoff' };

  const mission = useDs((s) => s.missions.find((m) => m.id === r.missionId));
  const rel = RELATIONSHIPS.filter((x) => mission?.entityIds.includes(x.from) || mission?.entityIds.includes(x.to)).length || Math.max(1, Math.round(r.entities * 0.7));
  const dsets = DATASETS.filter((d) => d.missionId === r.missionId).length || 1;
  const blocked = SOURCES.filter((s) => s.blocked && s.usedBy.includes(r.missionId));
  const byReason = (Object.keys(BLOCK_LABEL) as BlockReason[]).map((k) => ({ k, n: blocked.filter((s) => s.blocked === k).length })).filter((x) => x.n > 0);
  const docs = DOCUMENTS.filter((d) => SOURCES.find((s) => s.id === d.sourceId)?.usedBy.includes(r.missionId));

  const graph = useMemo(() => {
    const items: { key: string; label: string; n: number; hint: string }[] = [
      { key: 'query', label: 'Query', n: 1, hint: 'Research question' }, { key: 'sources', label: 'Sources', n: r.evaluated, hint: `${r.relevant} relevant` }, { key: 'documents', label: 'Documents', n: r.documents, hint: 'PDF, HTML, API' },
      { key: 'observations', label: 'Observations', n: r.observations, hint: 'claims with evidence' }, { key: 'entities', label: 'Entities', n: r.entities, hint: 'resolved' }, { key: 'relationships', label: 'Relationships', n: rel, hint: 'between entities' }, { key: 'datasets', label: 'Datasets', n: dsets, hint: 'versioned' },
    ];
    const nodes = items.map((it, i) => ({ id: it.key, x: i * 200, y: 0, w: 156, h: 70 }));
    const edges = items.slice(1).map((it, i) => ({ id: `e${i}`, from: items[i]!.key, to: it.key, active: i + 1 <= at, dim: i + 1 > at + 1 }));
    return { items, nodes, edges };
  }, [r, rel, dsets, at]);

  return (
    <div className="dw-view">
      <ViewHead title={`Run #${r.id} · ${r.name}`} sub={`Mission ${missionName(r.missionId)} · started ${r.started.slice(11)}`} actions={<><Button size="sm" variant="ghost" onPress={() => go(dpath('missions', r.missionId))}>Open mission</Button><Button size="sm" variant="ghost" onPress={() => go(dpath('runs'))}>All runs</Button></>} />
      <div className="ds-ex-strip" role="list" aria-label="Run totals">
        {([['Started', r.started.slice(11)], ['Duration', fmtDur(r.durationS)], ['Sources evaluated', r.evaluated], ['Relevant', r.relevant], ['Documents', r.documents], ['Entities', r.entities], ['Observations', r.observations], ['Conflicts', r.conflicts]] as [string, string | number][]).map(([k, v]) => <span key={k} role="listitem">{k}<b className="bw-num">{v}</b></span>)}
      </div>
      <div className="ds-ex-two">
        <Section title="Stages" hint={running ? 'In progress' : 'Completed'}>
          <div className="ds-prog"><StepList steps={[...RUN_STAGES]} at={at} sub={sub} /></div>
        </Section>
        <Section title="Blocked sources" hint={`${blocked.length} not collected`}>
          {byReason.length === 0 ? <p className="dw-more">No blocked sources in this run.</p> : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
              {byReason.map(({ k, n }) => <li key={k} className="ds-ex-callout"><Icon name="lock" size={12} /><span><b>{BLOCK_LABEL[k]}</b> · {n}<br /><span className="dw-muted">{BLOCK_NOTE[k]}</span></span></li>)}
            </ul>
          )}
          <p className="dw-muted">No bypass of authentication, CAPTCHA or rate limits.</p>
        </Section>
      </div>
      <Section title="Research Graph" hint="aggregated clusters, not individual nodes">
        <div className="ds-graph" style={{ height: 230 }}>
          <Canvas label="Research graph" fitKey={r.id} minimap={false} nodes={graph.nodes} edges={graph.edges}
            renderNode={(id) => {
              const it = graph.items.find((x) => x.key === id);
              const on = sel?.kind === 'node' && sel.id === `${r.id}:${id}`;
              return it ? <button type="button" className={`ds-node${on ? ' is-on' : ''}`} style={{ width: '100%' }} aria-label={`${it.label}: ${it.n}`} onClick={() => useDs.getState().select({ kind: 'node', id: `${r.id}:${id}` })}><small>{it.label}</small><b className="bw-num" style={{ fontSize: 18 }}>{it.n}</b><small>{it.hint}</small></button> : null;
            }} />
        </div>
      </Section>
      <Section title="Documents" hint="The BDE discovers and interprets external documents; the LDE organizes internal and approved data.">
        {docs.length === 0 ? <p className="dw-more">No observations found yet.</p> : docs.map((d) => {
          const ev = EVIDENCE.find((e) => e.sourceId === d.sourceId);
          return (
            <div key={d.id} className="ds-ex-panel">
              <h4><Icon name="report" size={12} /> {d.name} <span className="dw-muted">· {d.kind}{d.pages ? ` · ${d.pages} pages` : ''}</span></h4>
              <div className="dw-chips" aria-label="Extracted fields">{d.extracted.map((x) => <span key={x.field} className="dw-chip" title={x.value}>{x.field}: {x.value}</span>)}</div>
              <div className="dw-muted" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>Document<Icon name="arrowRight" size={12} />Extraction ({d.extracted.length} fields)<Icon name="arrowRight" size={12} />Observations<Icon name="arrowRight" size={12} />Evidence <TraceBtn evidenceId={ev?.id} /></div>
            </div>
          );
        })}
      </Section>
    </div>
  );
}
