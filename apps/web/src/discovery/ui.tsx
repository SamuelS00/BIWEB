import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Badge, Button, Dialog, Icon, type IconName, type Tone } from '@biweb/ui';
import { BLOCK_LABEL, score } from './data/seed';
import { LEVEL_LABEL, CONFLICT_LABEL, breakdown, evidenceById, sourceById } from './data/derive';
import type { Authority, ChangeEvent, Confidence, Level, SourceDescriptor } from './data/types';
import { useDs } from './store';

export { Chip, Dot, Empty, Kv, Meter, Search, Section, StepList, Tabs2, ViewHead, useSteps, useTicker, Pill, Banner2, Spark } from '../dataworkspace/ui';

/** Navegação interna do Discovery: /discovery/<seção>[/<id>]. Aceita também /maps, /reports, /workflows e /data. */
export function useGo() {
  const navigate = useNavigate();
  return (path: string) => { navigate({ to: path as '/' }); };
}
export const dpath = (section: string, id?: string) => (section === 'overview' ? '/discovery' : `/discovery/${section}${id ? `/${encodeURIComponent(id)}` : ''}`);

/** Selo obrigatório: todo dado do módulo é demonstrativo. */
export function DemoTag() { return <span className="ds-demo" title="Deterministic demo data; no real source was queried.">Demo data</span>; }

const AUTH_TONE: Record<Authority, Tone> = { PRIMARY: 'success', SECONDARY: 'accent', REFERENCE: 'neutral', DISCOVERY: 'neutral' };
export function AuthorityBadge({ a }: { a: Authority }) { return <Badge tone={AUTH_TONE[a]}>{a}</Badge>; }
export function HealthBadge({ s }: { s: SourceDescriptor }) {
  if (s.blocked) return <Badge tone={s.health === 'blocked' ? 'danger' : 'warning'} icon="lock">{BLOCK_LABEL[s.blocked]}</Badge>;
  return <Badge tone="success" icon="check">Healthy</Badge>;
}
export function LevelBadge({ l }: { l: Level }) { return <Badge tone={l === 'high' ? 'success' : l === 'medium' ? 'warning' : 'danger'}>{LEVEL_LABEL[l]}</Badge>; }
export const toneOfScore = (v: number): Tone => (v >= 90 ? 'success' : v >= 75 ? 'warning' : 'danger');

/** Número agregado com leitura de nível: nunca aparece sozinho em telas de detalhe (veja ConfidenceBreakdown). */
export function ConfChip({ v, needs }: { v: number; needs?: boolean }) {
  if (needs && v < 75) return <Badge tone="danger" icon="warning">Needs verification</Badge>;
  return <span className={`dw-conf ${v >= 90 ? 'is-hi' : v >= 75 ? 'is-mid' : 'is-lo'}`} title={`Confidence ${v}%`}><span className="dw-conf-t" aria-hidden="true"><i style={{ width: `${v}%` }} /></span><b className="bw-num">{v}%</b></span>;
}

/** Confiança decomposta: 92% = Official source High · Freshness High · Corroboration Medium · Extraction High · Conflict None. */
export function ConfidenceBreakdown({ c, compact, delta }: { c: Confidence; compact?: boolean; delta?: number }) {
  const total = Math.min(99, score(c) + (delta ?? 0));
  const rows = breakdown(c);
  return (
    <div className={`ds-conf${compact ? ' is-compact' : ''}`}>
      <div className="ds-conf-top"><b className="bw-num ds-conf-n">{total}%</b><span className="dw-muted">{rows.map((r) => `${r.label.replace('Source authority', 'Source')} ${LEVEL_LABEL[r.level]}`).join(' · ')} · Conflict {CONFLICT_LABEL[c.contradictions]}</span></div>
      {!compact && (
        <ul className="ds-conf-rows" aria-label="Confidence components">
          {rows.map((r) => <li key={r.key}><span>{r.label}</span><span className="dw-meter" role="img" aria-label={`${r.v}`}><i style={{ width: `${r.v}%` }} /></span><LevelBadge l={r.level} /></li>)}
          <li><span>Contradictions</span><span className="dw-muted">{c.contradictions === 'none' ? 'No conflicting evidence found.' : c.contradictions === 'minor' ? 'Minor: sources disagree on a value' : 'Major'}</span><Badge tone={c.contradictions === 'none' ? 'success' : 'warning'}>{CONFLICT_LABEL[c.contradictions]}</Badge></li>
        </ul>
      )}
    </div>
  );
}

