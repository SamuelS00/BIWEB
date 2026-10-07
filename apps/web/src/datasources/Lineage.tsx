import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Badge, Icon } from '@biweb/ui';
import type { Dataset } from '../data/types';
import type { ReportDoc } from '../editor/doc';
import { nf, plural } from './analyze';

export interface ReportUse { doc: ReportDoc; tables: string[]; pages: number }
/** Relatórios que leem o dataset, com as tabelas usadas por algum componente. */
export function reportsUsing(ds: Dataset, docs: ReportDoc[]): ReportUse[] {
  return docs.filter((d) => d.datasets.includes(ds.id)).map((doc) => {
    const t = new Set<string>();
    for (const p of doc.pages) for (const c of p.comps) if (c.data && c.data.dataset === ds.id) t.add(c.data.table);
    return { doc, tables: ds.tables.filter((x) => t.has(x.id)).map((x) => x.id), pages: doc.pages.length };
  });
}

type Box = { l: number; r: number; t: number; b: number };
type Geo = { src: Box | null; ds: Box | null; tables: Record<string, Box>; reports: Record<string, Box> };
const curve = (x1: number, y1: number, x2: number, y2: number) => { const m = (x1 + x2) / 2; return `M${x1} ${y1}C${m} ${y1} ${m} ${y2} ${x2} ${y2}`; };
const midY = (b: Box) => (b.t + b.b) / 2;

