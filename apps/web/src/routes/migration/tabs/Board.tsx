import type { Widget } from '../analysis';

type Mini = 'kpi' | 'line' | 'bar' | 'col' | 'table' | 'matrix' | 'map' | 'donut' | 'pie' | 'treemap' | 'slicer' | 'sankey' | 'gauge' | 'custom' | 'scatter' | 'area' | 'waterfall' | 'funnel' | 'text' | 'cascade';
export function miniOf(t: string): Mini {
  const x = t.toLowerCase();
  if (/custom|python|r visual/.test(x)) return /sankey/.test(x) ? 'sankey' : 'custom';
  if (/sankey/.test(x)) return 'sankey'; if (/map|mapa/.test(x)) return 'map'; if (/pie|pizza/.test(x)) return 'pie'; if (/treemap/.test(x)) return 'treemap'; if (/donut|rosca/.test(x)) return 'donut';
  if (/card|kpi|grupo de kpi|multi-row/.test(x)) return 'kpi'; if (/gauge|medidor/.test(x)) return 'gauge'; if (/slicer|filtro/.test(x)) return 'slicer';
  if (/matrix|matriz/.test(x)) return 'matrix'; if (/table|tabela/.test(x)) return 'table'; if (/scatter|dispers/.test(x)) return 'scatter'; if (/area|ribbon|empilhad.*ranking/.test(x)) return 'area';
  if (/waterfall|cascata/.test(x)) return 'waterfall'; if (/funnel|funil/.test(x)) return 'funnel'; if (/line|linha|série|combinado/.test(x)) return 'line';
  if (/bar|barras/.test(x) && !/stacked|empilh/.test(x)) return 'bar'; if (/narrative|narrativa|influencers|insight/.test(x)) return 'text'; if (/decomposition|hierarquia/.test(x)) return 'cascade';
  return 'col';
}
const H = [38, 62, 46, 72, 54, 80, 60, 90];
function Glyph({ k, orig }: { k: Mini; orig?: boolean }) {
  const c = 'ms-g';
  switch (k) {
    case 'kpi': return <div className="ms-g-kpi"><b>{orig ? '18,4M' : 'R$ 18,42 mi'}</b><i /></div>;
    case 'line': case 'area': return <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={c}><path d="M0,32 L14,26 L28,30 L42,18 L56,22 L70,10 L84,14 L100,5" className={k === 'area' ? 'fill' : 'stroke'} />{k === 'area' && <path d="M0,32 L14,26 L28,30 L42,18 L56,22 L70,10 L84,14 L100,5 L100,40 L0,40Z" className="area" />}</svg>;
    case 'bar': return <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={c}>{[88, 70, 56, 40, 28].map((w, i) => <rect key={i} x={0} y={i * 8 + 1} width={w} height={5} className="bar" />)}</svg>;
    case 'col': case 'waterfall': case 'cascade': return <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={c}>{H.map((h, i) => <rect key={i} x={i * 12.5 + 2} y={k === 'waterfall' ? 40 - h / 2.6 - (i % 3) * 5 : 40 - h / 2.4} width={8} height={k === 'waterfall' ? 9 + (i % 3) * 3 : h / 2.4} className="bar" />)}</svg>;
    case 'table': case 'matrix': return <div className="ms-g-table">{[0, 1, 2, 3, 4].map((r) => <div key={r}>{[0, 1, 2, k === 'matrix' ? 3 : 2].slice(0, k === 'matrix' ? 4 : 3).map((x, i) => <i key={i} className={r === 0 ? 'h' : ''} />)}</div>)}</div>;
    case 'map': return <svg viewBox="0 0 100 50" className={c}><path d="M12,30 L22,14 L40,10 L54,16 L70,12 L88,24 L80,40 L58,44 L40,38 L24,42Z" className="land" />{[[30, 24], [48, 28], [62, 22], [70, 34], [40, 18]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2.6} className="dot" />)}</svg>;
    case 'donut': return <svg viewBox="0 0 40 40" className={`${c} sq`}><circle cx="20" cy="20" r="12" className="ring" strokeDasharray="38 38" /><circle cx="20" cy="20" r="12" className="ring b" strokeDasharray="22 54" strokeDashoffset="-38" /></svg>;
    case 'pie': return <svg viewBox="0 0 40 40" className={`${c} sq`}>{Array.from({ length: 14 }).map((_, i) => { const a0 = (i / 14) * Math.PI * 2, a1 = ((i + 1) / 14) * Math.PI * 2; return <path key={i} d={`M20,20 L${20 + 15 * Math.sin(a0)},${20 - 15 * Math.cos(a0)} A15,15 0 0 1 ${20 + 15 * Math.sin(a1)},${20 - 15 * Math.cos(a1)}Z`} className={`slice s${i % 4}`} />; })}</svg>;
    case 'treemap': return <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={c}><rect x={1} y={1} width={46} height={38} className="t0" /><rect x={49} y={1} width={30} height={22} className="t1" /><rect x={81} y={1} width={18} height={22} className="t2" /><rect x={49} y={25} width={22} height={14} className="t2" /><rect x={73} y={25} width={26} height={14} className="t0" /></svg>;
    case 'slicer': return <div className="ms-g-chips">{['Sudeste', 'Sul', 'Nordeste', 'Norte', 'C. Oeste'].map((s, i) => <i key={s} className={i === 0 ? 'on' : ''}>{s}</i>)}</div>;
    case 'sankey': return <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={c}><path d="M4,6 C40,6 60,10 96,8 L96,16 C60,18 40,16 4,16Z" className="flow" /><path d="M4,22 C40,22 60,30 96,30 L96,36 C60,36 40,30 4,30Z" className="flow b" /></svg>;
    case 'gauge': return <svg viewBox="0 0 60 36" className={`${c} sq`}><path d="M8,32 A22,22 0 0 1 52,32" className="track" /><path d="M8,32 A22,22 0 0 1 42,13" className="val" /></svg>;
    case 'scatter': return <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={c}>{[[10, 30], [22, 22], [30, 28], [44, 16], [52, 20], [64, 10], [76, 14], [88, 6]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2.4} className="dot" />)}</svg>;
    case 'funnel': return <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={c}>{[96, 74, 52, 30].map((w, i) => <rect key={i} x={(100 - w) / 2} y={i * 10 + 1} width={w} height={8} className="bar" />)}</svg>;
    case 'text': return <div className="ms-g-lines">{[96, 80, 88, 52].map((w, i) => <i key={i} style={{ width: `${w}%` }} />)}</div>;
    default: return <div className="ms-g-custom">?<small>visual personalizado</small></div>;
  }
}

