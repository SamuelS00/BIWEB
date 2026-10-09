import type { IconName } from '@biweb/ui';

/** Modelo do Workflow Builder do BIWEB: um único motor para dados, sistemas, IA, regras, pessoas e operações. */
export type Cat = 'trigger' | 'source' | 'data' | 'logic' | 'ai' | 'action' | 'human' | 'output' | 'custom';
export type NState = 'waiting' | 'running' | 'success' | 'warning' | 'failed' | 'paused' | 'skipped';
export type Cfg = Record<string, string | number | boolean>;

export const CATS: { id: Cat; label: string; color: string }[] = [
  { id: 'trigger', label: 'Gatilhos', color: 'var(--viz-cat-3)' },
  { id: 'source', label: 'Fontes de dados', color: 'var(--viz-cat-1)' },
  { id: 'data', label: 'Operações de dados', color: 'var(--viz-cat-2)' },
  { id: 'logic', label: 'Lógica', color: 'var(--viz-cat-6)' },
  { id: 'ai', label: 'IA', color: 'var(--viz-cat-4)' },
  { id: 'action', label: 'Ações', color: 'var(--viz-cat-5)' },
  { id: 'human', label: 'Pessoas', color: 'var(--viz-cat-7)' },
  { id: 'output', label: 'Saídas', color: 'var(--viz-cat-8)' },
  { id: 'custom', label: 'Personalizados', color: 'var(--text-secondary)' },
];
export const catOf = (id: Cat) => CATS.find((c) => c.id === id)!;

export type FieldDef =
  | { key: string; label: string; type: 'text' | 'number'; ph?: string }
  | { key: string; label: string; type: 'select'; options: string[] }
  | { key: string; label: string; type: 'bool' }
  | { key: string; label: string; type: 'rules'; options: string[] };

export interface Port { id: string; label: string }
/** Perfil de simulação: como o nó se comporta quando executado (duração, volume, rota, falha). */
export interface Sim {
  dur: number; out?: number; ratio?: number; bpr?: number; route?: string; routeFromUpstream?: boolean;
  human?: boolean; fail?: { reason: string; rows: number; fixKey?: string; fixValue?: string; hint: string }; warn?: string;
  live?: boolean;
}
export interface NodeKind {
  id: string; cat: Cat; label: string; icon: IconName; desc: string; verb: string;
  ports?: Port[]; fanout?: boolean; inputs?: 0 | 1; fields: FieldDef[]; defaults: Cfg; sim: Sim; beta?: boolean; sum?: boolean;
}

const YN: Port[] = [{ id: 'yes', label: 'SIM' }, { id: 'no', label: 'NÃO' }];
const K = (id: string, cat: Cat, label: string, icon: IconName, desc: string, verb: string, fields: FieldDef[] = [], defaults: Cfg = {}, sim: Sim = { dur: 2 }, extra: Partial<NodeKind> = {}): NodeKind =>
  ({ id, cat, label, icon, desc, verb, fields, defaults, sim, inputs: cat === 'trigger' ? 0 : 1, ...extra });
const conn = (host: string): FieldDef[] => [{ key: 'conn', label: 'Conexão', type: 'text', ph: host }, { key: 'object', label: 'Objeto / consulta', type: 'text', ph: 'schema.tabela' }, { key: 'mode', label: 'Modo de carga', type: 'select', options: ['Completa', 'Incremental'] }];
const OUT: FieldDef[] = [{ key: 'out', label: 'Saída', type: 'text', ph: 'nome_do_dataset' }];

