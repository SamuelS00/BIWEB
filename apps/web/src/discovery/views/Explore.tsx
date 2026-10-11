import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Button, Icon } from '@biweb/ui';
import { useT } from '../../i18n/intl';
import type { MessageId } from '../../i18n/catalog';
import { EXPLORE_DEEP, EXPLORE_EXAMPLES } from '../data/seed';
import { BAND_LABEL, COUNTS, PLAN_STEPS, RUN_STEPS, bandCounts, candidateSources, classifyQuery, resultEntities, type QueryKind } from '../data/explore';
import { useDs, type ExploreMode } from '../store';
import { Empty, ProgressList, StepList, Tabs2, ViewHead, dpath, useGo, useSteps } from '../ui';
import { ChangesRecap, ClassBadge, EntitiesMode, EvidenceMode, MapMode, OverviewMode, PublicDataMode, RelationshipsMode, SourcesMode, TableMode, hasGeo } from './ExploreModes';
import './explore.css';

const TITLES: Record<QueryKind, MessageId> = { fiber: 'discovery.explore.title.companies', sp: 'discovery.explore.title.companies', competitors: 'discovery.explore.title.competitors', bi: 'discovery.explore.title.vendors', public: 'discovery.explore.title.public', changes: 'discovery.explore.title.changes', none: 'discovery.explore.title.result' };

export function ExploreView({ id }: { id?: string }) {
  void id;
  const t = useT();
  const go = useGo();
  const ex = useDs((s) => s.explore), setExplore = useDs((s) => s.setExplore);
  const [text, setText] = useState(ex.query);
  const [plan, setPlan] = useState<string | null>(null);
  const q = ex.query;
  const kind = useMemo(() => classifyQuery(q).kind, [q]);
  const running = ex.phase === 'running';

  const step = useSteps(RUN_STEPS.length, 750, running, () => setExplore({ phase: 'done' }));
  useEffect(() => { setText(q); }, [q]);
  useEffect(() => { useDs.getState().setContext(`${t('discovery.title')} · ${t('discovery.nav.explore')}${q ? ` · ${q}` : ''}`); }, [q, t]);

  const start = (query: string) => {
    const t = query.trim();
    if (!t) return;
    setText(t);
    const c = classifyQuery(t);
    if (c.plan) { setPlan(t); setExplore({ query: t, phase: 'idle', mode: 'overview', deep: true }); return; }
    setPlan(null);
    if (c.kind === 'none') { setExplore({ query: t, phase: 'done', mode: 'overview', deep: false }); return; }
    setExplore({ query: t, phase: 'running', mode: 'overview', deep: false });
  };
  const submit = (e: FormEvent) => { e.preventDefault(); start(text); };
  const runPlan = () => { setPlan(null); setExplore({ phase: 'running', mode: 'overview', deep: true }); };

  return (
    <div className="dw-view">
      <ViewHead title={t('discovery.nav.explore')} sub={t('discovery.explore.sub')} />
      <form className="ds-ex-q" onSubmit={submit} role="search">
        <div className="ds-ex-field">
          <label htmlFor="ds-ex-input">{t('discovery.explore.label')}</label>
          <div className="ds-ex-row">
            <Icon name="discovery" size={16} />
            <input id="ds-ex-input" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('discovery.explore.placeholder')} autoComplete="off" disabled={running} />
            <Button size="sm" variant="primary" type="submit" isDisabled={running || !text.trim()}>{t('discovery.explore.discover')}</Button>
          </div>
        </div>
        <div className="ds-ex-sug" role="group" aria-label={t('discovery.explore.examples')}>
          {[...EXPLORE_EXAMPLES, EXPLORE_DEEP].map((id) => <button key={id} type="button" disabled={running} onClick={() => start(t(id))}>{t(id)}</button>)}
        </div>
      </form>

      {plan && !running && (
        <section className="dw-sec ds-ex-fade" aria-label={t('discovery.explore.plan.title')}>
          <header className="dw-sec-h"><h3>{t('discovery.explore.plan.title')}</h3><span className="dw-muted">{t('discovery.explore.plan.hint')}</span></header>
          <ol className="ds-ex-plan">{PLAN_STEPS.map((s) => <li key={s}>{t(s)}</li>)}</ol>
          <div className="ds-ex-acts"><Button size="sm" variant="primary" icon="play" onPress={runPlan}>{t('discovery.explore.plan.run')}</Button><Button size="sm" variant="ghost" onPress={() => setPlan(null)}>{t('discovery.explore.plan.cancel')}</Button></div>
        </section>
      )}

      {running && <Running kind={kind} step={step} />}

      {!running && !plan && ex.phase === 'done' && <Result kind={kind} q={q} mode={ex.mode} setMode={(m) => setExplore({ mode: m })} go={go} />}

      {!running && !plan && ex.phase === 'idle' && (
        <Empty icon="discovery" title={t('discovery.explore.idle.title')} text={t('discovery.explore.idle.text')} action={<Button size="sm" onPress={() => go(dpath('missions', 'new'))}>{t('discovery.explore.createMission')}</Button>} />
      )}
    </div>
  );
}

