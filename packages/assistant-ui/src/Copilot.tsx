import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Avatar, Badge, Button, Icon, IconButton } from '@biweb/ui';
import type { CopilotBlock, CopilotContext, CopilotEngine, CopilotMessage } from './types';

let seq = 0;
const nid = () => `msg_${Date.now().toString(36)}_${seq++}`;

/** Mini-visualização de evidência: barras horizontais com tokens runtime (mesmo tema do dashboard). */
function Evidence({ block, dashTheme }: { block: Extract<CopilotBlock, { kind: 'evidence' }>; dashTheme: string }) {
  const max = Math.max(...block.rows.map((r) => Math.abs(r[1])));
  const fmt = (v: number) => (v < 0 ? '−' : '') + Math.abs(v).toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: block.unit === 'R$ mi' ? 2 : 0 });
  return (
    <figure className={`cp-evidence dash-theme-${dashTheme}`} aria-label={block.title}>
      <figcaption>{block.title}</figcaption>
      {block.rows.map(([k, v], i) => (
        <div key={k} className="cp-ev-row">
          <span className="cp-ev-k">{k}</span>
          <span className="cp-ev-bar"><i className="bw-grow-x" style={{ width: `${(Math.abs(v) / max) * 100}%`, background: `var(--${v < 0 || block.diverging ? 'viz-div-neg' : 'viz-cat-1'})`, ['--i' as string]: i }} /></span>
          <span className="cp-ev-v">{fmt(v)}</span>
        </div>
      ))}
    </figure>
  );
}

function Blocks({ blocks, dashTheme, onLink, onAction, reveal }: { blocks: CopilotBlock[]; dashTheme: string; onLink: (id: string) => void; onAction: (id: string) => void; reveal: number }) {
  // reveal = quantos caracteres do primeiro texto já apareceram (efeito de escrita); o resto entra depois.
  const firstText = blocks.findIndex((b) => b.kind === 'text');
  const done = firstText < 0 || reveal >= (blocks[firstText] as { text: string }).text.length;
  return (
    <>
      {blocks.map((b, i) => {
        if (i === firstText) return <p key={i} className="cp-text">{renderInline(b.kind === 'text' ? b.text.slice(0, reveal) : '')}{!done && <span className="cp-caret" />}</p>;
        if (!done) return null;
        const cls = 'bw-fade-in';
        switch (b.kind) {
          case 'text': return <p key={i} className={`cp-text ${cls}`}>{renderInline(b.text)}</p>;
          case 'evidence': return <Evidence key={i} block={b} dashTheme={dashTheme} />;
          case 'badge': return <div key={i} className={cls}><Badge tone={b.tone}>{b.text}</Badge></div>;
          case 'citation': return <p key={i} className={`cp-cite ${cls}`}><Icon name="data" size={12} /> {b.text}</p>;
          case 'steps': return <ol key={i} className={`cp-steps ${cls}`}>{b.items.map((s) => <li key={s}>{renderInline(s)}</li>)}</ol>;
          case 'links': return (
            <div key={i} className={`cp-links ${cls}`}>
              {b.title && <span className="bw-label">{b.title}</span>}
              {b.items.map((l) => (
                <button key={l.id} type="button" className="cp-link" onClick={() => onLink(l.id)}>
                  {l.thumb ? <img src={l.thumb} alt="" width={56} height={32} /> : <Icon name="report" />}
                  <span><b>{l.label}</b>{l.meta && <small>{l.meta}</small>}</span>
                  <Icon name="arrowRight" size={12} />
                </button>
              ))}
            </div>
          );
          case 'actions': return <div key={i} className={`cp-actions ${cls}`}>{b.items.map((a) => <Button key={a.id} size="sm" onPress={() => onAction(a.id)}>{a.label}</Button>)}</div>;
        }
      })}
    </>
  );
}
/** **negrito** simples; o restante é texto puro (markdown seguro: sem HTML, sem links remotos). */
function renderInline(s: string) {
  return s.split(/(\*\*[^*]+\*\*)/g).map((p, i) => p.startsWith('**') && p.endsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : p);
}

export interface CopilotProps {
  engine: CopilotEngine;
  context: CopilotContext;
  variant: 'dock' | 'page';
  userName: string;
  dashTheme?: string;
  /** URL do símbolo da marca (cabeçalho das respostas e boas-vindas). */
  brandMark: string;
  onClose?: () => void;
  onOpenReport: (id: string) => void;
  onAction?: (id: string) => void;
  /** Pergunta enviada de fora (ex.: "Perguntar ao Copilot" no menu de um visual). */
  prompt?: { text: string; nonce: number } | null;
  messages: CopilotMessage[];
  setMessages: (fn: (m: CopilotMessage[]) => CopilotMessage[]) => void;
}

