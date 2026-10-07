/**
 * Copilot de construção: interpreta o pedido (intents + modelos), monta um plano em etapas e executa cada etapa
 * sobre o documento (mesma store do canvas). Tudo vira UM passo de undo rotulado "IA: …".
 * A IA é simulada; as mudanças no estado são reais.
 */
import { create } from 'zustand';
import { aggregate, applyRules, fmt, rowsOf, STATUS_LABEL } from '../data/query';
import { getTable } from '../data/registry';
import type { FilterOp, Rule, RuleStatus } from '../data/types';
import { COMP_META, DS, makeComp, uid, type ChartKind, type ChartProps, type Comp, type CompType, type KpiProps, type Page } from './doc';
import { overlaps, useEditor } from './store';

export interface PlanStep { label: string; run: (tx: string) => string[] | void }
export interface Plan { intent: string; thinking: string; steps: PlanStep[]; summary: () => string; answer?: string[]; actions?: { label: string; prompt: string }[] }
export interface ChatMsg {
  id: string; role: 'user' | 'ai'; text: string; context?: string;
  state?: 'thinking' | 'running' | 'done' | 'answer'; steps?: { label: string; done: boolean }[]; summary?: string; answer?: string[];
  actions?: { label: string; prompt: string }[]; tx?: string; touched?: string[]; undone?: boolean;
}
export const useCopilotChat = create<{ msgs: ChatMsg[]; busy: boolean; set: (p: Partial<{ msgs: ChatMsg[]; busy: boolean }>) => void }>((set) => ({ msgs: [], busy: false, set }));

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const st = () => useEditor.getState();
const page = () => st().page()!;
const W = 1280, M = 24, G = 16;

/* ---------- utilidades de layout ---------- */
const SPAN: Partial<Record<CompType, number>> = { map: 8, scene3d: 8, chart: 6, matrix: 6, timeline: 12, table: 12, card: 4, image: 3, text: 12, status: 4 };
const HEIGHT: Partial<Record<CompType, number>> = { map: 460, scene3d: 460, chart: 300, matrix: 300, timeline: 220, table: 320, card: 140, image: 120, text: 44, status: 96 };
function importance(c: Comp): number {
  const base: Record<CompType, number> = { text: 200, filter: 150, slicer: 150, kpi: 100, status: 92, map: 70, scene3d: 70, chart: 60, timeline: 58, matrix: 50, table: 40, card: 30, image: 10, container: 0 };
  let s = base[c.type];
  if (c.type === 'kpi') {
    const k = c.props as unknown as KpiProps;
    if (k.measure === 'disponibilidade') s += 12;
    if (c.localFilters.some((f) => f.field === 'status')) s += 10;
    if (k.compare === 'target') s += 4;
  }
  if (c.type === 'text' && c.y > 80) s = 35;
  return s;
}
/** Reorganiza a página em linhas de 12 colunas: título → filtros → indicadores → visuais → tabelas. */
export function organize(p: Page): Record<string, { x: number; y: number; w: number; h: number }> {
  const comps = p.comps.filter((c) => c.type !== 'container' && !c.hidden).sort((a, b) => importance(b) - importance(a) || a.y - b.y || a.x - b.x);
  const out: Record<string, { x: number; y: number; w: number; h: number }> = {};
  const col = (W - 2 * M - 11 * G) / 12;
  let y = M;
  const title = comps.filter((c) => c.type === 'text' && importance(c) >= 200);
  const filters = comps.filter((c) => c.type === 'filter' || c.type === 'slicer');
  const kpis = comps.filter((c) => c.type === 'kpi' || (c.type === 'status' && c.h <= 130));
  const rest = comps.filter((c) => !title.includes(c) && !filters.includes(c) && !kpis.includes(c));
  // linha de título + filtros à direita
  if (title.length || filters.length) {
    const fw = filters.map((f) => (f.type === 'filter' ? 232 : Math.min(420, Math.max(232, f.w))));
    let fx = W - M - fw.reduce((a, b) => a + b + G, -G);
    const tw = Math.max(320, fx - M - G);
    if (title[0]) out[title[0].id] = { x: M, y: y + 12, w: tw, h: 44 };
    filters.forEach((f, i) => { out[f.id] = { x: Math.max(M, fx), y, w: fw[i]!, h: 72 }; fx += fw[i]! + G; });
    y += 72 + G;
    title.slice(1).forEach((t) => { rest.unshift(t); });
  }
  if (kpis.length) {
    const per = Math.min(6, kpis.length), rows = Math.ceil(kpis.length / per);
    for (let r = 0; r < rows; r++) {
      const row = kpis.slice(r * per, r * per + per);
      const w = (W - 2 * M - (row.length - 1) * G) / row.length;
      row.forEach((k, i) => { out[k.id] = { x: Math.round(M + i * (w + G)), y, w: Math.round(w), h: 128 }; });
      y += 128 + G;
    }
  }
  let row: { c: Comp; span: number }[] = [], used = 0;
  const flush = () => {
    if (!row.length) return;
    const free = 12 - used;
    if (free > 0) row[row.length - 1]!.span += free;
    const h = Math.max(...row.map((r) => HEIGHT[r.c.type] ?? 300));
    let x = M;
    for (const r of row) { const w = r.span * col + (r.span - 1) * G; out[r.c.id] = { x: Math.round(x), y, w: Math.round(w), h }; x += w + G; }
    y += h + G; row = []; used = 0;
  };
  for (const c of rest) {
    const span = SPAN[c.type] ?? 6;
    if (used + span > 12) flush();
    row.push({ c, span }); used += span;
  }
  flush();
  // encaixa tudo na grade de 8 px (bordas esquerda e direita)
  for (const r of Object.values(out)) { const x = Math.round(r.x / 8) * 8, right = Math.round((r.x + r.w) / 8) * 8; r.x = x; r.w = right - x; r.y = Math.round(r.y / 8) * 8; r.h = Math.round(r.h / 8) * 8; }
  return out;
}
export interface LayoutIssue { kind: 'overlap' | 'bounds' | 'grid' | 'hierarchy' | 'crowded'; text: string; ids: string[] }
export function layoutIssues(p: Page): LayoutIssue[] {
  const cs = p.comps.filter((c) => !c.hidden);
  const out: LayoutIssue[] = [];
  for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) {
    const a = cs[i]!, b = cs[j]!;
    if (a.type === 'container' || b.type === 'container') continue;
    if (overlaps(a, b)) out.push({ kind: 'overlap', text: `${a.name} sobrepõe ${b.name}`, ids: [a.id, b.id] });
  }
  for (const c of cs) if (c.x + c.w > p.w + 1) out.push({ kind: 'bounds', text: `${c.name} passa da largura da página`, ids: [c.id] });
  const kpis = cs.filter((c) => c.type === 'kpi');
  const firstVisual = cs.filter((c) => ['chart', 'map', 'table', 'matrix', 'timeline'].includes(c.type)).sort((a, b) => a.y - b.y)[0];
  if (kpis.length && firstVisual && kpis.some((k) => k.y > firstVisual.y + 10)) out.push({ kind: 'hierarchy', text: 'Há indicadores abaixo dos gráficos: o leitor vê o detalhe antes do resumo', ids: kpis.map((k) => k.id) });
  const off = cs.filter((c) => c.x % 8 || c.y % 8);
  if (off.length > 2) out.push({ kind: 'grid', text: `${off.length} componentes fora da grade de 8 px (alinhamento irregular)`, ids: off.map((c) => c.id) });
  if (cs.length > 14) out.push({ kind: 'crowded', text: `${cs.length} componentes numa página: considere dividir em duas`, ids: [] });
  return out;
}

