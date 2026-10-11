import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, IconButton, Icon, Menu, Select, SegmentedControl, Switch, TextField, type MenuEntry } from '@biweb/ui';
import { BLOCK_LABEL, BLOCK_NOTE, CHANGES, MISSIONS, OBSERVATIONS, RUNS, SOURCES, score, snapshotsOf } from '../data/seed';
import { ago, entityById, sourceById } from '../data/derive';
import { EXTRACT_FIELDS, PRODUCT_SCHEMA, lineDiff, previewExtract } from '../data/records';
import type { Authority, SourceDescriptor, SourceType } from '../data/types';
import { useDs } from '../store';
import { AuthorityBadge, Chip, ConfChip, Empty, Grid, HealthBadge, Kv, ProgressList, Search, Section, SemanticChange, Tabs2, TraceBtn, ViewHead, dpath, useGo, type Col } from '../ui';
import { RecLink } from './EntityActions';
import { ObsStatusBadge } from './Observations';
import './records.css';

const AUTH_LEGEND: [Authority, string][] = [['PRIMARY', 'official'], ['SECONDARY', 'reliable unofficial'], ['REFERENCE', 'public base'], ['DISCOVERY', 'used mainly to find other sources']];
const TYPES = [...new Set(SOURCES.map((s) => s.type))].sort() as SourceType[];
const missionName = (id: string) => useDs.getState().missions.find((m) => m.id === id)?.name ?? MISSIONS.find((m) => m.id === id)?.name ?? id;
interface Row { s: SourceDescriptor; mirror?: boolean; mirrors?: number }

export function SourcesView({ id }: { id?: string }) { return id ? <SourceDetail id={id} /> : <Registry />; }

function useSourceActions(s: SourceDescriptor, hooks?: { tab?: (t: Tab) => void; run?: () => void }) {
  const go = useGo();
  const paused = useDs((x) => x.paused[s.id]);
  const open = (t: Tab) => (hooks?.tab ? hooks.tab(t) : (pendingSrcTab = t, go(dpath('sources', s.id))));
  return [
    { id: 'open', label: 'Open source', icon: 'data', onAction: () => go(dpath('sources', s.id)) },
    { id: 'run', label: 'Run now', icon: 'play', ...(s.blocked && s.health === 'blocked' ? { disabledReason: `${BLOCK_LABEL[s.blocked]}: the BDE does not bypass it` } : {}), onAction: () => (hooks?.run ? hooks.run() : (pendingRun = true, go(dpath('sources', s.id)))) },
    { id: 'pause', label: paused ? 'Resume' : 'Pause', icon: 'clock', onAction: () => { useDs.getState().togglePause(s.id); useDs.getState().toast(`${s.name} ${paused ? 'resumed' : 'paused'}`); } },
    { id: 'snap', label: 'View snapshots', icon: 'layers', onAction: () => open('snapshots') },
    { id: 'pol', label: 'Review policy', icon: 'lock', onAction: () => open('policy') },
  ] as MenuEntry[];
}
let pendingSrcTab: Tab | null = null, pendingRun = false;
function SourceMenu({ s }: { s: SourceDescriptor }) {
  const items = useSourceActions(s);
  return <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}><Menu title={`Actions for ${s.name}`} items={items} trigger={<IconButton icon="more" label={`Actions for ${s.name}`} size="sm" />} /></span>;
}

