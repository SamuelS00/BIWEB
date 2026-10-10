import { assetById } from './registry';
import type { Card, Msg } from './store';

/** Data Copilot simulado: entende o contexto da seleção e responde com propostas revisáveis. Nunca aplica sozinho. */
export interface Ctx { section: string; itemId?: string; col?: string; issue?: string; sel2?: string }
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
let n = 0;
const id = () => `m${Date.now().toString(36)}${n++}`;
const ai = (text: string, card?: Card, kicker?: string, steps?: string[]): Msg => ({ id: id(), role: 'ai', text, card, kicker, steps });

export function suggestions(ctx: Ctx): string[] {
  if (ctx.col) return ['De onde vem este campo?', 'O que depende desta coluna?', 'Encontrar campos equivalentes', 'Relacione esta coluna com meus clientes'];
  if (ctx.section === 'quality') return ['Explique este problema', 'Por que o quality gate falhou?', 'Normalize este dataset'];
  if (ctx.section === 'model') return ['Normalize este dataset', 'Otimize este modelo', 'Encontrar relacionamentos'];
  if (ctx.section === 'published') return ['Sugira enriquecimentos', 'O que depende deste dataset?'];
  if (ctx.section === 'sources') return ['Esta API substitui uma fonte existente?', 'Explique esta fonte'];
  if (ctx.itemId) return ['Explique esta tabela', 'Normalize este dataset', 'Encontrar relacionamentos', 'Sugira enriquecimentos'];
  return ['Explique esta tabela', 'Normalize este dataset', 'Encontrar relacionamentos', 'Sugira enriquecimentos'];
}

export function reply(text: string, ctx: Ctx): Msg {
  const t = norm(text);
  const a = ctx.itemId ? assetById(ctx.itemId) : undefined;
  if (/normaliz/.test(t)) return ai('Analisei sales_raw (53 colunas). Há dados de cliente, pedido, produto e região repetidos em cada linha. Proponho separar em entidades, sem aplicar nada ainda.', { t: 'normalize' }, 'Proposta de modelo', ['Lendo estrutura de sales_raw', 'Medindo repetição de valores', 'Detectando entidades', 'Comparando com conhecimento existente']);
  if (/relacion|relationship|ligue|conecte/.test(t)) {
    if (/cliente|customer|document|cpf/.test(t) || ctx.col === 'customer_document') return ai('Encontrei uma relação provável entre o documento do CRM e a entidade Customer.', { t: 'relationship', relId: 'r10', label: 'CRM.customer_document → Customer.document' }, 'Relacionamento possível', ['Comparando padrões de CPF', 'Medindo sobreposição de valores', 'Consultando decisões anteriores']);
    return ai('Duas tabelas parecem se relacionar por código de cliente. Veja a evidência antes de aceitar.', { t: 'relationship', relId: 'r5', label: 'CRM.customers.customer_id → ERP.CLIENTES.COD_CLIENTE' }, 'Relacionamento possível');
  }
  if (/de onde|where did|origem|vem este|veio/.test(t)) return ai(`${ctx.col ?? 'Este campo'} vem de ERP Production através de normalizeCpf() até Customers Curated. Abra a linhagem para acompanhar cada passo.`, { t: 'lineage', col: ctx.col ?? 'document' }, 'Linhagem');
  if (/depende|depends|usado por|quem usa/.test(t)) return ai('2 mapeamentos, 1 modelo (Customer 360) e 4 relatórios dependem deste campo. Alterá-lo exige um ChangeSet.', { t: 'lineage', col: ctx.col ?? 'document' }, 'Dependências');
  if (/explique|explain|por que|why|falhou/.test(t) && (ctx.section === 'quality' || /problema|gate|falh|issue/.test(t))) return ai('O gate G2 de Orders Curated reteve 1.248 linhas.', { t: 'explain', lines: ['842 linhas têm CPF inválido: 94% chegam com máscara e 5% sem; alguns têm menos de 11 dígitos.', '811 desses valores voltam a ser válidos com normalizeCpf() (máscara removida, zeros à esquerda restaurados).', '312 linhas referenciam clientes que ainda não existem em Customers Curated.', '94 linhas têm datas no formato dd/mm/aa.'], cta: { label: 'Abrir quarentena', to: '/data/quality/orders' } }, 'Explicação');
  if (/enriquec|enrich/.test(t)) return ai('Para este dataset, sugiro três enriquecimentos. Nenhum será aplicado sem sua aprovação.', { t: 'enrich' }, 'Enriquecimento');
  if (/equival/.test(t)) return ai(`Campos equivalentes a ${ctx.col ?? 'esta coluna'}:`, { t: 'list', items: ['ERP.CLIENTES.CPF · 97% de similaridade', 'Legacy.Clientes.CPF · 94%', 'Sales Import.customer_cpf · 92%'] }, 'Campos equivalentes');
  if (/otimiz|optimi/.test(t)) return ai('Três otimizações possíveis para o modelo atual:', { t: 'list', items: ['Materializar Customer 360 (leituras 4× mais rápidas)', 'Remover 6 colunas sem uso de sales_raw', 'Particionar Orders Curated por mês'] }, 'Otimização');
  if (/api|substitu|replace/.test(t)) return ai('A API de pedidos cobre 92% dos campos de ERP.PEDIDOS e atualiza a cada 5 min. Recomendo mantê-la como fonte complementar, não substituta: ela não traz devoluções.', { t: 'list', items: ['Cobertura de campos: 92%', 'Frescor: 5 min vs 15 min', 'Lacuna: devoluções e descontos'] }, 'Comparação de fontes');
  if (/explique esta|explain this|tabela|table/.test(t)) return ai(`${a?.name ?? 'Esta tabela'} guarda ${a ? a.rows.toLocaleString('pt-BR') : 'milhares de'} registros de ${a?.concept ?? 'negócio'}. Tem chaves claras, ${a?.cols.filter((c) => c.pii).length ?? 0} colunas com dados pessoais e qualidade de ${a?.quality ?? 97}%.`, { t: 'list', items: ['Entidade de negócio: ' + (a?.concept ?? '—'), 'Relacionamentos: ver aba Relacionamentos', 'Pontos de atenção: CPF com dois formatos'] }, 'Resumo');
  return ai('Posso explicar uma tabela, normalizar um dataset, encontrar relacionamentos, rastrear a origem de um campo ou sugerir enriquecimentos. O que você quer fazer?', { t: 'list', items: suggestions(ctx) });
}