/* ---------- ajudantes de criação ---------- */
function add(tx: string, type: CompType, r: { x: number; y: number; w: number; h: number }, o: { title?: string; subtitle?: string; table?: string; props?: Record<string, unknown>; filters?: Comp['localFilters']; preset?: Record<string, unknown>; style?: Partial<Comp['style']> } = {}, label?: string) {
  const p = page();
  const c = makeComp(type, r, o.preset ?? {}, Math.max(0, ...p.comps.map((x) => x.z)) + 1);
  if (o.title !== undefined) { c.style.title = o.title; c.name = o.title || c.name; }
  if (o.subtitle !== undefined) c.style.subtitle = o.subtitle;
  if (c.data) c.data.dataset = st().doc!.datasets[0] ?? DS;
  if (o.table && c.data) c.data = { dataset: c.data.dataset, table: o.table };
  if (o.props) Object.assign(c.props, o.props);
  if (type === 'text' && o.props?.text) c.name = String(o.props.text).slice(0, 40);
  if (o.filters) c.localFilters = o.filters;
  if (o.style) Object.assign(c.style, o.style);
  st().commit(label ?? `IA: inserir ${c.name}`, (d) => { d.pages.find((x) => x.id === p.id)!.comps.push(c); }, { tx, flash: [c.id] });
  return c.id;
}
function newPageFor(tx: string, name: string) {
  const pg: Page = { id: uid('pg'), name, w: 1280, h: 800, comps: [] };
  st().commit(`IA: criar página ${name}`, (d) => { d.pages.push(pg); }, { tx });
  st().goPage(pg.id);
  return pg.id;
}
const kpiRow = (n: number) => { const w = (W - 2 * M - (n - 1) * G) / n; return (i: number, y = 104) => ({ x: Math.round(M + i * (w + G)), y, w: Math.round(w), h: 128 }); };
const selected = () => { const p = page(); return p.comps.filter((c) => st().selection.includes(c.id)); };
const countRows = (table: string, filters: Comp['localFilters'] = []) => rowsOf(DS, table, { rules: st().doc!.rules, filters }).length;

