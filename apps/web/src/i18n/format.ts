import type { Locale } from './locales';

/**
 * Formatadores por locale, sem `replace` manual. Locale controla separadores, ordem e nomes;
 * moeda e timezone são parâmetros independentes do idioma (uma empresa em inglês pode faturar em BRL).
 * Sem `timeZone` explícito, datas usam o fuso do navegador, como antes da internacionalização.
 */
export interface Formatters {
  number: (value: number, options?: Intl.NumberFormatOptions) => string;
  integer: (value: number) => string;
  decimal: (value: number, fractionDigits?: number) => string;
  /** Recebe razão (0,25 → "25%"), como o `Intl`. */
  percent: (ratio: number, fractionDigits?: number) => string;
  /** Símbolo e casas decimais vêm do código ISO (BRL, USD…), separadores vêm do locale. */
  currency: (value: number, currency: string) => string;
  compact: (value: number) => string;
  date: (value: Date | number, timeZone?: string) => string;
  time: (value: Date | number, timeZone?: string) => string;
  dateTime: (value: Date | number, timeZone?: string) => string;
  relative: (value: number, unit: Intl.RelativeTimeFormatUnit) => string;
  /** "há 2 minutos", "2 minutes ago", "hace 2 minutos", escolhendo a unidade pela distância. */
  timeAgo: (value: Date | number, now?: number) => string;
  /** Duração em h/min/s: "1 h 5 min", "1 hr 5 min", "1 h 5 min". */
  duration: (ms: number) => string;
}

export function createFormatters(locale: Locale): Formatters {
  const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();
  const numberFmt = (o: Intl.NumberFormatOptions = {}) => {
    const key = `n:${JSON.stringify(o)}`;
    let f = cache.get(key) as Intl.NumberFormat | undefined;
    if (!f) cache.set(key, (f = new Intl.NumberFormat(locale, o)));
    return f;
  };
  const dateFmt = (o: Intl.DateTimeFormatOptions) => {
    const key = `d:${JSON.stringify(o)}`;
    let f = cache.get(key) as Intl.DateTimeFormat | undefined;
    if (!f) cache.set(key, (f = new Intl.DateTimeFormat(locale, o)));
    return f;
  };
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'always' });
  const unit = (value: number, u: Intl.NumberFormatOptions['unit']) => numberFmt({ style: 'unit', unit: u, unitDisplay: 'short' }).format(value);

  const formatters: Formatters = {
    number: (value, options) => numberFmt(options).format(value),
    integer: (value) => numberFmt({ maximumFractionDigits: 0 }).format(value),
    decimal: (value, fractionDigits = 2) => numberFmt({ minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(value),
    percent: (ratio, fractionDigits = 0) => numberFmt({ style: 'percent', minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(ratio),
    currency: (value, currency) => new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value),
    compact: (value) => numberFmt({ notation: 'compact', maximumFractionDigits: 1 }).format(value),
    date: (value, timeZone) => dateFmt({ dateStyle: 'medium', timeZone }).format(value),
    time: (value, timeZone) => dateFmt({ timeStyle: 'short', timeZone }).format(value),
    dateTime: (value, timeZone) => dateFmt({ dateStyle: 'medium', timeStyle: 'short', timeZone }).format(value),
    relative: (value, u) => rtf.format(value, u),
    timeAgo: (value, now = Date.now()) => {
      const t = typeof value === 'number' ? value : value.getTime();
      const sec = Math.round((t - now) / 1000);
      const abs = Math.abs(sec);
      if (abs < 45) return rtf.format(sec, 'second');
      if (abs < 45 * 60) return rtf.format(Math.round(sec / 60), 'minute');
      if (abs < 22 * 3600) return rtf.format(Math.round(sec / 3600), 'hour');
      if (abs < 26 * 86400) return rtf.format(Math.round(sec / 86400), 'day');
      return formatters.date(t);
    },
    duration: (ms) => {
      const total = Math.round(Math.abs(ms) / 1000);
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;
      const parts: string[] = [];
      if (h) parts.push(unit(h, 'hour'));
      if (m) parts.push(unit(m, 'minute'));
      if (s || parts.length === 0) parts.push(unit(s, 'second'));
      return parts.join(' ');
    },
  };
  return formatters;
}
