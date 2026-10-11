import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, IconButton, Icon, Menu, Select, SegmentedControl, Switch, TextField, type MenuEntry } from '@biweb/ui';
import { BLOCK_LABEL_ID, BLOCK_NOTE_ID, CHANGES, MISSIONS, OBSERVATIONS, RUNS, SOURCES, score, snapshotsOf } from '../data/seed';
import { ago, entityById, sourceById } from '../data/derive';
import { EXTRACT_FIELDS, PRODUCT_SCHEMA, lineDiff, previewExtract } from '../data/records';
import type { Authority, SourceDescriptor, SourceType } from '../data/types';
import { useT } from '../../i18n/intl';
import type { MessageId } from '../../i18n/catalog';
import { useDs } from '../store';
import { AuthorityBadge, Chip, ConfChip, Empty, Grid, HealthBadge, Kv, ProgressList, Search, Section, SemanticChange, Tabs2, TraceBtn, ViewHead, dpath, useGo, type Col } from '../ui';
import { RecLink } from './EntityActions';
import { ObsStatusBadge } from './Observations';
import './records.css';

const AUTH_LEGEND: [Authority, MessageId][] = [['PRIMARY', 'discovery.sources.auth.primary'], ['SECONDARY', 'discovery.sources.auth.secondary'], ['REFERENCE', 'discovery.sources.auth.reference'], ['DISCOVERY', 'discovery.sources.auth.discovery']];
const TYPE_LABEL: Record<SourceType, MessageId> = {
  'Official Website': 'discovery.sources.type.officialWebsite', Documentation: 'discovery.sources.type.documentation', 'Pricing Page': 'discovery.sources.type.pricingPage', 'Open Data': 'discovery.sources.type.openData', Government: 'discovery.sources.type.government',
  News: 'discovery.sources.type.news', RSS: 'discovery.sources.type.rss', 'Public API': 'discovery.sources.type.publicApi', Repository: 'discovery.sources.type.repository', Document: 'discovery.sources.type.document', 'Public Database': 'discovery.sources.type.publicDatabase',
};
const HEALTH_LABEL: Record<SourceDescriptor['health'] | 'all', MessageId> = { all: 'discovery.sources.health.any', healthy: 'discovery.sources.health.healthy', degraded: 'discovery.sources.health.degraded', blocked: 'discovery.sources.health.blocked' };
export const ACQ_OPTS: { id: string; label: MessageId }[] = [{ id: 'auto', label: 'discovery.sources.opt.auto' }, { id: 'api', label: 'discovery.sources.opt.api' }, { id: 'http', label: 'discovery.sources.opt.http' }, { id: 'browser', label: 'discovery.sources.opt.browser' }, { id: 'document', label: 'discovery.sources.opt.document' }];
export const RENDER_OPTS: { id: string; label: MessageId }[] = [{ id: 'auto', label: 'discovery.sources.opt.auto' }, { id: 'static', label: 'discovery.sources.opt.static' }, { id: 'dynamic', label: 'discovery.sources.opt.dynamic' }];
const TYPES = [...new Set(SOURCES.map((s) => s.type))].sort() as SourceType[];
const missionName = (id: string) => useDs.getState().missions.find((m) => m.id === id)?.name ?? MISSIONS.find((m) => m.id === id)?.name ?? id;
interface Row { s: SourceDescriptor; mirror?: boolean; mirrors?: number }

export function SourcesView({ id }: { id?: string }) { return id ? <SourceDetail id={id} /> : <Registry />; }

