import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Icon, TextField } from '@biweb/ui';
import { MapCover } from './maps/MapCover';
import type { CoverKind } from './maps/MapCover';
import { REPORTS, createDocument } from './maps/model';
import type { MapCategory, ReportId } from './maps/model';
import './maps-gallery.css';

interface Entry { id: string; kind: CoverKind; name: string; blurb: string; category: MapCategory; accent: string; tags: string[]; live?: boolean; report?: ReportId; to?: string; stat: string }
const n = (v: number) => v.toLocaleString('pt-BR');

/** One-line numbers taken from the same documents the workspace opens, so the gallery never drifts from the maps. */
function statFor(id: ReportId): string {
  const d = createDocument(id), l = d.layers;
  switch (id) {
    case 'network': return `${n(l[1]!.features.length)} trechos · ${n(Math.round(l[1]!.features.reduce((s, f) => s + Number(f.properties.extensao_km), 0)))} km de fibra`;
    case 'theft': return `${n(l[0]!.features.length)} ocorrências · rota de patrulha`;
    case 'lights': return `${n(l[0]!.features.length)} postes · ${l[1]!.features.filter((c) => c.properties.status === 'Falha').length} circuitos apagados`;
    case 'incidents': return `${n(l[0]!.features.length)} incidentes · 24 h`;
    case 'field': return '9 equipes · despacho ao vivo';
    case 'coverage': return `${l[1]!.features.length} torres · ${n(l[0]!.features.length)} setores`;
    case 'expansion': return `${l[0]!.features.length} rotas · 26 semanas`;
    default: return `${l[0]!.features.length} células · ${l[1]!.features.length} sites`;
  }
}
const ENTRIES: Entry[] = [
  ...REPORTS.map((r): Entry => ({ id: r.id, kind: r.id, name: r.name, blurb: r.blurb, category: r.category, accent: r.accent, tags: r.tags, live: r.live, report: r.id, stat: statFor(r.id) })),
  { id: 'geo_dependency', kind: 'dependency', name: 'Dependency & Impact', blurb: 'Selecione um ativo e veja o que depende dele: ativos conectados, serviços afetados e o raio de impacto de uma falha.', category: 'Rede', accent: '#c07bd6', tags: ['Impacto', 'Topologia'], to: 'geo_dependency', stat: '7 sites · 8 enlaces' },
  { id: 'geo_replay', kind: 'replay', name: 'Historical Replay', blurb: 'Reconstrua estados, incidentes e utilização da rede no tempo, com linha do tempo e reprodução.', category: 'Operações', accent: '#7f9bd8', tags: ['Histórico', 'Replay'], to: 'geo_replay', stat: '24 h · passos de 15 min' },
];
const CATEGORIES: ('Todos' | MapCategory)[] = ['Todos', 'Rede', 'Segurança', 'Infraestrutura urbana', 'Operações'];
function savedIds(): Set<string> { try { return new Set(Object.keys(JSON.parse(localStorage.getItem('biweb.map-builder.v2') ?? '{}'))); } catch { return new Set(); } }

export function MapsGallery() {
  const [category, setCategory] = useState<'Todos' | MapCategory>('Todos'), [query, setQuery] = useState('');
  const saved = useMemo(savedIds, []);
  const q = query.trim().toLowerCase();
  const shown = ENTRIES.filter((e) => (category === 'Todos' || e.category === category) && (!q || `${e.name} ${e.blurb} ${e.tags.join(' ')} ${e.category}`.toLowerCase().includes(q)));
  return <main className="pg mg">
    <header className="mg-head">
      <div><div className="mg-eyebrow"><Icon name="pin" size={12} /> Mapas operacionais</div><h1 className="pg-title">Escolha uma visão do território</h1><p className="pg-sub">{ENTRIES.length} mapas sobre São Paulo, cada um com a sua própria leitura: rede, segurança, iluminação, campo em tempo real, cobertura, expansão e clima.</p></div>
      <div className="mg-search"><TextField label="Buscar mapas" hideLabel icon="search" placeholder="Buscar por nome, tema ou etiqueta" value={query} onChange={setQuery} /></div>
    </header>
    <div className="mg-chips" role="tablist" aria-label="Categorias">{CATEGORIES.map((c) => <button key={c} role="tab" aria-selected={category === c} onClick={() => setCategory(c)}>{c}<span>{c === 'Todos' ? ENTRIES.length : ENTRIES.filter((e) => e.category === c).length}</span></button>)}</div>
    {shown.length ? <div className="mg-grid">{shown.map((e) => {
      const body = <>
        <div className="mg-cover"><MapCover kind={e.kind} /><div className="mg-badges"><span className="mg-pill">{e.category}</span>{e.live && <span className="mg-pill is-live"><i />AO VIVO</span>}{e.report && saved.has(e.report) && <span className="mg-pill is-saved"><Icon name="check" size={12} />Salvo</span>}</div></div>
        <div className="mg-body"><h2>{e.name}</h2><p>{e.blurb}</p><div className="mg-tags">{e.tags.map((t) => <span key={t}>{t}</span>)}</div><div className="mg-foot"><span>{e.stat}</span><span className="mg-open">Abrir mapa <Icon name="arrowRight" size={12} /></span></div></div>
      </>;
      const props = { className: `mg-card${e.id === 'field' ? ' is-wide' : ''}`, style: { ['--card-accent' as string]: e.accent } };
      return e.report ? <Link key={e.id} to="/maps/$mapId" params={{ mapId: e.report }} aria-label={`${e.name}. ${e.blurb}`} {...props}>{body}</Link>
        : <Link key={e.id} to="/reports/$reportId" params={{ reportId: e.to! }} aria-label={`${e.name}. ${e.blurb}`} {...props}>{body}</Link>;
    })}</div> : <div className="mg-empty"><Icon name="search" size={20} /><b>Nenhum mapa encontrado</b><span>Tente outro termo ou escolha outra categoria.</span></div>}
    <footer className="mg-foot-note"><Icon name="info" size={12} /> Dados simulados sobre cartografia do OpenStreetMap. Os mapas funcionam inteiramente no navegador.</footer>
  </main>;
}
