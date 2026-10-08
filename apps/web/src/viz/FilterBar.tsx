import { Icon } from '@biweb/ui';
import { useEditor } from '../editor/store';
import { usePageChips } from './filters';

/** What is narrowing this page right now, by level, with a way to remove each piece. */
export function FilterBar({ compact = false }: { compact?: boolean }) {
  const chips = usePageChips();
  const returnTo = useEditor((s) => s.returnTo);
  const pageName = useEditor((s) => s.doc?.pages.find((p) => p.id === returnTo?.page)?.name);
  if (!chips.length && !returnTo) return null;
  const st = useEditor.getState();
  return (
    <div className={`fbar${compact ? ' fbar--compact' : ''}`} role="region" aria-label="Filtros ativos">
      {returnTo && <button type="button" className="fbar-back" onClick={() => { st.goPage(returnTo.page, null); }}><Icon name="arrowLeft" size={12} />Voltar{pageName ? ` para ${pageName}` : ''}</button>}
      {chips.length > 0 && <span className="fbar-k">FILTRADO POR</span>}
      {chips.map((c) => (
        <span key={c.id} className={`fbar-chip lvl-${c.level}`} data-mode={c.mode}>
          <small>{c.mode === 'highlight' ? 'Destaque' : c.level}</small><b>{c.text}</b>
          {c.clear && <button type="button" aria-label={`Remover ${c.text}`} onClick={c.clear}><Icon name="close" size={12} /></button>}
        </span>
      ))}
      {chips.length > 1 && <button type="button" className="fbar-clear" onClick={() => st.clearAll()}>Limpar tudo</button>}
      {returnTo && <span className="fbar-ctx" title="Contexto recebido da página anterior">contexto: {returnTo.label}</span>}
    </div>
  );
}
