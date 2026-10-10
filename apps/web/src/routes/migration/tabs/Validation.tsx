import { useState } from 'react';
import { Badge, Banner, Button, Icon, SegmentedControl } from '@biweb/ui';
import { CHECKS, CHECK_GROUPS, REVIEW } from '../analysis';
import { pendingReview, useMig } from '../store';
import type { TabId } from '../store';
import { Conf, Evidence } from '../ui';

const ST = { match: { l: 'Igual', icon: 'check', t: 'success' }, equivalent: { l: 'Equivalente', icon: 'check', t: 'accent' }, review: { l: 'Revisar', icon: 'warning', t: 'warning' }, failed: { l: 'Falhou', icon: 'close', t: 'danger' } } as const;
const KIND_LABEL: Record<string, string> = { visual: 'Visual', metric: 'Métrica', security: 'Segurança', source: 'Fonte', relationship: 'Relacionamento', interaction: 'Interação', map: 'Mapa', refresh: 'Refresh' };

export function Validation({ onGo }: { onGo: (t: TabId, sel?: string) => void }) {
  const [view, setView] = useState<'checks' | 'queue'>('checks');
  const pend = pendingReview(useMig((s) => s.cur()));
  return <div className="ms-val">
    <div className="ms-val-bar"><SegmentedControl label="Seção" value={view} onChange={setView} options={[{ id: 'checks', label: 'Original × BIWEB' }, { id: 'queue', label: `Fila de revisão · ${pend.length}` }]} /><span className="ms-hint">“O resultado reconstruído é equivalente ao original?” Cada comparação mostra os dois lados, sem nota única.</span></div>
    {view === 'checks' ? <Checks onGo={onGo} go={() => setView('queue')} /> : <Queue onGo={onGo} />}
  </div>;
}

function Checks({ onGo, go }: { onGo: (t: TabId, sel?: string) => void; go: () => void }) {
  const st = useMig(), ps = st.cur(), shown = Math.min(CHECKS.length, ps.checks), running = shown < CHECKS.length;
  const live = CHECKS.slice(0, shown).map((c) => ({ ...c, status: ps.checksResolved[c.id] ? 'equivalent' as const : c.status }));
  const cnt = (s: string) => live.filter((c) => c.status === s).length;
  const [sel, setSel] = useState('c13');
  const cur = live.find((c) => c.id === sel);
  return <div className="ms-checks">
    <div className="ms-val-sum" aria-live="polite">
      <div className="is-ok"><b>{cnt('match') + cnt('equivalent')}</b><span>Validados</span><small>{cnt('match')} iguais · {cnt('equivalent')} equivalentes</small></div>
      <div className="is-rev"><b>{cnt('review')}</b><span>Precisam de revisão</span><small>Diferença explicada, decisão humana</small></div>
      <div className="is-bad"><b>{cnt('failed')}</b><span>Falharam na comparação</span><small>Acima da tolerância ou sem equivalente</small></div>
      <div className="ms-val-run"><Button size="sm" variant="primary" icon="play" isDisabled={running} onPress={st.runValidation}>{running ? `Comparando ${shown}/${CHECKS.length}…` : 'Executar validação'}</Button><Button size="sm" variant="ghost" onPress={go}>Ver fila de revisão</Button></div>
    </div>
    <div className="ms-checks-body">
      <div className="ms-table-scroll"><table className="ms-grid is-checks"><thead><tr><th>Comparação</th><th>Original</th><th>BIWEB</th><th>Resultado</th></tr></thead>
        <tbody>{CHECK_GROUPS.map((g) => { const list = live.filter((c) => c.group === g); if (!list.length) return null; return [<tr key={g} className="ms-group"><td colSpan={4}>{g.toUpperCase()}</td></tr>, ...list.map((c) => { const s = ST[c.status]; return <tr key={c.id} tabIndex={0} className={`ms-check-in${sel === c.id ? ' is-sel' : ''}`} onClick={() => { setSel(c.id); if (c.itemId) st.set({ sel: c.itemId }); }} onKeyDown={(e) => { if (e.key === 'Enter') setSel(c.id); }}>
          <td>{c.label}</td><td className="num">{c.original}</td><td className="num">{c.biweb}</td><td><Badge tone={s.t} icon={s.icon as never}>{s.l}</Badge></td></tr>; })]; })}</tbody></table>
        {running && <p className="ms-hint" style={{ padding: 12 }}>Comparando valores, filtros, interações e layout…</p>}</div>
      <aside className="ms-check-detail">{cur ? <><span className="ms-kind">{cur.group}</span><h3>{cur.label}</h3>
        <div className="ms-sbs"><div><small>Original</small><b>{cur.original}</b></div><Icon name="arrowRight" size={12} /><div className={`is-${cur.status}`}><small>BIWEB</small><b>{cur.biweb}</b></div></div>
        <Badge tone={ST[cur.status].t}>{ST[cur.status].l}</Badge>{cur.note && <p className="ms-callout"><Icon name="info" size={12} />{cur.note}</p>}
        <div className="ms-row-actions">{(cur.status === 'review' || cur.status === 'failed') && !ps.checksResolved[cur.id] && <Button size="sm" variant="primary" onPress={() => st.resolveCheck(cur.id)}>Aceitar diferença</Button>}{cur.itemId && <Button size="sm" onPress={() => onGo('reconstruct', cur.itemId)}>Ver reconstrução</Button>}<Button size="sm" variant="ghost" icon="copilot" onPress={() => { st.set({ sel: cur.itemId ?? st.sel }); st.ask('Compare os resultados'); }}>Ask Copilot</Button></div></> : <p className="ms-hint">Selecione uma comparação.</p>}</aside>
    </div>
  </div>;
}

