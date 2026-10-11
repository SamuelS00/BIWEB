import { useMemo, useState } from 'react';
import { Badge, Button, Dialog, Icon } from '@biweb/ui';
import { DATASETS, PROPOSALS } from '../data/seed';
import { sourceById } from '../data/derive';
import { GROUP_ID, LOC_TYPE_ID, REPORT_CHAIN, REPORT_SUGGESTIONS, TYPE_ID, WORKFLOW_CHAIN, changesOfDataset, locationsOf, schemaOf, versionsOf, type FieldRow, type LocRow } from '../data/datasets';
import { evidenceOfEntity } from '../data/explore';
import type { EnrichmentProposal, ResearchDataset } from '../data/types';
import { useDw } from '../../dataworkspace/store';
import { useDs } from '../store';
import './explore.css';
import { useT } from '../../i18n/intl';
import type { MessageId } from '../../i18n/catalog';
import { agoT } from '../data/work-i18n';
import { ConfChip, Empty, Grid, Kv, Meter, Section, SemanticChange, StepList, TraceBtn, ViewHead, dpath, useGo, useSteps, type Col } from '../ui';

export function DatasetsView({ id }: { id?: string }) {
  if (id === 'enrichment') return <EnrichmentView />;
  const d = DATASETS.find((x) => x.id === id);
  return d ? <DatasetDetail d={d} /> : <DatasetList />;
}

const missionName = (id: string) => useDs.getState().missions.find((m) => m.id === id)?.name ?? id;

/* ───── Lista ───── */
function DatasetList() {
  const t = useT();
  const go = useGo();
  const sel = useDs((s) => s.sel), proposals = useDs((s) => s.proposals);
  const open = PROPOSALS.filter((p) => (proposals[p.id] ?? p.status) === 'proposed').length;
  const cols: Col<ResearchDataset>[] = [
    { key: 'n', label: t('discovery.datasets.col.dataset'), w: 'minmax(170px, 1.6fr)', render: (d) => <b>{d.name}</b> },
    { key: 'v', label: t('discovery.datasets.col.version'), w: '66px', render: (d) => <Badge>v{d.version}</Badge> },
    { key: 'c', label: t('discovery.datasets.col.companies'), w: '80px', right: true, render: (d) => <span className="bw-num">{d.companies}</span> },
    { key: 'f', label: t('discovery.datasets.col.fields'), w: '60px', right: true, render: (d) => <span className="bw-num">{d.fields}</span> },
    { key: 'e', label: t('discovery.datasets.col.coverage'), w: '140px', render: (d) => <span className="dw-qcell"><Meter v={d.coverage} /><b className="bw-num">{d.coverage}%</b></span> },
    { key: 'h', label: t('discovery.datasets.col.changesPrev'), w: '110px', right: true, render: (d) => <span className="bw-num">{d.changesSinceLast}</span> },
    { key: 'u', label: t('discovery.datasets.col.updated'), w: '130px', render: (d) => d.updated },
    { key: 'm', label: t('discovery.datasets.col.mission'), w: 'minmax(130px, 1fr)', render: (d) => <span className="dw-muted">{missionName(d.missionId)}</span> },
    { key: 'o', label: '', w: '58px', right: true, render: (d) => <Button size="sm" variant="ghost" aria-label={t('discovery.datasets.openAria', { name: d.name })} onPress={() => go(dpath('datasets', d.id))}>{t('discovery.datasets.open')}</Button> },
  ];
  return (
    <div className="dw-view">
      <ViewHead title={t('discovery.datasets.title')} sub={t('discovery.datasets.sub')} />
      <Grid cols={cols} rows={DATASETS} id={(d) => d.id} selected={sel?.kind === 'dataset' ? sel.id : null} onRow={(d) => useDs.getState().select({ kind: 'dataset', id: d.id })} label={t('discovery.datasets.gridLabel')} />
      <Section title={t('discovery.datasets.enr.title')} hint={t('discovery.datasets.enr.hint')}>
        <div className="ds-ex-callout" style={{ alignItems: 'center' }}>
          <Icon name="bolt" size={12} /><span style={{ flex: 1 }}><b>{t('discovery.datasets.enr.openCount', { n: open })}</b> {t('discovery.datasets.enr.openRest')}</span>
          <Button size="sm" variant="primary" onPress={() => go(dpath('datasets', 'enrichment'))}>{t('discovery.datasets.enr.review')}</Button>
        </div>
      </Section>
    </div>
  );
}

