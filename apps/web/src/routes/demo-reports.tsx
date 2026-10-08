import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Badge, Button, Icon, SegmentedControl } from '@biweb/ui';
import './demo-reports.css';

type DemoId = 'demo_anomaly' | 'demo_sla' | 'demo_customer';
const TITLES: Record<DemoId, string> = { demo_anomaly: 'Anomaly Explorer', demo_sla: 'SLA & Risk Monitor', demo_customer: 'Customer Behavior' };
const fmt = (n: number) => n.toLocaleString('pt-BR');

function Metric({ label, value, note, tone }: { label: string; value: string; note: string; tone?: 'warning' | 'danger' | 'success' }) {
  return <section className="demo-metric"><span>{label}</span><b className={tone ? `tone-${tone}` : ''}>{value}</b><small>{note}</small></section>;
}
function Widget({ title, subtitle, children, className = '' }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return <section className={`bw-widget demo-widget ${className}`}><header><div><b>{title}</b>{subtitle && <small>{subtitle}</small>}</div><button className="bw-iconbtn bw-iconbtn--sm" title="Dados demonstrativos" aria-label="Dados demonstrativos"><Icon name="info" size={12} /></button></header>{children}</section>;
}

function AnomalyReport() {
  const [region, setRegion] = useState('Todas');
  const [metric, setMetric] = useState<'Latência' | 'Disponibilidade'>('Latência');
  const [showHypothesis, setShowHypothesis] = useState(false);
  const actual = region === 'Oeste' ? [44, 46, 45, 47, 52, 49, 88, 102, 91, 60, 54, 51] : region === 'Leste' ? [41, 43, 44, 45, 46, 49, 51, 50, 56, 55, 53, 52] : region === 'Centro' ? [42, 44, 43, 46, 47, 48, 53, 58, 60, 55, 50, 49] : [43, 45, 44, 47, 48, 51, 56, 79, 91, 68, 58, 54];
  const expected = [42, 44, 43, 45, 47, 49, 50, 52, 53, 54, 55, 53];
  const chart = (metric === 'Latência' ? actual : actual.map((v) => Math.max(98.7, 100.2 - v / 100))).map((v) => v);
  return <>
    <div className="demo-context"><label>Região<select value={region} onChange={(e) => setRegion(e.target.value)}><option>Todas</option><option>Oeste</option><option>Leste</option><option>Centro</option></select></label><label>Medida<select value={metric} onChange={(e) => setMetric(e.target.value as typeof metric)}><option>Latência</option><option>Disponibilidade</option></select></label><span className="flex-1"/><Badge tone="warning" icon="warning">3 anomalias abertas</Badge></div>
    <div className="demo-metrics"><Metric label="Desvios relevantes" value="3" note="2 acima do limiar" tone="warning"/><Metric label="Maior desvio" value={metric === 'Latência' ? '+74 ms' : '−0,08 pp'} note="Oeste · 07:40–08:20" tone="danger"/><Metric label="Serviços afetados" value="2" note="de 14 monitorados"/><Metric label="Última detecção" value="08:22" note="Hoje · janela de 15 min"/></div>
    <div className="demo-grid"><Widget title={`Observado × esperado · ${metric}`} subtitle="Últimas 12 janelas · banda de referência p10–p90"><div className="demo-linechart"><svg viewBox="0 0 600 210" role="img" aria-label="Série observada comparada com baseline"><path className="demo-band" d="M38 64 L86 58 L134 61 L182 54 L230 50 L278 45 L326 42 L374 37 L422 32 L470 29 L518 25 L566 31 L566 68 L518 64 L470 68 L422 72 L374 78 L326 82 L278 86 L230 90 L182 95 L134 99 L86 96 L38 102Z"/><path className="demo-line expected" d="M38 83 L86 78 L134 80 L182 75 L230 71 L278 67 L326 63 L374 58 L422 53 L470 50 L518 45 L566 51"/><path className="demo-line actual" d={chart.map((v, i) => `${i ? 'L' : 'M'}${38 + i * 48} ${Math.max(22, 162 - (v - 35) * 1.3)}`).join(' ')}/><line x1="326" y1="22" x2="326" y2="177" className="demo-marker"/><text x="334" y="18">07:40 · desvio</text>{Array.from({ length: 6 }, (_, i) => <text key={i} x={38 + i * 96} y="198">{`${String(i * 2).padStart(2, '0')}:00`}</text>)}</svg><div className="demo-chart-legend"><span><i className="line-key actual"/>Observado</span><span><i className="line-key expected"/>Esperado</span><span><i className="line-key band"/>Faixa típica</span></div></div></Widget>
      <Widget title="Anomalias detectadas" subtitle="Pontuação combina magnitude, duração e recorrência"><div className="demo-anomaly-list">{[
        { at: '08:20', area: 'Oeste · Latência', val: '+74 ms', score: 96, level: 'Crítica' }, { at: '07:55', area: 'Oeste · Perda de pacotes', val: '+2,4 pp', score: 82, level: 'Alta' }, { at: '06:30', area: 'Centro · Disponibilidade', val: '−0,06 pp', score: 68, level: 'Média' },
      ].map((x) => <button key={x.at} className="demo-anomaly-row" onClick={() => setRegion(x.area.split(' · ')[0]!)}><span><b>{x.area}</b><small>{x.at} · pontuação {x.score}</small></span><strong>{x.val}</strong><Badge tone={x.level === 'Crítica' ? 'danger' : 'warning'}>{x.level}</Badge></button>)}</div></Widget>
      <Widget title="Leitura assistida" subtitle="Separação entre evidência observada e hipótese" className="demo-wide"><div className="demo-evidence"><div><Badge tone="success" icon="check">Evidência</Badge><p>Na região Oeste, a latência observada atingiu 102 ms às 07:55, contra referência de 52 ms. O desvio durou 40 minutos e coincide com aumento de perda no ENL-042.</p></div><div><Badge tone="accent" icon="copilot">Hipótese</Badge><p>{showHypothesis ? 'A concentração temporal e geográfica é compatível com degradação de enlace ou saturação de rota. A demonstração não confirma causalidade; valide telemetria do equipamento.' : 'Possível degradação de enlace ou saturação. Abra para ver limitações e próximos passos sugeridos.'}<button className="demo-inline-link" onClick={() => setShowHypothesis((v) => !v)}>{showHypothesis ? 'Recolher' : 'Detalhar hipótese'}</button></p></div></div></Widget></div>
  </>;
}

