import { createHashHistory, createRootRoute, createRoute, createRouter, lazyRouteComponent, Outlet, redirect, useRouterState } from '@tanstack/react-router';
import { AppShell } from './shell/AppShell';
import { HomePage } from './routes/home';
import { ReportsPage } from './routes/reports';
import { ReportRoute } from './routes/report-route';
import { ModelPage } from './routes/model';
import { CopilotPage } from './routes/copilot';
import { MapRoute } from './routes/map-route';
import { MapsGallery } from './routes/maps-gallery';
import { useAuth } from './state/auth';
import { useLibrary } from './editor/library';
import { blankReport } from './editor/templates';

// A tela de login fica fora do shell (sem rail, topbar nem Copilot).
function Root() { return useRouterState({ select: (st) => st.location.pathname === '/login' }) ? <Outlet /> : <AppShell />; }
// Sem sessão, toda rota leva ao login (a tela inicial do app); depois de entrar, /login volta ao Início.
const root = createRootRoute({ component: Root,
  beforeLoad: ({ location }) => {
    const signedIn = useAuth.getState().signedIn;
    if (!signedIn && location.pathname !== '/login') throw redirect({ to: '/login', replace: true });
    if (signedIn && location.pathname === '/login') throw redirect({ to: '/', replace: true });
  } });
const login = createRoute({ getParentRoute: () => root, path: '/login', component: lazyRouteComponent(() => import('./routes/login'), 'LoginPage') });
const home = createRoute({ getParentRoute: () => root, path: '/', component: HomePage });
const reportsRoute = createRoute({ getParentRoute: () => root, path: '/reports', component: ReportsPage });
const report = createRoute({ getParentRoute: () => root, path: '/reports/$reportId', component: ReportRoute });
// Editor carregado só ao editar (bundle "app": shell inicial pequeno, docs/architecture/04 §7.2).
const builder = createRoute({ getParentRoute: () => root, path: '/reports/$reportId/edit',
  // "novo" cria um relatório em branco e troca a URL pelo id real
  beforeLoad: ({ params }) => { if (params.reportId === 'novo') { const b = blankReport(); useLibrary.getState().save(b); throw redirect({ to: '/reports/$reportId/edit', params: { reportId: b.id }, replace: true }); } },
  component: lazyRouteComponent(() => import('./editor/EditorPage'), 'EditorPage') });
// Data Workspace (LDE): visão geral, fontes, catálogo, modelo, qualidade, linhagem, mudanças e execuções. /connections continua levando à visão geral.
const dataWs = () => lazyRouteComponent(() => import('./dataworkspace'), 'DataWorkspace');
const connections = createRoute({ getParentRoute: () => root, path: '/connections', component: dataWs() });
const dataHome = createRoute({ getParentRoute: () => root, path: '/data', component: dataWs() });
const dataSection = createRoute({ getParentRoute: () => root, path: '/data/$section', component: dataWs() });
const dataItem = createRoute({ getParentRoute: () => root, path: '/data/$section/$itemId', component: dataWs() });
const model = createRoute({ getParentRoute: () => root, path: '/models/$modelId', component: ModelPage });
const copilot = createRoute({ getParentRoute: () => root, path: '/copilot', component: CopilotPage });
const mapsGallery = createRoute({ getParentRoute: () => root, path: '/maps', component: MapsGallery });
const mapRoute = createRoute({ getParentRoute: () => root, path: '/maps/$mapId', component: MapRoute });
// Endereços anteriores dos mapas continuam funcionando.
const legacyMap = (path: string, mapId: string) => createRoute({ getParentRoute: () => root, path, beforeLoad: () => { throw redirect({ to: '/maps/$mapId', params: { mapId }, replace: true }); } });
const mapWorkspace = legacyMap('/maps/network-intelligence', 'network');
const incidentWorkspace = legacyMap('/maps/incident-intelligence', 'incidents');
const streetWorkspace = legacyMap('/maps/street-intelligence', 'lights');
// Workflow Builder carregado só ao abrir Fluxos (canvas, simulação e Copilot ficam fora do shell inicial).
const workflows = createRoute({ getParentRoute: () => root, path: '/workflows', component: lazyRouteComponent(() => import('./routes/workflows'), 'WorkflowsGallery') });
const workflowDetail = createRoute({ getParentRoute: () => root, path: '/workflows/$workflowId', component: lazyRouteComponent(() => import('./routes/workflows'), 'WorkflowsPage') });
// Migration Studio: lista de projetos e workspace de migração (carregados sob demanda).
const migration = createRoute({ getParentRoute: () => root, path: '/migration', component: lazyRouteComponent(() => import('./routes/migration'), 'MigrationList') });
const migrationProject = createRoute({ getParentRoute: () => root, path: '/migration/$projectId', component: lazyRouteComponent(() => import('./routes/migration'), 'MigrationWorkspace') });
// Rotas antigas de dashboards continuam funcionando.
const legacy = createRoute({ getParentRoute: () => root, path: '/dashboards/$id', beforeLoad: () => { throw redirect({ to: '/reports/$reportId', params: { reportId: 'net_executiva' } }); } });

// VITE_HASH_HISTORY=1 gera um build estático (rotas com #) para hospedar sem servidor, ex.: prévias.
const history = import.meta.env.VITE_HASH_HISTORY ? createHashHistory() : undefined;
export const router = createRouter({ routeTree: root.addChildren([login, home, reportsRoute, report, builder, connections, dataHome, dataSection, dataItem, model, copilot, mapsGallery, mapRoute, mapWorkspace, incidentWorkspace, streetWorkspace, workflows, workflowDetail, migration, migrationProject, legacy]), ...(history ? { history } : {}), defaultPreload: 'intent' });
declare module '@tanstack/react-router' { interface Register { router: typeof router } }
