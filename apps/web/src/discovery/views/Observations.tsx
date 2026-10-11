import { useMemo, useState } from 'react';
import { Badge, Button, Icon, IconButton, Menu, Select, type MenuEntry } from '@biweb/ui';
import { CHANGES, MISSIONS, OBSERVATIONS, score } from '../data/seed';
import { entityById, evidenceById, observationById, sourceById } from '../data/derive';
import { liveStatus, type LiveStatus } from '../data/records';
import { useT, useFormat } from '../../i18n/intl';
import type { MessageId } from '../../i18n/catalog';
import type { Observation } from '../data/types';
import { useDs } from '../store';
import { AuthorityBadge, Chip, ConfChip, ConfidenceBreakdown, Empty, Grid, Kv, Search, Section, SemanticChange, Tabs2, TraceBtn, ViewHead, dpath, useGo, type Col } from '../ui';
import { RecLink } from './EntityActions';
import './records.css';

const TONE: Record<LiveStatus, 'success' | 'warning' | 'danger' | 'neutral'> = { confirmed: 'success', 'needs-verification': 'warning', conflicted: 'danger', superseded: 'neutral' };
const STATUS_ID: Record<LiveStatus, MessageId> = {
  confirmed: 'discovery.observations.status.confirmed', 'needs-verification': 'discovery.observations.status.needsVerification',
  conflicted: 'discovery.observations.status.conflicted', superseded: 'discovery.observations.status.superseded',
};
const EXTRACTION_ID: Record<Observation['extraction'], MessageId> = {
  'Structured HTML': 'discovery.observations.extraction.structuredHtml', 'Unstructured text': 'discovery.observations.extraction.unstructuredText',
  Document: 'discovery.observations.extraction.document', 'API record': 'discovery.observations.extraction.apiRecord',
};
export function ObsStatusBadge({ o, resolved }: { o: Observation; resolved: Record<string, 'a' | 'b'> }) {
  const t = useT();
  const challenged = useDs((s) => s.challenged[o.id]);
  const st = liveStatus(o, resolved);
  if (challenged) return <Badge tone="warning" icon="warning">{t('discovery.observations.challengedReview')}</Badge>;
  return <Badge tone={TONE[st]} icon={st === 'confirmed' ? 'check' : st === 'conflicted' || st === 'needs-verification' ? 'warning' : undefined}>{t(STATUS_ID[st])}</Badge>;
}

function useObsActions(o: Observation) {
  const go = useGo();
  const t = useT();
  const challenged = useDs((s) => s.challenged[o.id]);
  return {
    items: [
      { id: 'open', label: t('discovery.observations.menu.open'), icon: 'list', onAction: () => go(dpath('observations', o.id)) },
      { id: 'src', label: t('discovery.observations.menu.source'), icon: 'data', onAction: () => go(dpath('sources', o.sourceId)) },
      { id: 'ev', label: t('discovery.observations.menu.evidence'), icon: 'book', ...(o.evidenceIds[0] ? {} : { disabledReason: t('discovery.observations.menu.noEvidence') }), onAction: () => { if (o.evidenceIds[0]) useDs.getState().openEvidence(o.evidenceIds[0]); } },
      { id: 'cor', label: t('discovery.observations.menu.corroboration'), icon: 'search', onAction: () => go(dpath('observations', o.id)) },
      'separator',
      { id: 'ch', label: challenged ? t('discovery.observations.menu.challenged') : t('discovery.observations.menu.challenge'), icon: 'warning', ...(challenged ? { disabledReason: t('discovery.observations.menu.alreadyReview') } : {}), onAction: () => { useDs.getState().challenge(o.id); useDs.getState().toast(t('discovery.observations.toastChallenged')); } },
      { id: 'enr', label: t('discovery.observations.menu.enrichment'), icon: 'send', onAction: () => { useDs.getState().toast(t('discovery.observations.toastLde')); go(dpath('datasets', 'enrichment')); } },
    ] as MenuEntry[],
  };
}
function ObsMenu({ o }: { o: Observation }) {
  const t = useT();
  const { items } = useObsActions(o);
  return <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}><Menu title={t('discovery.observations.menu.title')} items={items} trigger={<IconButton icon="more" label={t('discovery.observations.menu.aria', { subject: o.subject, claim: o.claim })} size="sm" />} /></span>;
}

export function ObservationsView({ id }: { id?: string }) {
  return id ? <ObservationDetail id={id} /> : <ObservationList />;
}

