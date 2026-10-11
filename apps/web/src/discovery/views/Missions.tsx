import { useMemo, useState } from 'react';
import { Badge, Button, Icon } from '@biweb/ui';
import { useLocale, useT } from '../../i18n/intl';
import type { MessageId } from '../../i18n/catalog';
import { DATASETS, EVIDENCE_PACKS, ENTITIES, OBSERVATIONS, RUNS, CHANGES, SOURCES } from '../data/seed';
import { ago, confidenceOf, entityById, inWeek } from '../data/derive';
import { FREQ_LABEL, TEMPLATES, cap, deliverText, prefLabel, specText, templateLabel, tokenLabel, useMissionDraft } from '../data/missions';
import type { ResearchMission } from '../data/types';
import { useDs } from '../store';
import { AuthorityBadge, Chip, ConfChip, Dot, Empty, Grid, HealthBadge, Kv, LevelBadge, ProgressList, Section, TraceBtn, Tabs2, ViewHead, dpath, useGo, useSteps, type Col } from '../ui';
import { ENTITY_TYPE, SOURCE_TYPE } from './ExploreModes';
import { MissionWizard } from './MissionWizard';
import './missions.css';

export function MissionsView({ id }: { id?: string }) {
  if (id === 'new') return <MissionWizard />;
  if (id) return <MissionDetail id={id} />;
  return <MissionList />;
}

/* ───────── lista ───────── */
function MissionList() {
  const t = useT();
  const go = useGo();
  const missions = useDs((s) => s.missions), paused = useDs((s) => s.paused), sel = useDs((s) => s.sel);
  const setTemplate = useMissionDraft((s) => s.setTemplate);
  const start = (tid?: string) => { if (tid) setTemplate(tid); go(dpath('missions', 'new')); };
  const cols: Col<ResearchMission>[] = [
    { key: 'name', label: t('discovery.missions.col.mission'), w: 'minmax(200px, 2fr)', render: (m) => <span className="ds-ms-cell"><button type="button" className="ds-ms-link" aria-label={t('discovery.missions.openNamed', { name: m.name })} onClick={(e) => { e.stopPropagation(); go(dpath('missions', m.id)); }}>{m.name}</button><small>{m.spec.objective}</small></span> },
    { key: 'tpl', label: t('discovery.missions.col.template'), w: 'minmax(130px, 1fr)', render: (m) => templateLabel(m.template) },
    { key: 'st', label: t('discovery.missions.col.status'), w: '84px', render: (m) => <span className="ds-ms-st"><Dot tone={paused[m.id] ? 'warning' : 'success'} />{paused[m.id] ? t('discovery.missions.paused') : t('discovery.missions.active')}</span> },
    { key: 'last', label: t('discovery.missions.lastRun'), w: '84px', render: (m) => ago(m.lastRunMin) },
    { key: 'next', label: t('discovery.missions.nextRun'), w: '100px', render: (m) => m.nextRun },
    { key: 'ent', label: t('discovery.nav.entities'), w: '64px', right: true, render: (m) => <span className="bw-num">{m.entities}</span> },
    { key: 'src', label: t('discovery.nav.sources'), w: '66px', right: true, render: (m) => <span className="bw-num">{m.sourcesMonitored}</span> },
    { key: 'obs', label: t('discovery.nav.observations'), w: '96px', right: true, render: (m) => <span className="bw-num">{m.observations.toLocaleString()}</span> },
    { key: 'chg', label: t('discovery.missions.col.changesWk'), w: '90px', right: true, render: (m) => <span className="bw-num">{m.changesWeek}</span> },
  ];
  return (
    <div className="dw-view">
      <ViewHead title={t('discovery.nav.missions')} sub={t('discovery.missions.sub')} actions={<Button variant="primary" size="sm" icon="plus" onPress={() => start()}>{t('discovery.action.newMission')}</Button>} />
      <Section title={t('discovery.missions.tpl.title')} hint={t('discovery.missions.tpl.hint')}>
        <div className="ds-ms-tpl">
          {TEMPLATES.map((tpl) => <button key={tpl.id} type="button" onClick={() => start(tpl.id)} aria-label={t('discovery.missions.tpl.from', { name: t(tpl.nameId) })}><b>{t(tpl.nameId)}</b><small>{t(tpl.taglineId)}</small><em>{t('discovery.missions.tpl.input', { v: t(tpl.inputsId) })}</em><em>{t('discovery.missions.tpl.output', { v: tpl.outputs.slice(0, 3).map((o) => t(o)).join(' · ') })}</em></button>)}
        </div>
      </Section>
      <Section title={t('discovery.missions.yours')} hint={t('discovery.missions.count', { n: missions.length })}>
        <Grid label={t('discovery.nav.missions')} cols={cols} rows={missions} id={(m) => m.id} selected={sel?.kind === 'mission' ? sel.id : null} onRow={(m) => useDs.getState().select({ kind: 'mission', id: m.id })}
          empty={<Empty icon="target" title={t('discovery.missions.empty.title')} text={t('discovery.missions.empty.text')} action={<Button size="sm" variant="primary" onPress={() => start()}>{t('discovery.action.newMission')}</Button>} />} />
      </Section>
    </div>
  );
}

