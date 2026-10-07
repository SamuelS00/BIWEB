import { useShallow } from 'zustand/react/shallow';
import { Button, Icon, IconButton, NumberField, SegmentedControl, Select, Switch, TextField } from '@biweb/ui';
import { useUi } from '../../state/ui-store';
import type { CardProps, ChartKind, ChartProps, Comp, CompStyle, ImageProps, KpiProps, MapLayers, MapProps, MatrixProps, Scene3DProps, SlicerProps, TableProps, TextProps, FilterProps } from '../doc';
import { COMP_META } from '../doc';
import { useEditor } from '../store';
import { LAYER_LABEL } from '../../viz/map/MapView';
import { NoSelection, Row, Section, useProp } from './shared';

const KINDS: { id: ChartKind; label: string }[] = [{ id: 'bar', label: 'Barras' }, { id: 'hbar', label: 'Barras horizontais' }, { id: 'line', label: 'Linha' }, { id: 'area', label: 'Área' }, { id: 'pie', label: 'Pizza' }, { id: 'scatter', label: 'Dispersão' }];
const IMAGES = [{ id: 'brand/logo-light.webp', label: 'Logo BIWEB (claro)' }, { id: 'brand/logo-dark.webp', label: 'Logo BIWEB (escuro)' }, { id: 'brand/mark.webp', label: 'Marca BIWEB' }, { id: 'brand/logo-stacked.webp', label: 'Logo empilhado' }];

function StyleProps({ c }: { c: Comp }) {
  const st = (k: keyof CompStyle, v: unknown, label: string) => useEditor.getState().update(c.id, (d) => { (d.style as unknown as Record<string, unknown>)[k] = v; if (k === 'title' && v) d.name = String(v); }, label);
  return (
    <>
      <Section title="Título">
        <Row label="Mostrar"><Switch isSelected={c.style.showTitle} onChange={(v) => st('showTitle', v, v ? 'Mostrar título' : 'Ocultar título')} aria-label="Mostrar título">{null}</Switch></Row>
        <Row label="Título"><TextField label="Título" hideLabel quiet value={c.style.title} onChange={(v) => st('title', v, 'Editar título')} /></Row>
        <Row label="Subtítulo"><TextField label="Subtítulo" hideLabel quiet value={c.style.subtitle} onChange={(v) => st('subtitle', v, 'Editar subtítulo')} placeholder="por dimensão · período" /></Row>
        <Row label="Tamanho"><SegmentedControl label="Tamanho do título" value={c.style.fontSize} onChange={(v) => st('fontSize', v, 'Tamanho do título')} options={[{ id: 'sm', label: 'P' }, { id: 'md', label: 'M' }, { id: 'lg', label: 'G' }]} /></Row>
      </Section>
      <Section title="Superfície">
        <Row label="Fundo"><SegmentedControl label="Fundo" value={c.style.background} onChange={(v) => st('background', v, 'Trocar fundo')} options={[{ id: 'surface', label: 'Sólido' }, { id: 'subtle', label: 'Suave' }, { id: 'none', label: 'Nenhum' }]} /></Row>
        <Row label="Borda"><Switch isSelected={c.style.border} onChange={(v) => st('border', v, v ? 'Mostrar borda' : 'Ocultar borda')} aria-label="Borda">{null}</Switch></Row>
        <Row label="Espaçamento"><NumberField label="Espaçamento interno" hideLabel quiet value={c.style.padding} minValue={0} maxValue={32} step={4} unit="px" onChange={(v) => st('padding', v, 'Espaçamento')} /></Row>
        {COMP_META[c.type].data && <Row label="Cor da série">
          <div className="ed-swatches" role="radiogroup" aria-label="Cor da série">{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <button key={i} type="button" role="radio" aria-checked={c.style.accent === i} aria-label={`Cor ${i}`} className="ed-swatch" style={{ background: `var(--viz-cat-${i})` }} onClick={() => st('accent', i, `Cor da série ${i}`)} />)}</div>
        </Row>}
      </Section>
    </>
  );
}

function Geometry({ c }: { c: Comp }) {
  const set = (k: 'x' | 'y' | 'w' | 'h', v: number) => useEditor.getState().update(c.id, (d) => { d[k] = Math.max(k === 'w' ? 48 : k === 'h' ? 32 : 0, Math.round(v)); }, 'Ajustar posição e tamanho');
  return (
    <Section title="Posição e tamanho">
      <Row label="Posição"><div className="bw-prop-pair"><NumberField label="X" hideLabel quiet prefix="X" value={c.x} onChange={(v) => set('x', v)} /><NumberField label="Y" hideLabel quiet prefix="Y" value={c.y} onChange={(v) => set('y', v)} /></div></Row>
      <Row label="Tamanho"><div className="bw-prop-pair"><NumberField label="Largura" hideLabel quiet prefix="L" value={c.w} onChange={(v) => set('w', v)} /><NumberField label="Altura" hideLabel quiet prefix="A" value={c.h} onChange={(v) => set('h', v)} /></div></Row>
    </Section>
  );
}

