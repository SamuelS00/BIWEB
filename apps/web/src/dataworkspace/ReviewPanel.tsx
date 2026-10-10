import { useState } from 'react';
import { Badge, Button } from '@biweb/ui';
import { REVIEW } from './ops';
import { useDw } from './store';
import { Chip, ConfBadge, Empty, RiskBadge, useGo } from './ui';

type F = 'all' | 'high' | 'low' | 'ai' | 'breaking';
export function ReviewPanel() {
  const st = useDw(), go = useGo();
  const [f, setF] = useState<F>('all');
  const pending = REVIEW.filter((r) => !st.decisions[r.id]);
  const list = pending.filter((r) => f === 'all' || (f === 'high' && r.risk === 'Alto') || (f === 'low' && (r.conf ?? 100) < 90) || (f === 'ai' && r.ai) || (f === 'breaking' && r.breaking));
  return (
    <div className="dw-review">
      <div className="dw-rv-h"><b>{pending.length} {pending.length === 1 ? 'decisão pendente' : 'decisões pendentes'}</b></div>
      <div className="dw-chips" role="group" aria-label="Filtros de revisão">
        <Chip on={f === 'all'} onClick={() => setF('all')}>Todas</Chip><Chip on={f === 'high'} onClick={() => setF('high')}>Alto risco</Chip><Chip on={f === 'low'} onClick={() => setF('low')}>Baixa confiança</Chip><Chip on={f === 'ai'} onClick={() => setF('ai')}>Assistido por IA</Chip><Chip on={f === 'breaking'} onClick={() => setF('breaking')}>Breaking</Chip>
      </div>
      {list.length === 0 ? <Empty icon="check" title="Nenhuma decisão aguardando revisão." text={pending.length ? 'Nenhum item corresponde ao filtro.' : 'Tudo em dia. Novas sugestões aparecem aqui.'} /> : (
        <ul className="dw-rv-list">{list.map((r) => (
          <li key={r.id} className="dw-rv-i">
            <div className="dw-rv-t"><Badge>{r.type}</Badge>{r.ai && <Badge tone="accent">IA</Badge>}<span className="flex-1" /><RiskBadge r={r.risk} /></div>
            <b>{r.title}</b><small>{r.where}</small>{r.conf !== undefined && <ConfBadge v={r.conf} />}
            <div className="dw-rv-a"><Button size="sm" variant="ghost" onPress={() => go(r.to)}>Abrir</Button><Button size="sm" onPress={() => st.decide(r.id, 'rejected')}>Rejeitar</Button><Button size="sm" variant="primary" onPress={() => { st.decide(r.id, 'accepted'); st.toast('Decisão registrada'); }}>Aceitar</Button></div>
          </li>))}</ul>)}
    </div>
  );
}
