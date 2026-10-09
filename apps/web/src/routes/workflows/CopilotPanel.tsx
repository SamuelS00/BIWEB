import { useEffect, useRef, useState } from 'react';
import { Button, Icon } from '@biweb/ui';
import { SUGGESTIONS } from './copilot';
import type { Msg } from './copilot';
import { useWf } from './store';
import type { Workflow } from './model';

function Changes({ lines }: { lines: string[] }) {
  if (!lines.length) return null;
  return <ul className="wf-changes">{lines.slice(0, 8).map((l, i) => <li key={i} className={l[0] === '+' ? 'is-add' : l[0] === '−' ? 'is-del' : 'is-mod'}><b>{l[0]}</b>{l.slice(2)}</li>)}{lines.length > 8 && <li className="is-more">+ {lines.length - 8} outras alterações</li>}</ul>;
}

function Card({ m }: { m: Msg }) {
  const st = useWf(), p = m.proposal!, done = p.status !== 'pending';
  return <div className={`wf-proposal is-${p.status}`}>
    <header><Icon name="copilot" size={12} /><b>{p.title}</b>{p.pct ? <span className="wf-pct">~{p.pct}% menos</span> : null}</header>
    <p>{p.summary}</p>
    <Changes lines={p.changes} />
    {p.newWf && <div className="wf-mini" aria-label="Prévia do fluxo">{p.newWf.nodes.map((n, i) => <span key={n.id}>{i > 0 && <Icon name="arrowRight" size={12} />}<em>{n.name}</em></span>)}</div>}
    {!done ? <><div className="wf-proposal-actions"><Button size="sm" onPress={() => st.discardProposal(m.id)}>Descartar</Button><Button size="sm" variant="primary" icon="check" onPress={() => st.applyProposal(m.id)}>{p.newWf ? (st.cur().nodes.length ? 'Criar como novo fluxo' : 'Aplicar ao fluxo') : 'Aplicar ao rascunho'}</Button></div><small className="wf-muted">Prévia no canvas. Aplicar altera o rascunho; não executa nada.</small></>
      : <small className={`wf-muted is-${p.status}`}>{p.status === 'applied' ? 'Aplicado ao rascunho · desfaça com ⌘Z' : 'Descartado'}</small>}
  </div>;
}

/** Copilot integrado ao Builder: pedido → proposta → prévia no canvas → revisão → aplicar. */
export function CopilotPanel({ wf }: { wf: Workflow }) {
  const st = useWf(), msgs = st.chat[wf.id] ?? [];
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs.length, st.activeProposal]);
  const send = (t = text) => { if (!t.trim()) return; st.ask(t.trim()); setText(''); };
  const sel = st.sel.length === 1 ? wf.nodes.find((n) => n.id === st.sel[0]) : undefined;
  return <div className="wf-copilot">
    <div className="wf-chat" aria-live="polite">
      {!msgs.length && <div className="wf-chat-empty"><Icon name="copilot" size={20} /><b>Copilot do Workflow</b><p>Descreva o que o fluxo deve fazer. Eu monto a proposta, mostro como ficaria no canvas e você decide se aplica.</p></div>}
      {msgs.map((m) => m.role === 'user' ? <div key={m.id} className="wf-msg is-user">{m.text}</div> : <div key={m.id} className="wf-msg is-ai">
        {m.kicker && <small className="wf-kicker">{m.kicker}</small>}<p>{m.text}</p>
        {m.list && <ul className="wf-msg-list">{m.list.map((l, i) => <li key={i}>{l.startsWith('Adicione') || l.startsWith('Quando') || l.startsWith('Qual') || l.startsWith('Organize') || l.startsWith('Explique') ? <button type="button" onClick={() => send(l)}>{l}</button> : l}</li>)}</ul>}
        {m.focus && m.focus.length > 0 && !m.proposal && <Button size="sm" variant="ghost" icon="target" onPress={() => { st.hover(m.focus!); st.select(m.focus!); }}>Mostrar no canvas</Button>}
        {m.proposal && <Card m={m} />}
      </div>)}
      <div ref={end} />
    </div>
    <div className="wf-suggest" role="group" aria-label="Sugestões">{SUGGESTIONS.filter((s) => !sel || !s.startsWith('Crie')).slice(0, 6).map((s) => <button key={s} type="button" onClick={() => send(s)}>{s}</button>)}</div>
    <form className="wf-compose" onSubmit={(e) => { e.preventDefault(); send(); }}>
      {sel && <span className="wf-ctx"><Icon name="target" size={12} />Contexto: {sel.name}</span>}
      <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Ex.: adicione uma validação aqui" aria-label="Pedir ao Copilot" rows={2} />
      <Button type="submit" variant="primary" size="sm" icon="send">Enviar</Button>
    </form>
  </div>;
}
