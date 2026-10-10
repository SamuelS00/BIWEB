import { useState } from 'react';
import { Badge, Banner, Button, Icon } from '@biweb/ui';
import { allChangeSets, statusOf, useDw } from './store';
import { CHANGE_LABEL, DRIFT, type ChangeSet, type ChangeStatus } from './ops';
import { ChangeBadge, Chip, ClassBadge, Empty, RiskBadge, Section, Tabs2, ViewHead, useGo } from './ui';

export function ChangesView({ id }: { id?: string }) {
  const st = useDw();
  const cs = allChangeSets(st.extraCs).find((c) => c.id === id);
  return cs ? <ChangeDetail cs={cs} /> : <ChangeList />;
}

function ChangeList() {
  const st = useDw(), go = useGo();
  const [f, setF] = useState<ChangeStatus | 'all'>('all');
  const all = allChangeSets(st.extraCs);
  const list = all.filter((c) => f === 'all' || statusOf(c, st.csStatus) === f);
  const total = (c: ChangeSet) => Object.values(c.impact).reduce((s, x) => s + x, 0);
  const drift = all.find((c) => c.id === 'CS-183');
  const driftOpen = drift && statusOf(drift, st.csStatus) === 'proposed';
  const [keep, setKeep] = useState(false);
  return (
    <div className="dw-view">
      <ViewHead title="Mudanças" sub="Toda alteração estrutural passa por proposta, aprovação e aplicação" />
      {driftOpen && (
        <Section title="Schema drift detectado" hint={DRIFT.where} className="dw-drift">
          <div className="dw-drift-b">
            <ul className="dw-diff">{DRIFT.fields.map((f2) => <li key={f2.name} className={f2.op === '+' ? 'is-add' : f2.op === '-' ? 'is-del' : 'is-mod'}><b>{f2.op}</b><span className="bw-mono">{f2.name}</span><small>{f2.note}</small><ClassBadge c={f2.cls} /></li>)}</ul>
            <div className="dw-rename"><b>Possível renomeação</b><p><span className="bw-mono dw-del">{DRIFT.rename.removed}</span> <Icon name="arrowRight" size={12} /> <span className="bw-mono dw-add">{DRIFT.rename.added}</span><Badge tone="accent">Similaridade de fingerprint {DRIFT.rename.sim}%</Badge></p>
              <Button size="sm" variant={keep ? 'default' : 'primary'} icon={keep ? 'check' : undefined} onPress={() => { setKeep(true); st.toast('Mapeamento preservado após a renomeação'); }}>{keep ? 'Mapeamento preservado' : 'Preservar mapeamento'}</Button></div>
            <div><b>Impacto</b><ul className="dw-bul">{DRIFT.affected.map((a) => <li key={a}>{a}</li>)}</ul></div>
          </div>
          <div className="dw-hyp-a dw-pad"><Button size="sm" variant="primary" onPress={() => go('/data/changes/CS-183')}>Abrir ChangeSet CS-183</Button></div>
        </Section>
      )}
      <div className="dw-chips" role="group" aria-label="Filtrar por status"><Chip on={f === 'all'} onClick={() => setF('all')} n={all.length}>Todos</Chip>{(['draft', 'proposed', 'approved', 'applied', 'rejected'] as const).map((s) => <Chip key={s} on={f === s} onClick={() => setF(s)} n={all.filter((c) => statusOf(c, st.csStatus) === s).length}>{CHANGE_LABEL[s]}</Chip>)}</div>
      {list.length === 0 ? <Empty icon="migrate" title="Nenhum ChangeSet neste estado" text="Propostas do Copilot e mudanças de schema aparecem aqui." /> : (
        <div className="dw-table" role="table" aria-label="ChangeSets">
          <div className="dw-tr dw-tr--head dw-cs-grid" role="row"><span>ID</span><span>Título</span><span>Tipo</span><span>Risco</span><span className="r">Objetos afetados</span><span>Criado</span><span>Status</span></div>
          {list.map((c) => <button key={c.id} type="button" role="row" className="dw-tr dw-tr--row dw-cs-grid" onClick={() => go(`/data/changes/${c.id}`)}><b className="bw-mono">{c.id}</b><span>{c.title}</span><span className="dw-sec2">{c.type}</span><RiskBadge r={c.risk} /><span className="bw-num r">{total(c)}</span><span className="dw-sec2">{c.created}</span><ChangeBadge s={statusOf(c, st.csStatus)} /></button>)}
        </div>
      )}
    </div>
  );
}

