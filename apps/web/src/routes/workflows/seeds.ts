import { COL, ROW } from './engine';
import { defaultCfg } from './model';
import type { Cfg, Doc, Sim, Version, WEdge, WGroup, WNode, WVar, Workflow, WfKind } from './model';

/** Definições de demonstração: oito processos diferentes sobre o mesmo motor. */
type N = [id: string, kind: string, name: string, col: number, row: number, extra?: { cfg?: Cfg; sim?: Partial<Sim>; note?: string; desc?: string }];
const nodes = (list: N[]): WNode[] => list.map(([id, kind, name, col, row, x]) => ({ id, kind, name, x: col * COL, y: row * ROW, cfg: { ...defaultCfg(kind), ...x?.cfg }, sim: x?.sim, note: x?.note, desc: x?.desc }));
/** 'a>b', 'a>b:porta', sufixos: '|rótulo', '!' erro, '^' retorno. */
const edges = (list: string[]): WEdge[] => list.map((s) => {
  const back = s.includes('^'), err = s.includes('!'), [path = '', label] = s.replace(/[!^]/g, '').split('|'), [from = '', rest = ''] = path.split('>'), [to = '', port] = rest.split(':');
  return { id: `${from}>${to}${port ? ':' + port : ''}`, from, to, port, label, err: err || undefined, back: back || undefined };
});
const G = (id: string, name: string, tone: WGroup['tone'], ids: string[], collapsed?: boolean): WGroup => ({ id, name, tone, nodes: ids, collapsed });
const V = (key: string, label: string, value: string, options?: string[]): WVar => ({ key, label, value, type: options ? 'select' : 'text', options });
const ENV = V('environment', 'Ambiente', 'Produção', ['Produção', 'Homologação']);
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

