/**
 * Copilot do workspace Operações de Rede: respostas calculadas sobre o dataset Rede Metropolitana SP
 * (com as regras do relatório aberto). Mesma interface do motor de exemplo do varejo.
 */
import type { CopilotBlock, CopilotContext, CopilotEngine } from '@biweb/assistant-ui';
import { aggregate, applyRules, fmt, STATUS_LABEL } from '../data/query';
import { getTable, network } from '../data/registry';
import { coverFor } from '../editor/covers';
import { useLibrary } from '../editor/library';
import { useEditor } from '../editor/store';
import { mockCopilot } from './engine';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const DS = 'ds_rede_sp';
const link = (id: string) => { const d = useLibrary.getState().get(id); return d ? { id: d.id, label: d.name, meta: `${d.kind} · ${d.category} · ${d.status}`, thumb: coverFor(d, { width: 160, height: 90 }) } : null; };
const links = (...ids: string[]) => ids.map(link).filter((x): x is NonNullable<typeof x> => !!x);
const rulesFor = (reportId?: string) => (reportId ? useLibrary.getState().get(reportId)?.rules ?? [] : []);
const enlaces = (reportId?: string) => applyRules(getTable(DS, 'enlaces').rows, rulesFor(reportId).filter((r) => r.table === 'enlaces'));
const r1 = (v: number) => Math.round(v * 10) / 10;

