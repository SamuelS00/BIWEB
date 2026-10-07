import { useMemo, useState } from 'react';
import { Icon } from '@biweb/ui';
import { fmt, STATUS_LABEL } from '../../data/query';
import { network } from '../../data/registry';
import type { Row } from '../../data/types';
import { historyOf, NOW } from '../../net/generate';
import { StatusDot } from '../common';

const ago = (ts: number) => { const m = Math.round((NOW - ts) / 60_000); return m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.round(m / 60)} h` : `há ${Math.round(m / 1440)} d`; };

function Mini({ values, label, format }: { values: number[]; label: string; format: Parameters<typeof fmt>[1] }) {
  const w = 120, h = 28, mn = Math.min(...values), mx = Math.max(...values), sp = mx - mn || 1;
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${((i / (values.length - 1)) * w).toFixed(1)} ${(h - 2 - ((v - mn) / sp) * (h - 4)).toFixed(1)}`).join(' ');
  return (
    <div className="vz-mini"><span>{label}</span><svg width={w} height={h} aria-hidden="true"><path d={d} style={{ fill: 'none', stroke: 'var(--viz-cat-1)', strokeWidth: 1.5 }} /></svg><b className="bw-num">{fmt(values[values.length - 1], format)}</b></div>
  );
}

/** Painel de detalhes do elemento selecionado no mapa/topologia (dentro do componente, tokens runtime). */
export function DetailPanel({ row, byId, events, onClose, onPick, onFocus }: { row: Row; byId: Map<string, Row>; events: Row[]; onClose: () => void; onPick: (id: string) => void; onFocus: () => void }) {
  const isLink = String(row.id).startsWith('ENL');
  const net = network();
  const st = String(row.status);
  const evs = useMemo(() => net.events.filter((e) => e.elemento === row.id).slice(0, 4), [net, row.id]);
  const hist = useMemo(() => historyOf(String(row.id), { utilizacao: Number(row.utilizacao), atenuacao_dB: Number(row.atenuacao_dB ?? 0), disponibilidade: Number(row.disponibilidade) }), [row]);
  void events;
  const kv = (k: string, v: string) => <div className="vz-kv"><span>{k}</span><b>{v}</b></div>;
  const chip = (id: string) => { const n = byId.get(id); return <button type="button" className="vz-chain-node" onClick={() => onPick(id)}>{n && <StatusDot s={String(n.status)} />}{id}</button>; };
  let body: React.ReactNode;
  if (isLink) {
    const o = byId.get(String(row.origem)), d = byId.get(String(row.destino));
    const eqO = net.nodes.find((n) => n.pai === row.origem), eqD = net.nodes.find((n) => n.pai === row.destino);
    const segs = Math.max(1, ((row.geometria as unknown[]) ?? []).length - 1);
    body = (
      <>
        <div className="vz-chain" aria-label="Caminho físico">
          <div className="vz-chain-step"><small>Origem</small>{chip(String(row.origem))}<em>{o ? String(o.tipo) : ''}</em></div>
          {eqO && <div className="vz-chain-step"><small>Equipamento</small>{chip(eqO.id)}<em>{eqO.tecnologia}</em></div>}
          <div className="vz-chain-step is-link"><small>{String(row.tipo)}</small><span className="vz-chain-node is-self"><StatusDot s={st} />{String(row.id)}</span><em>{String(row.camada)} · {String(row.tecnologia)}{Number(row.fibras) ? ` · ${String(row.fibras)} fibras` : ''}</em></div>
          <div className="vz-chain-step"><small>Segmentos</small><span className="vz-chain-node is-plain">{segs} {segs === 1 ? 'trecho' : 'trechos'} · {fmt(row.extensao_km, 'km')}</span></div>
          {eqD && <div className="vz-chain-step"><small>Equipamento</small>{chip(eqD.id)}<em>{eqD.tecnologia}</em></div>}
          <div className="vz-chain-step"><small>Destino</small>{chip(String(row.destino))}<em>{d ? String(d.tipo) : ''}</em></div>
        </div>
        <div className="vz-kvs">
          {kv('Extensão', fmt(row.extensao_km, 'km'))}{kv('Capacidade', fmt(row.capacidade, 'gbps'))}{kv('Ocupação', fmt(row.utilizacao, 'pct'))}{kv('Atenuação', fmt(row.atenuacao_dB, 'db'))}
          {kv('Disponibilidade', fmt(row.disponibilidade, 'pct'))}{kv('Proprietário', String(row.proprietario))}
        </div>
        <Mini values={hist.map((h) => h.atenuacao_dB)} label="Atenuação · 30 dias" format="db" />
        <Mini values={hist.map((h) => h.utilizacao)} label="Ocupação · 30 dias" format="pct" />
      </>
    );
  } else {
    const kids = net.nodes.filter((n) => n.pai === row.id);
    const ls = net.links.filter((l) => l.origem === row.id || l.destino === row.id);
    body = (
      <>
        <div className="vz-kvs">
          {kv('Tipo', `${String(row.tipo)} · ${String(row.subtipo)}`)}{kv('Capacidade', fmt(row.capacidade, 'gbps'))}{kv('Utilização', fmt(row.utilizacao, 'pct'))}{kv('Tecnologia', String(row.tecnologia))}
          {row.tipo !== 'Equipamento' && kv('Altura', `${String(row.altura_m)} m`)}{kv('Disponibilidade', fmt(row.disponibilidade, 'pct'))}{kv('Alarmes ativos', String(row.alarmes))}{kv('Proprietário', String(row.proprietario))}
          {row.pai != null && kv('Instalado em', String(row.pai))}
        </div>
        {kids.length > 0 && <div className="vz-sec"><span className="vz-sec-t">Equipamentos instalados · {kids.length}</span>{kids.map((k) => <button key={k.id} type="button" className="vz-li" onClick={() => onPick(k.id)}><StatusDot s={String(byId.get(k.id)?.status ?? k.status)} />{k.id}<span>{k.tecnologia}</span></button>)}</div>}
        <div className="vz-sec"><span className="vz-sec-t">Enlaces · {ls.length}</span>{ls.slice(0, 8).map((l) => { const r = byId.get(l.id); return <button key={l.id} type="button" className="vz-li" onClick={() => onPick(l.id)}><StatusDot s={String(r?.status ?? l.status)} />{l.id}<span>{l.origem === row.id ? `→ ${l.destino}` : `← ${l.origem}`} · {fmt(l.atenuacao_dB, 'db')}</span></button>; })}</div>
        <Mini values={hist.map((h) => h.utilizacao)} label="Utilização · 30 dias" format="pct" />
      </>
    );
  }
  return (
    <aside className="vz-detail" aria-label={`Detalhes de ${String(row.id)}`}>
      <div className="vz-detail-head">
        <div><span className="vz-detail-kind">{isLink ? `Enlace · ${String(row.camada)}` : String(row.tipo)}</span><b className="vz-detail-name">{isLink ? String(row.id) : String(row.nome)}</b></div>
        <button type="button" className="vz-x" aria-label="Fechar detalhes" onClick={onClose}><Icon name="close" size={12} /></button>
      </div>
      <div className={`vz-detail-status vz-detail-status--${st}`}><StatusDot s={st} size={10} /><b>{STATUS_LABEL[st]}</b>{row._label ? <em>{String(row._label)}</em> : null}{row._rules ? <span title={(row._rules as string[]).join(', ')}>regra: {(row._rules as string[])[0]}</span> : null}</div>
      {isLink && <div className="vz-detail-sub">{String(row.nome)}</div>}
      {body}
      <div className="vz-sec"><span className="vz-sec-t">Eventos recentes</span>
        {evs.length === 0 ? <span className="vz-none">Nenhum evento em 30 dias</span> : evs.map((e) => <div key={e.id} className="vz-ev"><StatusDot s={e.severidade} /><div><b>{e.tipo}</b><span>{ago(e.ts)} · {e.resolvido ? `resolvido em ${e.duracao_min} min` : 'ativo'}</span></div></div>)}
      </div>
      <button type="button" className="vz-detail-act" onClick={onFocus}><Icon name="search" size={12} />Aproximar no mapa</button>
    </aside>
  );
}

