import { useShallow } from 'zustand/react/shallow';
import { Button, Checkbox, Icon, Select, Switch } from '@biweb/ui';
import { labelOf } from '../../data/query';
import { getField } from '../../data/registry';
import { COMP_META, type Comp } from '../doc';
import { useEditor } from '../store';
import { NoSelection, Row, Section } from './shared';

const DRILLS: Record<string, { id: string; label: string; path: string[] }[]> = {
  enlaces: [{ id: 'camada>regiao>id', label: 'Camada → Região → Enlace', path: ['camada', 'regiao', 'id'] }, { id: 'regiao>id', label: 'Região → Enlace', path: ['regiao', 'id'] }, { id: 'tecnologia>regiao', label: 'Tecnologia → Região', path: ['tecnologia', 'regiao'] }],
  nos: [{ id: 'tipo>regiao>id', label: 'Tipo → Região → Nó', path: ['tipo', 'regiao', 'id'] }, { id: 'regiao>id', label: 'Região → Nó', path: ['regiao', 'id'] }],
  eventos: [{ id: 'tipo>regiao', label: 'Tipo → Região', path: ['tipo', 'regiao'] }, { id: 'regiao>elementoNome', label: 'Região → Elemento', path: ['regiao', 'elementoNome'] }],
};

function Targets({ c, comps }: { c: Comp; comps: Comp[] }) {
  const targets = c.props.targets as 'all' | string[];
  const others = comps.filter((x) => x.id !== c.id && COMP_META[x.type].data && x.type !== 'filter' && x.type !== 'slicer');
  const set = (v: 'all' | string[]) => useEditor.getState().update(c.id, (d) => { d.props.targets = v; }, 'Alterar alvos do filtro');
  return (
    <Section title="Filtra quais componentes">
      <Row label="Alcance"><Select label="Alcance" hideLabel value={targets === 'all' ? 'all' : 'some'} onChange={(v: string) => set(v === 'all' ? 'all' : others.map((x) => x.id))} options={[{ id: 'all', label: 'Toda a página' }, { id: 'some', label: 'Componentes escolhidos' }]} /></Row>
      {targets !== 'all' && <div className="ed-checks">{others.map((o) => <Checkbox key={o.id} isSelected={targets.includes(o.id)} onChange={(v) => set(v ? [...targets, o.id] : targets.filter((x) => x !== o.id))}>{o.name}</Checkbox>)}</div>}
    </Section>
  );
}

