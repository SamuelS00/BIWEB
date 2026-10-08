/**
 * Copilot de construção: interpreta o pedido, apresenta as etapas para revisão item a item e só então aplica
 * as etapas aceitas sobre o documento (mesma store do canvas). Tudo vira UM passo de undo rotulado "IA: …".
 * A IA é simulada; as mudanças no estado são reais.
 */
import { create } from 'zustand';
import { aggregate, applyRules, fmt, rowsOf, STATUS_LABEL } from '../data/query';
import { getTable } from '../data/registry';
import type { FilterOp, Rule, RuleStatus } from '../data/types';
import { COMP_META, DS, makeComp, uid, type ChartKind, type ChartProps, type Comp, type CompType, type KpiProps, type Page } from './doc';
import { overlaps, useEditor } from './store';
import { adaptKind, KIND_BY_ID, KINDS } from '../viz/engine/kinds';
import { PERIOD_LABEL } from '../viz/engine/model';
import { MARGIN_RULES } from '../viz/cf';

export interface PlanStep { label: string; run: (tx: string) => string[] | void }
export interface Plan { intent: string; thinking: string; steps: PlanStep[]; summary: () => string; answer?: string[]; actions?: { label: string; prompt: string }[] }
export interface ChatMsg {
  id: string; role: 'user' | 'ai'; text: string; context?: string;
  state?: 'thinking' | 'proposal' | 'running' | 'done' | 'answer'; steps?: { label: string; done: boolean; accepted?: boolean | null }[]; summary?: string; answer?: string[];
  actions?: { label: string; prompt: string }[]; tx?: string; touched?: string[]; undone?: boolean;
}
export const useCopilotChat = create<{ msgs: ChatMsg[]; busy: boolean; set: (p: Partial<{ msgs: ChatMsg[]; busy: boolean }>) => void }>((set) => ({ msgs: [], busy: false, set }));
const pendingPlans = new Map<string, Plan>();
const stoppedPlans = new Set<string>();

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
  const c = makeComp(type, r, o.preset ?? {}, Math.max(0, ...p.comps.map((x) => x.z)) + 1, st().doc!.datasets[0] ?? DS);
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
let omitSelectionForPlan = false;
const selected = () => { if (omitSelectionForPlan) return []; const p = page(); return p.comps.filter((c) => st().selection.includes(c.id)); };
const countRows = (table: string, filters: Comp['localFilters'] = []) => rowsOf(DS, table, { rules: st().doc!.rules, filters }).length;

/* ---------- intents ---------- */
type Intent = { id: string; test: RegExp; plan: (text: string) => Plan | null };
const curDs = () => st().doc!.datasets[0] ?? DS;
const MEASURES: Record<string, { ds: string; table: string; field: string; agg: 'sum' | 'avg'; label: string; date: string }> = {
  receita: { ds: 'ds_vendas', table: 'vendas', field: 'receita', agg: 'sum', label: 'Receita', date: 'data' }, vendas: { ds: 'ds_vendas', table: 'vendas', field: 'receita', agg: 'sum', label: 'Receita', date: 'data' },
  faturamento: { ds: 'ds_vendas', table: 'vendas', field: 'receita', agg: 'sum', label: 'Receita', date: 'data' }, margem: { ds: 'ds_vendas', table: 'vendas', field: 'margem_pct', agg: 'sum', label: 'Margem %', date: 'data' },
  pedidos: { ds: 'ds_vendas', table: 'vendas', field: 'pedidos', agg: 'sum', label: 'Pedidos', date: 'data' }, ticket: { ds: 'ds_vendas', table: 'vendas', field: 'ticket_medio', agg: 'sum', label: 'Ticket médio', date: 'data' },
  disponibilidade: { ds: DS, table: 'historico', field: 'disponibilidade', agg: 'avg', label: 'Disponibilidade', date: 'dia' }, utilizacao: { ds: DS, table: 'historico', field: 'utilizacao', agg: 'avg', label: 'Utilização', date: 'dia' },
  atenuacao: { ds: DS, table: 'historico', field: 'atenuacao_dB', agg: 'avg', label: 'Atenuação', date: 'dia' },
};
const KIND_WORDS: [RegExp, ChartKind][] = [[/barras? horizontais?|ranking/, 'hbar'], [/(100|cem) ?%|empilhadas? 100/, 'stacked100'], [/empilhad/, 'stacked'], [/agrupad/, 'grouped'], [/combinad|colunas? e linha|barras e linha/, 'combo'], [/cascata|waterfall/, 'waterfall'], [/histograma/, 'histogram'], [/box ?plot|caixa/, 'box'],
  [/bolhas?|bubble/, 'bubble'], [/dispers/, 'scatter'], [/rosca|pizza|donut|pie/, 'pie'], [/treemap|mapa de arvore/, 'treemap'], [/funil|funnel/, 'funnel'], [/sankey/, 'sankey'], [/medidor|gauge|velocimetro/, 'gauge'], [/bullet/, 'bullet'], [/degrau|step/, 'step'],
  [/calendario/, 'calendar'], [/tabela de calor|heat ?table|mapa de calor de tabela/, 'heat'], [/area/, 'area'], [/linha/, 'line'], [/colunas?|barras?/, 'bar']];
