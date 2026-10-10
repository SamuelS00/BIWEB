import { useEffect, useRef } from 'react';
import { Banner, Button, Icon } from '@biweb/ui';
import { useDw } from './store';
import { RUNS, type Run, type RunStatus, type Stage } from './ops';
import { nf, compact } from './sample';
import { Empty, Meter, RunBadge, Section, ViewHead, useGo } from './ui';

export function useRunStatus(r: Run): RunStatus { const o = useDw((s) => s.runOverride[r.id]); return (o as RunStatus | undefined) ?? r.status; }

export function RunsView({ id }: { id?: string }) {
  const r = RUNS.find((x) => String(x.id) === id);
  return r ? <RunDetail r={r} /> : <RunList />;
}

function RunRow({ r }: { r: Run }) {
  const go = useGo(), live = useDw((s) => s.live);
  const status = useRunStatus(r);
  const running = r.id === 28497 && status === 'running';
  return (
    <button type="button" role="row" className="dw-tr dw-tr--row dw-runs-grid2" onClick={() => go(`/data/runs/${r.id}`)}>
      <b className="bw-mono">#{r.id}</b><span><b>{r.name}</b><small className="dw-sec2">{r.target}</small></span><span>{r.mode}</span><span className="bw-num">{r.started}</span>
      <span className="bw-num">{running ? 'em andamento' : r.dur}</span>
      <span className="bw-num r">{running ? compact(live.rows) : nf(r.processed)}</span>
      <span className="dw-runst"><RunBadge s={status} />{running && <span className="dw-runbar"><Meter v={live.pct * 100} tone="accent" /></span>}</span>
    </button>
  );
}
function RunList() {
  const st = useDw();
  const failed = RUNS.filter((r) => (st.runOverride[r.id] ?? r.status) === 'failed').length;
  return (
    <div className="dw-view">
      <ViewHead title="Execuções" sub={`${RUNS.length} execuções recentes · ${failed} falhou`} />
      <div className="dw-table" role="table" aria-label="Execuções">
        <div className="dw-tr dw-tr--head dw-runs-grid2" role="row"><span>Run</span><span>Fonte / dataset</span><span>Modo</span><span>Início</span><span>Duração</span><span className="r">Processados</span><span>Status</span></div>
        {RUNS.map((r) => <RunRow key={r.id} r={r} />)}
      </div>
    </div>
  );
}

