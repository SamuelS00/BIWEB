import { createRootRoute, createRoute, createRouter, lazyRouteComponent } from '@tanstack/react-router';
import { AppShell } from './shell/AppShell';
import { HomePage } from './routes/home';
import { ConnectionsPage } from './routes/connections';
import { ViewerPage } from './routes/viewer';
import { ModelPage } from './routes/model';

const root = createRootRoute({ component: AppShell });
const home = createRoute({ getParentRoute: () => root, path: '/', component: HomePage });
const connections = createRoute({ getParentRoute: () => root, path: '/connections', component: ConnectionsPage });
const viewer = createRoute({ getParentRoute: () => root, path: '/dashboards/$dashboardId', component: ViewerPage });
// Builder carregado só ao editar (bundle "app": shell inicial pequeno, docs/architecture/04 §7.2).
const builder = createRoute({ getParentRoute: () => root, path: '/dashboards/$dashboardId/edit', component: lazyRouteComponent(() => import('./routes/builder'), 'BuilderPage') });
const model = createRoute({ getParentRoute: () => root, path: '/models/$modelId', component: ModelPage });

export const router = createRouter({ routeTree: root.addChildren([home, connections, viewer, builder, model]) });
declare module '@tanstack/react-router' { interface Register { router: typeof router } }
