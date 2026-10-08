import { useState } from 'react';
import { Badge, Button, Icon, SegmentedControl } from '@biweb/ui';
import { useUi } from '../state/ui-store';
import './complex-workspaces.css';

type Mode = 'grafo' | 'grade' | 'gantt';
const steps = [
  { id: '1', title: 'Fonte netops-db', type: 'Source', state: 'Concluído', detail: 'PostgreSQL · 346 enlaces', group: 'Ingestão' },
  { id: '2', title: 'Importar inventário', type: 'Import', state: 'Concluído', detail: '1.248 linhas · 08:02', group: 'Ingestão' },
  { id: '3', title: 'Transformar eventos', type: 'Transform', state: 'Concluído', detail: 'Mapeamento de severidade', group: 'Preparação' },
  { id: '4', title: 'Validar chaves', type: 'Validate', state: 'Falha', detail: '3 IDs de enlace duplicados', group: 'Preparação' },
  { id: '5', title: 'Juntar alarmes NOC', type: 'Join', state: 'Aguardando', detail: 'Depende de Validar chaves', group: 'Preparação' },
  { id: '6', title: 'Modelo semântico', type: 'Semantic model', state: 'Aguardando', detail: 'Enlaces · Eventos · Sites', group: 'Publicação' },
  { id: '7', title: 'Atualizar dashboard', type: 'Dashboard', state: 'Aguardando', detail: 'Network Intelligence', group: 'Publicação' },
];

