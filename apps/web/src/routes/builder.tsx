import { useState } from 'react';
import {
  Badge, Banner, Counter, EmptyState, FieldChip, FieldTypeIcon, FieldWell, IconButton, NumberField, PageTabs, Panel, PaneSwitcher,
  PropertyRow, PropertySection, SegmentedControl, Select, StatusBar, Switch, Tabs, TextField, TreeView, type TreeNode,
} from '@biweb/ui';
import { model, pages } from '../fixtures/lume-varejo';
import { useUi } from '../state/ui-store';
import { useIntl } from 'react-intl';

const tree: TreeNode[] = [
  { id: 'g-met', textValue: 'Métricas', label: <span className="bw-row" style={{ gap: 6 }}>Métricas <Counter value={model.metrics.length} /></span>,
    children: model.metrics.map((m) => ({ id: m.id, textValue: [m.name, ...m.synonyms].join(' '), icon: <FieldTypeIcon kind="metric" />, label: m.name,
      trailing: m.certified ? <Badge tone="success" icon="check">Certificada</Badge> : <Badge tone="warning">Rascunho</Badge> })) },
  ...model.entities.map((e) => ({ id: e.id, textValue: e.name, label: e.name, trailing: <span className="bw-cap bw-muted">{e.fields.length}</span>,
    children: e.fields.map(([n, k]) => ({ id: `${e.id}.${n}`, textValue: n, label: n, icon: <FieldTypeIcon kind={k} /> })) })),
];

