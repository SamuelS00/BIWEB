import { useMemo, useState } from 'react';
import { Badge, Button, Icon } from '@biweb/ui';
import { RELS, colCount, colLabel, relsOfAsset, sourceById, ENTITY_LINKS, type Asset } from './registry';
import { allAssets, allSources, useDw } from './store';
import { MODELS, PUBLISHED, QUALITY, GATES } from './ops';
import { nf, profileOf, type Profile } from './sample';
import { DataGrid, type ColAction } from './DataGrid';
import { ConfBadge, Empty, FreshBadge, Hist, Kv, Meter, Pill, Search, Section, Tabs2, ViewHead, pct, useGo } from './ui';

export const ASSET_QUALITY: Record<string, string> = { 'erp.pedidos': 'orders', 'erp.clientes': 'customers', 'erp.itens_pedido': 'items', 'erp.produtos': 'products', 'svc.service_orders': 'serviceorders', 'geo.assets': 'assets', 'invoices.invoice_documents': 'invoices', 'legacy.clientes': 'legacy', 'billing.invoices': 'billing' };
type ATab = 'data' | 'schema' | 'profile' | 'relationships' | 'lineage' | 'quality' | 'usage' | 'history';

/* ───────── busca global ───────── */
interface Hit { type: 'FONTE' | 'SCHEMA' | 'TABELA' | 'COLUNA' | 'CONCEITO' | 'MODELO' | 'DATASET'; label: string; sub: string; to: string }
function useIndex(): Hit[] {
  const extraS = useDw((s) => s.extraSources), extraA = useDw((s) => s.extraAssets);
  return useMemo(() => {
    const out: Hit[] = [];
    const S = allSources(extraS), A = allAssets(extraA);
    S.forEach((s) => out.push({ type: 'FONTE', label: s.name, sub: s.type, to: `/data/sources/${s.id}` }));
    const seen = new Set<string>();
    A.forEach((a) => {
      const k = `${a.source}.${a.schema}`; if (!seen.has(k)) { seen.add(k); out.push({ type: 'SCHEMA', label: `${sourceById(a.source)?.name ?? a.source} · ${a.schema}`, sub: 'schema', to: `/data/sources/${a.source}` }); }
      out.push({ type: 'TABELA', label: `${(sourceById(a.source)?.name ?? a.source).split(' ')[0]}.${a.name}`, sub: `${nf(a.rows)} linhas · ${colCount(a)} colunas`, to: `/data/catalog/${encodeURIComponent(a.id)}` });
      a.cols.forEach((c) => out.push({ type: 'COLUNA', label: `${(sourceById(a.source)?.name ?? a.source).split(' ')[0]}.${a.name}.${c.name}`, sub: `${c.phys} · ${c.sem}`, to: `/data/catalog/${encodeURIComponent(a.id)}` }));
    });
    ['Customer', 'Customer.CPF', 'Customer.Email', 'Order', 'Product', 'Region.State', 'Location.CEP', 'Asset', 'Supplier.CNPJ'].forEach((c) => out.push({ type: 'CONCEITO', label: c, sub: 'Conceito de negócio', to: '/data/model' }));
    MODELS.forEach((m) => out.push({ type: 'MODELO', label: m.name, sub: m.status, to: `/data/model/${m.id}` }));
    PUBLISHED.forEach((p) => out.push({ type: 'DATASET', label: p.name, sub: `${p.version} · ${p.consumers.length} consumidores`, to: `/data/published/${p.id}` }));
    return out;
  }, [extraS, extraA]);
}

export function CatalogView({ id }: { id?: string }) {
  const assets = allAssets(useDw((s) => s.extraAssets));
  const a = id ? assets.find((x) => x.id === id) : undefined;
  if (id && !a) return <div className="dw-view"><Empty icon="table" title="Ativo não encontrado" text="Ele pode ter sido removido ou renomeado." /></div>;
  return a ? <AssetDetail asset={a} /> : <CatalogHome />;
}

