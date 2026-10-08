import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Badge, Button, FieldTypeIcon, Icon, SegmentedControl, type IconName, type Tone } from '@biweb/ui';
import { useData } from '../data/registry';
import type { Dataset } from '../data/types';
import { useLibrary } from '../editor/library';
import { blankReport } from '../editor/templates';
import { NOW } from '../net/generate';
import { nf, plural } from './analyze';
import { ImportWizard } from './ImportWizard';
import { Lineage, reportsUsing } from './Lineage';
import './datasources.css';

interface SourceRow { id: string; name: string; kind: string; icon: IconName; tone: Tone; status: string; refreshed: string; detail: string; mono?: boolean }

/** "Agora" do protótipo para fontes de exemplo; importações reais usam o relógio do navegador. */
function ago(ts: number, now: number) {
  const m = Math.max(0, Math.round((now - ts) / 60_000));
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} ${d === 1 ? 'dia' : 'dias'}`;
}

const FIXED_SOURCES: SourceRow[] = [
  { id: 'netops-db', name: 'netops-db', kind: 'PostgreSQL · inventario_rede', icon: 'data', mono: true, tone: 'success', status: 'Conectado', refreshed: ago(NOW - 14 * 60_000, NOW), detail: 'A cada 15 min' },
  { id: 'noc-api', name: 'API de alarmes NOC', kind: 'API REST · JSON', icon: 'share', tone: 'success', status: 'Conectado', refreshed: ago(NOW - 2 * 60_000, NOW), detail: 'A cada 5 min' },
  { id: 'metas-xlsx', name: 'metas_capacidade.xlsx', kind: 'Planilha XLSX', icon: 'table', mono: true, tone: 'warning', status: 'Desatualizada', refreshed: ago(NOW - 12 * 86_400_000, NOW), detail: 'Atualização manual há 12 dias' },
];

/** Dados: fontes conectadas, datasets do workspace e a portabilidade (fonte → dataset → relatórios). */
export function DataPage() {
  const datasets = useData((s) => s.datasets);
  const docs = useLibrary((s) => s.docs);
  const navigate = useNavigate();
  const [wizard, setWizard] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'form' | 'agent'>('form');
  const [connectionTested, setConnectionTested] = useState(false);
  const [selected, setSelected] = useState<string>(datasets[0]?.id ?? 'ds_rede_sp');
  const portRef = useRef<HTMLElement>(null);

  /* Um dataset recém-importado passa a ser o selecionado. */
  const prevCount = useRef(datasets.length);
  useEffect(() => {
    if (datasets.length > prevCount.current) { const last = datasets[datasets.length - 1]; if (last) setSelected(last.id); }
    prevCount.current = datasets.length;
  }, [datasets]);

  const sources: SourceRow[] = useMemo(() => [
    ...FIXED_SOURCES,
    ...datasets.filter((d) => d.imported).map((d): SourceRow => ({
      id: d.id, name: d.source.label, kind: `Arquivo ${d.source.kind} · ${d.name}`, icon: 'layers', mono: true, tone: 'success', status: 'Importado',
      refreshed: ago(d.source.refreshedAt, Date.now()), detail: d.source.schedule === 'Manual' ? 'Atualização manual' : d.source.schedule,
    })),
  ], [datasets]);

  const usesByDs = useMemo(() => Object.fromEntries(datasets.map((d) => [d.id, reportsUsing(d, docs)])), [datasets, docs]);
  const ds = datasets.find((d) => d.id === selected) ?? datasets[0];
  const uses = ds ? usesByDs[ds.id] ?? [] : [];
  const pages = uses.reduce((s, u) => s + u.pages, 0);
  const connectedReports = docs.filter((d) => d.datasets.some((id) => datasets.some((x) => x.id === id))).length;

  const createReport = (datasetId: string) => {
    const d = useData.getState().datasets.find((x) => x.id === datasetId);
    const doc = { ...blankReport(), datasets: [datasetId], name: d ? `Relatório de ${d.name}` : 'Relatório sem título' };
    useLibrary.getState().save(doc);
    navigate({ to: '/reports/$reportId/edit', params: { reportId: doc.id } });
  };
  const select = (id: string) => { setSelected(id); requestAnimationFrame(() => portRef.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })); };

  return (
    <div className="pg ds-page">
      <header className="pg-head">
        <div>
          <h1 className="pg-title">Dados</h1>
          <p className="pg-sub bw-num">{plural(sources.length, 'fonte', 'fontes')} · {plural(datasets.length, 'dataset', 'datasets')} · {plural(connectedReports, 'relatório conectado', 'relatórios conectados')}</p>
        </div>
        <span className="flex-1" />
        <Button variant="primary" size="lg" icon="plus" onPress={() => setWizard(true)}>Importar dados</Button>
      </header>

      <section className="ds-section" aria-labelledby="connector-catalog">
        <div className="sec-head"><div><h2 id="connector-catalog" className="sec-title">Catálogo de conectores</h2><p className="bw-cap bw-muted">Escolha uma fonte; o assistente opcional preenche o mesmo formulário.</p></div><SegmentedControl label="Modo de configuração" value={connectionMode} onChange={(v) => setConnectionMode(v)} options={[{ id: 'form', label: 'Formulário' }, { id: 'agent', label: 'Assistido' }]} /></div>
        <div className="conn-catalog">
          <div className="conn-catalog-list" role="listbox" aria-label="Conectores disponíveis">
            {[
              ['PostgreSQL', 'Banco de dados · credencial gerenciada'], ['API REST', 'JSON ou GeoJSON · token protegido'], ['CSV / planilha', 'Upload com detecção de tipo'],
            ].map(([name, desc], i) => <button key={name} type="button" className={`conn-choice${i === 0 ? ' is-selected' : ''}`} onClick={() => setConnectionTested(false)}><Icon name={i === 2 ? 'table' : i === 1 ? 'share' : 'data'} size={16}/><span><b>{name}</b><small>{desc}</small></span><Icon name="chevronRight" size={12}/></button>)}
          </div>
          <div className="conn-setup">
            <div className="conn-setup-head"><b>{connectionMode === 'agent' ? 'Configuração assistida' : 'PostgreSQL'}</b><span className="bw-cap bw-muted">Etapa 1 de 5 · Credenciais</span></div>
            {connectionMode === 'agent' ? <p className="bw-secondary">Descreva a fonte. O Copilot pode preencher endereço e schema; segredos continuam apenas nos campos protegidos.</p> : <p className="bw-secondary">Insira a origem da conexão e valide o acesso antes de descobrir o schema.</p>}
            <div className="conn-setup-fields"><label>Host<input defaultValue="db.exemplo.local" aria-label="Host" /></label><label>Banco<input defaultValue="netops" aria-label="Banco" /></label><label>Usuário<input defaultValue="biweb_reader" aria-label="Usuário" /></label><label>Senha<input type="password" value="••••••••" readOnly aria-label="Senha protegida" /></label></div>
            <div className="conn-setup-actions"><Button size="sm" onPress={() => setConnectionTested(true)}>Testar conexão</Button><Button size="sm" isDisabled={!connectionTested}>Próximo: schema</Button>{connectionTested && <Badge tone="success" icon="check">Teste demonstrativo aprovado</Badge>}</div>
            <small className="bw-muted">Demonstração local. Nenhuma conexão ou credencial foi enviada.</small>
          </div>
        </div>
      </section>

      <section className="ds-section" aria-labelledby="ds-sources">
        <div className="sec-head"><h2 id="ds-sources" className="sec-title">Fontes de dados</h2><span className="bw-cap bw-muted">Conexões e arquivos do workspace Operações de Rede</span></div>
        <div className="ds-rows" role="table" aria-label="Fontes de dados">
          <div className="ds-row ds-row--head ds-src-grid" role="row">
            <span role="columnheader">Fonte</span><span role="columnheader">Tipo</span><span role="columnheader">Status</span><span role="columnheader">Última atualização</span><span role="columnheader">Agenda</span>
          </div>
          {sources.map((s) => (
            <div key={s.id} className="ds-row ds-src-grid" role="row">
              <span role="cell" className="ds-cell-main"><span className="ds-row-ico"><Icon name={s.icon} size={16} /></span><b className={s.mono ? 'bw-mono ds-mono-name' : undefined}>{s.name}</b></span>
              <span role="cell" className="bw-secondary ds-ellipsis">{s.kind}</span>
              <span role="cell"><Badge tone={s.tone} icon={s.tone === 'warning' ? 'warning' : 'check'}>{s.status}</Badge></span>
              <span role="cell" className="bw-secondary bw-num">{s.refreshed}</span>
              <span role="cell" className={s.tone === 'warning' ? 'ds-warn-text' : 'bw-secondary'}>{s.detail}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="ds-section" aria-labelledby="ds-datasets">
        <div className="sec-head"><h2 id="ds-datasets" className="sec-title">Datasets</h2><span className="bw-cap bw-muted">Os relatórios leem estes datasets; nenhum guarda uma cópia dos dados</span></div>
        <div className="ds-rows" role="table" aria-label="Datasets">
          <div className="ds-row ds-row--head ds-set-grid" role="row">
            <span role="columnheader">Dataset</span><span role="columnheader">Fonte</span><span role="columnheader" className="ds-r">Tabelas</span><span role="columnheader" className="ds-r">Campos</span>
            <span role="columnheader" className="ds-r">Linhas</span><span role="columnheader">Dono</span><span role="columnheader" className="ds-r">Relatórios</span><span role="columnheader"><span className="sr-only">Ações</span></span>
          </div>
          {datasets.map((d) => <DatasetRow key={d.id} d={d} reports={usesByDs[d.id]?.length ?? 0} selected={d.id === ds?.id} onSelect={() => select(d.id)} />)}
        </div>
      </section>

      {ds && (
        <section ref={portRef} className="ds-section ds-port" aria-labelledby="ds-port">
          <div className="sec-head">
            <h2 id="ds-port" className="sec-title">Portabilidade · {ds.name}</h2>
            <span className="bw-cap bw-muted">O dado pertence à empresa, não ao dashboard</span>
          </div>
          <p className="ds-impact" role="status">
            <Icon name="info" size={12} />
            <span>Alterar este dataset afeta <b className="bw-num">{plural(uses.length, 'relatório', 'relatórios')}</b> e <b className="bw-num">{plural(pages, 'página', 'páginas')}</b>.
              {' '}Uma correção na fonte ou no dataset chega a todos eles de uma vez; nenhum relatório mantém uma cópia própria.</span>
            {uses.length === 0 && <Button size="sm" onPress={() => createReport(ds.id)}>Criar relatório com este dataset</Button>}
          </p>
          <Lineage ds={ds} uses={uses} />

          <div className="ds-model">
            <div>
              <h3 className="ds-block-title">Tabelas e campos</h3>
              <ul className="ds-tables">
                {ds.tables.map((t) => (
                  <li key={t.id} className="ds-table">
                    <div className="ds-table-head">
                      <b>{t.name}</b>
                      <code className="bw-mono bw-muted">{t.id}</code>
                      {t.geometry && <Badge icon="pin">{t.geometry === 'point' ? 'Pontos' : t.geometry === 'line' ? 'Linhas' : 'Polígonos'}</Badge>}
                      <span className="flex-1" />
                      <span className="bw-num bw-secondary">{nf(t.rows.length)} linhas · {plural(t.fields.length, 'campo', 'campos')}</span>
                    </div>
                    <ul className="ds-fields">
                      {t.fields.map((f) => (
                        <li key={f.name} className={f.hidden ? 'is-hidden' : undefined} title={f.description ?? `${f.label} · ${f.name}${f.hidden ? ' · oculto no editor' : ''}`}>
                          <FieldTypeIcon kind={f.kind} />{f.label}{f.name === t.key && <Icon name="key" size={12} />}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="ds-block-title">Relacionamentos <span className="bw-muted bw-num">{ds.relationships.length}</span></h3>
              <ul className="ds-rels">
                {ds.relationships.map((r) => (
                  <li key={`${r.from}-${r.to}`}>
                    <span className="ds-rel-path"><code className="bw-mono">{r.from}</code><Icon name="arrowRight" size={12} /><code className="bw-mono">{r.to}</code></span>
                    <span className="bw-secondary">{r.label}</span>
                    <span className="bw-cap bw-muted">N:1</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <ImportWizard isOpen={wizard} onOpenChange={setWizard} onDone={createReport} />
    </div>
  );
}

function DatasetRow({ d, reports, selected, onSelect }: { d: Dataset; reports: number; selected: boolean; onSelect: () => void }) {
  const rows = d.tables.reduce((s, t) => s + t.rows.length, 0);
  const fields = d.tables.reduce((s, t) => s + t.fields.length, 0);
  return (
    <div className={`ds-row ds-set-grid ds-set-row${selected ? ' is-selected' : ''}`} role="row" aria-selected={selected} onClick={onSelect}>
      <span role="cell" className="ds-cell-main">
        <span className="ds-row-ico"><Icon name="model" size={16} /></span>
        <span className="ds-cell-stack">
          <span className="ds-name-line"><b>{d.name}</b>{d.certified ? <Badge tone="success" icon="check">Certificado</Badge> : <Badge tone="warning">Não certificado</Badge>}</span>
          <small className="bw-muted ds-ellipsis">{d.description}</small>
        </span>
      </span>
      <span role="cell" className="bw-secondary ds-ellipsis"><span className="bw-mono">{d.source.label}</span></span>
      <span role="cell" className="bw-num ds-r">{d.tables.length}</span>
      <span role="cell" className="bw-num ds-r">{fields}</span>
      <span role="cell" className="bw-num ds-r">{nf(rows)}</span>
      <span role="cell" className="bw-secondary">{d.owner}</span>
      <span role="cell" className="bw-num ds-r">{reports}</span>
      <span role="cell" className="ds-r">
        <Button size="sm" variant={selected ? 'default' : 'ghost'} icon="share" onPress={onSelect}>Portabilidade</Button>
      </span>
    </div>
  );
}
