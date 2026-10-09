import { useMemo, useState } from 'react';
import { Badge, Button, Checkbox, Icon, NumberField, PropertySection, Select, Switch, TextField } from '@biweb/ui';
import { diffDocs, fmtBytes, fmtClock, fmtDur, fmtN, nextRun, optimizations, STATE_LABEL, validate } from './engine';
import type { NodeRun, Run } from './engine';
import { proposal } from './copilot';
import { dirtyCount, docOf, useWf } from './store';
import { catOf, kindOf, simOf } from './model';
import type { FieldDef, WNode, Workflow } from './model';

const opt = (v: string[]) => v.map((x) => ({ id: x, label: x }));
const TONES: [string, string][] = [['accent', 'Azul'], ['success', 'Verde'], ['warning', 'Âmbar'], ['neutral', 'Neutro']];

function Field({ n, f, ro }: { n: WNode; f: FieldDef; ro: boolean }) {
  const setCfg = useWf((s) => s.setCfg), v = n.cfg[f.key];
  if (f.key === 'cron' && n.cfg.freq !== 'Cron / avançado') return null;
  if (f.key === 'at' && (n.cfg.freq === 'A cada hora' || n.cfg.freq === 'Cron / avançado')) return null;
  if (f.type === 'select') return <Select<string> label={f.label} options={opt(f.options.map((o) => (o === 'Quarentena' ? 'Quarentena' : o)))} value={String(v ?? f.options[0])} onChange={(x) => setCfg(n.id, { [f.key]: x })} isDisabled={ro} />;
  if (f.type === 'bool') return <Switch isSelected={!!v} onChange={(x) => setCfg(n.id, { [f.key]: x })} isDisabled={ro}>{f.label}</Switch>;
  if (f.type === 'number') return <NumberField label={f.label} value={Number(v ?? 0)} onChange={(x) => setCfg(n.id, { [f.key]: x })} isDisabled={ro} />;
  if (f.type === 'rules') {
    const on = String(v ?? '').split('|').filter(Boolean);
    return <fieldset className="wf-rules"><legend>{f.label}</legend>{f.options.map((o) => <Checkbox key={o} isSelected={on.includes(o)} isDisabled={ro} onChange={(x) => setCfg(n.id, { [f.key]: (x ? [...on, o] : on.filter((r) => r !== o)).join('|') })}>{o}</Checkbox>)}</fieldset>;
  }
  return <TextField label={f.label} value={String(v ?? '')} placeholder={f.ph} onChange={(x) => setCfg(n.id, { [f.key]: x })} isDisabled={ro} mono={f.key === 'expr' || f.key === 'cron' || f.key === 'conn'} />;
}

/** Amostra de linhas inválidas para “Inspecionar linhas”. */
export function sampleRows(rows: number) {
  const bad = ['31/02/2024', '2024-13-45', '00/00/0000', '15-ABR-24', '32/01/23', '2023/02/30', '99/99/99', ''];
  return bad.map((d, i) => ({ id: 880000 + i * 1371, cliente: `CLI-${(48210 + i * 97).toString()}`, data: d || '(vazio)', motivo: d ? (i % 2 ? 'Mês ou dia fora do intervalo' : 'Data inexistente no calendário') : 'Campo obrigatório vazio', rows }));
}

export function ErrorCard({ node, r, onRows }: { node: WNode; r: NodeRun; onRows: () => void }) {
  const retry = useWf((s) => s.retry), ask = useWf((s) => s.ask);
  return <section className="wf-error" role="alert">
    <header><Badge tone="danger" icon="warning">Falhou</Badge><b>{node.name}</b></header>
    <dl><dt>Motivo</dt><dd>{r.err?.reason}</dd><dt>Afetados</dt><dd>{(r.err?.rows ?? 0).toLocaleString('pt-BR')} registros</dd></dl>
    <p>{r.err?.hint}</p>
    <div className="wf-error-actions"><Button size="sm" onPress={onRows}>Inspecionar linhas</Button><Button size="sm" variant="primary" onPress={() => retry(node.id)}>Tentar novamente</Button><Button size="sm" icon="copilot" onPress={() => ask('Por que essa execução falhou?')}>Perguntar ao Copilot</Button></div>
  </section>;
}

