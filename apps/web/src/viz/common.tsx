import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { rowsOf } from '../data/query';
import { liveRows, useLiveTick } from './states';
import { getTable } from '../data/registry';
import type { Filter, Row } from '../data/types';
import type { Comp } from '../editor/doc';
import { useEditor } from '../editor/store';
import { useUi } from '../state/ui-store';

/** Tamanho do elemento (ResizeObserver), em px inteiros. */
export function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () => setSize((s) => { const w = Math.round(el.clientWidth), h = Math.round(el.clientHeight); return s.w === w && s.h === h ? s : { w, h }; });
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

/** Filtros efetivos de um componente (página, segmentações, cross-filter, drill, locais). Re-renderiza só quando eles mudam. */
export function useFilters(comp: Comp, exclude?: string): Filter[] {
  const key = useEditor(useShallow((s) => [s.filterValues, s.cross, s.drill, s.view, s.doc?.filters, s.doc?.pages.find((p) => p.id === s.pageId)?.comps, s.doc?.pages.find((p) => p.id === s.pageId)?.filters] as const));
  return useMemo(() => {
    const fs = useEditor.getState().filtersFor(comp);
    return exclude ? fs.filter((f) => f.field !== exclude) : fs;
  }, [comp, exclude, ...key]); // eslint-disable-line react-hooks/exhaustive-deps
}
export function useRules() { return useEditor((s) => s.doc?.rules ?? EMPTY); }
const EMPTY: never[] = [];

/** Linhas efetivas do componente (regras + filtros). */
export function useRows(comp: Comp, table?: string, exclude?: string): Row[] {
  const filters = useFilters(comp, exclude);
  const rules = useRules();
  const ds = comp.data?.dataset ?? 'ds_rede_sp', t = table ?? comp.data?.table ?? 'enlaces';
  const live = useLiveTick(comp.props.live as boolean | undefined);
  return useMemo(() => liveRows(rowsOf(ds, t, { rules, filters }), ds, t, live), [ds, t, rules, filters, live]);
}
export const fieldOf = (comp: Comp, name?: string, table?: string) => (name ? getTable(comp.data?.dataset ?? 'ds_rede_sp', table ?? comp.data?.table ?? 'enlaces').fields.find((f) => f.name === name) : undefined);

/** Lê tokens CSS (cores) do contexto do componente; recalcula quando o tema do dashboard muda. */
export function useTokens(ref: React.RefObject<HTMLElement | null>, names: string[]) {
  const theme = useUi((s) => s.appTheme);
  const dash = useDashTheme();
  const [t, setT] = useState<Record<string, string>>({});
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cs = getComputedStyle(el);
    setT(Object.fromEntries(names.map((n) => [n, cs.getPropertyValue(`--${n}`).trim() || '#888'])));
  }, [dash, theme]); // eslint-disable-line react-hooks/exhaustive-deps
  return t;
}
export const useDashTheme = () => useUi((s) => s.dashTheme);

export const STATUS_VAR: Record<string, string> = { normal: 'viz-status-normal', warning: 'viz-status-warning', critical: 'viz-status-critical', offline: 'viz-status-offline' };
export function StatusDot({ s, size = 8 }: { s: string; size?: number }) {
  return <i className={`vz-dot vz-dot--${s}`} style={{ width: size, height: size }} aria-hidden="true" />;
}
export function Tip({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return <div className="vz-tip" style={{ transform: `translate(${Math.round(x)}px, ${Math.round(y)}px)` }} role="status">{children}</div>;
}
export function Empty({ text, hint }: { text: string; hint?: string }) {
  return <div className="vz-empty"><b>{text}</b>{hint && <span>{hint}</span>}</div>;
}
export const isReduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