function useSourceActions(s: SourceDescriptor, hooks?: { tab?: (t: Tab) => void; run?: () => void }) {
  const t = useT();
  const go = useGo();
  const paused = useDs((x) => x.paused[s.id]);
  const open = (t: Tab) => (hooks?.tab ? hooks.tab(t) : (pendingSrcTab = t, go(dpath('sources', s.id))));
  return [
    { id: 'open', label: t('discovery.sources.action.open'), icon: 'data', onAction: () => go(dpath('sources', s.id)) },
    { id: 'run', label: t('discovery.sources.action.run'), icon: 'play', ...(s.blocked && s.health === 'blocked' ? { disabledReason: t('discovery.sources.action.runBlocked', { reason: t(BLOCK_LABEL_ID[s.blocked]) }) } : {}), onAction: () => (hooks?.run ? hooks.run() : (pendingRun = true, go(dpath('sources', s.id)))) },
    { id: 'pause', label: paused ? t('discovery.sources.action.resume') : t('discovery.sources.action.pause'), icon: 'clock', onAction: () => { useDs.getState().togglePause(s.id); useDs.getState().toast(paused ? t('discovery.sources.toast.resumed', { name: s.name }) : t('discovery.sources.toast.paused', { name: s.name })); } },
    { id: 'snap', label: t('discovery.sources.action.snapshots'), icon: 'layers', onAction: () => open('snapshots') },
    { id: 'pol', label: t('discovery.sources.action.policy'), icon: 'lock', onAction: () => open('policy') },
  ] as MenuEntry[];
}
let pendingSrcTab: Tab | null = null, pendingRun = false;
function SourceMenu({ s }: { s: SourceDescriptor }) {
  const t = useT();
  const items = useSourceActions(s);
  const label = t('discovery.sources.action.menu', { name: s.name });
  return <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}><Menu title={label} items={items} trigger={<IconButton icon="more" label={label} size="sm" />} /></span>;
}

function Registry() {
  const t = useT();
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
    { key: 'n', label: t('discovery.nav.sources'), w: 'minmax(220px,2fr)', render: ({ s, mirror, mirrors }) => (
      <span className={`ds-rec-two${mirror ? ' ds-rec-mirror' : ''}`}>
        <RecLink onOpen={() => go(dpath('sources', s.id))}>{mirror && <Icon name="arrowRight" size={12} />}{s.name}{paused[s.id] && <Badge tone="warning">{t('discovery.sources.paused')}</Badge>}</RecLink>
        {mirrors ? <button type="button" className="ds-rec-link" style={{ font: '400 10px var(--font-sans)', color: 'var(--text-muted)' }} aria-expanded={!!open[s.id]} onClick={(e) => { e.stopPropagation(); setOpen((o) => ({ ...o, [s.id]: !o[s.id] })); }} onKeyDown={(e) => e.stopPropagation()}>{open[s.id] ? t('discovery.sources.mirrors.hide', { count: mirrors }) : t('discovery.sources.mirrors.show', { count: mirrors })}</button> : <small>{mirror ? t('discovery.sources.mirrorOf', { name: sourceById(s.originalOf ?? '')?.name }) : s.url}</small>}
      </span>) },
    { key: 't', label: t('discovery.sources.col.type'), w: '110px', render: ({ s }) => t(TYPE_LABEL[s.type]) },
    { key: 'a', label: t('discovery.sources.col.authority'), w: '96px', render: ({ s }) => <AuthorityBadge a={s.authority} /> },
    { key: 'l', label: t('discovery.sources.col.lastChecked'), w: '92px', render: ({ s }) => (s.snapshots === 0 ? '—' : ago(s.lastCheckedMin)) },
    { key: 'c', label: t('discovery.nav.changes'), w: '64px', right: true, render: ({ s }) => <span className="bw-num">{s.changes}</span> },
    { key: 'h', label: t('discovery.sources.col.health'), w: '170px', render: ({ s }) => <HealthBadge s={s} /> },
    { key: 'p', label: t('discovery.sources.col.policy'), w: '120px', render: ({ s }) => <span className="ds-rec-clip" title={t('discovery.sources.policyTitle', { access: s.policy.access, robots: s.policy.robots.toLowerCase(), rate: s.policy.rateLimit })}>{t('discovery.sources.policyCell', { access: s.policy.access })}</span> },
    { key: 'u', label: t('discovery.sources.col.usedBy'), w: '74px', right: true, render: ({ s }) => <span className="bw-num">{t('discovery.sources.missions', { count: s.usedBy.length })}</span> },
    { key: 'm', label: '', w: '32px', render: ({ s }) => <SourceMenu s={s} /> },
  ];
  return (
    <div className="dw-view">
      <ViewHead title={t('discovery.sources.title')} sub={t('discovery.sources.sub', { total: SOURCES.length, blocked })} />
      <div className="ds-rec-legend" aria-label={t('discovery.sources.legend.label')}><b>{t('discovery.sources.col.authority')}</b>{AUTH_LEGEND.map(([a, m]) => <span key={a}><AuthorityBadge a={a} />{t(m)}</span>)}</div>
      <div className="ds-rec-tool">
        <span className="dw-chips" role="group" aria-label={t('discovery.sources.col.authority')}>
          <Chip on={auth === 'all'} onClick={() => setAuth('all')}>{t('discovery.sources.allAuthorities')}</Chip>
          {AUTH_LEGEND.map(([a]) => <Chip key={a} on={auth === a} onClick={() => setAuth(a)}>{a}</Chip>)}
        </span>
        <span className="dw-chips" role="group" aria-label={t('discovery.sources.col.health')}>
          {(['all', 'healthy', 'degraded', 'blocked'] as const).map((h) => <Chip key={h} on={health === h} onClick={() => setHealth(h)}>{t(HEALTH_LABEL[h])}</Chip>)}
        </span>
        <Select label={t('discovery.sources.col.type')} hideLabel options={[{ id: 'all', label: t('discovery.sources.allTypes') }, ...TYPES.map((ty) => ({ id: ty, label: t(TYPE_LABEL[ty]) }))]} value={type} onChange={(v) => setType(v as SourceType | 'all')} />
        <span className="flex-1" />
        <Search value={q} onChange={setQ} placeholder={t('discovery.sources.search')} label={t('discovery.sources.search')} w={220} />
      </div>
      <Grid label={t('discovery.sources.gridLabel')} cols={cols} rows={rows} id={(r) => r.s.id} selected={sel?.kind === 'source' ? sel.id : null} onRow={({ s }) => useDs.getState().select({ kind: 'source', id: s.id })} max={560} empty={<p className="dw-more">{t('discovery.sources.empty')}</p>} />
      <p className="dw-note"><Icon name="lock" size={12} />{t('discovery.sources.note')}</p>
    </div>
  );
}

