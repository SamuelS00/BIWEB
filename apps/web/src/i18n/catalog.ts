import { DEFAULT_LOCALE, LOCALES, type Locale } from './locales';
import { auth } from './messages/auth';
import { common } from './messages/common';
import { navigation } from './messages/navigation';
import { palette } from './messages/palette';
import { preferences } from './messages/preferences';
import { pulse } from './messages/pulse';

/**
 * Catálogo por domínio. Cada arquivo em `messages/` traz os três idiomas lado a lado e é tipado
 * com `satisfies`: chave faltando ou sobrando em qualquer idioma quebra o typecheck.
 */
export const CATALOG = { common, navigation, preferences, palette, auth, pulse } as const;

type Catalog = typeof CATALOG;
/** Id de mensagem: autocomplete em `t('…')`. Derivado do catálogo, não digitado à mão. */
export type MessageId = { [D in keyof Catalog]: keyof Catalog[D]['pt-BR'] & string }[keyof Catalog];
export type Messages = Record<MessageId, string>;

function flatten(locale: Locale): Partial<Messages> {
  const out: Record<string, string> = {};
  for (const domain of Object.values(CATALOG)) Object.assign(out, domain[locale]);
  return out as Partial<Messages>;
}

const fallback = flatten(DEFAULT_LOCALE);

/**
 * Mensagens prontas por idioma. Idioma sem uma chave cai para pt-BR: o usuário nunca vê o id cru.
 * Em desenvolvimento, `LocaleProvider` registra no console o que faltou (ver `i18n/intl.tsx`).
 */
export const MESSAGES = Object.fromEntries(
  LOCALES.map((l) => [l, { ...fallback, ...flatten(l) } as Messages]),
) as Record<Locale, Messages>;
