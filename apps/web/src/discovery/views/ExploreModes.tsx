import { useMemo, useState } from 'react';
import { Badge, Button, Icon } from '@biweb/ui';
import { useT } from '../../i18n/intl';
import type { MessageId } from '../../i18n/catalog';
import { BLOCK_LABEL_ID, BLOCK_NOTE_ID, CONFLICTS, EVIDENCE_PACKS, OBSERVATIONS } from '../data/seed';
import { ago, confidenceOf, observationsOf, sourceById } from '../data/derive';
import { BAND_LABEL, bandOf, candidateSources, changesCount, clusterGeo, evidenceOfEntity, publicRows, resultGraph, weekChanges, type Band, type Candidate, type QueryKind, type SourceClass } from '../data/explore';
import type { EntityCandidate, EntityType, SourceType } from '../data/types';
import { Canvas } from '../../dataworkspace/Canvas';
import { useDs } from '../store';
import { AuthorityBadge, Chip, ConfChip, Empty, Grid, KIND_ICON, Section, SemanticChange, TraceBtn, dpath, useGo, type Col } from '../ui';
import './explore.css';

export interface ModeProps { kind: QueryKind; list: EntityCandidate[] }

const CLS_TONE: Record<SourceClass, 'success' | 'neutral' | 'warning' | 'danger'> = { Relevant: 'success', 'Low relevance': 'neutral', Duplicate: 'neutral', Blocked: 'danger', 'Policy restricted': 'warning' };
const CLS_LABEL: Record<SourceClass, MessageId> = { Relevant: 'discovery.explore.cls.relevant', 'Low relevance': 'discovery.explore.cls.low', Duplicate: 'discovery.explore.cls.duplicate', Blocked: 'discovery.explore.cls.blocked', 'Policy restricted': 'discovery.explore.cls.policy' };
export function ClassBadge({ c }: { c: SourceClass }) { const t = useT(); return <Badge tone={CLS_TONE[c]} icon={c === 'Blocked' || c === 'Policy restricted' ? 'lock' : undefined}>{t(CLS_LABEL[c])}</Badge>; }

export const ENTITY_TYPE: Record<EntityType, MessageId> = {
  Organization: 'discovery.explore.etype.organization', Product: 'discovery.explore.etype.product', Service: 'discovery.explore.etype.service', Technology: 'discovery.explore.etype.technology', Location: 'discovery.explore.etype.location',
  Market: 'discovery.explore.etype.market', Regulation: 'discovery.explore.etype.regulation', Publication: 'discovery.explore.etype.publication', Event: 'discovery.explore.etype.event',
};
export const SOURCE_TYPE: Record<SourceType, MessageId> = {
  'Official Website': 'discovery.explore.stype.official', Documentation: 'discovery.explore.stype.documentation', 'Pricing Page': 'discovery.explore.stype.pricing', 'Open Data': 'discovery.explore.stype.openData', Government: 'discovery.explore.stype.government',
  News: 'discovery.explore.stype.news', RSS: 'discovery.explore.stype.rss', 'Public API': 'discovery.explore.stype.api', Repository: 'discovery.explore.stype.repository', Document: 'discovery.explore.stype.document', 'Public Database': 'discovery.explore.stype.database',
};

function useSelect() {
  const sel = useDs((s) => s.sel);
  return { selId: sel?.kind === 'entity' ? sel.id : null, pick: (id: string) => useDs.getState().select({ kind: 'entity', id }) };
}

