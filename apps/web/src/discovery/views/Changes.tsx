import { useMemo, useState } from 'react';
import { Badge, Button, Dialog, Icon } from '@biweb/ui';
import { useUi } from '../../state/ui-store';
import { CHANGES, stamp } from '../data/seed';
import { ago, changeById, evidenceById, inWeek, observationById, packForChange, snapshotsOf, sourceById, stats } from '../data/derive';
import { CAT_FILTERS, glyphOf, matchCat, useWatchExtra, watchEntityIds, type CatFilter } from '../data/missions';
import type { ChangeEvent, FetchSnapshot } from '../data/types';
import { useDs } from '../store';
import { AuthorityBadge, Chip, Empty, Grid, HealthBadge, Kv, LevelBadge, Section, SemanticChange, StepList, TraceBtn, ViewHead, dpath, useGo, type Col } from '../ui';
import './changes.css';

export function ChangesView({ id }: { id?: string }) {
  return id ? <ChangeDetail id={id} /> : <ChangeList />;
}

/* ───────── lista ───────── */
function ChangeList() {
  const go = useGo();
  const sel = useDs((s) => s.sel), resolved = useDs((s) => s.resolved), proposals = useDs((s) => s.proposals);
  const [period, setPeriod] = useState<'week' | 'all'>('week');
  const [cat, setCat] = useState<CatFilter>('All');
  const [ent, setEnt] = useState('');
  const week = stats({ resolved, proposals, extraMissions: 0 }).changesWeek;
  const base = useMemo(() => CHANGES.filter((c) => period === 'all' || inWeek(c)).sort((a, b) => a.detectedMin - b.detectedMin), [period]);
  const rows = base.filter((c) => matchCat(c, cat) && (!ent || c.entityId === ent));
  const entOpts = useMemo(() => Array.from(new Map(CHANGES.map((c) => [c.entityId, c.entity])).entries()).sort((a, b) => a[1].localeCompare(b[1])), []);
  const cols: Col<ChangeEvent>[] = [
    { key: 'e', label: 'Entity', w: '120px', render: (c) => <b>{c.entity}</b> },
    { key: 'k', label: 'Kind', w: '160px', render: (c) => <Badge tone={c.category === 'Pricing' ? 'warning' : 'accent'}>{c.kind}</Badge> },
    { key: 's', label: 'Change', w: 'minmax(180px, 2fr)', render: (c) => <button type="button" className="ds-ms-link" aria-label={`Open change: ${c.entity} ${c.semantic}`} onClick={(e) => { e.stopPropagation(); go(dpath('changes', c.id)); }}><span className={`ds-ch-g ${gcls(c)}`} aria-hidden="true">{glyphOf(c)}</span>{c.semantic}<span className="dw-muted"> · {c.scope}</span></button> },
    { key: 'ba', label: 'Before → After', w: 'minmax(200px, 2fr)', render: (c) => <span className="ds-ch-ba"><span className="o" title={c.before}>{c.before}</span><Icon name="arrowRight" size={12} /><span title={c.after}>{c.after}</span></span> },
    { key: 'd', label: 'Detected', w: '86px', render: (c) => ago(c.detectedMin) },
    { key: 'c', label: 'Confidence', w: '92px', render: (c) => <LevelBadge l={c.confidence} /> },
    { key: 'v', label: 'Evidence', w: '112px', render: (c) => <TraceBtn evidenceId={c.evidenceIds[0]} label={`${c.evidenceIds.length} evidence`} /> },
  ];
  return (
    <div className="dw-view ds-ch">
      <ViewHead title="Changes" sub="Semantic changes in what sources say. Never an HTML diff." />
      <p className="ds-wl-week" aria-live="polite">{period === 'week' ? 'This week' : 'All time'} — <b className="bw-num">{period === 'week' ? week : base.length}</b> relevant changes</p>
      <div className="dw-chips">
        <Chip on={period === 'week'} onClick={() => setPeriod('week')}>This week</Chip><Chip on={period === 'all'} onClick={() => setPeriod('all')}>All time</Chip>
        <span className="dw-muted" aria-hidden="true">|</span>
        {CAT_FILTERS.map((c) => <Chip key={c} on={cat === c} onClick={() => setCat(c)} n={base.filter((x) => matchCat(x, c)).length}>{c}</Chip>)}
        <label className="dw-sel">Entity<select value={ent} onChange={(e) => setEnt(e.target.value)} aria-label="Filter by entity"><option value="">All entities</option>{entOpts.map(([i, n]) => <option key={i} value={i}>{n}</option>)}</select></label>
      </div>
      <Grid label="Changes" cols={cols} rows={rows} id={(c) => c.id} selected={sel?.kind === 'change' ? sel.id : null} onRow={(c) => useDs.getState().select({ kind: 'change', id: c.id })} empty={<Empty icon="timeline" title="No relevant changes detected." text="Nothing matches this filter." />} />
    </div>
  );
}
const gcls = (c: ChangeEvent) => { const g = glyphOf(c); return g === '+' ? 'is-add' : g === '−' ? 'is-del' : 'is-mod'; };