/* ---------- intents ---------- */
type Intent = { id: string; test: RegExp; plan: (text: string) => Plan | null };
const INTENTS: Intent[] = [
  { id: 'exec', test: /(visao|painel|pagina).*(executiv)|executiv.*disponibilidade|disponibilidade da rede/, plan: () => {
    let ids: string[] = [];
    return {
      intent: 'Build with AI · visão executiva', thinking: 'Montando uma página executiva: resumo primeiro (disponibilidade, criticidade, eventos), tendência e onde agir.',
      steps: [
        { label: 'Criar a página Visão executiva', run: (tx) => { newPageFor(tx, 'Visão executiva'); } },
        { label: 'Adicionar título e segmentação por camada', run: (tx) => [add(tx, 'text', { x: M, y: 24, w: 760, h: 44 }, { props: { text: 'Disponibilidade da rede · hoje', size: 'xl', weight: 'strong' } }), add(tx, 'slicer', { x: 856, y: 16, w: 400, h: 72 }, { title: 'Camada', props: { field: 'camada', showCounts: true } })] },
        { label: 'Adicionar 4 indicadores (disponibilidade, enlaces críticos, eventos ativos, utilização)', run: (tx) => { const r = kpiRow(4); ids = [
          add(tx, 'kpi', r(0), { title: 'Disponibilidade', subtitle: 'média dos enlaces', props: { measure: 'disponibilidade', agg: 'avg', target: 99.9, targetDir: 'above', compare: 'target', spark: true, sparkMeasure: 'disponibilidade' } }),
          add(tx, 'kpi', r(1), { title: 'Enlaces críticos', subtitle: 'crítico ou offline', filters: [{ field: 'status', op: 'in', value: ['critical', 'offline'] }], props: { measure: 'id', agg: 'count', target: 5, targetDir: 'below', compare: 'target', spark: false } }),
          add(tx, 'kpi', r(2), { title: 'Eventos ativos', subtitle: 'não resolvidos', table: 'eventos', filters: [{ field: 'situacao', op: '=', value: 'Ativo' }], props: { measure: 'id', agg: 'count', compare: 'none', spark: false } }),
          add(tx, 'kpi', r(3), { title: 'Utilização', subtitle: 'média dos enlaces', props: { measure: 'utilizacao', agg: 'avg', target: 70, targetDir: 'below', compare: 'target', spark: true, sparkMeasure: 'utilizacao' } })]; return ids; } },
        { label: 'Adicionar a tendência de disponibilidade (30 dias)', run: (tx) => [add(tx, 'chart', { x: M, y: 248, w: 752, h: 284 }, { title: 'Disponibilidade', subtitle: 'média diária · 30 dias (%)', table: 'historico', preset: { kind: 'area' }, props: { kind: 'area', x: 'dia', y: 'disponibilidade', agg: 'avg' } })] },
        { label: 'Adicionar as 10 regiões com menor disponibilidade', run: (tx) => [add(tx, 'chart', { x: 792, y: 248, w: 464, h: 284 }, { title: 'Disponibilidade', subtitle: 'por região · 10 menores (%)', props: { kind: 'hbar', x: 'regiao', y: 'disponibilidade', agg: 'avg', sort: 'asc', limit: 10, labels: true } })] },
        { label: 'Adicionar mapa de status e saúde dos enlaces', run: (tx) => [add(tx, 'map', { x: M, y: 548, w: 752, h: 228 }, { title: 'Onde está o problema', subtitle: 'enlaces por status', props: { layerPanel: false, layers: { regioes: true, enlaces: true, nos: false, eventos: true, rotas: false, heat: false, cobertura: false, clusters: false, clientes: false } } }), add(tx, 'status', { x: 792, y: 548, w: 464, h: 228 }, { title: 'Saúde dos enlaces', props: { field: 'status', mode: 'counts' } })] },
      ],
      summary: () => { const r = rowsOf(DS, 'enlaces', { rules: st().doc!.rules, filters: [] }); const av = aggregate(r, { ds: DS, table: 'enlaces', measure: 'disponibilidade', agg: 'avg' })[0]!.value; return `Criei a página Visão executiva com 4 indicadores (disponibilidade média ${fmt(av, 'pct')}), a tendência de 30 dias, as 10 regiões com menor disponibilidade e um mapa de status. A segmentação Camada filtra todos os componentes da página.`; },
    };
  } },
  { id: 'atten-map', test: /mapa.*atenua|atenua.*mapa/, plan: () => {
    let filterMsg = '';
    const lim = 15;
    return {
      intent: 'Build with AI · mapa de atenuação', thinking: `Enlaces com atenuação acima de ${lim} dB, coloridos pela atenuação, e ligados ao filtro de região.`,
      steps: [
        { label: `Selecionar enlaces com atenuação > ${lim} dB`, run: () => undefined },
        { label: 'Adicionar mapa colorido por atenuação', run: (tx) => { const p = page(); const spot = freeArea(p, 640, 420); return [add(tx, 'map', { ...spot, w: 640, h: 420 }, { title: 'Enlaces com maior atenuação', subtitle: `acima de ${lim} dB · cor pela atenuação`, filters: [{ field: 'atenuacao_dB', op: '>', value: lim }], props: { colorBy: 'atenuacao_dB', labels: true, layers: { regioes: true, enlaces: true, nos: false, eventos: false, rotas: false, heat: false, cobertura: false, clusters: false, clientes: false } } })]; } },
        { label: 'Conectar o filtro Região aos demais componentes', run: (tx) => {
          const p = page();
          const f = p.comps.find((c) => (c.type === 'filter' || c.type === 'slicer') && c.props.field === 'regiao');
          if (f) { st().commit('IA: conectar filtro Região', (d) => { const x = d.pages.find((y) => y.id === p.id)!.comps.find((y) => y.id === f.id)!; x.props.targets = 'all'; }, { tx, flash: [f.id] }); filterMsg = 'conectei o filtro Região existente a todos os componentes'; return [f.id]; }
          const spot = freeArea(p, 232, 72);
          filterMsg = 'adicionei um filtro Região ligado a todos os componentes';
          return [add(tx, 'filter', { ...spot, w: 232, h: 72 }, { title: 'Região', props: { field: 'regiao', targets: 'all' } })];
        } },
      ],
      summary: () => `Criei uma visualização geográfica dos ${countRows('enlaces', [{ field: 'atenuacao_dB', op: '>', value: lim }])} enlaces com atenuação acima de ${lim} dB, colorida pela atenuação, e ${filterMsg}.`,
    };
  } },
  { id: 'to-time', test: /(transform|troque|converta|mude).*(tabela)?.*(temporal|tempo|linha do tempo|evolucao)/, plan: () => {
    const p = page();
    const t = selected().find((c) => c.type === 'table') ?? p.comps.find((c) => c.type === 'table');
    if (!t) return null;
    const isEvents = t.data?.table === 'eventos';
    const measure = isEvents ? '' : ((t.props.sortBy as string) === 'utilizacao' ? 'utilizacao' : (t.props.sortBy as string) === 'disponibilidade' ? 'disponibilidade' : 'atenuacao_dB');
    const label = measure === 'utilizacao' ? 'Utilização média' : measure === 'disponibilidade' ? 'Disponibilidade média' : 'Atenuação média';
    return {
      intent: 'Smart Visualization · tabela → tempo', thinking: isEvents ? 'A tabela lista eventos com data: a linha do tempo mostra quando eles se concentram.' : `A tabela ${t.name} não tem data; o histórico diário do mesmo dataset tem. Vou mostrar ${label.toLowerCase()} por dia, no mesmo lugar.`,
      steps: [
        { label: `Ler a tabela ${t.name}`, run: () => [t.id] },
        { label: isEvents ? 'Criar linha do tempo de eventos' : `Criar gráfico de linha: ${label.toLowerCase()} por dia`, run: (tx) => {
          const c = isEvents ? makeComp('timeline', t) : makeComp('chart', t, { kind: 'line' });
          c.id = uid(c.type); c.x = t.x; c.y = t.y; c.w = t.w; c.h = t.h; c.z = t.z;
          c.localFilters = isEvents ? t.localFilters : t.localFilters.filter((f) => ['regiao', 'camada', 'tecnologia'].includes(f.field));
          if (isEvents) { c.style.title = 'Eventos'; c.style.subtitle = 'por dia e tipo · 30 dias'; c.localFilters = t.localFilters; }
          else { c.data = { dataset: DS, table: 'historico' }; Object.assign(c.props, { kind: 'line', x: 'dia', y: measure, agg: 'avg', sort: 'none', limit: 30 } satisfies Partial<ChartProps>); c.style.title = label.replace(' média', ''); c.style.subtitle = 'média diária · 30 dias'; }
          c.name = c.style.title;
          c.interactions = { ...t.interactions };
          st().commit('IA: trocar tabela por visualização temporal', (d) => { const pg = d.pages.find((x) => x.id === p.id)!; const i = pg.comps.findIndex((x) => x.id === t.id); pg.comps.splice(i, 1, c); }, { tx, flash: [c.id], select: [c.id] });
          return [c.id];
        } },
      ],
      summary: () => (isEvents ? `Troquei a tabela ${t.name} por uma linha do tempo de eventos por dia e tipo, na mesma posição e tamanho.` : `Troquei a tabela ${t.name} por uma linha da ${label.toLowerCase()} diária dos últimos 30 dias (histórico do mesmo dataset), na mesma posição. Filtros e segmentações da página continuam valendo.`),
    };
  } },
  { id: 'breaks', test: /(pagina|painel|acompanhar|monitor).*(rompiment|fibra rompida|cortes? de fibra)|rompimentos? de fibra/, plan: () => {
    const rf: Comp['localFilters'] = [{ field: 'tipo', op: '=', value: 'Rompimento de fibra' }];
    return {
      intent: 'Build with AI · rompimentos de fibra', thinking: 'Uma página operacional: quantos rompimentos estão ativos, onde, desde quando, e o histórico de 30 dias.',
      steps: [
        { label: 'Criar a página Rompimentos de fibra', run: (tx) => { newPageFor(tx, 'Rompimentos de fibra'); } },
        { label: 'Adicionar indicadores de rompimentos ativos, no mês e duração média', run: (tx) => { const r = kpiRow(4); return [
          add(tx, 'kpi', r(0, 24), { title: 'Rompimentos ativos', table: 'eventos', filters: [...rf, { field: 'situacao', op: '=', value: 'Ativo' }], props: { measure: 'id', agg: 'count', target: 0, targetDir: 'below', compare: 'target', spark: false } }),
          add(tx, 'kpi', r(1, 24), { title: 'Rompimentos', subtitle: 'últimos 30 dias', table: 'eventos', filters: rf, props: { measure: 'id', agg: 'count', compare: 'none', spark: false } }),
          add(tx, 'kpi', r(2, 24), { title: 'Tempo de reparo', subtitle: 'média · min', table: 'eventos', filters: [...rf, { field: 'situacao', op: '=', value: 'Resolvido' }], props: { measure: 'duracao_min', agg: 'avg', target: 240, targetDir: 'below', compare: 'target', spark: false } }),
          add(tx, 'slicer', r(3, 24), { title: 'Situação', table: 'eventos', props: { field: 'situacao', showCounts: true, orientation: 'vertical' } })]; } },
        { label: 'Adicionar mapa de enlaces offline e ocorrências', run: (tx) => [add(tx, 'map', { x: M, y: 168, w: 752, h: 400 }, { title: 'Onde rompeu', subtitle: 'enlaces offline e ocorrências ativas', props: { colorBy: 'status', layers: { regioes: true, enlaces: true, nos: false, eventos: true, rotas: false, heat: false, cobertura: false, clusters: false, clientes: false } } })] },
        { label: 'Adicionar a fila de rompimentos', run: (tx) => [add(tx, 'table', { x: 792, y: 168, w: 464, h: 400 }, { title: 'Rompimentos', subtitle: 'mais recentes primeiro', table: 'eventos', filters: rf, props: { columns: ['id', 'data', 'elementoNome', 'regiao', 'situacao', 'duracao_min'], sortBy: 'data', sortDir: 'desc' } })] },
        { label: 'Adicionar linha do tempo de 30 dias', run: (tx) => [add(tx, 'timeline', { x: M, y: 584, w: 1232, h: 192 }, { title: 'Rompimentos', subtitle: 'por dia e região · 30 dias', table: 'eventos', filters: rf, props: { groupBy: 'regiao' } })] },
      ],
      summary: () => { const at = countRows('eventos', [...rf, { field: 'situacao', op: '=', value: 'Ativo' }]); const tot = countRows('eventos', rf); return `Criei a página Rompimentos de fibra: ${at} rompimentos ativos e ${tot} nos últimos 30 dias, com mapa dos enlaces offline, fila por data e linha do tempo por região. A segmentação Situação filtra a página inteira.`; },
    };
  } },
  { id: 'organize', test: /(organiz|reorganiz|arrum|smart layout|melhore o layout|ajuste o layout).*/, plan: () => {
    const before = layoutIssues(page());
    return {
      intent: 'Smart Layout', thinking: 'Ordem de leitura: título e filtros, depois os indicadores (os que mais importam primeiro), visuais e, por fim, tabelas. Grade de 12 colunas, espaçamento de 16 px.',
      steps: [
        { label: `Analisar ${page().comps.length} componentes e a hierarquia`, run: () => undefined },
        { label: 'Reposicionar em linhas de 12 colunas', run: (tx) => { const p = page(); const rects = organize(p); st().set({ layoutAnim: Date.now() }); st().commit('IA: reorganizar a página', (d) => { for (const c of d.pages.find((x) => x.id === p.id)!.comps) { const r = rects[c.id]; if (r) Object.assign(c, r); } }, { tx }); return Object.keys(rects); } },
      ],
      summary: () => { const after = layoutIssues(page()); const k = page().comps.filter((c) => c.type === 'kpi'); return `Reorganizei a página: ${k.length ? `os ${k.length} indicadores ficaram na primeira faixa, do mais importante (${k.sort((a, b) => importance(b) - importance(a))[0]!.name}) para o menos, ` : ''}seguidos dos visuais e das tabelas. Problemas de layout: ${before.length} antes, ${after.length} depois.`; },
    };
  } },
  { id: 'rule', test: /(regra|marque|marcar|sinalize|alerta).*(atenua|utiliza|ocupa|disponib)/, plan: (text) => {
    const n = norm(text);
    const field = /atenua/.test(n) ? 'atenuacao_dB' : /disponib/.test(n) ? 'disponibilidade' : 'utilizacao';
    const num = Number((/(\d+(?:[.,]\d+)?)/.exec(n)?.[1] ?? (field === 'atenuacao_dB' ? '18' : field === 'utilizacao' ? '80' : '99.9')).replace(',', '.'));
    const op: FilterOp = /(abaixo|menor|inferior|<)/.test(n) ? '<' : '>';
    const status: RuleStatus = /offline/.test(n) ? 'offline' : /(atencao|alerta moderado|warning)/.test(n) ? 'warning' : 'critical';
    const flabel = field === 'atenuacao_dB' ? 'Atenuação' : field === 'disponibilidade' ? 'Disponibilidade' : 'Utilização';
    const rule: Rule = { id: uid('rule'), name: `${flabel} ${op === '>' ? 'acima de' : 'abaixo de'} ${num.toLocaleString('pt-BR')}${field === 'atenuacao_dB' ? ' dB' : '%'}`, enabled: true, dataset: DS, table: 'enlaces', createdBy: 'copilot',
      conditions: [{ id: uid('cd'), field, op, value: num }], actions: [{ kind: 'status', value: status }, { kind: 'alert' }, { kind: 'highlight' }] };
    return {
      intent: 'Criar regra', thinking: `SE ${flabel.toLowerCase()} ${op === '>' ? '>' : '<'} ${num.toLocaleString('pt-BR')} ENTÃO marcar como ${STATUS_LABEL[status]}, gerar alerta e destacar.`,
      steps: [{ label: `Criar a regra "${rule.name}"`, run: (tx) => { st().commit(`IA: criar regra ${rule.name}`, (d) => { d.rules.push(rule); }, { tx }); } }],
      summary: () => { const t = getTable(DS, 'enlaces'); const hits = applyRules(t.rows, [rule]).filter((r) => r._rules).length; return `Criei a regra "${rule.name}": ${hits} de ${t.rows.length} enlaces passam a aparecer como ${STATUS_LABEL[status]} no mapa e nas tabelas, com alerta. Ela está na aba Regras e pode ser desativada ou desfeita.`; },
    };
  } },
  { id: 'kind', test: /(troque|mude|transforme|converta).*(para|em) (um |uma )?(grafico de )?(linha|barras?|pizza|area|dispersao|barras horizontais)/, plan: (text) => {
    const c = selected()[0];
    if (!c || c.type !== 'chart') return null;
    const n = norm(text);
    const kind: ChartKind = /horizonta/.test(n) ? 'hbar' : /pizza/.test(n) ? 'pie' : /area/.test(n) ? 'area' : /dispers/.test(n) ? 'scatter' : /linha/.test(n) ? 'line' : 'bar';
    const names: Record<ChartKind, string> = { bar: 'barras', hbar: 'barras horizontais', line: 'linha', area: 'área', pie: 'pizza', scatter: 'dispersão' };
    return { intent: 'Trocar visualização', thinking: `Trocar ${c.name} para ${names[kind]}.`, steps: [{ label: `Trocar para ${names[kind]}`, run: (tx) => { st().update(c.id, (d) => { d.props.kind = kind; if (kind === 'scatter') { d.props.x = 'extensao_km'; d.props.y = 'atenuacao_dB'; } }, `IA: trocar para ${names[kind]}`, tx); return [c.id]; } }], summary: () => `Troquei ${c.name} para ${names[kind]}.` };
  } },
  { id: 'title', test: /(mude|troque|altere|renomeie).*(titulo|nome).*(para|:)\s*(.+)/, plan: (text) => {
    const c = selected()[0];
    const m = /(?:para|:)\s*["“]?(.+?)["”]?$/i.exec(text);
    if (!c || !m) return null;
    const t = m[1]!.trim();
    return { intent: 'Alterar título', thinking: `Novo título: ${t}.`, steps: [{ label: 'Alterar o título', run: (tx) => { st().update(c.id, (d) => { d.style.title = t; d.name = t; }, 'IA: alterar título', tx); return [c.id]; } }], summary: () => `Alterei o título de ${c.name} para "${t}".` };
  } },
  { id: 'add-filter', test: /(adicione|crie|coloque).*(filtro|segmenta).*(regiao|status|camada|tecnologia|criticidade|tipo)/, plan: (text) => {
    const n = norm(text);
    const field = (['regiao', 'status', 'camada', 'tecnologia', 'criticidade', 'tipo'] as const).find((f) => n.includes(f))!;
    const label = { regiao: 'Região', status: 'Status', camada: 'Camada', tecnologia: 'Tecnologia', criticidade: 'Criticidade', tipo: 'Tipo' }[field];
    const type: CompType = field === 'regiao' || field === 'tecnologia' ? 'filter' : 'slicer';
    return { intent: 'Criar filtro', thinking: `${type === 'filter' ? 'Lista suspensa' : 'Segmentação'} por ${label.toLowerCase()}, ligada a toda a página.`, steps: [{ label: `Adicionar ${type === 'filter' ? 'filtro' : 'segmentação'} ${label}`, run: (tx) => { const w = type === 'filter' ? 232 : 400; const spot = freeArea(page(), w, 72); return [add(tx, type, { ...spot, w, h: 72 }, { title: label, props: { field, targets: 'all', showCounts: true } })]; } }],
      summary: () => `Adicionei ${type === 'filter' ? 'o filtro' : 'a segmentação'} ${label}, ligado a todos os componentes da página. Use a aba Interações para limitar o alcance.` };
  } },
];