function ObservationList() {
  const go = useGo();
  const t = useT();
  const fmt = useFormat();
  const resolved = useDs((s) => s.resolved);
  const sel = useDs((s) => s.sel);
  const [status, setStatus] = useState<LiveStatus | 'all'>('all');
  const [mission, setMission] = useState('all');
  const [entity, setEntity] = useState('all');
  const [q, setQ] = useState('');
  const entIds = useMemo(() => [...new Set(OBSERVATIONS.map((o) => o.subjectId))], []);
  const rows = useMemo(() => OBSERVATIONS.filter((o) => (status === 'all' || liveStatus(o, resolved) === status) && (mission === 'all' || o.missionId === mission) && (entity === 'all' || o.subjectId === entity)
    && (!q || `${o.subject} ${o.claim} ${o.value} ${sourceById(o.sourceId)?.name ?? ''}`.toLowerCase().includes(q.toLowerCase()))), [status, mission, entity, q, resolved]);
  const n = (s: LiveStatus) => OBSERVATIONS.filter((o) => liveStatus(o, resolved) === s).length;
  const cols: Col<Observation>[] = [
    { key: 's', label: t('discovery.observations.col.subject'), w: 'minmax(150px,1.2fr)', render: (o) => <RecLink onOpen={() => go(dpath('observations', o.id))}>{o.subject}</RecLink> },
    { key: 'c', label: t('discovery.observations.col.claim'), w: 'minmax(120px,1fr)', render: (o) => <span className="ds-rec-clip">{o.claim}</span> },
    { key: 'v', label: t('discovery.observations.col.value'), w: 'minmax(130px,1.2fr)', render: (o) => <span className="ds-rec-clip" title={o.value}>{o.value}</span> },
    { key: 'o', label: t('discovery.observations.col.observed'), w: '100px', render: (o) => o.observedAt.slice(0, 10) },
    { key: 'src', label: t('discovery.observations.col.source'), w: 'minmax(120px,1fr)', render: (o) => <span className="ds-rec-clip">{sourceById(o.sourceId)?.name}</span> },
    { key: 'cf', label: t('discovery.observations.col.confidence'), w: '104px', render: (o) => <ConfChip v={score(o.confidence)} needs /> },
    { key: 'st', label: t('discovery.observations.col.status'), w: '168px', render: (o) => <ObsStatusBadge o={o} resolved={resolved} /> },
    { key: 'co', label: t('discovery.observations.col.corroboration'), w: '58px', right: true, render: (o) => <span className="bw-num" title={t('discovery.observations.corroborationTitle', { n: o.corroboration })}>{o.corroboration}</span> },
    { key: 'a', label: '', w: '32px', render: (o) => <ObsMenu o={o} /> },
  ];
  return (
    <div className="dw-view">
      <ViewHead title={t('discovery.observations.title')} sub={t('discovery.observations.subtitle')} />
      <p className="dw-note"><Icon name="info" size={12} />{t('discovery.observations.sampleNote', { shown: OBSERVATIONS.length, total: fmt.integer(2412) })}</p>
      <div className="ds-rec-tool">
        <span className="dw-chips" role="group" aria-label={t('discovery.observations.statusGroup')}>
          <Chip on={status === 'all'} onClick={() => setStatus('all')} n={OBSERVATIONS.length}>{t('discovery.observations.all')}</Chip>
          {(['confirmed', 'needs-verification', 'conflicted', 'superseded'] as LiveStatus[]).map((s) => <Chip key={s} on={status === s} onClick={() => setStatus(s)} n={n(s)}>{t(STATUS_ID[s])}</Chip>)}
        </span>
        <Select label={t('discovery.observations.mission')} hideLabel options={[{ id: 'all', label: t('discovery.observations.allMissions') }, ...MISSIONS.filter((m) => OBSERVATIONS.some((o) => o.missionId === m.id)).map((m) => ({ id: m.id, label: m.name }))]} value={mission} onChange={setMission} />
        <Select label={t('discovery.observations.entity')} hideLabel options={[{ id: 'all', label: t('discovery.observations.allEntities') }, ...entIds.map((i) => ({ id: i, label: entityById(i)?.name ?? i }))]} value={entity} onChange={setEntity} />
        <span className="flex-1" />
        <Search value={q} onChange={setQ} placeholder={t('discovery.observations.searchPlaceholder')} label={t('discovery.observations.searchLabel')} w={240} />
      </div>
      <Grid label={t('discovery.observations.gridLabel')} cols={cols} rows={rows} id={(o) => o.id} selected={sel?.kind === 'observation' ? sel.id : null} onRow={(o) => useDs.getState().select({ kind: 'observation', id: o.id })} empty={<p className="dw-more">{t('discovery.observations.empty')}</p>} />
    </div>
  );
}