export function WorkflowsPage() {
  const aiEnabled = useUi((s) => s.aiEnabled);
  const [mode, setMode] = useState<Mode>('grafo');
  const [proposed, setProposed] = useState(false);
  const [approved, setApproved] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [retry, setRetry] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [schedule, setSchedule] = useState('Diário · 05:30 BRT');
  const [prompt, setPrompt] = useState('Atualize a topologia diariamente e interrompa a publicação se houver enlaces sem chave.');
  return <div className="workflow-page">
    <header className="pg-head"><div><h1 className="pg-title">Intelligent Workflow</h1><p className="pg-sub">Fluxos de dados e publicação · agenda {schedule.toLowerCase()} · demonstração</p></div><span className="flex-1"/><Badge tone="warning" icon="warning">Execução demonstrativa</Badge><Button icon="clock" onPress={() => setScheduleOpen((v) => !v)}>Agendar</Button><Button variant="primary" icon="play" isDisabled={!approved || executing} onPress={() => setExecuting(true)}>Executar</Button></header>
    {scheduleOpen && <section className="workflow-schedule"><b>Agenda do fluxo</b><select aria-label="Frequência do fluxo" value={schedule} onChange={(e) => setSchedule(e.target.value)}><option>Diário · 05:30 BRT</option><option>A cada 6 horas</option><option>Sem agenda · execução manual</option></select><Button size="sm" onPress={() => setScheduleOpen(false)}>Salvar agenda</Button></section>}
    <div className="workflow-toolbar"><div><b>Qualidade da rede · diária</b><span>6 de 7 etapas concluídas · última execução 07/10/2026 08:02</span></div><span className="flex-1"/><SegmentedControl label="Visualização do fluxo" value={mode} onChange={setMode} options={[{ id: 'grafo', label: 'Grafo' }, { id: 'grade', label: 'Grade' }, { id: 'gantt', label: 'Gantt' }]} /></div>
    {proposed && <section className="workflow-proposal"><div><Badge tone={retry ? 'warning' : 'success'} icon={retry ? 'warning' : 'check'}>{retry ? 'Validação pendente' : 'Proposta válida'}</Badge><h2>Proposta de alteração</h2><p>Adicionar uma validação de chaves antes de publicar e conservar a etapa atual de importação.</p><small>3 nós serão alterados · nenhum dado externo será executado nesta confirmação.</small></div><div className="workflow-proposal-actions"><Button onPress={() => { setProposed(false); setApproved(false); }}>Descartar</Button><Button variant="primary" onPress={() => setApproved(true)}>Aprovar proposta</Button></div>{approved && <span className="workflow-approved" role="status">Aprovada. A execução segue como ação separada.</span>}</section>}
    <div className="workflow-main">
      <section className={`workflow-canvas workflow-canvas--${mode}`} aria-label={`Workflow em vista ${mode}`}>
        {mode === 'grafo' ? <div className="workflow-graph">{['Ingestão', 'Preparação', 'Publicação'].map((group, g) => <div className="workflow-group" key={group}><h2>{group}<small>{g === 1 ? ' · 1 falha' : ' · ' + (g === 0 ? 2 : 2) + ' etapas'}</small></h2><div className="workflow-group-nodes">{steps.filter((x) => x.group === group).map((s) => <article key={s.id} className={`workflow-node state-${s.state.toLowerCase().replace(' ', '-')}`}><div><span className="workflow-node-type">{s.type}</span><Badge tone={s.state === 'Concluído' ? 'success' : s.state === 'Falha' ? 'danger' : 'warning'} icon={s.state === 'Falha' ? 'warning' : s.state === 'Concluído' ? 'check' : 'clock'}>{s.state}</Badge></div><b>{s.title}</b><small>{s.detail}</small>{s.state === 'Falha' && <div className="workflow-node-actions"><Button size="sm" onPress={() => setRetry(true)}>Tentar novamente</Button><Button size="sm" variant="ghost" onPress={() => document.getElementById('workflow-logs')?.scrollIntoView({ behavior: 'smooth' })}>Ver logs</Button></div>}</article>)}</div></div>)}</div> : mode === 'grade' ? <table className="bw-table workflow-grid"><thead><tr><th>Etapa</th><th>Grupo</th><th>Tipo</th><th>Estado</th><th>Detalhe</th><th>Duração</th><th>Tentativa</th></tr></thead><tbody>{steps.map((s) => <tr key={s.id}><td>{s.title}</td><td>{s.group}</td><td>{s.type}</td><td>{s.state}</td><td>{s.detail}</td><td>{s.state === 'Concluído' ? '00:12' : '—'}</td><td>{s.state === 'Falha' ? retry ? '2' : '1' : '1'}</td></tr>)}</tbody></table> : <div className="workflow-gantt">{steps.map((s, i) => <div className="workflow-gantt-row" key={s.id}><span>{s.title}</span><div><i className={s.state === 'Falha' ? 'is-failed' : s.state === 'Concluído' ? 'is-done' : ''} style={{ left: `${i * 11}%`, width: s.state === 'Concluído' ? '12%' : '10%' }} /></div><small>{s.state}</small></div>)}</div>}
        <div className="workflow-minimap" aria-label="Minimapa do fluxo"><i /><i /><i /><i className="is-failed" /><i /><i /><i /></div>
      </section>
      <aside className="workflow-side"><section><h2>Estado da execução</h2><p><Badge tone="danger" icon="warning">Falha na validação</Badge></p><p>3 chaves de enlace duplicadas impediram a junção com os alarmes NOC.</p><Button size="sm" onPress={() => setRetry(true)}>Tentar novamente</Button></section><section id="workflow-logs"><h2>Logs recentes</h2><ol className="workflow-logs"><li><time>08:02:14</time> Leitura de inventário concluída · 1.248 linhas</li><li><time>08:02:21</time> IDs duplicados em ENL-042, ENL-091 e ENL-108</li><li><time>08:02:21</time> Publicação interrompida antes do modelo semântico</li>{retry && <li><time>Agora</time> Nova tentativa solicitada; estado simulado</li>}</ol></section>{aiEnabled && <section><h2>Criar com linguagem natural</h2><label htmlFor="workflow-prompt">Descreva o fluxo</label><textarea id="workflow-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} /><Button icon="chat" onPress={() => { setProposed(true); setApproved(false); }}>Gerar proposta</Button><small>Copilot sugere e valida a estrutura. Aprovar não executa.</small></section>}</aside>
    </div>
    <footer className="workflow-foot"><Icon name="info" size={12}/>{executing ? 'Execução simulada iniciada; os resultados não são enviados a sistemas externos.' : 'Sem alteração silenciosa: proposta → prévia → aprovação → execução.'}</footer>
  </div>;
}