const services = [
  { name: 'API de autenticação', slo: '99,95%', current: '99,91%', budget: '31%', burn: '2,1×', forecast: '18 dias', state: 'Risco' },
  { name: 'API de catálogo', slo: '99,90%', current: '99,96%', budget: '12%', burn: '0,6×', forecast: '> 30 dias', state: 'Saudável' },
  { name: 'Checkout', slo: '99,95%', current: '99,97%', budget: '8%', burn: '0,4×', forecast: '> 30 dias', state: 'Saudável' },
  { name: 'Gateway de pagamentos', slo: '99,99%', current: '99,94%', budget: '76%', burn: '6,8×', forecast: '4 dias', state: 'Crítico' },
];
function SlaReport() {
  const [service, setService] = useState('Todos');
  const [period, setPeriod] = useState<'30 dias' | '7 dias'>('30 dias');
  const shown = services.filter((x) => service === 'Todos' || x.name === service);
  return <>
    <div className="demo-context"><label>Serviço<select value={service} onChange={(e) => setService(e.target.value)}><option>Todos</option>{services.map((x) => <option key={x.name}>{x.name}</option>)}</select></label><SegmentedControl label="Janela de análise" value={period} onChange={setPeriod} options={[{ id: '30 dias', label: '30 dias' }, { id: '7 dias', label: '7 dias' }]} /><span className="flex-1"/><Badge tone="danger" icon="warning">1 orçamento em risco</Badge></div>
    <div className="demo-metrics"><Metric label="Serviços dentro do SLO" value={service === 'Todos' ? '3 / 4' : shown[0]?.state === 'Crítico' ? '0 / 1' : '1 / 1'} note="janela móvel" tone="warning"/><Metric label="Orçamento consumido" value={service === 'Todos' ? '76%' : shown[0]?.budget ?? '0%'} note="maior consumo · pagamentos" tone="danger"/><Metric label="Taxa média de burn" value={service === 'Todos' ? '2,5×' : shown[0]?.burn ?? '0×'} note="referência sustentável: 1×" tone="warning"/><Metric label="Próximo esgotamento" value={service === 'Todos' ? '4 dias' : shown[0]?.forecast ?? '—'} note="projeção da janela atual" tone="danger"/></div>
    <div className="demo-grid"><Widget title="Saúde e orçamento por serviço" subtitle={`Janela móvel de ${period.toLowerCase()} · dados simulados`} className="demo-wide"><div className="demo-table-wrap"><table className="bw-table demo-sla-table"><thead><tr><th>Serviço</th><th>SLO</th><th>Disponibilidade</th><th>Orçamento consumido</th><th>Burn rate</th><th>Projeção</th><th>Estado</th></tr></thead><tbody>{shown.map((x) => <tr key={x.name}><td><b>{x.name}</b></td><td>{x.slo}</td><td>{x.current}</td><td><div className="demo-budget"><span><i style={{ width: x.budget }}/></span><b>{x.budget}</b></div></td><td>{x.burn}</td><td>{x.forecast}</td><td><Badge tone={x.state === 'Crítico' ? 'danger' : x.state === 'Risco' ? 'warning' : 'success'}>{x.state}</Badge></td></tr>)}</tbody></table></div></Widget>
      <Widget title="Consumo do orçamento" subtitle="Ciclo atual · início há 18 dias"><div className="demo-budget-visual"><div className="demo-gauge"><div style={{ ['--amount' as string]: service === 'Todos' ? '76%' : shown[0]?.budget ?? '0%' }}><b>{service === 'Todos' ? '76%' : shown[0]?.budget ?? '0%'}</b><small>consumido</small></div></div><p>Gateway de pagamentos consumiu 76% do orçamento em 18 dias. Mantida a taxa atual, o limite será atingido em aproximadamente 4 dias.</p></div></Widget>
      <Widget title="Políticas de alerta" subtitle="Regras locais da demonstração"><div className="demo-policy-list"><div><Badge tone="danger">Acionar</Badge><span>Burn rate ≥ 6× por 5 min</span><small>Página · pagamentos</small></div><div><Badge tone="warning">Investigar</Badge><span>Burn rate ≥ 2× por 1 h</span><small>Notificação · dono do serviço</small></div><div><Badge tone="neutral">Observar</Badge><span>Orçamento restante &lt; 25%</span><small>Resumo diário · plataforma</small></div></div></Widget></div>
  </>;
}

