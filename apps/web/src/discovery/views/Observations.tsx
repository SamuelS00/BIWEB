import { useMemo, useState } from 'react';
import { Badge, Button, Icon, IconButton, Menu, Select, type MenuEntry } from '@biweb/ui';
import { CHANGES, MISSIONS, OBSERVATIONS, score } from '../data/seed';
import { entityById, evidenceById, observationById, sourceById } from '../data/derive';
import { STATUS_LABEL, liveStatus, type LiveStatus } from '../data/records';
import type { Observation } from '../data/types';
import { useDs } from '../store';
import { AuthorityBadge, Chip, ConfChip, ConfidenceBreakdown, Empty, Grid, Kv, Search, Section, SemanticChange, Tabs2, TraceBtn, ViewHead, dpath, useGo, type Col } from '../ui';
import { RecLink } from './EntityActions';
import './records.css';

const TONE: Record<LiveStatus, 'success' | 'warning' | 'danger' | 'neutral'> = { confirmed: 'success', 'needs-verification': 'warning', conflicted: 'danger', superseded: 'neutral' };
export function ObsStatusBadge({ o, resolved }: { o: Observation; resolved: Record<string, 'a' | 'b'> }) {
  const challenged = useDs((s) => s.challenged[o.id]);
  const st = liveStatus(o, resolved);
  if (challenged) return <Badge tone="warning" icon="warning">Challenged — under review</Badge>;
  return <Badge tone={TONE[st]} icon={st === 'confirmed' ? 'check' : st === 'conflicted' || st === 'needs-verification' ? 'warning' : undefined}>{STATUS_LABEL[st]}</Badge>;
}

function useObsActions(o: Observation) {
  const go = useGo();
  const challenged = useDs((s) => s.challenged[o.id]);
  return {
    items: [
      { id: 'open', label: 'Open observation', icon: 'list', onAction: () => go(dpath('observations', o.id)) },
      { id: 'src', label: 'Open source', icon: 'data', onAction: () => go(dpath('sources', o.sourceId)) },
      { id: 'ev', label: 'View evidence', icon: 'book', ...(o.evidenceIds[0] ? {} : { disabledReason: 'No evidence captured yet' }), onAction: () => { if (o.evidenceIds[0]) useDs.getState().openEvidence(o.evidenceIds[0]); } },
      { id: 'cor', label: 'Find corroboration', icon: 'search', onAction: () => go(dpath('observations', o.id)) },
      'separator',
      { id: 'ch', label: challenged ? 'Challenged' : 'Challenge', icon: 'warning', ...(challenged ? { disabledReason: 'Already under review' } : {}), onAction: () => { useDs.getState().challenge(o.id); useDs.getState().toast('Observation challenged: under review'); } },
      { id: 'enr', label: 'Send as enrichment', icon: 'send', onAction: () => { useDs.getState().toast('Proposed to the LDE: it validates before anything is applied'); go(dpath('datasets', 'enrichment')); } },
    ] as MenuEntry[],
  };
}
function ObsMenu({ o }: { o: Observation }) {
  const { items } = useObsActions(o);
  return <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}><Menu title="Observation actions" items={items} trigger={<IconButton icon="more" label={`Actions for ${o.subject} ${o.claim}`} size="sm" />} /></span>;
}

export function ObservationsView({ id }: { id?: string }) {
  return id ? <ObservationDetail id={id} /> : <ObservationList />;
}

