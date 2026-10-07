import type { ReactNode } from 'react';
import { IconButton } from '@biweb/ui';
import { network } from '../../data/registry';
import type { NetEvent, NetLink, NetNode, NetStatus } from '../../net/generate';
import { LOS_DEMO, losDemo, losSummary, type LosResult } from '../../net/los';
import { STATUS_WORD, fmt, fmtTime } from './format';

export function StatusTag({ s }: { s: NetStatus }) {
  return <span className="s3d-status" data-status={s}><span className="s3d-dot" aria-hidden="true" />{STATUS_WORD[s]}</span>;
}

// ---------- painel de visada (inferior esquerdo) ----------
let losCache: { r: LosResult; text: string } | null = null;
const losData = () => (losCache ??= { r: losDemo(), text: losSummary() });

export function LosPanel() {
  const { r, text } = losData();
  const W = 272, H = 78, padL = 44, padB = 14, padT = 6;
  const ys = r.profile.flatMap((p) => [p.ground_m, p.los_m]);
  const lo = Math.floor((Math.min(...ys) - 5) / 10) * 10, hi = Math.ceil((Math.max(...ys) + 5) / 10) * 10;
  const sx = (d: number) => padL + (d / Math.max(1e-6, r.distance_km)) * (W - padL - 2);
  const sy = (m: number) => padT + (1 - (m - lo) / Math.max(1, hi - lo)) * (H - padT - padB);
  const ground = `M${sx(0)},${sy(lo)} ` + r.profile.map((p) => `L${sx(p.d_km).toFixed(1)},${sy(p.ground_m).toFixed(1)}`).join(' ') + ` L${sx(r.distance_km)},${sy(lo)} Z`;
  const first = r.profile[0], last = r.profile[r.profile.length - 1];
  return (
    <section className="s3d-los" aria-label="Análise de linha de visada">
      <header className="s3d-los-head">
        <span className="s3d-los-title">Linha de visada</span>
        <span className="s3d-status" data-status={r.blocked ? 'critical' : 'normal'}><span className="s3d-dot" aria-hidden="true" />{r.blocked ? 'Obstruída' : 'Livre'}</span>
      </header>
      <div className="s3d-los-pair bw-num">{LOS_DEMO.from} → {LOS_DEMO.to} · {fmt(r.distance_km, 1)} km</div>
      <svg className="s3d-los-chart" viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={`Perfil de elevação: relevo e linha de visada ao longo de ${fmt(r.distance_km, 1)} km`}>
        <line x1={padL} x2={W - 2} y1={sy(hi)} y2={sy(hi)} className="s3d-grid" />
        <line x1={padL} x2={W - 2} y1={sy((hi + lo) / 2)} y2={sy((hi + lo) / 2)} className="s3d-grid" />
        <path d={ground} className="s3d-ground" />
        {first && last && <line x1={sx(0)} y1={sy(first.los_m)} x2={sx(r.distance_km)} y2={sy(last.los_m)} className={r.blocked ? 's3d-losline is-blocked' : 's3d-losline'} />}
        {r.blocked && (
          <g>
            <line x1={sx(r.worst.d_km)} x2={sx(r.worst.d_km)} y1={sy(r.worst.ground_m)} y2={sy(r.worst.los_m)} className="s3d-obs" />
            <circle cx={sx(r.worst.d_km)} cy={sy(r.worst.ground_m)} r={3} className="s3d-obs-dot" />
          </g>
        )}
        <text x={padL - 4} y={sy(hi) + 4} textAnchor="end" className="s3d-axis">{fmt(hi)} m</text>
        <text x={padL - 4} y={sy(lo)} textAnchor="end" className="s3d-axis">{fmt(lo)} m</text>
        <text x={padL} y={H - 2} className="s3d-axis">0 km</text>
        <text x={W - 2} y={H - 2} textAnchor="end" className="s3d-axis">{fmt(r.distance_km, 1)} km</text>
      </svg>
      <p className="s3d-los-text">{text}</p>
    </section>
  );
}

// ---------- painel de detalhe (direita) ----------
const tipoLabel = (n: NetNode) => (n.tipo === 'Equipamento' ? `Equipamento · ${n.subtipo}` : `${n.tipo} · ${n.subtipo}`);

