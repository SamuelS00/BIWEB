import { useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button, Icon, TextField } from '@biweb/ui';
import { NewWorkflowDialog } from './Dialogs';
import { fmtDur, runDuration } from './engine';
import { NODE_H, NODE_W, catOf, kindOf } from './model';
import type { Workflow } from './model';
import { useWf } from './store';
import '../maps-gallery.css';
import './workflows.css';

const KIND: Record<string, string> = { batch: 'Lote', realtime: 'Tempo real', scheduled: 'Agendado', event: 'Por evento', human: 'Com pessoas', operations: 'Operações' };
const STATUS: Record<string, string> = { running: 'Em execução', success: 'Última execução OK', failed: 'Falha na última execução', paused: 'Aguardando pessoa', warning: 'Concluído com avisos' };
const ACCENT: Record<string, string> = { Dados: '#4f8cff', 'Tempo real': '#3fc08a', Operações: '#e0a03a', Pessoas: '#c07bd6', Relatórios: '#7f9bd8', Governança: '#d6736b' };

/** Miniatura do grafo, desenhada com as posições reais dos nós. */
function Cover({ wf }: { wf: Workflow }) {
  const ns = wf.nodes.filter((n) => !wf.groups.some((g) => g.collapsed && g.nodes.includes(n.id)));
  if (!ns.length) return <div className="wg-cover is-empty"><Icon name="plus" size={20} /></div>;
  const x0 = Math.min(...ns.map((n) => n.x)), y0 = Math.min(...ns.map((n) => n.y)), w = Math.max(...ns.map((n) => n.x + NODE_W)) - x0, h = Math.max(...ns.map((n) => n.y + NODE_H)) - y0;
  const pad = 40, byId = new Map(ns.map((n) => [n.id, n]));
  return <div className="wg-cover" aria-hidden="true"><svg viewBox={`${x0 - pad} ${y0 - pad} ${w + pad * 2} ${Math.max(h + pad * 2, (w + pad * 2) * 0.32)}`} preserveAspectRatio="xMidYMid meet">
    {wf.edges.map((e) => { const a = byId.get(e.from), b = byId.get(e.to); if (!a || !b || e.back) return null; const x1 = a.x + NODE_W, y1 = a.y + NODE_H / 2, x2 = b.x, y2 = b.y + NODE_H / 2, dx = Math.max(30, Math.abs(x2 - x1) / 2); return <path key={e.id} d={`M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`} className={`wg-edge${e.err ? ' is-err' : ''}`} />; })}
    {ns.map((n) => <rect key={n.id} x={n.x} y={n.y} width={NODE_W} height={NODE_H} rx={14} fill={catOf(kindOf(n.kind).cat).color} className="wg-node" />)}
  </svg></div>;
}

export function WorkflowsGallery() {
  const { wfs, runs, open } = useWf();
  const navigate = useNavigate();
  const [tag, setTag] = useState('Todos'), [query, setQuery] = useState(''), [creating, setCreating] = useState(false);
  const tags = useMemo(() => ['Todos', ...new Set(wfs.map((w) => w.tag))], [wfs]);
  const q = query.trim().toLowerCase();
  const shown = wfs.filter((w) => (tag === 'Todos' || w.tag === tag) && (!q || `${w.name} ${w.description} ${w.tag}`.toLowerCase().includes(q)));
  return <main className="pg mg">
    <header className="mg-head">
      <div><div className="mg-eyebrow"><Icon name="bolt" size={12} /> Fluxos de trabalho</div><h1 className="pg-title">Escolha um fluxo para operar ou editar</h1><p className="pg-sub">{wfs.length} fluxos no mesmo motor visual: dados, sistemas, IA, regras, pessoas e operações. Abra um para monitorar a execução, depurar, editar e publicar.</p></div>
      <div className="wg-actions"><Button variant="primary" icon="plus" onPress={() => setCreating(true)}>Novo fluxo</Button></div>
    </header>
    <div className="wg-toolbar"><div className="mg-chips" role="tablist" aria-label="Categorias">{tags.map((c) => <button key={c} role="tab" aria-selected={tag === c} onClick={() => setTag(c)}>{c}<span>{c === 'Todos' ? wfs.length : wfs.filter((w) => w.tag === c).length}</span></button>)}</div><div className="mg-search"><TextField label="Buscar fluxos" hideLabel icon="search" placeholder="Buscar por nome ou tema" value={query} onChange={setQuery} /></div></div>
    {shown.length ? <div className="mg-grid">{shown.map((w) => {
      const last = runs[w.id]?.[0], published = w.versions.find((v) => v.state === 'published');
      return <Link key={w.id} to="/workflows/$workflowId" params={{ workflowId: w.id }} onClick={() => open(w.id)} className="mg-card" style={{ ['--card-accent' as string]: ACCENT[w.tag] ?? '#4f8cff' }} aria-label={`${w.name}. ${w.description}`}>
        <div className="mg-cover"><Cover wf={w} /><div className="mg-badges"><span className="mg-pill">{w.tag}</span>{w.kind === 'realtime' ? <span className="mg-pill is-live"><i />AO VIVO</span> : last?.status === 'failed' ? <span className="mg-pill wg-bad">Falha</span> : last?.status === 'paused' ? <span className="mg-pill wg-warn">Aguardando</span> : null}</div></div>
        <div className="mg-body"><h2>{w.name}</h2><p>{w.description}</p>
          <div className="mg-tags"><span>{KIND[w.kind]}</span><span>{w.nodes.length} nós</span>{w.schedule && <span>{w.schedule}</span>}{published ? <span>v{published.v}</span> : <span>Rascunho</span>}</div>
          <div className="mg-foot"><span>{last ? `${STATUS[last.status]} · #${last.id}${last.done ? ` · ${fmtDur(runDuration(last))}` : ''}` : 'Sem execuções'}</span><span className="mg-open">Abrir fluxo <Icon name="arrowRight" size={12} /></span></div></div>
      </Link>;
    })}</div> : <div className="mg-empty"><Icon name="search" size={20} /><b>Nenhum fluxo encontrado</b><span>Tente outro termo ou escolha outra categoria.</span></div>}
    <footer className="mg-foot-note"><Icon name="info" size={12} /> Execuções simuladas no navegador. Nenhum dado é enviado a sistemas externos.</footer>
    <NewWorkflowDialog open={creating} onClose={() => setCreating(false)} onCreated={(id) => { void navigate({ to: '/workflows/$workflowId', params: { workflowId: id } }); }} />
  </main>;
}
