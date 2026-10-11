import { useEffect, useState, type ReactNode } from 'react';
import { Badge, Button, Icon } from '@biweb/ui';
import { EVIDENCE_PACKS, SOURCES, score, stamp } from '../data/seed';
import { ago, changesOf, entityById, observationsOf, relationsOf } from '../data/derive';
import { monthDay } from '../data/records';
import type { EntityCandidate, Observation } from '../data/types';
import { useDs } from '../store';
import { AuthorityBadge, ConfChip, Empty, Grid, HealthBadge, Kv, Meter, Section, Tabs2, TraceBtn, dpath, useGo, type Col } from '../ui';
import { EntityGraph } from './EntityGraph';
import { EntityMenu, RecLink, takePendingTab } from './EntityActions';
import { ObsStatusBadge } from './Observations';
import './records.css';

type Tab = 'overview' | 'facts' | 'products' | 'relationships' | 'changes' | 'evidence' | 'sources' | 'history';
const TABS: Tab[] = ['overview', 'facts', 'products', 'relationships', 'changes', 'evidence', 'sources', 'history'];

/** Evidência de um fato de conhecimento: só aparece quando existe uma observação/mudança que o sustente. */
function evidenceFor(e: EntityCandidate, key: string): string | undefined {
  const obs = observationsOf(e.id), chg = changesOf(e.id);
  const re: Record<string, RegExp> = { Products: /price|pricing/i, Integrations: /connector|integration/i, Locations: /offices|points of presence/i };
  const o = re[key] ? obs.find((x) => re[key]!.test(x.claim)) : undefined;
  if (o?.evidenceIds[0]) return o.evidenceIds[0];
  if (key === 'Integrations') return chg.find((c) => c.kind === 'Integration added' && c.evidenceIds.length)?.evidenceIds[0];
  return undefined;
}

export function EntityDetail({ id }: { id: string }) {
  const go = useGo();
  const e = entityById(id);
  const [tab, setTab] = useState<Tab>(() => { const t = takePendingTab(); return TABS.includes(t as Tab) ? (t as Tab) : 'overview'; });
  useEffect(() => { const f = (ev: Event) => { const t = (ev as CustomEvent<string>).detail; if (TABS.includes(t as Tab)) setTab(t as Tab); }; addEventListener('ds-entity-tab', f); return () => removeEventListener('ds-entity-tab', f); }, []);
  useEffect(() => { if (e) useDs.getState().select({ kind: 'entity', id: e.id }, false); }, [e]);
  if (!e) return <div className="dw-view"><Empty icon="cube" title="Entity not found" text="It may have been merged or removed." action={<Button size="sm" onPress={() => go(dpath('entities'))}>Back to entities</Button>} /></div>;
  const obs = observationsOf(e.id), chg = changesOf(e.id), packs = EVIDENCE_PACKS.filter((p) => p.subjectId === e.id), srcs = SOURCES.filter((s) => s.entityId === e.id);
  return (
    <div className="dw-view dw-view--flush">
      <div className="dw-sh">
        <button type="button" className="dw-back" onClick={() => go(dpath('entities'))}><Icon name="arrowLeft" size={12} />Entities</button>
        <div className="dw-sh-main">
          <h2>{e.name}</h2><Badge>{e.type}</Badge>{e.verified ? <Badge tone="success" icon="check">Verified</Badge> : <Badge tone="warning" icon="warning">Needs review</Badge>}<ConfChip v={e.confidence} needs />
          <span className="flex-1" />
          <Button size="sm" icon="matrix" onPress={() => { useDs.getState().setCompare([e.id, ...useDs.getState().compare.filter((x) => x !== e.id)].slice(0, 3)); go(dpath('entities', 'compare')); }}>Compare</Button>
          <EntityMenu e={e} trigger={<Button size="sm" icon="more">Actions</Button>} />
        </div>
        <div className="dw-sh-facts">
          <Kv k="Aliases" v={e.aliases.join(', ') || '—'} /><Kv k="Official website" v={e.website ?? '—'} mono /><Kv k="Observed since" v={e.since} /><Kv k="Last confirmed" v={ago(e.lastConfirmedMin)} /><Kv k="Sources" v={e.sources} />
        </div>
        <Tabs2<Tab> label="Entity sections" value={tab} onChange={setTab} tabs={[
          { id: 'overview', label: 'Overview' }, { id: 'facts', label: 'Facts', n: obs.length }, { id: 'products', label: 'Products', n: e.products.length }, { id: 'relationships', label: 'Relationships', n: relationsOf(e.id).length },
          { id: 'changes', label: 'Changes', n: chg.length }, { id: 'evidence', label: 'Evidence', n: packs.length }, { id: 'sources', label: 'Sources', n: srcs.length }, { id: 'history', label: 'History' }]} />
      </div>
      <div className="dw-pad-v">
        {tab === 'overview' && <Overview e={e} />}
        {tab === 'facts' && <Facts obs={obs} />}
        {tab === 'products' && <Products e={e} />}
        {tab === 'relationships' && <EntityGraph id={e.id} />}
        {tab === 'changes' && <Changes id={e.id} />}
        {tab === 'evidence' && <PackList id={e.id} />}
        {tab === 'sources' && <SourceList id={e.id} />}
        {tab === 'history' && <History obs={obs} />}
      </div>
    </div>
  );
}