/* ───────── diff estrutural e de linhas ───────── */
const STRUCT: Record<ChangeEvent['kind'], string> = { 'Pricing changed': 'Price changed', 'Capability added': 'Feature added', 'Integration added': 'Feature added', 'Documentation updated': 'Content modified', 'Location changed': 'Location changed', 'Product renamed': 'Product renamed', 'Feature removed': 'Feature removed' };
function semanticLines(c: ChangeEvent) {
  const none = (v: string) => v === '—' || v === '';
  const out: { op: 'Removed' | 'Added' | 'Modified'; text: string; from?: string }[] = [];
  if (none(c.before) && !none(c.after)) out.push({ op: 'Added', text: `${c.scope}: ${c.after}` });
  else if (!none(c.before) && none(c.after)) out.push({ op: 'Removed', text: `${c.scope}: ${c.before}` });
  else out.push({ op: 'Modified', text: `${c.scope}: ${c.after}`, from: c.before });
  return out;
}
function lineDiff(a: string[], b: string[]) {
  const n = a.length, m = b.length, L: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i]![j] = a[i] === b[j] ? (L[i + 1]![j + 1] ?? 0) + 1 : Math.max(L[i + 1]![j] ?? 0, L[i]![j + 1] ?? 0);
  const out: { t: 'same' | 'add' | 'del'; s: string }[] = []; let i = 0, j = 0;
  while (i < n && j < m) { if (a[i] === b[j]) { out.push({ t: 'same', s: a[i]! }); i++; j++; } else if ((L[i + 1]![j] ?? 0) >= (L[i]![j + 1] ?? 0)) { out.push({ t: 'del', s: a[i]! }); i++; } else { out.push({ t: 'add', s: b[j]! }); j++; } }
  while (i < n) out.push({ t: 'del', s: a[i++]! }); while (j < m) out.push({ t: 'add', s: b[j++]! });
  return out;
}