export const NODE_KINDS: NodeKind[] = [
  K('manual', 'trigger', 'Manual', 'play', 'Inicia ao clicar em Executar.', 'é iniciado manualmente', [{ key: 'who', label: 'Quem pode executar', type: 'select', options: ['Qualquer editor', 'Administradores'] }], { who: 'Qualquer editor' }, { dur: 0.6, out: 1 }),
  K('schedule', 'trigger', 'Agenda', 'clock', 'Dispara em horários definidos.', 'é disparado por agenda', [{ key: 'freq', label: 'Frequência', type: 'select', options: ['A cada hora', 'Diária', 'Semanal', 'Cron / avançado'] }, { key: 'at', label: 'Horário', type: 'text', ph: '06:00' }, { key: 'cron', label: 'Expressão cron', type: 'text', ph: '0 7 * * 1' }], { freq: 'Diária', at: '06:00', cron: '0 6 * * *' }, { dur: 0.6, out: 1 }),
  K('webhook', 'trigger', 'Webhook', 'share', 'Recebe chamadas HTTP de outros sistemas.', 'recebe um webhook', [{ key: 'path', label: 'Caminho', type: 'text', ph: '/hooks/pedidos' }, { key: 'secret', label: 'Validar assinatura', type: 'bool' }], { path: '/hooks/novo', secret: true }, { dur: 0.6, out: 1 }),
  K('dbevent', 'trigger', 'Evento de banco', 'data', 'Reage a insert/update em uma tabela.', 'reage a um evento de banco', [{ key: 'table', label: 'Tabela', type: 'text', ph: 'public.pedidos' }, { key: 'op', label: 'Operação', type: 'select', options: ['INSERT', 'UPDATE', 'DELETE'] }], { op: 'INSERT' }, { dur: 0.6, out: 1 }),
  K('newfile', 'trigger', 'Novo arquivo', 'upload', 'Dispara quando um arquivo chega.', 'detecta um novo arquivo', [{ key: 'where', label: 'Pasta / bucket', type: 'text', ph: 's3://dados/entrada' }, { key: 'pattern', label: 'Padrão', type: 'text', ph: '*.csv' }], { pattern: '*.csv' }, { dur: 0.6, out: 1 }),
  K('realtime', 'trigger', 'Evento em tempo real', 'bolt', 'Consome um fluxo contínuo de eventos.', 'consome eventos em tempo real', [{ key: 'topic', label: 'Tópico', type: 'text', ph: 'net.telemetry' }, { key: 'eps', label: 'Eventos/s esperados', type: 'number' }], { topic: 'net.telemetry', eps: 1200 }, { dur: 0.8, out: 1, live: true }),
  K('threshold', 'trigger', 'Limiar', 'target', 'Dispara quando uma métrica cruza um limite.', 'monitora um limiar', [{ key: 'metric', label: 'Métrica', type: 'text', ph: 'atenuacao_db' }, { key: 'op', label: 'Condição', type: 'select', options: ['>', '<', '≥', '≤'] }, { key: 'value', label: 'Valor', type: 'number' }], { metric: 'atenuacao_db', op: '>', value: 18 }, { dur: 0.8, out: 1, live: true }),
  K('incident', 'trigger', 'Incidente', 'warning', 'Dispara quando um incidente é aberto.', 'é acionado por um incidente', [{ key: 'sev', label: 'Severidade mínima', type: 'select', options: ['Baixa', 'Média', 'Alta', 'Crítica'] }], { sev: 'Média' }, { dur: 0.6, out: 1 }),
  K('dashaction', 'trigger', 'Ação de dashboard', 'kpi', 'Inicia a partir de um botão no relatório.', 'é iniciado por uma ação no dashboard', [{ key: 'report', label: 'Relatório', type: 'text', ph: 'Visão executiva' }], {}, { dur: 0.6, out: 1 }),

  K('postgres', 'source', 'PostgreSQL', 'data', 'Lê tabelas ou consultas.', 'lê dados do PostgreSQL', conn('pg-netops'), { mode: 'Completa' }, { dur: 5, out: 240000 }),
  K('sqlserver', 'source', 'SQL Server', 'data', 'Lê tabelas ou consultas.', 'lê dados do SQL Server', conn('sql-erp'), { mode: 'Completa' }, { dur: 5, out: 240000 }),
  K('oracle', 'source', 'Oracle', 'data', 'Lê tabelas ou consultas.', 'lê dados do Oracle', conn('oracle-legado'), { mode: 'Completa' }, { dur: 7, out: 1820000 }),
  K('api', 'source', 'API', 'share', 'Consome uma API REST.', 'consulta uma API', [{ key: 'url', label: 'URL', type: 'text', ph: 'https://api.exemplo.com/v1/…' }, { key: 'auth', label: 'Autenticação', type: 'select', options: ['Token', 'OAuth 2', 'Chave de API'] }, { key: 'page', label: 'Paginação', type: 'bool' }], { auth: 'Token', page: true }, { dur: 4, out: 86000 }),
  K('excel', 'source', 'Excel', 'table', 'Lê planilhas .xlsx.', 'lê uma planilha Excel', [{ key: 'file', label: 'Arquivo', type: 'text', ph: 'planilha.xlsx' }, { key: 'sheet', label: 'Aba', type: 'text', ph: 'Plan1' }], {}, { dur: 3, out: 52000 }),
  K('csv', 'source', 'CSV', 'report', 'Lê arquivos de texto delimitado.', 'lê um arquivo CSV', [{ key: 'file', label: 'Arquivo', type: 'text', ph: 'arquivo.csv' }, { key: 'sep', label: 'Separador', type: 'select', options: [';', ',', 'TAB'] }], { sep: ';' }, { dur: 2, out: 120000 }),
  K('parquet', 'source', 'Parquet', 'layers', 'Lê arquivos colunares.', 'lê arquivos Parquet', [{ key: 'file', label: 'Caminho', type: 'text', ph: 's3://lake/…' }], {}, { dur: 4, out: 2400000 }),
  K('s3', 'source', 'S3', 'upload', 'Lê objetos de um bucket.', 'lê objetos do S3', [{ key: 'bucket', label: 'Bucket', type: 'text', ph: 'biweb-lake' }, { key: 'prefix', label: 'Prefixo', type: 'text', ph: 'raw/' }], {}, { dur: 4, out: 600000 }),
  K('dataset', 'source', 'Dataset BIWEB', 'book', 'Usa um dataset já publicado.', 'usa um dataset do BIWEB', [{ key: 'name', label: 'Dataset', type: 'text', ph: 'vendas_varejo' }], {}, { dur: 2, out: 300000 }),

  K('filter', 'data', 'Filtrar', 'filter', 'Mantém linhas que atendem a uma condição.', 'filtra registros', [{ key: 'expr', label: 'Condição', type: 'text', ph: 'status = "ATIVO"' }], {}, { dur: 2, ratio: 0.46, bpr: 520 }),
  K('map', 'data', 'Mapear campos', 'sliders', 'Renomeia, descarta e reordena colunas.', 'mapeia campos', [{ key: 'map', label: 'Mapeamentos', type: 'text', ph: 'ORIGEM → destino' }], {}, { dur: 2, bpr: 480 }),
  K('normalize', 'data', 'Normalizar', 'brush', 'Padroniza textos, documentos e datas.', 'normaliza os dados', [{ key: 'in', label: 'Entrada', type: 'text', ph: 'orders_raw' }, { key: 'rules', label: 'Regras', type: 'rules', options: ['Remover espaços', 'Normalizar CPF', 'Converter datas', 'Remover duplicados'] }, { key: 'out', label: 'Saída', type: 'text', ph: 'customers_clean' }], { rules: 'Remover espaços|Normalizar CPF|Converter datas', retries: 3 }, { dur: 4 }),
  K('join', 'data', 'Juntar', 'layers', 'Combina duas entradas por chave.', 'junta as entradas por chave', [{ key: 'key', label: 'Chave', type: 'text', ph: 'cliente_id' }, { key: 'type', label: 'Tipo', type: 'select', options: ['Inner', 'Left', 'Right', 'Full'] }], { type: 'Left' }, { dur: 4, ratio: 0.9 }),
  K('union', 'data', 'Unir', 'layers', 'Empilha entradas com o mesmo esquema.', 'une as entradas', [], {}, { dur: 2 }, { sum: true }),
  K('aggregate', 'data', 'Agregar', 'kpi', 'Agrupa e resume medidas.', 'agrega por dimensão', [{ key: 'by', label: 'Agrupar por', type: 'text', ph: 'regiao, mes' }, { key: 'agg', label: 'Medidas', type: 'text', ph: 'soma(valor)' }], {}, { dur: 3, ratio: 0.04 }),
  K('dedupe', 'data', 'Deduplicar', 'copy', 'Remove registros repetidos.', 'remove duplicidades', [{ key: 'key', label: 'Chave', type: 'text', ph: 'id_enlace' }, { key: 'keep', label: 'Manter', type: 'select', options: ['Mais recente', 'Primeiro'] }], { keep: 'Mais recente' }, { dur: 3, ratio: 0.96 }),
  K('validate', 'data', 'Validar', 'check', 'Aplica regras de qualidade.', 'valida a qualidade', [{ key: 'rules', label: 'Regras', type: 'rules', options: ['Chaves únicas', 'Campos obrigatórios', 'Domínio de valores', 'Datas válidas'] }, { key: 'onfail', label: 'Se falhar', type: 'select', options: ['Interromper', 'Quarentena', 'Avisar'] }], { rules: 'Chaves únicas|Campos obrigatórios', onfail: 'Interromper' }, { dur: 2 }),
  K('convert', 'data', 'Converter tipo', 'text', 'Converte tipos e formatos.', 'converte tipos', [{ key: 'field', label: 'Campo', type: 'text', ph: 'data_cadastro' }, { key: 'to', label: 'Para', type: 'select', options: ['Data', 'Número', 'Texto', 'Booleano'] }, { key: 'onInvalid', label: 'Valor inválido', type: 'select', options: ['Falhar', 'Quarentena'] }], { to: 'Data', onInvalid: 'Falhar' }, { dur: 2 }),
  K('geocode', 'data', 'Geocodificar', 'pin', 'Converte endereços em coordenadas.', 'geocodifica endereços', [{ key: 'addr', label: 'Campo de endereço', type: 'text', ph: 'endereco' }], {}, { dur: 3 }),
  K('calc', 'data', 'Calcular campo', 'sliders', 'Cria um campo calculado.', 'calcula um campo', [{ key: 'name', label: 'Nome', type: 'text', ph: 'margem' }, { key: 'expr', label: 'Expressão', type: 'text', ph: 'receita - custo' }], {}, { dur: 1.5 }),

  K('if', 'logic', 'Se / Senão', 'target', 'Escolhe um caminho por condição.', 'decide por uma condição', [{ key: 'expr', label: 'Condição', type: 'text', ph: 'severidade > 80' }], { expr: 'valor > 80' }, { dur: 1, route: 'yes' }, { ports: YN }),
  K('switch', 'logic', 'Switch', 'list', 'Vários caminhos por valor.', 'escolhe entre vários caminhos', [{ key: 'on', label: 'Campo', type: 'text', ph: 'tipo' }], {}, { dur: 1, route: 'a' }, { ports: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'Outros' }] }),
  K('condition', 'logic', 'Condição', 'filter', 'Segue apenas se a condição for verdadeira.', 'segue se a condição for verdadeira', [{ key: 'expr', label: 'Condição', type: 'text', ph: 'linhas > 0' }], {}, { dur: 0.8 }),
  K('loop', 'logic', 'Repetir', 'refresh', 'Repete para cada item.', 'repete para cada item', [{ key: 'over', label: 'Lista', type: 'text', ph: 'itens' }, { key: 'max', label: 'Máx. iterações', type: 'number' }], { max: 100 }, { dur: 3 }),
  K('branch', 'logic', 'Dividir (paralelo)', 'share', 'Executa vários ramos ao mesmo tempo.', 'divide em ramos paralelos', [], {}, { dur: 0.8 }, { fanout: true }),
  K('merge', 'logic', 'Mesclar', 'layers', 'Aguarda os ramos e continua.', 'aguarda e mescla os ramos', [{ key: 'wait', label: 'Aguardar', type: 'select', options: ['Todos os ramos', 'Qualquer ramo'] }], { wait: 'Todos os ramos' }, { dur: 1, bpr: 520 }, { sum: true }),
  K('wait', 'logic', 'Aguardar', 'clock', 'Pausa por um tempo.', 'aguarda', [{ key: 'for', label: 'Tempo', type: 'text', ph: '5 min' }], { for: '5 min' }, { dur: 3 }),
  K('retry', 'logic', 'Tentar de novo', 'refresh', 'Reexecuta o passo anterior em caso de falha.', 'tenta novamente em caso de falha', [{ key: 'times', label: 'Tentativas', type: 'number' }, { key: 'backoff', label: 'Espera', type: 'text', ph: '30 s' }], { times: 3, backoff: '30 s' }, { dur: 1 }),

  K('classify', 'ai', 'Classificar', 'copilot', 'Atribui uma categoria por IA.', 'classifica com IA', [{ key: 'labels', label: 'Categorias', type: 'text', ph: 'Crítico, Alto, Normal' }, { key: 'model', label: 'Modelo', type: 'select', options: ['BIWEB Fast', 'BIWEB Pro'] }], { model: 'BIWEB Fast' }, { dur: 3 }),
  K('extract', 'ai', 'Extrair', 'copilot', 'Extrai campos de texto livre.', 'extrai campos com IA', [{ key: 'fields', label: 'Campos', type: 'text', ph: 'cliente, valor, data' }], {}, { dur: 4 }),
  K('summarize', 'ai', 'Resumir', 'copilot', 'Resume textos ou conjuntos de dados.', 'resume com IA', [{ key: 'style', label: 'Estilo', type: 'select', options: ['Executivo', 'Técnico'] }], { style: 'Executivo' }, { dur: 3 }),
  K('analyze', 'ai', 'Analisar', 'copilot', 'Perfila o dataset e aponta achados.', 'analisa com IA', [{ key: 'focus', label: 'Foco', type: 'select', options: ['Esquema e tipos', 'Qualidade', 'Relacionamentos'] }], { focus: 'Esquema e tipos' }, { dur: 5 }),
  K('anomaly', 'ai', 'Detectar anomalia', 'target', 'Encontra valores fora do padrão.', 'detecta anomalias', [{ key: 'sens', label: 'Sensibilidade', type: 'select', options: ['Baixa', 'Média', 'Alta'] }, { key: 'win', label: 'Janela', type: 'text', ph: '24 h' }], { sens: 'Média', win: '24 h' }, { dur: 3, ratio: 0.02 }),
  K('mapschema', 'ai', 'Mapear esquema', 'model', 'Sugere equivalência entre esquemas.', 'sugere o mapeamento de esquemas', [{ key: 'min', label: 'Confiança mínima', type: 'number' }], { min: 85 }, { dur: 4 }),
  K('suggestrel', 'ai', 'Sugerir relacionamento', 'model', 'Descobre chaves e relações.', 'sugere relacionamentos', [], {}, { dur: 3 }),
  K('insight', 'ai', 'Gerar insight', 'star', 'Escreve um achado em linguagem natural.', 'gera um insight', [{ key: 'tone', label: 'Tom', type: 'select', options: ['Executivo', 'Operacional'] }], { tone: 'Executivo' }, { dur: 3 }),
  K('aidecision', 'ai', 'Decisão por IA', 'copilot', 'A IA escolhe o caminho, com justificativa.', 'deixa a IA escolher o caminho', [{ key: 'goal', label: 'Objetivo', type: 'text', ph: 'Priorizar por risco' }], {}, { dur: 3, route: 'yes' }, { ports: YN }),

  K('writedb', 'action', 'Gravar no banco', 'data', 'Insere ou atualiza registros.', 'grava no banco', [{ key: 'conn', label: 'Conexão', type: 'text', ph: 'pg-netops' }, { key: 'table', label: 'Tabela', type: 'text', ph: 'public.eventos' }, { key: 'mode', label: 'Modo', type: 'select', options: ['Inserir', 'Upsert'] }], { mode: 'Inserir' }, { dur: 3 }),
  K('callapi', 'action', 'Chamar API', 'share', 'Faz uma chamada a um sistema externo.', 'chama uma API', [{ key: 'url', label: 'URL', type: 'text', ph: 'https://…' }, { key: 'method', label: 'Método', type: 'select', options: ['POST', 'PUT', 'GET'] }], { method: 'POST' }, { dur: 2 }),
  K('sendhook', 'action', 'Enviar webhook', 'send', 'Notifica outro sistema por webhook.', 'envia um webhook', [{ key: 'url', label: 'URL', type: 'text', ph: 'https://…' }], {}, { dur: 1.5 }),
  K('updateds', 'action', 'Atualizar dataset', 'refresh', 'Publica uma nova versão do dataset.', 'atualiza o dataset', [{ key: 'name', label: 'Dataset', type: 'text', ph: 'vendas_varejo' }], {}, { dur: 3 }),
  K('refreshdash', 'action', 'Atualizar dashboard', 'kpi', 'Recalcula e atualiza um relatório.', 'atualiza o dashboard', [{ key: 'report', label: 'Relatório', type: 'text', ph: 'Comercial' }], {}, { dur: 2 }),
  K('createincident', 'action', 'Criar incidente', 'warning', 'Abre um incidente operacional.', 'cria um incidente', [{ key: 'title', label: 'Título', type: 'text', ph: 'Degradação em {{region}}' }, { key: 'queue', label: 'Fila', type: 'text', ph: 'NOC' }], { queue: 'NOC' }, { dur: 1.5 }),
  K('createtask', 'action', 'Criar tarefa', 'list', 'Cria uma tarefa para uma equipe.', 'cria uma tarefa', [{ key: 'title', label: 'Título', type: 'text', ph: 'Verificar caixa' }, { key: 'team', label: 'Equipe', type: 'text', ph: 'Campo SP-02' }], {}, { dur: 1.5 }),
  K('notify', 'action', 'Enviar notificação', 'send', 'Avisa por e-mail, chat ou push.', 'envia uma notificação', [{ key: 'channel', label: 'Canal', type: 'select', options: ['E-mail', 'Chat', 'Push', 'SMS'] }, { key: 'to', label: 'Destinatários', type: 'text', ph: 'operacoes@empresa.com' }], { channel: 'E-mail' }, { dur: 1.2 }),
  K('updatemap', 'action', 'Atualizar camada do mapa', 'pin', 'Atualiza uma camada no Map Workspace.', 'atualiza a camada do mapa', [{ key: 'map', label: 'Mapa', type: 'text', ph: 'Rede óptica' }, { key: 'layer', label: 'Camada', type: 'text', ph: 'Incidentes' }], {}, { dur: 2 }),
  K('route', 'action', 'Calcular rota', 'target', 'Calcula o melhor trajeto.', 'calcula a rota', [{ key: 'mode', label: 'Modo', type: 'select', options: ['Mais rápida', 'Mais curta'] }], { mode: 'Mais rápida' }, { dur: 2 }),

  K('approval', 'human', 'Solicitar aprovação', 'user', 'Pede aprovação a um responsável.', 'pede aprovação', [{ key: 'who', label: 'Aprovador', type: 'text', ph: 'Gerente de área' }, { key: 'sla', label: 'Prazo', type: 'text', ph: '24 h' }], { sla: '24 h' }, { dur: 4, human: true, route: 'approved' }, { ports: [{ id: 'approved', label: 'APROVADO' }, { id: 'returned', label: 'DEVOLVIDO' }] }),
  K('review', 'human', 'Revisão', 'eye', 'Uma pessoa revisa e decide.', 'aguarda a revisão de uma pessoa', [{ key: 'who', label: 'Revisor', type: 'text', ph: 'Gerente' }, { key: 'sla', label: 'Prazo', type: 'text', ph: '24 h' }], { sla: '24 h' }, { dur: 4, human: true, route: 'approved' }),
  K('assign', 'human', 'Atribuir tarefa', 'user', 'Atribui um trabalho a uma pessoa ou equipe.', 'atribui o trabalho', [{ key: 'to', label: 'Responsável', type: 'text', ph: 'Equipe de campo' }], {}, { dur: 1.5 }),
  K('waitaction', 'human', 'Aguardar ação', 'clock', 'Pausa até alguém concluir uma ação.', 'aguarda uma ação humana', [{ key: 'what', label: 'Ação esperada', type: 'text', ph: 'Concluir reparo' }], {}, { dur: 6, human: true }),
  K('confirm', 'human', 'Confirmação manual', 'check', 'Pede um “ok” antes de continuar.', 'pede confirmação manual', [{ key: 'msg', label: 'Mensagem', type: 'text', ph: 'Confirmar publicação?' }], {}, { dur: 2, human: true }),

  K('o-dataset', 'output', 'Dataset', 'book', 'Publica um dataset governado.', 'publica o dataset', [...OUT, { key: 'mode', label: 'Escrita', type: 'select', options: ['Substituir', 'Anexar', 'Upsert'] }], { mode: 'Substituir' }, { dur: 3 }),
  K('o-semantic', 'output', 'Modelo semântico', 'model', 'Atualiza o modelo semântico.', 'atualiza o modelo semântico', [{ key: 'model', label: 'Modelo', type: 'text', ph: 'Vendas Varejo' }], {}, { dur: 3 }),
  K('o-dashboard', 'output', 'Dashboard', 'kpi', 'Publica ou atualiza um dashboard.', 'publica no dashboard', [{ key: 'report', label: 'Relatório', type: 'text', ph: 'Comercial' }], {}, { dur: 2 }),
  K('o-map', 'output', 'Mapa', 'pin', 'Publica no Map Workspace.', 'publica no mapa', [{ key: 'map', label: 'Mapa', type: 'text', ph: 'Rede óptica' }], {}, { dur: 2 }),
  K('o-export', 'output', 'Exportar', 'download', 'Gera PDF, Excel ou CSV.', 'exporta o resultado', [{ key: 'fmt', label: 'Formato', type: 'select', options: ['PDF', 'Excel', 'CSV'] }], { fmt: 'PDF' }, { dur: 4 }),
  K('o-file', 'output', 'Arquivo', 'report', 'Grava um arquivo no armazenamento.', 'grava um arquivo', [{ key: 'where', label: 'Destino', type: 'text', ph: 's3://…' }], {}, { dur: 2 }),
  K('o-api', 'output', 'API', 'share', 'Expõe o resultado por API.', 'expõe por API', [{ key: 'path', label: 'Rota', type: 'text', ph: '/v1/resultado' }], {}, { dur: 1.5 }),
  K('o-notify', 'output', 'Notificação', 'send', 'Entrega um aviso ao final.', 'notifica ao final', [{ key: 'to', label: 'Destinatários', type: 'text', ph: 'equipe@empresa.com' }], {}, { dur: 1.2 }),

  K('c-conn', 'custom', 'Conector personalizado', 'cube', 'Conector escrito com o SDK de plugins.', 'usa um conector personalizado', [{ key: 'runtime', label: 'Runtime', type: 'select', options: ['TypeScript', 'Python', 'WASM'] }, { key: 'entry', label: 'Pacote', type: 'text', ph: '@empresa/conector' }], { runtime: 'TypeScript' }, { dur: 3, out: 50000 }, { beta: true }),
  K('c-transform', 'custom', 'Transformação personalizada', 'sliders', 'Transformação com código próprio.', 'aplica uma transformação personalizada', [{ key: 'runtime', label: 'Runtime', type: 'select', options: ['TypeScript', 'Python', 'WASM'] }, { key: 'entry', label: 'Pacote', type: 'text', ph: '@empresa/transform' }], { runtime: 'Python' }, { dur: 3 }, { beta: true }),
  K('c-action', 'custom', 'Ação personalizada', 'bolt', 'Ação própria sobre sistemas internos.', 'executa uma ação personalizada', [{ key: 'runtime', label: 'Runtime', type: 'select', options: ['TypeScript', 'Python', 'WASM'] }, { key: 'entry', label: 'Pacote', type: 'text', ph: '@empresa/acao' }], { runtime: 'TypeScript' }, { dur: 2 }, { beta: true }),
];

