import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Badge, Button, Icon, SegmentedControl, Switch, TextField } from '@biweb/ui';
import { useUi } from '../state/ui-store';
import './complex-workspaces.css';
import { MapBuilder } from './maps/MapBuilder';
import { roadPath, roundedPath } from './maps/roads';

type LayerId = 'sites' | 'links' | 'health' | 'incidents' | 'traffic' | 'maintenance' | 'buildings' | 'streets' | 'planned';
const LAYER_GROUPS: { title: string; layers: { id: LayerId; label: string }[] }[] = [
  { title: 'Rede', layers: [{ id: 'links', label: 'Enlaces' }, { id: 'sites', label: 'Sites e POPs' }, { id: 'planned', label: 'Rotas planejadas' }] },
  { title: 'Operações', layers: [{ id: 'incidents', label: 'Incidentes' }, { id: 'traffic', label: 'Tráfego' }, { id: 'maintenance', label: 'Manutenção' }] },
  { title: 'Contexto', layers: [{ id: 'buildings', label: 'Edificações' }, { id: 'streets', label: 'Ruas' }, { id: 'health', label: 'Utilização' }] },
];
const LAYER_DEFAULTS: Record<LayerId, boolean> = { sites: true, links: true, health: true, incidents: true, traffic: false, maintenance: false, buildings: false, streets: true, planned: false };
const MAP_CENTER = { lat: -23.55, lon: -46.63 };
function tilePoint(lat: number, lon: number, zoom: number) {
  const n = 2 ** zoom, rad = lat * Math.PI / 180;
  return { x: (lon + 180) / 360 * n, y: (1 - Math.asinh(Math.tan(rad)) / Math.PI) / 2 * n };
}
function mapPoint(lat: number, lon: number, zoom: number) {
  const p = tilePoint(lat, lon, zoom), c = tilePoint(MAP_CENTER.lat, MAP_CENTER.lon, zoom);
  return { x: 384 + (p.x - c.x) * 256, y: 256 + (p.y - c.y) * 256 };
}
function osmTiles(zoom: number) {
  const c = tilePoint(MAP_CENTER.lat, MAP_CENTER.lon, zoom), left = Math.floor(c.x) - 1, top = Math.floor(c.y) - 1;
  return Array.from({ length: 9 }, (_, i) => { const x = left + i % 3, y = top + Math.floor(i / 3); return { key: `${zoom}-${x}-${y}`, href: `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`, x: 384 + (x - c.x) * 256, y: 256 + (y - c.y) * 256 }; });
}
const sites = [
  { id: 'POP-LAPA', name: 'Lapa', lat: -23.525, lon: -46.702, health: 'Normal', load: 56, capacity: '40 Gbps', latency: '12 ms', owner: 'Operações de Rede' },
  { id: 'POP-BARRA', name: 'Barra Funda', lat: -23.525, lon: -46.665, health: 'Normal', load: 71, capacity: '100 Gbps', latency: '9 ms', owner: 'Operações de Rede' },
  { id: 'POP-OSASCO', name: 'Osasco', lat: -23.532, lon: -46.791, health: 'Atenção', load: 82, capacity: '40 Gbps', latency: '18 ms', owner: 'Operações de Rede' },
  { id: 'POP-BARUERI', name: 'Barueri', lat: -23.511, lon: -46.876, health: 'Crítico', load: 91, capacity: '40 Gbps', latency: '21 ms', owner: 'Operações de Rede' },
  { id: 'POP-PAULISTA', name: 'Paulista', lat: -23.563, lon: -46.655, health: 'Normal', load: 63, capacity: '100 Gbps', latency: '7 ms', owner: 'Operações de Rede' },
  { id: 'POP-SANTOAMARO', name: 'Santo Amaro', lat: -23.654, lon: -46.712, health: 'Normal', load: 67, capacity: '40 Gbps', latency: '15 ms', owner: 'Operações de Rede' },
  { id: 'POP-ITAQUERA', name: 'Itaquera', lat: -23.539, lon: -46.455, health: 'Atenção', load: 79, capacity: '40 Gbps', latency: '19 ms', owner: 'Operações de Rede' },
];
const edges: [number, number][] = [[0, 1], [0, 2], [1, 4], [2, 3], [2, 4], [4, 5], [4, 6], [5, 6]];
const incidents = [
  { id: 'INC-2084', type: 'Rompimento de fibra', region: 'Barueri', time: '08:14', severity: 'Crítica', target: 'ENL-042' },
  { id: 'INC-2077', type: 'Degradação de enlace', region: 'Osasco', time: '06:42', severity: 'Alta', target: 'ENL-042' },
  { id: 'INC-2051', type: 'Alarme de energia', region: 'Lapa', time: 'Ontem, 21:06', severity: 'Média', target: 'POP-LAPA' },
];
function selectedFromUrl(fallback: string) {
  if (typeof location === 'undefined') return fallback;
  const route = location.hash.startsWith('#/') ? location.hash.slice(1) : location.pathname;
  const query = route.includes('?') ? route.slice(route.indexOf('?') + 1) : location.search.slice(1);
  return new URLSearchParams(query).get('selection') ?? fallback;
}
function writeSelectionToUrl(id: string) {
  if (location.hash.startsWith('#/')) {
    const route = location.hash.slice(1).split('?')[0]!;
    history.replaceState(null, '', `${location.pathname}${location.search}#${route}?selection=${encodeURIComponent(id)}`);
  } else {
    const url = new URL(location.href); url.searchParams.set('selection', id); history.replaceState(null, '', url);
  }
}

