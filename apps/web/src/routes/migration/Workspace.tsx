import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from '@tanstack/react-router';
import { Badge, Button, Icon, IconButton, Skeleton } from '@biweb/ui';
import { Inspector } from './Inspector';
import { Processing } from './Processing';
import { STATUS_LABEL, platformOf } from './model';
import type { Phase, TabId } from './model';
import { TABS, useMig } from './store';
import { PlatformMark } from './ui';
import { pendingReview } from './derive';
import { Overview } from './tabs/Overview';
import '../workflows/workflows.css';
import './migration.css';

const Inventory = lazy(() => import('./tabs/Inventory').then((m) => ({ default: m.Inventory })));
const Blueprint = lazy(() => import('./tabs/Blueprint').then((m) => ({ default: m.Blueprint })));
const DataModel = lazy(() => import('./tabs/DataModel').then((m) => ({ default: m.DataModel })));
const Semantics = lazy(() => import('./tabs/Semantics').then((m) => ({ default: m.Semantics })));
const Compat = lazy(() => import('./tabs/Compat').then((m) => ({ default: m.Compat })));
const Mappings = lazy(() => import('./tabs/Mappings').then((m) => ({ default: m.Mappings })));
const Reconstruct = lazy(() => import('./tabs/Reconstruct').then((m) => ({ default: m.Reconstruct })));
const Validation = lazy(() => import('./tabs/Validation').then((m) => ({ default: m.Validation })));
const Publish = lazy(() => import('./tabs/Publish').then((m) => ({ default: m.Publish })));
const Bridge = lazy(() => import('./tabs/Bridge').then((m) => ({ default: m.Bridge })));

const NEXT_TAB: Record<Phase, TabId> = { source: 'inventory', understand: 'blueprint', blueprint: 'compat', reconstruct: 'validation', validate: 'publish', publish: 'bridge' };
/** Abas que dependem do inventário completo (Power BI do demo); os demais projetos ganham as telas de resumo. */
const SUMMARY_TABS: TabId[] = ['overview', 'inventory', 'compat'];

