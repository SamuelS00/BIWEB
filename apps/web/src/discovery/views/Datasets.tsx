import { useMemo, useState } from 'react';
import { Badge, Button, Dialog, Icon } from '@biweb/ui';
import { DATASETS, PROPOSALS } from '../data/seed';
import { ago, sourceById } from '../data/derive';
import { REPORT_CHAIN, REPORT_SUGGESTIONS, WORKFLOW_CHAIN, changesOfDataset, locationsOf, schemaOf, versionsOf, type FieldRow, type LocRow } from '../data/datasets';
import { evidenceOfEntity } from '../data/explore';
import type { EnrichmentProposal, ResearchDataset } from '../data/types';
import { useDw } from '../../dataworkspace/store';
import { useDs } from '../store';
import './explore.css';
import { ConfChip, Empty, Grid, Kv, Meter, Section, SemanticChange, StepList, TraceBtn, ViewHead, dpath, useGo, useSteps, type Col } from '../ui';

export function DatasetsView({ id }: { id?: string }) {
  if (id === 'enrichment') return <EnrichmentView />;
  const d = DATASETS.find((x) => x.id === id);
  return d ? <DatasetDetail d={d} /> : <DatasetList />;
}

const missionName = (id: string) => useDs.getState().missions.find((m) => m.id === id)?.name ?? id;

/* ───── Lista ───── */
function DatasetList() {
  const go = useGo();
  const sel = useDs((s) => s.sel), proposals = useDs((s) => s.proposals);
  const open = PROPOSALS.filter((p) => (proposals[p.id] ?? p.status) === 'proposed').length;
  const cols: Col<ResearchDataset>[] = [
    { key: 'n', label: 'Dataset', w: 'minmax(170px, 1.6fr)', render: (d) => <b>{d.name}</b> },
    { key: 'v', label: 'Version', w: '66px', render: (d) => <Badge>v{d.version}</Badge> },
    { key: 'c', label: 'Companies', w: '80px', right: true, render: (d) => <span className="bw-num">{d.companies}</span> },
    { key: 'f', label: 'Fields', w: '60px', right: true, render: (d) => <span className="bw-num">{d.fields}</span> },
    { key: 'e', label: 'Evidence coverage', w: '140px', render: (d) => <span className="dw-qcell"><Meter v={d.coverage} /><b className="bw-num">{d.coverage}%</b></span> },
    { key: 'h', label: 'Changes vs previous', w: '110px', right: true, render: (d) => <span className="bw-num">{d.changesSinceLast}</span> },
    { key: 'u', label: 'Updated', w: '130px', render: (d) => d.updated },
    { key: 'm', label: 'Mission', w: 'minmax(130px, 1fr)', render: (d) => <span className="dw-muted">{missionName(d.missionId)}</span> },
    { key: 'o', label: '', w: '58px', right: true, render: (d) => <Button size="sm" variant="ghost" aria-label={`Open ${d.name}`} onPress={() => go(dpath('datasets', d.id))}>Open</Button> },
  ];
  return (
    <div className="dw-view">
      <ViewHead title="Datasets" sub="Versioned Discovery Datasets built from evidence. Hand them to the LDE, Maps, Reports and Workflows." />
      <Grid cols={cols} rows={DATASETS} id={(d) => d.id} selected={sel?.kind === 'dataset' ? sel.id : null} onRow={(d) => useDs.getState().select({ kind: 'dataset', id: d.id })} label="Discovery datasets" />
      <Section title="BDE → LDE Enrichment" hint="The LDE reviews and applies; the BDE never edits your model">
        <div className="ds-ex-callout" style={{ alignItems: 'center' }}>
          <Icon name="bolt" size={12} /><span style={{ flex: 1 }}><b>{open} open proposals</b> to enrich internal entities with external observations.</span>
          <Button size="sm" variant="primary" onPress={() => go(dpath('datasets', 'enrichment'))}>Review proposals</Button>
        </div>
      </Section>
    </div>
  );
}

