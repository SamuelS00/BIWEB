import { useMemo, useState } from 'react';
import { Badge, Button, Icon } from '@biweb/ui';
import { ENTITIES } from '../data/seed';
import { changesOf, inWeek } from '../data/derive';
import { useT } from '../../i18n/intl';
import type { EntityType } from '../data/types';
import { useDs } from '../store';
import { Chip, ConfChip, Grid, KIND_ICON, Search, ViewHead, dpath, useGo, type Col } from '../ui';
import { ENTITY_TYPE_ID, EntityMenu, RecLink, useAgo } from './EntityActions';
import { EntityDetail } from './EntityDetail';
import { Compare } from './Compare';
import './records.css';

const TYPES: EntityType[] = ['Organization', 'Product', 'Service', 'Technology', 'Location', 'Market', 'Regulation', 'Publication', 'Event'];
type E = (typeof ENTITIES)[number];

export function EntitiesView({ id }: { id?: string }) {
  if (id === 'compare') return <Compare />;
  if (id) return <EntityDetail id={id} />;
  return <EntityCatalog />;
}

function EntityCatalog() {
  const go = useGo();
  const t = useT();
  const ago = useAgo();
  const sel = useDs((s) => s.sel);
  const [type, setType] = useState<EntityType | 'all'>('all');
  const [q, setQ] = useState('');
  const counts = useMemo(() => Object.fromEntries(TYPES.map((ty) => [ty, ENTITIES.filter((e) => e.type === ty).length])) as Record<EntityType, number>, []);
  const rows = useMemo(() => ENTITIES.filter((e) => (type === 'all' || e.type === type) && (!q || `${e.name} ${e.aliases.join(' ')} ${e.hq ?? ''}`.toLowerCase().includes(q.toLowerCase()))), [type, q]);
  const cols: Col<E>[] = [
    { key: 'n', label: t('discovery.entities.col.entity'), w: 'minmax(180px,1.6fr)', render: (e) => <span className="ds-rec-two"><RecLink onOpen={() => go(dpath('entities', e.id))}><Icon name={KIND_ICON[e.type] ?? 'cube'} size={12} />{e.name}</RecLink><small>{e.hq ?? e.aliases[0] ?? t(ENTITY_TYPE_ID[e.type])}</small></span> },
    { key: 't', label: t('discovery.entities.col.type'), w: '100px', render: (e) => t(ENTITY_TYPE_ID[e.type]) },
    { key: 'c', label: t('discovery.entities.col.confidence'), w: '110px', render: (e) => <ConfChip v={e.confidence} needs /> },
    { key: 'v', label: t('discovery.entities.col.status'), w: '120px', render: (e) => (e.verified ? <Badge tone="success" icon="check">{t('discovery.entities.verified')}</Badge> : <Badge tone="warning">{t('discovery.entities.needsReview')}</Badge>) },
    { key: 's', label: t('discovery.entities.col.sources'), w: '66px', right: true, render: (e) => <span className="bw-num">{e.sources}</span> },
    { key: 'l', label: t('discovery.entities.col.lastConfirmed'), w: '110px', render: (e) => ago(e.lastConfirmedMin) },
    { key: 'p', label: t('discovery.entities.col.locations'), w: '76px', right: true, render: (e) => <span className="bw-num">{e.locations}</span> },
    { key: 'ch', label: t('discovery.entities.col.changes7d'), w: '92px', right: true, render: (e) => <span className="bw-num">{changesOf(e.id).filter(inWeek).length}</span> },
    { key: 'a', label: '', w: '32px', render: (e) => <EntityMenu e={e} /> },
  ];
  return (
    <div className="dw-view">
      <ViewHead title={t('discovery.entities.title')} sub={t('discovery.entities.subtitle', { n: ENTITIES.length })} actions={<Button size="sm" icon="matrix" onPress={() => go(dpath('entities', 'compare'))}>{t('discovery.entities.compare')}</Button>} />
      <div className="ds-rec-tool">
        <span className="dw-chips" role="group" aria-label={t('discovery.entities.typeGroup')}>
          <Chip on={type === 'all'} onClick={() => setType('all')} n={ENTITIES.length}>{t('discovery.entities.all')}</Chip>
          {TYPES.filter((ty) => counts[ty] > 0).map((ty) => <Chip key={ty} on={type === ty} onClick={() => setType(ty)} n={counts[ty]}>{t(ENTITY_TYPE_ID[ty])}</Chip>)}
        </span>
        <span className="flex-1" />
        <Search value={q} onChange={setQ} placeholder={t('discovery.entities.searchPlaceholder')} label={t('discovery.entities.searchLabel')} w={280} />
      </div>
      <Grid label={t('discovery.entities.title')} cols={cols} rows={rows} id={(e) => e.id} selected={sel?.kind === 'entity' ? sel.id : null} onRow={(e) => useDs.getState().select({ kind: 'entity', id: e.id })} empty={<p className="dw-more">{t('discovery.entities.empty')}</p>} />
      <p className="dw-muted">{t('discovery.entities.hint')}</p>
    </div>
  );
}
