import { useState } from 'react';
import { Badge, Button, Icon } from '@biweb/ui';
import { useDw } from './store';
import { GATES, QUALITY, QUARANTINE, type QDataset } from './ops';
import { nf, rng } from './sample';
import { Empty, Kv, Meter, Section, StepList, ViewHead, pct, toneOfQuality, useGo, useSteps } from './ui';

const GATE_TXT = { pass: 'Passou', warn: 'Atenção', fail: 'Falhou' } as const;
const gateTone = (g: 'pass' | 'warn' | 'fail') => (g === 'pass' ? 'success' : g === 'warn' ? 'warning' : 'danger') as 'success' | 'warning' | 'danger';
const DIMS: [keyof QDataset, string][] = [['completeness', 'Completude'], ['validity', 'Validade'], ['uniqueness', 'Unicidade'], ['consistency', 'Consistência'], ['refint', 'Integridade referencial'], ['freshness', 'Frescor'], ['recon', 'Reconciliação']];

export function QualityView({ id }: { id?: string }) {
  const d = QUALITY.find((q) => q.id === id);
  return d ? <QualityDetail d={d} /> : <QualityHome />;
}

function QualityHome() {
  const go = useGo();
  const fixed = useDw((s) => s.quarantine.reprocessed);
  const avg = (k: keyof QDataset) => QUALITY.reduce((s, q) => s + (q[k] as number), 0) / QUALITY.length;
  const total = QUALITY.reduce((s, q) => s + q.issues.length, 0);
  return (
    <div className="dw-view">
      <ViewHead title="Qualidade" sub={`${QUALITY.length} datasets monitorados · ${total} problemas abertos`} />
      <Section title="Saúde geral" hint="sete dimensões, sem depender de uma nota única">
        <div className="dw-dims">{DIMS.map(([k, l]) => { const v = avg(k) + (fixed && k === 'validity' ? 0.3 : 0); return <div key={k} className="dw-dim"><span>{l}</span><b className="bw-num">{pct(v)}</b><Meter v={v} /></div>; })}</div>
      </Section>
      <Section title="Quality gates" hint="três pontos de controle do pipeline">
        <div className="dw-gatecards">{GATES.map((g) => (
          <div key={g.id} className="dw-gatec"><header><b>{g.id}</b><span>{g.name}</span></header><ul>{g.checks.map((c) => <li key={c}><Icon name="check" size={12} />{c}</li>)}</ul>
            <footer>{QUALITY.filter((q) => q[g.id.toLowerCase() as 'g1' | 'g2' | 'g3'] === 'pass').length} passam · {QUALITY.filter((q) => q[g.id.toLowerCase() as 'g1' | 'g2' | 'g3'] !== 'pass').length} com alerta</footer></div>))}</div>
      </Section>
      <Section title="Datasets">
        <div className="dw-table" role="table" aria-label="Qualidade por dataset">
          <div className="dw-tr dw-tr--head dw-q-grid" role="row"><span>Dataset</span><span>Saúde</span><span className="r">Problemas</span><span>G1</span><span>G2</span><span>G3</span><span>Frescor</span><span>Última exec.</span></div>
          {QUALITY.map((q) => {
            const g2 = q.id === 'orders' && fixed ? 'pass' : q.g2;
            return (
              <button key={q.id} type="button" role="row" className="dw-tr dw-tr--row dw-q-grid" onClick={() => go(`/data/quality/${q.id}`)}>
                <b>{q.name}</b><span className="dw-qcell"><Meter v={q.health} /><b className="bw-num">{pct(q.health)}</b></span><span className="bw-num r">{q.issues.length}</span>
                <Badge tone={gateTone(q.g1)}>{GATE_TXT[q.g1]}</Badge><Badge tone={gateTone(g2)}>{GATE_TXT[g2]}</Badge><Badge tone={gateTone(q.g3)}>{GATE_TXT[q.g3]}</Badge><span className="dw-sec2">{q.fresh}</span><span className="bw-num dw-sec2">{q.lastRun}</span>
              </button>);
          })}
        </div>
      </Section>
    </div>
  );
}

function QualityDetail({ d }: { d: QDataset }) {
  const go = useGo(), st = useDw();
  const fixed = st.quarantine.reprocessed && d.id === 'orders';
  const health = d.health + (fixed ? 1.3 : 0);
  const g2 = fixed ? 'pass' : d.g2;
  const gs = [d.g1, g2, d.g3] as const;
  return (
    <div className="dw-view">
      <ViewHead title={d.name} sub={`Qualidade ${pct(health)} · ${d.fresh}`} actions={<Button size="sm" onPress={() => go('/data/quality')}>Todos os datasets</Button>} />
      <div className="dw-dims">{DIMS.map(([k, l]) => { const v = (d[k] as number) + (fixed && k === 'validity' ? 0.9 : 0); return <button key={k} type="button" className="dw-dim" onClick={() => st.toast(`${l}: ${pct(v)}`)}><span>{l}</span><b className="bw-num">{k === 'freshness' && v >= 95 ? 'Saudável' : pct(v)}</b><Meter v={v} /></button>; })}</div>
      <Section title="Quality gates">
        <div className="dw-gatecards">{GATES.map((g, i) => (
          <div key={g.id} className={`dw-gatec is-${gs[i]}`}><header><b>{g.id}</b><span>{g.name}</span><Badge tone={gateTone(gs[i]!)}>{GATE_TXT[gs[i]!]}</Badge></header><ul>{g.checks.map((c) => <li key={c}><Icon name="check" size={12} />{c}</li>)}</ul></div>))}</div>
      </Section>
      <Section title="Problemas" hint={`${d.issues.length}`}>
        {d.issues.length === 0 ? <Empty icon="check" title="Nenhum problema de qualidade detectado" text="Este dataset passou em todos os gates." /> : (
          <ul className="dw-hits">{d.issues.map((i) => { const c = fixed && i.id === 'qi1' ? 31 : i.count; return (
            <li key={i.id}><button type="button" className={st.sel?.kind === 'issue' && st.sel.id === i.id ? 'is-on' : ''} onClick={() => st.select({ kind: 'issue', id: i.id })}><Badge tone={i.sev === 'high' ? 'danger' : i.sev === 'medium' ? 'warning' : 'neutral'}>{i.sev === 'high' ? 'Alta' : i.sev === 'medium' ? 'Média' : 'Baixa'}</Badge><b>{i.title}</b><small className="bw-mono">{i.col}</small><small className="bw-num">{nf(c)}</small></button></li>); })}</ul>)}
      </Section>
      {d.id === 'orders' && <Quarantine />}
      <Reconciliation d={d} />
    </div>
  );
}