interface Seed extends Omit<Workflow, 'versions' | 'published'> { notes: [string, string][] }
const SEEDS: Seed[] = [
  {
    id: 'ingestao', name: 'Ingestão e normalização · Pedidos', kind: 'batch', tag: 'Dados', unit: 'linhas', bpr: 660, schedule: 'Diário · 06:00', next: 'Amanhã 06:00',
    description: 'Da fonte bruta no Oracle até o dashboard comercial, com perfil por IA e normalização em paralelo.',
    nodes: nodes([
      ['t', 'schedule', 'Todo dia 06:00', 0, 1],
      ['ora', 'oracle', 'Pedidos Oracle', 1, 1, { cfg: { conn: 'oracle-legado', object: 'COMERCIAL.PEDIDOS' } }],
      ['imp', 'updateds', 'Importar para staging', 2, 1, { cfg: { name: 'orders_raw' }, sim: { dur: 5 } }],
      ['prof', 'analyze', 'Perfil por IA', 3, 1, { sim: { dur: 4 }, note: 'Detectou 14 colunas · CPF armazenado como texto · 0,8% de pedidos duplicados · relação provável PEDIDOS → CLIENTES por cliente_id.' }],
      ['split', 'branch', 'Separar entidades', 4, 1],
      ['trim', 'normalize', 'Remover espaços', 5, 0, { cfg: { in: 'orders_raw', rules: 'Remover espaços', out: 'customers_t1' }, sim: { dur: 3 } }],
      ['cpf', 'normalize', 'Normalizar CPF', 6, 0, { cfg: { in: 'customers_t1', rules: 'Normalizar CPF', out: 'customers_t2' }, sim: { dur: 3 } }],
      ['dates', 'convert', 'Converter datas', 7, 0, { cfg: { field: 'data_cadastro', to: 'Data', onInvalid: 'Falhar' }, sim: { dur: 3, fail: { reason: 'Formato de data inválido', rows: 12842, fixKey: 'onInvalid', fixValue: 'Quarentena', hint: '31% dos valores usam dd/mm/aa e o restante aaaa-mm-dd; há datas impossíveis como 31/02.' } } }],
      ['ord', 'normalize', 'Normalizar pedidos', 5, 2, { cfg: { in: 'orders_raw', rules: 'Remover espaços|Converter datas', out: 'orders_clean' }, sim: { dur: 6 } }],
      ['join', 'join', 'Juntar clientes e pedidos', 8, 1, { cfg: { key: 'cliente_id', type: 'Left' }, sim: { ratio: 1, dur: 4 } }],
      ['val', 'validate', 'Validar', 9, 1, { sim: { dur: 3 } }],
      ['dd', 'dedupe', 'Deduplicar', 10, 1, { cfg: { key: 'id_pedido' }, sim: { ratio: 0.46, bpr: 500, dur: 3 } }],
      ['ds', 'o-dataset', 'Dataset pedidos_clean', 11, 1, { cfg: { out: 'pedidos_clean' } }],
      ['sem', 'o-semantic', 'Modelo semântico Comercial', 12, 1, { cfg: { model: 'Vendas Varejo' } }],
      ['dash', 'o-dashboard', 'Dashboard Comercial', 13, 1, { cfg: { report: 'Visão executiva' } }],
    ]),
    edges: edges(['t>ora', 'ora>imp', 'imp>prof', 'prof>split', 'split>trim', 'split>ord', 'trim>cpf', 'cpf>dates', 'dates>join', 'ord>join', 'join>val', 'val>dd', 'dd>ds', 'ds>sem', 'sem>dash']),
    groups: [G('g1', 'Normalizar clientes', 'accent', ['trim', 'cpf', 'dates'], true)],
    vars: [ENV, V('date_range', 'Período', 'Últimas 24 h', ['Últimas 24 h', '7 dias', 'Mês atual']), V('tenant', 'Tenant', 'varejo-sul'), V('region', 'Região', 'Todas', ['Todas', 'Sul', 'Sudeste', 'Nordeste'])],
    notes: [['Publicado', 'Normalização de clientes em paralelo com pedidos'], ['Anterior', 'Perfil por IA antes da normalização'], ['Anterior', 'Carga completa diária do Oracle']],
  },
  {
    id: 'legado', name: 'Migração de legado · Vendas', kind: 'batch', tag: 'Dados', unit: 'linhas', bpr: 380,
    description: 'Planilha antiga e API nova convivem: campos equivalentes, reconciliação e histórico preservado.',
    nodes: nodes([
      ['t', 'manual', 'Iniciar migração', 0, 1],
      ['xl', 'excel', 'Excel legado', 1, 0, { cfg: { file: 'vendas_2019_2024.xlsx', sheet: 'Consolidado' }, sim: { out: 410000 } }],
      ['api', 'api', 'Nova API de vendas', 1, 2, { cfg: { url: 'https://api.empresa.com/v2/vendas' }, sim: { out: 86000 } }],
      ['fm', 'mapschema', 'Mapeamento de campos', 2, 0, { note: 'A IA encontrou equivalência de 41 dos 43 campos. “Cod_Cli” → cliente_id e “Vlr_Total” → valor_total precisam de conversão.', sim: { dur: 4 } }],
      ['rec', 'validate', 'Reconciliação', 3, 1, { cfg: { rules: 'Chaves únicas|Domínio de valores', onfail: 'Avisar' }, sim: { dur: 4, out: 489000, warn: '3.214 vendas existem só na planilha antiga' } }],
      ['mg', 'merge', 'Mesclar preservando histórico', 4, 1, { sim: { dur: 2 } }],
      ['ds', 'o-dataset', 'Dataset histórico de vendas', 5, 1, { cfg: { out: 'vendas_historico', mode: 'Upsert' } }],
    ]),
    edges: edges(['t>xl', 't>api', 'xl>fm', 'fm>rec', 'api>rec', 'rec>mg', 'mg>ds']),
    groups: [G('g1', 'Fontes', 'neutral', ['xl', 'api'])],
    vars: [ENV, V('cutoff', 'Data de corte', '01/01/2025')],
    notes: [['Publicado', 'Reconciliação por chave de venda'], ['Anterior', 'Mapeamento sugerido por IA'], ['Anterior', 'Primeira versão']],
  },
  {
    id: 'incidente-rede', name: 'Incidente de rede em tempo real', kind: 'realtime', tag: 'Tempo real', unit: 'eventos', bpr: 220, live: { eps: 1240, lag: 0.8 },
    description: 'Telemetria, limiar, anomalia e classificação por IA decidem entre resposta crítica e registro.',
    nodes: nodes([
      ['tel', 'realtime', 'Telemetria de rede', 0, 1, { cfg: { topic: 'net.telemetry', eps: 1240 }, sim: { out: 1240 } }],
      ['thr', 'threshold', 'Atenuação > 18 dB', 1, 1, { sim: { ratio: 0.08 } }],
      ['an', 'anomaly', 'Detectar anomalia', 2, 1, { sim: { ratio: 0.3, dur: 1.4 } }],
      ['cls', 'classify', 'Classificar incidente', 3, 1, { cfg: { labels: 'Crítico, Alto, Normal' }, sim: { dur: 1.6, ratio: 1 }, note: 'Classifica por severidade (0–100) usando histórico de falhas por rota.' }],
      ['sev', 'if', 'Severidade > 80?', 4, 1, { cfg: { expr: 'severidade > 80' }, sim: { route: 'yes', dur: 0.6 } }],
      ['inc', 'createincident', 'Criar incidente', 5, 0, { cfg: { title: 'Degradação em {{region}}', queue: 'NOC' }, sim: { dur: 1 } }],
      ['map', 'updatemap', 'Atualizar mapa de rede', 6, 0, { cfg: { map: 'Rede óptica', layer: 'Incidentes' }, sim: { dur: 1.2 } }],
      ['not', 'notify', 'Notificar Operações', 7, 0, { cfg: { channel: 'Chat', to: '#noc-operacoes' }, sim: { dur: 0.8 } }],
      ['ref', 'refreshdash', 'Atualizar dashboard', 8, 0, { cfg: { report: 'Rede · Operações' }, sim: { dur: 1 } }],
      ['reg', 'writedb', 'Registrar ocorrência', 5, 2, { cfg: { conn: 'pg-netops', table: 'public.ocorrencias' }, sim: { dur: 1 } }],
    ]),
    edges: edges(['tel>thr', 'thr>an', 'an>cls', 'cls>sev', 'sev>inc:yes|Crítico', 'sev>reg:no|Normal', 'inc>map', 'map>not', 'not>ref']),
    groups: [G('g1', 'Resposta crítica', 'warning', ['inc', 'map', 'not', 'ref'])],
    vars: [ENV, V('threshold', 'Limiar de atenuação (dB)', '18'), V('region', 'Região', 'Todas', ['Todas', 'Sul', 'Sudeste']), V('tenant', 'Tenant', 'telecom-sp')],
    notes: [['Publicado', 'Classificação por IA antes da decisão'], ['Anterior', 'Limiar fixo de 18 dB'], ['Anterior', 'Somente registro, sem incidente']],
  },
  {
    id: 'campo', name: 'Operações de campo', kind: 'operations', tag: 'Operações', unit: 'itens', bpr: 300,
    description: 'Do incidente à equipe mais próxima, rota, tarefa e conclusão, conectado ao mapa de campo.',
    nodes: nodes([
      ['t', 'incident', 'Novo incidente', 0, 1, { cfg: { sev: 'Alta' } }],
      ['loc', 'geocode', 'Obter localização', 1, 1, { cfg: { addr: 'endereco_ocorrencia' }, sim: { dur: 1.5 } }],
      ['near', 'dataset', 'Buscar equipe mais próxima', 2, 1, { cfg: { name: 'equipes_campo' }, sim: { out: 1, dur: 1.5 } }],
      ['rt', 'route', 'Calcular rota', 3, 1, { sim: { dur: 1.5 } }],
      ['as', 'createtask', 'Atribuir tarefa', 4, 1, { cfg: { title: 'Atender {{incidente}}', team: 'Campo SP-02' }, sim: { dur: 1 } }],
      ['nt', 'notify', 'Notificar técnico', 5, 2, { cfg: { channel: 'Push', to: 'Técnico responsável' }, sim: { dur: 0.8 } }],
      ['mp', 'updatemap', 'Mostrar equipe no mapa', 5, 0, { cfg: { map: 'Operações de campo', layer: 'Equipes' }, sim: { dur: 1.2 } }],
      ['tr', 'waitaction', 'Acompanhar execução', 6, 1, { cfg: { what: 'Concluir reparo' }, sim: { dur: 5 } }],
      ['done', 'updateds', 'Concluir incidente', 7, 1, { cfg: { name: 'incidentes_campo' }, sim: { dur: 1 } }],
      ['dash', 'refreshdash', 'Atualizar dashboard', 8, 1, { cfg: { report: 'Campo · SLA' }, sim: { dur: 1 } }],
    ]),
    edges: edges(['t>loc', 'loc>near', 'near>rt', 'rt>as', 'as>nt', 'as>mp', 'nt>tr', 'mp>tr', 'tr>done', 'done>dash']),
    groups: [G('g1', 'Despacho', 'accent', ['near', 'rt', 'as']), G('g2', 'Notificações', 'success', ['nt', 'mp'])],
    vars: [ENV, V('region', 'Região', 'São Paulo'), V('sla', 'SLA de atendimento (min)', '90')],
    notes: [['Publicado', 'Atualização do mapa em paralelo ao aviso'], ['Anterior', 'Rota por menor distância'], ['Anterior', 'Atribuição manual']],
  },
  {
    id: 'aprovacao', name: 'Aprovação de relatório', kind: 'human', tag: 'Pessoas', unit: 'itens', bpr: 200,
    description: 'Validação, revisão do gerente e dois caminhos: publicar ou devolver para edição.',
    nodes: nodes([
      ['t', 'dashaction', 'Relatório gerado', 0, 1, { cfg: { report: 'Fechamento mensal' } }],
      ['val', 'validate', 'Validação', 1, 1, { sim: { dur: 2 } }],
      ['rev', 'review', 'Revisão do gerente', 2, 1, { cfg: { who: 'Gerente de área', sla: '24 h' }, sim: { dur: 3 } }],
      ['dec', 'if', 'Aprovado?', 3, 1, { cfg: { expr: 'decisão = aprovado' }, sim: { routeFromUpstream: true, dur: 0.5 } }],
      ['pub', 'o-dashboard', 'Publicar relatório', 4, 0, { cfg: { report: 'Fechamento mensal' }, sim: { dur: 1.5 } }],
      ['ret', 'notify', 'Devolver ao autor', 4, 2, { cfg: { channel: 'E-mail', to: 'autor@empresa.com' }, sim: { dur: 1 } }],
      ['edit', 'assign', 'Editar relatório', 5, 2, { cfg: { to: 'Autor' }, sim: { dur: 2 } }],
    ]),
    edges: edges(['t>val', 'val>rev', 'rev>dec', 'dec>pub:yes|Aprovado', 'dec>ret:no|Devolvido', 'ret>edit', 'edit>rev|Reenviar^']),
    groups: [],
    vars: [ENV, V('approver', 'Aprovador', 'Gerente de área'), V('sla', 'Prazo (h)', '24')],
    notes: [['Publicado', 'Retorno ao revisor após edição'], ['Anterior', 'Aprovação com prazo de 24 h'], ['Anterior', 'Publicação direta']],
  },
  {
    id: 'relatorio', name: 'Relatório semanal automatizado', kind: 'scheduled', tag: 'Relatórios', unit: 'linhas', bpr: 420, schedule: 'Segunda · 07:00', next: 'Seg 12/10 07:00',
    description: 'Toda segunda: atualiza fontes, valida, recalcula o modelo, gera o PDF e envia aos interessados.',
    nodes: nodes([
      ['t', 'schedule', 'Segunda 07:00', 0, 1, { cfg: { freq: 'Semanal', at: '07:00', cron: '0 7 * * 1' } }],
      ['ref', 'updateds', 'Atualizar fontes', 1, 1, { cfg: { name: 'vendas_varejo' }, sim: { out: 920000, dur: 8 } }],
      ['val', 'validate', 'Validar dados', 2, 1, { sim: { dur: 3 } }],
      ['sem', 'o-semantic', 'Atualizar modelo semântico', 3, 1, { cfg: { model: 'Vendas Varejo' }, sim: { dur: 4 } }],
      ['gen', 'refreshdash', 'Gerar relatório', 4, 1, { cfg: { report: 'Resumo semanal' }, sim: { dur: 3 } }],
      ['pdf', 'o-export', 'Exportar PDF', 5, 1, { sim: { dur: 4 } }],
      ['send', 'notify', 'Enviar às partes interessadas', 6, 1, { cfg: { channel: 'E-mail', to: 'diretoria@empresa.com' }, sim: { dur: 1.5 } }],
      ['err', 'notify', 'Avisar equipe de dados', 3, 2, { cfg: { channel: 'Chat', to: '#dados' }, sim: { dur: 1 } }],
    ]),
    edges: edges(['t>ref', 'ref>val', 'val>sem', 'sem>gen', 'gen>pdf', 'pdf>send', 'val>err|Se falhar!']),
    groups: [G('g1', 'Preparação', 'accent', ['ref', 'val', 'sem']), G('g2', 'Entrega', 'success', ['gen', 'pdf', 'send'])],
    vars: [ENV, V('date_range', 'Período', 'Semana anterior', ['Semana anterior', 'Mês atual']), V('recipients', 'Lista de envio', 'Diretoria')],
    notes: [['Publicado', 'Aviso à equipe de dados em caso de falha'], ['Anterior', 'Exportação em PDF'], ['Anterior', 'Envio manual']],
  },
  {
    id: 'qualidade', name: 'Qualidade de dados com IA', kind: 'event', tag: 'Governança', unit: 'linhas', bpr: 540,
    description: 'Cada novo dataset é perfilado, comparado com o esquema esperado e só é publicado sem problemas.',
    nodes: nodes([
      ['t', 'newfile', 'Novo dataset', 0, 1, { cfg: { where: 's3://biweb-lake/entrada', pattern: '*.parquet' } }],
      ['prof', 'analyze', 'Perfilar dataset', 1, 1, { cfg: { focus: 'Qualidade' }, sim: { out: 300000, dur: 4 } }],
      ['an', 'anomaly', 'Detectar anomalias (IA)', 2, 1, { cfg: { sens: 'Alta' }, sim: { ratio: 1, dur: 3, warn: '3 anomalias em preco_unit' }, note: 'preco_unit tem 3 valores 40× acima da mediana de cada categoria.' }],
      ['sc', 'mapschema', 'Comparar esquema', 3, 1, { sim: { dur: 2 } }],
      ['qr', 'validate', 'Regras de qualidade', 4, 1, { cfg: { rules: 'Campos obrigatórios|Domínio de valores' }, sim: { dur: 2 } }],
      ['pr', 'if', 'Há problemas?', 5, 1, { cfg: { expr: 'anomalias > 0' }, sim: { route: 'yes', dur: 0.5 } }],
      ['rv', 'review', 'Criar revisão de qualidade', 6, 0, { cfg: { who: 'Governança de dados' }, sim: { dur: 2.5 } }],
      ['pub', 'o-dataset', 'Publicar dataset', 6, 2, { cfg: { out: 'dataset_novo' }, sim: { dur: 2 } }],
    ]),
    edges: edges(['t>prof', 'prof>an', 'an>sc', 'sc>qr', 'qr>pr', 'pr>rv:yes|Sim', 'pr>pub:no|Não']),
    groups: [G('g1', 'Análise por IA', 'accent', ['prof', 'an', 'sc'])],
    vars: [ENV, V('tolerance', 'Tolerância de anomalias (%)', '0.5')],
    notes: [['Publicado', 'Comparação de esquema com IA'], ['Anterior', 'Regras de domínio'], ['Anterior', 'Somente perfil']],
  },
  {
    id: 'furto-cabos', name: 'Operação · Furto de cabos', kind: 'operations', tag: 'Operações', unit: 'itens', bpr: 300,
    description: 'Um caso entra por webhook e o mesmo motor cruza ocorrências, ferros-velhos e rede afetada.',
    nodes: nodes([
      ['t', 'webhook', 'Novo caso de furto', 0, 1, { cfg: { path: '/hooks/furto-cabos' } }],
      ['geo', 'geocode', 'Geocodificar local', 1, 1, { sim: { dur: 1.2 } }],
      ['inc', 'dataset', 'Buscar incidentes próximos', 2, 0, { cfg: { name: 'ocorrencias_raio_5km' }, sim: { out: 14, dur: 2 } }],
      ['scr', 'dataset', 'Buscar ferros-velhos próximos', 2, 2, { cfg: { name: 'ferros_velhos' }, sim: { out: 6, dur: 2 } }],
      ['aff', 'join', 'Calcular rede afetada', 3, 1, { cfg: { key: 'trecho_id', type: 'Left' }, sim: { out: 3, dur: 2 } }],
      ['risk', 'classify', 'Classificar risco', 4, 1, { cfg: { labels: 'Crítico, Alto, Médio, Baixo' }, sim: { dur: 2 } }],
      ['map', 'updatemap', 'Atualizar mapa', 5, 1, { cfg: { map: 'Furto de cabos', layer: 'Casos' }, sim: { dur: 1.4 } }],
      ['act', 'createtask', 'Acionar polícia e campo', 6, 1, { cfg: { title: 'Furto de cabos · {{trecho}}', team: 'Segurança patrimonial' }, sim: { dur: 1.2 } }],
      ['mon', 'waitaction', 'Monitorar caso', 7, 1, { cfg: { what: 'Encerrar caso' }, sim: { dur: 5 } }],
    ]),
    edges: edges(['t>geo', 'geo>inc', 'geo>scr', 'inc>aff', 'scr>aff', 'aff>risk', 'risk>map', 'map>act', 'act>mon']),
    groups: [G('g1', 'Inteligência', 'accent', ['inc', 'scr', 'aff', 'risk'])],
    vars: [ENV, V('radius', 'Raio de busca (km)', '5'), V('region', 'Região', 'Grande São Paulo')],
    notes: [['Publicado', 'Cruzamento com ferros-velhos'], ['Anterior', 'Raio fixo de 3 km'], ['Anterior', 'Registro manual']],
  },
];

