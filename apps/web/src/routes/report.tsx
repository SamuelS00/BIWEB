import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { Avatar, Banner, Button, Icon, IconButton, Menu, Skeleton } from '@biweb/ui';
import { BarChart, DivergingChart, fmtMi, HBarChart, LineChart, Matrix, ShareBar, Sparkline, StateTileMap } from '../charts/charts';
import * as D from '../fixtures/lume-varejo';
import { asset, useUi } from '../state/ui-store';
import { FavButton, StatusBadges } from './reports-shared';

function KpiBand({ set }: { set: 'ano' | 'setembro' }) {
  const list = set === 'ano' ? D.kpis : D.kpisSetembro;
  return (
    <div className="rv-kpis">
      {list.map((k, i) => (
        <div key={k.id} className="bw-widget rv-kpi bw-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
          <div className="bw-kpi-label">{k.label}{k.draft && <span className="rv-draft">rascunho</span>}</div>
          <div className="rv-kpi-row">
            <div>
              <div className="bw-kpi-value">{k.value}</div>
              <div className={`bw-kpi-delta bw-kpi-delta--${k.up ? 'up' : 'down'}`}>{k.up ? '▲' : '▼'} {k.delta} <span className="bw-base">{k.base}</span></div>
            </div>
            {k.spark && <Sparkline values={k.spark} />}
          </div>
        </div>
      ))}
    </div>
  );
}

function WidgetFrame({ title, sub, children, span, onAsk, onTable, table }: { title: string; sub: string; children: ReactNode; span: number; onAsk?: () => void; onTable?: () => void; table?: boolean }) {
  return (
    <section className="bw-widget rv-widget" style={{ gridColumn: `span ${span}` }} aria-label={`${title} ${sub}`}>
      <div className="bw-w-head">
        <div className="bw-w-title"><b>{title}</b><span>{sub}</span></div>
        <div className="bw-w-actions">
          {onTable && <IconButton icon="table" label={table ? 'Ver como gráfico' : 'Ver como tabela'} size="sm" onPress={onTable} />}
          {onAsk && <IconButton icon="copilot" label="Perguntar ao Copilot sobre este visual" size="sm" onPress={onAsk} />}
        </div>
      </div>
      <div className="rv-wbody">{children}</div>
    </section>
  );
}

function TableOf({ rows, unit }: { rows: [string, number][]; unit: string }) {
  return <table className="bw-matrix"><thead><tr><th>Item</th><th>{unit}</th></tr></thead><tbody>{rows.map(([k, v]) => <tr key={k}><td>{k}</td><td>{unit === '%' ? `${v}%` : fmtMi(v)}</td></tr>)}</tbody></table>;
}

