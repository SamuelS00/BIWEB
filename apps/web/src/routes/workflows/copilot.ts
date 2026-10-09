import { COL, ROW, applyOps, diffDocs, explain, fmtDur, fmtN, optimizations } from './engine';
import type { Op, Run } from './engine';
import { freshWorkflow } from './seeds';
import { kindOf, makeNode, simOf } from './model';
import type { Cfg, Doc, WEdge, WNode, Workflow } from './model';

/** Copilot do Workflow Builder: entende o pedido, propõe uma alteração e mostra a prévia antes de aplicar. Aprovar ≠ executar. */
export interface Proposal {
  id: string; title: string; summary: string; ops: Op[]; changes: string[]; status: 'pending' | 'applied' | 'discarded';
  /** Fluxo novo gerado do zero (aplicado na tela vazia ou como novo fluxo). */
  newWf?: Workflow; pct?: number; layout?: boolean;
}
export interface Msg { id: string; role: 'user' | 'ai'; text: string; list?: string[]; proposal?: Proposal; focus?: string[]; kicker?: string }
export interface Ctx { wf: Workflow; selection: string[]; run?: Run }

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
let seq = 0;
const mid = () => `m${Date.now().toString(36)}${seq++}`;

export function proposal(wf: Doc, title: string, summary: string, ops: Op[], extra: Partial<Proposal> = {}): Proposal {
  const lines = diffDocs(wf, applyOps(wf, ops)), edgeLines = lines.filter((l) => l.slice(2).startsWith('Conexão')), rest = lines.filter((l) => !l.slice(2).startsWith('Conexão'));
  const changes = rest.length && edgeLines.length ? [...rest, `~ ${edgeLines.length} conexões ajustadas`] : lines;
  return { id: mid(), title, summary, ops, changes, status: 'pending', layout: ops.some((o) => o.t === 'layout'), ...extra };
}
const topo = (d: Doc): WNode[] => {
  const out: WNode[] = [], seen = new Set<string>();
  const v = (n: WNode) => { if (seen.has(n.id)) return; seen.add(n.id); d.edges.filter((e) => e.to === n.id && !e.back).forEach((e) => { const p = d.nodes.find((x) => x.id === e.from); if (p) v(p); }); out.push(n); };
  [...d.nodes].sort((a, b) => a.x - b.x || a.y - b.y).forEach(v);
  return out;
};
/** Onde inserir: depois do nó selecionado; senão, antes da primeira saída/ação final. */
function anchor(doc: Doc, sel: string[]): { after?: string; before?: string } {
  if (sel[0] && doc.nodes.some((n) => n.id === sel[0])) return { after: sel[0] };
  const order = topo(doc), f = order.find((n) => kindOf(n.kind).cat === 'output' && doc.edges.some((e) => e.to === n.id));
  if (f) return { before: f.id };
  const last = order[order.length - 1];
  return last ? { after: last.id } : {};
}
const addOp = (doc: Doc, kind: string, name: string, cfg: Cfg | undefined, sel: string[]): Op => {
  const a = anchor(doc, sel), ref = doc.nodes.find((n) => n.id === (a.after ?? a.before));
  return { t: 'add', node: makeNode(kind, ref?.x ?? 0, ref?.y ?? 0, name, cfg), ...a };
};