/** Copilot: conversa sobre dados, relatórios e uso do produto. Capacidade do produto, não persona: sem avatar de robô, mesmos tokens. */
export function Copilot({ engine, context, variant, userName, brandMark, dashTheme = 'light', onClose, onOpenReport, onAction, prompt, messages, setMessages }: CopilotProps) {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [reveal, setReveal] = useState<Record<string, number>>({});
  const body = useRef<HTMLDivElement>(null);
  const lastNonce = useRef<number | null>(null);

  const send = async (text: string) => {
    const q = text.trim(); if (!q || busy) return;
    setInput(''); setBusy(true);
    setMessages((m) => [...m, { id: nid(), role: 'user', blocks: [{ kind: 'text', text: q }], context: context.label, at: new Date() }]);
    const blocks = await engine.reply(q, context);
    const id = nid();
    setMessages((m) => [...m, { id, role: 'assistant', blocks, at: new Date() }]);
    const total = (blocks.find((b) => b.kind === 'text') as { text: string } | undefined)?.text.length ?? 0;
    const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || total === 0) { setReveal((r) => ({ ...r, [id]: total })); setBusy(false); return; }
    let n = 0;
    const t = setInterval(() => { n = Math.min(total, n + 4); setReveal((r) => ({ ...r, [id]: n })); if (n >= total) { clearInterval(t); setBusy(false); } }, 16);
  };
  useEffect(() => { if (prompt && prompt.nonce !== lastNonce.current) { lastNonce.current = prompt.nonce; void send(prompt.text); } }, [prompt]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { body.current?.scrollTo({ top: body.current.scrollHeight, behavior: 'smooth' }); }, [messages, reveal]);
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(input); } };
  const empty = messages.length === 0;

  return (
    <section className={`cp cp--${variant}${variant === 'dock' ? ' bw-slide-in' : ''}`} aria-label="Copilot">
      {variant === 'dock' && (
        <header className="cp-head">
          <Icon name="copilot" /><span className="bw-panel-title" style={{ flex: 1 }}>Copilot</span>
          {messages.length > 0 && <IconButton icon="refresh" label="Nova conversa" size="sm" onPress={() => setMessages(() => [])} />}
          {onClose && <IconButton icon="close" label="Fechar Copilot" size="sm" onPress={onClose} />}
        </header>
      )}
      <div className="cp-body" ref={body} aria-live="polite">
        {empty && (
          <div className="cp-welcome bw-page">
            <img src={brandMark} alt="" width={40} height={38} />
            <h2>Como posso ajudar?</h2>
            <p>Pergunte sobre os números, encontre relatórios ou peça ajuda para usar o BIWEB. Nada é alterado sem a sua confirmação.</p>
            <div className="cp-suggest bw-stagger">
              {engine.suggestions(context).map((s, i) => <button key={s} type="button" style={{ ['--i' as string]: i }} onClick={() => void send(s)}><Icon name="arrowRight" size={12} />{s}</button>)}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <article key={m.id} className={`cp-msg cp-msg--${m.role} bw-fade-in`}>
            {m.role === 'user' ? (
              <>
                <Avatar name={userName} size={24} />
                <div><p className="cp-text">{(m.blocks[0] as { text: string }).text}</p>{m.context && <span className="cp-ctx-used">{m.context}</span>}</div>
              </>
            ) : (
              <>
                <span className="cp-mark" aria-hidden="true"><img src={brandMark} alt="" width={16} height={15} /></span>
                <div className="cp-answer"><Blocks blocks={m.blocks} dashTheme={dashTheme} reveal={reveal[m.id] ?? 0} onLink={onOpenReport} onAction={(id) => onAction?.(id)} /></div>
              </>
            )}
          </article>
        ))}
        {busy && messages[messages.length - 1]?.role === 'user' && <div className="cp-msg cp-msg--assistant"><span className="cp-mark" aria-hidden="true"><img src={brandMark} alt="" width={16} height={15} /></span><span className="bw-typing" aria-label="Copilot está respondendo"><i /><i /><i /></span></div>}
      </div>
      <footer className="cp-input">
        <span className="bw-ctx-chip" title="O Copilot usa este contexto na resposta"><Icon name="report" size={12} />{context.label}</span>
        <div className="cp-box">
          <textarea id={`copilot-input-${variant}`} rows={2} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} placeholder="Pergunte sobre dados, relatórios ou como fazer algo" aria-label="Mensagem para o Copilot" />
          <IconButton icon="send" label="Enviar" isDisabled={!input.trim() || busy} onPress={() => void send(input)} />
        </div>
        <span className="cp-foot">Respostas citam os dados usados. Verifique números antes de decisões.</span>
      </footer>
    </section>
  );
}