/** S03–S05 · Builder: estrutura das zonas com componentes do design system. Canvas real: E2.4 + E2.6. */
export function BuilderPage() {
  const intl = useIntl();
  const { panes, togglePane, dashTheme, aiEnabled } = useUi();
  const [page, setPage] = useState('geral');
  const [layout, setLayout] = useState<'grid' | 'stack' | 'free' | 'tabs'>('grid');
  const [bp, setBp] = useState<'xl' | 'lg' | 'md' | 'sm'>('lg');
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr) auto auto', height: '100%', minHeight: 0 }}>
      {panes.includes('dados') ? (
        <Panel title="Dados" subtitle={model.name} actions={<Badge tone="warning">Rascunho {model.draft}</Badge>} width={264}>
          <div className="bw-search"><TextField label="Buscar campo ou sinônimo" hideLabel quiet icon="search" placeholder="Buscar campo ou sinônimo" /></div>
          <TreeView label="Campos do modelo Vendas Varejo" items={tree} defaultExpanded={['g-met', 'ent_loja']} />
        </Panel>
      ) : <span />}
      <section style={{ display: 'grid', gridTemplateRows: '40px minmax(0,1fr) var(--page-tabs-height) var(--status-bar-height)', minWidth: 0, minHeight: 0 }} aria-label="Canvas">
        <div className="flex items-center gap-2 px-3 bg-surface-app" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <SegmentedControl label="Breakpoint" value={bp} onChange={setBp} options={[{ id: 'xl', label: 'xl ≥1600' }, { id: 'lg', label: 'lg ≥1200' }, { id: 'md', label: 'md ≥992' }, { id: 'sm', label: 'sm ≥768' }]} />
          <span className="flex-1" />
          <span className="bw-cap bw-secondary">Container da página</span>
          <SegmentedControl label="Estratégia de layout" value={layout} onChange={setLayout} options={[{ id: 'grid', label: 'Grade' }, { id: 'stack', label: 'Pilha' }, { id: 'free', label: 'Livre' }, { id: 'tabs', label: 'Abas' }]} />
        </div>
        <div className="bw-canvas" style={{ overflow: 'auto', padding: 24 }}>
          <Banner tone="info">{intl.formatMessage({ id: 'builder.pending' })}</Banner>
          {/* A página do dashboard (tokens runtime) fica atrás; o estado vazio é chrome do editor (tokens app). */}
          <div className={`dash-theme-${dashTheme}`} style={{ marginTop: 16, minHeight: 360, background: 'var(--dash-background)', borderRadius: 4, boxShadow: '0 0 0 1px var(--border-default)', padding: 24 }}>
            <div style={{ color: 'var(--text-primary)', background: 'var(--surface-panel)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: 16, width: 'fit-content' }}>
              <EmptyState title={intl.formatMessage({ id: 'builder.empty.title' })} description={intl.formatMessage({ id: 'builder.empty.description' })}
                actions={[{ label: 'Inserir visualização', icon: 'plus', shortcut: 'I', onAction: () => {} }, { label: 'Conectar dados', icon: 'data', onAction: () => {} },
                  ...(aiEnabled ? [{ label: 'Criar a partir de um objetivo', icon: 'chat' as const, shortcut: '⌘K', onAction: () => {} }] : [])]} />
            </div>
          </div>
        </div>
        <PageTabs pages={pages} current={page} onSelect={setPage} onAdd={() => {}} />
        <StatusBar><span>Nada selecionado</span><span>Grade 12 col · {bp}</span><span className="bw-spacer" /><span>100%</span><IconButton icon="fit" label="Ajustar à tela" shortcut="⇧1" size="sm" /></StatusBar>
      </section>
      <div className="flex" style={{ minHeight: 0 }}>
        {panes.includes('inspector') && (
          <Panel title="Gráfico de barras" subtitle="Receita por mês" width={264} label="Inspector">
            <Tabs label="Inspector" tabs={[
              { id: 'dados', label: 'Dados', panel: (
                <>
                  <FieldWell label="Eixo X" hint="Arraste uma dimensão"><FieldChip kind="date" name="Data (mês)" onRemove={() => {}} /></FieldWell>
                  <FieldWell label="Valores" hint="Arraste uma métrica"><FieldChip kind="metric" name="Receita" onRemove={() => {}} /></FieldWell>
                  <FieldWell label="Legenda" optional hint="Arraste uma dimensão (Canal, Categoria)" />
                </>
              ) },
              { id: 'formato', label: 'Formato', panel: (
                <>
                  <PropertySection label="Tamanho e posição">
                    <PropertyRow label="Coluna"><div className="bw-prop-pair"><NumberField label="X" hideLabel quiet prefix="X" defaultValue={0} /><NumberField label="Y" hideLabel quiet prefix="Y" defaultValue={2} /></div></PropertyRow>
                    <PropertyRow label="Tamanho"><div className="bw-prop-pair"><NumberField label="Largura" hideLabel quiet prefix="L" unit="col" defaultValue={8} minValue={2} maxValue={12} /><NumberField label="Altura" hideLabel quiet prefix="A" unit="lin" defaultValue={6} minValue={2} /></div></PropertyRow>
                  </PropertySection>
                  <PropertySection label="Título"><PropertyRow label="Métrica"><TextField label="Título" hideLabel quiet defaultValue="Receita" /></PropertyRow></PropertySection>
                  <PropertySection label="Cores">
                    <PropertyRow label="Série"><Select label="Cor da série" hideLabel value="viz-cat-1" options={[1, 2, 3, 4].map((i) => ({ id: `viz-cat-${i}`, label: `Série ${i}`, swatch: `viz-cat-${i}` }))} /></PropertyRow>
                  </PropertySection>
                  <PropertySection label="Rótulos de dados" defaultOpen={false} summary="Desligado" trailing={<Switch aria-label="Rótulos de dados">{null}</Switch>} />
                </>
              ) },
            ]} />
          </Panel>
        )}
      </div>
      <PaneSwitcher open={panes} onToggle={togglePane} panes={[
        { id: 'dados', label: 'Dados', icon: 'data' }, { id: 'estrutura', label: 'Estrutura', icon: 'layers' }, { id: 'inspector', label: 'Inspector', icon: 'brush' },
        ...(aiEnabled ? [{ id: 'assistente', label: 'Assistente', icon: 'chat' as const }] : []),
      ]} />
    </div>
  );
}
