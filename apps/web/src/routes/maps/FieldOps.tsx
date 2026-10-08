import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { Badge, Button, SegmentedControl, Switch } from '@biweb/ui';
import { assign, clock, createSim, etaMin, fieldKpis, remainingRoute, stepSim, taskStatus, teamStatus, TEAM_STATUS_TONE } from './field-sim';
import type { LogEntry, LogKind, Sim, Task, Team, TeamStatus } from './field-sim';
import { roundedPath } from './roads';
import { pill } from './renderers';
import { useView } from './view';

/** Owns the simulation clock. Components subscribe to it, so only the live parts re-render each tick. */
export class FieldController {
  sim: Sim = createSim(); version = 0; running = true; speed = 1; selected: string | null = null; follow = false;
  private subs = new Set<() => void>(); private timer: number | undefined;
  subscribe = (fn: () => void) => { this.subs.add(fn); return () => { this.subs.delete(fn); }; };
  getVersion = () => this.version;
  emit() { this.version++; this.subs.forEach((f) => f()); }
  start() { this.stop(); this.timer = window.setInterval(() => { if (this.running) { stepSim(this.sim, .25 * this.speed); this.emit(); } }, 250); }
  stop() { if (this.timer) window.clearInterval(this.timer); this.timer = undefined; }
  toggle() { this.running = !this.running; this.emit(); }
  setSpeed(n: number) { this.speed = n; this.emit(); }
  setAuto(on: boolean) { this.sim.auto = on; this.emit(); }
  select(id: string | null) { this.selected = this.selected === id ? null : id; if (!id) this.follow = false; this.emit(); }
  setFollow(on: boolean) { this.follow = on; this.emit(); }
  assign(taskId: string, teamId: string) { const ok = assign(this.sim, taskId, teamId); this.emit(); return ok; }
  reset() { this.sim = createSim(); this.selected = null; this.follow = false; this.emit(); }
}
const FieldContext = createContext<FieldController | null>(null);
export function FieldProvider({ children }: { children: ReactNode }) {
  const [ctl] = useState(() => new FieldController());
  useEffect(() => { ctl.start(); return () => ctl.stop(); }, [ctl]);
  return <FieldContext.Provider value={ctl}>{children}</FieldContext.Provider>;
}
export function useField() {
  const ctl = useContext(FieldContext); if (!ctl) throw new Error('useField outside FieldProvider');
  useSyncExternalStore(ctl.subscribe, ctl.getVersion);
  return ctl;
}

export const TEAM_COLOR: Record<TeamStatus, string> = { 'Disponível': '#46c28b', 'A caminho': '#4aa3f0', 'No local': '#7fb7ff', 'Em atendimento': '#a78bfa', 'Retornando': '#8d9bb5', 'Em pausa': '#c9b36a', 'Atrasada': '#ef5b5b', 'Offline': '#8b8f99' };
const PRIORITY_COLOR: Record<number, string> = { 1: '#ef5b5b', 2: '#f09a3e', 3: '#e8cf4a', 4: '#7f95b8' };
const LOG_STYLE: Record<LogKind, { icon: string; color: string; group: 'ops' | 'alerts' | 'done' }> = {
  new: { icon: '＋', color: '#e8cf4a', group: 'ops' }, dispatch: { icon: '➜', color: '#4aa3f0', group: 'ops' }, arrive: { icon: '⚑', color: '#7fb7ff', group: 'ops' }, start: { icon: '▶', color: '#a78bfa', group: 'ops' },
  done: { icon: '✓', color: '#46c28b', group: 'done' }, late: { icon: '!', color: '#ef5b5b', group: 'alerts' }, escalate: { icon: '▲', color: '#ff8b5b', group: 'alerts' }, break: { icon: '❚❚', color: '#c9b36a', group: 'ops' },
  offline: { icon: '⌀', color: '#8b8f99', group: 'alerts' }, online: { icon: '◉', color: '#46c28b', group: 'ops' }, return: { icon: '↩', color: '#8d9bb5', group: 'ops' },
};