/** S06 · Relatório aberto (modo leitura). Widgets de exemplo com dados do mock; no produto vêm do dashboard-runtime. */
export function ReportPage() {
  const { reportId } = useParams({ from: '/reports/$reportId' });
  const navigate = useNavigate();
  const { dashTheme, aiEnabled, askCopilot } = useUi();
  const r = D.reports.find((x) => x.id === reportId);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cross, setCross] = useState<string | null>(null);
  const [tables, setTables] = useState<Record<number, boolean>>({});
  useEffect(() => { setLoading(true); setCross(null); const t = setTimeout(() => setLoading(false), 450); return () => clearTimeout(t); }, [reportId]);
  if (!r) return <div className="pg"><Banner tone="warning">Relatório não encontrado. <Link to="/reports" className="bw-link">Ver todos</Link></Banner></div>;
  const ask = (q: string) => askCopilot(q);
  const tog = (i: number) => setTables((t) => ({ ...t, [i]: !t[i] }));
  const rowsOf = (k: string) => (D as unknown as Record<string, [string, number][]>)[k]!;

  return (
    <div className="rv">
      <header className="rv-head">
        <img className="rv-thumb" src={D.coverUrl(r.cover)} alt="" width={176} height={99} />
        <div className="rv-head-main">
          <div className="rv-eyebrow"><Link to="/reports" className="bw-link"><Icon name="arrowLeft" size={12} /> Relatórios</Link><span>·</span><span>{r.category}</span><span>·</span><span>{r.type}</span></div>
          <h1 className="rv-title">{r.name}</h1>
          <p className="rv-desc">{r.description}</p>
          <div className="rv-meta"><StatusBadges r={{ ...r, cover: () => D.coverUrl(r.cover), pages: r.pages.length }} /><span className="bw-row" style={{ gap: 6 }}><Avatar name={r.owner} size={20} />{r.owner}</span><span className="bw-secondary">Atualizado {r.updated}</span><span className="bw-secondary">{r.views.toLocaleString('pt-BR')} visualizações</span></div>
        </div>
        <div className="rv-actions">
          <FavButton id={r.id} name={r.name} />
          {aiEnabled && <Button icon="copilot" onPress={() => ask('Resuma este relatório')}>Resumir com Copilot</Button>}
          <Button icon="brush" onPress={() => navigate({ to: '/reports/$reportId/edit', params: { reportId: r.id } })}>Editar</Button>
          <Menu title="Mais ações" trigger={<Button variant="primary" icon="share">Compartilhar</Button>} items={[
            { id: 'link', label: 'Copiar link', icon: 'share', onAction: () => { void navigator.clipboard?.writeText(location.href).catch(() => undefined); } },
            { id: 'pdf', label: 'Exportar PDF', icon: 'download', disabledReason: 'Exports: próxima fase (render service)', onAction: () => undefined },
            { id: 'sched', label: 'Agendar envio por e-mail', icon: 'clock', disabledReason: 'Agendamentos: próxima fase', onAction: () => undefined },
          ]} />
        </div>
      </header>
      {r.status === 'Depreciado' && <div className="rv-banner"><Banner tone="warning" action={<Button onPress={() => navigate({ to: '/reports/$reportId', params: { reportId: 'rpt_visao_executiva' } })}>Abrir substituto</Button>}>Relatório depreciado. Use a <b>Visão Executiva de Vendas</b>.</Banner></div>}
      {r.origin === 'copilot' && <div className="rv-banner"><Banner tone="info">Rascunho criado com o Copilot a partir da pergunta <b>"Por que caiu em setembro?"</b>. Revise os números e o texto antes de publicar.</Banner></div>}

      <div className={`rv-canvas dash-theme-${dashTheme}`}>
        <div className="bw-ctxbar rv-ctx">
          <span className="bw-filter"><span className="bw-k">Período</span> <b>Últimos 9 meses</b><Icon name="chevronDown" size={12} /></span>
          <span className="bw-filter"><span className="bw-k">Região</span> <b>Todas</b><Icon name="chevronDown" size={12} /></span>
          {cross && <span className="bw-filter" data-active><span className="bw-k">Seleção:</span> <b>{cross}</b><button className="bw-iconbtn bw-iconbtn--sm" aria-label="Limpar seleção" onClick={() => setCross(null)}><Icon name="close" size={12} /></button></span>}
          <span className="flex-1" />
          <span className="bw-live">Ao vivo · atualizado 08:12</span>
        </div>
        {r.pages.length > 1 && (
          <div className="rv-pages" role="tablist">{r.pages.map((p, i) => <button key={p} role="tab" aria-selected={page === i} onClick={() => setPage(i)}>{p}</button>)}</div>
        )}
        {loading ? (
          <div className="rv-grid" aria-busy="true">
            {r.widgets.map((w, i) => <div key={i} className="bw-widget" style={{ gridColumn: `span ${w.span}`, height: w.kind === 'kpis' ? 96 : 260, display: 'flex', flexDirection: 'column', gap: 10 }}><Skeleton width="40%" height={12} /><Skeleton width="25%" height={10} /><Skeleton height="100%" /></div>)}
          </div>
        ) : (
          <div className="rv-grid" key={page}>
            {r.widgets.map((w, i) => {
              switch (w.kind) {
                case 'kpis': return <div key={i} style={{ gridColumn: 'span 12' }}><KpiBand set={w.set} /></div>;
                case 'bar': return <WidgetFrame key={i} title={w.title} sub={w.sub} span={w.span} onTable={() => tog(i)} table={tables[i]} onAsk={aiEnabled ? () => ask('Por que a receita caiu em setembro?') : undefined}>
                  {tables[i] ? <TableOf rows={D.meses.map((m, j) => [m, (w.data === 'receitaMes' ? D.receitaMes : D.pedidosMes)[j]!])} unit={w.data === 'receitaMes' ? 'R$ mi' : 'Pedidos'} />
                    : <BarChart labels={D.meses} values={w.data === 'receitaMes' ? D.receitaMes : D.pedidosMes} format={w.data === 'receitaMes' ? fmtMi : (v) => v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} highlightLast={w.highlightLast} />}
                </WidgetFrame>;
                case 'line': return <WidgetFrame key={i} title={w.title} sub={w.sub} span={w.span} onTable={() => tog(i)} table={tables[i]} onAsk={aiEnabled ? () => ask('Por que a receita caiu em setembro?') : undefined}>
                  {tables[i] ? <TableOf rows={D.meses.map((m, j) => [m, D.receitaMes[j]!])} unit="R$ mi" /> : <LineChart labels={D.meses} values={D.receitaMes} format={fmtMi} />}
                </WidgetFrame>;
                case 'hbar': return <WidgetFrame key={i} title={w.title} sub={w.sub} span={w.span} onTable={() => tog(i)} table={tables[i]} onAsk={aiEnabled ? () => ask(w.data === 'canais' ? 'Qual canal vende mais?' : w.data === 'regioes' || w.data === 'estados' ? 'Qual região mais contribui para a receita?' : 'Qual categoria vende mais?') : undefined}>
                  {tables[i] ? <TableOf rows={rowsOf(w.data)} unit={w.unit} /> : <HBarChart rows={rowsOf(w.data)} unit={w.unit} selected={w.crossFilter ? cross : null} onSelect={w.crossFilter ? (k) => setCross(cross === k ? null : k) : undefined} />}
                  {w.crossFilter && <p className="rv-hint">Clique numa categoria para destacar.</p>}
                </WidgetFrame>;
                case 'diverging': return <WidgetFrame key={i} title={w.title} sub={w.sub} span={w.span} onAsk={aiEnabled ? () => ask('Por que a receita caiu em setembro?') : undefined}><DivergingChart rows={rowsOf(w.data)} /></WidgetFrame>;
                case 'share': return <WidgetFrame key={i} title={w.title} sub={w.sub} span={w.span} onAsk={aiEnabled ? () => ask('Qual canal vende mais?') : undefined}><ShareBar rows={D.canais} /></WidgetFrame>;
                case 'map': return <WidgetFrame key={i} title={w.title} sub={w.sub} span={w.span}><StateTileMap values={D.estados} /></WidgetFrame>;
                case 'matrix': return <WidgetFrame key={i} title={w.title} sub={w.sub} span={w.span}><Matrix rows={rowsOf(w.data)} /></WidgetFrame>;
                case 'note': return <section key={i} className="bw-widget rv-widget rv-note" style={{ gridColumn: `span ${w.span}` }}><div className="bw-w-title"><b>{w.title}</b></div><p>{w.text}</p></section>;
              }
            })}
          </div>
        )}
        <footer className="rv-foot"><img src={asset(dashTheme === 'dark' ? 'brand/logo-dark.webp' : 'brand/logo-mono.webp')} alt="BIWEB Studio" height={14} className="rv-foot-logo" /><span>Dados de exemplo · Lume Varejo · jan–set/2026</span></footer>
      </div>
    </div>
  );
}
