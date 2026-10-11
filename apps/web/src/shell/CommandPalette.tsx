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
import { useT, type T } from '../i18n/intl';
import type { MessageId } from '../i18n/catalog';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Grupo é um id estável: a ordem e a lógica não dependem do rótulo traduzido. */
type Group = 'reports' | 'actions' | 'editor' | 'copilot';
const GROUP_ID: Record<Group, MessageId> = { reports: 'palette.group.reports', actions: 'palette.group.actions', editor: 'palette.group.editor', copilot: 'palette.group.copilot' };
interface Item { group: Group; label: string; hint: string; thumb?: string; run: () => void }

/** ⌘K: ir para relatórios, executar ações e perguntar ao Copilot. */
export function CommandPalette() {
  const { paletteOpen, set, aiEnabled, askCopilot, appTheme } = useUi();
  const navigate = useNavigate();
  const t: T = useT();
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const reports = useGallery();
  const inEditor = useRouterState({ select: (s) => s.location.pathname.endsWith('/edit') });
  const items = useMemo(() => {
    const n = norm(q);
    const rep: Item[] = reports.filter((r) => !n || norm(`${r.name} ${r.description} ${r.category}`).includes(n)).slice(0, 6)
      .map((r) => ({ group: 'reports', label: r.name, hint: `${r.type} · ${r.category}`, thumb: r.cover(true), run: () => navigate({ to: '/reports/$reportId', params: { reportId: r.id } }) }));
    const actionItems: Item[] = [
      { group: 'actions', label: t('palette.action.allReports'), hint: t('navigation.reports'), run: () => navigate({ to: '/reports' }) },
      { group: 'actions', label: t('palette.action.newReport'), hint: t('palette.hint.editor'), run: () => navigate({ to: '/reports/$reportId/edit', params: { reportId: 'novo' } }) },
      { group: 'actions', label: t('palette.action.import'), hint: t('navigation.data'), run: () => navigate({ to: '/connections' }) },
      { group: 'actions', label: appTheme === 'dark' ? t('palette.action.themeToLight') : t('palette.action.themeToDark'), hint: t('palette.hint.display'), run: () => set({ appTheme: appTheme === 'dark' ? 'light' : 'dark' }) },
      { group: 'actions', label: t('palette.action.dataConnections'), hint: t('navigation.data'), run: () => navigate({ to: '/connections' }) },
      { group: 'actions', label: t('palette.action.presentation'), hint: t('palette.hint.newTab'), run: () => { window.open(`${import.meta.env.BASE_URL}apresentacao/`, '_blank', 'noopener'); } },
      { group: 'actions', label: t('palette.action.migrationProjects'), hint: t('navigation.migration'), run: () => navigate({ to: '/migration' }) },
      { group: 'actions', label: t('palette.action.newMigration'), hint: t('navigation.migration'), run: () => navigate({ to: '/migration' }) },
    ];
    const acts = actionItems.filter((a) => !n || norm(a.label).includes(n));
    const st = useEditor.getState();
    const editorItems: Item[] = [
      { group: 'editor', label: t('palette.editor.toggleMode'), hint: t('palette.hint.mode'), run: () => st.set({ mode: st.mode === 'edit' ? 'preview' : 'edit', selection: [] }) },
      { group: 'editor', label: t('palette.editor.undo'), hint: '⌘Z', run: () => st.undo() },
      { group: 'editor', label: t('palette.editor.save'), hint: '⌘S', run: () => st.saveNow() },
      { group: 'editor', label: t('palette.editor.smartLayout'), hint: t('palette.hint.ai'), run: () => { st.set({ rightTab: 'ai' }); void askBuilder('Organize esse dashboard deixando os indicadores mais importantes primeiro.'); } },
      { group: 'editor', label: t('palette.editor.newPage'), hint: t('palette.hint.pages'), run: () => st.addPage() },
      ...PALETTE.map((p): Item => ({ group: 'editor', label: t('palette.editor.insert', { label: p.label.toLowerCase() }), hint: t('palette.hint.component'), run: () => st.insert(p.type, undefined, p.preset, { label: t('palette.editor.insert', { label: p.label }) }) })),
    ];
    const ed: Item[] = inEditor ? editorItems.filter((a) => !n || norm(a.label).includes(n)).slice(0, n ? 8 : 5) : [];
    const ai: Item[] = aiEnabled && q.trim() ? [{ group: 'copilot', label: t('palette.ask', { query: q.trim() }), hint: t('palette.hint.ask'), run: () => { if (inEditor) { useEditor.getState().set({ rightTab: 'ai' }); void askBuilder(q.trim()); } else askCopilot(q.trim()); } }] : [];
    return [...ed, ...rep, ...acts, ...ai];
  }, [q, aiEnabled, appTheme, navigate, set, askCopilot, reports, inEditor, t]);
  const close = () => { set({ paletteOpen: false }); setQ(''); setIdx(0); };
  const run = (i: number) => { const it = items[i]; if (!it) return; close(); it.run(); };
  let lastGroup: Group | '' = '';
  return (
    <ModalOverlay isOpen={paletteOpen} onOpenChange={(o) => !o && close()} isDismissable className="cmdk-overlay">
      <Modal className="cmdk-modal">
        <AriaDialog aria-label={t('palette.dialog')} className="bw-cmd cmdk">
          <div className="bw-cmd-input"><Icon name="search" />
            <input autoFocus value={q} placeholder={aiEnabled ? t('palette.placeholderAi') : t('palette.placeholder')} aria-label={t('palette.inputLabel')}
              onChange={(e) => { setQ(e.target.value); setIdx(0); }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(items.length - 1, i + 1)); }
                if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
                if (e.key === 'Enter') { e.preventDefault(); const ai = items.findIndex((x) => x.group === 'copilot'); run((e.metaKey || e.ctrlKey) && ai >= 0 ? ai : idx); }
              }} />
          </div>
          <div className="cmdk-list" role="listbox" aria-label={t('palette.results')}>
            {items.map((it, i) => {
              const head = it.group !== lastGroup ? (lastGroup = it.group, <div className="bw-menu-label" key={`g${it.group}`}>{t(GROUP_ID[it.group])}</div>) : null;
              return [head, (
                <div key={it.group + it.label} role="option" aria-selected={i === idx} className="bw-cmd-item" onMouseEnter={() => setIdx(i)} onClick={() => run(i)}>
                  {it.thumb ? <img src={it.thumb} alt="" width={40} height={22} className="cmdk-thumb" /> : <Icon name={it.group === 'copilot' ? 'copilot' : 'arrowRight'} size={12} />}
                  {it.label}<span className="bw-hint">{it.hint}</span>
                </div>
              )];
            })}
            {!items.length && <div className="bw-pad bw-muted">{t('palette.empty')}</div>}
          </div>
          <div className="bw-cmd-foot"><span>{t('palette.hint.navigate')}</span><span>{t('palette.hint.open')}</span>{aiEnabled && <span>{t('palette.hint.ask')}</span>}<span>{t('palette.hint.close')}</span></div>
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