/* ───── Overview ───── */
export function OverviewMode({ kind, list, onMode }: ModeProps & { onMode: (m: 'table' | 'sources' | 'evidence') => void }) {
  const t = useT();
  const go = useGo();
  const { selId, pick } = useSelect();
  const ids = new Set(list.map((e) => e.id));
  const conflicts = CONFLICTS.filter((c) => ids.has(c.entityId));
  const review = list.filter((e) => bandOf(e.confidence) === 'review');
  const used = candidateSources(kind).filter((c) => c.cls === 'Relevant').slice(0, 6);
  const top = [...list].sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  const nSrc = list.reduce((s, e) => s + e.sources, 0);
  return (
    <div className="ds-ex-fade" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="ds-ex-two">
        <Section title={t('discovery.explore.sum.title')} hint={t('discovery.explore.sum.hint')}>
          <div className="dw-facts dw-facts--col">
            <div className="dw-kv"><span>{t('discovery.explore.sum.entities')}</span><b>{list.length}</b></div>
            <div className="dw-kv"><span>{t('discovery.explore.sum.sources')}</span><b>{nSrc}</b></div>
            <div className="dw-kv"><span>{t('discovery.explore.sum.conflicts')}</span><b>{conflicts.length}</b></div>
            <div className="dw-kv"><span>{t('discovery.explore.sum.review')}</span><b>{review.length}</b></div>
          </div>
          <div className="ds-ai"><b>{t('discovery.explore.ai.label')}</b>{kind === 'fiber' || kind === 'sp' ? t('discovery.explore.ai.regional') : t('discovery.explore.ai.vendors')}</div>
        </Section>
        <Section title={t('discovery.explore.att.title')}>
          {review.length === 0 && conflicts.length === 0 && <div className="ds-ex-callout is-ok"><Icon name="check" size={12} />{t('discovery.explore.noConflicts')}</div>}
          {review.length > 0 && <div className="ds-ex-callout"><Icon name="warning" size={12} /><span><b>{t('discovery.explore.att.review', { n: review.length })}</b>: {review.map((e) => e.name).join(', ')}. {t('discovery.explore.att.reviewNote')}</span></div>}
          {conflicts.map((c) => <div key={c.id} className="ds-ex-callout"><Icon name="warning" size={12} /><span><b>{c.entity}</b> · {c.field}: {t('discovery.explore.att.disagree')} <button type="button" className="ds-trace" onClick={() => go(dpath('conflicts', c.id))}>{t('discovery.explore.att.open')}</button></span></div>)}
        </Section>
      </div>
      <Section title={t('discovery.explore.top.title')} actions={<Button size="sm" variant="ghost" onPress={() => onMode('table')}>{t('discovery.explore.top.table')}</Button>}>
        <EntityTable list={top} selId={selId} onPick={pick} />
      </Section>
      <Section title={t('discovery.explore.used.title')} actions={<Button size="sm" variant="ghost" onPress={() => onMode('sources')}>{t('discovery.explore.used.all')}</Button>}>
        <ul className="dw-hits" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {used.map(({ src }) => <li key={src.id} className="dw-more" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><AuthorityBadge a={src.authority} /><span className="ds-ex-trunc">{src.name}</span><span className="dw-muted">{t(SOURCE_TYPE[src.type])}</span></li>)}
          {used.length === 0 && <li className="dw-more">{t('discovery.explore.none.title')}</li>}
        </ul>
      </Section>
    </div>
  );
}

/* ───── Table ───── */
function EntityTable({ list, selId, onPick }: { list: EntityCandidate[]; selId: string | null; onPick: (id: string) => void }) {
  const t = useT();
  const go = useGo();
  const cols: Col<EntityCandidate>[] = [
    { key: 't', label: t('discovery.explore.col.type'), w: '92px', render: (e) => <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><Icon name={KIND_ICON[e.type] ?? 'cube'} size={12} />{t(ENTITY_TYPE[e.type])}</span> },
    { key: 'n', label: t('discovery.explore.col.entity'), w: 'minmax(150px, 1.4fr)', render: (e) => <span className="ds-ex-name"><b>{e.name}</b>{e.hq && <small>{e.hq}</small>}</span> },
    { key: 'c', label: t('discovery.explore.col.confidence'), w: '110px', render: (e) => <ConfChip v={e.confidence} needs /> },
    { key: 's', label: t('discovery.nav.sources'), w: '58px', right: true, render: (e) => <span className="bw-num">{e.sources}</span> },
    { key: 'l', label: t('discovery.explore.col.lastConfirmed'), w: '96px', render: (e) => ago(e.lastConfirmedMin) },
    { key: 'p', label: t('discovery.explore.col.products'), w: 'minmax(120px, 1.2fr)', render: (e) => <span className="ds-ex-trunc" title={e.products.join(', ')}>{e.products.join(', ') || '—'}</span> },
    { key: 'g', label: t('discovery.explore.col.locations'), w: '70px', right: true, render: (e) => <span className="bw-num">{e.locations || '—'}</span> },
    { key: 'ch', label: t('discovery.nav.changes'), w: '66px', right: true, render: (e) => <span className="bw-num">{changesCount(e.id)}</span> },
    { key: 'o', label: '', w: '58px', right: true, render: (e) => <Button size="sm" variant="ghost" aria-label={t('discovery.explore.openNamed', { name: e.name })} onPress={() => go(dpath('entities', e.id))}>{t('discovery.explore.open')}</Button> },
  ];
  return <Grid cols={cols} rows={list} id={(e) => e.id} selected={selId} onRow={(e) => onPick(e.id)} label={t('discovery.explore.table.label')} empty={<p className="dw-more">{t('discovery.explore.none.title')}</p>} />;
}
const SORTS: ['confidence' | 'name' | 'sources', MessageId][] = [['confidence', 'discovery.explore.sort.confidence'], ['name', 'discovery.explore.sort.name'], ['sources', 'discovery.explore.sort.sources']];
export function TableMode({ list }: ModeProps) {
  const t = useT();
  const { selId, pick } = useSelect();
  const [sort, setSort] = useState<'confidence' | 'name' | 'sources'>('confidence');
  const rows = useMemo(() => [...list].sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : sort === 'sources' ? b.sources - a.sources : b.confidence - a.confidence)), [list, sort]);
  return (
    <div className="ds-ex-fade" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="dw-chips" role="group" aria-label={t('discovery.explore.sort.label')}><span className="dw-muted">{t('discovery.explore.sort.by')}</span>{SORTS.map(([s, id]) => <Chip key={s} on={sort === s} onClick={() => setSort(s)}>{t(id)}</Chip>)}</div>
      <EntityTable list={rows} selId={selId} onPick={pick} />
    </div>
  );
}

