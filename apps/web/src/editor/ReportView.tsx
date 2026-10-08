import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Avatar, Badge, Button, Icon, Menu } from '@biweb/ui';
import { labelOf } from '../data/query';
import { getField } from '../data/registry';
import { NOW } from '../net/generate';
import { useUi } from '../state/ui-store';
import { FavButton } from '../routes/reports-shared';
import { Canvas } from './Canvas';
import { FocusOverlay, Toasts } from './chrome';
import { coverFor } from './covers';
import { useLibrary } from './library';
import { affected } from './panels/RulesTab';
import { useEditor } from './store';
import './editor.css';

export const ago = (ts: number) => { const m = Math.round(((ts <= NOW ? NOW : Date.now()) - ts) / 60_000); return m < 1 ? 'agora' : m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.round(m / 60)} h` : m < 2880 ? 'ontem' : new Date(ts).toLocaleDateString('pt-BR'); };

/** Relatório publicado (modo leitura): o mesmo documento e o mesmo renderer do editor, com todas as interações ativas. */
export function ReportView({ id }: { id: string }) {
  const navigate = useNavigate();
  const lib = useLibrary((s) => s.docs.find((d) => d.id === id));
  const doc = useEditor((s) => (s.doc?.id === id ? s.doc : null));
  const pageId = useEditor((s) => s.pageId);
  const cross = useEditor((s) => s.cross);
  const fv = useEditor((s) => s.filterValues);
  const { aiEnabled, askCopilot } = useUi();
  useEffect(() => {
    if (!lib) return;
    const st = useEditor.getState();
    if (st.doc?.id !== lib.id || st.doc !== lib) st.load(lib);
    st.set({ mode: 'preview', fit: true, selection: [], interactive: null });
  }, [lib]);
  const alerts = useMemo(() => (doc ? doc.rules.filter((r) => r.enabled && r.actions.some((a) => a.kind === 'alert')).reduce((a, r) => a + affected(r).length, 0) : 0), [doc]);
  if (!lib) return null;
  if (!doc) return <div className="pg"><p className="bw-secondary">Carregando…</p></div>;
  const page = doc.pages.find((p) => p.id === pageId) ?? doc.pages[0]!;
  const filterComps = page.comps.filter((c) => (c.type === 'filter' || c.type === 'slicer') && (fv[c.id] ?? []).length);
  const st = useEditor.getState();
  return (
    <div className="rv rv--doc">
      <header className="rv-head">
        <img className="rv-thumb" src={coverFor(doc, { width: 352, height: 198 })} alt="" width={176} height={99} />
        <div className="rv-head-main">
          <div className="rv-eyebrow"><Link to="/reports" className="bw-link"><Icon name="arrowLeft" size={12} /> Relatórios</Link><span>·</span><span>{doc.category}</span><span>·</span><span>{doc.kind}</span></div>
          <h1 className="rv-title">{doc.name}</h1>
          <p className="rv-desc">{doc.description}</p>
          <div className="rv-meta">
            <span className="bw-row" style={{ gap: 4 }}>
              <Badge tone={doc.status === 'Publicado' ? 'success' : 'warning'}>{doc.status}{doc.version ? ` v${doc.version}` : ''}</Badge>
              {doc.certified && <Badge tone="success" icon="check">Certificado</Badge>}
              {alerts > 0 && <Badge tone="danger" icon="warning">{alerts} {alerts === 1 ? 'alerta de regra' : 'alertas de regra'}</Badge>}
            </span>
            <span className="bw-row" style={{ gap: 6 }}><Avatar name={doc.owner} size={20} />{doc.owner}</span>
            <span className="bw-secondary">Dataset <Link to="/connections" className="bw-link"><b>Rede Metropolitana SP</b></Link></span>
            <span className="bw-secondary">Atualizado {ago(doc.updatedAt)}</span>
          </div>
        </div>
        <div className="rv-actions">
          <FavButton id={doc.id} name={doc.name} />
          {aiEnabled && <Button icon="copilot" onPress={() => askCopilot(`Resuma o relatório ${doc.name}`)}>Resumir com Copilot</Button>}
          <Button icon="brush" onPress={() => navigate({ to: '/reports/$reportId/edit', params: { reportId: doc.id } })}>Editar</Button>
          <Menu title="Mais ações" trigger={<Button variant="primary" icon="share">Compartilhar</Button>} items={[
            { id: 'link', label: 'Copiar link', icon: 'share', onAction: () => { void navigator.clipboard?.writeText(location.href).then(() => st.toast({ text: 'Link copiado', tone: 'success' })).catch(() => undefined); } },
            { id: 'pdf', label: 'Exportar PDF', icon: 'download', disabledReason: 'Exports: próxima fase (render service)', onAction: () => undefined },
          ]} />
        </div>
      </header>
      <div className="rv-docbar">
        {doc.pages.length > 1 && <div className="rv-pages" role="tablist" aria-label="Páginas">{doc.pages.map((p) => <button key={p.id} role="tab" aria-selected={p.id === page.id} onClick={() => st.goPage(p.id)}>{p.name}</button>)}</div>}
        <span className="flex-1" />
        {filterComps.map((f) => { const fld = getField(f.data!.dataset, f.data!.table, String(f.props.field)); return <span key={f.id} className="bw-filter" data-active><span className="bw-k">{fld?.label}:</span> <b>{(fv[f.id] ?? []).map((v) => labelOf(v, fld)).join(', ')}</b><button className="bw-iconbtn bw-iconbtn--sm" aria-label={`Limpar ${fld?.label}`} onClick={() => st.setFilter(f.id, [])}><Icon name="close" size={12} /></button></span>; })}
        {cross && <span className="bw-filter" data-active><span className="bw-k">Seleção:</span> <b>{cross.label}</b><button className="bw-iconbtn bw-iconbtn--sm" aria-label="Limpar seleção" onClick={() => st.setCross(null)}><Icon name="close" size={12} /></button></span>}
        <span className="bw-live">Ao vivo · dados de 06/10/2026 08:00</span>
        {doc.id === 'net_operacoes' || doc.id === 'net_geografica' || doc.id === 'net_incidentes' || doc.id === 'net_gemeo' ? <Link to="/maps/$mapId" params={{ mapId: doc.id === 'net_incidentes' ? 'incidents' : doc.id === 'net_gemeo' ? 'lights' : 'network' }} className="bw-filter"><Icon name="pin" size={12} />Abrir workspace de mapa</Link> : null}
      </div>
      <div className="rv-doccanvas"><Canvas /></div>
      <Toasts />
      <FocusOverlay />
    </div>
  );
}