/* ───────── detalhe ───────── */
function ChangeDetail({ id }: { id: string }) {
  const go = useGo();
  const c = changeById(id);
  const aiOn = useUi((s) => s.aiEnabled);
  const [replay, setReplay] = useState(0);
  const [flow, setFlow] = useState(false);
  const [wl, setWl] = useState(false);
  if (!c) return <div className="dw-view"><Empty icon="timeline" title="Change not found" text="This change does not exist." action={<Button size="sm" onPress={() => go(dpath('changes'))}>Back to changes</Button>} /></div>;
  const src = sourceById(c.sourceId), pack = packForChange(c), obs = c.observationId ? observationById(c.observationId) : undefined;
  const sem = semanticLines(c);
  return (
    <div className="dw-view dw-view--flush ds-ch">
      <div className="dw-sh">
        <button type="button" className="dw-back" onClick={() => go(dpath('changes'))}><Icon name="arrowLeft" size={12} />Changes</button>
        <p className="ds-ch-kind">{c.kind} · {c.entity} · {c.scope}</p>
        <div className="dw-sh-facts">
          <Kv k="Previous" v={c.before} /><Kv k="Current" v={c.after} /><Kv k="Detected" v={`${stamp(c.detectedMin)} (${ago(c.detectedMin)})`} />
          <Kv k="Evidence" v={src?.name ?? '—'} /><Kv k="Confidence" v={<LevelBadge l={c.confidence} />} />
        </div>
      </div>
      <div className="dw-pad-v">
        <SemanticChange c={c} big />
        <div className="dw-chips">
          {aiOn && <Button size="sm" icon="copilot" onPress={() => useUi.getState().askCopilot('Explain this change')}>Ask Copilot</Button>}
          <Button size="sm" icon="bolt" onPress={() => setFlow(true)}>Create workflow from this event</Button>
          <Button size="sm" icon="eye" onPress={() => setWl(true)}>Add to watchlist</Button>
          {obs && <Button size="sm" variant="ghost" onPress={() => go(dpath('observations', obs.id))}>Open observation</Button>}
          {pack && <Button size="sm" variant="ghost" icon="book" onPress={() => go(dpath('evidence', pack.id))}>Evidence Pack</Button>}
        </div>
        {aiOn && obs?.aiNote && <div className="ds-ai"><b>AI interpretation</b>{obs.aiNote}<br /><span className="dw-muted">Not evidence. It explains the evidence below and can be wrong.</span></div>}

        <div className="ds-ch-two">
          <div style={{ display: 'grid', gap: 14, minWidth: 0 }}>
            <Section title="Before / after" hint="Structured semantic diff, not an HTML diff">
              <div className="dw-chips"><Badge tone={c.category === 'Pricing' ? 'warning' : 'accent'}>{STRUCT[c.kind]}</Badge><span className="dw-muted">{c.scope}</span></div>
              <div className="ds-ba">
                <div><h4>Before</h4>{c.before === '—' ? <p className="dw-muted">Nothing here before</p> : <p className="is-del">{c.before}</p>}</div>
                <div><h4>After</h4>{c.after === '—' ? <p className="dw-muted">Nothing here now</p> : <p className="is-add">{c.after}</p>}</div>
              </div>
              <ul className="ds-ch-diff" aria-label="Content changes">{sem.map((l) => <li key={l.op} className={l.op === 'Removed' ? 'is-del' : l.op === 'Added' ? 'is-add' : ''}><b aria-hidden="true">{l.op === 'Removed' ? '−' : l.op === 'Added' ? '+' : '~'}</b><span><b>{l.op}</b> {l.text}{l.from ? ` (was ${l.from})` : ''}</span></li>)}</ul>
              <div key={replay} className="ds-ch-hl is-play" aria-label="Old to new"><span className="o">{c.before}</span><Icon name="arrowRight" size={12} /><span className="n">{c.after}</span><span className="flex-1" /><Button size="sm" variant="ghost" onPress={() => setReplay(replay + 1)}>Replay old ↔ new</Button></div>
            </Section>
            <Section title="Evidence" hint={`${c.evidenceIds.length} item${c.evidenceIds.length === 1 ? '' : 's'}`}>
              {c.evidenceIds.length === 0 ? <div className="ds-ch-card"><Badge tone="warning" icon="warning">Needs verification</Badge><span className="dw-muted">No evidence has been attached to this change yet. Confidence is {c.confidence}.</span></div> : (
                <ul className="ds-ch-ev">{c.evidenceIds.map((eid) => { const ev = evidenceById(eid), s = ev ? sourceById(ev.sourceId) : undefined; return (
                  <li key={eid}><div className="dw-chips"><b>{s?.name ?? eid}</b>{ev && <Badge tone={ev.role === 'Primary' ? 'success' : 'neutral'}>{ev.role}</Badge>}<span className="flex-1" /><TraceBtn evidenceId={eid} /></div>{ev && <><q>{ev.excerpt}</q><span className="dw-muted">{ev.locator} · captured {ev.capturedAt}</span></>}</li>); })}</ul>
              )}
            </Section>
            <Snapshots c={c} />
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {src && (
              <Section title="Source">
                <div className="ds-ch-card"><b>{src.name}</b><span className="bw-mono dw-muted">{src.url}</span><div className="dw-chips"><AuthorityBadge a={src.authority} /><HealthBadge s={src} /></div><span className="dw-muted">Last checked {ago(src.lastCheckedMin)} · {src.snapshots} snapshots</span><Button size="sm" onPress={() => go(dpath('sources', src.id))}>Open source</Button></div>
              </Section>
            )}
            <Section title="Entity"><div className="ds-ch-card"><b>{c.entity}</b><Button size="sm" onPress={() => go(dpath('entities', c.entityId))}>Open entity</Button></div></Section>
          </div>
        </div>
      </div>
      <FlowDialog c={c} open={flow} onClose={() => setFlow(false)} />
      <WatchDialog c={c} open={wl} onClose={() => setWl(false)} />
    </div>
  );
}

