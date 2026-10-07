import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components';
import { Badge, Banner, Button, Icon, IconButton, Select, Skeleton, TextField, type IconName } from '@biweb/ui';
import { useData } from '../data/registry';
import type { Dataset } from '../data/types';
import { analyzeFile, demoAnalysis, formatOf, nf, plural, sizeLabel, STAGES, type Analysis, type Fmt, type TargetId } from './analyze';
import { GeoPreview } from './GeoPreview';
import './datasources.css';

export interface ImportWizardProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado por "Criar relatório com este dataset", com o id do dataset criado. */
  onDone?: (datasetId: string) => void;
}

type Step = 1 | 2 | 3 | 4 | 5;
const STEPS: { n: Step; label: string }[] = [{ n: 1, label: 'Fonte' }, { n: 2, label: 'Leitura' }, { n: 3, label: 'Interpretar' }, { n: 4, label: 'Mapear campos' }, { n: 5, label: 'Confirmar' }];

const TILES: { fmt: Fmt; label: string; line: string; icon: IconName }[] = [
  { fmt: 'CSV', label: 'CSV', line: 'Texto separado por vírgula ou ponto e vírgula', icon: 'table' },
  { fmt: 'XLSX', label: 'XLSX', line: 'Planilha do Excel, uma aba por tabela', icon: 'grid' },
  { fmt: 'JSON', label: 'JSON', line: 'Lista de registros', icon: 'list' },
  { fmt: 'GeoJSON', label: 'GeoJSON', line: 'Feições com geometria e propriedades', icon: 'pin' },
  { fmt: 'KML', label: 'KML', line: 'Camadas do Google Earth', icon: 'layers' },
  { fmt: 'KMZ', label: 'KMZ', line: 'KML compactado, com estilos e ícones', icon: 'layers' },
  { fmt: 'SHP', label: 'SHP', line: 'Shapefile compactado em .zip', icon: 'pin' },
  { fmt: 'API', label: 'API', line: 'REST com resposta JSON ou GeoJSON', icon: 'share' },
  { fmt: 'DB', label: 'Banco de dados', line: 'PostgreSQL/PostGIS, SQL Server, Oracle', icon: 'data' },
];
const ACCEPT: Partial<Record<Fmt, string>> = { CSV: '.csv,.tsv,.txt', XLSX: '.xlsx,.xls', JSON: '.json', GeoJSON: '.geojson,.json', KML: '.kml', KMZ: '.kmz', SHP: '.zip,.shp' };
const ALL_ACCEPT = '.csv,.tsv,.txt,.xlsx,.xls,.json,.geojson,.kml,.kmz,.zip,.shp';

const TARGETS: { id: TargetId; label: string }[] = [
  { id: 'nome', label: 'Nome do ativo' }, { id: 'tipo', label: 'Tipo do ativo' }, { id: 'status', label: 'Status' }, { id: 'geometria', label: 'Geometria' },
  { id: 'capacidade', label: 'Capacidade' }, { id: 'proprietario', label: 'Proprietário' }, { id: 'atenuacao', label: 'Atenuação (dB)' }, { id: 'id', label: 'Identificador' },
  { id: 'keep', label: 'Manter como campo extra' }, { id: 'ignore', label: 'Não importar' },
];
const targetLabel = (t: TargetId) => TARGETS.find((x) => x.id === t)?.label ?? t;
const SCHEDULES = [{ id: 'manual', label: 'Manual' }, { id: 'daily', label: 'Diário' }, { id: 'hourly', label: 'A cada hora' }] as const;
type ScheduleId = (typeof SCHEDULES)[number]['id'];

type Source = { kind: 'demo' } | { kind: 'file'; file: File; format: Fmt } | { kind: 'connection'; format: 'API' | 'DB'; label: string };
type ReadState = { progress: number; stage: number; status: 'reading' | 'done' | 'error'; error?: string };

