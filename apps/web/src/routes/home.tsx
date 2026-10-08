import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button, Icon, Menu, PopoverButton, SegmentedControl, type IconName } from '@biweb/ui';
import { useUi } from '../state/ui-store';
import { useGallery, WORKSPACES } from './gallery';
import { REPORTS } from './maps/model';
import { MapCover } from './maps/MapCover';
import { hhmm, LAST_VISIT_MIN, useHomeModel, useLive } from './home-model';
import type { HomeState, LastWork, Running, Stat, WorkKind } from './home-model';
import { PreviewFor, WorkflowGraph } from './home-previews';
import './home.css';

/** Os caminhos vêm de dados (fixtures e modelo da Home); o roteador tipado só aceita literais, então convertemos em um ponto só. */
const P = (path: string) => path as '/';
const KIND: Record<WorkKind, { icon: IconName; label: string }> = {
  map: { icon: 'pin', label: 'Mapa' }, dashboard: { icon: 'report', label: 'Dashboard' }, workflow: { icon: 'share', label: 'Fluxo' }, dataset: { icon: 'data', label: 'Dataset' }, model: { icon: 'model', label: 'Modelo semântico' },
};
const STATES: { id: HomeState; label: string }[] = [{ id: 'new', label: 'Novo' }, { id: 'active', label: 'Ativo' }, { id: 'operational', label: 'Operacional' }];

function useStored<T extends string>(key: string, initial: T): [T, (v: T) => void] {
  const [v, set] = useState<T>(() => { try { return (localStorage.getItem(key) as T) || initial; } catch { return initial; } });
  return [v, (x) => { set(x); try { localStorage.setItem(key, x); } catch { /* armazenamento indisponível */ } }];
}

