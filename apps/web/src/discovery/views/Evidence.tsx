import { Badge, Button, Icon } from '@biweb/ui';
import { DOCUMENTS, EVIDENCE_PACKS } from '../data/seed';
import { entityById, evidenceById, packById, sourceById } from '../data/derive';
import { evidenceTitle, independentSources, mirrorsOf, packConfidence, packObservation, packScore } from '../data/records';
import type { Evidence, EvidencePack } from '../data/types';
import { useDs } from '../store';
import { AuthorityBadge, ConfChip, ConfidenceBreakdown, Empty, Grid, Kv, LevelBadge, Section, TraceBtn, ViewHead, dpath, useGo, type Col } from '../ui';
import { RecLink } from './EntityActions';
import './records.css';

export function EvidenceView({ id }: { id?: string }) { return id ? <PackDetail id={id} /> : <PackList />; }

function PackList() {
  const go = useGo();
  const sel = useDs((s) => s.sel);
  const cols: Col<EvidencePack>[] = [
    { key: 'c', label: 'Claim', w: 'minmax(220px,2.2fr)', render: (p) => <RecLink onOpen={() => go(dpath('evidence', p.id))}>{p.claim}</RecLink> },
    { key: 's', label: 'Subject', w: '110px', render: (p) => entityById(p.subjectId)?.name ?? p.subjectId },
    { key: 'n', label: 'Evidence', w: '70px', right: true, render: (p) => <span className="bw-num">{p.evidence.length}</span> },
    { key: 'f', label: 'First observed', w: '104px', render: (p) => p.firstObserved },
    { key: 'l', label: 'Last confirmed', w: '104px', render: (p) => p.lastConfirmed },
    { key: 'x', label: 'Contradictions', w: '150px', render: (p) => (p.contradictions === 'None' || p.contradictions.startsWith('None') ? <Badge tone="success">{p.contradictions}</Badge> : <Badge tone="warning" icon="warning">{p.contradictions}</Badge>) },
    { key: 'cf', label: 'Confidence', w: '104px', render: (p) => <ConfChip v={packScore(p)} needs /> },
  ];
  return (
    <div className="dw-view">
      <ViewHead title="Evidence" sub="Each claim with the sources that support it. Open a pack to read the excerpts and see how confidence is built." />
      <Grid label="Evidence packs" cols={cols} rows={EVIDENCE_PACKS} id={(p) => p.id} selected={sel?.kind === 'evidence' ? sel.id : null} onRow={(p) => useDs.getState().select({ kind: 'evidence', id: p.evidence[0] ?? p.id })} empty={<p className="dw-more">No observations found yet.</p>} />
      <DocIntel />
    </div>
  );
}

const FIELD_EVIDENCE: Record<string, string> = { Revenue: 'e-fibra-pdf', Regions: 'e-fibra-pdf' };
function DocIntel() {
  const go = useGo();
  return (
    <Section title="Document intelligence" hint="The BDE discovers and interprets external documents; the LDE organizes internal and approved data.">
      {DOCUMENTS.map((d) => {
        const src = sourceById(d.sourceId);
        return (
          <div key={d.id} className="dw-card" style={{ alignItems: 'stretch', gap: 10 }}>
            <div className="ds-rec-flow"><span><Icon name="report" size={12} /> <b>{d.name}</b>{d.pages ? ` · ${d.pages} pages` : ''}</span><Icon name="arrowRight" size={12} /><span>Extracted fields ({d.extracted.length})</span><Icon name="arrowRight" size={12} /><span>Observations</span><Icon name="arrowRight" size={12} /><span>Evidence</span></div>
            <div className="dw-table" role="table" aria-label={`Fields extracted from ${d.name}`}>
              {d.extracted.map((f) => <div key={f.field} className="dw-tr" role="row" style={{ gridTemplateColumns: '110px minmax(0,1fr) 150px' }}><b role="cell">{f.field}</b><span role="cell">{f.value}</span><span role="cell"><TraceBtn evidenceId={FIELD_EVIDENCE[f.field]} /></span></div>)}
            </div>
            <p className="dw-muted" style={{ margin: 0 }}>Only fields with a captured page and region are traceable; the rest stay marked Needs verification until a reviewer confirms them.{src && <> Source: <RecLink onOpen={() => go(dpath('sources', src.id))}>{src.name}</RecLink> · <AuthorityBadge a={src.authority} /></>}</p>
          </div>
        );
      })}
    </Section>
  );
}

