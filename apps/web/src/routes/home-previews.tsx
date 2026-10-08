import { MapCover } from './maps/MapCover';
import type { CoverKind } from './maps/MapCover';
import type { Preview, Step } from './home-model';

/** Prévias reais dos objetos do workspace: mapa, dashboard, grafo de fluxo, tabela de dataset e relacionamentos do modelo. */

const COL_X = [24, 232, 440], NODE_W = 170, NODE_H = 30;
const pos = (steps: Step[], i: number) => {
  const s = steps[i]!, row = steps.slice(0, i).filter((x) => x.group === s.group).length, count = steps.filter((x) => x.group === s.group).length;
  return { x: COL_X[s.group]!, y: 100 - (count * 46 - 16) / 2 + row * 46 };
};

export function WorkflowGraph({ steps, mini }: { steps: Step[]; mini?: boolean }) {
  return (
    <svg className={`pv-graph${mini ? ' pv-graph--mini' : ''}`} viewBox="0 0 640 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {steps.slice(1).map((s, i) => {
        const a = pos(steps, i), b = pos(steps, i + 1), blocked = steps[i]!.state !== 'done';
        const x1 = a.x + NODE_W, y1 = a.y + NODE_H / 2, x2 = b.x, y2 = b.y + NODE_H / 2;
        const same = a.x === b.x, d = same ? `M${a.x + NODE_W / 2} ${a.y + NODE_H} V${b.y}` : `M${x1} ${y1} C${x1 + 24} ${y1} ${x2 - 24} ${y2} ${x2} ${y2}`;
        return <path key={s.title} d={d} className={`pv-edge${blocked ? ' is-blocked' : ''}`} />;
      })}
      {steps.map((s, i) => { const p = pos(steps, i); return (
        <g key={s.title} transform={`translate(${p.x} ${p.y})`} className={`pv-node pv-node--${s.state}`}>
          <rect width={NODE_W} height={NODE_H} rx="6" />
          <circle cx="14" cy={NODE_H / 2} r="4" />
          {!mini && <text x="26" y={NODE_H / 2 + 4}>{s.title}</text>}
        </g>); })}
    </svg>
  );
}

export function ModelGraph({ graph }: { graph: NonNullable<Preview['graph']> }) {
  const { tables, rels } = graph, cx = 320, cy = 100, R = 66;
  const at = (i: number) => (i === 0 ? { x: cx, y: cy } : { x: cx + Math.cos(((i - 1) / (tables.length - 1)) * Math.PI * 2 - Math.PI / 2) * (R + 140), y: cy + Math.sin(((i - 1) / (tables.length - 1)) * Math.PI * 2 - Math.PI / 2) * R });
  const p = (id: string) => at(Math.max(0, tables.findIndex((t) => t.id === id)));
  return (
    <svg className="pv-graph" viewBox="0 0 640 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {rels.map(([a, b]) => { const A = p(a), B = p(b); return <path key={a + b} className="pv-edge is-rel" d={`M${A.x} ${A.y} L${B.x} ${B.y}`} />; })}
      {tables.map((t, i) => { const q = at(i); return (
        <g key={t.id} transform={`translate(${q.x - 58} ${q.y - 20})`} className={`pv-node pv-table${i === 0 ? ' is-fact' : ''}`}>
          <rect width="116" height="40" rx="6" /><text x="10" y="17" className="pv-t-name">{t.name}</text><text x="10" y="31" className="pv-t-sub">{t.n} campos</text>
        </g>); })}
    </svg>
  );
}

export function TablePreview({ t }: { t: NonNullable<Preview['table']> }) {
  return (
    <div className="pv-table-wrap">
      <div className="pv-table-head"><b>{t.name}</b><span>{t.total}</span></div>
      <table className="pv-table-grid"><thead><tr>{t.cols.map((c) => <th key={c.name}><i className={`pv-kind pv-kind--${c.kind === '#' ? 'num' : c.kind}`}>{c.kind}</i>{c.name}</th>)}</tr></thead>
        <tbody>{t.rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j} className={t.cols[j]?.kind === '#' ? 'is-num' : ''}>{v}</td>)}</tr>)}</tbody></table>
    </div>
  );
}

/** Mapa vivo: usa o mesmo desenho das capas da galeria, com os trechos animados. */
export function MapPreview({ kind }: { kind: CoverKind }) { return <MapCover kind={kind} className="pv-map" />; }

export function PreviewFor({ p }: { p: Preview }) {
  if (p.map) return <MapPreview kind={p.map} />;
  if (p.img) return <img className="pv-img" src={p.img()} alt="" />;
  if (p.steps) return <div className="pv-canvas"><WorkflowGraph steps={p.steps} /></div>;
  if (p.table) return <div className="pv-canvas"><TablePreview t={p.table} /></div>;
  if (p.graph) return <div className="pv-canvas"><ModelGraph graph={p.graph} /></div>;
  return null;
}
