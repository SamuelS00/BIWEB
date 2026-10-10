import { useEffect, useState } from 'react';
import { Button, Icon } from '@biweb/ui';
import { ANALYSIS_STEPS } from './analysis';
import { platformOf } from './model';
import type { Project } from './model';
import { nf } from './ui';

/** Análise em curso: etapas reais com contagem crescendo (descoberta → modelos → cálculos → visuais → blueprint). */
export function Processing({ project, onDone }: { project: Project; onDone: () => void }) {
  const pl = platformOf(project.platform), s = project.scope;
  const totals = [s.reports, s.datasets, s.measures, s.visuals, 8];
  const [t, setT] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setT((x) => x + 1), 120);
    return () => clearInterval(i);
  }, []);
  /* cada etapa leva ~1,4 s; as contagens sobem em degraus irregulares, como numa leitura de verdade */
  const per = 12, stepNow = Math.min(ANALYSIS_STEPS.length, Math.floor(t / per)), within = (t % per) / per;
  const done = t >= per * ANALYSIS_STEPS.length + 4;
  useEffect(() => { if (done) { const x = setTimeout(onDone, 350); return () => clearTimeout(x); } }, [done]); // eslint-disable-line react-hooks/exhaustive-deps
  const labels = [`Descobrindo ${pl.nouns.reports}`, `Lendo ${pl.nouns.dataset}s`, `Analisando ${pl.dialect === 'DAX' ? 'cálculos DAX' : 'cálculos'}`, 'Mapeando visualizações', 'Construindo o Analytics Blueprint'];
  const units = [pl.nouns.reports, `${pl.nouns.dataset}s`, `${pl.nouns.measure}s`, 'visuais', 'camadas'];
  const found = totals.slice(0, 4).reduce((a, n, i) => a + (i < stepNow ? n : i === stepNow ? Math.round(n * within) : 0), 0);
  return <div className="ms-proc">
    <header><span className="ms-proc-mark"><i /><i /><i /></span><div><h2>Analisando {pl.name}</h2><p>{project.workspace} · somente leitura. O BIWEB lê estrutura e semântica, não apenas a aparência.</p></div><span className="flex-1" /><Button variant="ghost" size="sm" onPress={onDone}>Pular</Button></header>
    <ol className="ms-proc-steps">{ANALYSIS_STEPS.map((a, i) => {
      const n = totals[i] ?? 0, state = i < stepNow ? 'done' : i === stepNow ? 'now' : 'wait', cur = state === 'done' ? n : state === 'now' ? Math.round(n * within) : 0;
      return <li key={a.id} className={`is-${state}`}><span className="ms-proc-ico">{state === 'done' ? <Icon name="check" size={12} /> : state === 'now' ? <i className="ms-spin" /> : <i className="ms-hollow" />}</span>
        <div><b>{labels[i]}</b>{state !== 'wait' && <small>{state === 'done' ? `${nf(n)} ${units[i]}` : `${nf(cur)} / ${nf(n)} ${units[i]}`}</small>}</div>
        {state === 'now' && i < 4 && <span className="ms-prog"><i style={{ width: `${within * 100}%` }} /></span>}</li>;
    })}</ol>
    <aside className="ms-proc-found" aria-live="polite"><span className="bw-label">Encontrado até agora</span>
      <div className="ms-counters">{[['Relatórios', stepNow > 0 ? s.reports : Math.round(s.reports * within)], ['Datasets', stepNow > 1 ? s.datasets : stepNow === 1 ? Math.round(s.datasets * within) : 0], ['Medidas', stepNow > 2 ? s.measures : stepNow === 2 ? Math.round(s.measures * within) : 0], ['Visuais', stepNow > 3 ? s.visuals : stepNow === 3 ? Math.round(s.visuals * within) : 0]].map(([k, v]) => <div key={k as string}><b>{nf(v as number)}</b><small>{k}</small></div>)}</div>
      <small className="wf-muted">{nf(found)} objetos inventariados</small></aside>
  </div>;
}
