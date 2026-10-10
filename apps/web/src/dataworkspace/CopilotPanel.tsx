import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Icon } from '@biweb/ui';
import { RELS, colLabel, sourceById, assetById } from './registry';
import { useDw, type Card, type Msg } from './store';
import { MODELS, ENRICHMENTS } from './ops';
import { reply, suggestions, type Ctx } from './copilot';
import { ConfBadge, StepList, useGo, useSteps } from './ui';

function ctxOf(section: string, itemId: string | undefined, sel: ReturnType<typeof useDw.getState>['sel']): { ctx: Ctx; crumbs: string[] } {
  const col = sel?.kind === 'column' ? sel.extra : undefined;
  const aid = sel?.kind === 'column' || sel?.kind === 'asset' ? sel.id : section === 'catalog' ? itemId : undefined;
  const a = aid ? assetById(aid) : undefined;
  const src = a ? sourceById(a.source) : itemId && section === 'sources' ? sourceById(itemId) : undefined;
  const crumbs = [src?.name, a?.name, col].filter(Boolean) as string[];
  if (!crumbs.length) crumbs.push(section === 'model' ? `Modelo · ${MODELS.find((m) => m.id === (itemId ?? 'sales'))?.name ?? 'Sales Model'}` : 'NovaLink Operations');
  return { ctx: { section, itemId: aid ?? itemId, col, issue: sel?.kind === 'issue' ? sel.id : undefined }, crumbs };
}

export function CopilotPanel({ section, itemId }: { section: string; itemId?: string }) {
  const st = useDw();
  const sel = st.sel;
  const { ctx, crumbs } = ctxOf(section, itemId, sel);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [st.chat.length, busy]);
  const send = (q = text) => {
    const t = q.trim(); if (!t || busy) return;
    setText(''); setBusy(true);
    st.pushChat([{ id: `u${Date.now()}`, role: 'user', text: t }]);
    setTimeout(() => { st.pushChat([reply(t, ctx)]); setBusy(false); }, 900);
  };
  if (st.ai.mode === 'off') {
    return <div className="dw-cop"><div className="dw-cop-off"><Icon name="copilot" size={20} /><b>IA desligada</b><p>A descoberta, o perfil, as regras e a linhagem continuam funcionando sem IA. Ligue a assistência para conversar sobre os dados.</p><Button size="sm" variant="primary" onPress={() => st.setAi({ mode: 'metadata' })}>Habilitar (somente metadados)</Button></div></div>;
  }
  return (
    <div className="dw-cop">
      <div className="dw-cop-ctx" aria-label="Contexto selecionado"><small>Contexto</small><div>{crumbs.map((c, i) => <span key={c}>{i > 0 && <Icon name="chevronRight" size={12} />}{c}</span>)}</div></div>
      <div className="dw-chat" aria-live="polite">
        {st.chat.length === 0 && <div className="dw-chat-empty"><Icon name="copilot" size={20} /><b>Data Copilot</b><p>Pergunte sobre o que está selecionado. Eu proponho; você revisa e decide.</p></div>}
        {st.chat.map((m) => m.role === 'user' ? <div key={m.id} className="dw-msg is-user">{m.text}</div> : <AiMsg key={m.id} m={m} />)}
        {busy && <div className="dw-msg is-ai dw-typing"><span /><span /><span /></div>}
        <div ref={end} />
      </div>
      <div className="dw-cop-sug">{suggestions(ctx).slice(0, 4).map((s) => <button key={s} type="button" onClick={() => send(s)}>{s}</button>)}</div>
      <form className="dw-cop-in" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Pergunte sobre os dados selecionados…" aria-label="Mensagem para o Data Copilot" />
        <Button type="submit" size="sm" variant="primary" icon="send" isDisabled={!text.trim() || busy}>Enviar</Button>
      </form>
      <p className="dw-cop-foot"><Icon name="lock" size={12} />{st.ai.mode === 'metadata' ? 'Somente metadados: nomes, tipos, estatísticas e padrões.' : 'Amostras mascaradas habilitadas.'} {st.chat.length > 0 && <button type="button" className="bw-link" onClick={() => st.clearChat()}>Limpar conversa</button>}</p>
    </div>
  );
}

