import { Component, lazy, memo, Suspense, useCallback, useMemo, type ReactNode } from 'react';
import { Icon, Skeleton } from '@biweb/ui';
import { applyRules } from '../data/query';
import { getTable } from '../data/registry';
import type { NetStatus } from '../net/generate';
import type { Comp, Scene3DProps } from '../editor/doc';
import { useEditor } from '../editor/store';
import { ChartView } from './Chart';
import { useDashTheme, useFilters, useRules } from './common';
import { WidgetToolbar } from './WidgetToolbar';
import { MapView } from './map/MapView';
import { CardView, FilterView, ImageView, KpiView, MatrixView, SlicerView, StatusView, TableView, TextView, TimelineView } from './Widgets';
import './viz.css';

const Scene3D = lazy(() => import('./scene3d/Scene3D'));

function Scene3DBox({ comp, interactive }: { comp: Comp; interactive: boolean }) {
  const rules = useRules();
  const dash = useDashTheme();
  const status = useMemo(() => {
    const m = new Map<string, NetStatus>();
    for (const t of ['nos', 'enlaces']) for (const r of applyRules(getTable(comp.data?.dataset ?? 'ds_rede_sp', t).rows, rules.filter((x) => x.table === t))) m.set(String(r.id), r.status as NetStatus);
    return m;
  }, [rules, comp.data]);
  const statusOf = useCallback((id: string) => status.get(id) ?? 'normal', [status]);
  const picked = useEditor((s) => (s.picked?.comp === comp.id ? s.picked.id : null));
  const mode = useEditor((s) => s.mode);
  return (
    <Suspense fallback={<div className="vz-3d-loading"><Skeleton height="100%" /><span>Carregando o gêmeo digital…</span></div>}>
      <Scene3D props={comp.props as unknown as Scene3DProps} dashTheme={dash} interactive={interactive} statusOf={statusOf} picked={picked}
        onPick={(id) => useEditor.getState().set({ picked: id ? { comp: comp.id, kind: id.startsWith('ENL') ? 'link' : 'node', id } : null })}
        onPropsChange={mode === 'edit' ? (patch) => useEditor.getState().update(comp.id, (c) => { Object.assign(c.props, patch); }, patch.perspective ? 'Trocar perspectiva 3D' : 'Alterar camadas 3D') : undefined} />
    </Suspense>
  );
}

/** Corpo do componente por tipo. `interactive`: mapa/3D recebem ponteiro (visualização ou componente "aberto" no editor). */
export const CompBody = memo(function CompBody({ comp, interactive, editing }: { comp: Comp; interactive: boolean; editing: boolean }) {
  switch (comp.type) {
    case 'kpi': return <KpiView comp={comp} />;
    case 'chart': return <ChartView comp={comp} />;
    case 'table': return <TableView comp={comp} />;
    case 'matrix': return <MatrixView comp={comp} />;
    case 'status': return <StatusView comp={comp} />;
    case 'timeline': return <TimelineView comp={comp} />;
    case 'filter': return <FilterView comp={comp} />;
    case 'slicer': return <SlicerView comp={comp} />;
    case 'text': return <TextView comp={comp} editing={editing} />;
    case 'image': return <ImageView comp={comp} />;
    case 'card': return <CardView comp={comp} />;
    case 'map': return <MapView comp={comp} interactive={interactive} />;
    case 'scene3d': return <Scene3DBox comp={comp} interactive={interactive} />;
    case 'container': return null;
  }
});

/** Erro isolado por componente: um visual quebrado não derruba a página. */
class CompBoundary extends Component<{ children: ReactNode; name: string }, { error: string | null }> {
  override state = { error: null as string | null };
  static getDerivedStateFromError(e: Error) { return { error: e.message }; }
  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="vz-empty vz-error" role="alert">
        <b>Não foi possível desenhar {this.props.name}</b>
        <span>{this.state.error}</span>
        <button type="button" className="vz-card-link" onClick={() => this.setState({ error: null })}>Tentar de novo</button>
      </div>
    );
  }
}

/** Moldura visual (título, fundo, borda) — a mesma no editor, na visualização e no Focus Mode. */
export const CompFrame = memo(function CompFrame({ comp: base, interactive, editing, mode, onFocus }: { comp: Comp; interactive: boolean; editing: boolean; mode: 'edit' | 'preview' | 'focus'; onFocus?: () => void }) {
  const view = useEditor((s) => s.view[base.id]);
  const comp = useMemo(() => (view?.props ? { ...base, props: { ...base.props, ...view.props } } : base), [base, view?.props]);
  const s = comp.style;
  const tableView = !!view?.asTable;
  const selected = useEditor((st) => st.cross?.source === comp.id);
  const effective = useFilters(comp);
  const received = effective.length - comp.localFilters.length - (view?.filters?.length ?? 0);
  const hasToolbar = !['text', 'image', 'filter', 'slicer', 'container'].includes(comp.type);
  return (
    <div className={`cf cf--${comp.type} cf-bg--${s.background}${s.border ? ' cf--border' : ''} cf-fs--${s.fontSize}${selected ? ' is-selected' : ''}`} style={{ padding: comp.type === 'map' || comp.type === 'scene3d' ? 0 : s.padding }} data-type={comp.type} data-comp={comp.id}>
      {hasToolbar && mode !== 'focus' && <div className="cf-toolbar"><WidgetToolbar comp={comp} mode={mode} onFocus={onFocus} /></div>}
      {s.showTitle && (s.title || s.subtitle) && (
        <div className="cf-head" style={comp.type === 'map' || comp.type === 'scene3d' ? { padding: `${s.padding}px ${s.padding}px 0` } : undefined}>
          <div className="cf-title"><b>{s.title}{selected && <span className="cf-chipflag is-sel">Selecionado</span>}{received > 0 && comp.data && <span className="cf-chipflag" title={`${received} ${received === 1 ? 'filtro recebido' : 'filtros recebidos'} de outros visuais, da página ou do relatório`}>Filtrado</span>}{comp.props.live === true && <span className="cf-chipflag is-live">● Ao vivo</span>}</b>{s.subtitle && <span>{s.subtitle}</span>}</div>
        </div>
      )}
      {comp.type === 'container' && <span className="cf-container-label">{String(comp.props.label ?? '')}</span>}
      <div className="cf-body">
        {tableView && comp.data && <div className="cf-view-switch"><button type="button" aria-pressed onClick={() => useEditor.getState().setView(comp.id, { asTable: false })}><Icon name="chart" size={12}/>Voltar ao visual</button><span>Linhas do modelo semântico após filtros · configuração preservada</span></div>}
        <CompBoundary name={comp.name}>{tableView && comp.data ? <TableView comp={{ ...comp, type: 'table', props: { columns: getTable(comp.data.dataset, comp.data.table).fields.filter((f) => !f.hidden).slice(0, 8).map((f) => f.name), rowLimit: 250, density: 'compact', search: true, exportable: true, sortBy: undefined, sortDir: 'desc' } }} /> : <CompBody comp={comp} interactive={interactive} editing={editing} />}</CompBoundary>
      </div>
    </div>
  );
});