function TypeProps({ c }: { c: Comp }) {
  const set = useProp(c);
  const p = c.props;
  switch (c.type) {
    case 'chart': {
      const k = p as unknown as ChartProps;
      return (
        <Section title="Gráfico">
          <Row label="Tipo"><Select label="Tipo de gráfico" hideLabel value={k.kind} onChange={(v: ChartKind) => { set('kind', v, `Trocar para ${KINDS.find((x) => x.id === v)?.label}`); }} options={KINDS} /></Row>
          <Row label="Legenda"><Switch isSelected={k.legend} onChange={(v) => set('legend', v, v ? 'Mostrar legenda' : 'Ocultar legenda')} aria-label="Legenda">{null}</Switch></Row>
          <Row label="Rótulos de dados"><Switch isSelected={k.labels} onChange={(v) => set('labels', v, v ? 'Mostrar rótulos' : 'Ocultar rótulos')} aria-label="Rótulos de dados">{null}</Switch></Row>
          <Row label="Tooltip"><Switch isSelected={k.tooltip} onChange={(v) => set('tooltip', v, v ? 'Ligar tooltip' : 'Desligar tooltip')} aria-label="Tooltip">{null}</Switch></Row>
        </Section>
      );
    }
    case 'kpi': {
      const k = p as unknown as KpiProps;
      return (
        <Section title="KPI">
          <Row label="Comparar"><SegmentedControl label="Comparar" value={k.compare} onChange={(v) => set('compare', v, v === 'target' ? 'Comparar com meta' : 'Sem comparação')} options={[{ id: 'none', label: 'Nada' }, { id: 'target', label: 'Meta' }]} /></Row>
          {k.compare === 'target' && <>
            <Row label="Meta"><NumberField label="Meta" hideLabel quiet value={k.target ?? 0} step={0.1} onChange={(v) => set('target', v, 'Alterar meta')} /></Row>
            <Row label="Bom quando"><SegmentedControl label="Bom quando" value={k.targetDir} onChange={(v) => set('targetDir', v, 'Direção da meta')} options={[{ id: 'above', label: 'Acima' }, { id: 'below', label: 'Abaixo' }]} /></Row>
          </>}
          <Row label="Tendência"><Switch isSelected={k.spark} onChange={(v) => set('spark', v, v ? 'Mostrar tendência' : 'Ocultar tendência')} aria-label="Tendência de 30 dias">{null}</Switch></Row>
          {k.spark && <Row label="Série"><Select label="Série da tendência" hideLabel value={k.sparkMeasure} onChange={(v: string) => set('sparkMeasure', v, 'Trocar série da tendência')} options={[{ id: 'disponibilidade', label: 'Disponibilidade' }, { id: 'utilizacao', label: 'Utilização' }, { id: 'atenuacao_dB', label: 'Atenuação' }]} /></Row>}
        </Section>
      );
    }
    case 'table': { const k = p as unknown as TableProps; return (
      <Section title="Tabela">
        <Row label="Densidade"><SegmentedControl label="Densidade" value={k.density} onChange={(v) => set('density', v, 'Densidade da tabela')} options={[{ id: 'compact', label: 'Compacta' }, { id: 'default', label: 'Padrão' }]} /></Row>
        <Row label="Cor de status"><Switch isSelected={k.statusColors} onChange={(v) => set('statusColors', v, 'Cor de status')} aria-label="Cor de status">{null}</Switch></Row>
        <Row label="Limite de linhas"><NumberField label="Limite de linhas" hideLabel quiet value={k.rowLimit} minValue={0} step={10} unit={k.rowLimit ? 'linhas' : 'todas'} onChange={(v) => set('rowLimit', v, 'Limite de linhas')} /></Row>
      </Section>); }
    case 'matrix': { const k = p as unknown as MatrixProps; return (
      <Section title="Matriz">
        <Row label="Mapa de calor"><Switch isSelected={k.heat} onChange={(v) => set('heat', v, 'Mapa de calor')} aria-label="Mapa de calor">{null}</Switch></Row>
        <Row label="Totais"><Switch isSelected={k.totals} onChange={(v) => set('totals', v, 'Totais')} aria-label="Totais">{null}</Switch></Row>
      </Section>); }
    case 'text': { const k = p as unknown as TextProps; return (
      <Section title="Texto">
        <textarea className="ed-textarea" aria-label="Texto" value={k.text} onChange={(e) => set('text', e.target.value, 'Editar texto')} rows={3} />
        <Row label="Tamanho"><SegmentedControl label="Tamanho do texto" value={k.size} onChange={(v) => set('size', v, 'Tamanho do texto')} options={[{ id: 'sm', label: 'P' }, { id: 'md', label: 'M' }, { id: 'lg', label: 'G' }, { id: 'xl', label: 'GG' }]} /></Row>
        <Row label="Peso"><SegmentedControl label="Peso" value={k.weight} onChange={(v) => set('weight', v, 'Peso do texto')} options={[{ id: 'regular', label: 'Normal' }, { id: 'strong', label: 'Forte' }]} /></Row>
        <Row label="Tom"><SegmentedControl label="Tom" value={k.tone ?? 'title'} onChange={(v) => set('tone', v, 'Tom do texto')} options={[{ id: 'title', label: 'Principal' }, { id: 'subtitle', label: 'Secundário' }]} /></Row>
        <Row label="Alinhamento"><SegmentedControl label="Alinhamento" value={k.align} onChange={(v) => set('align', v, 'Alinhar texto')} options={[{ id: 'left', label: 'Esq.' }, { id: 'center', label: 'Centro' }, { id: 'right', label: 'Dir.' }]} /></Row>
      </Section>); }
    case 'image': { const k = p as unknown as ImageProps; return (
      <Section title="Imagem">
        <Row label="Imagem"><Select label="Imagem" hideLabel value={k.src.startsWith('data:') ? undefined : k.src} placeholder="Imagem enviada" onChange={(v: string) => set('src', v, 'Trocar imagem')} options={IMAGES} /></Row>
        <Row label="Enviar"><label className="bw-btn ed-upload"><Icon name="upload" size={12} />Escolher arquivo<input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 1_500_000) { useEditor.getState().toast({ text: 'Imagem acima de 1,5 MB. Use uma menor.', tone: 'danger' }); return; } const r = new FileReader(); r.onload = () => set('src', String(r.result), 'Enviar imagem'); r.readAsDataURL(f); }} /></label></Row>
        <Row label="Ajuste"><SegmentedControl label="Ajuste" value={k.fit} onChange={(v) => set('fit', v, 'Ajuste da imagem')} options={[{ id: 'contain', label: 'Conter' }, { id: 'cover', label: 'Preencher' }]} /></Row>
        <Row label="Texto alternativo"><TextField label="Texto alternativo" hideLabel quiet value={k.alt} onChange={(v) => set('alt', v, 'Texto alternativo')} /></Row>
      </Section>); }
    case 'card': { const k = p as unknown as CardProps; return (
      <Section title="Card">
        <textarea className="ed-textarea" aria-label="Texto do card" value={k.body} onChange={(e) => set('body', e.target.value, 'Editar card')} rows={4} />
        <Row label="Ícone"><SegmentedControl label="Ícone" value={k.icon} onChange={(v) => set('icon', v, 'Ícone do card')} options={[{ id: 'info', label: 'Info', icon: 'info', iconOnly: true }, { id: 'warning', label: 'Atenção', icon: 'warning', iconOnly: true }, { id: 'check', label: 'Ok', icon: 'check', iconOnly: true }, { id: 'clock', label: 'Tempo', icon: 'clock', iconOnly: true }]} /></Row>
      </Section>); }
    case 'slicer': { const k = p as unknown as SlicerProps; return (
      <Section title="Segmentação">
        <Row label="Orientação"><SegmentedControl label="Orientação" value={k.orientation} onChange={(v) => set('orientation', v, 'Orientação')} options={[{ id: 'horizontal', label: 'Horizontal' }, { id: 'vertical', label: 'Vertical' }]} /></Row>
        <Row label="Contagens"><Switch isSelected={k.showCounts} onChange={(v) => set('showCounts', v, 'Contagens')} aria-label="Mostrar contagens">{null}</Switch></Row>
        <Row label="Seleção múltipla"><Switch isSelected={k.multi} onChange={(v) => set('multi', v, 'Seleção múltipla')} aria-label="Seleção múltipla">{null}</Switch></Row>
      </Section>); }
    case 'filter': { const k = p as unknown as FilterProps; return <Section title="Filtro"><Row label="Seleção múltipla"><Switch isSelected={k.multi} onChange={(v) => set('multi', v, 'Seleção múltipla')} aria-label="Seleção múltipla">{null}</Switch></Row></Section>; }
    case 'map': { const k = p as unknown as MapProps; return (
      <Section title="Mapa">
        <Row label="Modo"><Select label="Modo do mapa" hideLabel value={k.variant} onChange={(v: string) => set('variant', v, 'Trocar modo do mapa')} options={[{ id: 'assets', label: 'Geográfico' }, { id: 'heat', label: 'Mapa de calor' }, { id: 'routes', label: 'Rotas' }, { id: 'topology', label: 'Topologia' }]} /></Row>
        <Row label="Colorir por"><Select label="Colorir por" hideLabel value={k.colorBy} onChange={(v: string) => set('colorBy', v, 'Colorir mapa')} options={[{ id: 'status', label: 'Status' }, { id: 'utilizacao', label: 'Utilização' }, { id: 'atenuacao_dB', label: 'Atenuação' }, { id: 'camada', label: 'Camada' }]} /></Row>
        {k.layers.heat && <Row label="Calor de"><Select label="Calor de" hideLabel value={k.heatField} onChange={(v: string) => set('heatField', v, 'Fonte do calor')} options={[{ id: 'eventos', label: 'Eventos' }, { id: 'atenuacao_dB', label: 'Atenuação' }, { id: 'utilizacao', label: 'Utilização' }]} /></Row>}
        <div className="ed-layers">{LAYER_LABEL.map(([key, l]) => <Switch key={key} isSelected={k.layers[key]} onChange={(v) => set('layers', { ...k.layers, [key]: v } satisfies MapLayers, `Camada ${l} ${v ? 'ligada' : 'desligada'}`)}>{l}</Switch>)}</div>
        <Row label="Legenda"><Switch isSelected={k.legend} onChange={(v) => set('legend', v, 'Legenda do mapa')} aria-label="Legenda">{null}</Switch></Row>
        <Row label="Rótulos"><Switch isSelected={k.labels} onChange={(v) => set('labels', v, 'Rótulos do mapa')} aria-label="Rótulos">{null}</Switch></Row>
        <Row label="Painel de camadas"><Switch isSelected={k.layerPanel} onChange={(v) => set('layerPanel', v, 'Painel de camadas')} aria-label="Painel de camadas">{null}</Switch></Row>
        <Row label="Painel de detalhes"><Switch isSelected={k.detailPanel} onChange={(v) => set('detailPanel', v, 'Painel de detalhes')} aria-label="Painel de detalhes">{null}</Switch></Row>
      </Section>); }
    case 'scene3d': { const k = p as unknown as Scene3DProps; return (
      <Section title="3D">
        <Row label="Perspectiva"><SegmentedControl label="Perspectiva" value={k.perspective} onChange={(v) => set('perspective', v, 'Trocar perspectiva 3D')} options={[{ id: 'orbital', label: 'Orbital' }, { id: 'topo', label: 'Topo' }, { id: 'rua', label: 'Rua' }]} /></Row>
        <Row label="Exagero vertical"><NumberField label="Exagero vertical" hideLabel quiet value={k.exaggeration} minValue={1} maxValue={6} step={0.5} unit="×" onChange={(v) => set('exaggeration', v, 'Exagero vertical')} /></Row>
        <div className="ed-layers">{(Object.keys(k.layers) as (keyof Scene3DProps['layers'])[]).map((key) => <Switch key={key} isSelected={k.layers[key]} onChange={(v) => set('layers', { ...k.layers, [key]: v }, `Camada 3D ${key}`)}>{({ terreno: 'Terreno', edificios: 'Edifícios', torres: 'Torres', fibras: 'Fibras', cobertura: 'Cobertura', visada: 'Linha de visada', fluxo: 'Fluxo (animação)' } as const)[key]}</Switch>)}</div>
      </Section>); }
    case 'container': return <Section title="Container"><Row label="Rótulo"><TextField label="Rótulo" hideLabel quiet value={String(p.label ?? '')} onChange={(v) => set('label', v, 'Rótulo do container')} /></Row><p className="ed-help">Componentes inteiramente dentro do container se movem junto com ele.</p></Section>;
    default: return null;
  }
}

