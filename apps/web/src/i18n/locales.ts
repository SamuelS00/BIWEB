/** Idiomas da interface. Conteúdo do usuário (nomes de relatórios, datasets, métricas) nunca é traduzido. */
export const LOCALES = ['pt-BR', 'en', 'es'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'pt-BR';

/** Nome de cada idioma escrito no próprio idioma: não traduzir. */
export const LOCALE_NAMES: Record<Locale, string> = { 'pt-BR': 'Português', en: 'English', es: 'Español' };

export function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (LOCALES as readonly string[]).includes(v);
}

/**
 * Ordem: preferência salva (escolha explícita do usuário) → idioma do navegador → pt-BR.
 * Idioma do navegador casa por código base: `en-US` → `en`, `es-MX` → `es`, `pt-PT` → `pt-BR`.
 */
export function resolveLocale(saved: unknown, browser: readonly string[] = []): Locale {
  if (isLocale(saved)) return saved;
  for (const tag of browser) {
    if (isLocale(tag)) return tag;
    const base = tag.split('-')[0]?.toLowerCase();
    const match = LOCALES.find((l) => l.split('-')[0] === base);
    if (match) return match;
  }
  return DEFAULT_LOCALE;
}