function ObservationDetail({ id }: { id: string }) {
  const go = useGo();
  const t = useT();
  const resolved = useDs((s) => s.resolved);
  const challenged = useDs((s) => s.challenged[id]);
  const [tab, setTab] = useState<'detail' | 'cor'>('detail');
  const [cor, setCor] = useState<'idle' | 'running' | 'done'>('idle');
  const o = observationById(id);
  if (!o) return <div className="dw-view"><Empty icon="list" title={t('discovery.observations.detail.notFoundTitle')} text={t('discovery.observations.detail.notFoundText')} action={<Button size="sm" onPress={() => go(dpath('observations'))}>{t('discovery.observations.detail.back')}</Button>} /></div>;
  const src = sourceById(o.sourceId);
  const sameClaim = OBSERVATIONS.filter((x) => x.id !== o.id && x.subjectId === o.subjectId && x.claim === o.claim);
  const others = sameClaim.filter((x) => x.value.split(' ')[0] === o.value.split(' ')[0]), disagree = sameClaim.length - others.length;
  const related = CHANGES.filter((c) => c.observationId === o.id || (o.history.length > 1 && c.sourceId === o.sourceId && c.entityId === o.subjectId && c.evidenceIds.some((e) => o.evidenceIds.includes(e))));
  const runCor = () => { setCor('running'); setTab('cor'); setTimeout(() => setCor('done'), 900); };
  const first = o.evidenceIds[0];
  return (
    <div className="dw-view dw-view--flush">
      <div className="dw-sh">
        <button type="button" className="dw-back" onClick={() => go(dpath('observations'))}><Icon name="arrowLeft" size={12} />{t('discovery.observations.title')}</button>
        <div className="dw-sh-main">
          <h2>{o.subject} · {o.claim}</h2><ObsStatusBadge o={o} resolved={resolved} /><ConfChip v={score(o.confidence)} needs />
          <span className="flex-1" />
          <Button size="sm" icon="data" onPress={() => go(dpath('sources', o.sourceId))}>{t('discovery.observations.detail.openSource')}</Button>
          <Button size="sm" icon="book" isDisabled={!first} onPress={() => first && useDs.getState().openEvidence(first)}>{t('discovery.observations.detail.viewEvidence')}</Button>
          <Button size="sm" icon="search" onPress={runCor}>{t('discovery.observations.detail.findCorroboration')}</Button>
          <Button size="sm" icon="warning" isDisabled={!!challenged} onPress={() => { useDs.getState().challenge(o.id); useDs.getState().toast(t('discovery.observations.toastChallenged')); }}>{challenged ? t('discovery.observations.detail.challenged') : t('discovery.observations.detail.challenge')}</Button>
          <Button size="sm" variant="primary" icon="send" onPress={() => { useDs.getState().toast(t('discovery.observations.detail.toastLde')); go(dpath('datasets', 'enrichment')); }}>{t('discovery.observations.detail.sendEnrichment')}</Button>
        </div>
        <div className="dw-sh-facts"><Kv k={t('discovery.observations.detail.kv.subject')} v={o.subject} /><Kv k={t('discovery.observations.detail.kv.observed')} v={o.observedAt} /><Kv k={t('discovery.observations.detail.kv.source')} v={src?.name ?? o.sourceId} /><Kv k={t('discovery.observations.detail.kv.extraction')} v={t(EXTRACTION_ID[o.extraction])} /><Kv k={t('discovery.observations.detail.kv.mission')} v={MISSIONS.find((m) => m.id === o.missionId)?.name ?? '—'} /></div>
        <Tabs2 label={t('discovery.observations.detail.sectionsLabel')} value={tab} onChange={setTab} tabs={[{ id: 'detail', label: t('discovery.observations.detail.tabObservation') }, { id: 'cor', label: t('discovery.observations.detail.tabCorroboration') }]} />
      </div>
      <div className="dw-pad-v">
        {challenged && <p className="dw-note"><Icon name="warning" size={12} />{t('discovery.observations.detail.challengedNote')}</p>}
        {tab === 'detail' && (
          <>
            <Section title={t('discovery.observations.detail.claim')}><p className="ds-rec-claim">{o.claim} = {o.value}</p></Section>
            <div className="dw-grid2">
              <Section title={t('discovery.observations.detail.evidenceTitle')} hint={t('discovery.observations.detail.evidenceHint', { n: o.corroboration })}>
                {o.evidenceIds.length === 0 ? <TraceBtn /> : (
                  <div className="ds-rec-evs">
                    {o.evidenceIds.map((eid, i) => { const ev = evidenceById(eid), s = ev && sourceById(ev.sourceId); return ev && s ? (
                      <div key={eid} className="ds-rec-ev"><header><b>{t('discovery.evidence.detail.card', { n: i + 1 })}</b><AuthorityBadge a={s.authority} /><Badge>{t(EXTRACTION_ID[o.extraction])}</Badge></header>
                        <p className="ds-quote" style={{ margin: 0 }}>{ev.excerpt}</p>
                        <div className="meta"><span>{t('discovery.evidence.meta.source')} <b>{s.name}</b></span><span>{t('discovery.evidence.meta.locator')} <b>{ev.locator}</b></span><span>{t('discovery.evidence.meta.captured')} <b>{ev.capturedAt}</b></span>{ev.snapshotId && <span>{t('discovery.evidence.meta.snapshot')} <b className="bw-mono">{ev.snapshotId}</b></span>}</div>
                        <div className="dw-hyp-a"><TraceBtn evidenceId={eid} label={t('discovery.evidence.detail.openProvenance')} /></div></div>
                    ) : null; })}
                  </div>
                )}
                <p className="dw-muted">{t('discovery.observations.detail.mirrorsNote', { n: o.corroboration })}</p>
              </Section>
              <Section title={t('discovery.observations.detail.confidenceTitle')} hint={t('discovery.observations.detail.confidenceHint')}><ConfidenceBreakdown c={o.confidence} /></Section>
            </div>
            <Section title={t('discovery.observations.detail.historyTitle')} hint={t('discovery.observations.detail.historyHint')}>
              <ol className="dw-timeline" style={{ maxWidth: 'none' }}>
                {[...o.history].reverse().map((h, i) => <li key={h.at + h.value} style={{ gridTemplateColumns: '90px minmax(0,1fr) auto' }}><time>{h.at}</time><b>{h.value}</b><span>{i === 0 ? <Badge tone="success">{t('discovery.observations.detail.current')}</Badge> : <Badge>{t('discovery.observations.detail.superseded')}</Badge>} {h.evidenceId && <TraceBtn evidenceId={h.evidenceId} />}</span></li>)}
              </ol>
            </Section>
            {o.aiNote && <p className="ds-ai" style={{ margin: 0 }}><b>{t('discovery.observations.detail.aiInterpretation')}</b>{o.aiNote}</p>}
            <Section title={t('discovery.observations.detail.relatedChanges')}>
              {related.length === 0 ? <p className="dw-muted">{t('discovery.observations.detail.noRelated')}</p> : <div className="dw-grid">{related.map((c) => <div key={c.id}><SemanticChange c={c} /><div className="dw-hyp-a" style={{ marginTop: 4 }}><Button size="sm" variant="ghost" onPress={() => go(dpath('changes', c.id))}>{t('discovery.observations.detail.reviewChange')}</Button></div></div>)}</div>}
            </Section>
          </>
        )}
        {tab === 'cor' && (
          <Section title={t('discovery.observations.cor.title')} hint={t('discovery.observations.cor.hint')}>
            {cor === 'idle' && <Button size="sm" icon="search" onPress={runCor}>{t('discovery.observations.cor.run')}</Button>}
            {cor === 'running' && <p className="dw-muted" role="status">{others.length ? t('discovery.observations.cor.checking', { n: others.length, subject: o.subject }) : t('discovery.observations.cor.checkingRelated', { subject: o.subject })}</p>}
            {cor === 'done' && (others.length === 0
              ? <Empty icon="search" title={t('discovery.observations.cor.noneTitle')} text={disagree ? t('discovery.observations.cor.noneTextDisagree', { n: disagree }) : t('discovery.observations.cor.noneText')} />
              : <ul className="dw-rels" aria-label={t('discovery.observations.cor.listLabel')}>{others.map((x) => <li key={x.id}><div className="dw-rel"><b>{x.value}</b><span className="dw-muted">{sourceById(x.sourceId)?.name} · {x.observedAt.slice(0, 10)}</span><ConfChip v={score(x.confidence)} /><TraceBtn evidenceId={x.evidenceIds[0]} /><Button size="sm" variant="ghost" onPress={() => go(dpath('observations', x.id))}>{t('discovery.observations.detail.open')}</Button></div></li>)}</ul>)}
          </Section>
        )}
      </div>
    </div>
  );
}
