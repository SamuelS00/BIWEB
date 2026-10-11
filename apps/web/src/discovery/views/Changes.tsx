import { useMemo, useState } from 'react';
import { Badge, Button, Dialog, Icon } from '@biweb/ui';
import { useUi } from '../../state/ui-store';
import { CHANGES, stamp } from '../data/seed';
import { changeById, evidenceById, inWeek, observationById, packForChange, snapshotsOf, sourceById, stats } from '../data/derive';
import { CAT_FILTERS, glyphOf, matchCat, useWatchExtra, watchEntityIds, type CatFilter } from '../data/missions';
import type { ChangeEvent, FetchSnapshot } from '../data/types';
import { useDs } from '../store';
import { AuthorityBadge, Chip, Empty, Grid, HealthBadge, Kv, LevelBadge, Section, SemanticChange, StepList, TraceBtn, ViewHead, dpath, useGo, type Col } from '../ui';
import './changes.css';
import { useT } from '../../i18n/intl';
import type { MessageId } from '../../i18n/catalog';
import { CAT_ID, KIND_ID, LEVEL_ID, agoT } from '../data/work-i18n';

export function ChangesView({ id }: { id?: string }) {
  return id ? <ChangeDetail id={id} /> : <ChangeList />;
}

/* ───────── lista ───────── */
function ChangeList() {
  const t = useT();
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
    { key: 'e', label: t('discovery.changes.col.entity'), w: '120px', render: (c) => <b>{c.entity}</b> },
    { key: 'k', label: t('discovery.changes.col.kind'), w: '160px', render: (c) => <Badge tone={c.category === 'Pricing' ? 'warning' : 'accent'}>{t(KIND_ID[c.kind])}</Badge> },
    { key: 's', label: t('discovery.changes.col.change'), w: 'minmax(180px, 2fr)', render: (c) => <button type="button" className="ds-ms-link" aria-label={t('discovery.changes.openChangeAria', { entity: c.entity, semantic: c.semantic })} onClick={(e) => { e.stopPropagation(); go(dpath('changes', c.id)); }}><span className={`ds-ch-g ${gcls(c)}`} aria-hidden="true">{glyphOf(c)}</span>{c.semantic}<span className="dw-muted"> · {c.scope}</span></button> },
    { key: 'ba', label: t('discovery.changes.col.beforeAfter'), w: 'minmax(200px, 2fr)', render: (c) => <span className="ds-ch-ba"><span className="o" title={c.before}>{c.before}</span><Icon name="arrowRight" size={12} /><span title={c.after}>{c.after}</span></span> },
    { key: 'd', label: t('discovery.changes.col.detected'), w: '86px', render: (c) => agoT(t, c.detectedMin) },
    { key: 'c', label: t('discovery.changes.col.confidence'), w: '92px', render: (c) => <LevelBadge l={c.confidence} /> },
    { key: 'v', label: t('discovery.changes.col.evidence'), w: '112px', render: (c) => <TraceBtn evidenceId={c.evidenceIds[0]} label={t('discovery.changes.evidenceCount', { n: c.evidenceIds.length })} /> },
  ];
  return (
    <div className="dw-view ds-ch">
      <ViewHead title={t('discovery.changes.title')} sub={t('discovery.changes.sub')} />
      <p className="ds-wl-week" aria-live="polite">{t(period === 'week' ? 'discovery.changes.periodWeek' : 'discovery.changes.periodAll')}: <b className="bw-num">{period === 'week' ? week : base.length}</b> {t('discovery.changes.relevant', { n: period === 'week' ? week : base.length })}</p>
      <div className="dw-chips">
        <Chip on={period === 'week'} onClick={() => setPeriod('week')}>{t('discovery.changes.periodWeek')}</Chip><Chip on={period === 'all'} onClick={() => setPeriod('all')}>{t('discovery.changes.periodAll')}</Chip>
        <span className="dw-muted" aria-hidden="true">|</span>
        {CAT_FILTERS.map((c) => <Chip key={c} on={cat === c} onClick={() => setCat(c)} n={base.filter((x) => matchCat(x, c)).length}>{t(CAT_ID[c])}</Chip>)}
        <label className="dw-sel">{t('discovery.changes.entityFilter')}<select value={ent} onChange={(e) => setEnt(e.target.value)} aria-label={t('discovery.changes.entityFilterAria')}><option value="">{t('discovery.changes.allEntities')}</option>{entOpts.map(([i, n]) => <option key={i} value={i}>{n}</option>)}</select></label>
      </div>
      <Grid label={t('discovery.changes.gridLabel')} cols={cols} rows={rows} id={(c) => c.id} selected={sel?.kind === 'change' ? sel.id : null} onRow={(c) => useDs.getState().select({ kind: 'change', id: c.id })} empty={<Empty icon="timeline" title={t('discovery.changes.emptyTitle')} text={t('discovery.changes.emptyText')} />} />
    </div>
  );
}
const gcls = (c: ChangeEvent) => { const g = glyphOf(c); return g === '+' ? 'is-add' : g === '−' ? 'is-del' : 'is-mod'; };

