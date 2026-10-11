import { useState } from 'react';
import { Badge, Button, Icon } from '@biweb/ui';
import { CONFLICTS } from '../data/seed';
import { entityById, evidenceById, observationById, sourceById } from '../data/derive';
import { CONFLICT_OBS } from '../data/records';
import type { Conflict } from '../data/types';
import { useT } from '../../i18n/intl';
import { useDs } from '../store';
import { AuthorityBadge, Chip, ConfidenceBreakdown, Empty, Grid, Kv, Section, TraceBtn, ViewHead, dpath, useGo, type Col } from '../ui';
import { RecLink } from './EntityActions';
import './records.css';

export function ConflictsView({ id }: { id?: string }) { return id ? <Review id={id} /> : <ConflictList />; }

const valueOf = (c: Conflict, r: 'a' | 'b') => c[r].value;

function ConflictList() {
  const t = useT();
  const go = useGo();
  const resolved = useDs((s) => s.resolved);
  const sel = useDs((s) => s.sel);
  const [f, setF] = useState<'open' | 'resolved' | 'all'>('open');
  const open = CONFLICTS.filter((c) => !resolved[c.id]).length;
  const rows = CONFLICTS.filter((c) => (f === 'all' ? true : f === 'open' ? !resolved[c.id] : !!resolved[c.id]));
  const cols: Col<Conflict>[] = [
    { key: 'e', label: t('discovery.conflicts.col.entityField'), w: 'minmax(180px,1.4fr)', render: (c) => <RecLink onOpen={() => go(dpath('conflicts', c.id))}>{c.entity} · {c.field}</RecLink> },
    { key: 'a', label: t('discovery.conflicts.col.versionA'), w: 'minmax(140px,1.2fr)', render: (c) => <span className="ds-rec-two"><b>{c.a.value}</b><small>{c.a.label} · {c.a.updated}</small></span> },
    { key: 'b', label: t('discovery.conflicts.col.versionB'), w: 'minmax(140px,1.2fr)', render: (c) => <span className="ds-rec-two"><b>{c.b.value}</b><small>{c.b.label} · {c.b.updated}</small></span> },
    { key: 'r', label: t('discovery.conflicts.recommended'), w: '150px', render: (c) => valueOf(c, c.recommended) },
    { key: 's', label: t('discovery.conflicts.state'), w: '170px', render: (c) => (resolved[c.id] ? <Badge tone="success" icon="check">{t('discovery.conflicts.resolvedValue', { value: valueOf(c, resolved[c.id]!) })}</Badge> : <Badge tone="warning" icon="warning">{t('discovery.conflicts.open')}</Badge>) },
  ];
  return (
    <div className="dw-view">
      <ViewHead title={t('discovery.nav.conflicts')} sub={t('discovery.conflicts.sub', { open })} />
      <span className="dw-chips" role="group" aria-label={t('discovery.conflicts.state')}><Chip on={f === 'open'} onClick={() => setF('open')} n={open}>{t('discovery.conflicts.open')}</Chip><Chip on={f === 'resolved'} onClick={() => setF('resolved')} n={CONFLICTS.length - open}>{t('discovery.conflicts.resolved')}</Chip><Chip on={f === 'all'} onClick={() => setF('all')} n={CONFLICTS.length}>{t('discovery.conflicts.all')}</Chip></span>
      {rows.length === 0 ? <Empty icon="check" title={f === 'resolved' ? t('discovery.conflicts.emptyResolvedTitle') : t('discovery.conflicts.emptyTitle')} text={f === 'resolved' ? t('discovery.conflicts.emptyResolvedText') : t('discovery.conflicts.emptyText')} /> : (
        <Grid label={t('discovery.nav.conflicts')} cols={cols} rows={rows} id={(c) => c.id} selected={sel?.kind === 'conflict' ? sel.id : null} onRow={(c) => useDs.getState().select({ kind: 'conflict', id: c.id })} />
      )}
    </div>
  );
}

