import { useEffect, useSyncExternalStore } from 'react';
import { Icon } from '@biweb/ui';
import { frac } from '../routes/maps/base';
import { getTable } from '../data/registry';
import type { Row } from '../data/types';
import type { Comp, DemoState } from '../editor/doc';
import { useEditor } from '../editor/store';

/* ───────────── relógio de tempo real: um só timer para todos os widgets LIVE ───────────── */
let tick = 0, timer: ReturnType<typeof setInterval> | undefined, users = 0;
const subs = new Set<() => void>();
const subscribe = (fn: () => void) => { subs.add(fn); return () => { subs.delete(fn); }; };
function start() { if (!timer) timer = setInterval(() => { tick++; subs.forEach((f) => f()); }, 2000); }
/** Ticks every 2 s while at least one live widget is mounted. Returns 0 for widgets that are not live. */
export function useLiveTick(live?: boolean): number {
  const value = useSyncExternalStore(subscribe, () => tick);
  useEffect(() => { if (!live) return; users++; start(); return () => { users--; if (!users && timer) { clearInterval(timer); timer = undefined; } }; }, [live]);
  return live ? value : 0;
}
export const liveAgo = (t: number) => `há ${Math.max(1, (t % 3) + 1)} s`;
const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0) / 4294967296; };

/** Small random walk over the live measures (utilization, availability, attenuation, latency). Rows that moved are flagged for highlight. */
export function liveRows(rows: Row[], ds: string, table: string, t: number): Row[] {
  if (!t) return rows;
  const fields = getTable(ds, table).fields.filter((f) => f.kind === 'measure' && ['pct', 'db', 'ms'].includes(f.format ?? '') && !f.calc);
  if (!fields.length) return rows;
  return rows.map((r) => {
    const id = String(r.id ?? r.nome ?? ''), h = hash(id); let next: Row | null = null;
    for (const f of fields) {
      const v = Number(r[f.name]); if (!Number.isFinite(v)) continue;
      const wave = Math.sin(t * 0.7 + h * 40) * 0.5 + (frac(t * 3.1 + h * 17) - 0.5), near100 = f.name === 'disponibilidade', d = 1 + wave * (near100 ? 0.0008 : f.format === 'pct' ? 0.012 : 0.04), nv = f.format === 'pct' ? Math.min(100, Math.max(0, v * d)) : v * d;
      (next ??= { ...r })[f.name] = nv;
      if (Math.abs(d - 1) > (near100 ? 0.0004 : 0.012)) next._live = t;
    }
    return next ?? r;
  });
}

const MSG: Record<Exclude<DemoState, 'live'>, { icon: 'warning' | 'lock' | 'clock' | 'refresh'; title: string; text: string }> = {
  loading: { icon: 'refresh', title: 'Carregando dados…', text: 'Consultando o modelo semântico' },
  error: { icon: 'warning', title: 'Não foi possível carregar este visual', text: 'A consulta ao conjunto de dados falhou (timeout de 30 s).' },
  noaccess: { icon: 'lock', title: 'Sem permissão para ver estes dados', text: 'Seu perfil não inclui este conjunto de dados. Peça acesso ao responsável.' },
  stale: { icon: 'clock', title: 'Dados desatualizados', text: 'Última atualização há 3 h 12 min. A próxima carga está agendada.' },
};
/** Loading / error / no permission cover the widget; stale only adds a banner so the (old) data stays readable. */
export function StateOverlay({ state, comp }: { state?: DemoState; comp: Comp }) {
  const mode = useEditor((s) => s.mode);
  if (!state || state === 'live') return null;
  const m = MSG[state];
  const clear = () => useEditor.getState().update(comp.id, (c) => { delete c.props.state; }, 'Limpar estado do widget');
  if (state === 'stale') return <div className="vz-state-banner" role="status"><Icon name={m.icon} size={12} /><span><b>{m.title}</b> · {m.text}</span>{mode === 'edit' && <button type="button" onClick={clear}>Atualizar</button>}</div>;
  return (
    <div className={`vz-state vz-state--${state}`} role={state === 'error' ? 'alert' : 'status'} aria-live="polite">
      {state === 'loading' ? <div className="vz-skel" aria-hidden="true"><i /><i /><i /><i /><i /></div> : <Icon name={m.icon} size={20} />}
      <b>{m.title}</b><span>{m.text}</span>
      {state === 'error' && <button type="button" className="vz-card-link" onClick={clear}>Tentar de novo</button>}
      {state === 'noaccess' && <button type="button" className="vz-card-link" onClick={() => useEditor.getState().toast({ text: 'Solicitação de acesso enviada ao responsável (simulado).', tone: 'info' })}>Solicitar acesso</button>}
    </div>
  );
}
