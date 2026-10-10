import { REVIEW } from './analysis';
import { ITEMS, PROCESSES, REPORTS, reportId } from './data';
import type { Project, ProjState, Strategy } from './model';

/** Estratégia efetiva: visual → página → relatório → projeto. */
export function effectiveStrategy(ps: ProjState, project: Project, id: string): { value: Strategy; from: string } {
  const it = ITEMS.get(id); const chain: string[] = [];
  let cur = it; while (cur) { chain.push(cur.id); cur = cur.parent ? ITEMS.get(cur.parent) : undefined; }
  for (const c of chain) { const s = ps.strategies[c]; if (s) return { value: s, from: c === id ? 'item' : ITEMS.get(c)?.name ?? c }; }
  return { value: project.strategy, from: 'projeto' };
}

/* Derivados usados por várias telas. */
export const pendingReview = (ps: ProjState) => REVIEW.filter((r) => !ps.review[r.id]);
export function readiness(ps: ProjState) {
  const pend = pendingReview(ps), blocked = (k: 'report' | 'map' | 'workflow' | 'model') => new Set(pend.flatMap((r) => r.blocks.filter((b) => b.kind === k).map((b) => b.id)));
  const out = (k: 'report' | 'map' | 'workflow' | 'model', total: number) => ({ total, ready: Math.max(0, total - blocked(k).size) });
  const fixedDataModels = 4;
  return { reports: out('report', REPORTS.length - ps.excluded.filter((e) => e.startsWith('rep:')).length), maps: out('map', 3), workflows: out('workflow', PROCESSES.length), models: out('model', fixedDataModels), pending: pend.length, failed: 2 - Object.keys(ps.checksResolved).filter((k) => ['c13', 'c32'].includes(k)).length };
}
export const strategyCounts = (ps: ProjState, project: Project) => {
  const t: Record<Strategy, number> = { fidelity: 0, native: 0, modernize: 0 };
  for (const r of REPORTS) t[effectiveStrategy(ps, project, reportId(r.id)).value]++;
  return t;
};