const fieldLabels = (c: Comp) => getTable(c.data!.dataset, c.data!.table).fields;
const NEW_INTENTS: Intent[] = [
  { id: 'kind-any', test: /(troque|mude|transforme|converta|passe|vire).*(para|em|a) (um |uma )?(grafico de |grafico em )?(barras?|colunas?|linha|area|pizza|rosca|dispers|bolhas|histograma|box|cascata|waterfall|treemap|funil|sankey|medidor|bullet|degrau|calendario|tabela de calor|combinad|empilhad|agrupad)/, plan: (text) => {
    const c = selected()[0], n = norm(text);
    if (!c || c.type !== 'chart') return null;
    const tail = n.slice(n.search(/\b(para|em)\b/)), kind = KIND_WORDS.find(([re]) => re.test(tail))?.[1];
    if (!kind) return null;
    const fs = fieldLabels(c), { patch, notes } = adaptKind(c.props as unknown as ChartProps, kind, fs), label = KIND_BY_ID[kind].label.toLowerCase();
    return { intent: `Trocar visualização · ${label}`, thinking: `${KIND_BY_ID[kind].label} responde a «${KIND_BY_ID[kind].question}». Os campos compatíveis são mantidos; o que mudar aparece abaixo.`,
      steps: [{ label: `Trocar ${c.name} para ${label}`, run: (tx) => { st().update(c.id, (d) => { Object.assign(d.props, patch); }, `IA: trocar para ${label}`, tx); return [c.id]; } }, ...notes.map((t) => ({ label: t, run: () => undefined }))],
      summary: () => `Troquei ${c.name} para ${label}, mantendo os campos.${notes.length ? ` ${notes.join(' ')}` : ''} Continua editável nas abas Dados e Visual.` };
  } },
  { id: 'metric-by-time', test: /(adicione|crie|mostre|coloque|inclua|quero).*(receita|vendas|faturamento|margem|pedidos|ticket|disponibilidade|utilizacao|atenuacao).*(por|ao longo|mes a mes|evolucao)/, plan: (text) => {
    const n = norm(text), key = Object.keys(MEASURES).find((k) => n.includes(k));
    if (!key) return null;
    const m = MEASURES[key]!, grain = /trimestre/.test(n) ? 'quarter' : /(por |a )ano|anual/.test(n) ? 'year' : /semana/.test(n) ? 'week' : /(por |de )dia|diari/.test(n) ? 'day' : m.ds === 'ds_vendas' ? 'month' : 'day';
    const gl = { day: 'dia', week: 'semana', month: 'mês', quarter: 'trimestre', year: 'ano' }[grain], kind: ChartKind = grain === 'month' || grain === 'quarter' || grain === 'year' ? 'bar' : 'line';
    const period = m.ds === 'ds_vendas' ? (grain === 'day' ? 'last90d' : grain === 'week' ? 'last12m' : grain === 'year' ? 'all' : 'last12m') : 'all', cmp = /(ano anterior|compar|yoy|meta)/.test(n);
    const steps: PlanStep[] = [];
    if (curDs() !== m.ds) steps.push({ label: `Usar o dataset ${m.ds === 'ds_vendas' ? 'Lume Varejo · Vendas' : 'Rede Metropolitana SP'}`, run: (tx) => { st().commit('IA: escolher dataset', (d) => { d.datasets = [m.ds]; }, { tx }); } });
    steps.push({ label: `Criar gráfico de ${kind === 'bar' ? 'colunas' : 'linha'}: ${m.label.toLowerCase()} por ${gl}${cmp && m.ds === 'ds_vendas' ? ', com ano anterior' : ''}`, run: (tx) => {
      const spot = freeArea(page(), 640, 320);
      return [add(tx, 'chart', { ...spot, w: 640, h: 320 }, { title: `${m.label} por ${gl}`, subtitle: period === 'last12m' ? 'últimos 12 meses' : period === 'last90d' ? 'últimos 90 dias' : 'período completo', table: m.table,
        props: { kind, x: m.date, y: m.field, agg: m.agg, grain, sort: 'none', limit: 0, legend: cmp, labels: false, tooltip: true, responsive: 'fit', period: m.ds === 'ds_vendas' ? period : undefined, compare: cmp && m.ds === 'ds_vendas' ? 'prev' : undefined, zoom: true } })];
    } });
    return { intent: `Build with AI · ${m.label.toLowerCase()} por ${gl}`, thinking: `${m.label} ao longo do tempo é uma pergunta de tendência: ${kind === 'bar' ? 'colunas por ' + gl : 'linha'}, com tooltip rico e zoom por arrasto.`, steps, summary: () => `Adicionei ${m.label.toLowerCase()} por ${gl}. Edite os campos na aba Dados e o visual na aba Visual: nada ficou travado.` };
  } },
  { id: 'compare-prev', test: /(adicione|inclua|mostre|coloque|faca|compare).*(comparacao|compar).*(ano anterior|periodo anterior|yoy)|(ano anterior|yoy)/, plan: () => {
    const c = selected()[0];
    if (!c || !['chart', 'kpi'].includes(c.type) || !c.data) return null;
    const hasDate = fieldLabels(c).some((f) => f.kind === 'date');
    if (!hasDate) return { intent: 'Comparar com o ano anterior', thinking: '', steps: [], summary: () => '', answer: [`A tabela ${getTable(c.data.dataset, c.data.table).name} não tem campo de data, então não há como comparar com o ano anterior.`, 'Escolha um visual baseado em vendas diárias ou em outra tabela com data.'] };
    return { intent: 'Comparar com o ano anterior', thinking: 'O mesmo recorte do ano anterior vira uma série fantasma, e o tooltip mostra a variação (YoY).',
      steps: [{ label: `Comparar ${c.name} com o ano anterior`, run: (tx) => { st().update(c.id, (d) => { const hasT = !!(d.props.target || d.props.targetField); d.props.compare = hasT ? 'both' : 'prev'; if (!d.props.period || d.props.period === 'all') d.props.period = c.type === 'kpi' ? 'last30d' : 'last12m'; if (c.type === 'chart') d.props.legend = true; }, 'IA: comparar com o ano anterior', tx); return [c.id]; } }],
      summary: () => `Liguei a comparação com o ano anterior em ${c.name} (${PERIOD_LABEL[(c.props.period as keyof typeof PERIOD_LABEL) ?? 'last12m'] ?? 'período'}).` };
  } },
  { id: 'tooltip-field', test: /(mostre|inclua|adicione|coloque|exiba).*(margem|pedidos|ticket|meta|receita|utilizacao|atenuacao|disponibilidade|capacidade).*(tooltip|dica)/, plan: (text) => {
    const c = selected()[0], n = norm(text);
    if (!c || c.type !== 'chart' || !c.data) return null;
    const fs = fieldLabels(c), cand = ({ margem: ['margem_pct', 'margem'], pedidos: ['pedidos'], ticket: ['ticket_medio'], meta: ['meta'], receita: ['receita'], utilizacao: ['utilizacao'], atenuacao: ['atenuacao_dB'], disponibilidade: ['disponibilidade'], capacidade: ['capacidade'] } as Record<string, string[]>)[Object.keys({ margem: 0, pedidos: 0, ticket: 0, meta: 0, receita: 0, utilizacao: 0, atenuacao: 0, disponibilidade: 0, capacidade: 0 }).find((k) => n.includes(k)) ?? ''] ?? [];
    const f = cand.map((x) => fs.find((y) => y.name === x)).find(Boolean);
    if (!f) return { intent: 'Tooltip', thinking: '', steps: [], summary: () => '', answer: ['Esse campo não existe na tabela deste gráfico. Veja os campos disponíveis na aba Dados.'] };
    return { intent: `Mostrar ${f.label} no tooltip`, thinking: `${f.label} vira uma linha extra no tooltip, por ponto do gráfico.`, steps: [{ label: `Adicionar ${f.label} ao tooltip de ${c.name}`, run: (tx) => { st().update(c.id, (d) => { const cur = (d.props.tooltipFields as string[] | undefined) ?? []; if (!cur.includes(f.name)) d.props.tooltipFields = [...cur, f.name]; d.props.tooltip = true; }, 'IA: campo no tooltip', tx); return [c.id]; } }], summary: () => `Agora o tooltip de ${c.name} mostra ${f.label}.` };
  } },
  { id: 'add-filter-bi', test: /(adicione|crie|coloque|inclua).*(filtro|segmenta).*(regiao|canal|categoria|estado|cidade|loja|segmento|periodo|data)/, plan: (text) => {
    const n = norm(text);
    if (curDs() !== 'ds_vendas' && !/(periodo|data)/.test(n)) return null;
    const table = page().comps.find((c) => c.data?.dataset === curDs())?.data?.table ?? (curDs() === 'ds_vendas' ? 'vendas' : 'enlaces');
    const fs = getTable(curDs(), table).fields;
    const want = ['regiao', 'canal', 'categoria', 'estado', 'cidade', 'loja', 'segmento'].find((f) => n.includes(f) && fs.some((x) => x.name === f));
    const date = fs.find((f) => f.kind === 'date');
    if (/(periodo|data)/.test(n) && date) return { intent: 'Criar filtro de período', thinking: 'Uma janela relativa (últimos 7, 30, 90 dias, 12 meses) vale para toda a página.', steps: [{ label: 'Adicionar filtro de período (janela relativa)', run: (tx) => { const spot = freeArea(page(), 420, 72); return [add(tx, 'filter', { ...spot, w: 420, h: 72 }, { title: 'Período', table, props: { field: date.name, style: 'relative', multi: false, targets: 'all', defaultValues: [] } })]; } }], summary: () => 'Adicionei um filtro de período. Ele vale para a página; mude para «Relatório» na aba Interação para valer em todas.' };
    if (!want) return null;
    const label = fs.find((f) => f.name === want)!.label, type: CompType = want === 'canal' || want === 'segmento' ? 'slicer' : 'filter';
    return { intent: `Criar filtro de ${label.toLowerCase()}`, thinking: `${type === 'filter' ? 'Lista suspensa' : 'Segmentação'} por ${label.toLowerCase()}, ligada a toda a página.`, steps: [{ label: `Adicionar ${type === 'filter' ? 'filtro' : 'segmentação'} ${label}`, run: (tx) => { const spot = freeArea(page(), type === 'filter' ? 232 : 420, 72); return [add(tx, type, { ...spot, w: type === 'filter' ? 232 : 420, h: 72 }, { title: label, table, props: { field: want, multi: true, targets: 'all' } })]; } }], summary: () => `Adicionei ${type === 'filter' ? 'o filtro' : 'a segmentação'} ${label}, ligado a todos os componentes da página. Use a aba Interação para limitar o alcance.` };
  } },
  { id: 'link-chart', test: /(faca|faça|ligue|conecte|configure).*(grafico|visual|isso|esse|este).*(filtr|destac)/, plan: (text) => {
    const c = selected()[0], n = norm(text);
    if (!c || !c.data || !COMP_META[c.type].data) return null;
    const type: CompType | undefined = /mapa/.test(n) ? 'map' : /tabela/.test(n) ? 'table' : /matriz/.test(n) ? 'matrix' : undefined;
    const targets = page().comps.filter((x) => x.id !== c.id && COMP_META[x.type].data && x.type !== 'filter' && x.type !== 'slicer' && (!type || x.type === type));
    if (!targets.length) return { intent: 'Ligar visuais', thinking: '', steps: [], summary: () => '', answer: [`Não há ${type === 'map' ? 'mapa' : type === 'table' ? 'tabela' : 'outro visual'} nesta página para receber o filtro.`] };
    const highlight = /destac/.test(n);
    return { intent: highlight ? 'Cross-highlight' : 'Cross-filter', thinking: `Clicar em ${c.name} ${highlight ? 'destaca' : 'filtra'} ${targets.map((t) => t.name).join(', ')}.`,
      steps: [{ label: `Clicar em ${c.name} ${highlight ? 'destaca' : 'filtra'}: ${targets.map((t) => t.name).join(', ')}`, run: (tx) => { st().update(c.id, (d) => { d.interactions.emitCross = true; d.interactions.crossMode = highlight ? 'highlight' : 'filter'; d.interactions.affects = targets.map((t) => t.id); }, 'IA: ligar interação', tx); return [c.id]; } }],
      summary: () => `Pronto: ao clicar em ${c.name}, ${highlight ? 'destaco' : 'filtro'} ${targets.length === 1 ? targets[0]!.name : `${targets.length} visuais`}. Ajuste quais visuais reagem na aba Interação.` };
  } },
  { id: 'ref-line', test: /(adicione|coloque|mostre|inclua|crie).*(linha de |linha da |linha do )?(media|mediana|meta|sla|limite|projecao|tendencia)/, plan: (text) => {
    const c = selected()[0], n = norm(text);
    if (!c || c.type !== 'chart' || !KIND_BY_ID[(c.props as unknown as ChartProps).kind].supportsRefs) return null;
    const kind = /mediana/.test(n) ? 'median' : /sla/.test(n) ? 'sla' : /limite/.test(n) ? 'threshold' : /(projecao|tendencia)/.test(n) ? 'forecast' : /meta/.test(n) ? 'target' : 'avg', num = /(\d+(?:[.,]\d+)?)/.exec(n)?.[1];
    const ref = { id: uid('r'), kind, ...(num ? { value: Number(num.replace(',', '.')) } : {}) } as import('./doc').RefLine;
    if (['target', 'sla', 'threshold'].includes(kind) && ref.value == null) return { intent: 'Linha de referência', thinking: '', steps: [], summary: () => '', answer: ['Qual o valor? Por exemplo: «adicione uma linha de meta em 70».'] };
    return { intent: 'Linha de referência', thinking: 'Uma linha de referência dá contexto: o leitor vê se o valor está acima ou abaixo do esperado.', steps: [{ label: `Adicionar linha de ${kind === 'avg' ? 'média' : kind === 'median' ? 'mediana' : kind === 'forecast' ? 'projeção' : kind}${ref.value != null ? ` em ${ref.value}` : ''} em ${c.name}`, run: (tx) => { st().update(c.id, (d) => { d.props.refs = [...((d.props.refs as import('./doc').RefLine[] | undefined) ?? []), ref]; }, 'IA: linha de referência', tx); return [c.id]; } }], summary: () => `Adicionei a linha de referência em ${c.name}. Edite ou remova na aba Visual.` };
  } },
  { id: 'exec-bi', test: /(crie|monte|gere|faca).*(pagina|painel|dashboard).*(executiv|comercial|resumo|desempenho)/, plan: () => {
    if (curDs() !== 'ds_vendas') return null;
    return { intent: 'Build with AI · página executiva comercial', thinking: 'Resumo primeiro (receita, meta, margem, ticket), depois a evolução com meta e ano anterior, o atingimento por região e o que explica a variação.',
      steps: [
        { label: 'Criar a página Visão executiva', run: (tx) => { newPageFor(tx, 'Visão executiva'); } },
        { label: 'Adicionar título e filtros de região e canal', run: (tx) => [add(tx, 'text', { x: M, y: 24, w: 700, h: 44 }, { props: { text: 'Desempenho comercial', size: 'xl', weight: 'strong' } }), add(tx, 'filter', { x: 776, y: 16, w: 232, h: 72 }, { title: 'Região', props: { field: 'regiao', multi: true, targets: 'all' } }), add(tx, 'slicer', { x: 1024, y: 16, w: 232, h: 72 }, { title: 'Canal', props: { field: 'canal', multi: true, showCounts: false, targets: 'all' } })] },
        { label: 'Adicionar 4 indicadores com meta e ano anterior', run: (tx) => { const r = kpiRow(4); return [
          add(tx, 'kpi', r(0, 104), { title: 'Receita · 30 dias', props: { measure: 'receita', agg: 'sum', compare: 'both', targetField: 'meta', period: 'last30d', spark: true } }),
          add(tx, 'kpi', r(1, 104), { title: 'Atingimento da meta', props: { measure: 'atingimento', agg: 'sum', compare: 'both', target: 100, period: 'last30d', spark: true } }),
          add(tx, 'kpi', r(2, 104), { title: 'Margem bruta', props: { measure: 'margem_pct', agg: 'sum', compare: 'both', target: 30, period: 'last30d', spark: true } }),
          add(tx, 'kpi', r(3, 104), { title: 'Ticket médio', props: { measure: 'ticket_medio', agg: 'sum', compare: 'prev', period: 'last30d', spark: true } })]; } },
        { label: 'Adicionar receita × meta × ano anterior (combinado)', run: (tx) => [add(tx, 'chart', { x: M, y: 256, w: 760, h: 300 }, { title: 'Receita, meta e margem', subtitle: 'por mês · 12 meses', props: { kind: 'combo', x: 'data', y: 'receita', y2: 'margem_pct', target: 'meta', compare: 'both', period: 'last12m', grain: 'month', sort: 'none', limit: 0, agg: 'sum', legend: true, labels: false, tooltip: true, responsive: 'fit', tooltipFields: ['pedidos', 'ticket_medio'] } })] },
        { label: 'Adicionar atingimento por região (bullet)', run: (tx) => [add(tx, 'chart', { x: 800, y: 256, w: 456, h: 300 }, { title: 'Atingimento por região', subtitle: 'receita vs meta', props: { kind: 'bullet', x: 'regiao', y: 'receita', target: 'meta', period: 'last12m', agg: 'sum', sort: 'value', limit: 8, legend: false, labels: true, tooltip: true, grain: 'day', responsive: 'fit' } })] },
        { label: 'Adicionar cascata da variação por categoria', run: (tx) => [add(tx, 'chart', { x: M, y: 572, w: 560, h: 300 }, { title: 'O que explica a variação', subtitle: 'ano anterior → atual', props: { kind: 'waterfall', x: 'categoria', y: 'receita', compare: 'prev', period: 'last12m', sort: 'none', labels: true, agg: 'sum', limit: 0, legend: false, tooltip: true, grain: 'day', responsive: 'fit' } })] },
        { label: 'Adicionar matriz de margem por região e canal', run: (tx) => [add(tx, 'matrix', { x: 600, y: 572, w: 656, h: 300 }, { title: 'Margem % por região e canal', props: { rows: 'regiao', cols: 'canal', measure: 'margem_pct', agg: 'sum', heat: false, totals: true, period: 'last12m', rowHier: ['regiao', 'categoria'], cf: [{ id: 'cf1', field: 'margem_pct', kind: 'rules', rules: MARGIN_RULES }] } })] },
      ], summary: () => 'Criei a página Visão executiva: indicadores com meta e ano anterior, evolução combinada, atingimento por região, cascata da variação e matriz de margem. Todos os visuais são editáveis.' };
  } },
  { id: 'annotate', test: /(anote|marque|anotacao|adicione uma anotacao).*(em|no mes de|de)\s+\w+/, plan: (text) => {
    const c = selected()[0], n = norm(text);
    if (!c || c.type !== 'chart') return null;
    const months = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'], mi = months.findIndex((m) => n.includes(m)), year = Number(/(20\d\d)/.exec(n)?.[1] ?? 2026);
    if (mi < 0) return null;
    const label = text.replace(/^(anote|marque|adicione uma anotacao|anotacao)\s*:?\s*/i, '').replace(/\s+(em|no mes de|de)\s+\w+(\s+de)?\s*(20\d\d)?\s*$/i, '').trim() || 'Evento';
    return { intent: 'Anotação', thinking: 'A anotação marca no gráfico o que explica a curva.', steps: [{ label: `Anotar «${label}» em ${months[mi]} de ${year}`, run: (tx) => { st().update(c.id, (d) => { d.props.notes = [...((d.props.notes as import('./doc').Annotation[] | undefined) ?? []), { id: uid('n'), at: Date.UTC(year, mi, 1), label, tone: 'info' }]; }, 'IA: anotação', tx); return [c.id]; } }], summary: () => `Anotei «${label}» em ${months[mi]} de ${year}. A anotação aparece em gráficos com eixo de tempo.` };
  } },
];
void KINDS;