function CustomerReport() {
  const [view, setView] = useState<'Jornada' | 'Coortes' | 'Caminhos'>('Jornada');
  const [segment, setSegment] = useState('Todos os clientes');
  const cohorts = [
    ['Jan', 100, 68, 54, 48, 44, 41], ['Fev', 100, 71, 58, 50, 46, 0], ['Mar', 100, 66, 51, 45, 0, 0], ['Abr', 100, 73, 60, 0, 0, 0], ['Mai', 100, 69, 0, 0, 0, 0],
  ] as const;
  const funnel = [{ label: 'Conta criada', n: segment === 'Orgânico' ? 4200 : segment === 'Campanha paga' ? 8640 : 12840 }, { label: 'E-mail verificado', n: segment === 'Orgânico' ? 3360 : segment === 'Campanha paga' ? 6912 : 10272 }, { label: 'Primeiro projeto', n: segment === 'Orgânico' ? 2310 : segment === 'Campanha paga' ? 4880 : 7190 }, { label: 'Primeira integração', n: segment === 'Orgânico' ? 1680 : segment === 'Campanha paga' ? 3456 : 5136 }, { label: 'Ativado em 7 dias', n: segment === 'Orgânico' ? 1260 : segment === 'Campanha paga' ? 2592 : 3852 }];
  const paths: { steps: string[]; share: number }[] = [
    { steps: ['Criar conta', 'Verificar e-mail', 'Criar projeto', 'Conectar GitHub', 'Concluir onboarding'], share: 38 },
    { steps: ['Criar conta', 'Verificar e-mail', 'Criar projeto', 'Conectar planilha', 'Concluir onboarding'], share: 24 },
    { steps: ['Criar conta', 'Verificar e-mail', 'Convidar equipe', 'Criar projeto', 'Concluir onboarding'], share: 17 },
    { steps: ['Criar conta', 'Verificar e-mail', 'Explorar exemplos', 'Criar projeto', 'Abandonou'], share: 11 },
  ];
  return <>
    <div className="demo-context"><label>Segmento<select value={segment} onChange={(e) => setSegment(e.target.value)}><option>Todos os clientes</option><option>Orgânico</option><option>Campanha paga</option></select></label><SegmentedControl label="Visão de comportamento" value={view} onChange={setView} options={[{ id: 'Jornada', label: 'Jornada' }, { id: 'Coortes', label: 'Coortes' }, { id: 'Caminhos', label: 'Caminhos' }]} /><span className="flex-1"/><Badge tone="neutral">Aquisição · últimos 6 meses</Badge></div>
    <div className="demo-metrics"><Metric label="Contas criadas" value={segment === 'Orgânico' ? '4.200' : segment === 'Campanha paga' ? '8.640' : '12.840'} note="no período selecionado"/><Metric label="Ativação em 7 dias" value="30,0%" note="+2,4 pp vs. período anterior" tone="success"/><Metric label="Tempo até ativação" value="2,8 dias" note="mediana · −0,3 dia"/><Metric label="Retenção M3" value="54%" note="coortes maduras" tone="success"/></div>
    <div className="demo-grid">{view === 'Jornada' ? <><Widget title="Jornada de onboarding" subtitle="Conversão acumulada entre etapas · clique para inspecionar"><div className="demo-funnel">{funnel.map((x, i) => { const rate = i ? x.n / funnel[i - 1]!.n * 100 : 100; return <div className="demo-funnel-step" key={x.label}><div className="demo-funnel-bar" style={{ width: `${Math.max(35, 100 - i * 13)}%` }}><b>{x.label}</b><strong>{fmt(x.n)}</strong></div><span>{i ? `${rate.toFixed(1).replace('.', ',')}%` : '100%'}{i > 0 && <small> · −{fmt(funnel[i - 1]!.n - x.n)}</small>}</span></div>; })}</div></Widget><Widget title="Principais pontos de abandono" subtitle="Diferença entre etapas consecutivas"><div className="demo-drop-list">{funnel.slice(1).map((x, i) => <div key={x.label}><span><b>{funnel[i]!.label}</b><Icon name="arrowRight" size={12}/><b>{x.label}</b></span><strong>{((funnel[i]!.n - x.n) / funnel[i]!.n * 100).toFixed(1).replace('.', ',')}%</strong></div>)}</div><p className="demo-note">Maior queda: criar o primeiro projeto → conectar uma integração.</p></Widget></> : view === 'Coortes' ? <Widget title="Retenção por coorte" subtitle="Percentual de contas que retornaram em cada mês" className="demo-wide"><div className="demo-cohort-wrap"><table className="demo-cohort"><thead><tr><th>Coorte</th>{['M0','M1','M2','M3','M4','M5'].map((x) => <th key={x}>{x}</th>)}</tr></thead><tbody>{cohorts.map((row) => <tr key={row[0]}><th>{row[0]}/26</th>{row.slice(1).map((value, i) => <td key={i} style={{ ['--heat' as string]: `${Math.max(0, Number(value)) / 100}` }}>{value ? `${value}%` : '—'}</td>)}</tr>)}</tbody></table></div><p className="demo-note">M0 corresponde ao mês de entrada. Coortes recentes ainda não completaram todos os períodos.</p></Widget> : <><Widget title="Caminhos mais frequentes" subtitle="Primeiras sessões após criar uma conta" className="demo-wide"><div className="demo-paths">{paths.map(({ steps, share }) => <div key={steps.join('-')}><span className="demo-path-share">{share}%</span>{steps.map((step, i) => <span className={`demo-path-node${i === 4 && step === 'Abandonou' ? ' is-drop' : ''}`} key={i}>{step}</span>)}</div>)}</div></Widget><Widget title="Leitura da jornada" subtitle="Observação do conjunto simulado"><p className="demo-note">Clientes que conectam uma fonte de dados na primeira sessão apresentam maior ativação em sete dias. A demonstração descreve associação observada e não atribui causalidade.</p></Widget></>}</div>
  </>;
}