/* ───────── detalhe ───────── */
type Tab = 'overview' | 'entities' | 'sources' | 'observations' | 'changes' | 'evidence' | 'runs' | 'settings';

function MissionDetail({ id }: { id: string }) {
  const t = useT();
  const go = useGo();
  const m = useDs((s) => s.missions.find((x) => x.id === id));
  const paused = useDs((s) => !!s.paused[id]);
  const [tab, setTab] = useState<Tab>('overview');
  const data = useMemo(() => {
    const ents = ENTITIES.filter((e) => (m?.entityIds.length ? m.entityIds.includes(e.id) : e.missionIds.includes(id)));
    const srcs = SOURCES.filter((s) => s.usedBy.includes(id));
    const obs = OBSERVATIONS.filter((o) => o.missionId === id);
    const chg = CHANGES.filter((c) => c.missionId === id).sort((a, b) => a.detectedMin - b.detectedMin);
    const packs = EVIDENCE_PACKS.filter((p) => ents.some((e) => e.id === p.subjectId));
    const runs = RUNS.filter((r) => r.missionId === id);
    return { ents, srcs, obs, chg, packs, runs };
  }, [id]);
  if (!m) return <div className="dw-view"><Empty icon="target" title={t('discovery.missions.nf.title')} text={t('discovery.missions.nf.text')} action={<Button size="sm" onPress={() => go(dpath('missions'))}>{t('discovery.missions.nf.back')}</Button>} /></div>;
  const { ents, srcs, obs, chg, packs, runs } = data;
  const fresh = m.observations === 0;
  return (
    <div className="dw-view dw-view--flush">
      <div className="dw-sh">
        <button type="button" className="dw-back" onClick={() => go(dpath('missions'))}><Icon name="arrowLeft" size={12} />{t('discovery.missions.back')}</button>
        <div className="dw-sh-main"><h2>{m.name}</h2><span className="ds-ms-st"><Dot tone={paused ? 'warning' : 'success'} />{paused ? t('discovery.missions.paused') : t('discovery.missions.active')}</span><Badge tone="neutral">{templateLabel(m.template)}</Badge></div>
        <p className="dw-path">{m.spec.objective}</p>
        <div className="dw-sh-facts">
          <Kv k={t('discovery.missions.lastRun')} v={fresh && m.lastRunMin === 0 ? t('discovery.missions.notRun') : ago(m.lastRunMin)} /><Kv k={t('discovery.missions.nextRun')} v={paused ? t('discovery.missions.paused') : m.nextRun} /><Kv k={t('discovery.nav.entities')} v={m.entities} /><Kv k={t('discovery.missions.srcMonitored')} v={m.sourcesMonitored} />
          <Kv k={t('discovery.nav.observations')} v={m.observations.toLocaleString()} /><Kv k={t('discovery.missions.changesWeek')} v={m.changesWeek} />
        </div>
        <Tabs2<Tab> label={t('discovery.missions.sections')} value={tab} onChange={setTab} tabs={[
          { id: 'overview', label: t('discovery.nav.overview') }, { id: 'entities', label: t('discovery.nav.entities'), n: ents.length }, { id: 'sources', label: t('discovery.nav.sources'), n: srcs.length }, { id: 'observations', label: t('discovery.nav.observations'), n: obs.length },
          { id: 'changes', label: t('discovery.nav.changes'), n: m.changesWeek }, { id: 'evidence', label: t('discovery.nav.evidence'), n: packs.length }, { id: 'runs', label: t('discovery.nav.runs'), n: runs.length }, { id: 'settings', label: t('discovery.nav.settings') }]} />
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
  const t = useT();
  const go = useGo();
  const rows = [[t('discovery.missions.brief.what'), m.spec.objective], [t('discovery.missions.brief.where'), m.spec.sources.map(tokenLabel).join(', ')], [t('discovery.missions.brief.who'), m.spec.entities.join(', ')], [t('discovery.missions.brief.extract'), m.spec.extract.map(tokenLabel).join(', ')], [t('discovery.missions.brief.verify'), t('discovery.missions.verifyShort', { n: m.spec.minEvidence ?? 2, pref: prefLabel(m.spec.preferredSource ?? 'Official'), pct: m.spec.confidenceThreshold ?? 80 })], [t('discovery.missions.brief.when'), t(FREQ_LABEL[m.spec.frequency])], [t('discovery.missions.brief.deliver'), deliverText(m.spec.deliver)]] as const;
  return (
    <>
      <Section title={t('discovery.missions.map.title')} hint={t('discovery.missions.map.hint')}>
        <MissionMap m={m} entNames={entNames} />
      </Section>
      <div className="ds-ms-two">
        <Section title={t('discovery.missions.brief.title')}><dl className="ds-mw-plain">{rows.map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></Section>
        <Section title={t('discovery.missions.activity')}>
          {fresh ? <Empty icon="target" title={t('discovery.explore.none.title')} text={t('discovery.missions.activity.fresh')} />
            : <ul className="dw-hits">{CHANGES.filter((c) => c.missionId === m.id).sort((a, b) => a.detectedMin - b.detectedMin).slice(0, 5).map((c) => <li key={c.id}><button type="button" onClick={() => go(dpath('changes', c.id))}><b>{c.entity}</b><span>{c.semantic}</span><span className="flex-1" /><span className="dw-muted">{ago(c.detectedMin)}</span></button></li>)}
              {CHANGES.every((c) => c.missionId !== m.id) && <li><p className="dw-more">{t('discovery.missions.noChanges')}</p></li>}</ul>}
        </Section>
      </div>
      <RunNow m={m} fresh={fresh} />
    </>
  );
}

const LAYER_LABEL: Record<string, MessageId> = { Mission: 'discovery.missions.map.layer.mission', Entities: 'discovery.nav.entities', Sources: 'discovery.nav.sources', Observations: 'discovery.nav.observations', Output: 'discovery.missions.map.layer.output' };

function MissionMap({ m, entNames }: { m: ResearchMission; entNames: string[] }) {
  const t = useT();
  const locale = useLocale();
  const [on, setOn] = useState<string | null>(null);
  const ds1 = DATASETS.find((d) => d.missionId === m.id);
  const layers = useMemo(() => [
    { name: 'Mission', items: [m.name] },
    { name: 'Entities', items: (entNames.length ? entNames : m.spec.entities).slice(0, 6) },
    { name: 'Sources', items: m.spec.sources.map(tokenLabel).slice(0, 5) },
    { name: 'Observations', items: m.spec.extract.map(tokenLabel).slice(0, 4) },
    { name: 'Output', items: [ds1 ? t('discovery.missions.map.datasetOf', { name: ds1.name }) : cap(deliverText(m.spec.deliver)), t('discovery.missions.map.copilotCtx'), t('discovery.missions.map.dashboard')] },
  ], [m, entNames, ds1, t]);
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
    if (ent) return t('discovery.missions.map.t.entity', { label, type: t(ENTITY_TYPE[ent.type]), n: ent.sources, pct: ent.evidenceCoverage });
    return { 0: t('discovery.missions.map.t.mission', { label, n: m.sourcesMonitored, freq: t(FREQ_LABEL[m.spec.frequency]).toLocaleLowerCase(locale) }), 2: t('discovery.missions.map.t.sources', { label }), 3: t('discovery.missions.map.t.obs', { label }), 4: t('discovery.missions.map.t.output', { label }) }[l] ?? label;
  };
  return (
    <div className="ds-mmap">
      <svg viewBox={`0 0 ${8 + 5 * (W + G)} ${H}`} role="group" aria-label={t('discovery.missions.map.aria')}>
        {layers.map((l, li) => <text key={l.name} className="lay" x={8 + li * (W + G)} y={16}>{t(LAYER_LABEL[l.name]!)}</text>)}
        {edges.map((e) => <path key={`${e.a}>${e.b}`} className={`e${on && (e.a === on || e.b === on) ? ' is-on' : ''}`} d={e.d} />)}
        {layers.map((l, li) => l.items.map((label, j) => {
          const p = pos(li, j), key = `${li}:${j}`;
          const act = () => { setOn(key); useDs.getState().select({ kind: 'node', id: `${t(LAYER_LABEL[l.name]!)} · ${label}` }); };
          return (
            <g key={key} className={`n${li === 0 ? ' m' : ''}${on === key ? ' is-on' : ''}`} tabIndex={0} role="button" aria-label={`${t(LAYER_LABEL[l.name]!)}: ${label}`} onClick={act} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } }}>
              <title>{label}</title><rect x={p.x} y={p.y - N / 2 + 6} width={W} height={N - 12} rx={6} /><text x={p.x + 8} y={p.y + 4}>{label.length > 19 ? `${label.slice(0, 18)}…` : label}</text>
            </g>
          );
        }))}
      </svg>
      <p className="ds-mmap-note" aria-live="polite">{on ? text(on) : t('discovery.missions.map.select')}</p>
    </div>
  );
}