function Quarantine() {
  const st = useDw(), go = useGo();
  const q = st.quarantine;
  const [pick, setPick] = useState('cpf');
  const [run, setRun] = useState(false);
  const steps = ['Reaplicando normalizeCpf() às linhas em quarentena', 'Validando dígitos verificadores', 'Reprocessando 811 linhas corrigíveis', 'Publicando em Orders Curated'];
  const at = useSteps(steps.length, 650, run, () => { setRun(false); st.fixQuarantine(); st.toast('811 linhas reprocessadas e publicadas'); });
  const total = q.reprocessed ? QUARANTINE.total - q.fixed : QUARANTINE.total;
  const reasons = QUARANTINE.reasons.map((r) => ({ ...r, n: q.reprocessed && r.id === 'cpf' ? r.n - q.fixed : r.n, date: 0 }));
  const sample = (() => { const r = rng(`q${pick}`); return [...Array(6)].map((_, i) => { const o = 1830000 + Math.floor(r() * 9999); return pick === 'cpf' ? [o, 1000 + i * 37, ['123.456.78', '1234567890', '000.000.000-00', '98765432', '111.111.111-11', '12.345.678'][i]!, 'CPF inválido'] : pick === 'cust' ? [o, 9000 + i, '—', 'Cliente ausente'] : [o, 2000 + i, ['31/02/26', '00/00/00', '10/13/26', '', '2026-1-1x', '32/01/26'][i]!, 'Data inválida']; }); })();
  return (
    <Section title="Quarentena" hint={`${nf(total)} linhas`} actions={<><Button size="sm" onPress={() => go('/data/transformations/map-order')}>Corrigir mapeamento</Button><Button size="sm" onPress={() => st.toast('Regra de qualidade criada (rascunho)')}>Criar regra</Button><Button size="sm" variant="primary" icon="refresh" isDisabled={q.reprocessed || run} onPress={() => setRun(true)}>{q.reprocessed ? 'Reprocessado' : 'Reprocessar'}</Button></>}>
      {run && <div className="dw-pad"><StepList steps={steps} at={at} /></div>}
      {q.reprocessed && <p className="dw-note is-ok"><Icon name="check" size={12} />811 valores corrigidos por normalização e publicados. G2 agora passa com ressalvas; 437 linhas seguem retidas.</p>}
      <div className="dw-quar">
        <ul className="dw-reasons" aria-label="Motivos">{reasons.map((r) => <li key={r.id}><button type="button" className={pick === r.id ? 'is-on' : ''} onClick={() => setPick(r.id)}><span>{r.label}</span><b className="bw-num">{nf(r.n)}</b><i style={{ width: `${(r.n / 842) * 100}%` }} /></button></li>)}</ul>
        <div className="dw-table dw-qprev" role="table" aria-label="Prévia das linhas em quarentena"><div className="dw-tr dw-tr--head dw-qp-grid" role="row"><span>order_id</span><span>customer_id</span><span>valor</span><span>motivo</span></div>
          {sample.map((s, i) => <div key={i} role="row" className="dw-tr dw-qp-grid"><span className="bw-mono">{s[0]}</span><span className="bw-mono">{s[1]}</span><span className="bw-mono">{s[2] || '(vazio)'}</span><span className="dw-warn">{s[3]}</span></div>)}</div>
      </div>
      <p className="dw-muted"><Icon name="info" size={12} /> 811 valores podem ser corrigidos por normalização; as demais ações exigem decisão humana.</p>
    </Section>
  );
}

function Reconciliation({ d }: { d: QDataset }) {
  const diff = d.recon < 100;
  const lost = Math.round(d.rows * (100 - d.recon) / 100);
  return (
    <Section title="Reconciliação" hint="origem × curado">
      <div className="dw-recon">
        <div><small>ORIGEM</small><b className="bw-num">{nf(d.rows)} linhas</b>{d.amount && <span className="bw-num">{d.amount}</span>}</div>
        <Icon name="chevronRight" size={16} />
        <div className={diff ? 'is-diff' : 'is-ok'}><small>CURADO</small><b className="bw-num">{nf(d.rows - lost)} linhas {diff ? <Icon name="warning" size={12} /> : <Icon name="check" size={12} />}</b>{d.amount && <span className="bw-num">{d.amount} {diff ? '≠' : '✓'}</span>}</div>
      </div>
      {diff && <p className="dw-warn dw-pad">Diferença de {nf(lost)} linhas ({pct(100 - d.recon)}): retidas em quarentena ou fora da janela.</p>}
    </Section>
  );
}
void Kv; void toneOfQuality;