function Registry() {
  const go = useGo();
  const sel = useDs((x) => x.sel);
  const paused = useDs((x) => x.paused);
  const [type, setType] = useState<SourceType | 'all'>('all');
  const [auth, setAuth] = useState<Authority | 'all'>('all');
  const [health, setHealth] = useState<SourceDescriptor['health'] | 'all'>('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const rows = useMemo(() => {
    const out: Row[] = [];
    SOURCES.filter((s) => !s.originalOf && (type === 'all' || s.type === type) && (auth === 'all' || s.authority === auth) && (health === 'all' || s.health === health) && (!q || `${s.name} ${s.url}`.toLowerCase().includes(q.toLowerCase()))).forEach((s) => {
      const m = SOURCES.filter((x) => x.originalOf === s.id);
      out.push({ s, mirrors: m.length });
      if (open[s.id]) m.forEach((x) => out.push({ s: x, mirror: true }));
    });
    return out;
  }, [type, auth, health, q, open]);
  const blocked = SOURCES.filter((s) => s.blocked).length;
  const cols: Col<Row>[] = [
    { key: 'n', label: 'Source', w: 'minmax(220px,2fr)', render: ({ s, mirror, mirrors }) => (
      <span className={`ds-rec-two${mirror ? ' ds-rec-mirror' : ''}`}>
        <RecLink onOpen={() => go(dpath('sources', s.id))}>{mirror && <Icon name="arrowRight" size={12} />}{s.name}{paused[s.id] && <Badge tone="warning">Paused</Badge>}</RecLink>
        {mirrors ? <button type="button" className="ds-rec-link" style={{ font: '400 10px var(--font-sans)', color: 'var(--text-muted)' }} aria-expanded={!!open[s.id]} onClick={(e) => { e.stopPropagation(); setOpen((o) => ({ ...o, [s.id]: !o[s.id] })); }} onKeyDown={(e) => e.stopPropagation()}>{open[s.id] ? 'Hide' : 'Show'} {mirrors} mirrors · 1 original + {mirrors} mirrors = 1 independent evidence</button> : <small>{mirror ? `Mirror of ${sourceById(s.originalOf ?? '')?.name}` : s.url}</small>}
      </span>) },
    { key: 't', label: 'Type', w: '110px', render: ({ s }) => s.type },
    { key: 'a', label: 'Authority', w: '96px', render: ({ s }) => <AuthorityBadge a={s.authority} /> },
    { key: 'l', label: 'Last checked', w: '92px', render: ({ s }) => (s.snapshots === 0 ? '—' : ago(s.lastCheckedMin)) },
    { key: 'c', label: 'Changes', w: '64px', right: true, render: ({ s }) => <span className="bw-num">{s.changes}</span> },
    { key: 'h', label: 'Health', w: '170px', render: ({ s }) => <HealthBadge s={s} /> },
    { key: 'p', label: 'Policy', w: '120px', render: ({ s }) => <span className="ds-rec-clip" title={`${s.policy.access} · robots ${s.policy.robots.toLowerCase()} · ${s.policy.rateLimit}`}>{s.policy.access} · robots ok</span> },
    { key: 'u', label: 'Used by', w: '74px', right: true, render: ({ s }) => <span className="bw-num">{s.usedBy.length} mission{s.usedBy.length === 1 ? '' : 's'}</span> },
    { key: 'm', label: '', w: '32px', render: ({ s }) => <SourceMenu s={s} /> },
  ];
  return (
    <div className="dw-view">
      <ViewHead title="Source Registry" sub={`${SOURCES.length} sources monitored under public or authorized access. ${blocked} are restricted and shown with their reason, never hidden.`} />
      <div className="ds-rec-legend" aria-label="Authority legend"><b>Authority</b>{AUTH_LEGEND.map(([a, t]) => <span key={a}><AuthorityBadge a={a} />{t}</span>)}</div>
      <div className="ds-rec-tool">
        <span className="dw-chips" role="group" aria-label="Authority">
          <Chip on={auth === 'all'} onClick={() => setAuth('all')}>All authorities</Chip>
          {AUTH_LEGEND.map(([a]) => <Chip key={a} on={auth === a} onClick={() => setAuth(a)}>{a}</Chip>)}
        </span>
        <span className="dw-chips" role="group" aria-label="Health">
          {(['all', 'healthy', 'degraded', 'blocked'] as const).map((h) => <Chip key={h} on={health === h} onClick={() => setHealth(h)}>{h === 'all' ? 'Any health' : h[0]!.toUpperCase() + h.slice(1)}</Chip>)}
        </span>
        <Select label="Type" hideLabel options={[{ id: 'all', label: 'All types' }, ...TYPES.map((t) => ({ id: t, label: t }))]} value={type} onChange={(v) => setType(v as SourceType | 'all')} />
        <span className="flex-1" />
        <Search value={q} onChange={setQ} placeholder="Search sources" label="Search sources" w={220} />
      </div>
      <Grid label="Source registry" cols={cols} rows={rows} id={(r) => r.s.id} selected={sel?.kind === 'source' ? sel.id : null} onRow={({ s }) => useDs.getState().select({ kind: 'source', id: s.id })} max={560} empty={<p className="dw-more">No sources match this filter.</p>} />
      <p className="dw-note"><Icon name="lock" size={12} />Restricted sources keep their reason on screen. The BDE respects robots.txt, authentication and rate limits and never works around them.</p>
    </div>
  );
}

