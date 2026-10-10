import { useState } from 'react';
import { Badge, Button, Icon } from '@biweb/ui';
import { DIALECTS, translationOf } from '../analysis';
import { MEASURES } from '../data';
import { compatLabel } from '../model';
import { useMig } from '../store';
import type { TabId } from '../store';
import { CompatBadge, Conf, Evidence, OpenIn, Section } from '../ui';

const STATUS = { ready: { l: 'Pronto', t: 'success' }, review: { l: 'Revisar', t: 'warning' }, redesign: { l: 'Redesenhar', t: 'danger' } } as const;

/** Tradução semântica: o significado, não só o código. Original → Interpretação → BIWEB. */
export function Semantics({ onGo }: { onGo: (t: TabId, sel?: string) => void }) {
  const st = useMig();
  const ps = st.cur();
  const selMeasure = MEASURES.find((m) => `ms:${m.id}` === st.sel);
  const [id, setId] = useState(selMeasure?.id ?? 'net_revenue'), [dia, setDia] = useState(DIALECTS[0]!.id);
  const m = MEASURES.find((x) => x.id === id) ?? MEASURES[0]!, tr = translationOf(m.id)!;
  const status = STATUS[tr.status], d = DIALECTS.find((x) => x.id === dia)!;
  const sel = (x: string) => { setId(x); st.set({ sel: `ms:${x}` }); };
  const accepted = ps.mappings[`tr:${m.id}`] === 'confirmed';
  return <div className="ms-sem">
    <aside className="ms-sem-list" aria-label="Medidas"><header><b>Medidas</b><small>{MEASURES.length}</small></header>
      <ul role="listbox" aria-label="Medidas do modelo">{MEASURES.map((x) => <li key={x.id}><button type="button" role="option" aria-selected={id === x.id} onClick={() => sel(x.id)}><span>{x.name}</span><i className={`ms-compat-dot is-${x.compat}`} title={compatLabel(x.compat)} /></button></li>)}</ul></aside>
    <div className="ms-sem-main" key={m.id}>
      <div className="ms-trans">
        <article className="ms-trans-col is-orig"><span className="ms-trans-tag">Original</span><h3>{m.name}</h3><small>Expressão original · DAX</small><pre className="ms-code">{tr.original}</pre><small className="ms-hint">Tabela {m.table}</small></article>
        <div className="ms-trans-arrow" aria-hidden="true"><Icon name="arrowRight" size={16} /></div>
        <article className="ms-trans-col is-interp"><span className="ms-trans-tag">Interpretação</span><h3>{tr.concept}</h3>
          <dl className="ms-kv is-stack"><div><dt>Conceito de negócio</dt><dd>{m.name}</dd></div><div><dt>Entradas</dt><dd>{tr.inputs.join(' · ')}</dd></div><div><dt>Agregação</dt><dd>{tr.aggregation}</dd></div></dl>
          <div className="ms-prop-conf"><span className="bw-label">Confiança</span><Conf n={tr.confidence} /></div></article>
        <div className="ms-trans-arrow" aria-hidden="true"><Icon name="arrowRight" size={16} /></div>
        <article className="ms-trans-col is-biweb"><span className="ms-trans-tag">BIWEB</span><h3>{m.name}</h3>
          <dl className="ms-kv is-stack"><div><dt>Metric</dt><dd>{tr.metric}</dd></div><div><dt>Status</dt><dd><Badge tone={status.t}>{status.l}</Badge>{accepted && <Badge tone="success" icon="check">Confirmado</Badge>}</dd></div><div><dt>Compatibilidade</dt><dd><CompatBadge c={m.compat} /></dd></div></dl>
          {tr.notes && <p className="ms-callout"><Icon name="info" size={12} />{tr.notes}</p>}</article>
      </div>
      <Section title="Evidência" hint="Por que o Copilot interpretou assim"><Evidence items={tr.evidence} />
        <div className="ms-row-actions"><Button size="sm" variant="primary" icon="check" isDisabled={accepted} onPress={() => st.decideMapping(`tr:${m.id}`, 'confirmed')}>{accepted ? 'Aceito' : 'Accept'}</Button><Button size="sm" onPress={() => onGo('validation')}>Enviar para revisão</Button><Button size="sm" variant="ghost" icon="copilot" onPress={() => st.ask('Esse cálculo pode ser reconstruído?')}>Ask Copilot</Button><OpenIn builder="data" refId="" label="Open in Data Workspace" /></div></Section>
      <Section title="Outros dialetos" hint="A mesma ideia, traduzida do que cada plataforma escreve">
        <div className="ms-dialects" role="tablist" aria-label="Dialetos">{DIALECTS.map((x) => <button key={x.id} role="tab" aria-selected={dia === x.id} onClick={() => setDia(x.id)}>{x.name}</button>)}</div>
        <div className="ms-trans is-mini"><pre className="ms-code">{d.original}</pre><Icon name="arrowRight" size={12} /><div><b>{d.interp}</b><small>{d.biweb}</small></div></div></Section>
    </div>
  </div>;
}
