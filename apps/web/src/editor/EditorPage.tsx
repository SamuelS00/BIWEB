import { useEffect, useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Button, Icon, IconButton, Menu, SegmentedControl } from '@biweb/ui';
import { Canvas } from './Canvas';
import { FocusOverlay, PublishDialog, Toasts, VizPicker } from './chrome';
import { PALETTE } from './doc';
import { CATEGORIES, KIND_ICON } from '../viz/engine/kinds';
import { useLibrary } from './library';
import { useEditor, type RightTab } from './store';
import { AiTab } from './panels/AiTab';
import { BuildTab, compIcon } from './panels/BuildTab';
import { DataTab } from './panels/DataTab';
import { InteractionsTab } from './panels/InteractionsTab';
import { AdvancedTab } from './panels/AdvancedTab';
import { StyleTab } from './panels/StyleTab';
import { VisualTab } from './panels/VisualTab';
import { useUi } from '../state/ui-store';
import './editor.css';

const TABS: { id: RightTab; label: string; icon: Parameters<typeof Icon>[0]['name'] }[] = [
  { id: 'build', label: 'Estrutura', icon: 'layers' }, { id: 'data', label: 'Dados', icon: 'data' }, { id: 'visual', label: 'Visual', icon: 'chart' }, { id: 'style', label: 'Estilo', icon: 'brush' },
  { id: 'interactions', label: 'Interação', icon: 'target' }, { id: 'advanced', label: 'Avançado', icon: 'sliders' }, { id: 'ai', label: 'IA', icon: 'copilot' },
];