/** Início: o estado vivo do workspace. Retomar → perceber o que mudou → decidir → continuar ou criar. */
export function HomePage() {
  const ws = useUi((s) => s.workspace);
  const { aiEnabled, askCopilot, favorites, toggleFavorite, set } = useUi();
  const navigate = useNavigate();
  const go = (p: string) => navigate({ to: P(p) });
  const gallery = useGallery();
  const [state, setState] = useStored<HomeState>('biweb.home.state', 'active');
  const [kind, setKind] = useStored<WorkKind>('biweb.home.last', 'map');
  const model = useHomeModel(ws, gallery);
  const live = useLive(ws);
  const work = model.lastWork[kind];
  const empty = state === 'new';
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K na Início leva ao campo do Copilot; a busca global continua no topo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); e.stopImmediatePropagation(); inputRef.current?.focus(); } };
    window.addEventListener('keydown', onKey, true); return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  const syncing = live.running.filter((r) => r.kind === 'sync').length, wfRunning = live.running.filter((r) => r.kind === 'workflow').length;
  const liveMaps = ws === 'rede' ? REPORTS.filter((r) => r.live).length : 0, liveReports = ws === 'rede' ? 2 : 1;
  const d = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="pg pz">
      <header className="pz-head">
        <div className="pz-ctx"><span>{WORKSPACES[ws].company}</span><Icon name="chevronRight" size={12} /><b>{WORKSPACES[ws].label}</b><time>{d.charAt(0).toUpperCase() + d.slice(1)}</time></div>
        <ul className="pz-status" aria-label="Estado da plataforma">
          <li><i className={`pz-dot${syncing && !empty ? ' is-on' : ''}`} />{empty ? 'Nenhuma fonte conectada' : `${syncing} ${syncing === 1 ? 'fonte sincronizando' : 'fontes sincronizando'}`}</li>
          {!empty && <li><i className="pz-dot is-live" />{liveMaps + liveReports} ao vivo</li>}
          {!empty && <li><i className={`pz-dot is-ring${wfRunning ? ' is-on' : ''}`} />{wfRunning} {wfRunning === 1 ? 'fluxo em execução' : 'fluxos em execução'}</li>}
        </ul>
        <Menu title="Criar" trigger={<Button variant="primary" icon="plus">Novo</Button>} items={[
          { id: 'dash', label: 'Novo dashboard', icon: 'report', onAction: () => go('/reports/novo/edit') }, { id: 'map', label: 'Novo mapa', icon: 'pin', onAction: () => go('/maps') },
          { id: 'wf', label: 'Novo fluxo', icon: 'share', onAction: () => go('/workflows') }, 'separator', { id: 'data', label: 'Conectar dados', icon: 'upload', onAction: () => go('/connections') },
        ]} />
        <PopoverButton label="Simular estado da Home" icon="sliders" className="pz-sim" placement="bottom end">
          <div className="bw-popover pz-sim-pop">
            <span className="bw-label">Protótipo · estado do workspace</span>
            <SegmentedControl label="Estado do workspace" value={state} onChange={setState} options={STATES} />
            <SegmentedControl label="Último trabalho" value={kind} onChange={setKind} options={(Object.keys(KIND) as WorkKind[]).map((k) => ({ id: k, label: KIND[k].label }))} />
            <small>A Home reordena prioridades e adapta a retomada ao tipo do último objeto.</small>
          </div>
        </PopoverButton>
      </header>

      {state === 'new' && <NewWorkspace onAsk={(q) => (aiEnabled ? askCopilot(q) : set({ paletteOpen: true }))} />}

      {state === 'active' && <>
        <div className="pz-top">
          <Continue w={work} live={live.refresh} now={live.now} onAsk={() => askCopilot(work.ask)} aiEnabled={aiEnabled} />
          <AttentionList title="Precisa de atenção" rows={model.attention.map((a) => ({ id: a.id, tone: a.tone, title: a.title, detail: a.detail, action: a.action, to: a.to }))} />
        </div>
        <Pulse model={model} gallery={gallery} live={live} empty={false} ws={ws} />
        <div className="pz-mid"><Activity events={live.events} /><RunningNow items={live.running} /></div>
        <Rail ws={ws} gallery={gallery} favorites={favorites} toggle={toggleFavorite} />
      </>}

      {state === 'operational' && <>
        <ResumeBar w={work} />
        <div className="pz-ops">
          <AttentionList title="Incidentes críticos" board rows={model.incidents.map((i) => ({ id: i.id, tone: i.tone === 'bad' ? 'bad' : 'warn', title: i.title, detail: i.detail, when: i.when, to: i.to }))} />
          <RunningNow items={live.running} />
        </div>
        <LiveWall now={live.now} refresh={live.refresh.at} />
        <Pulse model={model} gallery={gallery} live={live} empty={false} ws={ws} />
        <Activity events={live.events} wide />
      </>}

      {state === 'new' && <Pulse model={model} gallery={gallery} live={live} empty ws={ws} />}

      <CommandDock inputRef={inputRef} ctx={work.title} state={state} ws={ws} aiEnabled={aiEnabled} ask={(q) => (aiEnabled ? askCopilot(q) : set({ paletteOpen: true }))} go={go} />
    </div>
  );
}

/* ---------- Retomada ---------- */
const secs = (now: number, at: number) => Math.max(0, Math.round((now - at) / 1000));
const toneCls = (t?: Stat['tone']) => `pz-tone--${t ?? 'info'}`;

function Continue({ w, live, now, onAsk, aiEnabled }: { w: LastWork; live: { at: number; n: number }; now: number; onAsk: () => void; aiEnabled: boolean }) {
  const s = secs(now, live.at);
  return (
    <section className="pz-hero" aria-label="Continue de onde parou">
      <div className={`pz-media pz-media--${w.kind}`}>
        <PreviewFor p={w.preview} />
        {w.live && <i key={live.n} className="pz-sweep" aria-hidden="true" />}
        <div className="pz-media-top">
          {w.live ? <span className="pz-live"><i />Ao vivo<small>{s < 5 ? 'atualizado agora' : `há ${s} s`}</small></span> : <span />}
        </div>
        <ul className="pz-chips">{w.stats.map((x) => <li key={x.label} className={toneCls(x.tone)}><b key={x.value}>{x.value}</b>{x.label}</li>)}</ul>
      </div>
      <div className="pz-hero-body">
        <div className="pz-hero-text">
          <span className="pz-kicker"><Icon name={KIND[w.kind].icon} size={12} />Continue de onde parou<em>{KIND[w.kind].label}</em></span>
          <h1>{w.title}</h1>
          <p>{w.sub} · editado {w.edited}</p>
        </div>
        <div className="pz-hero-actions">
          <Link to={P(w.to)} className="bw-btn bw-btn--primary">Abrir</Link>
          <Link to={P(w.edit)} className="bw-btn">Editar</Link>
          {aiEnabled && <Button variant="ghost" icon="copilot" onPress={onAsk}>Perguntar ao Copilot</Button>}
        </div>
      </div>
    </section>
  );
}