function ObservationList() {
  const go = useGo();
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
    { key: 's', label: 'Subject', w: 'minmax(150px,1.2fr)', render: (o) => <RecLink onOpen={() => go(dpath('observations', o.id))}>{o.subject}</RecLink> },
    { key: 'c', label: 'Claim', w: 'minmax(120px,1fr)', render: (o) => <span className="ds-rec-clip">{o.claim}</span> },
    { key: 'v', label: 'Value', w: 'minmax(130px,1.2fr)', render: (o) => <span className="ds-rec-clip" title={o.value}>{o.value}</span> },
    { key: 'o', label: 'Observed', w: '100px', render: (o) => o.observedAt.slice(0, 10) },
    { key: 'src', label: 'Source', w: 'minmax(120px,1fr)', render: (o) => <span className="ds-rec-clip">{sourceById(o.sourceId)?.name}</span> },
    { key: 'cf', label: 'Confidence', w: '104px', render: (o) => <ConfChip v={score(o.confidence)} needs /> },
    { key: 'st', label: 'Status', w: '168px', render: (o) => <ObsStatusBadge o={o} resolved={resolved} /> },
    { key: 'co', label: 'Corrob.', w: '58px', right: true, render: (o) => <span className="bw-num" title={`${o.corroboration} independent source(s)`}>{o.corroboration}</span> },
    { key: 'a', label: '', w: '32px', render: (o) => <ObsMenu o={o} /> },
  ];
  return (
    <div className="dw-view">
      <ViewHead title="Observations" sub="Every claim the BDE recorded, with its source and confidence. Values keep their history." />
      <p className="dw-note"><Icon name="info" size={12} />This table shows the demo sample of the week's observations ({OBSERVATIONS.length} of {(2412).toLocaleString('en-US')}). Counts elsewhere refer to the full week.</p>
      <div className="ds-rec-tool">
        <span className="dw-chips" role="group" aria-label="Status">
          <Chip on={status === 'all'} onClick={() => setStatus('all')} n={OBSERVATIONS.length}>All</Chip>
          {(['confirmed', 'needs-verification', 'conflicted', 'superseded'] as LiveStatus[]).map((s) => <Chip key={s} on={status === s} onClick={() => setStatus(s)} n={n(s)}>{STATUS_LABEL[s]}</Chip>)}
        </span>
        <Select label="Mission" hideLabel options={[{ id: 'all', label: 'All missions' }, ...MISSIONS.filter((m) => OBSERVATIONS.some((o) => o.missionId === m.id)).map((m) => ({ id: m.id, label: m.name }))]} value={mission} onChange={setMission} />
        <Select label="Entity" hideLabel options={[{ id: 'all', label: 'All entities' }, ...entIds.map((i) => ({ id: i, label: entityById(i)?.name ?? i }))]} value={entity} onChange={setEntity} />
        <span className="flex-1" />
        <Search value={q} onChange={setQ} placeholder="Search subject, claim, value" label="Search observations" w={240} />
      </div>
      <Grid label="Observations" cols={cols} rows={rows} id={(o) => o.id} selected={sel?.kind === 'observation' ? sel.id : null} onRow={(o) => useDs.getState().select({ kind: 'observation', id: o.id })} empty={<p className="dw-more">No observations found yet.</p>} />
    </div>
  );
}

