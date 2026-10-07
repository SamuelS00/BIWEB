import { create } from 'zustand';
import type { CopilotMessage } from '@biweb/assistant-ui';

/** Estado efêmero de UI (docs/architecture/04 §7.3): tema, densidade, painéis, Copilot. O documento do dashboard NÃO vive aqui. */
type Theme = 'light' | 'dark';
interface UiState {
  appTheme: Theme | 'system';
  dashTheme: Theme;
  density: 'default' | 'compact';
  aiEnabled: boolean;
  panes: string[];
  copilotOpen: boolean;
  copilotPrompt: { text: string; nonce: number } | null;
  copilotMessages: CopilotMessage[];
  favorites: string[];
  reportsView: 'grid' | 'list';
  paletteOpen: boolean;
  workspace: 'rede' | 'comercial';
  set: (p: Partial<Omit<UiState, 'set' | 'togglePane' | 'toggleFavorite' | 'askCopilot' | 'setCopilotMessages'>>) => void;
  togglePane: (id: string) => void;
  toggleFavorite: (id: string) => void;
  askCopilot: (text: string) => void;
  setCopilotMessages: (fn: (m: CopilotMessage[]) => CopilotMessage[]) => void;
}
const stored = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
const persist = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* armazenamento indisponível */ } };

export const useUi = create<UiState>((set, get) => ({
  appTheme: 'system', dashTheme: 'light', density: 'default', aiEnabled: true, panes: ['dados', 'inspector'],
  copilotOpen: false, copilotPrompt: null, copilotMessages: [],
  favorites: stored('biweb.favorites', ['rpt_visao_executiva', 'rpt_fechamento_set', 'net_operacoes', 'net_geografica']),
  reportsView: stored('biweb.reportsView', 'grid'), paletteOpen: false, workspace: stored('biweb.workspace', 'rede'),
  set: (p) => { set(p); if (p.reportsView) persist('biweb.reportsView', p.reportsView); if (p.workspace) persist('biweb.workspace', p.workspace); },
  togglePane: (id) => set((s) => ({ panes: s.panes.includes(id) ? s.panes.filter((x) => x !== id) : [...s.panes, id] })),
  toggleFavorite: (id) => { const f = get().favorites.includes(id) ? get().favorites.filter((x) => x !== id) : [...get().favorites, id]; persist('biweb.favorites', f); set({ favorites: f }); },
  askCopilot: (text) => set({ copilotOpen: true, copilotPrompt: { text, nonce: Date.now() } }),
  setCopilotMessages: (fn) => set((s) => ({ copilotMessages: fn(s.copilotMessages) })),
}));

/** Aplica tema e densidade no <html>. Sem data-theme, os tokens seguem prefers-color-scheme. */
export function applyRootPrefs(s: Pick<UiState, 'appTheme' | 'density'>) {
  const el = document.documentElement;
  if (s.appTheme === 'system') el.removeAttribute('data-theme'); else el.setAttribute('data-theme', s.appTheme);
  if (s.density === 'compact') el.style.setProperty('--control-md', 'var(--control-sm)'); else el.style.removeProperty('--control-md');
}
/** Base dos assets públicos (funciona com build estático em subcaminho). */
/** No build de página única (artifact), os assets vêm embutidos em window.__BIWEB_ASSETS__ como data: URIs. */
export const asset = (p: string) => {
  const key = p.replace(/^\.?\//, '');
  const inline = (globalThis as { __BIWEB_ASSETS__?: Record<string, string> }).__BIWEB_ASSETS__;
  return inline?.[key] ?? `${import.meta.env.BASE_URL}${key}`;
};