/** Espaço livre para inserir sem sobrepor (varredura em grade de 8 px). */
function freeArea(p: Page, w: number, h: number) {
  const hit = (x: number, y: number) => p.comps.some((c) => !c.hidden && x < c.x + c.w + 8 && x + w + 8 > c.x && y < c.y + c.h + 8 && y + h + 8 > c.y);
  for (let y = 24; y < 3000; y += 8) for (let x = 24; x + w <= p.w - 24; x += 8) if (!hit(x, y)) return { x, y };
  return { x: 24, y: Math.max(...p.comps.map((c) => c.y + c.h)) + 16 };
}

/* ---------- respostas sobre o componente selecionado (Ask this dashboard / Explain / Smart Visualization) ---------- */
function improve(c: Comp): Plan {
  const tips: string[] = [], actions: { label: string; prompt: string }[] = [];
  if (c.type === 'chart') {
    const k = c.props as unknown as ChartProps;
    const rows = rowsOf(c.data!.dataset, c.data!.table, { rules: st().doc!.rules, filters: st().filtersFor(c) });
    const xf = getTable(c.data!.dataset, c.data!.table).fields.find((f) => f.name === k.x);
    const cats = new Set(rows.map((r) => r[k.x])).size;
    if (k.kind === 'pie' && cats > 6) { tips.push(`A pizza tem ${cats} fatias: acima de 6 fica difícil comparar. Barras horizontais ordenadas mostram a mesma coisa com leitura direta.`); actions.push({ label: 'Trocar para barras horizontais', prompt: 'troque para barras horizontais' }); }
    if (xf?.kind === 'date' && (k.kind === 'bar' || k.kind === 'pie')) { tips.push('O eixo é tempo: uma linha mostra tendência melhor que barras.'); actions.push({ label: 'Trocar para linha', prompt: 'troque para linha' }); }
    if (xf?.kind !== 'date' && (k.kind === 'line' || k.kind === 'area')) { tips.push(`${xf?.label} não é tempo: linhas sugerem continuidade que não existe. Barras são mais honestas.`); actions.push({ label: 'Trocar para barras', prompt: 'troque para barras' }); }
    if (k.kind === 'bar' && cats > 12 && k.limit > 12) { tips.push(`São ${cats} categorias: mostre as 10 maiores e deixe o resto para a tabela.`); }
    if (k.kind === 'bar' && cats > 7) { tips.push('Com muitos rótulos longos no eixo X, barras horizontais evitam texto cortado.'); actions.push({ label: 'Trocar para barras horizontais', prompt: 'troque para barras horizontais' }); }
    if (!c.style.subtitle) tips.push('Falta o subtítulo "por dimensão · período" — o leitor não sabe o recorte.');
    if (!k.labels && k.kind !== 'line' && k.kind !== 'area' && cats <= 10) tips.push('Com até 10 categorias, rótulos de dados poupam a ida ao eixo.');
    if (!c.interactions.emitCross) tips.push('O clique não filtra a página. Ligue o cross-filter na aba Interações para explorar a partir deste gráfico.');
  } else if (c.type === 'kpi') {
    const k = c.props as unknown as KpiProps;
    if (k.compare !== 'target') tips.push('O KPI não tem meta: o número sozinho não diz se está bom. Defina uma meta na aba Visual.');
    if (!k.spark) tips.push('Ligue a tendência de 30 dias para mostrar se o valor está melhorando ou piorando.');
  } else if (c.type === 'table') {
    const k = c.props as { columns: string[] };
    if (k.columns.length > 8) tips.push(`São ${k.columns.length} colunas: acima de 8 a tabela vira planilha. Mantenha as que levam a uma decisão.`);
    tips.push('Se o objetivo é ver evolução, uma visualização temporal comunica melhor.'); actions.push({ label: 'Transformar em visualização temporal', prompt: 'Transforme essa tabela em uma visualização temporal.' });
  } else if (c.type === 'map') {
    const L = (c.props as { layers: Record<string, boolean> }).layers;
    const on = Object.values(L).filter(Boolean).length;
    if (on > 5) tips.push(`${on} camadas ligadas ao mesmo tempo competem entre si. Deixe ligadas só as que respondem à pergunta da página.`);
    tips.push('Cores por status são o padrão operacional; para engenharia de capacidade, colorir por utilização mostra gargalos.');
  }
  const issues = layoutIssues(page()).filter((i) => i.ids.includes(c.id));
  for (const i of issues) tips.push(`Layout: ${i.text}.`);
  if (issues.length) actions.push({ label: 'Organizar a página', prompt: 'Organize esse dashboard deixando os indicadores mais importantes primeiro.' });
  if (!tips.length) tips.push(`${c.name} está bem resolvido: tipo adequado ao dado, título com recorte e interação ligada.`);
  return { intent: 'Ask this dashboard', thinking: '', steps: [], summary: () => '', answer: [`Sobre ${COMP_META[c.type].label.toLowerCase()} "${c.name}":`, ...tips.map((t) => `• ${t}`)], actions: [...new Map(actions.map((a) => [a.label, a])).values()] };
}