/** Linhagem horizontal Fonte → Dataset (tabelas) → Relatórios, com conectores SVG de 1 px. Passar o cursor destaca o caminho. */
export function Lineage({ ds, uses }: { ds: Dataset; uses: ReportUse[] }) {
  const navigate = useNavigate();
  const root = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<Geo>({ src: null, ds: null, tables: {}, reports: {} });
  const [hover, setHover] = useState<{ kind: 'report' | 'table' | 'source'; id: string } | null>(null);

  useLayoutEffect(() => {
    const el = root.current; if (!el) return;
    const measure = () => {
      const o = el.getBoundingClientRect();
      const box = (n: Element | null): Box | null => { if (!n) return null; const r = n.getBoundingClientRect(); return { l: r.left - o.left, r: r.right - o.left, t: r.top - o.top, b: r.bottom - o.top }; };
      const map = (sel: string, attr: string) => Object.fromEntries([...el.querySelectorAll(sel)].map((n) => [n.getAttribute(attr) ?? '', box(n)!]));
      setGeo({ src: box(el.querySelector('[data-lin="src"]')), ds: box(el.querySelector('[data-lin="ds"]')), tables: map('[data-lin-table]', 'data-lin-table'), reports: map('[data-lin-report]', 'data-lin-report') });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ds, uses]);

  const tableUse = useMemo(() => Object.fromEntries(ds.tables.map((t) => [t.id, uses.filter((u) => u.tables.includes(t.id)).length])), [ds, uses]);
  const hotReport = (u: ReportUse) => !hover ? false : hover.kind === 'source' || (hover.kind === 'report' && hover.id === u.doc.id) || (hover.kind === 'table' && u.tables.includes(hover.id));
  const hotTable = (id: string) => !!hover && ((hover.kind === 'table' && hover.id === id) || (hover.kind === 'report' && !!uses.find((u) => u.doc.id === hover.id)?.tables.includes(id)));
  const srcHot = !!hover && (hover.kind !== 'table');

  const paths: { d: string; hot: boolean; key: string }[] = [];
  if (geo.src && geo.ds) paths.push({ key: 'src', d: curve(geo.src.r, midY(geo.src), geo.ds.l, midY(geo.ds)), hot: srcHot });
  if (geo.ds) for (const u of uses) {
    const r = geo.reports[u.doc.id]; if (!r) continue;
    const fromTable = hover?.kind === 'table' && u.tables.includes(hover.id) ? geo.tables[hover.id] : undefined;
    const x1 = geo.ds.r, y1 = fromTable ? midY(fromTable) : midY(geo.ds);
    paths.push({ key: u.doc.id, d: curve(x1, y1, r.l, midY(r)), hot: hotReport(u) });
  }
  paths.sort((a, b) => Number(a.hot) - Number(b.hot));
  const totalRows = ds.tables.reduce((s, t) => s + t.rows.length, 0);
  const isPg = ds.source.kind === 'PostgreSQL';
  const [srcName, srcDetail] = ds.source.label.split(' · ');

  return (
    <div ref={root} className="ds-lineage" data-hovering={hover ? '' : undefined} onPointerLeave={() => setHover(null)}>
      <svg className="ds-lineage-svg" aria-hidden="true">
        {paths.map((p) => <path key={p.key} d={p.d} className={p.hot ? 'is-hot' : undefined} />)}
      </svg>

      <span className="ds-lin-label">Fonte</span>
      <span className="ds-lin-label">Dataset</span>
      <span className="ds-lin-label">Relatórios <span className="bw-num">{uses.length}</span></span>

      <div className="ds-lin-col ds-lin-col--mid">
        <div data-lin="src" className={`ds-lin-node${srcHot ? ' is-hot' : ''}`} onPointerEnter={() => setHover({ kind: 'source', id: 'src' })}>
          <span className="ds-lin-ico"><Icon name={isPg ? 'data' : ds.source.kind === 'API' ? 'share' : 'layers'} /></span>
          <div className="ds-lin-node-text">
            <b className="bw-mono">{srcName}</b>
            <small>{isPg ? `PostgreSQL${srcDetail ? ` · ${srcDetail}` : ''}` : `Arquivo ${ds.source.kind}`}</small>
            <small className="bw-muted">{ds.source.schedule === 'Manual' ? 'Atualização manual' : `Atualiza ${ds.source.schedule.toLowerCase()}`}</small>
          </div>
        </div>
      </div>

      <div className="ds-lin-col ds-lin-col--mid">
        <div data-lin="ds" className="ds-lin-node ds-lin-node--ds">
          <div className="ds-lin-ds-head">
            <b>{ds.name}</b>
            {ds.certified ? <Badge tone="success" icon="check">Certificado</Badge> : <Badge tone="warning">Não certificado</Badge>}
          </div>
          <small className="bw-muted bw-num">{plural(ds.tables.length, 'tabela', 'tabelas')} · {nf(totalRows)} linhas</small>
          <ul className="ds-lin-tables">
            {ds.tables.map((t) => (
              <li key={t.id} data-lin-table={t.id} className={hotTable(t.id) ? 'is-hot' : undefined} onPointerEnter={() => setHover({ kind: 'table', id: t.id })}
                title={`${t.name}: usada por ${plural(tableUse[t.id] ?? 0, 'relatório', 'relatórios')}`}>
                <span>{t.name}</span><span className="bw-num bw-secondary">{nf(t.rows.length)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="ds-lin-col ds-lin-col--reports">
        {uses.length === 0 ? (
          <p className="ds-note ds-lin-empty">Nenhum relatório usa este dataset ainda.</p>
        ) : (
          <ul className="ds-lin-reports">
            {uses.map((u) => (
              <li key={u.doc.id}>
                <button type="button" data-lin-report={u.doc.id} className={`ds-lin-report${hotReport(u) ? ' is-hot' : ''}`}
                  onPointerEnter={() => setHover({ kind: 'report', id: u.doc.id })} onFocus={() => setHover({ kind: 'report', id: u.doc.id })} onBlur={() => setHover(null)}
                  onClick={() => navigate({ to: '/reports/$reportId', params: { reportId: u.doc.id } })}>
                  <Icon name="report" size={12} />
                  <span className="ds-lin-report-text">
                    <b>{u.doc.name}</b>
                    <small className="bw-num">{u.doc.kind} · {plural(u.pages, 'página', 'páginas')}{u.tables.length > 0 && ` · ${u.tables.map((id) => ds.tables.find((t) => t.id === id)?.name ?? id).join(', ')}`}</small>
                  </span>
                  <Badge tone={u.doc.status === 'Publicado' ? 'success' : 'warning'}>{u.doc.status}</Badge>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
