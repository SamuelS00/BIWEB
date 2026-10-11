import type { CopilotBlock, CopilotContext } from '@biweb/assistant-ui';
import { CHANGES, CONFLICTS, EVIDENCE_PACKS, PROPOSALS } from './data/seed';
import { entityById, inWeek, observationsOf, packForChange, sourceById } from './data/derive';
import { useDs } from './store';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Copilot do Discovery: entende missões, fontes, entidades, observações, mudanças, evidências, conflitos e datasets. Responde com evidência clicável; nunca aplica nada. */
export async function reply(input: string, _ctx: CopilotContext): Promise<CopilotBlock[]> {
  await wait(450);
  const q = norm(input);
  const ds = useDs.getState();
  const sel = ds.sel?.kind === 'entity' ? entityById(ds.sel.id) : undefined;

  if (/mudou|mudanc|changed|changes|semana|week/.test(q)) {
    const week = CHANGES.filter((c) => inWeek(c) && c.missionId === 'm1').length;
    return [
      { kind: 'text', text: `**${week} mudanças relevantes** nos concorrentes monitorados esta semana. Três merecem atenção (dados de demonstração):` },
      { kind: 'links', title: 'Mudanças significativas', items: [
        { id: 'ch:c-coa-price', label: 'Company A · Pricing changed', meta: 'Contact Sales → Starting at $2,500/month · high confidence' },
        { id: 'ch:c-o-23', label: 'Company B · New AI capability', meta: 'Natural-language query · 1 source (needs corroboration)' },
        { id: 'ch:c-o-24', label: 'Company C · New integration', meta: 'Snowflake connector · 1 source' },
      ] },
      { kind: 'links', title: 'Evidence', items: [{ id: 'ev:p-coa-price', label: 'Evidence Pack · Company A pricing', meta: 'Official Pricing Page · Primary · High' }, { id: 'ev:p-coa-rad', label: 'Evidence Pack · Realtime anomaly detection', meta: '3 evidence · no contradictions' }] },
      { kind: 'citation', text: 'Watchlist BI Competitors · Competitive Intelligence — BI Platforms · demo data' },
      { kind: 'actions', items: [{ id: 'go:/discovery/entities/compare', label: 'Compare' }, { id: 'go:/discovery/datasets/ds1', label: 'Create report' }] },
    ];
  }
  if (/integra/.test(q)) {
    const counts: Record<string, number> = {};
    CHANGES.filter((c) => inWeek(c) && c.kind === 'Integration added' && c.missionId === 'm1').forEach((c) => { counts[c.entity] = (counts[c.entity] ?? 0) + 1; });
    const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return [
      { kind: 'text', text: `**${rows[0]?.[0] ?? 'Nenhum'}** adicionou mais integrações na semana (${rows[0]?.[1] ?? 0}). Contagem baseada em mudanças detectadas, não em estimativa.` },
      { kind: 'evidence', title: 'Integrations added this week', rows: rows.map(([k, v]) => [k, v] as [string, number]), unit: 'integrations' },
      { kind: 'links', items: [{ id: 'ch:c-pbi-conn', label: 'Power BI · Fabric Real-Time Hub connector', meta: 'Release notes · Primary' }] },
    ];
  }
  if (/evidenc|preco|price|de onde|veio|origem|source/.test(q)) {
    const pack = EVIDENCE_PACKS.find((p) => p.id === 'p-coa-price')!;
    const src = sourceById('s-coa-pricing')!;
    return [
      { kind: 'text', text: `O preço **USD 2,500/month** do plano Enterprise da Company A vem de ${src.name} (fonte ${src.authority.toLowerCase()}), capturado hoje às 08:42. Confiança 92%: fonte oficial alta, frescor alto, corroboração média.` },
      { kind: 'citation', text: `${pack.claim} · First observed ${pack.firstObserved} · Contradictions: ${pack.contradictions}` },
      { kind: 'links', title: 'Abrir a origem', items: [{ id: 'ev:p-coa-price', label: 'Evidence Pack', meta: 'Pricing table › Enterprise › Price' }, { id: 'src:s-coa-pricing', label: src.name, meta: `${src.snapshots} snapshots` }] },
    ];
  }
  if (/conflit|contradi|diverg/.test(q)) {
    const open = CONFLICTS.filter((c) => !ds.resolved[c.id]);
    const f = sel ? open.filter((c) => c.entityId === sel.id) : open;
    if (!f.length) return [{ kind: 'text', text: 'No conflicting evidence found.' }];
    return [
      { kind: 'text', text: `${f.length} conflito(s) em aberto${sel ? ` para ${sel.name}` : ''}. Em todos, a recomendação é a fonte primária mais recente, mas a decisão é sua.` },
      { kind: 'links', title: 'Conflicts', items: f.map((c) => ({ id: `cf:${c.id}`, label: `${c.entity} · ${c.field}`, meta: `${c.a.label}: ${c.a.value} × ${c.b.label}: ${c.b.value}` })) },
    ];
  }
  if (/enrique|enrich|fontes publicas|clientes/.test(q)) {
    const open = PROPOSALS.filter((p) => (ds.proposals[p.id] ?? p.status) === 'proposed');
    return [
      { kind: 'text', text: `Encontrei **${open.length} propostas de enriquecimento** para clientes do LDE. A primeira: Nova Telecom Ltda., match 98%, +5 atributos externos. Nada é aplicado sem validação do LDE.` },
      { kind: 'steps', items: ['External observation', 'Enrichment Proposal', 'LDE: Match · Validate · Normalize · Relate', 'Review', 'Trusted Internal Data'] },
      { kind: 'actions', items: [{ id: 'go:/discovery/datasets/enrichment', label: 'Preview & send to LDE' }] },
    ];
  }
  if (/mapa|map|unidades|locais/.test(q)) {
    return [
      { kind: 'text', text: '27 organizações de fibra com 28+ pontos geográficos confirmados. Abra o mapa no Discovery ou continue no Map Builder.' },
      { kind: 'actions', items: [{ id: 'go:/discovery/explore', label: 'Ver no Explore (Map)' }, { id: 'go:/maps', label: 'Open in Map Builder' }] },
    ];
  }
  if (/compar|vs|x /.test(q) || (sel && /company b|compare/.test(q))) {
    const a = sel ?? entityById('coa')!;
    const b = entityById('cob')!;
    const rows = [a, b].map((e) => [e.name, observationsOf(e.id).length] as [string, number]);
    return [
      { kind: 'text', text: `**${a.name}** × **${b.name}**: ${a.name} tem ${a.products.length} produtos e ${a.integrations.length} integrações; ${b.name} tem ${b.products.length} e ${b.integrations.length}. Cada célula da comparação abre sua evidência.` },
      { kind: 'evidence', title: 'Observations on record', rows, unit: 'observations' },
      { kind: 'actions', items: [{ id: 'go:/discovery/entities/compare', label: 'Open comparison' }] },
    ];
  }
  void packForChange;
  return [
    { kind: 'text', text: 'Posso pesquisar, explicar, comparar, achar evidências, expandir uma busca, criar watchlist, enriquecer o LDE e montar um relatório. O que você quer saber?' },
    { kind: 'steps', items: ['O que mudou nos concorrentes esta semana?', 'Qual evidência temos desse preço?', 'Existem informações conflitantes sobre essa empresa?'] },
  ];
}