function Snapshots({ c }: { c: ChangeEvent }) {
  const snaps = useMemo(() => snapshotsOf(c.sourceId), [c.sourceId]);
  const byId = (i?: string) => snaps.find((s) => s.id === i);
  const init = (c.snapshotIds ? [c.snapshotIds[0], c.snapshotIds[1]] : [snaps[1]?.id ?? '', snaps[0]?.id ?? '']).filter(Boolean);
  const [pick, setPick] = useState<string[]>(init);
  const [pair, setPair] = useState<string[]>(init);
  const toggle = (sid: string) => setPick((p) => (p.includes(sid) ? p.filter((x) => x !== sid) : [...p.slice(-1), sid]));
  const sorted = pair.map(byId).filter((s): s is FetchSnapshot => !!s).sort((a, b) => a.at.localeCompare(b.at));
  const first = c.after === '—' ? undefined : [...snaps].sort((a, b) => a.at.localeCompare(b.at)).find((s) => s.lines.some((l) => l.includes(c.after)));
  return (
    <Section title="Snapshots" hint="Captured copies of the source, used to prove when the change appeared">
      <p className="dw-muted" aria-live="polite">{first ? <>First seen in snapshot <b>{first.at}</b>.</> : 'The new value is not present in the stored snapshots of this source.'}</p>
      <ul className="ds-ch-snaps">
        {snaps.map((s) => <li key={s.id}><label><input type="checkbox" checked={pick.includes(s.id)} onChange={() => toggle(s.id)} aria-label={`Select snapshot ${s.at}`} /><span className="bw-mono">{s.at}</span></label><span className="dw-muted">{s.lines.length} lines{s.note ? ` · ${s.note}` : ''}</span>{first?.id === s.id && <Badge tone="accent">First seen</Badge>}</li>)}
      </ul>
      <div className="dw-chips"><Button size="sm" isDisabled={pick.length !== 2} onPress={() => setPair(pick)}>Compare</Button><span className="dw-muted">Pick two snapshots.</span></div>
      {sorted.length === 2 && (
        <ul className="ds-ch-diff" aria-label={`Line diff ${sorted[0]!.at} to ${sorted[1]!.at}`}>
          {lineDiff(sorted[0]!.lines, sorted[1]!.lines).map((d, i) => <li key={i} className={`is-${d.t}`}><b aria-hidden="true">{d.t === 'add' ? '+' : d.t === 'del' ? '−' : ' '}</b><span>{d.s}</span></li>)}
        </ul>
      )}
      {sorted.length === 2 && <p className="dw-muted">{sorted[0]!.at} → {sorted[1]!.at}</p>}
    </Section>
  );
}

function FlowDialog({ c, open, onClose }: { c: ChangeEvent; open: boolean; onClose: () => void }) {
  const go = useGo();
  const steps = [`Trigger: ${c.kind} detected for ${c.entity}`, 'Review evidence', 'Notify Commercial Team', 'Update Competitive Dashboard'];
  const confirm = () => { useDs.getState().setHandoff({ kind: 'workflow', label: `${c.kind}: ${c.entity}`, changeId: c.id }); useDs.getState().toast('Workflow draft created from this change'); onClose(); go('/workflows'); };
  return (
    <Dialog title="Create workflow from this event" isOpen={open} onOpenChange={(o) => { if (!o) onClose(); }} footer={<><Button size="sm" variant="ghost" onPress={onClose}>Cancel</Button><Button size="sm" variant="primary" onPress={confirm}>Create and open Workflows</Button></>}>
      <p className="dw-muted">The workflow starts as a draft. A person reviews the evidence before anything is notified or updated.</p>
      <StepList steps={steps} at={steps.length} />
    </Dialog>
  );
}

function WatchDialog({ c, open, onClose }: { c: ChangeEvent; open: boolean; onClose: () => void }) {
  const lists = useDs((s) => s.watchlists), extra = useWatchExtra((s) => s.extra), add = useWatchExtra((s) => s.add);
  const [wid, setWid] = useState('');
  const chosen = lists.find((w) => w.id === (wid || lists[0]?.id));
  const confirm = () => {
    if (!chosen) return;
    if (watchEntityIds(chosen, extra).includes(c.entityId)) useDs.getState().toast(`${c.entity} is already in ${chosen.name}`);
    else { add(chosen.id, c.entityId); useDs.getState().toast(`${c.entity} added to ${chosen.name}`); }
    onClose();
  };
  return (
    <Dialog title="Add to watchlist" isOpen={open} onOpenChange={(o) => { if (!o) onClose(); }} footer={<><Button size="sm" variant="ghost" onPress={onClose}>Cancel</Button><Button size="sm" variant="primary" isDisabled={!chosen} onPress={confirm}>Add {c.entity}</Button></>}>
      {lists.length === 0 ? <p>Create a watchlist to continuously monitor external entities.</p> : (
        <label className="dw-muted" style={{ display: 'grid', gap: 4 }}>Watchlist<select className="ds-ms-in" value={chosen?.id ?? ''} onChange={(e) => setWid(e.target.value)} aria-label="Watchlist">{lists.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>
      )}
    </Dialog>
  );
}