function explain(c: Comp): Plan {
  if (!c.data) return { intent: 'Explain', thinking: '', steps: [], summary: () => '', answer: [`${c.name} é um componente de layout, sem dados.`] };
  const t = getTable(c.data.dataset, c.data.table);
  const filters = st().filtersFor(c);
  const rows = rowsOf(c.data.dataset, c.data.table, { rules: st().doc!.rules, filters });
  const rules = st().doc!.rules.filter((r) => r.enabled && r.table === t.id);
  const lines: string[] = [];
  if (c.type === 'kpi') {
    const k = c.props as unknown as KpiProps;
    const f = t.fields.find((x) => x.name === k.measure);
    const v = aggregate(rows, { ds: c.data.dataset, table: t.id, measure: k.measure, agg: k.agg })[0]!.value;
    lines.push(`${c.style.title} = ${k.agg === 'count' ? 'contagem' : k.agg === 'avg' ? 'média' : k.agg === 'sum' ? 'soma' : k.agg} de ${k.agg === 'count' ? t.name.toLowerCase() : f?.label.toLowerCase()} sobre ${rows.length} de ${t.rows.length} linhas da tabela ${t.name}: ${fmt(v, k.agg === 'count' ? 'int' : f?.format)}.`);
    if (k.compare === 'target' && k.target != null) lines.push(`Meta: ${k.targetDir === 'above' ? '≥' : '≤'} ${fmt(k.target, f?.format)} → ${(k.targetDir === 'above' ? v >= k.target : v <= k.target) ? 'dentro da meta' : 'fora da meta'}.`);
    if (k.measure !== 'id' && t.fields.some((x) => x.name === 'regiao')) {
      const by = aggregate(rows, { ds: c.data.dataset, table: t.id, groupBy: 'regiao', measure: k.measure, agg: k.agg, sort: 'value' });
      const worst = k.targetDir === 'above' ? [...by].sort((a, b) => a.value - b.value).slice(0, 3) : by.slice(0, 3);
      lines.push(`O que mais pesa: ${worst.map((w) => `${w.label} (${fmt(w.value, f?.format)})`).join(', ')}.`);
    }
  } else if (c.type === 'chart') {
    const k = c.props as unknown as ChartProps;
    const s = aggregate(rows, { ds: c.data.dataset, table: t.id, groupBy: k.x, measure: k.y, agg: k.agg, sort: 'value', limit: 50 });
    const yf = t.fields.find((x) => x.name === k.y), xf = t.fields.find((x) => x.name === k.x);
    if (s.length) {
      if (xf?.kind === 'date') { const first = s[0]!, last = s[s.length - 1]!; lines.push(`${c.style.title} foi de ${fmt(first.value, yf?.format)} (${first.label}) para ${fmt(last.value, yf?.format)} (${last.label}): ${last.value >= first.value ? 'alta' : 'queda'} de ${fmt(Math.abs(last.value - first.value), yf?.format)}.`); }
      else { const top = s[0]!; const tot = s.reduce((a, b) => a + b.value, 0); lines.push(`Maior valor: ${top.label} com ${fmt(top.value, k.agg === 'count' ? 'int' : yf?.format)}${k.agg === 'count' || k.agg === 'sum' ? ` (${fmt((top.value / (tot || 1)) * 100, 'pct')} do total)` : ''}. Menor: ${s[s.length - 1]!.label}.`); }
    }
    lines.push(`Cálculo: ${k.agg === 'count' ? 'contagem de linhas' : `${k.agg === 'avg' ? 'média' : k.agg} de ${yf?.label.toLowerCase()}`} por ${xf?.label.toLowerCase()} na tabela ${t.name}.`);
  } else {
    lines.push(`${c.name} mostra ${rows.length} de ${t.rows.length} linhas da tabela ${t.name}.`);
  }
  if (filters.length) lines.push(`Filtros aplicados agora: ${filters.map((f) => `${t.fields.find((x) => x.name === f.field)?.label ?? f.field} ${f.op === 'in' ? 'em' : f.op} ${Array.isArray(f.value) ? f.value.join(', ') : String(f.value)}`).join('; ')}.`);
  if (rules.length) lines.push(`Regras que alteram o status destas linhas: ${rules.map((r) => r.name).join(', ')}.`);
  return { intent: 'Explain', thinking: '', steps: [], summary: () => '', answer: lines };
}

