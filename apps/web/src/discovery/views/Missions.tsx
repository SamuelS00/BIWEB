import { useMemo, useState } from 'react';
import { Badge, Button, Icon } from '@biweb/ui';
import { DATASETS, EVIDENCE_PACKS, ENTITIES, OBSERVATIONS, RUNS, CHANGES, SOURCES } from '../data/seed';
import { ago, confidenceOf, entityById, inWeek } from '../data/derive';
import { TEMPLATES, cap, specText, useMissionDraft } from '../data/missions';
import type { ResearchMission } from '../data/types';
import { useDs } from '../store';
import { AuthorityBadge, Chip, ConfChip, Dot, Empty, Grid, HealthBadge, Kv, LevelBadge, ProgressList, Section, TraceBtn, Tabs2, ViewHead, dpath, useGo, useSteps, type Col } from '../ui';
import { MissionWizard } from './MissionWizard';
import './missions.css';

export function MissionsView({ id }: { id?: string }) {
  if (id === 'new') return <MissionWizard />;
  if (id) return <MissionDetail id={id} />;
  return <MissionList />;
}

/* ───────── lista ───────── */
function MissionList() {
  const go = useGo();
  const missions = useDs((s) => s.missions), paused = useDs((s) => s.paused), sel = useDs((s) => s.sel);
  const setTemplate = useMissionDraft((s) => s.setTemplate);
  const start = (tid?: string) => { if (tid) setTemplate(tid); go(dpath('missions', 'new')); };
  const cols: Col<ResearchMission>[] = [
    { key: 'name', label: 'Mission', w: 'minmax(200px, 2fr)', render: (m) => <span className="ds-ms-cell"><button type="button" className="ds-ms-link" aria-label={`Open ${m.name}`} onClick={(e) => { e.stopPropagation(); go(dpath('missions', m.id)); }}>{m.name}</button><small>{m.spec.objective}</small></span> },
    { key: 'tpl', label: 'Template', w: 'minmax(130px, 1fr)', render: (m) => m.template },
    { key: 'st', label: 'Status', w: '84px', render: (m) => <span className="ds-ms-st"><Dot tone={paused[m.id] ? 'warning' : 'success'} />{paused[m.id] ? 'Paused' : 'Active'}</span> },
    { key: 'last', label: 'Last run', w: '84px', render: (m) => ago(m.lastRunMin) },
    { key: 'next', label: 'Next run', w: '100px', render: (m) => m.nextRun },
    { key: 'ent', label: 'Entities', w: '64px', right: true, render: (m) => <span className="bw-num">{m.entities}</span> },
    { key: 'src', label: 'Sources', w: '66px', right: true, render: (m) => <span className="bw-num">{m.sourcesMonitored}</span> },
    { key: 'obs', label: 'Observations', w: '96px', right: true, render: (m) => <span className="bw-num">{m.observations.toLocaleString()}</span> },
    { key: 'chg', label: 'Changes / wk', w: '90px', right: true, render: (m) => <span className="bw-num">{m.changesWeek}</span> },
  ];
  return (
    <div className="dw-view">
      <ViewHead title="Research Missions" sub="A mission states what to find, where to look, who it is about and how it is verified. It never starts from a scraper." actions={<Button variant="primary" size="sm" icon="plus" onPress={() => start()}>New mission</Button>} />
      <Section title="Start from a template" hint="Pre-filled objective, sources and delivery you can change">
        <div className="ds-ms-tpl">
          {TEMPLATES.map((t) => <button key={t.id} type="button" onClick={() => start(t.id)} aria-label={`New mission from ${t.name}`}><b>{t.name}</b><small>{t.tagline}</small><em>Input: {t.inputs}</em><em>Output: {t.outputs.slice(0, 3).join(' · ')}</em></button>)}
        </div>
      </Section>
      <Section title="Your missions" hint={`${missions.length} missions`}>
        <Grid label="Research missions" cols={cols} rows={missions} id={(m) => m.id} selected={sel?.kind === 'mission' ? sel.id : null} onRow={(m) => useDs.getState().select({ kind: 'mission', id: m.id })}
          empty={<Empty icon="target" title="Create your first research mission." text="Describe what you want to find; BIWEB plans the sources, evidence and checks." action={<Button size="sm" variant="primary" onPress={() => start()}>New mission</Button>} />} />
      </Section>
    </div>
  );
}

