import { Badge, Button } from '@biweb/ui';
import { CONFLICTS, DATASETS, MISSIONS, RUNS } from '../data/seed';
import { ago, changeById, confidenceOf, entityById, evidenceById, observationById, sourceById } from '../data/derive';
import { AuthorityBadge, ConfChip, ConfidenceBreakdown, Empty, HealthBadge, Kv, Section, SemanticChange, TraceBtn, dpath, useGo } from '../ui';
import { useDs } from '../store';
import { useT, useFormat } from '../../i18n/intl';

/** Inspetor contextual: o que está selecionado, de onde veio, quanto confiamos e para onde ir. */
export function Inspector() {
  const sel = useDs((s) => s.sel);
  const go = useGo();
  const t = useT();
  const fmt = useFormat();
  if (!sel) return <div className="dw-insp"><Empty icon="eye" title={t('discovery.inspector.nothingTitle')} text={t('discovery.inspector.nothingText')} /></div>;
  const Head = ({ kind, title, sub }: { kind: string; title: string; sub?: string }) => <div className="dw-insp-h"><small>{kind}</small><h3>{title}</h3>{sub && <p>{sub}</p>}</div>;
  if (sel.kind === 'entity') {
    const e = entityById(sel.id); if (!e) return null;
    return (
      <div className="dw-insp"><Head kind={t('discovery.inspector.entityKind', { type: e.type })} title={e.name} sub={e.hq ? `${e.hq}${e.industry ? ` · ${e.industry}` : ''}` : undefined} />
        <Section title={t('discovery.inspector.confidence')}><ConfChip v={e.confidence} needs />{e.verified ? <Badge tone="success" icon="check">{t('discovery.inspector.verified')}</Badge> : <Badge tone="warning">{t('discovery.inspector.needsReview')}</Badge>}</Section>
        <Section title={t('discovery.inspector.knowledge')}><div className="dw-facts dw-facts--col"><Kv k={t('discovery.inspector.sources')} v={e.sources} /><Kv k={t('discovery.inspector.coverage')} v={`${e.evidenceCoverage}%`} /><Kv k={t('discovery.inspector.locations')} v={e.locations} /><Kv k={t('discovery.inspector.lastConfirmed')} v={ago(e.lastConfirmedMin)} /><Kv k={t('discovery.inspector.products')} v={e.products.join(', ') || '—'} /></div></Section>
        <div className="dw-hyp-a"><Button size="sm" variant="primary" onPress={() => go(dpath('entities', e.id))}>{t('discovery.inspector.openEntity')}</Button></div>
      </div>
    );
  }
  if (sel.kind === 'source') {
    const s = sourceById(sel.id); if (!s) return null;
    return (
      <div className="dw-insp"><Head kind={t('discovery.inspector.sourceKind', { type: s.type })} title={s.name} sub={s.url} />
        <div className="dw-c-badges"><AuthorityBadge a={s.authority} /><HealthBadge s={s} /></div>
        <Section title={t('discovery.inspector.status')}><div className="dw-facts dw-facts--col"><Kv k={t('discovery.inspector.lastChecked')} v={ago(s.lastCheckedMin)} /><Kv k={t('discovery.inspector.snapshots')} v={s.snapshots} /><Kv k={t('discovery.inspector.changes')} v={s.changes} /><Kv k={t('discovery.inspector.usedBy')} v={t('discovery.inspector.missionsCount', { count: s.usedBy.length })} /></div></Section>
        <Section title={t('discovery.inspector.policy')}><div className="dw-facts dw-facts--col"><Kv k={t('discovery.inspector.access')} v={s.policy.access} /><Kv k={t('discovery.inspector.robots')} v={s.policy.robots} /><Kv k={t('discovery.inspector.retention')} v={t('discovery.inspector.days', { count: s.policy.retentionDays })} /><Kv k={t('discovery.inspector.license')} v={s.policy.license} /></div></Section>
        <div className="dw-hyp-a"><Button size="sm" variant="primary" onPress={() => go(dpath('sources', s.id))}>{t('discovery.inspector.openSource')}</Button></div>
      </div>
    );
  }
  if (sel.kind === 'observation') {
    const o = observationById(sel.id); if (!o) return null;
    return (
      <div className="dw-insp"><Head kind={t('discovery.inspector.observation')} title={`${o.subject} · ${o.claim}`} sub={o.value} />
        <Section title={t('discovery.inspector.confidence')}><ConfidenceBreakdown c={o.confidence} compact /></Section>
        <Section title={t('discovery.inspector.evidence')} hint={t('discovery.inspector.sourcesCount', { count: o.corroboration })}>{o.evidenceIds.length ? o.evidenceIds.map((id) => <div key={id} className="dw-hyp-a"><TraceBtn evidenceId={id} label={evidenceById(id)?.locator ?? t('discovery.inspector.evidence')} /></div>) : <TraceBtn />}</Section>
        {o.aiNote && <p className="ds-ai"><b>{t('discovery.inspector.aiNote')}</b>{o.aiNote}</p>}
        <div className="dw-hyp-a"><Button size="sm" variant="primary" onPress={() => go(dpath('observations', o.id))}>{t('discovery.inspector.openObservation')}</Button></div>
      </div>
    );
  }
  if (sel.kind === 'change') {
    const c = changeById(sel.id); if (!c) return null;
    return (
      <div className="dw-insp"><Head kind={t('discovery.inspector.semantic')} title={c.entity} sub={t('discovery.inspector.detected', { when: ago(c.detectedMin) })} />
        <SemanticChange c={c} />
        <Section title={t('discovery.inspector.evidence')}>{c.evidenceIds.length ? c.evidenceIds.map((id) => <div key={id} className="dw-hyp-a"><TraceBtn evidenceId={id} label={evidenceById(id)?.locator ?? t('discovery.inspector.evidence')} /></div>) : <TraceBtn />}</Section>
        <div className="dw-hyp-a"><Button size="sm" variant="primary" onPress={() => go(dpath('changes', c.id))}>{t('discovery.inspector.reviewChange')}</Button></div>
      </div>
    );
  }
  if (sel.kind === 'evidence') {
    const e = evidenceById(sel.id); if (!e) return null;
    const s = sourceById(e.sourceId);
    return (
      <div className="dw-insp"><Head kind={t('discovery.inspector.evidenceKind', { role: e.role })} title={s?.name ?? e.sourceId} sub={e.locator} /><p className="ds-quote">{e.excerpt}</p><TraceBtn evidenceId={e.id} label={t('discovery.inspector.openProvenance')} /></div>
    );
  }
  if (sel.kind === 'conflict') {
    const c = CONFLICTS.find((x) => x.id === sel.id); if (!c) return null;
    return <div className="dw-insp"><Head kind={t('discovery.inspector.conflict')} title={`${c.entity} · ${c.field}`} sub={t('discovery.inspector.recommended', { value: c.recommended === 'a' ? c.a.value : c.b.value, reason: c.reason })} /><div className="dw-hyp-a"><Button size="sm" variant="primary" onPress={() => go(dpath('conflicts', c.id))}>{t('discovery.inspector.reviewConflict')}</Button></div></div>;
  }
  if (sel.kind === 'mission') {
    const m = useDs.getState().missions.find((x) => x.id === sel.id) ?? MISSIONS.find((x) => x.id === sel.id); if (!m) return null;
    return <div className="dw-insp"><Head kind={t('discovery.inspector.mission')} title={m.name} sub={m.spec.objective} /><Section title={t('discovery.inspector.status')}><div className="dw-facts dw-facts--col"><Kv k={t('discovery.inspector.lastRun')} v={ago(m.lastRunMin)} /><Kv k={t('discovery.inspector.nextRun')} v={m.nextRun} /><Kv k={t('discovery.inspector.entities')} v={m.entities} /><Kv k={t('discovery.inspector.observations')} v={fmt.integer(m.observations)} /></div></Section><div className="dw-hyp-a"><Button size="sm" variant="primary" onPress={() => go(dpath('missions', m.id))}>{t('discovery.inspector.openMission')}</Button></div></div>;
  }
  if (sel.kind === 'dataset') {
    const d = DATASETS.find((x) => x.id === sel.id); if (!d) return null;
    return <div className="dw-insp"><Head kind={t('discovery.inspector.dataset')} title={`${d.name} v${d.version}`} sub={t('discovery.inspector.datasetSub', { companies: d.companies, fields: d.fields, coverage: d.coverage })} /><div className="dw-hyp-a"><Button size="sm" variant="primary" onPress={() => go(dpath('datasets', d.id))}>{t('discovery.inspector.openDataset')}</Button></div></div>;
  }
  if (sel.kind === 'run') {
    const r = RUNS.find((x) => x.id === sel.id); if (!r) return null;
    return <div className="dw-insp"><Head kind={t('discovery.inspector.run')} title={`#${r.id}`} sub={r.name} /><Section title={t('discovery.inspector.result')}><div className="dw-facts dw-facts--col"><Kv k={t('discovery.inspector.sourcesEvaluated')} v={r.evaluated} /><Kv k={t('discovery.inspector.observations')} v={r.observations} /><Kv k={t('discovery.inspector.conflicts')} v={r.conflicts} /></div></Section><div className="dw-hyp-a"><Button size="sm" variant="primary" onPress={() => go(dpath('runs', r.id))}>{t('discovery.inspector.openRun')}</Button></div></div>;
  }
  return <div className="dw-insp"><Head kind={t('discovery.inspector.node')} title={sel.id} /></div>;
}