function PackDetail({ id }: { id: string }) {
  const go = useGo();
  const pack: EvidencePack | undefined = packById(id) ?? (evidenceById(id) ? EVIDENCE_PACKS.find((p) => p.evidence.includes(id)) : undefined);
  if (!pack) return <div className="dw-view"><Empty icon="book" title="No observations found yet." text="There is no evidence pack for this id." action={<Button size="sm" onPress={() => go(dpath('evidence'))}>Back to evidence</Button>} /></div>;
  const evs = pack.evidence.map((e) => evidenceById(e)).filter((e): e is Evidence => !!e);
  const obs = packObservation(pack);
  const conf = obs?.confidence ?? packConfidence(pack);
  const sources = independentSources(pack.evidence);
  const mirrorInfo = [...sources].map((sid) => ({ sid, m: mirrorsOf(sid) })).filter((x) => x.m.length);
  const e = entityById(pack.subjectId);
  const open = pack.contradictions !== 'None' && !pack.contradictions.startsWith('None');
  return (
    <div className="dw-view dw-view--flush">
      <div className="dw-sh">
        <button type="button" className="dw-back" onClick={() => go(dpath('evidence'))}><Icon name="arrowLeft" size={12} />Evidence</button>
        <div className="dw-sh-main"><h2>Evidence pack</h2><Badge>{evs.length} evidence</Badge>{open ? <Badge tone="warning" icon="warning">{pack.contradictions}</Badge> : <Badge tone="success" icon="check">No contradictions</Badge>}<span className="flex-1" />
          {e && <Button size="sm" icon="cube" onPress={() => go(dpath('entities', e.id))}>Open {e.name}</Button>}
          {obs && <Button size="sm" icon="list" onPress={() => go(dpath('observations', obs.id))}>Open observation</Button>}
          {open && <Button size="sm" icon="warning" onPress={() => go(dpath('conflicts'))}>Review conflict</Button>}
        </div>
        <div className="dw-sh-facts"><Kv k="Subject" v={e?.name ?? pack.subjectId} /><Kv k="First observed" v={pack.firstObserved} /><Kv k="Last confirmed" v={pack.lastConfirmed} /><Kv k="Contradictions" v={pack.contradictions} /><Kv k="Independent sources" v={sources.size} /></div>
      </div>
      <div className="dw-pad-v">
        <Section title="Claim"><p className="ds-rec-claim">{pack.claim}</p></Section>
        <Section title="Evidence" hint="Every card opens its source provenance">
          <div className="ds-rec-evs">
            {evs.map((ev, i) => { const s = sourceById(ev.sourceId); return (
              <div key={ev.id} className="ds-rec-ev">
                <header><b>Evidence {i + 1}</b><span className="dw-muted">{evidenceTitle(ev)}</span></header>
                <div className="dw-hyp-a"><Badge tone={ev.role === 'Primary' ? 'success' : 'neutral'}>{ev.role}</Badge><LevelBadge l={ev.strength} />{s && <AuthorityBadge a={s.authority} />}</div>
                <p className="ds-quote" style={{ margin: 0 }}>{ev.excerpt}</p>
                <div className="meta"><span>Source <b>{s ? <RecLink onOpen={() => go(dpath('sources', s.id))}>{s.name}</RecLink> : ev.sourceId}</b></span><span>Locator <b>{ev.locator}</b></span><span>Captured <b>{ev.capturedAt}</b></span></div>
                <div className="dw-hyp-a"><TraceBtn evidenceId={ev.id} label="Open provenance" /></div>
              </div>
            ); })}
          </div>
          <p className="dw-note"><Icon name="info" size={12} />{mirrorInfo.length ? mirrorInfo.map((x) => `1 original + ${x.m.length} mirrors = 1 independent evidence (${sourceById(x.sid)?.name}).`).join(' ') : `${sources.size} independent source${sources.size === 1 ? '' : 's'}; no syndicated mirrors detected. Copies of the same text would count once.`}</p>
        </Section>
        <div className="dw-grid2">
          <Section title="Confidence" hint={obs ? 'From the linked observation' : 'Computed from the roles and strengths of the evidence'}><ConfidenceBreakdown c={conf} /></Section>
          <Section title="Contradictions">{open ? <p style={{ margin: 0 }}>{pack.contradictions}. The sources disagree on the value; a reviewer decides in Conflicts.</p> : <p className="dw-muted" style={{ margin: 0 }}>No conflicting evidence found.</p>}</Section>
        </div>
        {pack.id === 'p-fibra-bb' && <DocIntel />}
      </div>
    </div>
  );
}
