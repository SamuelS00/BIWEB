import { useMemo, useState } from 'react';
import { Dialog as AriaDialog, Modal, ModalOverlay } from 'react-aria-components';
import { Badge, Button, Icon, IconButton, Switch } from '@biweb/ui';
import { CATS, CONNECTORS, FORMS, discover, type Cat, type Connector, type DNode, type FField } from './connectors';
import { col, type Asset, type Family, type IngestMode, type Source, type Special } from './registry';
import { useDw } from './store';
import { AvailBadge, Banner2, Meter, Search, StepList, useGo, useSteps } from './ui';

const STEPS = ['Fonte', 'Conexão', 'Teste', 'Descoberta', 'Ativos', 'Ingestão', 'Análise', 'Revisão'];
const FAMILY: Record<Cat, Family> = { db: 'database', wh: 'database', files: 'file', storage: 'file', api: 'api', apps: 'api', realtime: 'realtime', legacy: 'legacy', docs: 'document', geo: 'geospatial', custom: 'file' };
const SPECIAL: Record<string, Special> = { db: 'db', odbc: 'odbc', file: 'csv', rest: 'rest', webhook: 'webhook', mqtt: 'mqtt', kafka: 'mqtt', sftp: 'csv', storage: 'generic', pdf: 'doc', saas: 'rest', geo: 'geo', custom: 'generic' };
const TEMPLATES: Record<string, string[]> = {
  customers: ['id:int:PK', 'name:name', 'document:cpf', 'email:email', 'phone:phone', 'region:uf', 'created_at:datetime', 'updated_at:datetime'],
  orders: ['id:seq:PK', 'customer_id:int:FK', 'order_date:datetime', 'total:money', 'status:enum:e=paid/open/canceled', 'updated_at:datetime'],
  order_items: ['order_id:seq:FK', 'product_id:code:FK', 'qty:qty', 'unit_price:money'],
  products: ['id:code:PK', 'name:text', 'category:enum:e=Fibra/Roteadores/Cabos', 'list_price:money', 'active:bool'],
};
const ROWS: Record<string, number> = { customers: 412806, orders: 1824239, order_items: 5120733, products: 9482 };

type Test = 'testing' | 'ok' | 'fail';
interface Draft { connector?: Connector; vals: Record<string, string | number | boolean>; name: string; mode: 'snapshot' | 'full' | 'incremental' | 'realtime'; cursor: string; freq: string; picked: Set<string>; comp: { transport: string; format: string; extractor: string } }

