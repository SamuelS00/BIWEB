import { Badge, Button, Icon } from '@biweb/ui';
import { DOCUMENTS, EVIDENCE_PACKS } from '../data/seed';
import { entityById, evidenceById, packById, sourceById } from '../data/derive';
import { evidenceTitle, independentSources, mirrorsOf, packConfidence, packObservation, packScore } from '../data/records';
import type { Evidence, EvidencePack } from '../data/types';
import { useDs } from '../store';
import { useT } from '../../i18n/intl';
import type { MessageId } from '../../i18n/catalog';
import { AuthorityBadge, ConfChip, ConfidenceBreakdown, Empty, Grid, Kv, LevelBadge, Section, TraceBtn, ViewHead, dpath, useGo, type Col } from '../ui';
import { RecLink } from './EntityActions';
import './records.css';

/** Rótulos de UI para os valores semeados de `contradictions` (texto de dado, não de interface). */
const CONTRA_ID: Record<string, MessageId> = {
  None: 'discovery.evidence.contra.none', 'None (1 original + 11 mirrors)': 'discovery.evidence.contra.noneMirrors', '1 open conflict': 'discovery.evidence.contra.open',
};
export function useContra() {
  const t = useT();
  return (raw: string) => { const id = CONTRA_ID[raw]; return id ? t(id) : raw; };
}
/** `evidenceTitle` (data/records) devolve rótulos em inglês; aqui viram ids literais. */
const EV_TITLE_ID: Record<string, MessageId> = {
  'Release Notes': 'discovery.evidence.evTitle.release', 'Industry Article': 'discovery.evidence.evTitle.industryArticle', 'Official Product Documentation': 'discovery.evidence.evTitle.officialDocs',
  Documentation: 'discovery.evidence.evTitle.docs', 'Official Pricing Page': 'discovery.evidence.evTitle.officialPricing', 'Official Website': 'discovery.evidence.evTitle.officialSite',
  'Public Dataset': 'discovery.evidence.evTitle.publicDataset', 'Annual Report (PDF)': 'discovery.evidence.evTitle.annualReport', 'Official Blog': 'discovery.evidence.evTitle.officialBlog', Evidence: 'discovery.evidence.evTitle.fallback',
};

export function EvidenceView({ id }: { id?: string }) { return id ? <PackDetail id={id} /> : <PackList />; }

function PackList() {
  const go = useGo();
  const t = useT();
  const contra = useContra();
  const sel = useDs((s) => s.sel);
  const cols: Col<EvidencePack>[] = [
    { key: 'c', label: t('discovery.evidence.col.claim'), w: 'minmax(220px,2.2fr)', render: (p) => <RecLink onOpen={() => go(dpath('evidence', p.id))}>{p.claim}</RecLink> },
    { key: 's', label: t('discovery.evidence.col.subject'), w: '110px', render: (p) => entityById(p.subjectId)?.name ?? p.subjectId },
    { key: 'n', label: t('discovery.evidence.col.evidence'), w: '70px', right: true, render: (p) => <span className="bw-num">{p.evidence.length}</span> },
    { key: 'f', label: t('discovery.evidence.col.firstObserved'), w: '104px', render: (p) => p.firstObserved },
    { key: 'l', label: t('discovery.evidence.col.lastConfirmed'), w: '104px', render: (p) => p.lastConfirmed },
    { key: 'x', label: t('discovery.evidence.col.contradictions'), w: '150px', render: (p) => (p.contradictions === 'None' || p.contradictions.startsWith('None') ? <Badge tone="success">{contra(p.contradictions)}</Badge> : <Badge tone="warning" icon="warning">{contra(p.contradictions)}</Badge>) },
    { key: 'cf', label: t('discovery.evidence.col.confidence'), w: '104px', render: (p) => <ConfChip v={packScore(p)} needs /> },
  ];
  return (
    <div className="dw-view">
      <ViewHead title={t('discovery.evidence.title')} sub={t('discovery.evidence.subtitle')} />
      <Grid label={t('discovery.evidence.gridLabel')} cols={cols} rows={EVIDENCE_PACKS} id={(p) => p.id} selected={sel?.kind === 'evidence' ? sel.id : null} onRow={(p) => useDs.getState().select({ kind: 'evidence', id: p.evidence[0] ?? p.id })} empty={<p className="dw-more">{t('discovery.evidence.empty')}</p>} />
      <DocIntel />
    </div>
  );
}

