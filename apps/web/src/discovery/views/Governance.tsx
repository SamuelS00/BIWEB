import { useState, type ReactNode } from 'react';
import { Badge, Button, Icon } from '@biweb/ui';
import { BLOCK_LABEL_ID, BLOCK_NOTE_ID, SOURCES } from '../data/seed';
import { useT } from '../../i18n/intl';
import type { MessageId } from '../../i18n/catalog';
import { ACQ_OPTS, RENDER_OPTS } from './Sources';
import { AuthorityBadge, Grid, Section, ViewHead, dpath, useGo, type Col } from '../ui';
import { useDs } from '../store';
import './explore.css';

const DEFAULTS: { id: string; k: MessageId; v: MessageId; note: MessageId }[] = [
  { id: 'access', k: 'discovery.sources.policy.access', v: 'discovery.governance.def.access.v', note: 'discovery.governance.def.access.note' },
  { id: 'robots', k: 'discovery.sources.policy.robots', v: 'discovery.governance.def.robots.v', note: 'discovery.governance.def.robots.note' },
  { id: 'rate', k: 'discovery.sources.policy.rateLimit', v: 'discovery.governance.def.rate.v', note: 'discovery.governance.def.rate.note' },
  { id: 'retention', k: 'discovery.sources.policy.retention', v: 'discovery.governance.def.retention.v', note: 'discovery.governance.def.retention.note' },
  { id: 'license', k: 'discovery.sources.policy.license', v: 'discovery.governance.def.license.v', note: 'discovery.governance.def.license.note' },
  { id: 'attribution', k: 'discovery.sources.policy.attribution', v: 'discovery.governance.def.attribution.v', note: 'discovery.governance.def.attribution.note' },
  { id: 'personal', k: 'discovery.sources.policy.personalData', v: 'discovery.governance.def.personal.v', note: 'discovery.governance.def.personal.note' },
];

export function PoliciesView() {
  const t = useT();
  const go = useGo();
  const blocked = SOURCES.filter((s) => s.blocked);
  const dc: Col<(typeof DEFAULTS)[number]>[] = [
    { key: 'k', label: t('discovery.governance.col.policy'), w: '140px', render: (r) => <b>{t(r.k)}</b> },
    { key: 'v', label: t('discovery.governance.col.default'), w: '170px', render: (r) => <Badge tone="success" icon="check">{t(r.v)}</Badge> },
    { key: 'n', label: t('discovery.governance.col.means'), w: 'minmax(260px, 1fr)', render: (r) => <span className="dw-muted">{t(r.note)}</span> },
  ];
  const bc: Col<(typeof blocked)[number]>[] = [
    { key: 's', label: t('discovery.governance.col.source'), w: 'minmax(180px, 1.3fr)', render: (s) => <span className="ds-ex-trunc" title={s.url}>{s.name}</span> },
    { key: 'a', label: t('discovery.sources.col.authority'), w: '96px', render: (s) => <AuthorityBadge a={s.authority} /> },
    { key: 'r', label: t('discovery.governance.col.reason'), w: '190px', render: (s) => <Badge tone={s.health === 'blocked' ? 'danger' : 'warning'} icon="lock">{t(BLOCK_LABEL_ID[s.blocked!])}</Badge> },
    { key: 'n', label: t('discovery.governance.col.note'), w: 'minmax(260px, 2fr)', render: (s) => <span className="dw-muted">{t(BLOCK_NOTE_ID[s.blocked!])}</span> },
  ];
  return (
    <div className="dw-view">
      <ViewHead title={t('discovery.nav.policies')} sub={t('discovery.governance.sub')} actions={<Button size="sm" variant="ghost" onPress={() => go(dpath('settings'))}>{t('discovery.governance.advanced')}</Button>} />
      <p className="dw-note"><Icon name="lock" size={12} />{t('discovery.governance.note')}</p>
      <Section title={t('discovery.governance.defaults')}><Grid cols={dc} rows={DEFAULTS} id={(r) => r.id} label={t('discovery.governance.defaults')} /></Section>
      <Section title={t('discovery.governance.blocked')} hint={t('discovery.governance.blockedCount', { count: blocked.length })}>
        <Grid cols={bc} rows={blocked} id={(s) => s.id} label={t('discovery.governance.blocked')} onRow={(s) => useDs.getState().select({ kind: 'source', id: s.id })} empty={<p className="dw-more">{t('discovery.governance.blockedNone')}</p>} />
      </Section>
    </div>
  );
}