function AiMsg({ m }: { m: Msg }) {
  const [run] = useState(true);
  const at = useSteps(m.steps?.length ?? 0, 260, run);
  return (
    <div className="dw-msg is-ai">
      {m.kicker && <small className="dw-kicker">{m.kicker}</small>}
      {m.steps && at < m.steps.length ? <StepList steps={m.steps} at={at} /> : <>
        <p>{m.text}</p>
        {m.card && <CardView c={m.card} />}</>}
    </div>
  );
}

function CardView({ c }: { c: Card }) {
  const st = useDw(), go = useGo();
  const [step, setStep] = useState<'idle' | 'preview' | 'applied'>('idle');
  if (c.t === 'normalize') return (
    <div className="dw-card2">
      <div className="dw-cmp"><div><small>Atual</small><b>sales_raw</b><span>53 colunas</span></div><Icon name="arrowRight" size={16} /><div><small>Proposto</small><b>Customer · Order · OrderItem · Product · Region</b><span>5 entidades</span></div></div>
      <ul className="dw-evid"><li>✓ Por quê: dados de cliente se repetem em 61% das linhas</li><li>✓ Relacionamentos: Order→Customer, OrderItem→Order, OrderItem→Product, Customer→Region</li><li>✓ Duplicados removidos: ~38% dos valores</li><li>✓ Benefício: Customer reutilizável e integridade relacional</li><li>• Impacto: 2 mapeamentos · 1 publicação</li></ul>
      <div className="dw-hyp-a"><Button size="sm" onPress={() => { st.setMv({ mode: 'logical', ver: 'proposed' }); go('/data/model/sales'); }}>Ver no modelo</Button><Button size="sm" variant="primary" onPress={() => go('/data/changes/CS-184')}>Revisar ChangeSet</Button></div>
      <small className="dw-muted">Nada foi aplicado. A mudança só ocorre após aprovação do ChangeSet.</small>
    </div>
  );
  if (c.t === 'relationship') {
    const r = RELS.find((x) => x.id === c.relId)!;
    const d = st.decisions[r.id];
    return (
      <div className="dw-card2">
        <div className="dw-cmp dw-cmp--col"><code className="bw-mono">{colLabel(r.from)}</code><Icon name="arrowRight" size={12} /><code className="bw-mono">{c.relId === 'r10' ? 'Customer.document' : colLabel(r.to)}</code></div>
        <div className="dw-conf-row"><span>Confiança</span><ConfBadge v={r.conf} /></div>
        <ul className="dw-evid">{r.evidence.map((e) => <li key={e}>✓ {e}</li>)}</ul>
        {step === 'preview' && !d && <p className="dw-note"><Icon name="info" size={12} />Prévia: {r.overlap}% das linhas casam. 0 conflitos de chave. Cardinalidade {r.card}.</p>}
        {d === 'accepted' ? <p className="dw-note is-ok"><Icon name="check" size={12} />Aplicado ao modelo.</p> : (
          <div className="dw-hyp-a"><Button size="sm" onPress={() => setStep('preview')}>Prévia</Button><Button size="sm" variant="primary" isDisabled={step === 'idle'} onPress={() => { st.decide(r.id, 'accepted'); setStep('applied'); st.toast('Relacionamento aplicado'); }}>Aplicar</Button></div>)}
      </div>
    );
  }
  if (c.t === 'explain') return <div className="dw-card2"><ul className="dw-evid is-warn">{c.lines.map((l) => <li key={l}>• {l}</li>)}</ul>{c.cta && <Button size="sm" onPress={() => go(c.cta!.to)}>{c.cta.label}</Button>}</div>;
  if (c.t === 'lineage') return <div className="dw-card2"><div className="dw-cmp dw-cmp--col"><span className="bw-mono">ERP.CLIENTES.CPF</span><Icon name="chevronDown" size={12} /><span className="bw-mono">normalizeCpf()</span><Icon name="chevronDown" size={12} /><span className="bw-mono">Customers Curated.document</span></div><Button size="sm" variant="primary" onPress={() => go('/data/lineage')}>Abrir linhagem</Button></div>;
  if (c.t === 'enrich') return <div className="dw-card2"><ul className="dw-hits dw-hits--sm">{ENRICHMENTS.filter((e) => ['e1', 'e3', 'e6'].includes(e.id)).map((e) => <li key={e.id}><button type="button" onClick={() => go('/data/enrichment')}><Badge>{e.type}</Badge><b>{e.title}</b><small>{e.coverage}%</small></button></li>)}</ul></div>;
  return <ul className="dw-card2 dw-cl">{c.items.map((i) => <li key={i}>{i}</li>)}</ul>;
}
