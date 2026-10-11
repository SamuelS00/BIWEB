import { createIntl, type IntlShape } from 'react-intl';
import { MESSAGES, type MessageId } from '../../i18n/catalog';
import type { Locale } from '../../i18n/locales';
import { useUi } from '../../state/ui-store';

const cache: Partial<Record<Locale, IntlShape>> = {};

/**
 * Tradutor fora de componentes (data/, store): lê o idioma ativo no momento da chamada.
 * Quem renderiza o resultado já usa `useT()` e re-renderiza ao trocar de idioma; por isso o valor acompanha o idioma.
 * Em componentes, prefira `useT()`.
 */
export function tx(id: MessageId, values?: Record<string, string | number>): string {
  const locale = useUi.getState().locale;
  const intl = (cache[locale] ??= createIntl({ locale, messages: MESSAGES[locale], onError: () => {} }));
  return intl.formatMessage({ id }, values) as string;
}

/** Idioma ativo, para formatadores de data/número fora de componentes. */
export const activeLocale = (): Locale => useUi.getState().locale;
