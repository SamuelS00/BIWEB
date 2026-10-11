import { useMemo } from 'react';
import { Badge, Button, Icon } from '@biweb/ui';
import { BLOCK_LABEL_ID, BLOCK_NOTE_ID, DATASETS, DOCUMENTS, EVIDENCE, RELATIONSHIPS, RUNS, RUN_STAGES, SOURCES } from '../data/seed';
import type { BlockReason, Run } from '../data/types';
import { Canvas } from '../../dataworkspace/Canvas';
import { useT, type T } from '../../i18n/intl';
import type { MessageId } from '../../i18n/catalog';
import { useDs } from '../store';
import { Grid, Section, StepList, TraceBtn, ViewHead, dpath, useGo, useSteps, type Col } from '../ui';
import './explore.css';

export const fmtDur = (s: number) => `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
const STAGE_LABEL: Record<(typeof RUN_STAGES)[number], MessageId> = {
  Plan: 'discovery.runs.stage.plan', Discover: 'discovery.runs.stage.discover', Acquire: 'discovery.runs.stage.acquire', Extract: 'discovery.runs.stage.extract',
  Resolve: 'discovery.runs.stage.resolve', Verify: 'discovery.runs.stage.verify', Synthesize: 'discovery.runs.stage.synthesize', Deliver: 'discovery.runs.stage.deliver',
};
const stageLabel = (r: Run, t: T) => { if (r.stage >= RUN_STAGES.length) return t('discovery.runs.completed'); const st = RUN_STAGES[r.stage]; return st ? t(STAGE_LABEL[st]) : t('discovery.runs.running'); };
const missionName = (id: string) => useDs.getState().missions.find((m) => m.id === id)?.name ?? id;

export function RunsView({ id }: { id?: string }) {
  const r = RUNS.find((x) => x.id === id);
  return r ? <RunDetail r={r} /> : <RunList />;
}

function RunList() {
  const t = useT();
  const go = useGo();
  const sel = useDs((s) => s.sel);
  const cols: Col<Run>[] = [
    { key: 'i', label: t('discovery.runs.col.run'), w: '86px', render: (r) => <b className="bw-mono">{r.id}</b> },
    { key: 'm', label: t('discovery.runs.col.mission'), w: 'minmax(170px, 1.6fr)', render: (r) => <span className="ds-ex-trunc">{r.name}</span> },
    { key: 's', label: t('discovery.runs.col.started'), w: '130px', render: (r) => r.started },
    { key: 'd', label: t('discovery.runs.col.duration'), w: '72px', render: (r) => fmtDur(r.durationS) },
    { key: 'e', label: t('discovery.runs.col.evaluated'), w: '74px', right: true, render: (r) => <span className="bw-num">{r.evaluated}</span> },
    { key: 'r', label: t('discovery.runs.col.relevant'), w: '66px', right: true, render: (r) => <span className="bw-num">{r.relevant}</span> },
    { key: 'n', label: t('discovery.nav.entities'), w: '64px', right: true, render: (r) => <span className="bw-num">{r.entities}</span> },
    { key: 'o', label: t('discovery.nav.observations'), w: '92px', right: true, render: (r) => <span className="bw-num">{r.observations}</span> },
    { key: 'c', label: t('discovery.nav.conflicts'), w: '66px', right: true, render: (r) => <span className="bw-num">{r.conflicts}</span> },
    { key: 'g', label: t('discovery.runs.col.stage'), w: '104px', render: (r) => <Badge tone={r.stage >= RUN_STAGES.length ? 'success' : 'accent'} icon={r.stage >= RUN_STAGES.length ? 'check' : undefined}>{stageLabel(r, t)}</Badge> },
    { key: 'x', label: '', w: '58px', right: true, render: (r) => <Button size="sm" variant="ghost" aria-label={t('discovery.runs.openAria', { id: r.id })} onPress={() => go(dpath('runs', r.id))}>{t('discovery.runs.open')}</Button> },
  ];
  return (
    <div className="dw-view">
      <ViewHead title={t('discovery.nav.runs')} sub={t('discovery.runs.sub')} />
      <Grid cols={cols} rows={RUNS} id={(r) => r.id} selected={sel?.kind === 'run' ? sel.id : null} onRow={(r) => useDs.getState().select({ kind: 'run', id: r.id })} label={t('discovery.runs.gridLabel')} />
    </div>
  );
}

function RunDetail({ r }: { r: Run }) {
  const t = useT();
  const go = useGo();
  const sel = useDs((s) => s.sel);
  const inProgress = r.stage < RUN_STAGES.length;
  // Verify (e demais etapas pendentes) avança devagar e termina.
  const extra = useSteps(RUN_STAGES.length - r.stage, 2400, inProgress);
  const at = Math.min(RUN_STAGES.length, r.stage + extra);
  const running = at < RUN_STAGES.length;
  const sub: Record<number, string> = { 5: t('discovery.runs.sub.verify', { done: Math.round(r.observations * 0.41), total: r.observations }), 6: t('discovery.runs.sub.synthesize'), 7: t('discovery.runs.sub.deliver') };

  const mission = useDs((s) => s.missions.find((m) => m.id === r.missionId));
  const rel = RELATIONSHIPS.filter((x) => mission?.entityIds.includes(x.from) || mission?.entityIds.includes(x.to)).length || Math.max(1, Math.round(r.entities * 0.7));
  const dsets = DATASETS.filter((d) => d.missionId === r.missionId).length || 1;
  const blocked = SOURCES.filter((s) => s.blocked && s.usedBy.includes(r.missionId));
  const byReason = (Object.keys(BLOCK_LABEL_ID) as BlockReason[]).map((k) => ({ k, n: blocked.filter((s) => s.blocked === k).length })).filter((x) => x.n > 0);
  const docs = DOCUMENTS.filter((d) => SOURCES.find((s) => s.id === d.sourceId)?.usedBy.includes(r.missionId));

  const graph = useMemo(() => {
    const items: { key: string; label: string; n: number; hint: string }[] = [
      { key: 'query', label: t('discovery.runs.graph.query'), n: 1, hint: t('discovery.runs.graph.queryHint') }, { key: 'sources', label: t('discovery.nav.sources'), n: r.evaluated, hint: t('discovery.runs.graph.relevant', { n: r.relevant }) }, { key: 'documents', label: t('discovery.runs.graph.documents'), n: r.documents, hint: t('discovery.runs.graph.documentsHint') },
      { key: 'observations', label: t('discovery.nav.observations'), n: r.observations, hint: t('discovery.runs.graph.observationsHint') }, { key: 'entities', label: t('discovery.nav.entities'), n: r.entities, hint: t('discovery.runs.graph.entitiesHint') }, { key: 'relationships', label: t('discovery.runs.graph.relationships'), n: rel, hint: t('discovery.runs.graph.relationshipsHint') }, { key: 'datasets', label: t('discovery.nav.datasets'), n: dsets, hint: t('discovery.runs.graph.datasetsHint') },
    ];
    const nodes = items.map((it, i) => ({ id: it.key, x: i * 200, y: 0, w: 156, h: 70 }));
    const edges = items.slice(1).map((it, i) => ({ id: `e${i}`, from: items[i]!.key, to: it.key, active: i + 1 <= at, dim: i + 1 > at + 1 }));
    return { items, nodes, edges };
  }, [r, rel, dsets, at, t]);

  return (
    <div className="dw-view">
      <ViewHead title={t('discovery.runs.detailTitle', { id: r.id, name: r.name })} sub={t('discovery.runs.detailSub', { mission: missionName(r.missionId), time: r.started.slice(11) })} actions={<><Button size="sm" variant="ghost" onPress={() => go(dpath('missions', r.missionId))}>{t('discovery.runs.openMission')}</Button><Button size="sm" variant="ghost" onPress={() => go(dpath('runs'))}>{t('discovery.runs.allRuns')}</Button></>} />
      <div className="ds-ex-strip" role="list" aria-label={t('discovery.runs.totals')}>
        {([[t('discovery.runs.col.started'), r.started.slice(11)], [t('discovery.runs.col.duration'), fmtDur(r.durationS)], [t('discovery.runs.sourcesEvaluated'), r.evaluated], [t('discovery.runs.col.relevant'), r.relevant], [t('discovery.runs.graph.documents'), r.documents], [t('discovery.nav.entities'), r.entities], [t('discovery.nav.observations'), r.observations], [t('discovery.nav.conflicts'), r.conflicts]] as [string, string | number][]).map(([k, v]) => <span key={k} role="listitem">{k}<b className="bw-num">{v}</b></span>)}
      </div>
      <div className="ds-ex-two">
        <Section title={t('discovery.runs.stages')} hint={running ? t('discovery.runs.inProgress') : t('discovery.runs.completed')}>
          <div className="ds-prog"><StepList steps={RUN_STAGES.map((st) => t(STAGE_LABEL[st]))} at={at} sub={sub} /></div>
        </Section>
        <Section title={t('discovery.governance.blocked')} hint={t('discovery.runs.notCollected', { count: blocked.length })}>
          {byReason.length === 0 ? <p className="dw-more">{t('discovery.runs.blockedNone')}</p> : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
              {byReason.map(({ k, n }) => <li key={k} className="ds-ex-callout"><Icon name="lock" size={12} /><span><b>{t(BLOCK_LABEL_ID[k])}</b> · {n}<br /><span className="dw-muted">{t(BLOCK_NOTE_ID[k])}</span></span></li>)}
            </ul>
          )}
          <p className="dw-muted">{t('discovery.runs.noBypass')}</p>
        </Section>
      </div>
      <Section title={t('discovery.runs.graph.title')} hint={t('discovery.runs.graph.hint')}>
        <div className="ds-graph" style={{ height: 230 }}>
          <Canvas label={t('discovery.runs.graph.title')} fitKey={r.id} minimap={false} nodes={graph.nodes} edges={graph.edges}
            renderNode={(id) => {
              const it = graph.items.find((x) => x.key === id);
              const on = sel?.kind === 'node' && sel.id === `${r.id}:${id}`;
              return it ? <button type="button" className={`ds-node${on ? ' is-on' : ''}`} style={{ width: '100%' }} aria-label={`${it.label}: ${it.n}`} onClick={() => useDs.getState().select({ kind: 'node', id: `${r.id}:${id}` })}><small>{it.label}</small><b className="bw-num" style={{ fontSize: 18 }}>{it.n}</b><small>{it.hint}</small></button> : null;
            }} />
        </div>
      </Section>
      <Section title={t('discovery.runs.graph.documents')} hint={t('discovery.runs.docs.hint')}>
        {docs.length === 0 ? <p className="dw-more">{t('discovery.runs.docs.empty')}</p> : docs.map((d) => {
          const ev = EVIDENCE.find((e) => e.sourceId === d.sourceId);
          return (
            <div key={d.id} className="ds-ex-panel">
              <h4><Icon name="report" size={12} /> {d.name} <span className="dw-muted">· {d.kind}{d.pages ? ` · ${t('discovery.runs.docs.pages', { count: d.pages })}` : ''}</span></h4>
              <div className="dw-chips" aria-label={t('discovery.runs.docs.fields')}>{d.extracted.map((x) => <span key={x.field} className="dw-chip" title={x.value}>{x.field}: {x.value}</span>)}</div>
              <div className="dw-muted" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>{t('discovery.runs.docs.document')}<Icon name="arrowRight" size={12} />{t('discovery.runs.docs.extraction', { count: d.extracted.length })}<Icon name="arrowRight" size={12} />{t('discovery.nav.observations')}<Icon name="arrowRight" size={12} />{t('discovery.nav.evidence')} <TraceBtn evidenceId={ev?.id} /></div>
            </div>
          );
        })}
      </Section>
    </div>
  );
}