function Palette() {
  const [q, setQ] = useState('');
  const groups = ['Dados', ...CATEGORIES, 'Geo e 3D', 'Layout'] as const;
  return (
    <aside className="ed-palette" aria-label="Inserir componentes">
      <div className="ed-palette-head"><span className="bw-panel-title">Inserir</span><span className="bw-cap bw-muted">arraste ou clique</span></div>
      <input className="ed-palette-q" placeholder="Buscar componente" aria-label="Buscar componente" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.stopPropagation()} />
      <div className="ed-palette-body">
        {groups.map((g) => {
          const items = PALETTE.filter((p) => p.group === g && (!q || p.label.toLowerCase().includes(q.toLowerCase())));
          if (!items.length) return null;
          return (
            <div key={g} className="ed-pal-group">
              <span className="bw-label">{g}</span>
              <div className="ed-pal-grid">
                {items.map((it) => (
                  <button key={it.id} type="button" className="ed-pal-item" draggable title={`${it.label}${it.hint ? ` — ${it.hint}` : ''} · arraste para o canvas ou clique para inserir`}
                    onDragStart={(e) => { (window as unknown as { __bwDrag?: string }).__bwDrag = it.id; e.dataTransfer.setData('application/x-biweb', it.id); e.dataTransfer.effectAllowed = 'copy'; }}
                    onDragEnd={() => { (window as unknown as { __bwDrag?: string }).__bwDrag = undefined; }}
                    onClick={() => useEditor.getState().insert(it.type, undefined, it.preset, { label: `Inserir ${it.label}` })}>
                    <Icon name={it.type === 'chart' ? KIND_ICON[it.id as keyof typeof KIND_ICON] ?? 'chart' : it.id === 'heat' ? 'layers' : it.id === 'routes' ? 'share' : it.id === 'topology' ? 'model' : compIcon(it.type)} size={16} />
                    <span>{it.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function Toolbar({ onPublish }: { onPublish: () => void }) {
  const doc = useEditor((s) => s.doc)!;
  const mode = useEditor((s) => s.mode);
  const zoom = useEditor((s) => s.zoom);
  const fit = useEditor((s) => s.fit);
  const canUndo = useEditor((s) => s.past.length > 0), canRedo = useEditor((s) => s.future.length > 0);
  const undoLabel = useEditor((s) => s.past[s.past.length - 1]?.label), redoLabel = useEditor((s) => s.future[0]?.label);
  const saveState = useEditor((s) => s.saveState), savedAt = useEditor((s) => s.savedAt);
  const nSel = useEditor((s) => s.selection.length);
  const st = useEditor.getState();
  const navigate = useNavigate();
  const setZoom = (z: number) => st.set({ zoom: Math.max(0.25, Math.min(2, Math.round(z * 100) / 100)), fit: false });
  return (
    <div className="ed-toolbar" role="toolbar" aria-label="Editor">
      <IconButton icon="arrowLeft" label="Voltar ao relatório" onPress={() => navigate({ to: '/reports/$reportId', params: { reportId: doc.id } })} />
      <input className="ed-docname" aria-label="Nome do relatório" value={doc.name} onChange={(e) => st.commit('Renomear relatório', (d) => { d.name = e.target.value; }, { tx: 'rename-doc' })} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') e.currentTarget.blur(); }} />
      <span className={`ed-save ed-save--${saveState}`} role="status" title={saveState === 'saving' ? 'Editando: o rascunho é salvo automaticamente' : 'Rascunho salvo. Use Publicar para disponibilizar a versão'}>{saveState === 'saving' ? 'Alterações não salvas · salvando…' : savedAt ? `Salvo ${new Date(savedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Salvo'}</span>
      <span className={`bw-badge${doc.status === 'Publicado' ? ' bw-badge--success' : ' bw-badge--warning'}`}>{doc.status}{doc.version ? ` v${doc.version}` : ''}</span>
      <span className="ed-sep" />
      <IconButton icon="undo" label={canUndo ? `Desfazer: ${undoLabel}` : 'Nada para desfazer'} shortcut="⌘Z" isDisabled={!canUndo} onPress={() => st.undo()} />
      <IconButton icon="redo" label={canRedo ? `Refazer: ${redoLabel}` : 'Nada para refazer'} shortcut="⇧⌘Z" isDisabled={!canRedo} onPress={() => st.redo()} />
      <Menu title="Alinhar e distribuir" trigger={<Button size="sm" variant="ghost" icon="alignLeft" isDisabled={mode !== 'edit' || nSel === 0}>Alinhar</Button>} items={[
        { id: 'l', label: nSel === 1 ? 'Alinhar à esquerda da página' : 'Alinhar à esquerda', icon: 'alignLeft', onAction: () => st.align('left') },
        { id: 'hc', label: 'Centralizar na horizontal', icon: 'alignHCenter', onAction: () => st.align('hcenter') },
        { id: 'r', label: 'Alinhar à direita', icon: 'alignRight', onAction: () => st.align('right') }, 'separator',
        { id: 't', label: 'Alinhar ao topo', icon: 'alignTop', onAction: () => st.align('top') },
        { id: 'vc', label: 'Centralizar na vertical', icon: 'alignVCenter', onAction: () => st.align('vcenter') },
        { id: 'b', label: 'Alinhar à base', icon: 'alignBottom', onAction: () => st.align('bottom') }, 'separator',
        { id: 'dh', label: 'Distribuir na horizontal', icon: 'distH', disabledReason: nSel < 3 ? 'Selecione 3 ou mais' : undefined, onAction: () => st.distribute('h') },
        { id: 'dv', label: 'Distribuir na vertical', icon: 'distV', disabledReason: nSel < 3 ? 'Selecione 3 ou mais' : undefined, onAction: () => st.distribute('v') },
      ]} />
      <span className="flex-1" />
      <div className="ed-zoom" role="group" aria-label="Zoom">
        <IconButton icon="minus" size="sm" label="Diminuir zoom" shortcut="⌘−" onPress={() => setZoom(zoom - 0.1)} />
        <button type="button" className="ed-zoom-v" title="Ajustar à largura · ⌘0" onClick={() => st.set({ fit: true })}>{fit ? 'Ajustar' : `${Math.round(zoom * 100)}%`}</button>
        <IconButton icon="plus" size="sm" label="Aumentar zoom" shortcut="⌘+" onPress={() => setZoom(zoom + 0.1)} />
      </div>
      <SegmentedControl label="Modo" value={mode} onChange={(v) => st.set({ mode: v, selection: [], interactive: null })} options={[{ id: 'edit', label: 'Editar', icon: 'brush' }, { id: 'preview', label: 'Visualizar', icon: 'eye' }]} />
      <Button size="sm" onPress={() => st.saveNow()}>Salvar</Button>
      <Button size="sm" variant="primary" icon="share" onPress={onPublish}>Publicar</Button>
    </div>
  );
}

function StatusLine() {
  const page = useEditor((s) => s.page());
  const selection = useEditor((s) => s.selection);
  const interactive = useEditor((s) => s.interactive);
  const mode = useEditor((s) => s.mode);
  const cross = useEditor((s) => s.cross);
  const sel = page?.comps.filter((c) => selection.includes(c.id)) ?? [];
  return (
    <div className="bw-statusbar ed-status" role="status">
      <span>{mode === 'preview' ? 'Visualização · interações ativas' : sel.length === 0 ? `${page?.comps.length ?? 0} componentes` : sel.length === 1 ? `${sel[0]!.name} · ${sel[0]!.x}, ${sel[0]!.y} · ${sel[0]!.w} × ${sel[0]!.h}` : `${sel.length} selecionados`}</span>
      {interactive && <span>Interagindo com o componente · Esc para sair</span>}
      {cross && <span className="ed-status-cross">Filtro por clique: {cross.label} <button type="button" onClick={() => useEditor.getState().setCross(null)} aria-label="Limpar filtro por clique"><Icon name="close" size={12} /></button></span>}
      <span className="bw-spacer" />
      <span>Grade 8 px · Alt desliga o encaixe</span>
      <span>⌘K comandos</span>
    </div>
  );
}

function PageTabsBar() {
  const pages = useEditor((s) => s.doc!.pages);
  const cur = useEditor((s) => s.pageId);
  const st = useEditor.getState();
  return (
    <div className="bw-pagetabs ed-pagetabs" role="tablist" aria-label="Páginas">
      {pages.map((p) => <button key={p.id} type="button" role="tab" className="bw-pagetab" aria-selected={p.id === cur} onClick={() => st.goPage(p.id)}>{p.name}</button>)}
      <button type="button" className="bw-iconbtn bw-iconbtn--sm" style={{ alignSelf: 'center' }} aria-label="Nova página" title="Nova página" onClick={() => st.addPage()}><Icon name="plus" /></button>
    </div>
  );
}

/** Atalhos do editor (não disparam enquanto se digita). */
function useShortcuts(onPublish: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
      const st = useEditor.getState(); const mod = e.metaKey || e.ctrlKey; const k = e.key.toLowerCase();
      if (mod && k === 'z') { e.preventDefault(); if (e.shiftKey) st.redo(); else st.undo(); return; }
      if (mod && k === 'y') { e.preventDefault(); st.redo(); return; }
      if (mod && k === 's') { e.preventDefault(); st.saveNow(); return; }
      if (mod && k === 'p' && e.shiftKey) { e.preventDefault(); onPublish(); return; }
      if (mod && (k === '=' || k === '+')) { e.preventDefault(); st.set({ zoom: Math.min(2, st.zoom + 0.1), fit: false }); return; }
      if (mod && k === '-') { e.preventDefault(); st.set({ zoom: Math.max(0.25, st.zoom - 0.1), fit: false }); return; }
      if (mod && k === '0') { e.preventDefault(); st.set({ fit: true }); return; }
      if (k === 'escape') { if (st.focusComp) st.set({ focusComp: null }); else if (st.interactive) st.set({ interactive: null }); else if (st.picked) st.set({ picked: null }); else if (st.mode === 'preview') st.set({ mode: 'edit' }); else st.set({ selection: [] }); return; }
      if (st.mode !== 'edit') return;
      if (mod && k === 'c') { e.preventDefault(); st.copy(); return; }
      if (mod && k === 'v') { e.preventDefault(); st.paste(); return; }
      if (mod && k === 'd') { e.preventDefault(); st.duplicate(); return; }
      if (mod && k === 'a') { e.preventDefault(); st.set({ selection: st.page()!.comps.filter((c) => !c.locked).map((c) => c.id) }); return; }
      if (mod && e.key === ']') { e.preventDefault(); st.order(e.shiftKey ? 'front' : 'forward'); return; }
      if (mod && e.key === '[') { e.preventDefault(); st.order(e.shiftKey ? 'back' : 'backward'); return; }
      if ((k === 'delete' || k === 'backspace') && st.selection.length && !st.interactive) { e.preventDefault(); st.remove(); return; }
      if (k === 'enter' && st.selection.length === 1) { e.preventDefault(); st.set({ interactive: st.selection[0]! }); return; }
      const arrows: Record<string, [number, number]> = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] };
      if (arrows[k] && st.selection.length && !st.interactive) { e.preventDefault(); const step = e.shiftKey ? 80 : 8; st.nudge(arrows[k]![0] * step, arrows[k]![1] * step); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onPublish]);
}

export function EditorPage() {
  const { reportId } = useParams({ from: '/reports/$reportId/edit' });
  const navigate = useNavigate();
  const doc = useEditor((s) => s.doc);
  const mode = useEditor((s) => s.mode);
  const tab = useEditor((s) => s.rightTab);
  const [pub, setPub] = useState(false);
  const [panelsOpen, setPanelsOpen] = useState(true);
  const aiEnabled = useUi((s) => s.aiEnabled);
  useEffect(() => {
    const lib = useLibrary.getState();
    const d = lib.get(reportId);
    if (!d) return;
    const st = useEditor.getState();
    if (st.doc?.id !== d.id) { st.load(d); st.set({ mode: 'edit', fit: true, rightTab: d.pages.every((p) => p.comps.length === 0) ? 'ai' : 'build' }); }
    else if (st.mode !== 'edit') st.set({ mode: 'edit', selection: [] });
  }, [reportId]); // eslint-disable-line react-hooks/exhaustive-deps
  useShortcuts(() => setPub(true));
  if (!doc || doc.id !== reportId) return <div className="pg"><p className="bw-secondary">Carregando o editor…</p></div>;
  const edit = mode === 'edit';
  return (
    <div className={`ed${edit ? '' : ' ed--preview'}`}>
      <Toolbar onPublish={() => setPub(true)} />
      <div className="ed-main" style={{ gridTemplateColumns: edit ? `200px minmax(0,1fr) ${panelsOpen ? 'var(--ed-panel-w, 328px)' : '44px'}` : 'minmax(0,1fr)' }}>
        {edit && <Palette />}
        <div className="ed-center"><Canvas /><PageTabsBar /></div>
        {edit && (
          <aside className={`ed-right${panelsOpen ? '' : ' is-collapsed'}`} aria-label="Propriedades">
            <div className="ed-tabs" role="tablist" aria-label="Painel do editor">
              {TABS.filter((t) => t.id !== 'ai' || aiEnabled).map((t) => (
                <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className="ed-tabbtn" title={t.label} onClick={() => { setPanelsOpen(true); useEditor.getState().set({ rightTab: t.id }); }}>
                  <Icon name={t.icon} size={16} /><span>{t.label}</span>
                </button>
              ))}
              <button type="button" className="ed-tabbtn ed-tabbtn--toggle" aria-label={panelsOpen ? 'Recolher painel' : 'Expandir painel'} title={panelsOpen ? 'Recolher painel' : 'Expandir painel'} onClick={() => setPanelsOpen(!panelsOpen)}><Icon name={panelsOpen ? 'chevronRight' : 'arrowLeft'} size={16} /></button>
            </div>
            {panelsOpen && (
              <div className="ed-panel" role="tabpanel" key={tab}>
                {tab === 'build' && <BuildTab />}{tab === 'data' && <DataTab />}{tab === 'visual' && <VisualTab />}
                {tab === 'style' && <StyleTab />}{tab === 'interactions' && <InteractionsTab />}{(tab === 'advanced' || tab === 'rules') && <AdvancedTab />}{tab === 'ai' && aiEnabled && <AiTab />}
              </div>
            )}
          </aside>
        )}
      </div>
      <StatusLine />
      <Toasts />
      <FocusOverlay />
      <VizPicker />
      <PublishDialog isOpen={pub} onOpenChange={setPub} onOpenReport={() => { setPub(false); navigate({ to: '/reports/$reportId', params: { reportId: doc.id } }); }} />
    </div>
  );
}