export function InteractionsTab() {
  const comps = useEditor(useShallow((s) => s.page()?.comps ?? []));
  const selection = useEditor((s) => s.selection);
  const pages = useEditor(useShallow((s) => s.doc?.pages.map((p) => ({ id: p.id, name: p.name })) ?? []));
  const pageId = useEditor((s) => s.pageId);
  const cross = useEditor((s) => s.cross);
  const fv = useEditor((s) => s.filterValues);
  const c = selection.length === 1 ? comps.find((x) => x.id === selection[0]) : undefined;
  const st = useEditor.getState();
  const upd = (label: string, fn: (d: Comp) => void) => c && st.update(c.id, (d) => fn(d as Comp), label);
  const filters = comps.filter((x) => x.type === 'filter' || x.type === 'slicer');
  const emitters = comps.filter((x) => x.interactions.emitCross && COMP_META[x.type].data && x.type !== 'filter' && x.type !== 'slicer');
  const activeFilters = filters.filter((f) => (fv[f.id] ?? []).length);
  return (
    <div className="ed-tab">
      {c ? (
        <>
          <div className="ed-tab-title">{COMP_META[c.type].label} · {c.name}</div>
          {(c.type === 'filter' || c.type === 'slicer') ? <Targets c={c} comps={comps} /> : COMP_META[c.type].data ? (
            <Section title="Cross-filter">
              <Row label="Clicar filtra os outros"><Switch isSelected={c.interactions.emitCross} onChange={(v) => upd(v ? 'Ligar cross-filter' : 'Desligar cross-filter', (d) => { d.interactions.emitCross = v; })} aria-label="Clicar filtra os outros">{null}</Switch></Row>
              <Row label="Reage a filtros"><Switch isSelected={c.interactions.receive} onChange={(v) => upd(v ? 'Reagir a filtros' : 'Ignorar filtros', (d) => { d.interactions.receive = v; })} aria-label="Reage a filtros e seleções">{null}</Switch></Row>
            </Section>
          ) : null}
          {c.type === 'chart' && c.data && DRILLS[c.data.table] && (
            <Section title="Drill-down">
              <Row label="Hierarquia"><Select label="Hierarquia de drill-down" hideLabel value={c.interactions.drill?.join('>') ?? ''} onChange={(v: string) => { const h = DRILLS[c.data!.table]!.find((x) => x.id === v); upd(h ? `Drill-down ${h.label}` : 'Sem drill-down', (d) => { d.interactions.drill = h?.path; if (h) d.props.x = h.path[0]; }); st.set({ drill: { ...st.drill, [c.id]: [] } }); }} options={[{ id: '', label: 'Sem drill-down' }, ...DRILLS[c.data.table]!.map((h) => ({ id: h.id, label: h.label }))]} /></Row>
              {c.interactions.drill && <p className="ed-help">Clique numa barra para descer um nível. O cabeçalho do gráfico mostra o caminho e o botão para voltar.</p>}
            </Section>
          )}
          {['card', 'kpi', 'chart', 'status', 'image', 'text'].includes(c.type) && (
            <Section title="Navegação">
              <Row label="Ao clicar, abrir"><Select label="Página de destino" hideLabel value={c.interactions.navigateTo ?? ''} onChange={(v: string) => upd(v ? `Navegar para ${pages.find((p) => p.id === v)?.name}` : 'Sem navegação', (d) => { d.interactions.navigateTo = v || undefined; })} options={[{ id: '', label: 'Nada' }, ...pages.filter((p) => p.id !== pageId).map((p) => ({ id: p.id, label: p.name }))]} /></Row>
              {c.interactions.navigateTo && <p className="ed-help">Funciona na visualização. Em cards, aparece um link para a página.</p>}
            </Section>
          )}
        </>
      ) : <NoSelection text="Selecione um componente para configurar cross-filter, drill-down e navegação. Abaixo, o mapa de interações desta página." />}

      <Section title="Mapa de interações da página">
        {filters.length === 0 && emitters.length === 0 && <p className="ed-help">Sem filtros nem componentes que filtram nesta página.</p>}
        {filters.map((f) => (
          <div key={f.id} className="ed-ix">
            <button type="button" className="ed-ix-src" onClick={() => st.select([f.id])}><Icon name="filter" size={12} />{f.name}</button>
            <Icon name="arrowRight" size={12} />
            <span className="ed-ix-dst">{(f.props.targets as 'all' | string[]) === 'all' ? 'toda a página' : `${(f.props.targets as string[]).length} componentes`}</span>
          </div>
        ))}
        {emitters.map((e) => (
          <div key={e.id} className="ed-ix">
            <button type="button" className="ed-ix-src" onClick={() => st.select([e.id])}><Icon name="target" size={12} />{e.name}</button>
            <Icon name="arrowRight" size={12} />
            <span className="ed-ix-dst">clique filtra {comps.filter((x) => x.id !== e.id && x.interactions.receive && COMP_META[x.type].data).length} componentes</span>
          </div>
        ))}
      </Section>
      <Section title="Estado atual" right={(cross || activeFilters.length > 0) ? <Button size="sm" onPress={() => st.set({ cross: null, filterValues: {}, drill: {} })}>Limpar tudo</Button> : undefined}>
        {!cross && activeFilters.length === 0 && <p className="ed-help">Nenhum filtro ou seleção ativo.</p>}
        {activeFilters.map((f) => { const fld = getField(f.data!.dataset, f.data!.table, String(f.props.field)); return <div key={f.id} className="ed-lf"><Icon name="filter" size={12} /><span>{fld?.label}: {(fv[f.id] ?? []).map((v) => labelOf(v, fld)).join(', ')}</span></div>; })}
        {cross && <div className="ed-lf"><Icon name="target" size={12} /><span>{cross.label} (de {comps.find((x) => x.id === cross.source)?.name})</span></div>}
      </Section>
    </div>
  );
}