/* ───── Entities (por faixa de confiança) ───── */
export function EntitiesMode({ list }: ModeProps) {
  const t = useT();
  const go = useGo();
  const { selId, pick } = useSelect();
  const bands: Band[] = ['high', 'medium', 'review'];
  return (
    <div className="ds-ex-fade" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {bands.map((b) => {
        const items = list.filter((e) => bandOf(e.confidence) === b);
        return (
          <Section key={b} title={t(BAND_LABEL[b])} hint={`${items.length}`}>
            {items.length === 0 ? <p className="dw-more">{t('discovery.explore.noConflicts')}</p> : (
              <div className="dw-cards">
                {items.map((e) => (
                  <div key={e.id} className={`dw-card ds-ex-ent${selId === e.id ? ' is-on' : ''}`} role="button" tabIndex={0} aria-label={t('discovery.explore.card.aria', { name: e.name, v: e.confidence })} onClick={() => pick(e.id)}
                    onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(e.id); } }} onDoubleClick={() => go(dpath('entities', e.id))}>
                    <b style={{ fontSize: 13 }}>{e.name}</b>
                    <span className="dw-muted">{e.hq ?? t(ENTITY_TYPE[e.type])} · {t('discovery.explore.card.sources', { n: e.sources })}</span>
                    <ConfChip v={e.confidence} needs />
                    <button type="button" className="ds-trace" onClick={(ev) => { ev.stopPropagation(); go(dpath('entities', e.id)); }}>{t('discovery.explore.open')}</button>
                  </div>
                ))}
              </div>
            )}
          </Section>
        );
      })}
    </div>
  );
}

/* ───── Relationships ───── */
export function RelationshipsMode({ kind, list }: ModeProps) {
  const t = useT();
  const { selId, pick } = useSelect();
  const g = useMemo(() => resultGraph(list), [list]);
  if (g.nodes.length === 0) return <Empty icon="share" title={t('discovery.explore.none.title')} text={t('discovery.explore.rel.none')} />;
  return (
    <div className="ds-ex-fade">
      <div className="ds-graph" style={{ height: 480 }}>
        <Canvas label={t('discovery.explore.rel.label')} fitKey={`${kind}-${g.nodes.length}`} minimap={g.nodes.length > 12}
          nodes={g.nodes.map(({ id, x, y, w, h }) => ({ id, x, y, w, h }))}
          edges={g.edges.map((e) => ({ id: e.id, from: e.from, to: e.to, label: e.dim ? undefined : e.label, dim: e.dim, dashed: e.dim }))}
          nodeClass={(id) => (selId === id ? 'is-sel' : '')}
          renderNode={(id) => {
            const n = g.nodes.find((x) => x.id === id);
            return n ? <button type="button" className={`ds-node${selId === id ? ' is-on' : ''}`} style={{ width: '100%', opacity: n.core ? 1 : 0.8 }} onClick={() => pick(id)} aria-label={`${n.ent.name}, ${t(ENTITY_TYPE[n.ent.type])}`}><b>{n.ent.name}</b><small>{t(ENTITY_TYPE[n.ent.type])}{n.core ? '' : ` · ${t('discovery.explore.rel.related')}`}</small></button> : null;
          }} />
      </div>
      <p className="dw-muted dw-pad">{t('discovery.explore.rel.summary', { nodes: g.nodes.length, edges: g.edges.filter((e) => !e.dim).length })}</p>
    </div>
  );
}