const registry = new Map(NODE_KINDS.map((k) => [k.id, k]));
export const kindOf = (id: string): NodeKind => registry.get(id) ?? NODE_KINDS[0]!;
/** Ponto de extensão: plugins registram novos tipos de nó na biblioteca. */
export function registerNodeKind(k: NodeKind) { if (!registry.has(k.id)) NODE_KINDS.push(k); registry.set(k.id, k); }

export interface WNode { id: string; kind: string; name: string; x: number; y: number; cfg: Cfg; desc?: string; sim?: Partial<Sim>; note?: string }
/** `err`: aresta de tratamento de erro (só ativa se a origem falhar). `back`: retorno de laço (ignorado pelo motor). */
export interface WEdge { id: string; from: string; to: string; port?: string; label?: string; err?: boolean; back?: boolean }
export interface WGroup { id: string; name: string; nodes: string[]; tone: 'accent' | 'success' | 'warning' | 'neutral'; collapsed?: boolean }
export interface WVar { key: string; label: string; value: string; type: 'text' | 'select' | 'number'; options?: string[] }
export type WfKind = 'batch' | 'realtime' | 'scheduled' | 'event' | 'human' | 'operations';
export interface Doc { nodes: WNode[]; edges: WEdge[]; groups: WGroup[]; vars: WVar[] }
export interface Version { v: number; state: 'published' | 'previous' | 'draft'; author: string; at: string; note: string; doc?: Doc }
export interface Workflow extends Doc {
  id: string; name: string; description: string; kind: WfKind; tag: string; unit: string; bpr: number;
  schedule?: string; next?: string; live?: { eps: number; lag: number };
  /** Versão publicada; `nodes/edges` acima são o rascunho. */
  versions: Version[]; published?: Doc; custom?: boolean;
}

export const NODE_W = 176, NODE_H = 72, GRID = 16;
export const snap = (n: number) => Math.round(n / GRID) * GRID;
let uid = 0;
export const newId = (p: string) => `${p}${Date.now().toString(36)}${(uid++).toString(36)}`;
export const defaultCfg = (kind: string): Cfg => ({ ...kindOf(kind).defaults });
export function makeNode(kind: string, x: number, y: number, name?: string, cfg?: Cfg): WNode {
  const k = kindOf(kind);
  return { id: newId('n'), kind, name: name ?? k.label, x: snap(x), y: snap(y), cfg: { ...k.defaults, ...cfg } };
}
export const portsOf = (n: WNode): Port[] => kindOf(n.kind).ports ?? [{ id: 'out', label: '' }];
export const simOf = (n: WNode): Sim => ({ ...kindOf(n.kind).sim, ...n.sim });
