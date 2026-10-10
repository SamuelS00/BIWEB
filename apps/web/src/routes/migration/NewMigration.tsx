import { useEffect, useMemo, useState } from 'react';
import { Banner, Button, Checkbox, Icon, SegmentedControl, TextField } from '@biweb/ui';
import { REPORTS, VISUALS } from './data';
import { PLATFORMS, STRATEGIES, platformOf } from './model';
import type { PlatformId, Project, Strategy } from './model';
import { useMig } from './store';
import { PlatformMark } from './ui';

const STEPS = ['Escolher origem', 'Conectar', 'Definir escopo', 'Estratégia', 'Analisar'];
type ScopeKind = 'all' | 'reports' | 'pages' | 'datasets' | 'models';

/** Números do escopo a partir dos itens marcados (Power BI usa o inventário real do demo). */
function scopeOf(platform: PlatformId, picked: string[], extras: { models: boolean; schedules: boolean }): Project['scope'] {
  const pl = platformOf(platform);
  if (platform === 'powerbi') {
    const reps = REPORTS.filter((r) => picked.includes(r.name)), pages = reps.reduce((a, r) => a + r.pages.length, 0), vis = VISUALS.filter((v) => reps.some((r) => v.page.startsWith(`pg:${r.id}:`))).length;
    return { reports: reps.length, pages, visuals: vis, measures: Math.round(37 * (vis / 284)), datasets: extras.models ? Math.max(1, Math.round(9 * (reps.length / 12))) : 0, maps: reps.some((r) => r.id === 'netmap') ? 3 : reps.length > 8 ? 2 : 0, processes: extras.schedules ? Math.round(2 * (reps.length / 12)) : 0 };
  }
  const n = picked.length; void pl;
  return { reports: n, pages: Math.round(n * 2.6), visuals: n * 12, measures: Math.round(n * 2.6), datasets: extras.models ? Math.max(1, Math.round(n / 1.4)) : 0, maps: n > 5 ? 1 : 0, processes: extras.schedules ? Math.round(n / 4) : 0 };
}