/* ───── Detalhe ───── */
type Flow = 'report' | 'map' | 'workflow' | null;
function DatasetDetail({ d }: { d: ResearchDataset }) {
  const t = useT();
  const go = useGo();
  const [flow, setFlow] = useState<Flow>(null);
  const [tab, setTab] = useState<MessageId>(REPORT_SUGGESTIONS[0]!);
  const fields = useMemo(() => schemaOf(d), [d]);
  const versions = useMemo(() => versionsOf(d), [d]);
  const changes = useMemo(() => changesOfDataset(d), [d]);
  const locs = useMemo(() => locationsOf(d), [d]);
  const fc: Col<FieldRow>[] = [
    { key: 'f', label: t('discovery.datasets.schema.field'), w: 'minmax(150px, 1.4fr)', render: (r) => <span className="bw-mono">{r.name}</span> },
    { key: 'g', label: t('discovery.datasets.schema.group'), w: '110px', render: (r) => <span className="dw-muted">{GROUP_ID[r.group] ? t(GROUP_ID[r.group]!) : r.group}</span> },
    { key: 't', label: t('discovery.datasets.schema.type'), w: '80px', render: (r) => (TYPE_ID[r.type] ? t(TYPE_ID[r.type]!) : r.type) },
    { key: 'c', label: t('discovery.datasets.schema.coverage'), w: '140px', render: (r) => <span className="dw-qcell"><Meter v={r.coverage} /><b className="bw-num">{r.coverage}%</b></span> },
    { key: 's', label: t('discovery.datasets.schema.sources'), w: '64px', right: true, render: (r) => <span className="bw-num">{r.sources}</span> },
  ];
  const lc: Col<LocRow>[] = [
    { key: 'c', label: t('discovery.datasets.loc.company'), w: 'minmax(140px, 1.2fr)', render: (r) => r.company },
    { key: 'l', label: t('discovery.datasets.loc.location'), w: 'minmax(120px, 1fr)', render: (r) => r.location },
    { key: 't', label: t('discovery.datasets.loc.type'), w: '110px', render: (r) => (LOC_TYPE_ID[r.type] ? t(LOC_TYPE_ID[r.type]!) : r.type) },
    { key: 'e', label: t('discovery.datasets.loc.evidence'), w: '110px', render: (r) => <TraceBtn evidenceId={evidenceOfEntity(r.entityId)} /> },
    { key: 'a', label: t('discovery.datasets.loc.lastConfirmed'), w: '110px', render: (r) => agoT(t, r.lastMin) },
  ];
  const confirm = (kind: 'report' | 'map' | 'workflow') => {
    const ds = useDs.getState();
    ds.setHandoff({ kind, label: kind === 'report' ? t(tab) : d.name, datasetId: d.id });
    ds.toast(kind === 'report' ? t('discovery.datasets.report.toast', { name: t(tab) }) : kind === 'map' ? t('discovery.datasets.map.toast') : t('discovery.datasets.wf.toast'));
    setFlow(null);
    go(kind === 'report' ? '/reports/novo/edit' : kind === 'map' ? '/maps' : '/workflows');
  };
  return (
    <div className="dw-view">
      <ViewHead title={`${d.name} v${d.version}`} sub={t('discovery.datasets.detail.sub', { companies: d.companies, fields: d.fields, coverage: d.coverage, changes: d.changesSinceLast, prev: d.version - 1 || 1 })}
        actions={<Button size="sm" variant="ghost" onPress={() => go(dpath('datasets'))}>{t('discovery.datasets.all')}</Button>} />
      <div className="dw-hyp-a" role="group" aria-label={t('discovery.datasets.handoffAria')}>
        <Button size="sm" variant="primary" icon="arrowRight" onPress={() => go(dpath('datasets', 'enrichment'))}>{t('discovery.datasets.sendLde')}</Button>
        <Button size="sm" icon="report" onPress={() => setFlow('report')}>{t('discovery.datasets.createReport')}</Button>
        <Button size="sm" icon="pin" isDisabled={!d.geo} onPress={() => setFlow('map')}>{t('discovery.datasets.openMap')}</Button>
        <Button size="sm" icon="bolt" onPress={() => setFlow('workflow')}>{t('discovery.datasets.createWorkflow')}</Button>
        <Button size="sm" icon="data" onPress={() => { useDs.getState().toast(t('discovery.datasets.dwToast')); go('/data/published'); }}>{t('discovery.datasets.openDw')}</Button>
        {!d.geo && <span className="dw-muted">{t('discovery.datasets.noGeo')}</span>}
      </div>
      <div className="ds-ex-two">
        <Section title={t('discovery.datasets.cov.title')} hint={t('discovery.datasets.cov.hint')}>
          <div className="dw-facts dw-facts--col">
            <Kv k={t('discovery.datasets.cov.coverage')} v={<span className="dw-qcell"><Meter v={d.coverage} /><b className="bw-num">{d.coverage}%</b></span>} />
            <Kv k={t('discovery.datasets.cov.mission')} v={missionName(d.missionId)} />
            <Kv k={t('discovery.datasets.cov.updated')} v={d.updated} />
            <Kv k={t('discovery.datasets.cov.withoutEvidence')} v={t('discovery.datasets.cov.needVerification', { n: fields.filter((f) => f.coverage < 75).length })} />
          </div>
        </Section>
        <Section title={t('discovery.datasets.versions.title')}>
          <ul className="dw-timeline" style={{ gap: 6 }}>
            {versions.map((v) => <li key={v.v} style={{ gridTemplateColumns: '48px 1fr' }}><b>v{v.v}{v.current ? ' ·' : ''}</b><span>{t(v.note)}{v.current && <Badge tone="accent">{t('discovery.datasets.versions.current')}</Badge>}</span></li>)}
          </ul>
        </Section>
      </div>
      <Section title={t('discovery.datasets.top.title')} hint={t('discovery.datasets.top.hint', { n: d.changesSinceLast })} actions={<Button size="sm" variant="ghost" onPress={() => go(dpath('changes'))}>{t('discovery.datasets.top.openChanges')}</Button>}>
        {changes.length === 0 ? <p className="dw-more">{t('discovery.datasets.top.none')}</p> : <div style={{ display: 'grid', gap: 8 }}>{changes.map((c) => <SemanticChange key={c.id} c={c} />)}</div>}
      </Section>
      <Section title={t('discovery.datasets.schema.title')} hint={t('discovery.datasets.schema.hint', { n: d.fields })}>
        <Grid cols={fc} rows={fields} id={(r) => r.name} label={t('discovery.datasets.schema.label')} max={360} />
      </Section>

      <Dialog title={t('discovery.datasets.report.title')} isOpen={flow === 'report'} onOpenChange={(o) => !o && setFlow(null)} footer={<><Button size="sm" variant="ghost" onPress={() => setFlow(null)}>{t('discovery.datasets.cancel')}</Button><Button size="sm" variant="primary" onPress={() => confirm('report')}>{t('discovery.datasets.report.open')}</Button></>}>
        <div style={{ display: 'grid', gap: 10 }}>
          <p className="dw-muted">{t('discovery.datasets.report.suggested', { name: d.name })}</p>
          <div className="dw-chips" role="radiogroup" aria-label={t('discovery.datasets.report.suggestionsAria')}>{REPORT_SUGGESTIONS.map((s) => <button key={s} type="button" role="radio" aria-checked={tab === s} className={`dw-chip${tab === s ? ' is-on' : ''}`} onClick={() => setTab(s)}>{t(s)}</button>)}</div>
          <Chain steps={REPORT_CHAIN} tags={['BDE', 'Copilot', 'BCE', '', '']} />
        </div>
      </Dialog>
      <Dialog title={t('discovery.datasets.map.title')} isOpen={flow === 'map'} onOpenChange={(o) => !o && setFlow(null)} footer={<><Button size="sm" variant="ghost" onPress={() => setFlow(null)}>{t('discovery.datasets.cancel')}</Button><Button size="sm" variant="primary" onPress={() => confirm('map')}>{t('discovery.datasets.map.open')}</Button></>}>
        <div style={{ display: 'grid', gap: 8 }}>
          <p>{t('discovery.datasets.map.text', { n: locs.length })}</p>
          <Grid cols={lc} rows={locs.slice(0, 8)} id={(r) => r.id} label={t('discovery.datasets.map.previewAria')} />
          {locs.length > 8 && <p className="dw-muted">{t('discovery.datasets.map.more', { n: locs.length - 8 })}</p>}
        </div>
      </Dialog>
      <Dialog title={t('discovery.datasets.wf.title')} isOpen={flow === 'workflow'} onOpenChange={(o) => !o && setFlow(null)} footer={<><Button size="sm" variant="ghost" onPress={() => setFlow(null)}>{t('discovery.datasets.cancel')}</Button><Button size="sm" variant="primary" onPress={() => confirm('workflow')}>{t('discovery.datasets.wf.open')}</Button></>}>
        <div style={{ display: 'grid', gap: 8 }}>
          <p className="dw-muted">{t('discovery.datasets.wf.text')}</p>
          <Chain steps={WORKFLOW_CHAIN} />
        </div>
      </Dialog>
    </div>
  );
}