const FIELD_EVIDENCE: Record<string, string> = { Revenue: 'e-fibra-pdf', Regions: 'e-fibra-pdf' };
function DocIntel() {
  const go = useGo();
  const t = useT();
  return (
    <Section title={t('discovery.evidence.doc.title')} hint={t('discovery.evidence.doc.hint')}>
      {DOCUMENTS.map((d) => {
        const src = sourceById(d.sourceId);
        return (
          <div key={d.id} className="dw-card" style={{ alignItems: 'stretch', gap: 10 }}>
            <div className="ds-rec-flow"><span><Icon name="report" size={12} /> <b>{d.name}</b>{d.pages ? ` · ${t('discovery.evidence.doc.pages', { n: d.pages })}` : ''}</span><Icon name="arrowRight" size={12} /><span>{t('discovery.evidence.doc.extracted', { n: d.extracted.length })}</span><Icon name="arrowRight" size={12} /><span>{t('discovery.evidence.doc.observations')}</span><Icon name="arrowRight" size={12} /><span>{t('discovery.evidence.doc.evidence')}</span></div>
            <div className="dw-table" role="table" aria-label={t('discovery.evidence.doc.fieldsAria', { name: d.name })}>
              {d.extracted.map((f) => <div key={f.field} className="dw-tr" role="row" style={{ gridTemplateColumns: '110px minmax(0,1fr) 150px' }}><b role="cell">{f.field}</b><span role="cell">{f.value}</span><span role="cell"><TraceBtn evidenceId={FIELD_EVIDENCE[f.field]} /></span></div>)}
            </div>
            <p className="dw-muted" style={{ margin: 0 }}>{t('discovery.evidence.doc.note')}{src && <> {t('discovery.evidence.doc.source')} <RecLink onOpen={() => go(dpath('sources', src.id))}>{src.name}</RecLink> · <AuthorityBadge a={src.authority} /></>}</p>
          </div>
        );
      })}
    </Section>
  );
}