type Tab = 'overview' | 'snapshots' | 'observations' | 'changes' | 'policy' | 'runs';
const RUN_STEPS: { label: MessageId; done: MessageId }[] = [{ label: 'discovery.sources.step.policy', done: 'discovery.sources.step.policyDone' }, { label: 'discovery.sources.step.fetch', done: 'discovery.sources.step.fetchDone' }, { label: 'discovery.sources.step.compare', done: 'discovery.sources.step.compareDone' }, { label: 'discovery.sources.step.extract', done: 'discovery.sources.step.extractDone' }, { label: 'discovery.sources.step.verify', done: 'discovery.sources.step.verifyDone' }];

function SourceDetail({ id }: { id: string }) {
  const t = useT();
  const go = useGo();
  const s = sourceById(id);
  const paused = useDs((x) => !!x.paused[id]);
  const [tab, setTab] = useState<Tab>(() => { const p = pendingSrcTab; pendingSrcTab = null; return p ?? 'overview'; });
  const [run, setRun] = useState<number | null>(null);
  const start = () => { if (!s || (s.blocked && s.health === 'blocked')) return; setRun(0); };
  useEffect(() => { if (pendingRun) { pendingRun = false; start(); } }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (run === null || !s) return;
    if (run >= RUN_STEPS.length) { useDs.getState().toast(t(s.changes ? 'discovery.sources.checkDoneChanges' : 'discovery.sources.checkDoneNone', { name: s.name })); const h = setTimeout(() => setRun(null), 600); return () => clearTimeout(h); }
    const h = setTimeout(() => setRun((r) => (r === null ? r : r + 1)), 650); return () => clearTimeout(h);
  }, [run, s, t]);
  useEffect(() => { if (s) useDs.getState().select({ kind: 'source', id: s.id }, false); }, [s]);
  const resolved = useDs((x) => x.resolved);
  if (!s) return <div className="dw-view"><Empty icon="data" title={t('discovery.sources.notFound.title')} text={t('discovery.sources.notFound.text')} action={<Button size="sm" onPress={() => go(dpath('sources'))}>{t('discovery.sources.notFound.back')}</Button>} /></div>;
  const obs = OBSERVATIONS.filter((o) => o.sourceId === s.id), chg = CHANGES.filter((c) => c.sourceId === s.id), runs = RUNS.filter((r) => s.usedBy.includes(r.missionId));
  const blockedHard = !!s.blocked && s.health === 'blocked';
  return (
    <div className="dw-view dw-view--flush">
      <div className="dw-sh">
        <button type="button" className="dw-back" onClick={() => go(dpath('sources'))}><Icon name="arrowLeft" size={12} />{t('discovery.nav.sources')}</button>
        <div className="dw-sh-main">
          <h2>{s.name}</h2><Badge>{t(TYPE_LABEL[s.type])}</Badge><AuthorityBadge a={s.authority} /><HealthBadge s={s} />{paused && <Badge tone="warning">{t('discovery.sources.paused')}</Badge>}
          <span className="flex-1" />
          <Button size="sm" icon="play" isDisabled={run !== null || blockedHard} onPress={start}>{t('discovery.sources.action.run')}</Button>
          <Button size="sm" icon="clock" onPress={() => { useDs.getState().togglePause(s.id); useDs.getState().toast(paused ? t('discovery.sources.toast.resumed', { name: s.name }) : t('discovery.sources.toast.paused', { name: s.name })); }}>{paused ? t('discovery.sources.action.resume') : t('discovery.sources.action.pause')}</Button>
          <Button size="sm" icon="layers" onPress={() => setTab('snapshots')}>{t('discovery.sources.action.snapshots')}</Button>
          <Button size="sm" icon="lock" onPress={() => setTab('policy')}>{t('discovery.sources.action.policy')}</Button>
          <DetailMenu s={s} tab={setTab} run={start} />
        </div>
        <p className="dw-path"><span className="bw-mono">{s.url}</span></p>
        <div className="dw-sh-facts">
          <Kv k={t('discovery.sources.fact.status')} v={s.blocked ? t(BLOCK_LABEL_ID[s.blocked]) : t('discovery.sources.health.healthy')} /><Kv k={t('discovery.sources.col.lastChecked')} v={s.snapshots === 0 ? '—' : ago(s.lastCheckedMin)} /><Kv k={t('discovery.sources.fact.since')} v={s.observedSince} /><Kv k={t('discovery.sources.tab.snapshots')} v={s.snapshots} /><Kv k={t('discovery.nav.changes')} v={s.changes} /><Kv k={t('discovery.sources.col.usedBy')} v={t('discovery.sources.missions', { count: s.usedBy.length })} />
        </div>
        <Tabs2<Tab> label={t('discovery.sources.tabs')} value={tab} onChange={setTab} tabs={[{ id: 'overview', label: t('discovery.sources.tab.overview') }, { id: 'snapshots', label: t('discovery.sources.tab.snapshots'), n: s.snapshots }, { id: 'observations', label: t('discovery.nav.observations'), n: obs.length }, { id: 'changes', label: t('discovery.nav.changes'), n: chg.length }, { id: 'policy', label: t('discovery.sources.tab.policy') }, { id: 'runs', label: t('discovery.nav.runs'), n: runs.length }]} />
      </div>
      <div className="dw-pad-v">
        {run !== null && <ProgressList title={t('discovery.sources.checking', { name: s.name })} items={RUN_STEPS.map((x) => ({ label: t(x.label), done: t(x.done) }))} at={run} />}
        {tab === 'overview' && <Overview s={s} setTab={setTab} />}
        {tab === 'snapshots' && <Snapshots s={s} />}
        {tab === 'observations' && (obs.length === 0 ? <Empty icon="list" title={t('discovery.sources.obs.emptyTitle')} text={t('discovery.sources.obs.emptyText')} /> : (
          <Grid label={t('discovery.sources.obs.grid')} cols={[
            { key: 'c', label: t('discovery.sources.obs.claim'), w: 'minmax(160px,1.4fr)', render: (o) => <RecLink onOpen={() => go(dpath('observations', o.id))}>{o.subject} · {o.claim}</RecLink> }, { key: 'v', label: t('discovery.sources.obs.value'), w: 'minmax(120px,1fr)', render: (o) => o.value },
            { key: 'o', label: t('discovery.sources.obs.observed'), w: '100px', render: (o) => o.observedAt.slice(0, 10) }, { key: 'cf', label: t('discovery.sources.obs.confidence'), w: '104px', render: (o) => <ConfChip v={score(o.confidence)} needs /> }, { key: 'st', label: t('discovery.sources.obs.status'), w: '168px', render: (o) => <ObsStatusBadge o={o} resolved={resolved} /> }, { key: 't', label: '', w: '110px', render: (o) => <TraceBtn evidenceId={o.evidenceIds[0]} /> },
          ]} rows={obs} id={(o) => o.id} onRow={(o) => useDs.getState().select({ kind: 'observation', id: o.id })} />))}
        {tab === 'changes' && (chg.length === 0 ? <Empty icon="timeline" title={t('discovery.sources.chg.emptyTitle')} text={t('discovery.sources.chg.emptyText')} /> : <div className="dw-grid">{chg.map((c) => <div key={c.id}><SemanticChange c={c} /><div className="dw-hyp-a" style={{ marginTop: 4 }}><Button size="sm" variant="ghost" onPress={() => go(dpath('changes', c.id))}>{t('discovery.sources.chg.review')}</Button></div></div>)}</div>)}
        {tab === 'policy' && <Policy s={s} />}
        {tab === 'runs' && (runs.length === 0 ? <Empty icon="play" title={t('discovery.sources.runs.emptyTitle')} text={t('discovery.sources.runs.emptyText')} /> : (
          <Grid label={t('discovery.sources.runs.grid')} cols={[
            { key: 'i', label: t('discovery.sources.runs.run'), w: '110px', render: (r) => <RecLink onOpen={() => go(dpath('runs', r.id))}>#{r.id}</RecLink> }, { key: 'n', label: t('discovery.sources.runs.mission'), w: 'minmax(160px,1.4fr)', render: (r) => r.name },
            { key: 's', label: t('discovery.sources.runs.started'), w: '130px', render: (r) => r.started }, { key: 'd', label: t('discovery.sources.runs.duration'), w: '80px', right: true, render: (r) => t('discovery.sources.runs.minutes', { n: Math.round(r.durationS / 60) }) }, { key: 'e', label: t('discovery.sources.runs.evaluated'), w: '120px', right: true, render: (r) => <span className="bw-num">{r.evaluated}</span> },
          ]} rows={runs} id={(r) => r.id} onRow={(r) => useDs.getState().select({ kind: 'run', id: r.id })} />))}
      </div>
    </div>
  );
}
function DetailMenu({ s, tab, run }: { s: SourceDescriptor; tab: (t: Tab) => void; run: () => void }) {
  const t = useT();
  const items = useSourceActions(s, { tab, run });
  return <Menu title={t('discovery.sources.action.more')} items={items} trigger={<IconButton icon="more" label={t('discovery.sources.action.more')} size="sm" />} />;
}

