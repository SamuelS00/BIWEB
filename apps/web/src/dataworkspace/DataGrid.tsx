import { useMemo, useRef, useState } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import { Icon, Menu } from '@biweb/ui';
import type { Asset } from './registry';
import { sampleRows, type Cell } from './sample';
import { Pill, Search } from './ui';

const RH = 28;
export type ColAction = 'profile' | 'relationships' | 'equivalents' | 'lineage' | 'rule';

/** Grade de dados: cabeçalho fixo, ordenação, filtro, redimensionar, fixar, ocultar, seleção e rolagem virtual. */
export function DataGrid({ asset, selCol, onSelectCol, onAction }: { asset: Asset; selCol: string | null; onSelectCol: (c: string | null) => void; onAction: (a: ColAction, col: string) => void }) {
  const rows = useMemo(() => sampleRows(asset.id, asset.cols, 2000), [asset]);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ i: number; dir: 1 | -1 } | null>(null);
  const [filters, setFilters] = useState<Record<number, string>>({});
  const [widths, setWidths] = useState<Record<number, number>>({});
  const [pinned, setPinned] = useState<number[]>([]);
  const [hidden, setHidden] = useState<number[]>([]);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [top, setTop] = useState(0);
  const [fcol, setFcol] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const data = useMemo(() => {
    const m = q.trim().toLowerCase();
    let list = rows.map((r, i) => ({ r, i }));
    if (m) list = list.filter(({ r }) => r.some((c) => String(c ?? '').toLowerCase().includes(m)));
    for (const [ci, f] of Object.entries(filters)) if (f) list = list.filter(({ r }) => String(r[Number(ci)] ?? '').toLowerCase().includes(f.toLowerCase()));
    if (sort) list = [...list].sort((a, b) => { const x = a.r[sort.i] ?? '', y = b.r[sort.i] ?? ''; return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'pt-BR')) * sort.dir; });
    return list;
  }, [rows, q, filters, sort]);

  const order = useMemo(() => { const vis = asset.cols.map((_, i) => i).filter((i) => !hidden.includes(i)); return [...pinned.filter((p) => vis.includes(p)), ...vis.filter((i) => !pinned.includes(i))]; }, [asset, hidden, pinned]);
  const w = (i: number) => widths[i] ?? (asset.cols[i]!.gen === 'text' || asset.cols[i]!.gen === 'email' || asset.cols[i]!.gen === 'uuid' ? 200 : 150);
  const offs = useMemo(() => { let x = 36; const m: Record<number, number> = {}; for (const i of order) if (pinned.includes(i)) { m[i] = x; x += w(i); } return m; }, [order, pinned, widths]); // eslint-disable-line react-hooks/exhaustive-deps
  const height = 560, start = Math.max(0, Math.floor(top / RH) - 6), end = Math.min(data.length, start + Math.ceil(height / RH) + 12);
  const total = order.reduce((s, i) => s + w(i), 36);

  const startResize = (e: React.PointerEvent, i: number) => {
    e.preventDefault(); e.stopPropagation();
    const x0 = e.clientX, w0 = w(i);
    const mv = (ev: PointerEvent) => setWidths((s) => ({ ...s, [i]: Math.max(70, w0 + ev.clientX - x0) }));
    const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
  };
  const fmt = (c: Cell) => (c === null ? <i className="dw-null">null</i> : typeof c === 'boolean' ? String(c) : typeof c === 'number' ? c.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : c);

  return (
    <div className="dw-grid">
      <div className="dw-toolbar dw-toolbar--tight">
        <Search value={q} onChange={setQ} placeholder="Buscar nos dados…" w={220} />
        <span className="dw-muted bw-num">{data.length.toLocaleString('pt-BR')} de {asset.rows.toLocaleString('pt-BR')} linhas · amostra de 2.000</span>
        {fcol !== null && <label className="dw-search dw-search--sm" style={{ width: 230 }}><Icon name="filter" size={12} /><input autoFocus value={filters[fcol] ?? ''} onChange={(e) => setFilters((s) => ({ ...s, [fcol]: e.target.value }))} placeholder={`${asset.cols[fcol]!.name} contém…`} aria-label={`Filtrar ${asset.cols[fcol]!.name}`} onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') setFcol(null); }} /><button type="button" aria-label="Fechar filtro" onClick={() => setFcol(null)}><Icon name="close" size={12} /></button></label>}
        <span className="flex-1" />
        {picked.size > 0 && <span className="dw-muted">{picked.size} selecionadas</span>}
        {Object.values(filters).some(Boolean) && <button type="button" className="bw-link" onClick={() => setFilters({})}>Limpar filtros de coluna</button>}
        {hidden.length > 0 && <button type="button" className="bw-link" onClick={() => setHidden([])}>{hidden.length} ocultas · mostrar</button>}
      </div>
      <div className="dw-grid-scroll" ref={box} style={{ height }} onScroll={(e) => setTop(e.currentTarget.scrollTop)} role="table" aria-label={`Dados de ${asset.name}`} aria-rowcount={data.length}>
        <div style={{ width: total, position: 'relative' }}>
          <div className="dw-grid-head" role="row">
            <span className="dw-grid-ck" role="columnheader"><input type="checkbox" aria-label="Selecionar todas as linhas visíveis" checked={picked.size > 0 && picked.size === data.length} onChange={(e) => setPicked(e.target.checked ? new Set(data.map((d) => d.i)) : new Set())} /></span>
            {order.map((i) => {
              const c = asset.cols[i]!;
              return (
                <div key={c.name} role="columnheader" className={`dw-gh${selCol === c.name ? ' is-on' : ''}${pinned.includes(i) ? ' is-pin' : ''}`} style={{ width: w(i), left: pinned.includes(i) ? offs[i] : undefined }} aria-sort={sort?.i === i ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
                  <button type="button" className="dw-gh-main" onClick={() => onSelectCol(selCol === c.name ? null : c.name)}>
                    <span className="dw-gh-n">{c.flag && <Pill tone="key">{c.flag}</Pill>}<b>{c.name}</b>{sort?.i === i && <Icon name={sort.dir === 1 ? 'chevronDown' : 'chevronRight'} size={12} />}</span>
                    <span className="dw-gh-t"><span>{c.phys}</span>{c.concept && <Pill tone="sem">{c.sem.split(' ')[0]}</Pill>}{c.pii && <Pill tone="pii">PII</Pill>}</span>
                  </button>
                  <Menu title={`Ações de ${c.name}`} trigger={<AriaButton className="bw-iconbtn bw-iconbtn--sm dw-gh-menu" aria-label={`Menu da coluna ${c.name}`}><Icon name="more" size={12} /></AriaButton>} items={[
                    { id: 'profile', label: 'Perfil', icon: 'chart', onAction: () => { onSelectCol(c.name); onAction('profile', c.name); } },
                    { id: 'filter', label: filters[i] ? 'Alterar filtro…' : 'Filtrar…', icon: 'filter', onAction: () => setFcol(i) },
                    { id: 'sort', label: sort?.i === i && sort.dir === 1 ? 'Ordenar decrescente' : 'Ordenar crescente', icon: 'list', onAction: () => setSort(sort?.i === i && sort.dir === 1 ? { i, dir: -1 } : { i, dir: 1 }) },
                    'separator',
                    { id: 'rel', label: 'Encontrar relacionamentos', icon: 'share', onAction: () => { onSelectCol(c.name); onAction('relationships', c.name); } },
                    { id: 'eq', label: 'Encontrar campos equivalentes', icon: 'target', onAction: () => { onSelectCol(c.name); onAction('equivalents', c.name); } },
                    { id: 'lin', label: 'Ver linhagem', icon: 'timeline', onAction: () => { onSelectCol(c.name); onAction('lineage', c.name); } },
                    { id: 'rule', label: 'Criar regra de qualidade', icon: 'check', onAction: () => { onSelectCol(c.name); onAction('rule', c.name); } },
                    'separator',
                    { id: 'pin', label: pinned.includes(i) ? 'Desafixar coluna' : 'Fixar coluna', icon: 'pin', onAction: () => setPinned((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i])) },
                    { id: 'hide', label: 'Ocultar coluna', icon: 'eyeOff', onAction: () => setHidden((h) => [...h, i]) },
                  ]} />
                  <span className="dw-resize" onPointerDown={(e) => startResize(e, i)} role="separator" aria-orientation="vertical" aria-label={`Redimensionar ${c.name}`} />
                </div>
              );
            })}
          </div>
          <div style={{ height: data.length * RH, position: 'relative' }}>
            {data.slice(start, end).map(({ r, i: ri }, k) => (
              <div key={ri} role="row" className={`dw-grow${picked.has(ri) ? ' is-picked' : ''}`} style={{ top: (start + k) * RH }} aria-rowindex={start + k + 1}>
                <span className="dw-grid-ck" role="cell"><input type="checkbox" aria-label={`Selecionar linha ${ri + 1}`} checked={picked.has(ri)} onChange={() => setPicked((s) => { const n = new Set(s); if (n.has(ri)) n.delete(ri); else n.add(ri); return n; })} /></span>
                {order.map((i) => <span key={i} role="cell" className={`dw-gc${selCol === asset.cols[i]!.name ? ' is-col' : ''}${pinned.includes(i) ? ' is-pin' : ''}${typeof r[i] === 'number' ? ' is-num' : ''}`} style={{ width: w(i), left: pinned.includes(i) ? offs[i] : undefined }}>{fmt(r[i] ?? null)}</span>)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
