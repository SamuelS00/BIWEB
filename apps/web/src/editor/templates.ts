import { NOW } from '../net/generate';
import { losSummary } from '../net/los';
import type { Filter, Rule } from '../data/types';
import { DS, makeComp, type Comp, type CompType, type Page, type ReportDoc } from './doc';

/** Relatórios-modelo do workspace Operações de Rede. Todos usam o mesmo dataset: Rede Metropolitana SP. */
type Over = { name?: string; title?: string; subtitle?: string; props?: Record<string, unknown>; table?: string; filters?: Filter[]; style?: Partial<Comp['style']>; interactions?: Partial<Comp['interactions']> };
function factory(prefix: string) {
  let n = 0;
  return (type: CompType, x: number, y: number, w: number, h: number, o: Over = {}, preset: Record<string, unknown> = {}): Comp => {
    const c = makeComp(type, { x, y, w, h }, preset, ++n);
    c.id = `${prefix}_${n}`;
    if (o.title !== undefined) c.style.title = o.title;
    if (o.subtitle !== undefined) c.style.subtitle = o.subtitle;
    c.name = o.name ?? (c.style.title || (type === 'text' && o.props?.text ? String(o.props.text).slice(0, 40) : c.name));
    if (o.props) Object.assign(c.props, o.props);
    if (o.table && c.data) c.data = { dataset: DS, table: o.table };
    if (o.filters) c.localFilters = o.filters;
    if (o.style) Object.assign(c.style, o.style);
    if (o.interactions) Object.assign(c.interactions, o.interactions);
    return c;
  };
}
const page = (id: string, name: string, comps: Comp[], h = 800): Page => ({ id, name, w: 1280, h, comps });
const crit: Filter = { field: 'status', op: 'in', value: ['critical', 'offline'] };
const ativos: Filter = { field: 'situacao', op: '=', value: 'Ativo' };
/** Cinco KPIs alinhados na largura útil (1232 px). */
const row5 = (i: number) => 24 + i * 248;

export const RULE_ATENUACAO: Rule = {
  id: 'rule_atenuacao', name: 'Atenuação acima do limite', enabled: true, dataset: DS, table: 'enlaces',
  conditions: [{ id: 'c1', field: 'atenuacao_dB', op: '>', value: 18 }, { id: 'c2', field: 'status', op: '!=', value: 'offline', join: 'AND' }],
  actions: [{ kind: 'status', value: 'critical' }, { kind: 'alert' }, { kind: 'highlight' }],
};
export const RULE_CAPACIDADE: Rule = {
  id: 'rule_capacidade', name: 'Capacidade crítica', enabled: true, dataset: DS, table: 'enlaces',
  conditions: [{ id: 'c1', field: 'utilizacao', op: '>', value: 80 }],
  actions: [{ kind: 'label', value: 'Capacidade crítica' }, { kind: 'status', value: 'warning' }, { kind: 'highlight' }],
};

function base(id: string, o: Partial<ReportDoc> & Pick<ReportDoc, 'name' | 'description' | 'category' | 'kind' | 'pages' | 'cover'>): ReportDoc {
  return { id, datasets: [DS], rules: [], status: 'Publicado', version: 3, publishedAt: NOW - 2 * 86_400_000, updatedAt: NOW - 2 * 86_400_000, owner: 'Marina Costa', views: 200, ...o };
}