function Overview({ e }: { e: EntityCandidate }) {
  const facts: [string, string][] = [['Headquarters', e.hq ?? '—'], ['Industry', e.industry ?? '—'], ['Products', e.products.join(', ') || '—'], ['Integrations', e.integrations.join(', ') || '—'], ['Locations', String(e.locations)], ['Sources', String(e.sources)]];
  return (
    <>
      <div className="dw-grid2">
        <Section title="Entity Knowledge" hint="What the BDE knows, and where each fact comes from">
          <div className="dw-table" role="table" aria-label="Entity knowledge">
            {facts.map(([k, v]) => { const ev = evidenceFor(e, k); return (
              <div key={k} className="dw-tr" role="row" style={{ gridTemplateColumns: '120px minmax(0,1fr) 150px' }}><span className="dw-muted" role="cell">{k}</span><b role="cell">{v}</b><span role="cell"><TraceBtn evidenceId={ev} /></span></div>
            ); })}
            <div className="dw-tr" role="row" style={{ gridTemplateColumns: '120px minmax(0,1fr) 150px' }}><span className="dw-muted" role="cell">Evidence coverage</span><span role="cell" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><b className="bw-num">{e.evidenceCoverage}%</b><Meter v={e.evidenceCoverage} /></span><span className="dw-muted" role="cell">of facts have evidence</span></div>
          </div>
          <p className="dw-muted">Facts without an evidence link are shown as Needs verification: they were reported by the mission summary, not yet by a captured source.</p>
        </Section>
        <Section title="Entity resolution" hint="Which names were treated as the same entity">
          <Resolution e={e} />
        </Section>
      </div>
    </>
  );
}

function Resolution({ e }: { e: EntityCandidate }) {
  const [state, setState] = useState<'review' | 'accepted' | 'kept'>('review');
  const r = e.resolution;
  if (!r) return <p className="dw-muted">No other names were merged into this entity. Aliases listed above were declared by the source itself.</p>;
  return (
    <div className="dw-card" style={{ alignItems: 'stretch' }}>
      <div className="ds-rec-flow">{r.names.map((n) => <span key={n}>{n}</span>)}<Icon name="arrowRight" size={12} /><span><b>{r.canonical}</b> ({r.match}%)</span></div>
      <ul className="dw-rels" aria-label="Resolution evidence">{r.evidence.map((x) => <li key={x} className="dw-muted"><Icon name="check" size={12} /> {x}</li>)}</ul>
      {r.ambiguous ? (
        <div className="ds-rec-sum"><Badge tone="warning" icon="warning">Needs review</Badge>{state === 'review' ? 'Two candidates fit this name. A person decides; nothing is merged silently.' : state === 'accepted' ? 'Merge accepted by reviewer.' : 'Kept as separate entities.'}
          {state === 'review' && <><Button size="sm" onPress={() => setState('accepted')}>Accept merge</Button><Button size="sm" variant="ghost" onPress={() => setState('kept')}>Keep separate</Button></>}</div>
      ) : <Badge tone="success" icon="check">Resolved with high match</Badge>}
    </div>
  );
}

function Facts({ obs }: { obs: Observation[] }) {
  const go = useGo();
  const live = useDs((s) => s.resolved);
  const cols: Col<Observation>[] = [
    { key: 'c', label: 'Fact', w: 'minmax(160px,1.2fr)', render: (o) => <span className="ds-rec-two"><RecLink onOpen={() => go(dpath('observations', o.id))}>{o.claim}</RecLink><small>{o.subject}</small></span> },
    { key: 'v', label: 'Value', w: 'minmax(140px,1.4fr)', render: (o) => <span className="ds-rec-clip">{o.value}</span> },
    { key: 's', label: 'Status', w: '150px', render: (o) => <ObsStatusBadge o={o} resolved={live} /> },
    { key: 'cf', label: 'Confidence', w: '110px', render: (o) => <ConfChip v={score(o.confidence)} needs /> },
    { key: 'o', label: 'Observed', w: '110px', render: (o) => o.observedAt.slice(0, 10) },
    { key: 't', label: 'Source', w: '110px', render: (o) => <TraceBtn evidenceId={o.evidenceIds[0]} /> },
  ];
  if (!obs.length) return <Empty icon="list" title="No observations found yet." text="Facts appear after a mission captures evidence for this entity." />;
  return <Grid label="Observations of this entity" cols={cols} rows={obs} id={(o) => o.id} onRow={(o) => useDs.getState().select({ kind: 'observation', id: o.id })} />;
}