export function DemoReportView({ id }: { id: string }) {
  const valid = (['demo_anomaly', 'demo_sla', 'demo_customer'] as string[]).includes(id) ? id as DemoId : 'demo_anomaly';
  const [refresh, setRefresh] = useState(false);
  return <main className="demo-report pg">
    <div className="demo-back"><Link to="/reports"><Icon name="arrowLeft" size={12}/> Relatórios</Link><span>/</span><span>Operações de Rede</span></div>
    <header className="demo-report-head"><div><div className="demo-eyebrow"><Badge tone="success" icon="check">Publicado · v1.0</Badge><Badge tone="neutral" icon="info">Protótipo local</Badge></div><h1 className="pg-title">{TITLES[valid]}</h1><p className="pg-sub">{valid === 'demo_anomaly' ? 'Detecção e exploração de desvios em séries operacionais.' : valid === 'demo_sla' ? 'Saúde de serviços, objetivos de confiabilidade e orçamento de erro.' : 'Ativação, retenção e caminhos de uso das contas de demonstração.'} Dados sintéticos para exploração do produto.</p></div><Button icon="refresh" onPress={() => setRefresh((x) => !x)}>{refresh ? 'Dados atualizados' : 'Atualizar dados'}</Button></header>
    <div className="demo-report-meta"><span><Icon name="clock" size={12}/> Atualizado agora · execução simulada</span><span><Icon name="data" size={12}/> Fonte: dados demonstrativos do protótipo</span><span className="flex-1"/><span>Período: 01 set – 07 out 2026</span></div>
    {valid === 'demo_anomaly' ? <AnomalyReport/> : valid === 'demo_sla' ? <SlaReport/> : <CustomerReport/>}
    <footer className="demo-report-foot"><Icon name="info" size={12}/><span>Este relatório funciona integralmente no navegador com dados mockados. Filtros, segmentos e visualizações alteram o estado local; nenhuma conexão com backend é feita.</span></footer>
  </main>;
}