export function Inspector({ wf, run, editable, onRows, onVersions, onTab }: { wf: Workflow; run?: Run; editable: boolean; onRows: () => void; onVersions: () => void; onTab: (t: 'inspector' | 'run' | 'copilot') => void }) {
  const st = useWf(), { sel, selEdge, groupSel } = st;
  const [test, setTest] = useState<Record<string, string>>({});
  const aiOn = true;
  const node = sel.length === 1 ? wf.nodes.find((n) => n.id === sel[0]) : undefined;
  const edge = selEdge ? wf.edges.find((e) => e.id === selEdge) : undefined;
  const group = groupSel ? wf.groups.find((g) => g.id === groupSel) : undefined;
  const issues = useMemo(() => validate(wf), [wf]);
  const ro = !editable;

  if (edge) {
    const a = wf.nodes.find((n) => n.id === edge.from), b = wf.nodes.find((n) => n.id === edge.to);
    return <div className="wf-insp"><header className="wf-insp-head"><span className="wf-node-glyph"><Icon name="arrowRight" size={12} /></span><div><small>CONEXÃO</small><h2>{a?.name} → {b?.name}</h2></div></header>
      <PropertySection label="Geral"><TextField label="Rótulo" value={edge.label ?? ''} placeholder="Ex.: Crítico" isDisabled={ro} onChange={(v) => st.commit((d) => ({ ...d, edges: d.edges.map((e) => (e.id === edge.id ? { ...e, label: v || undefined } : e)) }))} />
        <Switch isSelected={!!edge.err} isDisabled={ro} onChange={(v) => st.commit((d) => ({ ...d, edges: d.edges.map((e) => (e.id === edge.id ? { ...e, err: v || undefined } : e)) }))}>Seguir apenas se a origem falhar</Switch></PropertySection>
      {editable && <div className="wf-insp-foot"><Button variant="danger" icon="trash" onPress={() => st.removeSel()}>Remover conexão</Button></div>}</div>;
  }
  if (group) {
    const r = run && group.nodes.flatMap((i) => (run.nodes[i] ? [run.nodes[i]!] : []));
    return <div className="wf-insp"><header className="wf-insp-head"><span className="wf-node-glyph"><Icon name="container" size={12} /></span><div><small>{group.collapsed ? 'SUBFLUXO' : 'GRUPO'}</small><h2>{group.name}</h2></div></header>
      <PropertySection label="Geral"><TextField label="Nome" value={group.name} isDisabled={ro} onChange={(v) => st.commit((d) => ({ ...d, groups: d.groups.map((g) => (g.id === group.id ? { ...g, name: v.toUpperCase() } : g)) }))} />
        <Select<string> label="Cor" options={TONES.map(([id, label]) => ({ id, label }))} value={group.tone} isDisabled={ro} onChange={(v) => st.commit((d) => ({ ...d, groups: d.groups.map((g) => (g.id === group.id ? { ...g, tone: v as typeof g.tone } : g)) }))} /></PropertySection>
      <PropertySection label={`Operações · ${group.nodes.length}`}><ol className="wf-oplist">{group.nodes.map((i) => { const n = wf.nodes.find((x) => x.id === i); const s = run?.nodes[i]?.state; return n ? <li key={i}><button type="button" onClick={() => st.select([i])}>{n.name}</button>{s && <small className={`is-${s}`}>{STATE_LABEL[s]}</small>}</li> : null; })}</ol>{r && r.some((x) => x.state === 'failed') && <p className="wf-hint">Uma operação interna falhou. Expanda o subfluxo para ver qual.</p>}</PropertySection>
      <div className="wf-insp-foot"><Button icon="container" onPress={() => st.collapse(group.id)}>{group.collapsed ? 'Expandir subfluxo' : 'Recolher em subfluxo'}</Button>{editable && <Button variant="ghost" onPress={() => st.ungroup(group.id)}>Desagrupar</Button>}</div></div>;
  }
  if (sel.length > 1) return <div className="wf-insp"><header className="wf-insp-head"><span className="wf-node-glyph"><Icon name="layers" size={12} /></span><div><small>SELEÇÃO</small><h2>{sel.length} nós selecionados</h2></div></header>
    <p className="wf-hint">Arraste para mover juntos. ⌘G agrupa, ⌘D duplica, Delete remove.</p>
    {editable && <div className="wf-insp-foot"><Button icon="container" onPress={() => st.group()}>Agrupar</Button><Button icon="copy" onPress={() => st.duplicate()}>Duplicar</Button><Button variant="danger" icon="trash" onPress={() => st.removeSel()}>Remover</Button></div>}</div>;

  if (node) {
    const k = kindOf(node.kind), cat = catOf(k.cat), r = run?.nodes[node.id], sim = simOf(node);
    const issue = issues.filter((i) => i.node === node.id);
    const runNode = () => setTest((t) => ({ ...t, [node.id]: sim.fail && !(sim.fail.fixKey && node.cfg[sim.fail.fixKey] === sim.fail.fixValue) ? `Falhou na amostra · ${sim.fail.reason.toLowerCase()}` : `Concluído na amostra · 1.000 linhas · ${fmtDur(Math.max(0.2, sim.dur / 12))}` }));
    return <div className="wf-insp" style={{ '--cat': cat.color } as React.CSSProperties}>
      <header className="wf-insp-head"><span className="wf-node-glyph"><Icon name={k.icon} size={12} /></span><div><small>{k.label.toUpperCase()} · {cat.label.toUpperCase()}</small><h2>{node.name}</h2></div></header>
      {r && r.state === 'failed' && <ErrorCard node={node} r={r} onRows={onRows} />}
      {r && r.state !== 'failed' && <section className="wf-runstat"><div><small>Estado</small><b className={`is-${r.state}`}>{STATE_LABEL[r.state]}</b></div><div><small>Duração</small><b>{r.t1 != null && r.t0 != null ? fmtDur(r.t1 - r.t0) : r.state === 'running' ? `${Math.round(r.progress * 100)}%` : '—'}</b></div><div><small>Registros</small><b>{r.rowsOut ? fmtN(r.rowsOut) : '—'}</b></div><div><small>Volume</small><b>{r.bytes && wf.unit === 'linhas' ? fmtBytes(r.bytes) : '—'}</b></div>{r.warn && <p className="wf-warn"><Icon name="warning" size={12} />{r.warn}</p>}</section>}
      {r?.state === 'paused' && <section className="wf-task"><b>Aguardando decisão</b><p>{k.verb.charAt(0).toUpperCase() + k.verb.slice(1)}. {String(node.cfg.who ?? node.cfg.what ?? '')}</p><div className="wf-error-actions"><Button size="sm" variant="primary" onPress={() => st.decide(node.id, node.kind === 'waitaction' || node.kind === 'confirm' ? 'done' : 'approved')}>{node.kind === 'waitaction' ? 'Concluir ação' : 'Aprovar'}</Button>{(node.kind === 'review' || node.kind === 'approval') && <Button size="sm" onPress={() => st.decide(node.id, 'returned')}>Devolver</Button>}</div></section>}
      {issue.length > 0 && editable && <ul className="wf-issues">{issue.map((i, x) => <li key={x} className={i.level}><Icon name="warning" size={12} />{i.msg}</li>)}</ul>}
      <PropertySection label="Geral">
        <TextField label="Nome" value={node.name} isDisabled={ro} onChange={(v) => st.setNode(node.id, { name: v })} />
        <TextField label="Descrição" value={node.desc ?? ''} placeholder={k.desc} isDisabled={ro} onChange={(v) => st.setNode(node.id, { desc: v })} />
      </PropertySection>
      {k.fields.length > 0 && <PropertySection label={k.cat === 'trigger' ? 'Gatilho' : k.cat === 'data' || k.cat === 'ai' ? 'Entrada · Regras · Saída' : 'Configuração'}>{k.fields.map((f) => <Field key={f.key} n={node} f={f} ro={ro} />)}
        {node.kind === 'schedule' && (() => { const nx = nextRun(node.cfg); return <p className="wf-next"><Icon name="calendar" size={12} /><span>Próxima execução <b>{nx.when}</b> {nx.in}</span></p>; })()}</PropertySection>}
      {node.note && <PropertySection label="Achados da IA"><p className="wf-ainote"><Icon name="copilot" size={12} />{node.note}</p></PropertySection>}
      {k.cat !== 'trigger' && <PropertySection label="Erro" defaultOpen={false} summary={`Repetir ×${node.cfg.retries ?? 0}`}>
        <NumberField label="Tentativas automáticas" value={Number(node.cfg.retries ?? 0)} minValue={0} maxValue={10} isDisabled={ro} onChange={(v) => st.setCfg(node.id, { retries: v })} />
        <Select<string> label="Se continuar falhando" options={opt(['Interromper o fluxo', 'Continuar sem este nó', 'Seguir caminho de erro'])} value={String(node.cfg.onfailure ?? 'Interromper o fluxo')} isDisabled={ro} onChange={(v) => st.setCfg(node.id, { onfailure: v })} />
      </PropertySection>}
      <div className="wf-insp-foot">
        <Button icon="play" onPress={runNode}>Executar nó</Button>
        {k.cat === 'ai' && aiOn && <Button variant="ghost" icon="copilot" onPress={() => { onTab('copilot'); st.ask('Adicione uma validação aqui'); }}>Sugerir validação</Button>}
        {editable && <><Button variant="ghost" icon="copy" onPress={() => st.duplicate()}>Duplicar</Button><Button variant="ghost" icon="trash" onPress={() => st.removeSel()}>Remover</Button></>}
      </div>
      {test[node.id] && <p className={`wf-testres ${test[node.id]!.startsWith('Falhou') ? 'is-bad' : ''}`} role="status"><Icon name={test[node.id]!.startsWith('Falhou') ? 'warning' : 'check'} size={12} />{test[node.id]}</p>}
    </div>;
  }

  /* Sem seleção: propriedades do fluxo */
  const trig = wf.nodes.find((n) => n.kind === 'schedule'), nx = trig ? nextRun(trig.cfg) : undefined;
  const opts = optimizations(wf), dirty = dirtyCount(wf);
  const published = wf.versions.find((v) => v.state === 'published');
  return <div className="wf-insp">
    <header className="wf-insp-head"><span className="wf-node-glyph"><Icon name="layers" size={12} /></span><div><small>FLUXO · {wf.tag.toUpperCase()}</small><h2>{wf.name}</h2></div></header>
    <PropertySection label="Geral"><TextField label="Nome" value={wf.name} isDisabled={ro} onChange={(v) => st.setMeta({ name: v })} /><TextField label="Descrição" value={wf.description} isDisabled={ro} onChange={(v) => st.setMeta({ description: v })} /></PropertySection>
    <PropertySection label="Ambiente e versão" summary={!published ? 'Não publicado' : dirty ? 'Rascunho com alterações' : 'Publicado'}>
      <div className="wf-env"><div className={`wf-env-cell ${!dirty && published ? '' : 'is-on'}`}><small>Rascunho</small><b>{!published ? 'Nunca publicado' : dirty ? `${dirty} alteraç${dirty > 1 ? 'ões' : 'ão'}` : 'Igual ao publicado'}</b></div><div className="wf-env-cell"><small>Publicado</small><b>{published ? `v${published.v}` : '—'}</b></div></div>
      <div className="wf-env-soon"><Select<string> label="Ambiente de execução" options={[{ id: 'p', label: 'Produção (atual)' }, { id: 'd', label: 'Desenvolvimento · em breve' }]} value="p" isDisabled onChange={() => {}} description="Desenvolvimento e Produção separados chegam em breve." /></div>
      <Button size="sm" icon="clock" onPress={onVersions}>Histórico de versões</Button></PropertySection>
    {trig && <PropertySection label="Agenda" summary={nx ? `${nx.when}` : undefined}>
      {kindOf('schedule').fields.slice(0, 3).map((f) => <Field key={f.key} n={trig} f={f} ro={ro} />)}
      {nx && <p className="wf-next"><Icon name="calendar" size={12} /><span>Próxima execução <b>{nx.when}</b> {nx.in}</span></p>}</PropertySection>}
    {wf.live && <PropertySection label="Tempo real"><p className="wf-hint">Fluxo contínuo: consome {fmtN(wf.live.eps)} eventos/s com atraso de {wf.live.lag.toLocaleString('pt-BR')} s. Cada alerta dispara uma execução de decisão.</p></PropertySection>}
    <PropertySection label={`Variáveis · ${wf.vars.length}`} summary="Entradas do fluxo">
      {wf.vars.map((v) => v.type === 'select' ? <Select<string> key={v.key} label={v.label} options={opt(v.options ?? [])} value={v.value} isDisabled={ro} onChange={(x) => st.setVar(v.key, x)} /> : <TextField key={v.key} label={v.label} value={v.value} mono isDisabled={ro} onChange={(x) => st.setVar(v.key, x)} />)}
      <p className="wf-hint">Use <code>{'{{nome}}'}</code> em qualquer campo. Ex.: <code>{'{{region}}'}</code>.</p></PropertySection>
    {opts.length > 0 && aiOn && <PropertySection label={`Otimizações · ${opts.length}`} summary="Sugeridas pela IA">
      {opts.map((o) => <div key={o.id} className="wf-opt"><b>{o.title}</b><p>{o.detail}</p><div><Badge tone="success">~{o.pct}% menos</Badge><Button size="sm" onPress={() => { onTab('copilot'); st.pushMsg({ id: `o${o.id}`, role: 'ai', kicker: 'Oportunidade de otimização', text: o.detail, focus: o.nodes, proposal: proposal(docOf(wf), o.title, `Redução estimada de processamento: ${o.pct}%.`, o.ops, { pct: o.pct }) }); }}>Revisar</Button></div></div>)}</PropertySection>}
    <div className="wf-insp-foot"><Button icon="copilot" onPress={() => { onTab('copilot'); st.ask('Explique esse fluxo'); }}>Explicar fluxo</Button></div>
    {run && <p className="wf-hint">Execução #{run.id} iniciada às {fmtClock(run.startedAt)}.</p>}
  </div>;
}
export { diffDocs };
