import { useState } from 'react';
import { Badge, Button, Icon, PropertySection } from '@biweb/ui';
import { RELS, colLabel } from './registry';
import { allAssets, allChangeSets, useDw } from './store';
import { ENRICHMENTS, MAPPINGS, QUALITY, RUNS, LNODES, MODEL_GRAPHS, KPI_TRACE, ALTERNATIVES } from './ops';
import { profileOf } from './sample';
import { ConfBadge, Empty, Kv, Pill, RiskBadge, pct, useGo } from './ui';

const HINT: Record<string, string> = {
  overview: 'Selecione um item de atenção ou uma fonte para ver detalhes.', sources: 'Abra uma fonte para ver sua saúde, ativos e execuções.', catalog: 'Selecione uma coluna para ver tipo físico, semântica, classificação e evidências.',
  model: 'Selecione uma entidade ou uma relação no canvas.', quality: 'Selecione um dataset ou um problema para ver a explicação.', published: 'Selecione um dataset para ver contrato e consumidores.', transformations: 'Selecione uma linha de mapeamento para ver a transformação.',
  lineage: 'Selecione um nó para rastrear de onde vem e para onde vai.', enrichment: 'Selecione uma proposta para ver cobertura e prévia.', changes: 'Selecione um ChangeSet.', runs: 'Selecione uma execução e depois uma etapa.',
};

export function Inspector({ section }: { section: string; itemId?: string }) {
  const st = useDw();
  const s = st.sel;
  if (!s) return <div className="dw-insp"><Empty icon="eye" title="Nada selecionado" text={HINT[section] ?? 'Selecione um objeto.'} /></div>;
  return (
    <div className="dw-insp">
      {s.kind === 'column' && <ColumnInsp assetId={s.id} col={s.extra ?? ''} />}
      {s.kind === 'asset' && <AssetInsp id={s.id} />}
      {s.kind === 'rel' && (s.id.startsWith('m:') ? <MEdgeInsp id={s.id.slice(2)} /> : <RelInsp id={s.id} />)}
      {s.kind === 'mapping' && <MappingInsp id={s.id} />}
      {s.kind === 'issue' && <IssueInsp id={s.id} />}
      {s.kind === 'lnode' && <LineageInsp id={s.id} />}
      {s.kind === 'enrich' && <EnrichInsp id={s.id} />}
      {s.kind === 'mnode' && <ModelNodeInsp id={s.id} mode={s.extra ?? 'physical'} />}
      {s.kind === 'stage' && <StageInsp id={s.id} extra={s.extra ?? ''} />}
      {s.kind === 'proposal' && <ProposalInsp />}
      {s.kind === 'docfield' && <p className="dw-pad dw-muted">Campo de documento selecionado.</p>}
    </div>
  );
}

function Head({ kind, title, sub }: { kind: string; title: string; sub?: string }) { return <div className="dw-insp-h"><small>{kind}</small><h3 className="bw-mono">{title}</h3>{sub && <p>{sub}</p>}</div>; }

