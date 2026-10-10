import { useEffect, useState } from 'react';
import { Badge, Button, Dialog, Icon } from '@biweb/ui';
import { useDw } from './store';
import { MAPPINGS, PIPELINES, RULES, type MapRow, type MapSet } from './ops';
import { nf } from './sample';
import { ConfBadge, Empty, Section, StepList, Tabs2, ViewHead, useGo, useSteps } from './ui';

export function TransformView({ id }: { id?: string }) {
  const rule = id === 'rules';
  const pl = PIPELINES.find((p) => p.id === id);
  const map = MAPPINGS.find((m) => m.id === id) ?? (!pl && !rule ? MAPPINGS[0] : undefined);
  return rule ? <RulesView /> : pl ? <PipelineView p={pl} /> : map ? <MappingView m={map} /> : <div className="dw-view"><Empty title="Transformação não encontrada" text="" /></div>;
}

function MappingView({ m }: { m: MapSet }) {
  const st = useDw(), go = useGo();
  const [dry, setDry] = useState<{ row?: MapRow } | null>(null);
  const [tab, setTab] = useState<'mapping' | 'rules'>('mapping');
  useEffect(() => { const f = (e: Event) => { const rid = (e as CustomEvent<string>).detail; setDry({ row: m.rows.find((r) => r.id === rid) }); }; addEventListener('biweb:dw-dryrun', f); return () => removeEventListener('biweb:dw-dryrun', f); }, [m]);
  const sel = st.sel?.kind === 'mapping' ? st.sel.id : null;
  const fails = m.rows.reduce((s, r) => s + r.fail, 0);
  return (
    <div className="dw-view">
      <ViewHead title={m.name} sub={`${m.from} → ${m.to} · versão ${st.mapApplied[m.id] ? 'v15 (rascunho)' : m.version}`} actions={<>
        <Button size="sm" icon="copilot" isDisabled={st.ai.mode === 'off'} onPress={() => { st.setPane({ rightOpen: true, rTab: 'copilot' }); import('./copilot').then((c) => st.pushChat([{ id: `u${Date.now()}`, role: 'user', text: 'Normalize este dataset' }, c.reply('normalize', { section: 'transformations' })])); }}>Normalizar com o Copilot</Button>
        <Button size="sm" variant="primary" icon="play" onPress={() => setDry({})}>Executar dry run</Button></>} />
      <Tabs2 label="Visões da transformação" value={tab} onChange={setTab} tabs={[{ id: 'mapping', label: 'Mapeamento' }, { id: 'rules', label: 'Regras usadas' }]} />
      {tab === 'mapping' ? (
        <div className="dw-map" role="table" aria-label="Mapeamento origem para destino">
          <div className="dw-map-h" role="row"><span>ORIGEM · {m.from}</span><span /><span>DESTINO · {m.to}</span></div>
          {m.rows.map((r) => (
            <button key={r.id} type="button" role="row" className={`dw-map-r${sel === r.id ? ' is-on' : ''}`} onClick={() => st.select({ kind: 'mapping', id: r.id })}>
              <span className="dw-map-c bw-mono">{r.src}</span>
              <span className="dw-map-l"><i /><em>{r.tr}{r.fail > 0 && <b className="dw-warn"> · {nf(r.fail)} falhas</b>}</em><Icon name="arrowRight" size={12} /></span>
              <span className="dw-map-c bw-mono">{r.tgt}<ConfBadge v={r.conf} /></span>
            </button>
          ))}
        </div>
      ) : <ul className="dw-bul dw-pad">{RULES.slice(0, 4).map((r) => <li key={r.id}><b className="bw-mono">{r.name}</b><span>{r.desc}</span></li>)}</ul>}
      <p className="dw-foot"><Icon name="info" size={12} />{nf(fails)} falhas somadas na última execução. Selecione uma linha para editar, visualizar ou testar. <button type="button" className="bw-link" onClick={() => go('/data/quality/orders')}>Abrir quarentena</button></p>
      {dry && <DryRun m={m} row={dry.row} onClose={() => setDry(null)} />}
    </div>
  );
}