/* ───────── detalhe ───────── */
type Tab = 'overview' | 'entities' | 'sources' | 'observations' | 'changes' | 'evidence' | 'runs' | 'settings';

function MissionDetail({ id }: { id: string }) {
  const go = useGo();
  const m = useDs((s) => s.missions.find((x) => x.id === id));
  const paused = useDs((s) => !!s.paused[id]);
  const [tab, setTab] = useState<Tab>('overview');
  const data = useMemo(() => {
    const ents = ENTITIES.filter((e) => e.missionIds.includes(id));
    const srcs = SOURCES.filter((s) => s.usedBy.includes(id));
    const obs = OBSERVATIONS.filter((o) => o.missionId === id);
    const chg = CHANGES.filter((c) => c.missionId === id).sort((a, b) => a.detectedMin - b.detectedMin);
    const packs = EVIDENCE_PACKS.filter((p) => ents.some((e) => e.id === p.subjectId));
    const runs = RUNS.filter((r) => r.missionId === id);
    return { ents, srcs, obs, chg, packs, runs };
  }, [id]);
  if (!m) return <div className="dw-view"><Empty icon="target" title="Mission not found" text="This mission does not exist in this workspace." action={<Button size="sm" onPress={() => go(dpath('missions'))}>Back to missions</Button>} /></div>;
  const { ents, srcs, obs, chg, packs, runs } = data;
  const fresh = m.observations === 0;
  return (
    <div className="dw-view dw-view--flush">
      <div className="dw-sh">
        <button type="button" className="dw-back" onClick={() => go(dpath('missions'))}><Icon name="arrowLeft" size={12} />Missions</button>
        <div className="dw-sh-main"><h2>{m.name}</h2><span className="ds-ms-st"><Dot tone={paused ? 'warning' : 'success'} />{paused ? 'Paused' : 'Active'}</span><Badge tone="neutral">{m.template}</Badge></div>
        <p className="dw-path">{m.spec.objective}</p>
        <div className="dw-sh-facts">
          <Kv k="Last run" v={fresh && m.lastRunMin === 0 ? 'Not yet run' : ago(m.lastRunMin)} /><Kv k="Next run" v={paused ? 'Paused' : m.nextRun} /><Kv k="Entities" v={m.entities} /><Kv k="Sources monitored" v={m.sourcesMonitored} />
          <Kv k="Observations" v={m.observations.toLocaleString()} /><Kv k="Changes this week" v={m.changesWeek} />
        </div>
        <Tabs2<Tab> label="Mission sections" value={tab} onChange={setTab} tabs={[
          { id: 'overview', label: 'Overview' }, { id: 'entities', label: 'Entities', n: ents.length }, { id: 'sources', label: 'Sources', n: srcs.length }, { id: 'observations', label: 'Observations', n: obs.length },
          { id: 'changes', label: 'Changes', n: m.changesWeek }, { id: 'evidence', label: 'Evidence', n: packs.length }, { id: 'runs', label: 'Runs', n: runs.length }, { id: 'settings', label: 'Settings' }]} />
      </div>
      <div className="dw-pad-v">
        {tab === 'overview' && <Overview m={m} fresh={fresh} entNames={ents.map((e) => e.name)} />}
        {tab === 'entities' && <EntitiesTab m={m} ents={ents} />}
        {tab === 'sources' && <SourcesTab srcs={srcs} />}
        {tab === 'observations' && <ObservationsTab obs={obs} total={m.observations} />}
        {tab === 'changes' && <ChangesTab m={m} chg={chg} />}
        {tab === 'evidence' && <EvidenceTab packs={packs} />}
        {tab === 'runs' && <RunsTab runs={runs} />}
        {tab === 'settings' && <SettingsTab m={m} paused={paused} fresh={fresh} />}
      </div>
    </div>
  );
}

const open = (kind: 'entity' | 'source' | 'observation' | 'change' | 'run', id: string) => useDs.getState().select({ kind, id });