function ColumnInsp({ assetId, col }: { assetId: string; col: string }) {
  const st = useDw(), go = useGo();
  const a = allAssets(st.extraAssets).find((x) => x.id === assetId);
  const ci = a?.cols.findIndex((c) => c.name === col) ?? -1;
  if (!a || ci < 0) return <Empty title="Coluna não encontrada" text="" />;
  const c = a.cols[ci]!;
  const p = profileOf(a.id, a.cols, ci);
  const hid = `sem:${a.id}.${c.name}`;
  const dec = st.decisions[hid];
  const showHyp = c.suggested && !dec;
  const knowledge = a.id === 'crm.customers' && c.name === 'customer_document';
  const used = c.concept ? { maps: 2, models: 1, reports: 4 } : { maps: 1, models: 1, reports: 2 };
  return (
    <>
      <Head kind={`Coluna · ${a.name}`} title={c.name} />
      {showHyp && (
        <div className="dw-hyp" role="group" aria-label="Hipótese de tipo semântico">
          <div className="dw-hyp-h"><Icon name="copilot" size={12} /><b>Tipo semântico sugerido</b><ConfBadge v={c.conf} /></div>
          <p className="dw-hyp-v">{c.sem}{c.concept && <small> · {c.concept}</small>}</p>
          <ul className="dw-evid"><li>✓ Similaridade de nome</li><li>✓ Padrão de formato ({p.patterns[0]?.p ?? 'regular'})</li>{c.gen === 'cpf' && <li>✓ Dígito verificador válido</li>}<li>✓ Decisão anterior aceita em outra fonte</li></ul>
          <div className="dw-hyp-a"><Button size="sm" variant="primary" icon="check" onPress={() => { st.decide(hid, 'accepted'); st.toast(`Hipótese aceita: ${c.name} → ${c.sem}`); }}>Aceitar</Button><Button size="sm" onPress={() => st.toast('Edição de tipo semântico disponível no painel Avançado')}>Editar</Button><Button size="sm" variant="ghost" onPress={() => { st.decide(hid, 'rejected'); }}>Rejeitar</Button></div>
        </div>
      )}
      {dec === 'accepted' && <p className="dw-note is-ok"><Icon name="check" size={12} />Hipótese aceita. A decisão fica registrada e será reutilizada em fontes futuras. <button type="button" className="bw-link" onClick={() => st.decide(hid, null)}>Desfazer</button></p>}
      {dec === 'rejected' && <p className="dw-note"><Icon name="info" size={12} />Hipótese rejeitada. <button type="button" className="bw-link" onClick={() => st.decide(hid, null)}>Desfazer</button></p>}
      {knowledge && (
        <div className="dw-know" role="group" aria-label="Conhecimento acumulado">
          <div className="dw-know-h"><Icon name="book" size={12} /><b>Conceito existente encontrado</b></div>
          <p className="dw-know-c">Customer.CPF</p>
          <small className="dw-k">Já observado em</small><ul><li className="bw-mono">ERP.CLIENTES.CPF</li><li className="bw-mono">Legacy.Clientes.CPF</li></ul>
          <Kv k="Similaridade" v="97%" /><p className="dw-muted">Reutilizar o conceito?</p>
          <div className="dw-hyp-a"><Button size="sm" variant="primary" onPress={() => { st.decide(hid, 'accepted'); st.toast('Conceito Customer.CPF reutilizado'); }}>Aceitar</Button><Button size="sm" onPress={() => st.setPane({ rightOpen: true, rTab: 'review' })}>Revisar</Button></div>
        </div>
      )}
      <PropertySection label="Tipos">
        <div className="dw-ptype"><div><small className="dw-k">Tipo físico</small><b className="bw-mono">{c.phys}</b></div><div><small className="dw-k">Tipo semântico</small><b>{c.sem}</b></div><div><small className="dw-k">Conceito de negócio</small><b>{c.concept ?? '—'}</b></div></div>
        <div className="dw-via"><small className="dw-k">Detectado por</small>{(['Regra', 'Estatística', 'Conhecimento', 'Assistido por IA', 'Decisão humana'] as const).map((v) => <Pill key={v} tone={(dec === 'accepted' ? 'Decisão humana' : c.via) === v ? 'sem' : undefined}>{v}</Pill>)}</div>
      </PropertySection>
      <PropertySection label="Classificação">
        <Kv k="Classe" v={c.pii ? <Pill tone="pii">{c.klass}</Pill> : c.klass} /><Kv k="Dados pessoais" v={c.pii ? 'Sim (PII)' : 'Não'} />
      </PropertySection>
      <PropertySection label="Qualidade e perfil">
        <Kv k="Nulos" v={pct(p.nullPct)} /><Kv k="Únicos" v={pct(p.distinctPct)} />{p.patterns.slice(0, 3).map((x) => <Kv key={x.p} k={x.p} v={pct(x.pct)} mono />)}
      </PropertySection>
      <PropertySection label="Usado por"><Kv k="Mapeamentos" v={used.maps} /><Kv k="Modelos" v={used.models} /><Kv k="Relatórios" v={used.reports} /></PropertySection>
      <div className="dw-insp-a"><Button size="sm" icon="timeline" onPress={() => st.showOrigin('db', `${a.name}.${c.name}`)}>Ver origem</Button><Button size="sm" icon="share" onPress={() => go('/data/lineage')}>Ver linhagem</Button></div>
    </>
  );
}

function AssetInsp({ id }: { id: string }) {
  const st = useDw();
  const a = allAssets(st.extraAssets).find((x) => x.id === id);
  if (!a) return null;
  return <><Head kind="Ativo" title={a.name} sub={`${a.schema}`} /><PropertySection label="Resumo"><Kv k="Linhas" v={a.rows.toLocaleString('pt-BR')} /><Kv k="Colunas" v={a.declaredCols ?? a.cols.length} /><Kv k="Qualidade" v={pct(a.quality)} /><Kv k="Atualizado" v={a.updated} /></PropertySection></>;
}