function DryRun({ m, row, onClose }: { m: MapSet; row?: MapRow; onClose: () => void }) {
  const st = useDw();
  const rows = row ? [row] : m.rows;
  const steps = ['Lendo amostra de 10.000 linhas', 'Aplicando transformações', 'Validando tipos e chaves', 'Comparando com a versão atual'];
  const at = useSteps(steps.length, 450, true);
  const failed = rows.reduce((s, r) => s + r.fail, 0) || 16;
  const [open, setOpen] = useState(false);
  const done = at >= steps.length;
  return (
    <Dialog title={`Testar transformação${row ? ` · ${row.src} → ${row.tgt}` : ''}`} isOpen onOpenChange={(o) => { if (!o) onClose(); }} footer={<><Button size="sm" onPress={onClose}>Fechar</Button><Button size="sm" variant="primary" isDisabled={!done} onPress={() => { rows.forEach((r) => st.setMapApplied(r.id)); st.setMapApplied(m.id); st.toast('Nova versão salva como rascunho (v15)'); onClose(); }}>Salvar versão</Button></>}>
      <div className="dw-dry">
        {!done ? <StepList steps={steps} at={at} /> : (
          <>
            <div className="dw-cards dw-cards--sm"><div className="dw-card"><span className="dw-k">Amostra</span><b className="bw-num">10.000 linhas</b></div><div className="dw-card"><span className="dw-k">Com sucesso</span><b className="bw-num is-ok">{nf(10000 - failed)}</b></div><div className="dw-card"><span className="dw-k">Com falha</span><b className="bw-num is-bad">{nf(failed)}</b></div></div>
            <Section title="Antes → Depois">{rows.slice(0, 4).map((r) => <div key={r.id} className="dw-ba"><span className="dw-k">{r.src}</span><span className="bw-mono">{r.sample[0]}</span><Icon name="arrowRight" size={12} /><span className="bw-mono">{r.sample[1]}</span></div>)}</Section>
            <Section title="Falhas" actions={<Button size="sm" variant="ghost" onPress={() => setOpen(!open)}>{open ? 'Ocultar' : `Abrir ${Math.min(failed, 5)} exemplos`}</Button>}>
              {open ? <ul className="dw-bul">{['"31/02/26" → data impossível', '"10/13/26" → mês inválido', '"" → obrigatório vazio', '"00/00/00" → data nula', '"2026-1-1x" → formato desconhecido'].map((f) => <li key={f}><span className="bw-mono">{f}</span></li>)}</ul> : <p className="dw-muted">{failed} linhas não passaram. Elas seriam enviadas à quarentena.</p>}</Section>
          </>
        )}
      </div>
    </Dialog>
  );
}

function PipelineView({ p }: { p: (typeof PIPELINES)[number] }) {
  const st = useDw(), go = useGo();
  const max = p.steps[0]!.rows;
  return (
    <div className="dw-view">
      <ViewHead title={p.name} sub="Linhagem de transformação do dado, da origem ao dataset curado" actions={<Button size="sm" onPress={() => go('/data/lineage')}>Ver linhagem completa</Button>} />
      <ol className="dw-flow">
        {p.steps.map((s, i) => (
          <li key={s.id} className={`is-${s.kind === 'Quality gate' ? 'gate' : s.kind === 'Dataset' ? 'ds' : s.kind === 'Fonte' ? 'src' : 'tr'}`}>
            <div className="dw-flow-b"><span><b>{s.label}</b><small>{s.kind}{st.technical && s.zone ? ` · zona ${s.zone}` : ''}</small></span><span className="dw-flow-n"><b className="bw-num">{nf(s.rows)}</b><i style={{ width: `${(s.rows / max) * 100}%` }} /></span>{i > 0 && s.rows < p.steps[i - 1]!.rows && <Badge tone="warning">−{nf(p.steps[i - 1]!.rows - s.rows)}</Badge>}</div>
            {i < p.steps.length - 1 && <Icon name="chevronDown" size={16} />}
          </li>
        ))}
      </ol>
      <p className="dw-foot"><Icon name="info" size={12} />Este fluxo descreve como o dado é transformado. Para automações com gatilhos, aprovações e integrações, use o Workflow Builder.</p>
    </div>
  );
}

function RulesView() {
  return (
    <div className="dw-view"><ViewHead title="Regras reutilizáveis" sub={`${RULES.length} regras · usadas em mapeamentos e quality gates`} />
      <div className="dw-table" role="table" aria-label="Regras"><div className="dw-tr dw-tr--head dw-rules-grid" role="row"><span>Regra</span><span>Descrição</span><span className="r">Usos</span><span>Status</span></div>
        {RULES.map((r) => <div key={r.id} role="row" className="dw-tr dw-rules-grid"><b className="bw-mono">{r.name}</b><span className="dw-sec2">{r.desc}</span><span className="bw-num r">{r.used}</span><Badge tone={r.status === 'Ativa' ? 'success' : 'warning'}>{r.status}</Badge></div>)}</div></div>
  );
}
