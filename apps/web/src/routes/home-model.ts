import { useEffect, useMemo, useRef, useState } from 'react';
import type { IconName } from '@biweb/ui';
import { aggregate, fmt } from '../data/query';
import { getTable, network, useData } from '../data/registry';
import { connections as lumeConnections, kpis } from '../fixtures/lume-varejo';
import { ago } from '../editor/ReportView';
import type { CoverKind } from './maps/MapCover';

/** Modelo de dados da Home "Workspace Pulse": o que retomar, o que mudou, o que exige decisão e o que está em execução. */
export type HomeState = 'new' | 'active' | 'operational';
export type WorkKind = 'map' | 'dashboard' | 'workflow' | 'dataset' | 'model';
export type Tone = 'ok' | 'info' | 'warn' | 'bad';
export type Ws = 'rede' | 'comercial';

export interface Stat { label: string; value: string; tone?: Tone }
export interface Step { title: string; group: number; state: 'done' | 'failed' | 'waiting' }
export interface Preview {
  map?: CoverKind; img?: () => string; steps?: Step[];
  table?: { cols: { name: string; kind: 'abc' | '#' | 'geo' | 'dt' }[]; rows: string[][]; name: string; total: string };
  graph?: { tables: { id: string; name: string; n: number }[]; rels: [string, string][] };
}
export interface LastWork { kind: WorkKind; title: string; sub: string; edited: string; live: boolean; to: string; edit: string; stats: Stat[]; ask: string; preview: Preview }
export interface Attention { id: string; tone: 'warn' | 'bad'; title: string; detail: string; action: string; to: string }
export interface Incident { id: string; tone: Tone; title: string; detail: string; when: string; to: string }
export interface FeedEvent { id: string; at: number; tone: Tone; icon: IconName; text: string; target?: string; to?: string }
export interface Running { id: string; kind: 'workflow' | 'sync' | 'stream'; label: string; detail: string; progress: number | null; pause: number; to: string }

const DS = 'ds_rede_sp';
const n = (v: number) => v.toLocaleString('pt-BR');

const STEPS: Record<Ws, Step[]> = {
  rede: [
    { title: 'Fonte netops-db', group: 0, state: 'done' }, { title: 'Importar inventário', group: 0, state: 'done' },
    { title: 'Transformar eventos', group: 1, state: 'done' }, { title: 'Validar chaves', group: 1, state: 'failed' }, { title: 'Juntar alarmes NOC', group: 1, state: 'waiting' },
    { title: 'Modelo semântico', group: 2, state: 'waiting' }, { title: 'Atualizar dashboard', group: 2, state: 'waiting' },
  ],
  comercial: [
    { title: 'Fonte pg-erp', group: 0, state: 'done' }, { title: 'Importar pedidos', group: 0, state: 'done' },
    { title: 'Transformar vendas', group: 1, state: 'done' }, { title: 'Juntar estoque (SAP)', group: 1, state: 'failed' }, { title: 'Validar SKU', group: 1, state: 'waiting' },
    { title: 'Modelo Vendas Varejo', group: 2, state: 'waiting' }, { title: 'Atualizar dashboard', group: 2, state: 'waiting' },
  ],
};