function smartViz(c: Comp): Plan {
  if (c.type !== 'chart' && c.type !== 'table') return { intent: 'Smart Visualization', thinking: '', steps: [], summary: () => '', answer: ['Selecione um gráfico ou uma tabela para receber a sugestão de visualização.'] };
  const t = getTable(c.data!.dataset, c.data!.table);
  const x = c.type === 'chart' ? t.fields.find((f) => f.name === (c.props as unknown as ChartProps).x) : undefined;
  const cats = x ? new Set(t.rows.map((r) => r[x.name])).size : 0;
  let rec = '', prompt = '';
  if (c.type === 'table') { rec = 'tabelas servem para consulta; para ver tendência use linha (há histórico diário).'; prompt = 'Transforme essa tabela em uma visualização temporal.'; }
  else if (x?.kind === 'date') { rec = 'o eixo é data → linha (ou área, para volume).'; prompt = 'troque para linha'; }
  else if (x?.kind === 'geo' && x.name === 'regiao') { rec = `região é geográfica → um mapa mostra o "onde"; com ${cats} regiões, barras horizontais ordenadas são a alternativa tabular.`; prompt = 'troque para barras horizontais'; }
  else if (cats <= 5) { rec = `${cats} categorias → barras (ou pizza, se a pergunta for participação no total).`; prompt = 'troque para barras'; }
  else { rec = `${cats} categorias com rótulos longos → barras horizontais ordenadas.`; prompt = 'troque para barras horizontais'; }
  return { intent: 'Smart Visualization', thinking: '', steps: [], summary: () => '', answer: [`Para ${c.name}: ${rec}`], actions: [{ label: 'Aplicar sugestão', prompt }] };
}

