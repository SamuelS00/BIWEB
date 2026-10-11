import { useMemo, useState } from 'react';
import { Badge, Button, Icon } from '@biweb/ui';
import { ENTITIES } from '../data/seed';
import { ago, changesOf, inWeek } from '../data/derive';
import type { EntityType } from '../data/types';
import { useDs } from '../store';
import { Chip, ConfChip, Grid, KIND_ICON, Search, ViewHead, dpath, useGo, type Col } from '../ui';
import { EntityMenu, RecLink } from './EntityActions';
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
  const sel = useDs((s) => s.sel);
  const [type, setType] = useState<EntityType | 'all'>('all');
  const [q, setQ] = useState('');
  const counts = useMemo(() => Object.fromEntries(TYPES.map((t) => [t, ENTITIES.filter((e) => e.type === t).length])) as Record<EntityType, number>, []);
  const rows = useMemo(() => ENTITIES.filter((e) => (type === 'all' || e.type === type) && (!q || `${e.name} ${e.aliases.join(' ')} ${e.hq ?? ''}`.toLowerCase().includes(q.toLowerCase()))), [type, q]);
  const cols: Col<E>[] = [
    { key: 'n', label: 'Entity', w: 'minmax(180px,1.6fr)', render: (e) => <span className="ds-rec-two"><RecLink onOpen={() => go(dpath('entities', e.id))}><Icon name={KIND_ICON[e.type] ?? 'cube'} size={12} />{e.name}</RecLink><small>{e.hq ?? e.aliases[0] ?? e.type}</small></span> },
    { key: 't', label: 'Type', w: '100px', render: (e) => e.type },
    { key: 'c', label: 'Confidence', w: '110px', render: (e) => <ConfChip v={e.confidence} needs /> },
    { key: 'v', label: 'Status', w: '120px', render: (e) => (e.verified ? <Badge tone="success" icon="check">Verified</Badge> : <Badge tone="warning">Needs review</Badge>) },
    { key: 's', label: 'Sources', w: '66px', right: true, render: (e) => <span className="bw-num">{e.sources}</span> },
    { key: 'l', label: 'Last confirmed', w: '110px', render: (e) => ago(e.lastConfirmedMin) },
    { key: 'p', label: 'Locations', w: '76px', right: true, render: (e) => <span className="bw-num">{e.locations}</span> },
    { key: 'ch', label: 'Changes (7 d)', w: '92px', right: true, render: (e) => <span className="bw-num">{changesOf(e.id).filter(inWeek).length}</span> },
    { key: 'a', label: '', w: '32px', render: (e) => <EntityMenu e={e} /> },
  ];
  return (
    <div className="dw-view">
      <ViewHead title="Entities" sub={`${ENTITIES.length} external entities discovered across missions. Business and informational entities only.`} actions={<Button size="sm" icon="matrix" onPress={() => go(dpath('entities', 'compare'))}>Compare entities</Button>} />
      <div className="ds-rec-tool">
        <span className="dw-chips" role="group" aria-label="Entity type">
          <Chip on={type === 'all'} onClick={() => setType('all')} n={ENTITIES.length}>All</Chip>
          {TYPES.filter((t) => counts[t] > 0).map((t) => <Chip key={t} on={type === t} onClick={() => setType(t)} n={counts[t]}>{t}</Chip>)}
        </span>
        <span className="flex-1" />
        <Search value={q} onChange={setQ} placeholder="Search entities, aliases, headquarters" label="Search entities" w={280} />
      </div>
      <Grid label="Entities" cols={cols} rows={rows} id={(e) => e.id} selected={sel?.kind === 'entity' ? sel.id : null} onRow={(e) => useDs.getState().select({ kind: 'entity', id: e.id })} empty={<p className="dw-more">No entities match this filter.</p>} />
      <p className="dw-muted">Select a row to inspect it. Open the name for the full entity record.</p>
    </div>
  );
}
