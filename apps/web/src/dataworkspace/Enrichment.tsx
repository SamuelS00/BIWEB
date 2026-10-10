import { useState } from 'react';
import { Badge, Button, Icon } from '@biweb/ui';
import { enrichList, useDw } from './store';
import type { Enrich, EnrichType } from './ops';
import { PrivacyBlock } from './DataWorkspace';
import { Chip, Empty, Meter, Tabs2, ViewHead, pct } from './ui';

const TYPES: EnrichType[] = ['Derivado', 'Dados de referência', 'Entre fontes', 'Externo', 'Assistido por IA'];
const TYPE_HINT: Record<EnrichType, string> = { Derivado: 'Calculado a partir do próprio dado (data → ano, e-mail → domínio).', 'Dados de referência': 'Tabelas públicas ou internas (CEP → município, IBGE).', 'Entre fontes': 'Campos que outras fontes do workspace já têm.', Externo: 'Serviços de terceiros. Exigem aprovação de transferência.', 'Assistido por IA': 'Classificações e extrações. Opcional; funciona com IA desligada.' };
type T = 'suggested' | 'available' | 'applied' | 'rejected';

export function EnrichView() {
  const st = useDw();
  const list = enrichList(st.enrichStatus);
  const aiOff = st.ai.mode === 'off';
  const [tab, setTab] = useState<T>('suggested');
  const [types, setTypes] = useState<Set<EnrichType>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const shown = list.filter((e) => e.status === tab && (types.size === 0 || types.has(e.type)) && !(aiOff && e.ai));
  const n = (s: T) => list.filter((e) => e.status === s && !(aiOff && e.ai)).length;
  return (
    <div className="dw-view">
      <ViewHead title="Enriquecimento" sub="Acrescente informação aos datasets: derivada, de referência, de outras fontes, externa ou assistida por IA" />
      <div className="dw-enr-top">
        <div>
          <Tabs2<T> label="Estado do enriquecimento" value={tab} onChange={setTab} tabs={[{ id: 'suggested', label: 'Sugeridos', n: n('suggested') }, { id: 'available', label: 'Disponíveis', n: n('available') }, { id: 'applied', label: 'Aplicados', n: n('applied') }, { id: 'rejected', label: 'Rejeitados', n: n('rejected') }]} />
          <div className="dw-chips" role="group" aria-label="Tipos de enriquecimento">{TYPES.map((t) => <Chip key={t} on={types.has(t)} onClick={() => setTypes((s) => { const x = new Set(s); if (x.has(t)) x.delete(t); else x.add(t); return x; })} n={list.filter((e) => e.type === t).length}>{t}</Chip>)}</div>
          {types.size === 1 && <p className="dw-muted dw-pad">{TYPE_HINT[[...types][0]!]}</p>}
        </div>
        <aside className="dw-ai-card" aria-label="Assistência de IA">
          <header><Icon name="copilot" size={12} /><b>Assistência de IA</b>{aiOff ? <Badge>Desligada</Badge> : <Badge tone="success">Habilitada · {st.ai.mode === 'metadata' ? 'somente metadados' : 'amostras mascaradas'}</Badge>}</header>
          <p>{aiOff ? 'Enriquecimentos por IA ficam ocultos. Todo o restante continua funcionando.' : 'A IA vê apenas o que você permitir. Nada é aplicado sem aprovação.'}</p>
          <PrivacyBlock />
        </aside>
      </div>
      {shown.length === 0 ? <Empty icon="bolt" title={tab === 'suggested' ? 'Nenhuma sugestão no momento' : 'Nada por aqui'} text={aiOff ? 'Ligue a IA para ver sugestões assistidas, ou explore os enriquecimentos disponíveis.' : 'Quando o BIWEB detectar um campo enriquecível, ele aparece aqui.'} action={tab !== 'available' ? <Button size="sm" onPress={() => setTab('available')}>Ver disponíveis</Button> : undefined} /> : (
        <ul className="dw-enr-list">{shown.map((e) => <EnrichCard key={e.id} e={e} open={open === e.id} onOpen={() => { setOpen(open === e.id ? null : e.id); st.select({ kind: 'enrich', id: e.id }); }} />)}</ul>
      )}
    </div>
  );
}

function EnrichCard({ e, open, onOpen }: { e: Enrich; open: boolean; onOpen: () => void }) {
  const st = useDw();
  const [preview, setPreview] = useState(false);
  const ext = e.transfer !== 'Nenhuma';
  return (
    <li className={`dw-enr${open ? ' is-open' : ''}`}>
      <button type="button" className="dw-enr-h" onClick={onOpen} aria-expanded={open}>
        <span className="dw-enr-t"><Badge tone={e.type === 'Externo' ? 'warning' : e.type === 'Assistido por IA' ? 'accent' : 'neutral'}>{e.type}</Badge><b>{e.title}</b></span>
        <span className="dw-enr-m"><span>Entrada <b>{e.inputs}</b></span><span>Saída <b>{e.outputs.join(' · ')}</b></span></span>
        <span className="dw-enr-c"><Meter v={e.coverage} tone={e.coverage >= 95 ? 'success' : 'warning'} /><b className="bw-num">{pct(e.coverage)}</b><small>cobertura</small></span>
      </button>
      {open && (
        <div className="dw-enr-b">
          {e.note && <p className="dw-note"><Icon name="info" size={12} />{e.note}</p>}
          <div className="dw-facts"><div className="dw-kv"><span>Transferência externa</span><b className={ext ? 'dw-warn' : undefined}>{e.transfer}</b></div><div className="dw-kv"><span>Fonte</span><b>{e.source}</b></div></div>
          {preview && <div className="dw-prev">{e.sample.map(([a, b]) => <div key={a} className="dw-ba"><span className="bw-mono">{a}</span><Icon name="arrowRight" size={12} /><span>{b}</span></div>)}</div>}
          <div className="dw-hyp-a">
            <Button size="sm" onPress={() => setPreview(!preview)}>{preview ? 'Ocultar prévia' : 'Prévia'}</Button>
            {e.status !== 'applied' && <Button size="sm" variant="primary" icon="check" onPress={() => { st.setEnrich(e.id, 'applied'); st.toast(ext ? 'Aplicado após aprovação de transferência' : `Aplicado: ${e.title}`); }}>{ext ? 'Aprovar e aplicar' : 'Aplicar'}</Button>}
            {e.status !== 'rejected' && e.status !== 'applied' && <Button size="sm" variant="ghost" onPress={() => st.setEnrich(e.id, 'rejected')}>Rejeitar</Button>}
            {e.status === 'applied' && <Badge tone="success" icon="check">Aplicado</Badge>}
            {e.status === 'rejected' && <Button size="sm" variant="ghost" onPress={() => st.setEnrich(e.id, 'available')}>Restaurar</Button>}
          </div>
        </div>
      )}
    </li>
  );
}
