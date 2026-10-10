import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Badge, Button, FieldTypeIcon, Icon, SegmentedControl } from '@biweb/ui';
import { LDE, ORIGINAL_MODEL, ORIGINAL_RELS, PROPOSALS, PROPOSED_MODEL } from '../analysis';
import type { ModelTable, Relationship } from '../model';
import { useMig } from '../store';
import type { TabId } from '../store';
import { Conf, Evidence, Section } from '../ui';

const W = 212, HH = 30, RH = 19;
const hOf = (t: ModelTable) => HH + t.cols.length * RH + 8;
const TAG: Record<string, string> = { new: 'nova', merged: 'mesclada', renamed: 'renomeada', dropped: 'descartada' };
const kindOf = (type: string, c: { pk?: boolean; calc?: boolean }) => c.calc ? 'calc' as const : type === 'decimal' || type === 'inteiro' ? (c.pk ? 'dimension' as const : 'measure' as const) : type === 'data' ? 'date' as const : type === 'geo' ? 'geo' as const : 'dimension' as const;

function anchors(a: ModelTable, b: ModelTable) {
  const ax = a.x + W / 2, ay = a.y + hOf(a) / 2, bx = b.x + W / 2, by = b.y + hOf(b) / 2, dx = bx - ax, dy = by - ay;
  if (Math.abs(dx) > W * 0.9 || Math.abs(dy) < hOf(a) / 2 + 20 && Math.abs(dx) > W) { const s = dx > 0 ? 1 : -1; return { x1: a.x + (s > 0 ? W : 0), y1: ay, x2: b.x + (s > 0 ? 0 : W), y2: by, h: true, s }; }
  const s = dy > 0 ? 1 : -1; return { x1: ax, y1: a.y + (s > 0 ? hOf(a) : 0), x2: bx, y2: b.y + (s > 0 ? 0 : hOf(b)), h: false, s };
}

function ER({ tables, rels, sel, onSel, hotRel, proposed }: { tables: ModelTable[]; rels: Relationship[]; sel: string | null; onSel: (id: string) => void; hotRel: string | null; proposed: boolean }) {
  const byId = new Map(tables.map((t) => [t.id, t]));
  const minX = Math.min(...tables.map((t) => t.x)) - 20, minY = Math.min(...tables.map((t) => t.y)) - 24, maxX = Math.max(...tables.map((t) => t.x + W)) + 20, maxY = Math.max(...tables.map((t) => t.y + hOf(t))) + 24;
  return <svg className="ms-er" viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} role="group" aria-label={proposed ? 'Modelo proposto do BIWEB' : 'Modelo original'}>
    {rels.map((r, i) => { const a = byId.get(r.from), b = byId.get(r.to); if (!a || !b) return null; const p = anchors(a, b), mx = (p.x1 + p.x2) / 2, my = (p.y1 + p.y2) / 2;
      const d = p.h ? `M${p.x1},${p.y1} C${mx},${p.y1} ${mx},${p.y2} ${p.x2},${p.y2}` : `M${p.x1},${p.y1} C${p.x1},${my} ${p.x2},${my} ${p.x2},${p.y2}`;
      const g = (x: number, y: number, t: string, dx: number, dy: number) => <text x={x + dx} y={y + dy} className="ms-er-card">{t}</text>;
      return <g key={r.id} className={`ms-er-rel${hotRel === r.id || sel === r.from || sel === r.to ? ' is-hot' : ''}`} style={{ animationDelay: `${300 + i * 140}ms` }}><path d={d} />{g(p.x1, p.y1, '1', p.h ? 8 * p.s : 8, p.h ? -6 : 14 * p.s)}{g(p.x2, p.y2, '*', p.h ? -10 * p.s : 8, p.h ? -6 : -6 * p.s)}</g>; })}
    {tables.map((t, i) => <g key={t.id} transform={`translate(${t.x} ${t.y})`} className={`ms-er-table${sel === t.id ? ' is-sel' : ''}${t.tag ? ` is-${t.tag}` : ''}`} style={{ animationDelay: `${i * 70}ms` }} tabIndex={0} role="button" aria-label={`Tabela ${t.name}`} aria-pressed={sel === t.id} onClick={() => onSel(t.id)} onKeyDown={(e) => { if (e.key === 'Enter') onSel(t.id); }}>
      <rect width={W} height={hOf(t)} rx={8} className="b" /><path d={`M0,${HH} H${W}`} className="l" />
      <text x={12} y={20} className="n">{t.name}</text>{t.tag && <text x={W - 10} y={20} textAnchor="end" className="tag">{TAG[t.tag]}</text>}
      {t.cols.map((c, j) => <g key={c.name} transform={`translate(0 ${HH + 4 + j * RH})`}><text x={12} y={13} className={`c${c.pk ? ' pk' : ''}`}>{c.pk ? 'PK ' : c.fk ? 'FK ' : ''}{c.name}</text>
        <text x={W - 10} y={13} textAnchor="end" className="ty">{!proposed && c.renamed ? `→ ${c.renamed}` : c.calc ? 'fx' : c.type}</text></g>)}
    </g>)}
  </svg>;
}