/** Layout esquemático da página em grade de 12 colunas. Não é pixel-perfect: comunica estrutura e diferença. */
export function Board({ widgets, mode, onPick, picked, changed }: { widgets: Widget[]; mode: 'orig' | 'biweb'; onPick?: (id: string) => void; picked?: string; changed?: boolean }) {
  return <div className={`ms-board is-${mode}`} role="img" aria-label={mode === 'orig' ? 'Página original' : 'Página reconstruída no BIWEB'}>
    <div className="ms-board-bar"><i /><i /><i /><span>{mode === 'orig' ? 'Power BI · Exibição de leitura' : 'BIWEB · Report Builder'}</span></div>
    <div className="ms-board-grid">
      {widgets.map((w, i) => {
        const typ = mode === 'orig' ? w.type : w.target, diff = changed && (w.compat === 'redesign' || w.compat === 'review');
        return <button key={w.id} type="button" className={`ms-w${w.id === picked ? ' is-pick' : ''}${diff ? ' is-diff' : ''}${mode === 'biweb' && w.compat === 'review' ? ' is-review' : ''}`} style={{ gridColumn: `${w.x + 1} / span ${w.w}`, gridRow: `${w.y + 1} / span ${w.h}`, animationDelay: `${i * 45}ms` }} onClick={() => onPick?.(w.id)} aria-label={`${w.name}: ${typ}`}>
          <small>{w.name}</small><Glyph k={miniOf(typ)} orig={mode === 'orig'} />{diff && <em>{w.compat === 'review' ? 'revisar' : 'alterado'}</em>}</button>;
      })}
    </div>
  </div>;
}
export { Glyph };
