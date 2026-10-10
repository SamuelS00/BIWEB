import { useState } from 'react';
import { Badge, Button, Icon, SegmentedControl } from '@biweb/ui';
import { DataPage } from '../datasources/DataPage';
import { assetById, colCount } from './registry';
import { PUBLISHED, QUALITY, type PDataset } from './ops';
import { useDw } from './store';
import { nf } from './sample';
import { DataGrid } from './DataGrid';
import { Empty, Kv, Meter, Section, Tabs2, ViewHead, pct, useGo } from './ui';

export function PublishedView({ id }: { id?: string }) {
  const p = PUBLISHED.find((x) => x.id === id);
  return p ? <DatasetDetail p={p} /> : <PublishedHome />;
}

function PublishedHome() {
  const go = useGo();
  const [view, setView] = useState<'lde' | 'bi'>('lde');
  return (
    <div className="dw-view">
      <ViewHead title="Publicados" sub={`${PUBLISHED.length} datasets curados · ${PUBLISHED.reduce((s, p) => s + p.consumers.length, 0)} consumidores`} actions={<SegmentedControl label="Tipo de dataset" value={view} onChange={setView} options={[{ id: 'lde', label: 'Datasets curados' }, { id: 'bi', label: 'Datasets de relatório' }]} />} />
      {view === 'lde' ? (
        <div className="dw-table" role="table" aria-label="Datasets publicados">
          <div className="dw-tr dw-tr--head dw-pub-grid" role="row"><span>Nome</span><span>Versão</span><span>Qualidade</span><span>Frescor</span><span className="r">Consumidores</span><span>Última publicação</span></div>
          {PUBLISHED.map((p) => (
            <button key={p.id} type="button" role="row" className="dw-tr dw-tr--row dw-pub-grid" onClick={() => go(`/data/published/${p.id}`)}>
              <span className="dw-c-main"><span className="dw-ico"><Icon name={p.geo ? 'pin' : p.realtime ? 'bolt' : 'layers'} size={16} /></span><b>{p.name}</b></span><span className="bw-mono">{p.version}</span>
              <span className="dw-qcell"><Meter v={p.quality} /><b className="bw-num">{pct(p.quality)}</b></span><span>{p.fresh === 'ao vivo' ? <span className="dw-live"><i className="dw-dot is-live is-pulse" />ao vivo</span> : p.fresh}</span><span className="bw-num r">{p.consumers.length}</span><span className="dw-sec2">{p.published}</span>
            </button>))}
        </div>
      ) : <div className="dw-embed"><DataPage /></div>}
    </div>
  );
}