function Chain({ steps, tags }: { steps: MessageId[]; tags?: string[] }) {
  const t = useT();
  return (
    <ol className="dw-chain" aria-label={t('discovery.datasets.chain.aria')} style={{ margin: 0 }}>
      {steps.map((s, i) => <li key={s} style={{ gridTemplateColumns: '48px 1fr' }}><b>{i + 1}</b><span>{t(s)}{tags?.[i] ? <> <Badge tone="neutral">{tags[i]}</Badge></> : null}</span></li>)}
    </ol>
  );
}

/* ───── BDE → LDE Enrichment ───── */
const STATUS_ID: Record<EnrichmentProposal['status'], MessageId> = { proposed: 'discovery.datasets.enrView.status.proposed', sent: 'discovery.datasets.enrView.status.sent', applied: 'discovery.datasets.enrView.status.applied' };
function StatusBadge({ s }: { s: EnrichmentProposal['status'] }) { const t = useT(); return <Badge tone={s === 'applied' ? 'success' : s === 'sent' ? 'accent' : 'warning'} icon={s === 'applied' ? 'check' : undefined}>{t(STATUS_ID[s])}</Badge>; }

function EnrichmentView() {
  const t = useT();
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
      t('discovery.datasets.enrView.step1', { items: a.map((f) => (f.field === 'Website' ? t('discovery.datasets.enrView.step1Found', { field: f.field, value: f.value }) : `${f.field} → ${f.value}`)).join(' · ') }), t('discovery.datasets.enrView.step2'), t('discovery.datasets.enrView.step3', { entity: p.internalEntity, pct: p.match }),
      t('discovery.datasets.enrView.step4', { fields: p.proposed.slice(0, 3).map((f) => `+${f.field.toLowerCase()}`).join(', ') }), t('discovery.datasets.enrView.step5'), t('discovery.datasets.enrView.step6'),
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
    useDs.getState().toast(t('discovery.datasets.enrView.toast', { entity: cur.internalEntity }));
    setSending(false); setJustSent(cur.id);
  });

  const cols: Col<EnrichmentProposal>[] = [
    { key: 'e', label: t('discovery.datasets.enrView.col.entity'), w: 'minmax(160px, 1.5fr)', render: (p) => <b>{p.internalEntity}</b> },
    { key: 'm', label: t('discovery.datasets.enrView.col.match'), w: '70px', right: true, render: (p) => <span className="bw-num">{p.match}%</span> },
    { key: 'a', label: t('discovery.datasets.enrView.col.attributes'), w: '80px', right: true, render: (p) => <span className="bw-num">+{p.proposed.length}</span> },
    { key: 's', label: t('discovery.datasets.enrView.col.status'), w: '200px', render: (p) => <StatusBadge s={statusOf(p)} /> },
  ];
  const curStatus = cur ? statusOf(cur) : 'proposed';
  const pc: Col<EnrichmentProposal['proposed'][number]>[] = [
    { key: 'f', label: t('discovery.datasets.enrView.pcol.field'), w: '120px', render: (f) => <b>+ {f.field}</b> },
    { key: 'v', label: t('discovery.datasets.enrView.pcol.value'), w: 'minmax(130px, 1.2fr)', render: (f) => f.value },
    { key: 's', label: t('discovery.datasets.enrView.pcol.source'), w: 'minmax(130px, 1.2fr)', render: (f) => <span className="ds-ex-trunc" title={sourceById(f.sourceId)?.url}>{sourceById(f.sourceId)?.name ?? f.sourceId}</span> },
    { key: 'c', label: t('discovery.datasets.enrView.pcol.confidence'), w: '110px', render: (f) => <ConfChip v={f.confidence} /> },
    { key: 'o', label: t('discovery.datasets.enrView.pcol.observed'), w: '96px', render: (f) => f.observed },
    { key: 'p', label: t('discovery.datasets.enrView.pcol.policy'), w: 'minmax(120px, 1fr)', render: (f) => <span className="ds-ex-trunc" title={f.policy}>{f.policy}</span> },
  ];
  return (
    <div className="dw-view">
      <ViewHead title={t('discovery.datasets.enrView.title')} sub={t('discovery.datasets.enrView.sub', { n: open })} actions={<Button size="sm" variant="ghost" onPress={() => go(dpath('datasets'))}>{t('discovery.datasets.all')}</Button>} />
      <Grid cols={cols} rows={PROPOSALS} id={(p) => p.id} selected={selId} onRow={(p) => { setSelId(p.id); setPreview(false); setJustSent(null); }} label={t('discovery.datasets.enrView.gridLabel')} empty={<Empty icon="bolt" title={t('discovery.datasets.enrView.emptyTitle')} text="" />} />
      {cur && (
        <Section title={cur.internalEntity} hint={t('discovery.datasets.enrView.sectionHint', { pct: cur.match, n: cur.proposed.length })} actions={<StatusBadge s={curStatus} />}>
          <div className="dw-hyp-a">
            <Button size="sm" onPress={() => setPreview(!preview)}>{preview ? t('discovery.datasets.enrView.hidePreview') : t('discovery.datasets.enrView.preview')}</Button>
            <Button size="sm" variant="primary" icon="arrowRight" isDisabled={sending || curStatus !== 'proposed'} onPress={() => { setJustSent(null); setSending(true); }}>{t('discovery.datasets.sendLde')}</Button>
            {(curStatus === 'sent' || curStatus === 'applied' || justSent === cur.id) && <Button size="sm" icon="data" onPress={() => go('/data/enrichment')}>{t('discovery.datasets.enrView.openLde')}</Button>}
          </div>
          {preview && (
            <div className="ds-ex-fade" style={{ display: 'grid', gap: 8 }}>
              <div className="ds-ba">
                <div><h4>{t('discovery.datasets.enrView.current')}</h4>{cur.current.map((c) => <p key={c.field}>{c.field}: {c.value}</p>)}</div>
                <div><h4>{t('discovery.datasets.enrView.proposed')}</h4>{cur.current.map((c) => <p key={c.field}>{c.field}: {c.value}</p>)}{cur.proposed.map((f) => <p key={f.field} className="is-add">+ {f.field}: {f.value}</p>)}</div>
              </div>
              <Grid cols={pc} rows={cur.proposed} id={(f) => f.field} label={t('discovery.datasets.enrView.proposedAria')} />
            </div>
          )}
          {sending && <div className="ds-prog"><b>{t('discovery.datasets.enrView.handoff')}</b><StepList steps={steps} at={at} /></div>}
          {!sending && curStatus === 'sent' && <p className="dw-note"><Icon name="info" size={12} />{t('discovery.datasets.enrView.sentNote')}</p>}
          {!sending && curStatus === 'applied' && <p className="dw-note"><Icon name="check" size={12} />{t('discovery.datasets.enrView.appliedNote')}</p>}
          {!sending && curStatus === 'proposed' && <p className="dw-muted">{t('discovery.datasets.enrView.proposedNote')}</p>}
        </Section>
      )}
    </div>
  );
}