function LegacyMapWorkspace({ incident = false, street = false, dependencyMode = false, replay = false }: { incident?: boolean; street?: boolean; dependencyMode?: boolean; replay?: boolean }) {
  const navigate = useNavigate();
  const [layers, setLayers] = useState<Record<LayerId, boolean>>(() => ({ ...LAYER_DEFAULTS, buildings: street }));
  const [selected, setSelected] = useState(() => selectedFromUrl(dependencyMode ? 'POP-BARUERI' : incident ? 'INC-2084' : 'ENL-042'));
  const [view, setView] = useState<'map' | 'network' | 'table'>(incident || street ? 'map' : 'network');
  const [dimension, setDimension] = useState<'2d' | '3d'>(street ? '3d' : '2d');
  const [aggregation, setAggregation] = useState<'Pontos' | 'Clusters' | 'Calor' | 'Hexbin'>('Pontos');
  const [viewport, setViewport] = useState(true);
  const [time, setTime] = useState<'live' | 'paused' | 'replay'>(replay ? 'replay' : 'live');
  const [cursor, setCursor] = useState(replay ? 42 : 62);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [drawer, setDrawer] = useState(false);
  const [explanation, setExplanation] = useState(false);
  const [mapStyle, setMapStyle] = useState<'light' | 'dark' | 'terrain'>('light');
  const [mapZoom, setMapZoom] = useState(11);
  const [tileError, setTileError] = useState(false);
  const [tool, setTool] = useState<'select' | 'rectangle' | 'polygon' | 'radius' | 'measure'>('select');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [dependency, setDependency] = useState(dependencyMode);
  const [routeAnalysis, setRouteAnalysis] = useState(false);
  const [contextOpen, setContextOpen] = useState(() => typeof window === 'undefined' || window.innerWidth > 640);
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [spatialSummary, setSpatialSummary] = useState(false);
  const [layerOpacity, setLayerOpacity] = useState<Record<LayerId, number>>({ sites: 100, links: 88, health: 75, incidents: 100, traffic: 76, maintenance: 65, buildings: 65, streets: 100, planned: 70 });
  const [severity, setSeverity] = useState('Todas');
  const tileSet = useMemo(() => osmTiles(mapZoom), [mapZoom]);
  const shownIncidents = incidents.filter((x) => (severity === 'Todas' || x.severity === severity) && (time !== 'replay' || cursor > 22));
  const currentHealth = (s: typeof sites[number]) => time === 'replay' && cursor < 58 && s.id === 'POP-BARUERI' ? 'Atenção' : s.health;
  const incidentClusters = [...new Set(shownIncidents.map((x) => x.region))].map((region) => { const asset = sites.find((x) => x.name === region)!; const point = mapPoint(asset.lat, asset.lon, mapZoom); const events = shownIncidents.filter((x) => x.region === region); return { x: point.x, y: point.y, count: events.length, id: events[0]!.id }; });
  const aiEnabled = useUi((s) => s.aiEnabled);
  useEffect(() => {
    if (time !== 'replay') return;
    const timer = window.setInterval(() => setCursor((x) => Math.min(95, x + 1)), 900 / playSpeed);
    return () => window.clearInterval(timer);
  }, [time, playSpeed]);
  useEffect(() => {
    setTransitioning(true);
    const timer = window.setTimeout(() => setTransitioning(false), 260);
    return () => window.clearTimeout(timer);
  }, [view, dimension, mapStyle]);
  const buildingIndex = selected.startsWith('BLD-') ? Number(selected.slice(4)) - 1 : -1;
  const selectedLink = selected.startsWith('ENL-') ? { id: selected, type: 'Trecho', region: 'Rede Metropolitana SP', time: 'agora', severity: selected === 'ENL-042' ? 'Degradado' : 'Normal', capacity: '100 Gbps', utilization: selected === 'ENL-042' ? '87%' : '63%', latency: selected === 'ENL-042' ? '21 ms' : '12 ms', owner: 'Network Operations' } : undefined;
  const chosen = incidents.find((x) => x.id === selected) ?? (buildingIndex >= 0 ? sites[buildingIndex] : undefined) ?? sites.find((x) => x.id === selected) ?? selectedLink;
  const pick = (id: string) => { setSelected(id); writeSelectionToUrl(id); setDrawer(true); if (time === 'live') setTime('paused'); };
  const selectedNode = sites.find((s) => s.id === selected);
  const selectedIndex = sites.findIndex((s) => s.id === selected);
  const connectedNodes = new Set(selectedIndex < 0 ? [] : edges.flatMap(([a, b]) => a === selectedIndex ? [sites[b]!.id] : b === selectedIndex ? [sites[a]!.id] : []));
  const searchResults = search.trim() ? [
    ...sites.filter((s) => `${s.id} ${s.name}`.toLowerCase().includes(search.toLowerCase())).map((s) => ({ id: s.id, group: 'ATIVOS', label: `${s.id} · ${s.name}` })),
    ...[{ id: 'POP-PAULISTA', name: 'São Paulo · Centro' }, { id: 'POP-OSASCO', name: 'Osasco, SP' }, { id: 'POP-ITAQUERA', name: 'Itaquera · Zona Leste' }, { id: 'POP-BARUERI', name: 'Barueri, SP' }].filter((x) => x.name.toLowerCase().includes(search.toLowerCase())).map((x) => ({ id: x.id, group: 'LOCALIDADES', label: x.name })),
    ...incidents.filter((x) => `${x.id} ${x.type} ${x.region}`.toLowerCase().includes(search.toLowerCase())).map((x) => ({ id: x.id, group: 'INCIDENTES', label: `${x.id} · ${x.type}` })),
    ...['ENL-042 · Barueri → Osasco', 'ENL-018 · Lapa → Paulista'].filter((x) => x.toLowerCase().includes(search.toLowerCase())).map((x, i) => ({ id: i ? 'ENL-018' : 'ENL-042', group: 'TRECHOS', label: x })),
  ] : [];
  const setToolMode = (next: typeof tool) => { setTool(next); setSpatialSummary(false); };
  const exportRows = () => {
    const csv = ['id,nome,regiao,estado,utilizacao', ...sites.map((s) => `${s.id},${s.name},São Paulo,${s.health},${s.load}%`)].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'biweb-network-assets.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return <div className={`map-workspace${fullscreen ? ' is-fullscreen' : ''}`}>
    <header className="map-ws-head">
      <div><div className="map-ws-crumb"><Link to="/reports">Relatórios</Link><Icon name="chevronRight" size={12} /> Operações de Rede <Icon name="chevronRight" size={12}/>{dependencyMode ? 'Impacto' : replay ? 'Histórico' : incident ? 'Incidentes' : street ? 'Infraestrutura urbana' : 'Network Intelligence'}</div><h1>{dependencyMode ? 'Dependency & Impact' : replay ? 'Historical Replay' : street ? 'Street Intelligence 3D' : incident ? 'Incident Intelligence' : 'Network Intelligence'}</h1></div>
      <div className="map-live-status"><i className={time === 'live' ? 'is-live' : ''}/><b>{time === 'live' ? 'LIVE' : time === 'paused' ? 'PAUSADO' : 'REPLAY'}</b><span>{time === 'live' ? 'Atualizado há 4 s' : time === 'paused' ? 'Atualização suspensa' : '07 out · 08:14'}</span></div>
      <div className="map-ws-actions"><Badge tone="success" icon="check">Fonte simulada · 7.842 ativos</Badge><Button icon="expand" onPress={() => setFullscreen((v) => !v)}>{fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}</Button><Button icon="download" onPress={exportRows}>Exportar</Button><Button variant="primary" icon="report" onPress={() => navigate({ to: '/reports/$reportId', params: { reportId: street ? 'net_gemeo' : incident ? 'net_incidentes' : 'net_operacoes' } })}>Relatório</Button></div>
    </header>
    <div className="map-context-bar">
      <Button size="sm" icon={contextOpen ? 'layers' : 'grid'} onPress={() => setContextOpen((v) => !v)}>{contextOpen ? 'Camadas e filtros' : 'Abrir camadas'}</Button>
      <div className="map-search"><TextField label="Buscar no mapa" hideLabel icon="search" placeholder="Ativo, trecho ou incidente" value={search} onChange={(v) => { setSearch(v); setSearchOpen(true); }} className="map-search-field"/><span className="map-search-shortcut">⌘ K</span>{searchOpen && search.trim() && <div className="map-search-results">{searchResults.length ? searchResults.map((r) => <button key={`${r.group}-${r.id}`} onClick={() => { pick(r.id); setSearch(r.label); setSearchOpen(false); }}><small>{r.group}</small><span>{r.label}</span><Icon name="arrowRight" size={12}/></button>) : <p>Nenhum ativo encontrado nessa demonstração.</p>}</div>}</div>
      <span className="map-context-tag"><Icon name="filter" size={12} /> Região: Todas</span><span className="flex-1"/><span className="map-refresh">07 out 2026 · 7.842 ativos · 346 enlaces · 428k feições</span>
      <SegmentedControl label="Visão espacial" value={view} onChange={setView} options={[{ id: 'map', label: 'Mapa', icon: 'pin' }, { id: 'network', label: 'Rede', icon: 'model' }, { id: 'table', label: 'Tabela', icon: 'table' }]} />
    </div>
    <div className="map-ws-kpis"><div><small>Enlaces monitorados</small><b>346</b><em>+2 desde 08:00</em></div><div><small>Utilização média</small><b>73,4%</b><em>+1,2 pp na última hora</em></div><div><small>Precisam de atenção</small><b className="is-warning">12</b><em>3 em degradação</em></div><div><small>Incidentes ativos</small><b className="is-danger">4</b><em>1 novo · Barueri</em></div></div>
    <div className="map-ws-body">
      {contextOpen && <aside className="map-layer-panel"><div className="map-panel-head"><div><h2>Exploração</h2><p>Camadas, contexto e filtros</p></div><button aria-label="Recolher painel" onClick={() => setContextOpen(false)}><Icon name="arrowLeft" size={12}/></button></div>
        {LAYER_GROUPS.map((group) => <section className="map-layer-group" key={group.title}><h3>{group.title}</h3>{group.layers.map((l) => <div className="map-layer-control" key={l.id}><label className="map-layer-row"><Switch isSelected={layers[l.id]} onChange={(on) => setLayers((s) => ({ ...s, [l.id]: on }))}>{l.label}</Switch></label>{layers[l.id] && <details className="map-layer-settings"><summary aria-label={`Ajustar estilo ${l.label}`}><Icon name="sliders" size={12}/></summary><label>Opacidade <span>{layerOpacity[l.id]}%</span><input type="range" min="20" max="100" value={layerOpacity[l.id]} onChange={(e) => setLayerOpacity((s) => ({ ...s, [l.id]: Number(e.target.value) }))}/></label></details>}</div>)}</section>)}
        {layers.incidents && <section className="map-layer-group"><h3>Filtro de incidentes</h3><label className="map-mini-label">Severidade<select aria-label="Filtrar severidade" value={severity} onChange={(e) => setSeverity(e.target.value)}>{['Todas', 'Crítica', 'Alta', 'Média'].map((x) => <option key={x}>{x}</option>)}</select></label><label className="map-mini-label">Agregação<select aria-label="Agregação de incidentes" value={aggregation} onChange={(e) => setAggregation(e.target.value as typeof aggregation)}>{['Pontos', 'Clusters', 'Calor', 'Hexbin'].map((x) => <option key={x}>{x}</option>)}</select></label></section>}
        <section className="map-layer-group"><h3>Escopo espacial</h3><Switch isSelected={viewport} onChange={setViewport}>Limitar ao viewport</Switch><small className="map-helper">{viewport ? '78 enlaces nesta área · rede' : 'Todos os 346 enlaces'}</small></section>
        <section className="map-layer-group"><h3>Legenda · {layers.incidents ? 'saúde e eventos' : 'rede'}</h3><div className="map-legend-inline"><span><i className="legend-dot normal"/>Normal</span><span><i className="legend-dot attention"/>Atenção</span><span><i className="legend-dot critical"/>Crítico</span></div>{layers.health && <div className="map-legend-scale"><span>Utilização</span><i/><span>0 — 100%</span></div>}{layers.incidents && <small>{shownIncidents.length} de {incidents.length} eventos visíveis · {aggregation.toLowerCase()}</small>}</section>
      </aside>}
      <section className={`map-canvas-area${view === 'table' ? ' is-table' : ''}${!contextOpen ? ' is-wide' : ''}`} aria-label={view === 'table' ? 'Tabela de ativos e enlaces' : 'Mapa geoespacial'}>
        {view !== 'table' ? <div className={`map-canvas map-canvas--${dimension} map-canvas--${mapStyle} map-canvas--${view}${transitioning ? ' is-transitioning' : ''}`}>
          <div className="map-canvas-toolbar"><div className="map-toolbar-primary"><SegmentedControl label="Dimensão do mapa" value={dimension} onChange={setDimension} options={[{ id: '2d', label: '2D' }, { id: '3d', label: '3D' }]} /><div className="map-style-switch" aria-label="Estilo do mapa"><button aria-pressed={mapStyle === 'light'} onClick={() => setMapStyle('light')} title="BIWEB Light">Claro</button><button aria-pressed={mapStyle === 'dark'} onClick={() => setMapStyle('dark')} title="BIWEB Dark">Escuro</button><button aria-pressed={mapStyle === 'terrain'} onClick={() => setMapStyle('terrain')} title="Terreno">Terreno</button></div></div><div className="map-toolbar-tools" aria-label="Ferramentas espaciais">{([{ id: 'select', label: 'Selecionar' }, { id: 'rectangle', label: 'Retângulo' }, { id: 'polygon', label: 'Polígono' }, { id: 'radius', label: 'Raio' }, { id: 'measure', label: 'Medir' }] as const).map((item) => <button key={item.id} aria-pressed={tool === item.id} title={item.label} onClick={() => setToolMode(item.id)}>{item.label}</button>)}</div></div>
          <div className="map-canvas-subtoolbar"><button className={routeAnalysis ? 'is-active' : ''} onClick={() => setRouteAnalysis((v) => !v)}><Icon name="timeline" size={12}/> Analisar rota</button><button className={dependency ? 'is-active' : ''} onClick={() => setDependency((v) => !v)} disabled={!selectedNode}><Icon name="model" size={12}/> Dependências</button><button className={layers.traffic ? 'is-active' : ''} onClick={() => setLayers((s) => ({ ...s, traffic: !s.traffic }))}><Icon name="bolt" size={12}/> Fluxo</button><span className="flex-1"/><span className="map-mode-limit">{dimension === '3d' ? 'Cena urbana · extrusão por utilização' : view === 'network' ? 'Rede metropolitana · enlaces por capacidade e saúde' : 'OpenStreetMap · Região Metropolitana de São Paulo'}</span></div>
          <svg viewBox="0 0 768 512" role="img" aria-label="Mapa e infraestrutura da Região Metropolitana de São Paulo" onClick={() => { if (tool !== 'select') setSpatialSummary(true); }}>
            {layers.streets && tileSet.map((t) => <image key={t.key} href={t.href} x={t.x} y={t.y} width="256" height="256" preserveAspectRatio="none" onError={() => setTileError(true)}/>)}
            <rect className="map-base-tint" x="0" y="0" width="768" height="512"/>
            {layers.planned && <g className="map-planned-path"><path d={`M${mapPoint(sites[3]!.lat,sites[3]!.lon,mapZoom).x} ${mapPoint(sites[3]!.lat,sites[3]!.lon,mapZoom).y} Q 390 115 ${mapPoint(sites[4]!.lat,sites[4]!.lon,mapZoom).x} ${mapPoint(sites[4]!.lat,sites[4]!.lon,mapZoom).y}`}/><text x="400" y="105">Rota planejada · redundância</text></g>}
            {layers.maintenance && <g className="map-maintenance-marker" transform={`translate(${mapPoint(-23.654,-46.712,mapZoom).x} ${mapPoint(-23.654,-46.712,mapZoom).y})`}><circle r="13"/><text textAnchor="middle" y="4">M</text><title>Manutenção programada · Santo Amaro · 14:00</title></g>}
            {street && layers.buildings && sites.map((s, i) => { const p = mapPoint(s.lat, s.lon, mapZoom), h = 11 + (i % 4) * 5; return <g key={`bld-${s.id}`} className="map-building" onClick={(e) => { e.stopPropagation(); pick(`BLD-${String(i + 1).padStart(3, '0')}`); }} role="button" tabIndex={0} aria-label={`Edifício próximo a ${s.name}, utilização ${s.load}%`} transform={`translate(${p.x} ${p.y})`} style={{ opacity: layerOpacity.buildings / 100 }}>{dimension === '3d' ? <><path d={`M-8 0 l8 -5 8 5 v${-h} l-8 -5 -8 5z`}/><path d={`M8 ${-h} l8 5 v${h} l-8 -5z`}/></> : <rect x="-6" y="-4" width="12" height="8"/>}</g>; })}
            {!street && layers.links && edges.map(([a, b], i) => { const source = sites[a]!, target = sites[b]!, p = mapPoint(source.lat, source.lon, mapZoom), q = mapPoint(target.lat, target.lon, mapZoom); const d = roundedPath(roadPath([source.lon, source.lat], [target.lon, target.lat], i * 11 + 3).map((c) => mapPoint(c[1], c[0], mapZoom)), 10), critical = i === 3, edgeId = critical ? 'ENL-042' : i === 0 ? 'ENL-018' : `ENL-${String(18 + i * 7).padStart(3, '0')}`, related = selectedNode && (source.id === selectedNode.id || target.id === selectedNode.id || connectedNodes.has(source.id) || connectedNodes.has(target.id)); const isRoute = routeAnalysis && (i === 2 || i === 3); return <g key={`${a}-${b}`} className="map-edge-hit" onClick={(e) => { e.stopPropagation(); pick(edgeId); }} role="button" tabIndex={0} aria-label={`Trecho ${edgeId}, ${source.name} para ${target.name}, ${critical ? 'degradado' : 'normal'}`} style={{ opacity: layerOpacity.links / 100 * (dependency && selectedNode && !related ? .16 : 1) }}><path d={d} fill="none" strokeLinejoin="round" strokeLinecap="round" className={`map-edge${critical ? ' is-critical' : ''}${selected === edgeId ? ' is-selected' : ''}${isRoute ? ' is-route' : ''}${layers.traffic ? ' is-flowing' : ''}`} style={{ strokeWidth: `${critical ? 2.6 : 1.3 + (i % 3) * .4}` }}/>{layers.traffic && <path d={d} fill="none" className="map-flow-particles"/>}<title>{edgeId} · {source.name} → {target.name} · capacidade 40 Gbps · utilização {critical ? '91% · crítico' : '63% · normal'}</title></g>; })}
            {routeAnalysis && <g className="map-route-caption"><rect x="456" y="92" width="268" height="64" rx="5"/><text x="470" y="112">ROTA PRINCIPAL · BARUERI → OSASCO</text><text x="470" y="132">21 ms · gargalo ENL-042 · alternativa via Lapa</text></g>}
            {dependency && selectedNode && <g className="map-dependency-caption"><rect x="456" y="166" width="268" height="48" rx="5"/><text x="470" y="185">IMPACTO DE {selectedNode.id}</text><text x="470" y="202">{connectedNodes.size} ativos conectados · 3 serviços dependentes</text></g>}
            {!street && layers.sites && sites.map((s) => { const p = mapPoint(s.lat, s.lon, mapZoom), related = s.id === selected || connectedNodes.has(s.id), health = currentHealth(s); return <g key={s.id} className={`map-site${time === 'live' && health !== 'Normal' ? ' has-live-pulse' : ''}`} transform={`translate(${p.x} ${p.y})`} onClick={(e) => { e.stopPropagation(); pick(s.id); }} role="button" tabIndex={0} aria-label={`${s.id} ${s.name}, ${health}`} style={{ opacity: (dependency && selectedNode && !related ? .18 : layerOpacity.sites / 100) * (layers.health ? layerOpacity.health / 100 : 1) }}><circle r={selected === s.id ? 9 : 7} className={`map-node${layers.health ? ` node-${health.toLowerCase()}` : ''}${selected === s.id ? ' is-selected' : ''}`} /><circle r="2.2" className="map-node-core"/><text x="10" y="-7">{s.name}</text><title>{s.id} · {health} · utilização {s.load}% · capacidade {s.capacity} · latência {s.latency}</title></g>; })}
            {layers.incidents && aggregation === 'Calor' && shownIncidents.map((inc) => { const s = sites.find((x) => x.name === inc.region)!; const p = mapPoint(s.lat, s.lon, mapZoom); return <circle key={`heat-${inc.id}`} cx={p.x} cy={p.y} r={severity === 'Todas' ? 42 : 30} className="map-heat" style={{ opacity: layerOpacity.incidents / 100 }}/>; })}
            {layers.incidents && aggregation === 'Hexbin' && shownIncidents.map((inc, i) => { const s = sites.find((x) => x.name === inc.region)!; const p = mapPoint(s.lat, s.lon, mapZoom); return <g key={`hex-${inc.id}`} transform={`translate(${p.x} ${p.y})`} onClick={(e) => { e.stopPropagation(); pick(inc.id); }} role="button" tabIndex={0} aria-label={`Hexágono com incidentes próximos a ${inc.region}`}><path className="map-hexbin" d="M-18 -10 L0 -20 L18 -10 L18 10 L0 20 L-18 10Z"/><text className="map-aggregate-count" textAnchor="middle" y="4">{i ? '1' : '2'}</text></g>; })}
            {layers.incidents && (aggregation === 'Clusters' && mapZoom < 13 || aggregation === 'Calor' && mapZoom >= 12 && mapZoom < 14) && incidentClusters.map((cluster) => <g key={`cluster-${cluster.id}`} transform={`translate(${cluster.x} ${cluster.y})`} onClick={(e) => { e.stopPropagation(); pick(cluster.id); }} role="button" tabIndex={0} aria-label={`Cluster de ${cluster.count} incidentes`}><circle className="map-cluster" r={cluster.count > 1 ? 18 : 14}/><text className="map-aggregate-count" textAnchor="middle" y="4">{cluster.count}</text></g>)}
            {layers.incidents && (aggregation === 'Pontos' || aggregation === 'Clusters' && mapZoom >= 13 || aggregation === 'Calor' && mapZoom >= 14) && shownIncidents.map((inc) => { const s = sites.find((x) => x.name === inc.region)!; const p = mapPoint(s.lat, s.lon, mapZoom); return <g key={inc.id} transform={`translate(${p.x + 10} ${p.y - 8})`} onClick={(e) => { e.stopPropagation(); pick(inc.id); }} role="button" tabIndex={0} aria-label={`${inc.id}, ${inc.type}`} style={{ opacity: layerOpacity.incidents / 100 }}><path className={`map-incident${time === 'live' ? ' is-new' : ''}`} d="M0 -7 L7 0 L0 7 L-7 0Z"/><text x="9" y="4">{inc.id}</text></g>; })}
            {tool !== 'select' && <g className={`map-spatial-overlay tool-${tool}`}><rect x="160" y="130" width="355" height="208" rx="12"/><path d="M195 192 L278 145 L407 177 L448 271 L329 324 L214 284Z"/><path className="map-measure-line" d="M230 260 L465 175"/><circle cx="344" cy="230" r="112"/><text x="190" y="355">{tool === 'measure' ? 'Distância medida · 2,4 km' : 'Clique no mapa para definir a área · Esc para cancelar'}</text></g>}
            {spatialSummary && <g className="map-spatial-summary"><rect x="24" y="372" width="260" height="92" rx="6"/><text x="40" y="395">SELEÇÃO ESPACIAL · RAIO 2 KM</text><text x="40" y="417">24 ativos · 8 incidentes · 3 críticos</text><text x="40" y="441">Analisar seleção  →</text></g>}
            {street && sites.map((s) => { const p = mapPoint(s.lat, s.lon, mapZoom); return <g key={`street-site-${s.id}`} transform={`translate(${p.x} ${p.y})`} onClick={(e) => { e.stopPropagation(); pick(s.id); }} className="map-street-site" role="button" tabIndex={0}><circle r="6"/><title>Infraestrutura {s.name} · capacidade de rede {s.capacity}</title></g>; })}
          </svg>
          {!layers.links && !layers.sites && !layers.incidents && !layers.traffic && !layers.buildings && <div className="map-empty-state"><Icon name="layers" size={20}/><b>Nenhuma camada operacional selecionada</b><span>Ative sites, enlaces ou incidentes para explorar esta área.</span><Button size="sm" onPress={() => { setLayers((s) => ({ ...s, sites: true, links: true })); setContextOpen(true); }}>Abrir camadas</Button></div>}
          <div className="map-float-controls"><button aria-label="Aproximar" onClick={() => setMapZoom((z) => Math.min(15, z + 1))}>+</button><button aria-label="Afastar" onClick={() => setMapZoom((z) => Math.max(9, z - 1))}>−</button><button aria-label="Enquadrar área" onClick={() => setMapZoom(11)}><Icon name="fit" size={12}/></button><button aria-label="Localizar região" onClick={() => setMapZoom(12)}><Icon name="target" size={12}/></button></div>
          <div className="map-mini-status"><i className={time === 'live' ? 'is-live' : ''}/> OSM · {mapZoom}z · 428k registros de demonstração</div>
          {tileError && layers.streets && <div className="map-tile-error"><b>Cartografia indisponível no momento</b><span>As camadas operacionais continuam disponíveis nesta cena.</span><button onClick={() => { setTileError(false); setMapZoom((z) => z === 11 ? 12 : 11); }}>Tentar carregar novamente</button></div>}
          <div className="map-attribution">© OpenStreetMap contributors · cartografia demonstrativa</div>
          {transitioning && <div className="map-loading"><span/><b>Atualizando camadas espaciais</b></div>}
          {routeAnalysis && <div className="map-route-card"><button aria-label="Fechar análise de rota" onClick={() => setRouteAnalysis(false)}><Icon name="close" size={12}/></button><b>Rota principal</b><span>Barueri → Osasco · 14,8 km</span><small>21 ms · gargalo em ENL-042</small><span className="route-alt">Alternativa: Lapa → Osasco · 24 ms</span></div>}
          {spatialSummary && <div className="map-selection-card"><b>Seleção espacial · 24 ativos</b><span>17 saudáveis · 5 atenção · 2 críticos</span><Button size="sm" icon="copilot" onPress={() => { setDrawer(true); setExplanation(true); }}>Analisar seleção</Button></div>}
        </div> : <table className="bw-table map-data-table"><thead><tr><th>Identificador</th><th>Origem → destino / local</th><th>Utilização</th><th>Saúde</th><th>Região</th></tr></thead><tbody>{[['ENL-042','Barueri → Osasco','91%','Crítico','Oeste'],['ENL-018','Lapa → Paulista','63%','Normal','Centro'],['ENL-031','Paulista → Santo Amaro','67%','Normal','Sul'],['ENL-056','Paulista → Itaquera','79%','Atenção','Leste'],...sites.map((s) => [s.id,s.name,`${s.load}%`,s.health,'São Paulo'])].map((r) => <tr key={r[0]} onClick={() => pick(r[0]!)} aria-selected={selected === r[0]}><td className="bw-mono">{r[0]}</td>{r.slice(1).map((x) => <td key={x}>{x}</td>)}</tr>)}</tbody></table>}
        {drawer && chosen && <aside className="map-entity-drawer"><button className="map-drawer-close" aria-label="Fechar detalhe" onClick={() => setDrawer(false)}><Icon name="close" size={12}/></button><span className="map-mini-label">{incidents.some((x) => x.id === selected) ? 'Incidente' : selected.startsWith('BLD') ? 'Edifício / ativo urbano' : selected.startsWith('POP') ? 'Site / POP' : 'Trecho de rede'}</span><h2>{'name' in chosen ? chosen.name : chosen.type}</h2><code>{selected}</code><Badge tone={selected === 'ENL-042' || ('health' in chosen && chosen.health === 'Crítico') ? 'danger' : 'success'}>{'health' in chosen ? chosen.health : 'severity' in chosen ? chosen.severity : 'Operacional'}</Badge>{'load' in chosen ? <div className="map-inspector-grid"><span>Utilização<b>{chosen.load}%</b></span><span>Capacidade<b>{chosen.capacity}</b></span><span>Latência<b>{chosen.latency}</b></span><span>Incidentes<b>{chosen.id === 'POP-BARUERI' ? '2 ativos' : '0 ativos'}</b></span></div> : 'utilization' in chosen ? <div className="map-inspector-grid"><span>Uso<b>{chosen.utilization}</b></span><span>Capacidade<b>{chosen.capacity}</b></span><span>Latência<b>{chosen.latency}</b></span><span>Perda de pacotes<b>1,4%</b></span><span>Responsável<b>{chosen.owner}</b></span></div> : <p>{'region' in chosen ? `${chosen.region} · ${chosen.time} · severidade ${chosen.severity}` : 'Infraestrutura demonstrativa · capacidade 12 Gbps'}</p>}<div className="map-inspector-actions"><Button size="sm" onPress={() => setDependency((v) => !v)} icon="model">{dependency ? 'Ocultar dependências' : 'Ver dependências'}</Button><Button size="sm" icon="timeline" onPress={() => { setTime('replay'); setCursor(48); }}>Histórico</Button>{aiEnabled && <Button size="sm" icon="copilot" onPress={() => setExplanation((v) => !v)}>{explanation ? 'Fechar análise' : 'Analisar com Copilot'}</Button>}</div>{explanation && <p className="map-explanation"><b>Contexto do mapa selecionado:</b> {selected} está no viewport de São Paulo. {selected === 'ENL-042' ? 'Uso 87%, latência 21 ms e dois incidentes associados.' : 'Dados de demonstração; verifique relações e telemetria antes de concluir causalidade.'}</p>}<Button size="sm" variant="primary" onPress={() => navigate({ to: '/reports/$reportId', params: { reportId: selected.startsWith('INC') ? 'net_incidentes' : street ? 'net_gemeo' : 'net_operacoes' } })}>Abrir relatório de evidências</Button></aside>}
      </section>
    </div>
    <div className={`map-timebar${timelineOpen ? '' : ' is-collapsed'}`}><div className="map-time-head"><button className="map-timeline-toggle" aria-expanded={timelineOpen} onClick={() => setTimelineOpen((v) => !v)}><Icon name="chevronDown" size={12}/></button><b>Histórico operacional</b><span className="map-time-state">{time === 'live' ? 'Live · atualizado há 4 s' : time === 'paused' ? 'Live pausado · 07/10/2026 08:14' : `Replay · 07/10/2026 0${Math.floor(cursor / 4)}:${String((cursor % 4) * 15).padStart(2, '0')}`}</span><span className="flex-1"/><button onClick={() => { setCursor((v) => Math.max(0, v - 4)); setTime('replay'); }} aria-label="Evento anterior">|◀</button><button onClick={() => setTime(time === 'replay' ? 'paused' : 'replay')}><Icon name={time === 'replay' ? 'play' : 'clock'} size={12}/>{time === 'replay' ? 'Pausar' : 'Reproduzir'}</button><button onClick={() => { setCursor((v) => Math.min(95, v + 4)); setTime('replay'); }} aria-label="Próximo evento">▶|</button><select aria-label="Velocidade do replay" value={`${playSpeed.toString().replace('.', ',')}x`} onChange={(e) => setPlaySpeed(Number(e.target.value.replace('x', '').replace(',', '.')))}><option>0,5x</option><option>1x</option><option>2x</option></select><button className={time === 'live' ? 'is-active' : ''} onClick={() => setTime(time === 'live' ? 'paused' : 'live')}>● Live</button><button onClick={() => { setTime('live'); setCursor(95); }}>Retornar ao vivo</button></div>
      {timelineOpen && <><div className="map-histogram" aria-label="Timeline de incidentes nas últimas 24 horas">{[14, 23, 19, 35, 26, 48, 33, 55, 38, 70, 49, 84, 61, 96, 58, 43, 69, 50, 78, 36, 62, 43, 25, 17].map((h, i) => <i key={i} style={{ height: `${h}%`, opacity: i <= cursor / 4 ? 1 : .35 }} />)}<input aria-label="Instante do histórico" type="range" min="0" max="95" value={cursor} onChange={(e) => { setCursor(Number(e.target.value)); setTime('replay'); }} /></div><div className="map-time-labels"><span>07/10 · 00:00</span><span>Timeline · 15 min por marca · incidentes e mudanças de estado</span><span>07/10 · 23:59</span></div></>}
    </div>
  </div>;
}

/** Shared builder for the five operational reports; preserve legacy deep analysis views. */
export function MapWorkspace(props: { incident?: boolean; street?: boolean; dependencyMode?: boolean; replay?: boolean }) {
  if (props.dependencyMode || props.replay) return <LegacyMapWorkspace {...props} />;
  return <MapBuilder key={props.street ? 'lights' : props.incident ? 'incidents' : 'network'} initial={props.street ? 'lights' : props.incident ? 'incidents' : 'network'} />;
}