export const networkCopilot: CopilotEngine = {
  suggestions(ctx: CopilotContext) {
    if (ctx.reportId && useLibrary.getState().get(ctx.reportId)) return ['Resuma este relatório', 'Quais enlaces estão críticos?', 'Onde estão os rompimentos ativos?', 'Como crio uma regra?'];
    return ['Quais enlaces estão críticos?', 'Onde estão os rompimentos ativos?', 'Quais regiões estão perto do limite de capacidade?', 'Como importo minha rede (KMZ)?'];
  },
  async reply(input: string, ctx: CopilotContext): Promise<CopilotBlock[]> {
    const q = norm(input);
    const net = network();
    const ls = enlaces(ctx.reportId);
    if (ctx.reportId && !useLibrary.getState().get(ctx.reportId)) return mockCopilot.reply(input, ctx);
    await wait(450 + Math.random() * 350);
    if (/resum/.test(q) && ctx.reportId) {
      const d = useLibrary.getState().get(ctx.reportId)!;
      const comps = d.pages.flatMap((p) => p.comps);
      const av = aggregate(ls, { ds: DS, table: 'enlaces', measure: 'disponibilidade', agg: 'avg' })[0]!.value;
      const crit = ls.filter((l) => l.status === 'critical' || l.status === 'offline').length;
      const act = net.events.filter((e) => !e.resolvido).length;
      return [
        { kind: 'text', text: `**${d.name}** · ${d.description} São ${d.pages.length} ${d.pages.length > 1 ? 'páginas' : 'página'} (${d.pages.map((p) => p.name).join(', ')}) com ${comps.length} componentes, sobre o dataset Rede Metropolitana SP.` },
        { kind: 'text', text: `Agora: disponibilidade média de **${fmt(av, 'pct')}**, **${crit} enlaces** críticos ou offline e **${act} eventos** ativos.${d.rules.length ? ` Regras ativas: ${d.rules.filter((r) => r.enabled).map((r) => r.name).join(', ')}.` : ''}` },
        ...(d.status !== 'Publicado' ? [{ kind: 'badge' as const, tone: 'warning' as const, text: `Status: ${d.status}` }] : []),
        { kind: 'citation', text: 'Rede Metropolitana SP · inventario_rede (netops-db) · atualizado 06/10/2026 08:00' },
      ];
    }
    if (/critic|piores|problema|offline/.test(q) && /enlace|link|fibra|rede|critic/.test(q)) {
      const bad = ls.filter((l) => l.status === 'critical' || l.status === 'offline').sort((a, b) => Number(b.atenuacao_dB) - Number(a.atenuacao_dB));
      const off = bad.filter((l) => l.status === 'offline');
      return [
        { kind: 'text', text: `**${bad.length} enlaces** estão críticos ou offline: ${off.length} offline (rompimento) e ${bad.length - off.length} críticos por atenuação ou saturação. O pior é **${String(bad[0]?.id)}** (${String(bad[0]?.nome)}), com ${fmt(bad[0]?.atenuacao_dB, 'db')}.` },
        { kind: 'evidence', title: 'Atenuação dos enlaces críticos (dB)', rows: bad.filter((l) => l.status !== 'offline').slice(0, 8).map((l) => [String(l.id), Number(l.atenuacao_dB)] as [string, number]), unit: 'dB' },
        ...(off.length ? [{ kind: 'text' as const, text: `Offline: ${off.map((l) => `${String(l.id)} (${String(l.regiao)})`).join(', ')}.` }] : []),
        { kind: 'citation', text: 'Tabela Enlaces · status efetivo (com as regras do relatório)' },
        { kind: 'links', title: 'Para agir', items: links('net_operacoes', 'net_incidentes') },
      ];
    }
    if (/rompiment|cortad|fibra rompida|incidente|ocorrencia|evento/.test(q)) {
      const act = net.events.filter((e) => !e.resolvido);
      const br = net.events.filter((e) => e.tipo === 'Rompimento de fibra');
      const byReg = new Map<string, number>(); for (const e of br) byReg.set(e.regiao, (byReg.get(e.regiao) ?? 0) + 1);
      return [
        { kind: 'text', text: `**${act.length} ocorrências ativas**, ${act.filter((e) => e.tipo === 'Rompimento de fibra').length} delas rompimentos de fibra: ${act.filter((e) => e.tipo === 'Rompimento de fibra').map((e) => `${e.regiao} (${e.elemento})`).join(', ')}. Em 30 dias foram ${br.length} rompimentos.` },
        { kind: 'evidence', title: 'Rompimentos por região · 30 dias', rows: [...byReg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8), unit: '' },
        { kind: 'citation', text: 'Tabela Eventos · 06/09–06/10/2026' },
        { kind: 'links', items: links('net_campo', 'net_incidentes', 'net_rotas') },
      ];
    }
    if (/capacidad|utiliza|ocupa|satura|limite/.test(q)) {
      const by = aggregate(ls, { ds: DS, table: 'enlaces', groupBy: 'regiao', measure: 'utilizacao', agg: 'avg', sort: 'value', limit: 8 });
      const over = ls.filter((l) => Number(l.utilizacao) > 80).length;
      return [
        { kind: 'text', text: `**${over} enlaces** passam de 80% de utilização. As regiões mais carregadas são ${by.slice(0, 3).map((b) => `${b.label} (${fmt(b.value, 'pct')})`).join(', ')}.` },
        { kind: 'evidence', title: 'Utilização média por região (%)', rows: by.map((b) => [b.label, r1(b.value)] as [string, number]), unit: '%' },
        { kind: 'citation', text: 'Tabela Enlaces · utilização atual' },
        { kind: 'links', items: links('net_capacidade') },
      ];
    }
    if (/disponib|caiu|queda|por que/.test(q)) {
      const by = aggregate(ls, { ds: DS, table: 'enlaces', groupBy: 'regiao', measure: 'disponibilidade', agg: 'avg', sort: 'value' }).sort((a, b) => a.value - b.value).slice(0, 6);
      return [
        { kind: 'text', text: `A disponibilidade média dos enlaces é **${fmt(aggregate(ls, { ds: DS, table: 'enlaces', measure: 'disponibilidade', agg: 'avg' })[0]!.value, 'pct')}**. As regiões que mais puxam para baixo têm rompimentos ativos ou enlaces críticos: ${by.slice(0, 3).map((b) => b.label).join(', ')}.` },
        { kind: 'evidence', title: 'Disponibilidade por região · menores (%)', rows: by.map((b) => [b.label, Math.round(b.value * 100) / 100] as [string, number]), unit: '%' },
        { kind: 'links', items: links('net_executiva', 'net_geografica') },
      ];
    }
    if (/torre|sp-0|3d|gemeo|visada/.test(q)) {
      const t = net.nodes.find((n) => n.id === 'Torre SP-023')!;
      return [
        { kind: 'text', text: `**Torre SP-023** (${t.regiao}) · ${t.tecnologia}, ${t.altura_m} m, utilização ${t.utilizacao}%, status ${STATUS_LABEL[t.status]}. No gêmeo digital dá para ver a linha de visada até as torres vizinhas e onde o relevo bloqueia o enlace de rádio.` },
        { kind: 'links', items: links('net_gemeo') },
      ];
    }
    if (/kmz|kml|importar|import|shp|geojson|csv|fonte/.test(q)) return [
      { kind: 'text', text: 'Para importar sua rede:' },
      { kind: 'steps', items: ['Abra **Dados** e clique em **Importar dados**.', 'Escolha o formato (KMZ, KML, SHP, GeoJSON, CSV, XLSX, JSON, API ou banco) e envie o arquivo.', 'Confira o que foi detectado: pontos, linhas, polígonos, coordenadas e identificadores.', 'Mapeie os campos (Name → Nome do ativo, Geometry → Geometria…) e clique em **Criar dataset de rede**.'] },
      { kind: 'text', text: 'O dataset aparece na aba **Dados** do editor e pode alimentar vários relatórios ao mesmo tempo.' },
    ];
    if (/regra|alerta|condic/.test(q)) return [
      { kind: 'text', text: 'Regras recalculam status, rótulos e alertas sobre o dataset:' },
      { kind: 'steps', items: ['No editor, abra a aba **Regras** e clique em **Nova regra** (ou use um modelo).', 'Monte **SE** campo · operador · valor (com E/OU) e **ENTÃO** marcar como, rótulo, alerta ou destaque.', 'A contagem de elementos afetados e o efeito no mapa e nas tabelas aparecem na hora.'] },
      { kind: 'text', text: 'Também posso criar a regra: diga, por exemplo, "marque como crítico os enlaces com atenuação acima de 18 dB" na aba IA do editor.' },
    ];
    if (/relatorio|report|onde (fica|encontro)|quais/.test(q)) {
      const docs = useLibrary.getState().docs.filter((d) => q.split(/\s+/).some((w) => w.length > 4 && norm(`${d.name} ${d.description}`).includes(w)));
      return [{ kind: 'text', text: docs.length ? `Encontrei **${docs.length} relatórios**:` : 'Não encontrei relatórios com esses termos. Estes são os mais usados:' }, { kind: 'links', items: links(...(docs.length ? docs : useLibrary.getState().docs.slice(0, 4)).map((d) => d.id)) }];
    }
    if (/como|criar|crio|dashboard|ajuda|usar|editor/.test(q)) return [
      { kind: 'text', text: 'Para criar um relatório:' },
      { kind: 'steps', items: ['Em **Relatórios**, clique em **Novo relatório**.', 'Arraste componentes da paleta (KPI, gráfico, mapa, 3D…) e ligue campos na aba **Dados**.', 'Configure aparência em **Visual**, filtros e cross-filter em **Interações** e regras em **Regras**.', 'Use **Visualizar** para testar e **Publicar** quando a checklist estiver verde.'] },
      { kind: 'text', text: 'Na aba **IA** do editor, eu monto páginas inteiras e reorganizo o layout por você — cada ação pode ser desfeita.' },
    ];
    void useEditor;
    return [{ kind: 'text', text: 'Posso responder sobre enlaces críticos, rompimentos, capacidade, disponibilidade, a Torre SP-023, encontrar relatórios ou explicar como importar dados e criar regras.' }];
  },
};
