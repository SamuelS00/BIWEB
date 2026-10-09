import { useMemo, useState } from 'react';
import { Badge, Banner, Button, Dialog, Icon, SegmentedControl, TextField } from '@biweb/ui';
import { diffDocs, validate } from './engine';
import { generateWorkflow } from './copilot';
import { sampleRows } from './Inspector';
import { TEMPLATES, blankWorkflow } from './seeds';
import { dirtyCount, docOf, useWf } from './store';
import type { Workflow } from './model';

const EXAMPLES = ['Importe vendas todos os dias às 6h, normalize CPF e atualize o dashboard Comercial', 'Todo dia às 7h valide pedidos, peça aprovação e avise em caso de erro', 'Receba eventos em tempo real e notifique quando passar do limite'];

export function NewWorkflowDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (id: string) => void }) {
  const add = useWf((s) => s.addWorkflow);
  const [tab, setTab] = useState<'blank' | 'template' | 'ai'>('template');
  const [prompt, setPrompt] = useState(EXAMPLES[0] ?? '');
  const [gen, setGen] = useState<Workflow | null>(null);
  const [tpl, setTpl] = useState(TEMPLATES[0]?.id ?? 'import');
  const create = () => { const w = tab === 'blank' ? blankWorkflow() : tab === 'ai' ? (gen ?? generateWorkflow(prompt)) : (TEMPLATES.find((t) => t.id === tpl) ?? TEMPLATES[0]!).build(); onClose(); add(w); onCreated?.(w.id); };
  return <Dialog title="Novo fluxo" isOpen={open} onOpenChange={(o) => !o && onClose()} footer={<><Button onPress={onClose}>Cancelar</Button><Button variant="primary" onPress={create}>{tab === 'blank' ? 'Começar em branco' : tab === 'ai' ? 'Criar fluxo' : 'Usar modelo'}</Button></>}>
    <div className="wf-new">
      <SegmentedControl label="Como começar" value={tab} onChange={setTab} options={[{ id: 'blank', label: 'Em branco' }, { id: 'template', label: 'Modelo' }, { id: 'ai', label: 'Descrever com Copilot' }]} />
      {tab === 'blank' && <p className="wf-hint">Um canvas vazio com a biblioteca de nós ao lado. Para quem já sabe o que quer construir.</p>}
      {tab === 'template' && <ul className="wf-tpls" role="radiogroup" aria-label="Modelos">{TEMPLATES.map((t) => <li key={t.id}><button type="button" role="radio" aria-checked={tpl === t.id} className={tpl === t.id ? 'is-on' : ''} onClick={() => setTpl(t.id)}><b>{t.name}</b><small>{t.desc}</small><Badge>{t.tag}</Badge></button></li>)}</ul>}
      {tab === 'ai' && <div className="wf-ai-new"><label htmlFor="wf-prompt">Descreva o fluxo</label><textarea id="wf-prompt" value={prompt} onChange={(e) => { setPrompt(e.target.value); setGen(null); }} rows={3} />
        <div className="wf-suggest">{EXAMPLES.map((x) => <button key={x} type="button" onClick={() => { setPrompt(x); setGen(null); }}>{x}</button>)}</div>
        <Button icon="copilot" size="sm" onPress={() => setGen(generateWorkflow(prompt))}>Gerar prévia</Button>
        {gen && <div className="wf-mini" aria-label="Prévia"><Banner tone="info">Prévia gerada: {gen.nodes.length} etapas. Nada é executado até você publicar.</Banner><div>{gen.nodes.map((n, i) => <span key={n.id}>{i > 0 && <Icon name="arrowRight" size={12} />}<em>{n.name}</em></span>)}</div></div>}
      </div>}
    </div>
  </Dialog>;
}

