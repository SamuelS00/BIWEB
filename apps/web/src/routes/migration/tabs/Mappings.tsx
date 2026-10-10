import { useState } from 'react';
import { Badge, Button, Icon } from '@biweb/ui';
import { MAPPINGS } from '../analysis';
import { useMig } from '../store';
import type { TabId } from '../store';
import { Conf } from '../ui';

const GROUPS = [{ id: 'all', label: 'Todos' }, { id: 'data', label: 'Dados' }, { id: 'metrics', label: 'Métricas' }, { id: 'visuals', label: 'Visuais' }, { id: 'maps', label: 'Mapas' }, { id: 'interactions', label: 'Interações' }, { id: 'automation', label: 'Automação' }] as const;

/** Mapeamentos: ORIGINAL → BIWEB, com estado de revisão por linha. */
export function Mappings({ onGo }: { onGo: (t: TabId, sel?: string) => void }) {
  const st = useMig(), ps = st.cur(), [g, setG] = useState<(typeof GROUPS)[number]['id']>('all'), [q, setQ] = useState('');
  const state = (id: string, s: string) => ps.mappings[id] === 'confirmed' ? 'confirmed' : ps.mappings[id] === 'rejected' ? 'rejected' : s;
  const rows = MAPPINGS.filter((m) => (g === 'all' || m.group === g) && (!q.trim() || `${m.from} ${m.to}`.toLowerCase().includes(q.trim().toLowerCase())));
  const cnt = (s: string) => MAPPINGS.filter((m) => state(m.id, m.state) === s).length;
  const pend = MAPPINGS.filter((m) => state(m.id, m.state) === 'pending');
  return <div className="ms-map">
    <div className="ms-map-top"><div className="mg-chips" role="tablist" aria-label="Tipo de mapeamento">{GROUPS.map((x) => <button key={x.id} role="tab" aria-selected={g === x.id} onClick={() => setG(x.id)}>{x.label}<span>{x.id === 'all' ? MAPPINGS.length : MAPPINGS.filter((m) => m.group === x.id).length}</span></button>)}</div>
      <div className="ms-map-stats"><span><i className="ms-compat-dot is-native" />{cnt('auto')} automáticos</span><span><i className="ms-compat-dot is-equivalent" />{cnt('confirmed')} confirmados</span><span><i className="ms-compat-dot is-redesign" />{cnt('pending')} pendentes</span>
        <Button size="sm" isDisabled={!pend.length} onPress={() => { pend.filter((m) => m.confidence >= 80).forEach((m) => st.decideMapping(m.id, 'confirmed')); st.flash('Mapeamentos de alta confiança confirmados.'); }}>Confirmar os de alta confiança</Button></div></div>
    <input className="ms-filter-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar mapeamentos" aria-label="Filtrar mapeamentos" />
    <div className="ms-table-scroll"><table className="ms-grid is-map"><thead><tr><th>Tipo</th><th>Original</th><th /><th>BIWEB</th><th>Destino</th><th>Confiança</th><th>Estado</th><th /></tr></thead>
      <tbody>{rows.map((m) => { const s = state(m.id, m.state); return <tr key={m.id} tabIndex={0} className={`${m.itemId && st.sel === m.itemId ? 'is-sel' : ''}${s === 'rejected' ? ' is-off' : ''}`} onClick={() => { if (m.itemId) st.set({ sel: m.itemId, rightTab: 'inspector' }); }}>
        <td><Badge>{m.type}</Badge></td><td className="ms-orig">{m.from}</td><td className="ms-arrow"><Icon name="arrowRight" size={12} /></td><td className="ms-new"><b>{m.to}</b></td><td>{m.target}</td><td><Conf n={m.confidence} /></td>
        <td><Badge tone={s === 'confirmed' ? 'success' : s === 'rejected' ? 'danger' : s === 'pending' ? 'warning' : 'neutral'}>{s === 'auto' ? 'Automático' : s === 'confirmed' ? 'Confirmado' : s === 'rejected' ? 'Rejeitado' : 'Pendente'}</Badge></td>
        <td className="ms-actions-cell"><Button size="sm" variant="ghost" icon="check" isDisabled={s === 'confirmed'} onPress={() => st.decideMapping(m.id, 'confirmed')}>Aceitar</Button><Button size="sm" variant="ghost" onPress={() => st.decideMapping(m.id, s === 'rejected' ? null : 'rejected')}>{s === 'rejected' ? 'Desfazer' : 'Rejeitar'}</Button>{m.group === 'maps' && <Button size="sm" variant="ghost" onPress={() => onGo('reconstruct', m.itemId)}>Reconstruir</Button>}</td></tr>; })}</tbody></table>
      {!rows.length && <p className="ms-hint" style={{ padding: 16 }}>Nenhum mapeamento neste filtro.</p>}</div>
  </div>;
}
