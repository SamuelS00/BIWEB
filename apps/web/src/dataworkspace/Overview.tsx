import { Badge, Icon } from '@biweb/ui';
import { allAssets, allChangeSets, allSources, statusOf, useDw, type ActEv } from './store';
import { ACTIVITY, MODELS, PUBLISHED, QUALITY, REVIEW } from './ops';
import { nf } from './sample';
import { Empty, Section, Spark, ViewHead, pct, useGo, useTicker } from './ui';

const CYCLE = ['Conectar', 'Descobrir', 'Entender', 'Perfilar', 'Relacionar', 'Modelar', 'Mapear', 'Normalizar', 'Enriquecer', 'Validar', 'Aprovar', 'Publicar', 'Monitorar', 'Evoluir'];

export function Overview() {
  const go = useGo();
  const st = useDw();
  const sources = allSources(st.extraSources), assets = allAssets(st.extraAssets);
  const live = sources.filter((s) => s.fresh === 'live').length;
  const avgQ = QUALITY.reduce((s, q) => s + q.health, 0) / QUALITY.length;
  const issues = QUALITY.reduce((s, q) => s + q.issues.length, 0);
  const proposals = MODELS.filter((m) => m.status === 'Proposta').length;
  const cs = allChangeSets(st.extraCs);
  const csOpen = cs.filter((c) => statusOf(c, st.csStatus) === 'proposed').length;
  const liveDs = PUBLISHED.filter((p) => p.realtime).length;
  const nSources = useTicker(sources.length), nAssets = useTicker(assets.length);

  const pulse = [
    { k: 'Fontes', v: nSources, a: `${sources.filter((s) => s.health !== 'critical').length} conectadas`, b: `${live} ao vivo`, to: '/data/sources' },
    { k: 'Ativos', v: nAssets, a: `${nf(assets.length - 3)} estáveis`, b: '3 alterados', to: '/data/catalog' },
    { k: 'Modelos', v: MODELS.length, a: `${MODELS.length - proposals} publicados`, b: `${proposals} propostas`, to: '/data/model' },
    { k: 'Publicados', v: PUBLISHED.length, a: 'datasets curados', b: `${liveDs} em tempo real`, to: '/data/published' },
    { k: 'Qualidade', v: `${pct(avgQ)}`, a: 'média dos datasets', b: `${issues} problemas`, to: '/data/quality' },
  ];
  const driftDone = ['approved', 'applied', 'rejected'].includes(statusOf(cs.find((c) => c.id === 'CS-183')!, st.csStatus));
  const relDone = !!st.decisions.r5;
  const qFixed = st.quarantine.reprocessed;
  const att = [
    !driftDone && { id: 'a1', tone: 'warning' as const, icon: 'migrate' as const, title: 'Schema change detectado', where: 'CRM Cloud', body: 'customer_tier adicionado · afeta 2 modelos / 4 relatórios', to: '/data/changes/CS-183', cta: 'Ver ChangeSet' },
    !qFixed && { id: 'a2', tone: 'danger' as const, icon: 'warning' as const, title: 'Quality gate G2 falhou', where: 'Orders Curated', body: '1.248 linhas em quarentena · 811 podem ser corrigidas por normalização', to: '/data/quality/orders', cta: 'Abrir quarentena' },
    !relDone && { id: 'a3', tone: 'accent' as const, icon: 'share' as const, title: 'Proposta de relacionamento', where: 'Entre fontes', body: 'CRM.customer_id → ERP.COD_CLIENTE · confiança 94%', to: '/data/model', cta: 'Revisar' },
    REVIEW.some((r) => r.id === 'doc:inv-0319' && !st.decisions[r.id]) && { id: 'a4', tone: 'warning' as const, icon: 'report' as const, title: '3 documentos aguardam revisão humana', where: 'Monthly Invoices', body: 'Campo Service Description com 62% de confiança', to: '/data/sources/invoices', cta: 'Revisar' },
  ].filter(Boolean) as { id: string; tone: 'warning' | 'danger' | 'accent'; icon: 'migrate'; title: string; where: string; body: string; to: string; cta: string }[];
  const feed: ActEv[] = [...st.extraActivity, ...ACTIVITY];

  return (
    <div className="dw-view">
      <ViewHead title="Visão geral" sub="Estado operacional dos dados do workspace · atualizado agora" />
      <div className="dw-pulse" role="list" aria-label="Data Pulse">
        {pulse.map((p) => (
          <button key={p.k} type="button" role="listitem" className="dw-pulse-c" onClick={() => go(p.to)}>
            <span className="dw-pulse-k">{p.k}</span><b className="bw-num">{p.v}</b><span className="dw-pulse-a">{p.a}</span><span className="dw-pulse-b">{p.b}</span>
          </button>
        ))}
      </div>

      <div className="dw-grid2">
        <Section title="Atenção" hint={att.length ? `${att.length} itens` : undefined}>
          {att.length === 0 ? <Empty icon="check" title="Nenhuma decisão aguardando revisão." text="Quando uma fonte mudar ou um gate falhar, o item aparece aqui." /> : (
            <ul className="dw-att">
              {att.map((a) => (
                <li key={a.id}>
                  <button type="button" className={`dw-att-i is-${a.tone}`} onClick={() => go(a.to)}>
                    <span className="dw-att-ico"><Icon name={a.icon} size={16} /></span>
                    <span className="dw-att-t"><b>{a.title}</b><small>{a.where}</small><span>{a.body}</span></span>
                    <span className="dw-att-cta">{a.cta}<Icon name="chevronRight" size={12} /></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {csOpen > 0 && <p className="dw-foot"><Icon name="info" size={12} />{csOpen} {csOpen === 1 ? 'ChangeSet aguarda' : 'ChangeSets aguardam'} aprovação. <button type="button" className="bw-link" onClick={() => go('/data/changes')}>Ver mudanças</button></p>}
        </Section>

        <Section title="Atividade ao vivo" hint="últimos eventos">
          <ul className="dw-feed" aria-live="polite">
            {feed.slice(0, 9).map((e, i) => (
              <li key={`${e.t}-${e.text}-${i}`} className={e.fresh ? 'is-new' : undefined}>
                <button type="button" onClick={() => go(e.to)}><time className="bw-num">{e.t}</time><span><b>{e.text}</b><small>{e.sub}</small></span><Icon name="chevronRight" size={12} /></button>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section title="Ciclo do dado" hint="do primeiro conector à evolução das fontes">
        <ol className="dw-cycle">
          {CYCLE.map((c, i) => {
            const target = ['/data/sources', '/data/sources', '/data/catalog', '/data/catalog', '/data/model', '/data/model', '/data/transformations', '/data/transformations', '/data/enrichment', '/data/quality', '/data/changes', '/data/published', '/data/runs', '/data/changes'][i]!;
            const done = i < 12;
            return <li key={c}><button type="button" className={done ? 'is-done' : 'is-next'} onClick={() => go(target)}><i>{i + 1}</i>{c}</button></li>;
          })}
        </ol>
      </Section>

      <Section title="Fontes por volume" hint="processado nas últimas 12 execuções">
        <div className="dw-mini-sources">
          {sources.filter((s) => ['erp', 'crm', 'telemetry', 'salesimport'].includes(s.id)).map((s, i) => (
            <button key={s.id} type="button" onClick={() => go(`/data/sources/${s.id}`)}>
              <span><b>{s.name}</b><small>{s.type}</small></span>
              <Spark data={[...Array(12)].map((_, j) => 40 + ((j * 37 + i * 19) % 55))} />
              <Badge tone={s.health === 'healthy' ? 'success' : 'warning'}>{s.volume}</Badge>
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}