function CatalogHome() {
  const go = useGo();
  const idx = useIndex();
  const [q, setQ] = useState('');
  const hits = useMemo(() => { const m = q.trim().toLowerCase(); return m ? idx.filter((h) => h.label.toLowerCase().includes(m) || h.sub.toLowerCase().includes(m)) : []; }, [idx, q]);
  const groups = useMemo(() => { const g = new Map<string, Hit[]>(); hits.forEach((h) => g.set(h.type, [...(g.get(h.type) ?? []), h])); return [...g.entries()]; }, [hits]);
  const assets = allAssets(useDw((s) => s.extraAssets));
  const recent = ['erp.clientes', 'crm.customers', 'erp.pedidos', 'legacy.clientes', 'geo.assets', 'invoices.invoice_documents'].map((i) => assets.find((a) => a.id === i)).filter(Boolean) as Asset[];
  return (
    <div className="dw-view">
      <ViewHead title="Catálogo" sub={`${assets.length} ativos de dados em ${allSources(useDw.getState().extraSources).length} fontes · busca em fontes, tabelas, colunas, conceitos, modelos e datasets`} />
      <div className="dw-bigsearch"><Search value={q} onChange={setQ} placeholder="Buscar ativos de dados…  (ex.: customer)" label="Buscar ativos de dados" w={520} /></div>
      {q.trim() ? (
        hits.length === 0 ? <Empty icon="search" title={`Nada encontrado para “${q}”`} text="Tente outro termo, como cliente, pedido ou CPF." /> : (
          <div className="dw-results">{groups.map(([t, hs]) => (
            <Section key={t} title={t} hint={`${hs.length}`}>
              <ul className="dw-hits">{hs.slice(0, 8).map((h) => <li key={h.label + h.to}><button type="button" onClick={() => go(h.to)}><Badge tone={h.type === 'CONCEITO' ? 'accent' : 'neutral'}>{h.type}</Badge><b>{h.label}</b><small>{h.sub}</small><Icon name="chevronRight" size={12} /></button></li>)}{hs.length > 8 && <li className="dw-muted dw-pad">+ {hs.length - 8} resultados</li>}</ul>
            </Section>))}</div>)
      ) : (
        <Section title="Ativos recentes" hint="usados nas últimas sessões">
          <div className="dw-cards">{recent.map((a) => (
            <button key={a.id} type="button" className="dw-card dw-card--btn" onClick={() => go(`/data/catalog/${encodeURIComponent(a.id)}`)}>
              <span className="dw-k">{sourceById(a.source)?.name}</span><b>{a.name}</b><small className="bw-num">{nf(a.rows)} linhas · {colCount(a)} colunas</small>
              <span className="dw-asset-mini" aria-label={`Prévia do schema de ${a.name}`}><span className="dw-asset-mini-head"><span>CAMPO</span><span>TIPO</span></span>{a.cols.slice(0, 3).map((c) => <span className="dw-asset-mini-row" key={c.name}><span>{c.name}</span><span>{c.phys}</span></span>)}{a.cols.length > 3 && <span className="dw-asset-mini-more">+ {a.cols.length - 3} campos</span>}</span>
              <span className="dw-qcell"><Meter v={a.quality} /><b className="bw-num">{pct(a.quality)}</b></span>
            </button>))}</div>
        </Section>
      )}
    </div>
  );
}