const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Assistente de importação em 5 passos: Fonte → Leitura → Interpretar → Mapear campos → Confirmar. */
export function ImportWizard({ isOpen, onOpenChange, onDone }: ImportWizardProps) {
  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false} className="bw-modal-overlay ds-overlay">
      <Modal className="ds-modal">
        <Dialog className="ds-wizard" aria-label="Importar dados">
          {({ close }) => <WizardBody close={close} onDone={onDone} />}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

function WizardBody({ close, onDone }: { close: () => void; onDone?: (id: string) => void }) {
  const [step, setStep] = useState<Step>(1);
  const [picked, setPicked] = useState<Fmt | null>(null);
  const [notice, setNotice] = useState<ReactNode>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [read, setRead] = useState<ReadState>({ progress: 0, stage: 0, status: 'reading' });
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [mapping, setMapping] = useState<Record<string, TargetId>>({});
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState<ScheduleId>('manual');
  const [created, setCreated] = useState<Dataset | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    headingRef.current?.focus({ preventScroll: true });
  }, [step, created]);

  /* Leitura: progresso em estágios (~1,8 s; 0,6 s com movimento reduzido) em paralelo com a leitura real do arquivo. */
  useEffect(() => {
    if (!source) return;
    let cancelled = false, raf = 0;
    let result: Analysis | null = null, err: string | null = null;
    const job = source.kind === 'file' ? analyzeFile(source.file)
      : Promise.resolve(source.kind === 'demo' ? demoAnalysis() : demoAnalysis('connection', source.format, source.label));
    job.then((a) => { result = a; }, (e: unknown) => { err = e instanceof Error ? e.message : 'erro desconhecido'; });
    const total = reducedMotion() ? 600 : 1800;
    const t0 = performance.now();
    setRead({ progress: 0, stage: 0, status: 'reading' }); setAnalysis(null);
    const tick = (t: number) => {
      if (cancelled) return;
      const raw = Math.min(1, (t - t0) / total);
      const p = result ? raw : Math.min(raw, 0.92);
      const stage = Math.min(3, Math.floor(p * 4));
      if (err && raw >= 0.4) { setRead({ progress: p, stage, status: 'error', error: err }); return; }
      if (result && raw >= 1) {
        const a: Analysis = result;
        setAnalysis(a);
        setMapping(Object.fromEntries(a.fields.map((f) => [f.name, f.suggested])));
        setName(a.origin === 'demo' ? 'Rede SP (rede_sp.kmz)' : a.origin === 'connection' ? `Rede SP (${a.fileName})` : `${a.fileName.replace(/\.[^.]+$/, '')} (${a.fileName})`);
        setRead({ progress: 1, stage: 3, status: 'done' });
        return;
      }
      setRead({ progress: p, stage, status: 'reading' });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [source]);

  const start = (s: Source) => { setNotice(null); setSource(s); setStep(2); };
  const useExample = () => start({ kind: 'demo' });
  const exampleAction = <Button onPress={useExample}>Usar arquivo de exemplo</Button>;

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const fmt = formatOf(file.name);
    const ext = file.name.includes('.') ? `.${file.name.split('.').pop()}` : 'sem extensão';
    if (!fmt) { setNotice(<Banner tone="warning" action={exampleAction}>Formato {ext} não reconhecido. Use CSV, JSON, GeoJSON, KML ou KMZ, ou veja o fluxo completo com o arquivo de exemplo.</Banner>); return; }
    if (fmt === 'XLSX' || fmt === 'SHP') {
      setNotice(<Banner tone="warning" action={exampleAction}>A leitura de {fmt === 'XLSX' ? 'planilhas XLSX' : 'shapefiles'} ainda não está disponível no protótipo. <b>{file.name}</b> não foi lido. Use o arquivo de exemplo para ver o fluxo completo.</Banner>);
      return;
    }
    start({ kind: 'file', file, format: fmt });
  };

  /* mapeamento */
  const requiredTargets: TargetId[] = analysis && (analysis.lat || analysis.points + analysis.lines + analysis.polygons > 0) ? ['nome', 'geometria', 'id'] : ['nome', 'id'];
  const usedCount = useMemo(() => { const m = new Map<TargetId, number>(); for (const t of Object.values(mapping)) m.set(t, (m.get(t) ?? 0) + 1); return m; }, [mapping]);
  const missing = requiredTargets.filter((t) => !usedCount.get(t));
  const dupes = [...usedCount].filter(([t, c]) => c > 1 && t !== 'keep' && t !== 'ignore').map(([t]) => t);

  /* pode avançar? motivo em texto quando não */
  const blocker: string | null =
    step === 1 ? 'Escolha um arquivo, o arquivo de exemplo ou uma conexão'
    : step === 2 ? (read.status === 'done' ? null : read.status === 'error' ? 'Não foi possível ler a fonte' : 'Aguarde a leitura terminar')
    : step === 4 ? (missing.length ? `Mapeie os campos obrigatórios: ${missing.map(targetLabel).join(', ')}` : dupes.length ? `Cada destino só pode receber um campo: ${dupes.map(targetLabel).join(', ')}` : null)
    : step === 5 ? (name.trim() ? null : 'Dê um nome ao dataset')
    : null;

  const back = () => {
    if (step === 2) { setSource(null); setAnalysis(null); setStep(1); return; }
    if (step > 1) setStep((step - 1) as Step);
  };
  const next = () => { if (!blocker && step < 5) setStep((step + 1) as Step); };
  const create = () => {
    if (blocker || !analysis) return;
    const ds = useData.getState().addImported(name.trim());
    setCreated(ds);
  };

  const isNetwork = !!analysis?.network;
  const scheduleLabel = SCHEDULES.find((s) => s.id === schedule)?.label ?? 'Manual';

  return (
    <>
      <header className="ds-wiz-head">
        <Heading slot="title" className="ds-wiz-title">Importar dados</Heading>
        <ol className="ds-stepper" aria-label="Passos da importação">
          {STEPS.map((s) => {
            const state = created || s.n < step ? 'done' : s.n === step ? 'current' : 'todo';
            const canJump = !created && s.n < step && s.n !== 2 && !(s.n === 1);
            return (
              <li key={s.n} className="ds-step" data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
                <button type="button" className="ds-step-btn" disabled={!canJump} onClick={() => setStep(s.n)} aria-label={`${s.n}. ${s.label}${state === 'done' ? ', concluído' : ''}`}>
                  <span className="ds-step-n bw-num" aria-hidden="true">{state === 'done' ? <Icon name="check" size={12} /> : s.n}</span>
                  <span className="ds-step-label">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <IconButton icon="close" label="Fechar" shortcut="Esc" onPress={close} />
      </header>

      <div className="ds-wiz-body">
        <div key={created ? 'done' : step} className="ds-step-pane">
          {created ? (
            <Success ds={created} schedule={scheduleLabel} headingRef={headingRef} />
          ) : step === 1 ? (
            <StepSource headingRef={headingRef} picked={picked} setPicked={setPicked} notice={notice} onFile={onFile} useExample={useExample}
              connect={(format, label) => start({ kind: 'connection', format, label })} />
          ) : step === 2 ? (
            <StepRead headingRef={headingRef} source={source} read={read} analysis={analysis} useExample={useExample} />
          ) : step === 3 && analysis ? (
            <StepInterpret headingRef={headingRef} a={analysis} />
          ) : step === 4 && analysis ? (
            <StepMap headingRef={headingRef} a={analysis} mapping={mapping} setMapping={setMapping} required={requiredTargets} missing={missing} usedCount={usedCount} />
          ) : step === 5 && analysis ? (
            <StepConfirm headingRef={headingRef} a={analysis} name={name} setName={setName} schedule={schedule} setSchedule={setSchedule} />
          ) : null}
        </div>
      </div>

      <footer className="ds-wiz-foot">
        {created ? (
          <>
            <span className="flex-1" />
            <Button size="lg" onPress={close}>Fechar</Button>
            {onDone && <Button size="lg" variant="primary" icon="report" onPress={() => { onDone(created.id); close(); }}>Criar relatório com este dataset</Button>}
          </>
        ) : (
          <>
            <Button size="lg" variant="ghost" onPress={close}>Cancelar</Button>
            <span className="flex-1" />
            {blocker && step !== 1 && <span className="ds-blocker" role="status"><Icon name="info" size={12} />{blocker}</span>}
            {step > 1 && <Button size="lg" icon="arrowLeft" onPress={back}>Voltar</Button>}
            {step < 5 ? (
              <span title={blocker ?? undefined} className="ds-btn-wrap">
                <Button size="lg" variant="primary" isDisabled={!!blocker} onPress={next}>Continuar</Button>
              </span>
            ) : (
              <span title={blocker ?? undefined} className="ds-btn-wrap">
                <Button size="lg" variant="primary" isDisabled={!!blocker} onPress={create}>{isNetwork ? 'Criar dataset de rede' : 'Criar dataset'}</Button>
              </span>
            )}
          </>
        )}
      </footer>
    </>
  );
}

type HRef = { headingRef: React.RefObject<HTMLHeadingElement | null> };
const StepTitle = ({ headingRef, children, sub }: HRef & { children: ReactNode; sub?: ReactNode }) => (
  <div className="ds-pane-head">
    <h3 ref={headingRef} tabIndex={-1} className="ds-pane-title">{children}</h3>
    {sub && <p className="ds-pane-sub">{sub}</p>}
  </div>
);

/* ---------------- 1 · Fonte ---------------- */

function StepSource({ headingRef, picked, setPicked, notice, onFile, useExample, connect }: HRef & {
  picked: Fmt | null; setPicked: (f: Fmt) => void; notice: ReactNode; onFile: (f: File | undefined) => void; useExample: () => void;
  connect: (format: 'API' | 'DB', label: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [url, setUrl] = useState('https://api.exemplo.com.br/v1/rede');
  const [host, setHost] = useState('netops-db.interno');
  const [port, setPort] = useState('5432');
  const [db, setDb] = useState('inventario_rede');
  const [user, setUser] = useState('leitura_bi');
  const isConn = picked === 'API' || picked === 'DB';
  const onDrop = (e: DragEvent) => { e.preventDefault(); setOver(false); onFile(e.dataTransfer.files[0]); };

  return (
    <>
      <StepTitle headingRef={headingRef} sub="Arquivos ficam no seu navegador durante a leitura. Conexões são cadastradas uma vez e reutilizadas por todos os relatórios.">De onde vêm os dados</StepTitle>
      <div className="ds-tiles" role="group" aria-label="Formato da fonte">
        {TILES.map((t) => (
          <button key={t.fmt} type="button" className="ds-tile" aria-pressed={picked === t.fmt} onClick={() => setPicked(t.fmt)}>
            <span className="ds-tile-ico"><Icon name={t.icon} /></span>
            <span className="ds-tile-text"><b>{t.label}</b><small>{t.line}</small></span>
          </button>
        ))}
      </div>

      {notice}

      {isConn ? (
        <section className="ds-conn" aria-label={picked === 'API' ? 'Conectar API' : 'Conectar banco de dados'}>
          {picked === 'API' ? (
            <div className="ds-conn-grid">
              <TextField label="URL do endpoint" value={url} onChange={setUrl} mono className="ds-span2" />
              <TextField label="Token de acesso" placeholder="Opcional no exemplo" />
            </div>
          ) : (
            <div className="ds-conn-grid">
              <TextField label="Host" value={host} onChange={setHost} mono />
              <TextField label="Porta" value={port} onChange={setPort} mono />
              <TextField label="Banco" value={db} onChange={setDb} mono />
              <TextField label="Usuário" value={user} onChange={setUser} mono />
            </div>
          )}
          <div className="ds-conn-foot">
            <span className="ds-note"><Icon name="info" size={12} />Exemplo: nenhuma conexão real é feita. O assistente lê a rede de demonstração como se viesse desta {picked === 'API' ? 'API' : 'base'}.</span>
            <Button variant="primary" onPress={() => connect(picked, picked === 'API' ? 'API de exemplo' : 'banco de exemplo')}>Conectar</Button>
          </div>
        </section>
      ) : (
        <>
          <div className={`ds-drop${over ? ' is-over' : ''}`} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={onDrop}>
            <Icon name="download" size={20} />
            <div className="ds-drop-text">
              <b>Arraste um arquivo{picked ? ` ${picked}` : ''} para cá</b>
              <span className="bw-secondary">CSV, JSON, GeoJSON, KML e KMZ são lidos no navegador · até 25 MB</span>
            </div>
            <Button onPress={() => input.current?.click()}>Escolher arquivo</Button>
            <input ref={input} type="file" hidden accept={(picked && ACCEPT[picked]) || ALL_ACCEPT} onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
          <div className="ds-example">
            <div className="ds-example-text">
              <b>Sem um arquivo à mão?</b>
              <span className="bw-secondary">rede_sp.kmz · Rede Metropolitana SP · 128 nós, 346 enlaces, 42 regiões</span>
            </div>
            <Button size="lg" icon="layers" onPress={useExample}>Usar arquivo de exemplo rede_sp.kmz</Button>
          </div>
        </>
      )}
    </>
  );
}

/* ---------------- 2 · Leitura ---------------- */

function StepRead({ headingRef, source, read, analysis, useExample }: HRef & { source: Source | null; read: ReadState; analysis: Analysis | null; useExample: () => void }) {
  const fmt: Fmt = !source ? 'KMZ' : source.kind === 'demo' ? 'KMZ' : source.format;
  const label = !source ? '' : source.kind === 'demo' ? 'rede_sp.kmz' : source.kind === 'file' ? source.file.name : source.label;
  const stages = STAGES[fmt];
  const pct = Math.round(read.progress * 100);
  return (
    <>
      <StepTitle headingRef={headingRef} sub={<><span className="bw-mono">{label}</span>{source?.kind === 'file' && ` · ${sizeLabel(source.file.size)}`}</>}>Lendo a fonte</StepTitle>
      <div className="ds-progress-block">
        <div className="ds-progress-row">
          <span className="ds-progress-stage">{read.status === 'done' ? 'Leitura concluída' : read.status === 'error' ? 'Leitura interrompida' : `${stages[read.stage] ?? ''}…`}</span>
          <span className="bw-num bw-secondary">{pct}%</span>
        </div>
        <div className="ds-progress" role="progressbar" aria-label="Progresso da leitura" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} data-state={read.status}>
          <span style={{ transform: `scaleX(${read.progress})` }} />
        </div>
        <ol className="ds-stages">
          {stages.map((s, i) => {
            const st = read.status === 'done' || i < read.stage ? 'done' : i === read.stage ? (read.status === 'error' ? 'error' : 'current') : 'todo';
            return (
              <li key={s} data-state={st}>
                <span className="ds-stage-ico" aria-hidden="true">{st === 'done' ? <Icon name="check" size={12} /> : st === 'error' ? <Icon name="warning" size={12} /> : null}</span>
                {s}<span className="sr-only">{st === 'done' ? ' concluído' : st === 'current' ? ' em andamento' : st === 'error' ? ' com erro' : ''}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {read.status === 'error' ? (
        <Banner tone="danger" action={<Button onPress={useExample}>Usar arquivo de exemplo</Button>}>
          Não foi possível ler o arquivo <b>{label}</b>: {read.error}. Verifique o arquivo e tente de novo, ou continue com o arquivo de exemplo.
        </Banner>
      ) : read.status === 'done' && analysis ? (
        <div className="ds-result" role="status">
          <Icon name="check" size={16} className="ds-ok" />
          <span className="bw-num"><b>{analysis.resultLine}</b></span>
          {analysis.origin === 'connection' && <Badge>Exemplo</Badge>}
        </div>
      ) : null}

      {read.status !== 'error' && <div className="ds-skel" aria-hidden="true" data-done={read.status === 'done' || undefined}>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="ds-skel-row">
            <Skeleton width={16} height={16} radius={2} /><Skeleton width={`${30 + ((i * 17) % 25)}%`} height={10} /><Skeleton width={80} height={10} /><Skeleton width={48} height={10} />
          </div>
        ))}
      </div>}
    </>
  );
}

/* ---------------- 3 · Interpretar ---------------- */

const Check = ({ ok, children, count }: { ok: boolean; children: ReactNode; count?: number }) => (
  <li className="ds-check" data-ok={ok || undefined}>
    <span className="ds-check-ico" aria-hidden="true">{ok ? <Icon name="check" size={12} /> : <Icon name="minus" size={12} />}</span>
    <span className="ds-check-label">{children}</span>
    {count !== undefined && <span className="bw-num ds-check-n">{nf(count)}</span>}
    <span className="sr-only">{ok ? 'detectado' : 'não detectado'}</span>
  </li>
);

const TopologyGlyph = () => (
  <svg className="ds-topo" width="56" height="36" viewBox="0 0 56 36" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1"><path d="M8 18L24 7M8 18L24 29M24 7L44 10M24 29L44 26M24 7L24 29M44 10L44 26" /></g>
    <g fill="var(--surface-panel)" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="18" r="3.5" /><circle cx="24" cy="7" r="3" /><circle cx="24" cy="29" r="3" /><circle cx="44" cy="10" r="3" /><circle cx="44" cy="26" r="3" /></g>
  </svg>
);

function StepInterpret({ headingRef, a }: HRef & { a: Analysis }) {
  const geoAny = a.points + a.lines + a.polygons > 0;
  const tabularFile = a.format === 'CSV' || a.format === 'JSON';
  return (
    <>
      <StepTitle headingRef={headingRef} sub="O que encontramos na fonte e como sugerimos usá-la. Nada é criado antes da confirmação.">Interpretação</StepTitle>
      <div className="ds-interpret">
        <div className="ds-interpret-left">
          <section className="ds-block">
            <h4 className="ds-block-title">Detectado</h4>
            <ul className="ds-checks">
              {tabularFile && <Check ok count={a.rows}>Linhas de dados</Check>}
              {tabularFile && <Check ok count={a.columns}>Colunas</Check>}
              {(!tabularFile || a.points > 0) && <Check ok={a.points > 0} count={a.points}>{a.network ? 'Pontos (nós)' : 'Pontos'}</Check>}
              {!tabularFile && <Check ok={a.lines > 0} count={a.lines}>{a.network ? 'Linhas (enlaces)' : 'Linhas'}</Check>}
              {!tabularFile && <Check ok={a.polygons > 0} count={a.polygons}>{a.network ? 'Polígonos (regiões)' : 'Polígonos'}</Check>}
              {a.routes > 0 && <Check ok count={a.routes}>Rotas</Check>}
            </ul>
            <div className="ds-coords">
              {([['Latitude', a.lat], ['Longitude', a.lon], ['Altitude', a.alt]] as const).map(([l, ok]) => (
                <span key={l} className="ds-coord" data-ok={ok || undefined}><Icon name={ok ? 'check' : 'minus'} size={12} />{l}<span className="bw-muted">{ok ? 'detectada' : 'não encontrada'}</span></span>
              ))}
            </div>
          </section>
          <section className="ds-block">
            <h4 className="ds-block-title">Propriedades <span className="bw-muted bw-num">{a.properties.length}</span></h4>
            <div className="ds-tags">{a.properties.slice(0, 24).map((p) => <code key={p} className="ds-tag">{p}</code>)}{a.properties.length > 24 && <span className="bw-muted bw-cap">+{a.properties.length - 24}</span>}</div>
          </section>
          <section className="ds-block">
            <h4 className="ds-block-title">Identificadores</h4>
            {a.idPatterns.length ? (
              <ul className="ds-ids">{a.idPatterns.map((p) => <li key={p.pattern}><code className="bw-mono">{p.pattern}</code><span className="bw-num bw-secondary">{plural(p.count, 'item', 'itens')}</span></li>)}</ul>
            ) : <p className="ds-note">Sem padrão de identificador. Um identificador sequencial será gerado.</p>}
          </section>

          <section className="ds-callout" data-on={geoAny || undefined}>
            <div className="ds-callout-head"><span className="ds-callout-kicker">Data → Map</span>{geoAny ? <Badge tone="success" icon="check">Pronto para mapa</Badge> : <Badge>Sem coordenadas</Badge>}</div>
            {geoAny ? (
              <p>Colunas geográficas detectadas automaticamente: {a.geoColumns.map((c, i) => <span key={c}>{i > 0 && ', '}<code className="bw-mono">{c}</code></span>)}. Os relatórios já podem usar este dataset em mapas, sem configurar coordenadas.</p>
            ) : <p>Não encontramos latitude, longitude ou geometria. O dataset fica disponível para tabelas e gráficos.</p>}
          </section>
          {a.network ? (
            <section className="ds-callout ds-callout--net" data-on>
              <TopologyGlyph />
              <div>
                <div className="ds-callout-head"><span className="ds-callout-kicker">Network Intelligence</span><Badge tone="accent">Rede detectada</Badge></div>
                <p><b>Isto parece uma rede: sugerimos topologia e mapa de rotas.</b> Origem e destino detectados em Linhas (<code className="bw-mono">{a.network.origem}</code> → <code className="bw-mono">{a.network.destino}</code>); cada linha vira um enlace entre dois nós.</p>
              </div>
            </section>
          ) : (
            <section className="ds-callout">
              <div className="ds-callout-head"><span className="ds-callout-kicker">Network Intelligence</span><Badge>Não se aplica</Badge></div>
              <p>Não encontramos origem e destino. As geometrias serão importadas como camadas.</p>
            </section>
          )}
        </div>
        <div className="ds-interpret-right">
          <h4 className="ds-block-title">Pré-visualização <span className="bw-muted">· passe o cursor sobre um ponto</span></h4>
          <GeoPreview geo={a.geo} height={380} />
        </div>
      </div>
    </>
  );
}

/* ---------------- 4 · Mapear campos ---------------- */

function StepMap({ headingRef, a, mapping, setMapping, required, missing, usedCount }: HRef & {
  a: Analysis; mapping: Record<string, TargetId>; setMapping: (m: Record<string, TargetId>) => void; required: TargetId[]; missing: TargetId[]; usedCount: Map<TargetId, number>;
}) {
  const options = TARGETS.map((t) => ({ id: t.id, label: required.includes(t.id) ? `${t.label} · obrigatório` : t.label }));
  return (
    <>
      <StepTitle headingRef={headingRef} sub={<>Ligue cada campo da fonte a um campo do dataset. Obrigatórios: {required.map(targetLabel).join(', ')}.</>}>Mapear campos</StepTitle>
      {missing.length > 0 && <Banner tone="warning">Falta origem para {missing.map(targetLabel).join(', ')}. Escolha um campo da fonte para {missing.length === 1 ? 'ele' : 'cada um'}.</Banner>}
      <table className="ds-map">
        <thead><tr><th>Campo de origem</th><th>Exemplo</th><th aria-hidden="true" /><th>Campo no dataset</th><th>Situação</th></tr></thead>
        <tbody>
          {a.fields.map((f) => {
            const t = mapping[f.name] ?? 'ignore';
            const dup = t !== 'keep' && t !== 'ignore' && (usedCount.get(t) ?? 0) > 1;
            const lostRequired = t === 'ignore' && required.includes(f.suggested) && !usedCount.get(f.suggested);
            const state: 'ok' | 'warn' | 'off' = dup || lostRequired ? 'warn' : t === 'ignore' ? 'off' : 'ok';
            const reason = dup ? `${targetLabel(t)} já recebe outro campo` : lostRequired ? `${targetLabel(f.suggested)} é obrigatório e ficou sem origem` : t === 'ignore' ? 'Não será importado' : t === 'keep' ? 'Campo extra' : 'Mapeado';
            return (
              <tr key={f.name} data-state={state}>
                <td><code className="bw-mono">{f.name}</code>{f.synthetic && <span className="bw-muted bw-cap"> · gerado na importação</span>}</td>
                <td className="ds-map-sample bw-secondary" title={f.sample}>{f.sample || <span className="bw-muted">vazio</span>}</td>
                <td className="ds-map-arrow" aria-hidden="true"><Icon name="arrowRight" size={12} /></td>
                <td><Select label={`Destino de ${f.name}`} hideLabel options={options} value={t} onChange={(v) => setMapping({ ...mapping, [f.name]: v })} /></td>
                <td>
                  <span className="ds-validity" data-state={state}>
                    <Icon name={state === 'ok' ? 'check' : state === 'warn' ? 'warning' : 'minus'} size={12} />{reason}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

/* ---------------- 5 · Confirmar ---------------- */

const TABLE_ICON: Record<Analysis['tables'][number]['kind'], IconName> = { point: 'pin', line: 'share', polygon: 'grid', table: 'table' };

function StepConfirm({ headingRef, a, name, setName, schedule, setSchedule }: HRef & { a: Analysis; name: string; setName: (v: string) => void; schedule: ScheduleId; setSchedule: (s: ScheduleId) => void }) {
  return (
    <>
      <StepTitle headingRef={headingRef} sub="O dataset fica no workspace, não num relatório: qualquer relatório pode usá-lo, e uma correção aqui chega a todos.">Confirmar</StepTitle>
      <div className="ds-confirm">
        <div className="ds-confirm-form">
          <TextField label="Nome do dataset" value={name} onChange={setName} errorMessage={name.trim() ? undefined : 'Informe um nome'} />
          <Select label="Atualização" options={[...SCHEDULES]} value={schedule} onChange={setSchedule}
            description={schedule === 'manual' ? 'Reimporte o arquivo quando houver uma versão nova.' : 'O arquivo precisa estar numa pasta ou URL acessível ao servidor.'} />
        </div>
        <section className="ds-block">
          <h4 className="ds-block-title">Tabelas a criar</h4>
          <ul className="ds-create-list">
            {a.tables.map((t) => (
              <li key={t.name}><Icon name={TABLE_ICON[t.kind]} size={12} /><span>{t.name}</span><span className="bw-num bw-secondary">{plural(t.count, 'linha', 'linhas')}</span></li>
            ))}
          </ul>
          <p className="ds-note">Fonte: <span className="bw-mono">{a.fileName}</span>{a.network && ' · relacionamentos enlace → nó de origem e destino criados automaticamente'}</p>
        </section>
      </div>
      {a.origin !== 'demo' && <p className="ds-note"><Icon name="info" size={12} />No protótipo, o conteúdo importado é representado pelo dataset de exemplo.</p>}
    </>
  );
}

function Success({ ds, schedule, headingRef }: HRef & { ds: Dataset; schedule: string }) {
  const rows = ds.tables.reduce((s, t) => s + t.rows.length, 0);
  return (
    <div className="ds-success">
      <span className="ds-success-ico" aria-hidden="true"><Icon name="check" size={20} /></span>
      <h3 ref={headingRef} tabIndex={-1} className="ds-pane-title">Dataset criado. Ele já aparece na aba Dados do editor.</h3>
      <dl className="ds-success-meta">
        <div><dt>Dataset</dt><dd>{ds.name}</dd></div>
        <div><dt>Tabelas</dt><dd>{ds.tables.map((t) => t.name).join(', ')}</dd></div>
        <div><dt>Linhas</dt><dd className="bw-num">{nf(rows)}</dd></div>
        <div><dt>Atualização</dt><dd>{schedule}</dd></div>
      </dl>
      <p className="ds-note">Os relatórios que usarem este dataset são listados em Dados › Portabilidade.</p>
    </div>
  );
}