function PackDetail({ id }: { id: string }) {
  const go = useGo();
  const t = useT();
  const contra = useContra();
  const pack: EvidencePack | undefined = packById(id) ?? (evidenceById(id) ? EVIDENCE_PACKS.find((p) => p.evidence.includes(id)) : undefined);
  if (!pack) return <div className="dw-view"><Empty icon="book" title={t('discovery.evidence.empty')} text={t('discovery.evidence.detail.notFoundText')} action={<Button size="sm" onPress={() => go(dpath('evidence'))}>{t('discovery.evidence.detail.back')}</Button>} /></div>;
  const evs = pack.evidence.map((e) => evidenceById(e)).filter((e): e is Evidence => !!e);
  const obs = packObservation(pack);
  const conf = obs?.confidence ?? packConfidence(pack);
  const sources = independentSources(pack.evidence);
  const mirrorInfo = [...sources].map((sid) => ({ sid, m: mirrorsOf(sid) })).filter((x) => x.m.length);
  const e = entityById(pack.subjectId);
  const open = pack.contradictions !== 'None' && !pack.contradictions.startsWith('None');
  return (
    <div className="dw-view dw-view--flush">
      <div className="dw-sh">
        <button type="button" className="dw-back" onClick={() => go(dpath('evidence'))}><Icon name="arrowLeft" size={12} />{t('discovery.evidence.title')}</button>
        <div className="dw-sh-main"><h2>{t('discovery.evidence.detail.title')}</h2><Badge>{t('discovery.evidence.detail.count', { n: evs.length })}</Badge>{open ? <Badge tone="warning" icon="warning">{contra(pack.contradictions)}</Badge> : <Badge tone="success" icon="check">{t('discovery.evidence.detail.noContradictions')}</Badge>}<span className="flex-1" />
          {e && <Button size="sm" icon="cube" onPress={() => go(dpath('entities', e.id))}>{t('discovery.evidence.detail.openEntity', { name: e.name })}</Button>}
          {obs && <Button size="sm" icon="list" onPress={() => go(dpath('observations', obs.id))}>{t('discovery.evidence.detail.openObservation')}</Button>}
          {open && <Button size="sm" icon="warning" onPress={() => go(dpath('conflicts'))}>{t('discovery.evidence.detail.reviewConflict')}</Button>}
        </div>
        <div className="dw-sh-facts"><Kv k={t('discovery.evidence.detail.kv.subject')} v={e?.name ?? pack.subjectId} /><Kv k={t('discovery.evidence.detail.kv.firstObserved')} v={pack.firstObserved} /><Kv k={t('discovery.evidence.detail.kv.lastConfirmed')} v={pack.lastConfirmed} /><Kv k={t('discovery.evidence.detail.kv.contradictions')} v={contra(pack.contradictions)} /><Kv k={t('discovery.evidence.detail.kv.independent')} v={sources.size} /></div>
      </div>
      <div className="dw-pad-v">
        <Section title={t('discovery.evidence.detail.claim')}><p className="ds-rec-claim">{pack.claim}</p></Section>
        <Section title={t('discovery.evidence.detail.evidenceTitle')} hint={t('discovery.evidence.detail.evidenceHint')}>
          <div className="ds-rec-evs">
            {evs.map((ev, i) => { const s = sourceById(ev.sourceId); return (
              <div key={ev.id} className="ds-rec-ev">
                <header><b>{t('discovery.evidence.detail.card', { n: i + 1 })}</b><span className="dw-muted">{(() => { const raw = evidenceTitle(ev); const id = EV_TITLE_ID[raw]; return id ? t(id) : raw; })()}</span></header>
                <div className="dw-hyp-a"><Badge tone={ev.role === 'Primary' ? 'success' : 'neutral'}>{t(ev.role === 'Primary' ? 'discovery.evidence.detail.role.primary' : 'discovery.evidence.detail.role.secondary')}</Badge><LevelBadge l={ev.strength} />{s && <AuthorityBadge a={s.authority} />}</div>
                <p className="ds-quote" style={{ margin: 0 }}>{ev.excerpt}</p>
                <div className="meta"><span>{t('discovery.evidence.meta.source')} <b>{s ? <RecLink onOpen={() => go(dpath('sources', s.id))}>{s.name}</RecLink> : ev.sourceId}</b></span><span>{t('discovery.evidence.meta.locator')} <b>{ev.locator}</b></span><span>{t('discovery.evidence.meta.captured')} <b>{ev.capturedAt}</b></span></div>
                <div className="dw-hyp-a"><TraceBtn evidenceId={ev.id} label={t('discovery.evidence.detail.openProvenance')} /></div>
              </div>
            ); })}
          </div>
          <p className="dw-note"><Icon name="info" size={12} />{mirrorInfo.length ? mirrorInfo.map((x) => t('discovery.evidence.detail.mirrors', { n: x.m.length, name: sourceById(x.sid)?.name ?? x.sid })).join(' ') : t('discovery.evidence.detail.independent', { n: sources.size })}</p>
        </Section>
        <div className="dw-grid2">
          <Section title={t('discovery.evidence.detail.confidenceTitle')} hint={obs ? t('discovery.evidence.detail.confidenceFromObs') : t('discovery.evidence.detail.confidenceComputed')}><ConfidenceBreakdown c={conf} /></Section>
          <Section title={t('discovery.evidence.detail.contradictionsTitle')}>{open ? <p style={{ margin: 0 }}>{t('discovery.evidence.detail.contradictionsOpen', { what: contra(pack.contradictions) })}</p> : <p className="dw-muted" style={{ margin: 0 }}>{t('discovery.evidence.detail.noConflicting')}</p>}</Section>
        </div>
        {pack.id === 'p-fibra-bb' && <DocIntel />}
      </div>
    </div>
  );
}