/* ───────── diff estrutural e de linhas ───────── */
const STRUCT: Record<ChangeEvent['kind'], MessageId> = { 'Pricing changed': 'discovery.changes.struct.price', 'Capability added': 'discovery.changes.struct.feature', 'Integration added': 'discovery.changes.struct.feature', 'Documentation updated': 'discovery.changes.struct.content', 'Location changed': 'discovery.changes.struct.location', 'Product renamed': 'discovery.changes.struct.renamed', 'Feature removed': 'discovery.changes.struct.removed' };
const OP_ID: Record<'Removed' | 'Added' | 'Modified', MessageId> = { Removed: 'discovery.changes.op.removed', Added: 'discovery.changes.op.added', Modified: 'discovery.changes.op.modified' };
const ROLE_ID: Record<'Primary' | 'Secondary', MessageId> = { Primary: 'discovery.changes.ev.primary', Secondary: 'discovery.changes.ev.secondary' };
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
  const t = useT();
  const go = useGo();
  const c = changeById(id);
  const aiOn = useUi((s) => s.aiEnabled);
  const [replay, setReplay] = useState(0);
  const [flow, setFlow] = useState(false);
  const [wl, setWl] = useState(false);
  if (!c) return <div className="dw-view"><Empty icon="timeline" title={t('discovery.changes.notFound')} text={t('discovery.changes.notFoundText')} action={<Button size="sm" onPress={() => go(dpath('changes'))}>{t('discovery.changes.backToChanges')}</Button>} /></div>;
  const src = sourceById(c.sourceId), pack = packForChange(c), obs = c.observationId ? observationById(c.observationId) : undefined;
  const sem = semanticLines(c);
  return (
    <div className="dw-view dw-view--flush ds-ch">
      <div className="dw-sh">
        <button type="button" className="dw-back" onClick={() => go(dpath('changes'))}><Icon name="arrowLeft" size={12} />{t('discovery.nav.changes')}</button>
        <p className="ds-ch-kind">{t(KIND_ID[c.kind])} · {c.entity} · {c.scope}</p>
        <div className="dw-sh-facts">
          <Kv k={t('discovery.changes.fact.previous')} v={c.before} /><Kv k={t('discovery.changes.fact.current')} v={c.after} /><Kv k={t('discovery.changes.fact.detected')} v={`${stamp(c.detectedMin)} (${agoT(t, c.detectedMin)})`} />
          <Kv k={t('discovery.changes.fact.evidence')} v={src?.name ?? '—'} /><Kv k={t('discovery.changes.fact.confidence')} v={<LevelBadge l={c.confidence} />} />
        </div>
      </div>
      <div className="dw-pad-v">
        <SemanticChange c={c} big />
        <div className="dw-chips">
          {aiOn && <Button size="sm" icon="copilot" onPress={() => useUi.getState().askCopilot(t('discovery.changes.askCopilotPrompt'))}>{t('discovery.changes.askCopilot')}</Button>}
          <Button size="sm" icon="bolt" onPress={() => setFlow(true)}>{t('discovery.changes.createWorkflow')}</Button>
          <Button size="sm" icon="eye" onPress={() => setWl(true)}>{t('discovery.changes.addToWatchlist')}</Button>
          {obs && <Button size="sm" variant="ghost" onPress={() => go(dpath('observations', obs.id))}>{t('discovery.changes.openObservation')}</Button>}
          {pack && <Button size="sm" variant="ghost" icon="book" onPress={() => go(dpath('evidence', pack.id))}>{t('discovery.changes.evidencePack')}</Button>}
        </div>
        {aiOn && obs?.aiNote && <div className="ds-ai"><b>{t('discovery.changes.ai.title')}</b>{obs.aiNote}<br /><span className="dw-muted">{t('discovery.changes.ai.note')}</span></div>}

        <div className="ds-ch-two">
          <div style={{ display: 'grid', gap: 14, minWidth: 0 }}>
            <Section title={t('discovery.changes.ba.title')} hint={t('discovery.changes.ba.hint')}>
              <div className="dw-chips"><Badge tone={c.category === 'Pricing' ? 'warning' : 'accent'}>{t(STRUCT[c.kind])}</Badge><span className="dw-muted">{c.scope}</span></div>
              <div className="ds-ba">
                <div><h4>{t('discovery.changes.ba.before')}</h4>{c.before === '—' ? <p className="dw-muted">{t('discovery.changes.ba.nothingBefore')}</p> : <p className="is-del">{c.before}</p>}</div>
                <div><h4>{t('discovery.changes.ba.after')}</h4>{c.after === '—' ? <p className="dw-muted">{t('discovery.changes.ba.nothingNow')}</p> : <p className="is-add">{c.after}</p>}</div>
              </div>
              <ul className="ds-ch-diff" aria-label={t('discovery.changes.ba.contentAria')}>{sem.map((l) => <li key={l.op} className={l.op === 'Removed' ? 'is-del' : l.op === 'Added' ? 'is-add' : ''}><b aria-hidden="true">{l.op === 'Removed' ? '−' : l.op === 'Added' ? '+' : '~'}</b><span><b>{t(OP_ID[l.op])}</b> {l.text}{l.from ? ` ${t('discovery.changes.wasFrom', { from: l.from })}` : ''}</span></li>)}</ul>
              <div key={replay} className="ds-ch-hl is-play" aria-label={t('discovery.changes.oldToNewAria')}><span className="o">{c.before}</span><Icon name="arrowRight" size={12} /><span className="n">{c.after}</span><span className="flex-1" /><Button size="sm" variant="ghost" onPress={() => setReplay(replay + 1)}>{t('discovery.changes.replay')}</Button></div>
            </Section>
            <Section title={t('discovery.changes.ev.title')} hint={t('discovery.changes.ev.hint', { n: c.evidenceIds.length })}>
              {c.evidenceIds.length === 0 ? <div className="ds-ch-card"><Badge tone="warning" icon="warning">{t('discovery.changes.ev.needsVerification')}</Badge><span className="dw-muted">{t('discovery.changes.ev.none', { level: t(LEVEL_ID[c.confidence]) })}</span></div> : (
                <ul className="ds-ch-ev">{c.evidenceIds.map((eid) => { const ev = evidenceById(eid), s = ev ? sourceById(ev.sourceId) : undefined; return (
                  <li key={eid}><div className="dw-chips"><b>{s?.name ?? eid}</b>{ev && <Badge tone={ev.role === 'Primary' ? 'success' : 'neutral'}>{t(ROLE_ID[ev.role])}</Badge>}<span className="flex-1" /><TraceBtn evidenceId={eid} /></div>{ev && <><q>{ev.excerpt}</q><span className="dw-muted">{t('discovery.changes.ev.captured', { locator: ev.locator, at: ev.capturedAt })}</span></>}</li>); })}</ul>
              )}
            </Section>
            <Snapshots c={c} />
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {src && (
              <Section title={t('discovery.changes.src.title')}>
                <div className="ds-ch-card"><b>{src.name}</b><span className="bw-mono dw-muted">{src.url}</span><div className="dw-chips"><AuthorityBadge a={src.authority} /><HealthBadge s={src} /></div><span className="dw-muted">{t('discovery.changes.src.lastChecked', { ago: agoT(t, src.lastCheckedMin), n: src.snapshots })}</span><Button size="sm" onPress={() => go(dpath('sources', src.id))}>{t('discovery.changes.src.open')}</Button></div>
              </Section>
            )}
            <Section title={t('discovery.changes.ent.title')}><div className="ds-ch-card"><b>{c.entity}</b><Button size="sm" onPress={() => go(dpath('entities', c.entityId))}>{t('discovery.changes.ent.open')}</Button></div></Section>
          </div>
        </div>
      </div>
      <FlowDialog c={c} open={flow} onClose={() => setFlow(false)} />
      <WatchDialog c={c} open={wl} onClose={() => setWl(false)} />
    </div>
  );
}