function RelInsp({ id }: { id: string }) {
  const st = useDw(), go = useGo();
  const r = RELS.find((x) => x.id === id);
  const [editing, setEditing] = useState(false);
  const [card, setCard] = useState(r?.card ?? 'N:1');
  if (!r) return null;
  const d = st.decisions[r.id];
  return (
    <>
      <Head kind={`Relacionamento · ${r.kind === 'declared' ? 'declarado' : r.kind === 'inferred' ? 'inferido' : 'sugerido'}`} title={colLabel(r.from)} sub={`→ ${colLabel(r.to)}`} />
      <PropertySection label="Resumo"><Kv k="Cardinalidade" v={editing ? <select value={card} onChange={(e) => setCard(e.target.value as typeof card)}>{['N:1', '1:1', '1:N', 'N:N'].map((x) => <option key={x}>{x}</option>)}</select> : card} /><Kv k="Confiança" v={<ConfBadge v={r.conf} />} />{r.cross && <Kv k="Escopo" v="Entre fontes" />}</PropertySection>
      <PropertySection label="Evidências"><ul className="dw-evid">{r.evidence.map((e) => <li key={e}>✓ {e}</li>)}</ul>{r.overlap !== undefined && <Kv k="Sobreposição de valores" v={pct(r.overlap)} />}</PropertySection>
      {r.kind !== 'declared' && !d && <div className="dw-hyp-a dw-pad"><Button size="sm" variant="primary" icon="check" onPress={() => { st.decide(r.id, 'accepted'); st.toast('Relacionamento aceito'); }}>Aceitar</Button><Button size="sm" onPress={() => setEditing(!editing)}>{editing ? 'Concluir edição' : 'Editar'}</Button><Button size="sm" variant="ghost" onPress={() => st.decide(r.id, 'rejected')}>Rejeitar</Button></div>}
      {d && <p className="dw-note is-ok dw-pad"><Icon name="check" size={12} />{d === 'accepted' ? 'Relacionamento aceito e adicionado ao modelo.' : 'Relacionamento rejeitado.'} <button type="button" className="bw-link" onClick={() => st.decide(r.id, null)}>Desfazer</button></p>}
      <div className="dw-insp-a"><Button size="sm" onPress={() => go('/data/model')}>Abrir no modelo</Button></div>
    </>
  );
}

function MEdgeInsp({ id }: { id: string }) {
  const e = Object.values(MODEL_GRAPHS).flatMap((g) => g.edges.map((x) => ({ x, g }))).find((y) => y.x.id === id);
  if (!e) return null;
  const t = (n: string) => e.g.nodes.find((z) => z.id === n)?.title ?? n;
  return (
    <>
      <Head kind="Relacionamento do modelo" title={`${t(e.x.from)} → ${t(e.x.to)}`} sub={e.x.label} />
      <PropertySection label="Resumo"><Kv k="Cardinalidade" v={e.x.card} /><Kv k="Origem" v={e.x.kind === 'declared' ? 'Declarado' : e.x.kind === 'inferred' ? 'Inferido' : 'Sugerido'} />{e.x.conf !== undefined && <Kv k="Confiança" v={<ConfBadge v={e.x.conf} />} />}</PropertySection>
      {e.x.ev && <PropertySection label="Evidências"><ul className="dw-evid">{e.x.ev.map((v) => <li key={v}>✓ {v}</li>)}</ul></PropertySection>}
    </>
  );
}

function MappingInsp({ id }: { id: string }) {
  const st = useDw();
  const r = MAPPINGS.flatMap((m) => m.rows).find((x) => x.id === id);
  if (!r) return null;
  const applied = st.mapApplied[r.id];
  return (
    <>
      <Head kind="Mapeamento" title={`${r.src} → ${r.tgt}`} />
      <PropertySection label="Definição"><Kv k="Origem" v={r.src} mono /><Kv k="Destino" v={r.tgt} mono /><Kv k="Transformação" v={r.tr} /><Kv k="Estratégia de chave" v={r.strategy} /><Kv k="Deduplicação" v={r.dedup} /><Kv k="Modo de carga" v={r.load} /><Kv k="Confiança" v={<ConfBadge v={r.conf} />} /><Kv k="Versão" v={applied ? 'v15 (rascunho)' : r.ver} /></PropertySection>
      <PropertySection label="Exemplo"><div className="dw-ba"><span className="bw-mono">{r.sample[0]}</span><Icon name="arrowRight" size={12} /><span className="bw-mono">{r.sample[1]}</span></div>{r.fail > 0 && <p className="dw-warn">{r.fail.toLocaleString('pt-BR')} falhas na última execução</p>}</PropertySection>
      <div className="dw-insp-a"><Button size="sm" onPress={() => st.toast('Editor de transformação disponível no painel Avançado')}>Editar</Button><Button size="sm" onPress={() => dispatchEvent(new CustomEvent('biweb:dw-dryrun', { detail: r.id }))}>Prévia</Button><Button size="sm" variant="primary" onPress={() => dispatchEvent(new CustomEvent('biweb:dw-dryrun', { detail: r.id }))}>Testar</Button></div>
    </>
  );
}