/* Versões: o rascunho publicado é a referência; versões anteriores derivam dele. */
const tweak = (d: Doc, drop: boolean): Doc => {
  const doc = clone(d), n = doc.nodes.find((x) => x.cfg && Object.keys(x.cfg).length);
  if (n) { const key = Object.keys(n.cfg).find((k) => typeof n.cfg[k] === 'string'); if (key) n.cfg[key] = key === 'mode' ? 'Completa' : `${n.cfg[key]} (antigo)`; }
  if (drop) {
    const leaf = [...doc.nodes].reverse().find((x) => !doc.edges.some((e) => e.from === x.id && !e.back) && doc.edges.some((e) => e.to === x.id));
    if (leaf) { doc.nodes = doc.nodes.filter((x) => x.id !== leaf.id); doc.edges = doc.edges.filter((e) => e.to !== leaf.id && e.from !== leaf.id); doc.groups.forEach((g) => { g.nodes = g.nodes.filter((i) => i !== leaf.id); }); }
  }
  return doc;
};
const AUTHORS = ['Samuel Souto', 'Marina Alves', 'Copilot', 'Rafael Lima'];
const DAYS = ['hoje', 'há 3 dias', 'há 9 dias', 'há 3 semanas'];

export function seedWorkflows(): Workflow[] {
  return SEEDS.map((s, i) => {
    const { notes, ...rest } = s, base = rest.kind === 'realtime' ? 18 : [12, 7, 15, 9, 6, 23, 5, 4][i % 8] ?? 3;
    const doc: Doc = { nodes: rest.nodes, edges: rest.edges, groups: rest.groups, vars: rest.vars };
    const versions: Version[] = notes.map(([, note], j) => ({
      v: base - j, state: j === 0 ? 'published' : 'previous', author: AUTHORS[(i + j) % AUTHORS.length] ?? 'Samuel Souto', at: DAYS[j] ?? 'há 2 meses', note,
      doc: j === 0 ? undefined : tweak(doc, j > 1),
    }));
    return { ...rest, versions, published: clone(doc) };
  });
}

