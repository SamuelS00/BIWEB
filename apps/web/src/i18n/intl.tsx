import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { IntlProvider, useIntl } from 'react-intl';
import { useUi } from '../state/ui-store';
import { MESSAGES, type MessageId } from './catalog';
import { createFormatters, type Formatters } from './format';
import { DEFAULT_LOCALE, type Locale } from './locales';

/** Idioma ativo. Troca em runtime: o `IntlProvider` re-renderiza as telas sem recarregar a aplicação. */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useUi((s) => s.locale);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  return (
    <IntlProvider locale={locale} messages={MESSAGES[locale]} defaultLocale={DEFAULT_LOCALE} onError={onIntlError}>
      {children}
    </IntlProvider>
  );
}

/** Em desenvolvimento, registra chaves ausentes e erros de formatação. Em produção o fallback já cobre a falta. */
function onIntlError(err: { message: string }) {
  if (import.meta.env.DEV) console.warn(`[i18n] ${err.message}`);
}

export function useLocale(): Locale {
  return useIntl().locale as Locale;
}

export type TranslateValues = Record<string, string | number | boolean | null | undefined | Date>;
export type T = (id: MessageId, values?: TranslateValues) => string;

/** Textos de interface: `t('common.or')` ou `t('common.notifications', { count: 2 })`. Ids tipados pelo catálogo. */
export function useT(): T {
  const intl = useIntl();
  return useCallback((id, values) => intl.formatMessage({ id }, values) as string, [intl]);
}

/** Formatadores (número, moeda, data, tempo relativo, duração) já ligados ao idioma atual. */
export function useFormat(): Formatters {
  const locale = useLocale();
  return useMemo(() => createFormatters(locale), [locale]);
}
