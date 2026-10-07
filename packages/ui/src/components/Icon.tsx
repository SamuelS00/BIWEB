/** Ícones de linha próprios: traço 1,5 px em grade de 16 px, desenhados em currentColor (docs/design/README.md · Iconografia). */
const PATHS = {
  chevronRight: 'M6 4l4 4-4 4', chevronDown: 'M4 6l4 4 4-4', plus: 'M8 3v10M3 8h10', minus: 'M3 8h10', close: 'M4 4l8 8M12 4l-8 8',
  more: 'M3 8h.01M8 8h.01M13 8h.01', search: 'M7 3a4 4 0 100 8 4 4 0 000-8zM10 10l3.5 3.5', check: 'M3 8.5l3 3 7-7',
  filter: 'M2.5 3.5h11l-4.2 5v4l-2.6 1.2V8.5z', table: 'M2.5 3h11v10h-11zM2.5 6.5h11M2.5 10h11M6.5 3v10',
  expand: 'M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5L9 7M2.5 13.5L7 9', undo: 'M5 3.5L2.5 6 5 8.5M2.5 6h7a3.5 3.5 0 010 7H7',
  redo: 'M11 3.5L13.5 6 11 8.5M13.5 6h-7a3.5 3.5 0 000 7H9', warning: 'M8 2.5l6 11H2zM8 6.5v3M8 11.5v.2', info: 'M8 2a6 6 0 100 12A6 6 0 008 2zM8 7v4M8 4.8v.2',
  data: 'M3 4c0-1 2.2-1.8 5-1.8s5 .8 5 1.8-2.2 1.8-5 1.8S3 5 3 4zM3 4v8c0 1 2.2 1.8 5 1.8s5-.8 5-1.8V4M3 8c0 1 2.2 1.8 5 1.8s5-.8 5-1.8',
  brush: 'M2.5 13.5h4M3 13l7.5-7.5 2 2L5 15M10.5 5.5l1.5-1.5 2 2-1.5 1.5', layers: 'M8 2.5l5.5 3L8 8.5 2.5 5.5zM2.5 8.5L8 11.5l5.5-3M2.5 11L8 14l5.5-3',
  chat: 'M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z', grid: 'M2.5 2.5h4.5v4.5H2.5zM9 2.5h4.5v4.5H9zM2.5 9h4.5v4.5H2.5zM9 9h4.5v4.5H9z',
  model: 'M2 2.5h5v4H2zM9 9.5h5v4H9zM4.5 6.5v5h4.5', book: 'M3 2.5h8.5v11H3zM5.5 2.5v11', sliders: 'M3 4h10M3 8h10M3 12h10M6 3v2M10 7v2M5 11v2',
  play: 'M4.5 3l8 5-8 5z', share: 'M5.6 7.2l4.8-2.4M5.6 8.8l4.8 2.4M4 6.2a1.8 1.8 0 110 3.6 1.8 1.8 0 010-3.6zM12 2.2a1.8 1.8 0 110 3.6 1.8 1.8 0 010-3.6zM12 10.2a1.8 1.8 0 110 3.6 1.8 1.8 0 010-3.6z',
  eye: 'M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8zM8 6.2a1.8 1.8 0 100 3.6 1.8 1.8 0 000-3.6z',
  calendar: 'M2.5 3.5h11v10h-11zM2.5 6.5h11M5.5 2v3M10.5 2v3', pin: 'M8 14s4.5-4.2 4.5-7.5a4.5 4.5 0 00-9 0C3.5 9.8 8 14 8 14z', lock: 'M3.5 7h9v6.5h-9zM5.5 7V5a2.5 2.5 0 015 0v2',
  key: 'M5 5.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM7.5 8h6M11.5 8v2.5', refresh: 'M13 4v3h-3M3 12V9h3M12.6 7A5 5 0 004 5.2M3.4 9A5 5 0 0012 10.8',
  fit: 'M2.5 5.5v-3h3M10.5 2.5h3v3M13.5 10.5v3h-3M5.5 13.5h-3v-3',
  report: 'M3.5 2h6l3 3v9h-9zM9.5 2v3h3M5.5 8h5M5.5 10.5h5M5.5 13h3', list: 'M5.5 4h8M5.5 8h8M5.5 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01',
  star: 'M8 2l1.8 3.8 4.2.5-3.1 2.9.8 4.1L8 11.3 4.3 13.3l.8-4.1L2 6.3l4.2-.5z', send: 'M2.5 8l11-5.5-3.5 11-2.5-4.5zM7.5 9l6-6.5',
  clock: 'M8 2a6 6 0 100 12A6 6 0 008 2zM8 4.5V8l2.5 1.5', user: 'M8 2.5a2.75 2.75 0 100 5.5 2.75 2.75 0 000-5.5zM3 13.5c.6-2.5 2.6-4 5-4s4.4 1.5 5 4',
  arrowRight: 'M3 8h10M9 4l4 4-4 4', arrowLeft: 'M13 8H3M7 4L3 8l4 4', download: 'M8 2.5v8M4.5 7L8 10.5 11.5 7M3 13.5h10', copilot: 'M2.5 4.5h11v6.5h-5l-3 2.5V11h-3zM5.5 7.5h5M5.5 9h3', home: 'M2.5 7.5L8 3l5.5 4.5V13.5h-11zM6.5 13.5v-4h3v4',
} as const;
export type IconName = keyof typeof PATHS;
export interface IconProps { name: IconName; size?: 12 | 16 | 20; className?: string }
export function Icon({ name, size = 16, className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false"
      fill="none" stroke="currentColor" strokeWidth={name === 'more' ? 2.4 : 1.5} strokeLinecap={name === 'more' ? 'round' : 'butt'}>
      <path d={PATHS[name]} />
    </svg>
  );
}