type CTab = 'summary' | 'diff' | 'mappings' | 'quality' | 'impact' | 'history';
function ChangeDetail({ cs }: { cs: ChangeSet }) {
  const st = useDw(), go = useGo();
  const [tab, setTab] = useState<CTab>('summary');
  const status = statusOf(cs, st.csStatus);
  const hist = [...cs.history, ...(st.csHistory[cs.id] ?? [])];
  const act = (s: ChangeStatus, note: string, toast: string) => { st.setChange(cs.id, s, note); st.toast(toast); };
  const i = cs.impact;
  const failing = cs.quality.filter((q) => !q.ok);
  return (
    <div className="dw-view dw-view--flush">
      <div className="dw-sh">
        <button type="button" className="dw-back" onClick={() => go('/data/changes')}><Icon name="arrowLeft" size={12} />Mudanças</button>
        <div className="dw-sh-main"><h2><span className="bw-mono">{cs.id}</span> {cs.title}</h2><ChangeBadge s={status} /><RiskBadge r={cs.risk} /><span className="flex-1" />
          {status === 'proposed' && <><Button size="sm" variant="ghost" onPress={() => act('rejected', 'Rejeitado', `${cs.id} rejeitado`)}>Rejeitar</Button><Button size="sm" onPress={() => act('draft', 'Alterações solicitadas', 'Alterações solicitadas ao autor')}>Solicitar alterações</Button><Button size="sm" variant="primary" icon="check" onPress={() => act('approved', 'Aprovado', `${cs.id} aprovado`)}>Aprovar</Button></>}
          {status === 'approved' && <Button size="sm" variant="primary" icon="play" onPress={() => act('applied', 'Aplicado e publicado', `${cs.id} aplicado`)}>Aplicar mudança</Button>}
          {status === 'draft' && <Button size="sm" variant="primary" onPress={() => act('proposed', 'Enviado para revisão', `${cs.id} enviado para revisão`)}>Propor</Button>}</div>
        <p className="dw-path">{cs.type} · criado {cs.created} por {cs.author}{st.technical ? ` · changeset_id cs_${cs.id.slice(3)}_01hx` : ''}</p>
        <Tabs2<CTab> label="Seções do ChangeSet" value={tab} onChange={setTab} tabs={[{ id: 'summary', label: 'Resumo' }, { id: 'diff', label: 'Diff do modelo' }, { id: 'mappings', label: 'Mapeamentos', n: cs.mappings.length }, { id: 'quality', label: 'Qualidade' }, { id: 'impact', label: 'Impacto' }, { id: 'history', label: 'Histórico', n: hist.length }]} />
      </div>
      <div className="dw-pad-v">
        <div className="dw-flowsteps" aria-label="Fluxo da mudança">{(['proposed', 'approved', 'applied'] as const).map((s, k) => <span key={s} className={`${['proposed', 'approved', 'applied'].indexOf(status) >= k ? 'is-done' : ''}${status === s ? ' is-now' : ''}`}><i>{k + 1}</i>{['Propor', 'Aprovar', 'Aplicar'][k]}</span>)}</div>
        {status === 'rejected' && <Banner tone="danger">Rejeitado. Nenhuma alteração foi aplicada.</Banner>}
        {tab === 'summary' && (<><p className="dw-p">{cs.summary}</p>{failing.length > 0 && <Banner tone="warning">{failing.length} verificação(ões) de qualidade exigem atenção antes de aplicar: {failing.map((f) => f.name).join('; ')}.</Banner>}<div className="dw-cards dw-cards--sm"><div className="dw-card"><span className="dw-k">Modelos</span><b className="bw-num">{i.models}</b></div><div className="dw-card"><span className="dw-k">Mapeamentos</span><b className="bw-num">{i.mappings}</b></div><div className="dw-card"><span className="dw-k">Datasets</span><b className="bw-num">{i.datasets}</b></div><div className="dw-card"><span className="dw-k">Relatórios</span><b className="bw-num">{i.reports}</b></div></div></>)}
        {tab === 'diff' && cs.diff.map((d) => (
          <Section key={d.entity} title={d.entity}><ul className="dw-diff">{d.changes.map((c) => <li key={c.text} className={c.op === '+' ? 'is-add' : c.op === '-' ? 'is-del' : 'is-mod'}><b>{c.op}</b><span className="bw-mono">{c.text}</span><ClassBadge c={c.cls} /></li>)}</ul></Section>))}
        {tab === 'mappings' && (cs.mappings.length ? <ul className="dw-hits">{cs.mappings.map((m) => <li key={m}><button type="button" onClick={() => go('/data/transformations')}><Icon name="sliders" size={12} /><b>{m}</b><Icon name="chevronRight" size={12} /></button></li>)}</ul> : <Empty title="Sem mapeamentos afetados" text="Esta mudança não altera mapeamentos." />)}
        {tab === 'quality' && <ul className="dw-checks">{cs.quality.map((q) => <li key={q.name} className={q.ok ? 'is-ok' : 'is-bad'}><Icon name={q.ok ? 'check' : 'warning'} size={12} />{q.name}</li>)}</ul>}
        {tab === 'impact' && (
          <>
            <div className="dw-impact">{([['Modelos', i.models], ['Mapeamentos', i.mappings], ['Datasets', i.datasets], ['Relatórios', i.reports], ['Mapas', i.maps], ['Fluxos', i.workflows]] as const).map(([l, n]) => <div key={l}><b className="bw-num">{n}</b><span>{l}</span></div>)}</div>
            <ul className="dw-hits">{cs.affected.map((a) => <li key={a.name}><button type="button" onClick={() => go(a.to)}><Badge tone="accent">{a.kind}</Badge><b>{a.name}</b><Icon name="chevronRight" size={12} /></button></li>)}</ul>
          </>
        )}
        {tab === 'history' && <ol className="dw-timeline">{hist.map((h, k) => <li key={k}><time>{h.at}</time><b>{h.who}</b><span>{h.what}</span></li>)}</ol>}
      </div>
    </div>
  );
}