function Row({ k, v }: { k: string; v: ReactNode }) {
  return <><dt>{k}</dt><dd className="bw-num">{v}</dd></>;
}
function Events({ list, title, empty }: { list: NetEvent[]; title: string; empty: string }) {
  return (
    <div className="s3d-sec">
      <div className="s3d-sec-label">{title}</div>
      {list.length === 0 ? <div className="s3d-muted">{empty}</div> : (
        <ul className="s3d-list">
          {list.slice(0, 3).map((e) => (
            <li key={e.id}><span className="s3d-status" data-status={e.severidade}><span className="s3d-dot" aria-hidden="true" />{e.tipo}</span><span className="s3d-muted bw-num">{fmtTime(e.ts)}{e.resolvido ? ' · resolvido' : ''}</span></li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DetailPanel({ id, statusOf, onPick, onClose, armed = true }: { armed?: boolean; id: string; statusOf: (id: string) => NetStatus; onPick: (id: string) => void; onClose: () => void }) {
  const net = network();
  const node = net.nodes.find((n) => n.id === id);
  const link = node ? undefined : net.links.find((l) => l.id === id);
  if (!node && !link) return null;
  const name = node ? node.nome : link!.id;
  const s = statusOf(id);
  return (
    <aside className="s3d-detail" style={armed ? undefined : { pointerEvents: 'none' }} aria-label={`Detalhes de ${name}`}>
      <header className="s3d-detail-head">
        <div className="s3d-detail-titles">
          <div className="s3d-detail-name">{name}</div>
          <div className="s3d-muted">{node ? tipoLabel(node) : `${link!.tipo} · ${link!.camada}`}</div>
        </div>
        <IconButton icon="close" label="Fechar" size="sm" onPress={onClose} />
      </header>
      <div className="s3d-detail-body">
        <div className="s3d-sec"><StatusTag s={s} /></div>
        {node ? <NodeBody n={node} statusOf={statusOf} onPick={onPick} /> : <LinkBody l={link!} onPick={onPick} />}
      </div>
    </aside>
  );
}

function NodeBody({ n, statusOf, onPick }: { n: NetNode; statusOf: (id: string) => NetStatus; onPick: (id: string) => void }) {
  const net = network();
  const alarms = net.events.filter((e) => e.elemento === n.id && !e.resolvido).sort((a, b) => b.ts - a.ts);
  const equips = net.nodes.filter((x) => x.pai === n.id);
  const links = net.links.filter((l) => l.origem === n.id || l.destino === n.id);
  return (
    <>
      <dl className="s3d-props">
        <Row k="Capacidade" v={`${fmt(n.capacidade)} Gbps`} />
        <Row k="Utilização" v={`${fmt(n.utilizacao)}%`} />
        <Row k="Tecnologia" v={n.tecnologia} />
        <Row k="Altura" v={`${fmt(n.altura_m)} m`} />
        <Row k="Proprietário" v={n.proprietario} />
        {n.pai && <Row k="Instalado em" v={<button type="button" className="s3d-link" onClick={() => onPick(n.pai!)}>{n.pai}</button>} />}
      </dl>
      <Events list={alarms} title={`Alarmes ativos · ${fmt(Math.max(alarms.length, n.alarmes))}`}
        empty={n.alarmes > 0 ? 'Alarme herdado de enlace associado; sem evento próprio aberto' : 'Nenhum alarme ativo'} />
      {n.tipo !== 'Equipamento' && (
        <div className="s3d-sec">
          <div className="s3d-sec-label">Equipamentos instalados · {fmt(equips.length)}</div>
          {equips.length === 0 ? <div className="s3d-muted">Nenhum equipamento</div> : (
            <ul className="s3d-list">
              {equips.map((e) => (
                <li key={e.id}><button type="button" className="s3d-link" onClick={() => onPick(e.id)}>{e.nome}</button><StatusTag s={statusOf(e.id)} /></li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="s3d-sec">
        <div className="s3d-sec-label">Enlaces associados · {fmt(links.length)}</div>
        <ul className="s3d-list">
          {links.slice(0, 8).map((l) => (
            <li key={l.id}>
              <button type="button" className="s3d-link bw-mono" onClick={() => onPick(l.id)}>{l.id}</button>
              <span className="s3d-row-end"><StatusTag s={statusOf(l.id)} /><span className="s3d-muted bw-num">{fmt(l.atenuacao_dB, 1)} dB</span></span>
            </li>
          ))}
        </ul>
        {links.length > 8 && <div className="s3d-muted">+{fmt(links.length - 8)} enlaces</div>}
      </div>
    </>
  );
}

function LinkBody({ l, onPick }: { l: NetLink; onPick: (id: string) => void }) {
  const ev = network().events.filter((e) => e.elemento === l.id).sort((a, b) => b.ts - a.ts);
  return (
    <>
      <div className="s3d-sec s3d-ends">
        <button type="button" className="s3d-link" onClick={() => onPick(l.origem)}>{l.origem}</button>
        <span aria-label="para">→</span>
        <button type="button" className="s3d-link" onClick={() => onPick(l.destino)}>{l.destino}</button>
      </div>
      <dl className="s3d-props">
        <Row k="Extensão" v={`${fmt(l.extensao_km, 2)} km`} />
        <Row k="Capacidade" v={`${fmt(l.capacidade)} Gbps`} />
        <Row k="Ocupação" v={`${fmt(l.utilizacao)}%`} />
        <Row k="Atenuação" v={`${fmt(l.atenuacao_dB, 1)} dB`} />
        <Row k="Tecnologia" v={l.tecnologia} />
        <Row k="Proprietário" v={l.proprietario} />
      </dl>
      <Events list={ev} title="Eventos recentes" empty="Nenhum evento nos últimos 30 dias" />
    </>
  );
}
