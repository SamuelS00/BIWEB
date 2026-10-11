import { useMemo, useState } from 'react';
import { Icon } from '@biweb/ui';
import { Canvas, type CEdge, type CNode } from '../../dataworkspace/Canvas';
import { entityById, relationsOf } from '../data/derive';
import { useDs } from '../store';
import { useT } from '../../i18n/intl';
import type { MessageId } from '../../i18n/catalog';
import type { Relationship } from '../data/types';
import { ENTITY_TYPE_ID } from './EntityActions';
import { Empty, KIND_ICON, dpath, useGo } from '../ui';

const REL_ID: Record<Relationship['kind'], MessageId> = {
  offers: 'discovery.entities.relKind.offers', integrates: 'discovery.entities.relKind.integrates', 'operates in': 'discovery.entities.relKind.operatesIn',
  announced: 'discovery.entities.relKind.announced', 'competes with': 'discovery.entities.relKind.competesWith', 'partners with': 'discovery.entities.relKind.partnersWith',
};
const W = 190, H = 58;
/** Relationship Graph da entidade: entrada à esquerda, foco ao centro, saída à direita. Só os vizinhos diretos (agregado, sem centenas de nós). */
export function EntityGraph({ id }: { id: string }) {
  const go = useGo();
  const t = useT();
  const sel = useDs((s) => (s.sel?.kind === 'entity' ? s.sel.id : null));
  const [focus, setFocus] = useState<string | null>(null);
  const rels = useMemo(() => relationsOf(id), [id]);
  const { nodes, edges } = useMemo(() => {
    const out = rels.filter((r) => r.from === id), inc = rels.filter((r) => r.to === id);
    const ns: CNode[] = [{ id, x: 280, y: Math.max(0, (Math.max(out.length, inc.length) - 1) * 35), w: W, h: H }];
    out.forEach((r, i) => ns.push({ id: r.to, x: 560, y: i * 70, w: W, h: H }));
    inc.forEach((r, i) => { if (!ns.some((n) => n.id === r.from)) ns.push({ id: r.from, x: 0, y: i * 70, w: W, h: H }); });
    const es: CEdge[] = rels.map((r) => ({ id: `${r.from}>${r.kind}>${r.to}`, from: r.from, to: r.to, label: t(REL_ID[r.kind]) }));
    return { nodes: ns, edges: es };
  }, [rels, id, t]);
  if (rels.length === 0) return <Empty icon="share" title={t('discovery.entities.graph.emptyTitle')} text={t('discovery.entities.graph.emptyText')} />;
  const pick = (nid: string) => { setFocus(nid); useDs.getState().select({ kind: 'entity', id: nid }); };
  return (
    <>
      <div className="dw-canvas-wrap ds-rec-graph">
        <Canvas label={t('discovery.entities.graph.label')} nodes={nodes} edges={edges} fitKey={id} focusId={focus} onBackground={() => useDs.getState().select(null, false)}
          renderNode={(nid) => {
            const e = entityById(nid);
            return (
              <button type="button" className={`dw-ln-node ds-rec-gnode is-source${nid === id ? ' is-center' : ''}${sel === nid ? ' is-sel' : ''}`} aria-label={t('discovery.entities.graph.nodeAria', { name: e?.name ?? nid, type: e ? t(ENTITY_TYPE_ID[e.type]) : '' })}
                onClick={() => pick(nid)} onDoubleClick={() => { if (nid !== id) go(dpath('entities', nid)); }}>
                <span className="dw-ln-i"><Icon name={KIND_ICON[e?.type ?? 'Organization'] ?? 'cube'} size={16} /></span>
                <span className="dw-ln-t"><small>{e ? t(ENTITY_TYPE_ID[e.type]) : t('discovery.entities.graph.fallbackType')}</small><b title={e?.name}>{e?.name ?? nid}</b><em>{e ? t('discovery.entities.graph.confidence', { n: e.confidence }) : ''}</em></span>
              </button>
            );
          }} />
      </div>
      <p className="dw-foot"><Icon name="info" size={12} />{t('discovery.entities.graph.foot')}</p>
    </>
  );
}