/** Tudo o que a Home mostra de cada workspace. `lastWork` traz uma continuação por tipo de objeto, para a retomada se adaptar. */
export function useHomeModel(ws: Ws, gallery: { id: string; cover: (small?: boolean) => string }[]) {
  const datasets = useData((s) => s.datasets);
  const net = network();
  return useMemo(() => {
    const rede = ws === 'rede';
    const links = getTable(DS, 'enlaces').rows;
    const critical = links.filter((l) => l.status === 'critical' || l.status === 'offline').length;
    const activeEvents = net.events.filter((e) => !e.resolvido);
    const disp = fmt(aggregate(links, { ds: DS, table: 'enlaces', measure: 'disponibilidade', agg: 'avg' })[0]!.value, 'pct');
    const imported = datasets.filter((d) => d.imported).length;
    const cover = (id: string) => gallery.find((g) => g.id === id)?.cover;
    const kpiStats: Stat[] = kpis.slice(0, 3).map((k) => ({ label: k.label, value: k.value, tone: k.up ? 'ok' : 'warn' }));
    const failing = lumeConnections.filter((c) => !c.ok);
    const t = getTable(DS, 'enlaces');
    const cols = t.fields.filter((f) => !f.hidden && f.kind !== 'geo').slice(0, 5);
    const kindOf = (k: string): 'abc' | '#' | 'dt' => (k === 'measure' ? '#' : k === 'date' ? 'dt' : 'abc');
    const ds = datasets.find((d) => d.id === DS) ?? datasets[0]!;
    const graph = {
      tables: ds.tables.slice(0, 5).map((x) => ({ id: x.id, name: x.name, n: x.fields.filter((f) => !f.hidden).length })),
      rels: [...new Map(ds.relationships.map((r) => [`${r.from.split('.')[0]}>${r.to.split('.')[0]}`, r])).values()].map((r) => [r.from.split('.')[0]!, r.to.split('.')[0]!] as [string, string]).filter(([a, b]) => ds.tables.slice(0, 5).some((x) => x.id === a) && ds.tables.slice(0, 5).some((x) => x.id === b)),
    };
    const redeStats: Stat[] = [{ label: 'enlaces críticos', value: String(critical), tone: 'bad' }, { label: 'ocorrências ativas', value: String(activeEvents.length), tone: 'warn' }, { label: 'disponibilidade', value: disp, tone: 'info' }];

    const lastWork: Record<WorkKind, LastWork> = {
      map: { kind: 'map', title: rede ? 'Network Intelligence / OPS' : 'Mapa de lojas e cobertura', sub: rede ? 'Mapa operacional · fibra, atenuação e ocorrências' : 'Mapa operacional · malha de lojas', edited: 'há 18 min', live: true, to: '/maps/network', edit: '/maps/network',
        stats: rede ? redeStats : kpiStats, ask: 'Resuma o que mudou em Network Intelligence desde minha última visita', preview: { map: 'network' } },
      dashboard: { kind: 'dashboard', title: rede ? 'Network Intelligence' : 'Visão Executiva de Vendas', sub: rede ? 'Dashboard · Operações de Rede · v12' : 'Dashboard · jan–set/2026 · v12', edited: 'há 18 min', live: rede, to: rede ? '/reports/net_operacoes' : '/reports/rpt_visao_executiva', edit: rede ? '/reports/net_operacoes/edit' : '/reports/rpt_visao_executiva/edit',
        stats: rede ? redeStats : kpiStats, ask: rede ? 'Resuma o que mudou no Network Intelligence' : 'Por que a receita caiu em setembro?', preview: { img: cover(rede ? 'net_operacoes' : 'rpt_visao_executiva') } },
      workflow: { kind: 'workflow', title: rede ? 'Qualidade da rede · diária' : 'Carga diária de vendas', sub: 'Fluxo · 7 etapas · agenda 05:30 BRT', edited: 'há 2 h', live: false, to: '/workflows', edit: '/workflows',
        stats: [{ label: 'etapas concluídas', value: '3 de 7', tone: 'ok' }, { label: 'falha', value: '1', tone: 'bad' }, { label: 'aguardando', value: '3', tone: 'warn' }], ask: 'Por que o último fluxo falhou e como corrigir?', preview: { steps: STEPS[ws] } },
      dataset: { kind: 'dataset', title: rede ? ds.name : 'Vendas · pg-erp-producao', sub: rede ? `Dataset certificado · ${ds.source.label}` : 'Dataset · PostgreSQL (live)', edited: 'há 40 min', live: rede, to: '/connections', edit: '/connections',
        stats: rede ? [{ label: 'enlaces', value: n(t.rows.length), tone: 'info' }, { label: 'tabelas', value: String(ds.tables.length), tone: 'info' }, { label: 'certificado', value: ds.certified ? 'sim' : 'não', tone: ds.certified ? 'ok' : 'warn' }] : [{ label: 'linhas', value: '1,2 mi', tone: 'info' }, { label: 'tabelas', value: '4', tone: 'info' }, { label: 'latência', value: '42 ms', tone: 'ok' }],
        ask: 'Quais campos deste dataset mudaram e o que usa cada um?',
        preview: rede ? { table: { name: t.name, total: `${n(t.rows.length)} linhas`, cols: cols.map((f) => ({ name: f.label, kind: kindOf(f.kind) })), rows: t.rows.slice(0, 5).map((r) => cols.map((f) => { const v = r[f.name]; return typeof v === 'number' ? n(Math.round(v * 100) / 100) : String(v ?? '—'); })) } }
          : { table: { name: 'pedidos', total: '1,2 mi linhas', cols: [{ name: 'Pedido', kind: 'abc' }, { name: 'Data', kind: 'dt' }, { name: 'Loja', kind: 'abc' }, { name: 'Canal', kind: 'abc' }, { name: 'Valor', kind: '#' }], rows: [['PD-88213', '30/09', 'Pinheiros', 'Loja', '412,00'], ['PD-88214', '30/09', 'E-commerce', 'Online', '189,90'], ['PD-88215', '30/09', 'Campinas', 'Loja', '634,50'], ['PD-88216', '30/09', 'E-commerce', 'Online', '97,00'], ['PD-88217', '29/09', 'Santos', 'Loja', '255,40']] } } },
      model: { kind: 'model', title: rede ? 'Modelo semântico · Rede Metropolitana SP' : 'Modelo semântico · Vendas Varejo', sub: rede ? 'Relacionamentos entre enlaces, nós, eventos e histórico' : 'Rascunho v13 · publicado v12', edited: 'há 1 h', live: false, to: rede ? '/connections' : '/models/sem_vendas_varejo', edit: rede ? '/connections' : '/models/sem_vendas_varejo',
        stats: [{ label: 'tabelas', value: String(rede ? graph.tables.length : 4), tone: 'info' }, { label: 'relacionamentos', value: String(rede ? graph.rels.length : 3), tone: 'info' }, { label: rede ? 'certificado' : 'rascunho v13', value: rede ? 'sim' : '1 alteração', tone: rede ? 'ok' : 'warn' }],
        ask: 'O que mudou neste modelo desde a última publicação?',
        preview: { graph: rede ? graph : { tables: [{ id: 'vendas', name: 'Vendas', n: 12 }, { id: 'clientes', name: 'Clientes', n: 8 }, { id: 'produtos', name: 'Produtos', n: 9 }, { id: 'lojas', name: 'Lojas', n: 6 }], rels: [['vendas', 'clientes'], ['vendas', 'produtos'], ['vendas', 'lojas']] } } },
    };

    const attention: Attention[] = rede ? [
      { id: 'ev', tone: 'bad', title: `${activeEvents.length} ocorrências ativas na rede`, detail: activeEvents[0] ? `${activeEvents[0].tipo} · ${activeEvents[0].regiao}` : 'Sem detalhes', action: 'Abrir ocorrências', to: '/reports/net_incidentes' },
      { id: 'crit', tone: 'bad', title: `Network Intelligence detectou ${critical} enlaces críticos`, detail: 'Atenuação acima do limite ou enlace offline', action: 'Ver no mapa', to: '/maps/network' },
      { id: 'wf', tone: 'bad', title: '1 fluxo falhou em “Validar chaves”', detail: '3 IDs de enlace duplicados · publicação interrompida', action: 'Ver logs', to: '/workflows' },
      { id: 'stale', tone: 'warn', title: '1 fonte desatualizada', detail: 'metas_capacidade.xlsx · sem atualização recente', action: 'Revisar', to: '/connections' },
    ] : [
      ...failing.map((c): Attention => ({ id: c.id, tone: 'bad', title: `Conexão ${c.id} com falha`, detail: `${c.state} · ${c.detail}`, action: 'Reconectar', to: '/connections' })),
      { id: 'drop', tone: 'warn', title: 'Receita de setembro caiu 31,5% vs agosto', detail: 'Ruptura de estoque explica parte da queda', action: 'Analisar', to: '/reports/rpt_analise_queda' },
    ];
    const incidents: Incident[] = rede
      ? [...activeEvents].sort((a, b) => (a.severidade === 'offline' ? 0 : 1) - (b.severidade === 'offline' ? 0 : 1) || b.ts - a.ts).slice(0, 5).map((e) => ({ id: e.id, tone: e.severidade === 'offline' || e.severidade === 'critical' ? 'bad' as const : 'warn' as const, title: `${e.tipo} · ${e.regiao}`, detail: `${e.elementoNome} · ${e.descricao}`, when: ago(e.ts), to: '/reports/net_incidentes' }))
      : attention.map((a) => ({ id: a.id, tone: a.tone === 'bad' ? 'bad' as const : 'warn' as const, title: a.title, detail: a.detail, when: 'agora', to: a.to }));

    const sources = rede ? 3 + imported : lumeConnections.length;
    return { lastWork, attention, incidents, critical, activeEvents: activeEvents.length, sources, stale: rede ? 1 : failing.length, imported };
  }, [ws, datasets, net, gallery]);
}