/** Vehicles, routes and service calls drawn in the map's coordinate space. */
export function FieldLayer() {
  const v = useView(), ctl = useField(), sim = ctl.sim;
  const selectedTeam = sim.teams.find((t) => t.id === ctl.selected) ?? sim.teams.find((t) => t.taskId && t.taskId === ctl.selected);
  useEffect(() => { if (ctl.follow && selectedTeam) v.onCamera({ ...v.camera, lon: selectedTeam.shown[0], lat: selectedTeam.shown[1] }); }, [ctl.version]); // eslint-disable-line react-hooks/exhaustive-deps
  const select = (id: string) => (e: React.MouseEvent | React.KeyboardEvent) => { e.stopPropagation(); ctl.select(id); };
  const key = (id: string) => (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ctl.select(id); } };
  const showLabels = v.camera.zoom > 11.4;
  return <g className="mb-field">
    {sim.teams.map((t) => {
      const route = remainingRoute(t); if (route.length < 2 || t.status === 'Offline') return null;
      const status = teamStatus(t), color = TEAM_COLOR[status], chosen = ctl.selected === t.id || ctl.selected === t.taskId;
      const d = roundedPath([[t.lon, t.lat], ...route.slice(1)].map(v.p), 10);
      return <g key={`r-${t.id}`} pointerEvents="none" opacity={chosen || !ctl.selected ? 1 : .35}>
        <path d={d} fill="none" stroke="#070b11" strokeOpacity=".55" strokeWidth={chosen ? 8 : 6} strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} fill="none" stroke={color} strokeWidth={chosen ? 4.2 : 3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={status === 'Retornando' ? '2 7' : undefined} />
        {status !== 'Retornando' && <path className="mb-signal mb-signal-fast" d={d} fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="1.6" strokeDasharray="2 18" strokeLinecap="round" />}
      </g>;
    })}
    {sim.tasks.map((t) => {
      const q = v.p([t.lon, t.lat]), st = taskStatus(t), done = st === 'Concluído', hot = !done && (st === 'Atrasado' || st === 'Escalado' || st === 'Aberto'), color = done ? '#46c28b' : PRIORITY_COLOR[t.priority]!, chosen = ctl.selected === t.id;
      const fade = done ? Math.max(0, 1 - (sim.t - (t.doneAt ?? sim.t)) / 6) : 1; if (fade <= 0) return null;
      return <g key={t.id} className="mb-live mb-task" style={{ transform: `translate(${q.x}px,${q.y}px)`, opacity: fade }} role="button" tabIndex={0} aria-label={`${t.id} ${t.kind} ${st}`} onClick={select(t.id)} onKeyDown={key(t.id)}>
        {hot && <circle r="17" fill={st === 'Aberto' ? color : '#ef5b5b'} opacity=".22" className="mb-pulse" />}
        {chosen && <circle r="16" fill="none" stroke="#fff" strokeWidth="2" />}
        <path d="M0 7 L-8 -3 A9 9 0 1 1 8 -3 Z" fill={color} stroke="#0b1018" strokeWidth="1.6" transform="translate(0 -3)" />
        <text y="-3.5" textAnchor="middle" className="mb-task-n">{done ? '✓' : `P${t.priority}`}</text>
        {showLabels && <text y="17" textAnchor="middle" className="mb-live-label">{t.id}</text>}
        <title>{`${t.id} · ${t.kind} · ${t.bairro} · ${st}`}</title>
      </g>;
    })}
    {sim.teams.map((t) => {
      const q = v.p(t.shown), status = teamStatus(t), color = TEAM_COLOR[status], chosen = ctl.selected === t.id, eta = etaMin(t), off = t.status === 'Offline';
      return <g key={t.id} className="mb-live mb-team" style={{ transform: `translate(${q.x}px,${q.y}px)` }} role="button" tabIndex={0} aria-label={`${t.id} ${t.name} ${status}`} onClick={select(t.id)} onKeyDown={key(t.id)}>
        {(t.status === 'Em atendimento' || status === 'Atrasada') && <circle r="22" fill={color} opacity=".22" className="mb-pulse" />}
        {chosen && <circle r="21" fill="none" stroke="#fff" strokeWidth="2" />}
        <circle r="13.5" fill="#0b1018" stroke={color} strokeWidth="2.6" strokeDasharray={off ? '3 3' : undefined} opacity={off ? .75 : 1} />
        {off ? <text y="4" textAnchor="middle" className="mb-task-n" fill="#aeb3bd">GPS</text> : <g transform={`rotate(${t.heading})`}><path d="M0 -9 L5.5 5 L0 2 L-5.5 5Z" fill={color} /></g>}
        {(showLabels || chosen) && <text y="27" textAnchor="middle" className="mb-live-label">{t.id} · {t.name}</text>}
        {chosen && eta != null && pill(0, -29, `${status}${t.taskId ? ` · ${t.taskId}` : ''} · ${Math.max(1, Math.round(eta))} min`)}
        <title>{`${t.id} ${t.name} · ${status}${t.taskId ? ` · ${t.taskId}` : ''}`}</title>
      </g>;
    })}
  </g>;
}

