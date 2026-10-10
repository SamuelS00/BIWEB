/* Copilot do Migration Studio (simulado): conhece projeto, item selecionado, compatibilidade, blueprint, mapeamentos e validação.
   Fluxo fixo: pergunta → proposta → prévia → aplicar. Nunca altera nada sem confirmação. */
import { CHECKS, INSIGHTS, REVIEW, SUGGESTIONS, translationOf } from './analysis';
import { ITEMS, MAPS, MEASURES, PROCESSES, REPORTS, VISUALS, impactOf, relatives } from './data';
import { KIND_LABEL, compatLabel } from './model';
import type { Item, Strategy } from './model';
import { effectiveStrategy, pendingReview, readiness } from './derive';
import type { Msg, Op, ProjState } from './model';

interface Ctx { cur: () => ProjState; projects: { id: string; strategy: Strategy; name: string }[]; pid: string }
const id = () => `m${Math.random().toString(36).slice(2, 8)}`;
const has = (t: string, ...w: string[]) => w.some((x) => t.includes(x));
const ai = (text: string, extra: Partial<Msg> = {}): Msg => ({ id: id(), role: 'ai', text, ...extra });
const STRAT: Record<Strategy, string> = { fidelity: 'Fidelity', native: 'Native', modernize: 'Modernize' };

export const SUGGESTED = (sel?: Item): string[] => {
  if (!sel) return ['Quais itens ainda impedem a publicação?', 'Existem medidas duplicadas?', 'Quais relatórios não são utilizados?', 'Quais elementos precisam de revisão manual?'];
  switch (sel.kind) {
    case 'report': return ['Explique este relatório', 'Quais páginas são praticamente iguais?', 'Use Native Mode para este relatório', 'Modernize este dashboard'];
    case 'page': return ['Explique esta página', 'Compare os resultados', 'Use Native Mode para esta página'];
    case 'measure': return ['De onde vem esse KPI?', 'Esse cálculo pode ser reconstruído?', 'Quais relatórios dependem desta medida?', 'Existem medidas duplicadas?'];
    case 'visual': return ['Por que esse visual precisa ser redesenhado?', 'Encontre o equivalente no BIWEB', 'Modernize este visual'];
    case 'map': return ['Esse mapa pode virar um Map Workspace?', 'Migre esse mapa utilizando o Map Builder'];
    case 'process': return ['Converta essas operações em Workflow', 'Existe alguma automação que pode virar Workflow?'];
    default: return ['Explique este item', 'Quais relatórios dependem deste dataset?', 'De onde vem isso?'];
  }
};

function lineage(it: Item) {
  const up = relatives(it.id, 'up').map((x) => ITEMS.get(x)).filter((x): x is Item => !!x);
  const src = up.filter((x) => x.type === 'Fonte de dados'), ds = up.filter((x) => x.kind === 'dataset' && x.type !== 'Fonte de dados'), tb = up.filter((x) => x.kind === 'table');
  return { src, ds, tb };
}