/* ───────── Modelos para começar rápido ───────── */
export interface Template { id: string; name: string; desc: string; tag: string; from?: string; build: () => Workflow }
const fresh = (w: Omit<Workflow, 'versions' | 'published' | 'id'> & { id?: string }): Workflow => ({ ...w, id: w.id ?? `wf_${Date.now().toString(36)}`, versions: [{ v: 1, state: 'draft', author: 'Você', at: 'agora', note: 'Criado' }], custom: true });
const fromSeed = (id: string, name: string) => () => { const s = seedWorkflows().find((x) => x.id === id)!; const { published, versions, ...r } = clone(s); void published; void versions; return fresh({ ...r, name, id: undefined }); };
const mini = (name: string, kind: WfKind, tag: string, description: string, list: N[], es: string[], unit = 'linhas', extra: Partial<Workflow> = {}): (() => Workflow) => () => fresh({ name, kind, tag, description, unit, bpr: 500, nodes: nodes(list), edges: edges(es), groups: [], vars: [ENV], ...extra });

export const TEMPLATES: Template[] = [
  { id: 'import', name: 'Importar e normalizar', tag: 'Dados', desc: 'Fonte SQL → normalização → validação → dataset.', build: mini('Importar e normalizar', 'batch', 'Dados', 'Importa uma tabela, normaliza e publica um dataset.', [['t', 'schedule', 'Todo dia 06:00', 0, 0], ['src', 'postgres', 'Carregar tabela', 1, 0, { sim: { out: 240000 } }], ['nm', 'normalize', 'Normalizar', 2, 0], ['v', 'validate', 'Validar', 3, 0], ['ds', 'o-dataset', 'Dataset', 4, 0]], ['t>src', 'src>nm', 'nm>v', 'v>ds']) },
  { id: 'api', name: 'API → Dashboard', tag: 'Dados', desc: 'Consulta uma API, mapeia campos e atualiza um dashboard.', build: mini('API → Dashboard', 'scheduled', 'Dados', 'Atualiza um dashboard a partir de uma API.', [['t', 'schedule', 'A cada hora', 0, 0, { cfg: { freq: 'A cada hora' } }], ['api', 'api', 'Consultar API', 1, 0], ['mp', 'map', 'Mapear campos', 2, 0], ['ds', 'updateds', 'Atualizar dataset', 3, 0], ['db', 'o-dashboard', 'Dashboard', 4, 0]], ['t>api', 'api>mp', 'mp>ds', 'ds>db']) },
  { id: 'rt', name: 'Monitoramento em tempo real', tag: 'Tempo real', desc: 'Eventos → limiar → alerta e dashboard.', build: mini('Monitoramento em tempo real', 'realtime', 'Tempo real', 'Observa um fluxo de eventos e alerta ao cruzar um limite.', [['e', 'realtime', 'Eventos', 0, 1, { sim: { out: 800 } }], ['th', 'threshold', 'Limiar', 1, 1, { sim: { ratio: 0.1 } }], ['nt', 'notify', 'Notificar', 2, 0], ['db', 'refreshdash', 'Atualizar dashboard', 2, 2]], ['e>th', 'th>nt', 'th>db'], 'eventos', { live: { eps: 800, lag: 1.1 } }) },
  { id: 'incident', name: 'Resposta a incidentes', tag: 'Operações', desc: 'Detecção, classificação por IA e ramo crítico.', build: fromSeed('incidente-rede', 'Resposta a incidentes') },
  { id: 'approval', name: 'Processo de aprovação', tag: 'Pessoas', desc: 'Validação, revisão humana, publicar ou devolver.', build: fromSeed('aprovacao', 'Processo de aprovação') },
  { id: 'report', name: 'Relatório agendado', tag: 'Relatórios', desc: 'Agenda, atualização, PDF e envio.', build: fromSeed('relatorio', 'Relatório agendado') },
  { id: 'quality', name: 'Qualidade de dados com IA', tag: 'Governança', desc: 'Perfil, anomalias e decisão de publicar.', build: fromSeed('qualidade', 'Qualidade de dados com IA') },
  { id: 'field', name: 'Operações de campo', tag: 'Operações', desc: 'Incidente → equipe → rota → tarefa.', build: fromSeed('campo', 'Operações de campo') },
];
export const blankWorkflow = (): Workflow => fresh({ name: 'Novo fluxo', kind: 'batch', tag: 'Rascunho', description: 'Fluxo em branco.', unit: 'linhas', bpr: 500, nodes: [], edges: [], groups: [], vars: [ENV] });
export { fresh as freshWorkflow, clone as cloneDeep };
