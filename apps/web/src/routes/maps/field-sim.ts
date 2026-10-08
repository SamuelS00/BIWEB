import { distanceKm, rng, stations } from './base';
import type { LonLat } from './base';
import { makePath, pathAfter, pathAt, roadPath } from './roads';
import type { Path } from './roads';

/**
 * Field-operations simulator. Pure and seeded: one call to `stepSim` advances the world by a number of
 * simulated minutes (the UI maps 1 real second to 1 simulated minute × the chosen speed).
 */
export type Skill = 'Fibra' | 'Energia' | 'Infra' | 'Atendimento';
export type TeamStatus = 'Disponível' | 'A caminho' | 'No local' | 'Em atendimento' | 'Retornando' | 'Em pausa' | 'Atrasada' | 'Offline';
export type TaskStatus = 'Aberto' | 'A caminho' | 'Em atendimento' | 'Concluído' | 'Escalado' | 'Atrasado';
export type LogKind = 'new' | 'dispatch' | 'arrive' | 'start' | 'done' | 'late' | 'escalate' | 'break' | 'offline' | 'online' | 'return';

export interface Team {
  id: string; name: string; crew: string; vehicle: string; skill: Skill; base: LonLat; baseName: string;
  lon: number; lat: number; heading: number; status: TeamStatus; taskId?: string;
  path?: Path; progress: number; speed: number; workLeft: number; breakAt: number; offlineUntil: number; shown: LonLat;
  done: number; km: number; fuel: number; lastChange: number; late: boolean;
}
export interface Task {
  id: string; kind: string; skill: Skill; priority: 1 | 2 | 3 | 4; bairro: string; lon: number; lat: number;
  createdAt: number; slaMin: number; service: number; status: TaskStatus; teamId?: string; startedAt?: number; doneAt?: number; late: boolean; escalated: boolean; customers: number;
}
export interface LogEntry { id: number; t: number; kind: LogKind; text: string; teamId?: string; taskId?: string }
export interface Sim { t: number; seed: number; rand: () => number; teams: Team[]; tasks: Task[]; log: LogEntry[]; auto: boolean; seq: number; logSeq: number; nextTaskAt: number; km: number }

export const PRIORITY_SLA: Record<number, number> = { 1: 38, 2: 55, 3: 80, 4: 120 };
const KINDS: { kind: string; skill: Skill; priority: 1 | 2 | 3 | 4; service: [number, number]; weight: number; customers: [number, number] }[] = [
  { kind: 'Rompimento de fibra', skill: 'Fibra', priority: 1, service: [16, 30], weight: 14, customers: [180, 1400] },
  { kind: 'Falha de energia · DWDM', skill: 'Energia', priority: 1, service: [14, 26], weight: 10, customers: [320, 2600] },
  { kind: 'Atenuação elevada', skill: 'Fibra', priority: 2, service: [11, 20], weight: 16, customers: [40, 260] },
  { kind: 'Substituição de ONT', skill: 'Atendimento', priority: 3, service: [7, 13], weight: 22, customers: [1, 1] },
  { kind: 'Instalação residencial', skill: 'Atendimento', priority: 4, service: [15, 26], weight: 16, customers: [1, 1] },
  { kind: 'Manutenção preventiva', skill: 'Infra', priority: 3, service: [14, 24], weight: 12, customers: [0, 0] },
  { kind: 'Vistoria de poste', skill: 'Infra', priority: 4, service: [6, 12], weight: 10, customers: [0, 0] },
];
const CALLSIGNS = ['Alfa', 'Bravo', 'Charlie', 'Delta', 'Eco', 'Foxtrot', 'Golf', 'Hotel', 'Índia'];
const CREW = ['R. Lima · T. Prado', 'C. Nunes · A. Rocha', 'M. Ferraz · J. Dias', 'L. Costa · P. Souza', 'F. Alves · D. Melo', 'B. Matos · I. Reis', 'G. Pinto · V. Cruz', 'H. Teles · N. Viana', 'S. Moura · E. Lopes'];
const BASES: [number, Skill][] = [[0, 'Fibra'], [1, 'Energia'], [2, 'Fibra'], [9, 'Atendimento'], [4, 'Infra'], [5, 'Fibra'], [8, 'Atendimento'], [6, 'Energia'], [7, 'Infra']];
const BAIRRO = stations.map((s) => s[0] as string);

