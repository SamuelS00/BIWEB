import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { IntlProvider, createIntl } from 'react-intl';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CATALOG, MESSAGES, type MessageId } from './catalog';
import { createFormatters } from './format';
import { GLOSSARY, glossaryTerm } from './glossary';
import { useT } from './intl';
import { DEFAULT_LOCALE, LOCALES, resolveLocale, type Locale } from './locales';
import { useUi } from '../state/ui-store';

const SRC = fileURLToPath(new URL('..', import.meta.url));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return sourceFiles(p);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [p] : [];
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  useUi.setState({ locale: DEFAULT_LOCALE });
});

describe('locale inicial', () => {
  it('preferência salva vence o idioma do navegador', () => {
    expect(resolveLocale('en', ['pt-BR'])).toBe('en');
  });

  it('sem preferência, usa o idioma do navegador por código base', () => {
    expect(resolveLocale(null, ['en-US'])).toBe('en');
    expect(resolveLocale(null, ['es-MX', 'en'])).toBe('es');
    expect(resolveLocale(null, ['pt-PT'])).toBe('pt-BR');
  });

  it('idioma não suportado ou valor corrompido cai para pt-BR', () => {
    expect(resolveLocale(null, ['fr-FR', 'de'])).toBe('pt-BR');
    expect(resolveLocale('klingon', [])).toBe('pt-BR');
    expect(resolveLocale(42, [])).toBe('pt-BR');
    expect(DEFAULT_LOCALE).toBe('pt-BR');
  });
});

describe('troca e persistência do idioma', () => {
  it('salva a escolha do usuário no armazenamento e a recupera ao reabrir', async () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });
    vi.resetModules();
    const fresh = (await import('../state/ui-store')).useUi;
    fresh.getState().set({ locale: 'es' });
    expect(store.get('biweb.locale')).toBe('"es"');
    vi.resetModules();
    const reopened = (await import('../state/ui-store')).useUi;
    expect(reopened.getState().locale).toBe('es');
  });

  it('sem armazenamento disponível o app continua funcionando', async () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); }, removeItem: () => { throw new Error('bloqueado'); } });
    vi.stubGlobal('navigator', { languages: ['en-US'] });
    vi.resetModules();
    const fresh = (await import('../state/ui-store')).useUi;
    expect(fresh.getState().locale).toBe('en');
    expect(() => fresh.getState().set({ locale: 'es' })).not.toThrow();
    expect(fresh.getState().locale).toBe('es');
  });

  // Troca reativa sem recarregar (LocaleProvider + zustand) não roda em SSR, que usa o estado inicial.
  // Ela é verificada no navegador (dev server); aqui cada idioma renderiza o próprio texto.
  it('cada idioma renderiza o próprio texto a partir do catálogo', () => {
    const Probe = () => { const t = useT(); return <span>{t('auth.welcome')}</span>; };
    const render = (locale: Locale) => renderToStaticMarkup(<IntlProvider locale={locale} messages={MESSAGES[locale]}><Probe /></IntlProvider>);
    expect(render('pt-BR')).toContain('Bem-vindo de volta');
    expect(render('en')).toContain('Welcome back');
    expect(render('es')).toContain('Bienvenido de nuevo');
  });
});

describe('catálogo', () => {
  const domains = Object.entries(CATALOG);

  it('cada domínio tem as mesmas chaves nos três idiomas', () => {
    for (const [name, domain] of domains) {
      const base = Object.keys(domain['pt-BR']).sort();
      for (const l of LOCALES) expect(Object.keys(domain[l]).sort(), `${name}.${l}`).toEqual(base);
    }
  });

  it('todo id começa com o nome do domínio (chave estável, não ligada ao texto)', () => {
    for (const [name, domain] of domains) for (const id of Object.keys(domain['pt-BR'])) expect(id.startsWith(`${name}.`), id).toBe(true);
  });

  it('não há ids duplicados entre domínios', () => {
    const ids = domains.flatMap(([, d]) => Object.keys(d['pt-BR']));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todo idioma tem todas as mensagens preenchidas, sem id cru', () => {
    for (const l of LOCALES) {
      const msgs = MESSAGES[l];
      for (const [id, text] of Object.entries(msgs)) {
        expect(text.trim(), `${l} ${id}`).not.toBe('');
        expect(text, `${l} ${id}`).not.toBe(id);
      }
    }
  });

  it('todo id do catálogo é usado em algum componente (sem chaves mortas)', () => {
    const code = sourceFiles(SRC).filter((f) => !f.includes('/i18n/')).map((f) => readFileSync(f, 'utf8')).join('\n');
    const ids = domains.flatMap(([, d]) => Object.keys(d['pt-BR']));
    const unused = ids.filter((id) => !code.includes(`'${id}'`));
    expect(unused).toEqual([]);
  });
});