function Running({ kind, step }: { kind: QueryKind; step: number }) {
  const t = useT();
  const c = COUNTS[kind];
  const cands = useMemo(() => candidateSources(kind), [kind]);
  const items = [
    { label: t(RUN_STEPS[0]!), done: t('discovery.explore.run.done.intent') },
    { label: t(RUN_STEPS[1]!), done: t('discovery.explore.run.done.concepts') },
    { label: t(RUN_STEPS[2]!), done: t('discovery.explore.run.done.cands', { n: c.cands }), now: t('discovery.explore.run.now.cands', { a: Math.round(c.cands * 0.6), b: c.cands }) },
    { label: t(RUN_STEPS[3]!), done: t('discovery.explore.run.done.sel', { n: c.sel }), now: t('discovery.explore.run.now.sel', { a: Math.round(c.cands * 0.75), b: c.cands }) },
    { label: t(RUN_STEPS[4]!), done: c.ents ? t('discovery.explore.run.done.obsEnts', { n: c.obs, e: c.ents }) : t('discovery.explore.run.done.obs', { n: c.obs }), now: t('discovery.explore.run.now.obs', { a: Math.round(c.obs * 0.82), b: c.obs }) },
    { label: t(RUN_STEPS[5]!), done: t('discovery.explore.run.done.cross'), now: t('discovery.explore.run.now.cross') },
    { label: t(RUN_STEPS[6]!), done: t('discovery.explore.run.done.result') },
  ];
  const showSrc = step >= 2;
  const showEnt = step >= 4 && c.ents > 0;
  const ents = resultEntities(kind).slice(0, 8);
  return (
    <div className="ds-ex-run">
      <ProgressList title={t('discovery.explore.run.title')} items={items} at={step} />
      {showSrc && (
        <div className="ds-conv" aria-label={t('discovery.explore.run.converge')}>
          <ul aria-label={t('discovery.explore.run.candidates')}>
            {cands.slice(0, 12).map((s, i) => <li key={s.src.id} className={s.cls === 'Blocked' || s.cls === 'Policy restricted' ? 'is-blocked' : s.cls === 'Low relevance' || s.cls === 'Duplicate' ? 'is-low' : ''} style={{ animationDelay: `${i * 140}ms` }}><span className="ds-ex-trunc" style={{ flex: 1 }}>{s.src.name}</span><ClassBadge c={s.cls} /></li>)}
          </ul>
          <div className="ds-conv-ar" aria-hidden="true"><Icon name="arrowRight" size={16} /></div>
          {showEnt ? <ul aria-label={t('discovery.explore.run.entsFound')}>{ents.map((e, i) => <li key={e.id} style={{ animationDelay: `${i * 120}ms` }}><Icon name="cube" size={12} /><span className="ds-ex-trunc">{e.name}</span></li>)}{c.ents > ents.length && <li style={{ animationDelay: `${ents.length * 120}ms` }}>{t('discovery.explore.run.more', { n: c.ents - ents.length })}</li>}</ul> : <p className="dw-muted dw-pad">{t('discovery.explore.run.entsLater')}</p>}
        </div>
      )}
      {!showSrc && <StepList steps={[t('discovery.explore.run.pre.1'), t('discovery.explore.run.pre.2')]} at={Math.min(step, 2)} />}
    </div>
  );
}

