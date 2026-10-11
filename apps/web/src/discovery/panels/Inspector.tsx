import { Badge, Button } from '@biweb/ui';
import { CONFLICTS, DATASETS, MISSIONS, RUNS } from '../data/seed';
import { ago, changeById, confidenceOf, entityById, evidenceById, observationById, sourceById } from '../data/derive';
import { AuthorityBadge, ConfChip, ConfidenceBreakdown, Empty, HealthBadge, Kv, Section, SemanticChange, TraceBtn, dpath, useGo } from '../ui';
import { useDs } from '../store';

/** Inspetor contextual: o que está selecionado, de onde veio, quanto confiamos e para onde ir. */
export function Inspector() {
  const sel = useDs((s) => s.sel);
  const go = useGo();
  if (!sel) return <div className="dw-insp"><Empty icon="eye" title="Nothing selected" text="Select an entity, observation, source or change to see its evidence, confidence and history." /></div>;
  const Head = ({ kind, title, sub }: { kind: string; title: string; sub?: string }) => <div className="dw-insp-h"><small>{kind}</small><h3>{title}</h3>{sub && <p>{sub}</p>}</div>;
  if (sel.kind === 'entity') {
    const e = entityById(sel.id); if (!e) return null;
    return (
      <div className="dw-insp"><Head kind={`Entity · ${e.type}`} title={e.name} sub={e.hq ? `${e.hq}${e.industry ? ` · ${e.industry}` : ''}` : undefined} />
        <Section title="Confidence"><ConfChip v={e.confidence} needs />{e.verified ? <Badge tone="success" icon="check">Verified</Badge> : <Badge tone="warning">Needs review</Badge>}</Section>
        <Section title="Knowledge"><div className="dw-facts dw-facts--col"><Kv k="Sources" v={e.sources} /><Kv k="Evidence coverage" v={`${e.evidenceCoverage}%`} /><Kv k="Locations" v={e.locations} /><Kv k="Last confirmed" v={ago(e.lastConfirmedMin)} /><Kv k="Products" v={e.products.join(', ') || '—'} /></div></Section>
        <div className="dw-hyp-a"><Button size="sm" variant="primary" onPress={() => go(dpath('entities', e.id))}>Open entity</Button></div>
      </div>
    );
  }
  if (sel.kind === 'source') {
    const s = sourceById(sel.id); if (!s) return null;
    return (
      <div className="dw-insp"><Head kind={`Source · ${s.type}`} title={s.name} sub={s.url} />
        <div className="dw-c-badges"><AuthorityBadge a={s.authority} /><HealthBadge s={s} /></div>
        <Section title="Status"><div className="dw-facts dw-facts--col"><Kv k="Last checked" v={ago(s.lastCheckedMin)} /><Kv k="Snapshots" v={s.snapshots} /><Kv k="Changes" v={s.changes} /><Kv k="Used by" v={`${s.usedBy.length} missions`} /></div></Section>
        <Section title="Policy"><div className="dw-facts dw-facts--col"><Kv k="Access" v={s.policy.access} /><Kv k="Robots" v={s.policy.robots} /><Kv k="Retention" v={`${s.policy.retentionDays} days`} /><Kv k="License" v={s.policy.license} /></div></Section>
        <div className="dw-hyp-a"><Button size="sm" variant="primary" onPress={() => go(dpath('sources', s.id))}>Open source</Button></div>
      </div>
    );
  }
  if (sel.kind === 'observation') {
    const o = observationById(sel.id); if (!o) return null;
    return (
      <div className="dw-insp"><Head kind="Observation" title={`${o.subject} · ${o.claim}`} sub={o.value} />
        <Section title="Confidence"><ConfidenceBreakdown c={o.confidence} compact /></Section>
        <Section title="Evidence" hint={`${o.corroboration} source${o.corroboration > 1 ? 's' : ''}`}>{o.evidenceIds.length ? o.evidenceIds.map((id) => <div key={id} className="dw-hyp-a"><TraceBtn evidenceId={id} label={evidenceById(id)?.locator ?? 'Evidence'} /></div>) : <TraceBtn />}</Section>
        {o.aiNote && <p className="ds-ai"><b>AI interpretation</b>{o.aiNote}</p>}
        <div className="dw-hyp-a"><Button size="sm" variant="primary" onPress={() => go(dpath('observations', o.id))}>Open observation</Button></div>
      </div>
    );
  }
  if (sel.kind === 'change') {
    const c = changeById(sel.id); if (!c) return null;
    return (
      <div className="dw-insp"><Head kind="Semantic change" title={c.entity} sub={`Detected ${ago(c.detectedMin)}`} />
        <SemanticChange c={c} />
        <Section title="Evidence">{c.evidenceIds.length ? c.evidenceIds.map((id) => <div key={id} className="dw-hyp-a"><TraceBtn evidenceId={id} label={evidenceById(id)?.locator ?? 'Evidence'} /></div>) : <TraceBtn />}</Section>
        <div className="dw-hyp-a"><Button size="sm" variant="primary" onPress={() => go(dpath('changes', c.id))}>Review change</Button></div>
      </div>
    );
  }
  if (sel.kind === 'evidence') {
    const e = evidenceById(sel.id); if (!e) return null;
    const s = sourceById(e.sourceId);
    return (
      <div className="dw-insp"><Head kind={`Evidence · ${e.role}`} title={s?.name ?? e.sourceId} sub={e.locator} /><p className="ds-quote">{e.excerpt}</p><TraceBtn evidenceId={e.id} label="Open provenance" /></div>
    );
  }
  if (sel.kind === 'conflict') {
    const c = CONFLICTS.find((x) => x.id === sel.id); if (!c) return null;
    return <div className="dw-insp"><Head kind="Conflict" title={`${c.entity} · ${c.field}`} sub={`Recommended: ${c.recommended === 'a' ? c.a.value : c.b.value} — ${c.reason}`} /><div className="dw-hyp-a"><Button size="sm" variant="primary" onPress={() => go(dpath('conflicts', c.id))}>Review conflict</Button></div></div>;
  }
  if (sel.kind === 'mission') {
    const m = useDs.getState().missions.find((x) => x.id === sel.id) ?? MISSIONS.find((x) => x.id === sel.id); if (!m) return null;
    return <div className="dw-insp"><Head kind="Research Mission" title={m.name} sub={m.spec.objective} /><Section title="Status"><div className="dw-facts dw-facts--col"><Kv k="Last run" v={ago(m.lastRunMin)} /><Kv k="Next run" v={m.nextRun} /><Kv k="Entities" v={m.entities} /><Kv k="Observations" v={m.observations.toLocaleString('en-US')} /></div></Section><div className="dw-hyp-a"><Button size="sm" variant="primary" onPress={() => go(dpath('missions', m.id))}>Open mission</Button></div></div>;
  }
  if (sel.kind === 'dataset') {
    const d = DATASETS.find((x) => x.id === sel.id); if (!d) return null;
    return <div className="dw-insp"><Head kind="Discovery Dataset" title={`${d.name} v${d.version}`} sub={`${d.companies} companies · ${d.fields} fields · ${d.coverage}% evidence coverage`} /><div className="dw-hyp-a"><Button size="sm" variant="primary" onPress={() => go(dpath('datasets', d.id))}>Open dataset</Button></div></div>;
  }
  if (sel.kind === 'run') {
    const r = RUNS.find((x) => x.id === sel.id); if (!r) return null;
    return <div className="dw-insp"><Head kind="Run" title={`#${r.id}`} sub={r.name} /><Section title="Result"><div className="dw-facts dw-facts--col"><Kv k="Sources evaluated" v={r.evaluated} /><Kv k="Observations" v={r.observations} /><Kv k="Conflicts" v={r.conflicts} /></div></Section><div className="dw-hyp-a"><Button size="sm" variant="primary" onPress={() => go(dpath('runs', r.id))}>Open run</Button></div></div>;
  }
  return <div className="dw-insp"><Head kind="Node" title={sel.id} /></div>;
}
