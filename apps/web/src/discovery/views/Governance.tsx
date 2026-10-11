import { useState, type ReactNode } from 'react';
import { Badge, Button, Icon } from '@biweb/ui';
import { BLOCK_LABEL, BLOCK_NOTE, SOURCES } from '../data/seed';
import { AuthorityBadge, Grid, Section, ViewHead, dpath, useGo, type Col } from '../ui';
import { useDs } from '../store';
import './explore.css';

const DEFAULTS: { k: string; v: string; note: string }[] = [
  { k: 'Access', v: 'Public / Authorized', note: 'Only public pages or sources the workspace is explicitly authorized to read.' },
  { k: 'Robots', v: 'Respected', note: 'robots.txt is always honored; disallowed paths are never fetched.' },
  { k: 'Rate limit', v: 'Configured', note: 'Per-source limits (default 1 request / 5 s). The BDE waits; it never raises a limit.' },
  { k: 'Retention', v: '90 days', note: 'Snapshots are kept 90 days; evidence keeps its excerpt as provenance.' },
  { k: 'License', v: 'Recorded', note: 'The license or site terms of each source are stored with its evidence.' },
  { k: 'Attribution', v: 'Required', note: 'Reports and datasets carry the source of every external fact.' },
  { k: 'Personal data', v: 'Restricted', note: 'Personal data is not collected from external sources.' },
];

export function PoliciesView() {
  const go = useGo();
  const blocked = SOURCES.filter((s) => s.blocked);
  const dc: Col<(typeof DEFAULTS)[number]>[] = [
    { key: 'k', label: 'Policy', w: '140px', render: (r) => <b>{r.k}</b> },
    { key: 'v', label: 'Workspace default', w: '170px', render: (r) => <Badge tone="success" icon="check">{r.v}</Badge> },
    { key: 'n', label: 'What it means', w: 'minmax(260px, 1fr)', render: (r) => <span className="dw-muted">{r.note}</span> },
  ];
  const bc: Col<(typeof blocked)[number]>[] = [
    { key: 's', label: 'Source', w: 'minmax(180px, 1.3fr)', render: (s) => <span className="ds-ex-trunc" title={s.url}>{s.name}</span> },
    { key: 'a', label: 'Authority', w: '96px', render: (s) => <AuthorityBadge a={s.authority} /> },
    { key: 'r', label: 'Reason', w: '190px', render: (s) => <Badge tone={s.health === 'blocked' ? 'danger' : 'warning'} icon="lock">{BLOCK_LABEL[s.blocked!]}</Badge> },
    { key: 'n', label: 'Note', w: 'minmax(260px, 2fr)', render: (s) => <span className="dw-muted">{BLOCK_NOTE[s.blocked!]}</span> },
  ];
  return (
    <div className="dw-view">
      <ViewHead title="Policies" sub="How the BDE is allowed to collect. Defaults apply to every mission; a source can only be stricter." actions={<Button size="sm" variant="ghost" onPress={() => go(dpath('settings'))}>Advanced settings</Button>} />
      <p className="dw-note"><Icon name="lock" size={12} />There is no bypass of authentication, CAPTCHA or rate limits. When a source says no, the BDE records the reason and stops.</p>
      <Section title="Workspace policy defaults"><Grid cols={dc} rows={DEFAULTS} id={(r) => r.k} label="Workspace policy defaults" /></Section>
      <Section title="Blocked sources" hint={`${blocked.length} sources`}>
        <Grid cols={bc} rows={blocked} id={(s) => s.id} label="Blocked sources" onRow={(s) => useDs.getState().select({ kind: 'source', id: s.id })} empty={<p className="dw-more">No blocked sources.</p>} />
      </Section>
    </div>
  );
}

function Opts<T extends string | number>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: T[] }) {
  return <div className="dw-chips" role="radiogroup" aria-label={label}>{options.map((o) => <button key={String(o)} type="button" role="radio" aria-checked={value === o} className={`dw-chip${value === o ? ' is-on' : ''}`} onClick={() => onChange(o)}>{String(o)}</button>)}</div>;
}
function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <div className="dw-kv" style={{ alignItems: 'center', gap: 12 }}><span style={{ minWidth: 190 }}>{label}{hint && <small className="dw-muted" style={{ display: 'block' }}>{hint}</small>}</span><div style={{ flex: 1 }}>{children}</div></div>;
}
const fieldStyle = { width: '100%', maxWidth: 420, padding: '5px 8px', border: '1px solid var(--border-control)', borderRadius: 'var(--radius-sm)', background: 'var(--surface-app)', color: 'var(--text-primary)', font: '12px var(--font-sans)' } as const;