/* ───────── detalhe do ativo ───────── */
function AssetDetail({ asset }: { asset: Asset }) {
  const go = useGo();
  const st = useDw();
  const [tab, setTab] = useState<ATab>('data');
  const src = sourceById(asset.source) ?? allSources(st.extraSources).find((s) => s.id === asset.source);
  const selCol = st.sel?.kind === 'column' && st.sel.id === asset.id ? (st.sel.extra ?? null) : null;
  const setCol = (c: string | null) => st.select(c ? { kind: 'column', id: asset.id, extra: c } : { kind: 'asset', id: asset.id });
  const act = (a: ColAction, col: string) => {
    if (a === 'profile') setTab('profile');
    if (a === 'relationships') setTab('relationships');
    if (a === 'lineage') go('/data/lineage');
    if (a === 'equivalents') { st.pushChat([{ id: `u${Date.now()}`, role: 'user', text: `Encontrar campos equivalentes a ${col}` }]); st.setPane({ rightOpen: true, rTab: 'copilot' }); import('./copilot').then((m) => st.pushChat([m.reply(`campos equivalentes ${col}`, { section: 'catalog', itemId: asset.id, col })])); }
    if (a === 'rule') st.toast(`Regra de qualidade criada para ${col} (rascunho)`);
  };
  const isFrame = asset.id.startsWith('erp.') || asset.id.startsWith('crm.') || asset.id.startsWith('legacy.');
  const qid = ASSET_QUALITY[asset.id];
  return (
    <div className="dw-view dw-view--flush">
      <div className="dw-sh">
        <button type="button" className="dw-back" onClick={() => go('/data/catalog')}><Icon name="arrowLeft" size={12} />Catálogo</button>
        <div className="dw-sh-main">
          <h2 className="bw-mono">{asset.name}</h2><Badge>{asset.kind === 'table' ? 'Tabela' : asset.kind === 'sheet' ? 'Aba' : asset.kind === 'resource' ? 'Recurso' : asset.kind === 'stream' ? 'Stream' : asset.kind === 'layer' ? 'Camada' : asset.kind === 'documents' ? 'Documentos' : 'Arquivo'}</Badge><FreshBadge f={asset.fresh} />
          <span className="flex-1" />
          <Button size="sm" icon="copilot" isDisabled={st.ai.mode === 'off'} onPress={() => { st.setPane({ rightOpen: true, rTab: 'copilot' }); import('./copilot').then((m) => st.pushChat([{ id: `u${Date.now()}`, role: 'user', text: 'Normalize este dataset' }, m.reply('normalize', { section: 'catalog', itemId: asset.id })])); }}>Normalizar com o Copilot</Button>
          <Button size="sm" icon="timeline" onPress={() => st.showOrigin(src?.special ?? 'db', `${src?.name}.${asset.name}`)}>Ver origem</Button>
          <Button size="sm" icon="plus" onPress={() => go('/data/published')}>Criar com estes dados</Button>
        </div>
        <p className="dw-path">{src?.name} <Icon name="chevronRight" size={12} /> {asset.schema} <Icon name="chevronRight" size={12} /> <b>{asset.name}</b></p>
        <div className="dw-sh-facts"><Kv k="Linhas" v={nf(asset.rows)} /><Kv k="Colunas" v={colCount(asset)} /><Kv k="Qualidade" v={pct(asset.quality)} /><Kv k="Atualizado" v={asset.updated} /><Kv k="Responsável" v={asset.owner} />{asset.concept && <Kv k="Conceito" v={asset.concept} />}{st.technical && <Kv k="schema hash" v="a41f9c0e" mono />}</div>
        <Tabs2<ATab> label="Seções do ativo" value={tab} onChange={setTab} tabs={[{ id: 'data', label: 'Dados' }, { id: 'schema', label: 'Schema' }, { id: 'profile', label: 'Perfil' }, { id: 'relationships', label: 'Relacionamentos', n: relsOfAsset(asset.id).length || undefined }, { id: 'lineage', label: 'Linhagem' }, { id: 'quality', label: 'Qualidade' }, { id: 'usage', label: 'Uso' }, { id: 'history', label: 'Histórico' }]} />
      </div>
      <div className="dw-pad-v">
        {tab === 'data' && <DataGrid asset={asset} selCol={selCol} onSelectCol={setCol} onAction={act} />}
        {tab === 'schema' && <SchemaTab asset={asset} selCol={selCol} setCol={setCol} />}
        {tab === 'profile' && <ProfileTab asset={asset} selCol={selCol} setCol={setCol} />}
        {tab === 'relationships' && <RelTab asset={asset} />}
        {tab === 'lineage' && (
          <div className="dw-linmini"><ul className="dw-chain"><li><b>Origem</b>{src?.name} · {asset.schema}.{asset.name}</li><li><b>RAW</b>raw.{asset.name.toLowerCase()}</li><li><b>Transformação</b>{isFrame ? 'normalizeCpf · Normalize Dates · Resolve Customer' : 'Cast Types · Validate'}</li><li><b>Curado</b>{PUBLISHED.find((p) => p.asset === asset.id)?.name ?? `${asset.name} (curado)`}</li><li><b>Consumo</b>{PUBLISHED.find((p) => p.asset === asset.id)?.consumers.map((c) => c.name).join(', ') ?? '—'}</li></ul><Button size="sm" variant="primary" onPress={() => go('/data/lineage')}>Abrir linhagem completa</Button></div>
        )}
        {tab === 'quality' && (qid ? <AssetQuality qid={qid} /> : <Empty icon="check" title="Nenhum problema de qualidade detectado" text="Esse ativo ainda não gerou alertas nos gates G1, G2 ou G3." />)}
        {tab === 'usage' && (
          <Section title="Quem usa este ativo">
            {(PUBLISHED.find((p) => p.asset === asset.id)?.consumers.length ?? 0) === 0 ? <Empty icon="share" title="Ainda sem consumidores" text="Publique um dataset curado com este ativo para usá-lo em relatórios, mapas e fluxos." action={<Button size="sm" onPress={() => go('/data/published')}>Ver publicados</Button>} /> : (
              <ul className="dw-hits">{PUBLISHED.find((p) => p.asset === asset.id)!.consumers.map((c) => <li key={c.name}><button type="button" onClick={() => go(c.to)}><Badge tone="accent">{c.kind}</Badge><b>{c.name}</b><Icon name="chevronRight" size={12} /></button></li>)}</ul>)}
          </Section>
        )}
        {tab === 'history' && (
          <ol className="dw-timeline">
            <li><time>hoje 13:42</time><b>Sincronização concluída</b><span>284 mil linhas · schema inalterado</span></li><li><time>hoje 13:29</time><b>Dataset publicado</b><span>versão atual</span></li>
            <li><time>08/10</time><b>Renomeação aplicada</b><span>customer_code → customer_id (CS-180)</span></li><li><time>01/10</time><b>Perfil recalculado</b><span>2 colunas com nova classificação</span></li><li><time>12/09</time><b>Ativo descoberto</b><span>Análise inicial de {colCount(asset)} colunas</span></li>
          </ol>
        )}
      </div>
    </div>
  );
}

