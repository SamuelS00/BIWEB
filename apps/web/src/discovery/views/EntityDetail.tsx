import { useEffect, useState, type ReactNode } from 'react';
import { Badge, Button, Icon } from '@biweb/ui';
import { EVIDENCE_PACKS, SOURCES, score, stamp } from '../data/seed';
import { changesOf, entityById, evidenceById, observationsOf, relationsOf } from '../data/derive';
import { monthDay } from '../data/records';
import type { EntityCandidate, Observation } from '../data/types';
import { useDs } from '../store';
import { useT } from '../../i18n/intl';
import type { MessageId } from '../../i18n/catalog';
import type { ChangeKind } from '../data/types';
import { AuthorityBadge, ConfChip, Empty, Grid, HealthBadge, Kv, Meter, Section, Tabs2, TraceBtn, dpath, useGo, type Col } from '../ui';
import { EntityGraph } from './EntityGraph';
import { ENTITY_TYPE_ID, EntityMenu, RecLink, SRC_TYPE_ID, takePendingTab, useAgo } from './EntityActions';
import { useContra } from './Evidence';
import { ObsStatusBadge } from './Observations';
import './records.css';

type Tab = 'overview' | 'facts' | 'products' | 'relationships' | 'changes' | 'evidence' | 'sources' | 'history';
const TABS: Tab[] = ['overview', 'facts', 'products', 'relationships', 'changes', 'evidence', 'sources', 'history'];
const TAB_ID: Record<Tab, MessageId> = {
  overview: 'discovery.entities.tab.overview', facts: 'discovery.entities.tab.facts', products: 'discovery.entities.tab.products', relationships: 'discovery.entities.tab.relationships',
  changes: 'discovery.entities.tab.changes', evidence: 'discovery.entities.tab.evidence', sources: 'discovery.entities.tab.sources', history: 'discovery.entities.tab.history',
};
const CHANGE_KIND_ID: Record<ChangeKind, MessageId> = {
  'Pricing changed': 'discovery.entities.changeKind.pricing', 'Capability added': 'discovery.entities.changeKind.capability', 'Integration added': 'discovery.entities.changeKind.integration',
  'Documentation updated': 'discovery.entities.changeKind.docs', 'Location changed': 'discovery.entities.changeKind.location', 'Product renamed': 'discovery.entities.changeKind.renamed', 'Feature removed': 'discovery.entities.changeKind.removed',
};
type FactKey = 'Headquarters' | 'Industry' | 'Products' | 'Integrations' | 'Locations';
const FACT_ID: Record<FactKey, MessageId> = {
  Headquarters: 'discovery.entities.overview.fact.hq', Industry: 'discovery.entities.overview.fact.industry', Products: 'discovery.entities.overview.fact.products',
  Integrations: 'discovery.entities.overview.fact.integrations', Locations: 'discovery.entities.overview.fact.locations',
};

/** Evidência de um fato de conhecimento: só aparece quando existe uma observação/mudança que o sustente. */
function evidenceFor(e: EntityCandidate, key: string): string | undefined {
  const known = evidenceById(`e-${e.id}-k-${key}`);
  if (known) return known.id;
  const obs = observationsOf(e.id), chg = changesOf(e.id);
  const re: Record<string, RegExp> = { Products: /price|pricing/i, Integrations: /connector|integration/i, Locations: /offices|points of presence/i };
  const o = re[key] ? obs.find((x) => re[key]!.test(x.claim)) : undefined;
  if (o?.evidenceIds[0]) return o.evidenceIds[0];
  if (key === 'Integrations') return chg.find((c) => c.kind === 'Integration added' && c.evidenceIds.length)?.evidenceIds[0];
  return undefined;
}