const ZONES = ['SOURCE', 'RAW', 'STAGING', 'QUARANTINE', 'CURATED', 'SERVING'];
function RunDetail({ r }: { r: Run }) {
  const st = useDw(), go = useGo();
  const status = useRunStatus(r);
  const live = st.live;
  const active = r.id === 28497 && status === 'running';
  const timer = useRef<number>(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const stages: Stage[] = active ? r.stages.map((s, i) => (i === 0 ? { ...s, state: live.pct >= 1 ? 'ok' : 'running', rows: live.rows } : s)) : r.stages;
  const sel = st.sel?.kind === 'stage' && st.sel.extra === String(r.id) ? st.sel.id : null;
  const resume = () => { st.setRunStatus(r.id, 'running'); st.toast(`Run #${r.id} retomada do checkpoint`); timer.current = window.setTimeout(() => st.setRunStatus(r.id, 'completed'), 4000); };
  const retry = () => { st.setRunStatus(r.id, 'running'); st.toast(`Nova tentativa de #${r.id}`); timer.current = window.setTimeout(() => st.setRunStatus(r.id, 'completed'), 4000); };
  const flow = r.flow;
  return (
    <div className="dw-view dw-view--flush">
      <div className="dw-sh">
        <button type="button" className="dw-back" onClick={() => go('/data/runs')}><Icon name="arrowLeft" size={12} />Execuções</button>
        <div className="dw-sh-main"><h2><span className="bw-mono">#{r.id}</span> {r.name}</h2><RunBadge s={status} /><span className="flex-1" />
          {status === 'interrupted' && <Button size="sm" variant="primary" icon="play" onPress={resume}>Retomar</Button>}
          {status === 'failed' && <Button size="sm" variant="primary" icon="refresh" onPress={retry}>Tentar novamente</Button>}</div>
        <p className="dw-path">{r.target} · {r.mode} · início {r.started} · duração {active ? 'em andamento' : r.dur}{st.technical ? ` · run_id run_${r.id}_01hx · load ld_${r.id}_a3 · mapping v14 · model v14` : ''}</p>
      </div>
      <div className="dw-pad-v">
        {status === 'failed' && r.error && (
          <Banner tone="danger" action={<span className="dw-banner-a"><Button size="sm" onPress={() => go('/data/quality/orders')}>Inspecionar</Button><Button size="sm" onPress={() => go('/data/quality/orders')}>Abrir quarentena</Button><Button size="sm" isDisabled={st.ai.mode === 'off'} onPress={() => { st.setPane({ rightOpen: true, rTab: 'copilot' }); import('./copilot').then((m) => st.pushChat([{ id: `u${Date.now()}`, role: 'user', text: 'Por que o quality gate falhou?' }, m.reply('explique por que o gate falhou', { section: 'quality', itemId: 'orders' })])); }}>Perguntar ao Copilot</Button></span>}><b>FALHOU · Quality Gate {r.error.gate}</b> · {r.error.text}</Banner>
        )}
        {status === 'interrupted' && <Banner tone="warning" action={<Button size="sm" variant="primary" onPress={resume}>Retomar</Button>}><b>Interrompida.</b> Retomada disponível a partir do último checkpoint: {r.checkpoint}.</Banner>}
        {active && (
          <Section title="Extração em andamento">
            <div className="dw-live-run"><div className="dw-live-n"><b className="bw-num">{nf(live.rows)}</b><span>/ 1.200.000 linhas</span></div><Meter v={live.pct * 100} tone="accent" /><div className="dw-facts"><div className="dw-kv"><span>Velocidade</span><b className="bw-num">72 MB/s</b></div><div className="dw-kv"><span>Partição</span><b className="bw-num">{live.part} / 12</b></div><div className="dw-kv"><span>Progresso</span><b className="bw-num">{Math.round(live.pct * 100)}%</b></div></div></div>
          </Section>
        )}
        <Section title="Etapas" hint="selecione uma etapa para ver duração, linhas e avisos">
          <ol className="dw-stages">{stages.map((s) => (
            <li key={s.id}><button type="button" className={`dw-stage is-${s.state}${sel === s.id ? ' is-on' : ''}`} onClick={() => st.select({ kind: 'stage', id: s.id, extra: String(r.id) })}>
              <span className="dw-stage-i">{s.state === 'ok' ? '✓' : s.state === 'running' ? '◌' : s.state === 'failed' ? '✕' : s.state === 'skipped' ? '–' : '○'}</span><b>{s.name}</b><small className="bw-num">{s.state === 'pending' || s.state === 'skipped' ? '—' : s.dur}</small>{s.warn > 0 && <small className="dw-warn">{s.warn} aviso</small>}</button></li>))}</ol>
        </Section>
        {flow ? (
          <Section title="Volume do fluxo de dados" hint="zonas do pipeline">
            <ol className="dw-zones">{flow.map((z, i) => (<li key={z.zone} className={z.zone === 'QUARANTINE' ? 'is-q' : ''}><span>{z.zone}</span><b className="bw-num">{compact(z.rows)}</b><i style={{ width: `${(z.rows / flow[0]!.rows) * 100}%` }} />{i < flow.length - 1 && <Icon name="chevronDown" size={12} />}</li>))}</ol>
            <p className="dw-muted">As zonas {ZONES.join(' → ')} ficam visíveis aqui, na Linhagem e nos detalhes técnicos.</p>
          </Section>
        ) : !active && status === 'completed' && <Empty icon="play" title="Execução concluída" text="Sem perdas de linhas entre as zonas." />}
      </div>
    </div>
  );
}