export function NewMigration({ onCancel, onCreated }: { onCancel: () => void; onCreated: (id: string) => void }) {
  const create = useMig((s) => s.create);
  const [step, setStep] = useState(0);
  const [platform, setPlatform] = useState<PlatformId>('powerbi');
  const pl = platformOf(platform);
  const [conn, setConn] = useState<'idle' | 'connecting' | 'connected'>('idle'), [phase, setPhase] = useState(0);
  const [ws, setWs] = useState(pl.workspaces[0]!);
  const [kind, setKind] = useState<ScopeKind>('all');
  const [picked, setPicked] = useState<string[]>(pl.items);
  const [extras, setExtras] = useState({ models: true, schedules: true, themes: true, security: true });
  const [strategy, setStrategy] = useState<Strategy>('native');
  const [name, setName] = useState('');

  useEffect(() => { setConn('idle'); setWs(pl.workspaces[0]!); setPicked(pl.items); setKind('all'); }, [platform]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (conn !== 'connecting') return;
    const t = setInterval(() => setPhase((p) => { if (p >= 3) { clearInterval(t); setConn('connected'); return 0; } return p + 1; }), 650);
    return () => clearInterval(t);
  }, [conn]);

  const scope = useMemo(() => scopeOf(platform, kind === 'all' ? pl.items : picked, extras), [platform, picked, kind, extras, pl.items]);
  const total = scopeOf(platform, pl.items, { models: true, schedules: true });
  const itemsSel = scope.reports + scope.pages + scope.datasets + scope.measures;
  const itemsAll = total.reports + total.pages + total.datasets + total.measures;
  const projName = name.trim() || `${ws.split(' (')[0]} Migration`;
  const canNext = step === 0 ? true : step === 1 ? conn === 'connected' : step === 2 ? scope.reports > 0 : true;
  const toggle = (n: string) => setPicked((p) => p.includes(n) ? p.filter((x) => x !== n) : [...p, n]);

  return <main className="pg ms-wiz">
    <header className="ms-wiz-head">
      <div><div className="mg-eyebrow"><Icon name="share" size={12} /> Nova migração</div><h1 className="pg-title">Conectar e reconstruir uma aplicação analítica</h1></div>
      <Button variant="ghost" icon="close" onPress={onCancel}>Cancelar</Button>
    </header>
    <div className="ms-wiz-body">
      <ol className="ms-steps" aria-label="Etapas">{STEPS.map((s, i) => <li key={s} className={i === step ? 'is-now' : i < step ? 'is-done' : ''}><button type="button" disabled={i > step} onClick={() => setStep(i)}><b>{i < step ? <Icon name="check" size={12} /> : i + 1}</b><span>{s}</span></button></li>)}</ol>
      <section className="ms-wiz-pane" key={step}>
        {step === 0 && <>
          <h2>De onde vem a aplicação?</h2><p className="ms-lead">Escolha a plataforma. O BIWEB lê estrutura, modelo, métricas e interações, não só a aparência.</p>
          <div className="ms-plat-grid" role="radiogroup" aria-label="Plataforma de origem">{PLATFORMS.map((p) => <button key={p.id} type="button" role="radio" aria-checked={platform === p.id} className={platform === p.id ? 'is-on' : ''} onClick={() => setPlatform(p.id)}>
            <PlatformMark id={p.id} size={36} /><b>{p.name}</b><small>{p.blurb}</small><span className="ms-plat-dialect">{p.dialect}</span></button>)}</div>
        </>}
        {step === 1 && <>
          <h2>Conectar ao {pl.name}</h2><p className="ms-lead">Acesso somente leitura. O BIWEB nunca altera a plataforma de origem.</p>
          {conn === 'idle' && <div className="ms-connect"><PlatformMark id={platform} size={44} /><div><b>{pl.signIn}</b><small>Você escolhe quais {pl.nouns.reports} entram na migração na próxima etapa.</small></div><Button variant="primary" icon="key" onPress={() => setConn('connecting')}>{pl.signIn}</Button></div>}
          {conn === 'connecting' && <ul className="ms-connecting" aria-live="polite">{['Abrindo autorização', `Validando permissões de leitura`, `Descobrindo ${pl.wsLabel.toLowerCase()}s`, 'Contando objetos'].map((t, i) => <li key={t} className={i < phase ? 'is-done' : i === phase ? 'is-now' : ''}><span>{i < phase ? <Icon name="check" size={12} /> : i === phase ? <i className="ms-spin" /> : <i className="ms-hollow" />}</span>{t}</li>)}</ul>}
          {conn === 'connected' && <div className="ms-found">
            <Banner tone="success">Conectado como Samuel Souto · permissão de leitura · nenhuma credencial é armazenada neste protótipo.</Banner>
            <div className="ms-found-grid">
              <div><span className="bw-label">{pl.orgLabel}</span><div className="ms-org"><PlatformMark id={platform} size={24} /><b>{pl.org}</b></div></div>
              <div><span className="bw-label">{pl.wsLabel}</span><div className="ms-radio-list" role="radiogroup" aria-label={pl.wsLabel}>{pl.workspaces.map((w, i) => <button key={w} type="button" role="radio" aria-checked={ws === w} className={ws === w ? 'is-on' : ''} onClick={() => setWs(w)}><b>{w}</b><small>{i === 0 ? `${pl.items.length} ${pl.nouns.reports}` : `${Math.max(2, pl.items.length - 3 - i * 2)} ${pl.nouns.reports}`}</small></button>)}</div></div>
              <div><span className="bw-label">{pl.nouns.reports[0]!.toUpperCase() + pl.nouns.reports.slice(1)} encontrados</span><ul className="ms-found-list">{pl.items.map((n, i) => <li key={n} style={{ animationDelay: `${i * 45}ms` }}><Icon name="report" size={12} />{n}</li>)}</ul></div>
            </div>
          </div>}
        </>}
        {step === 2 && <>
          <h2>O que migrar?</h2><p className="ms-lead">Não é preciso migrar tudo. Escolha o workspace inteiro ou só as partes que importam agora.</p>
          <SegmentedControl label="Escopo" value={kind} onChange={(k) => { setKind(k); if (k === 'all') setPicked(pl.items); }} options={[{ id: 'all', label: `${pl.wsLabel} inteiro` }, { id: 'reports', label: pl.nouns.reports[0]!.toUpperCase() + pl.nouns.reports.slice(1) }, { id: 'pages', label: 'Páginas' }, { id: 'datasets', label: 'Datasets' }, { id: 'models', label: 'Modelos semânticos' }]} />
          <div className="ms-scope">
            <div className="ms-scope-list" role="group" aria-label="Itens do escopo">
              {kind === 'all' ? <p className="ms-lead is-tight">Todo o conteúdo de <b>{ws}</b> entra na análise. Você ainda poderá excluir itens no Inventário.</p> : <>
                <div className="ms-scope-tools"><Button size="sm" onPress={() => setPicked(pl.items)}>Marcar todos</Button><Button size="sm" variant="ghost" onPress={() => setPicked([])}>Limpar</Button></div>
                {pl.items.map((n) => <Checkbox key={n} isSelected={picked.includes(n)} onChange={() => toggle(n)}>{n}</Checkbox>)}</>}
              <div className="ms-scope-extras"><span className="bw-label">Também incluir</span>
                <Checkbox isSelected={extras.models} onChange={(v) => setExtras({ ...extras, models: v })}>Modelos semânticos e datasets</Checkbox>
                <Checkbox isSelected={extras.schedules} onChange={(v) => setExtras({ ...extras, schedules: v })}>Agendas, alertas e assinaturas</Checkbox>
                <Checkbox isSelected={extras.themes} onChange={(v) => setExtras({ ...extras, themes: v })}>Temas e identidade visual</Checkbox>
                <Checkbox isSelected={extras.security} onChange={(v) => setExtras({ ...extras, security: v })}>Regras de segurança (revisão obrigatória)</Checkbox></div>
            </div>
            <aside className="ms-scope-sum" aria-live="polite"><span className="bw-label">Selecionado</span><b className="ms-big">{itemsSel}<small> de {itemsAll} itens</small></b>
              <dl><div><dt>{pl.nouns.reports[0]!.toUpperCase() + pl.nouns.reports.slice(1)}</dt><dd>{scope.reports}</dd></div><div><dt>Páginas</dt><dd>{scope.pages}</dd></div><div><dt>Visuais</dt><dd>{scope.visuals}</dd></div><div><dt>Medidas</dt><dd>{scope.measures}</dd></div><div><dt>Datasets</dt><dd>{scope.datasets}</dd></div><div><dt>Mapas e processos</dt><dd>{scope.maps + scope.processes}</dd></div></dl>
              <div className="ms-prog"><i style={{ width: `${Math.round(itemsSel / Math.max(1, itemsAll) * 100)}%` }} /></div></aside>
          </div>
        </>}
        {step === 3 && <>
          <h2>Qual estratégia de migração?</h2><p className="ms-lead">Esta é a decisão mais importante. Define o quanto o resultado se parece com o original e o quanto aproveita o BIWEB. Depois você pode ajustar por relatório, página ou visual.</p>
          <div className="ms-strategies" role="radiogroup" aria-label="Estratégia">{STRATEGIES.map((s) => <button key={s.id} type="button" role="radio" aria-checked={strategy === s.id} className={`is-${s.id}${strategy === s.id ? ' is-on' : ''}`} onClick={() => setStrategy(s.id)}>
            <header><span className="ms-strat-mark"><i /><i /><i /></span><b>{s.label}</b>{s.id === 'native' && <em>Recomendada</em>}</header><strong>{s.desc}</strong><p>{s.detail}</p>
            <ul>{s.id === 'fidelity' ? ['Layout e ordem preservados', 'Cores do original como tema', 'Pode manter componentes menos idiomáticos'] : s.id === 'native' ? ['Tema, filtros e interações do BIWEB', 'Layout adaptado à grade', 'Intenção analítica preservada'] : ['Tudo de Native', 'Sugestões do Copilot com prévia', 'Mapas, fluxos e métricas consolidados']}</ul></button>)}</div>
        </>}
        {step === 4 && <>
          <h2>Pronto para analisar</h2><p className="ms-lead">O BIWEB vai inventariar, ler modelos, interpretar cálculos e montar o Analytics Blueprint. Nada é alterado na origem nem publicado.</p>
          <div className="ms-review">
            <dl><div><dt>Origem</dt><dd><PlatformMark id={platform} size={20} />{pl.name} · {ws}</dd></div><div><dt>Escopo</dt><dd>{scope.reports} {pl.nouns.reports} · {scope.pages} páginas · {scope.visuals} visuais · {scope.measures} medidas</dd></div><div><dt>Estratégia</dt><dd><b>{STRATEGIES.find((s) => s.id === strategy)?.label}</b> · {STRATEGIES.find((s) => s.id === strategy)?.desc}</dd></div><div><dt>Destino</dt><dd>BIWEB · Report Builder, Map Builder, Workflow Builder, Data Workspace</dd></div></dl>
            <TextField label="Nome do projeto" value={name} onChange={setName} placeholder={projName} />
          </div>
        </>}
      </section>
    </div>
    <footer className="ms-wiz-foot">
      <Button variant="ghost" isDisabled={step === 0} onPress={() => setStep(step - 1)} icon="arrowLeft">Voltar</Button>
      <span className="flex-1" />
      {step === 1 && conn === 'idle' && <small className="wf-muted">Conecte para continuar</small>}
      {step < 4 ? <Button variant="primary" isDisabled={!canNext} onPress={() => setStep(step + 1)}>Continuar</Button>
        : <Button variant="primary" icon="play" onPress={() => onCreated(create({ name: projName, platform, workspace: ws, strategy, scope, objects: scope.reports }))}>Iniciar análise</Button>}
    </footer>
  </main>;
}