/* ───────── Geração de fluxos por descrição ───────── */
export function generateWorkflow(text: string): Workflow {
  const t = norm(text), has = (re: RegExp) => re.test(t);
  const hour = text.match(/(\d{1,2})\s*(?:h|:|horas?)\s*(\d{2})?/i), at = hour ? `${(hour[1] ?? '6').padStart(2, '0')}:${hour[2] ?? '00'}` : '06:00';
  const topic = (text.match(/(?:importe|carregue|leia|traga|consulte)\s+(?:os\s+|as\s+|o\s+|a\s+)?([a-zà-ú]+)/i)?.[1] ?? 'dados').toLowerCase();
  const T = topic.charAt(0).toUpperCase() + topic.slice(1);
  const list: [string, string, string, Cfg?][] = [];
  const weekly = has(/semana|segunda|toda (seg|ter|qua|qui|sex)/), hourly = has(/toda hora|a cada hora|hora em hora/);
  const rt = has(/tempo real|realtime|streaming|evento/);
  list.push(rt ? ['t', 'realtime', 'Eventos em tempo real'] : has(/webhook/) ? ['t', 'webhook', 'Webhook recebido'] : ['t', 'schedule', hourly ? 'A cada hora' : weekly ? `Semanal ${at}` : `Todo dia ${at}`, { freq: hourly ? 'A cada hora' : weekly ? 'Semanal' : 'Diária', at }]);
  const src = has(/oracle/) ? 'oracle' : has(/sql server/) ? 'sqlserver' : has(/api/) ? 'api' : has(/excel|planilha/) ? 'excel' : has(/csv/) ? 'csv' : 'postgres';
  list.push(['src', src, `Carregar ${T}`, { object: topic, mode: has(/incremental/) ? 'Incremental' : 'Completa' }]);
  list.push(['nm', 'normalize', has(/cpf/) ? 'Normalizar CPF' : 'Normalizar', { rules: has(/cpf/) ? 'Remover espaços|Normalizar CPF' : 'Remover espaços|Converter datas', in: `${topic}_raw`, out: `${topic}_clean` }]);
  if (has(/duplic|dedup/)) list.push(['dd', 'dedupe', 'Deduplicar']);
  list.push(['v', 'validate', 'Validar']);
  if (has(/aprov/)) list.push(['ap', 'approval', 'Aprovação antes de publicar']);
  list.push(['ds', 'o-dataset', `Dataset ${topic}`, { out: topic }]);
  if (has(/dashboard|relatorio/)) list.push(['db', 'o-dashboard', `Dashboard ${has(/comercial/) ? 'Comercial' : T}`, { report: has(/comercial/) ? 'Comercial' : T }]);
  const nodes: WNode[] = list.map(([id, kind, name, cfg], i) => ({ ...makeNode(kind, i * COL, ROW, name, cfg), id }));
  const edges: WEdge[] = nodes.slice(1).map((n, i) => ({ id: `${nodes[i]!.id}>${n.id}`, from: nodes[i]!.id, to: n.id }));
  if (has(/erro|falha/) && has(/notific|avis|envie/)) {
    const err = { ...makeNode('notify', COL * 2, ROW * 2, 'Notificar falha'), id: 'er' };
    nodes.push(err); edges.push({ id: 'v>er', from: 'v', to: 'er', err: true, label: 'Se falhar' });
  }
  const wf = freshWorkflow({ name: `${T} · ${hourly ? 'horário' : weekly ? 'semanal' : 'diário'}`, kind: rt ? 'realtime' : 'scheduled', tag: 'Copilot', description: text.trim().replace(/\.$/, ''), unit: 'linhas', bpr: 500, nodes, edges, groups: [], vars: [{ key: 'environment', label: 'Ambiente', type: 'select', value: 'Produção', options: ['Produção', 'Homologação'] }], schedule: rt ? undefined : weekly ? `Semanal · ${at}` : hourly ? 'A cada hora' : `Diário · ${at}`, ...(rt ? { live: { eps: 600, lag: 1.2 } } : {}) });
  return wf;
}

const KIND_WORDS: [RegExp, string, string, Cfg?][] = [
  [/valida/, 'validate', 'Validar dados'], [/aprova/, 'approval', 'Aprovação'], [/notifica|aviso|avise/, 'notify', 'Enviar notificação'],
  [/duplic|dedup/, 'dedupe', 'Deduplicar'], [/filtr/, 'filter', 'Filtrar'], [/normaliz/, 'normalize', 'Normalizar'], [/anomalia/, 'anomaly', 'Detectar anomalia'],
  [/geocod/, 'geocode', 'Geocodificar'], [/classific/, 'classify', 'Classificar'], [/espera|aguard/, 'wait', 'Aguardar'],
];

