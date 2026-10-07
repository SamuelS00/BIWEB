import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Avatar, Badge, Button, Icon, Skeleton } from '@biweb/ui';
import { Sparkline } from '../charts/charts';
import { activity, connections, coverUrl, kpis, reports, user } from '../fixtures/lume-varejo';
import { asset, useUi } from '../state/ui-store';
import { ReportCard } from './reports-shared';
import { NetHome } from './home-net';
import { useGallery } from './gallery';

function greeting() { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }

/** Início: o que mudou, onde parei, o que pedir ao Copilot e a saúde dos dados. */
export function HomePage() {
  const ws = useUi((s) => s.workspace);
  return ws === 'rede' ? <NetHome /> : <CommercialHome />;
}

function CommercialHome() {
  const navigate = useNavigate();
  const { aiEnabled, askCopilot, favorites } = useUi();
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 320); return () => clearTimeout(t); }, []);
  const gallery = useGallery();
  const recent = [...gallery].sort((a, b) => a.updatedOrder - b.updatedOrder).slice(0, 4);
  const favs = reports.filter((r) => favorites.includes(r.id));
  const failing = connections.filter((c) => !c.ok);
  const d = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const today = d.charAt(0).toUpperCase() + d.slice(1);

  return (
    <div className="pg home">
      <section className="home-hero">
        <div className="home-hero-text">
          <span className="home-date">{today}</span>
          <h1 className="pg-display">{greeting()}, {user.name.split(' ')[0]}</h1>
          <p className="pg-sub">
            {reports.filter((r) => r.updated.startsWith('hoje')).length} relatórios atualizados hoje
            {failing.length > 0 && <> · <Link to="/connections" className="home-alert"><Icon name="warning" size={12} />{failing.length} conexão com falha</Link></>}
          </p>
        </div>
        <div className="home-hero-actions">
          <Button icon="report" onPress={() => navigate({ to: '/reports' })}>Ver relatórios</Button>
          <Button variant="primary" icon="plus" onPress={() => navigate({ to: '/reports/$reportId/edit', params: { reportId: 'rpt_visao_executiva' } })}>Novo relatório</Button>
        </div>
        <img className="home-hero-mark" src={asset('brand/mark.webp')} alt="" aria-hidden="true" />
      </section>

      <section aria-labelledby="pulso" className="home-sec">
        <div className="sec-head"><h2 id="pulso" className="sec-title">Pulso do negócio</h2><Link to="/reports/$reportId" params={{ reportId: 'rpt_visao_executiva' }} className="sec-link">Visão Executiva de Vendas · jan–set/2026 <Icon name="arrowRight" size={12} /></Link></div>
        <div className="home-kpis bw-stagger">
          {kpis.map((k, i) => (
            <Link key={k.id} to="/reports/$reportId" params={{ reportId: 'rpt_visao_executiva' }} className="home-kpi bw-lift" style={{ ['--i' as string]: i }}>
              <span className="bw-kpi-label">{k.label}</span>
              {loading ? <Skeleton width={110} height={28} /> : <span className="home-kpi-value">{k.value}</span>}
              <span className={`bw-kpi-delta bw-kpi-delta--${k.up ? 'up' : 'down'}`}>{k.up ? '▲' : '▼'} {k.delta} <span className="bw-base">{k.base}</span></span>
              {k.spark && <span className="home-kpi-spark"><Sparkline values={k.spark} tone={k.up ? 'viz-cat-1' : 'viz-cat-6'} /></span>}
            </Link>
          ))}
        </div>
      </section>

      <div className="home-cols">
        <div className="home-main">
          <section aria-labelledby="recentes" className="home-sec">
            <div className="sec-head"><h2 id="recentes" className="sec-title">Continue de onde parou</h2><Link to="/reports" className="sec-link">Todos os relatórios <Icon name="arrowRight" size={12} /></Link></div>
            <div className="home-recent bw-stagger">{recent.map((r, i) => <ReportCard key={r.id} r={r} i={i} compact />)}</div>
          </section>
          {favs.length > 0 && (
            <section aria-labelledby="favoritos" className="home-sec">
              <div className="sec-head"><h2 id="favoritos" className="sec-title"><Icon name="star" size={12} /> Favoritos</h2></div>
              <div className="home-favs bw-stagger">
                {favs.map((r, i) => (
                  <Link key={r.id} to="/reports/$reportId" params={{ reportId: r.id }} className="home-fav bw-lift" style={{ ['--i' as string]: i }}>
                    <img src={coverUrl(r.cover, true)} alt="" width={72} height={40} />
                    <span><b>{r.name}</b><small>{r.type} · {r.updated}</small></span>
                    <Icon name="arrowRight" size={12} />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className="home-side">
          {aiEnabled && (
            <section className="home-card home-copilot" aria-labelledby="cp-title">
              <div className="home-copilot-head"><img src={asset('brand/mark.webp')} alt="" width={22} height={21} /><h2 id="cp-title" className="sec-title">Pergunte ao Copilot</h2></div>
              <p className="bw-secondary">Respostas com os dados do workspace, citando as fontes.</p>
              <div className="home-copilot-list">
                {['Por que a receita caiu em setembro?', 'Qual região mais contribui para a receita?', 'Quais relatórios falam de estoque?'].map((q) => (
                  <button key={q} type="button" onClick={() => askCopilot(q)}><Icon name="copilot" size={12} />{q}</button>
                ))}
              </div>
            </section>
          )}
          <section className="home-card" aria-labelledby="atividade">
            <h2 id="atividade" className="sec-title">Atividade recente</h2>
            <ol className="home-feed">
              {activity.map((a, i) => (
                <li key={i} className="bw-fade-in" style={{ animationDelay: `${120 + i * 50}ms` }}>
                  {a.who === 'Sistema' ? <span className="home-feed-sys"><Icon name="warning" size={12} /></span> : <Avatar name={a.who} size={24} />}
                  <span><b>{a.who}</b> {a.what} {a.reportId ? <Link to="/reports/$reportId" params={{ reportId: a.reportId }} className="bw-link"><b>{a.target}</b></Link> : <b>{a.target}</b>}<small>{a.when}</small></span>
                </li>
              ))}
            </ol>
          </section>
          <section className="home-card" aria-labelledby="saude">
            <div className="sec-head"><h2 id="saude" className="sec-title">Saúde dos dados</h2><Link to="/connections" className="sec-link">Conexões <Icon name="arrowRight" size={12} /></Link></div>
            <ul className="home-health">
              {connections.map((c) => (
                <li key={c.id}><span className={`home-dot home-dot--${c.ok ? 'ok' : 'bad'}`} aria-hidden="true" /><span className="bw-mono">{c.id}</span><span className="flex-1" />{c.ok ? <span className="bw-cap bw-muted">{c.detail}</span> : <Badge tone="danger" icon="warning">Falha</Badge>}</li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