function PageProps() {
  const doc = useEditor((s) => s.doc)!;
  const page = useEditor((s) => s.page())!;
  const dash = useUi((s) => s.dashTheme), setUi = useUi((s) => s.set);
  return (
    <>
      <NoSelection text="Nada selecionado. Ajustes da página e do relatório." />
      <Section title="Relatório">
        <Row label="Nome"><TextField label="Nome do relatório" hideLabel quiet value={doc.name} onChange={(v) => useEditor.getState().commit('Renomear relatório', (d) => { d.name = v; }, { tx: 'rename-doc' })} /></Row>
        <Row label="Categoria"><Select label="Categoria" hideLabel value={doc.category} onChange={(v: string) => useEditor.getState().commit('Trocar categoria', (d) => { d.category = v as typeof d.category; })} options={['Operações', 'Executivo', 'Engenharia', 'Campo', 'Capacidade'].map((x) => ({ id: x, label: x }))} /></Row>
        <textarea className="ed-textarea" aria-label="Descrição do relatório" placeholder="Descrição (aparece na galeria)" value={doc.description} rows={3} onChange={(e) => useEditor.getState().commit('Editar descrição', (d) => { d.description = e.target.value; }, { tx: 'desc-doc' })} />
      </Section>
      <Section title={`Página · ${page.name}`}>
        <Row label="Tamanho"><div className="bw-prop-pair"><NumberField label="Largura da página" hideLabel quiet prefix="L" value={page.w} minValue={800} maxValue={1920} step={40} onChange={(v) => useEditor.getState().commit('Largura da página', (d) => { const p = d.pages.find((x) => x.id === page.id); if (p) p.w = v; })} /><NumberField label="Altura da página" hideLabel quiet prefix="A" value={page.h} minValue={480} maxValue={3000} step={40} onChange={(v) => useEditor.getState().commit('Altura da página', (d) => { const p = d.pages.find((x) => x.id === page.id); if (p) p.h = v; })} /></div></Row>
        <Row label="Tema do relatório"><SegmentedControl label="Tema do relatório" value={dash} onChange={(v) => setUi({ dashTheme: v })} options={[{ id: 'light', label: 'Claro' }, { id: 'dark', label: 'Escuro' }]} /></Row>
      </Section>
    </>
  );
}