function IssueInsp({ id }: { id: string }) {
  const st = useDw(), go = useGo();
  const q = QUALITY.flatMap((d) => d.issues.map((i) => ({ i, d }))).find((x) => x.i.id === id);
  if (!q) return null;
  return (
    <>
      <Head kind="Problema de qualidade" title={q.i.title} sub={`${q.d.name} · coluna ${q.i.col}`} />
      <PropertySection label="Resumo"><Kv k="Ocorrências" v={q.i.count.toLocaleString('pt-BR')} /><Kv k="Severidade" v={<RiskBadge r={q.i.sev === 'high' ? 'Alto' : q.i.sev === 'medium' ? 'Médio' : 'Baixo'} />} /><Kv k="Gate" v="G2 · Transformação" /></PropertySection>
      <PropertySection label="Por que aconteceu"><p className="dw-pad dw-p">{q.i.id === 'qi1' ? 'O CPF chega com máscara em 94% das linhas e sem máscara em 5%. 842 valores têm menos de 11 dígitos ou dígito verificador inválido; 811 deles voltam a ser válidos com normalizeCpf().' : 'O valor de origem não casa com a regra aplicada no gate. Veja a prévia das linhas na quarentena.'}</p></PropertySection>
      <div className="dw-insp-a"><Button size="sm" icon="copilot" isDisabled={st.ai.mode === 'off'} onPress={() => { st.setPane({ rightOpen: true, rTab: 'copilot' }); import('./copilot').then((m) => st.pushChat([{ id: `u${Date.now()}`, role: 'user', text: 'Explique este problema' }, m.reply('explique problema', { section: 'quality', itemId: q.d.id, issue: q.i.id })])); }}>Explicar com o Copilot</Button><Button size="sm" onPress={() => go('/data/quality/orders')}>Abrir quarentena</Button></div>
    </>
  );
}

function LineageInsp({ id }: { id: string }) {
  const st = useDw(), go = useGo();
  const n = LNODES.find((x) => x.id === id);
  if (!n) return null;
  const typ: Record<string, string> = { source: 'Fonte', raw: 'Zona RAW', transform: 'Transformação', dataset: 'Dataset', model: 'Modelo semântico', report: 'Relatório', map: 'Mapa', workflow: 'Fluxo', kpi: 'KPI' };
  const open = n.kind === 'report' || n.kind === 'kpi' ? '/reports/net_executiva' : n.kind === 'map' ? '/maps/field' : n.kind === 'workflow' ? '/workflows/legado' : n.kind === 'dataset' ? '/data/published/orders' : n.kind === 'source' ? '/data/sources/erp' : '';
  return (
    <>
      <Head kind={`Linhagem · ${typ[n.kind]}`} title={n.label} sub={n.sub} />
      <PropertySection label="Propriedades"><Kv k="Tipo" v={typ[n.kind]} /><Kv k="Origem" v={n.sub} /><Kv k="Versão" v={n.ver} mono /><Kv k="Atualizado" v={n.updated} /><Kv k="Responsável" v={n.owner} /><Kv k="Qualidade" v={pct(n.quality)} /><Kv k="Consumidores" v={n.consumers} /></PropertySection>
      {n.kind === 'kpi' && <PropertySection label="Rastro em nível de coluna" defaultOpen={false}><ol className="dw-trace">{KPI_TRACE.map((t, i) => <li key={t.t}><b>{t.t}</b><small>{t.d}</small>{i < KPI_TRACE.length - 1 && <Icon name="chevronDown" size={12} />}</li>)}</ol></PropertySection>}
      <div className="dw-insp-a">{open && <Button size="sm" onPress={() => go(open)}>Abrir objeto</Button>}<Button size="sm" onPress={() => dispatchEvent(new CustomEvent('biweb:dw-trace', { detail: { id: n.id, dir: 'up' } }))}>Rastrear a montante</Button><Button size="sm" onPress={() => dispatchEvent(new CustomEvent('biweb:dw-trace', { detail: { id: n.id, dir: 'down' } }))}>Rastrear a jusante</Button>{n.kind === 'source' && <Button size="sm" icon="timeline" onPress={() => st.showOrigin('excel', n.label)}>Ver origem</Button>}</div>
    </>
  );
}