/** Mudança semântica: "Pricing disclosed: Contact Sales → Starting at $2,500/month". Nunca um diff de HTML. */
export function SemanticChange({ c, big }: { c: ChangeEvent; big?: boolean }) {
  return (
    <div className={`ds-sem${big ? ' is-big' : ''}`}>
      <div className="ds-sem-h"><Badge tone={c.category === 'Pricing' ? 'warning' : 'accent'}>{c.kind}</Badge><b>{c.entity}</b><span className="dw-muted">· {c.scope}</span></div>
      <div className="ds-sem-ba"><span className="ds-before"><small>Previous</small>{c.before}</span><Icon name="arrowRight" size={12} /><span className="ds-after"><small>Current</small>{c.after}</span></div>
      <p className="ds-sem-t">{c.semantic}</p>
    </div>
  );
}

/** Botão que abre a origem de uma evidência (Source Provenance). Toda afirmação precisa de um. */
export function TraceBtn({ evidenceId, label }: { evidenceId?: string; label?: string }) {
  const open = useDs((s) => s.openEvidence);
  if (!evidenceId) return <Badge tone="warning" icon="warning">Needs verification</Badge>;
  return <button type="button" className="ds-trace" onClick={(e) => { e.stopPropagation(); open(evidenceId); }}><Icon name="eye" size={12} />{label ?? 'Evidence'}</button>;
}

/** Tabela densa com cabeçalho e linhas clicáveis (mesma estética de dw-table). */
export interface Col<T> { key: string; label: string; w: string; right?: boolean; render: (r: T) => ReactNode }
export function Grid<T>({ cols, rows, id, selected, onRow, label, empty, max }: { cols: Col<T>[]; rows: T[]; id: (r: T) => string; selected?: string | null; onRow?: (r: T) => void; label: string; empty?: ReactNode; max?: number }) {
  const tpl = { gridTemplateColumns: cols.map((c) => c.w).join(' ') };
  return (
    <div className="dw-table" role="table" aria-label={label} style={max ? { maxHeight: max } : undefined}>
      <div className="dw-tr dw-tr--head" role="row" style={tpl}>{cols.map((c) => <span key={c.key} className={c.right ? 'r' : undefined} role="columnheader">{c.label}</span>)}</div>
      {rows.length === 0 && (empty ?? <p className="dw-more">Nothing to show.</p>)}
      {rows.map((r) => (
        <div key={id(r)} role="row" tabIndex={onRow ? 0 : undefined} className={`dw-tr${onRow ? ' dw-tr--row' : ''}${selected === id(r) ? ' is-on' : ''}`} style={tpl}
          onClick={() => onRow?.(r)} onKeyDown={(e) => { if (onRow && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onRow(r); } }}>
          {cols.map((c) => <span key={c.key} className={c.right ? 'r' : undefined} role="cell">{c.render(r)}</span>)}
        </div>
      ))}
    </div>
  );
}

/** Checklist de progresso com contagens (nunca um spinner genérico). */
export function ProgressList({ title, items, at }: { title: string; items: { label: string; done?: string; now?: string }[]; at: number }) {
  return (
    <div className="ds-prog" role="status" aria-live="polite">
      <b>{title}</b>
      <ul>{items.map((it, i) => <li key={it.label} className={i < at ? 'is-done' : i === at ? 'is-now' : ''}><span aria-hidden="true">{i < at ? '✓' : i === at ? '◌' : '○'}</span>{i < at ? (it.done ?? it.label) : i === at ? (it.now ?? it.label) : it.label}</li>)}</ul>
    </div>
  );
}