function Opts<T extends string | number>({ label, value, onChange, options, show }: { label: string; value: T; onChange: (v: T) => void; options: T[]; show?: (o: T) => string }) {
  return <div className="dw-chips" role="radiogroup" aria-label={label}>{options.map((o) => <button key={String(o)} type="button" role="radio" aria-checked={value === o} className={`dw-chip${value === o ? ' is-on' : ''}`} onClick={() => onChange(o)}>{show ? show(o) : String(o)}</button>)}</div>;
}
function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <div className="dw-kv" style={{ alignItems: 'center', gap: 12 }}><span style={{ minWidth: 190 }}>{label}{hint && <small className="dw-muted" style={{ display: 'block' }}>{hint}</small>}</span><div style={{ flex: 1 }}>{children}</div></div>;
}
const fieldStyle = { width: '100%', maxWidth: 420, padding: '5px 8px', border: '1px solid var(--border-control)', borderRadius: 'var(--radius-sm)', background: 'var(--surface-app)', color: 'var(--text-primary)', font: '12px var(--font-sans)' } as const;

const PREF_LABEL: Record<'official' | 'reference' | 'any', MessageId> = { official: 'discovery.governance.pref.official', reference: 'discovery.governance.pref.reference', any: 'discovery.governance.pref.any' };
const RATE_ROWS: { id: string; label: MessageId; v: number }[] = [
  { id: 'official', label: 'discovery.governance.rate.official', v: 5 }, { id: 'docs', label: 'discovery.governance.rate.docs', v: 3 },
  { id: 'api', label: 'discovery.governance.rate.api', v: 10 }, { id: 'news', label: 'discovery.governance.rate.news', v: 15 },
];