/** Fila central de decisões humanas: problema, evidência, recomendação e confiança. */
function Queue({ onGo }: { onGo: (t: TabId, sel?: string) => void }) {
  const st = useMig(), ps = st.cur(), pend = pendingReview(ps), [open, setOpen] = useState(REVIEW[0]!.id);
  if (!pend.length && !Object.keys(ps.review).length) return <p className="ms-hint">Nenhum item.</p>;
  return <div className="ms-queue">
    {pend.length === 0 ? <Banner tone="success">Nenhum item exige revisão. Todas as decisões foram registradas no histórico.</Banner> : <p className="ms-queue-head"><b>{pend.length} itens exigem revisão</b> · ordenados por menor confiança</p>}
    <ul>{[...REVIEW].sort((a, b) => a.confidence - b.confidence).map((r) => { const d = ps.review[r.id]; return <li key={r.id} className={`${d ? `is-${d}` : ''}${open === r.id ? ' is-open' : ''}`}>
      <button type="button" className="ms-q-head" aria-expanded={open === r.id} onClick={() => { setOpen(open === r.id ? '' : r.id); if (r.itemId) st.set({ sel: r.itemId }); }}><Badge tone={d ? 'success' : 'warning'}>{d ? (d === 'accepted' ? 'Aceito' : 'Rejeitado') : KIND_LABEL[r.kind]}</Badge><b>{r.title}</b><span className="flex-1" /><Conf n={r.confidence} /><Icon name={open === r.id ? 'chevronDown' : 'chevronRight'} size={12} /></button>
      {open === r.id && <div className="ms-q-body"><p><b>Problema.</b> {r.issue}</p><h5>Evidência</h5><Evidence items={r.evidence} /><p className="ms-reco"><b>Recomendação.</b> {r.recommendation}</p>
        <div className="ms-row-actions"><Button size="sm" variant="primary" icon="check" onPress={() => st.decideReview(r.id, 'accepted')}>Accept</Button><Button size="sm" onPress={() => { if (r.itemId) onGo('semantics', r.itemId.startsWith('ms:') ? r.itemId : undefined); else st.flash('Abra o item no Inventário para editar o mapeamento.'); }}>Edit</Button><Button size="sm" onPress={() => st.decideReview(r.id, 'rejected')}>Reject</Button><Button size="sm" variant="ghost" icon="copilot" onPress={() => { if (r.itemId) st.set({ sel: r.itemId }); st.ask(`Explique: ${r.title}`); }}>Ask Copilot</Button>{d && <Button size="sm" variant="ghost" onPress={() => st.decideReview(r.id, null)}>Desfazer</Button>}</div></div>}</li>; })}</ul>
  </div>;
}