export function PublishDialog({ wf, open, onClose }: { wf: Workflow; open: boolean; onClose: () => void }) {
  const st = useWf(), [note, setNote] = useState('');
  const issues = useMemo(() => validate(wf), [wf]), errors = issues.filter((i) => i.level === 'error'), changes = useMemo(() => (wf.published ? diffDocs(wf.published, docOf(wf)) : []), [wf]);
  return <Dialog title="Publicar fluxo" isOpen={open} onOpenChange={(o) => !o && onClose()} footer={<><Button onPress={onClose}>Cancelar</Button><Button variant="primary" icon="check" isDisabled={errors.length > 0 || (!changes.length && !!wf.published)} onPress={() => { st.publish(note); onClose(); st.flash(`Versão publicada. As execuções agendadas passam a usar esta versão.`); setNote(''); }}>Publicar v{(wf.versions[0]?.v ?? 0) + 1}</Button></>}>
    <div className="wf-pub">
      <section><h3>Verificações</h3>{issues.length === 0 ? <p className="wf-ok"><Icon name="check" size={12} />Tudo certo: gatilho, conexões e configurações válidas.</p> : <ul className="wf-issues">{issues.map((i, x) => <li key={x} className={i.level}><Icon name="warning" size={12} />{i.msg}</li>)}</ul>}</section>
      <section><h3>Alterações desde o publicado · {changes.length}</h3>{changes.length ? <ul className="wf-changes">{changes.slice(0, 10).map((l, i) => <li key={i} className={l[0] === '+' ? 'is-add' : l[0] === '−' ? 'is-del' : 'is-mod'}><b>{l[0]}</b>{l.slice(2)}</li>)}</ul> : <p className="wf-hint">Nenhuma alteração. O rascunho é igual à versão publicada.</p>}</section>
      <TextField label="Nota da versão" value={note} onChange={setNote} placeholder="O que mudou e por quê" />
    </div>
  </Dialog>;
}

export function VersionsDialog({ wf, open, onClose }: { wf: Workflow; open: boolean; onClose: () => void }) {
  const st = useWf(), [pick, setPick] = useState(wf.versions[0]?.v);
  const ver = wf.versions.find((v) => v.v === pick), snap = ver?.doc ?? (ver?.state === 'published' ? wf.published : undefined);
  const changes = useMemo(() => (snap ? diffDocs(snap, docOf(wf)) : []), [snap, wf]);
  return <Dialog title="Histórico de versões" isOpen={open} onOpenChange={(o) => !o && onClose()} footer={<><Button onPress={onClose}>Fechar</Button><Button variant="primary" isDisabled={!snap || ver?.state === 'published' && !dirtyCount(wf)} onPress={() => { if (ver) { st.restore(ver.v); onClose(); } }}>Restaurar v{pick} como rascunho</Button></>}>
    <div className="wf-vers">
      <ul>{wf.versions.map((v) => <li key={v.v}><button type="button" className={v.v === pick ? 'is-on' : ''} onClick={() => setPick(v.v)}><b>v{v.v}</b><span><small>{v.note}</small><small>{v.author} · {v.at}</small></span>{v.state === 'published' ? <Badge tone="success">Publicada</Badge> : <Badge>Anterior</Badge>}</button></li>)}</ul>
      <section><h3>Alterações em relação ao rascunho atual</h3>{snap ? (changes.length ? <ul className="wf-changes">{changes.slice(0, 12).map((l, i) => <li key={i} className={l[0] === '+' ? 'is-del' : l[0] === '−' ? 'is-add' : 'is-mod'}><b>{l[0] === '+' ? '−' : l[0] === '−' ? '+' : '~'}</b>{l.slice(2)}</li>)}</ul> : <p className="wf-hint">Esta versão é idêntica ao rascunho.</p>) : <p className="wf-hint">Versões antigas guardam apenas o resumo neste protótipo.</p>}
        <p className="wf-hint">Restaurar cria um rascunho. Nada é publicado até você confirmar.</p></section>
    </div>
  </Dialog>;
}

export function RowsDialog({ open, onClose, rows }: { open: boolean; onClose: () => void; rows: number }) {
  const data = sampleRows(rows);
  return <Dialog title="Linhas com erro · amostra" isOpen={open} onOpenChange={(o) => !o && onClose()} footer={<Button variant="primary" onPress={onClose}>Fechar</Button>}>
    <p className="wf-hint">Mostrando {data.length} de {rows.toLocaleString('pt-BR')} linhas afetadas por “Formato de data inválido”.</p>
    <div className="wf-tablewrap"><table className="wf-table"><thead><tr><th>ID</th><th>Cliente</th><th>data_cadastro</th><th>Motivo</th></tr></thead><tbody>{data.map((r) => <tr key={r.id}><td>{r.id}</td><td>{r.cliente}</td><td className="wf-mono">{r.data}</td><td>{r.motivo}</td></tr>)}</tbody></table></div>
  </Dialog>;
}