/* ───── Map ───── */
const W = 560, H = 560, LAT0 = 6, LAT1 = -34, LON0 = -74, LON1 = -34;
const px = (lon: number) => ((lon - LON0) / (LON1 - LON0)) * W;
const py = (lat: number) => ((LAT0 - lat) / (LAT0 - LAT1)) * H;
export const hasGeo = (list: EntityCandidate[]) => list.some((e) => e.geo);

export function MapMode({ list }: ModeProps) {
  const t = useT();
  const go = useGo();
  const { pick } = useSelect();
  const clusters = useMemo(() => clusterGeo(list), [list]);
  const [open, setOpen] = useState<string | null>(null);
  const cur = clusters.find((c) => c.id === open);
  if (clusters.length === 0) return <Empty icon="pin" title={t('discovery.explore.map.none.title')} text={t('discovery.explore.map.none.text')} />;
  const lats = [0, -10, -20, -30], lons = [-70, -60, -50, -40];
  return (
    <div className="ds-ex-mapw ds-ex-fade">
      <svg className="ds-ex-map" viewBox={`0 0 ${W} ${H}`} role="group" aria-label={t('discovery.explore.map.label', { n: list.filter((e) => e.geo).length, g: clusters.length })}>
        {lats.map((l) => <g key={l}><line className="g" x1={0} x2={W} y1={py(l)} y2={py(l)} /><text className="gl" x={4} y={py(l) - 3}>{t('discovery.explore.map.south', { n: Math.abs(l) })}</text></g>)}
        {lons.map((l) => <g key={l}><line className="g" y1={0} y2={H} x1={px(l)} x2={px(l)} /><text className="gl" y={H - 4} x={px(l) + 3}>{t('discovery.explore.map.west', { n: Math.abs(l) })}</text></g>)}
        {clusters.map((c) => {
          const r = c.members.length > 1 ? 9 + Math.sqrt(c.members.length) * 4 : 7;
          return (
            <g key={c.id}>
              <circle className={`pt${open === c.id ? ' is-on' : ''}`} cx={px(c.lon)} cy={py(c.lat)} r={r} tabIndex={0} role="button" aria-label={c.members.length > 1 ? t('discovery.explore.map.near', { n: c.members.length, where: c.members[0]?.hq ?? '' }) : (c.members[0]?.name ?? t('discovery.explore.map.company'))}
                onClick={() => { setOpen(c.id); if (c.members.length === 1 && c.members[0]) pick(c.members[0].id); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(c.id); } }} />
              {c.members.length > 1 && <text className="pn" x={px(c.lon)} y={py(c.lat)}>{c.members.length}</text>}
            </g>
          );
        })}
      </svg>
      <aside className="ds-ex-panel" aria-live="polite">
        {!cur && <p className="dw-muted">{t('discovery.explore.map.hint')}</p>}
        {cur && (
          <>
            <h4>{cur.members.length > 1 ? t('discovery.explore.map.near', { n: cur.members.length, where: cur.members[0]?.hq?.split(',')[0] ?? '' }) : cur.members[0]?.name}</h4>
            {cur.members.map((e) => (
              <div key={e.id} className="dw-facts dw-facts--col" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 6 }}>
                {cur.members.length > 1 && <b>{e.name}</b>}
                <div className="dw-kv"><span>{t('discovery.explore.map.company')}</span><b>{e.name}</b></div>
                <div className="dw-kv"><span>{t('discovery.explore.map.locType')}</span><b>{t('discovery.explore.map.hq', { hq: e.hq ?? '' })}</b></div>
                <div className="dw-kv"><span>{t('discovery.explore.col.lastConfirmed')}</span><b>{ago(e.lastConfirmedMin)}</b></div>
                <div className="dw-kv"><span>{t('discovery.nav.evidence')}</span><b><TraceBtn evidenceId={evidenceOfEntity(e.id)} /></b></div>
              </div>
            ))}
            <Button size="sm" icon="pin" onPress={() => { useDs.getState().setHandoff({ kind: 'map', label: t('discovery.explore.map.handoff') }); useDs.getState().toast(t('discovery.explore.toast.map')); go('/maps'); }}>{t('discovery.explore.openMap')}</Button>
          </>
        )}
      </aside>
    </div>
  );
}

