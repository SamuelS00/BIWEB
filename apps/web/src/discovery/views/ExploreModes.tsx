import { useMemo, useState } from 'react';
import { Badge, Button, Icon } from '@biweb/ui';
import { BLOCK_LABEL, BLOCK_NOTE, CONFLICTS, EVIDENCE_PACKS, OBSERVATIONS } from '../data/seed';
import { ago, confidenceOf, observationsOf, sourceById } from '../data/derive';
import { BAND_LABEL, bandOf, candidateSources, changesCount, clusterGeo, evidenceOfEntity, publicRows, resultGraph, weekChanges, type Band, type Candidate, type QueryKind, type SourceClass } from '../data/explore';
import type { EntityCandidate } from '../data/types';
import { Canvas } from '../../dataworkspace/Canvas';
import { useDs } from '../store';
import { AuthorityBadge, Chip, ConfChip, Empty, Grid, KIND_ICON, Section, SemanticChange, TraceBtn, dpath, useGo, type Col } from '../ui';
import './explore.css';

export interface ModeProps { kind: QueryKind; list: EntityCandidate[] }

const CLS_TONE: Record<SourceClass, 'success' | 'neutral' | 'warning' | 'danger'> = { Relevant: 'success', 'Low relevance': 'neutral', Duplicate: 'neutral', Blocked: 'danger', 'Policy restricted': 'warning' };
export function ClassBadge({ c }: { c: SourceClass }) { return <Badge tone={CLS_TONE[c]} icon={c === 'Blocked' || c === 'Policy restricted' ? 'lock' : undefined}>{c}</Badge>; }

function useSelect() {
  const sel = useDs((s) => s.sel);
  return { selId: sel?.kind === 'entity' ? sel.id : null, pick: (id: string) => useDs.getState().select({ kind: 'entity', id }) };
}

/* ───── Overview ───── */
export function OverviewMode({ kind, list, onMode }: ModeProps & { onMode: (m: 'table' | 'sources' | 'evidence') => void }) {
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
        <Section title="Research summary" hint="Evidence-backed">
          <div className="dw-facts dw-facts--col">
            <div className="dw-kv"><span>Entities found</span><b>{list.length}</b></div>
            <div className="dw-kv"><span>Independent sources behind them</span><b>{nSrc}</b></div>
            <div className="dw-kv"><span>Open conflicts</span><b>{conflicts.length}</b></div>
            <div className="dw-kv"><span>Needs review</span><b>{review.length}</b></div>
          </div>
          <div className="ds-ai"><b>AI interpretation</b>{kind === 'fiber' || kind === 'sp' ? 'Most operators are concentrated in the Southeast and South. Regional operators outside the main capitals have thinner evidence; treat them as candidates until verified.' : 'Vendors are well documented through official pages. Pricing and AI capabilities changed most often in the last week. Interpretation only: open the evidence to confirm each claim.'}</div>
        </Section>
        <Section title="Attention">
          {review.length === 0 && conflicts.length === 0 && <div className="ds-ex-callout is-ok"><Icon name="check" size={12} />No conflicting evidence found.</div>}
          {review.length > 0 && <div className="ds-ex-callout"><Icon name="warning" size={12} /><span><b>{review.length} needs review</b>: {review.map((e) => e.name).join(', ')}. Single-source or weak entity match.</span></div>}
          {conflicts.map((c) => <div key={c.id} className="ds-ex-callout"><Icon name="warning" size={12} /><span><b>{c.entity}</b> · {c.field}: sources disagree. <button type="button" className="ds-trace" onClick={() => go(dpath('conflicts', c.id))}>Open conflict</button></span></div>)}
        </Section>
      </div>
      <Section title="Top entities" actions={<Button size="sm" variant="ghost" onPress={() => onMode('table')}>View table</Button>}>
        <EntityTable list={top} selId={selId} onPick={pick} />
      </Section>
      <Section title="Sources used" actions={<Button size="sm" variant="ghost" onPress={() => onMode('sources')}>All sources evaluated</Button>}>
        <ul className="dw-hits" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {used.map(({ src }) => <li key={src.id} className="dw-more" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><AuthorityBadge a={src.authority} /><span className="ds-ex-trunc">{src.name}</span><span className="dw-muted">{src.type}</span></li>)}
          {used.length === 0 && <li className="dw-more">No observations found yet.</li>}
        </ul>
      </Section>
    </div>
  );
}

