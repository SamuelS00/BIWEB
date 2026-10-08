import { useEffect, useRef, useState } from 'react';
import { Button, Icon } from '@biweb/ui';
import { ask, applyProposal, chooseProposalStep, DEMO_PROMPTS, stopProposal, undoAi, useCopilotChat, type ChatMsg } from '../copilot';
import { COMP_META } from '../doc';
import { useEditor } from '../store';

function Msg({ m, busy }: { m: ChatMsg; busy: boolean }) {
  if (m.role === 'user') return <div className="ai-user"><span className="ai-ctx">{m.context}</span><p>{m.text}</p></div>;
  return (
    <div className="ai-msg" aria-live="polite">
      <span className="ai-src">IA{m.summary && m.state !== 'done' && m.state !== 'answer' ? ` · ${m.summary}` : m.state === 'answer' ? ` · ${m.text}` : ''}</span>
      {m.state === 'thinking' && <div className="ai-thinking"><span className="bw-typing" aria-label="Pensando"><i /><i /><i /></span>Interpretando o pedido…</div>}
      {(m.state === 'running' || m.state === 'done') && (
        <>
          {m.text && m.state === 'running' && <p className="ai-plan">{m.text}</p>}
          <ol className="ai-steps">
            {m.steps?.map((s, i) => <li key={i} className={s.done ? 'is-done' : m.steps!.findIndex((x) => !x.done) === i && m.state === 'running' ? 'is-run' : undefined}>
              <span className="ai-step-ico" aria-hidden="true">{s.done ? <Icon name="check" size={12} /> : <i />}</span>{s.label}</li>)}
          </ol>
        </>
      )}
      {m.state === 'proposal' && <>
        {m.text && <p className="ai-plan">{m.text}</p>}
        <p className="ai-summary">Proposta · {m.steps?.filter((s) => s.accepted === true).length ?? 0} de {m.steps?.length ?? 0} mudanças selecionadas</p>
        <ol className="ai-steps ai-review-steps">{m.steps?.map((s, i) => <li key={i}>
          <span className="ai-step-ico" aria-hidden="true"><Icon name={s.accepted === true ? 'check' : s.accepted === false ? 'close' : 'more'} size={12}/></span><span>{i + 1} de {m.steps!.length} · {s.label}</span>
          <span className="ai-review-actions"><Button size="sm" variant={s.accepted === true ? 'primary' : 'ghost'} isDisabled={busy} onPress={() => chooseProposalStep(m.id, i, true)}>Aceitar</Button><Button size="sm" variant={s.accepted === false ? 'default' : 'ghost'} isDisabled={busy} onPress={() => chooseProposalStep(m.id, i, false)}>Recusar</Button></span>
        </li>)}</ol>
        <div className="ai-acts"><Button size="sm" variant="primary" isDisabled={busy || m.steps?.some((s) => s.accepted == null)} onPress={() => void applyProposal(m.id)}>Confirmar e aplicar</Button></div>
      </>}
      {m.state === 'running' && <div className="ai-acts"><span className="bw-cap bw-muted">Aplicando mudanças aprovadas…</span><Button size="sm" onPress={() => stopProposal(m.id)}>Interromper</Button></div>}
      {m.state === 'done' && (
        <>
          <p className="ai-summary">{m.summary}</p>
          <div className="ai-acts">
            {m.undone ? <span className="bw-cap bw-muted">Desfeito.</span> : <Button size="sm" icon="undo" onPress={() => undoAi(m)}>Desfazer pedido</Button>}
            {!m.undone && m.touched && m.touched.length > 0 && <Button size="sm" variant="ghost" onPress={() => { const s = useEditor.getState(); s.set({ selection: m.touched!.filter((id) => s.page()?.comps.some((c) => c.id === id)) }); }}>Mostrar no canvas</Button>}
          </div>
        </>
      )}
      {m.state === 'answer' && (
        <>
          <div className="ai-answer">{m.answer?.map((l, i) => <p key={i} className={l.startsWith('•') ? 'is-bullet' : undefined}>{l}</p>)}</div>
          {m.actions && m.actions.length > 0 && <div className="ai-acts">{m.actions.map((a) => <Button key={a.label} size="sm" onPress={() => void ask(a.prompt)}>{a.label}</Button>)}</div>}
        </>
      )}
    </div>
  );
}

