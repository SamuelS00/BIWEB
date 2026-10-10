import { useMemo, useState } from 'react';
import { Badge, Button, Icon, Switch } from '@biweb/ui';
import { FAMILY_LABEL, MODE_LABEL, assetsOf, type Family, type IngestMode, type Source } from './registry';
import { allAssets, allSources, AGO, useDw } from './store';
import { RUNS, QUALITY } from './ops';
import { nf, compact } from './sample';
import { Chip, Dot, Empty, FreshBadge, HealthBadge, Kv, Meter, RunBadge, Search, Section, Spark, Tabs2, ViewHead, pct, toneOfQuality, useGo } from './ui';
import { SpecialPanel } from './SourceSpecial';
import { FORMS, connectorById } from './connectors';

type SortKey = 'name' | 'type' | 'family' | 'mode' | 'status' | 'assets' | 'sync' | 'volume' | 'consumers';
const HRANK = { healthy: 0, warning: 1, critical: 2 };

export function SourcesView() {
  const go = useGo();
  const st = useDw();
  const sources = allSources(st.extraSources), assets = allAssets(st.extraAssets);
  const [q, setQ] = useState('');
  const [f, setF] = useState<{ status: string; family: string; mode: string; env: string; fresh: string }>({ status: '', family: '', mode: '', env: '', fresh: '' });
  const [sort, setSort] = useState<{ k: SortKey; dir: 1 | -1 }>({ k: 'name', dir: 1 });
  const [group, setGroup] = useState<'none' | 'family' | 'status' | 'env'>('none');

  const rows = useMemo(() => {
    const m = q.trim().toLowerCase();
    const list = sources.filter((s) => (!m || `${s.name} ${s.type} ${s.owner}`.toLowerCase().includes(m)) && (!f.status || s.health === f.status) && (!f.family || s.family === f.family) && (!f.mode || s.mode === f.mode) && (!f.env || s.env === f.env) && (!f.fresh || s.fresh === f.fresh));
    const n = (s: Source) => assets.filter((a) => a.source === s.id).length;
    const val = (s: Source): string | number => ({ name: s.name, type: s.type, family: s.family, mode: s.mode, status: HRANK[s.health], assets: n(s), sync: s.syncMin, volume: s.volume, consumers: s.models + s.reports }[sort.k]);
    return [...list].sort((a, b) => { const x = val(a), y = val(b); return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'pt-BR')) * sort.dir; });
  }, [sources, assets, q, f, sort]);

  const th = (k: SortKey, label: string, cls = '') => (
    <button type="button" role="columnheader" className={`dw-th ${cls}`} aria-sort={sort.k === k ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} onClick={() => setSort((s) => ({ k, dir: s.k === k ? (s.dir === 1 ? -1 : 1) : 1 }))}>
      {label}{sort.k === k && <Icon name={sort.dir === 1 ? 'chevronDown' : 'chevronRight'} size={12} />}
    </button>
  );
  const groups = useMemo(() => {
    if (group === 'none') return [{ key: '', rows }];
    const key = (s: Source) => (group === 'family' ? FAMILY_LABEL[s.family] : group === 'status' ? (s.health === 'healthy' ? 'Saudável' : s.health === 'warning' ? 'Atenção' : 'Crítico') : s.env);
    const map = new Map<string, Source[]>();
    rows.forEach((s) => map.set(key(s), [...(map.get(key(s)) ?? []), s]));
    return [...map.entries()].map(([k, r]) => ({ key: k, rows: r }));
  }, [rows, group]);
  const active = Object.values(f).filter(Boolean).length;
  const sel = (k: keyof typeof f, label: string, opts: [string, string][]) => (
    <label className="dw-sel"><span>{label}</span><select value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })}><option value="">Todos</option>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
  );

  return (
    <div className="dw-view">
      <ViewHead title="Fontes" sub={`${rows.length} de ${sources.length} fontes · ${assets.length} ativos`} actions={<Button size="sm" variant="primary" icon="plus" onPress={() => st.openWizard()}>Conectar dados</Button>} />
      <div className="dw-toolbar">
        <Search value={q} onChange={setQ} placeholder="Buscar fontes…" w={240} />
        {sel('status', 'Status', [['healthy', 'Saudável'], ['warning', 'Atenção'], ['critical', 'Crítico']])}
        {sel('family', 'Família', Object.entries(FAMILY_LABEL))}
        {sel('mode', 'Modo', Object.entries(MODE_LABEL))}
        {sel('env', 'Ambiente', [['production', 'Produção'], ['staging', 'Homologação'], ['development', 'Desenvolvimento']])}
        {sel('fresh', 'Frescor', [['live', 'Ao vivo'], ['fresh', 'Atualizado'], ['stale', 'Desatualizado']])}
        <label className="dw-sel"><span>Agrupar</span><select value={group} onChange={(e) => setGroup(e.target.value as typeof group)}><option value="none">Sem grupo</option><option value="family">Família</option><option value="status">Status</option><option value="env">Ambiente</option></select></label>
        {(active > 0 || q) && <Button size="sm" variant="ghost" onPress={() => { setF({ status: '', family: '', mode: '', env: '', fresh: '' }); setQ(''); }}>Limpar filtros</Button>}
      </div>
      <div className="dw-table dw-src" role="table" aria-label="Fontes de dados">
        <div className="dw-tr dw-tr--head" role="row">{th('name', 'Nome')}{th('type', 'Tipo')}{th('mode', 'Modo')}{th('status', 'Status')}{th('assets', 'Ativos', 'r')}{th('sync', 'Última sync')}{th('volume', 'Volume')}{th('consumers', 'Consumidores', 'r')}</div>
        {groups.map((g) => (
          <div key={g.key} role="rowgroup">
            {g.key && <div className="dw-group-h">{g.key}<em className="bw-num">{g.rows.length}</em></div>}
            {g.rows.map((s) => (
              <button key={s.id} type="button" role="row" className="dw-tr dw-tr--row" onClick={() => go(`/data/sources/${s.id}`)}>
                <span role="cell" className="dw-c-main"><span className="dw-ico"><Icon name={s.special === 'doc' ? 'report' : s.special === 'geo' ? 'pin' : s.fresh === 'live' ? 'bolt' : s.family === 'file' ? 'table' : s.family === 'api' ? 'share' : 'data'} size={16} /></span><span><b>{s.name}</b>{s.note && <small className="dw-warn">{s.note}</small>}</span></span>
                <span role="cell" className="dw-sec2 dw-c-stack">{s.type}<small>{FAMILY_LABEL[s.family]}</small></span>
                <span role="cell">{s.fresh === 'live' ? <span className="dw-live"><Dot tone="live" live />{s.mode === 'stream' ? 'Stream' : 'Push'}</span> : MODE_LABEL[s.mode]}</span>
                <span role="cell" className="dw-c-badges"><HealthBadge h={s.health} /><FreshBadge f={s.fresh} /></span>
                <span role="cell" className="bw-num r">{assets.filter((a) => a.source === s.id).length}</span>
                <span role="cell" className="bw-num dw-sec2">{s.fresh === 'live' ? 'agora' : AGO(s.syncMin)}</span>
                <span role="cell" className="dw-sec2">{s.volume}</span>
                <span role="cell" className="bw-num r">{s.models + s.reports}</span>
              </button>
            ))}
          </div>
        ))}
        {rows.length === 0 && <Empty icon="search" title="Nenhuma fonte com esses filtros" text="Ajuste a busca ou conecte uma nova fonte." action={<Button size="sm" onPress={() => { setF({ status: '', family: '', mode: '', env: '', fresh: '' }); setQ(''); }}>Limpar filtros</Button>} />}
      </div>
    </div>
  );
}