function Review({ id }: { id: string }) {
  const t = useT();
  const go = useGo();
  const res = useDs((s) => s.resolved[id]);
  const [kept, setKept] = useState(false);
  const c = CONFLICTS.find((x) => x.id === id);
  if (!c) return <div className="dw-view"><Empty icon="warning" title={t('discovery.conflicts.notFound.title')} text={t('discovery.conflicts.notFound.text')} action={<Button size="sm" onPress={() => go(dpath('conflicts'))}>{t('discovery.conflicts.notFound.back')}</Button>} /></div>;
  const rec = c.recommended, alt = rec === 'a' ? 'b' : 'a';
  const pair = CONFLICT_OBS[c.id];
  const apply = (pick: 'a' | 'b') => { useDs.getState().resolve(c.id, pick); setKept(false); useDs.getState().toast(t('discovery.conflicts.resolvedToast', { value: c[pick].value })); };
  const e = entityById(c.entityId);
  const Side = ({ k }: { k: 'a' | 'b' }) => {
    const v = c[k], src = sourceById(v.sourceId), o = pair ? observationById(pair[k]) : undefined;
    const evIds = o?.evidenceIds ?? [];
    const cls = res ? (res === k ? 'is-won' : 'is-lost') : rec === k ? 'is-rec' : '';
    return (
      <div className={`ds-rec-side ${cls}`}>
        <h4>{t('discovery.conflicts.sideTitle', { side: k.toUpperCase(), label: v.label })}</h4>
        <div className="ds-rec-val">{v.value}</div>
        <div className="dw-hyp-a">{rec === k && !res && <Badge tone="accent">{t('discovery.conflicts.recommended')}</Badge>}{res === k && <Badge tone="success" icon="check">{t('discovery.conflicts.accepted')}</Badge>}{res && res !== k && <Badge>{t('discovery.conflicts.superseded')}</Badge>}{src && <AuthorityBadge a={src.authority} />}</div>
        <div className="dw-facts dw-facts--col"><Kv k={t('discovery.conflicts.updated')} v={v.updated} /><Kv k={t('discovery.nav.sources')} v={src ? <RecLink onOpen={() => go(dpath('sources', src.id))}>{src.name}</RecLink> : v.sourceId} /></div>
        <div className="dw-hyp-a">{evIds.length ? evIds.map((ev) => <TraceBtn key={ev} evidenceId={ev} label={evidenceById(ev)?.locator ?? t('discovery.nav.evidence')} />) : <TraceBtn />}</div>
        {!evIds.length && <p className="dw-muted" style={{ margin: 0 }}>{t('discovery.conflicts.noEvidence')}</p>}
        {o ? <ConfidenceBreakdown c={o.confidence} /> : <p className="dw-muted" style={{ margin: 0 }}>{t('discovery.conflicts.noConfidence')}</p>}
      </div>
    );
  };
  return (
    <div className="dw-view dw-view--flush">
      <div className="dw-sh">
        <button type="button" className="dw-back" onClick={() => go(dpath('conflicts'))}><Icon name="arrowLeft" size={12} />{t('discovery.nav.conflicts')}</button>
        <div className="dw-sh-main"><h2>{t('discovery.conflicts.review')}</h2>{res ? <Badge tone="success" icon="check">{t('discovery.conflicts.resolved')}</Badge> : <Badge tone="warning" icon="warning">{t('discovery.conflicts.open')}</Badge>}<span className="flex-1" />{e && <Button size="sm" icon="cube" onPress={() => go(dpath('entities', e.id))}>{t('discovery.conflicts.openEntity', { name: e.name })}</Button>}</div>
        <div className="dw-sh-facts"><Kv k={t('discovery.conflicts.entity')} v={c.entity} /><Kv k={t('discovery.conflicts.field')} v={c.field} /><Kv k={t('discovery.conflicts.recommended')} v={valueOf(c, rec)} /><Kv k={t('discovery.conflicts.reason')} v={c.reason} />{res && <Kv k={t('discovery.conflicts.resolvedLabel')} v={valueOf(c, res)} />}</div>
      </div>
      <div className="dw-pad-v">
        <p className="ds-rec-claim">{c.entity} · {c.field}</p>
        <div className="ds-rec-vs"><Side k="a" /><Side k="b" /></div>
        {res ? (
          <p className="dw-note" role="status"><Icon name="check" size={12} />{t('discovery.conflicts.resolvedNote', { value: valueOf(c, res) })}</p>
        ) : (
          <Section title={t('discovery.conflicts.decision')} hint={t('discovery.conflicts.decisionHint')}>
            <p className="dw-muted" style={{ margin: 0 }}>{t('discovery.conflicts.decisionText', { value: valueOf(c, rec), reason: c.reason.toLowerCase() })}</p>
            <div className="dw-hyp-a">
              <Button size="sm" variant="primary" icon="check" onPress={() => apply(rec)}>{t('discovery.conflicts.accept')}</Button>
              <Button size="sm" onPress={() => apply(alt)}>{t('discovery.conflicts.alternative', { value: valueOf(c, alt) })}</Button>
              <Button size="sm" variant="ghost" onPress={() => { setKept(true); useDs.getState().toast(t('discovery.conflicts.keptToast')); }}>{t('discovery.conflicts.keep')}</Button>
            </div>
            {kept && <p className="dw-note" role="status"><Icon name="info" size={12} />{t('discovery.conflicts.keptNote')}</p>}
          </Section>
        )}
      </div>
    </div>
  );
}
