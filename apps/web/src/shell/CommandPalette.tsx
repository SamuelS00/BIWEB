import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Dialog as AriaDialog, Modal, ModalOverlay } from 'react-aria-components';
import { Icon } from '@biweb/ui';
import { useRouterState } from '@tanstack/react-router';
import { useGallery } from '../routes/gallery';
import { useEditor } from '../editor/store';
import { PALETTE } from '../editor/doc';
import { ask as askBuilder } from '../editor/copilot';
import { useUi } from '../state/ui-store';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** ⌘K: ir para relatórios, executar ações e perguntar ao Copilot. */
export function CommandPalette() {
  const { paletteOpen, set, aiEnabled, askCopilot, appTheme } = useUi();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const reports = useGallery();
  const inEditor = useRouterState({ select: (s) => s.location.pathname.endsWith('/edit') });
  const items = useMemo(() => {
    const n = norm(q);
    const rep = reports.filter((r) => !n || norm(`${r.name} ${r.description} ${r.category}`).includes(n)).slice(0, 6)
      .map((r) => ({ group: 'Relatórios', label: r.name, hint: `${r.type} · ${r.category}`, thumb: r.cover(true), run: () => navigate({ to: '/reports/$reportId', params: { reportId: r.id } }) }));
    const acts = [
      { group: 'Ações', label: 'Ver todos os relatórios', hint: 'Relatórios', run: () => navigate({ to: '/reports' }) },
      { group: 'Ações', label: 'Novo relatório', hint: 'Editor', run: () => navigate({ to: '/reports/$reportId/edit', params: { reportId: 'novo' } }) },
      { group: 'Ações', label: 'Importar dados (KMZ, SHP, CSV…)', hint: 'Dados', run: () => navigate({ to: '/connections' }) },
      { group: 'Ações', label: `Tema ${appTheme === 'dark' ? 'claro' : 'escuro'}`, hint: 'Exibição', run: () => set({ appTheme: appTheme === 'dark' ? 'light' : 'dark' }) },
      { group: 'Ações', label: 'Dados e conexões', hint: 'Dados', run: () => navigate({ to: '/connections' }) },
    ].filter((a) => !n || norm(a.label).includes(n));
    const st = useEditor.getState();
    const ed = inEditor ? [
      { group: 'Editor', label: 'Visualizar / editar', hint: 'Modo', run: () => st.set({ mode: st.mode === 'edit' ? 'preview' : 'edit', selection: [] }) },
      { group: 'Editor', label: 'Desfazer', hint: '⌘Z', run: () => st.undo() },
      { group: 'Editor', label: 'Salvar versão', hint: '⌘S', run: () => st.saveNow() },
      { group: 'Editor', label: 'Organizar a página com IA (Smart Layout)', hint: 'IA', run: () => { st.set({ rightTab: 'ai' }); void askBuilder('Organize esse dashboard deixando os indicadores mais importantes primeiro.'); } },
      { group: 'Editor', label: 'Nova página', hint: 'Páginas', run: () => st.addPage() },
      ...PALETTE.map((p) => ({ group: 'Editor', label: `Inserir ${p.label.toLowerCase()}`, hint: 'Componente', run: () => st.insert(p.type, undefined, p.preset, { label: `Inserir ${p.label}` }) })),
    ].filter((a) => !n || norm(a.label).includes(n)).slice(0, n ? 8 : 5) : [];
    const ai = aiEnabled && q.trim() ? [{ group: 'Copilot', label: `Perguntar: "${q.trim()}"`, hint: '⌘↵', run: () => { if (inEditor) { useEditor.getState().set({ rightTab: 'ai' }); void askBuilder(q.trim()); } else askCopilot(q.trim()); } }] : [];
    return [...ed, ...rep, ...acts, ...ai] as { group: string; label: string; hint: string; thumb?: string; run: () => void }[];
  }, [q, aiEnabled, appTheme, navigate, set, askCopilot, reports, inEditor]);
  const close = () => { set({ paletteOpen: false }); setQ(''); setIdx(0); };
  const run = (i: number) => { const it = items[i]; if (!it) return; close(); it.run(); };
  let lastGroup = '';
  return (
    <ModalOverlay isOpen={paletteOpen} onOpenChange={(o) => !o && close()} isDismissable className="cmdk-overlay">
      <Modal className="cmdk-modal">
        <AriaDialog aria-label="Busca e comandos" className="bw-cmd cmdk">
          <div className="bw-cmd-input"><Icon name="search" />
            <input autoFocus value={q} placeholder={`Buscar relatórios e ações${aiEnabled ? ' ou perguntar ao Copilot' : ''}`} aria-label="Buscar"
              onChange={(e) => { setQ(e.target.value); setIdx(0); }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(items.length - 1, i + 1)); }
                if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
                if (e.key === 'Enter') { e.preventDefault(); const ai = items.findIndex((x) => x.group === 'Copilot'); run((e.metaKey || e.ctrlKey) && ai >= 0 ? ai : idx); }
              }} />
          </div>
          <div className="cmdk-list" role="listbox" aria-label="Resultados">
            {items.map((it, i) => {
              const head = it.group !== lastGroup ? (lastGroup = it.group, <div className="bw-menu-label" key={`g${it.group}`}>{it.group}</div>) : null;
              return [head, (
                <div key={it.group + it.label} role="option" aria-selected={i === idx} className="bw-cmd-item" onMouseEnter={() => setIdx(i)} onClick={() => run(i)}>
                  {it.thumb ? <img src={it.thumb} alt="" width={40} height={22} className="cmdk-thumb" /> : <Icon name={it.group === 'Copilot' ? 'copilot' : 'arrowRight'} size={12} />}
                  {it.label}<span className="bw-hint">{it.hint}</span>
                </div>
              )];
            })}
            {!items.length && <div className="bw-pad bw-muted">Nada encontrado.</div>}
          </div>
          <div className="bw-cmd-foot"><span>↑↓ navegar</span><span>↵ abrir</span>{aiEnabled && <span>⌘↵ perguntar ao Copilot</span>}<span>esc fechar</span></div>
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
