import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Avatar, Badge, Button, Icon, Skeleton } from '@biweb/ui';
import { Sparkline } from '../charts/charts';
import { aggregate, fmt } from '../data/query';
import { getTable, network, useData } from '../data/registry';
import { NOW } from '../net/generate';
import { asset, useUi } from '../state/ui-store';
import { ReportCard } from './reports-shared';
import { useGallery } from './gallery';
import { ago } from '../editor/ReportView';

const DS = 'ds_rede_sp';
function greeting() { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }
const ACTIVITY = [
  { who: 'Sistema', what: 'detectou rompimento de fibra em', target: 'Barueri', when: 'há 2 h', reportId: 'net_incidentes' },
  { who: 'Paula Teixeira', what: 'certificou o dataset', target: 'Rede Metropolitana SP', when: 'há 40 min' },
  { who: 'Rafael Lima', what: 'publicou a versão 12 de', target: 'Operações de Rede', when: 'há 40 min', reportId: 'net_operacoes' },
  { who: 'Marina Costa', what: 'criou a regra', target: 'Atenuação acima do limite', when: 'ontem', reportId: 'net_geografica' },
];

/** Início do workspace Operações de Rede: o que está acontecendo na rede agora e onde agir. */
export function NetHome() {
  const navigate = useNavigate();
  const { aiEnabled, askCopilot } = useUi();
  const items = useGallery();
  const datasets = useData((s) => s.datasets);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 300); return () => clearTimeout(t); }, []);
  const net = network();
  const k = useMemo(() => {
    const ls = getTable(DS, 'enlaces').rows, hist = getTable(DS, 'historico').rows;
    const day = (m: string) => aggregate(hist, { ds: DS, table: 'historico', groupBy: 'dia', measure: m, agg: 'avg' }).map((s) => s.value);
    const evByDay = Array.from({ length: 30 }, (_, i) => net.events.filter((e) => Math.floor((NOW - e.ts) / 86_400_000) === 29 - i).length);
    return [
      { id: 'disp', label: 'Disponibilidade', value: fmt(aggregate(ls, { ds: DS, table: 'enlaces', measure: 'disponibilidade', agg: 'avg' })[0]!.value, 'pct'), note: 'meta ≥ 99,90%', ok: false, spark: day('disponibilidade'), to: 'net_executiva' },
      { id: 'crit', label: 'Enlaces críticos', value: String(ls.filter((l) => l.status === 'critical' || l.status === 'offline').length), note: `de ${ls.length} enlaces`, ok: false, spark: undefined, to: 'net_operacoes' },
      { id: 'evt', label: 'Ocorrências ativas', value: String(net.events.filter((e) => !e.resolvido).length), note: `${net.events.length} em 30 dias`, ok: false, spark: evByDay, to: 'net_campo' },
      { id: 'util', label: 'Utilização', value: fmt(aggregate(ls, { ds: DS, table: 'enlaces', measure: 'utilizacao', agg: 'avg' })[0]!.value, 'pct'), note: `${ls.filter((l) => Number(l.utilizacao) > 80).length} enlaces acima de 80%`, ok: true, spark: day('utilizacao'), to: 'net_capacidade' },
    ];
  }, [net]);
  const active = net.events.filter((e) => !e.resolvido);
  const recent = [...items].sort((a, b) => a.updatedOrder - b.updatedOrder).slice(0, 4);
  const d = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <div className="pg home">
      <section className="home-hero">
        <div className="home-hero-text">
          <span className="home-date">{d.charAt(0).toUpperCase() + d.slice(1)}</span>
          <h1 className="pg-display">{greeting()}, Marina</h1>
          <p className="pg-sub">Rede Metropolitana SP · {net.nodes.length} nós · {net.links.length} enlaces · <Link to="/reports/$reportId" params={{ reportId: 'net_incidentes' }} className="home-alert"><Icon name="warning" size={12} />{active.length} ocorrências ativas</Link></p>
        </div>
        <div className="home-hero-actions">
          <Button icon="upload" onPress={() => navigate({ to: '/connections' })}>Importar dados</Button>
          <Button icon="report" onPress={() => navigate({ to: '/reports' })}>Ver relatórios</Button>
          <Button variant="primary" icon="plus" onPress={() => navigate({ to: '/reports/$reportId/edit', params: { reportId: 'novo' } })}>Novo relatório</Button>
        </div>
        <img className="home-hero-mark" src={asset('brand/mark.webp')} alt="" aria-hidden="true" />
      </section>

      <section aria-labelledby="pulso" className="home-sec">
        <div className="sec-head"><h2 id="pulso" className="sec-title">Pulso da rede</h2><Link to="/reports/$reportId" params={{ reportId: 'net_executiva' }} className="sec-link">Visão Executiva da Rede · agora <Icon name="arrowRight" size={12} /></Link></div>
        <div className="home-kpis bw-stagger">
          {k.map((x, i) => (
            <Link key={x.id} to="/reports/$reportId" params={{ reportId: x.to }} className="home-kpi bw-lift" style={{ ['--i' as string]: i }}>
              <span className="bw-kpi-label">{x.label}</span>
              {loading ? <Skeleton width={110} height={28} /> : <span className="home-kpi-value">{x.value}</span>}
              <span className="bw-cap bw-muted">{x.note}</span>
              {x.spark && <span className="home-kpi-spark"><Sparkline values={x.spark} tone={x.id === 'evt' ? 'viz-cat-6' : 'viz-cat-1'} /></span>}
            </Link>
          ))}
        </div>
      </section>

      <div className="home-cols">
        <div className="home-main">
          <section aria-labelledby="agora" className="home-sec">
            <div className="sec-head"><h2 id="agora" className="sec-title">Agora na rede</h2><Link to="/reports/$reportId" params={{ reportId: 'net_geografica' }} className="sec-link">Abrir mapa operacional <Icon name="arrowRight" size={12} /></Link></div>
            <ul className="home-now bw-stagger">
              {active.map((e, i) => (
                <li key={e.id} style={{ ['--i' as string]: i }}>
                  <i className={`vz-dot vz-dot--${e.severidade}`} style={{ width: 10, height: 10 }} aria-hidden="true" />
                  <div><b>{e.tipo}</b> · {e.regiao}<small>{e.elementoNome} · {e.descricao}</small></div>
                  <span className="bw-cap bw-muted">{ago(e.ts)}</span>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="recentes" className="home-sec">
            <div className="sec-head"><h2 id="recentes" className="sec-title">Continue de onde parou</h2><Link to="/reports" className="sec-link">Todos os relatórios <Icon name="arrowRight" size={12} /></Link></div>
            <div className="home-recent bw-stagger">{recent.map((r, i) => <ReportCard key={r.id} r={r} i={i} compact />)}</div>
          </section>
        </div>
        <aside className="home-side">
          {aiEnabled && (
            <section className="home-card home-copilot" aria-labelledby="cp-title">
              <div className="home-copilot-head"><img src={asset('brand/mark.webp')} alt="" width={22} height={21} /><h2 id="cp-title" className="sec-title">Pergunte ao Copilot</h2></div>
              <p className="bw-secondary">Respostas calculadas sobre a Rede Metropolitana SP.</p>
              <div className="home-copilot-list">
                {['Quais enlaces estão críticos?', 'Onde estão os rompimentos ativos?', 'Quais regiões estão perto do limite de capacidade?'].map((q) => <button key={q} type="button" onClick={() => askCopilot(q)}><Icon name="copilot" size={12} />{q}</button>)}
              </div>
            </section>
          )}
          <section className="home-card" aria-labelledby="atividade">
            <h2 id="atividade" className="sec-title">Atividade recente</h2>
            <ol className="home-feed">
              {ACTIVITY.map((a, i) => (
                <li key={i} className="bw-fade-in" style={{ animationDelay: `${120 + i * 50}ms` }}>
                  {a.who === 'Sistema' ? <span className="home-feed-sys"><Icon name="warning" size={12} /></span> : <Avatar name={a.who} size={24} />}
                  <span><b>{a.who}</b> {a.what} {a.reportId ? <Link to="/reports/$reportId" params={{ reportId: a.reportId }} className="bw-link"><b>{a.target}</b></Link> : <b>{a.target}</b>}<small>{a.when}</small></span>
                </li>
              ))}
            </ol>
          </section>
          <section className="home-card" aria-labelledby="saude">
            <div className="sec-head"><h2 id="saude" className="sec-title">Saúde dos dados</h2><Link to="/connections" className="sec-link">Dados <Icon name="arrowRight" size={12} /></Link></div>
            <ul className="home-health">
              <li><span className="home-dot home-dot--ok" aria-hidden="true" /><span className="bw-mono">netops-db</span><span className="flex-1" /><span className="bw-cap bw-muted">há 14 min</span></li>
              <li><span className="home-dot home-dot--ok" aria-hidden="true" /><span className="bw-mono">api-alarmes-noc</span><span className="flex-1" /><span className="bw-cap bw-muted">tempo real</span></li>
              <li><span className="home-dot home-dot--bad" aria-hidden="true" /><span className="bw-mono">metas_capacidade.xlsx</span><span className="flex-1" /><Badge tone="warning" icon="warning">Desatualizada</Badge></li>
              {datasets.filter((x) => x.imported).map((x) => <li key={x.id}><span className="home-dot home-dot--ok" aria-hidden="true" /><span className="bw-mono">{x.source.label}</span><span className="flex-1" /><span className="bw-cap bw-muted">importado</span></li>)}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
