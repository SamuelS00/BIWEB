import { useState } from 'react';
import { Badge, Button, Icon } from '@biweb/ui';
import { INSIGHTS, LDE, SUMMARY_DIALECT } from '../analysis';
import { overallMix } from '../data';
import { platformOf } from '../model';
import { useMig } from '../store';
import { pendingReview, readiness, strategyCounts } from '../derive';
import type { TabId } from '../model';
import { Evidence, MixBar, MixLegend, Pipeline, Section, StrategyChip, nf } from '../ui';

const LABEL = { native: 'Nativo', equivalent: 'Equivalente', redesign: 'Redesenhar', review: 'Revisão' } as const;

/** Command Center: onde o projeto está, o que foi encontrado e o que falta decidir. */
export function Overview({ onGo }: { onGo: (t: TabId, sel?: string) => void }) {
  const st = useMig(), ps = st.cur(), project = st.projects.find((p) => p.id === st.pid)!;
  const pl = platformOf(project.platform), full = project.detail === 'full', s = project.scope;
  const mix = full ? overallMix() : { ...project.mix, total: 0 };
  const sc = strategyCounts(ps, project), rd = readiness(ps), pend = pendingReview(ps);
  const [ins, setIns] = useState(INSIGHTS[0]!.id);
  const cur = INSIGHTS.find((i) => i.id === ins)!, decided = ps.insights[cur.id];
  const dialect = SUMMARY_DIALECT[project.platform]!;
  const next = [
    full && pend.length > 0 && { t: 'validation' as TabId, label: `Decidir ${pend.length} itens na fila de revisão`, sub: 'Menor confiança primeiro', tone: 'warning' as const },
    full && rd.failed > 0 && { t: 'validation' as TabId, label: `${rd.failed} comparações falharam na validação`, sub: 'Churn Rate e Sankey XYZ', tone: 'danger' as const },
    full && { t: 'reconstruct' as TabId, label: 'Reconstruir mapas e fluxos pendentes', sub: '2 mapas e 1 fluxo ainda não foram reconstruídos', tone: 'accent' as const },
    full && project.bridge && { t: 'bridge' as TabId, label: '3 mudanças detectadas na origem', sub: 'Bridge Mode · Power BI', tone: 'accent' as const },
    !full && { t: 'inventory' as TabId, label: 'Revisar o inventário e o escopo', sub: 'Exclua o que não precisa migrar', tone: 'accent' as const },
    !full && { t: 'compat' as TabId, label: 'Avaliar compatibilidade por categoria', sub: `${project.mix.redesign + project.mix.review}% precisam de atenção`, tone: 'warning' as const },
  ].filter(Boolean) as { t: TabId; label: string; sub: string; tone: 'warning' | 'danger' | 'accent' }[];
  return <div className="ms-overview">
    <div className="ms-card ms-card--flow"><Pipeline phase={project.phase} onGo={(t) => onGo(t)} />
      <p className="ms-flow-note"><Icon name="info" size={12} /> Não estamos importando uma imagem do relatório. Estamos entendendo e reconstruindo uma aplicação analítica: dados, métricas, páginas, gráficos e interações.</p></div>

    <div className="ms-ov-grid">
      <Section title="Origem" hint={pl.name}>
        <dl className="ms-kv"><div><dt>Plataforma</dt><dd>{pl.name}</dd></div><div><dt>{pl.orgLabel}</dt><dd>{pl.org}</dd></div><div><dt>{pl.wsLabel}</dt><dd>{project.workspace}</dd></div><div><dt>Conexão</dt><dd><i className="ms-live-dot" />Somente leitura{project.bridge ? ' · Bridge ativo' : ''}</dd></div></dl>
      </Section>
      <Section title="Escopo" actions={<Button size="sm" variant="ghost" onPress={() => onGo('inventory')}>Ver inventário</Button>}>
        <ul className="ms-scope-inline">{[[s.reports, pl.nouns.reports], [s.pages, 'páginas'], [s.visuals, 'visuais'], [s.measures, `${pl.nouns.measure}s`], [s.datasets, `${pl.nouns.dataset}s`], [s.maps, 'mapas'], [s.processes, 'processos']].map(([n, l]) => <li key={l as string}><b>{nf(n as number)}</b>{l}</li>)}</ul>
      </Section>
      <Section title="Migração" hint={full ? `${nf(mix.total)} objetos avaliados` : 'estimativa da análise'} actions={<Button size="sm" variant="ghost" onPress={() => onGo('compat')}>Compatibilidade</Button>}>
        <MixBar mix={mix} height={10} /><MixLegend mix={mix} />
        <div className="ms-strat-row"><span>Estratégia</span><StrategyChip s={project.strategy} />{full && <small>{sc.fidelity} em Fidelity · {sc.native} em Native · {sc.modernize} em Modernize</small>}</div>
      </Section>
      <Section title="Status" hint={`Última análise ${ps.analyzed} · v${ps.analysisV}`}>
        <div className="ms-status-big"><Badge tone={project.status === 'completed' ? 'success' : 'warning'}>{project.statusNote}</Badge><b>{project.progress}%</b><small>reconstruído</small></div>
        <ul className="ms-next">{next.length ? next.map((n) => <li key={n.label}><button type="button" onClick={() => onGo(n.t)}><i className={`is-${n.tone}`} /><span><b>{n.label}</b><small>{n.sub}</small></span><Icon name="chevronRight" size={12} /></button></li>) : <li className="ms-empty-line"><Icon name="check" size={12} />Nada pendente.</li>}</ul>
      </Section>
    </div>

    {full ? <div className="ms-ov-split">
      <Section title="Descobertas da análise" hint="Limpeza do legado" className="ms-discovery">
        <div className="ms-disc">
          <ul className="ms-disc-list" role="listbox" aria-label="Descobertas">{INSIGHTS.map((i) => <li key={i.id}><button type="button" role="option" aria-selected={ins === i.id} className={ps.insights[i.id] ? 'is-done' : ''} onClick={() => setIns(i.id)}><b className={`is-${i.tone}`}>{i.count}</b><span>{i.title}</span>{ps.insights[i.id] && <Icon name="check" size={12} />}</button></li>)}</ul>
          <div className="ms-disc-detail" key={cur.id}>
            <header><b className={`ms-disc-n is-${cur.tone}`}>{cur.count}</b><h4>{cur.title}</h4></header>
            <h5>Evidência</h5><Evidence items={cur.evidence} />
            <h5>Itens afetados</h5><div className="ms-chips">{cur.affected.slice(0, 8).map((a) => <button key={a.id} type="button" onClick={() => { if (a.id.startsWith('col:')) return; st.set({ sel: a.id }); onGo('inventory', a.id); }}>{a.label}</button>)}{cur.affected.length > 8 && <span>+ {cur.affected.length - 8}</span>}</div>
            <h5>Ação sugerida</h5><p>{cur.action}</p>
            <div className="ms-row-actions"><Button size="sm" variant={decided === 'applied' ? 'default' : 'primary'} icon={decided === 'applied' ? 'check' : undefined} onPress={() => st.decideInsight(cur.id, decided === 'applied' ? null : 'applied')}>{decided === 'applied' ? 'Aplicado' : cur.actionLabel}</Button><Button size="sm" variant="ghost" onPress={() => st.decideInsight(cur.id, decided === 'ignored' ? null : 'ignored')}>{decided === 'ignored' ? 'Ignorado' : 'Ignorar'}</Button><Button size="sm" variant="ghost" icon="copilot" onPress={() => st.ask(cur.id === 'in_dup' ? 'Existem medidas duplicadas?' : cur.id === 'in_pages' ? 'Quais páginas são praticamente iguais?' : cur.id === 'in_reports' ? 'Quais relatórios não são utilizados?' : 'Explique este item')}>Perguntar</Button></div>
          </div>
        </div>
      </Section>
      <Section title="Análise do LDE" hint="Logical Data Engine" actions={<Button size="sm" variant="ghost" onPress={() => onGo('data')}>Revisar proposta do LDE</Button>}>
        <ul className="ms-lde">{LDE.map((l) => <li key={l.label}><Icon name={l.ok ? 'check' : 'warning'} size={12} /><span><b>{l.label}</b><small>{l.detail}</small></span></li>)}</ul>
        <p className="ms-hint">O LDE entende o esquema e propõe o modelo no Data Workspace. O Migration Studio não duplica o editor de dados.</p>
      </Section>
    </div> : <Section title="Exemplo de tradução semântica" hint={dialect.name}>
      <div className="ms-trans-mini"><pre className="ms-code">{dialect.original}</pre><Icon name="arrowRight" size={12} /><div><b>{dialect.interp}</b><small>{dialect.biweb}</small></div></div>
      <p className="ms-hint">Este projeto está em análise resumida. A navegação completa por Blueprint, Semântica, Mapeamentos, Reconstrução e Bridge está no projeto Commercial & Operations Migration.</p></Section>}
  </div>;
}
void LABEL;