export function MigrationWorkspace() {
  const { projectId } = useParams({ strict: false }) as { projectId?: string };
  const navigate = useNavigate();
  const st = useMig();
  const { projects, tab, rightOpen, analyzing, pid, flashMsg } = st;
  const project = projects.find((p) => p.id === projectId);
  const ps = st.ps[projectId ?? ''];
  const [w, setW] = useState(340), drag = useRef(false);
  useEffect(() => { if (projectId && projectId !== pid && project) st.open(projectId); }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const move = (e: MouseEvent) => { if (drag.current) setW(Math.min(560, Math.max(280, innerWidth - e.clientX))); }, up = () => { drag.current = false; document.body.style.userSelect = ''; };
    addEventListener('mousemove', move); addEventListener('mouseup', up); return () => { removeEventListener('mousemove', move); removeEventListener('mouseup', up); };
  }, []);
  /* o botão “Copilot” do cabeçalho do app abre o Copilot daqui, não o dock global */
  useEffect(() => {
    const open = () => useMig.getState().set({ rightOpen: true, rightTab: 'copilot' });
    addEventListener('biweb:migration-copilot', open); return () => removeEventListener('biweb:migration-copilot', open);
  }, []);
  if (!projectId || !project) return <Navigate to="/migration" replace />;
  if (!ps) return null;

  const pl = platformOf(project.platform), full = project.detail === 'full', busy = !!analyzing[project.id], pend = pendingReview(ps).length;
  const go = (t: TabId, sel?: string) => { st.set({ tab: t, ...(sel ? { sel } : {}) }); };
  const locked = (t: TabId) => !full && !SUMMARY_TABS.includes(t);
  const nextTab = NEXT_TAB[project.phase];
  const advance = () => { go(nextTab); };

  return <div className={`ms-ws${rightOpen ? '' : ' no-right'}`} style={{ ['--ms-r' as string]: `${w}px` }}>
    <header className="ms-ws-head">
      <IconButton icon="arrowLeft" label="Voltar aos projetos" size="sm" onPress={() => { void navigate({ to: '/migration' }); }} />
      <PlatformMark id={project.platform} size={32} />
      <div className="ms-ws-title">
        <div className="ms-ws-row"><h1>{project.name}</h1><Badge tone={project.status === 'completed' ? 'success' : busy ? 'accent' : 'warning'}>{busy ? 'Analisando' : project.statusNote || STATUS_LABEL[project.status]}</Badge></div>
        <p><span className="ms-route">{pl.name}<Icon name="arrowRight" size={12} />BIWEB</span> · {project.workspace} · última análise {ps.analyzed} · v{ps.analysisV}{ps.published ? ` · publicado v${ps.version}` : ''}</p>
      </div>
      <span className="flex-1" />
      {pend > 0 && full && <Button size="sm" variant="ghost" icon="warning" onPress={() => go('validation')}>{pend} para revisar</Button>}
      <Button icon="refresh" isDisabled={busy} onPress={() => st.startAnalysis(project.id)}>Re-analyze</Button>
      <Button icon="copilot" onPress={() => st.set({ rightOpen: true, rightTab: 'copilot' })}>Ask Copilot</Button>
      <Button variant="primary" icon="arrowRight" isDisabled={busy} onPress={advance}>Continue Migration</Button>
      <IconButton icon="layers" label={rightOpen ? 'Ocultar painel do item' : 'Mostrar painel do item'} size="sm" onPress={() => st.set({ rightOpen: !rightOpen })} />
    </header>

    <nav className="ms-tabs" aria-label="Seções do projeto" role="tablist">
      {TABS.map((t, i) => <span key={t.id} className="ms-tab-wrap">{(i === 0 || TABS[i - 1]!.group !== t.group) && i > 0 && <i className="ms-tab-sep" />}
        <button role="tab" aria-selected={tab === t.id} disabled={busy} className={locked(t.id) ? 'is-locked' : ''} onClick={() => go(t.id)}>{t.label}
          {t.id === 'validation' && pend > 0 && full && <em>{pend}</em>}{t.id === 'bridge' && full && project.bridge && <i className="ms-live-dot" />}</button></span>)}
    </nav>

    <div className="ms-ws-body">
      <section className="ms-ws-main" id="ms-main" aria-live="polite">
        {busy ? <Processing project={project} onDone={() => st.finishAnalysis(project.id)} /> : locked(tab)
          ? <DemoOnly name={project.name} onDemo={() => { st.open('mp_commercial_ops'); void navigate({ to: '/migration/$projectId', params: { projectId: 'mp_commercial_ops' } }); st.set({ tab }); }} tab={TABS.find((t) => t.id === tab)?.label ?? ''} />
          : <Suspense fallback={<div className="ms-fallback"><Skeleton /><Skeleton /></div>}>
            {tab === 'overview' && <Overview onGo={go} />}
            {tab === 'inventory' && <Inventory onGo={go} />}
            {tab === 'blueprint' && <Blueprint />}
            {tab === 'data' && <DataModel onGo={go} />}
            {tab === 'semantics' && <Semantics onGo={go} />}
            {tab === 'compat' && <Compat onGo={go} />}
            {tab === 'mappings' && <Mappings onGo={go} />}
            {tab === 'reconstruct' && <Reconstruct onGo={go} />}
            {tab === 'validation' && <Validation onGo={go} />}
            {tab === 'publish' && <Publish onGo={go} />}
            {tab === 'bridge' && <Bridge onGo={go} />}
          </Suspense>}
      </section>
      {rightOpen && <><div className="ms-resize" role="separator" aria-orientation="vertical" aria-label="Redimensionar painel" tabIndex={0} onMouseDown={() => { drag.current = true; document.body.style.userSelect = 'none'; }} onKeyDown={(e) => { if (e.key === 'ArrowLeft') setW((x) => Math.min(560, x + 24)); if (e.key === 'ArrowRight') setW((x) => Math.max(280, x - 24)); }} /><Inspector onTab={go} /></>}
    </div>
    {flashMsg && <div className="ms-toast" role="status"><Icon name="check" size={12} />{flashMsg}</div>}
  </div>;
}

function DemoOnly({ name, tab, onDemo }: { name: string; tab: string; onDemo: () => void }) {
  return <div className="ms-demo-only"><Icon name="layers" size={20} /><h2>{tab} detalhada neste projeto</h2>
    <p>{name} está em análise resumida: a Visão geral, o Inventário e a Compatibilidade já refletem o que foi descoberto. A navegação completa por blueprint, mapeamentos, reconstrução, validação e Bridge está disponível no projeto de demonstração.</p>
    <Button variant="primary" onPress={onDemo}>Abrir Commercial & Operations Migration</Button></div>;
}