/** Interpreta o pedido e devolve a resposta do Copilot. */
export function respond(text: string, ctx: Ctx): Msg {
  const { wf, selection, run } = ctx, t = norm(text), has = (re: RegExp) => re.test(t);
  const ai = (m: Partial<Msg> & { text: string }): Msg => ({ id: mid(), role: 'ai', ...m });
  const doc: Doc = wf;
  const failed = run ? Object.entries(run.nodes).find(([, r]) => r.state === 'failed') : undefined;

  if (has(/explic|o que (esse|este) fluxo|resum.* (o )?fluxo/)) {
    const e = explain(wf);
    return ai({ kicker: 'Explicação', text: e.summary, list: e.steps });
  }
  if (has(/por que.*(falh|erro)|motivo.*falh|falhou/)) {
    if (!failed || !run) return ai({ text: 'A execução selecionada não tem falhas. Se algo pareceu errado, escolha a execução no painel “Execução”.' });
    const [id, r] = failed, n = wf.nodes.find((x) => x.id === id)!, f = simOf(n).fail;
    const fix = f?.fixKey ? [{ t: 'cfg', id, cfg: { [f.fixKey]: f.fixValue! } } as Op] : [];
    const text = `“${n.name}” falhou: ${r.err?.reason.toLowerCase()} em ${(r.err?.rows ?? 0).toLocaleString('pt-BR')} registros. ${r.err?.hint ?? ''}`;
    return ai({ kicker: `Execução #${run.id}`, text: fix.length ? `${text} Posso enviar esses registros para quarentena e deixar o restante seguir. Isso não executa nada; é só uma alteração do fluxo.` : text, focus: [id], proposal: fix.length ? proposal(doc, 'Tratar valores inválidos sem interromper', `Em “${n.name}”, registros inválidos vão para quarentena em vez de derrubar a execução.`, fix) : undefined });
  }
  if (has(/lent|gargalo|demor|devagar|performance|desempenho/)) {
    const rows = wf.nodes.map((n) => ({ n, d: run?.nodes[n.id]?.dur ?? simOf(n).dur })).sort((a, b) => b.d - a.d), total = rows.reduce((a, r) => a + r.d, 0) || 1;
    const top = rows.slice(0, 3), opts = optimizations(wf), t0 = top[0];
    if (!t0) return ai({ text: 'O fluxo ainda não tem etapas para analisar.' });
    return ai({ kicker: 'Análise de desempenho', focus: [t0.n.id], text: `O maior custo está em “${t0.n.name}”: ${fmtDur(t0.d)} de ${fmtDur(total)} (${Math.round((t0.d / total) * 100)}% do tempo).${opts.length ? ` Encontrei ${opts.length} oportunidade${opts.length > 1 ? 's' : ''} de otimização. Peça “otimize esse pipeline” para revisar.` : ''}`, list: top.map((r) => `${r.n.name} · ${fmtDur(r.d)} · ${Math.round((r.d / total) * 100)}%`) });
  }
  if (has(/otimiz|acelera|melhora.*(pipeline|fluxo)|reduz/)) {
    const opts = optimizations(wf);
    if (!opts.length) return ai({ text: 'Não encontrei redundâncias, cargas completas evitáveis ou filtros fora de ordem. O fluxo já está enxuto.' });
    const pct = Math.min(60, opts.reduce((a, o) => a + o.pct, 0));
    return ai({ kicker: 'Otimização', text: `Encontrei ${opts.length} oportunidade${opts.length > 1 ? 's' : ''}, com redução estimada de ${pct}% no processamento.`, list: opts.map((o) => `${o.title} · ${o.detail}`), focus: opts.flatMap((o) => o.nodes), proposal: proposal(doc, 'Otimizar o pipeline', `${opts.length} ajustes · ~${pct}% menos processamento.`, opts.flatMap((o) => o.ops), { pct }) });
  }
  if (has(/organiz|layout|arrum|alinh/)) {
    return ai({ kicker: 'Layout', text: 'Reorganizei o fluxo em colunas, da esquerda para a direita, com ramos paralelos lado a lado. Veja a prévia no canvas.', proposal: proposal(doc, 'Organizar o fluxo', 'Novo layout em camadas. Só as posições mudam.', [{ t: 'layout' }]) });
  }
  if (has(/increment/)) {
    const srcs = wf.nodes.filter((n) => kindOf(n.kind).cat === 'source' && n.cfg.mode != null);
    if (!srcs.length) return ai({ text: 'Não há fontes de banco neste fluxo para carregar de forma incremental.' });
    return ai({ kicker: 'Processamento incremental', text: `${srcs.length === 1 ? `“${srcs[0]?.name}” passa` : `${srcs.length} fontes passam`} a ler somente o que mudou desde a última execução, usando a coluna atualizado_em como marca-d’água.`, focus: srcs.map((s) => s.id), proposal: proposal(doc, 'Transformar em processamento incremental', 'Marca-d’água por atualizado_em nas fontes de banco.', srcs.map((s) => ({ t: 'cfg', id: s.id, cfg: { mode: 'Incremental', watermark: 'atualizado_em' } } as Op)), { pct: 62 }) });
  }
  if (has(/erro|falha/) && has(/notific|envie|avis/)) {
    const target = (selection[0] && wf.nodes.find((n) => n.id === selection[0])) || wf.nodes.find((n) => ['validate', 'normalize', 'convert'].includes(n.kind) || kindOf(n.kind).cat === 'source');
    if (!target) return ai({ text: 'Adicione ao menos uma etapa antes de definir o tratamento de erro.' });
    const bottom = Math.max(...wf.nodes.map((n) => n.y)) + ROW, node = makeNode('notify', target.x + COL, bottom, 'Notificar falha', { channel: 'E-mail', to: 'equipe-dados@empresa.com' });
    return ai({ kicker: 'Tratamento de erro', text: `Quando “${target.name}” falhar, uma notificação é enviada. A conexão de erro aparece tracejada e só é seguida em caso de falha.`, focus: [target.id], proposal: proposal(doc, 'Notificar em caso de erro', `Nova aresta de erro a partir de “${target.name}”.`, [{ t: 'add', node }, { t: 'link', from: target.id, to: node.id, err: true, label: 'Se falhar' }]) });
  }
  if (has(/cpf/) && wf.nodes.some((n) => n.kind === 'normalize')) {
    const n = wf.nodes.find((x) => x.kind === 'normalize' && !String(x.cfg.rules).includes('CPF'))!;
    if (!n) return ai({ text: 'A normalização de CPF já está configurada neste fluxo.' });
    return ai({ kicker: 'Normalização', text: `Adicionei a regra “Normalizar CPF” em “${n.name}”: remove pontuação, valida os dígitos verificadores e preenche zeros à esquerda.`, focus: [n.id], proposal: proposal(doc, 'Normalizar CPF', `Nova regra em “${n.name}”.`, [{ t: 'cfg', id: n.id, cfg: { rules: `${n.cfg.rules}|Normalizar CPF` } }]) });
  }
  if (has(/dashboard|relatorio/) && has(/conect|ligue|envie|publique|resultado/)) {
    const name = text.match(/dashboard\s+([A-Za-zÀ-ú]+)/i)?.[1] ?? 'Comercial', last = topo(doc).filter((n) => !doc.edges.some((e) => e.from === n.id && !e.back)).pop();
    if (!last) return ai({ text: 'O fluxo está vazio. Descreva primeiro de onde vêm os dados.' });
    return ai({ kicker: 'Saída', text: `O resultado de “${last.name}” passa a atualizar o dashboard ${name}.`, focus: [last.id], proposal: proposal(doc, `Conectar ao dashboard ${name}`, 'Novo nó de saída ao final do fluxo.', [{ t: 'add', node: makeNode('o-dashboard', last.x + COL, last.y, `Dashboard ${name}`, { report: name }), after: last.id }]) });
  }
  if (has(/adicion|inclu|insira|coloque|ponha|aprovacao antes|antes de publicar/) || (has(/aprov|valida/) && has(/antes|depois|aqui/))) {
    const hit = KIND_WORDS.find(([re]) => re.test(t));
    if (hit) {
      const [, kind, name, cfg] = hit, op = addOp(doc, kind, name, cfg, selection), ref = wf.nodes.find((n) => n.id === (op.t === 'add' ? op.after ?? op.before : ''));
      const where = op.t === 'add' && op.after ? `depois de “${ref?.name}”` : ref ? `antes de “${ref.name}”` : 'no canvas';
      return ai({ kicker: 'Sugestão no canvas', text: `Vou inserir “${name}” ${where}. O nó aparece tracejado no canvas até você aplicar.`, focus: ref ? [ref.id] : [], proposal: proposal(doc, `Adicionar ${name}`, `Novo nó ${where}.`, [op]) });
    }
  }
  if (has(/crie|criar|gere|monte|construa|importe|todo dia|todos os dias|toda (segunda|semana)|a cada/)) {
    const nw = generateWorkflow(text);
    return ai({ kicker: 'Novo fluxo', text: `Montei um fluxo com ${nw.nodes.length} etapas${nw.schedule ? ` (${nw.schedule.toLowerCase()})` : ''}. Revise a prévia antes de aplicar; nada é executado.`, list: nw.nodes.map((n) => `${n.name} · ${kindOf(n.kind).label}`), proposal: { id: mid(), title: nw.name, summary: nw.description, ops: [], changes: nw.nodes.map((n) => `+ Nó “${n.name}” (${kindOf(n.kind).label})`), status: 'pending', newWf: nw } });
  }
  return ai({ text: 'Posso criar, ajustar, explicar e otimizar este fluxo. Experimente:', list: ['Adicione uma validação aqui', 'Quando houver erro, envie notificação', 'Qual node está deixando esse fluxo lento?', 'Organize esse fluxo', 'Explique esse fluxo'] });
}

export const SUGGESTIONS = [
  'Crie um fluxo que importe vendas todos os dias às 6h', 'Depois normalize CPF', 'Quando houver erro, envie notificação', 'Transforme isso em processamento incremental',
  'Adicione aprovação antes de publicar', 'Qual node está deixando esse fluxo lento?', 'Por que essa execução falhou?', 'Otimize esse pipeline', 'Conecte o resultado ao dashboard Comercial', 'Explique esse fluxo', 'Organize esse fluxo', 'Adicione uma validação aqui',
];
