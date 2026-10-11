/** Vocabulário de UI das áreas Overview, Changes, Watchlists e Datasets: ids literais do catálogo i18n por valor de enumeração. */
import type { MessageId } from '../../i18n/catalog';
import type { T } from '../../i18n/intl';
import type { ChangeKind, Frequency, Level } from './types';
import type { CatFilter } from './missions';

export const KIND_ID: Record<ChangeKind, MessageId> = {
  'Pricing changed': 'discovery.changes.kind.pricing',
  'Capability added': 'discovery.changes.kind.capability',
  'Integration added': 'discovery.changes.kind.integration',
  'Documentation updated': 'discovery.changes.kind.documentation',
  'Location changed': 'discovery.changes.kind.location',
  'Product renamed': 'discovery.changes.kind.renamed',
  'Feature removed': 'discovery.changes.kind.removed',
};

export const CAT_ID: Record<CatFilter, MessageId> = {
  All: 'discovery.changes.cat.all',
  Important: 'discovery.changes.cat.important',
  Pricing: 'discovery.changes.cat.pricing',
  Product: 'discovery.changes.cat.product',
  Documentation: 'discovery.changes.cat.documentation',
  News: 'discovery.changes.cat.news',
};

export const LEVEL_ID: Record<Level, MessageId> = {
  high: 'discovery.changes.level.high',
  medium: 'discovery.changes.level.medium',
  low: 'discovery.changes.level.low',
};

export const FREQ_ID: Record<Frequency, MessageId> = {
  'One time': 'discovery.watchlists.freq.once',
  Daily: 'discovery.watchlists.freq.daily',
  Weekly: 'discovery.watchlists.freq.weekly',
  Monthly: 'discovery.watchlists.freq.monthly',
};

const MONITOR_ID: Record<string, MessageId> = {
  Pricing: 'discovery.watchlists.mon.pricing',
  Products: 'discovery.watchlists.mon.products',
  Features: 'discovery.watchlists.mon.features',
  'Release Notes': 'discovery.watchlists.mon.releaseNotes',
  Documentation: 'discovery.watchlists.mon.documentation',
  Integrations: 'discovery.watchlists.mon.integrations',
  Announcements: 'discovery.watchlists.mon.announcements',
  Locations: 'discovery.watchlists.mon.locations',
  Regulations: 'discovery.watchlists.mon.regulations',
  Deadlines: 'discovery.watchlists.mon.deadlines',
  Publications: 'discovery.watchlists.mon.publications',
};
export const monitorLabel = (t: T, m: string) => { const id = MONITOR_ID[m]; return id ? t(id) : m; };

/** Idade relativa curta ("há 34 min"), no idioma ativo. */
export function agoT(t: T, min: number): string {
  if (min < 60) return t('discovery.changes.ago.min', { n: min });
  if (min < 1440) return t('discovery.changes.ago.h', { n: Math.round(min / 60) });
  return t('discovery.changes.ago.d', { n: Math.round(min / 1440) });
}