export function VisualTab() {
  const sel = useEditor(useShallow((s) => s.page()?.comps.filter((c) => s.selection.includes(c.id)) ?? []));
  if (!sel?.length) return <div className="ed-tab"><PageProps /></div>;
  if (sel.length > 1) return (
    <div className="ed-tab">
      <div className="ed-tab-title">{sel.length} componentes selecionados</div>
      <Section title="Alinhar">
        <div className="ed-align">
          {([['left', 'alignLeft', 'Alinhar à esquerda'], ['hcenter', 'alignHCenter', 'Centralizar na horizontal'], ['right', 'alignRight', 'Alinhar à direita'], ['top', 'alignTop', 'Alinhar ao topo'], ['vcenter', 'alignVCenter', 'Centralizar na vertical'], ['bottom', 'alignBottom', 'Alinhar à base']] as const).map(([op, icon, label]) => (
            <IconButton key={op} icon={icon} label={label} onPress={() => useEditor.getState().align(op)} />
          ))}
        </div>
      </Section>
      <Section title="Distribuir">
        <div className="ed-align"><Button size="sm" icon="distH" isDisabled={sel.length < 3} onPress={() => useEditor.getState().distribute('h')}>Horizontal</Button><Button size="sm" icon="distV" isDisabled={sel.length < 3} onPress={() => useEditor.getState().distribute('v')}>Vertical</Button></div>
        {sel.length < 3 && <p className="ed-help">Selecione 3 ou mais para distribuir.</p>}
      </Section>
      <Section title="Superfície">
        <Row label="Borda"><Switch isSelected={sel.every((c) => c.style.border)} onChange={(v) => useEditor.getState().commit(v ? 'Mostrar bordas' : 'Ocultar bordas', (d) => { for (const p of d.pages) for (const c of p.comps) if (sel.some((s) => s.id === c.id)) c.style.border = v; })} aria-label="Borda">{null}</Switch></Row>
        <Row label="Mostrar título"><Switch isSelected={sel.every((c) => c.style.showTitle)} onChange={(v) => useEditor.getState().commit(v ? 'Mostrar títulos' : 'Ocultar títulos', (d) => { for (const p of d.pages) for (const c of p.comps) if (sel.some((s) => s.id === c.id)) c.style.showTitle = v; })} aria-label="Mostrar título">{null}</Switch></Row>
      </Section>
    </div>
  );
  const c = sel[0]!;
  return (
    <div className="ed-tab">
      <div className="ed-tab-title">{COMP_META[c.type].label} · {c.name}</div>
      <TypeProps c={c} />
      {c.type !== 'text' && c.type !== 'image' && <StyleProps c={c} />}
      <Geometry c={c} />
    </div>
  );
}