function SchemaTab({ asset, selCol, setCol }: { asset: Asset; selCol: string | null; setCol: (c: string) => void }) {
  const st = useDw();
  return (
    <>
      <div className="dw-table dw-schema" role="table" aria-label="Schema">
        <div className="dw-tr dw-tr--head" role="row"><span>Campo</span><span>Tipo físico</span><span>Tipo semântico</span><span>Conceito</span><span>Classificação</span><span>Origem da detecção</span></div>
        {asset.cols.map((c) => {
          const dec = st.decisions[`sem:${asset.id}.${c.name}`];
          return (
            <button key={c.name} type="button" role="row" className={`dw-tr dw-tr--row${selCol === c.name ? ' is-on' : ''}`} onClick={() => setCol(c.name)}>
              <span className="dw-c-main">{c.flag ? <Pill tone="key">{c.flag}</Pill> : <i className="dw-nokey" />}<b className="bw-mono">{c.name}</b></span><span className="bw-mono dw-sec2">{c.phys}</span>
              <span>{c.sem}{c.suggested && !dec && <Badge tone="warning">Sugestão</Badge>}</span><span className="dw-sec2">{c.concept ?? '—'}</span><span>{c.pii ? <Pill tone="pii">{c.klass}</Pill> : <span className="dw-sec2">{c.klass}</span>}</span><span className="dw-sec2">{dec === 'accepted' ? 'Decisão humana' : c.via} · {c.conf}%</span>
            </button>
          );
        })}
        {asset.declaredCols && asset.declaredCols > asset.cols.length && <div className="dw-more">+ {asset.declaredCols - asset.cols.length} colunas</div>}
      </div>
    </>
  );
}