function Overview({ s, setTab }: { s: SourceDescriptor; setTab: (t: Tab) => void }) {
  const t = useT();
  const go = useGo();
  const mirrors = SOURCES.filter((x) => x.originalOf === s.id);
  return (
    <>
      <div className="dw-cards">
        <div className="dw-card"><span className="dw-k">{t('discovery.sources.col.type')}</span><b>{t(TYPE_LABEL[s.type])}</b><small>{t(s.entityId ? 'discovery.sources.ov.linked' : 'discovery.sources.ov.notLinked')}</small>{s.entityId && <Button size="sm" variant="ghost" onPress={() => go(dpath('entities', s.entityId!))}>{t('discovery.sources.ov.openEntity')}</Button>}</div>
        <div className="dw-card"><span className="dw-k">{t('discovery.sources.col.authority')}</span><AuthorityBadge a={s.authority} /><small>{(() => { const m = AUTH_LEGEND.find(([a]) => a === s.authority)?.[1]; return m ? t(m) : null; })()}</small></div>
        <div className="dw-card"><span className="dw-k">{t('discovery.sources.col.health')}</span><HealthBadge s={s} /><small>{s.blocked ? t(BLOCK_NOTE_ID[s.blocked]) : t('discovery.sources.ov.healthyNote')}</small></div>
        <div className="dw-card"><span className="dw-k">{t('discovery.sources.col.usedBy')}</span><b>{t('discovery.sources.missions', { count: s.usedBy.length })}</b><small>{s.usedBy.map(missionName).join(' · ')}</small></div>
      </div>
      {mirrors.length > 0 && <p className="dw-note"><Icon name="info" size={12} />{t('discovery.sources.ov.mirrorsNote', { count: mirrors.length })}</p>}
      {s.originalOf && <p className="dw-note"><Icon name="info" size={12} />{t('discovery.sources.ov.isMirrorPre')} <RecLink onOpen={() => go(dpath('sources', s.originalOf!))}>{sourceById(s.originalOf)?.name ?? s.originalOf}</RecLink>. {t('discovery.sources.ov.isMirrorPost')}</p>}
      <div className="dw-hyp-a"><Button size="sm" onPress={() => setTab('snapshots')}>{t('discovery.sources.ov.snapshotsBtn', { n: s.snapshots })}</Button><Button size="sm" variant="ghost" onPress={() => setTab('policy')}>{t('discovery.sources.ov.policyBtn')}</Button></div>
    </>
  );
}