/** Escolhe o plano para um pedido. */
export function planFor(text: string): Plan {
  const n = norm(text);
  const sel = selected();
  if (/^(explique|explain|o que (e|significa|mostra)|como (e|foi) calculad)/.test(n) && sel[0]) return explain(sel[0]);
  if (/(o que posso melhorar|melhorar aqui|como melhorar|ask this)/.test(n)) {
    if (sel[0]) return improve(sel[0]);
    const issues = layoutIssues(page());
    return { intent: 'Ask this dashboard', thinking: '', steps: [], summary: () => '', answer: [issues.length ? `Encontrei ${issues.length} pontos nesta página:` : 'A página está bem organizada.', ...issues.map((i) => `• ${i.text}`)], actions: issues.length ? [{ label: 'Organizar a página', prompt: 'Organize esse dashboard deixando os indicadores mais importantes primeiro.' }] : [] };
  }
  if (/(smart visualization|melhor visualizacao|sugira (uma )?visualiza|qual visualiza)/.test(n)) return sel[0] ? smartViz(sel[0]) : { intent: 'Smart Visualization', thinking: '', steps: [], summary: () => '', answer: ['Selecione um componente no canvas e peça de novo.'] };
  if (/(problemas? de layout|verifique o layout|revise o layout|layout check)/.test(n)) {
    const issues = layoutIssues(page());
    return { intent: 'Smart Layout', thinking: '', steps: [], summary: () => '', answer: [issues.length ? `${issues.length} ${issues.length === 1 ? 'problema' : 'problemas'} de layout:` : 'Nenhum problema de layout nesta página.', ...issues.map((i) => `• ${i.text}`)], actions: issues.length ? [{ label: 'Corrigir com Smart Layout', prompt: 'Organize esse dashboard deixando os indicadores mais importantes primeiro.' }] : [] };
  }
  if (/^(remova|exclua|apague)/.test(n) && sel.length) return { intent: 'Excluir', thinking: '', steps: [{ label: `Excluir ${sel.length} ${sel.length === 1 ? 'componente' : 'componentes'}`, run: (tx) => { st().commit('IA: excluir componentes', (d) => { const p = d.pages.find((x) => x.id === st().pageId)!; p.comps = p.comps.filter((c) => !sel.some((s) => s.id === c.id)); }, { tx, select: [] }); } }], summary: () => `Excluí ${sel.map((c) => c.name).join(', ')}.` };
  for (const it of INTENTS) if (it.test.test(n)) { const p = it.plan(text); if (p) return p; }
  if (/tabela/.test(n) && /temporal|tempo/.test(n)) return { intent: 'Smart Visualization', thinking: '', steps: [], summary: () => '', answer: ['Não há tabela nesta página para transformar. Selecione uma tabela ou abra uma página que tenha uma.'] };
  return { intent: 'Ajuda', thinking: '', steps: [], summary: () => '', answer: ['Ainda não sei fazer isso aqui. Eu altero o relatório direto, por exemplo:', '• "Crie uma visão executiva da disponibilidade da rede."', '• "Adicione um mapa mostrando os enlaces com maior atenuação."', '• "Crie uma página para acompanhar rompimentos de fibra."', '• "Marque como crítico os enlaces com atenuação acima de 18 dB."', '• Com um componente selecionado: "Explique", "O que posso melhorar aqui?", "troque para linha".'] };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms));