function EnrichInsp({ id }: { id: string }) {
  const st = useDw();
  const e = ENRICHMENTS.find((x) => x.id === id);
  if (!e) return null;
  const status = st.enrichStatus[e.id] ?? e.status;
  return (
    <>
      <Head kind={`Enriquecimento · ${e.type}`} title={e.title} />
      <PropertySection label="Detalhes"><Kv k="Entradas" v={e.inputs} /><Kv k="Saídas" v={e.outputs.join(', ')} /><Kv k="Cobertura" v={pct(e.coverage)} /><Kv k="Transferência externa" v={e.transfer} /><Kv k="Fonte" v={e.source} /></PropertySection>
      <PropertySection label="Prévia">{e.sample.map(([a, b]) => <div key={a} className="dw-ba"><span className="bw-mono">{a}</span><Icon name="arrowRight" size={12} /><span>{b}</span></div>)}</PropertySection>
      <div className="dw-insp-a">{status === 'applied' ? <Badge tone="success" icon="check">Aplicado</Badge> : <><Button size="sm" variant="primary" onPress={() => { st.setEnrich(e.id, 'applied'); st.toast(`Enriquecimento aplicado: ${e.title}`); }}>Aplicar</Button><Button size="sm" variant="ghost" onPress={() => st.setEnrich(e.id, 'rejected')}>Rejeitar</Button></>}</div>
    </>
  );
}

function ModelNodeInsp({ id, mode }: { id: string; mode: string }) {
  const g = MODEL_GRAPHS[mode];
  const n = g?.nodes.find((x) => x.id === id);
  const go = useGo();
  if (!n) return null;
  return (
    <>
      <Head kind={`Entidade · ${n.sub ?? ''}`} title={n.title} />
      <PropertySection label={`Campos (${n.cols.length})`}><ul className="dw-bul">{n.cols.map((c) => <li key={c.n}><span className="bw-mono">{c.n}</span><span>{c.flag && <Pill tone="key">{c.flag}</Pill>} <small className="dw-muted">{c.t}</small></span></li>)}</ul></PropertySection>
      {n.metrics && <PropertySection label="Métricas"><ul className="dw-bul">{n.metrics.map((m) => <li key={m}>{m}</li>)}</ul></PropertySection>}
      <div className="dw-insp-a"><Button size="sm" onPress={() => go('/data/lineage')}>Ver linhagem</Button><Button size="sm" onPress={() => go('/data/transformations')}>Ver mapeamentos</Button></div>
    </>
  );
}

function StageInsp({ id, extra }: { id: string; extra: string }) {
  const r = RUNS.find((x) => String(x.id) === extra);
  const s = r?.stages.find((x) => x.id === id);
  if (!s || !r) return null;
  return <><Head kind={`Etapa · run #${r.id}`} title={s.name} /><PropertySection label="Métricas"><Kv k="Duração" v={s.dur} /><Kv k="Linhas" v={s.rows.toLocaleString('pt-BR')} /><Kv k="Bytes" v={s.bytes} /><Kv k="Avisos" v={s.warn} />{s.note && <Kv k="Nota" v={s.note} />}</PropertySection></>;
}

function ProposalInsp() {
  const go = useGo();
  const cs = allChangeSets([]).find((c) => c.id === 'CS-184');
  return (
    <>
      <Head kind="Proposta de modelo" title="Normalizar sales_raw" sub="53 colunas → 5 entidades" />
      <PropertySection label="Benefícios"><ul className="dw-evid"><li>✓ Menos dados de cliente duplicados</li><li>✓ Entidade Customer reutilizável</li><li>✓ Melhor integridade relacional</li></ul></PropertySection>
      <PropertySection label="Trade-offs"><ul className="dw-evid is-warn"><li>• 4 junções adicionais nas consultas</li><li>• Relatórios que leem sales_raw precisam ser religados</li></ul></PropertySection>
      <PropertySection label="Impacto"><Kv k="Mapeamentos" v={2} /><Kv k="Publicações" v={1} /><Kv k="Risco" v={<RiskBadge r={cs?.risk ?? 'Compatível'} />} /></PropertySection>
      <PropertySection label="Alternativas" defaultOpen={false}>{ALTERNATIVES.map((a) => <div key={a.id} className="dw-alt"><b>{a.name}{a.rec && <Badge tone="accent">Recomendado</Badge>}</b><small>{a.best}</small><small>Complexidade: {a.complexity} · Redundância: {a.redundancy}</small></div>)}<p className="dw-muted">Estimativas qualitativas; não há medição de custo real neste protótipo.</p></PropertySection>
      <div className="dw-insp-a"><Button variant="primary" size="sm" onPress={() => go('/data/changes/CS-184')}>Revisar ChangeSet</Button></div>
    </>
  );
}