describe('interpolação e plural', () => {
  const intlFor = (l: Locale) => createIntl({ locale: l, messages: MESSAGES[l] });

  it('interpola valores sem concatenação', () => {
    expect(intlFor('pt-BR').formatMessage({ id: 'palette.ask' as MessageId }, { query: 'vendas' })).toBe('Perguntar: "vendas"');
    expect(intlFor('en').formatMessage({ id: 'palette.ask' as MessageId }, { query: 'sales' })).toBe('Ask: "sales"');
  });

  it('plural respeita as regras de cada idioma', () => {
    const notif = (l: Locale, count: number) => intlFor(l).formatMessage({ id: 'common.notifications' }, { count });
    expect(notif('pt-BR', 1)).toBe('Notificação · 1 nova');
    expect(notif('pt-BR', 2)).toBe('Notificações · 2 novas');
    expect(notif('es', 1)).toBe('Notificación · 1 nueva');
    expect(notif('es', 2)).toBe('Notificaciones · 2 nuevas');
  });
});

describe('formatadores', () => {
  const pt = createFormatters('pt-BR');
  const en = createFormatters('en');
  const es = createFormatters('es');

  it('números seguem o separador de cada locale', () => {
    expect(pt.decimal(1234567.891)).toBe('1.234.567,89');
    expect(en.decimal(1234567.891)).toBe('1,234,567.89');
    expect(es.decimal(1234567.891)).toBe('1.234.567,89');
    expect(en.integer(1234.4)).toBe('1,234');
  });

  it('percentual recebe razão e formata por locale', () => {
    expect(pt.percent(0.25)).toBe('25%');
    expect(en.percent(0.256, 1)).toBe('25.6%');
  });

  it('moeda é independente do idioma: en com BRL mostra R$', () => {
    expect(en.currency(1234.56, 'BRL')).toContain('R$');
    expect(en.currency(1234.56, 'BRL')).toContain('1,234.56');
    expect(pt.currency(1234.56, 'BRL')).toContain('R$');
    expect(pt.currency(1234.56, 'USD')).toContain('US$');
  });

  it('datas e horas usam o locale e o timezone explícito, sem alterá-lo', () => {
    const d = new Date(Date.UTC(2026, 9, 10, 14, 30));
    expect(en.date(d, 'UTC')).toBe('Oct 10, 2026');
    expect(en.time(d, 'UTC')).toBe('2:30 PM');
    expect(pt.dateTime(d, 'UTC')).toMatch(/10 de out\. de 2026, 14:30/);
    expect(es.dateTime(d, 'UTC')).toMatch(/10 oct 2026, 14:30/);
  });

  it('tempo relativo respeita o locale', () => {
    const now = Date.UTC(2026, 9, 10, 14, 30);
    const twoMinAgo = now - 2 * 60_000;
    expect(en.timeAgo(twoMinAgo, now)).toBe('2 minutes ago');
    expect(pt.timeAgo(twoMinAgo, now)).toBe('há 2 minutos');
    expect(es.timeAgo(twoMinAgo, now)).toBe('hace 2 minutos');
  });

  it('duração em h/min/s', () => {
    expect(en.duration(3_900_000)).toMatch(/1 \S+ 5 min/);
    expect(en.duration(42_000)).toMatch(/42 \S+/);
  });
});

describe('glossário', () => {
  it('cada termo tem uma tradução em cada idioma e um status válido', () => {
    const ids = GLOSSARY.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const term of GLOSSARY) {
      expect(['approved', 'needs-review']).toContain(term.status);
      for (const l of LOCALES) expect(term.translations[l].trim(), `${term.id} ${l}`).not.toBe('');
    }
  });

  it('termo desconhecido volta o próprio id', () => {
    expect(glossaryTerm('nao-existe', 'en')).toBe('nao-existe');
    expect(glossaryTerm('workflow', 'es')).toBe('Flujo');
  });
});
