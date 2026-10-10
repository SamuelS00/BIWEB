import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { Badge, Button, Icon, IconButton, PopoverButton, Switch, type IconName } from '@biweb/ui';
import { useDw, allChangeSets, statusOf, allAssets, allSources } from './store';
import { ASSETS } from './registry';
import { MAPPINGS, PIPELINES, RULES, MODELS, REVIEW } from './ops';
import { Overview } from './Overview';
import { SourcesView, SourceDetail } from './Sources';
import { Inspector } from './Inspector';
import { CopilotPanel } from './CopilotPanel';
import { ReviewPanel } from './ReviewPanel';
import { ProvenanceDialog } from './Provenance';
import { Dot, useGo } from './ui';
import './dataworkspace.css';

/* Seções pesadas carregam sob demanda. */
const CatalogView = lazy(() => import('./Catalog').then((m) => ({ default: m.CatalogView })));
const ModelView = lazy(() => import('./ModelView').then((m) => ({ default: m.ModelView })));
const TransformView = lazy(() => import('./Transformations').then((m) => ({ default: m.TransformView })));
const QualityView = lazy(() => import('./Quality').then((m) => ({ default: m.QualityView })));
const LineageView = lazy(() => import('./Lineage').then((m) => ({ default: m.LineageView })));
const EnrichView = lazy(() => import('./Enrichment').then((m) => ({ default: m.EnrichView })));
const ChangesView = lazy(() => import('./Changes').then((m) => ({ default: m.ChangesView })));
const RunsView = lazy(() => import('./Runs').then((m) => ({ default: m.RunsView })));
const PublishedView = lazy(() => import('./Published').then((m) => ({ default: m.PublishedView })));
const ConnectWizard = lazy(() => import('./ConnectWizard').then((m) => ({ default: m.ConnectWizard })));

export type Section = 'overview' | 'sources' | 'catalog' | 'model' | 'quality' | 'published' | 'transformations' | 'lineage' | 'enrichment' | 'changes' | 'runs';
const NAV: { id: Section; label: string; icon: IconName; adv?: boolean }[] = [
  { id: 'overview', label: 'Visão geral', icon: 'home' }, { id: 'sources', label: 'Fontes', icon: 'data' }, { id: 'catalog', label: 'Catálogo', icon: 'book' }, { id: 'model', label: 'Modelo', icon: 'model' },
  { id: 'quality', label: 'Qualidade', icon: 'target' }, { id: 'published', label: 'Publicados', icon: 'layers' },
  { id: 'transformations', label: 'Transformações', icon: 'sliders', adv: true }, { id: 'lineage', label: 'Linhagem', icon: 'share', adv: true }, { id: 'enrichment', label: 'Enriquecimento', icon: 'bolt', adv: true },
  { id: 'changes', label: 'Mudanças', icon: 'migrate', adv: true }, { id: 'runs', label: 'Execuções', icon: 'play', adv: true },
];
const TITLE: Record<Section, string> = { overview: 'Visão geral', sources: 'Fontes', catalog: 'Catálogo', model: 'Modelo', quality: 'Qualidade', published: 'Publicados', transformations: 'Transformações', lineage: 'Linhagem', enrichment: 'Enriquecimento', changes: 'Mudanças', runs: 'Execuções' };

