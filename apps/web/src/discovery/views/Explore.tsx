import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Button, Icon } from '@biweb/ui';
import { EXPLORE_EXAMPLES } from '../data/seed';
import { BAND_LABEL, COUNTS, PLAN_STEPS, RUN_STEPS, bandCounts, candidateSources, classifyQuery, resultEntities, type QueryKind } from '../data/explore';
import { useDs, type ExploreMode } from '../store';
import { Empty, ProgressList, StepList, Tabs2, ViewHead, dpath, useGo, useSteps } from '../ui';
import { ChangesRecap, ClassBadge, EntitiesMode, EvidenceMode, MapMode, OverviewMode, PublicDataMode, RelationshipsMode, SourcesMode, TableMode, hasGeo } from './ExploreModes';
import './explore.css';

const TITLES: Record<QueryKind, string> = { fiber: 'Companies found', sp: 'Companies found', competitors: 'Competitors found', bi: 'Vendors found', public: 'Public sources found', changes: 'Changes', none: 'Result' };

export function ExploreView({ id }: { id?: string }) {
  void id;
  const go = useGo();
  const ex = useDs((s) => s.explore), setExplore = useDs((s) => s.setExplore);
  const [text, setText] = useState(ex.query);
  const [plan, setPlan] = useState<string | null>(null);
  const q = ex.query;
  const kind = useMemo(() => classifyQuery(q).kind, [q]);
  const running = ex.phase === 'running';

  const step = useSteps(RUN_STEPS.length, 750, running, () => setExplore({ phase: 'done' }));
  useEffect(() => { setText(q); }, [q]);
  useEffect(() => { useDs.getState().setContext(`Discovery Studio · Explore${q ? ` · ${q}` : ''}`); }, [q]);

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
      <ViewHead title="Explore" sub="Start an investigation. The BDE discovers and proposes; nothing is applied to your data." />
      <form className="ds-ex-q" onSubmit={submit} role="search">
        <div className="ds-ex-field">
          <label htmlFor="ds-ex-input">What do you want to discover?</label>
          <div className="ds-ex-row">
            <Icon name="discovery" size={16} />
            <input id="ds-ex-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Describe a market, a set of companies or a question" autoComplete="off" disabled={running} />
            <Button size="sm" variant="primary" type="submit" isDisabled={running || !text.trim()}>Discover</Button>
          </div>
        </div>
        <div className="ds-ex-sug" role="group" aria-label="Example queries">
          {EXPLORE_EXAMPLES.map((s) => <button key={s} type="button" disabled={running} onClick={() => start(s)}>{s}</button>)}
          <button type="button" disabled={running} onClick={() => start('Research the BI market in depth')}>Research the BI market in depth</button>
        </div>
      </form>

      {plan && !running && (
        <section className="dw-sec ds-ex-fade" aria-label="Research plan">
          <header className="dw-sec-h"><h3>Research Plan</h3><span className="dw-muted">Broad question: review the plan before running.</span></header>
          <ol className="ds-ex-plan">{PLAN_STEPS.map((s) => <li key={s}>{s}</li>)}</ol>
          <div className="ds-ex-acts"><Button size="sm" variant="primary" icon="play" onPress={runPlan}>Run Research</Button><Button size="sm" variant="ghost" onPress={() => setPlan(null)}>Cancel</Button></div>
        </section>
      )}

      {running && <Running kind={kind} step={step} />}

      {!running && !plan && ex.phase === 'done' && <Result kind={kind} q={q} mode={ex.mode} setMode={(m) => setExplore({ mode: m })} go={go} />}

      {!running && !plan && ex.phase === 'idle' && (
        <Empty icon="discovery" title="Create your first research mission." text="Ask a question above, or turn a good result into a mission that keeps watching." action={<Button size="sm" onPress={() => go(dpath('missions', 'new'))}>Create Research Mission</Button>} />
      )}
    </div>
  );
}

