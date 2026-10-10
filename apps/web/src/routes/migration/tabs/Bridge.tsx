import { useEffect, useState } from 'react';
import { Badge, Button, Icon } from '@biweb/ui';
import { BRIDGE_CHANGES } from '../analysis';
import { useMig } from '../store';
import type { TabId } from '../store';
import { Section } from '../ui';

const STAGES = ['Origem alterada', 'Analisar', 'Impacto na migração', 'Atualização proposta'];
const SIGN = { '+': 'is-add', '~': 'is-mod', '−': 'is-del' } as const;

/** Bridge Mode: coexistência temporária entre a plataforma original e o BIWEB. A migração é versionada, não um evento único. */
export function Bridge({ onGo }: { onGo: (t: TabId, sel?: string) => void }) {
  const st = useMig(), ps = st.cur(), [stage, setStage] = useState(3), [run, setRun] = useState(false);
  useEffect(() => { if (!run) return; setStage(0); const t = setInterval(() => setStage((s) => { if (s >= 3) { clearInterval(t); setRun(false); return 3; } return s + 1; }), 700); return () => clearInterval(t); }, [run]);
  const open = BRIDGE_CHANGES.filter((c) => !ps.bridge[c.id] || ps.bridge[c.id] === 'reviewed');
  const pending = BRIDGE_CHANGES.filter((c) => ps.bridge[c.id] !== 'applied');
  return <div className="ms-bridge">
    <div className="ms-bridge-pair">
      <div className="is-src"><span className="ms-kind">Power BI</span><b><i className="ms-live-dot" />Conectado</b><small>Última sincronização {ps.published ? 'agora' : 'há 10 min'}</small></div>
      <div className="ms-bridge-link" aria-hidden="true"><i /><i /><i /></div>
      <div className="is-dst"><span className="ms-kind">BIWEB</span><b><i className="ms-live-dot" />{pending.length ? 'Sincronizado' : 'Atualizado'}</b><small>{pending.length} {pending.length === 1 ? 'mudança detectada' : 'mudanças detectadas'}</small></div>
      <div className="ms-bridge-act"><Button size="sm" icon="refresh" isDisabled={run} onPress={() => setRun(true)}>{run ? 'Analisando…' : 'Verificar origem'}</Button></div>
    </div>
    <ol className="ms-pipe is-compact ms-bridge-flow" aria-label="Fluxo de uma mudança">{STAGES.map((s, i) => <li key={s} className={i < stage ? 'is-done' : i === stage ? 'is-now' : ''}><button type="button" tabIndex={-1}><span className="ms-pipe-dot">{i < stage ? <Icon name="check" size={12} /> : i + 1}</span><span><b>{s}</b></span></button>{i < 3 && <i className="ms-pipe-line" />}</li>)}</ol>
    <Section title="Mudanças detectadas na origem" hint={`${pending.length} pendentes · ${BRIDGE_CHANGES.length - pending.length} aplicadas`}>
      {BRIDGE_CHANGES.length && open.length === 0 && pending.length === 0 ? <p className="ms-hint">Origem e BIWEB estão alinhados.</p> : null}
      <ul className="ms-changes">{BRIDGE_CHANGES.map((c, i) => { const d = ps.bridge[c.id]; return <li key={c.id} className={`${SIGN[c.sign]}${d === 'applied' ? ' is-applied' : ''}`} style={{ animationDelay: `${i * 160}ms` }}>
        <b className="ms-sign">{c.sign}</b><div><h4>{c.title}</h4><p>{c.detail}</p><div className="ms-affected"><span className="bw-label">Afeta no BIWEB</span>{c.affected.map((a) => <Badge key={a}>{a}</Badge>)}</div></div><small>{c.when}</small>
        <div className="ms-row-actions">{d === 'applied' ? <Badge tone="success" icon="check">Atualização aplicada</Badge> : <><Button size="sm" variant="primary" onPress={() => { st.decideBridge(c.id, 'reviewed'); st.set({ sel: c.sign === '~' ? 'ms:net_revenue' : c.sign === '+' ? 'rep:targets' : 'rep:weekly' }); onGo('inventory'); }}>Review update</Button><Button size="sm" onPress={() => { st.decideBridge(c.id, 'applied'); st.addHistory({ v: '', title: 'Atualização aplicada', detail: c.title, when: 'agora', kind: 'source' }); }}>Aplicar</Button><Button size="sm" variant="ghost" icon="copilot" onPress={() => st.ask(c.sign === '~' ? 'Quais relatórios dependem desta medida?' : 'Explique este item')}>Ask Copilot</Button></>}</div></li>; })}</ul></Section>
    <Section title="Histórico da migração" hint="Cada passo é versionado"><ol className="ms-history">{ps.history.map((h) => <li key={h.id} className={`is-${h.kind}`}><i /><div><b>{h.title}{h.v && <Badge>{h.v}</Badge>}</b><p>{h.detail}</p></div><small>{h.when}</small></li>)}</ol></Section>
  </div>;
}