/** Faixa inferior do mapa de rotas: caminho, métricas, desvio e linha do tempo de alterações/eventos. */
export function RouteStrip({ route, byId, onPick }: { route: Row; byId: Map<string, Row>; onPick: (id: string) => void }) {
  const net = network();
  const linkIds = route.enlaces as string[];
  const evs = useMemo(() => net.events.filter((e) => linkIds.includes(e.elemento) || (route.desvio && (route.desvio as { enlaces: string[] }).enlaces.includes(e.elemento))), [net, linkIds, route.desvio]);
  const changes = route.alteracoes as { ts: number; texto: string }[];
  const marks = [...changes.map((c) => ({ ts: c.ts, text: c.texto, kind: 'change' as const, sev: 'normal' })), ...evs.map((e) => ({ ts: e.ts, text: `${e.tipo} · ${e.elemento}`, kind: 'event' as const, sev: e.severidade }))].sort((a, b) => a.ts - b.ts);
  const t0 = NOW - 30 * 86_400_000;
  const [tip, setTip] = useState<{ x: number; text: string } | null>(null);
  const desvio = route.desvio as { enlaces: string[]; distancia_km: number; motivo: string } | undefined;
  return (
    <div className="vz-route-strip">
      <div className="vz-route-head">
        <StatusDot s={String(route.status)} size={10} /><b>{String(route.nome)}</b><span>{STATUS_LABEL[String(route.status)]}</span>
        <span className="vz-route-m">{fmt(route.distancia_km, 'km')} · {String(route.saltos)} saltos · {fmt(route.latencia_ms, 'ms')} · disp. {fmt(route.disponibilidade, 'pct')}</span>
      </div>
      <div className="vz-route-path">
        {(route.nos as string[]).map((n, i) => (
          <span key={n} className="vz-route-hop">{i > 0 && (() => { const l = byId.get(linkIds[i - 1]!); return <button type="button" className={`vz-hop-link vz-hop-link--${String(l?.status ?? 'normal')}`} onClick={() => onPick(linkIds[i - 1]!)} title={`${linkIds[i - 1]} · ${STATUS_LABEL[String(l?.status)]} · ${fmt(l?.atenuacao_dB, 'db')}`}>{linkIds[i - 1]}</button>; })()}<b>{n}</b></span>
        ))}
        {desvio && <span className="vz-route-detour"><Icon name="warning" size={12} />Desvio ativo: {desvio.motivo} · +{fmt(desvio.distancia_km - Number(route.distancia_km), 'km')}</span>}
      </div>
      <div className="vz-route-tl" onMouseLeave={() => setTip(null)}>
        <span className="vz-route-axis" />
        {marks.map((m, i) => { const x = ((m.ts - t0) / (NOW - t0)) * 100; return <button key={i} type="button" aria-label={`${new Date(m.ts).toLocaleDateString('pt-BR')} · ${m.text}`} className={`vz-tl-mark vz-tl-mark--${m.kind} vz-bg--${m.sev}`} style={{ left: `${Math.max(0, Math.min(100, x))}%` }} onMouseEnter={() => setTip({ x, text: `${new Date(m.ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · ${m.text}` })} />; })}
        <span className="vz-route-tl-l">30 dias</span><span className="vz-route-tl-r">hoje</span>
        {tip && <div className="vz-tip vz-tip--tl" style={{ left: `${tip.x}%` }}>{tip.text}</div>}
      </div>
    </div>
  );
}