export function AiTab() {
  const msgs = useCopilotChat((s) => s.msgs);
  const busy = useCopilotChat((s) => s.busy);
  const sel = useEditor((s) => (s.selection.length === 1 ? s.page()?.comps.find((c) => c.id === s.selection[0]) : undefined));
  const nSel = useEditor((s) => s.selection.length);
  const pageName = useEditor((s) => s.page()?.name);
  const [q, setQ] = useState('');
  const [selectionContext, setSelectionContext] = useState(true);
  const [pageContext, setPageContext] = useState(true);
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' }); }, [msgs]);
  const pageCtx = `Página: ${pageName}`;
  const selCtx = sel ? `${COMP_META[sel.type].label}: ${sel.name}` : nSel > 1 ? `${nSel} componentes selecionados` : null;
  const ctx = selectionContext && selCtx ? selCtx : pageContext ? pageCtx : 'Sem contexto anexado';
  const send = (t: string) => { if (!t.trim() || busy) return; void ask(t, ctx, selectionContext); setQ(''); };
  const quick = sel
    ? [['Explicar', 'Explique este indicador'], ['O que posso melhorar aqui?', 'O que posso melhorar aqui?'], ['Smart Visualization', 'Sugira a melhor visualização'], ...(sel.type === 'table' ? [['Visualização temporal', 'Transforme essa tabela em uma visualização temporal.']] : [])]
    : [['Build with AI', 'Crie uma visão executiva da disponibilidade da rede.'], ['Smart Layout', 'Organize esse dashboard deixando os indicadores mais importantes primeiro.'], ['Verificar layout', 'Verifique o layout'], ['O que posso melhorar?', 'O que posso melhorar aqui?']];
  return (
    <div className="ed-tab ai-tab">
      <div className="ai-context"><span className="bw-cap bw-muted">Contexto</span>{selCtx && <button type="button" className={`ai-context-chip${selectionContext ? ' is-active' : ''}`} aria-pressed={selectionContext} onClick={() => setSelectionContext((v) => !v)}>{selCtx}<Icon name={selectionContext ? 'check' : 'plus'} size={12}/></button>}<button type="button" className={`ai-context-chip${pageContext ? ' is-active' : ''}`} aria-pressed={pageContext} onClick={() => setPageContext((v) => !v)}>{pageCtx}<Icon name={pageContext ? 'check' : 'plus'} size={12}/></button></div>
      <div className="ai-quick">{quick.map(([l, p]) => <button key={l} type="button" className="ai-chip" disabled={busy} onClick={() => send(p!)}>{l}</button>)}</div>
      <div className="ai-log" ref={log}>
        {msgs.length === 0 && (
          <div className="ai-empty">
            <p>Eu altero este relatório: crio páginas e componentes, conecto filtros, crio regras, troco visualizações e reorganizo o layout. Toda ação vira um passo de Desfazer.</p>
            <span className="bw-label">Experimente</span>
            {DEMO_PROMPTS.map((p) => <button key={p} type="button" className="ai-suggest" onClick={() => send(p)}><Icon name="arrowRight" size={12} />{p}</button>)}
          </div>
        )}
        {msgs.map((m) => <Msg key={m.id} m={m} busy={busy} />)}
      </div>
      <form className="ai-input" onSubmit={(e) => { e.preventDefault(); send(q); }}>
        <textarea aria-label="Pedir ao Copilot" placeholder={sel ? `Pergunte sobre ${sel.name} ou peça uma mudança` : 'Descreva o que construir ou mudar'} value={q} rows={2}
          onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(q); } }} />
        <Button type="submit" variant="primary" size="sm" icon="send" isDisabled={!q.trim() || busy}>Enviar</Button>
      </form>
    </div>
  );
}
