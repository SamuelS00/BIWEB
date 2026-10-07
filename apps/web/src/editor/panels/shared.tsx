import type { ReactNode } from 'react';
import { FieldTypeIcon, Icon, Select, type FieldKind } from '@biweb/ui';
import { getTable } from '../../data/registry';
import type { Field } from '../../data/types';
import type { Comp } from '../doc';
import { useEditor } from '../store';

export const kindOf = (f: Field): FieldKind => (f.kind === 'measure' ? 'measure' : f.kind === 'date' ? 'date' : f.kind === 'geo' ? 'geo' : 'dimension');
export const fieldsOf = (c: Comp, filter?: (f: Field) => boolean) => (c.data ? getTable(c.data.dataset, c.data.table).fields.filter((f) => !f.hidden && (!filter || filter(f))) : []);
export const fieldOpts = (c: Comp, filter?: (f: Field) => boolean, none?: string) => [...(none ? [{ id: '', label: none }] : []), ...fieldsOf(c, filter).map((f) => ({ id: f.name, label: f.label }))];

/** Altera uma prop do componente com rótulo de undo legível. */
export function useProp(c: Comp) {
  return (key: string, value: unknown, label?: string) => useEditor.getState().update(c.id, (d) => { d.props[key] = value; }, label ?? `Alterar ${key}`);
}

/** Slot de campo que aceita arrastar campos da árvore de dados (ou escolher na lista). */
export function Well({ c, label, value, onChange, accept, hint, optional, labelFor }: { c: Comp; label: string; value?: string; onChange: (v: string) => void; accept?: (f: Field) => boolean; hint: string; optional?: boolean; labelFor?: string }) {
  const f = fieldsOf(c).find((x) => x.name === value) ?? (value === 'id' ? { name: 'id', label: 'Linhas (contagem)', kind: 'dimension' as const } : undefined);
  return (
    <div className="ed-well" onDragOver={(e) => { if (e.dataTransfer.types.includes('application/x-biweb-field')) { e.preventDefault(); e.currentTarget.classList.add('is-over'); } }}
      onDragLeave={(e) => e.currentTarget.classList.remove('is-over')}
      onDrop={(e) => { e.currentTarget.classList.remove('is-over'); const raw = e.dataTransfer.getData('application/x-biweb-field'); if (!raw) return; const { table, field } = JSON.parse(raw) as { table: string; field: string }; if (c.data && table !== c.data.table) useEditor.getState().update(c.id, (d) => { if (d.data) d.data.table = table; }, `Trocar tabela para ${table}`); const ff = getTable(c.data!.dataset, table).fields.find((x) => x.name === field); if (ff && (!accept || accept(ff))) onChange(field); else useEditor.getState().toast({ text: `${ff?.label ?? field} não serve para ${label.toLowerCase()}`, tone: 'danger' }); }}>
      <div className="ed-well-head"><span className="bw-label">{label}</span>{optional && <span className="bw-cap bw-muted">opcional</span>}</div>
      {f ? (
        <div className="bw-chip ed-well-chip"><FieldTypeIcon kind={kindOf(f as Field)} />
          <Select label={labelFor ?? label} hideLabel value={value} onChange={(v: string) => onChange(v)} options={fieldOpts(c, accept, optional ? 'Nenhum' : undefined)} className="ed-well-sel" />
          {optional && <button type="button" className="bw-iconbtn bw-iconbtn--sm" aria-label={`Remover ${f.label}`} onClick={() => onChange('')}><Icon name="close" size={12} /></button>}
        </div>
      ) : (
        <div className="ed-well-empty"><span>{hint}</span><Select label={labelFor ?? label} hideLabel placeholder="Escolher" onChange={(v: string) => onChange(v)} options={fieldOpts(c, accept)} /></div>
      )}
    </div>
  );
}

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return <section className="ed-sec"><div className="ed-sec-head"><span className="bw-label">{title}</span>{right}</div>{children}</section>;
}
export function Row({ label, children }: { label: string; children: ReactNode }) {
  return <div className="bw-prop ed-prop"><span className="bw-label">{label}</span><div className="ed-prop-ctl">{children}</div></div>;
}
export function NoSelection({ text }: { text: string }) {
  return <div className="ed-nosel"><Icon name="info" size={16} /><span>{text}</span></div>;
}