/* ───── Evidence ───── */
export function EvidenceMode({ list }: ModeProps) {
  const t = useT();
  const ids = new Set(list.map((e) => e.id));
  const obs = OBSERVATIONS.filter((o) => ids.has(o.subjectId)).slice(0, 40);
  const packs = EVIDENCE_PACKS.filter((p) => ids.has(p.subjectId));
  const go = useGo();
  const cols: Col<(typeof obs)[number]>[] = [
    { key: 's', label: t('discovery.explore.col.subject'), w: '130px', render: (o) => o.subject },
    { key: 'c', label: t('discovery.explore.col.claim'), w: 'minmax(200px, 2fr)', render: (o) => <span className="ds-ex-trunc" title={o.claim}>{o.claim}</span> },
    { key: 'v', label: t('discovery.explore.col.source'), w: 'minmax(120px, 1fr)', render: (o) => <span className="ds-ex-trunc">{sourceById(o.sourceId)?.name ?? o.sourceId}</span> },
    { key: 'f', label: t('discovery.explore.col.confidence'), w: '110px', render: (o) => <ConfChip v={confidenceOf(o)} needs /> },
    { key: 't', label: t('discovery.nav.evidence'), w: '96px', render: (o) => <TraceBtn evidenceId={o.evidenceIds[0]} /> },
  ];
  return (
    <div className="ds-ex-fade" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Section title={t('discovery.explore.ev.packs')} hint={`${packs.length}`}>
        {packs.length === 0 ? <p className="dw-more">{t('discovery.explore.none.title')}</p> : (
          <ul className="dw-hits" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 }}>
            {packs.map((p) => <li key={p.id} className="dw-more" style={{ display: 'flex', gap: 8, alignItems: 'center', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}><span style={{ flex: 1 }}>{p.claim}</span><span className="dw-muted">{t('discovery.explore.ev.packMeta', { n: p.evidence.length, c: p.contradictions })}</span><TraceBtn evidenceId={p.evidence[0]} /><button type="button" className="ds-trace" onClick={() => go(dpath('evidence', p.id))}>{t('discovery.explore.ev.openPack')}</button></li>)}
          </ul>
        )}
      </Section>
      <Section title={t('discovery.explore.ev.obsTitle')} hint={t('discovery.explore.ev.shown', { n: obs.length })}>
        <Grid cols={cols} rows={obs} id={(o) => o.id} label={t('discovery.nav.observations')} onRow={(o) => useDs.getState().select({ kind: 'observation', id: o.id })} empty={<p className="dw-more">{t('discovery.explore.none.title')}</p>} />
      </Section>
      {obs.length === 0 && observationsOf(list[0]?.id ?? '').length === 0 && <p className="dw-muted dw-pad">{t('discovery.explore.ev.note')}</p>}
    </div>
  );
}

/* ───── Sources ───── */
export function SourcesMode({ kind }: ModeProps) {
  const t = useT();
  const [f, setF] = useState<SourceClass | 'all'>('all');
  const all = candidateSources(kind);
  const rows = all.filter((c) => f === 'all' || c.cls === f);
  const classes: SourceClass[] = ['Relevant', 'Low relevance', 'Duplicate', 'Blocked', 'Policy restricted'];
  const go = useGo();
  const cols: Col<Candidate>[] = [
    { key: 'n', label: t('discovery.explore.col.source'), w: 'minmax(180px, 2fr)', render: (c) => <span className="ds-ex-trunc" title={c.src.url}>{c.src.name}</span> },
    { key: 't', label: t('discovery.explore.col.type'), w: '110px', render: (c) => t(SOURCE_TYPE[c.src.type]) },
    { key: 'a', label: t('discovery.explore.col.authority'), w: '96px', render: (c) => <AuthorityBadge a={c.src.authority} /> },
    { key: 'c', label: t('discovery.explore.col.classification'), w: '140px', render: (c) => <ClassBadge c={c.cls} /> },
    { key: 'r', label: t('discovery.explore.col.reason'), w: 'minmax(180px, 2fr)', render: (c) => c.src.blocked ? <span className="ds-ex-trunc" title={t(BLOCK_NOTE_ID[c.src.blocked])}>{t(BLOCK_LABEL_ID[c.src.blocked])} · {t(BLOCK_NOTE_ID[c.src.blocked])}</span> : c.cls === 'Duplicate' ? <span className="dw-muted">{t('discovery.explore.src.duplicate')}</span> : <span className="dw-muted">—</span> },
  ];
  return (
    <div className="ds-ex-fade" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="dw-chips" role="group" aria-label={t('discovery.explore.src.filter')}><Chip on={f === 'all'} onClick={() => setF('all')} n={all.length}>{t('discovery.explore.src.all')}</Chip>{classes.map((c) => <Chip key={c} on={f === c} onClick={() => setF(c)} n={all.filter((x) => x.cls === c).length}>{t(CLS_LABEL[c])}</Chip>)}</div>
      <Grid cols={cols} rows={rows} id={(c) => c.src.id} label={t('discovery.explore.src.evaluated')} onRow={(c) => useDs.getState().select({ kind: 'source', id: c.src.id })} empty={<p className="dw-more">{t('discovery.explore.none.title')}</p>} />
      <p className="dw-muted dw-pad">{t('discovery.explore.src.note')} <button type="button" className="ds-trace" onClick={() => go(dpath('sources'))}>{t('discovery.explore.openSources')}</button></p>
    </div>
  );
}