function Result({ kind, q, mode, setMode, go }: { kind: QueryKind; q: string; mode: ExploreMode; setMode: (m: ExploreMode) => void; go: (p: string) => void }) {
  const t = useT();
  const list = useMemo(() => resultEntities(kind), [kind]);
  const bc = useMemo(() => bandCounts(list), [list]);
  const geo = hasGeo(list);
  if (kind === 'none') {
    return (
      <div className="ds-ex-fade">
        <Empty icon="search" title={t('discovery.explore.none.title')} text={t('discovery.explore.none.text', { q })} action={<div className="ds-ex-sug">{EXPLORE_EXAMPLES.slice(0, 3).map((id) => <button key={id} type="button" onClick={() => { useDs.getState().setExplore({ query: t(id), phase: 'running', mode: 'overview' }); }}>{t(id)}</button>)}</div>} />
      </div>
    );
  }
  if (kind === 'changes') return <ChangesRecap />;
  if (kind === 'public') return <PublicDataMode />;

  const props = { kind, list };
  const tabs: { id: ExploreMode; label: string; n?: number }[] = [
    { id: 'overview', label: t('discovery.explore.tab.overview') }, { id: 'table', label: t('discovery.explore.tab.table'), n: list.length }, { id: 'entities', label: t('discovery.explore.tab.entities') }, { id: 'relationships', label: t('discovery.explore.tab.relationships') },
    { id: 'map', label: t('discovery.explore.tab.map') }, { id: 'evidence', label: t('discovery.explore.tab.evidence') }, { id: 'sources', label: t('discovery.explore.tab.sources') },
  ];
  const sendTo = () => { useDs.getState().toast(t('discovery.explore.toast.enrichment')); go(dpath('datasets', 'enrichment')); };
  return (
    <>
      <div className="ds-ex-strip ds-ex-fade" role="status" aria-label={t('discovery.explore.strip.label')}>
        <span>{t(TITLES[kind])}<b className="bw-num">{bc.found}</b></span>
        <span className="is-hi">{t(BAND_LABEL.high)}<b className="bw-num">{bc.high}</b></span>
        <span className="is-mid">{t('discovery.explore.strip.medium')}<b className="bw-num">{bc.medium}</b></span>
        <span className="is-lo">{t(BAND_LABEL.review)}<b className="bw-num">{bc.review}</b></span>
        <span className="flex-1" style={{ flex: 1 }} />
        <span className="dw-muted">{t('discovery.explore.strip.demo')}</span>
      </div>
      <div className="ds-ex-acts">
        {geo && <Button size="sm" icon="pin" onPress={() => { useDs.getState().setHandoff({ kind: 'map', label: q }); useDs.getState().toast(t('discovery.explore.toast.map')); go('/maps'); }}>{t('discovery.explore.openMap')}</Button>}
        <Button size="sm" icon="arrowRight" onPress={sendTo}>{t('discovery.explore.sendLde')}</Button>
        <Button size="sm" icon="target" onPress={() => go(dpath('missions', 'new'))}>{t('discovery.explore.createMission')}</Button>
        <Button size="sm" icon="eye" onPress={() => go(dpath('watchlists', 'new'))}>{t('discovery.explore.createWatchlist')}</Button>
      </div>
      <Tabs2<ExploreMode> label={t('discovery.explore.tab.label')} value={mode} onChange={setMode} tabs={tabs} />
      {mode === 'overview' && <OverviewMode {...props} onMode={setMode} />}
      {mode === 'table' && <TableMode {...props} />}
      {mode === 'entities' && <EntitiesMode {...props} />}
      {mode === 'relationships' && <RelationshipsMode {...props} />}
      {mode === 'map' && <MapMode {...props} />}
      {mode === 'evidence' && <EvidenceMode {...props} />}
      {mode === 'sources' && <SourcesMode {...props} />}
    </>
  );
}