function Overview({ m, fresh, entNames }: { m: ResearchMission; fresh: boolean; entNames: string[] }) {
  const go = useGo();
  const rows = [['WHAT', m.spec.objective], ['WHERE', m.spec.sources.map(cap).join(', ')], ['WHO', m.spec.entities.join(', ')], ['EXTRACT', m.spec.extract.map(cap).join(', ')], ['VERIFY', `${m.spec.minEvidence ?? 2}+ sources · ${m.spec.preferredSource ?? 'Official'} preferred · confidence ≥ ${m.spec.confidenceThreshold ?? 80}%`], ['WHEN', m.spec.frequency], ['DELIVER', m.spec.deliver.replace(/_/g, ' ')]] as const;
  return (
    <>
      <Section title="Mission map" hint="Aggregated view: select a node to inspect it">
        <MissionMap m={m} entNames={entNames} />
      </Section>
      <div className="ds-ms-two">
        <Section title="Research brief"><dl className="ds-mw-plain">{rows.map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></Section>
        <Section title="Latest activity">
          {fresh ? <Empty icon="target" title="No observations found yet." text="This mission has not run. Run it now to discover sources and collect the first evidence." />
            : <ul className="dw-hits">{CHANGES.filter((c) => c.missionId === m.id).sort((a, b) => a.detectedMin - b.detectedMin).slice(0, 5).map((c) => <li key={c.id}><button type="button" onClick={() => go(dpath('changes', c.id))}><b>{c.entity}</b><span>{c.semantic}</span><span className="flex-1" /><span className="dw-muted">{ago(c.detectedMin)}</span></button></li>)}
              {CHANGES.every((c) => c.missionId !== m.id) && <li><p className="dw-more">No relevant changes detected.</p></li>}</ul>}
        </Section>
      </div>
      <RunNow m={m} fresh={fresh} />
    </>
  );
}

function MissionMap({ m, entNames }: { m: ResearchMission; entNames: string[] }) {
  const [on, setOn] = useState<string | null>(null);
  const ds1 = DATASETS.find((d) => d.missionId === m.id);
  const layers = useMemo(() => [
    { name: 'Mission', items: [m.name] },
    { name: 'Entities', items: (entNames.length ? entNames : m.spec.entities).slice(0, 6) },
    { name: 'Sources', items: m.spec.sources.map(cap).slice(0, 5) },
    { name: 'Observations', items: m.spec.extract.map(cap).slice(0, 4) },
    { name: 'Output', items: [ds1 ? `${ds1.name} Dataset` : cap(m.spec.deliver.replace(/_/g, ' ')), 'Copilot Context', 'Dashboard'] },
  ], [m, entNames, ds1]);
  const W = 130, G = 32, N = 40, maxN = Math.max(...layers.map((l) => l.items.length)), H = 36 + maxN * 38;
  const pos = (li: number, j: number) => { const n = layers[li]!.items.length, step = (maxN * 38) / n; return { x: 8 + li * (W + G), y: 30 + step * (j + 0.5) }; };
  const edges: { a: string; b: string; d: string }[] = [];
  for (let li = 0; li < layers.length - 1; li++) {
    const A = layers[li]!.items, B = layers[li + 1]!.items, seen = new Set<string>();
    const link = (i: number, j: number) => {
      const k = `${i}-${j}`; if (seen.has(k)) return; seen.add(k);
      const p = pos(li, i), q = pos(li + 1, j), mx = (p.x + W + q.x) / 2;
      edges.push({ a: `${li}:${i}`, b: `${li + 1}:${j}`, d: `M${p.x + W},${p.y} C${mx},${p.y} ${mx},${q.y} ${q.x},${q.y}` });
    };
    A.forEach((_, i) => link(i, B.length === 1 ? 0 : Math.round((i * (B.length - 1)) / Math.max(1, A.length - 1))));
    B.forEach((_, j) => link(A.length === 1 ? 0 : Math.round((j * (A.length - 1)) / Math.max(1, B.length - 1)), j));
  }
  const text = (key: string) => {
    const [l, i] = key.split(':').map(Number) as [number, number]; const lay = layers[l]!, label = lay.items[i] ?? '';
    const ent = l === 1 ? ENTITIES.find((e) => e.name === label) : undefined;
    if (ent) return `${label}: ${ent.type}, ${ent.sources} sources, ${ent.evidenceCoverage}% evidence coverage.`;
    return { 0: `${label}: ${m.spec.frequency.toLowerCase()} mission over ${m.sourcesMonitored} public or authorized sources.`, 2: `${label} sources, read respecting robots.txt and rate limits.`, 3: `${label}: observations always carry Source, Evidence and Confidence.`, 4: `${label}: delivered as a proposal; nothing is applied automatically.` }[l] ?? label;
  };
  return (
    <div className="ds-mmap">
      <svg viewBox={`0 0 ${8 + 5 * (W + G)} ${H}`} role="group" aria-label="Mission map: mission, entities, sources, observations and output">
        {layers.map((l, li) => <text key={l.name} className="lay" x={8 + li * (W + G)} y={16}>{l.name}</text>)}
        {edges.map((e) => <path key={`${e.a}>${e.b}`} className={`e${on && (e.a === on || e.b === on) ? ' is-on' : ''}`} d={e.d} />)}
        {layers.map((l, li) => l.items.map((label, j) => {
          const p = pos(li, j), key = `${li}:${j}`;
          const act = () => { setOn(key); useDs.getState().select({ kind: 'node', id: `${l.name} · ${label}` }); };
          return (
            <g key={key} className={`n${li === 0 ? ' m' : ''}${on === key ? ' is-on' : ''}`} tabIndex={0} role="button" aria-label={`${l.name}: ${label}`} onClick={act} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } }}>
              <title>{label}</title><rect x={p.x} y={p.y - N / 2 + 6} width={W} height={N - 12} rx={6} /><text x={p.x + 8} y={p.y + 4}>{label.length > 19 ? `${label.slice(0, 18)}…` : label}</text>
            </g>
          );
        }))}
      </svg>
      <p className="ds-mmap-note" aria-live="polite">{on ? text(on) : 'Select a node to see what it contains and how it was verified.'}</p>
    </div>
  );
}