/* ───── Detalhe ───── */
type Flow = 'report' | 'map' | 'workflow' | null;
function DatasetDetail({ d }: { d: ResearchDataset }) {
  const go = useGo();
  const [flow, setFlow] = useState<Flow>(null);
  const [tab, setTab] = useState<string>(REPORT_SUGGESTIONS[0]!);
  const fields = useMemo(() => schemaOf(d), [d]);
  const versions = useMemo(() => versionsOf(d), [d]);
  const changes = useMemo(() => changesOfDataset(d), [d]);
  const locs = useMemo(() => locationsOf(d), [d]);
  const fc: Col<FieldRow>[] = [
    { key: 'f', label: 'Field', w: 'minmax(150px, 1.4fr)', render: (r) => <span className="bw-mono">{r.name}</span> },
    { key: 'g', label: 'Group', w: '110px', render: (r) => <span className="dw-muted">{r.group}</span> },
    { key: 't', label: 'Type', w: '80px', render: (r) => r.type },
    { key: 'c', label: 'Coverage', w: '140px', render: (r) => <span className="dw-qcell"><Meter v={r.coverage} /><b className="bw-num">{r.coverage}%</b></span> },
    { key: 's', label: 'Sources', w: '64px', right: true, render: (r) => <span className="bw-num">{r.sources}</span> },
  ];
  const lc: Col<LocRow>[] = [
    { key: 'c', label: 'Company', w: 'minmax(140px, 1.2fr)', render: (r) => r.company },
    { key: 'l', label: 'Location', w: 'minmax(120px, 1fr)', render: (r) => r.location },
    { key: 't', label: 'Type', w: '110px', render: (r) => r.type },
    { key: 'e', label: 'Evidence', w: '110px', render: (r) => <TraceBtn evidenceId={evidenceOfEntity(r.entityId)} /> },
    { key: 'a', label: 'Last confirmed', w: '110px', render: (r) => ago(r.lastMin) },
  ];
  const confirm = (kind: 'report' | 'map' | 'workflow') => {
    const ds = useDs.getState();
    ds.setHandoff({ kind, label: kind === 'report' ? tab : d.name, datasetId: d.id });
    ds.toast(kind === 'report' ? `Opening Report Builder with ${tab}` : kind === 'map' ? 'Opening Map Builder with dataset locations' : 'Opening Workflows with the monitoring template');
    setFlow(null);
    go(kind === 'report' ? '/reports/novo/edit' : kind === 'map' ? '/maps' : '/workflows');
  };
  return (
    <div className="dw-view">
      <ViewHead title={`${d.name} v${d.version}`} sub={`${d.companies} companies · ${d.fields} fields · ${d.coverage}% evidence coverage · ${d.changesSinceLast} changes since v${d.version - 1 || 1}`}
        actions={<Button size="sm" variant="ghost" onPress={() => go(dpath('datasets'))}>All datasets</Button>} />
      <div className="dw-hyp-a" role="group" aria-label="Handoff actions">
        <Button size="sm" variant="primary" icon="arrowRight" onPress={() => go(dpath('datasets', 'enrichment'))}>Send to LDE</Button>
        <Button size="sm" icon="report" onPress={() => setFlow('report')}>Create Report</Button>
        <Button size="sm" icon="pin" isDisabled={!d.geo} onPress={() => setFlow('map')}>Open Map</Button>
        <Button size="sm" icon="bolt" onPress={() => setFlow('workflow')}>Create Workflow</Button>
        <Button size="sm" icon="data" onPress={() => { useDs.getState().toast('Dataset organizes trusted data in the Data Workspace'); go('/data/published'); }}>Open in Data Workspace</Button>
        {!d.geo && <span className="dw-muted">Open Map needs geographic data; this dataset has none.</span>}
      </div>
      <div className="ds-ex-two">
        <Section title="Evidence coverage" hint="share of fields backed by at least one evidence">
          <div className="dw-facts dw-facts--col">
            <Kv k="Coverage" v={<span className="dw-qcell"><Meter v={d.coverage} /><b className="bw-num">{d.coverage}%</b></span>} />
            <Kv k="Mission" v={missionName(d.missionId)} />
            <Kv k="Updated" v={d.updated} />
            <Kv k="Fields without evidence" v={`${fields.filter((f) => f.coverage < 75).length} need verification`} />
          </div>
        </Section>
        <Section title="Version history">
          <ul className="dw-timeline" style={{ gap: 6 }}>
            {versions.map((v) => <li key={v.v} style={{ gridTemplateColumns: '48px 1fr' }}><b>v{v.v}{v.current ? ' ·' : ''}</b><span>{v.note}{v.current && <Badge tone="accent">Current</Badge>}</span></li>)}
          </ul>
        </Section>
      </div>
      <Section title="Top changes since the last version" hint={`${d.changesSinceLast} total`} actions={<Button size="sm" variant="ghost" onPress={() => go(dpath('changes'))}>Open Changes</Button>}>
        {changes.length === 0 ? <p className="dw-more">No relevant changes detected.</p> : <div style={{ display: 'grid', gap: 8 }}>{changes.map((c) => <SemanticChange key={c.id} c={c} />)}</div>}
      </Section>
      <Section title="Schema" hint={`${d.fields} fields`}>
        <Grid cols={fc} rows={fields} id={(r) => r.name} label="Dataset fields" max={360} />
      </Section>

      <Dialog title="Create Report" isOpen={flow === 'report'} onOpenChange={(o) => !o && setFlow(null)} footer={<><Button size="sm" variant="ghost" onPress={() => setFlow(null)}>Cancel</Button><Button size="sm" variant="primary" onPress={() => confirm('report')}>Open Report Builder</Button></>}>
        <div style={{ display: 'grid', gap: 10 }}>
          <p className="dw-muted">Suggested reports for {d.name}:</p>
          <div className="dw-chips" role="radiogroup" aria-label="Report suggestions">{REPORT_SUGGESTIONS.map((s) => <button key={s} type="button" role="radio" aria-checked={tab === s} className={`dw-chip${tab === s ? ' is-on' : ''}`} onClick={() => setTab(s)}>{s}</button>)}</div>
          <Chain steps={REPORT_CHAIN} tags={['BDE', 'Copilot', 'BCE', '', '']} />
        </div>
      </Dialog>
      <Dialog title="Open Map" isOpen={flow === 'map'} onOpenChange={(o) => !o && setFlow(null)} footer={<><Button size="sm" variant="ghost" onPress={() => setFlow(null)}>Cancel</Button><Button size="sm" variant="primary" onPress={() => confirm('map')}>Open Map Builder</Button></>}>
        <div style={{ display: 'grid', gap: 8 }}>
          <p><b>{locs.length} locations</b> will be sent as a layer. Each one keeps its evidence.</p>
          <Grid cols={lc} rows={locs.slice(0, 8)} id={(r) => r.id} label="Locations preview" />
          {locs.length > 8 && <p className="dw-muted">+ {locs.length - 8} more locations</p>}
        </div>
      </Dialog>
      <Dialog title="Create Workflow" isOpen={flow === 'workflow'} onOpenChange={(o) => !o && setFlow(null)} footer={<><Button size="sm" variant="ghost" onPress={() => setFlow(null)}>Cancel</Button><Button size="sm" variant="primary" onPress={() => confirm('workflow')}>Open Workflows</Button></>}>
        <div style={{ display: 'grid', gap: 8 }}>
          <p className="dw-muted">The workflow starts from a change event detected by the BDE.</p>
          <Chain steps={WORKFLOW_CHAIN} />
        </div>
      </Dialog>
    </div>
  );
}