export const TEAM_STATUS_TONE: Record<TeamStatus, 'success' | 'accent' | 'warning' | 'danger' | 'neutral'> = {
  'Disponível': 'success', 'A caminho': 'accent', 'No local': 'accent', 'Em atendimento': 'accent', 'Retornando': 'neutral', 'Em pausa': 'neutral', 'Atrasada': 'danger', 'Offline': 'warning',
};
export const clock = (t: number) => { const m = Math.floor(t) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
export const taskStatus = (t: Task): TaskStatus => t.status === 'Concluído' ? 'Concluído' : t.escalated ? 'Escalado' : t.late ? 'Atrasado' : t.status;
export const teamStatus = (t: Team): TeamStatus => t.status === 'A caminho' && t.late ? 'Atrasada' : t.status;

function log(s: Sim, kind: LogKind, text: string, teamId?: string, taskId?: string) {
  s.log.unshift({ id: ++s.logSeq, t: s.t, kind, text, teamId, taskId });
  if (s.log.length > 120) s.log.length = 120;
}
const trafficFactor = (t: number) => { const h = (t / 60) % 24; return (h >= 7 && h < 9.5) || (h >= 17 && h < 19.5) ? .72 : h >= 22 || h < 5 ? 1.2 : 1; };

function newTask(s: Sim, forced?: number): Task {
  const total = KINDS.reduce((n, k) => n + k.weight, 0);
  let pick = s.rand() * total, kind = KINDS[0]!;
  for (const k of KINDS) { pick -= k.weight; if (pick <= 0) { kind = k; break; } }
  if (forced != null) kind = KINDS[forced]!;
  const zone = s.teams[Math.floor(s.rand() * s.teams.length)]!;
  const anchor = [zone.baseName, zone.base[0], zone.base[1]] as const;
  const lon = anchor[1] + (s.rand() - .45) * .07, lat = anchor[2] + (s.rand() - .5) * .05;
  const n = ++s.seq;
  const task: Task = {
    id: `CH-${7100 + n}`, kind: kind.kind, skill: kind.skill, priority: kind.priority, bairro: anchor[0], lon, lat, createdAt: s.t,
    slaMin: PRIORITY_SLA[kind.priority]!, service: kind.service[0] + Math.round(s.rand() * (kind.service[1] - kind.service[0])), status: 'Aberto', late: false, escalated: false,
    customers: kind.customers[0] + Math.round(s.rand() * (kind.customers[1] - kind.customers[0])),
  };
  s.tasks.push(task);
  log(s, 'new', `${task.id} · ${task.kind} em ${task.bairro} (P${task.priority}${task.customers > 1 ? `, ${task.customers} clientes` : ''})`, undefined, task.id);
  return task;
}

function startTrip(s: Sim, team: Team, to: LonLat, seed: number) {
  const path = makePath(roadPath([team.lon, team.lat], to, seed));
  team.path = path; team.progress = 0;
  team.speed = (30 + s.rand() * 20) * trafficFactor(s.t);
}

export function etaMin(team: Team): number | null {
  if (!team.path || team.status === 'No local' || team.status === 'Em atendimento') return team.workLeft > 0 ? team.workLeft : null;
  return (team.path.total - team.progress) / Math.max(5, team.speed) * 60;
}

export function assign(s: Sim, taskId: string, teamId: string): boolean {
  const task = s.tasks.find((x) => x.id === taskId), team = s.teams.find((x) => x.id === teamId);
  if (!task || !team || task.status !== 'Aberto') return false;
  if (!['Disponível', 'Retornando', 'Em pausa'].includes(team.status) || team.taskId) return false;
  task.status = 'A caminho'; task.teamId = team.id; team.taskId = task.id; team.status = 'A caminho'; team.lastChange = s.t;
  startTrip(s, team, [task.lon, task.lat], s.seq + team.done);
  log(s, 'dispatch', `${team.id} ${team.name} despachada para ${task.id} · ETA ${Math.max(1, Math.round(etaMin(team) ?? 0))} min`, team.id, task.id);
  return true;
}

function dispatch(s: Sim) {
  const open = s.tasks.filter((t) => t.status === 'Aberto').sort((a, b) => a.priority - b.priority || a.createdAt - b.createdAt);
  for (const task of open) {
    let best: Team | undefined, bestEta = Infinity;
    for (const team of s.teams) {
      if (team.taskId || !['Disponível', 'Retornando'].includes(team.status)) continue;
      const eta = distanceKm([team.lon, team.lat], [task.lon, task.lat]) / 34 * 60 + (team.skill === task.skill ? 0 : 14);
      if (eta < bestEta) { best = team; bestEta = eta; }
    }
    if (best && (best.skill === task.skill || task.priority <= 2 || task.createdAt + 6 < s.t)) assign(s, task.id, best.id);
  }
}

function advance(s: Sim, dt: number) {
  s.t += dt;
  if (s.t >= s.nextTaskAt) {
    if (s.tasks.filter((x) => x.status !== 'Concluído').length < 16) newTask(s);
    s.nextTaskAt = s.t + 2.2 + s.rand() * 4.6;
  }
  for (const task of s.tasks) {
    if (task.status === 'Concluído') continue;
    const age = s.t - task.createdAt;
    if (!task.late && s.t > task.createdAt + task.slaMin) { task.late = true; const owner = s.teams.find((x) => x.id === task.teamId); if (owner) owner.late = true; log(s, 'late', `${task.id} ultrapassou o SLA de ${task.slaMin} min${task.teamId ? ` (${task.teamId} em rota)` : ' sem equipe atribuída'}`, task.teamId, task.id); }
    if (!task.escalated && task.status === 'Aberto' && age > task.slaMin * .6 && task.priority <= 2) { task.escalated = true; log(s, 'escalate', `${task.id} escalado ao supervisor · sem equipe disponível há ${Math.round(age)} min`, undefined, task.id); }
  }
  for (const team of s.teams) {
    if (team.status === 'Offline' && s.t >= team.offlineUntil) { team.status = team.path ? (team.taskId ? 'A caminho' : 'Retornando') : team.taskId ? 'No local' : 'Disponível'; team.shown = [team.lon, team.lat]; log(s, 'online', `${team.id} reconectada · telemetria restabelecida`, team.id); }
    const live = team.status !== 'Offline';
    if (!live) { moveTeam(s, team, dt); continue; }
    if (team.status === 'Em pausa') { if (s.t >= team.breakAt) { team.status = 'Disponível'; team.breakAt = s.t + 240; team.lastChange = s.t; log(s, 'return', `${team.id} retomou a escala após pausa`, team.id); } continue; }
    if (team.status === 'Disponível' && !team.taskId && s.t >= team.breakAt) { team.status = 'Em pausa'; team.breakAt = s.t + 7 + s.rand() * 4; team.lastChange = s.t; log(s, 'break', `${team.id} ${team.name} em pausa de ${Math.round(team.breakAt - s.t)} min`, team.id); continue; }
    if (['A caminho', 'Retornando'].includes(team.status)) {
      moveTeam(s, team, dt);
      if (team.status === 'A caminho' && s.rand() < .0035 * dt) { team.status = 'Offline'; team.offlineUntil = s.t + 3 + s.rand() * 3; team.shown = [team.lon, team.lat]; log(s, 'offline', `${team.id} sem sinal GPS · última posição mantida`, team.id); }
    } else if (team.status === 'No local') {
      team.status = 'Em atendimento'; team.lastChange = s.t;
      const task = s.tasks.find((x) => x.id === team.taskId); if (task) { task.status = 'Em atendimento'; task.startedAt = s.t; team.workLeft = task.service; log(s, 'start', `${team.id} iniciou o atendimento de ${task.id} · ${task.kind}`, team.id, task.id); }
    } else if (team.status === 'Em atendimento') {
      team.workLeft -= dt;
      if (team.workLeft <= 0) {
        const task = s.tasks.find((x) => x.id === team.taskId);
        if (task) { task.status = 'Concluído'; task.doneAt = s.t; team.done++; log(s, 'done', `${team.id} concluiu ${task.id} em ${Math.round(s.t - task.createdAt)} min${task.late ? ' (fora do SLA)' : ''}`, team.id, task.id); }
        team.taskId = undefined; team.workLeft = 0; team.late = false; team.lastChange = s.t;
        const next = s.auto ? s.tasks.filter((x) => x.status === 'Aberto').sort((a, b) => a.priority - b.priority)[0] : undefined;
        if (next) { team.status = 'Disponível'; assign(s, next.id, team.id); }
        else { team.status = 'Retornando'; startTrip(s, team, team.base, s.seq + team.done); log(s, 'return', `${team.id} retornando à base ${team.baseName}`, team.id); }
      }
    }
  }
  if (s.auto) dispatch(s);
  s.tasks = s.tasks.filter((x) => x.status !== 'Concluído' || s.t - (x.doneAt ?? 0) < 60 * 6);
}

function moveTeam(s: Sim, team: Team, dt: number) {
  if (!team.path) return;
  const km = team.speed * dt / 60;
  team.progress = Math.min(team.path.total, team.progress + km); team.km += km; s.km += km;
  const here = pathAt(team.path, team.progress);
  team.lon = here.lon; team.lat = here.lat; team.heading = here.heading;
  team.fuel = Math.max(8, team.fuel - km * .09);
  if (team.progress >= team.path.total - 1e-6) {
    team.path = undefined;
    if (team.status === 'Retornando') { team.status = 'Disponível'; team.lastChange = s.t; }
    else if (team.taskId) {
      const task = s.tasks.find((x) => x.id === team.taskId);
      team.lastChange = s.t;
      if (team.status !== 'Offline') team.status = 'No local';
      if (task && team.status === 'No local') log(s, 'arrive', `${team.id} chegou ao local de ${task.id} · ${task.bairro}`, team.id, task.id);
    }
  }
}

/** Advance in ≤0.5 min slices so movement and state changes stay smooth at any speed. */
export function stepSim(s: Sim, minutes: number) {
  let left = minutes;
  while (left > 1e-6) { const dt = Math.min(.5, left); advance(s, dt); left -= dt; }
  for (const team of s.teams) if (team.status !== 'Offline') team.shown = [team.lon, team.lat];
}

export function createSim(seed = 3): Sim {
  const rand = rng(seed);
  const teams: Team[] = BASES.map(([idx, skill], i) => {
    const base = stations[idx]!;
    return {
      id: `EQ-${String(i + 1).padStart(2, '0')}`, name: CALLSIGNS[i]!, crew: CREW[i]!, vehicle: `VAN-${101 + i}`, skill, base: [base[1] + .004, base[2] - .003], baseName: base[0],
      lon: base[1] + .004, lat: base[2] - .003, heading: 0, status: 'Disponível', progress: 0, speed: 34, workLeft: 0, breakAt: 60 * 11 + rand() * 90, offlineUntil: 0, shown: [base[1] + .004, base[2] - .003],
      done: Math.floor(rand() * 4), km: 12 + rand() * 40, fuel: 55 + rand() * 40, lastChange: 0, late: false,
    };
  });
  const s: Sim = { t: 7 * 60 + 12, seed, rand, teams, tasks: [], log: [], auto: true, seq: 0, logSeq: 0, nextTaskAt: 7 * 60 + 12, km: 0 };
  newTask(s, 0); newTask(s, 3); newTask(s, 2);
  stepSim(s, 34);
  return s;
}

export interface FieldKpis { open: number; active: number; done: number; late: number; sla: number; avgMin: number; availability: number; km: number; offline: number }
export function fieldKpis(s: Sim): FieldKpis {
  const done = s.tasks.filter((x) => x.status === 'Concluído'), open = s.tasks.filter((x) => x.status !== 'Concluído');
  const within = done.filter((x) => !x.late).length;
  return {
    open: open.length, active: open.filter((x) => x.status === 'Em atendimento' || x.status === 'A caminho').length, done: s.teams.reduce((n, t) => n + t.done, 0),
    late: open.filter((x) => x.late).length, sla: done.length ? Math.round(within / done.length * 100) : 100,
    avgMin: done.length ? Math.round(done.reduce((n, x) => n + (x.doneAt! - x.createdAt), 0) / done.length) : 0,
    availability: Math.round(s.teams.filter((t) => t.status === 'Disponível' || t.status === 'Retornando').length / s.teams.length * 100),
    km: Math.round(s.km * 10) / 10, offline: s.teams.filter((t) => t.status === 'Offline').length,
  };
}
export function remainingRoute(team: Team): LonLat[] { return team.path ? pathAfter(team.path, team.progress) : []; }