let cache: ReportDoc[] | null = null;
export function seedReports(): ReportDoc[] {
  if (cache) return cache;
  const out: ReportDoc[] = [];

  { // 1 · Visão executiva
    const C = factory('exe');
    out.push(base('net_executiva', {
      name: 'Visão Executiva da Rede', description: 'Disponibilidade, enlaces críticos, eventos ativos e utilização da rede metropolitana, com tendência de 30 dias.',
      category: 'Executivo', kind: 'Dashboard', cover: 'kpi', version: 7, certified: true, views: 1284, updatedAt: NOW - 3 * 3_600_000,
      pages: [
        page('exe_p1', 'Visão geral', [
          C('text', 24, 20, 640, 40, { props: { text: 'Rede Metropolitana SP · situação de hoje', size: 'xl', weight: 'strong' } }),
          C('filter', 776, 16, 232, 72, { title: 'Região', props: { field: 'regiao' } }),
          C('slicer', 1024, 16, 232, 72, { title: 'Camada', props: { field: 'camada', showCounts: false } }),
          C('kpi', row5(0), 104, 232, 128, { title: 'Disponibilidade', subtitle: 'média dos enlaces', props: { measure: 'disponibilidade', agg: 'avg', label: 'Disponibilidade', target: 99.9, targetDir: 'above', spark: true, sparkMeasure: 'disponibilidade', compare: 'target' } }),
          C('kpi', row5(1), 104, 232, 128, { title: 'Enlaces críticos', subtitle: 'crítico ou offline', filters: [crit], props: { measure: 'id', agg: 'count', label: 'Enlaces críticos', target: 5, targetDir: 'below', spark: false, compare: 'target' } }),
          C('kpi', row5(2), 104, 232, 128, { title: 'Eventos ativos', subtitle: 'não resolvidos', table: 'eventos', filters: [ativos], props: { measure: 'id', agg: 'count', label: 'Eventos ativos', spark: false, compare: 'none' } }),
          C('kpi', row5(3), 104, 232, 128, { title: 'Utilização', subtitle: 'média dos enlaces', props: { measure: 'utilizacao', agg: 'avg', label: 'Utilização', target: 70, targetDir: 'below', spark: true, sparkMeasure: 'utilizacao', compare: 'target' } }),
          C('kpi', row5(4), 104, 232, 128, { title: 'Atenuação', subtitle: 'média dos enlaces', props: { measure: 'atenuacao_dB', agg: 'avg', label: 'Atenuação', target: 12, targetDir: 'below', spark: true, sparkMeasure: 'atenuacao_dB', compare: 'target' } }),
          C('chart', 24, 248, 760, 300, { title: 'Disponibilidade', subtitle: 'média diária · últimos 30 dias (%)', table: 'historico', props: { kind: 'area', x: 'dia', y: 'disponibilidade', agg: 'avg', sort: 'none', limit: 30, legend: false, labels: false } }),
          C('chart', 800, 248, 456, 300, { title: 'Enlaces', subtitle: 'por status', props: { kind: 'pie', x: 'status', y: 'id', agg: 'count', legend: true, labels: true } }),
          C('chart', 24, 564, 760, 212, { title: 'Eventos', subtitle: 'por região · top 8 · 30 dias', table: 'eventos', props: { kind: 'bar', x: 'regiao', y: 'id', agg: 'count', limit: 8, labels: true } }),
          C('status', 800, 564, 456, 88, { title: 'Saúde dos enlaces', props: { field: 'status', mode: 'counts' } }),
          C('card', 800, 668, 456, 108, { title: 'Próximo passo', props: { body: '4 rompimentos de fibra ativos (Barueri, Osasco, Itaquera e Santo Amaro). Veja onde cada região está na página Regiões.', icon: 'warning' }, interactions: { navigateTo: 'exe_p2' } }),
        ]),
        page('exe_p2', 'Regiões', [
          C('matrix', 24, 24, 616, 752, { title: 'Enlaces', subtitle: 'região × status', props: { rows: 'regiao', cols: 'status', measure: 'id', agg: 'count', heat: true, totals: true } }),
          C('chart', 656, 24, 600, 360, { title: 'Disponibilidade', subtitle: 'por região · 10 piores (%)', props: { kind: 'hbar', x: 'regiao', y: 'disponibilidade', agg: 'avg', sort: 'asc', limit: 10, labels: true } }),
          C('table', 656, 400, 600, 376, { title: 'Enlaces críticos', subtitle: 'crítico ou offline', filters: [crit], props: { columns: ['id', 'regiao', 'status', 'atenuacao_dB', 'utilizacao'] } }),
        ]),
      ],
    }));
  }
  { // 2 · Operações de rede (topologia)
    const C = factory('ops');
    out.push(base('net_operacoes', {
      name: 'Operações de Rede', description: 'Topologia de POPs, torres, equipamentos e enlaces. Clique num cabo para ver origem, destino, ocupação, atenuação e eventos.',
      category: 'Operações', kind: 'Mapa operacional', cover: 'topology', version: 12, certified: true, views: 2210, updatedAt: NOW - 40 * 60_000, rules: [RULE_ATENUACAO],
      pages: [
        page('ops_p1', 'Topologia', [
          C('slicer', 24, 16, 400, 72, { title: 'Camada', props: { field: 'camada', showCounts: true } }),
          C('slicer', 440, 16, 456, 72, { title: 'Status', props: { field: 'status', showCounts: true } }),
          C('map', 24, 104, 872, 672, { title: 'Topologia da rede', subtitle: 'POP → equipamento → fibra → segmento → destino', props: { variant: 'topology', layers: { regioes: false, enlaces: true, nos: true, eventos: false, rotas: false, heat: false, cobertura: false, clusters: false, clientes: false } } }, { variant: 'topology' }),
          C('status', 912, 16, 344, 96, { title: 'Saúde dos enlaces', props: { field: 'status', mode: 'counts' } }),
          C('chart', 912, 128, 344, 240, { title: 'Enlaces', subtitle: 'por camada e status', props: { kind: 'hbar', x: 'camada', y: 'id', agg: 'count', series: 'status', legend: true, labels: false } }),
          C('table', 912, 384, 344, 392, { title: 'Precisam de atenção', subtitle: 'crítico ou offline', filters: [crit], props: { columns: ['id', 'status', 'atenuacao_dB'], sortBy: 'atenuacao_dB' } }),
        ]),
        page('ops_p2', 'Inventário', [
          C('table', 24, 24, 1232, 368, { title: 'Enlaces', subtitle: '346 segmentos', props: { columns: ['id', 'nome', 'camada', 'tipo', 'tecnologia', 'regiao', 'status', 'capacidade', 'utilizacao', 'atenuacao_dB', 'extensao_km'] } }),
          C('table', 24, 408, 1232, 368, { title: 'Nós', subtitle: 'POPs, torres e equipamentos', table: 'nos', props: { columns: ['id', 'tipo', 'subtipo', 'regiao', 'status', 'tecnologia', 'utilizacao', 'alarmes', 'altura_m'], sortBy: 'alarmes' } }),
        ]),
      ],
    }));
  }
  { // 3 · Operações geográficas
    const C = factory('geo');
    out.push(base('net_geografica', {
      name: 'Operações Geográficas', description: 'O mapa é o espaço de trabalho: ativos, regiões, eventos, rotas, cobertura e clientes, com camadas e detalhes do elemento selecionado.',
      category: 'Operações', kind: 'Mapa operacional', cover: 'map', version: 9, certified: true, views: 1876, updatedAt: NOW - 2 * 3_600_000, rules: [RULE_ATENUACAO],
      pages: [
        page('geo_p1', 'Mapa operacional', [
          C('filter', 24, 16, 220, 72, { title: 'Região', props: { field: 'regiao' } }),
          C('slicer', 256, 16, 384, 72, { title: 'Status', props: { field: 'status', showCounts: true } }),
          C('slicer', 652, 16, 280, 72, { title: 'Criticidade', props: { field: 'criticidade', showCounts: false } }),
          C('slicer', 944, 16, 312, 72, { title: 'Tipo de enlace', props: { field: 'tipo', showCounts: true } }),
          C('map', 24, 104, 1232, 672, { title: 'Rede metropolitana', subtitle: 'ativos, enlaces e ocorrências', props: { layers: { regioes: true, enlaces: true, nos: true, eventos: true, rotas: false, heat: false, cobertura: false, clusters: true, clientes: false } } }),
        ]),
        page('geo_p2', 'Mapa de calor', [
          C('map', 24, 24, 760, 752, { title: 'Concentração de eventos', subtitle: 'últimos 30 dias', props: { variant: 'heat', layers: { regioes: true, enlaces: false, nos: false, eventos: false, rotas: false, heat: true, cobertura: false, clusters: false, clientes: false } } }, { variant: 'heat' }),
          C('chart', 800, 24, 456, 360, { title: 'Eventos', subtitle: 'por tipo · 30 dias', table: 'eventos', props: { kind: 'hbar', x: 'tipo', y: 'id', agg: 'count', labels: true } }),
          C('chart', 800, 400, 456, 376, { title: 'Eventos', subtitle: 'por região · top 10', table: 'eventos', props: { kind: 'bar', x: 'regiao', y: 'id', agg: 'count', limit: 10, labels: true } }),
        ]),
      ],
    }));
  }
  { // 4 · Campo
    const C = factory('fld');
    out.push(base('net_campo', {
      name: 'Operações de Campo', description: 'Ocorrências ativas, onde estão e há quanto tempo — para despachar equipes e acompanhar a resolução.',
      category: 'Campo', kind: 'Dashboard', cover: 'kpi', version: 4, views: 642, updatedAt: NOW - 25 * 60_000,
      pages: [
        page('fld_p1', 'Despacho', [
          C('kpi', 24, 24, 296, 120, { title: 'Ocorrências ativas', table: 'eventos', filters: [ativos], props: { measure: 'id', agg: 'count', label: 'Ocorrências ativas', spark: false, compare: 'none' } }),
          C('kpi', 336, 24, 296, 120, { title: 'Rompimentos ativos', table: 'eventos', filters: [ativos, { field: 'tipo', op: '=', value: 'Rompimento de fibra' }], props: { measure: 'id', agg: 'count', label: 'Rompimentos', spark: false, compare: 'none' } }),
          C('kpi', 648, 24, 296, 120, { title: 'Duração média', subtitle: 'eventos resolvidos (min)', table: 'eventos', filters: [{ field: 'situacao', op: '=', value: 'Resolvido' }], props: { measure: 'duracao_min', agg: 'avg', label: 'Duração média', spark: false, compare: 'none' } }),
          C('status', 960, 24, 296, 120, { title: 'Severidade', table: 'eventos', filters: [ativos], props: { field: 'severidade', mode: 'counts' } }),
          C('map', 24, 160, 760, 616, { title: 'Ocorrências', subtitle: 'ativas e últimas 72 h', props: { layers: { regioes: true, enlaces: true, nos: false, eventos: true, rotas: false, heat: false, cobertura: false, clusters: false, clientes: false }, colorBy: 'status' } }),
          C('table', 800, 160, 456, 616, { title: 'Fila de despacho', table: 'eventos', filters: [ativos], props: { columns: ['id', 'tipo', 'elementoNome', 'regiao', 'data'], sortBy: 'data' } }),
        ]),
      ],
    }));
  }
  { // 5 · Capacidade
    const C = factory('cap');
    out.push(base('net_capacidade', {
      name: 'Capacidade e Utilização', description: 'Onde a rede está perto do limite: utilização por região, camada e tecnologia, com a regra de capacidade crítica (> 80%).',
      category: 'Capacidade', kind: 'Dashboard', cover: 'chart', version: 5, views: 905, updatedAt: NOW - 26 * 3_600_000, rules: [RULE_CAPACIDADE],
      pages: [
        page('cap_p1', 'Utilização', [
          C('kpi', 24, 24, 296, 128, { title: 'Utilização média', props: { measure: 'utilizacao', agg: 'avg', label: 'Utilização', target: 70, targetDir: 'below', spark: true, sparkMeasure: 'utilizacao', compare: 'target' } }),
          C('kpi', 336, 24, 296, 128, { title: 'Acima de 80%', subtitle: 'enlaces', filters: [{ field: 'utilizacao', op: '>', value: 80 }], props: { measure: 'id', agg: 'count', label: 'Enlaces acima de 80%', spark: false, compare: 'none' } }),
          C('kpi', 648, 24, 296, 128, { title: 'Capacidade instalada', props: { measure: 'capacidade', agg: 'sum', label: 'Capacidade', spark: false, compare: 'none' } }),
          C('slicer', 960, 24, 296, 128, { title: 'Camada', props: { field: 'camada', orientation: 'vertical', showCounts: true } }),
          C('chart', 24, 168, 616, 300, { title: 'Utilização', subtitle: 'média por região · top 10 (%)', props: { kind: 'bar', x: 'regiao', y: 'utilizacao', agg: 'avg', limit: 10, labels: true } }),
          C('chart', 656, 168, 600, 300, { title: 'Utilização', subtitle: 'média diária · 30 dias (%)', table: 'historico', props: { kind: 'line', x: 'dia', y: 'utilizacao', agg: 'avg', sort: 'none', limit: 30 } }),
          C('chart', 24, 484, 616, 292, { title: 'Utilização × capacidade', subtitle: 'por enlace', props: { kind: 'scatter', x: 'capacidade', y: 'utilizacao', series: 'camada', legend: true, limit: 400 } }),
          C('matrix', 656, 484, 600, 292, { title: 'Utilização', subtitle: 'camada × tecnologia (%)', props: { rows: 'tecnologia', cols: 'camada', measure: 'utilizacao', agg: 'avg', heat: true, totals: false } }),
        ]),
      ],
    }));
  }
  { // 6 · Incidentes
    const C = factory('inc');
    out.push(base('net_incidentes', {
      name: 'Incidentes de Rede', description: 'Rompimentos, quedas e alarmes dos últimos 30 dias: quando, onde, quanto duraram e o que ainda está ativo.',
      category: 'Operações', kind: 'Dashboard', cover: 'heat', version: 6, certified: true, views: 1430, updatedAt: NOW - 50 * 60_000,
      pages: [
        page('inc_p1', 'Incidentes', [
          C('slicer', 24, 16, 616, 72, { title: 'Tipo de evento', table: 'eventos', props: { field: 'tipo', showCounts: true } }),
          C('slicer', 656, 16, 296, 72, { title: 'Situação', table: 'eventos', props: { field: 'situacao', showCounts: true } }),
          C('filter', 968, 16, 288, 72, { title: 'Região', table: 'eventos', props: { field: 'regiao' } }),
          C('timeline', 24, 104, 1232, 232, { title: 'Eventos', subtitle: 'por dia e tipo · 30 dias' }),
          C('map', 24, 352, 616, 424, { title: 'Onde', subtitle: 'concentração de eventos', props: { variant: 'heat', layers: { regioes: true, enlaces: false, nos: false, eventos: true, rotas: false, heat: true, cobertura: false, clusters: false, clientes: false } } }, { variant: 'heat' }),
          C('table', 656, 352, 600, 424, { title: 'Eventos', table: 'eventos', props: { columns: ['id', 'data', 'tipo', 'elementoNome', 'regiao', 'severidade', 'situacao', 'duracao_min'], sortBy: 'data' } }),
        ]),
      ],
    }));
  }
  { // 7 · Rotas
    const C = factory('rot');
    out.push(base('net_rotas', {
      name: 'Análise de Rotas', description: 'Origem, destino, caminho e pontos intermediários das 18 rotas, com desvios ativos e a linha do tempo de alterações.',
      category: 'Engenharia', kind: 'Mapa operacional', cover: 'routes', version: 3, views: 588, updatedAt: NOW - 5 * 3_600_000,
      pages: [
        page('rot_p1', 'Rotas', [
          C('slicer', 24, 16, 456, 72, { title: 'Status da rota', table: 'rotas', props: { field: 'status', showCounts: true } }),
          C('slicer', 496, 16, 240, 72, { title: 'Com desvio', table: 'rotas', props: { field: 'com_desvio', showCounts: true } }),
          C('map', 24, 104, 1232, 480, { title: 'Rotas', subtitle: 'caminho, desvio e pontos intermediários', table: 'rotas', props: { variant: 'routes', routeId: 'ROT-01', layers: { regioes: true, enlaces: true, nos: false, eventos: true, rotas: true, heat: false, cobertura: false, clusters: false, clientes: false } } }, { variant: 'routes' }),
          C('table', 24, 600, 1232, 176, { title: 'Rotas', table: 'rotas', props: { columns: ['id', 'nome', 'status', 'distancia_km', 'latencia_ms', 'disponibilidade', 'saltos', 'com_desvio'], sortBy: 'status', sortDir: 'asc' } }),
        ]),
      ],
    }));
  }
  { // 8 · Saúde da infraestrutura
    const C = factory('inf');
    out.push(base('net_infra', {
      name: 'Saúde da Infraestrutura', description: 'POPs, torres e equipamentos: disponibilidade, alarmes e status por tipo e tecnologia.',
      category: 'Engenharia', kind: 'Dashboard', cover: 'chart', version: 2, views: 377, updatedAt: NOW - 3 * 86_400_000,
      pages: [
        page('inf_p1', 'Ativos', [
          C('slicer', 24, 16, 400, 72, { title: 'Tipo de ativo', table: 'nos', props: { field: 'tipo', showCounts: true } }),
          C('status', 440, 16, 816, 72, { title: 'Status dos ativos', table: 'nos', style: { showTitle: false }, props: { field: 'status', mode: 'counts' } }),
          C('chart', 24, 104, 616, 320, { title: 'Disponibilidade', subtitle: 'por tecnologia (%)', table: 'nos', props: { kind: 'hbar', x: 'tecnologia', y: 'disponibilidade', agg: 'avg', sort: 'none', labels: true } }),
          C('chart', 656, 104, 600, 320, { title: 'Alarmes ativos', subtitle: 'por região · top 10', table: 'nos', props: { kind: 'bar', x: 'regiao', y: 'alarmes', agg: 'sum', limit: 10, labels: true } }),
          C('table', 24, 440, 1232, 336, { title: 'Ativos com alarme', table: 'nos', filters: [{ field: 'alarmes', op: '>', value: 0 }], props: { columns: ['id', 'tipo', 'subtipo', 'regiao', 'status', 'alarmes', 'disponibilidade', 'tecnologia', 'proprietario'], sortBy: 'alarmes' } }),
        ]),
      ],
    }));
  }
  { // 9 · Gêmeo digital
    const C = factory('twn');
    out.push(base('net_gemeo', {
      name: 'Gêmeo Digital 3D da Rede', description: 'Relevo, edifícios, torres, fibras e cobertura em 3D. Linha de visada e altura das torres para planejar enlaces de rádio.',
      category: 'Engenharia', kind: 'Gêmeo digital', cover: '3d', version: 2, views: 512, updatedAt: NOW - 6 * 3_600_000,
      pages: [
        page('twn_p1', 'Torre SP-023', [
          C('scene3d', 24, 24, 880, 752, { title: 'Gêmeo digital', subtitle: 'São Mateus · Torre SP-023 e entorno' }),
          C('status', 920, 24, 336, 120, { title: 'Torre SP-023', table: 'nos', props: { field: 'status', mode: 'element', element: 'Torre SP-023' } }),
          C('table', 920, 160, 336, 304, { title: 'Enlaces da torre', filters: [{ field: 'nome', op: 'contains', value: 'Torre SP-023' }], props: { columns: ['id', 'tipo', 'status', 'atenuacao_dB'] } }),
          C('card', 920, 480, 336, 296, { title: 'Por que 3D', props: { body: `${losSummary()} No mapa 2D essa obstrução não aparece.`, icon: 'info' } }),
        ]),
      ],
    }));
  }
  { // 10 · Manutenção
    const C = factory('man');
    out.push(base('net_manutencao', {
      name: 'Manutenção Programada', description: 'Janelas de manutenção dos últimos 30 dias e elementos afetados.',
      category: 'Campo', kind: 'Relatório paginado', cover: 'chart', status: 'Rascunho', version: 1, views: 41, owner: 'Rafael Lima', updatedAt: NOW - 4 * 86_400_000,
      pages: [
        page('man_p1', 'Janelas', [
          C('timeline', 24, 24, 1232, 240, { title: 'Manutenções', subtitle: 'por dia · 30 dias', filters: [{ field: 'tipo', op: '=', value: 'Manutenção programada' }], props: { groupBy: 'regiao' } }),
          C('table', 24, 280, 1232, 496, { title: 'Janelas de manutenção', table: 'eventos', filters: [{ field: 'tipo', op: '=', value: 'Manutenção programada' }], props: { columns: ['id', 'data', 'elementoNome', 'regiao', 'duracao_min', 'situacao'], sortBy: 'data' } }),
        ]),
      ],
    }));
  }
  cache = out;
  return out;
}

/** Relatório em branco para "Novo relatório". */
export function blankReport(): ReportDoc {
  const id = `net_${Math.random().toString(36).slice(2, 8)}`;
  return { id, name: 'Relatório sem título', description: '', category: 'Operações', kind: 'Dashboard', datasets: [DS], rules: [], status: 'Rascunho', version: 0,
    updatedAt: Date.now(), owner: 'Marina Costa', views: 0, cover: 'chart', pages: [{ id: `${id}_p1`, name: 'Página 1', w: 1280, h: 800, comps: [] }] };
}
