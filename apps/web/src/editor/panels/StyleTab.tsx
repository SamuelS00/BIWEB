import { useShallow } from 'zustand/react/shallow';
import { COMP_META } from '../doc';
import { useEditor } from '../store';
import { Geometry, PageProps, StyleProps } from './VisualTab';

/** STYLE: title, surface, colors and geometry. Separate from VISUAL, which is about what the chart shows. */
export function StyleTab() {
  const sel = useEditor(useShallow((s) => s.page()?.comps.filter((c) => s.selection.includes(c.id)) ?? []));
  if (sel.length !== 1) return <div className="ed-tab"><PageProps /></div>;
  const c = sel[0]!;
  return (
    <div className="ed-tab">
      <div className="ed-tab-title">{COMP_META[c.type].label} · {c.name}</div>
      {c.type !== 'text' && c.type !== 'image' && <StyleProps c={c} />}
      <Geometry c={c} />
    </div>
  );
}