function Snapshots({ s }: { s: SourceDescriptor }) {
  const t = useT();
  const snaps = useMemo(() => (s.snapshots === 0 ? [] : snapshotsOf(s.id)), [s]);
  const [a, setA] = useState(snaps[1]?.id ?? '');
  const [b, setB] = useState(snaps[0]?.id ?? '');
  const [shown, setShown] = useState(false);
  if (snaps.length === 0) return <Empty icon="layers" title={t('discovery.sources.snap.emptyTitle')} text={s.blocked ? t('discovery.sources.snap.emptyBlocked', { reason: t(BLOCK_LABEL_ID[s.blocked]) }) : t('discovery.sources.snap.emptyFirst')} />;
  const idx = (x: string) => snaps.findIndex((n) => n.id === x);
  const A = snaps[idx(a)], B = snaps[idx(b)];
  const [older, newer] = A && B && idx(a) >= idx(b) ? [A, B] : [B, A];
  const diff = older && newer ? lineDiff(older.lines, newer.lines) : [];
  const adds = diff.filter((d) => d.t === 'add').length, dels = diff.filter((d) => d.t === 'del').length;
  const first = older && newer ? [...snaps].slice(idx(newer.id), idx(older.id)).reverse().find((n) => n.lines.join('\n') !== older.lines.join('\n')) : undefined;
  const opts = snaps.map((n) => ({ id: n.id, label: n.at }));
  return (
    <>
      <Section title={t('discovery.sources.tab.snapshots')} hint={t('discovery.sources.snap.hint', { shown: snaps.length, total: s.snapshots, days: s.policy.retentionDays })}>
        <div className="dw-table" role="table" aria-label={t('discovery.sources.tab.snapshots')}>
          {snaps.map((n, i) => (
            <div key={n.id} className="ds-rec-snap" role="row"><b role="cell" className="bw-num">{n.at}</b><span role="cell" className="ds-rec-clip">{n.note ?? t('discovery.sources.snap.noChange', { n: n.lines.length })}</span>
              <span role="cell">{snaps[i + 1] ? <Button size="sm" variant="ghost" onPress={() => { setA(snaps[i + 1]!.id); setB(n.id); setShown(true); }}>{t('discovery.sources.snap.compare')}</Button> : <span className="dw-muted">{t('discovery.sources.snap.oldest')}</span>}</span></div>
          ))}
        </div>
      </Section>
      <Section title={t('discovery.sources.snap.compareTitle')} hint={t('discovery.sources.snap.compareHint')}>
        <div className="ds-rec-pick"><Select label={t('discovery.sources.snap.from')} options={opts} value={a} onChange={setA} /><Select label={t('discovery.sources.snap.to')} options={opts} value={b} onChange={setB} /><Button size="sm" variant="primary" icon="layers" onPress={() => setShown(true)}>{t('discovery.sources.snap.compare')}</Button></div>
        {shown && older && newer && (
          <>
            <p className="dw-muted" role="status">{adds + dels === 0 ? t('discovery.sources.snap.noDiff', { a: older.at, b: newer.at }) : first ? t('discovery.sources.snap.diffFirst', { adds, dels, a: older.at, b: newer.at, first: first.at }) : t('discovery.sources.snap.diff', { adds, dels, a: older.at, b: newer.at })}</p>
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
  const t = useT();
  const p = s.policy;
  return (
    <>
      <Section title={t('discovery.sources.tab.policy')} hint={t('discovery.sources.pol.hint')}>
        <div className="dw-facts">
          <Kv k={t('discovery.sources.policy.access')} v={p.access} /><Kv k={t('discovery.sources.policy.robots')} v={p.robots} /><Kv k={t('discovery.sources.policy.rateLimit')} v={t('discovery.sources.pol.configured', { rate: p.rateLimit })} /><Kv k={t('discovery.sources.policy.retention')} v={t('discovery.sources.pol.days', { n: p.retentionDays })} /><Kv k={t('discovery.sources.policy.license')} v={p.license} /><Kv k={t('discovery.sources.policy.attribution')} v={p.attribution} /><Kv k={t('discovery.sources.policy.personalData')} v={p.personalData} />
        </div>
      </Section>
      {s.blocked && (
        <div className="dw-card" style={{ alignItems: 'stretch', borderColor: 'var(--danger)' }}>
          <div className="dw-hyp-a"><Badge tone="danger" icon="lock">{t(BLOCK_LABEL_ID[s.blocked])}</Badge></div>
          <p style={{ margin: 0 }}>{t(BLOCK_NOTE_ID[s.blocked])}</p>
          <p className="dw-muted" style={{ margin: 0 }}>{t('discovery.sources.pol.blockedHelp')}</p>
        </div>
      )}
      <Advanced s={s} />
    </>
  );
}

function Advanced({ s }: { s: SourceDescriptor }) {
  const t = useT();
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
      <Section title={t('discovery.sources.adv.title')} actions={<Badge tone="neutral">{t('discovery.sources.adv.title')}</Badge>} hint={t('discovery.sources.adv.hint')}>
        <div className="ds-rec-adv">
          {locked && <p className="dw-note"><Icon name="lock" size={12} />{t('discovery.sources.adv.locked')}</p>}
          <div className="ds-rec-form">
            <Select label={t('discovery.sources.adv.strategy')} isDisabled={locked} options={ACQ_OPTS.map((o) => ({ id: o.id, label: t(o.label) }))} value={strategy} onChange={setStrategy} />
            <Select label={t('discovery.sources.adv.rendering')} isDisabled={locked} options={RENDER_OPTS.map((o) => ({ id: o.id, label: t(o.label) }))} value={render} onChange={setRender} />
            <SegmentedControl label={t('discovery.sources.adv.depth')} value={depth} onChange={setDepth} options={[{ id: '1', label: '1' }, { id: '2', label: '2' }, { id: '3', label: '3' }]} />
            <Select label={t('discovery.sources.policy.rateLimit')} isDisabled={locked} options={[{ id: '10', label: t('discovery.sources.adv.rate10') }, { id: '5', label: t('discovery.sources.adv.rate5') }, { id: '2', label: t('discovery.sources.adv.rate2') }]} value={rate} onChange={setRate} description={t('discovery.sources.adv.rateHelp')} />
            <TextField label={t('discovery.sources.adv.domains')} isDisabled={locked} value={domains} onChange={setDomains} mono />
          </div>
          <TextField label={t('discovery.sources.adv.paths')} isDisabled={locked} value={paths} onChange={setPaths} mono />
          <div className="dw-hyp-a"><Button size="sm" isDisabled={locked || rate === '2'} onPress={() => useDs.getState().toast(t('discovery.sources.adv.saved'))}>{t('discovery.sources.adv.save')}</Button>{rate === '2' && <span className="dw-muted">{t('discovery.sources.adv.needsApproval')}</span>}</div>
        </div>
      </Section>
      <Extractor s={s} locked={locked} />
      <Section title={t('discovery.sources.schema.title')} hint={t('discovery.sources.schema.hint')}>
        <div className="dw-table" role="table" aria-label={t('discovery.sources.schema.title')}>
          {PRODUCT_SCHEMA.map(([f, t, d]) => <div key={f} className="dw-tr" role="row" style={{ gridTemplateColumns: '150px 80px minmax(0,1fr)' }}><b className="bw-mono" role="cell">{f}</b><span className="dw-muted" role="cell">{t}</span><span role="cell">{d}</span></div>)}
        </div>
        <p className="dw-muted">{t('discovery.sources.schema.note')}</p>
      </Section>
    </>
  );
}

function Extractor({ s, locked }: { s: SourceDescriptor; locked: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('Product Page Extractor');
  const [ai, setAi] = useState(false);
  const [preview, setPreview] = useState<null | ReturnType<typeof previewExtract>>(null);
  const lines = useMemo(() => (s.snapshots ? snapshotsOf(s.id)[0]?.lines ?? [] : []), [s]);
  const product = (s.entityId && entityById(s.entityId)?.name) || s.name;
  return (
    <Section title={t('discovery.sources.ex.title')} hint={t('discovery.sources.ex.hint')} actions={!open && <Button size="sm" icon="plus" isDisabled={locked} onPress={() => setOpen(true)}>{t('discovery.sources.ex.create')}</Button>}>
      {!open ? <p className="dw-muted">{t('discovery.sources.ex.none')}</p> : (
        <div className="ds-rec-ex">
          <div className="ds-rec-form"><TextField label={t('discovery.sources.ex.name')} value={name} onChange={(v) => { setName(v); setPreview(null); }} /><Switch isSelected={ai} onChange={(v) => { setAi(v); setPreview(null); }}>{t('discovery.sources.ex.ai')}</Switch></div>
          <ul className="dw-rels" aria-label={t('discovery.sources.ex.fields')}>
            {EXTRACT_FIELDS.map((f) => <li key={f}><div className="dw-rel"><b>{f}</b><span className="dw-muted">{ai ? t('discovery.sources.ex.byAi') : t(f === 'Features' ? 'discovery.sources.ex.ruleList' : 'discovery.sources.ex.ruleText')}</span></div></li>)}
          </ul>
          <div className="dw-hyp-a"><Button size="sm" icon="eye" isDisabled={lines.length === 0} onPress={() => setPreview(previewExtract(lines))}>{t('discovery.sources.ex.preview')}</Button>{lines.length === 0 && <span className="dw-muted">{t('discovery.sources.ex.noSnapshot')}</span>}</div>
          {preview && (
            <>
              {preview.rows.length === 0 ? <p className="dw-note"><Icon name="warning" size={12} />{t('discovery.sources.ex.noRows')}</p> : (
                <div className="dw-table" role="table" aria-label={t('discovery.sources.ex.previewLabel')}>
                  <div className="dw-tr dw-tr--head" role="row" style={{ gridTemplateColumns: '140px 110px 150px minmax(0,1fr) 110px' }}>{EXTRACT_FIELDS.map((f) => <span key={f} role="columnheader">{f}</span>)}</div>
                  {preview.rows.map((r) => <div key={r.plan} className="dw-tr" role="row" style={{ gridTemplateColumns: '140px 110px 150px minmax(0,1fr) 110px' }}><span role="cell">{product}</span><b role="cell">{r.plan}</b><span role="cell">{r.price}</span><span className="ds-rec-clip" role="cell">{r.features}</span><span role="cell">{r.availability}</span></div>)}
                </div>
              )}
              {ai && <p className="ds-ai" style={{ margin: 0 }}><b>{t('discovery.sources.ex.aiTitle')}</b>{t('discovery.sources.ex.aiText')}</p>}
              <div className="dw-hyp-a"><Button size="sm" variant="primary" isDisabled={preview.rows.length === 0} onPress={() => { useDs.getState().toast(t('discovery.sources.ex.savedToast', { name })); setOpen(false); setPreview(null); }}>{t('discovery.sources.ex.save')}</Button><Button size="sm" variant="ghost" onPress={() => { setOpen(false); setPreview(null); }}>{t('discovery.sources.ex.cancel')}</Button></div>
            </>
          )}
        </div>
      )}
    </Section>
  );
}
