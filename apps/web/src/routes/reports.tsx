import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Avatar, Button, Icon, SegmentedControl, Select, Skeleton, TextField } from '@biweb/ui';
import { useGallery, WORKSPACES } from './gallery';
import { asset, useUi } from '../state/ui-store';
import { FavButton, ReportCard, StatusBadges } from './reports-shared';

type Cat = string;
type Status = 'Publicado' | 'Rascunho' | 'Depreciado';
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Relatórios: catálogo em grade (capas) ou lista, com filtros por categoria, status e tipo. */
export function ReportsPage() {
  const { reportsView, set, favorites, workspace } = useUi();
  const reports = useGallery();
  const CATS: Cat[] = ['Todos', 'Favoritos', ...[...new Set(reports.map((r) => r.category))]];
  const TYPES = [...new Set(reports.map((r) => r.type))];
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Cat>('Todos');
  const [status, setStatus] = useState<'all' | Status>('all');
  const [type, setType] = useState<string>('all');
  useEffect(() => { setCat('Todos'); setType('all'); }, [workspace]);
  const [sort, setSort] = useState<'recent' | 'name' | 'views'>('recent');
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 380); return () => clearTimeout(t); }, []);

  const list = useMemo(() => reports
    .filter((r) => cat === 'Todos' || (cat === 'Favoritos' ? favorites.includes(r.id) : r.category === cat))
    .filter((r) => status === 'all' || r.status === status)
    .filter((r) => type === 'all' || r.type === type)
    .filter((r) => !q || norm(`${r.name} ${r.description} ${r.owner}`).includes(norm(q)))
    .sort((a, b) => {
      if (workspace === 'rede' && (a.id === 'net_operacoes' || b.id === 'net_operacoes')) return a.id === 'net_operacoes' ? -1 : 1;
      if (workspace === 'rede' && sort === 'recent') {
        const order = ['net_incidentes', 'net_gemeo', 'net_campo', 'net_capacidade', 'geo_dependency', 'geo_replay'];
        const ai = order.indexOf(a.id), bi = order.indexOf(b.id);
        if (ai >= 0 || bi >= 0) return (ai < 0 ? order.length : ai) - (bi < 0 ? order.length : bi);
      }
      return sort === 'name' ? a.name.localeCompare(b.name) : sort === 'views' ? b.views - a.views : a.updatedOrder - b.updatedOrder;
    }), [q, cat, status, type, sort, favorites, reports, workspace]);
  const count = (c: Cat) => c === 'Todos' ? reports.length : c === 'Favoritos' ? reports.filter((r) => favorites.includes(r.id)).length : reports.filter((r) => r.category === c).length;

  return (
    <div className="pg">
      <header className="pg-head">
        <div>
          <h1 className="pg-title">Relatórios</h1>
          <p className="pg-sub">{reports.length} relatórios no workspace {WORKSPACES[workspace].label} · {reports.filter((r) => r.status === 'Publicado').length} publicados</p>
        </div>
        <span className="flex-1" />
        {workspace === 'rede' && <Button variant="primary" icon="plus" size="lg" onPress={() => navigate({ to: '/reports/$reportId/edit', params: { reportId: 'novo' } })}>Novo relatório</Button>}
      </header>

      <div className="rp-toolbar">
        <div className="rp-cats" role="tablist" aria-label="Categorias">
          {CATS.map((c) => (
            <button key={c} type="button" role="tab" aria-selected={cat === c} className="rp-cat-tab" onClick={() => setCat(c)}>
              {c === 'Favoritos' && <Icon name="star" size={12} />}{c}<span className="rp-cat-n">{count(c)}</span>
            </button>
          ))}
        </div>
        <div className="rp-filters">
          <TextField label="Buscar relatórios" hideLabel icon="search" placeholder="Buscar por nome, descrição ou dono" value={q} onChange={setQ} className="rp-search" />
          <Select label="Status" hideLabel value={status} onChange={setStatus} options={[{ id: 'all', label: 'Todos os status' }, { id: 'Publicado', label: 'Publicado' }, { id: 'Rascunho', label: 'Rascunho' }, { id: 'Depreciado', label: 'Depreciado' }]} />
          <Select label="Tipo" hideLabel value={type} onChange={setType} options={[{ id: 'all', label: 'Todos os tipos' }, ...TYPES.map((t) => ({ id: t, label: t }))]} />
          <Select label="Ordenar" hideLabel value={sort} onChange={setSort} options={[{ id: 'recent', label: 'Atualizados recentemente' }, { id: 'views', label: 'Mais vistos' }, { id: 'name', label: 'Nome (A–Z)' }]} />
          <SegmentedControl label="Visualização" value={reportsView} onChange={(v) => set({ reportsView: v })}
            options={[{ id: 'grid', label: 'Grade', icon: 'grid', iconOnly: true }, { id: 'list', label: 'Lista', icon: 'list', iconOnly: true }]} />
        </div>
      </div>

      {loading ? (
        <div className="rp-grid" aria-busy="true" aria-label="Carregando relatórios">
          {Array.from({ length: 8 }, (_, i) => <div key={i} className="rp-card rp-card--skeleton"><div className="rp-cover"><Skeleton height="100%" radius={0} /></div><div className="rp-body"><Skeleton width={60} height={10} /><Skeleton width="80%" height={14} /><Skeleton width="95%" height={10} /><Skeleton width="50%" height={10} /></div></div>)}
        </div>
      ) : list.length === 0 ? (
        <div className="rp-empty bw-page">
          <img src={asset('brand/mark.webp')} alt="" width={40} height={38} />
          <h2>Nenhum relatório com esses filtros</h2>
          <p>Limpe os filtros ou peça ao Copilot para encontrar o que você procura.</p>
          <Button onPress={() => { setQ(''); setCat('Todos'); setStatus('all'); setType('all'); }}>Limpar filtros</Button>
        </div>
      ) : reportsView === 'grid' ? (
        <div className="rp-grid bw-stagger">{list.map((r, i) => <ReportCard key={r.id} r={r} i={i} />)}</div>
      ) : (
        <div className="rp-list bw-stagger" role="table" aria-label="Relatórios">
          <div className="rp-row rp-row--head" role="row"><span role="columnheader">Relatório</span><span role="columnheader">Categoria</span><span role="columnheader">Status</span><span role="columnheader">Dono</span><span role="columnheader">Atualizado</span><span role="columnheader">Visualizações</span><span /></div>
          {list.map((r, i) => (
            <div key={r.id} className={`rp-row${r.status === 'Depreciado' ? ' rp-card--dep' : ''}`} role="row" style={{ ['--i' as string]: i }}>
              <Link to="/reports/$reportId" params={{ reportId: r.id }} className="rp-row-main" role="cell">
                <img src={r.cover(true)} alt="" width={112} height={63} loading="lazy" />
                <span><b>{r.name}</b><small>{r.type} · {r.description}</small></span>
              </Link>
              <span role="cell" className="bw-secondary">{r.category}</span>
              <span role="cell"><StatusBadges r={r} /></span>
              <span role="cell" className="bw-row" style={{ gap: 6, flexWrap: 'nowrap' }}><Avatar name={r.owner} size={20} />{r.owner}</span>
              <span role="cell" className="bw-secondary">{r.updated}</span>
              <span role="cell" className="bw-num bw-secondary">{r.views.toLocaleString('pt-BR')}</span>
              <span role="cell"><FavButton id={r.id} name={r.name} /></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