export function respond(raw: string, selId: string, st: Ctx): Msg | null {
  const t = raw.toLowerCase(), ps = st.cur(), it = ITEMS.get(selId), project = st.projects.find((p) => p.id === st.pid)!;
  const eff = it ? effectiveStrategy(ps, { ...project, strategy: project.strategy } as never, it.id) : undefined;
  const ctx = it ? `${KIND_LABEL[it.kind]}: ${it.name}` : 'Projeto';

  /* estratégia */
  const wantStrategy: Strategy | null = has(t, 'native mode', 'modo native', 'use native', 'nativo') ? 'native' : has(t, 'fidelity', 'fidelidade') ? 'fidelity' : null;
  if (wantStrategy && it && eff?.value === wantStrategy) {
    return ai(`${it.name} já usa ${STRAT[wantStrategy]} (${eff.from === 'projeto' ? 'herdado do projeto' : `definido em ${eff.from}`}). Se quiser mais liberdade, posso propor Modernize com prévia.`, { kicker: ctx, focus: [it.id], list: ['Modernize este dashboard'] });
  }
  if (wantStrategy && it) {
    return ai(`Posso aplicar ${STRAT[wantStrategy]} em ${it.name}. A estratégia atual é ${STRAT[eff?.value ?? 'native']} (${eff?.from}). O resultado muda o jeito de reconstruir, não o dado.`, { kicker: ctx, focus: [it.id],
      proposal: { title: `Usar ${STRAT[wantStrategy]} em ${it.name}`, summary: wantStrategy === 'native' ? 'Cada elemento vira o componente nativo equivalente, com o tema e as interações do BIWEB.' : 'Preserva layout e comportamento do original, mesmo quando menos idiomático.', changes: [`~ Estratégia de ${it.name}: ${STRAT[eff?.value ?? 'native']} → ${STRAT[wantStrategy]}`, '~ Reconstrução desse item será refeita ao aplicar'], ops: [{ t: 'strategy', id: it.id, value: wantStrategy }], status: 'pending' } });
  }
  if (has(t, 'moderniz')) {
    const rel = SUGGESTIONS.filter((s) => !ps.suggestions[s.id] && (!it || s.itemIds.some((x) => x === it.id || it.id.startsWith(x) || x.startsWith(it.id.split(':').slice(0, 2).join(':')))));
    const list = rel.length ? rel : SUGGESTIONS.filter((s) => !ps.suggestions[s.id]).slice(0, 2);
    const ops: Op[] = [...(it ? [{ t: 'strategy', id: it.id, value: 'modernize' } as Op] : []), ...list.map((s) => ({ t: 'suggestion', id: s.id } as Op))];
    return ai(`Em Modernize, encontrei ${list.length} proposta${list.length === 1 ? '' : 's'} para ${it?.name ?? 'o projeto'}. Cada uma tem motivo, impacto e prévia na aba Reconstrução → Modernização.`, { kicker: ctx, focus: it ? [it.id] : [],
      proposal: { title: 'Modernizar com revisão', summary: 'Aplica a estratégia Modernize e aceita as sugestões abaixo. Nada é publicado.', changes: [...(it ? [`~ Estratégia de ${it.name} → Modernize`] : []), ...list.map((s) => `+ ${s.title}`)], ops, status: 'pending' } });
  }

  /* mapas e processos */
  if (has(t, 'mapa', 'map workspace', 'map builder')) {
    const m = (it?.kind === 'map' ? it : it?.kind === 'visual' ? MAPS.map((x) => ITEMS.get(x.id)!).find((x) => x.meta['Visual de origem'] === it.name) : undefined) ?? ITEMS.get('map:regional')!;
    const def = MAPS.find((x) => x.id === m.id)!;
    return ai(`${m.name} tem estrutura geográfica reconhecível: ${def.layers.map((l) => `${l[0]} (${l[2]} ${l[1]})`).join(', ')}. Dá para reconstruir como Map Workspace e ganhar camadas, rotas e análise espacial.${m.id === 'map:network' ? ' A camada de tiles personalizada continua na fila de revisão.' : ''}`, { kicker: ctx, focus: [m.id],
      proposal: { title: `Reconstruir ${m.name} no Map Builder`, summary: 'Cria as camadas, a base e a legenda no Map Workspace sugerido.', changes: def.layers.map((l) => `+ Camada ${l[0]} · ${l[2]} ${l[1]}`), ops: [{ t: 'recon', id: `rt:${m.id}` }, { t: 'tab', tab: 'reconstruct', select: m.id }], status: 'pending' } });
  }
  if (has(t, 'workflow', 'automa', 'agenda', 'processo', 'operações em')) {
    const p = (it?.kind === 'process' ? it : ITEMS.get('proc:refresh'))!, def = PROCESSES.find((x) => x.id === p.id)!;
    return ai(`${p.name} reúne ${def.parts.length} peças operacionais que no BIWEB viram um único fluxo auditável: ${def.parts.join(' → ')}.`, { kicker: ctx, focus: [p.id],
      proposal: { title: 'Converter em Workflow', summary: 'Agenda → atualizar dataset → avaliar KPI → condição → notificação.', changes: def.parts.map((x) => `+ ${x}`), ops: [{ t: 'recon', id: `rt:${p.id}` }, { t: 'tab', tab: 'reconstruct', select: p.id }], status: 'pending' } });
  }

  /* publicação e revisão */
  if (has(t, 'impede', 'publica', 'publish', 'bloque')) {
    const r = readiness(ps), pend = pendingReview(ps);
    const top = pend.slice(0, 5).map((x) => x.title);
    return ai(pend.length || r.failed ? `${pend.length} itens aguardam decisão e ${r.failed} comparações falharam. Relatórios prontos: ${r.reports.ready}/${r.reports.total}, mapas ${r.maps.ready}/${r.maps.total}, fluxos ${r.workflows.ready}/${r.workflows.total}.` : 'Nada impede a publicação: sem itens em revisão e sem comparações com falha.', { kicker: 'Publicação', list: top, focus: [], proposal: pend.length ? { title: 'Aceitar recomendações de alta confiança', summary: 'Aceita apenas itens com confiança ≥ 70%. Os demais continuam em revisão.', changes: pend.filter((x) => x.confidence >= 70).map((x) => `~ ${x.title} → aceito`), ops: pend.filter((x) => x.confidence >= 70).map((x) => ({ t: 'review', id: x.id, value: 'accepted' } as Op)), status: 'pending' } : undefined });
  }
  if (has(t, 'revisão', 'revisao', 'review', 'precisam de')) {
    const pend = pendingReview(ps);
    return ai(pend.length ? `${pend.length} itens precisam de decisão humana. Os de menor confiança estão primeiro.` : 'Nenhum item exige revisão.', { kicker: 'Fila de revisão', list: pend.sort((a, b) => a.confidence - b.confidence).slice(0, 6).map((x) => `${x.title} · ${x.confidence}%`), proposal: undefined, focus: [] });
  }
  if (has(t, 'compare', 'compar')) {
    const pg = it?.kind === 'page' ? it : it?.kind === 'visual' ? ITEMS.get(it.parent ?? '') : undefined;
    return ai(`Abrindo a comparação lado a lado${pg ? ` de ${pg.name}` : ''}. O diff mostra layout, dados, filtros, interações e visuais alterados com o motivo.`, { kicker: ctx, proposal: { title: 'Abrir Compare', summary: 'Navegar até Reconstrução → Compare.', changes: ['~ Abrir Reconstrução com a página selecionada'], ops: [{ t: 'tab', tab: 'reconstruct', select: pg?.id ?? 'pg:exec:regional' }], status: 'pending' } });
  }

  /* análises */
  if (has(t, 'duplic', 'iguais', 'equival', 'similar', 'parecid')) {
    const dup = INSIGHTS.find((i) => i.id === 'in_dup')!, pgs = INSIGHTS.find((i) => i.id === 'in_pages')!;
    const onPages = has(t, 'págin', 'pagin', 'iguais');
    const x = onPages ? pgs : dup;
    return ai(onPages ? `${pgs.count} páginas em Regional Sales têm o mesmo propósito: ${pgs.evidence[0]?.toLowerCase()}` : `${dup.count} medidas são duplicadas e ${INSIGHTS.find((i) => i.id === 'in_equiv')!.count} parecem equivalentes.`, { kicker: 'Descobertas', list: x.affected.map((a) => a.label), focus: [x.affected[0]!.id], proposal: { title: x.actionLabel, summary: x.action, changes: x.affected.map((a) => `~ ${a.label}`), ops: [{ t: 'insight', id: x.id }], status: 'pending' } });
  }
  if (has(t, 'não utiliz', 'nao utiliz', 'unused', 'sem acesso', 'não são utiliz')) {
    const un = REPORTS.filter((r) => r.views90 === 0);
    return ai(`${un.length} relatórios não tiveram acesso nos últimos 90 dias: ${un.map((r) => r.name).join(', ')}. Executive Weekly ainda é enviado por assinatura, então vale manter.`, { kicker: 'Uso', list: un.map((r) => `${r.name} · ${r.owner}`), focus: [`rep:${un[0]!.id}`] });
  }
  if (has(t, 'depend', 'impacto', 'afeta')) {
    if (!it) return ai('Selecione uma medida, tabela ou visual para ver o que depende dela.');
    const im = impactOf(it.id);
    return ai(`${it.name} alimenta ${im.visuals.length} visuais em ${im.reports.length} relatórios${im.procs.length ? ` e ${im.procs.length} processo(s)` : ''}.`, { kicker: ctx, list: im.reports.slice(0, 6).map((r) => `${r.name} · ${im.visuals.filter((v) => v.path.includes(r.name)).length} visuais`), focus: [it.id] });
  }
  if (has(t, 'de onde', 'origem', 'fonte', 'source', 'vem')) {
    if (!it) return ai('Escolha um KPI ou visual no inventário e eu mostro o caminho até a fonte.');
    const l = lineage(it);
    return ai(`${it.name}${l.tb.length ? ` lê ${l.tb.map((x) => x.name).slice(0, 3).join(', ')}` : ''}${l.ds.length ? ` no modelo ${l.ds.map((x) => x.name).join(', ')}` : ''}${l.src.length ? `, que vem de ${l.src.map((x) => x.name).join(', ')}` : ''}.`, { kicker: ctx, list: [...l.src, ...l.ds, ...l.tb].slice(0, 5).map((x) => `${KIND_LABEL[x.kind]} · ${x.name}`), focus: [it.id] });
  }
  if (has(t, 'reconstru', 'traduz', 'converter', 'cálculo', 'calculo')) {
    const m = it?.kind === 'measure' ? MEASURES.find((x) => `ms:${x.id}` === it.id) : undefined, tr = m ? translationOf(m.id) : undefined;
    if (!tr) return ai('Selecione uma medida para eu avaliar se o cálculo pode ser reconstruído na camada semântica.');
    return ai(tr.status === 'ready' ? `Sim. ${tr.original.length > 60 ? 'A expressão' : tr.original} vira ${tr.biweb} (${tr.aggregation}), confiança ${tr.confidence}%.` : `Parcialmente. ${tr.notes ?? 'Há pontos sem equivalente direto.'} Confiança ${tr.confidence}%: recomendo revisar antes de aplicar.`, { kicker: ctx, list: tr.evidence, focus: [it!.id], proposal: tr.status === 'ready' ? undefined : { title: 'Enviar para revisão com recomendação', summary: 'A medida fica na fila com a recomendação do Copilot.', changes: ['~ Medida marcada para revisão humana'], ops: [{ t: 'tab', tab: 'semantics', select: it!.id }], status: 'pending' } });
  }
  if (has(t, 'por que', 'porque', 'redesenh', 'equivalente')) {
    if (it?.kind === 'visual') return ai(`${it.name} é ${it.type}. ${it.reason ?? `No BIWEB vira ${it.target}, ${compatLabel(it.compat).toLowerCase()}.`} Destino sugerido: ${it.target}.`, { kicker: ctx, focus: [it.id], list: [`Compatibilidade: ${compatLabel(it.compat)}`, `Alvo: ${it.target}`, `Confiança: ${it.confidence ?? 90}%`] });
  }
  if (has(t, 'explique', 'explicar', 'explain', 'o que faz', 'resumo')) {
    if (it?.kind === 'report') {
      const rep = REPORTS.find((r) => `rep:${r.id}` === it.id)!, vis = VISUALS.filter((v) => v.page.startsWith(`pg:${rep.id}:`));
      return ai(`${rep.name} responde “como está o desempenho?” com ${rep.pages.length} páginas e ${vis.length} visuais. Métricas principais: ${rep.topic.join(', ')}. ${vis.filter((v) => v.compat !== 'native').length} visuais precisam de atenção na migração.`, { kicker: ctx, list: rep.pages.map(([n, c]) => `${n} · ${c} visuais`), focus: [it.id] });
    }
    if (it?.kind === 'measure') { const m = MEASURES.find((x) => `ms:${x.id}` === it.id)!, tr = translationOf(m.id)!; return ai(`${tr.concept}. Agregação ${tr.aggregation}. Entradas: ${tr.inputs.join(', ')}.`, { kicker: ctx, list: tr.evidence, focus: [it.id] }); }
    if (it) return ai(`${it.name}: ${it.reason ?? it.type ?? KIND_LABEL[it.kind]}. Compatibilidade ${compatLabel(it.compat).toLowerCase()}, destino ${it.target}.`, { kicker: ctx, focus: [it.id] });
  }
  if (has(t, 'check', 'verific')) { const bad = CHECKS.filter((c) => c.status === 'failed'); return ai(`${bad.length} comparações falharam: ${bad.map((b) => b.label).join('; ')}.`, { kicker: 'Validação', list: bad.map((b) => b.note ?? b.label) }); }

  return ai(`Entendi “${raw.trim()}”. Com ${it ? it.name : 'o projeto'} selecionado, posso explicar, rastrear origem e dependências, traduzir cálculos, propor estratégia ou reconstruir em um Builder. Tente uma das sugestões.`, { kicker: ctx, list: SUGGESTED(it) });
}