/** Origem de uma evidência: trecho destacado (web), página + região (PDF) ou registro/campo (dado estruturado). Verificar conecta uma segunda evidência e a confiança sobe. */
export function EvidenceViewer() {
  const v = useDs((s) => s.evidenceView), close = useDs((s) => s.closeEvidence), verify = useDs((s) => s.verifyEvidence);
  const go = useGo();
  const ev = v ? evidenceById(v.evidenceId) : undefined;
  const src = ev ? sourceById(ev.sourceId) : undefined;
  const [conf, setConf] = useState(72);
  useEffect(() => {
    if (!v) { setConf(72); return; }
    if (!v.verified) { setConf(72); return; }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setConf(97); return; }
    const t1 = setTimeout(() => setConf(91), 500), t2 = setTimeout(() => setConf(97), 1300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [v]);
  if (!v || !ev || !src) return null;
  return (
    <Dialog title="Source provenance" isOpen onOpenChange={(o) => { if (!o) close(); }} footer={<><Button size="sm" variant="ghost" onPress={() => { close(); go(dpath('sources', src.id)); }}>Open source</Button><Button size="sm" onPress={close}>Close</Button></>}>
      <div className="ds-prov">
        <div className="dw-facts dw-facts--col">
          <div className="dw-kv"><span>Source</span><b>{src.name}</b></div>
          <div className="dw-kv"><span>URL</span><b className="bw-mono">{src.url}</b></div>
          <div className="dw-kv"><span>Captured</span><b>{ev.capturedAt}{ev.snapshotId ? ` · snapshot ${ev.snapshotId.split('@')[1] === '0' ? 'latest' : `−${ev.snapshotId.split('@')[1]} d`}` : ''}</b></div>
          <div className="dw-kv"><span>Region / section</span><b>{ev.locator}</b></div>
          <div className="dw-kv"><span>Role</span><b>{ev.role} · {LEVEL_LABEL[ev.strength]} strength</b></div>
        </div>
        {ev.kind === 'web' && <div className="ds-page"><i className="ds-ln" /><i className="ds-ln w70" /><mark>{ev.excerpt}</mark><i className="ds-ln w50" /></div>}
        {ev.kind === 'pdf' && <div className="ds-page ds-page--pdf"><span className="dw-muted">Page 12 · region B3</span><i className="ds-ln" /><mark>{ev.excerpt}</mark><i className="ds-ln w60" /></div>}
        {ev.kind === 'structured' && <div className="ds-page ds-page--rec"><code>{ev.excerpt}</code></div>}
        <p className="dw-muted">The highlighted text is the evidence. Anything the AI says about it stays separate.</p>
        <div className="ds-verify">
          <div><b>Cross-check</b><p className="dw-muted">{v.verified ? 'A second independent evidence was connected to this claim.' : 'Connect a second independent evidence to raise confidence.'}</p></div>
          <div className="ds-verify-n"><b className="bw-num">{v.verified ? conf : 72}%</b><span className="dw-meter"><i style={{ width: `${v.verified ? conf : 72}%`, transition: 'width .5s ease' }} /></span></div>
          {!v.verified && <Button size="sm" icon="check" onPress={verify}>Verify with 2nd source</Button>}
        </div>
      </div>
    </Dialog>
  );
}

export function Toasts() {
  const t = useDs((s) => s.toasts);
  return <div className="dw-toasts" role="status" aria-live="polite">{t.map((x) => <div key={x.id} className="dw-toast"><Icon name="check" size={12} />{x.text}</div>)}</div>;
}

export const KIND_ICON: Record<string, IconName> = { Organization: 'cube', Product: 'card', Service: 'bolt', Technology: 'sliders', Location: 'pin', Market: 'target', Regulation: 'book', Publication: 'report', Event: 'calendar' };