type Tab = 'overview' | 'snapshots' | 'observations' | 'changes' | 'policy' | 'runs';
const RUN_STEPS = [{ label: 'Check policy, robots and rate limit', done: 'Policy, robots and rate limit OK' }, { label: 'Fetch snapshot', done: 'Snapshot stored' }, { label: 'Compare with the previous snapshot', done: 'Compared with the previous snapshot' }, { label: 'Extract observations', done: 'Observations extracted' }, { label: 'Verify evidence', done: 'Evidence verified' }];

function SourceDetail({ id }: { id: string }) {
  const go = useGo();
  const s = sourceById(id);
  const paused = useDs((x) => !!x.paused[id]);
  const [tab, setTab] = useState<Tab>(() => { const t = pendingSrcTab; pendingSrcTab = null; return t ?? 'overview'; });
  const [run, setRun] = useState<number | null>(null);
  const start = () => { if (!s || (s.blocked && s.health === 'blocked')) return; setRun(0); };
  useEffect(() => { if (pendingRun) { pendingRun = false; start(); } }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (run === null || !s) return;
    if (run >= RUN_STEPS.length) { useDs.getState().toast(`Check of ${s.name} finished: ${s.changes ? 'no new change since the last snapshot' : 'nothing changed'}`); const t = setTimeout(() => setRun(null), 600); return () => clearTimeout(t); }
    const t = setTimeout(() => setRun((r) => (r === null ? r : r + 1)), 650); return () => clearTimeout(t);
  }, [run, s]);
  useEffect(() => { if (s) useDs.getState().select({ kind: 'source', id: s.id }, false); }, [s]);
  const resolved = useDs((x) => x.resolved);
  if (!s) return <div className="dw-view"><Empty icon="data" title="Source not found" text="It may have been removed from the registry." action={<Button size="sm" onPress={() => go(dpath('sources'))}>Back to sources</Button>} /></div>;
  const obs = OBSERVATIONS.filter((o) => o.sourceId === s.id), chg = CHANGES.filter((c) => c.sourceId === s.id), runs = RUNS.filter((r) => s.usedBy.includes(r.missionId));
  const blockedHard = !!s.blocked && s.health === 'blocked';
  return (
    <div className="dw-view dw-view--flush">
      <div className="dw-sh">
        <button type="button" className="dw-back" onClick={() => go(dpath('sources'))}><Icon name="arrowLeft" size={12} />Sources</button>
        <div className="dw-sh-main">
          <h2>{s.name}</h2><Badge>{s.type}</Badge><AuthorityBadge a={s.authority} /><HealthBadge s={s} />{paused && <Badge tone="warning">Paused</Badge>}
          <span className="flex-1" />
          <Button size="sm" icon="play" isDisabled={run !== null || blockedHard} onPress={start}>Run now</Button>
          <Button size="sm" icon="clock" onPress={() => { useDs.getState().togglePause(s.id); useDs.getState().toast(`${s.name} ${paused ? 'resumed' : 'paused'}`); }}>{paused ? 'Resume' : 'Pause'}</Button>
          <Button size="sm" icon="layers" onPress={() => setTab('snapshots')}>View snapshots</Button>
          <Button size="sm" icon="lock" onPress={() => setTab('policy')}>Review policy</Button>
          <DetailMenu s={s} tab={setTab} run={start} />
        </div>
        <p className="dw-path"><span className="bw-mono">{s.url}</span></p>
        <div className="dw-sh-facts">
          <Kv k="Status" v={s.blocked ? BLOCK_LABEL[s.blocked] : 'Healthy'} /><Kv k="Last checked" v={s.snapshots === 0 ? '—' : ago(s.lastCheckedMin)} /><Kv k="Observed since" v={s.observedSince} /><Kv k="Snapshots" v={s.snapshots} /><Kv k="Changes" v={s.changes} /><Kv k="Used by" v={`${s.usedBy.length} mission${s.usedBy.length === 1 ? '' : 's'}`} />
        </div>
        <Tabs2<Tab> label="Source sections" value={tab} onChange={setTab} tabs={[{ id: 'overview', label: 'Overview' }, { id: 'snapshots', label: 'Snapshots', n: s.snapshots }, { id: 'observations', label: 'Observations', n: obs.length }, { id: 'changes', label: 'Changes', n: chg.length }, { id: 'policy', label: 'Policy' }, { id: 'runs', label: 'Runs', n: runs.length }]} />
      </div>
      <div className="dw-pad-v">
        {run !== null && <ProgressList title={`Checking ${s.name}`} items={RUN_STEPS} at={run} />}
        {tab === 'overview' && <Overview s={s} setTab={setTab} />}
        {tab === 'snapshots' && <Snapshots s={s} />}
        {tab === 'observations' && (obs.length === 0 ? <Empty icon="list" title="No observations found yet." text="Observations appear when a run extracts a claim from this source." /> : (
          <Grid label="Observations from this source" cols={[
            { key: 'c', label: 'Claim', w: 'minmax(160px,1.4fr)', render: (o) => <RecLink onOpen={() => go(dpath('observations', o.id))}>{o.subject} · {o.claim}</RecLink> }, { key: 'v', label: 'Value', w: 'minmax(120px,1fr)', render: (o) => o.value },
            { key: 'o', label: 'Observed', w: '100px', render: (o) => o.observedAt.slice(0, 10) }, { key: 'cf', label: 'Confidence', w: '104px', render: (o) => <ConfChip v={score(o.confidence)} needs /> }, { key: 'st', label: 'Status', w: '168px', render: (o) => <ObsStatusBadge o={o} resolved={resolved} /> }, { key: 't', label: '', w: '110px', render: (o) => <TraceBtn evidenceId={o.evidenceIds[0]} /> },
          ]} rows={obs} id={(o) => o.id} onRow={(o) => useDs.getState().select({ kind: 'observation', id: o.id })} />))}
        {tab === 'changes' && (chg.length === 0 ? <Empty icon="timeline" title="No changes found yet." text="Changes appear when a snapshot differs semantically from the previous one." /> : <div className="dw-grid">{chg.map((c) => <div key={c.id}><SemanticChange c={c} /><div className="dw-hyp-a" style={{ marginTop: 4 }}><Button size="sm" variant="ghost" onPress={() => go(dpath('changes', c.id))}>Review change</Button></div></div>)}</div>)}
        {tab === 'policy' && <Policy s={s} />}
        {tab === 'runs' && (runs.length === 0 ? <Empty icon="play" title="No runs yet." text="Runs that include this source are listed here." /> : (
          <Grid label="Runs that included this source" cols={[
            { key: 'i', label: 'Run', w: '110px', render: (r) => <RecLink onOpen={() => go(dpath('runs', r.id))}>#{r.id}</RecLink> }, { key: 'n', label: 'Mission', w: 'minmax(160px,1.4fr)', render: (r) => r.name },
            { key: 's', label: 'Started', w: '130px', render: (r) => r.started }, { key: 'd', label: 'Duration', w: '80px', right: true, render: (r) => `${Math.round(r.durationS / 60)} min` }, { key: 'e', label: 'Sources evaluated', w: '120px', right: true, render: (r) => <span className="bw-num">{r.evaluated}</span> },
          ]} rows={runs} id={(r) => r.id} onRow={(r) => useDs.getState().select({ kind: 'run', id: r.id })} />))}
      </div>
    </div>
  );
}
function DetailMenu({ s, tab, run }: { s: SourceDescriptor; tab: (t: Tab) => void; run: () => void }) {
  const items = useSourceActions(s, { tab, run });
  return <Menu title="More actions" items={items} trigger={<IconButton icon="more" label="More actions" size="sm" />} />;
}