function ProfileViz({ p, name }: { p: Profile; name: string }) {
  if (p.kind === 'category') return <div className="dw-bars" role="img" aria-label={`Valores mais frequentes de ${name}`}>{p.top.slice(0, 5).map((t) => <div key={t.v}><span>{t.v}</span><i style={{ width: `${Math.max(3, t.pct * 1.6)}%` }} /><em className="bw-num">{pct(t.pct)}</em></div>)}</div>;
  if (p.kind === 'boolean') return <div className="dw-bars">{p.hist.map((t) => <div key={t.label}><span>{t.label === 'true' ? 'Verdadeiro' : 'Falso'}</span><i style={{ width: `${(t.v / 15)}%` }} /><em className="bw-num">{pct(t.v / 15)}</em></div>)}</div>;
  return <Hist data={p.hist} />;
}
function ProfileTab({ asset, selCol, setCol }: { asset: Asset; selCol: string | null; setCol: (c: string) => void }) {
  const cur = selCol ?? asset.cols[0]!.name;
  const ci = asset.cols.findIndex((c) => c.name === cur);
  const c = asset.cols[ci]!;
  const p = useMemo(() => profileOf(asset.id, asset.cols, ci), [asset, ci]);
  return (
    <div className="dw-profile">
      <ul className="dw-pcols" aria-label="Colunas">{asset.cols.map((x) => { const pp = profileOf(asset.id, asset.cols, asset.cols.indexOf(x)); return <li key={x.name}><button type="button" className={cur === x.name ? 'is-on' : ''} onClick={() => setCol(x.name)}><b className="bw-mono">{x.name}</b><small>{x.phys}</small><em className="bw-num" title="Nulos">{pct(pp.nullPct)}</em></button></li>; })}</ul>
      <div className="dw-pmain">
        <h3 className="bw-mono">{c.name} <small>{c.phys} · {c.sem}</small></h3>
        <div className="dw-cards dw-cards--sm"><div className="dw-card"><span className="dw-k">Nulos</span><b className="bw-num">{pct(p.nullPct)}</b></div><div className="dw-card"><span className="dw-k">Distintos</span><b className="bw-num">{nf(p.distinct)}</b><small>{pct(p.distinctPct)} dos preenchidos</small></div><div className="dw-card"><span className="dw-k">Duplicados</span><b className="bw-num">{pct(p.dupPct)}</b></div><div className="dw-card"><span className="dw-k">Chave candidata</span><b>{p.candidateKey ? 'Sim' : 'Não'}</b></div></div>
        <Section title={p.kind === 'numeric' ? 'Histograma' : p.kind === 'date' ? 'Distribuição no tempo' : p.kind === 'string' ? 'Comprimento dos valores' : 'Distribuição'}><ProfileViz p={p} name={c.name} /></Section>
        <div className="dw-facts">{p.min !== undefined && <Kv k="Mínimo" v={p.min} />}{p.max !== undefined && <Kv k="Máximo" v={p.max} />}{p.avg !== undefined && <Kv k="Média" v={p.avg} />}{p.len && <Kv k="Comprimento" v={`${p.len.min} – ${p.len.max} (média ${p.len.avg})`} />}</div>
        {p.patterns.length > 0 && <Section title="Padrões"><ul className="dw-bul">{p.patterns.map((x) => <li key={x.p}><code className="bw-mono">{x.p}</code><b className="bw-num">{pct(x.pct)}</b></li>)}</ul></Section>}
        {p.top.length > 0 && p.kind !== 'category' && <Section title="Valores mais comuns"><ul className="dw-bul">{p.top.slice(0, 5).map((x) => <li key={x.v}><span className="bw-mono">{c.pii ? x.v.replace(/\d(?=.{3})/g, '•') : x.v}</span><b className="bw-num">{pct(x.pct, 2)}</b></li>)}</ul>{c.pii && <p className="dw-muted"><Icon name="lock" size={12} /> Valores pessoais aparecem mascarados no perfil.</p>}</Section>}
      </div>
    </div>
  );
}