export function SettingsView() {
  const [acq, setAcq] = useState<'Auto' | 'API' | 'HTTP' | 'Browser' | 'Document'>('Auto');
  const [render, setRender] = useState<'Auto' | 'Static' | 'Dynamic'>('Auto');
  const [depth, setDepth] = useState<1 | 2 | 3>(2);
  const [domains, setDomains] = useState('*.gov.br\nanatel.gov.br\nibge.gov.br');
  const [paths, setPaths] = useState('Allow /produtos, /docs, /precos\nDeny /login, /conta, /checkout');
  const [rates, setRates] = useState<Record<string, number>>({ 'Official websites': 5, Documentation: 3, 'Public APIs': 10, 'News and RSS': 15 });
  const [minEv, setMinEv] = useState(2);
  const [pref, setPref] = useState<'Official' | 'Reference' | 'Any'>('Official');
  const [thr, setThr] = useState(80);
  const [ret, setRet] = useState<30 | 90 | 180 | 365>(90);
  const [saved, setSaved] = useState(false);
  const mark = <T,>(f: (v: T) => void) => (v: T) => { f(v); setSaved(false); };
  return (
    <div className="dw-view">
      <ViewHead title="Settings" sub="Defaults for verification and retention, plus advanced acquisition controls." actions={<><Button size="sm" variant="primary" onPress={() => { setSaved(true); useDs.getState().toast('Settings saved for this session'); }}>Save</Button>{saved && <Badge tone="success" icon="check">Saved</Badge>}</>} />
      <Section title="Verification defaults" hint="Applied to new missions">
        <div className="dw-facts dw-facts--col">
          <Row label="Minimum evidence" hint="independent sources per claim"><Opts<number> label="Minimum evidence" value={minEv} onChange={mark(setMinEv)} options={[1, 2, 3]} /></Row>
          <Row label="Preferred source"><Opts<'Official' | 'Reference' | 'Any'> label="Preferred source" value={pref} onChange={mark(setPref)} options={['Official', 'Reference', 'Any']} /></Row>
          <Row label="Confidence threshold" hint="below this a claim is marked Needs verification"><span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="range" min={50} max={99} value={thr} aria-label="Confidence threshold" onChange={(e) => { setThr(Number(e.target.value)); setSaved(false); }} /><b className="bw-num">{thr}%</b></span></Row>
          <Row label="Retention" hint="how long snapshots are kept"><Opts<number> label="Retention days" value={ret} onChange={(v) => { setRet(v as 30 | 90 | 180 | 365); setSaved(false); }} options={[30, 90, 180, 365]} /></Row>
        </div>
      </Section>
      <Section title="Advanced" hint="Technical controls; the defaults are right for most missions">
        <div className="dw-facts dw-facts--col">
          <Row label="Acquisition strategy" hint="how content is obtained"><Opts label="Acquisition strategy" value={acq} onChange={mark(setAcq)} options={['Auto', 'API', 'HTTP', 'Browser', 'Document']} /></Row>
          <Row label="Rendering" hint="static HTML or a rendered DOM"><Opts label="Rendering" value={render} onChange={mark(setRender)} options={['Auto', 'Static', 'Dynamic']} /></Row>
          <Row label="Discovery depth" hint="link hops from a seed"><Opts<1 | 2 | 3> label="Discovery depth" value={depth} onChange={mark(setDepth)} options={[1, 2, 3]} /></Row>
          <Row label="Allowed domains" hint="one per line"><textarea style={fieldStyle} rows={3} value={domains} aria-label="Allowed domains" onChange={(e) => { setDomains(e.target.value); setSaved(false); }} /></Row>
          <Row label="Path rules" hint="allow / deny patterns"><textarea style={fieldStyle} rows={3} value={paths} aria-label="Path rules" onChange={(e) => { setPaths(e.target.value); setSaved(false); }} /></Row>
          <Row label="Extraction hints" hint="CSS selector or XPath, optional"><input style={fieldStyle} placeholder="e.g. table.pricing td.price  ·  //div[@class='price']" aria-label="Extraction hints" onChange={() => setSaved(false)} /></Row>
          <Row label="Request headers" hint="identifies the BDE to site owners"><span className="bw-mono dw-muted">User-Agent: BIWEB-Discovery (contact configured)</span></Row>
          <Row label="Proxy" hint="not used; identities are never rotated"><Badge>Off</Badge></Row>
        </div>
      </Section>
      <Section title="Rate limits" hint="seconds between requests to the same host. Limits can be lowered by a source, never bypassed.">
        <div className="dw-facts dw-facts--col">
          {Object.entries(rates).map(([k, v]) => <Row key={k} label={k}><span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="number" min={1} max={120} value={v} aria-label={`${k} seconds between requests`} style={{ ...fieldStyle, width: 72 }} onChange={(e) => { setRates({ ...rates, [k]: Math.max(1, Number(e.target.value) || 1) }); setSaved(false); }} /><span className="dw-muted">s / request</span></span></Row>)}
        </div>
      </Section>
    </div>
  );
}
