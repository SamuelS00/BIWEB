import { create } from 'zustand';

/** Estado efêmero de UI (docs/architecture/04 §7.3): tema, densidade, painéis. O documento do dashboard NÃO vive aqui. */
type Theme = 'light' | 'dark';
interface UiState {
  appTheme: Theme | 'system';
  dashTheme: Theme;
  density: 'default' | 'compact';
  aiEnabled: boolean;
  panes: string[];
  set: (p: Partial<Omit<UiState, 'set' | 'togglePane'>>) => void;
  togglePane: (id: string) => void;
}
export const useUi = create<UiState>((set) => ({
  appTheme: 'system', dashTheme: 'light', density: 'default', aiEnabled: true, panes: ['dados', 'inspector'],
  set: (p) => set(p),
  togglePane: (id) => set((s) => ({ panes: s.panes.includes(id) ? s.panes.filter((x) => x !== id) : [...s.panes, id] })),
}));

/** Aplica tema e densidade no <html>. Sem data-theme, os tokens seguem prefers-color-scheme. */
export function applyRootPrefs(s: Pick<UiState, 'appTheme' | 'density'>) {
  const el = document.documentElement;
  if (s.appTheme === 'system') el.removeAttribute('data-theme'); else el.setAttribute('data-theme', s.appTheme);
  el.style.setProperty('--control-md', s.density === 'compact' ? 'var(--control-sm)' : '');
  if (s.density !== 'compact') el.style.removeProperty('--control-md');
}