const INTENTS: Intent[] = [
  ...NEW_INTENTS,
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
    const names: Partial<Record<ChartKind, string>> = { bar: 'barras', hbar: 'barras horizontais', line: 'linha', area: 'área', pie: 'pizza', scatter: 'dispersão' };
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

/** Monta uma proposta revisável; nenhuma etapa altera o relatório antes da confirmação explícita. */
export async function ask(text: string, contextOverride?: string, useCanvasSelection = true) {
  const chat = useCopilotChat.getState();
  if (chat.busy || !text.trim()) return;
  const sel = selected();
  const context = contextOverride ?? (sel.length === 1 ? `${COMP_META[sel[0]!.type].label}: ${sel[0]!.name}` : `Página: ${page().name}`);
  const um: ChatMsg = { id: uid('m'), role: 'user', text, context };
  const am: ChatMsg = { id: uid('m'), role: 'ai', text: '', state: 'thinking' };
  const upd = (p: Partial<ChatMsg>) => useCopilotChat.setState((s) => ({ msgs: s.msgs.map((m) => (m.id === am.id ? { ...m, ...p } : m)) }));
  useCopilotChat.setState((s) => ({ msgs: [...s.msgs, um, am], busy: true }));
  await wait(650);
  omitSelectionForPlan = !useCanvasSelection;
  const plan = planFor(text);
  omitSelectionForPlan = false;
  if (!plan.steps.length) { upd({ state: 'answer', answer: plan.answer, actions: plan.actions, text: plan.intent }); useCopilotChat.setState({ busy: false }); return; }
  pendingPlans.set(am.id, plan);
  upd({ state: 'proposal', text: plan.thinking, summary: plan.intent, steps: plan.steps.map((s) => ({ label: s.label, done: false, accepted: null })) });
  useCopilotChat.setState({ busy: false });
}

export function chooseProposalStep(messageId: string, index: number, accepted: boolean) {
  const chat = useCopilotChat.getState();
  useCopilotChat.setState({ msgs: chat.msgs.map((m) => m.id === messageId ? { ...m, steps: m.steps?.map((s, i) => i === index ? { ...s, accepted } : s) } : m) });
}

export async function applyProposal(messageId: string) {
  const chat = useCopilotChat.getState();
  const msg = chat.msgs.find((m) => m.id === messageId);
  const plan = pendingPlans.get(messageId);
  if (!msg || !plan || msg.state !== 'proposal' || !msg.steps || msg.steps.length !== plan.steps.length || msg.steps.some((s) => s.accepted == null) || chat.busy) return;
  const reviewedSteps = msg.steps;
  const accepted = reviewedSteps.flatMap((s, i) => s.accepted ? [i] : []);
  if (!accepted.length) { useCopilotChat.setState({ msgs: chat.msgs.map((m) => m.id === messageId ? { ...m, state: 'done', summary: 'Nenhuma mudança foi aplicada.', steps: m.steps?.map((s) => ({ ...s, done: true })) } : m) }); pendingPlans.delete(messageId); return; }
  const tx = `ai:${messageId}`, touched: string[] = [];
  stoppedPlans.delete(messageId);
  useCopilotChat.setState({ busy: true, msgs: chat.msgs.map((m) => m.id === messageId ? { ...m, state: 'running' } : m) });
  for (const i of accepted) {
    if (stoppedPlans.has(messageId)) break;
    await wait(420);
    if (stoppedPlans.has(messageId)) break;
    try { const ids = plan.steps[i]!.run(tx); if (ids) touched.push(...ids); } catch (e) { console.error(e); }
    const current = useCopilotChat.getState().msgs;
    useCopilotChat.setState({ msgs: current.map((m) => m.id === messageId ? { ...m, steps: m.steps?.map((s, j) => j === i ? { ...s, done: true } : s) } : m) });
  }
  useEditor.setState((s) => { const top = s.past[s.past.length - 1]; return top?.tx === tx ? { past: [...s.past.slice(0, -1), { ...top, label: `IA: ${plan.intent}` }] } : {}; });
  if (touched.length) useEditor.getState().set({ selection: touched.filter((id) => page().comps.some((c) => c.id === id)).slice(0, 12) });
  const stopped = stoppedPlans.has(messageId);
  const current = useCopilotChat.getState().msgs;
  useCopilotChat.setState({ busy: false, msgs: current.map((m) => m.id === messageId ? { ...m, state: 'done', summary: stopped ? 'Pedido interrompido. As etapas já aplicadas permanecem como um único passo de desfazer.' : plan.summary(), tx, touched } : m) });
  pendingPlans.delete(messageId);
}

export function stopProposal(messageId: string) { stoppedPlans.add(messageId); }

/** Desfaz a ação da IA (um clique) se ela ainda for o último passo do histórico. */
export function undoAi(m: ChatMsg) {
  const s = useEditor.getState();
  const top = s.past[s.past.length - 1];
  if (!m.tx || top?.tx !== m.tx) { s.toast({ text: 'Há alterações depois desta ação. Use Desfazer (⌘Z) para voltar passo a passo.', tone: 'info' }); return; }
  s.undo();
  useCopilotChat.setState((c) => ({ msgs: c.msgs.map((x) => (x.id === m.id ? { ...x, undone: true } : x)) }));
}
export const canUndoAi = (m: ChatMsg, pastTopTx?: string) => !!m.tx && !m.undone && pastTopTx === m.tx;
export const DEMO_PROMPTS_BI = [
  'Adicione receita por mês.',
  'Transforme isso em barras horizontais.',
  'Adicione comparação com ano anterior.',
  'Mostre margem no tooltip.',
  'Crie um filtro por região.',
  'Faça esse gráfico filtrar o mapa.',
  'Crie uma página executiva.',
  'Adicione uma linha de média.',
];
export const DEMO_PROMPTS = [
  'Crie uma visão executiva da disponibilidade da rede.',
  'Adicione um mapa mostrando os enlaces com maior atenuação.',
  'Transforme essa tabela em uma visualização temporal.',
  'Crie uma página para acompanhar rompimentos de fibra.',
  'Organize esse dashboard deixando os indicadores mais importantes primeiro.',
];
export { STATUS_LABEL };
export type { KpiProps };