const fmtSla = (t: Task, now: number) => { const left = t.createdAt + t.slaMin - now; return left >= 0 ? `restam ${Math.ceil(left)} min` : `estourou há ${Math.ceil(-left)} min`; };
function KpiTile({ label, value, tone, note }: { label: string; value: string; tone?: 'danger' | 'success' | 'warning'; note?: string }) {
  return <div className="mb-kpi" title={note}><small>{label}</small><b className={tone ? `tone-${tone}` : ''}>{value}</b>{note && <em>{note}</em>}</div>;
}

/** Dispatch console: KPIs, teams, service calls and the scrolling activity feed. */
export function FieldConsole({ onFocus }: { onFocus: (lon: number, lat: number) => void }) {
  const ctl = useField(), sim = ctl.sim, k = fieldKpis(sim);
  const [tab, setTab] = useState<'teams' | 'tasks'>('teams');
  const [feed, setFeed] = useState<'all' | 'alerts' | 'done'>('all');
  const teams = useMemo(() => [...sim.teams].sort((a, b) => a.id.localeCompare(b.id)), [sim.teams]);
  const open = sim.tasks.filter((t) => t.status !== 'Concluído').sort((a, b) => a.priority - b.priority || a.createdAt - b.createdAt);
  const log = sim.log.filter((l) => feed === 'all' || LOG_STYLE[l.kind].group === feed).slice(0, 40);
  const counts = teams.reduce<Record<string, number>>((m, t) => { const s = teamStatus(t); m[s] = (m[s] ?? 0) + 1; return m; }, {});
  const focusTeam = (t: Team) => { ctl.select(t.id); onFocus(t.shown[0], t.shown[1]); };
  const focusTask = (t: Task) => { ctl.select(t.id); onFocus(t.lon, t.lat); };
  const selected = sim.teams.find((t) => t.id === ctl.selected);
  return <aside className="mb-field-console" aria-label="Central de despacho">
    <header>
      <div><span className={`mb-live-chip${ctl.running ? ' is-live' : ''}`}><i />{ctl.running ? 'AO VIVO' : 'PAUSADO'}</span><h2>Central de despacho</h2></div>
      <div className="mb-sim-clock" aria-label="Horário simulado"><b>{clock(sim.t)}</b><small>{ctl.speed}× · 07 out</small></div>
    </header>
    <div className="mb-field-controls">
      <Button size="sm" icon={ctl.running ? 'chevronDown' : 'play'} onPress={() => ctl.toggle()}>{ctl.running ? 'Pausar' : 'Retomar'}</Button>
      <SegmentedControl label="Velocidade da simulação" value={String(ctl.speed)} onChange={(v) => ctl.setSpeed(Number(v))} options={[{ id: '1', label: '1×' }, { id: '2', label: '2×' }, { id: '4', label: '4×' }]} />
      <Switch isSelected={sim.auto} onChange={(v) => ctl.setAuto(v)}>Despacho automático</Switch>
    </div>
    <div className="mb-kpis">
      <KpiTile label="Abertos" value={String(k.open)} note={`${k.active} em andamento`} />
      <KpiTile label="SLA" value={`${k.sla}%`} tone={k.sla < 70 ? 'danger' : k.sla < 85 ? 'warning' : 'success'} note={`${k.late} fora do prazo`} />
      <KpiTile label="Tempo médio" value={`${k.avgMin}′`} note={`${k.done} concluídos no turno`} />
      <KpiTile label="Livres" value={`${k.availability}%`} tone={k.availability < 15 ? 'warning' : undefined} note={`${k.km.toLocaleString('pt-BR')} km rodados`} />
    </div>
    <div className="mb-status-strip" aria-label="Equipes por estado">{(Object.keys(TEAM_COLOR) as TeamStatus[]).filter((s) => counts[s]).map((s) => <span key={s} title={s}><i style={{ background: TEAM_COLOR[s] }} />{counts[s]} <small>{s}</small></span>)}</div>
    <SegmentedControl label="Lista" value={tab} onChange={setTab} options={[{ id: 'teams', label: `Equipes · ${teams.length}` }, { id: 'tasks', label: `Chamados · ${open.length}` }]} />
    <div className="mb-field-list" role="list">
      {tab === 'teams' ? teams.map((t) => {
        const status = teamStatus(t), eta = etaMin(t), task = sim.tasks.find((x) => x.id === t.taskId), pct = t.path ? Math.round(t.progress / Math.max(.01, t.path.total) * 100) : status === 'Em atendimento' && task ? Math.round((1 - t.workLeft / task.service) * 100) : 0;
        return <div key={t.id} role="listitem" className={`mb-row${ctl.selected === t.id ? ' is-selected' : ''}`}>
          <button onClick={() => focusTeam(t)} aria-label={`Localizar ${t.id}`}>
            <span className="mb-row-badge" style={{ borderColor: TEAM_COLOR[status], color: TEAM_COLOR[status] }}>{t.id.slice(3)}</span>
            <span className="mb-row-main"><b>{t.name} <small>{t.skill} · {t.vehicle}</small></b><small>{task ? `${task.id} · ${task.kind}` : status === 'Em pausa' ? 'Pausa regulamentar' : `Base ${t.baseName}`}{eta != null && task ? ` · ${Math.max(1, Math.round(eta))} min` : ''}</small></span>
            <Badge tone={TEAM_STATUS_TONE[status]}>{status}</Badge>
          </button>
          {(t.path || status === 'Em atendimento') && <div className="mb-progress" aria-hidden="true"><i style={{ width: `${Math.min(100, pct)}%`, background: TEAM_COLOR[status] }} /></div>}
        </div>;
      }) : open.length ? open.map((t) => {
        const st = taskStatus(t), late = t.late;
        return <div key={t.id} role="listitem" className={`mb-row${ctl.selected === t.id ? ' is-selected' : ''}`}>
          <button onClick={() => focusTask(t)} aria-label={`Localizar ${t.id}`}>
            <span className="mb-row-badge" style={{ borderColor: PRIORITY_COLOR[t.priority], color: PRIORITY_COLOR[t.priority] }}>P{t.priority}</span>
            <span className="mb-row-main"><b>{t.kind}</b><small>{t.id} · {t.bairro}{t.customers > 1 ? ` · ${t.customers} clientes` : ''} · <span className={late ? 'tone-danger' : ''}>{fmtSla(t, sim.t)}</span></small></span>
            <Badge tone={st === 'Aberto' ? 'warning' : st === 'Atrasado' || st === 'Escalado' ? 'danger' : 'accent'}>{st}</Badge>
          </button>
          {t.status === 'Aberto' && <label className="mb-assign"><span className="sr-only">Atribuir equipe a {t.id}</span><select value="" onChange={(e) => { if (e.target.value) ctl.assign(t.id, e.target.value); }}><option value="">Atribuir equipe…</option>{teams.filter((x) => !x.taskId && ['Disponível', 'Retornando', 'Em pausa'].includes(x.status)).map((x) => <option key={x.id} value={x.id}>{x.id} {x.name} · {x.skill}</option>)}</select></label>}
        </div>;
      }) : <p className="mb-helper">Nenhum chamado aberto. Novos chamados chegam continuamente.</p>}
    </div>
    {selected && <div className="mb-selection-bar"><span><b>{selected.id} {selected.name}</b> · {selected.crew}</span><span>Combustível {Math.round(selected.fuel)}% · {selected.done} atend. · {selected.km.toFixed(1)} km</span><Switch isSelected={ctl.follow} onChange={(v) => ctl.setFollow(v)}>Seguir equipe</Switch></div>}
    <div className="mb-feed-head"><b>Atividade <small>· ao vivo</small></b><SegmentedControl label="Filtro do feed" value={feed} onChange={setFeed} options={[{ id: 'all', label: 'Tudo' }, { id: 'alerts', label: 'Alertas' }, { id: 'done', label: 'Concluídos' }]} /></div>
    <ol className="mb-feed" role="log" aria-label="Feed de atividade">{log.map((l: LogEntry) => <li key={l.id} style={{ ['--c' as string]: LOG_STYLE[l.kind].color }}><time>{clock(l.t)}</time><i>{LOG_STYLE[l.kind].icon}</i><span>{l.text}</span></li>)}{!log.length && <li className="mb-feed-empty">Sem eventos neste filtro.</li>}</ol>
  </aside>;
}

export function FieldHud() {
  const ctl = useField(), k = fieldKpis(ctl.sim);
  return <div className="mb-field-hud" aria-hidden="true"><span className={`mb-live-chip${ctl.running ? ' is-live' : ''}`}><i />{clock(ctl.sim.t)}</span><span>{ctl.sim.teams.length} equipes</span><span>{k.open} chamados</span>{k.late > 0 && <span className="is-bad">{k.late} fora do SLA</span>}</div>;
}
