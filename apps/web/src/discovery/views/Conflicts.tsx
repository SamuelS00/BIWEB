import { useState } from 'react';
import { Badge, Button, Icon } from '@biweb/ui';
import { CONFLICTS } from '../data/seed';
import { entityById, evidenceById, observationById, sourceById } from '../data/derive';
import { CONFLICT_OBS } from '../data/records';
import type { Conflict } from '../data/types';
import { useDs } from '../store';
import { AuthorityBadge, Chip, ConfidenceBreakdown, Empty, Grid, Kv, Section, TraceBtn, ViewHead, dpath, useGo, type Col } from '../ui';
import { RecLink } from './EntityActions';
import './records.css';

export function ConflictsView({ id }: { id?: string }) { return id ? <Review id={id} /> : <ConflictList />; }

const valueOf = (c: Conflict, r: 'a' | 'b') => c[r].value;

function ConflictList() {
  const go = useGo();
  const resolved = useDs((s) => s.resolved);
  const sel = useDs((s) => s.sel);
  const [f, setF] = useState<'open' | 'resolved' | 'all'>('open');
  const open = CONFLICTS.filter((c) => !resolved[c.id]).length;
  const rows = CONFLICTS.filter((c) => (f === 'all' ? true : f === 'open' ? !resolved[c.id] : !!resolved[c.id]));
  const cols: Col<Conflict>[] = [
    { key: 'e', label: 'Entity · field', w: 'minmax(180px,1.4fr)', render: (c) => <RecLink onOpen={() => go(dpath('conflicts', c.id))}>{c.entity} · {c.field}</RecLink> },
    { key: 'a', label: 'Version A', w: 'minmax(140px,1.2fr)', render: (c) => <span className="ds-rec-two"><b>{c.a.value}</b><small>{c.a.label} · {c.a.updated}</small></span> },
    { key: 'b', label: 'Version B', w: 'minmax(140px,1.2fr)', render: (c) => <span className="ds-rec-two"><b>{c.b.value}</b><small>{c.b.label} · {c.b.updated}</small></span> },
    { key: 'r', label: 'Recommended', w: '150px', render: (c) => valueOf(c, c.recommended) },
    { key: 's', label: 'State', w: '170px', render: (c) => (resolved[c.id] ? <Badge tone="success" icon="check">Resolved: {valueOf(c, resolved[c.id]!)}</Badge> : <Badge tone="warning" icon="warning">Open</Badge>) },
  ];
  return (
    <div className="dw-view">
      <ViewHead title="Conflicts" sub={`${open} open. When sources disagree, the BDE shows both sides, recommends one and never decides silently.`} />
      <span className="dw-chips" role="group" aria-label="State"><Chip on={f === 'open'} onClick={() => setF('open')} n={open}>Open</Chip><Chip on={f === 'resolved'} onClick={() => setF('resolved')} n={CONFLICTS.length - open}>Resolved</Chip><Chip on={f === 'all'} onClick={() => setF('all')} n={CONFLICTS.length}>All</Chip></span>
      {rows.length === 0 ? <Empty icon="check" title={f === 'resolved' ? 'No resolved conflicts yet.' : 'No conflicting evidence found.'} text={f === 'resolved' ? 'Resolved conflicts are listed here.' : 'Every claim currently agrees across sources.'} /> : (
        <Grid label="Conflicts" cols={cols} rows={rows} id={(c) => c.id} selected={sel?.kind === 'conflict' ? sel.id : null} onRow={(c) => useDs.getState().select({ kind: 'conflict', id: c.id })} />
      )}
    </div>
  );
}