function Overview({ s, setTab }: { s: SourceDescriptor; setTab: (t: Tab) => void }) {
  const go = useGo();
  const mirrors = SOURCES.filter((x) => x.originalOf === s.id);
  return (
    <>
      <div className="dw-cards">
        <div className="dw-card"><span className="dw-k">Type</span><b>{s.type}</b><small>{s.entityId ? 'Linked to an entity' : 'Not linked to a single entity'}</small>{s.entityId && <Button size="sm" variant="ghost" onPress={() => go(dpath('entities', s.entityId!))}>Open entity</Button>}</div>
        <div className="dw-card"><span className="dw-k">Authority</span><AuthorityBadge a={s.authority} /><small>{AUTH_LEGEND.find(([a]) => a === s.authority)?.[1]}</small></div>
        <div className="dw-card"><span className="dw-k">Health</span><HealthBadge s={s} /><small>{s.blocked ? BLOCK_NOTE[s.blocked] : 'Responding. Policy and robots respected on every check.'}</small></div>
        <div className="dw-card"><span className="dw-k">Used by</span><b>{s.usedBy.length} mission{s.usedBy.length === 1 ? '' : 's'}</b><small>{s.usedBy.map(missionName).join(' · ')}</small></div>
      </div>
      {mirrors.length > 0 && <p className="dw-note"><Icon name="info" size={12} />{mirrors.length} mirrors publish the same text. 1 original + {mirrors.length} mirrors = 1 independent evidence.</p>}
      {s.originalOf && <p className="dw-note"><Icon name="info" size={12} />This is a mirror of <RecLink onOpen={() => go(dpath('sources', s.originalOf!))}>{sourceById(s.originalOf)?.name ?? s.originalOf}</RecLink>. It does not count as independent evidence.</p>}
      <div className="dw-hyp-a"><Button size="sm" onPress={() => setTab('snapshots')}>Snapshots ({s.snapshots})</Button><Button size="sm" variant="ghost" onPress={() => setTab('policy')}>Policy and advanced settings</Button></div>
    </>
  );
}

