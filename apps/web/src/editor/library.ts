import { create } from 'zustand';
import type { ReportDoc } from './doc';
import { seedReports } from './templates';

/** Biblioteca de relatórios do workspace Operações de Rede. Persistida no navegador; os modelos iniciais vêm de templates.ts. */
const KEY = 'biweb.reports.v1';
const load = (): Record<string, ReportDoc> => { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, ReportDoc>; } catch { return {}; } };
const persist = (m: Record<string, ReportDoc>) => { try { localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* quota/privado: segue em memória */ } };

interface LibState {
  docs: ReportDoc[];
  get: (id: string) => ReportDoc | undefined;
  save: (doc: ReportDoc) => void;
  remove: (id: string) => void;
  reset: (id: string) => void;
}
function initial(): ReportDoc[] {
  const saved = load();
  const seeds = seedReports();
  const out = seeds.map((s) => saved[s.id] ?? s);
  for (const d of Object.values(saved)) if (!seeds.some((s) => s.id === d.id)) out.push(d);
  return out;
}
export const useLibrary = create<LibState>((set, get) => ({
  docs: initial(),
  get: (id) => get().docs.find((d) => d.id === id),
  save: (doc) => {
    const docs = get().docs.some((d) => d.id === doc.id) ? get().docs.map((d) => (d.id === doc.id ? doc : d)) : [doc, ...get().docs];
    set({ docs });
    const seeds = new Map(seedReports().map((s) => [s.id, s]));
    persist(Object.fromEntries(docs.filter((d) => seeds.get(d.id) !== d).map((d) => [d.id, d])));
  },
  remove: (id) => { const docs = get().docs.filter((d) => d.id !== id); set({ docs }); persist(Object.fromEntries(docs.map((d) => [d.id, d]))); },
  reset: (id) => { const s = seedReports().find((x) => x.id === id); if (s) get().save(s); },
}));
