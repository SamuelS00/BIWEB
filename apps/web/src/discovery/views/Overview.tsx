import { Icon, type IconName } from '@biweb/ui';
import { CONFLICTS, FLOW, stamp } from '../data/seed';
import { fmtK, stats } from '../data/derive';
import { Empty, Section, ViewHead, dpath, useGo, useTicker } from '../ui';
import { useDs } from '../store';

/** External Intelligence Pulse: faixa compacta + o que exige atenção + atividade ao vivo + funil de inteligência. */
export function Overview() {
  const go = useGo();
  const st = useDs();
  const s = stats({ resolved: st.resolved, proposals: st.proposals, extraMissions: st.missions.length - 12 });
  const nObs = useTicker(s.observationsWeek);
  const strip: { k: string; v: string | number; a: string; to: string }[] = [
    { k: 'Research Missions', v: s.missions, a: 'active', to: dpath('missions') },
    { k: 'Sources', v: s.sources, a: 'monitored', to: dpath('sources') },
    { k: 'Observations', v: fmtK(nObs), a: 'this week', to: dpath('observations') },
    { k: 'Relevant Changes', v: s.changesWeek, a: 'this week', to: dpath('changes') },
    { k: 'Conflicts', v: s.conflicts, a: s.conflicts === 1 ? 'open' : 'open', to: dpath('conflicts') },
    { k: 'Enrichment Proposals', v: s.proposals, a: 'for LDE review', to: dpath('datasets', 'enrichment') },
  ];
  const cf1 = CONFLICTS.find((c) => c.id === 'cf1')!;
  const att = [
    { id: 'a1', tone: 'warning', icon: 'timeline' as IconName, title: 'Competitor pricing changed', where: 'Power BI · Pricing page · detected 34 min ago', body: 'Power BI Pro: $10 → $14/user/month', to: dpath('changes', 'c-pbi-price'), cta: 'Review change' },
    { id: 'a2', tone: 'accent', icon: 'bolt' as IconName, title: 'New capability discovered', where: 'Company A · Realtime anomaly detection', body: 'Evidence: official documentation + release notes', to: dpath('evidence', 'p-coa-rad'), cta: 'Open evidence' },
    !st.resolved.cf1 && { id: 'a3', tone: 'danger', icon: 'warning' as IconName, title: 'Conflicting information', where: `${cf1.entity} · ${cf1.field}`, body: `Official site ${cf1.a.value} offices vs. public dataset ${cf1.b.value}`, to: dpath('conflicts', 'cf1'), cta: 'Review conflict' },
  ].filter(Boolean) as { id: string; tone: string; icon: IconName; title: string; where: string; body: string; to: string; cta: string }[];
  const feed = [
    { t: stamp(0).slice(11), text: 'Source checked', sub: 'companya.com/pricing', to: dpath('sources', 's-coa-pricing') },
    { t: stamp(1).slice(11), text: '18 pages discovered', sub: 'Fiber Network Market Brazil', to: dpath('runs', 'DR-2841') },
    { t: stamp(2).slice(11), text: '4 observations extracted', sub: 'Annual Report 2025.pdf', to: dpath('observations') },
    { t: stamp(4).slice(11), text: 'Watchlist completed', sub: 'BI Competitors · 12 relevant changes', to: dpath('watchlists', 'w1') },
    { t: stamp(7).slice(11), text: 'Enrichment proposal generated', sub: 'Nova Telecom Ltda. · match 98%', to: dpath('datasets', 'enrichment') },
  ];
  const max = FLOW[0][1];
  return (
    <div className="dw-view">
      <ViewHead title="Overview" sub="External Intelligence Pulse · what we discovered, where it came from, how much we trust it and what changed" />
      <div className="ds-strip" role="list" aria-label="External Intelligence Pulse">
        {strip.map((p) => <button key={p.k} type="button" role="listitem" onClick={() => go(p.to)}><small>{p.k}</small><b className="bw-num">{p.v}</b><span>{p.a}</span></button>)}
      </div>
      <div className="dw-grid2">
        <Section title="Attention" hint={att.length ? `${att.length} items` : undefined}>
          {att.length === 0 ? <Empty icon="check" title="No relevant changes detected." text="When a source changes or evidence conflicts, it shows up here." /> : (
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
        <Section title="Live activity" hint="last events">
          <ul className="dw-feed" aria-live="polite">
            {feed.map((e) => <li key={e.text}><button type="button" onClick={() => go(e.to)}><time className="bw-num">{e.t}</time><span><b>{e.text}</b><small>{e.sub}</small></span><Icon name="chevronRight" size={12} /></button></li>)}
          </ul>
        </Section>
      </div>
      <Section title="Intelligence flow" hint="discover → acquire → extract → verify → connect → deliver">
        <div className="ds-flow" role="list">
          {FLOW.map(([k, n]) => <div key={k} role="listitem"><small>{k}</small><b className="bw-num">{n}</b><i style={{ width: `${(n / max) * 100}%` }} /></div>)}
        </div>
        <p className="dw-foot"><Icon name="info" size={12} />The BDE discovers. Only validated, approved enrichment reaches the LDE, and only then can the BCE build from it.</p>
      </Section>
    </div>
  );
}