type DTab = 'overview' | 'data' | 'schema' | 'quality' | 'lineage' | 'versions' | 'consumers' | 'contract';
function DatasetDetail({ p }: { p: PDataset }) {
  const go = useGo(), st = useDw();
  const [tab, setTab] = useState<DTab>('overview');
  const [json, setJson] = useState(false);
  const asset = p.asset ? assetById(p.asset) : undefined;
  const q = QUALITY.find((x) => x.name.toLowerCase().startsWith(p.name.toLowerCase().split(' ')[0]!));
  const create = (k: 'Relatório' | 'Mapa' | 'Fluxo') => { st.toast(`Abrindo ${k === 'Relatório' ? 'Report Builder' : k === 'Mapa' ? 'Map Builder' : 'Workflow Builder'} com ${p.name}`); go(k === 'Relatório' ? '/reports/novo/edit' : k === 'Mapa' ? '/maps' : '/workflows'); };
  return (
    <div className="dw-view dw-view--flush">
      <div className="dw-sh">
        <button type="button" className="dw-back" onClick={() => go('/data/published')}><Icon name="arrowLeft" size={12} />Publicados</button>
        <div className="dw-sh-main"><h2>{p.name} <span className="bw-mono">{p.version}</span></h2><Badge tone="success" icon="check">Publicado</Badge>{p.realtime && <Badge tone="accent">Tempo real</Badge>}<span className="flex-1" />
          <span className="dw-create"><span className="dw-k">Criar com estes dados</span>
            <Button size="sm" icon="report" onPress={() => create('Relatório')}>Relatório</Button>
            <Button size="sm" icon="pin" variant={p.geo ? 'primary' : 'default'} onPress={() => create('Mapa')}>Mapa{p.geo ? ' · tem lat/lng' : ''}</Button>
            <Button size="sm" icon="share" variant={p.realtime ? 'primary' : 'default'} onPress={() => create('Fluxo')}>Fluxo{p.realtime ? ' · monitorar' : ''}</Button></span></div>
        <div className="dw-sh-facts"><Kv k="Qualidade" v={pct(p.quality)} /><Kv k="Frescor" v={p.fresh} /><Kv k="Consumidores" v={p.consumers.length} /><Kv k="Responsável" v={p.owner} /><Kv k="Linhas" v={nf(p.rows)} />{st.technical && <Kv k="dataset id" v={`ds_${p.id}_${p.version}`} mono />}</div>
        <Tabs2<DTab> label="Seções do dataset" value={tab} onChange={setTab} tabs={[{ id: 'overview', label: 'Visão geral' }, { id: 'data', label: 'Dados' }, { id: 'schema', label: 'Schema' }, { id: 'quality', label: 'Qualidade' }, { id: 'lineage', label: 'Linhagem' }, { id: 'versions', label: 'Versões' }, { id: 'consumers', label: 'Consumidores', n: p.consumers.length }, { id: 'contract', label: 'Contrato' }]} />
      </div>
      <div className="dw-pad-v">
        {tab === 'overview' && (<><div className="dw-cards"><div className="dw-card"><span className="dw-k">Qualidade</span><b className="bw-num">{pct(p.quality)}</b><Meter v={p.quality} /></div><div className="dw-card"><span className="dw-k">Frescor</span><b>{p.fresh}</b><small>SLA {p.sla}</small></div><div className="dw-card"><span className="dw-k">Consumidores</span><b className="bw-num">{p.consumers.length}</b><small>relatórios, mapas e fluxos</small></div></div><ConsumerList p={p} /></>)}
        {tab === 'data' && (asset ? <DataGrid asset={asset} selCol={null} onSelectCol={() => undefined} onAction={() => undefined} /> : <Empty icon="table" title="Prévia indisponível" text="Este dataset de referência é estático." />)}
        {tab === 'schema' && (asset ? <div className="dw-fields dw-fields--lg">{asset.cols.map((c) => <span key={c.name} className="dw-field-chip"><b>{c.name}</b><em>{c.sem}</em></span>)}<span className="dw-muted">{colCount(asset)} colunas</span></div> : <Empty title="Schema não disponível" text="" />)}
        {tab === 'quality' && (q ? <div className="dw-cards dw-cards--sm"><div className="dw-card"><span className="dw-k">Completude</span><b className="bw-num">{pct(q.completeness)}</b></div><div className="dw-card"><span className="dw-k">Validade</span><b className="bw-num">{pct(q.validity)}</b></div><div className="dw-card"><span className="dw-k">Unicidade</span><b className="bw-num">{pct(q.uniqueness)}</b></div><div className="dw-card"><span className="dw-k">Integridade ref.</span><b className="bw-num">{pct(q.refint)}</b></div><div className="dw-card dw-card--cta"><Button size="sm" onPress={() => go(`/data/quality/${q.id}`)}>Abrir Qualidade</Button></div></div> : <p className="dw-muted">Sem alertas. <Button size="sm" onPress={() => go('/data/quality')}>Ver Qualidade</Button></p>)}
        {tab === 'lineage' && <Empty icon="share" title="Linhagem do dataset" text="Veja origem, transformações e tudo o que depende deste dataset." action={<Button size="sm" variant="primary" onPress={() => go('/data/lineage')}>Abrir linhagem</Button>} />}
        {tab === 'versions' && <ol className="dw-timeline">{[['hoje 13:29', p.version, 'Publicada após aprovação do ChangeSet'], ['08/10', 'anterior', 'customer_code → customer_id (CS-180)'], ['01/10', 'anterior', 'Nova coluna segment (CS-174)'], ['12/09', 'v1', 'Primeira publicação']].map(([t, v, n]) => <li key={t}><time>{t}</time><b className="bw-mono">{v}</b><span>{n}</span></li>)}</ol>}
        {tab === 'consumers' && <ConsumerList p={p} />}
        {tab === 'contract' && (
          <div className="dw-contract"><div className="dw-facts dw-facts--col"><Kv k="Responsável" v={p.owner} /><Kv k="Descrição" v={`Dados de ${p.name.replace(' Curated', '').toLowerCase()} validados, normalizados e prontos para consumo.`} /><Kv k="Versão do schema" v={p.version} /><Kv k="SLA de frescor" v={p.sla} /><Kv k="Requisitos de qualidade" v="Completude ≥ 98% · Validade ≥ 98% · G1 G2 G3 sem falhas" /><Kv k="Política de mudanças breaking" v="Exige aprovação e aviso aos consumidores" /><Kv k="Consumidores" v={p.consumers.map((c) => c.name).join(', ')} /></div>
            <Button size="sm" variant="ghost" onPress={() => setJson(!json)}>{json ? 'Ocultar contrato técnico' : 'Ver contrato técnico (JSON)'}</Button>
            {json && <pre className="dw-code" aria-label="Contrato em JSON">{JSON.stringify({ dataset: p.id, version: p.version, owner: p.owner, freshness: { sla: p.sla }, quality: { completeness: 0.98, validity: 0.98 }, breaking: 'require_approval', consumers: p.consumers.map((c) => c.name) }, null, 2)}</pre>}</div>
        )}
      </div>
    </div>
  );
}
function ConsumerList({ p }: { p: PDataset }) {
  const go = useGo();
  return (
    <Section title="Usado por" hint="clique para abrir no módulo correspondente">
      <ul className="dw-hits">{p.consumers.map((c) => <li key={c.name}><button type="button" onClick={() => go(c.to)}><Badge tone="accent">{c.kind === 'Relatório' ? 'Report Builder' : c.kind === 'Mapa' ? 'Map Builder' : 'Workflow Builder'}</Badge><b>{c.name}</b><small>{c.kind}</small><Icon name="chevronRight" size={12} /></button></li>)}</ul>
    </Section>
  );
}