/** Run now: checklist com contagens. Em missão sem dados, a primeira execução não inventa resultados. */
function RunNow({ m, fresh }: { m: ResearchMission; fresh: boolean }) {
  const [run, setRun] = useState(false);
  const [done, setDone] = useState(false);
  const toast = useDs((s) => s.toast);
  const n = Math.max(m.sourcesMonitored, 6);
  const items = [
    { label: 'Plan the research', now: 'Planning from the research brief…', done: 'Plan ready' },
    { label: 'Discover sources', now: `Discovering sources (${Math.round(n * 0.6)} of ${n})…`, done: `${n} candidate sources found` },
    { label: 'Check access policy', now: 'Checking robots.txt, authentication and rate limits…', done: 'Public or authorized sources only; blocked ones show the reason' },
    { label: 'Acquire and extract', now: 'Acquiring pages and extracting claims…', done: fresh ? 'Claims extracted for review' : `${Math.round(n * 0.8)} pages read` },
    { label: 'Verify evidence', now: `Checking evidence against the ${m.spec.minEvidence ?? 2}-source rule…`, done: 'Evidence attached to each claim' },
    { label: 'Deliver', now: 'Preparing proposals…', done: 'Delivered as proposals; nothing applied' },
  ];
  const at = useSteps(items.length, 650, run, () => { setRun(false); setDone(true); toast(fresh ? `${m.name}: first run completed. Observations appear as they are verified.` : `${m.name}: run completed`); });
  return (
    <Section title="Run" hint={done ? 'Last manual run just now' : fresh ? 'Not run yet' : `Last run ${ago(m.lastRunMin)}`} actions={<Button size="sm" variant={fresh ? 'primary' : 'default'} icon="play" isDisabled={run} onPress={() => { setDone(false); setRun(true); }}>{run ? 'Running…' : 'Run now'}</Button>}>
      {(run || done) && <ProgressList title={run ? 'Running mission' : 'Run completed'} items={items} at={run ? at : items.length} />}
      {!run && !done && <p className="dw-muted">Runs read only public or authorized sources. Results arrive as proposals with evidence.</p>}
    </Section>
  );
}

/* ───────── abas ───────── */
const none = (t: string) => <p className="dw-more">{t}</p>;

