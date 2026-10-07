import { useState } from 'react';
import { Icon, IconButton } from '@biweb/ui';
import { COMP_META, type CompType } from '../doc';
import { useEditor } from '../store';
import { Section } from './shared';

const ICON: Record<CompType, Parameters<typeof Icon>[0]['name']> = { kpi: 'kpi', chart: 'chart', table: 'table', matrix: 'matrix', text: 'text', image: 'image', filter: 'filter', slicer: 'slicer', map: 'pin', scene3d: 'cube', card: 'card', container: 'container', timeline: 'timeline', status: 'status' };
export const compIcon = (t: CompType) => ICON[t];

function Pages() {
  const doc = useEditor((s) => s.doc)!;
  const cur = useEditor((s) => s.pageId);
  const [editing, setEditing] = useState<string | null>(null);
  const st = useEditor.getState();
  return (
    <Section title={`Páginas · ${doc.pages.length}`} right={<IconButton icon="plus" size="sm" label="Nova página" onPress={() => st.addPage()} />}>
      <div className="ed-list" role="listbox" aria-label="Páginas">
        {doc.pages.map((p, i) => (
          <div key={p.id} role="option" aria-selected={p.id === cur} className="ed-li" onClick={() => st.goPage(p.id)} onDoubleClick={() => setEditing(p.id)}>
            <Icon name="pages" size={12} />
            {editing === p.id ? (
              <input className="ed-rename" defaultValue={p.name} autoFocus aria-label="Nome da página" onClick={(e) => e.stopPropagation()}
                onBlur={(e) => { const v = e.currentTarget.value.trim(); if (v && v !== p.name) st.renamePage(p.id, v); setEditing(null); }}
                onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setEditing(null); }} />
            ) : <span className="ed-li-name">{p.name}</span>}
            <span className="bw-cap bw-muted">{p.comps.length}</span>
            <span className="ed-li-acts" onClick={(e) => e.stopPropagation()}>
              <IconButton icon="arrowLeft" size="sm" label="Mover para cima" isDisabled={i === 0} onPress={() => st.movePage(p.id, -1)} className="ed-rot90" />
              <IconButton icon="arrowRight" size="sm" label="Mover para baixo" isDisabled={i === doc.pages.length - 1} onPress={() => st.movePage(p.id, 1)} className="ed-rot90" />
              <IconButton icon="brush" size="sm" label="Renomear" onPress={() => setEditing(p.id)} />
              <IconButton icon="copy" size="sm" label="Duplicar página" onPress={() => st.duplicatePage(p.id)} />
              <IconButton icon="trash" size="sm" label={doc.pages.length < 2 ? 'O relatório precisa de ao menos uma página' : 'Excluir página'} isDisabled={doc.pages.length < 2} onPress={() => st.deletePage(p.id)} />
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Layers() {
  const page = useEditor((s) => s.page())!;
  const selection = useEditor((s) => s.selection);
  const [editing, setEditing] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const st = useEditor.getState();
  const list = [...page.comps].sort((a, b) => b.z - a.z);
  const reorder = (from: string, to: string) => {
    if (from === to) return;
    st.commit('Reordenar camadas', (d) => {
      const pg = d.pages.find((p) => p.id === page.id)!;
      const ord = [...pg.comps].sort((a, b) => b.z - a.z);
      const fi = ord.findIndex((c) => c.id === from), ti = ord.findIndex((c) => c.id === to);
      const [m] = ord.splice(fi, 1); ord.splice(ti, 0, m!);
      ord.forEach((c, i) => { c.z = ord.length - i; });
    });
  };
  return (
    <Section title={`Camadas · ${page.comps.length}`} right={<span className="bw-cap bw-muted">topo primeiro</span>}>
      {list.length === 0 && <p className="ed-help">Nenhum componente nesta página.</p>}
      <div className="ed-list" role="listbox" aria-label="Camadas" aria-multiselectable>
        {list.map((c) => (
          <div key={c.id} role="option" aria-selected={selection.includes(c.id)} className={`ed-li ed-layer${c.hidden ? ' is-hidden' : ''}${dragId === c.id ? ' is-drag' : ''}`} draggable={editing !== c.id}
            onDragStart={(e) => { setDragId(c.id); e.dataTransfer.setData('text/plain', c.id); e.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => setDragId(null)}
            onDragOver={(e) => { if (dragId) { e.preventDefault(); e.currentTarget.classList.add('is-over'); } }} onDragLeave={(e) => e.currentTarget.classList.remove('is-over')}
            onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('is-over'); if (dragId) reorder(dragId, c.id); setDragId(null); }}
            onClick={(e) => st.select([c.id], e.shiftKey || e.metaKey || e.ctrlKey)} onDoubleClick={() => setEditing(c.id)}>
            <Icon name="grip" size={12} className="ed-grip" />
            <span className="ed-layer-kind"><Icon name={ICON[c.type]} size={12} /></span>
            {editing === c.id ? (
              <input className="ed-rename" defaultValue={c.name} autoFocus aria-label="Nome do componente" onClick={(e) => e.stopPropagation()}
                onBlur={(e) => { const v = e.currentTarget.value.trim(); if (v && v !== c.name) st.update(c.id, (d) => { d.name = v; }, `Renomear para ${v}`); setEditing(null); }}
                onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setEditing(null); }} />
            ) : <span className="ed-li-name" title={`${COMP_META[c.type].label} · ${c.name}`}>{c.name}</span>}
            <span className="ed-li-acts ed-li-acts--keep" onClick={(e) => e.stopPropagation()}>
              <IconButton icon={c.hidden ? 'eyeOff' : 'eye'} size="sm" label={c.hidden ? 'Mostrar na visualização' : 'Ocultar na visualização'} onPress={() => st.update(c.id, (d) => { d.hidden = !c.hidden; }, c.hidden ? `Mostrar ${c.name}` : `Ocultar ${c.name}`)} className={c.hidden ? 'is-on' : undefined} />
              <IconButton icon={c.locked ? 'lock' : 'unlock'} size="sm" label={c.locked ? 'Desbloquear' : 'Bloquear posição'} onPress={() => st.update(c.id, (d) => { d.locked = !c.locked; }, c.locked ? `Desbloquear ${c.name}` : `Bloquear ${c.name}`)} className={c.locked ? 'is-on' : undefined} />
            </span>
          </div>
        ))}
      </div>
      {selection.length > 0 && (
        <div className="ed-layer-order">
          <IconButton icon="layers" size="sm" label="Trazer para a frente · ⇧⌘]" onPress={() => st.order('front')} />
          <IconButton icon="arrowLeft" size="sm" className="ed-rot90" label="Avançar uma camada · ⌘]" onPress={() => st.order('forward')} />
          <IconButton icon="arrowRight" size="sm" className="ed-rot90" label="Recuar uma camada · ⌘[" onPress={() => st.order('backward')} />
          <span className="bw-cap bw-muted">Ordem das camadas</span>
        </div>
      )}
    </Section>
  );
}

export function BuildTab() {
  return <div className="ed-tab"><Pages /><Layers /></div>;
}