function Snapshots({ s }: { s: SourceDescriptor }) {
  const snaps = useMemo(() => (s.snapshots === 0 ? [] : snapshotsOf(s.id)), [s]);
  const [a, setA] = useState(snaps[1]?.id ?? '');
  const [b, setB] = useState(snaps[0]?.id ?? '');
  const [shown, setShown] = useState(false);
  if (snaps.length === 0) return <Empty icon="layers" title="No snapshots yet." text={s.blocked ? `${BLOCK_LABEL[s.blocked]}: nothing was captured.` : 'The first check will store a snapshot.'} />;
  const idx = (x: string) => snaps.findIndex((n) => n.id === x);
  const A = snaps[idx(a)], B = snaps[idx(b)];
  const [older, newer] = A && B && idx(a) >= idx(b) ? [A, B] : [B, A];
  const diff = older && newer ? lineDiff(older.lines, newer.lines) : [];
  const adds = diff.filter((d) => d.t === 'add').length, dels = diff.filter((d) => d.t === 'del').length;
  const first = older && newer ? [...snaps].slice(idx(newer.id), idx(older.id)).reverse().find((n) => n.lines.join('\n') !== older.lines.join('\n')) : undefined;
  const opts = snaps.map((n) => ({ id: n.id, label: n.at }));
  return (
    <>
      <Section title="Snapshots" hint={`Showing the ${snaps.length} most recent of ${s.snapshots} retained (${s.policy.retentionDays}-day retention)`}>
        <div className="dw-table" role="table" aria-label="Snapshots">
          {snaps.map((n, i) => (
            <div key={n.id} className="ds-rec-snap" role="row"><b role="cell" className="bw-num">{n.at}</b><span role="cell" className="ds-rec-clip">{n.note ?? `${n.lines.length} lines · no semantic change`}</span>
              <span role="cell">{snaps[i + 1] ? <Button size="sm" variant="ghost" onPress={() => { setA(snaps[i + 1]!.id); setB(n.id); setShown(true); }}>Compare</Button> : <span className="dw-muted">Oldest</span>}</span></div>
          ))}
        </div>
      </Section>
      <Section title="Compare two snapshots" hint="A line diff proves when a change appeared">
        <div className="ds-rec-pick"><Select label="From" options={opts} value={a} onChange={setA} /><Select label="To" options={opts} value={b} onChange={setB} /><Button size="sm" variant="primary" icon="layers" onPress={() => setShown(true)}>Compare</Button></div>
        {shown && older && newer && (
          <>
            <p className="dw-muted" role="status">{adds + dels === 0 ? `No difference between ${older.at} and ${newer.at}.` : `${adds} line${adds === 1 ? '' : 's'} added, ${dels} removed between ${older.at} and ${newer.at}.${first ? ` The change first appears in the snapshot of ${first.at}.` : ''}`}</p>
            <div className="ds-ba">
              <div><h4>{older.at}</h4>{diff.filter((d) => d.t !== 'add').map((d, i) => <p key={i} className={d.t === 'del' ? 'is-del' : undefined}>{d.s}</p>)}</div>
              <div><h4>{newer.at}</h4>{diff.filter((d) => d.t !== 'del').map((d, i) => <p key={i} className={d.t === 'add' ? 'is-add' : undefined}>{d.s}</p>)}</div>
            </div>
          </>
        )}
      </Section>
    </>
  );
}