/* ───── Table ───── */
function EntityTable({ list, selId, onPick }: { list: EntityCandidate[]; selId: string | null; onPick: (id: string) => void }) {
  const go = useGo();
  const cols: Col<EntityCandidate>[] = [
    { key: 't', label: 'Type', w: '92px', render: (e) => <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><Icon name={KIND_ICON[e.type] ?? 'cube'} size={12} />{e.type}</span> },
    { key: 'n', label: 'Entity', w: 'minmax(150px, 1.4fr)', render: (e) => <span className="ds-ex-name"><b>{e.name}</b>{e.hq && <small>{e.hq}</small>}</span> },
    { key: 'c', label: 'Confidence', w: '110px', render: (e) => <ConfChip v={e.confidence} needs /> },
    { key: 's', label: 'Sources', w: '58px', right: true, render: (e) => <span className="bw-num">{e.sources}</span> },
    { key: 'l', label: 'Last confirmed', w: '96px', render: (e) => ago(e.lastConfirmedMin) },
    { key: 'p', label: 'Products', w: 'minmax(120px, 1.2fr)', render: (e) => <span className="ds-ex-trunc" title={e.products.join(', ')}>{e.products.join(', ') || '—'}</span> },
    { key: 'g', label: 'Locations', w: '70px', right: true, render: (e) => <span className="bw-num">{e.locations || '—'}</span> },
    { key: 'ch', label: 'Changes', w: '66px', right: true, render: (e) => <span className="bw-num">{changesCount(e.id)}</span> },
    { key: 'o', label: '', w: '58px', right: true, render: (e) => <Button size="sm" variant="ghost" aria-label={`Open ${e.name}`} onPress={() => go(dpath('entities', e.id))}>Open</Button> },
  ];
  return <Grid cols={cols} rows={list} id={(e) => e.id} selected={selId} onRow={(e) => onPick(e.id)} label="Entities in this result" empty={<p className="dw-more">No observations found yet.</p>} />;
}
export function TableMode({ list }: ModeProps) {
  const { selId, pick } = useSelect();
  const [sort, setSort] = useState<'confidence' | 'name' | 'sources'>('confidence');
  const rows = useMemo(() => [...list].sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : sort === 'sources' ? b.sources - a.sources : b.confidence - a.confidence)), [list, sort]);
  return (
    <div className="ds-ex-fade" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="dw-chips" role="group" aria-label="Sort"><span className="dw-muted">Sort by</span>{(['confidence', 'name', 'sources'] as const).map((s) => <Chip key={s} on={sort === s} onClick={() => setSort(s)}>{s}</Chip>)}</div>
      <EntityTable list={rows} selId={selId} onPick={pick} />
    </div>
  );
}

