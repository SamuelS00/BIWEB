/**
 * Motor de EXEMPLO do Copilot: respostas determinísticas sobre os dados do Lume Varejo.
 * Em produção, a mesma interface fala com a Assistant API (SSE), que usa QDL com o principal do usuário (docs/architecture/31).
 */
import type { CopilotBlock, CopilotContext, CopilotEngine } from '@biweb/assistant-ui';
import { canais, categorias, coverUrl, quedaCategoria, quedaRegiao, regioes, reports } from '../fixtures/lume-varejo';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const link = (id: string) => { const r = reports.find((x) => x.id === id)!; return { id: r.id, label: r.name, meta: `${r.type} · ${r.category} · ${r.status}`, thumb: coverUrl(r.cover, true) }; };

export const mockCopilot: CopilotEngine = {
  suggestions(ctx: CopilotContext) {
    if (ctx.reportId) return ['Resuma este relatório', 'Por que a receita caiu em setembro?', 'Qual região mais contribui para a receita?', 'Como compartilho este relatório?'];
    return ['Por que a receita caiu em setembro?', 'Quais relatórios falam de estoque?', 'Qual canal vende mais?', 'Como crio um dashboard?'];
  },
  async reply(input: string, ctx: CopilotContext): Promise<CopilotBlock[]> {
    await wait(500 + Math.random() * 400);
    const q = norm(input);
    if (/caiu|queda|setembro|cair/.test(q)) return [
      { kind: 'text', text: 'A receita caiu **R$ 0,70 mi (−31,5%)** de agosto (R$ 2,22 mi) para setembro (R$ 1,52 mi). Os pedidos caíram 33,2% (5.150 → 3.441) e o ticket médio ficou estável em R$ 442: a queda foi de volume, não de preço.' },
      { kind: 'evidence', title: 'Queda por categoria · set vs ago (R$ mi)', rows: quedaCategoria, unit: 'R$ mi', diverging: true },
      { kind: 'evidence', title: 'Queda por região · set vs ago (R$ mi)', rows: quedaRegiao, unit: 'R$ mi', diverging: true },
      { kind: 'text', text: 'O maior contribuinte individual é **Smart TV 55" 4K** em SP, no mesmo mês em que a taxa de ruptura subiu de 4,8% para 14,2%.' },
      { kind: 'badge', tone: 'warning', text: 'Taxa de ruptura é uma métrica em rascunho (não certificada)' },
      { kind: 'citation', text: 'vendas_pedidos (01/08–30/09/2026) · métricas Receita e Pedidos (certificadas)' },
      { kind: 'links', title: 'Para aprofundar', items: [link('rpt_fechamento_set'), link('rpt_estoque')] },
      { kind: 'actions', items: [{ id: 'create-analysis', label: 'Criar relatório com esta análise' }, { id: 'open-model', label: 'Ver Taxa de ruptura no modelo' }] },
    ];
    if (/estoque|ruptura/.test(q)) return [
      { kind: 'text', text: 'Encontrei **2 relatórios** sobre estoque e ruptura. O primeiro ainda é rascunho e usa uma métrica não certificada.' },
      { kind: 'links', items: [link('rpt_estoque'), link('rpt_fechamento_set')] },
      { kind: 'citation', text: 'Busca no catálogo por nome, descrição e sinônimos' },
    ];
    if (/canal|canais|e-commerce|marketplace|loja fisica/.test(q)) return [
      { kind: 'text', text: `A **loja física** responde por ${canais[0]![1]}% da receita do ano, seguida pelo e-commerce (${canais[1]![1]}%) e pelo marketplace (${canais[2]![1]}%).` },
      { kind: 'evidence', title: 'Participação na receita por canal (%)', rows: canais, unit: '%' },
      { kind: 'citation', text: 'vendas_pedidos (01/01–30/09/2026) · métrica Receita (certificada)' },
      { kind: 'links', items: [link('rpt_canais')] },
    ];
    if (/regiao|regioes|estado|sudeste/.test(q)) return [
      { kind: 'text', text: 'O **Sudeste** gera R$ 8,1 mi (44% da receita). SP sozinho soma R$ 4,3 mi, mais que qualquer outra região inteira.' },
      { kind: 'evidence', title: 'Receita por região (R$ mi)', rows: regioes, unit: 'R$ mi' },
      { kind: 'citation', text: 'vendas_pedidos (01/01–30/09/2026) · métrica Receita (certificada)' },
      { kind: 'links', items: [link('rpt_regiao'), link('rpt_lojas')] },
    ];
    if (/categoria|produto|eletronic/.test(q)) return [
      { kind: 'text', text: '**Eletrônicos** lidera com R$ 6,2 mi (34% da receita). O produto mais vendido é a Smart TV 55" 4K, com R$ 1,42 mi.' },
      { kind: 'evidence', title: 'Receita por categoria (R$ mi)', rows: categorias, unit: 'R$ mi' },
      { kind: 'links', items: [link('rpt_ranking_produtos')] },
    ];
    if (/resum/.test(q) && ctx.reportId) {
      const r = reports.find((x) => x.id === ctx.reportId)!;
      return [
        { kind: 'text', text: `**${r.name}** · ${r.description} Tem ${r.pages.length} ${r.pages.length > 1 ? 'páginas' : 'página'} (${r.pages.join(', ')}), está ${r.status.toLowerCase()} e foi atualizado ${r.updated} por ${r.owner}.` },
        ...(r.status !== 'Publicado' ? [{ kind: 'badge' as const, tone: 'warning' as const, text: `Status: ${r.status}` }] : []),
        { kind: 'text', text: 'Destaques do período: receita de R$ 18,4 mi (+9,6% vs 2025), margem de 27,8% (−0,4 p.p.) e queda de 31,5% em setembro, puxada por Eletrônicos.' },
        { kind: 'citation', text: 'Métricas Receita, Margem % e Pedidos (certificadas)' },
      ];
    }
    if (/compartilh|enviar|exportar/.test(q)) return [
      { kind: 'text', text: 'Para compartilhar um relatório:' },
      { kind: 'steps', items: ['Abra o relatório e clique em **Compartilhar** no cabeçalho.', 'Escolha pessoas ou grupos do workspace e o papel (leitor ou editor).', 'Para enviar periodicamente, use **Agendar envio** (chega como PDF por e-mail).'] },
      { kind: 'badge', tone: 'accent', text: 'Compartilhar e agendamentos estão previstos para a próxima fase do produto' },
    ];
    if (/como|criar|crio|dashboard|ajuda|usar/.test(q)) return [
      { kind: 'text', text: 'Para criar um dashboard:' },
      { kind: 'steps', items: ['Em **Relatórios**, clique em **Novo relatório**.', 'Arraste uma métrica do painel **Dados** (ex.: Receita) para o canvas.', 'Use o **Inspector** à direita para trocar a visualização e o formato.', 'Clique em **Publicar** quando estiver pronto; até lá ele fica como rascunho.'] },
      { kind: 'text', text: 'Também posso montar uma primeira versão a partir de um objetivo, como "acompanhar vendas semanais por canal". Você revisa antes de aplicar.' },
    ];
    return [
      { kind: 'text', text: 'Ainda não sei responder isso com os dados de exemplo. Posso ajudar com a receita e sua queda em setembro, regiões, canais, categorias, encontrar relatórios ou explicar como usar o BIWEB.' },
    ];
  },
};