function Policy({ s }: { s: SourceDescriptor }) {
  const p = s.policy;
  return (
    <>
      <Section title="Policy" hint="Recorded per source; applies to every run">
        <div className="dw-facts">
          <Kv k="Access" v={p.access} /><Kv k="Robots" v={p.robots} /><Kv k="Rate limit" v={`Configured · ${p.rateLimit}`} /><Kv k="Retention" v={`${p.retentionDays} days`} /><Kv k="License" v={p.license} /><Kv k="Attribution" v={p.attribution} /><Kv k="Personal data" v={p.personalData} />
        </div>
      </Section>
      {s.blocked && (
        <div className="dw-card" style={{ alignItems: 'stretch', borderColor: 'var(--danger)' }}>
          <div className="dw-hyp-a"><Badge tone="danger" icon="lock">{BLOCK_LABEL[s.blocked]}</Badge></div>
          <p style={{ margin: 0 }}>{BLOCK_NOTE[s.blocked]}</p>
          <p className="dw-muted" style={{ margin: 0 }}>The BDE does not bypass authentication, robots.txt, rate limits or site terms. To use this source, change the access agreement with its publisher, then review the policy here.</p>
        </div>
      )}
      <Advanced s={s} />
    </>
  );
}

function Advanced({ s }: { s: SourceDescriptor }) {
  const locked = !!s.blocked && s.health === 'blocked';
  const host = s.url.replace(/^https?:\/\//, '').split('/')[0] ?? '';
  const [strategy, setStrategy] = useState('auto');
  const [render, setRender] = useState('auto');
  const [depth, setDepth] = useState<'1' | '2' | '3'>('1');
  const [domains, setDomains] = useState(host);
  const [paths, setPaths] = useState('allow: /pricing, /docs\ndeny: /account, /checkout');
  const [rate, setRate] = useState('5');
  return (
    <>
      <Section title="Advanced" actions={<Badge tone="neutral">Advanced</Badge>} hint="Technical controls for people who maintain this source. Defaults work for most pages.">
        <div className="ds-rec-adv">
          {locked && <p className="dw-note"><Icon name="lock" size={12} />Settings are read-only while the source is restricted. They cannot override the block.</p>}
          <div className="ds-rec-form">
            <Select label="Acquisition strategy" isDisabled={locked} options={['Auto', 'API', 'HTTP', 'Browser', 'Document'].map((l) => ({ id: l.toLowerCase(), label: l }))} value={strategy} onChange={setStrategy} />
            <Select label="Rendering" isDisabled={locked} options={['Auto', 'Static', 'Dynamic'].map((l) => ({ id: l.toLowerCase(), label: l }))} value={render} onChange={setRender} />
            <SegmentedControl label="Discovery depth" value={depth} onChange={setDepth} options={[{ id: '1', label: '1' }, { id: '2', label: '2' }, { id: '3', label: '3' }]} />
            <Select label="Rate limit" isDisabled={locked} options={[{ id: '10', label: '1 request / 10 s' }, { id: '5', label: '1 request / 5 s (policy default)' }, { id: '2', label: '1 request / 2 s (needs approval)' }]} value={rate} onChange={setRate} description="Never above the publisher's limit." />
            <TextField label="Allowed domains" isDisabled={locked} value={domains} onChange={setDomains} mono />
          </div>
          <TextField label="Path rules (CSS selector and XPath are available in the extractor below)" isDisabled={locked} value={paths} onChange={setPaths} mono />
          <div className="dw-hyp-a"><Button size="sm" isDisabled={locked || rate === '2'} onPress={() => useDs.getState().toast('Advanced settings saved for the next run')}>Save settings</Button>{rate === '2' && <span className="dw-muted">This rate needs a policy approval first.</span>}</div>
        </div>
      </Section>
      <Extractor s={s} locked={locked} />
      <Section title="Extraction schema · Product Intelligence" hint="One structure for many different sites">
        <div className="dw-table" role="table" aria-label="Product Intelligence schema">
          {PRODUCT_SCHEMA.map(([f, t, d]) => <div key={f} className="dw-tr" role="row" style={{ gridTemplateColumns: '150px 80px minmax(0,1fr)' }}><b className="bw-mono" role="cell">{f}</b><span className="dw-muted" role="cell">{t}</span><span role="cell">{d}</span></div>)}
        </div>
        <p className="dw-muted">The schema normalizes pages that look nothing alike (a pricing table, a docs page, a PDF) into the same fields, so entities can be compared and enriched without per-site logic downstream.</p>
      </Section>
    </>
  );
}

function Extractor({ s, locked }: { s: SourceDescriptor; locked: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('Product Page Extractor');
  const [ai, setAi] = useState(false);
  const [preview, setPreview] = useState<null | ReturnType<typeof previewExtract>>(null);
  const lines = useMemo(() => (s.snapshots ? snapshotsOf(s.id)[0]?.lines ?? [] : []), [s]);
  const product = (s.entityId && entityById(s.entityId)?.name) || s.name;
  return (
    <Section title="Custom extractor" hint="Turn a page layout into the Product Intelligence schema" actions={!open && <Button size="sm" icon="plus" isDisabled={locked} onPress={() => setOpen(true)}>Create Extraction Template</Button>}>
      {!open ? <p className="dw-muted">No custom template. The built-in extractor reads this source today.</p> : (
        <div className="ds-rec-ex">
          <div className="ds-rec-form"><TextField label="Template name" value={name} onChange={(v) => { setName(v); setPreview(null); }} /><Switch isSelected={ai} onChange={(v) => { setAi(v); setPreview(null); }}>AI-assisted (otherwise rule-based)</Switch></div>
          <ul className="dw-rels" aria-label="Fields to extract">
            {EXTRACT_FIELDS.map((f) => <li key={f}><div className="dw-rel"><b>{f}</b><span className="dw-muted">{ai ? 'Located by AI from the page text; you review the result' : `CSS selector / XPath rule · ${f === 'Features' ? 'list' : 'text'}`}</span></div></li>)}
          </ul>
          <div className="dw-hyp-a"><Button size="sm" icon="eye" isDisabled={lines.length === 0} onPress={() => setPreview(previewExtract(lines))}>Preview on latest snapshot</Button>{lines.length === 0 && <span className="dw-muted">No snapshot to preview yet.</span>}</div>
          {preview && (
            <>
              {preview.rows.length === 0 ? <p className="dw-note"><Icon name="warning" size={12} />The template found no plan rows in the latest snapshot. Nothing was invented; adjust the rules or pick another page.</p> : (
                <div className="dw-table" role="table" aria-label="Extraction preview">
                  <div className="dw-tr dw-tr--head" role="row" style={{ gridTemplateColumns: '140px 110px 150px minmax(0,1fr) 110px' }}>{EXTRACT_FIELDS.map((f) => <span key={f} role="columnheader">{f}</span>)}</div>
                  {preview.rows.map((r) => <div key={r.plan} className="dw-tr" role="row" style={{ gridTemplateColumns: '140px 110px 150px minmax(0,1fr) 110px' }}><span role="cell">{product}</span><b role="cell">{r.plan}</b><span role="cell">{r.price}</span><span className="ds-rec-clip" role="cell">{r.features}</span><span role="cell">{r.availability}</span></div>)}
                </div>
              )}
              {ai && <p className="ds-ai" style={{ margin: 0 }}><b>AI interpretation</b>The AI grouped the lines into fields. Compare them with the snapshot before saving; the page text is the evidence.</p>}
              <div className="dw-hyp-a"><Button size="sm" variant="primary" isDisabled={preview.rows.length === 0} onPress={() => { useDs.getState().toast(`${name} saved as a draft template. It runs on the next check; results need review.`); setOpen(false); setPreview(null); }}>Save template</Button><Button size="sm" variant="ghost" onPress={() => { setOpen(false); setPreview(null); }}>Cancel</Button></div>
            </>
          )}
        </div>
      )}
    </Section>
  );
}
