import { useEffect, useMemo, useState } from 'react';
import { Dialog as AriaDialog, Modal, ModalOverlay } from 'react-aria-components';
import { Button, Dialog, Icon, IconButton } from '@biweb/ui';
import { CompFrame } from '../viz/Render';
import { useDashTheme } from '../viz/common';
import { COMP_META, PALETTE, type Comp } from './doc';
import { getDataset } from '../data/registry';
import { useData } from '../data/registry';
import { CATEGORIES, KIND_ICON } from '../viz/engine/kinds';
import { layoutIssues } from './copilot';
import { useEditor } from './store';
import { useLibrary } from './library';
import { describeFilter } from '../viz/filters';
import { useFilters, useRows } from '../viz/common';
import { getTable } from '../data/registry';
import { fmt } from '../data/query';


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

/** Side panel of Focus Mode: which filters shape this visual, what it reads, and the rows behind it. */
function FocusSide({ comp }: { comp: Comp }) {
  const filters = useFilters(comp), rows = useRows(comp);
  const ds = comp.data?.dataset ?? '', tb = comp.data?.table ?? '';
  const t = comp.data ? getTable(ds, tb) : undefined, cols = (t?.fields.filter((f) => !f.hidden).slice(0, 5) ?? []);
  if (!comp.data || !t) return null;
  return (
    <aside className="ed-focus-side" aria-label="Detalhes do visual">
      <section><h4 className="bw-cap bw-muted">Filtros ativos · {filters.length}</h4>
        {filters.length ? <div className="ed-focus-chips">{filters.map((f, i) => <span key={i} className="bw-badge">{describeFilter(ds, tb, f)}</span>)}</div> : <p className="bw-secondary">Nenhum filtro: mostrando todos os dados.</p>}
      </section>
      <section><h4 className="bw-cap bw-muted">Fonte</h4><p className="bw-secondary">{t.name} · {rows.length.toLocaleString('pt-BR')} de {t.rows.length.toLocaleString('pt-BR')} linhas após filtros</p></section>
      <section><h4 className="bw-cap bw-muted">Dados (primeiras 12 linhas)</h4>
        <div className="ed-focus-tbl"><table><thead><tr>{cols.map((f) => <th key={f.name}>{f.label}</th>)}</tr></thead>
          <tbody>{rows.slice(0, 12).map((r, i) => <tr key={i}>{cols.map((f) => <td key={f.name}>{fmt(r[f.name], f.format)}</td>)}</tr>)}</tbody></table></div>
      </section>
    </aside>
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
                <div className="ed-focus-main"><CompFrame comp={{ ...comp, style: { ...comp.style, showTitle: false } }} interactive editing={false} mode="focus" /></div>
                <FocusSide comp={comp} />
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
      { ok: doc.name.trim() !== '' && doc.name !== 'Relatório sem título', block: true, text: 'Nome do relatório definido', fix: 'Dê um nome na aba Estilo (sem seleção).' },
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

/** Visualization Picker: choose the data first, then what question to answer. Everything it inserts is editable in the panels. */
export function VizPicker() {
  const open = useEditor((s) => s.pickerOpen), doc = useEditor((s) => s.doc), datasets = useData((s) => s.datasets);
  const [q, setQ] = useState('');
  if (!doc) return null;
  const ds = getDataset(doc.datasets[0] ?? 'ds_rede_sp'), close = () => useEditor.getState().set({ pickerOpen: false });
  const groups = ['Dados', ...CATEGORIES, ...(ds.id === 'ds_rede_sp' ? ['Geo e 3D'] : []), 'Layout'] as const;
  const choose = (id: string) => { const d = datasets.find((x) => x.id === id); if (d && d.id !== doc.datasets[0]) useEditor.getState().commit(`Usar dataset ${d.name}`, (x) => { x.datasets = [d.id]; }); };
  return (
    <Dialog title="Adicionar visualização" isOpen={open} onOpenChange={(o) => { if (!o) { close(); setQ(''); } }} footer={<Button onPress={close}>Fechar</Button>}>
      <div className="ed-picker">
        <div className="ed-picker-top">
          <label className="ed-picker-ds"><span>Dados</span><select aria-label="Dataset" value={ds.id} onChange={(e) => choose(e.target.value)}>{datasets.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
          <input className="ed-palette-q" placeholder="Buscar visualização ou pergunta" aria-label="Buscar visualização" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.stopPropagation()} />
        </div>
        <p className="ed-picker-note">{ds.tables.map((t) => t.name).join(' · ')}</p>
        <div className="ed-picker-body">
          {groups.map((g) => {
            const items = PALETTE.filter((p) => p.group === g && (!q || `${p.label} ${p.hint ?? ''}`.toLowerCase().includes(q.toLowerCase())));
            return items.length ? (
              <section key={g}><h4>{g}</h4>
                <div className="ed-picker-grid">{items.map((it) => (
                  <button key={it.id} type="button" title={it.hint} onClick={() => { useEditor.getState().insert(it.type, undefined, it.preset, { label: `Inserir ${it.label}` }); close(); }}>
                    <Icon name={it.type === 'chart' ? KIND_ICON[it.id as keyof typeof KIND_ICON] ?? 'chart' : it.type === 'map' ? 'pin' : it.type === 'kpi' ? 'kpi' : it.type === 'table' ? 'table' : it.type === 'matrix' ? 'matrix' : it.type === 'filter' || it.type === 'slicer' ? 'filter' : it.type === 'text' ? 'text' : it.type === 'image' ? 'image' : it.type === 'scene3d' ? 'cube' : 'card'} size={16} />
                    <b>{it.label}</b>{it.hint && <small>{it.hint}</small>}
                  </button>))}</div>
              </section>) : null;
          })}
        </div>
      </div>
    </Dialog>
  );
}