function Products({ e }: { e: EntityCandidate }) {
  const go = useGo();
  const rel = relationsOf(e.id).filter((r) => r.from === e.id && r.kind === 'offers').map((r) => entityById(r.to)).filter((x): x is EntityCandidate => !!x);
  if (!e.products.length) return <Empty icon="card" title="No products found yet." text="Products are listed when an official source names them." />;
  return (
    <div className="dw-cards">
      {e.products.map((p) => { const sub = rel.find((r) => r.name === p); return (
        <div key={p} className="dw-card"><b>{p}</b><span className="dw-muted">{sub ? `${sub.type} · ${sub.sources} sources` : `${e.name} product`}</span>{sub ? <ConfChip v={sub.confidence} needs /> : <Badge tone="warning" icon="warning">Needs verification</Badge>}{sub && <Button size="sm" variant="ghost" onPress={() => go(dpath('entities', sub.id))}>Open</Button>}</div>
      ); })}
    </div>
  );
}

function Changes({ id }: { id: string }) {
  const go = useGo();
  const cs = changesOf(id);
  if (!cs.length) return <Empty icon="timeline" title="No changes found yet." text="Semantic changes appear when a monitored source changes." />;
  return (
    <Section title="Changes timeline" hint="Newest first. Each row opens the change review.">
      <ol className="dw-timeline" style={{ maxWidth: 'none' }}>
        {cs.map((c) => <li key={c.id} style={{ gridTemplateColumns: '70px 190px 1fr auto' }}><time>{monthDay(stamp(c.detectedMin))}</time><b>{c.kind}</b><span>{c.semantic}: {c.before} → {c.after}</span><RecLink onOpen={() => go(dpath('changes', c.id))}>Review</RecLink></li>)}
      </ol>
    </Section>
  );
}

function PackList({ id }: { id: string }) {
  const go = useGo();
  const packs = EVIDENCE_PACKS.filter((p) => p.subjectId === id);
  if (!packs.length) return <Empty icon="book" title="No observations found yet." text="Evidence packs are built when a claim has captured evidence." />;
  return (
    <div className="dw-grid" style={{ gap: 10 }}>
      {packs.map((p) => (
        <div key={p.id} className="dw-card" style={{ alignItems: 'stretch' }}>
          <b>{p.claim}</b><span className="dw-muted">{p.evidence.length} evidence · first observed {p.firstObserved} · last confirmed {p.lastConfirmed} · contradictions: {p.contradictions}</span>
          <div className="dw-hyp-a">{p.evidence.map((ev, i) => <TraceBtn key={ev} evidenceId={ev} label={`Evidence ${i + 1}`} />)}<Button size="sm" variant="ghost" onPress={() => go(dpath('evidence', p.id))}>Open evidence pack</Button></div>
        </div>
      ))}
    </div>
  );
}

function SourceList({ id }: { id: string }) {
  const go = useGo();
  const srcs = SOURCES.filter((s) => s.entityId === id);
  const cols: Col<(typeof SOURCES)[number]>[] = [
    { key: 'n', label: 'Source', w: 'minmax(200px,2fr)', render: (s) => <RecLink onOpen={() => go(dpath('sources', s.id))}>{s.name}</RecLink> },
    { key: 't', label: 'Type', w: '120px', render: (s) => s.type }, { key: 'a', label: 'Authority', w: '100px', render: (s) => <AuthorityBadge a={s.authority} /> },
    { key: 'l', label: 'Last checked', w: '100px', render: (s) => ago(s.lastCheckedMin) }, { key: 'h', label: 'Health', w: '170px', render: (s) => <HealthBadge s={s} /> },
  ];
  if (!srcs.length) return <Empty icon="data" title="No sources linked yet." text="Sources appear when a mission monitors a page about this entity." />;
  return <Grid label="Sources of this entity" cols={cols} rows={srcs} id={(s) => s.id} onRow={(s) => useDs.getState().select({ kind: 'source', id: s.id })} />;
}

function History({ obs }: { obs: Observation[] }): ReactNode {
  if (!obs.length) return <Empty icon="clock" title="No observations found yet." text="Version history starts with the first observation." />;
  return (
    <div className="dw-grid" style={{ gap: 14 }}>
      <p className="dw-note"><Icon name="info" size={12} />Observations keep their history: a new value never overwrites the previous one.</p>
      {obs.map((o) => (
        <Section key={o.id} title={`${o.claim} · ${o.subject}`} hint={`${o.history.length} version${o.history.length > 1 ? 's' : ''}`}>
          <ol className="dw-timeline" style={{ maxWidth: 'none' }}>
            {[...o.history].reverse().map((h, i) => <li key={h.at + h.value} style={{ gridTemplateColumns: '90px minmax(0,1fr) auto' }}><time>{h.at}</time><b>{h.value}</b><span>{i === 0 ? <Badge tone="success">Current</Badge> : <Badge>Superseded</Badge>} <TraceBtn evidenceId={h.evidenceId} /></span></li>)}
          </ol>
        </Section>
      ))}
    </div>
  );
}