/* ───── Find Public Data ───── */
export function PublicDataMode() {
  const t = useT();
  const go = useGo();
  const rows = publicRows();
  const cols: Col<(typeof rows)[number]>[] = [
    { key: 'n', label: t('discovery.explore.col.source'), w: 'minmax(160px, 1.3fr)', render: (r) => <span className="ds-ex-trunc" title={r.src.url}>{r.src.name}</span> },
    { key: 'd', label: t('discovery.explore.col.description'), w: 'minmax(180px, 1.6fr)', render: (r) => { const d = t(r.descId, { type: t(SOURCE_TYPE[r.src.type]) }); return <span className="ds-ex-trunc" title={d}>{d}</span>; } },
    { key: 'f', label: t('discovery.explore.col.fields'), w: 'minmax(130px, 1.1fr)', render: (r) => { const f = r.fieldIds.map((id) => t(id)).join(', '); return <span className="ds-ex-trunc" title={f}>{f}</span>; } },
    { key: 'c', label: t('discovery.explore.col.coverage'), w: '104px', render: (r) => <ConfChip v={r.coverage} /> },
    { key: 'l', label: t('discovery.explore.col.license'), w: 'minmax(110px, .9fr)', render: (r) => <span className="ds-ex-trunc">{r.license}</span> },
    { key: 'a', label: t('discovery.explore.col.access'), w: '70px', render: (r) => r.access },
    { key: 'k', label: t('discovery.explore.col.country'), w: '64px', render: (r) => t(r.countryId) },
    { key: 'r', label: t('discovery.explore.col.freshness'), w: '74px', render: (r) => (r.freshnessMin >= 1440 ? t('discovery.explore.fresh.d', { n: Math.round(r.freshnessMin / 1440) }) : t('discovery.explore.fresh.min', { n: r.freshnessMin })) },
  ];
  return (
    <div className="ds-ex-fade" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Section title={t('discovery.explore.pub.title')} hint={t('discovery.explore.pub.hint', { n: rows.length })}>
        <Grid cols={cols} rows={rows} id={(r) => r.src.id} label={t('discovery.explore.pub.title')} onRow={(r) => useDs.getState().select({ kind: 'source', id: r.src.id })} />
      </Section>
      <div className="ds-ex-acts"><Button size="sm" variant="primary" icon="arrowRight" onPress={() => go(dpath('datasets', 'enrichment'))}>{t('discovery.explore.sendLde')}</Button><Button size="sm" onPress={() => go(dpath('sources'))}>{t('discovery.explore.openSources')}</Button></div>
      <p className="dw-muted dw-pad">{t('discovery.explore.pub.note')}</p>
    </div>
  );
}

/* ───── Changes recap ───── */
export function ChangesRecap() {
  const t = useT();
  const go = useGo();
  const list = weekChanges().slice(0, 4);
  return (
    <div className="ds-ex-fade" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Section title={t('discovery.explore.recap.title')} hint={t('discovery.explore.recap.hint', { n: weekChanges().length })}>
        {list.length === 0 ? <p className="dw-more">{t('discovery.explore.recap.none')}</p> : <div style={{ display: 'grid', gap: 8 }}>{list.map((c) => <SemanticChange key={c.id} c={c} />)}</div>}
      </Section>
      <div className="ds-ex-acts"><Button size="sm" variant="primary" icon="timeline" onPress={() => go(dpath('changes'))}>{t('discovery.explore.recap.open')}</Button></div>
    </div>
  );
}