export function SettingsView() {
  const t = useT();
  const [acq, setAcq] = useState('auto');
  const [render, setRender] = useState('auto');
  const [depth, setDepth] = useState<1 | 2 | 3>(2);
  const [domains, setDomains] = useState('*.gov.br\nanatel.gov.br\nibge.gov.br');
  const [paths, setPaths] = useState('Allow /produtos, /docs, /precos\nDeny /login, /conta, /checkout');
  const [rates, setRates] = useState<Record<string, number>>(() => Object.fromEntries(RATE_ROWS.map((r) => [r.id, r.v])));
  const [minEv, setMinEv] = useState(2);
  const [pref, setPref] = useState<'official' | 'reference' | 'any'>('official');
  const [thr, setThr] = useState(80);
  const [ret, setRet] = useState<30 | 90 | 180 | 365>(90);
  const [saved, setSaved] = useState(false);
  const mark = <T,>(f: (v: T) => void) => (v: T) => { f(v); setSaved(false); };
  return (
    <div className="dw-view">
      <ViewHead title={t('discovery.nav.settings')} sub={t('discovery.governance.set.sub')} actions={<><Button size="sm" variant="primary" onPress={() => { setSaved(true); useDs.getState().toast(t('discovery.governance.set.savedToast')); }}>{t('discovery.governance.set.save')}</Button>{saved && <Badge tone="success" icon="check">{t('discovery.governance.set.saved')}</Badge>}</>} />
      <Section title={t('discovery.governance.set.verification')} hint={t('discovery.governance.set.verificationHint')}>
        <div className="dw-facts dw-facts--col">
          <Row label={t('discovery.governance.set.minEvidence')} hint={t('discovery.governance.set.minEvidenceHint')}><Opts<number> label={t('discovery.governance.set.minEvidence')} value={minEv} onChange={mark(setMinEv)} options={[1, 2, 3]} /></Row>
          <Row label={t('discovery.governance.set.preferred')}><Opts<'official' | 'reference' | 'any'> label={t('discovery.governance.set.preferred')} value={pref} onChange={mark(setPref)} options={['official', 'reference', 'any']} show={(o) => t(PREF_LABEL[o])} /></Row>
          <Row label={t('discovery.governance.set.threshold')} hint={t('discovery.governance.set.thresholdHint')}><span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="range" min={50} max={99} value={thr} aria-label={t('discovery.governance.set.threshold')} onChange={(e) => { setThr(Number(e.target.value)); setSaved(false); }} /><b className="bw-num">{thr}%</b></span></Row>
          <Row label={t('discovery.sources.policy.retention')} hint={t('discovery.governance.set.retentionHint')}><Opts<number> label={t('discovery.governance.set.retentionDays')} value={ret} onChange={(v) => { setRet(v as 30 | 90 | 180 | 365); setSaved(false); }} options={[30, 90, 180, 365]} /></Row>
        </div>
      </Section>
      <Section title={t('discovery.sources.adv.title')} hint={t('discovery.governance.set.advancedHint')}>
        <div className="dw-facts dw-facts--col">
          <Row label={t('discovery.sources.adv.strategy')} hint={t('discovery.governance.set.strategyHint')}><Opts label={t('discovery.sources.adv.strategy')} value={acq} onChange={mark(setAcq)} options={ACQ_OPTS.map((o) => o.id)} show={(o) => t(ACQ_OPTS.find((x) => x.id === o)!.label)} /></Row>
          <Row label={t('discovery.sources.adv.rendering')} hint={t('discovery.governance.set.renderingHint')}><Opts label={t('discovery.sources.adv.rendering')} value={render} onChange={mark(setRender)} options={RENDER_OPTS.map((o) => o.id)} show={(o) => t(RENDER_OPTS.find((x) => x.id === o)!.label)} /></Row>
          <Row label={t('discovery.sources.adv.depth')} hint={t('discovery.governance.set.depthHint')}><Opts<1 | 2 | 3> label={t('discovery.sources.adv.depth')} value={depth} onChange={mark(setDepth)} options={[1, 2, 3]} /></Row>
          <Row label={t('discovery.sources.adv.domains')} hint={t('discovery.governance.set.domainsHint')}><textarea style={fieldStyle} rows={3} value={domains} aria-label={t('discovery.sources.adv.domains')} onChange={(e) => { setDomains(e.target.value); setSaved(false); }} /></Row>
          <Row label={t('discovery.governance.set.pathRules')} hint={t('discovery.governance.set.pathRulesHint')}><textarea style={fieldStyle} rows={3} value={paths} aria-label={t('discovery.governance.set.pathRules')} onChange={(e) => { setPaths(e.target.value); setSaved(false); }} /></Row>
          <Row label={t('discovery.governance.set.hints')} hint={t('discovery.governance.set.hintsHint')}><input style={fieldStyle} placeholder={t('discovery.governance.set.hintsPlaceholder')} aria-label={t('discovery.governance.set.hints')} onChange={() => setSaved(false)} /></Row>
          <Row label={t('discovery.governance.set.headers')} hint={t('discovery.governance.set.headersHint')}><span className="bw-mono dw-muted">User-Agent: BIWEB-Discovery ({t('discovery.governance.set.contactConfigured')})</span></Row>
          <Row label={t('discovery.governance.set.proxy')} hint={t('discovery.governance.set.proxyHint')}><Badge>{t('discovery.governance.set.off')}</Badge></Row>
        </div>
      </Section>
      <Section title={t('discovery.governance.set.rates')} hint={t('discovery.governance.set.ratesHint')}>
        <div className="dw-facts dw-facts--col">
          {RATE_ROWS.map(({ id, label }) => <Row key={id} label={t(label)}><span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="number" min={1} max={120} value={rates[id] ?? 1} aria-label={t('discovery.governance.set.rateAria', { name: t(label) })} style={{ ...fieldStyle, width: 72 }} onChange={(e) => { setRates({ ...rates, [id]: Math.max(1, Number(e.target.value) || 1) }); setSaved(false); }} /><span className="dw-muted">{t('discovery.governance.set.perRequest')}</span></span></Row>)}
        </div>
      </Section>
    </div>
  );
}