function RelTab({ asset }: { asset: Asset }) {
  const st = useDw();
  const rels = relsOfAsset(asset.id);
  const links = ENTITY_LINKS.filter((l) => l.members.some((m) => m.startsWith(`${asset.id}.`)));
  const kinds: ['declared' | 'inferred' | 'suggested', string][] = [['declared', 'Declarados'], ['inferred', 'Inferidos'], ['suggested', 'Sugeridos']];
  return (
    <div>
      {kinds.map(([k, l]) => { const rs = rels.filter((r) => r.kind === k); if (!rs.length) return null; return (
        <Section key={k} title={l} hint={`${rs.length}`}>
          <ul className="dw-rels">{rs.map((r) => { const d = st.decisions[r.id]; return (
            <li key={r.id}><button type="button" className={`dw-rel${st.sel?.kind === 'rel' && st.sel.id === r.id ? ' is-on' : ''}${d === 'rejected' ? ' is-rej' : ''}`} onClick={() => st.select({ kind: 'rel', id: r.id })}>
              <code className="bw-mono">{colLabel(r.from)}</code><Icon name="arrowRight" size={12} /><code className="bw-mono">{colLabel(r.to)}</code><Pill>{r.card}</Pill>{r.cross && <Badge tone="accent">Entre fontes</Badge>}<ConfBadge v={r.conf} />{d && <Badge tone={d === 'accepted' ? 'success' : 'neutral'}>{d === 'accepted' ? 'Aceito' : 'Rejeitado'}</Badge>}
            </button></li>); })}</ul></Section>); })}
      {rels.length === 0 && <Empty icon="share" title="Nenhum relacionamento encontrado" text="O Data Copilot pode procurar relacionamentos com outras tabelas." />}
      {links.map((l) => (
        <Section key={l.concept} title="Mesma entidade em várias fontes" hint={l.concept}>
          <div className="dw-entity"><div className="dw-entity-c"><Badge tone="accent">Conceito</Badge><b>{l.concept}</b><ConfBadge v={l.conf} /></div>
            <ul>{l.members.map((m) => <li key={m}><code className="bw-mono">{colLabel(m)}</code><span className="dw-muted">↕ mesma entidade</span></li>)}</ul></div>
        </Section>))}
    </div>
  );
}

function AssetQuality({ qid }: { qid: string }) {
  const go = useGo();
  const q = QUALITY.find((x) => x.id === qid)!;
  const gs = [q.g1, q.g2, q.g3];
  return (
    <div>
      <div className="dw-cards dw-cards--sm"><div className="dw-card"><span className="dw-k">Saúde</span><b className="bw-num">{pct(q.health)}</b><Meter v={q.health} /></div><div className="dw-card"><span className="dw-k">Completude</span><b className="bw-num">{pct(q.completeness)}</b></div><div className="dw-card"><span className="dw-k">Validade</span><b className="bw-num">{pct(q.validity)}</b></div><div className="dw-card"><span className="dw-k">Integridade ref.</span><b className="bw-num">{pct(q.refint)}</b></div></div>
      <Section title="Quality gates"><div className="dw-gates">{GATES.map((g, i) => <span key={g.id} className={`dw-gate is-${gs[i]}`}><b>{g.id}</b>{g.name}<em>{gs[i] === 'pass' ? 'passou' : gs[i] === 'warn' ? 'atenção' : 'falhou'}</em></span>)}</div></Section>
      <Section title="Problemas abertos" actions={<Button size="sm" onPress={() => go(`/data/quality/${q.id}`)}>Abrir na Qualidade</Button>}>
        {q.issues.length === 0 ? <Empty icon="check" title="Nenhum problema de qualidade detectado" text="Este dataset passou em todos os gates." /> : <ul className="dw-hits">{q.issues.map((i) => <li key={i.id}><button type="button" onClick={() => go(`/data/quality/${q.id}`)}><Badge tone={i.sev === 'high' ? 'danger' : i.sev === 'medium' ? 'warning' : 'neutral'}>{i.sev === 'high' ? 'Alta' : i.sev === 'medium' ? 'Média' : 'Baixa'}</Badge><b>{i.title}</b><small className="bw-num">{nf(i.count)}</small></button></li>)}</ul>}
      </Section>
    </div>
  );
}
void RELS;