function EntitiesTab({ m, ents }: { m: ResearchMission; ents: ReturnType<typeof entityById>[] }) {
  const go = useGo(); const sel = useDs((s) => s.sel);
  const rows = ents.filter((e): e is NonNullable<typeof e> => !!e);
  if (!rows.length) return <Section title="Entities"><Empty icon="cube" title="No observations found yet." text={m.spec.entities.length ? `Planned entities: ${m.spec.entities.join(', ')}. They appear here once evidence confirms them.` : 'Run the mission to discover entities.'} /></Section>;
  return (
    <Section title="Entities" hint={`${rows.length} resolved`}>
      <Grid label="Mission entities" rows={rows} id={(e) => e.id} selected={sel?.kind === 'entity' ? sel.id : null} onRow={(e) => open('entity', e.id)} cols={[
        { key: 'n', label: 'Entity', w: 'minmax(180px, 2fr)', render: (e) => <button type="button" className="ds-ms-link" aria-label={`Open ${e.name}`} onClick={(ev) => { ev.stopPropagation(); go(dpath('entities', e.id)); }}>{e.name}</button> },
        { key: 't', label: 'Type', w: '110px', render: (e) => e.type }, { key: 'h', label: 'HQ', w: 'minmax(100px, 1fr)', render: (e) => e.hq ?? '—' },
        { key: 's', label: 'Sources', w: '70px', right: true, render: (e) => <span className="bw-num">{e.sources}</span> }, { key: 'c', label: 'Evidence coverage', w: '120px', right: true, render: (e) => <span className="bw-num">{e.evidenceCoverage}%</span> },
        { key: 'f', label: 'Confidence', w: '110px', render: (e) => <ConfChip v={e.confidence} needs={!e.verified} /> }]} />
    </Section>
  );
}
function SourcesTab({ srcs }: { srcs: typeof SOURCES }) {
  const go = useGo(); const sel = useDs((s) => s.sel);
  return (
    <Section title="Sources" hint={`${srcs.length} sources used by this mission`}>
      <Grid label="Mission sources" rows={srcs} id={(s) => s.id} selected={sel?.kind === 'source' ? sel.id : null} onRow={(s) => open('source', s.id)} empty={none('No observations found yet.')} cols={[
        { key: 'n', label: 'Source', w: 'minmax(200px, 2fr)', render: (s) => <button type="button" className="ds-ms-link" aria-label={`Open ${s.name}`} onClick={(e) => { e.stopPropagation(); go(dpath('sources', s.id)); }}>{s.name}</button> },
        { key: 't', label: 'Type', w: '130px', render: (s) => s.type }, { key: 'a', label: 'Authority', w: '100px', render: (s) => <AuthorityBadge a={s.authority} /> },
        { key: 'h', label: 'Health', w: '170px', render: (s) => <HealthBadge s={s} /> }, { key: 'l', label: 'Checked', w: '90px', render: (s) => ago(s.lastCheckedMin) }]} />
    </Section>
  );
}
function ObservationsTab({ obs, total }: { obs: typeof OBSERVATIONS; total: number }) {
  const go = useGo(); const sel = useDs((s) => s.sel);
  return (
    <Section title="Observations" hint={total ? `${obs.length} featured of ${total.toLocaleString()} collected` : undefined}>
      <Grid label="Mission observations" rows={obs} id={(o) => o.id} selected={sel?.kind === 'observation' ? sel.id : null} onRow={(o) => open('observation', o.id)} empty={<Empty icon="list" title="No observations found yet." text="Observations appear after the first verified run." />} cols={[
        { key: 's', label: 'Subject', w: 'minmax(110px, 1fr)', render: (o) => <button type="button" className="ds-ms-link" aria-label={`Open observation ${o.claim}`} onClick={(e) => { e.stopPropagation(); go(dpath('observations', o.id)); }}>{o.subject}</button> },
        { key: 'c', label: 'Claim', w: 'minmax(140px, 1.4fr)', render: (o) => o.claim }, { key: 'v', label: 'Value', w: 'minmax(140px, 1.4fr)', render: (o) => o.value },
        { key: 'f', label: 'Confidence', w: '120px', render: (o) => <ConfChip v={confidenceOf(o)} needs={o.status === 'needs-verification'} /> }, { key: 'e', label: 'Evidence', w: '100px', render: (o) => <TraceBtn evidenceId={o.evidenceIds[0]} /> }]} />
    </Section>
  );
}
function ChangesTab({ m, chg }: { m: ResearchMission; chg: typeof CHANGES }) {
  const go = useGo(); const sel = useDs((s) => s.sel); const [wk, setWk] = useState(true);
  const rows = chg.filter((c) => !wk || inWeek(c));
  return (
    <Section title="Changes" hint={wk ? `${m.changesWeek} this week` : `${chg.length} in total`} actions={<div className="dw-chips"><Chip on={wk} onClick={() => setWk(true)}>This week</Chip><Chip on={!wk} onClick={() => setWk(false)}>All time</Chip></div>}>
      <Grid label="Mission changes" rows={rows} id={(c) => c.id} selected={sel?.kind === 'change' ? sel.id : null} onRow={(c) => open('change', c.id)} empty={<Empty icon="timeline" title="No relevant changes detected." text="Semantic changes appear here when a source says something different." />} cols={[
        { key: 'e', label: 'Entity', w: '110px', render: (c) => <b>{c.entity}</b> }, { key: 's', label: 'Change', w: 'minmax(200px, 2fr)', render: (c) => <button type="button" className="ds-ms-link" aria-label={`Open change ${c.semantic}`} onClick={(e) => { e.stopPropagation(); go(dpath('changes', c.id)); }}>{c.scope}: {c.semantic}</button> },
        { key: 'd', label: 'Detected', w: '90px', render: (c) => ago(c.detectedMin) }, { key: 'c', label: 'Confidence', w: '90px', render: (c) => <LevelBadge l={c.confidence} /> }, { key: 'v', label: 'Evidence', w: '100px', render: (c) => <TraceBtn evidenceId={c.evidenceIds[0]} /> }]} />
    </Section>
  );
}
function EvidenceTab({ packs }: { packs: typeof EVIDENCE_PACKS }) {
  const go = useGo();
  if (!packs.length) return <Section title="Evidence packs"><Empty icon="book" title="No observations found yet." text="Evidence packs are assembled from verified claims." /></Section>;
  return (
    <Section title="Evidence packs" hint={`${packs.length} packs`}>
      <ul className="dw-hits">{packs.map((p) => <li key={p.id}><button type="button" onClick={() => go(dpath('evidence', p.id))}><Icon name="book" size={12} /><b>{p.claim}</b><span className="flex-1" /><span className="dw-muted">{p.evidence.length} evidence · first observed {p.firstObserved}</span><Icon name="chevronRight" size={12} /></button></li>)}</ul>
    </Section>
  );
}
function RunsTab({ runs }: { runs: typeof RUNS }) {
  const go = useGo(); const sel = useDs((s) => s.sel);
  return (
    <Section title="Runs" hint={`${runs.length} runs`}>
      <Grid label="Mission runs" rows={runs} id={(r) => r.id} selected={sel?.kind === 'run' ? sel.id : null} onRow={(r) => open('run', r.id)} empty={none('No runs yet. Use Run now in Overview or Settings.')} cols={[
        { key: 'i', label: 'Run', w: '100px', render: (r) => <button type="button" className="ds-ms-link" aria-label={`Open run ${r.id}`} onClick={(e) => { e.stopPropagation(); go(dpath('runs', r.id)); }}>#{r.id}</button> },
        { key: 's', label: 'Started', w: '140px', render: (r) => r.started }, { key: 'e', label: 'Evaluated', w: '90px', right: true, render: (r) => <span className="bw-num">{r.evaluated}</span> }, { key: 'r', label: 'Relevant', w: '80px', right: true, render: (r) => <span className="bw-num">{r.relevant}</span> },
        { key: 'o', label: 'Observations', w: '100px', right: true, render: (r) => <span className="bw-num">{r.observations}</span> }, { key: 'c', label: 'Conflicts', w: '80px', right: true, render: (r) => <span className="bw-num">{r.conflicts}</span> }]} />
    </Section>
  );
}
function SettingsTab({ m, paused, fresh }: { m: ResearchMission; paused: boolean; fresh: boolean }) {
  const toggle = useDs((s) => s.togglePause), toast = useDs((s) => s.toast);
  return (
    <>
      <Section title="Research spec" hint="What the mission asks, in a form a person can read" actions={<Button size="sm" icon={paused ? 'play' : 'clock'} onPress={() => { toggle(m.id); toast(paused ? `${m.name} resumed` : `${m.name} paused`); }}>{paused ? 'Resume mission' : 'Pause mission'}</Button>}>
        <pre className="ds-spec">{specText(m.spec)}</pre>
      </Section>
      <div className="dw-facts dw-facts--col">
        <Kv k="Verify" v={`At least ${m.spec.minEvidence ?? 2} sources · ${m.spec.preferredSource ?? 'Official'} preferred · confidence threshold ${m.spec.confidenceThreshold ?? 80}%`} />
        <Kv k="Frequency" v={m.spec.frequency} /><Kv k="Deliver" v={m.spec.deliver.replace(/_/g, ' ')} /><Kv k="Access" v="Public or authorized sources only; robots.txt and rate limits respected" />
      </div>
      <RunNow m={m} fresh={fresh} />
    </>
  );
}

