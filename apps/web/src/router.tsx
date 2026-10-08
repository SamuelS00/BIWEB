import { createHashHistory, createRootRoute, createRoute, createRouter, lazyRouteComponent, redirect } from '@tanstack/react-router';
import { AppShell } from './shell/AppShell';
import { HomePage } from './routes/home';
import { ReportsPage } from './routes/reports';
import { ReportRoute } from './routes/report-route';
import { DataPage } from './datasources/DataPage';
import { ModelPage } from './routes/model';
import { CopilotPage } from './routes/copilot';
import { MapRoute } from './routes/map-route';
import { MapsGallery } from './routes/maps-gallery';
import { WorkflowsPage } from './routes/workflows';
import { useLibrary } from './editor/library';
import { blankReport } from './editor/templates';

const root = createRootRoute({ component: AppShell });
const home = createRoute({ getParentRoute: () => root, path: '/', component: HomePage });
const reportsRoute = createRoute({ getParentRoute: () => root, path: '/reports', component: ReportsPage });
const report = createRoute({ getParentRoute: () => root, path: '/reports/$reportId', component: ReportRoute });
// Editor carregado só ao editar (bundle "app": shell inicial pequeno, docs/architecture/04 §7.2).
const builder = createRoute({ getParentRoute: () => root, path: '/reports/$reportId/edit',
  // "novo" cria um relatório em branco e troca a URL pelo id real
  beforeLoad: ({ params }) => { if (params.reportId === 'novo') { const b = blankReport(); useLibrary.getState().save(b); throw redirect({ to: '/reports/$reportId/edit', params: { reportId: b.id }, replace: true }); } },
  component: lazyRouteComponent(() => import('./editor/EditorPage'), 'EditorPage') });
const connections = createRoute({ getParentRoute: () => root, path: '/connections', component: DataPage });
const model = createRoute({ getParentRoute: () => root, path: '/models/$modelId', component: ModelPage });
const copilot = createRoute({ getParentRoute: () => root, path: '/copilot', component: CopilotPage });
const mapsGallery = createRoute({ getParentRoute: () => root, path: '/maps', component: MapsGallery });
const mapRoute = createRoute({ getParentRoute: () => root, path: '/maps/$mapId', component: MapRoute });
// Endereços anteriores dos mapas continuam funcionando.
const legacyMap = (path: string, mapId: string) => createRoute({ getParentRoute: () => root, path, beforeLoad: () => { throw redirect({ to: '/maps/$mapId', params: { mapId }, replace: true }); } });
const mapWorkspace = legacyMap('/maps/network-intelligence', 'network');
const incidentWorkspace = legacyMap('/maps/incident-intelligence', 'incidents');
const streetWorkspace = legacyMap('/maps/street-intelligence', 'lights');
const workflows = createRoute({ getParentRoute: () => root, path: '/workflows', component: WorkflowsPage });
// Rotas antigas de dashboards continuam funcionando.
const legacy = createRoute({ getParentRoute: () => root, path: '/dashboards/$id', beforeLoad: () => { throw redirect({ to: '/reports/$reportId', params: { reportId: 'net_executiva' } }); } });

// VITE_HASH_HISTORY=1 gera um build estático (rotas com #) para hospedar sem servidor, ex.: prévias.
const history = import.meta.env.VITE_HASH_HISTORY ? createHashHistory() : undefined;
export const router = createRouter({ routeTree: root.addChildren([home, reportsRoute, report, builder, connections, model, copilot, mapsGallery, mapRoute, mapWorkspace, incidentWorkspace, streetWorkspace, workflows, legacy]), ...(history ? { history } : {}), defaultPreload: 'intent' });
declare module '@tanstack/react-router' { interface Register { router: typeof router } }
