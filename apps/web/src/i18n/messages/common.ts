import type { Locale } from '../locales';

/** Textos compartilhados por várias telas. Ids sempre com o prefixo do domínio (`common.`). */
const pt = {
  'common.or': 'ou',
  'common.notifications': '{count, plural, one {Notificação · # nova} other {Notificações · # novas}}',
  'common.live': 'AO VIVO',
} as const;

export const common = {
  'pt-BR': pt,
  en: {
    'common.or': 'or',
    'common.notifications': '{count, plural, one {Notifications · # new} other {Notifications · # new}}',
    'common.live': 'LIVE',
  },
  es: {
    'common.or': 'o',
    'common.notifications': '{count, plural, one {Notificación · # nueva} other {Notificaciones · # nuevas}}',
    'common.live': 'EN VIVO',
  },
} satisfies Record<Locale, Record<keyof typeof pt, string>>;
