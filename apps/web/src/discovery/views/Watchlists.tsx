import { useState } from 'react';
import { Badge, Button, Icon, IconButton } from '@biweb/ui';
import { ENTITIES } from '../data/seed';
import { changesOf } from '../data/derive';
import { CAT_FILTERS, WATCH_MONITORS, entityName, glyphOf, matchCat, shortDay, useWatchExtra, watchChanges, watchEntityIds, type CatFilter } from '../data/missions';
import type { ChangeEvent, Frequency, Watchlist } from '../data/types';
import { useDs } from '../store';
import { Chip, Empty, Grid, Kv, LevelBadge, Search, Section, TraceBtn, ViewHead, dpath, useGo, type Col } from '../ui';
import './watchlists.css';
import { useT } from '../../i18n/intl';
import { CAT_ID, FREQ_ID, KIND_ID, agoT, monitorLabel } from '../data/work-i18n';

export function WatchlistsView({ id }: { id?: string }) {
  if (id === 'new') return <WatchlistForm />;
  if (id) return <WatchlistDetail id={id} />;
  return <WatchlistList />;
}

function WatchlistList() {
  const t = useT();
  const go = useGo();
  const lists = useDs((s) => s.watchlists), extra = useWatchExtra((s) => s.extra);
  const cols: Col<Watchlist>[] = [
    { key: 'n', label: t('discovery.watchlists.col.watchlist'), w: 'minmax(200px, 2fr)', render: (w) => <button type="button" className="ds-ms-link" aria-label={t('discovery.watchlists.openAria', { name: w.name })} onClick={(e) => { e.stopPropagation(); go(dpath('watchlists', w.id)); }}>{w.name}</button> },
    { key: 'e', label: t('discovery.watchlists.col.entities'), w: '120px', render: (w) => { const ids = watchEntityIds(w, extra); return <span title={ids.map(entityName).join(', ')}>{ids.length ? `${ids.length}: ${ids.slice(0, 2).map(entityName).join(', ')}${ids.length > 2 ? '…' : ''}` : t('discovery.watchlists.regulators')}</span>; } },
    { key: 's', label: t('discovery.watchlists.col.sources'), w: '72px', right: true, render: (w) => <span className="bw-num">{w.sources}</span> },
    { key: 'f', label: t('discovery.watchlists.col.frequency'), w: '90px', render: (w) => t(FREQ_ID[w.frequency]) },
    { key: 'm', label: t('discovery.watchlists.col.monitors'), w: 'minmax(200px, 2fr)', render: (w) => <span title={w.monitors.map((m) => monitorLabel(t, m)).join(', ')}>{w.monitors.slice(0, 3).map((m) => monitorLabel(t, m)).join(', ')}{w.monitors.length > 3 ? ` +${w.monitors.length - 3}` : ''}</span> },
    { key: 'c', label: t('discovery.watchlists.col.changesWeek'), w: '96px', right: true, render: (w) => <span className="bw-num">{watchChanges(w, extra).length}</span> },
  ];
  return (
    <div className="dw-view">
      <ViewHead title={t('discovery.watchlists.title')} sub={t('discovery.watchlists.sub')} actions={<Button variant="primary" size="sm" icon="plus" onPress={() => go(dpath('watchlists', 'new'))}>{t('discovery.watchlists.new')}</Button>} />
      <Grid label={t('discovery.watchlists.gridLabel')} cols={cols} rows={lists} id={(w) => w.id} onRow={(w) => go(dpath('watchlists', w.id))}
        empty={<Empty icon="eye" title={t('discovery.watchlists.emptyTitle')} text={t('discovery.watchlists.emptyText')} action={<Button size="sm" variant="primary" onPress={() => go(dpath('watchlists', 'new'))}>{t('discovery.watchlists.new')}</Button>} />} />
    </div>
  );
}