export function ConnectWizard() {
  const st = useDw();
  const go = useGo();
  const [step, setStep] = useState(st.wizard.connector ? 1 : 0);
  const initial = CONNECTORS.find((c) => c.id === st.wizard.connector);
  const [d, setD] = useState<Draft>({ connector: initial, vals: {}, name: '', mode: 'incremental', cursor: 'updated_at', freq: 'A cada 15 minutos', picked: new Set(), comp: { transport: 'SFTP', format: 'CSV', extractor: 'Tabela' } });
  const [test, setTest] = useState<Test>('testing');
  const [done, setDone] = useState<{ disc: boolean; analyze: boolean }>({ disc: false, analyze: false });
  const close = () => st.closeWizard();
  const c = d.connector;
  const form = c ? FORMS[c.form] : undefined;
  const val = (f: FField) => d.vals[f.k] ?? f.def ?? '';
  const failing = form?.fields.some((f) => typeof val(f) === 'string' && /fail|invalid|unreach/i.test(String(val(f)))) ?? false;
  const disc = useMemo(() => (c ? discover(c.form) : { facts: [], tree: [] as DNode[] }), [c]);
  const leaves = useMemo(() => disc.tree.flatMap((n) => (n.children ? n.children : [n])), [disc]);

  const next = () => setStep((s) => Math.min(7, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const choose = (cn: Connector) => setD((x) => ({ ...x, connector: cn, vals: {}, name: cn.name }));
  const startTest = () => { setTest('testing'); setStep(2); };

  const finish = () => {
    if (!c) return;
    const sid = `new${String(Date.now()).slice(-5)}`;
    const sel = leaves.filter((l) => d.picked.has(l.id));
    const assets: Asset[] = sel.map((l) => {
      const tname = l.label; const spec = TEMPLATES[tname] ?? ['id:int:PK', 'name:text', 'created_at:datetime', 'updated_at:datetime'];
      return { id: `${sid}.${tname.toLowerCase()}`, source: sid, schema: l.id.includes('.') ? l.id.split('.')[0]! : 'default', name: tname, kind: 'table', rows: ROWS[tname] ?? 12000, cols: spec.map((s) => col(s, 'pg')), fresh: 'fresh', quality: 96, owner: 'Você', updated: 'agora' };
    });
    const mode: IngestMode = d.mode === 'snapshot' ? 'manual' : d.mode === 'realtime' ? 'stream' : d.mode;
    const src: Source = { id: sid, name: d.name || c.name, type: c.name, family: FAMILY[c.cat], mode, health: 'healthy', fresh: d.mode === 'realtime' ? 'live' : 'fresh', env: 'production', syncMin: 0, volume: `${assets.length} ativos`, models: 0, reports: 0, owner: 'Você', special: SPECIAL[c.form] ?? 'generic', connector: c.id, schedule: d.mode === 'incremental' ? d.freq : d.mode === 'realtime' ? 'Contínuo' : 'Manual', created: true };
    st.addSource(src, assets);
    st.pushActivity({ t: new Date().toTimeString().slice(0, 5), text: `${src.name} conectada`, sub: `${assets.length} ativos descobertos`, to: `/data/sources/${sid}`, fresh: true });
    st.toast(`${src.name} conectada · ${assets.length} ativos`);
    close(); go(`/data/sources/${sid}`);
  };

  return (
    <ModalOverlay isOpen onOpenChange={(o) => { if (!o) close(); }} isDismissable={false} className="bw-modal-overlay">
      <Modal className="dw-modal">
        <AriaDialog className="dw-wiz" aria-label="Conectar dados">
          <header className="dw-wiz-h">
            <div><h2>Conectar dados</h2><p>{c ? `${c.name} · ${STEPS[step]}` : 'Escolha uma fonte'}</p></div>
            <ol className="dw-wiz-steps" aria-label="Etapas">{STEPS.map((s, i) => <li key={s} className={i === step ? 'is-now' : i < step ? 'is-done' : ''} aria-current={i === step ? 'step' : undefined}><i>{i < step ? '✓' : i + 1}</i><span>{s}</span></li>)}</ol>
            <IconButton icon="close" label="Fechar assistente" onPress={close} />
          </header>
          <div className="dw-wiz-b">
            {step === 0 && <PickStep sel={c} onPick={choose} onTest={startTest} onNext={() => setStep(1)} onCancel={close} form={form} />}
            {step === 1 && c && form && <ConnStep c={c} form={form} val={val} set={(k, v) => setD((x) => ({ ...x, vals: { ...x.vals, [k]: v } }))} comp={d.comp} setComp={(p) => setD((x) => ({ ...x, comp: { ...x.comp, ...p } }))} />}
            {step === 2 && c && <TestStep c={c} failing={failing} state={test} setState={setTest} onEdit={() => setStep(1)} />}
            {step === 3 && c && <DiscoverStep c={c} facts={disc.facts} tree={disc.tree} done={done.disc} onDone={() => setDone((x) => ({ ...x, disc: true }))} />}
            {step === 4 && <AssetsStep tree={disc.tree} picked={d.picked} setPicked={(p) => setD((x) => ({ ...x, picked: p }))} leaves={leaves} />}
            {step === 5 && c && <ModeStep c={c} d={d} set={(p) => setD((x) => ({ ...x, ...p }))} />}
            {step === 6 && <AnalyzeStep c={c!} n={d.picked.size} done={done.analyze} onDone={() => setDone((x) => ({ ...x, analyze: true }))} />}
            {step === 7 && c && <ReviewStep c={c} d={d} setName={(n) => setD((x) => ({ ...x, name: n }))} />}
          </div>
          <footer className="dw-wiz-f">
            <span className="dw-muted"><Icon name="info" size={12} />O BIWEB analisa metadados e amostras primeiro. Os dados completos ainda não foram movidos.</span>
            <span className="flex-1" />
            {step > 0 && step !== 2 && <Button size="sm" onPress={back}>Voltar</Button>}
            {step === 0 && null}
            {step === 1 && <Button size="sm" variant="primary" onPress={startTest}>Testar conexão</Button>}
            {step === 2 && <><Button size="sm" onPress={() => setStep(1)}>Editar conexão</Button><Button size="sm" variant="primary" isDisabled={test !== 'ok'} onPress={() => { setD((x) => ({ ...x, picked: new Set(leaves.filter((l) => !/audit/.test(l.id)).map((l) => l.id)) })); next(); }}>Continuar</Button></>}
            {step === 3 && <Button size="sm" variant="primary" isDisabled={!done.disc} onPress={next}>Selecionar ativos</Button>}
            {step === 4 && <Button size="sm" variant="primary" isDisabled={d.picked.size === 0} onPress={next}>Continuar com {d.picked.size} {d.picked.size === 1 ? 'ativo' : 'ativos'}</Button>}
            {step === 5 && <Button size="sm" variant="primary" onPress={next}>Analisar</Button>}
            {step === 6 && <Button size="sm" variant="primary" isDisabled={!done.analyze} onPress={next}>Revisar</Button>}
            {step === 7 && <Button size="sm" variant="primary" icon="check" onPress={finish}>Concluir e abrir fonte</Button>}
          </footer>
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}

/* ───────── 1 · escolher conector ───────── */
function PickStep({ sel, onPick, onTest, onNext, onCancel, form }: { sel?: Connector; onPick: (c: Connector) => void; onTest: () => void; onNext: () => void; onCancel: () => void; form?: (typeof FORMS)[keyof typeof FORMS] }) {
  const [cat, setCat] = useState<Cat | 'all' | 'recent' | 'fav'>('all');
  const [q, setQ] = useState('');
  const [fav, setFav] = useState<Set<string>>(new Set(['postgres', 'csv', 'rest']));
  const RECENT = ['postgres', 'xlsx', 'rest', 'mqtt', 'sftp', 'pdf'];
  const list = useMemo(() => {
    const m = q.trim().toLowerCase();
    return CONNECTORS.filter((c) => (cat === 'all' || (cat === 'recent' ? RECENT.includes(c.id) : cat === 'fav' ? fav.has(c.id) : c.cat === cat)) && (!m || `${c.name} ${c.desc} ${c.caps.join(' ')}`.toLowerCase().includes(m)));
  }, [cat, q, fav]);
  return (
    <div className="dw-pick">
      <nav className="dw-pick-cats" aria-label="Categorias de conectores">{CATS.map((c) => <button key={c.id} type="button" className={cat === c.id ? 'is-on' : ''} onClick={() => setCat(c.id)}>{c.label}<em className="bw-num">{c.id === 'all' ? CONNECTORS.length : c.id === 'recent' ? RECENT.length : c.id === 'fav' ? fav.size : CONNECTORS.filter((x) => x.cat === c.id).length}</em></button>)}</nav>
      <div className="dw-pick-mid">
        <Search value={q} onChange={setQ} placeholder="Buscar conectores…" w={360} />
        <ul className="dw-conns" aria-label="Conectores">
          {list.map((c) => (
            <li key={c.id}><button type="button" className={`dw-conn${sel?.id === c.id ? ' is-on' : ''}`} onClick={() => onPick(c)} aria-pressed={sel?.id === c.id}>
              <span className="dw-conn-i"><Icon name={c.cat === 'db' || c.cat === 'wh' ? 'data' : c.cat === 'files' ? 'table' : c.cat === 'realtime' ? 'bolt' : c.cat === 'docs' ? 'report' : c.cat === 'geo' ? 'pin' : c.cat === 'api' || c.cat === 'apps' ? 'share' : 'layers'} size={16} /></span>
              <span className="dw-conn-t"><b>{c.name}</b><small>{c.desc}</small><span className="dw-conn-caps">{c.caps.slice(0, 4).map((x) => <em key={x}>{x}</em>)}</span></span>
              <AvailBadge a={c.avail} />
              <span role="button" tabIndex={0} className={`dw-fav${fav.has(c.id) ? ' is-on' : ''}`} aria-label={fav.has(c.id) ? `Remover ${c.name} dos favoritos` : `Favoritar ${c.name}`} aria-pressed={fav.has(c.id)} onClick={(e) => { e.stopPropagation(); setFav((s) => { const n = new Set(s); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n; }); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setFav((s) => { const n = new Set(s); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n; }); } }}><Icon name="star" size={12} /></span>
            </button></li>))}
          {list.length === 0 && <li className="dw-muted dw-pad">Nenhum conector encontrado para “{q}”. Use um conector personalizado.</li>}
        </ul>
      </div>
      <aside className="dw-pick-detail" aria-label="Detalhes do conector">
        {!sel || !form ? <div className="dw-empty"><Icon name="data" size={20} /><b>Escolha um conector</b><p>Veja capacidades, autenticação e configuração antes de conectar.</p></div> : (
          <>
            <header><h3>{sel.name}</h3><AvailBadge a={sel.avail} /></header><p className="dw-muted">{sel.desc}</p>
            {sel.avail === 'planned' && <p className="dw-note"><Icon name="info" size={12} />Planejado: ainda não disponível. Registre interesse com o time.</p>}
            {sel.avail === 'prepared' && <p className="dw-note"><Icon name="info" size={12} />Preparado: a configuração está pronta; o teste usa simulação neste protótipo.</p>}
            <h4>Capacidades</h4>
            <ul className="dw-capl">{sel.caps.map((x) => <li key={x}><Icon name="check" size={12} />{x}</li>)}{sel.cat === 'db' && !sel.caps.includes('CDC') && <li className="is-no">○ CDC</li>}</ul>
            <h4>Autenticação</h4><p className="dw-p">{form.auth}</p>
            <h4>Conexão</h4><p className="dw-p">{form.fields.slice(0, 5).map((f) => f.label).join(' · ')}</p>
            <h4>Avançado</h4><p className="dw-p">{form.adv.length ? form.adv.map((f) => f.label).join(' · ') : 'Definido pelo SDK'}</p>
            <div className="dw-pick-a"><Button size="sm" onPress={onCancel}>Cancelar</Button><Button size="sm" isDisabled={sel.avail === 'planned'} onPress={onTest}>Testar conexão</Button><Button size="sm" variant="primary" isDisabled={sel.avail === 'planned'} onPress={onNext}>Continuar</Button></div>
          </>
        )}
      </aside>
    </div>
  );
}

/* ───────── 2 · configuração específica por conector ───────── */
function ConnStep({ c, form, val, set, comp, setComp }: { c: Connector; form: (typeof FORMS)[keyof typeof FORMS]; val: (f: FField) => string | number | boolean; set: (k: string, v: string | number | boolean) => void; comp: Draft['comp']; setComp: (p: Partial<Draft['comp']>) => void }) {
  const field = (f: FField) => (
    <label key={f.k} className={`dw-field${f.w === 'half' ? ' is-half' : ''}`}><span>{f.label}</span>
      {f.kind === 'select' ? <select value={String(val(f))} onChange={(e) => set(f.k, e.target.value)}>{f.opts?.map((o) => <option key={o}>{o}</option>)}</select>
        : f.kind === 'switch' ? <Switch isSelected={Boolean(val(f))} onChange={(v) => set(f.k, v)}>{f.label}</Switch>
        : f.kind === 'password' ? <input type="password" value={String(val(f))} onChange={(e) => set(f.k, e.target.value)} autoComplete="off" aria-label={`${f.label} (protegido)`} />
        : f.kind === 'file' ? <span className="dw-filepick"><input value={String(val(f))} onChange={(e) => set(f.k, e.target.value)} /><Button size="sm" icon="upload" onPress={() => set(f.k, 'vendas_2026.csv')}>Escolher</Button></span>
        : <input type={f.kind === 'number' ? 'number' : 'text'} value={String(val(f))} onChange={(e) => set(f.k, f.kind === 'number' ? Number(e.target.value) : e.target.value)} />}
      {f.hint && <small className="dw-muted">{f.hint}</small>}</label>
  );
  return (
    <div className="dw-conn-form">
      <div><h3>{c.name}</h3><p className="dw-muted">{form.title} · autenticação: {form.auth}. Segredos ficam protegidos e nunca aparecem em texto claro.</p>
        {c.avail === 'prepared' && <p className="dw-note"><Icon name="info" size={12} />Conector preparado: esta configuração é demonstrativa.</p>}
        <div className="dw-form">{form.fields.map(field)}</div>
        <details className="dw-adv"><summary>Avançado</summary><div className="dw-form">{form.adv.map(field)}</div></details>
        <p className="dw-muted"><Icon name="info" size={12} />Dica: use um host contendo “fail” para simular uma falha de conexão.</p></div>
      <aside className="dw-compose" aria-label="Composição do conector">
        <h4>Como o dado chega</h4>
        <p className="dw-muted">Todo conector combina <b>transporte × formato × extrator</b>. Troque cada parte sem recriar a fonte.</p>
        {(['transport', 'format', 'extractor'] as const).map((k) => (
          <label key={k} className="dw-field"><span>{k === 'transport' ? 'Transporte' : k === 'format' ? 'Formato' : 'Extrator'}</span>
            <select value={comp[k]} onChange={(e) => setComp({ [k]: e.target.value })}>{(k === 'transport' ? ['SFTP', 'HTTP', 'S3', 'Upload', 'Banco de dados'] : k === 'format' ? ['CSV', 'JSON', 'XML', 'Parquet', 'Excel', 'PDF'] : ['Tabela', 'Documento', 'Eventos', 'Regiões de planilha']).map((o) => <option key={o}>{o}</option>)}</select></label>))}
        <p className="dw-compose-r"><b>{comp.transport}</b> × <b>{comp.format}</b> × <b>{comp.extractor}</b></p>
      </aside>
    </div>
  );
}

/* ───────── 3 · testar ───────── */
function TestStep({ c, failing, state, setState, onEdit }: { c: Connector; failing: boolean; state: Test; setState: (t: Test) => void; onEdit: () => void }) {
  const steps = ['Resolvendo host', 'Abrindo conexão segura (TLS)', 'Autenticando', 'Validando permissão somente leitura'];
  const [attempt, setAttempt] = useState(0);
  const [details, setDetails] = useState(false);
  const at = useSteps(steps.length, 520, state === 'testing', () => setState(failing && attempt === 0 ? 'fail' : 'ok'));
  return (
    <div className="dw-test">
      {state === 'testing' && <><h3>Testando conexão…</h3><StepList steps={steps} at={at} /><Meter v={(at / steps.length) * 100} tone="accent" /></>}
      {state === 'ok' && (
        <div className="dw-test-ok" role="status"><h3><Icon name="check" size={16} />Conexão bem-sucedida</h3>
          <div className="dw-facts"><div className="dw-kv"><span>Latência</span><b className="bw-num">28 ms</b></div><div className="dw-kv"><span>Servidor</span><b>{c.name === 'PostgreSQL' ? 'PostgreSQL 17' : `${c.name} · versão detectada`}</b></div><div className="dw-kv"><span>Permissões</span><b>Somente leitura</b></div></div>
          <p className="dw-muted">O BIWEB só lê metadados e amostras nesta etapa.</p></div>
      )}
      {state === 'fail' && (
        <div className="dw-test-bad" role="alert"><h3><Icon name="warning" size={16} />Falha na conexão</h3><p><b>Host inacessível (DNS).</b> Não foi possível resolver o endereço informado. Verifique o nome, a VPN e as regras de firewall.</p>
          {details && <pre className="dw-code">{`ERR_DNS_NXDOMAIN\nresolver: 10.0.0.2\nhost: ${'fail.db.internal'}\ntentativas: 3 · timeout 30 s`}</pre>}
          <div className="dw-hyp-a"><Button size="sm" variant="primary" icon="refresh" onPress={() => { setAttempt(1); setState('testing'); }}>Tentar novamente</Button><Button size="sm" onPress={onEdit}>Editar conexão</Button><Button size="sm" variant="ghost" onPress={() => setDetails(!details)}>{details ? 'Ocultar detalhes' : 'Ver detalhes'}</Button></div>
          <p className="dw-muted">Ao tentar novamente neste protótipo, a conexão passa a funcionar.</p></div>
      )}
    </div>
  );
}

/* ───────── 4 · descobrir ───────── */
function DiscoverStep({ c, facts, tree, done, onDone }: { c: Connector; facts: [string, string][]; tree: DNode[]; done: boolean; onDone: () => void }) {
  const steps = c.form === 'pdf' ? ['Lendo arquivos', 'Reconhecendo layout', 'Identificando campos', 'Estimando confiança'] : ['Listando schemas', 'Contando tabelas e views', 'Lendo colunas e tipos', 'Estimando volumes'];
  const at = useSteps(done ? 0 : facts.length, 650, !done, onDone);
  const shown = done ? facts.length : at;
  const assets = tree.flatMap((n) => n.children ?? [n]).slice(0, 4);
  const revealed = done ? assets.length : Math.min(assets.length, Math.max(0, shown));
  return (
    <div className="dw-discovery"><div className="dw-test"><h3>Descoberta de estrutura</h3>
      <ul className="dw-disc">{facts.map((f, i) => <li key={f[1] + i} className={i < shown ? 'is-in' : ''}><span>{i < shown ? '✓' : '◌'}</span><b className="bw-num">{i < shown ? f[0] : '…'}</b>{f[1]}</li>)}</ul>
      {!done && <StepList steps={steps} at={Math.min(steps.length - 1, at)} />}
      {done && <p className="dw-note is-ok"><Icon name="check" size={12} />Estrutura descoberta sem copiar os dados.</p>}</div>
      <aside className="dw-schema-preview" aria-label="Prévia dos ativos descobertos"><span className="bw-label">{c.name} → estrutura</span><div className="dw-schema-source"><Icon name="data" size={16} /><b>{c.name}</b><small>{revealed} / {assets.length} ativos</small></div>
        <div className="dw-schema-tree">{assets.map((asset, i) => { const fields = TEMPLATES[asset.label]?.slice(0, 3) ?? ['id:int:PK', 'name:text', 'created_at:datetime']; return <div className={`dw-schema-node${i < revealed ? ' is-visible' : ''}`} key={asset.id} style={{ animationDelay: `${i * 75}ms` }}><span className="dw-schema-link" aria-hidden="true" /><div><Icon name="table" size={12} /><b>{asset.label}</b><small>{asset.id.includes('.') ? asset.id.split('.')[0] : 'default'}</small></div><p>{fields.map((f) => f.split(':')[0]).join(' · ')}</p></div>; })}</div>
        <small className="dw-muted">Prévia de metadados · nenhuma linha foi copiada</small></aside></div>
  );
}

/* ───────── 5 · selecionar ativos ───────── */
function AssetsStep({ tree, picked, setPicked, leaves }: { tree: DNode[]; picked: Set<string>; setPicked: (s: Set<string>) => void; leaves: DNode[] }) {
  const [open, setOpen] = useState<Set<string>>(new Set(tree.map((t) => t.id)));
  const tog = (ids: string[], on: boolean) => { const n = new Set(picked); ids.forEach((i) => (on ? n.add(i) : n.delete(i))); setPicked(n); };
  return (
    <div className="dw-assets-step"><div className="dw-toolbar dw-toolbar--tight"><b>{picked.size} de {leaves.length} selecionados</b><Button size="sm" variant="ghost" onPress={() => setPicked(new Set(leaves.map((l) => l.id)))}>Selecionar tudo</Button><Button size="sm" variant="ghost" onPress={() => setPicked(new Set())}>Limpar</Button></div>
      <ul className="dw-checktree" role="tree" aria-label="Ativos descobertos">
        {tree.map((n) => {
          const kids = n.children ?? [], ids = kids.map((k) => k.id), on = ids.filter((i) => picked.has(i)).length;
          return n.children ? (
            <li key={n.id} role="treeitem" aria-expanded={open.has(n.id)}>
              <div className="dw-ct-row"><button type="button" aria-label={open.has(n.id) ? 'Recolher' : 'Expandir'} onClick={() => setOpen((s) => { const x = new Set(s); if (x.has(n.id)) x.delete(n.id); else x.add(n.id); return x; })}><Icon name={open.has(n.id) ? 'chevronDown' : 'chevronRight'} size={12} /></button>
                <label><input type="checkbox" checked={on === ids.length} ref={(el) => { if (el) el.indeterminate = on > 0 && on < ids.length; }} onChange={(e) => tog(ids, e.target.checked)} /><b>{n.label}</b><em>{n.count} objetos</em></label></div>
              {open.has(n.id) && <ul role="group">{kids.map((k) => <li key={k.id} role="treeitem"><label className="dw-ct-row dw-ct-leaf"><input type="checkbox" checked={picked.has(k.id)} onChange={(e) => tog([k.id], e.target.checked)} /><Icon name="table" size={12} /><span className="bw-mono">{k.label}</span><em>{k.count}</em></label></li>)}</ul>}
            </li>
          ) : <li key={n.id} role="treeitem"><label className="dw-ct-row dw-ct-leaf"><input type="checkbox" checked={picked.has(n.id)} onChange={(e) => tog([n.id], e.target.checked)} /><Icon name="table" size={12} /><span className="bw-mono">{n.label}</span><em>{n.count}</em></label></li>;
        })}
      </ul></div>
  );
}

/* ───────── 6 · modo de ingestão ───────── */
function ModeStep({ c, d, set }: { c: Connector; d: Draft; set: (p: Partial<Draft>) => void }) {
  const live = ['realtime', 'mqtt', 'webhook', 'kafka'].includes(c.form) || c.caps.includes('CDC');
  const opts: [Draft['mode'], string, string][] = [['snapshot', 'Snapshot', 'Uma única carga, manual. Bom para planilhas e arquivos avulsos.'], ['full', 'Completo', 'Recarrega tudo a cada execução. Simples; custa mais.'], ['incremental', 'Incremental', 'Traz só o que mudou usando um campo cursor.'], ...(live ? [['realtime', 'Tempo real', 'Recebe eventos continuamente, com baixa latência.'] as [Draft['mode'], string, string]] : [])];
  return (
    <div className="dw-mode"><h3>Como os dados serão trazidos?</h3>
      <div className="dw-mode-opts" role="radiogroup" aria-label="Modo de ingestão">{opts.map(([id, l, t]) => <button key={id} type="button" role="radio" aria-checked={d.mode === id} className={d.mode === id ? 'is-on' : ''} onClick={() => set({ mode: id })}><b>{l}</b><small>{t}</small></button>)}</div>
      {!live && <p className="dw-muted">Tempo real não está disponível para este conector.</p>}
      {d.mode === 'incremental' && <div className="dw-form"><label className="dw-field is-half"><span>Cursor</span><select value={d.cursor} onChange={(e) => set({ cursor: e.target.value })}><option>updated_at</option><option>created_at</option><option>id</option></select></label><label className="dw-field is-half"><span>Frequência</span><select value={d.freq} onChange={(e) => set({ freq: e.target.value })}>{['A cada 5 minutos', 'A cada 15 minutos', 'A cada hora', 'Diário · 05:30'].map((o) => <option key={o}>{o}</option>)}</select></label></div>}
    </div>
  );
}

/* ───────── 7 · analisar ───────── */
function AnalyzeStep({ c, n, done, onDone }: { c: Connector; n: number; done: boolean; onDone: () => void }) {
  const steps = ['Descobrindo estrutura', 'Perfilando amostra', 'Detectando semântica', 'Encontrando relacionamentos', 'Verificando conceitos conhecidos', 'Preparando propostas'];
  const at = useSteps(done ? 0 : steps.length, 800, !done, onDone);
  const cur = done ? steps.length : at;
  return (
    <div className="dw-test"><h3>Analisando {c.name}</h3><StepList steps={steps} at={cur} sub={{ 1: `${Math.min(126, 20 + (at === 1 ? 106 : 0))} / 184 campos` }} /><Meter v={(cur / steps.length) * 100} tone="accent" />
      <p className="dw-muted">BIWEB está analisando metadados e amostras primeiro. {n} ativos selecionados. Nenhum dado completo foi movido.</p></div>
  );
}

/* ───────── 8 · revisão ───────── */
function ReviewStep({ c, d, setName }: { c: Connector; d: Draft; setName: (n: string) => void }) {
  return (
    <div className="dw-review-step">
      <label className="dw-field"><span>Nome da fonte</span><input value={d.name} onChange={(e) => setName(e.target.value)} /></label>
      <div className="dw-cards dw-cards--sm"><div className="dw-card"><span className="dw-k">Conector</span><b>{c.name}</b><AvailBadge a={c.avail} /></div><div className="dw-card"><span className="dw-k">Ativos</span><b className="bw-num">{d.picked.size}</b></div><div className="dw-card"><span className="dw-k">Modo</span><b>{{ snapshot: 'Snapshot', full: 'Completo', incremental: 'Incremental', realtime: 'Tempo real' }[d.mode]}</b><small>{d.mode === 'incremental' ? `${d.cursor} · ${d.freq}` : ''}</small></div></div>
      <h4>O que o BIWEB encontrou</h4>
      <ul className="dw-evid"><li>✓ 2 colunas reconhecidas como CPF brasileiro</li><li>✓ Conceito existente <b>Customer</b> reutilizado (97% de similaridade)</li><li>✓ 3 relacionamentos sugeridos, sujeitos à sua aprovação</li><li>• 1 coluna com dados pessoais será mascarada na prévia</li></ul>
      <Banner2>Ao concluir, a fonte entra no catálogo. A carga completa só começa depois que você aprovar o primeiro ChangeSet.</Banner2>
    </div>
  );
}
void Badge;
