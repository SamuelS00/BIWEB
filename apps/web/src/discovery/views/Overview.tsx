import { Icon, type IconName } from '@biweb/ui';
import { CONFLICTS, FLOW, stamp } from '../data/seed';
import { fmtK, stats } from '../data/derive';
import { Empty, Section, ViewHead, dpath, useGo, useTicker } from '../ui';
import { useDs } from '../store';
import { useT } from '../../i18n/intl';
import type { MessageId } from '../../i18n/catalog';
import { agoT } from '../data/work-i18n';

const FLOW_ID: Record<string, MessageId> = {
  Discover: 'discovery.overview.flow.discover', Acquire: 'discovery.overview.flow.acquire', Extract: 'discovery.overview.flow.extract',
  Verify: 'discovery.overview.flow.verify', Connected: 'discovery.overview.flow.connected', Delivered: 'discovery.overview.flow.delivered',
};

/** External Intelligence Pulse: faixa compacta + o que exige atenção + atividade ao vivo + funil de inteligência. */
export function Overview() {
  const t = useT();
  const go = useGo();
  const st = useDs();
  const s = stats({ resolved: st.resolved, proposals: st.proposals, extraMissions: st.missions.length - 12 });
  const nObs = useTicker(s.observationsWeek);
  const strip: { k: MessageId; v: string | number; a: MessageId; to: string }[] = [
    { k: 'discovery.overview.strip.missions', v: s.missions, a: 'discovery.overview.strip.missionsNote', to: dpath('missions') },
    { k: 'discovery.overview.strip.sources', v: s.sources, a: 'discovery.overview.strip.sourcesNote', to: dpath('sources') },
    { k: 'discovery.overview.strip.observations', v: fmtK(nObs), a: 'discovery.overview.strip.weekNote', to: dpath('observations') },
    { k: 'discovery.overview.strip.changes', v: s.changesWeek, a: 'discovery.overview.strip.weekNote', to: dpath('changes') },
    { k: 'discovery.overview.strip.conflicts', v: s.conflicts, a: 'discovery.overview.strip.conflictsNote', to: dpath('conflicts') },
    { k: 'discovery.overview.strip.proposals', v: s.proposals, a: 'discovery.overview.strip.proposalsNote', to: dpath('datasets', 'enrichment') },
  ];
  const cf1 = CONFLICTS.find((c) => c.id === 'cf1')!;
  const att = [
    { id: 'a1', tone: 'warning', icon: 'timeline' as IconName, title: t('discovery.overview.att.pricingTitle'), where: t('discovery.overview.att.pricingWhere', { ago: agoT(t, 34) }), body: t('discovery.overview.att.pricingBody'), to: dpath('changes', 'c-pbi-price'), cta: t('discovery.overview.att.pricingCta') },
    { id: 'a2', tone: 'accent', icon: 'bolt' as IconName, title: t('discovery.overview.att.capTitle'), where: 'Company A · Realtime anomaly detection', body: t('discovery.overview.att.capBody'), to: dpath('evidence', 'p-coa-rad'), cta: t('discovery.overview.att.capCta') },
    !st.resolved.cf1 && { id: 'a3', tone: 'danger', icon: 'warning' as IconName, title: t('discovery.overview.att.conflictTitle'), where: `${cf1.entity} · ${cf1.field}`, body: t('discovery.overview.att.conflictBody', { a: cf1.a.value, b: cf1.b.value }), to: dpath('conflicts', 'cf1'), cta: t('discovery.overview.att.conflictCta') },
  ].filter(Boolean) as { id: string; tone: string; icon: IconName; title: string; where: string; body: string; to: string; cta: string }[];
  const feed = [
    { t: stamp(0).slice(11), text: t('discovery.overview.feed.sourceChecked'), sub: 'companya.com/pricing', to: dpath('sources', 's-coa-pricing') },
    { t: stamp(1).slice(11), text: t('discovery.overview.feed.pages', { n: 18 }), sub: 'Fiber Network Market Brazil', to: dpath('runs', 'DR-2841') },
    { t: stamp(2).slice(11), text: t('discovery.overview.feed.observations', { n: 4 }), sub: 'Annual Report 2025.pdf', to: dpath('observations') },
    { t: stamp(4).slice(11), text: t('discovery.overview.feed.watchlistDone'), sub: t('discovery.overview.feed.watchlistSub', { name: 'BI Competitors', n: 12 }), to: dpath('watchlists', 'w1') },
    { t: stamp(7).slice(11), text: t('discovery.overview.feed.proposal'), sub: t('discovery.overview.feed.proposalSub', { name: 'Nova Telecom Ltda.', pct: 98 }), to: dpath('datasets', 'enrichment') },
  ];
  const max = FLOW[0][1];
  return (
    <div className="dw-view">
      <ViewHead title={t('discovery.overview.title')} sub={t('discovery.overview.sub')} />
      <div className="ds-strip" role="list" aria-label={t('discovery.overview.pulseAria')}>
        {strip.map((p) => <button key={p.k} type="button" role="listitem" onClick={() => go(p.to)}><small>{t(p.k)}</small><b className="bw-num">{p.v}</b><span>{t(p.a)}</span></button>)}
      </div>
      <div className="dw-grid2">
        <Section title={t('discovery.overview.att.title')} hint={att.length ? t('discovery.overview.att.hint', { n: att.length }) : undefined}>
          {att.length === 0 ? <Empty icon="check" title={t('discovery.overview.att.emptyTitle')} text={t('discovery.overview.att.emptyText')} /> : (
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
        </Section>
        <Section title={t('discovery.overview.feed.title')} hint={t('discovery.overview.feed.hint')}>
          <ul className="dw-feed" aria-live="polite">
            {feed.map((e) => <li key={e.to + e.t}><button type="button" onClick={() => go(e.to)}><time className="bw-num">{e.t}</time><span><b>{e.text}</b><small>{e.sub}</small></span><Icon name="chevronRight" size={12} /></button></li>)}
          </ul>
        </Section>
      </div>
      <Section title={t('discovery.overview.flow.title')} hint={t('discovery.overview.flow.hint')}>
        <div className="ds-flow" role="list">
          {FLOW.map(([k, n]) => <div key={k} role="listitem"><small>{FLOW_ID[k] ? t(FLOW_ID[k]) : k}</small><b className="bw-num">{n}</b><i style={{ width: `${(n / max) * 100}%` }} /></div>)}
        </div>
        <p className="dw-foot"><Icon name="info" size={12} />{t('discovery.overview.flow.foot')}</p>
      </Section>
    </div>
  );
}