function Running({ kind, step }: { kind: QueryKind; step: number }) {
  const c = COUNTS[kind];
  const cands = useMemo(() => candidateSources(kind), [kind]);
  const items = [
    { label: RUN_STEPS[0]!, done: 'Intent understood' },
    { label: RUN_STEPS[1]!, done: 'Search concepts expanded' },
    { label: RUN_STEPS[2]!, done: `${c.cands} candidate sources discovered`, now: `Discovering candidate sources · ${Math.round(c.cands * 0.6)} / ${c.cands}` },
    { label: RUN_STEPS[3]!, done: `${c.sel} sources selected`, now: `Evaluating relevance · ${Math.round(c.cands * 0.75)} / ${c.cands}` },
    { label: RUN_STEPS[4]!, done: `${c.obs} observations extracted${c.ents ? ` · ${c.ents} entities` : ''}`, now: `Extracting entities · ${Math.round(c.obs * 0.82)} / ${c.obs} observations` },
    { label: RUN_STEPS[5]!, done: 'Evidence cross-checked', now: 'Cross-checking evidence · independent sources only' },
    { label: RUN_STEPS[6]!, done: 'Result ready' },
  ];
  const showSrc = step >= 2;
  const showEnt = step >= 4 && c.ents > 0;
  const ents = resultEntities(kind).slice(0, 8);
  return (
    <div className="ds-ex-run">
      <ProgressList title="Investigation" items={items} at={step} />
      {showSrc && (
        <div className="ds-conv" aria-label="Candidate sources converging into entities">
          <ul aria-label="Candidate sources">
            {cands.slice(0, 12).map((s, i) => <li key={s.src.id} className={s.cls === 'Blocked' || s.cls === 'Policy restricted' ? 'is-blocked' : s.cls === 'Low relevance' || s.cls === 'Duplicate' ? 'is-low' : ''} style={{ animationDelay: `${i * 140}ms` }}><span className="ds-ex-trunc" style={{ flex: 1 }}>{s.src.name}</span><ClassBadge c={s.cls} /></li>)}
          </ul>
          <div className="ds-conv-ar" aria-hidden="true"><Icon name="arrowRight" size={16} /></div>
          {showEnt ? <ul aria-label="Entities found">{ents.map((e, i) => <li key={e.id} style={{ animationDelay: `${i * 120}ms` }}><Icon name="cube" size={12} /><span className="ds-ex-trunc">{e.name}</span></li>)}{c.ents > ents.length && <li style={{ animationDelay: `${ents.length * 120}ms` }}>+ {c.ents - ents.length} more</li>}</ul> : <p className="dw-muted dw-pad">Entities appear after extraction.</p>}
        </div>
      )}
      {!showSrc && <StepList steps={['Reading the question', 'Choosing concepts']} at={Math.min(step, 2)} />}
    </div>
  );
}

function Result({ kind, q, mode, setMode, go }: { kind: QueryKind; q: string; mode: ExploreMode; setMode: (m: ExploreMode) => void; go: (p: string) => void }) {
  const list = useMemo(() => resultEntities(kind), [kind]);
  const bc = useMemo(() => bandCounts(list), [list]);
  const geo = hasGeo(list);
  if (kind === 'none') {
    return (
      <div className="ds-ex-fade">
        <Empty icon="search" title="No observations found yet." text={`Nothing in the demo data matches "${q}". Try one of these:`} action={<div className="ds-ex-sug">{EXPLORE_EXAMPLES.slice(0, 3).map((s) => <button key={s} type="button" onClick={() => { useDs.getState().setExplore({ query: s, phase: 'running', mode: 'overview' }); }}>{s}</button>)}</div>} />
      </div>
    );
  }
  if (kind === 'changes') return <ChangesRecap />;
  if (kind === 'public') return <PublicDataMode />;

  const props = { kind, list };
  const tabs: { id: ExploreMode; label: string; n?: number }[] = [
    { id: 'overview', label: 'Overview' }, { id: 'table', label: 'Table', n: list.length }, { id: 'entities', label: 'Entities' }, { id: 'relationships', label: 'Relationships' },
    { id: 'map', label: 'Map' }, { id: 'evidence', label: 'Evidence' }, { id: 'sources', label: 'Sources' },
  ];
  const sendTo = () => { useDs.getState().toast('Result prepared as an enrichment proposal for LDE review'); go(dpath('datasets', 'enrichment')); };
  return (
    <>
      <div className="ds-ex-strip ds-ex-fade" role="status" aria-label="Result summary">
        <span>{TITLES[kind]}<b className="bw-num">{bc.found}</b></span>
        <span className="is-hi">{BAND_LABEL.high.replace(' confidence', '')} confidence<b className="bw-num">{bc.high}</b></span>
        <span className="is-mid">Medium<b className="bw-num">{bc.medium}</b></span>
        <span className="is-lo">{BAND_LABEL.review}<b className="bw-num">{bc.review}</b></span>
        <span className="flex-1" style={{ flex: 1 }} />
        <span className="dw-muted">Demo data · evidence on every row</span>
      </div>
      <div className="ds-ex-acts">
        {geo && <Button size="sm" icon="pin" onPress={() => { useDs.getState().setHandoff({ kind: 'map', label: q }); useDs.getState().toast('Opening result in Map Builder'); go('/maps'); }}>Open in Map Builder</Button>}
        <Button size="sm" icon="arrowRight" onPress={sendTo}>Send to LDE</Button>
        <Button size="sm" icon="target" onPress={() => go(dpath('missions', 'new'))}>Create Research Mission</Button>
        <Button size="sm" icon="eye" onPress={() => go(dpath('watchlists', 'new'))}>Create Watchlist</Button>
      </div>
      <Tabs2<ExploreMode> label="Result view" value={mode} onChange={setMode} tabs={tabs} />
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
