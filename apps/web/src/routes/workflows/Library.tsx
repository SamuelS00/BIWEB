import { useState } from 'react';
import { Icon } from '@biweb/ui';
import { useWf } from './store';
import { CATS, NODE_KINDS, kindOf } from './model';
import { optimizations } from './engine';

/** Biblioteca pesquisável de nós por categoria. Extensível: `registerNodeKind` adiciona tipos de plugins. */
export function NodeLibrary() {
  const add = useWf((s) => s.addNodeAuto), editable = useWf((s) => s.mode === 'edit' && s.view === 'draft');
  const [q, setQ] = useState('');
  const [closed, setClosed] = useState<string[]>([]);
  const term = q.trim().toLowerCase();
  return <div className="wf-lib">
    <label className="wf-search wf-search--block"><Icon name="search" size={12} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nós (ex.: normalizar, webhook)" aria-label="Buscar na biblioteca de nós" /></label>
    {!editable && <p className="wf-hint">Mude para <b>Editar</b> para adicionar nós. Arraste para o canvas ou clique para inserir após o nó selecionado.</p>}
    <div className="wf-lib-list">
      {CATS.map((c) => {
        const items = NODE_KINDS.filter((k) => k.cat === c.id && (!term || `${k.label} ${k.desc} ${k.id}`.toLowerCase().includes(term)));
        if (!items.length) return null;
        const open = term ? true : !closed.includes(c.id);
        return <section key={c.id} className="wf-lib-cat" style={{ '--cat': c.color } as React.CSSProperties}>
          <button type="button" className="wf-lib-head" aria-expanded={open} onClick={() => setClosed(open ? [...closed, c.id] : closed.filter((x) => x !== c.id))}><Icon name={open ? 'chevronDown' : 'chevronRight'} size={12} /><i />{c.label}<small>{items.length}</small></button>
          {open && <ul>{items.map((k) => <li key={k.id}><button type="button" className="wf-lib-item" disabled={!editable} draggable={editable} onDragStart={(e) => { e.dataTransfer.setData('application/x-biweb-node', k.id); e.dataTransfer.effectAllowed = 'copy'; }} onClick={() => add(k.id)} title={k.desc}>
            <span className="wf-node-glyph"><Icon name={k.icon} size={12} /></span><span><b>{k.label}</b><small>{k.desc}</small></span>{k.beta && <em className="wf-beta">beta</em>}
          </button></li>)}</ul>}
        </section>;
      })}
      {!NODE_KINDS.some((k) => !term || `${k.label} ${k.desc}`.toLowerCase().includes(term)) && <p className="wf-hint">Nenhum nó encontrado. Tente “dados”, “aprovação” ou “webhook”.</p>}
    </div>
    <footer className="wf-lib-foot"><Icon name="cube" size={12} /><span><b>Plugins</b> Conectores, transformações e ações personalizadas entram aqui pelo SDK do BIWEB.</span></footer>
  </div>;
}

export { optimizations, kindOf };