/** Run now: checklist com contagens. Em missão sem dados, a primeira execução não inventa resultados. */
function RunNow({ m, fresh }: { m: ResearchMission; fresh: boolean }) {
  const t = useT();
  const [run, setRun] = useState(false);
  const [done, setDone] = useState(false);
  const toast = useDs((s) => s.toast);
  const n = Math.max(m.sourcesMonitored, 6);
  const items = [
    { label: t('discovery.missions.run.1'), now: t('discovery.missions.run.1.now'), done: t('discovery.missions.run.1.done') },
    { label: t('discovery.missions.run.2'), now: t('discovery.missions.run.2.now', { a: Math.round(n * 0.6), b: n }), done: t('discovery.missions.run.2.done', { n }) },
    { label: t('discovery.missions.run.3'), now: t('discovery.missions.run.3.now'), done: t('discovery.missions.run.3.done') },
    { label: t('discovery.missions.run.4'), now: t('discovery.missions.run.4.now'), done: fresh ? t('discovery.missions.run.4.doneFresh') : t('discovery.missions.run.4.done', { n: Math.round(n * 0.8) }) },
    { label: t('discovery.missions.run.5'), now: t('discovery.missions.run.5.now', { n: m.spec.minEvidence ?? 2 }), done: t('discovery.missions.run.5.done') },
    { label: t('discovery.missions.run.6'), now: t('discovery.missions.run.6.now'), done: t('discovery.missions.run.6.done') },
  ];
  const at = useSteps(items.length, 650, run, () => { setRun(false); setDone(true); toast(fresh ? t('discovery.missions.run.toastFirst', { name: m.name }) : t('discovery.missions.run.toast', { name: m.name })); });
  return (
    <Section title={t('discovery.missions.run.title')} hint={done ? t('discovery.missions.run.hintDone') : fresh ? t('discovery.missions.run.hintFresh') : t('discovery.missions.run.hintLast', { when: ago(m.lastRunMin) })} actions={<Button size="sm" variant={fresh ? 'primary' : 'default'} icon="play" isDisabled={run} onPress={() => { setDone(false); setRun(true); }}>{run ? t('discovery.missions.run.running') : t('discovery.missions.run.now')}</Button>}>
      {(run || done) && <ProgressList title={run ? t('discovery.missions.run.pRunning') : t('discovery.missions.run.pDone')} items={items} at={run ? at : items.length} />}
      {!run && !done && <p className="dw-muted">{t('discovery.missions.run.note')}</p>}
    </Section>
  );
}