function Review({ id }: { id: string }) {
  const go = useGo();
  const res = useDs((s) => s.resolved[id]);
  const [kept, setKept] = useState(false);
  const c = CONFLICTS.find((x) => x.id === id);
  if (!c) return <div className="dw-view"><Empty icon="warning" title="Conflict not found" text="No conflicting evidence found for this id." action={<Button size="sm" onPress={() => go(dpath('conflicts'))}>Back to conflicts</Button>} /></div>;
  const rec = c.recommended, alt = rec === 'a' ? 'b' : 'a';
  const pair = CONFLICT_OBS[c.id];
  const apply = (pick: 'a' | 'b') => { useDs.getState().resolve(c.id, pick); setKept(false); useDs.getState().toast(`Conflict resolved: ${c[pick].value} — visible across Discovery`); };
  const e = entityById(c.entityId);
  const Side = ({ k }: { k: 'a' | 'b' }) => {
    const v = c[k], src = sourceById(v.sourceId), o = pair ? observationById(pair[k]) : undefined;
    const evIds = o?.evidenceIds ?? [];
    const cls = res ? (res === k ? 'is-won' : 'is-lost') : rec === k ? 'is-rec' : '';
    return (
      <div className={`ds-rec-side ${cls}`}>
        <h4>Version {k.toUpperCase()} · {v.label}</h4>
        <div className="ds-rec-val">{v.value}</div>
        <div className="dw-hyp-a">{rec === k && !res && <Badge tone="accent">Recommended</Badge>}{res === k && <Badge tone="success" icon="check">Accepted</Badge>}{res && res !== k && <Badge>Superseded</Badge>}{src && <AuthorityBadge a={src.authority} />}</div>
        <div className="dw-facts dw-facts--col"><Kv k="Updated" v={v.updated} /><Kv k="Source" v={src ? <RecLink onOpen={() => go(dpath('sources', src.id))}>{src.name}</RecLink> : v.sourceId} /></div>
        <div className="dw-hyp-a">{evIds.length ? evIds.map((ev) => <TraceBtn key={ev} evidenceId={ev} label={evidenceById(ev)?.locator ?? 'Evidence'} />) : <TraceBtn />}</div>
        {!evIds.length && <p className="dw-muted" style={{ margin: 0 }}>No captured evidence for this side yet. The value comes from the source record only.</p>}
        {o ? <ConfidenceBreakdown c={o.confidence} /> : <p className="dw-muted" style={{ margin: 0 }}>Confidence cannot be decomposed: no observation recorded for this side.</p>}
      </div>
    );
  };
  return (
    <div className="dw-view dw-view--flush">
      <div className="dw-sh">
        <button type="button" className="dw-back" onClick={() => go(dpath('conflicts'))}><Icon name="arrowLeft" size={12} />Conflicts</button>
        <div className="dw-sh-main"><h2>Conflict Review</h2>{res ? <Badge tone="success" icon="check">Resolved</Badge> : <Badge tone="warning" icon="warning">Open</Badge>}<span className="flex-1" />{e && <Button size="sm" icon="cube" onPress={() => go(dpath('entities', e.id))}>Open {e.name}</Button>}</div>
        <div className="dw-sh-facts"><Kv k="Entity" v={c.entity} /><Kv k="Field" v={c.field} /><Kv k="Recommended" v={valueOf(c, rec)} /><Kv k="Reason" v={c.reason} />{res && <Kv k="Resolved value" v={valueOf(c, res)} />}</div>
      </div>
      <div className="dw-pad-v">
        <p className="ds-rec-claim">{c.entity} · {c.field}</p>
        <div className="ds-rec-vs"><Side k="a" /><Side k="b" /></div>
        {res ? (
          <p className="dw-note" role="status"><Icon name="check" size={12} />Resolved: {valueOf(c, res)}. The other version is kept as superseded history; the change is visible across Discovery.</p>
        ) : (
          <Section title="Decision" hint="A person applies it; the BDE only recommends">
            <p className="dw-muted" style={{ margin: 0 }}>Recommended: {valueOf(c, rec)}. Reason: {c.reason.toLowerCase()}.</p>
            <div className="dw-hyp-a">
              <Button size="sm" variant="primary" icon="check" onPress={() => apply(rec)}>Accept recommendation</Button>
              <Button size="sm" onPress={() => apply(alt)}>Select alternative ({valueOf(c, alt)})</Button>
              <Button size="sm" variant="ghost" onPress={() => { setKept(true); useDs.getState().toast('Conflict kept open'); }}>Keep conflict open</Button>
            </div>
            {kept && <p className="dw-note" role="status"><Icon name="info" size={12} />Kept open. Both versions stay visible, marked as conflicted, until someone decides.</p>}
          </Section>
        )}
      </div>
    </div>
  );
}