function Chain({ steps, tags }: { steps: string[]; tags?: string[] }) {
  return (
    <ol className="dw-chain" aria-label="Chain" style={{ margin: 0 }}>
      {steps.map((s, i) => <li key={s} style={{ gridTemplateColumns: '48px 1fr' }}><b>{i + 1}</b><span>{s}{tags?.[i] ? <> <Badge tone="neutral">{tags[i]}</Badge></> : null}</span></li>)}
    </ol>
  );
}

/* ───── BDE → LDE Enrichment ───── */
const statusLabel = (s: EnrichmentProposal['status']) => (s === 'proposed' ? 'Proposed' : s === 'sent' ? 'Sent — pending LDE review' : 'Applied');
function StatusBadge({ s }: { s: EnrichmentProposal['status'] }) { return <Badge tone={s === 'applied' ? 'success' : s === 'sent' ? 'accent' : 'warning'} icon={s === 'applied' ? 'check' : undefined}>{statusLabel(s)}</Badge>; }

function EnrichmentView() {
  const go = useGo();
  const live = useDs((s) => s.proposals);
  const ext = useDw((s) => s.externalProposals);
  const statusOf = (p: EnrichmentProposal): EnrichmentProposal['status'] => (ext.find((x) => x.id === p.id)?.status === 'applied' ? 'applied' : (live[p.id] ?? p.status));
  const [selId, setSelId] = useState<string>(PROPOSALS[0]?.id ?? '');
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [justSent, setJustSent] = useState<string | null>(null);
  const cur = PROPOSALS.find((p) => p.id === selId);
  const open = PROPOSALS.filter((p) => statusOf(p) === 'proposed').length;

  const stepsFor = (p: EnrichmentProposal) => {
    const a = p.proposed.slice(0, 2);
    return [
      `External Observation: ${a.map((f) => `${f.field} ${f.field === 'Website' ? 'found' : '→'} ${f.value}`).join(' · ')}`, 'Send to LDE', `Entity match: ${p.internalEntity} (${p.match}%)`,
      `Enrichment Proposal: ${p.proposed.slice(0, 3).map((f) => `+${f.field.toLowerCase()}`).join(', ')}`, 'Review', 'LDE validation',
    ];
  };
  const steps = cur ? stepsFor(cur) : [];
  const at = useSteps(steps.length, 700, sending, () => {
    if (!cur) return;
    useDw.getState().receiveExternal({
      id: cur.id, internalEntity: cur.internalEntity, match: cur.match, current: cur.current,
      proposed: cur.proposed.map((f) => ({ field: f.field, value: f.value, source: sourceById(f.sourceId)?.name ?? f.sourceId, confidence: f.confidence, observed: f.observed, policy: f.policy })), status: 'received',
    });
    useDs.getState().setProposal(cur.id, 'sent');
    useDs.getState().toast(`Sent to LDE: ${cur.internalEntity}. Pending LDE review.`);
    setSending(false); setJustSent(cur.id);
  });

  const cols: Col<EnrichmentProposal>[] = [
    { key: 'e', label: 'Internal entity', w: 'minmax(160px, 1.5fr)', render: (p) => <b>{p.internalEntity}</b> },
    { key: 'm', label: 'Match', w: '70px', right: true, render: (p) => <span className="bw-num">{p.match}%</span> },
    { key: 'a', label: 'Attributes', w: '80px', right: true, render: (p) => <span className="bw-num">+{p.proposed.length}</span> },
    { key: 's', label: 'Status', w: '200px', render: (p) => <StatusBadge s={statusOf(p)} /> },
  ];
  const curStatus = cur ? statusOf(cur) : 'proposed';
  const pc: Col<EnrichmentProposal['proposed'][number]>[] = [
    { key: 'f', label: 'Field', w: '120px', render: (f) => <b>+ {f.field}</b> },
    { key: 'v', label: 'Proposed value', w: 'minmax(130px, 1.2fr)', render: (f) => f.value },
    { key: 's', label: 'Source', w: 'minmax(130px, 1.2fr)', render: (f) => <span className="ds-ex-trunc" title={sourceById(f.sourceId)?.url}>{sourceById(f.sourceId)?.name ?? f.sourceId}</span> },
    { key: 'c', label: 'Confidence', w: '110px', render: (f) => <ConfChip v={f.confidence} /> },
    { key: 'o', label: 'Last observed', w: '96px', render: (f) => f.observed },
    { key: 'p', label: 'Privacy / policy', w: 'minmax(120px, 1fr)', render: (f) => <span className="ds-ex-trunc" title={f.policy}>{f.policy}</span> },
  ];
  return (
    <div className="dw-view">
      <ViewHead title="BDE → LDE Enrichment" sub={`${open} open proposals. The BDE proposes; the LDE validates and applies after review.`} actions={<Button size="sm" variant="ghost" onPress={() => go(dpath('datasets'))}>All datasets</Button>} />
      <Grid cols={cols} rows={PROPOSALS} id={(p) => p.id} selected={selId} onRow={(p) => { setSelId(p.id); setPreview(false); setJustSent(null); }} label="Enrichment proposals" empty={<Empty icon="bolt" title="No observations found yet." text="" />} />
      {cur && (
        <Section title={cur.internalEntity} hint={`Match ${cur.match}% · +${cur.proposed.length} attributes`} actions={<StatusBadge s={curStatus} />}>
          <div className="dw-hyp-a">
            <Button size="sm" onPress={() => setPreview(!preview)}>{preview ? 'Hide preview' : 'Preview'}</Button>
            <Button size="sm" variant="primary" icon="arrowRight" isDisabled={sending || curStatus !== 'proposed'} onPress={() => { setJustSent(null); setSending(true); }}>Send to LDE</Button>
            {(curStatus === 'sent' || curStatus === 'applied' || justSent === cur.id) && <Button size="sm" icon="data" onPress={() => go('/data/enrichment')}>Open in LDE Enrichment</Button>}
          </div>
          {preview && (
            <div className="ds-ex-fade" style={{ display: 'grid', gap: 8 }}>
              <div className="ds-ba">
                <div><h4>Current (LDE)</h4>{cur.current.map((c) => <p key={c.field}>{c.field}: {c.value}</p>)}</div>
                <div><h4>Proposed (external)</h4>{cur.current.map((c) => <p key={c.field}>{c.field}: {c.value}</p>)}{cur.proposed.map((f) => <p key={f.field} className="is-add">+ {f.field}: {f.value}</p>)}</div>
              </div>
              <Grid cols={pc} rows={cur.proposed} id={(f) => f.field} label="Proposed fields with source and policy" />
            </div>
          )}
          {sending && <div className="ds-prog"><b>Handoff to the LDE</b><StepList steps={steps} at={at} /></div>}
          {!sending && curStatus === 'sent' && <p className="dw-note"><Icon name="info" size={12} />Sent — pending LDE review. The proposal now waits in LDE Enrichment; it is applied only after the LDE validates and a person approves it.</p>}
          {!sending && curStatus === 'applied' && <p className="dw-note"><Icon name="check" size={12} />Applied by the LDE after review.</p>}
          {!sending && curStatus === 'proposed' && <p className="dw-muted">The BDE never edits the LDE model directly. Send to LDE creates a proposal to review there.</p>}
        </Section>
      )}
    </div>
  );
}