function ResumeBar({ w }: { w: LastWork }) {
  return (
    <Link to={P(w.to)} className="pz-resume">
      <Icon name={KIND[w.kind].icon} size={16} /><span><em>Continue de onde parou</em><b>{w.title}</b><small>{KIND[w.kind].label} · editado {w.edited}</small></span><span className="flex-1" />
      <span className="pz-resume-go">Abrir <Icon name="arrowRight" size={12} /></span>
    </Link>
  );
}

/* ---------- Atenção ---------- */
interface Row { id: string; tone: 'warn' | 'bad'; title: string; detail: string; action?: string; when?: string; to: string }
function AttentionList({ title, rows, board }: { title: string; rows: Row[]; board?: boolean }) {
  if (!rows.length) return null; // só aparece quando existe algo que exige decisão
  return (
    <section className={`pz-attn${board ? ' pz-attn--board' : ''}`} aria-labelledby={`h-${title}`}>
      <div className="pz-sec"><h2 id={`h-${title}`}>{title}<b>{rows.length}</b></h2></div>
      <ul>
        {rows.map((r, i) => (
          <li key={r.id} className={`pz-attn-row pz-attn-row--${r.tone}`} style={{ ['--i' as string]: i }}>
            <Icon name="warning" size={12} />
            <div><b>{r.title}</b><small>{r.detail}</small></div>
            {r.when && <time>{r.when}</time>}
            <Link to={P(r.to)} className="pz-attn-act">{r.action ?? 'Abrir'}<Icon name="arrowRight" size={12} /></Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Pulso ---------- */
function Pulse({ model, gallery, live, empty, ws }: { model: ReturnType<typeof useHomeModel>; gallery: { id: string }[]; live: ReturnType<typeof useLive>; empty: boolean; ws: 'rede' | 'comercial' }) {
  const syncing = live.running.filter((r) => r.kind === 'sync').length, wf = live.running.filter((r) => r.kind === 'workflow').length;
  const maps = REPORTS.length + 2, liveMaps = REPORTS.filter((r) => r.live).length;
  const cells = [
    { k: 'Dados', to: '/connections', n: empty ? 0 : model.sources, unit: 'fontes', lines: [{ t: `${syncing} sincronizando`, on: syncing > 0 && !empty, tone: 'info' }, { t: `${model.stale} ${ws === 'rede' ? 'desatualizada' : 'com falha'}`, on: model.stale > 0 && !empty, tone: 'bad' }] },
    { k: 'Modelos', to: ws === 'rede' ? '/connections' : '/models/sem_vendas_varejo', n: empty ? 0 : 1, unit: 'modelo', lines: [{ t: ws === 'rede' ? '1 certificado' : '1 com alterações', on: !empty, tone: ws === 'rede' ? 'ok' : 'warn' }] },
    { k: 'Dashboards', to: '/reports', n: empty ? 0 : gallery.length, unit: 'relatórios', lines: [{ t: `${ws === 'rede' ? 2 : 1} ao vivo`, on: !empty, tone: 'live' }, { t: 'atualizados hoje', on: false, tone: 'ok' }] },
    { k: 'Mapas', to: '/maps', n: empty ? 0 : maps, unit: 'mapas', lines: [{ t: `${liveMaps} ao vivo`, on: !empty, tone: 'live' }] },
    { k: 'Fluxos', to: '/workflows', n: empty ? 0 : 2, unit: 'fluxos', lines: [{ t: `${wf} em execução`, on: wf > 0 && !empty, tone: 'info', ring: true }, { t: '1 com falha', on: !empty, tone: 'bad' }] },
  ];
  return (
    <section className={`pz-pulse${empty ? ' is-empty' : ''}`} aria-label="Estado do workspace">
      {cells.map((c) => (
        <Link key={c.k} to={P(c.to)} className="pz-cell">
          <span className="pz-cell-k">{c.k}</span>
          <span className="pz-cell-n"><b key={c.n}>{c.n}</b><small>{c.unit}</small></span>
          {(empty ? [{ t: 'ainda vazio', on: false, tone: 'info' }] : c.lines).map((l) => <span key={l.t} className={`pz-cell-l pz-tone--${l.tone}`}><i className={`pz-dot${l.on ? ' is-on' : ''}${l.tone === 'live' ? ' is-live' : ''}${'ring' in l && l.ring ? ' is-ring' : ''}${l.tone === 'bad' ? ' is-bad' : ''}`} />{l.t}</span>)}
        </Link>
      ))}
    </section>
  );
}

/* ---------- Atividade e execução ---------- */
function Activity({ events, wide }: { events: ReturnType<typeof useLive>['events']; wide?: boolean }) {
  const visit = useMemo(() => Date.now() - LAST_VISIT_MIN * 60_000, []);
  const since = events.filter((e) => e.at > visit).length;
  let divided = false;
  return (
    <section className={`pz-activity${wide ? ' pz-activity--wide' : ''}`} aria-labelledby="pz-act">
      <div className="pz-sec"><h2 id="pz-act">Atividade ao vivo</h2><span>{since} {since === 1 ? 'mudança' : 'mudanças'} desde sua última visita</span></div>
      <ol>
        {events.map((e) => {
          const mark = !divided && e.at <= visit; if (mark) divided = true;
          return (
            <li key={e.id} className={e.fresh ? 'is-fresh' : undefined}>
              {mark && <div className="pz-visit" role="separator"><span>Sua última visita · {hhmm(visit)}</span></div>}
              <time>{hhmm(e.at)}</time>
              <span className={`pz-ev pz-ev--${e.tone}`}><Icon name={e.icon} size={12} /></span>
              <p>{e.text}{e.target && <> {e.to ? <Link to={P(e.to)}>{e.target}</Link> : <b>{e.target}</b>}</>}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function RunningNow({ items }: { items: Running[] }) {
  return (
    <section className="pz-running" aria-labelledby="pz-run">
      <div className="pz-sec"><h2 id="pz-run">Em execução</h2><span>{items.length} {items.length === 1 ? 'processo' : 'processos'}</span></div>
      {items.length === 0 ? <p className="pz-quiet">Nada em execução agora.</p> : (
        <ul>
          {items.map((r) => (
            <li key={r.id}>
              <Link to={P(r.to)}>
                <Icon name={r.kind === 'workflow' ? 'share' : r.kind === 'sync' ? 'refresh' : 'bolt'} size={12} />
                <span><b>{r.label}</b><small>{r.detail}</small></span>
                {r.progress === null ? <em className="pz-stream"><i />tempo real</em> : <em>{Math.round(r.progress)}%</em>}
              </Link>
              {r.progress !== null && <div className="pz-bar" role="progressbar" aria-label={r.label} aria-valuenow={Math.round(r.progress)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${r.progress}%` }} /></div>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------- Recentes e fixados ---------- */
function Rail({ ws, gallery, favorites, toggle }: { ws: 'rede' | 'comercial'; gallery: ReturnType<typeof useGallery>; favorites: string[]; toggle: (id: string) => void }) {
  const [tab, setTab] = useState<'recent' | 'pinned'>('recent');
  const items = useMemo(() => {
    const sorted = [...gallery].sort((a, b) => a.updatedOrder - b.updatedOrder);
    const rep = sorted.slice(0, 4).map((r) => ({ id: r.id, name: r.name, meta: `${r.type} · ${r.updated}`, to: `/reports/${r.id}`, live: ws === 'rede' && r.id === 'net_operacoes', thumb: <img src={r.cover(true)} alt="" loading="lazy" /> }));
    const map = (id: 'incidents' | 'field') => { const m = REPORTS.find((x) => x.id === id)!; return { id: `map:${id}`, name: m.name, meta: 'Mapa · ao vivo', to: `/maps/${id}`, live: true, thumb: <MapCover kind={id} /> }; };
    const wf = { id: 'wf:quality', name: ws === 'rede' ? 'Pipeline de dados' : 'Carga diária de vendas', meta: 'Fluxo · 1 falha', to: '/workflows', live: false, thumb: <div className="pz-thumb-wf"><WorkflowGraph mini steps={[{ title: 'a', group: 0, state: 'done' }, { title: 'b', group: 0, state: 'done' }, { title: 'c', group: 1, state: 'done' }, { title: 'd', group: 1, state: 'failed' }, { title: 'e', group: 1, state: 'waiting' }, { title: 'f', group: 2, state: 'waiting' }, { title: 'g', group: 2, state: 'waiting' }]} /></div> };
    return [rep[0], map('incidents'), rep[1], wf, rep[2], map('field'), rep[3]].filter((x): x is NonNullable<typeof x> => !!x);
  }, [gallery, ws]);
  const shown = tab === 'recent' ? items.slice(0, 6) : items.filter((i) => favorites.includes(i.id));
  return (
    <section className="pz-rail" aria-labelledby="pz-rec">
      <div className="pz-sec"><h2 id="pz-rec">Retome</h2>
        <div className="pz-tabs" role="tablist" aria-label="Recentes e fixados">
          {([['recent', 'Recentes'], ['pinned', 'Fixados']] as const).map(([id, l]) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{id === 'pinned' && <Icon name="star" size={12} />}{l}</button>)}
        </div>
      </div>
      {shown.length === 0 ? <p className="pz-quiet">Fixe objetos com a estrela para tê-los aqui.</p> : (
        <ul className="pz-rail-list">
          {shown.map((i, n) => (
            <li key={i.id} className="pz-item" style={{ ['--i' as string]: n }}>
              <Link to={P(i.to)} className="pz-item-link">
                <span className="pz-thumb">{i.thumb}{i.live && <span className="pz-live pz-live--sm"><i />Ao vivo</span>}</span>
                <b>{i.name}</b><small>{i.meta}</small>
              </Link>
              <button type="button" className="pz-pin" aria-pressed={favorites.includes(i.id)} aria-label={`${favorites.includes(i.id) ? 'Desafixar' : 'Fixar'} ${i.name}`} onClick={() => toggle(i.id)}><Icon name="star" size={12} /></button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------- Operacional: parede de mapas ao vivo ---------- */
function LiveWall({ now, refresh }: { now: number; refresh: number }) {
  const s = secs(now, refresh);
  const wall = (['network', 'field', 'incidents'] as const).map((id) => REPORTS.find((r) => r.id === id)!);
  return (
    <section className="pz-wall" aria-labelledby="pz-wall">
      <div className="pz-sec"><h2 id="pz-wall">Ao vivo</h2><span>atualizado {s < 5 ? 'agora' : `há ${s} s`}</span></div>
      <ul>
        {wall.map((m) => (
          <li key={m.id}><Link to={P(`/maps/${m.id}`)} className="bw-lift">
            <span className="pz-thumb pz-thumb--lg"><MapCover kind={m.id} /><span className="pz-live pz-live--sm"><i />Ao vivo</span></span>
            <b>{m.short}</b><small>{m.technique}</small>
          </Link></li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Novo workspace ---------- */
function NewWorkspace({ onAsk }: { onAsk: (q: string) => void }) {
  const steps: { n: number; title: string; text: string; icon: IconName; to?: string; ask?: string; cta: string; locked?: boolean }[] = [
    { n: 1, title: 'Conecte ou importe dados', text: 'PostgreSQL, API, CSV, XLSX, KMZ, SHP ou GeoJSON. O BIWEB reconhece tipos, chaves e geometrias.', icon: 'upload', to: '/connections', cta: 'Conectar dados' },
    { n: 2, title: 'Dê significado com um modelo semântico', text: 'Relacione tabelas e certifique métricas para que todo relatório use a mesma definição.', icon: 'model', cta: 'Depois de conectar', locked: true },
    { n: 3, title: 'Crie o primeiro dashboard', text: 'O Copilot propõe uma estrutura a partir dos seus dados; você revisa e aprova.', icon: 'report', ask: 'Crie um dashboard a partir dos meus dados', cta: 'Criar com o Copilot', locked: true },
  ];
  return (
    <section className="pz-new" aria-label="Primeiros passos">
      <div className="pz-new-head"><span className="pz-kicker"><Icon name="bolt" size={12} />Primeiros passos</span><h1>Seu workspace ainda está vazio</h1><p>Três passos até o primeiro dashboard. O pulso e a atividade aparecem aqui assim que houver dados.</p></div>
      <ol className="pz-steps">
        {steps.map((s) => (
          <li key={s.n} className={s.locked ? 'is-locked' : 'is-next'}>
            <span className="pz-step-n">{s.n}</span>
            <div><b>{s.title}</b><p>{s.text}</p></div>
            {s.to ? <Link to={P(s.to)} className="bw-btn bw-btn--primary"><Icon name={s.icon} size={12} />{s.cta}</Link>
              : <Button isDisabled={!s.ask} icon={s.icon} onPress={() => s.ask && onAsk(s.ask)}>{s.cta}</Button>}
          </li>
        ))}
      </ol>
      <ul className="pz-formats" aria-label="Formatos aceitos">{['CSV', 'XLSX', 'JSON', 'KMZ', 'SHP', 'GeoJSON', 'API', 'PostgreSQL'].map((f) => <li key={f}>{f}</li>)}</ul>
    </section>
  );
}

/* ---------- Command surface ---------- */
function CommandDock({ inputRef, ctx, state, ws, aiEnabled, ask, go }: { inputRef: React.RefObject<HTMLInputElement | null>; ctx: string; state: HomeState; ws: 'rede' | 'comercial'; aiEnabled: boolean; ask: (q: string) => void; go: (p: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const rede = ws === 'rede';
  const cmds: { icon: IconName; text: string; run: () => void }[] = state === 'new'
    ? [{ icon: 'upload', text: 'Conecte uma nova fonte', run: () => go('/connections') }, { icon: 'report', text: 'Crie um dashboard de exemplo', run: () => ask('Crie um dashboard de exemplo') }, { icon: 'copilot', text: 'O que posso fazer com um arquivo KMZ?', run: () => ask('O que posso fazer com um arquivo KMZ?') }]
    : [
      { icon: 'report', text: rede ? 'Crie um dashboard de disponibilidade' : 'Crie um dashboard de vendas', run: () => ask(rede ? 'Crie um dashboard de disponibilidade' : 'Crie um dashboard de vendas') },
      { icon: 'clock', text: 'Mostre o que mudou hoje', run: () => ask('Mostre o que mudou hoje') },
      { icon: 'warning', text: rede ? 'Abra os incidentes críticos' : 'Abra a análise da queda de setembro', run: () => go(rede ? '/reports/net_incidentes' : '/reports/rpt_analise_queda') },
      { icon: 'share', text: 'Continue meu último workflow', run: () => go('/workflows') },
      { icon: 'upload', text: 'Conecte uma nova fonte', run: () => go('/connections') },
    ];
  const create: { icon: IconName; label: string; run: () => void }[] = [
    { icon: 'report', label: 'Dashboard', run: () => go('/reports/novo/edit') }, { icon: 'pin', label: 'Mapa', run: () => go('/maps') }, { icon: 'share', label: 'Fluxo', run: () => go('/workflows') }, { icon: 'upload', label: 'Conectar dados', run: () => go('/connections') },
  ];
  const submit = () => { const t = q.trim(); if (!t) return; ask(t); setQ(''); inputRef.current?.blur(); setOpen(false); };
  return (
    <div className="pz-dock" ref={box} onFocus={() => setOpen(true)} onBlur={(e) => { if (!box.current?.contains(e.relatedTarget as Node)) setOpen(false); }}
      onKeyDown={(e) => { if (e.key === 'Escape') { inputRef.current?.blur(); setOpen(false); } }}>
      {open && (
        <div className="pz-dock-pop bw-fade-in" role="group" aria-label="Sugestões">
          <span className="pz-dock-label">{state === 'new' ? 'Para começar' : 'Comandos'}</span>
          <ul>{cmds.map((c) => <li key={c.text}><button type="button" onClick={() => { c.run(); setOpen(false); inputRef.current?.blur(); }}><Icon name={c.icon} size={12} />{c.text}<Icon name="arrowRight" size={12} /></button></li>)}</ul>
          <span className="pz-dock-label">Criar</span>
          <div className="pz-create">{create.map((c) => <button key={c.label} type="button" onClick={() => { c.run(); setOpen(false); }}><Icon name={c.icon} size={12} />{c.label}</button>)}</div>
        </div>
      )}
      <div className="pz-dock-bar">
        <Icon name="copilot" size={16} />
        <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
          placeholder={aiEnabled ? 'Pergunte, analise ou crie algo…' : 'Buscar relatórios, métricas e ações…'} aria-label="Comando do Copilot" />
        {state !== 'new' && <span className="pz-dock-ctx" title="O Copilot usa este objeto como contexto"><Icon name="target" size={12} />{ctx}</span>}
        <kbd>⌘K</kbd>
      </div>
    </div>
  );
}