/** Seeds do feed: minutos atrás, texto e destino. Os horários são calculados na montagem para a linha do tempo nunca parecer velha. */
const SEEDS: Record<Ws, { m: number; tone: Tone; icon: IconName; text: string; target?: string; to?: string }[]> = {
  rede: [
    { m: 2, tone: 'ok', icon: 'refresh', text: 'Dataset atualizado', target: 'netops-db · 346 enlaces', to: '/connections' },
    { m: 6, tone: 'info', icon: 'bolt', text: 'Novos dados em tempo real', target: 'Network Intelligence · 4 alarmes', to: '/maps/network' },
    { m: 14, tone: 'ok', icon: 'report', text: 'Dashboard publicado', target: 'Operações de Rede v12', to: '/reports/net_operacoes' },
    { m: 31, tone: 'info', icon: 'model', text: 'Modelo semântico alterado', target: 'Rede Metropolitana SP', to: '/connections' },
    { m: 52, tone: 'bad', icon: 'warning', text: 'Rompimento de fibra detectado', target: 'Barueri', to: '/reports/net_incidentes' },
    { m: 74, tone: 'bad', icon: 'share', text: 'Fluxo falhou em Validar chaves', target: 'Qualidade da rede', to: '/workflows' },
    { m: 130, tone: 'info', icon: 'sliders', text: 'Regra criada', target: 'Atenuação acima do limite', to: '/reports/net_geografica' },
  ],
  comercial: [
    { m: 2, tone: 'ok', icon: 'refresh', text: 'Dataset atualizado', target: 'pg-erp-producao', to: '/connections' },
    { m: 9, tone: 'info', icon: 'copilot', text: 'Análise criada com o Copilot', target: 'Queda de setembro', to: '/reports/rpt_analise_queda' },
    { m: 25, tone: 'ok', icon: 'check', text: 'Métrica certificada', target: 'Margem %', to: '/models/sem_vendas_varejo' },
    { m: 46, tone: 'ok', icon: 'report', text: 'Dashboard publicado', target: 'Visão Executiva de Vendas v12', to: '/reports/rpt_visao_executiva' },
    { m: 74, tone: 'bad', icon: 'warning', text: 'Falha de credencial', target: 'sap-estoque', to: '/connections' },
    { m: 120, tone: 'info', icon: 'brush', text: 'Relatório editado', target: 'Apresentação mensal ao comitê', to: '/reports/rpt_comite' },
  ],
};
const INCOMING: Record<Ws, { tone: Tone; icon: IconName; text: string; target: string; to: string }[]> = {
  rede: [
    { tone: 'info', icon: 'bolt', text: 'Novos dados em tempo real', target: 'Network Intelligence · 2 alarmes', to: '/maps/network' },
    { tone: 'ok', icon: 'pin', text: 'Equipe EQ-04 chegou ao local', target: 'Campo · Barueri', to: '/maps/field' },
    { tone: 'ok', icon: 'check', text: 'Enlace voltou ao normal', target: 'ENL-017 · Mooca', to: '/reports/net_operacoes' },
    { tone: 'info', icon: 'refresh', text: 'Dataset atualizado', target: 'api-alarmes-noc', to: '/connections' },
  ],
  comercial: [
    { tone: 'info', icon: 'bolt', text: 'Novos pedidos recebidos', target: 'pg-erp-producao · +128', to: '/connections' },
    { tone: 'ok', icon: 'refresh', text: 'Dataset atualizado', target: 'bq-ecommerce', to: '/connections' },
    { tone: 'info', icon: 'eye', text: 'Relatório visualizado', target: 'Visão Executiva de Vendas', to: '/reports/rpt_visao_executiva' },
  ],
};
const START: Record<Ws, Running[]> = {
  rede: [
    { id: 'wf', kind: 'workflow', label: 'Atualização de topologia', detail: 'Etapa 3 de 7 · Transformar eventos', progress: 42, pause: 0, to: '/workflows' },
    { id: 'sync', kind: 'sync', label: 'netops-db', detail: 'Sincronizando enlaces', progress: 18, pause: 0, to: '/connections' },
    { id: 'stream', kind: 'stream', label: 'api-alarmes-noc', detail: 'Recebendo alarmes em tempo real', progress: null, pause: 0, to: '/connections' },
  ],
  comercial: [
    { id: 'wf', kind: 'workflow', label: 'Carga diária de vendas', detail: 'Etapa 2 de 7 · Importar pedidos', progress: 35, pause: 0, to: '/workflows' },
    { id: 'sync', kind: 'sync', label: 'bq-ecommerce', detail: 'Sincronizando pedidos', progress: 22, pause: 0, to: '/connections' },
  ],
};

