import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Badge, Button, Icon, NumberField, SegmentedControl, Select, Switch, TextField } from '@biweb/ui';
import { useData } from '../../data/registry';
import { useUi } from '../../state/ui-store';
import type { Row } from '../../data/types';
import { COLORS, DEMO_DATASET, REPORTS, STATUS, TIMELINES, compactDocument, createDocument, distanceKm, formatTime, isMapDocument, layer, mapRows, relatedRows, restoreDocument, severity } from './model';
import type { Feature, Layer, MapDocument, Mapping, ReportId } from './model';
import { deriveFeature } from './derive';
import { GeoCanvas, defaultCamera } from './GeoCanvas';
import type { Camera, Pick } from './GeoCanvas';
import { FieldConsole, FieldHud, FieldLayer, FieldProvider } from './FieldOps';
import { MapInsights } from './Insights';
import type { LightsMode } from './LightsLayer';
import { RouteOverlay } from './overlays';
import { reroute } from './network-tools';
import { legendFor } from './legend';
import { HIDDEN_PROPS, formatProp, propLabel } from './labels';
import { parseCSV, parseGeoJSON, parseKML } from './import';
import './map-builder.css';
import './map-extras.css';

const STORAGE = 'biweb.map-builder.v2';
const opts = (values: string[]) => values.map((v) => ({ id: v, label: v }));
function readDocs(): Partial<Record<ReportId, MapDocument>> {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE) ?? '{}');
    return Object.fromEntries(Object.entries(data).filter(([id, value]) => isMapDocument(value) && value.id === id).map(([id, value]) => [id, restoreDocument(value as MapDocument)]));
  } catch { return {}; }
}
function download(doc: MapDocument) { const url = URL.createObjectURL(new Blob([JSON.stringify(compactDocument(doc), null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = `biweb-${doc.id}.json`; a.click(); URL.revokeObjectURL(url); }
type Proposal = { title: string; description: string; apply: (d: MapDocument) => MapDocument };
type PanelKind = 'insights' | 'layers' | 'data' | 'copilot' | null;
const SUGGESTIONS: Record<ReportId, string[]> = {
  network: ['Crie uma visão 3D da rede OPS', 'Crie quatro faixas para atenuação'],
  lights: ['Relacione postes com manutenções', 'Mostre apenas postes com manutenção vencida', 'Adicione a tabela usando latitude e longitude'],
  theft: ['Mostre um heatmap das ocorrências', 'Adicione a tabela usando latitude e longitude'],
  incidents: ['Mostre um heatmap das ocorrências', 'Crie uma visão 3D da rede OPS'],
  field: ['Crie uma visão 3D da rede OPS', 'Adicione a tabela usando latitude e longitude'],
  coverage: ['Crie uma visão 3D da rede OPS', 'Adicione a tabela usando latitude e longitude'],
  expansion: ['Adicione a tabela usando latitude e longitude'],
  weather: ['Adicione a tabela usando latitude e longitude'],
};
const SPEEDS = [{ id: '1', label: '1×' }, { id: '2', label: '2×' }, { id: '4', label: '4×' }];

export function MapBuilder({ initial = 'network', onNavigate }: { initial?: ReportId; onNavigate?: (id: ReportId) => void }) {
  const [docs, setDocs] = useState(() => readDocs());
  const [id, setId] = useState<ReportId>(initial);
  const doc = useMemo(() => docs[id] ?? createDocument(id), [docs, id]);
  const spec = TIMELINES[id];
  const flight = useRef(0), wsRef = useRef<HTMLDivElement>(null), fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => () => cancelAnimationFrame(flight.current), []);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [panel, setPanel] = useState<PanelKind>(initial === 'field' ? null : 'insights');
  const [camera, setCamera] = useState<Camera>(() => defaultCamera(initial));
  const [selection, setSelection] = useState<Pick | null>(null);
  const [activeLayer, setActiveLayer] = useState('');
  const [filter, setFilter] = useState(docs[initial]?.scope?.status ?? 'Todos'), [region, setRegion] = useState(docs[initial]?.scope?.region ?? 'Todas'), [type, setType] = useState(docs[initial]?.scope?.type ?? 'Todos');
  const [route, setRoute] = useState(docs[initial]?.scope?.route ?? 'Todas');
  const [hour, setHour] = useState(docs[initial]?.scope?.hour ?? TIMELINES[initial]?.start ?? 23);
  const [playing, setPlaying] = useState(false), [speed, setSpeed] = useState(1);
  const [marker, setMarker] = useState(false), [radius, setRadius] = useState(0), [table, setTable] = useState(false), [search, setSearch] = useState('');
  const [notice, setNotice] = useState(''), [dirty, setDirty] = useState(false), [loading, setLoading] = useState(false);
  const [request, setRequest] = useState(''), [proposal, setProposal] = useState<Proposal | null>(null), [analysis, setAnalysis] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [lightsMode, setLightsMode] = useState<LightsMode>('night');
  const [cut, setCut] = useState<string | null>(null);
  const [relationTable, setRelationTable] = useState('manutencoes'), [ownKey, setOwnKey] = useState('id'), [foreignKey, setForeignKey] = useState('poste_id');
  const [relationsOpen, setRelationsOpen] = useState(true);
  const [history, setHistory] = useState(false), [orders, setOrders] = useState<Record<string, Row[]>>({});
  const [importRows, setImportRows] = useState<Row[] | null>(null), [importName, setImportName] = useState('');
  const datasets = useData((s) => s.datasets), aiEnabled = useUi((s) => s.aiEnabled);
  const sources = useMemo(() => [DEMO_DATASET, ...datasets], [datasets]);
  const [datasetId, setDatasetId] = useState(DEMO_DATASET.id), [tableId, setTableId] = useState('postes');
  const dataset = sources.find((s) => s.id === datasetId) ?? DEMO_DATASET;
  const sourceTable = dataset.tables.find((t) => t.id === tableId) ?? dataset.tables[0]!;
  const [mapping, setMapping] = useState<Mapping>({ latitude: 'latitude', longitude: 'longitude', label: 'nome', color: 'status' });
  const rows = importRows ?? sourceTable.rows;
  const fields = importRows ? Object.keys(importRows[0] ?? {}) : sourceTable.fields.map((f) => f.name);
  const mapped = useMemo(() => mapRows(rows, mapping, sourceTable.key), [rows, mapping, sourceTable.key]);
  const report = REPORTS.find((r) => r.id === id)!;
  const update = (fn: (d: MapDocument) => MapDocument) => { setDocs((prev) => ({ ...prev, [id]: fn(prev[id] ?? createDocument(id)) })); setDirty(true); };
  const updateLayer = (layerId: string, patch: Partial<Layer>) => update((d) => ({ ...d, layers: d.layers.map((l) => l.id === layerId ? { ...l, ...patch } : l) }));
  const openPanel = (next: PanelKind) => { setPanel((current) => current === next ? null : next); setSelection(null); setActiveLayer(''); };

  /** Camera flight: pan and zoom together, eased; instant for users who prefer reduced motion. */
  const flyTo = useCallback((lon: number, lat: number, zoom: number) => {
    cancelAnimationFrame(flight.current);
    const from = { ...camera }, duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 520, start = performance.now();
    const frame = (t: number) => { const k = duration ? Math.min(1, (t - start) / duration) : 1, e = 1 - (1 - k) ** 3; setCamera({ lon: from.lon + (lon - from.lon) * e, lat: from.lat + (lat - from.lat) * e, zoom: from.zoom + (zoom - from.zoom) * e }); if (k < 1) flight.current = requestAnimationFrame(frame); };
    flight.current = requestAnimationFrame(frame);
  }, [camera]);
  const centerOf = (f: Feature) => f.geometry.coordinates[Math.floor(f.geometry.coordinates.length / 2)]!;
  const focus = (f: Feature, zoom = 13) => { const q = centerOf(f); flyTo(q[0]!, q[1]!, zoom); };
  const focusRoute = (next: string) => {
    setRoute(next);
    if (next === 'Todas') { reset(); return; }
    const points = doc.layers.flatMap((l) => l.features.filter((f) => f.geometry.type === 'LineString' && f.properties.rota === next).flatMap((f) => f.geometry.coordinates));
    if (points.length) {
      const lon = points.reduce((sum, p) => sum + p[0]!, 0) / points.length;
      const lat = points.reduce((sum, p) => sum + p[1]!, 0) / points.length;
      const span = Math.max(...points.map((p) => p[0]!)) - Math.min(...points.map((p) => p[0]!));
      flyTo(lon, lat, Math.max(11.2, Math.min(13, 12 - Math.log2(Math.max(span, .025) / .08))));
    }
  };
  const pick = (p: Pick) => { const l = doc.layers.find((x) => x.id === p.layerId), f = l?.features.find((x) => x.id === p.featureId); if (!f || !l) return; setSelection(p); setActiveLayer(l.id); setAnalysis(false); if (l.click === 'focus') focus(f, Math.max(camera.zoom, 14)); };
  const reset = () => { const c = defaultCamera(id); flyTo(c.lon, c.lat, c.zoom); };
  const changeReport = (next: ReportId) => {
    cancelAnimationFrame(flight.current);
    setDocs((prev) => ({ ...prev, [id]: { ...doc, scope: { status: filter, region, type, route, hour } } }));
    setId(next); setSelection(null); setActiveLayer(''); setCamera(defaultCamera(next));
    setFilter(docs[next]?.scope?.status ?? 'Todos'); setRegion(docs[next]?.scope?.region ?? 'Todas'); setType(docs[next]?.scope?.type ?? 'Todos'); setRoute(docs[next]?.scope?.route ?? 'Todas'); setHour(docs[next]?.scope?.hour ?? TIMELINES[next]?.start ?? 23);
    setPlaying(false); setProposal(null); setRadius(0); setSearch(''); setTable(false); setLoading(true); setCut(null); setLightsMode('night'); setPanel(next === 'field' ? null : 'insights'); setMode('view');
    onNavigate?.(next);
  };
  useEffect(() => { if (initial !== id) changeReport(initial); }, [initial]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!loading) return; const timer = setTimeout(() => setLoading(false), 350); return () => clearTimeout(timer); }, [loading]);
  useEffect(() => {
    if (!playing || !spec) return;
    const timer = setInterval(() => setHour((h) => { const next = h + spec.step; return next > spec.max ? spec.min : next; }), spec.playMs / speed);
    return () => clearInterval(timer);
  }, [playing, spec, speed]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 7000); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { if (!dirty) return; const handler = (e: BeforeUnloadEvent) => e.preventDefault(); window.addEventListener('beforeunload', handler); return () => window.removeEventListener('beforeunload', handler); }, [dirty]);

  // Full screen: the browser's Fullscreen API when allowed, a fixed layer otherwise. Esc leaves either.
  const toggleFullscreen = () => {
    if (fullScreen) { setFullScreen(false); if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined); return; }
    setFullScreen(true);
    try { void wsRef.current?.requestFullscreen?.().catch(() => undefined); } catch { /* the fixed layer is the fallback */ }
  };
  useEffect(() => {
    const onChange = () => { if (!document.fullscreenElement) setFullScreen(false); };
    document.addEventListener('fullscreenchange', onChange); return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key !== 'Escape') return; setMarker(false); setProposal(null); setSelection(null); if (fullScreen && !document.fullscreenElement) setFullScreen(false); };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, [fullScreen]);
  useEffect(() => { document.body.classList.toggle('mb-has-fullscreen', fullScreen); return () => document.body.classList.remove('mb-has-fullscreen'); }, [fullScreen]);

  const previewDoc = proposal ? proposal.apply(doc) : doc;
  const visibleLayers = useMemo(() => previewDoc.layers.map((l) => ({
    ...l,
    features: l.features.map((f) => deriveFeature(id, previewDoc, l, f, hour)).filter((f) => {
      const p = f.properties, timeValue = spec?.filterProp ? p[spec.filterProp] : undefined;
      return (filter === 'Todos' || String(p.status) === filter) && (region === 'Todas' || String(p.regiao) === region) && (type === 'Todos' || String(p.tipo) === type)
        && (route === 'Todas' || !p.rota || p.rota === route) && (!previewDoc.overdueOnly || p.vencida === true) && (typeof timeValue !== 'number' || timeValue <= hour);
    }),
  })), [previewDoc, id, hour, spec, filter, region, type, route]);
  const visible = useMemo(() => visibleLayers.filter((l) => l.visible).flatMap((l) => l.features), [visibleLayers]);
  const all = useMemo(() => doc.layers.flatMap((l) => l.features), [doc]);
  const chosenLayer = doc.layers.find((l) => l.id === (selection?.layerId ?? activeLayer));
  const chosen = chosenLayer?.features.find((f) => f.id === selection?.featureId);
  const shown = chosen && chosenLayer ? visibleLayers.find((l) => l.id === chosenLayer.id)?.features.find((f) => f.id === chosen.id) ?? chosen : undefined;
  const rawDataset = sources.find((s) => s.id === chosenLayer?.dataset);
  const selectedDataset = rawDataset ? { ...rawDataset, relationships: [...rawDataset.relationships, ...(doc.relationships?.[rawDataset.id] ?? [])] } : undefined;
  const relationships = chosen && chosenLayer && selectedDataset && doc.related ? relatedRows(selectedDataset, chosenLayer.table, { ...chosen.properties, id: chosen.id }) : [];
  const nearby = chosen && radius ? doc.layers.flatMap((l) => l.features.filter((f) => f.geometry.type === 'Point' && f.id !== chosen.id).map((f) => ({ f, layer: l.name, distance: distanceKm(chosen.geometry.coordinates[0]!, f.geometry.coordinates[0]!) }))).filter((x) => x.distance <= radius).sort((a, b) => a.distance - b.distance) : [];
  const hits = search.trim() ? doc.layers.flatMap((l) => l.features.filter((f) => `${f.id} ${String(f.properties[l.label] ?? '')}`.toLowerCase().includes(search.toLowerCase())).slice(0, 6).map((f) => ({ l, f }))).slice(0, 6) : [];
  const statuses = useMemo(() => [...new Set(visibleLayers.flatMap((l) => l.features).map((f) => String(f.properties.status ?? '')).filter(Boolean))], [visibleLayers]);
  const regions = useMemo(() => [...new Set(all.map((f) => String(f.properties.regiao ?? '')).filter(Boolean))], [all]);
  const types = useMemo(() => [...new Set(all.map((f) => String(f.properties.tipo ?? '')).filter(Boolean))], [all]);
  const links = useMemo(() => doc.layers.find((l) => l.table === 'trechos')?.features ?? [], [doc]);
  const clientsByStation = useMemo(() => Object.fromEntries((doc.layers.find((l) => l.table === 'estacoes')?.features ?? []).map((f) => [String(f.properties.nome), Number(f.properties.clientes ?? 0)])), [doc]);
  const rerouted = useMemo(() => id === 'network' && cut ? reroute(links, cut, clientsByStation) : null, [id, cut, links, clientsByStation]);
  const legend = legendFor(doc, lightsMode);

  const addLayer = (l: Layer) => { update((d) => ({ ...d, layers: [...d.layers, { ...l, id: `${l.id}-${Date.now()}` }] })); setNotice(`${l.features.length} feições adicionadas ao mapa.`); };
  const save = () => {
    try { localStorage.setItem(STORAGE, JSON.stringify(Object.fromEntries(Object.entries({ ...docs, [id]: { ...doc, scope: { status: filter, region, type, route, hour } } }).map(([k, d]) => [k, compactDocument(d as MapDocument)])))); setDirty(false); setNotice('Mapa salvo neste navegador. Reabra-o pela galeria de mapas.'); }
    catch { setNotice('Não foi possível salvar: armazenamento indisponível ou cheio. Exporte a configuração para preservar seu trabalho.'); }
  };
  const addMapped = () => { if (!mapped.features.length) return; const l = layer(importName || sourceTable.name, mapped.features, importRows ? '' : sourceTable.id); l.dataset = importRows ? 'import' : dataset.id; l.label = mapping.label; l.colorBy = mapping.color; addLayer(l); focus(mapped.features[0]!, 12); };
  const importFile = async (file: File) => {
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('Limite desta demonstração: 10 MB por arquivo.');
      const ext = file.name.split('.').at(-1)?.toLowerCase();
      if (['kmz', 'xlsx', 'xls', 'parquet', 'shp', 'gpkg'].includes(ext ?? '')) throw new Error(`${ext?.toUpperCase()} está previsto no fluxo de ingestão. Nesta versão, converta para GeoJSON, KML ou CSV antes de importar; nenhum dado foi criado.`);
      const text = await file.text();
      if (ext === 'csv') {
        const parsed = parseCSV(text); if (!parsed.length) throw new Error('Arquivo sem linhas de dados.');
        setImportRows(parsed); setImportName(file.name);
        setMapping({ latitude: Object.keys(parsed[0]!).find((k) => /^(lat|latitude)$/i.test(k)) ?? '', longitude: Object.keys(parsed[0]!).find((k) => /^(lon|lng|longitude)$/i.test(k)) ?? '', label: Object.keys(parsed[0]!)[0] ?? '', color: 'status' });
        setPanel('data'); setNotice('CSV lido. Revise o mapeamento antes de adicionar ao mapa.');
      } else {
        if (ext === 'json') {
          const config = JSON.parse(text);
          if (config.version === 1) {
            if (!isMapDocument(config)) throw new Error('Configuração de mapa inválida.');
            const restored = restoreDocument(config);
            setDocs((prev) => ({ ...prev, [config.id]: restored })); setId(config.id); setSelection(null); setActiveLayer(''); setCamera(defaultCamera(config.id));
            setFilter(config.scope?.status ?? 'Todos'); setRegion(config.scope?.region ?? 'Todas'); setType(config.scope?.type ?? 'Todos'); setRoute(config.scope?.route ?? 'Todas'); setHour(config.scope?.hour ?? TIMELINES[config.id as ReportId]?.start ?? 23);
            setDirty(true); setNotice('Configuração reaberta. Salve para reutilizar neste navegador.'); onNavigate?.(config.id); return;
          }
        }
        const features = ext === 'kml' ? parseKML(text) : parseGeoJSON(text);
        if (!features.length) throw new Error('Arquivo sem feições.');
        const l = layer(file.name, features); l.dataset = 'import'; addLayer(l); focus(features[0]!, 12);
      }
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Não foi possível importar o arquivo.'); }
  };
  const propose = (text: string) => {
    setRequest(text); const q = text.toLowerCase(); let next: Proposal | null = null;
    if (/por que|analis|próxim|proxim/.test(q) && chosen) { setAnalysis(true); setRadius(3); return; }
    if (/heatmap|calor/.test(q)) next = { title: 'Visualizar concentração', description: 'Alterar a agregação para Heatmap, preservando as camadas e os filtros.', apply: (d) => ({ ...d, aggregation: 'Heatmap' }) };
    else if (/3d|2.5d/.test(q)) next = { title: 'Perspectiva da operação', description: 'Ativar perspectiva 2.5D e volumes simbólicos dos ativos.', apply: (d) => ({ ...d, dimension: '3d', basemap: 'Dark' }) };
    else if (/faixa|atenua|vermelh|crític/.test(q)) next = { title: 'Condições do sinal', description: 'Normal <12 dB · Atenção 12–18 · Crítico 18–24 · Urgente ≥24. Aplicar cores semânticas aos trechos.', apply: (d) => ({ ...d, bands: [12, 18, 24], layers: d.layers.map((l) => ({ ...l, colorBy: 'status' })) }) };
    else if (/vencid/.test(q)) next = { title: 'Manutenção vencida', description: 'Filtrar os postes com manutenção vencida, preservando os dados da camada.', apply: (d) => ({ ...d, overdueOnly: true, layers: d.layers.some((l) => l.table === 'postes') ? d.layers : [...d.layers, createDocument('lights').layers[0]!] }) };
    else if (/relacion|manuten/.test(q)) next = { title: 'Postes → manutenções', description: 'Adicionar postes e habilitar a relação manutencoes.poste_id → postes.id no Inspector.', apply: (d) => ({ ...d, related: true, layers: d.layers.some((l) => l.table === 'postes') ? d.layers : [...d.layers, createDocument('lights').layers[0]!] }) };
    else if (/tabela|latitude|longitude|ocorr/.test(q)) {
      const inferred = /ocorr/.test(q) ? DEMO_DATASET.tables.find((t) => t.id === 'ocorrencias') : undefined;
      const points = inferred ? mapRows(inferred.rows, { latitude: 'latitude', longitude: 'longitude', label: 'nome', color: 'status' }, inferred.key).features : mapped.features;
      if (!points.length) { setNotice('Mapeie latitude e longitude no painel Tabela → mapa antes de criar o preview.'); return; }
      const proposalId = `copilot-${Date.now()}`;
      next = { title: 'Tabela → mapa', description: `Adicionar ${points.length} pontos de ${inferred?.name ?? (importName || sourceTable.name)}. Os dados de origem e suas relações serão preservados.`, apply: (d) => ({ ...d, layers: [...d.layers, { ...layer(inferred?.name ?? (importName || sourceTable.name), points, inferred?.id ?? sourceTable.id), id: proposalId, dataset: inferred ? DEMO_DATASET.id : dataset.id, label: inferred ? 'nome' : mapping.label, colorBy: inferred ? 'status' : mapping.color }] }) };
    }
    if (!next) { setNotice('Copilot demonstrativo: use uma das sugestões ou configure a operação pelo Builder. Esse pedido ainda não tem uma ação disponível.'); return; }
    setProposal(next); setPanel('copilot');
  };
  const updateProperty = (name: string, value: unknown) => { if (!chosen || !chosenLayer) return; updateLayer(chosenLayer.id, { features: chosenLayer.features.map((f) => f.id === chosen.id ? { ...f, properties: { ...f.properties, [name]: value } } : f) }); };
  const coordinate = (axis: 0 | 1, value: number) => { if (!chosen || !chosenLayer || !Number.isFinite(value)) return; const coords = [...chosen.geometry.coordinates[0]!]; coords[axis] = value; updateLayer(chosenLayer.id, { features: chosenLayer.features.map((f) => f.id === chosen.id ? { ...f, geometry: { ...f.geometry, coordinates: [coords] }, properties: { ...f.properties, [axis === 0 ? 'longitude' : 'latitude']: value } } : f) }); };
  const linkTables = () => {
    const target = dataset.tables.find((t) => t.id === relationTable);
    if (!target || !ownKey || !foreignKey) { setNotice('Escolha as tabelas e os campos da relação.'); return; }
    const values = sourceTable.rows.map((r) => r[ownKey]);
    if (values.some((v) => v == null) || new Set(values.map(String)).size !== values.length) { setNotice('O campo da tabela geográfica deve ser uma chave única e preenchida (lado 1).'); return; }
    const matches = target.rows.filter((r) => r[foreignKey] != null && values.some((v) => String(v) === String(r[foreignKey]))).length;
    if (!matches) { setNotice('Nenhum registro corresponde a essas chaves. Revise os campos antes de relacionar.'); return; }
    const relation = { from: `${target.id}.${foreignKey}`, to: `${sourceTable.id}.${ownKey}`, label: `${target.name} → ${sourceTable.name}` };
    if ([...dataset.relationships, ...(doc.relationships?.[dataset.id] ?? [])].some((r) => r.from === relation.from && r.to === relation.to)) { setNotice('Essa relação já está disponível no Inspector.'); return; }
    update((d) => ({ ...d, related: true, relationships: { ...d.relationships, [dataset.id]: [...(d.relationships?.[dataset.id] ?? []), relation] } })); setNotice(`Relação N:1 criada · ${matches} registros correspondentes.`);
  };
  const seeCircuit = () => {
    const circuits = doc.layers.find((l) => l.table === 'circuitos'); if (!circuits || !chosen) return;
    const target = circuits.features.find((f) => f.id === chosen.properties.circuito); if (!target) return;
    if (!circuits.visible) updateLayer(circuits.id, { visible: true });
    pick({ layerId: circuits.id, featureId: target.id }); focus(target, 15);
  };
  const timeBase = spec ? (spec.unit === 'semana' ? `${formatTime(spec, hour)} de ${spec.max}` : formatTime(spec, hour)) : '';
  const timeNote = id === 'incidents' || id === 'theft' ? `${visible.filter((f) => f.properties.hora != null).length} eventos no período` : id === 'lights' ? (hour >= 17.85 || hour < 6 ? 'Noite · lâmpadas acesas pela fotocélula' : 'Dia · lâmpadas apagadas') : id === 'coverage' ? 'Carga média da rede neste horário' : id === 'weather' ? 'Previsão das células de tempestade' : 'Avanço das obras e licenças';
  const Wrap = id === 'field' ? FieldProvider : Fragment;
  const hasConsole = id === 'field';

  return <div ref={wsRef} className={`mb-workspace${fullScreen ? ' mb-fullscreen' : ''}`} style={{ ['--map-accent' as string]: report.accent }} data-map={id}>
    <header className="mb-header"><div className="mb-heading"><div className="mb-eyebrow"><Link to="/maps" className="mb-back"><Icon name="arrowLeft" size={12} /> Todos os mapas</Link><span>/</span>{report.category}</div><h1>{doc.name}</h1></div>{report.live && <Badge tone="success">Tempo real</Badge>}<Badge tone="neutral">Demonstração</Badge><span className="flex-1" /><SegmentedControl label="Modo do mapa" value={mode} onChange={(v) => { setMode(v); setMarker(false); setProposal(null); }} options={[{ id: 'view', label: 'Visualizar', icon: 'eye' }, { id: 'edit', label: 'Editar', icon: 'brush' }]} /><Button icon="download" onPress={() => download({ ...doc, scope: { status: filter, region, type, route, hour } })}>Exportar</Button><Button variant="primary" icon="check" onPress={save}>{dirty ? 'Salvar alterações' : 'Salvar mapa'}</Button></header>
    <div className="mb-commandbar">{id !== 'field' && <Button size="sm" icon="kpi" onPress={() => openPanel('insights')}>Análise</Button>}<Button size="sm" icon="layers" onPress={() => openPanel('layers')}>Camadas <span className="mb-count">{doc.layers.length}</span></Button>{mode === 'edit' && <><Button size="sm" icon="table" onPress={() => openPanel('data')}>Tabela → mapa</Button><Button size="sm" icon="upload" onPress={() => fileRef.current?.click()}>Importar</Button><Button size="sm" icon="pin" onPress={() => { setMarker(!marker); setNotice('Clique no mapa para posicionar o marker. Esc cancela.'); }}>Criar marker</Button></>}<input ref={fileRef} type="file" hidden accept=".geojson,.json,.kml,.kmz,.csv,.xlsx,.xls,.parquet,.shp,.gpkg" onChange={(e) => { const f = e.target.files?.[0]; if (f) void importFile(f); e.target.value = ''; }} /><span className="flex-1" /><div className="mb-search"><TextField label="Localizar ativo" hideLabel icon="search" placeholder="Localizar ativo ou ocorrência…" value={search} onChange={setSearch} />{search && <div className="mb-search-results">{hits.map(({ l, f }) => <button key={`${l.id}-${f.id}`} onClick={() => { pick({ layerId: l.id, featureId: f.id }); focus(f, 14); setSearch(''); }}><b>{f.id}</b><span>{String(f.properties[l.label] ?? '')}</span></button>)}{!hits.length && <p>Nenhum resultado.</p>}</div>}</div><Button size="sm" icon="table" onPress={() => setTable(!table)}>{table ? 'Fechar tabela' : 'Dados'}</Button>{aiEnabled && <Button size="sm" icon="copilot" onPress={() => openPanel('copilot')}>Copilot</Button>}</div>
    <Wrap>
      <main className={`mb-stage${hasConsole ? ' has-console' : ''}`}>
        <GeoCanvas doc={previewDoc} layers={visibleLayers} camera={camera} onCamera={setCamera} selected={selection} onPick={pick} marker={marker} radius={radius} preview={!!proposal} routeFocus={route} time={hour} lightsMode={lightsMode} fullscreen={fullScreen} onFullscreen={toggleFullscreen} onReset={reset}
          overlay={id === 'field' ? <FieldLayer /> : rerouted ? <RouteOverlay cut={rerouted.cut} alternative={rerouted.ids.map((rid) => links.find((l) => l.id === rid)!).filter(Boolean)} /> : undefined}
          onMarker={(lon, lat) => { if (mode !== 'edit') return; const f: Feature = { id: `MARK-${Date.now()}`, geometry: { type: 'Point', coordinates: [[lon, lat]] }, properties: { nome: 'Novo marker', latitude: lat, longitude: lon, status: 'Normal' } }; addLayer(layer('Markers personalizados', [f])); setMarker(false); }}>
          {id === 'field' && <FieldHud />}
        </GeoCanvas>
        <div className={`mb-map-tools ${panel ? 'has-panel' : ''}`}><Select label="Mapa base" hideLabel value={doc.basemap} onChange={(v) => update((d) => ({ ...d, basemap: v, dimension: v === '3D Urban' ? '3d' : d.dimension }))} options={opts(['Light', 'Dark', 'Street', 'Satellite', 'Terrain', '3D Urban']) as { id: MapDocument['basemap']; label: string }[]} /><SegmentedControl label="Dimensão" value={doc.dimension} onChange={(v) => update((d) => ({ ...d, dimension: v }))} options={[{ id: '2d', label: '2D' }, { id: '3d', label: '2.5D' }]} />{(id === 'theft' || id === 'incidents') && <SegmentedControl label="Agregação" value={doc.aggregation} onChange={(v) => update((d) => ({ ...d, aggregation: v }))} options={[{ id: 'Eventos', label: id === 'theft' ? 'Ocorrências' : 'Eventos' }, { id: 'Heatmap', label: 'Heatmap' }, { id: 'Clusters', label: 'Clusters' }]} />}</div>
        {panel && <aside className="mb-panel">
          {(panel === 'insights' || panel === 'layers') && id !== 'field' ? <SegmentedControl label="Painel" value={panel} onChange={(v) => setPanel(v)} options={[{ id: 'insights', label: 'Análise', icon: 'kpi' }, { id: 'layers', label: mode === 'edit' ? 'Construir' : 'Camadas', icon: 'layers' }]} /> : null}
          <div className="mb-panel-title"><Icon name={panel === 'insights' ? 'kpi' : panel === 'layers' ? 'layers' : panel === 'data' ? 'table' : 'copilot'} size={16} /><h2>{panel === 'insights' ? report.short : panel === 'layers' ? (mode === 'edit' ? 'Construir mapa' : 'Explorar operação') : panel === 'data' ? 'Tabela → mapa' : 'Copilot do mapa'}</h2><button aria-label="Recolher painel" onClick={() => setPanel(null)}><Icon name="close" size={12} /></button></div>
          {panel === 'insights' ? <>
            <p className="mb-helper">{report.question}</p>
            <MapInsights id={id} doc={doc} layers={visibleLayers} time={hour} spec={spec} onTime={(v) => { setHour(v); setPlaying(false); }} onFly={(lon, lat, z) => flyTo(lon, lat, z ?? 13)} onPick={(layerId, f, z) => { pick({ layerId, featureId: f.id }); focus(f, z ?? 13); }} lightsMode={lightsMode} onLightsMode={setLightsMode} cut={cut} onCut={setCut} reroute={rerouted} />
          </> : panel === 'layers' ? <>
            <p className="mb-helper">{report.blurb}</p>{mode === 'edit' && <TextField label="Nome do relatório" value={doc.name} onChange={(v) => update((d) => ({ ...d, name: v }))} />}<div className="mb-section-label">CAMADAS OPERACIONAIS <span>{doc.layers.length}</span></div>
            {doc.layers.map((l) => <div key={l.id} className={`mb-layer ${chosenLayer?.id === l.id ? 'is-active' : ''}`}><Switch isSelected={l.visible} onChange={(v) => updateLayer(l.id, { visible: v })}><span className="mb-layer-name">{l.name}<small>{l.features.length.toLocaleString('pt-BR')} feições · {l.features[0]?.geometry.type ?? 'vazia'}</small></span></Switch>{mode === 'edit' && <button aria-label={`Propriedades de ${l.name}`} onClick={() => { setActiveLayer(l.id); setSelection(null); }}><Icon name="sliders" size={12} /></button>}</div>)}
            {mode === 'edit' && <Button size="sm" icon="plus" onPress={() => setPanel('data')}>Adicionar camada</Button>}
            <details open className="mb-section"><summary><Icon name="filter" size={12} /> Filtros operacionais</summary><Select label="Status / severidade" value={filter} onChange={setFilter} options={opts(['Todos', ...statuses])} /><Select label="Região" value={region} onChange={setRegion} options={opts(['Todas', ...regions])} /><Select label="Tipo" value={type} onChange={setType} options={opts(['Todos', ...types])} />{id === 'network' && <Select label="Destacar rota" value={route} onChange={focusRoute} options={opts(['Todas', 'SP-04', 'SP-07', 'SP-12'])} />}{id === 'lights' && <Switch isSelected={!!doc.overdueOnly} onChange={(v) => update((d) => ({ ...d, overdueOnly: v }))}>Somente manutenção vencida</Switch>}<Button size="sm" onPress={() => { setFilter('Todos'); setRegion('Todas'); setType('Todos'); setRoute('Todas'); if (doc.overdueOnly) update((d) => ({ ...d, overdueOnly: false })); }}>Limpar filtros</Button></details>
            <details className="mb-section"><summary><Icon name="model" size={12} /> Modelo e relacionamentos</summary><div className="mb-lineage"><span>Dataset BIWEB</span><Icon name="arrowRight" size={12} /><span>Geometria / layer</span></div><p className="mb-helper">Mesmos datasets e relações do workspace. Selecione um ativo para consultar os registros relacionados.</p><Switch isSelected={doc.related} onChange={(v) => update((d) => ({ ...d, related: v }))}>Exibir relações no Inspector</Switch>{id === 'lights' && <code>manutencoes.poste_id → postes.id<br />postes.circuito → circuitos.id<br />circuitos.trafo → trafos.id</code>}</details>
            <details className="mb-section"><summary><Icon name="sliders" size={12} /> Legenda e faixas</summary><Switch isSelected={doc.legend} onChange={(v) => update((d) => ({ ...d, legend: v }))}>Mostrar legenda</Switch>{id === 'network' && doc.bands.map((b, i) => <label className="mb-range" key={i}>{STATUS[i + 1]} a partir de {b} dB<input aria-label={`Limite ${STATUS[i + 1]}`} type="range" min={i ? doc.bands[i - 1]! + 1 : 1} max={i < 2 ? doc.bands[i + 1]! - 1 : 40} value={b} onChange={(e) => update((d) => ({ ...d, bands: d.bands.map((x, j) => i === j ? Number(e.target.value) : x) }))} /></label>)}</details>
            <div className="mb-model-note"><Icon name="data" size={16} /><div><b>Um motor, oito operações</b><p>Importar → relacionar → geolocalizar → operar.</p></div></div>
          </> : panel === 'data' ? <>
            <p className="mb-helper">Transforme linhas em elementos do mapa. Os vínculos permanecem disponíveis no Inspector.</p>
            {importRows ? <div className="mb-import-source"><Badge tone="success">CSV · {importName}</Badge><Button size="sm" onPress={() => { setImportRows(null); setImportName(''); }}>Usar dataset BIWEB</Button></div> : <><Select label="Dataset" value={dataset.id} options={sources.map((s) => ({ id: s.id, label: s.name }))} onChange={(v) => { setDatasetId(v); const t = sources.find((s) => s.id === v)!.tables[0]!; setTableId(t.id); setMapping({ latitude: t.fields.some((f) => f.name === 'latitude') ? 'latitude' : 'lat', longitude: t.fields.some((f) => f.name === 'longitude') ? 'longitude' : 'lon', label: t.fields.some((f) => f.name === 'nome') ? 'nome' : t.key, color: 'status' }); }} /><Select label="Tabela" value={sourceTable.id} options={dataset.tables.map((t) => ({ id: t.id, label: t.name }))} onChange={(v) => { setTableId(v); const t = dataset.tables.find((x) => x.id === v)!; setMapping({ latitude: t.fields.some((f) => f.name === 'latitude') ? 'latitude' : 'lat', longitude: t.fields.some((f) => f.name === 'longitude') ? 'longitude' : 'lon', label: t.fields.some((f) => f.name === 'nome') ? 'nome' : t.key, color: 'status' }); }} /></>}
            <div className="mb-mapping">{([['latitude', 'Latitude'], ['longitude', 'Longitude'], ['label', 'Label'], ['color', 'Color by']] as const).map(([k, label]) => <Select key={k} label={label} value={mapping[k]} onChange={(v) => setMapping((m) => ({ ...m, [k]: v }))} options={opts(k === 'color' ? ['', ...fields] : fields)} />)}</div>
            <div className="mb-data-preview"><b>{mapped.features.length.toLocaleString('pt-BR')} pontos válidos</b><span>{mapped.rejected} linhas sem coordenadas válidas</span><small>WGS84 · latitude −90 a 90 · longitude −180 a 180</small>{mapped.features.slice(0, 3).map((f) => <code key={f.id}>{String(f.properties[mapping.label] ?? f.id)} · {f.geometry.coordinates[0]?.map((x) => x.toFixed(4)).join(', ')}</code>)}</div>
            <Button variant="primary" icon="plus" isDisabled={mode !== 'edit' || !mapped.features.length} onPress={addMapped}>Adicionar pontos ao mapa</Button>
            <details className="mb-section" open><summary>Relacionamentos do dataset</summary>{[...dataset.relationships, ...(doc.relationships?.[dataset.id] ?? [])].map((r) => <div className="mb-relation" key={r.from + r.to}><Icon name="model" size={12} /><code>{r.from}<br />↓ N:1<br />{r.to}</code></div>)}{!dataset.relationships.length && <p className="mb-helper">Este dataset ainda não tem relacionamentos.</p>}</details>
            {!importRows && <details className="mb-section"><summary>Relacionar outra tabela</summary><Select label="Tabela relacionada (N)" value={relationTable} options={dataset.tables.filter((t) => t.id !== sourceTable.id).map((t) => ({ id: t.id, label: t.name }))} onChange={(v) => { setRelationTable(v); setForeignKey(dataset.tables.find((t) => t.id === v)?.fields[0]?.name ?? ''); }} /><Select label="Chave geográfica (1)" value={ownKey} options={opts(fields)} onChange={setOwnKey} /><Select label="Chave estrangeira (N)" value={foreignKey} options={opts(dataset.tables.find((t) => t.id === relationTable)?.fields.map((f) => f.name) ?? [])} onChange={setForeignKey} /><Button size="sm" isDisabled={mode !== 'edit'} onPress={linkTables}>Validar e relacionar</Button></details>}
            <div className="mb-import-card"><Icon name="upload" size={20} /><b>Traga sua geografia</b><p>GeoJSON · KML · CSV</p><Button size="sm" isDisabled={mode !== 'edit'} onPress={() => fileRef.current?.click()}>Selecionar arquivo</Button><small>KMZ, Excel, Parquet, SHP e GeoPackage: fluxo previsto; converta para um formato disponível nesta demonstração.</small></div>
          </> : <>
            <Badge tone="accent">Ações com preview · demonstração local</Badge><p className="mb-helper">O Copilot prepara uma configuração para você revisar no próprio mapa.</p><TextField label="O que você quer construir?" value={request} onChange={setRequest} placeholder="Mostre um heatmap das ocorrências" /><Button variant="primary" icon="copilot" isDisabled={mode !== 'edit' || !request.trim()} onPress={() => propose(request)}>Gerar preview</Button>{mode !== 'edit' && <p className="mb-helper">Entre em Editar para aplicar configurações.</p>}
            <div className="mb-section-label">SUGESTÕES PARA ESTE MAPA</div>{SUGGESTIONS[id].map((s) => <button className="mb-prompt" key={s} disabled={mode !== 'edit'} onClick={() => propose(s)}><Icon name="copilot" size={12} />{s}<Icon name="arrowRight" size={12} /></button>)}
            {proposal && <div className="mb-proposal"><Badge tone="warning">Preview no mapa</Badge><h3>{proposal.title}</h3><p>{proposal.description}</p><Button variant="primary" onPress={() => { update(proposal.apply); setProposal(null); setNotice('Configuração aplicada. Salve para reutilizar.'); }}>Aplicar configuração</Button><Button onPress={() => setProposal(null)}>Descartar preview</Button></div>}
          </>}
        </aside>}
        {chosenLayer && id !== 'field' && (mode === 'edit' || chosen && chosenLayer.popup) && <aside className="mb-inspector"><div className="mb-panel-title"><span className="mb-section-label">{mode === 'edit' ? 'INSPECTOR' : 'DETALHES DO ATIVO'}</span><button aria-label="Fechar Inspector" onClick={() => { setSelection(null); setActiveLayer(''); }}><Icon name="close" size={12} /></button></div><h2>{chosen?.id ?? chosenLayer.name}</h2><p className="mb-helper">{String(shown?.properties[chosenLayer.label] ?? chosenLayer.name)}</p>{shown?.properties.status != null && <Badge tone={severity(shown, doc.bands) > 1 ? 'danger' : severity(shown, doc.bands) === 1 ? 'warning' : 'success'}>{String(shown.properties.status)}</Badge>}
          {shown && <><div className="mb-inspector-values">{Object.entries(shown.properties).filter(([k, v]) => !HIDDEN_PROPS.has(k) && typeof v !== 'object' && v !== '').slice(0, 16).map(([k, v]) => <div key={k}><span>{propLabel(k)}</span><b>{formatProp(k, v)}</b></div>)}</div><div className="mb-inspector-actions"><Button size="sm" icon="target" onPress={() => focus(chosen!, 15)}>Localizar</Button><Button size="sm" icon="timeline" onPress={() => setHistory(!history)}>Histórico</Button><Button size="sm" icon="model" onPress={() => setRelationsOpen(!relationsOpen)}>Dependências</Button>{id === 'network' && typeof chosen!.properties.atenuacao_a === 'number' && <Button size="sm" icon="bolt" onPress={() => { setCut(chosen!.id); setPanel('insights'); }}>Simular rompimento</Button>}{chosenLayer.table === 'postes' && <Button size="sm" icon="layers" onPress={seeCircuit}>Ver circuito</Button>}{aiEnabled && <Button size="sm" icon="copilot" onPress={() => setAnalysis(!analysis)}>Analisar</Button>}</div>{history && <div className="mb-data-preview"><b>Histórico demonstrativo</b>{typeof chosen!.properties.atenuacao_a === 'number' ? ['06:00', '07:00', '08:00'].map((t, i) => <span key={t}>{t} · {(Number(chosen!.properties.atenuacao_a) - 2 + i).toFixed(1)} dB</span>) : <span>{String(chosen!.properties.ultima_manutencao ?? chosen!.properties.data ?? '07/10/2026')} · {String(shown.properties.status ?? 'Registro cadastrado')}</span>}</div>}{analysis && <p className="mb-analysis"><Icon name="copilot" size={12} /> {typeof chosen!.properties.atenuacao_a === 'number' ? `Atenuação A de ${chosen!.properties.atenuacao_a} dB, margem de ${chosen!.properties.margem} dB. A faixa configurada classifica este trecho como ${STATUS[severity(chosen!, doc.bands)]}. Investigue as leituras e os trechos da rota ${chosen!.properties.rota}.` : `${chosen!.id}: ${shown.properties.status ?? 'sem status informado'}. ${relationships.reduce((c, r) => c + r.rows.length, 0)} registros relacionados. Use o raio de análise para consultar elementos próximos.`} Análise baseada nos dados simulados.</p>}</>}
          {mode === 'edit' && <><details className="mb-section" open><summary>DATA · Propriedades</summary><TextField label="Nome da camada" value={chosenLayer.name} onChange={(v) => updateLayer(chosenLayer.id, { name: v })} />{chosen && <TextField label="Label do elemento" value={String(chosen.properties[chosenLayer.label] ?? '')} onChange={(v) => updateProperty(chosenLayer.label, v)} />}<code>{chosenLayer.dataset}<br />{chosenLayer.table || 'Geometria importada'}</code>{chosen?.geometry.type === 'Point' && <><NumberField label="Latitude" value={chosen.geometry.coordinates[0]![1]!} minValue={-90} maxValue={90} step={.0001} onChange={(v) => coordinate(1, v)} /><NumberField label="Longitude" value={chosen.geometry.coordinates[0]![0]!} minValue={-180} maxValue={180} step={.0001} onChange={(v) => coordinate(0, v)} /></>}</details>
            <details className="mb-section"><summary>STYLE · Aparência</summary><Select label="Ícone" value={chosenLayer.icon} onChange={(v) => updateLayer(chosenLayer.id, { icon: v })} options={[{ id: 'circle', label: 'Círculo' }, { id: 'diamond', label: 'Losango' }, { id: 'square', label: 'Quadrado' }]} /><label className="mb-color">Cor base<input aria-label="Cor da camada" type="color" value={chosenLayer.color} onChange={(e) => updateLayer(chosenLayer.id, { color: e.target.value, colorBy: '' })} /></label><Switch isSelected={!!chosenLayer.colorBy} onChange={(v) => updateLayer(chosenLayer.id, { colorBy: v ? 'status' : '' })}>Colorir por status / faixa</Switch><label className="mb-range">Tamanho / espessura · {chosenLayer.size}<input aria-label="Tamanho da camada" type="range" min="2" max="12" value={chosenLayer.size} onChange={(e) => updateLayer(chosenLayer.id, { size: Number(e.target.value) })} /></label><label className="mb-range">Opacidade · {chosenLayer.opacity}%<input aria-label="Opacidade da camada" type="range" min="10" max="100" value={chosenLayer.opacity} onChange={(e) => updateLayer(chosenLayer.id, { opacity: Number(e.target.value) })} /></label><Switch isSelected={chosenLayer.visible} onChange={(v) => updateLayer(chosenLayer.id, { visible: v })}>Visível</Switch></details>
            <details className="mb-section"><summary>INTERACTION · Comportamento</summary><Select label="Campo do popup / label" value={chosenLayer.label} options={opts(Object.keys(chosen?.properties ?? chosenLayer.features[0]?.properties ?? {}))} onChange={(v) => updateLayer(chosenLayer.id, { label: v })} /><Switch isSelected={chosenLayer.popup} onChange={(v) => updateLayer(chosenLayer.id, { popup: v })}>Popup de detalhes</Switch><Switch isSelected={chosenLayer.tooltip} onChange={(v) => updateLayer(chosenLayer.id, { tooltip: v })}>Tooltip no mapa</Switch><Select label="Ao clicar" value={chosenLayer.click} onChange={(v) => updateLayer(chosenLayer.id, { click: v })} options={[{ id: 'inspect', label: 'Abrir Inspector' }, { id: 'focus', label: 'Localizar e inspecionar' }]} /></details></>}
          {chosen && <><details className="mb-section" open={relationsOpen} onToggle={(e) => setRelationsOpen(e.currentTarget.open)}><summary>RELATIONSHIPS · Registros relacionados</summary>{relationships.map((r) => <div key={r.label}><b>{r.label} · {r.rows.length}</b>{r.rows.slice(0, 5).map((row, i) => <p className="mb-related-row" key={i}>{Object.entries(row).filter(([k]) => ['id', 'nome', 'data', 'hora', 'tipo', 'status', 'atenuacao_dB', 'trechos'].includes(k)).map(([k, v]) => `${String(v)}${k === 'atenuacao_dB' ? ' dB' : k === 'trechos' ? ' trechos' : ''}`).join(' · ')}</p>)}</div>)}{!relationships.length && <p className="mb-helper">Nenhum vínculo disponível para este elemento.</p>}{orders[chosen.id]?.map((o) => <p className="mb-related-row" key={String(o.id)}>{String(o.id)} · {String(o.status)} · ordem local</p>)}{chosenLayer.table === 'postes' && <Button size="sm" icon="plus" onPress={() => { const order = { id: `OS-LOCAL-${Date.now()}`, poste_id: chosen.id, status: 'Aberta' }; setOrders((prev) => ({ ...prev, [chosen.id]: [...(prev[chosen.id] ?? []), order] })); setNotice('Ordem demonstrativa criada nesta sessão.'); }}>Criar ordem</Button>}</details><details className="mb-section" open={id === 'theft' || undefined}><summary>PROXIMIDADE · Raio de análise</summary><label className="mb-range">{radius} km<input aria-label="Raio de análise" type="range" min="0" max="10" step=".5" value={radius} onChange={(e) => setRadius(Number(e.target.value))} /></label><small>{nearby.length} elementos dentro do raio</small>{nearby.slice(0, 6).map((x) => <p className="mb-related-row" key={x.layer + x.f.id}>{String(x.f.properties.nome ?? x.f.id)} · {x.distance.toFixed(2)} km</p>)}{id === 'theft' && <small>Proximidade é contexto geográfico; não indica envolvimento em ocorrências.</small>}</details></>}
          {mode === 'edit' && <Button size="sm" icon="trash" onPress={() => { update((d) => ({ ...d, layers: d.layers.filter((l) => l.id !== chosenLayer.id) })); setActiveLayer(''); setSelection(null); }}>Remover camada</Button>}
        </aside>}
        {id === 'field' && <FieldConsole onFocus={(lon, lat) => flyTo(lon, lat, Math.max(camera.zoom, 13.5))} />}
        {doc.legend && <div className={`mb-legend ${panel ? 'has-panel' : ''}`}><b>{legend.title}</b><div>{legend.items.map((s) => <span key={s.label}><i className={s.ring ? 'is-ring' : ''} style={s.ring ? { borderColor: s.color } : { background: s.color }} />{s.label}{s.note && <small>{s.note}</small>}</span>)}</div>{legend.hint && <small className="mb-legend-hint">{legend.hint}</small>}</div>}
        {id !== 'field' && <div className="mb-metrics"><div><b>{visible.length.toLocaleString('pt-BR')}</b><span>feições filtradas</span></div><div><b>{visible.filter((f) => severity(f, doc.bands) > 1).length.toLocaleString('pt-BR')}</b><span>precisam de atenção</span></div><div><b>{doc.layers.filter((l) => l.visible).length}/{doc.layers.length}</b><span>camadas visíveis</span></div></div>}
        {!visible.length && id !== 'field' && <div className="mb-empty"><Icon name="filter" size={20} /><b>Nenhuma feição neste recorte</b><span>Ajuste os filtros, o período ou ative uma camada.</span></div>}
        {loading && <div className="mb-loading"><Icon name="layers" size={20} /> Preparando {report.short}…</div>}
        {marker && <div className="mb-marker-hint">Clique para posicionar o marker · Esc cancela</div>}
        {notice && <div role="status" className="mb-notice">{notice}<button aria-label="Fechar aviso" onClick={() => setNotice('')}><Icon name="close" size={12} /></button></div>}
      </main>
    </Wrap>
    {table && <section className="mb-table"><div className="mb-table-head"><b>Dados no mapa · {visible.length} feições</b><span>Primeiras 100 · selecione para localizar</span></div><table className="bw-table"><thead><tr><th>ID</th><th>Label</th><th>Camada</th><th>Status</th><th>Região</th></tr></thead><tbody>{visibleLayers.filter((l) => l.visible).flatMap((l) => l.features.map((f) => ({ l, f }))).slice(0, 100).map(({ l, f }) => <tr key={l.id + f.id}><td><button onClick={() => { pick({ layerId: l.id, featureId: f.id }); focus(f, 14); }}>{f.id}</button></td><td>{String(f.properties[l.label] ?? '—')}</td><td>{l.name}</td><td>{String(f.properties.status ?? '—')}</td><td>{String(f.properties.regiao ?? '—')}</td></tr>)}</tbody></table></section>}
    {spec && <footer className="mb-timeline"><Button size="sm" icon={playing ? 'close' : 'play'} onPress={() => setPlaying(!playing)}>{playing ? 'Pausar' : 'Reproduzir'}</Button><div><b>{id === 'incidents' || id === 'theft' ? `07 out 2026 · até ${String(Math.floor(hour)).padStart(2, '0')}:59` : timeBase}</b><span>{timeNote}</span></div><span>{spec.unit === 'semana' ? `S${spec.min}` : `${String(spec.min).padStart(2, '0')}h`}</span><input aria-label={spec.label} type="range" min={spec.min} max={spec.max} step={spec.step} value={hour} onChange={(e) => { setHour(Number(e.target.value)); setPlaying(false); }} /><span>{spec.unit === 'semana' ? `S${spec.max}` : `${String(Math.ceil(spec.max)).padStart(2, '0')}h`}</span><SegmentedControl label="Velocidade" value={String(speed)} onChange={(v) => setSpeed(Number(v))} options={SPEEDS} /></footer>}
    <div className="mb-statusbar"><span><i />{mode === 'edit' ? 'Map Builder · edição' : 'Exploração operacional'}</span><span>{dirty ? 'Alterações não salvas' : 'Configuração pronta'} · {camera.zoom.toFixed(1)}z · WGS84</span><span>{doc.dimension === '3d' ? 'Perspectiva 2.5D' : 'Cartografia 2D'} · dados de demonstração</span></div>
  </div>;
}