export function EntityDetail({ id }: { id: string }) {
  const go = useGo();
  const t = useT();
  const ago = useAgo();
  const e = entityById(id);
  const [tab, setTab] = useState<Tab>(() => { const p = takePendingTab(); return TABS.includes(p as Tab) ? (p as Tab) : 'overview'; });
  useEffect(() => { const f = (ev: Event) => { const t = (ev as CustomEvent<string>).detail; if (TABS.includes(t as Tab)) setTab(t as Tab); }; addEventListener('ds-entity-tab', f); return () => removeEventListener('ds-entity-tab', f); }, []);
  useEffect(() => { if (e) useDs.getState().select({ kind: 'entity', id: e.id }, false); }, [e]);
  if (!e) return <div className="dw-view"><Empty icon="cube" title={t('discovery.entities.detail.notFoundTitle')} text={t('discovery.entities.detail.notFoundText')} action={<Button size="sm" onPress={() => go(dpath('entities'))}>{t('discovery.entities.detail.back')}</Button>} /></div>;
  const obs = observationsOf(e.id), chg = changesOf(e.id), packs = EVIDENCE_PACKS.filter((p) => p.subjectId === e.id), srcs = SOURCES.filter((s) => s.entityId === e.id);
  return (
    <div className="dw-view dw-view--flush">
      <div className="dw-sh">
        <button type="button" className="dw-back" onClick={() => go(dpath('entities'))}><Icon name="arrowLeft" size={12} />{t('discovery.entities.title')}</button>
        <div className="dw-sh-main">
          <h2>{e.name}</h2><Badge>{t(ENTITY_TYPE_ID[e.type])}</Badge>{e.verified ? <Badge tone="success" icon="check">{t('discovery.entities.verified')}</Badge> : <Badge tone="warning" icon="warning">{t('discovery.entities.needsReview')}</Badge>}<ConfChip v={e.confidence} needs />
          <span className="flex-1" />
          <Button size="sm" icon="matrix" onPress={() => { useDs.getState().setCompare([e.id, ...useDs.getState().compare.filter((x) => x !== e.id)].slice(0, 3)); go(dpath('entities', 'compare')); }}>{t('discovery.entities.detail.compare')}</Button>
          <EntityMenu e={e} trigger={<Button size="sm" icon="more">{t('discovery.entities.detail.actions')}</Button>} />
        </div>
        <div className="dw-sh-facts">
          <Kv k={t('discovery.entities.detail.kv.aliases')} v={e.aliases.join(', ') || '—'} /><Kv k={t('discovery.entities.detail.kv.website')} v={e.website ?? '—'} mono /><Kv k={t('discovery.entities.detail.kv.since')} v={e.since} /><Kv k={t('discovery.entities.detail.kv.lastConfirmed')} v={ago(e.lastConfirmedMin)} /><Kv k={t('discovery.entities.detail.kv.sources')} v={e.sources} />
        </div>
        <Tabs2<Tab> label={t('discovery.entities.detail.sectionsLabel')} value={tab} onChange={setTab} tabs={[
          { id: 'overview', label: t(TAB_ID.overview) }, { id: 'facts', label: t(TAB_ID.facts), n: obs.length }, { id: 'products', label: t(TAB_ID.products), n: e.products.length }, { id: 'relationships', label: t(TAB_ID.relationships), n: relationsOf(e.id).length },
          { id: 'changes', label: t(TAB_ID.changes), n: chg.length }, { id: 'evidence', label: t(TAB_ID.evidence), n: packs.length }, { id: 'sources', label: t(TAB_ID.sources), n: srcs.length }, { id: 'history', label: t(TAB_ID.history) }]} />
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
  const t = useT();
  const facts: [FactKey, string][] = [['Headquarters', e.hq ?? '—'], ['Industry', e.industry ?? '—'], ['Products', e.products.join(', ') || '—'], ['Integrations', e.integrations.join(', ') || '—'], ['Locations', String(e.locations)]];
  return (
    <>
      <div className="dw-grid2">
        <Section title={t('discovery.entities.overview.knowledgeTitle')} hint={t('discovery.entities.overview.knowledgeHint')}>
          <div className="dw-table" role="table" aria-label={t('discovery.entities.overview.knowledgeLabel')}>
            {facts.map(([k, v]) => { const ev = evidenceFor(e, k); return (
              <div key={k} className="dw-tr" role="row" style={{ gridTemplateColumns: '120px minmax(0,1fr) 150px' }}><span className="dw-muted" role="cell">{t(FACT_ID[k])}</span><b role="cell">{v}</b><span role="cell"><TraceBtn evidenceId={ev} /></span></div>
            ); })}
            <div className="dw-tr" role="row" style={{ gridTemplateColumns: '120px minmax(0,1fr) 150px' }}><span className="dw-muted" role="cell">{t('discovery.entities.overview.coverage')}</span><span role="cell" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><b className="bw-num">{e.evidenceCoverage}%</b><Meter v={e.evidenceCoverage} /></span><span className="dw-muted" role="cell">{t('discovery.entities.overview.coverageOf')}</span></div>
          </div>
          <p className="dw-muted">{t('discovery.entities.overview.note')}</p>
        </Section>
        <Section title={t('discovery.entities.overview.resolutionTitle')} hint={t('discovery.entities.overview.resolutionHint')}>
          <Resolution e={e} />
        </Section>
      </div>
    </>
  );
}

function Resolution({ e }: { e: EntityCandidate }) {
  const t = useT();
  const [state, setState] = useState<'review' | 'accepted' | 'kept'>('review');
  const r = e.resolution;
  if (!r) return <p className="dw-muted">{t('discovery.entities.overview.noResolution')}</p>;
  return (
    <div className="dw-card" style={{ alignItems: 'stretch' }}>
      <div className="ds-rec-flow">{r.names.map((n) => <span key={n}>{n}</span>)}<Icon name="arrowRight" size={12} /><span><b>{r.canonical}</b> ({r.match}%)</span></div>
      <ul className="dw-rels" aria-label={t('discovery.entities.overview.resolutionEvidence')}>{r.evidence.map((x) => <li key={x} className="dw-muted"><Icon name="check" size={12} /> {x}</li>)}</ul>
      {r.ambiguous ? (
        <div className="ds-rec-sum"><Badge tone="warning" icon="warning">{t('discovery.entities.needsReview')}</Badge>{state === 'review' ? t('discovery.entities.overview.ambiguous') : state === 'accepted' ? t('discovery.entities.overview.accepted') : t('discovery.entities.overview.kept')}
          {state === 'review' && <><Button size="sm" onPress={() => setState('accepted')}>{t('discovery.entities.overview.acceptMerge')}</Button><Button size="sm" variant="ghost" onPress={() => setState('kept')}>{t('discovery.entities.overview.keepSeparate')}</Button></>}</div>
      ) : <Badge tone="success" icon="check">{t('discovery.entities.overview.resolvedHigh')}</Badge>}
    </div>
  );
}

function Facts({ obs }: { obs: Observation[] }) {
  const go = useGo();
  const t = useT();
  const live = useDs((s) => s.resolved);
  const cols: Col<Observation>[] = [
    { key: 'c', label: t('discovery.entities.facts.col.fact'), w: 'minmax(160px,1.2fr)', render: (o) => <span className="ds-rec-two"><RecLink onOpen={() => go(dpath('observations', o.id))}>{o.claim}</RecLink><small>{o.subject}</small></span> },
    { key: 'v', label: t('discovery.entities.facts.col.value'), w: 'minmax(140px,1.4fr)', render: (o) => <span className="ds-rec-clip">{o.value}</span> },
    { key: 's', label: t('discovery.entities.facts.col.status'), w: '150px', render: (o) => <ObsStatusBadge o={o} resolved={live} /> },
    { key: 'cf', label: t('discovery.entities.facts.col.confidence'), w: '110px', render: (o) => <ConfChip v={score(o.confidence)} needs /> },
    { key: 'o', label: t('discovery.entities.facts.col.observed'), w: '110px', render: (o) => o.observedAt.slice(0, 10) },
    { key: 't', label: t('discovery.entities.facts.col.source'), w: '110px', render: (o) => <TraceBtn evidenceId={o.evidenceIds[0]} /> },
  ];
  if (!obs.length) return <Empty icon="list" title={t('discovery.entities.facts.emptyTitle')} text={t('discovery.entities.facts.emptyText')} />;
  return <Grid label={t('discovery.entities.facts.gridLabel')} cols={cols} rows={obs} id={(o) => o.id} onRow={(o) => useDs.getState().select({ kind: 'observation', id: o.id })} />;
}

function Products({ e }: { e: EntityCandidate }) {
  const go = useGo();
  const t = useT();
  const rel = relationsOf(e.id).filter((r) => r.from === e.id && r.kind === 'offers').map((r) => entityById(r.to)).filter((x): x is EntityCandidate => !!x);
  if (!e.products.length) return <Empty icon="card" title={t('discovery.entities.products.emptyTitle')} text={t('discovery.entities.products.emptyText')} />;
  return (
    <div className="dw-cards">
      {e.products.map((p) => { const sub = rel.find((r) => r.name === p); return (
        <div key={p} className="dw-card"><b>{p}</b><span className="dw-muted">{sub ? t('discovery.entities.products.sub', { type: t(ENTITY_TYPE_ID[sub.type]), n: sub.sources }) : t('discovery.entities.products.productOf', { name: e.name })}</span>{sub ? <ConfChip v={sub.confidence} needs /> : <Badge tone="warning" icon="warning">{t('discovery.entities.needsVerification')}</Badge>}{sub && <Button size="sm" variant="ghost" onPress={() => go(dpath('entities', sub.id))}>{t('discovery.entities.products.open')}</Button>}</div>
      ); })}
    </div>
  );
}

function Changes({ id }: { id: string }) {
  const go = useGo();
  const t = useT();
  const cs = changesOf(id);
  if (!cs.length) return <Empty icon="timeline" title={t('discovery.entities.changes.emptyTitle')} text={t('discovery.entities.changes.emptyText')} />;
  return (
    <Section title={t('discovery.entities.changes.title')} hint={t('discovery.entities.changes.hint')}>
      <ol className="dw-timeline" style={{ maxWidth: 'none' }}>
        {cs.map((c) => <li key={c.id} style={{ gridTemplateColumns: '70px 190px 1fr auto' }}><time>{monthDay(stamp(c.detectedMin))}</time><b>{t(CHANGE_KIND_ID[c.kind])}</b><span>{c.semantic}: {c.before} → {c.after}</span><RecLink onOpen={() => go(dpath('changes', c.id))}>{t('discovery.entities.changes.review')}</RecLink></li>)}
      </ol>
    </Section>
  );
}

function PackList({ id }: { id: string }) {
  const go = useGo();
  const t = useT();
  const contra = useContra();
  const packs = EVIDENCE_PACKS.filter((p) => p.subjectId === id);
  if (!packs.length) return <Empty icon="book" title={t('discovery.entities.packs.emptyTitle')} text={t('discovery.entities.packs.emptyText')} />;
  return (
    <div className="dw-grid" style={{ gap: 10 }}>
      {packs.map((p) => (
        <div key={p.id} className="dw-card" style={{ alignItems: 'stretch' }}>
          <b>{p.claim}</b><span className="dw-muted">{t('discovery.entities.packs.line', { n: p.evidence.length, first: p.firstObserved, last: p.lastConfirmed, contra: contra(p.contradictions) })}</span>
          <div className="dw-hyp-a">{p.evidence.map((ev, i) => <TraceBtn key={ev} evidenceId={ev} label={t('discovery.entities.packs.evidenceN', { n: i + 1 })} />)}<Button size="sm" variant="ghost" onPress={() => go(dpath('evidence', p.id))}>{t('discovery.entities.packs.open')}</Button></div>
        </div>
      ))}
    </div>
  );
}

function SourceList({ id }: { id: string }) {
  const go = useGo();
  const t = useT();
  const ago = useAgo();
  const srcs = SOURCES.filter((s) => s.entityId === id);
  const cols: Col<(typeof SOURCES)[number]>[] = [
    { key: 'n', label: t('discovery.entities.sources.col.source'), w: 'minmax(200px,2fr)', render: (s) => <RecLink onOpen={() => go(dpath('sources', s.id))}>{s.name}</RecLink> },
    { key: 't', label: t('discovery.entities.sources.col.type'), w: '120px', render: (s) => t(SRC_TYPE_ID[s.type]) }, { key: 'a', label: t('discovery.entities.sources.col.authority'), w: '100px', render: (s) => <AuthorityBadge a={s.authority} /> },
    { key: 'l', label: t('discovery.entities.sources.col.lastChecked'), w: '100px', render: (s) => ago(s.lastCheckedMin) }, { key: 'h', label: t('discovery.entities.sources.col.health'), w: '170px', render: (s) => <HealthBadge s={s} /> },
  ];
  if (!srcs.length) return <Empty icon="data" title={t('discovery.entities.sources.emptyTitle')} text={t('discovery.entities.sources.emptyText')} />;
  return <Grid label={t('discovery.entities.sources.gridLabel')} cols={cols} rows={srcs} id={(s) => s.id} onRow={(s) => useDs.getState().select({ kind: 'source', id: s.id })} />;
}

function History({ obs }: { obs: Observation[] }): ReactNode {
  const t = useT();
  if (!obs.length) return <Empty icon="clock" title={t('discovery.entities.history.emptyTitle')} text={t('discovery.entities.history.emptyText')} />;
  return (
    <div className="dw-grid" style={{ gap: 14 }}>
      <p className="dw-note"><Icon name="info" size={12} />{t('discovery.entities.history.note')}</p>
      {obs.map((o) => (
        <Section key={o.id} title={`${o.claim} · ${o.subject}`} hint={t('discovery.entities.history.versions', { n: o.history.length })}>
          <ol className="dw-timeline" style={{ maxWidth: 'none' }}>
            {[...o.history].reverse().map((h, i) => <li key={h.at + h.value} style={{ gridTemplateColumns: '90px minmax(0,1fr) auto' }}><time>{h.at}</time><b>{h.value}</b><span>{i === 0 ? <Badge tone="success">{t('discovery.entities.history.current')}</Badge> : <Badge>{t('discovery.entities.history.superseded')}</Badge>} <TraceBtn evidenceId={h.evidenceId} /></span></li>)}
          </ol>
        </Section>
      ))}
    </div>
  );
}