/* ───── Entities (por faixa de confiança) ───── */
export function EntitiesMode({ list }: ModeProps) {
  const go = useGo();
  const { selId, pick } = useSelect();
  const bands: Band[] = ['high', 'medium', 'review'];
  return (
    <div className="ds-ex-fade" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {bands.map((b) => {
        const items = list.filter((e) => bandOf(e.confidence) === b);
        return (
          <Section key={b} title={BAND_LABEL[b]} hint={`${items.length}`}>
            {items.length === 0 ? <p className="dw-more">No conflicting evidence found.</p> : (
              <div className="dw-cards">
                {items.map((e) => (
                  <div key={e.id} className={`dw-card ds-ex-ent${selId === e.id ? ' is-on' : ''}`} role="button" tabIndex={0} aria-label={`${e.name}, confidence ${e.confidence}%`} onClick={() => pick(e.id)}
                    onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(e.id); } }} onDoubleClick={() => go(dpath('entities', e.id))}>
                    <b style={{ fontSize: 13 }}>{e.name}</b>
                    <span className="dw-muted">{e.hq ?? e.type} · {e.sources} sources</span>
                    <ConfChip v={e.confidence} needs />
                    <button type="button" className="ds-trace" onClick={(ev) => { ev.stopPropagation(); go(dpath('entities', e.id)); }}>Open</button>
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
  const { selId, pick } = useSelect();
  const g = useMemo(() => resultGraph(list), [list]);
  if (g.nodes.length === 0) return <Empty icon="share" title="No observations found yet." text="This result has no entity relationships." />;
  return (
    <div className="ds-ex-fade">
      <div className="ds-graph" style={{ height: 480 }}>
        <Canvas label={`Relationships for ${kind} result`} fitKey={`${kind}-${g.nodes.length}`} minimap={g.nodes.length > 12}
          nodes={g.nodes.map(({ id, x, y, w, h }) => ({ id, x, y, w, h }))}
          edges={g.edges.map((e) => ({ id: e.id, from: e.from, to: e.to, label: e.dim ? undefined : e.label, dim: e.dim, dashed: e.dim }))}
          nodeClass={(id) => (selId === id ? 'is-sel' : '')}
          renderNode={(id) => {
            const n = g.nodes.find((x) => x.id === id);
            return n ? <button type="button" className={`ds-node${selId === id ? ' is-on' : ''}`} style={{ width: '100%', opacity: n.core ? 1 : 0.8 }} onClick={() => pick(id)} aria-label={`${n.ent.name}, ${n.ent.type}`}><b>{n.ent.name}</b><small>{n.ent.type}{n.core ? '' : ' · related'}</small></button> : null;
          }} />
      </div>
      <p className="dw-muted dw-pad">{g.nodes.length} nodes · {g.edges.filter((e) => !e.dim).length} evidenced relationships. Dashed lines are inferred from the query scope.</p>
    </div>
  );
}

/* ───── Map ───── */
const W = 560, H = 560, LAT0 = 6, LAT1 = -34, LON0 = -74, LON1 = -34;
const px = (lon: number) => ((lon - LON0) / (LON1 - LON0)) * W;
const py = (lat: number) => ((LAT0 - lat) / (LAT0 - LAT1)) * H;
export const hasGeo = (list: EntityCandidate[]) => list.some((e) => e.geo);

export function MapMode({ list }: ModeProps) {
  const go = useGo();
  const { pick } = useSelect();
  const clusters = useMemo(() => clusterGeo(list), [list]);
  const [open, setOpen] = useState<string | null>(null);
  const cur = clusters.find((c) => c.id === open);
  if (clusters.length === 0) return <Empty icon="pin" title="No geographic data in this result." text="Entities here have no verified coordinates. Open the Table for headquarters text." />;
  const lats = [0, -10, -20, -30], lons = [-70, -60, -50, -40];
  return (
    <div className="ds-ex-mapw ds-ex-fade">
      <svg className="ds-ex-map" viewBox={`0 0 ${W} ${H}`} role="group" aria-label={`Map of ${list.filter((e) => e.geo).length} entities in ${clusters.length} groups`}>
        {lats.map((l) => <g key={l}><line className="g" x1={0} x2={W} y1={py(l)} y2={py(l)} /><text className="gl" x={4} y={py(l) - 3}>{Math.abs(l)}°S</text></g>)}
        {lons.map((l) => <g key={l}><line className="g" y1={0} y2={H} x1={px(l)} x2={px(l)} /><text className="gl" y={H - 4} x={px(l) + 3}>{Math.abs(l)}°W</text></g>)}
        {clusters.map((c) => {
          const r = c.members.length > 1 ? 9 + Math.sqrt(c.members.length) * 4 : 7;
          return (
            <g key={c.id}>
              <circle className={`pt${open === c.id ? ' is-on' : ''}`} cx={px(c.lon)} cy={py(c.lat)} r={r} tabIndex={0} role="button" aria-label={c.members.length > 1 ? `${c.members.length} companies near ${c.members[0]?.hq ?? ''}` : (c.members[0]?.name ?? 'Company')}
                onClick={() => { setOpen(c.id); if (c.members.length === 1 && c.members[0]) pick(c.members[0].id); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(c.id); } }} />
              {c.members.length > 1 && <text className="pn" x={px(c.lon)} y={py(c.lat)}>{c.members.length}</text>}
            </g>
          );
        })}
      </svg>
      <aside className="ds-ex-panel" aria-live="polite">
        {!cur && <p className="dw-muted">Select a point to see the company, location type and evidence. Close points are grouped into clusters with counts.</p>}
        {cur && (
          <>
            <h4>{cur.members.length > 1 ? `${cur.members.length} companies near ${cur.members[0]?.hq?.split(',')[0]}` : cur.members[0]?.name}</h4>
            {cur.members.map((e) => (
              <div key={e.id} className="dw-facts dw-facts--col" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 6 }}>
                {cur.members.length > 1 && <b>{e.name}</b>}
                <div className="dw-kv"><span>Company</span><b>{e.name}</b></div>
                <div className="dw-kv"><span>Location type</span><b>Headquarters · {e.hq}</b></div>
                <div className="dw-kv"><span>Last confirmed</span><b>{ago(e.lastConfirmedMin)}</b></div>
                <div className="dw-kv"><span>Evidence</span><b><TraceBtn evidenceId={evidenceOfEntity(e.id)} /></b></div>
              </div>
            ))}
            <Button size="sm" icon="pin" onPress={() => { useDs.getState().setHandoff({ kind: 'map', label: 'Explore result' }); useDs.getState().toast('Opening result in Map Builder'); go('/maps'); }}>Open in Map Builder</Button>
          </>
        )}
      </aside>
    </div>
  );
}

/* ───── Evidence ───── */
export function EvidenceMode({ list }: ModeProps) {
  const ids = new Set(list.map((e) => e.id));
  const obs = OBSERVATIONS.filter((o) => ids.has(o.subjectId)).slice(0, 40);
  const packs = EVIDENCE_PACKS.filter((p) => ids.has(p.subjectId));
  const go = useGo();
  const cols: Col<(typeof obs)[number]>[] = [
    { key: 's', label: 'Subject', w: '130px', render: (o) => o.subject },
    { key: 'c', label: 'Claim', w: 'minmax(200px, 2fr)', render: (o) => <span className="ds-ex-trunc" title={o.claim}>{o.claim}</span> },
    { key: 'v', label: 'Source', w: 'minmax(120px, 1fr)', render: (o) => <span className="ds-ex-trunc">{sourceById(o.sourceId)?.name ?? o.sourceId}</span> },
    { key: 'f', label: 'Confidence', w: '110px', render: (o) => <ConfChip v={confidenceOf(o)} needs /> },
    { key: 't', label: 'Evidence', w: '96px', render: (o) => <TraceBtn evidenceId={o.evidenceIds[0]} /> },
  ];
  return (
    <div className="ds-ex-fade" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Section title="Evidence packs" hint={`${packs.length}`}>
        {packs.length === 0 ? <p className="dw-more">No observations found yet.</p> : (
          <ul className="dw-hits" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 }}>
            {packs.map((p) => <li key={p.id} className="dw-more" style={{ display: 'flex', gap: 8, alignItems: 'center', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}><span style={{ flex: 1 }}>{p.claim}</span><span className="dw-muted">{p.evidence.length} evidence · {p.contradictions}</span><TraceBtn evidenceId={p.evidence[0]} /><button type="button" className="ds-trace" onClick={() => go(dpath('evidence', p.id))}>Open pack</button></li>)}
          </ul>
        )}
      </Section>
      <Section title="Observations behind the result" hint={`${obs.length} shown`}>
        <Grid cols={cols} rows={obs} id={(o) => o.id} label="Observations" onRow={(o) => useDs.getState().select({ kind: 'observation', id: o.id })} empty={<p className="dw-more">No observations found yet.</p>} />
      </Section>
      {obs.length === 0 && observationsOf(list[0]?.id ?? '').length === 0 && <p className="dw-muted dw-pad">Entities without evidence are marked Needs verification wherever they appear.</p>}
    </div>
  );
}

/* ───── Sources ───── */
export function SourcesMode({ kind }: ModeProps) {
  const [f, setF] = useState<SourceClass | 'all'>('all');
  const all = candidateSources(kind);
  const rows = all.filter((c) => f === 'all' || c.cls === f);
  const classes: SourceClass[] = ['Relevant', 'Low relevance', 'Duplicate', 'Blocked', 'Policy restricted'];
  const go = useGo();
  const cols: Col<Candidate>[] = [
    { key: 'n', label: 'Source', w: 'minmax(180px, 2fr)', render: (c) => <span className="ds-ex-trunc" title={c.src.url}>{c.src.name}</span> },
    { key: 't', label: 'Type', w: '110px', render: (c) => c.src.type },
    { key: 'a', label: 'Authority', w: '96px', render: (c) => <AuthorityBadge a={c.src.authority} /> },
    { key: 'c', label: 'Classification', w: '140px', render: (c) => <ClassBadge c={c.cls} /> },
    { key: 'r', label: 'Reason', w: 'minmax(180px, 2fr)', render: (c) => c.src.blocked ? <span className="ds-ex-trunc" title={BLOCK_NOTE[c.src.blocked]}>{BLOCK_LABEL[c.src.blocked]} · {BLOCK_NOTE[c.src.blocked]}</span> : c.cls === 'Duplicate' ? <span className="dw-muted">Mirror of an already evaluated original; counts as one evidence.</span> : <span className="dw-muted">—</span> },
  ];
  return (
    <div className="ds-ex-fade" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="dw-chips" role="group" aria-label="Filter by classification"><Chip on={f === 'all'} onClick={() => setF('all')} n={all.length}>All</Chip>{classes.map((c) => <Chip key={c} on={f === c} onClick={() => setF(c)} n={all.filter((x) => x.cls === c).length}>{c}</Chip>)}</div>
      <Grid cols={cols} rows={rows} id={(c) => c.src.id} label="Sources evaluated" onRow={(c) => useDs.getState().select({ kind: 'source', id: c.src.id })} empty={<p className="dw-more">No observations found yet.</p>} />
      <p className="dw-muted dw-pad">Sample of the sources evaluated. Blocked sources are never bypassed: authentication, CAPTCHA and rate limits are respected. <button type="button" className="ds-trace" onClick={() => go(dpath('sources'))}>Open Sources</button></p>
    </div>
  );
}

/* ───── Find Public Data ───── */
export function PublicDataMode() {
  const go = useGo();
  const rows = publicRows();
  const cols: Col<(typeof rows)[number]>[] = [
    { key: 'n', label: 'Source', w: 'minmax(160px, 1.3fr)', render: (r) => <span className="ds-ex-trunc" title={r.src.url}>{r.src.name}</span> },
    { key: 'd', label: 'Description', w: 'minmax(180px, 1.6fr)', render: (r) => <span className="ds-ex-trunc" title={r.description}>{r.description}</span> },
    { key: 'f', label: 'Fields', w: 'minmax(130px, 1.1fr)', render: (r) => <span className="ds-ex-trunc" title={r.fields.join(', ')}>{r.fields.join(', ')}</span> },
    { key: 'c', label: 'Coverage (est.)', w: '104px', render: (r) => <ConfChip v={r.coverage} /> },
    { key: 'l', label: 'License', w: 'minmax(110px, .9fr)', render: (r) => <span className="ds-ex-trunc">{r.license}</span> },
    { key: 'a', label: 'Access', w: '70px', render: (r) => r.access },
    { key: 'k', label: 'Country', w: '64px', render: (r) => r.country },
    { key: 'r', label: 'Freshness', w: '74px', render: (r) => r.freshness },
  ];
  return (
    <div className="ds-ex-fade" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Section title="Public data sources" hint={`${rows.length} reference sources`}>
        <Grid cols={cols} rows={rows} id={(r) => r.src.id} label="Public data sources" onRow={(r) => useDs.getState().select({ kind: 'source', id: r.src.id })} />
      </Section>
      <div className="ds-ex-acts"><Button size="sm" variant="primary" icon="arrowRight" onPress={() => go(dpath('datasets', 'enrichment'))}>Send to LDE</Button><Button size="sm" onPress={() => go(dpath('sources'))}>Open Sources</Button></div>
      <p className="dw-muted dw-pad">The BDE proposes these as enrichment candidates. Nothing is applied: the LDE validates each field first.</p>
    </div>
  );
}

/* ───── Changes recap ───── */
export function ChangesRecap() {
  const go = useGo();
  const list = weekChanges().slice(0, 4);
  return (
    <div className="ds-ex-fade" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Section title="Recap: changes this week" hint={`${weekChanges().length} detected`}>
        {list.length === 0 ? <p className="dw-more">No relevant changes detected.</p> : <div style={{ display: 'grid', gap: 8 }}>{list.map((c) => <SemanticChange key={c.id} c={c} />)}</div>}
      </Section>
      <div className="ds-ex-acts"><Button size="sm" variant="primary" icon="timeline" onPress={() => go(dpath('changes'))}>Open Changes</Button></div>
    </div>
  );
}