function Snapshots({ c }: { c: ChangeEvent }) {
  const t = useT();
  const snaps = useMemo(() => snapshotsOf(c.sourceId), [c.sourceId]);
  const byId = (i?: string) => snaps.find((s) => s.id === i);
  const init = (c.snapshotIds ? [c.snapshotIds[0], c.snapshotIds[1]] : [snaps[1]?.id ?? '', snaps[0]?.id ?? '']).filter(Boolean);
  const [pick, setPick] = useState<string[]>(init);
  const [pair, setPair] = useState<string[]>(init);
  const toggle = (sid: string) => setPick((p) => (p.includes(sid) ? p.filter((x) => x !== sid) : [...p.slice(-1), sid]));
  const sorted = pair.map(byId).filter((s): s is FetchSnapshot => !!s).sort((a, b) => a.at.localeCompare(b.at));
  const first = c.after === '—' ? undefined : [...snaps].sort((a, b) => a.at.localeCompare(b.at)).find((s) => s.lines.some((l) => l.includes(c.after)));
  return (
    <Section title={t('discovery.changes.snap.title')} hint={t('discovery.changes.snap.hint')}>
      <p className="dw-muted" aria-live="polite">{first ? <>{t('discovery.changes.snap.firstSeenIn')} <b>{first.at}</b>.</> : t('discovery.changes.snap.notPresent')}</p>
      <ul className="ds-ch-snaps">
        {snaps.map((s) => <li key={s.id}><label><input type="checkbox" checked={pick.includes(s.id)} onChange={() => toggle(s.id)} aria-label={t('discovery.changes.snap.selectAria', { at: s.at })} /><span className="bw-mono">{s.at}</span></label><span className="dw-muted">{t('discovery.changes.snap.lines', { n: s.lines.length })}{s.note ? ` · ${s.note}` : ''}</span>{first?.id === s.id && <Badge tone="accent">{t('discovery.changes.snap.firstSeen')}</Badge>}</li>)}
      </ul>
      <div className="dw-chips"><Button size="sm" isDisabled={pick.length !== 2} onPress={() => setPair(pick)}>{t('discovery.changes.snap.compare')}</Button><span className="dw-muted">{t('discovery.changes.snap.pickTwo')}</span></div>
      {sorted.length === 2 && (
        <ul className="ds-ch-diff" aria-label={t('discovery.changes.snap.diffAria', { from: sorted[0]!.at, to: sorted[1]!.at })}>
          {lineDiff(sorted[0]!.lines, sorted[1]!.lines).map((d, i) => <li key={i} className={`is-${d.t}`}><b aria-hidden="true">{d.t === 'add' ? '+' : d.t === 'del' ? '−' : ' '}</b><span>{d.s}</span></li>)}
        </ul>
      )}
      {sorted.length === 2 && <p className="dw-muted">{sorted[0]!.at} → {sorted[1]!.at}</p>}
    </Section>
  );
}