export function DataWorkspace() {
  const params = useParams({ strict: false }) as { section?: string; itemId?: string };
  const section = (NAV.some((n) => n.id === params.section) ? params.section : 'overview') as Section;
  const itemId = params.itemId ? decodeURIComponent(params.itemId) : undefined;
  const go = useGo();
  const st = useDw();
  const { leftOpen, rightOpen, rTab, technical } = st;
  const pendingCs = allChangeSets(st.extraCs).filter((c) => statusOf(c, st.csStatus) === 'proposed').length;
  const pendingReview = REVIEW.filter((r) => !st.decisions[r.id]).length;
  const aiOn = st.ai.mode !== 'off';

  /* relógio da simulação: execução ativa e eventos ao vivo */
  useEffect(() => { const i = setInterval(() => useDw.getState().tickLive(), 1000); return () => clearInterval(i); }, []);
  useEffect(() => {
    const pool: [string, string, string][] = [['184 mil eventos ingeridos', 'Network Telemetry', '/data/sources/telemetry'], ['Sync do CRM concluído', '284 mil registros', '/data/runs/28492'], ['Webhook de pagamentos: 4,2 mil eventos', 'Payment Events', '/data/sources/payments'], ['Service Orders sincronizado', '58 mil linhas', '/data/sources/svc'], ['Billing DB sincronizado', '120 mil linhas', '/data/sources/billing']];
    let n = 0;
    const i = setInterval(() => { const p = pool[n++ % pool.length]!; const d = new Date(); useDw.getState().pushActivity({ t: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`, text: p[0], sub: p[1], to: p[2], fresh: true }); }, 11000);
    return () => clearInterval(i);
  }, []);
  /* botão Copilot do shell abre a aba Copilot */
  useEffect(() => { const f = () => useDw.getState().setPane({ rightOpen: true, rTab: 'copilot' }); addEventListener('biweb:data-copilot', f); return () => removeEventListener('biweb:data-copilot', f); }, []);
  /* em telas de canvas, abrir o inspetor recolhe a navegação para dar espaço ao diagrama */
  useEffect(() => { if (rightOpen && (section === 'lineage' || section === 'model')) useDw.getState().setPane({ leftOpen: false }); }, [rightOpen, section]);
  /* trocar de seção limpa a seleção do inspetor */
  useEffect(() => { useDw.getState().select(null); }, [section, itemId]);

  const center = (
    <Suspense fallback={<div className="dw-loading" role="status">Carregando {TITLE[section].toLowerCase()}…</div>}>
      {section === 'overview' && <Overview />}
      {section === 'sources' && (itemId ? <SourceDetail id={itemId} /> : <SourcesView />)}
      {section === 'catalog' && <CatalogView id={itemId} />}
      {section === 'model' && <ModelView id={itemId} />}
      {section === 'quality' && <QualityView id={itemId} />}
      {section === 'published' && <PublishedView id={itemId} />}
      {section === 'transformations' && <TransformView id={itemId} />}
      {section === 'lineage' && <LineageView id={itemId} />}
      {section === 'enrichment' && <EnrichView />}
      {section === 'changes' && <ChangesView id={itemId} />}
      {section === 'runs' && <RunsView id={itemId} />}
    </Suspense>
  );

  return (
    <div className={`dw${leftOpen ? '' : ' no-left'}${rightOpen ? '' : ' no-right'}`}>
      <header className="dw-head">
        <IconButton icon="list" label={leftOpen ? 'Recolher navegação' : 'Expandir navegação'} onPress={() => st.setPane({ leftOpen: !leftOpen })} />
        <div className="dw-title">
          <h1>Data Workspace</h1>
          <p>NovaLink Operations · {allSources(st.extraSources).length} fontes · {allAssets(st.extraAssets).length} ativos</p>
        </div>
        <span className="flex-1" />
        <PopoverButton label="Assistência de IA" icon="copilot" className="dw-ai-btn" placement="bottom end">
          <AiPopover />
        </PopoverButton>
        <span className={`dw-ai-state${aiOn ? '' : ' is-off'}`}>{aiOn ? (st.ai.mode === 'metadata' ? 'IA · somente metadados' : 'IA · amostras mascaradas') : 'IA desligada'}</span>
        <Switch isSelected={technical} onChange={() => st.toggleTech()}>Detalhes técnicos</Switch>
        <Button size="sm" icon="check" onPress={() => st.setPane({ rightOpen: true, rTab: 'review' })}>Revisão {pendingReview > 0 && <b className="dw-count">{pendingReview}</b>}</Button>
        <Button size="sm" icon="copilot" onPress={() => st.setPane({ rightOpen: true, rTab: 'copilot' })} isDisabled={!aiOn}>Copilot</Button>
        <Button variant="primary" size="sm" icon="plus" onPress={() => st.openWizard()}>Conectar dados</Button>
      </header>

      <nav className="dw-mnav" aria-label="Seções do Data Workspace">
        <select value={section} aria-label="Seção" onChange={(e) => go(e.target.value === 'overview' ? '/data' : `/data/${e.target.value}`)}>{NAV.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}</select>
      </nav>

      {leftOpen && (
        <aside className="dw-left" aria-label="Navegação do Data Workspace">
          <ul className="dw-nav">
            {NAV.filter((n) => !n.adv).map((n) => <NavItem key={n.id} n={n} on={section === n.id} badge={n.id === 'quality' ? 4 : undefined} />)}
            <li className="dw-nav-sep"><span>Engenharia</span></li>
            {NAV.filter((n) => n.adv).map((n) => <NavItem key={n.id} n={n} on={section === n.id} badge={n.id === 'changes' ? pendingCs : n.id === 'runs' ? 1 : undefined} live={n.id === 'runs'} />)}
          </ul>
          <LeftContext section={section} itemId={itemId} />
        </aside>
      )}

      <main className="dw-center" id="dw-center">{center}</main>

      {rightOpen && (
        <aside className="dw-right" aria-label="Painel lateral">
          <div className="dw-rtabs" role="tablist" aria-label="Painel lateral">
            {([['inspector', 'Inspetor'], ['copilot', 'Copilot'], ['review', 'Revisão']] as const).map(([id, l]) => (
              <button key={id} type="button" role="tab" aria-selected={rTab === id} onClick={() => st.setPane({ rTab: id })}>{l}{id === 'review' && pendingReview > 0 && <em className="bw-num">{pendingReview}</em>}</button>
            ))}
            <span className="flex-1" />
            <IconButton icon="close" label="Fechar painel" size="sm" onPress={() => st.setPane({ rightOpen: false })} />
          </div>
          <div className="dw-rbody">
            {rTab === 'inspector' && <Inspector section={section} itemId={itemId} />}
            {rTab === 'copilot' && <CopilotPanel section={section} itemId={itemId} />}
            {rTab === 'review' && <ReviewPanel />}
          </div>
        </aside>
      )}
      {!rightOpen && <button type="button" className="dw-rtoggle" onClick={() => st.setPane({ rightOpen: true })} aria-label="Abrir painel lateral"><Icon name="chevronRight" size={12} /></button>}

      {st.wizard.open && <Suspense fallback={null}><ConnectWizard /></Suspense>}
      <ProvenanceDialog />
      <div className="dw-toasts" role="status" aria-live="polite">{st.toasts.map((t) => <div key={t.id} className="dw-toast"><Icon name="check" size={12} />{t.text}</div>)}</div>
    </div>
  );
}

function NavItem({ n, on, badge, live }: { n: (typeof NAV)[number]; on: boolean; badge?: number; live?: boolean }) {
  const go = useGo();
  return (
    <li>
      <button type="button" className={`dw-nav-i${on ? ' is-on' : ''}`} aria-current={on ? 'page' : undefined} onClick={() => go(n.id === 'overview' ? '/data' : `/data/${n.id}`)}>
        <Icon name={n.icon} size={16} /><span>{n.label}</span>
        {live && <Dot tone="live" live />}
        {badge ? <em className="bw-num">{badge}</em> : null}
      </button>
    </li>
  );
}

/** Árvore contextual abaixo da navegação: muda conforme a seção. */
function LeftContext({ section, itemId }: { section: Section; itemId?: string }) {
  const go = useGo();
  const extraSources = useDw((s) => s.extraSources), extraAssets = useDw((s) => s.extraAssets);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({ erp: true });
  const sources = allSources(extraSources), assets = allAssets(extraAssets);
  const tree = useMemo(() => {
    const m = q.trim().toLowerCase();
    return sources.map((s) => {
      const as = assets.filter((a) => a.source === s.id && (!m || a.name.toLowerCase().includes(m) || s.name.toLowerCase().includes(m)));
      const schemas = [...new Set(as.map((a) => a.schema))].map((sc) => ({ sc, as: as.filter((a) => a.schema === sc) }));
      return { s, schemas, n: as.length };
    }).filter((x) => x.n > 0);
  }, [sources, assets, q]);

  if (section === 'catalog' || section === 'sources') {
    const selAsset = itemId && section === 'catalog' ? assets.find((a) => a.id === itemId) : undefined;
    return (
      <div className="dw-ctx">
        <div className="dw-ctx-h"><span>{section === 'catalog' ? 'Ativos de dados' : 'Fontes e ativos'}</span></div>
        <label className="dw-search dw-search--sm"><Icon name="search" size={12} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar árvore…" aria-label="Filtrar árvore" /></label>
        <ul className="dw-tree" role="tree" aria-label="Árvore de fontes e ativos">
          {tree.map(({ s, schemas, n }) => {
            const isOpen = q ? true : open[s.id] ?? selAsset?.source === s.id;
            return (
              <li key={s.id} role="treeitem" aria-expanded={isOpen}>
                <button type="button" className={`dw-tr-row${section === 'sources' && itemId === s.id ? ' is-on' : ''}`} onClick={() => setOpen((o) => ({ ...o, [s.id]: !isOpen }))} onDoubleClick={() => go(`/data/sources/${s.id}`)}>
                  <Icon name={isOpen ? 'chevronDown' : 'chevronRight'} size={12} /><Icon name="data" size={12} /><span>{s.name}</span><em className="bw-num">{n}</em>
                </button>
                {isOpen && schemas.map(({ sc, as }) => (
                  <ul key={sc} role="group" className="dw-tr-sub">
                    <li className="dw-tr-schema">{sc}</li>
                    {as.map((a) => <li key={a.id} role="treeitem"><button type="button" className={`dw-tr-row dw-tr-leaf${itemId === a.id && section === 'catalog' ? ' is-on' : ''}`} onClick={() => go(`/data/catalog/${encodeURIComponent(a.id)}`)}><Icon name="table" size={12} /><span>{a.name}</span></button></li>)}
                  </ul>
                ))}
              </li>
            );
          })}
          {tree.length === 0 && <li className="dw-muted dw-pad">Nada encontrado.</li>}
        </ul>
      </div>
    );
  }
  if (section === 'transformations') {
    return (
      <div className="dw-ctx"><div className="dw-ctx-h"><span>Transformações</span></div>
        <ul className="dw-tree"><li className="dw-tr-schema">Mapeamentos</li>
          {MAPPINGS.map((m) => <li key={m.id}><button type="button" className={`dw-tr-row dw-tr-leaf${itemId === m.id ? ' is-on' : ''}`} onClick={() => go(`/data/transformations/${m.id}`)}><Icon name="arrowRight" size={12} /><span>{m.name}</span></button></li>)}
          <li className="dw-tr-schema">Pipelines</li>
          {PIPELINES.map((p) => <li key={p.id}><button type="button" className={`dw-tr-row dw-tr-leaf${itemId === p.id ? ' is-on' : ''}`} onClick={() => go(`/data/transformations/${p.id}`)}><Icon name="timeline" size={12} /><span>{p.name}</span></button></li>)}
          <li className="dw-tr-schema">Regras</li>
          <li><button type="button" className={`dw-tr-row dw-tr-leaf${itemId === 'rules' ? ' is-on' : ''}`} onClick={() => go('/data/transformations/rules')}><Icon name="sliders" size={12} /><span>{RULES.length} regras reutilizáveis</span></button></li>
        </ul></div>
    );
  }
  if (section === 'model') {
    return (
      <div className="dw-ctx"><div className="dw-ctx-h"><span>Modelos</span><em className="bw-num">{MODELS.length}</em></div>
        <ul className="dw-tree">{MODELS.map((m) => <li key={m.id}><button type="button" className={`dw-tr-row dw-tr-leaf${(itemId ?? 'sales') === m.id ? ' is-on' : ''}`} onClick={() => go(`/data/model/${m.id}`)}><Icon name="model" size={12} /><span>{m.name}</span>{m.status === 'Proposta' && <Badge tone="warning">Proposta</Badge>}</button></li>)}</ul></div>
    );
  }
  void ASSETS;
  return null;
}

function AiPopover() {
  const ai = useDw((s) => s.ai), setAi = useDw((s) => s.setAi);
  return (
    <div className="bw-popover dw-aipop">
      <span className="bw-label">Assistência de IA</span>
      <Switch isSelected={ai.mode !== 'off'} onChange={(v) => setAi({ mode: v ? 'metadata' : 'off' })}>{ai.mode === 'off' ? 'Desligada' : 'Habilitada'}</Switch>
      <p className="dw-muted">{ai.mode === 'off' ? 'A operação determinística (regras, estatísticas e conhecimento acumulado) continua funcionando normalmente.' : 'A IA sugere; nenhuma mudança é aplicada sem aprovação.'}</p>
      <PrivacyBlock />
    </div>
  );
}
export function PrivacyBlock() {
  const ai = useDw((s) => s.ai), setAi = useDw((s) => s.setAi);
  return (
    <div className="dw-priv" aria-label="Privacidade da IA">
      <b>Somente metadados</b>
      <ul><li className="is-ok">✓ Nomes</li><li className="is-ok">✓ Tipos</li><li className="is-ok">✓ Estatísticas</li><li className="is-ok">✓ Padrões</li><li className="is-no">✕ Valores brutos</li></ul>
      <Switch isSelected={ai.samples} isDisabled={ai.mode === 'off'} onChange={(v) => setAi({ samples: v, mode: v ? 'masked' : 'metadata' })}>Amostras mascaradas (requer aprovação)</Switch>
      <label className="dw-field"><span>Documentos</span>
        <select value={ai.docs} disabled={ai.mode === 'off'} onChange={(e) => setAi({ docs: e.target.value as 'none' | 'masked' | 'allowed' })}><option value="none">Nenhum</option><option value="masked">Mascarados</option><option value="allowed">Permitidos</option></select></label>
    </div>
  );
}