/** Executa um pedido: estado "pensando", etapas com destaque no canvas, resumo e Desfazer. */
export async function ask(text: string) {
  const chat = useCopilotChat.getState();
  if (chat.busy || !text.trim()) return;
  const sel = selected();
  const context = sel.length === 1 ? `${COMP_META[sel[0]!.type].label}: ${sel[0]!.name}` : `Página: ${page().name}`;
  const um: ChatMsg = { id: uid('m'), role: 'user', text, context };
  const am: ChatMsg = { id: uid('m'), role: 'ai', text: '', state: 'thinking' };
  const upd = (p: Partial<ChatMsg>) => useCopilotChat.setState((s) => ({ msgs: s.msgs.map((m) => (m.id === am.id ? { ...m, ...p } : m)) }));
  useCopilotChat.setState((s) => ({ msgs: [...s.msgs, um, am], busy: true }));
  await wait(650);
  const plan = planFor(text);
  if (!plan.steps.length) { upd({ state: 'answer', answer: plan.answer, actions: plan.actions, text: plan.intent }); useCopilotChat.setState({ busy: false }); return; }
  const tx = `ai:${am.id}`;
  const touched: string[] = [];
  upd({ state: 'running', text: plan.thinking, summary: plan.intent, steps: plan.steps.map((s) => ({ label: s.label, done: false })) });
  for (let i = 0; i < plan.steps.length; i++) {
    await wait(420);
    try { const ids = plan.steps[i]!.run(tx); if (ids) touched.push(...ids); } catch (e) { console.error(e); }
    upd({ steps: plan.steps.map((s, j) => ({ label: s.label, done: j <= i })) });
  }
  // rótulo do passo de undo = intenção
  useEditor.setState((s) => { const top = s.past[s.past.length - 1]; return top?.tx === tx ? { past: [...s.past.slice(0, -1), { ...top, label: `IA: ${plan.intent}` }] } : {}; });
  if (touched.length) useEditor.getState().set({ selection: touched.filter((id) => page().comps.some((c) => c.id === id)).slice(0, 12) });
  upd({ state: 'done', summary: plan.summary(), tx, touched });
  useCopilotChat.setState({ busy: false });
}

/** Desfaz a ação da IA (um clique) se ela ainda for o último passo do histórico. */
export function undoAi(m: ChatMsg) {
  const s = useEditor.getState();
  const top = s.past[s.past.length - 1];
  if (!m.tx || top?.tx !== m.tx) { s.toast({ text: 'Há alterações depois desta ação. Use Desfazer (⌘Z) para voltar passo a passo.', tone: 'info' }); return; }
  s.undo();
  useCopilotChat.setState((c) => ({ msgs: c.msgs.map((x) => (x.id === m.id ? { ...x, undone: true } : x)) }));
}
export const canUndoAi = (m: ChatMsg, pastTopTx?: string) => !!m.tx && !m.undone && pastTopTx === m.tx;
export const DEMO_PROMPTS = [
  'Crie uma visão executiva da disponibilidade da rede.',
  'Adicione um mapa mostrando os enlaces com maior atenuação.',
  'Transforme essa tabela em uma visualização temporal.',
  'Crie uma página para acompanhar rompimentos de fibra.',
  'Organize esse dashboard deixando os indicadores mais importantes primeiro.',
];
export { STATUS_LABEL };
export type { KpiProps };
