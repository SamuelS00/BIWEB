import { useEffect, useMemo, useState } from 'react';
import { Dialog as AriaDialog, Modal, ModalOverlay } from 'react-aria-components';
import { Button, Dialog, Icon, IconButton } from '@biweb/ui';
import { CompFrame } from '../viz/Render';
import { useDashTheme } from '../viz/common';
import { COMP_META } from './doc';
import { layoutIssues } from './copilot';
import { useEditor } from './store';
import { useLibrary } from './library';

/** Toasts do editor/visualizador (confirmação breve; erro persistente é Banner). */
export function Toasts() {
  const toasts = useEditor((s) => s.toasts);
  return (
    <div className="ed-toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`bw-toast bw-toast--${t.tone === 'info' ? 'success' : t.tone} ed-toast`} role={t.tone === 'danger' ? 'alert' : 'status'}>
          <Icon name={t.tone === 'danger' ? 'warning' : t.tone === 'info' ? 'undo' : 'check'} className="bw-ico" />
          <span className="bw-msg">{t.text}</span>
          {t.action && <Button size="sm" variant="ghost" onPress={t.action.run}>{t.action.label}</Button>}
        </div>
      ))}
    </div>
  );
}

/** Focus Mode: qualquer componente em tela cheia, interativo. Esc fecha. */
export function FocusOverlay() {
  const id = useEditor((s) => s.focusComp);
  const comp = useEditor((s) => (id ? s.doc?.pages.flatMap((p) => p.comps).find((c) => c.id === id) : undefined));
  const dash = useDashTheme();
  const close = () => useEditor.getState().set({ focusComp: null });
  return (
    <ModalOverlay isOpen={!!comp} onOpenChange={(o) => !o && close()} isDismissable className="bw-modal-overlay ed-focus-overlay">
      <Modal className="ed-focus-modal">
        <AriaDialog aria-label={`Foco: ${comp?.name}`} className="ed-focus">
          {comp && (
            <>
              <div className="ed-focus-head">
                <span className="bw-cap bw-muted">{COMP_META[comp.type].label}</span>
                <b>{comp.style.title || comp.name}</b>{comp.style.subtitle && <span className="bw-secondary">{comp.style.subtitle}</span>}
                <span className="flex-1" />
                <span className="bw-cap bw-muted">Esc para sair</span>
                <IconButton icon="close" label="Fechar foco" onPress={close} />
              </div>
              <div className={`ed-focus-body dash-theme-${dash}`}>
                <CompFrame comp={{ ...comp, style: { ...comp.style, showTitle: false } }} interactive editing={false} mode="focus" />
              </div>
            </>
          )}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}

/** Publicar: checklist calculada do documento + confirmação + feedback. */
export function PublishDialog({ isOpen, onOpenChange, onOpenReport }: { isOpen: boolean; onOpenChange: (o: boolean) => void; onOpenReport: () => void }) {
  const doc = useEditor((s) => s.doc)!;
  const [done, setDone] = useState<number | null>(null);
  useEffect(() => { if (isOpen) setDone(null); }, [isOpen]);
  const checks = useMemo(() => {
    const comps = doc.pages.flatMap((p) => p.comps);
    const issues = doc.pages.flatMap((p) => layoutIssues(p).filter((i) => i.kind === 'overlap' || i.kind === 'bounds').map((i) => ({ ...i, page: p.name })));
    const unbound = comps.filter((c) => COMP_META[c.type].data && !c.data);
    const emptyPages = doc.pages.filter((p) => p.comps.filter((c) => !c.hidden).length === 0);
    const badRules = doc.rules.filter((r) => r.enabled && (!r.conditions.length || !r.actions.length));
    return [
      { ok: doc.name.trim() !== '' && doc.name !== 'Relatório sem título', block: true, text: 'Nome do relatório definido', fix: 'Dê um nome na aba Visual (sem seleção).' },
      { ok: emptyPages.length === 0, block: true, text: 'Todas as páginas têm conteúdo', fix: emptyPages.length ? `Vazia: ${emptyPages.map((p) => p.name).join(', ')}` : '' },
      { ok: unbound.length === 0, block: true, text: 'Componentes de dados ligados a um dataset', fix: unbound.map((c) => c.name).join(', ') },
      { ok: badRules.length === 0, block: true, text: 'Regras ativas completas (condição e ação)', fix: badRules.map((r) => r.name).join(', ') },
      { ok: issues.length === 0, block: false, text: 'Sem sobreposição ou componente fora da página', fix: issues.slice(0, 3).map((i) => `${i.page}: ${i.text}`).join(' · ') },
      { ok: !!doc.description.trim(), block: false, text: 'Descrição para a galeria', fix: 'Opcional, mas ajuda quem procura o relatório.' },
    ];
  }, [doc]);
  const blocked = checks.some((c) => c.block && !c.ok);
  const publish = () => {
    const st = useEditor.getState();
    const v = doc.version + 1;
    st.commit(`Publicar versão ${v}`, (d) => { d.status = 'Publicado'; d.version = v; d.publishedAt = Date.now(); });
    st.saveNow(`Publicado como versão ${v}`);
    useLibrary.getState().save(useEditor.getState().doc!);
    setDone(v);
  };
  return (
    <Dialog title={done ? 'Relatório publicado' : `Publicar ${doc.name}`} isOpen={isOpen} onOpenChange={onOpenChange}
      footer={done ? <><Button onPress={() => onOpenChange(false)}>Continuar editando</Button><Button variant="primary" icon="eye" onPress={onOpenReport}>Abrir relatório publicado</Button></>
        : <><Button onPress={() => onOpenChange(false)}>Cancelar</Button><Button variant="primary" isDisabled={blocked} onPress={publish}>{doc.status === 'Publicado' ? `Publicar versão ${doc.version + 1}` : 'Publicar'}</Button></>}>
      {done ? (
        <div className="ed-pub-done">
          <Icon name="check" size={20} />
          <div><b>Versão {done} publicada.</b><p className="bw-secondary">Quem tem acesso ao workspace Operações de Rede já vê esta versão. A anterior fica no histórico do relatório.</p></div>
        </div>
      ) : (
        <ul className="ed-checklist">
          {checks.map((c) => (
            <li key={c.text} className={c.ok ? 'is-ok' : c.block ? 'is-block' : 'is-warn'}>
              <Icon name={c.ok ? 'check' : 'warning'} size={16} />
              <div><span>{c.text}</span>{!c.ok && c.fix && <small>{c.fix}</small>}</div>
              {!c.ok && <span className="bw-cap">{c.block ? 'Impede publicar' : 'Aviso'}</span>}
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