type STab = 'overview' | 'assets' | 'schema' | 'runs' | 'quality' | 'lineage' | 'settings';

export function SourceDetail({ id }: { id: string }) {
  const go = useGo();
  const st = useDw();
  const src = allSources(st.extraSources).find((s) => s.id === id);
  const [tab, setTab] = useState<STab>('overview');
  if (!src) return <div className="dw-view"><Empty icon="data" title="Fonte não encontrada" text="Ela pode ter sido removida." action={<Button size="sm" onPress={() => go('/data/sources')}>Voltar às fontes</Button>} /></div>;
  const assets = allAssets(st.extraAssets).filter((a) => a.source === src.id);
  const hist = [...Array(14)].map((_, i) => 52 + ((i * 29 + src.name.length * 7) % 44));
  const runs = RUNS.filter((r) => r.target === src.name);
  return (
    <div className="dw-view dw-view--flush">
      <div className="dw-sh">
        <button type="button" className="dw-back" onClick={() => go('/data/sources')}><Icon name="arrowLeft" size={12} />Fontes</button>
        <div className="dw-sh-main">
          <h2>{src.name}</h2>
          <Badge>{src.type}</Badge><HealthBadge h={src.health} /><FreshBadge f={src.fresh} /><Badge tone="accent">{MODE_LABEL[src.mode]}</Badge>
          <span className="flex-1" />
          <Button size="sm" icon="refresh" onPress={() => { st.toast(`Sincronização de ${src.name} iniciada`); }}>Sincronizar agora</Button>
        </div>
        <div className="dw-sh-facts">
          <Kv k="Última sync" v={src.fresh === 'live' ? 'agora' : AGO(src.syncMin)} /><Kv k="Ativos" v={assets.length} /><Kv k="Usada por" v={`${src.models} modelos · ${src.reports} relatórios`} /><Kv k="Responsável" v={src.owner} />
          {st.technical && <Kv k="source id" v={`src_${src.id}_01hx9`} mono />}
        </div>
        <Tabs2<STab> label="Seções da fonte" value={tab} onChange={setTab} tabs={[{ id: 'overview', label: 'Visão geral' }, { id: 'assets', label: 'Ativos', n: assets.length }, { id: 'schema', label: 'Schema' }, { id: 'runs', label: 'Execuções', n: runs.length || undefined }, { id: 'quality', label: 'Qualidade' }, { id: 'lineage', label: 'Linhagem' }, { id: 'settings', label: 'Configurações' }]} />
      </div>
      <div className="dw-pad-v">
        {tab === 'overview' && (
          <>
            <div className="dw-cards">
              <div className="dw-card"><span className="dw-k">Saúde da conexão</span><HealthBadge h={src.health} /><small>{src.health === 'healthy' ? 'Latência 28 ms · permissões somente leitura' : src.note ?? 'Verifique a conexão'}</small></div>
              <div className="dw-card"><span className="dw-k">Modo de sincronização</span><b>{MODE_LABEL[src.mode]}</b><small>{src.schedule}</small></div>
              <div className="dw-card"><span className="dw-k">Última execução bem-sucedida</span><b>{src.fresh === 'live' ? 'contínuo' : AGO(src.syncMin)}</b><small>Próxima: {src.fresh === 'live' ? 'contínua' : src.mode === 'manual' ? 'manual' : 'em ~11 min'}</small></div>
              <div className="dw-card"><span className="dw-k">Registros processados</span><b className="bw-num">{src.fresh === 'live' ? '12,4 mil/s' : compact(284000)}</b><small>{src.volume}</small></div>
              <div className="dw-card"><span className="dw-k">Frescor dos dados</span><FreshBadge f={src.fresh} /><small>{src.fresh === 'stale' ? 'Atualização manual atrasada' : 'Dentro do SLA'}</small></div>
              <div className="dw-card"><span className="dw-k">Status do schema</span>{src.id === 'crm' ? <Badge tone="warning" icon="warning">1 mudança pendente</Badge> : <Badge tone="success" icon="check">Estável</Badge>}<small>{src.id === 'crm' ? <button type="button" className="bw-link" onClick={() => go('/data/changes/CS-183')}>Ver ChangeSet CS-183</button> : 'Sem mudanças desde a última análise'}</small></div>
            </div>
            <Section title="Volume por execução" hint="últimas 14 execuções"><div className="dw-volrow"><Spark data={hist} w={420} h={44} /><span className="dw-muted">Média {compact(Math.round(hist.reduce((s, x) => s + x, 0) * 4200 / hist.length))} registros</span></div></Section>
            <SpecialPanel src={src} />
          </>
        )}
        {tab === 'assets' && (
          <div className="dw-table" role="table" aria-label="Ativos da fonte">
            <div className="dw-tr dw-tr--head dw-assets-grid" role="row"><span>Ativo</span><span>Schema</span><span className="r">Linhas</span><span className="r">Colunas</span><span>Frescor</span><span>Qualidade</span></div>
            {assets.map((a) => (
              <button key={a.id} type="button" role="row" className="dw-tr dw-tr--row dw-assets-grid" onClick={() => go(`/data/catalog/${encodeURIComponent(a.id)}`)}>
                <span className="dw-c-main"><span className="dw-ico"><Icon name="table" size={16} /></span><b>{a.name}</b></span><span className="dw-sec2">{a.schema}</span><span className="bw-num r">{nf(a.rows)}</span><span className="bw-num r">{a.declaredCols ?? a.cols.length}</span><span><FreshBadge f={a.fresh} /></span>
                <span className="dw-qcell"><Meter v={a.quality} /><b className="bw-num">{pct(a.quality)}</b></span>
              </button>
            ))}
          </div>
        )}
        {tab === 'schema' && (
          <div className="dw-schema-list">{assets.slice(0, 6).map((a) => (
            <Section key={a.id} title={a.name} hint={`${a.declaredCols ?? a.cols.length} colunas`} actions={<Button size="sm" variant="ghost" onPress={() => go(`/data/catalog/${encodeURIComponent(a.id)}`)}>Abrir ativo</Button>}>
              <div className="dw-fields">{a.cols.slice(0, 14).map((c) => <span key={c.name} className="dw-field-chip" title={c.sem}><b>{c.name}</b><em>{c.phys}</em></span>)}</div>
            </Section>))}</div>
        )}
        {tab === 'runs' && (runs.length ? (
          <div className="dw-table" role="table" aria-label="Execuções da fonte"><div className="dw-tr dw-tr--head dw-runs-grid" role="row"><span>Run</span><span>Modo</span><span>Início</span><span>Duração</span><span className="r">Processados</span><span>Status</span></div>
            {runs.map((r) => <button key={r.id} type="button" role="row" className="dw-tr dw-tr--row dw-runs-grid" onClick={() => go(`/data/runs/${r.id}`)}><b className="bw-mono">#{r.id}</b><span>{r.mode}</span><span className="bw-num">{r.started}</span><span className="bw-num">{r.dur}</span><span className="bw-num r">{nf(r.processed)}</span><RunBadge s={r.status} /></button>)}</div>
        ) : <Empty icon="play" title="Sem execuções recentes" text="As execuções desta fonte aparecem aqui após a próxima sincronização." action={<Button size="sm" onPress={() => go('/data/runs')}>Ver todas as execuções</Button>} />)}
        {tab === 'quality' && (
          <div className="dw-cards">{assets.slice(0, 6).map((a) => (
            <button key={a.id} type="button" className="dw-card dw-card--btn" onClick={() => go(`/data/catalog/${encodeURIComponent(a.id)}`)}><span className="dw-k">{a.name}</span><b className="bw-num">{pct(a.quality)}</b><Meter v={a.quality} /><small>{QUALITY.find((q) => q.name.toLowerCase().includes(a.name.toLowerCase()))?.issues.length ?? 0} problemas abertos</small></button>))}</div>
        )}
        {tab === 'lineage' && (
          <Empty icon="share" title="Linhagem desta fonte" text="Veja onde cada campo desta fonte é usado: transformações, datasets, relatórios, mapas e fluxos." action={<Button size="sm" variant="primary" onPress={() => go('/data/lineage')}>Abrir linhagem</Button>} />
        )}
        {tab === 'settings' && <Settings src={src} />}
      </div>
    </div>
  );
}

function Settings({ src }: { src: Source }) {
  const conn = connectorById(src.connector);
  const form = FORMS[conn?.form ?? 'db'];
  const [show, setShow] = useState(false);
  const toast = useDw((s) => s.toast);
  return (
    <div className="dw-settings">
      <Section title="Conexão" hint={conn?.name ?? src.type}>
        <div className="dw-form">{form.fields.map((f) => (
          <label key={f.k} className={`dw-field${f.w === 'half' ? ' is-half' : ''}`}><span>{f.label}</span>
            {f.kind === 'password' ? <input type="password" readOnly value="••••••••••••" aria-label={`${f.label} (protegido)`} /> : f.kind === 'select' ? <select defaultValue={String(f.def)}>{f.opts?.map((o) => <option key={o}>{o}</option>)}</select> : <input defaultValue={String(f.def ?? '')} />}
          </label>))}</div>
        <p className="dw-muted"><Icon name="lock" size={12} /> Segredos ficam mascarados e nunca são exibidos depois de salvos.</p>
      </Section>
      <Section title="Ingestão e agenda"><div className="dw-form">
        <label className="dw-field is-half"><span>Modo</span><select defaultValue={src.mode}>{Object.entries(MODE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label className="dw-field is-half"><span>Frequência</span><input defaultValue={src.schedule} /></label></div></Section>
      <Section title="Detecção de schema e qualidade"><div className="dw-form dw-form--sw">
        <Switch defaultSelected>Detectar mudanças de schema automaticamente</Switch><Switch defaultSelected>Sugerir renomeações (fingerprint)</Switch><Switch defaultSelected>Executar quality gates G1 · G2 · G3</Switch><Switch>Pausar publicação em mudanças breaking</Switch></div></Section>
      <Section title="Avançado" actions={<Button size="sm" variant="ghost" onPress={() => setShow(!show)}>{show ? 'Ocultar' : 'Mostrar'}</Button>}>
        {show ? <div className="dw-form">{form.adv.map((f) => <Switch key={f.k} defaultSelected={Boolean(f.def)}>{f.label}</Switch>)}</div> : <p className="dw-muted">Túnel SSH, timeouts e validações de leitura.</p>}</Section>
      <div className="dw-actions"><Button variant="primary" size="sm" onPress={() => toast('Configurações salvas')}>Salvar alterações</Button></div>
    </div>
  );
}
void assetsOf; void toneOfQuality; void Chip; void (null as unknown as Family | IngestMode);