export const hhmm = (t: number) => new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
/** Referência de “última visita” da demonstração: 75 min atrás. Em produção viria do último acesso do usuário. */
export const LAST_VISIT_MIN = 75;

/** Atividade simulada coerente: execuções avançam, terminam e viram eventos; chegam eventos novos. Cada mudança traz `fresh` por ~2,6 s. */
export function useLive(ws: Ws) {
  const mount = useRef(Date.now());
  const [events, setEvents] = useState<(FeedEvent & { fresh?: boolean })[]>(() => SEEDS[ws].map((s, i) => ({ id: `s${i}`, at: mount.current - s.m * 60_000, tone: s.tone, icon: s.icon, text: s.text, target: s.target, to: s.to })));
  const [running, setRunning] = useState<Running[]>(START[ws]);
  const [refresh, setRefresh] = useState({ at: mount.current, n: 0 });
  const [now, setNow] = useState(mount.current);
  const runRef = useRef<Running[]>(START[ws]);
  const tick = useRef(0), seq = useRef(0), inc = useRef(0);

  useEffect(() => {
    setEvents(SEEDS[ws].map((s, i) => ({ id: `s${i}`, at: Date.now() - s.m * 60_000, tone: s.tone, icon: s.icon, text: s.text, target: s.target, to: s.to })));
    runRef.current = START[ws]; setRunning(START[ws]); tick.current = 0;
  }, [ws]);

  useEffect(() => {
    const push = (e: Omit<FeedEvent, 'id' | 'at'>) => {
      const id = `l${seq.current++}`;
      setEvents((l) => [{ ...e, id, at: Date.now(), fresh: true }, ...l].slice(0, 12));
      setTimeout(() => setEvents((l) => l.map((x) => (x.id === id ? { ...x, fresh: false } : x))), 2600);
    };
    const id = setInterval(() => {
      tick.current++; setNow(Date.now());
      const done: Running[] = [];
      runRef.current = runRef.current.map((r) => {
        if (r.kind === 'stream') return r;
        if (r.pause > 0) return { ...r, pause: r.pause - 1, progress: r.pause === 1 ? 2 : null };
        const p = Math.min(100, (r.progress ?? 0) + (r.kind === 'workflow' ? 3 : 5));
        if (p >= 100) { done.push(r); return { ...r, progress: null, pause: 16 }; }
        return { ...r, progress: p };
      });
      setRunning(runRef.current);
      done.forEach((r) => push(r.kind === 'workflow' ? { tone: 'ok', icon: 'check', text: 'Fluxo concluído', target: r.label, to: r.to } : { tone: 'ok', icon: 'refresh', text: 'Dataset atualizado', target: r.label, to: r.to }));
      if (tick.current % 9 === 0) { const x = INCOMING[ws][inc.current++ % INCOMING[ws].length]!; push(x); setRefresh((r) => ({ at: Date.now(), n: r.n + 1 })); }
    }, 1500);
    return () => clearInterval(id);
  }, [ws]);

  return { events, running: running.filter((r) => r.progress !== null || r.kind === 'stream'), refresh, now };
}