function ObservationDetail({ id }: { id: string }) {
  const go = useGo();
  const resolved = useDs((s) => s.resolved);
  const challenged = useDs((s) => s.challenged[id]);
  const [tab, setTab] = useState<'detail' | 'cor'>('detail');
  const [cor, setCor] = useState<'idle' | 'running' | 'done'>('idle');
  const o = observationById(id);
  if (!o) return <div className="dw-view"><Empty icon="list" title="Observation not found" text="No observations found yet for this id." action={<Button size="sm" onPress={() => go(dpath('observations'))}>Back to observations</Button>} /></div>;
  const src = sourceById(o.sourceId);
  const sameClaim = OBSERVATIONS.filter((x) => x.id !== o.id && x.subjectId === o.subjectId && x.claim === o.claim);
  const others = sameClaim.filter((x) => x.value.split(' ')[0] === o.value.split(' ')[0]), disagree = sameClaim.length - others.length;
  const related = CHANGES.filter((c) => c.observationId === o.id || (o.history.length > 1 && c.sourceId === o.sourceId && c.entityId === o.subjectId && c.evidenceIds.some((e) => o.evidenceIds.includes(e))));
  const runCor = () => { setCor('running'); setTab('cor'); setTimeout(() => setCor('done'), 900); };
  const first = o.evidenceIds[0];
  return (
    <div className="dw-view dw-view--flush">
      <div className="dw-sh">
        <button type="button" className="dw-back" onClick={() => go(dpath('observations'))}><Icon name="arrowLeft" size={12} />Observations</button>
        <div className="dw-sh-main">
          <h2>{o.subject} · {o.claim}</h2><ObsStatusBadge o={o} resolved={resolved} /><ConfChip v={score(o.confidence)} needs />
          <span className="flex-1" />
          <Button size="sm" icon="data" onPress={() => go(dpath('sources', o.sourceId))}>Open source</Button>
          <Button size="sm" icon="book" isDisabled={!first} onPress={() => first && useDs.getState().openEvidence(first)}>View evidence</Button>
          <Button size="sm" icon="search" onPress={runCor}>Find corroboration</Button>
          <Button size="sm" icon="warning" isDisabled={!!challenged} onPress={() => { useDs.getState().challenge(o.id); useDs.getState().toast('Observation challenged: under review'); }}>{challenged ? 'Challenged' : 'Challenge'}</Button>
          <Button size="sm" variant="primary" icon="send" onPress={() => { useDs.getState().toast('Proposed to the LDE as enrichment: validation comes first'); go(dpath('datasets', 'enrichment')); }}>Send as enrichment</Button>
        </div>
        <div className="dw-sh-facts"><Kv k="Subject" v={o.subject} /><Kv k="Observed" v={o.observedAt} /><Kv k="Source" v={src?.name ?? o.sourceId} /><Kv k="Extraction" v={o.extraction} /><Kv k="Mission" v={MISSIONS.find((m) => m.id === o.missionId)?.name ?? '—'} /></div>
        <Tabs2 label="Observation sections" value={tab} onChange={setTab} tabs={[{ id: 'detail', label: 'Observation' }, { id: 'cor', label: 'Corroboration' }]} />
      </div>
      <div className="dw-pad-v">
        {challenged && <p className="dw-note"><Icon name="warning" size={12} />Challenged — under review. The value stays visible, marked as disputed, until a reviewer closes the challenge.</p>}
        {tab === 'detail' && (
          <>
            <Section title="Claim"><p className="ds-rec-claim">{o.claim} = {o.value}</p></Section>
            <div className="dw-grid2">
              <Section title="Evidence" hint={`${o.corroboration} independent source${o.corroboration === 1 ? '' : 's'}`}>
                {o.evidenceIds.length === 0 ? <TraceBtn /> : (
                  <div className="ds-rec-evs">
                    {o.evidenceIds.map((eid, i) => { const ev = evidenceById(eid), s = ev && sourceById(ev.sourceId); return ev && s ? (
                      <div key={eid} className="ds-rec-ev"><header><b>Evidence {i + 1}</b><AuthorityBadge a={s.authority} /><Badge>{o.extraction}</Badge></header>
                        <p className="ds-quote" style={{ margin: 0 }}>{ev.excerpt}</p>
                        <div className="meta"><span>Source <b>{s.name}</b></span><span>Locator <b>{ev.locator}</b></span><span>Captured <b>{ev.capturedAt}</b></span>{ev.snapshotId && <span>Snapshot <b className="bw-mono">{ev.snapshotId}</b></span>}</div>
                        <div className="dw-hyp-a"><TraceBtn evidenceId={eid} label="Open provenance" /></div></div>
                    ) : null; })}
                  </div>
                )}
                <p className="dw-muted">Mirrors of the same text count as one independent source. Corroboration: {o.corroboration}.</p>
              </Section>
              <Section title="Confidence" hint="How the number is built"><ConfidenceBreakdown c={o.confidence} /></Section>
            </div>
            <Section title="History" hint="Versions are kept; a new value never overwrites the previous one">
              <ol className="dw-timeline" style={{ maxWidth: 'none' }}>
                {[...o.history].reverse().map((h, i) => <li key={h.at + h.value} style={{ gridTemplateColumns: '90px minmax(0,1fr) auto' }}><time>{h.at}</time><b>{h.value}</b><span>{i === 0 ? <Badge tone="success">Current</Badge> : <Badge>Superseded</Badge>} {h.evidenceId && <TraceBtn evidenceId={h.evidenceId} />}</span></li>)}
              </ol>
            </Section>
            {o.aiNote && <p className="ds-ai" style={{ margin: 0 }}><b>AI interpretation</b>{o.aiNote}</p>}
            <Section title="Related changes">
              {related.length === 0 ? <p className="dw-muted">No related changes found yet.</p> : <div className="dw-grid">{related.map((c) => <div key={c.id}><SemanticChange c={c} /><div className="dw-hyp-a" style={{ marginTop: 4 }}><Button size="sm" variant="ghost" onPress={() => go(dpath('changes', c.id))}>Review change</Button></div></div>)}</div>}
            </Section>
          </>
        )}
        {tab === 'cor' && (
          <Section title="Find corroboration" hint="Looks for other sources that state the same claim about the same subject">
            {cor === 'idle' && <Button size="sm" icon="search" onPress={runCor}>Run check</Button>}
            {cor === 'running' && <p className="dw-muted" role="status">Checking {others.length ? others.length : 'related'} sources and the evidence packs of {o.subject}…</p>}
            {cor === 'done' && (others.length === 0
              ? <Empty icon="search" title="No corroboration found yet." text={`No other source states this claim. It stays at its current confidence; a second source would raise it.${disagree ? ` ${disagree} observation(s) disagree: see Conflicts.` : ''}`} />
              : <ul className="dw-rels" aria-label="Corroborating observations">{others.map((x) => <li key={x.id}><div className="dw-rel"><b>{x.value}</b><span className="dw-muted">{sourceById(x.sourceId)?.name} · {x.observedAt.slice(0, 10)}</span><ConfChip v={score(x.confidence)} /><TraceBtn evidenceId={x.evidenceIds[0]} /><Button size="sm" variant="ghost" onPress={() => go(dpath('observations', x.id))}>Open</Button></div></li>)}</ul>)}
          </Section>
        )}
      </div>
    </div>
  );
}