/* ───────── abas ───────── */
const none = (text: string) => <p className="dw-more">{text}</p>;

function EntitiesTab({ m, ents }: { m: ResearchMission; ents: ReturnType<typeof entityById>[] }) {
  const t = useT();
  const go = useGo(); const sel = useDs((s) => s.sel);
  const rows = ents.filter((e): e is NonNullable<typeof e> => !!e);
  if (!rows.length) return <Section title={t('discovery.nav.entities')}><Empty icon="cube" title={t('discovery.explore.none.title')} text={m.spec.entities.length ? t('discovery.missions.ent.planned', { list: m.spec.entities.join(', ') }) : t('discovery.missions.ent.run')} /></Section>;
  return (
    <Section title={t('discovery.nav.entities')} hint={t('discovery.missions.ent.resolved', { n: rows.length })}>
      <Grid label={t('discovery.missions.ent.label')} rows={rows} id={(e) => e.id} selected={sel?.kind === 'entity' ? sel.id : null} onRow={(e) => open('entity', e.id)} cols={[
        { key: 'n', label: t('discovery.explore.col.entity'), w: 'minmax(180px, 2fr)', render: (e) => <button type="button" className="ds-ms-link" aria-label={t('discovery.missions.openNamed', { name: e.name })} onClick={(ev) => { ev.stopPropagation(); go(dpath('entities', e.id)); }}>{e.name}</button> },
        { key: 't', label: t('discovery.explore.col.type'), w: '110px', render: (e) => t(ENTITY_TYPE[e.type]) }, { key: 'h', label: t('discovery.missions.ent.hq'), w: 'minmax(100px, 1fr)', render: (e) => e.hq ?? '—' },
        { key: 's', label: t('discovery.nav.sources'), w: '70px', right: true, render: (e) => <span className="bw-num">{e.sources}</span> }, { key: 'c', label: t('discovery.missions.ent.coverage'), w: '120px', right: true, render: (e) => <span className="bw-num">{e.evidenceCoverage}%</span> },
        { key: 'f', label: t('discovery.explore.col.confidence'), w: '110px', render: (e) => <ConfChip v={e.confidence} needs={!e.verified} /> }]} />
    </Section>
  );
}
function SourcesTab({ srcs }: { srcs: typeof SOURCES }) {
  const t = useT();
  const go = useGo(); const sel = useDs((s) => s.sel);
  return (
    <Section title={t('discovery.nav.sources')} hint={t('discovery.missions.src.hint', { n: srcs.length })}>
      <Grid label={t('discovery.missions.src.label')} rows={srcs} id={(s) => s.id} selected={sel?.kind === 'source' ? sel.id : null} onRow={(s) => open('source', s.id)} empty={none(t('discovery.explore.none.title'))} cols={[
        { key: 'n', label: t('discovery.explore.col.source'), w: 'minmax(200px, 2fr)', render: (s) => <button type="button" className="ds-ms-link" aria-label={t('discovery.missions.openNamed', { name: s.name })} onClick={(e) => { e.stopPropagation(); go(dpath('sources', s.id)); }}>{s.name}</button> },
        { key: 't', label: t('discovery.explore.col.type'), w: '130px', render: (s) => t(SOURCE_TYPE[s.type]) }, { key: 'a', label: t('discovery.explore.col.authority'), w: '100px', render: (s) => <AuthorityBadge a={s.authority} /> },
        { key: 'h', label: t('discovery.missions.src.health'), w: '170px', render: (s) => <HealthBadge s={s} /> }, { key: 'l', label: t('discovery.missions.src.checked'), w: '90px', render: (s) => ago(s.lastCheckedMin) }]} />
    </Section>
  );
}
function ObservationsTab({ obs, total }: { obs: typeof OBSERVATIONS; total: number }) {
  const t = useT();
  const go = useGo(); const sel = useDs((s) => s.sel);
  return (
    <Section title={t('discovery.nav.observations')} hint={total ? t('discovery.missions.obs.hint', { n: obs.length, total: total.toLocaleString() }) : undefined}>
      <Grid label={t('discovery.missions.obs.label')} rows={obs} id={(o) => o.id} selected={sel?.kind === 'observation' ? sel.id : null} onRow={(o) => open('observation', o.id)} empty={<Empty icon="list" title={t('discovery.explore.none.title')} text={t('discovery.missions.obs.empty')} />} cols={[
        { key: 's', label: t('discovery.explore.col.subject'), w: 'minmax(110px, 1fr)', render: (o) => <button type="button" className="ds-ms-link" aria-label={t('discovery.missions.obs.open', { claim: o.claim })} onClick={(e) => { e.stopPropagation(); go(dpath('observations', o.id)); }}>{o.subject}</button> },
        { key: 'c', label: t('discovery.explore.col.claim'), w: 'minmax(140px, 1.4fr)', render: (o) => o.claim }, { key: 'v', label: t('discovery.missions.obs.value'), w: 'minmax(140px, 1.4fr)', render: (o) => o.value },
        { key: 'f', label: t('discovery.explore.col.confidence'), w: '120px', render: (o) => <ConfChip v={confidenceOf(o)} needs={o.status === 'needs-verification'} /> }, { key: 'e', label: t('discovery.nav.evidence'), w: '100px', render: (o) => <TraceBtn evidenceId={o.evidenceIds[0]} /> }]} />
    </Section>
  );
}
function ChangesTab({ m, chg }: { m: ResearchMission; chg: typeof CHANGES }) {
  const t = useT();
  const go = useGo(); const sel = useDs((s) => s.sel); const [wk, setWk] = useState(true);
  const rows = chg.filter((c) => !wk || inWeek(c));
  return (
    <Section title={t('discovery.nav.changes')} hint={wk ? t('discovery.missions.chg.week', { n: m.changesWeek }) : t('discovery.missions.chg.total', { n: chg.length })} actions={<div className="dw-chips"><Chip on={wk} onClick={() => setWk(true)}>{t('discovery.missions.chg.thisWeek')}</Chip><Chip on={!wk} onClick={() => setWk(false)}>{t('discovery.missions.chg.allTime')}</Chip></div>}>
      <Grid label={t('discovery.missions.chg.label')} rows={rows} id={(c) => c.id} selected={sel?.kind === 'change' ? sel.id : null} onRow={(c) => open('change', c.id)} empty={<Empty icon="timeline" title={t('discovery.missions.noChanges')} text={t('discovery.missions.chg.empty')} />} cols={[
        { key: 'e', label: t('discovery.explore.col.entity'), w: '110px', render: (c) => <b>{c.entity}</b> }, { key: 's', label: t('discovery.missions.chg.change'), w: 'minmax(200px, 2fr)', render: (c) => <button type="button" className="ds-ms-link" aria-label={t('discovery.missions.chg.open', { change: c.semantic })} onClick={(e) => { e.stopPropagation(); go(dpath('changes', c.id)); }}>{c.scope}: {c.semantic}</button> },
        { key: 'd', label: t('discovery.missions.chg.detected'), w: '90px', render: (c) => ago(c.detectedMin) }, { key: 'c', label: t('discovery.explore.col.confidence'), w: '90px', render: (c) => <LevelBadge l={c.confidence} /> }, { key: 'v', label: t('discovery.nav.evidence'), w: '100px', render: (c) => <TraceBtn evidenceId={c.evidenceIds[0]} /> }]} />
    </Section>
  );
}
function EvidenceTab({ packs }: { packs: typeof EVIDENCE_PACKS }) {
  const t = useT();
  const go = useGo();
  if (!packs.length) return <Section title={t('discovery.explore.ev.packs')}><Empty icon="book" title={t('discovery.explore.none.title')} text={t('discovery.missions.ev.empty')} /></Section>;
  return (
    <Section title={t('discovery.explore.ev.packs')} hint={t('discovery.missions.ev.hint', { n: packs.length })}>
      <ul className="dw-hits">{packs.map((p) => <li key={p.id}><button type="button" onClick={() => go(dpath('evidence', p.id))}><Icon name="book" size={12} /><b>{p.claim}</b><span className="flex-1" /><span className="dw-muted">{t('discovery.missions.ev.meta', { n: p.evidence.length, when: p.firstObserved })}</span><Icon name="chevronRight" size={12} /></button></li>)}</ul>
    </Section>
  );
}
function RunsTab({ runs }: { runs: typeof RUNS }) {
  const t = useT();
  const go = useGo(); const sel = useDs((s) => s.sel);
  return (
    <Section title={t('discovery.nav.runs')} hint={t('discovery.missions.runs.hint', { n: runs.length })}>
      <Grid label={t('discovery.missions.runs.label')} rows={runs} id={(r) => r.id} selected={sel?.kind === 'run' ? sel.id : null} onRow={(r) => open('run', r.id)} empty={none(t('discovery.missions.runs.empty'))} cols={[
        { key: 'i', label: t('discovery.missions.runs.run'), w: '100px', render: (r) => <button type="button" className="ds-ms-link" aria-label={t('discovery.missions.runs.open', { id: r.id })} onClick={(e) => { e.stopPropagation(); go(dpath('runs', r.id)); }}>#{r.id}</button> },
        { key: 's', label: t('discovery.missions.runs.started'), w: '140px', render: (r) => r.started }, { key: 'e', label: t('discovery.missions.runs.evaluated'), w: '90px', right: true, render: (r) => <span className="bw-num">{r.evaluated}</span> }, { key: 'r', label: t('discovery.missions.runs.relevant'), w: '80px', right: true, render: (r) => <span className="bw-num">{r.relevant}</span> },
        { key: 'o', label: t('discovery.nav.observations'), w: '100px', right: true, render: (r) => <span className="bw-num">{r.observations}</span> }, { key: 'c', label: t('discovery.nav.conflicts'), w: '80px', right: true, render: (r) => <span className="bw-num">{r.conflicts}</span> }]} />
    </Section>
  );
}
function SettingsTab({ m, paused, fresh }: { m: ResearchMission; paused: boolean; fresh: boolean }) {
  const t = useT();
  const toggle = useDs((s) => s.togglePause), toast = useDs((s) => s.toast);
  return (
    <>
      <Section title={t('discovery.missions.set.title')} hint={t('discovery.missions.set.hint')} actions={<Button size="sm" icon={paused ? 'play' : 'clock'} onPress={() => { toggle(m.id); toast(paused ? t('discovery.missions.set.resumed', { name: m.name }) : t('discovery.missions.set.pausedToast', { name: m.name })); }}>{paused ? t('discovery.missions.set.resume') : t('discovery.missions.set.pause')}</Button>}>
        <pre className="ds-spec">{specText(m.spec)}</pre>
      </Section>
      <div className="dw-facts dw-facts--col">
        <Kv k={t('discovery.missions.brief.verify')} v={t('discovery.missions.set.verify', { n: m.spec.minEvidence ?? 2, pref: prefLabel(m.spec.preferredSource ?? 'Official'), pct: m.spec.confidenceThreshold ?? 80 })} />
        <Kv k={t('discovery.missions.set.frequency')} v={t(FREQ_LABEL[m.spec.frequency])} /><Kv k={t('discovery.missions.brief.deliver')} v={deliverText(m.spec.deliver)} /><Kv k={t('discovery.missions.set.access')} v={t('discovery.missions.set.accessValue')} />
      </div>
      <RunNow m={m} fresh={fresh} />
    </>
  );
}