export function DataModel({ onGo }: { onGo: (t: TabId, sel?: string) => void }) {
  const st = useMig(), ps = st.cur(), navigate = useNavigate();
  const [view, setView] = useState<'original' | 'proposed'>('original'), [sel, setSel] = useState<string | null>('orders'), [hot, setHot] = useState<string | null>(null);
  const prop = view === 'proposed', tables = prop ? PROPOSED_MODEL : ORIGINAL_MODEL, current = tables.find((t) => t.id === sel);
  const decided = (id: string) => ps.proposals[id];
  const proposals = useMemo(() => PROPOSALS, []);
  const changes = PROPOSED_MODEL.filter((t) => t.tag).length;
  return <div className="ms-data">
    <div className="ms-data-bar">
      <SegmentedControl label="Modelo exibido" value={view} onChange={setView} options={[{ id: 'original', label: 'Original Model' }, { id: 'proposed', label: 'Proposed BIWEB Model' }]} />
      <span className="ms-hint">{prop ? `${changes} tabelas com mudança proposta · 14 campos normalizados · 1 dimensão geográfica nova` : 'Como está no Power BI · Sales Model · 6 de 8 tabelas'}</span>
      <span className="flex-1" /><Button size="sm" icon="data" onPress={() => { void navigate({ to: '/connections' }); }}>Open in Data Workspace</Button><Button size="sm" variant="primary" icon="check" onPress={() => st.flash('Proposta enviada ao LDE para revisão no Data Workspace.')}>Review LDE Proposal</Button>
    </div>
    <div className="ms-data-body">
      <div className="ms-er-wrap" key={view}><ER tables={tables} rels={prop ? ORIGINAL_RELS : ORIGINAL_RELS} sel={sel} onSel={(id) => { setSel(id); const n = ORIGINAL_MODEL.find((t) => t.id === id)?.name; const it = n ? `tb:sales:${n.toLowerCase()}` : ''; st.set({ sel: it }); }} hotRel={hot} proposed={prop} />
        <div className="ms-er-legend"><span><i className="pk" />PK chave primária</span><span><i className="fk" />FK chave estrangeira</span><span>1 · * cardinalidade</span>{prop && <span><i className="new" />mudança proposta</span>}</div></div>
      <div className="ms-data-side">
        {current && <Section title={current.name} hint={`${current.cols.length} colunas`}>
          <ul className="ms-cols">{current.cols.map((c) => <li key={c.name}><FieldTypeIcon kind={kindOf(c.type, c)} /><span>{c.name}</span>{c.pk && <Badge tone="accent">PK</Badge>}{c.fk && <Badge>FK</Badge>}{!prop && c.renamed && <small>→ {c.renamed}</small>}</li>)}</ul>
          {current.note && <p className="ms-hint">{current.note}</p>}</Section>}
        <Section title="Análise do LDE" hint="Logical Data Engine"><ul className="ms-lde">{LDE.map((l) => <li key={l.label}><Icon name={l.ok ? 'check' : 'warning'} size={12} /><span><b>{l.label}</b><small>{l.detail}</small></span></li>)}</ul></Section>
      </div>
    </div>
    <Section title="Relacionamentos propostos" hint="Propor → Revisar → Aplicar">
      <ul className="ms-proposals">{proposals.map((p) => { const d = decided(p.id); return <li key={p.id} className={d ? `is-${d}` : ''} onMouseEnter={() => setHot(null)}>
        <div className="ms-prop-main"><b>{p.from}.{p.fromCol}</b><Icon name="arrowRight" size={12} /><b>{p.to}.{p.toCol}</b><Badge tone={p.confidence! >= 85 ? 'success' : 'warning'}>{p.confidence! >= 85 ? 'Possível relacionamento' : 'Ambíguo'}</Badge></div>
        <div className="ms-prop-conf"><span className="bw-label">Confiança</span><Conf n={p.confidence!} /></div>
        <details open={!d}><summary>Evidência</summary><Evidence items={p.evidence ?? []} /></details>
        <div className="ms-row-actions"><Button size="sm" variant={d === 'accepted' ? 'default' : 'primary'} icon={d === 'accepted' ? 'check' : undefined} onPress={() => st.decideProposal(p.id, 'accepted')}>{d === 'accepted' ? 'Aceito' : 'Accept'}</Button><Button size="sm" onPress={() => st.decideProposal(p.id, 'rejected')}>{d === 'rejected' ? 'Rejeitado' : 'Reject'}</Button><Button size="sm" variant="ghost" onPress={() => { st.decideProposal(p.id, 'review'); onGo('validation'); }}>Review</Button></div></li>; })}</ul>
    </Section>
  </div>;
}