function FlowDialog({ c, open, onClose }: { c: ChangeEvent; open: boolean; onClose: () => void }) {
  const t = useT();
  const go = useGo();
  const steps = [t('discovery.changes.flow.step1', { kind: t(KIND_ID[c.kind]), entity: c.entity }), t('discovery.changes.flow.step2'), t('discovery.changes.flow.step3'), t('discovery.changes.flow.step4')];
  const confirm = () => { useDs.getState().setHandoff({ kind: 'workflow', label: `${t(KIND_ID[c.kind])}: ${c.entity}`, changeId: c.id }); useDs.getState().toast(t('discovery.changes.flow.toast')); onClose(); go('/workflows'); };
  return (
    <Dialog title={t('discovery.changes.flow.title')} isOpen={open} onOpenChange={(o) => { if (!o) onClose(); }} footer={<><Button size="sm" variant="ghost" onPress={onClose}>{t('discovery.changes.cancel')}</Button><Button size="sm" variant="primary" onPress={confirm}>{t('discovery.changes.flow.confirm')}</Button></>}>
      <p className="dw-muted">{t('discovery.changes.flow.text')}</p>
      <StepList steps={steps} at={steps.length} />
    </Dialog>
  );
}

function WatchDialog({ c, open, onClose }: { c: ChangeEvent; open: boolean; onClose: () => void }) {
  const t = useT();
  const lists = useDs((s) => s.watchlists), extra = useWatchExtra((s) => s.extra), add = useWatchExtra((s) => s.add);
  const [wid, setWid] = useState('');
  const chosen = lists.find((w) => w.id === (wid || lists[0]?.id));
  const confirm = () => {
    if (!chosen) return;
    if (watchEntityIds(chosen, extra).includes(c.entityId)) useDs.getState().toast(t('discovery.changes.wl.already', { entity: c.entity, name: chosen.name }));
    else { add(chosen.id, c.entityId); useDs.getState().toast(t('discovery.changes.wl.added', { entity: c.entity, name: chosen.name })); }
    onClose();
  };
  return (
    <Dialog title={t('discovery.changes.wl.title')} isOpen={open} onOpenChange={(o) => { if (!o) onClose(); }} footer={<><Button size="sm" variant="ghost" onPress={onClose}>{t('discovery.changes.cancel')}</Button><Button size="sm" variant="primary" isDisabled={!chosen} onPress={confirm}>{t('discovery.changes.wl.confirm', { entity: c.entity })}</Button></>}>
      {lists.length === 0 ? <p>{t('discovery.changes.wl.none')}</p> : (
        <label className="dw-muted" style={{ display: 'grid', gap: 4 }}>{t('discovery.changes.wl.label')}<select className="ds-ms-in" value={chosen?.id ?? ''} onChange={(e) => setWid(e.target.value)} aria-label={t('discovery.changes.wl.label')}>{lists.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>
      )}
    </Dialog>
  );
}