function WatchlistDetail({ id }: { id: string }) {
  const t = useT();
  const go = useGo();
  const w = useDs((s) => s.watchlists.find((x) => x.id === id));
  const extra = useWatchExtra((s) => s.extra), addEntity = useWatchExtra((s) => s.add), toast = useDs((s) => s.toast), sel = useDs((s) => s.sel);
  const [f, setF] = useState<CatFilter>('All');
  const [tl, setTl] = useState<string | null>(null);
  const [pick, setPick] = useState('');
  if (!w) return <div className="dw-view"><Empty icon="eye" title={t('discovery.watchlists.notFound')} text={t('discovery.watchlists.notFoundText')} action={<Button size="sm" onPress={() => go(dpath('watchlists'))}>{t('discovery.watchlists.back')}</Button>} /></div>;
  const ids = watchEntityIds(w, extra);
  const all = watchChanges(w, extra);
  const rows = all.filter((c) => matchCat(c, f));
  const tlId = tl && ids.includes(tl) ? tl : ids.find((e) => changesOf(e).length > 0) ?? ids[0];
  const tlRows = tlId ? changesOf(tlId).sort((a, b) => a.detectedMin - b.detectedMin) : [];
  const candidates = ENTITIES.filter((e) => e.type === 'Organization' && !ids.includes(e.id)).slice(0, 60);
  const add = () => { if (!pick) return; addEntity(w.id, pick); toast(t('discovery.watchlists.add.toast', { entity: entityName(pick), name: w.name })); setPick(''); };
  const act = (c: ChangeEvent) => useDs.getState().select({ kind: 'change', id: c.id });
  return (
    <div className="dw-view dw-view--flush">
      <div className="dw-sh">
        <button type="button" className="dw-back" onClick={() => go(dpath('watchlists'))}><Icon name="arrowLeft" size={12} />{t('discovery.nav.watchlists')}</button>
        <div className="dw-sh-main"><h2>{w.name}</h2><Badge tone="success">{t('discovery.watchlists.monitoring')}</Badge></div>
        <div className="dw-sh-facts"><Kv k={t('discovery.watchlists.col.entities')} v={ids.length || '—'} /><Kv k={t('discovery.watchlists.col.sources')} v={w.sources} /><Kv k={t('discovery.watchlists.col.frequency')} v={t(FREQ_ID[w.frequency])} /></div>
        <div className="dw-chips" style={{ paddingBottom: 8 }} aria-label={t('discovery.watchlists.monitorsAria')}>{w.monitors.map((m) => <Badge key={m} tone="neutral">{monitorLabel(t, m)}</Badge>)}</div>
      </div>
      <div className="dw-pad-v">
        <div className="ds-wl-cols">
          <div style={{ display: 'grid', gap: 10, minWidth: 0 }}>
            <p className="ds-wl-week" aria-live="polite">{t('discovery.changes.periodWeek')}: <b className="bw-num">{all.length}</b> {t('discovery.changes.relevant', { n: all.length })}</p>
            <div className="dw-chips" role="group" aria-label={t('discovery.watchlists.filterAria')}>{CAT_FILTERS.map((c) => <Chip key={c} on={f === c} onClick={() => setF(c)} n={all.filter((x) => matchCat(x, c)).length}>{t(CAT_ID[c])}</Chip>)}</div>
            {rows.length === 0 ? <Empty icon="timeline" title={t('discovery.watchlists.noChanges')} text={t('discovery.watchlists.noChangesFilter')} /> : (
              <ul className="ds-wl-rows" aria-label={t('discovery.watchlists.rowsAria')}>
                {rows.map((c) => {
                  const g = glyphOf(c);
                  return (
                    <li key={c.id}>
                      <div className={`ds-wl-row${sel?.kind === 'change' && sel.id === c.id ? ' is-on' : ''}`} role="button" tabIndex={0} aria-label={`${c.entity} ${c.semantic}`} onClick={() => act(c)} onDoubleClick={() => go(dpath('changes', c.id))}
                        onKeyDown={(e) => { if (e.key === 'Enter') go(dpath('changes', c.id)); else if (e.key === ' ') { e.preventDefault(); act(c); } }}>
                        <span className={`ds-wl-g ${g === '+' ? 'is-add' : g === '−' ? 'is-del' : 'is-mod'}`} aria-hidden="true">{g}</span>
                        <span className="ds-wl-t"><b>{c.entity} <span style={{ fontWeight: 400 }}>{g} {c.semantic}</span></b><span>{c.scope}: {c.before} → {c.after}</span></span>
                        <span className="dw-muted">{agoT(t, c.detectedMin)}</span><LevelBadge l={c.confidence} /><TraceBtn evidenceId={c.evidenceIds[0]} />
                        <IconButton icon="chevronRight" label={t('discovery.watchlists.openChangeAria', { semantic: c.semantic })} size="sm" onPress={() => go(dpath('changes', c.id))} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <Section title={t('discovery.watchlists.timeline.title')} hint={t('discovery.watchlists.timeline.hint')}>
              <div className="ds-wl-panel">
                {ids.length === 0 ? <p className="dw-muted">{t('discovery.watchlists.timeline.noEntities')}</p> : (
                  <>
                    <div className="dw-chips" role="group" aria-label={t('discovery.watchlists.timeline.entityAria')}>{ids.map((e) => <Chip key={e} on={e === tlId} onClick={() => setTl(e)}>{entityName(e)}</Chip>)}</div>
                    {tlRows.length === 0 ? <p className="dw-muted">{t('discovery.watchlists.noChanges')}</p> : (
                      <ul className="ds-wl-tl">{tlRows.map((c) => <li key={c.id}><time>{shortDay(c.detectedMin)}</time><button type="button" className="ds-ms-link" style={{ fontWeight: 500 }} onClick={() => go(dpath('changes', c.id))}>{c.kind === 'Pricing changed' ? t(KIND_ID[c.kind]) : c.semantic}</button></li>)}</ul>
                    )}
                  </>
                )}
              </div>
            </Section>
            <Section title={t('discovery.watchlists.add.title')}>
              <div className="ds-wl-add">
                <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label={t('discovery.watchlists.add.selectAria')}><option value="">{t('discovery.watchlists.add.choose')}</option>{candidates.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
                <Button size="sm" icon="plus" isDisabled={!pick} onPress={add}>{t('discovery.watchlists.add.button')}</Button>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function WatchlistForm() {
  const t = useT();
  const go = useGo();
  const toast = useDs((s) => s.toast);
  const [name, setName] = useState('');
  const [ents, setEnts] = useState<string[]>([]);
  const [freq, setFreq] = useState<Frequency>('Daily');
  const [mons, setMons] = useState<string[]>(['Pricing', 'Products']);
  const [q, setQ] = useState('');
  const orgs = ENTITIES.filter((e) => e.type === 'Organization' && (!q || e.name.toLowerCase().includes(q.toLowerCase())));
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const create = () => {
    const mission = ENTITIES.find((e) => e.id === ents[0])?.missionIds[0] ?? 'm1';
    const id = useDs.getState().addWatchlist({ name: name.trim(), entityIds: ents, sources: Math.max(6, ents.length * 12), frequency: freq, monitors: mons, missionId: mission });
    toast(t('discovery.watchlists.form.created', { name: name.trim() })); go(dpath('watchlists', id));
  };
  return (
    <div className="dw-view">
      <ViewHead title={t('discovery.watchlists.form.title')} sub={t('discovery.watchlists.form.sub')} actions={<Button size="sm" variant="ghost" onPress={() => go(dpath('watchlists'))}>{t('discovery.watchlists.form.cancel')}</Button>} />
      <div className="ds-wl-form">
        <label className="dw-muted" style={{ display: 'grid', gap: 4 }}>{t('discovery.watchlists.form.name')}<input className="ds-ms-in" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('discovery.watchlists.form.namePlaceholder')} aria-label={t('discovery.watchlists.form.nameAria')} /></label>
        <div style={{ display: 'grid', gap: 6 }}>
          <h3>{t('discovery.watchlists.form.entities')} <span className="dw-muted">{t('discovery.watchlists.form.selected', { n: ents.length })}</span></h3>
          <Search value={q} onChange={setQ} placeholder={t('discovery.watchlists.form.search')} w={280} />
          <div className="dw-chips" role="group" aria-label={t('discovery.watchlists.form.entities')}>{orgs.slice(0, 30).map((e) => <Chip key={e.id} on={ents.includes(e.id)} onClick={() => setEnts(toggle(ents, e.id))}>{e.name}</Chip>)}</div>
        </div>
        <label className="dw-muted" style={{ display: 'grid', gap: 4, width: 160 }}>{t('discovery.watchlists.form.frequency')}<select className="ds-ms-in" value={freq} onChange={(e) => setFreq(e.target.value as Frequency)} aria-label={t('discovery.watchlists.form.frequency')}>{(['Daily', 'Weekly', 'Monthly'] as Frequency[]).map((f) => <option key={f} value={f}>{t(FREQ_ID[f])}</option>)}</select></label>
        <div style={{ display: 'grid', gap: 6 }}>
          <h3>{t('discovery.watchlists.form.monitors')}</h3>
          <div className="dw-chips" role="group" aria-label={t('discovery.watchlists.form.monitors')}>{WATCH_MONITORS.map((m) => <Chip key={m} on={mons.includes(m)} onClick={() => setMons(toggle(mons, m))}>{monitorLabel(t, m)}</Chip>)}</div>
        </div>
        <div><Button variant="primary" size="sm" icon="check" isDisabled={!name.trim() || ents.length === 0 || mons.length === 0} onPress={create}>{t('discovery.watchlists.form.create')}</Button></div>
      </div>
    </div>
  );
}
