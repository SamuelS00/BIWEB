import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Badge, Button, EmptyState, Icon, TextField } from '@biweb/ui';
import { NewMigration } from './NewMigration';
import { PHASES, STATUS_LABEL, phaseIndex, platformOf } from './model';
import type { ProjectStatus } from './model';
import { useMig } from './store';
import { PlatformMark, Progress, StrategyChip, nf } from './ui';
import './migration.css';

type F = 'all' | ProjectStatus;
const FILTERS: { id: F; label: string }[] = [{ id: 'all', label: 'Todos' }, { id: 'analyzing', label: 'Analisando' }, { id: 'review', label: 'Revisão' }, { id: 'reconstructing', label: 'Reconstruindo' }, { id: 'validation', label: 'Validação' }, { id: 'completed', label: 'Concluídos' }];
const TONE: Record<ProjectStatus, 'accent' | 'warning' | 'neutral' | 'success'> = { analyzing: 'accent', review: 'warning', reconstructing: 'accent', validation: 'warning', completed: 'success' };

export function PhaseDots({ phase }: { phase: Parameters<typeof phaseIndex>[0] }) {
  const cur = phaseIndex(phase);
  return <span className="ms-dots" aria-label={`Etapa: ${PHASES[cur]?.label}`} title={PHASES.map((p, i) => `${i <= cur ? '●' : '○'} ${p.label}`).join('  ')}>{PHASES.map((p, i) => <i key={p.id} className={i < cur ? 'is-done' : i === cur ? 'is-now' : ''} />)}</span>;
}

export function MigrationList() {
  const { projects, open } = useMig();
  const navigate = useNavigate();
  const [f, setF] = useState<F>('all'), [q, setQ] = useState(''), [creating, setCreating] = useState(false);
  const shown = useMemo(() => projects.filter((p) => (f === 'all' || p.status === f) && (!q.trim() || `${p.name} ${platformOf(p.platform).name} ${p.owner}`.toLowerCase().includes(q.trim().toLowerCase()))), [projects, f, q]);
  const go = (id: string) => { open(id); void navigate({ to: '/migration/$projectId', params: { projectId: id } }); };

  if (creating) return <NewMigration onCancel={() => setCreating(false)} onCreated={(id) => { void navigate({ to: '/migration/$projectId', params: { projectId: id } }); }} />;
  return <main className="pg ms-list">
    <header className="ms-list-head">
      <div>
        <div className="mg-eyebrow"><Icon name="share" size={12} /> Migration Studio</div>
        <h1 className="pg-title">Projetos de migração</h1>
        <p className="pg-sub">Conecte uma plataforma analítica, entenda o que existe e reconstrua a aplicação com os recursos nativos do BIWEB. Não importamos a imagem do relatório: entendemos a estrutura, as métricas e as interações.</p>
      </div>
      <Button variant="primary" icon="plus" onPress={() => setCreating(true)}>Nova migração</Button>
    </header>

    <ol className="ms-flow" aria-label="Como a migração funciona">
      {['Origem', 'Entender', 'Blueprint', 'Reconstruir', 'Validar', 'Publicar'].map((s, i) => <li key={s}><b>{i + 1}</b>{s}{i < 5 && <Icon name="chevronRight" size={12} />}</li>)}
    </ol>

    {projects.length === 0 ? <EmptyState title="Comece sua primeira migração" description="Conecte o Power BI, Tableau, Qlik, Looker, ThoughtSpot ou Domo. O BIWEB inventaria, interpreta e propõe a reconstrução." actions={[{ label: 'Conectar plataforma analítica', icon: 'plus', onAction: () => setCreating(true) }]} /> : <>
      <div className="ms-toolbar">
        <div className="mg-chips" role="tablist" aria-label="Filtrar por status">{FILTERS.map((x) => <button key={x.id} role="tab" aria-selected={f === x.id} onClick={() => setF(x.id)}>{x.label}<span>{x.id === 'all' ? projects.length : projects.filter((p) => p.status === x.id).length}</span></button>)}</div>
        <div className="mg-search"><TextField label="Buscar projetos" hideLabel icon="search" placeholder="Buscar por projeto, origem ou responsável" value={q} onChange={setQ} /></div>
      </div>
      {shown.length ? <div className="ms-table-wrap"><table className="ms-table">
        <thead><tr><th>Projeto</th><th>Origem → Destino</th><th>Objetos</th><th>Status</th><th>Progresso</th><th>Estratégia</th><th>Responsável</th><th>Última atividade</th></tr></thead>
        <tbody>{shown.map((p) => {
          const pl = platformOf(p.platform);
          return <tr key={p.id} tabIndex={0} onClick={() => go(p.id)} onKeyDown={(e) => { if (e.key === 'Enter') go(p.id); }} aria-label={`${p.name}. ${pl.name} para BIWEB. ${p.statusNote}`}>
            <td><div className="ms-cell-name"><PlatformMark id={p.platform} /><div><b>{p.name}</b><small>{p.workspace}</small></div></div></td>
            <td><span className="ms-route">{pl.name}<Icon name="arrowRight" size={12} />BIWEB</span></td>
            <td><div className="ms-objs"><b>{nf(p.objects)}</b> {p.objectsLabel}<small>{nf(p.scope.visuals)} visuais · {nf(p.scope.measures)} medidas</small></div></td>
            <td><div className="ms-status"><Badge tone={TONE[p.status]}>{p.statusNote || STATUS_LABEL[p.status]}</Badge><PhaseDots phase={p.phase} /></div></td>
            <td><div className="ms-progress"><Progress value={p.progress} tone={p.status === 'completed' ? 'success' : undefined} /><b>{p.progress}%</b>{p.status === 'validation' && <small>reconstruído</small>}</div></td>
            <td><StrategyChip s={p.strategy} /></td>
            <td>{p.owner}</td>
            <td className="ms-act">{p.activity}{p.bridge && <small><i className="ms-live-dot" />Bridge ativo</small>}</td>
          </tr>;
        })}</tbody>
      </table></div> : <div className="mg-empty"><Icon name="search" size={20} /><b>Nenhum projeto nesse filtro</b><span>Ajuste o status ou comece uma nova migração.</span><Button size="sm" onPress={() => { setF('all'); setQ(''); }}>Limpar filtros</Button></div>}
    </>}
    <footer className="mg-foot-note"><Icon name="info" size={12} /> Protótipo: conexões e análises são simuladas no navegador. Nenhum dado sai do seu ambiente.</footer>
  </main>;
}
