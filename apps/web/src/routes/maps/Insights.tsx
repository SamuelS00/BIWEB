import { Badge, Button, Icon, SegmentedControl } from '@biweb/ui';
import type { ReactNode } from 'react';
import { distanceKm, stations } from './base';
import { lampLevel } from './data-lights';
import { loadProfile, storms, stormAt } from './data-extra';
import { PHASE_COLORS, QUALITY_COLORS } from './renderers';
import type { Reroute } from './network-tools';
import { COLORS, formatTime, severity } from './model';
import type { Feature, Layer, MapDocument, ReportId, TimelineSpec } from './model';
import type { LightsMode } from './LightsLayer';

export interface InsightProps {
  id: ReportId; doc: MapDocument; layers: Layer[]; time: number; spec?: TimelineSpec;
  onTime: (v: number) => void; onFly: (lon: number, lat: number, zoom?: number) => void; onPick: (layerId: string, f: Feature, zoom?: number) => void;
  lightsMode: LightsMode; onLightsMode: (m: LightsMode) => void;
  cut: string | null; onCut: (id: string | null) => void; reroute: Reroute | null;
}
const n = (v: unknown) => Number(v ?? 0), fmt = (v: number, d = 0) => v.toLocaleString('pt-BR', { maximumFractionDigits: d, minimumFractionDigits: d });
const table = (layers: Layer[], id: string) => layers.find((l) => l.table === id);
const centroid = (f: Feature) => { const c = f.geometry.coordinates[Math.floor(f.geometry.coordinates.length / 2)]!; return [c[0]!, c[1]!] as const; };

function Kpis({ items }: { items: { label: string; value: string; note?: string; tone?: 'danger' | 'warning' | 'success' }[] }) {
  return <div className="mb-kpis">{items.map((k) => <div className="mb-kpi" key={k.label}><small>{k.label}</small><b className={k.tone ? `tone-${k.tone}` : ''}>{k.value}</b>{k.note && <em>{k.note}</em>}</div>)}</div>;
}
function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return <section className="mb-ins-section"><div className="mb-section-label">{title}{note && <span>{note}</span>}</div>{children}</section>;
}
function Bars({ rows }: { rows: { key: string; label: string; sub?: string; value: number; max: number; color?: string; text?: string; onClick?: () => void }[] }) {
  return <div className="mb-bars">{rows.map((r) => <button key={r.key} className="mb-bar-row" onClick={r.onClick} disabled={!r.onClick}><span><b>{r.label}</b>{r.sub && <small>{r.sub}</small>}</span><i><u style={{ width: `${Math.max(3, Math.min(100, r.value / Math.max(1, r.max) * 100))}%`, background: r.color ?? 'var(--accent)' }} /></i><em>{r.text ?? fmt(r.value)}</em></button>)}</div>;
}
function Hist({ values, marker, onSelect, color = 'var(--accent)', label }: { values: number[]; marker?: number; onSelect?: (i: number) => void; color?: string; label: string }) {
  const max = Math.max(1, ...values);
  return <div className="mb-hist" role="img" aria-label={label}>{values.map((v, i) => <button key={i} disabled={!onSelect} aria-label={`${String(i).padStart(2, '0')}h: ${fmt(v)}`} title={`${String(i).padStart(2, '0')}h · ${fmt(v)}`} className={marker !== undefined && i === Math.floor(marker) ? 'is-current' : ''} onClick={() => onSelect?.(i)}><u style={{ height: `${Math.max(4, v / max * 100)}%`, background: color }} /></button>)}<span className="mb-hist-axis"><small>00h</small><small>06h</small><small>12h</small><small>18h</small><small>23h</small></span></div>;
}
const byHour = (fs: Feature[]) => { const a = Array<number>(24).fill(0); fs.forEach((f) => { const h = n(f.properties.hora); if (h >= 0 && h < 24) a[h]!++; }); return a; };
const countBy = (fs: Feature[], key: string) => { const m = new Map<string, number>(); fs.forEach((f) => { const k = String(f.properties[key] ?? '—'); m.set(k, (m.get(k) ?? 0) + 1); }); return [...m.entries()].sort((a, b) => b[1] - a[1]); };

function NetworkInsights({ layers, doc, cut, onCut, reroute, onPick }: InsightProps) {
  const links = table(layers, 'trechos'), feats = links?.features ?? [];
  const worst = [...feats].sort((a, b) => n(a.properties.margem) - n(b.properties.margem)).slice(0, 5);
  const crit = feats.filter((f) => severity(f, doc.bands) >= 2).length, avg = feats.length ? feats.reduce((s, f) => s + n(f.properties.margem), 0) / feats.length : 0;
  return <>
    <Kpis items={[{ label: 'Trechos monitorados', value: String(feats.length), note: `${fmt(feats.reduce((s, f) => s + n(f.properties.extensao_km), 0), 0)} km de fibra` }, { label: 'Margem média', value: `${fmt(avg, 1)} dB`, tone: avg < 8 ? 'warning' : 'success' }, { label: 'Em condição crítica', value: String(crit), tone: crit ? 'danger' : 'success', note: 'faixas configuráveis' }, { label: 'Capacidade agregada', value: `${fmt(feats.reduce((s, f) => s + n(f.properties.capacidade_gbps), 0))} Gbps` }]} />
    <Section title="PIORES MARGENS DE POTÊNCIA"><Bars rows={worst.map((f) => ({ key: f.id, label: String(f.properties.nome), sub: `${f.id} · ${fmt(n(f.properties.extensao_km), 1)} km`, value: 25 - n(f.properties.margem), max: 25, color: COLORS[severity(f, doc.bands)], text: `${fmt(n(f.properties.margem), 1)} dB`, onClick: () => links && onPick(links.id, f, 12) }))} /></Section>
    <Section title="SIMULAR ROMPIMENTO" note="rota alternativa"><p className="mb-helper">Escolha um trecho. O mapa mostra o melhor caminho alternativo pelas vias e se há capacidade para o tráfego redirecionado.</p>
      <label className="mb-select-native"><span className="sr-only">Trecho a romper</span><select value={cut ?? ''} onChange={(e) => onCut(e.target.value || null)}><option value="">Selecionar trecho…</option>{feats.map((f) => <option key={f.id} value={f.id}>{f.id} · {String(f.properties.nome)}</option>)}</select></label>
      {cut && !reroute && <p className="mb-analysis tone-danger"><Icon name="warning" size={12} /> Sem rota alternativa: o corte isolaria uma estação.</p>}
      {reroute && <div className="mb-reroute-card"><div><Badge tone={reroute.overloaded.length ? 'danger' : 'success'}>{reroute.overloaded.length ? 'Capacidade insuficiente' : 'Rota alternativa viável'}</Badge></div>
        <div className="mb-inspector-values"><div><span>Caminho</span><b>{reroute.nodes.join(' → ')}</b></div><div><span>Distância</span><b>{fmt(reroute.km, 1)} km ({reroute.extraKm >= 0 ? '+' : ''}{fmt(reroute.extraKm, 1)})</b></div><div><span>Tráfego redirecionado</span><b>{fmt(reroute.loadGbps, 1)} Gbps</b></div><div><span>Clientes nas pontas</span><b>{fmt(reroute.clients)}</b></div></div>
        {reroute.overloaded.map((o) => <p key={o.id} className="mb-related-row tone-danger">{o.id} chegaria a {o.util}% de utilização</p>)}
        <Button size="sm" onPress={() => onCut(null)}>Limpar simulação</Button></div>}
    </Section>
  </>;
}

function TheftInsights({ layers, doc, time, onTime, onFly }: InsightProps) {
  const events = table(layers, 'ocorrencias')?.features ?? [], raw = doc.layers.find((l) => l.table === 'ocorrencias')?.features ?? [];
  const hotspots = stations.slice(0, 7).map((s) => { const near = events.filter((f) => distanceKm(f.geometry.coordinates[0]!, [s[1], s[2]]) < 3.2); return { s, count: near.length, repeat: near.reduce((x, f) => x + n(f.properties.reincidencias), 0) }; }).sort((a, b) => b.count - a.count).slice(0, 5);
  const types = countBy(events, 'tipo'), peak = byHour(raw).reduce((b, v, i, a) => v > a[b]! ? i : b, 0);
  return <>
    <Kpis items={[{ label: 'Ocorrências no período', value: String(events.length), note: `até ${formatTime(undefined, time)}` }, { label: 'Reincidências somadas', value: String(events.reduce((s, f) => s + n(f.properties.reincidencias), 0)), tone: 'warning' }, { label: 'Horário de pico', value: `${String(peak).padStart(2, '0')}h`, note: 'maior volume do dia' }, { label: 'Casos críticos', value: String(events.filter((f) => severity(f) >= 2).length), tone: 'danger' }]} />
    <Section title="FOCOS DE REINCIDÊNCIA" note="raio de 3 km"><Bars rows={hotspots.map((h) => ({ key: h.s[0], label: h.s[0], sub: `${h.repeat} reincidências`, value: h.count, max: hotspots[0]?.count ?? 1, color: COLORS[2], onClick: () => onFly(h.s[1], h.s[2], 13) }))} /></Section>
    <Section title="OCORRÊNCIAS POR HORA" note="clique para navegar"><Hist values={byHour(raw)} marker={time} onSelect={(i) => onTime(i)} color={COLORS[2]} label="Ocorrências por hora" /></Section>
    <Section title="POR TIPO"><Bars rows={types.map(([k, v]) => ({ key: k, label: k, value: v, max: types[0]![1], color: '#cc9b45' }))} /></Section>
    <p className="mb-helper">A rota de patrulha tracejada liga os quatro focos mais densos pelas vias. Proximidade é contexto geográfico e não indica envolvimento.</p>
  </>;
}

function LightsInsights({ layers, time, onPick, lightsMode, onLightsMode, onTime, onFly }: InsightProps) {
  const poles = table(layers, 'postes')?.features ?? [], poleLayer = table(layers, 'postes'), circuits = table(layers, 'circuitos');
  const st = (s: string) => poles.filter((f) => f.properties.status === s).length;
  const lit = poles.filter((f) => lampLevel(time, n(f.properties.fotocelula_min), String(f.properties.tom)) > .05 && f.properties.status !== 'Falha' && f.properties.status !== 'Manutenção').length;
  const avail = poles.length ? (poles.length - st('Falha') - st('Manutenção')) / poles.length * 100 : 0;
  const kwh = poles.reduce((s, f) => s + n(f.properties.consumo_kwh_mes), 0), sodium = poles.filter((f) => String(f.properties.tecnologia).includes('sódio')).length;
  const dark = (circuits?.features ?? []).filter((c) => c.properties.status === 'Falha'), overdue = poles.filter((f) => f.properties.vencida === true).sort((a, b) => n(b.properties.aberto_ha_h) - n(a.properties.aberto_ha_h));
  const tech = countBy(poles, 'tecnologia'), worstCircuits = [...(circuits?.features ?? [])].filter((c) => n(c.properties.falhas) > 0).sort((a, b) => n(b.properties.falhas) - n(a.properties.falhas)).slice(0, 4);
  const night = time >= 17.85 || time < 6;
  return <>
    <SegmentedControl label="Modo de visualização" value={lightsMode} onChange={onLightsMode} options={[{ id: 'night', label: 'Noite', icon: 'eye' }, { id: 'state', label: 'Estado' }, { id: 'heat', label: 'Falhas' }]} />
    <div className="mb-clock-card"><b>{formatTime(undefined, time)}</b><span>{night ? `${fmt(lit)} de ${fmt(poles.length)} luminárias acesas` : 'Dia · fotocélulas desligadas'}</span><div><Button size="sm" onPress={() => onTime(21)}>21:00</Button><Button size="sm" onPress={() => onTime(2)}>Madrugada · dimerização</Button><Button size="sm" onPress={() => onTime(12)}>Dia</Button></div></div>
    <Kpis items={[{ label: 'Disponibilidade', value: `${fmt(avail, 1)}%`, tone: avail < 95 ? 'warning' : 'success', note: `${fmt(poles.length)} postes no recorte` }, { label: 'Em falha', value: fmt(st('Falha')), tone: 'danger', note: `${dark.length} circuitos desligados` }, { label: 'Consumo estimado', value: `${fmt(kwh / 1000, 1)} MWh/mês`, note: `${fmt(sodium)} lâmpadas de sódio a trocar` }, { label: 'Chamados vencidos', value: fmt(overdue.length), tone: overdue.length ? 'danger' : 'success', note: 'fora do SLA de reparo' }]} />
    <Section title="CIRCUITOS MAIS AFETADOS">{worstCircuits.length ? <Bars rows={worstCircuits.map((c) => ({ key: c.id, label: String(c.properties.nome), sub: `${c.properties.trafo} · ${c.properties.postes} postes${c.properties.status === 'Falha' ? ' · desligado' : ''}`, value: n(c.properties.falhas), max: n(worstCircuits[0]!.properties.falhas), color: c.properties.status === 'Falha' ? COLORS[3] : COLORS[2], onClick: () => { const [lo, la] = centroid(c); onFly(lo, la, 15); } }))} /> : <p className="mb-helper">Nenhum circuito com falhas neste recorte.</p>}</Section>
    <Section title="TECNOLOGIA INSTALADA"><div className="mb-stack">{tech.map(([k, v], i) => <i key={k} title={`${k}: ${fmt(v)}`} style={{ flex: v, background: ['#9cc9ff', '#ffe2a0', '#ff8e2c', '#cfe9d8'][i % 4] }} />)}</div><div className="mb-legend-inline">{tech.map(([k, v], i) => <span key={k}><i style={{ background: ['#9cc9ff', '#ffe2a0', '#ff8e2c', '#cfe9d8'][i % 4] }} />{k} <small>{fmt(v)}</small></span>)}</div></Section>
    <Section title="FILA DE REPARO" note={`${overdue.length} vencidos`}>{overdue.length ? <Bars rows={overdue.slice(0, 5).map((f) => ({ key: f.id, label: String(f.properties.via), sub: `${f.id} · ${f.properties.falha || f.properties.status}`, value: n(f.properties.aberto_ha_h), max: n(overdue[0]!.properties.aberto_ha_h), color: COLORS[2], text: `${f.properties.aberto_ha_h} h`, onClick: () => poleLayer && onPick(poleLayer.id, f, 16) }))} /> : <p className="mb-helper">Sem chamados vencidos.</p>}</Section>
  </>;
}

function IncidentInsights({ layers, doc, time, onTime }: InsightProps) {
  const events = table(layers, 'incidentes')?.features ?? [], raw = doc.layers.find((l) => l.table === 'incidentes')?.features ?? [];
  const types = countBy(events, 'tipo'), regions = countBy(events, 'regiao'), hours = byHour(raw);
  return <>
    <Kpis items={[{ label: 'Incidentes', value: String(events.length), note: `até ${String(Math.floor(time)).padStart(2, '0')}:59` }, { label: 'Críticos e urgentes', value: String(events.filter((f) => severity(f) >= 2).length), tone: 'danger' }, { label: 'Pico', value: `${String(hours.indexOf(Math.max(...hours))).padStart(2, '0')}h`, note: `${Math.max(...hours)} eventos` }, { label: 'Reincidentes', value: String(events.filter((f) => n(f.properties.reincidencias) >= 4).length), tone: 'warning' }]} />
    <Section title="DENSIDADE POR HORA" note="clique para navegar"><Hist values={hours} marker={time} onSelect={onTime} color="#d98a4a" label="Incidentes por hora" /></Section>
    <Section title="COMPOSIÇÃO POR TIPO"><Bars rows={types.map(([k, v], i) => ({ key: k, label: k, value: v, max: types[0]![1], color: ['#cb7063', '#cc9b45', '#6f8bff'][i % 3] }))} /></Section>
    <Section title="POR REGIÃO"><Bars rows={regions.map(([k, v]) => ({ key: k, label: k, value: v, max: regions[0]![1], color: '#d98a4a' }))} /></Section>
  </>;
}

function CoverageInsights({ layers, doc, time, onTime, onPick, onFly }: InsightProps) {
  const sectors = table(layers, 'setores'), feats = sectors?.features ?? [], complaints = layers.find((l) => l.name.startsWith('Reclam'))?.features.length ?? 0, shadow = layers.find((l) => l.name.startsWith('Zonas'))?.features ?? [];
  const hot = feats.filter((f) => severity(f) >= 2), top = [...feats].sort((a, b) => n(b.properties.ocupacao_prb) - n(a.properties.ocupacao_prb)).slice(0, 5);
  const poor = feats.filter((f) => f.properties.qualidade === 'Fraca').length, curve = Array.from({ length: 24 }, (_, h) => Math.round(loadProfile(h) * 100));
  return <>
    <Kpis items={[{ label: 'Setores saturados', value: String(hot.length), tone: hot.length ? 'danger' : 'success', note: `de ${feats.length} setores` }, { label: 'Sinal fraco', value: String(poor), tone: 'warning', note: 'RSRP abaixo de −108 dBm' }, { label: 'Reclamações', value: String(complaints), note: `até ${formatTime(undefined, time)}` }, { label: 'Clientes em zonas de sombra', value: fmt(shadow.reduce((s, f) => s + n(f.properties.clientes_afetados), 0)), tone: 'danger' }]} />
    <Section title="COMO LER O MAPA"><div className="mb-legend-inline"><span><i style={{ background: QUALITY_COLORS.Excelente }} />Excelente</span><span><i style={{ background: QUALITY_COLORS.Boa }} />Boa</span><span><i style={{ background: QUALITY_COLORS.Regular }} />Regular</span><span><i style={{ background: QUALITY_COLORS.Fraca }} />Fraca</span></div><p className="mb-helper">Preenchimento = qualidade do sinal (RSRP). Contorno = ocupação de recursos (PRB): âmbar &gt; 66%, vermelho &gt; 80%, tracejado &gt; 92%.</p></Section>
    <Section title="CARGA DA REDE AO LONGO DO DIA" note="clique para simular"><Hist values={curve} marker={time} onSelect={onTime} color="#9d81d6" label="Ocupação média por hora" /></Section>
    <Section title="SETORES MAIS CARREGADOS"><Bars rows={top.map((f) => ({ key: f.id, label: String(f.properties.nome), sub: `${f.properties.tecnologia} · ${f.properties.usuarios} usuários`, value: n(f.properties.ocupacao_prb), max: 100, color: COLORS[Math.min(3, severity(f))], text: `${f.properties.ocupacao_prb}%`, onClick: () => sectors && onPick(sectors.id, f, 13) }))} /></Section>
    <Section title="ZONAS DE SOMBRA"><Bars rows={shadow.map((f) => ({ key: f.id, label: String(f.properties.nome), sub: `${fmt(n(f.properties.area_km2), 1)} km²`, value: n(f.properties.clientes_afetados), max: 8000, color: '#d9567a', onClick: () => { const [lo, la] = centroid(f); onFly(lo, la, 13); } }))} /></Section>
    <p className="mb-helper">{doc.layers.length} camadas · valores de demonstração.</p>
  </>;
}

function ExpansionInsights({ layers, time, onPick }: InsightProps) {
  const routes = table(layers, 'expansao'), feats = routes?.features ?? [], weeks = 26;
  const built = feats.reduce((s, f) => s + n(f.properties.km) * n(f.properties.pct) / 100, 0), total = feats.reduce((s, f) => s + n(f.properties.km), 0), hp = feats.reduce((s, f) => s + n(f.properties.hp_previstos) * (f.properties.fase === 'Concluído' ? 1 : 0), 0), blocked = feats.filter((f) => f.properties.bloqueada === true);
  const capex = feats.reduce((s, f) => s + n(f.properties.capex_mil) * n(f.properties.pct) / 100, 0);
  return <>
    <Kpis items={[{ label: 'Fibra construída', value: `${fmt(built, 1)} km`, note: `de ${fmt(total, 1)} km planejados` }, { label: 'Homes passed liberados', value: fmt(hp), tone: 'success', note: 'rotas concluídas' }, { label: 'Capex executado', value: `R$ ${fmt(capex / 1000, 2)} mi`, note: 'proporcional ao avanço' }, { label: 'Obras bloqueadas', value: String(blocked.length), tone: blocked.length ? 'danger' : 'success', note: 'licença ou prazo' }]} />
    <Section title="CRONOGRAMA" note={formatTime({ unit: 'semana' } as TimelineSpec, time)}>
      <div className="mb-gantt" role="list">{feats.map((f) => { const start = n(f.properties.inicio_semana) + n(f.properties.atraso_sem), dur = n(f.properties.duracao_sem), phase = String(f.properties.fase), color = PHASE_COLORS[phase] ?? '#8d9bb5', pct = n(f.properties.pct); return <button role="listitem" key={f.id} className={f.properties.bloqueada === true ? 'is-blocked' : ''} onClick={() => routes && onPick(routes.id, f, 12)}>
        <span><b>{String(f.properties.nome).split(' · ')[0]}</b><small>{phase}{f.properties.bloqueada === true ? ` · atraso de ${f.properties.atraso_sem} sem` : ''}</small></span>
        <i><u className="plan" style={{ left: `${(start - 1) / weeks * 100}%`, width: `${dur / weeks * 100}%` }} /><u className="done" style={{ left: `${(start - 1) / weeks * 100}%`, width: `${dur / weeks * 100 * pct / 100}%`, background: color }} /><s style={{ left: `${(time - 1) / weeks * 100}%` }} /></i>
        <em>{Math.round(pct)}%</em></button>; })}</div>
      <div className="mb-legend-inline">{Object.entries(PHASE_COLORS).map(([k, c]) => <span key={k}><i style={{ background: c }} />{k}</span>)}</div>
    </Section>
    <Section title="ÁREAS FTTH PRIORIZADAS"><Bars rows={(layers.find((l) => l.name.startsWith('Áreas'))?.features ?? []).sort((a, b) => n(b.properties.hp_previstos) - n(a.properties.hp_previstos)).map((f) => ({ key: f.id, label: String(f.properties.nome).replace(' · FTTH', ''), sub: `viabilidade ${String(f.properties.viabilidade).toLowerCase()} · adesão ${f.properties.taxa_adesao_prev}%`, value: n(f.properties.hp_previstos), max: 6500, color: '#3fb6a8', text: fmt(n(f.properties.hp_previstos)) }))} /></Section>
  </>;
}

function WeatherInsights({ layers, time, onTime, onPick, onFly }: InsightProps) {
  const sites = table(layers, 'sites_clima'), feats = sites?.features ?? [], active = storms.map((s) => ({ s, now: stormAt(s, time) })).filter((x) => x.now);
  const atRisk = feats.filter((f) => severity(f) >= 2), soon = feats.filter((f) => f.properties.eta_impacto_min !== '' && f.properties.eta_impacto_min != null).sort((a, b) => n(a.properties.eta_impacto_min) - n(b.properties.eta_impacto_min));
  const peak = Math.max(0, ...active.map((x) => x.now!.mmh)), without = atRisk.filter((f) => n(f.properties.bateria_h) < 4).length;
  return <>
    <Kpis items={[{ label: 'Células ativas', value: String(active.length), note: peak ? `máx. ${peak} mm/h` : 'sem chuva intensa' }, { label: 'Sites em risco', value: String(atRisk.length), tone: atRisk.length ? 'danger' : 'success', note: `${without} com bateria < 4 h` }, { label: 'Próximo impacto', value: soon[0] ? `${soon[0].properties.eta_impacto_min} min` : '—', tone: soon[0] ? 'warning' : undefined, note: soon[0] ? String(soon[0].properties.nome) : 'nenhum nas próximas 3 h' }, { label: 'Pontos de alagamento', value: String((layers.find((l) => l.name.startsWith('Pontos'))?.features ?? []).filter((f) => severity(f) >= 1).length), tone: 'warning', note: 'sob influência de células' }]} />
    <Section title="LINHA DO TEMPO" note="arraste o relógio abaixo"><div className="mb-clock-card"><b>{formatTime(undefined, time)}</b><span>{active.length ? active.map((x) => x.s.nome).join(' · ') : 'Céu sem células significativas'}</span><div><Button size="sm" onPress={() => onTime(14)}>14:00</Button><Button size="sm" onPress={() => onTime(17)}>17:00</Button><Button size="sm" onPress={() => onTime(20)}>20:00</Button></div></div></Section>
    <Section title="SITES POR TEMPO ATÉ O IMPACTO">{soon.length ? <Bars rows={soon.slice(0, 6).map((f) => ({ key: f.id, label: String(f.properties.nome), sub: `${f.properties.celula} · bateria ${f.properties.bateria_h} h · gerador ${String(f.properties.gerador).toLowerCase()}`, value: 180 - n(f.properties.eta_impacto_min), max: 180, color: COLORS[Math.max(1, severity(f))], text: n(f.properties.eta_impacto_min) ? `${f.properties.eta_impacto_min} min` : 'agora', onClick: () => sites && onPick(sites.id, f, 12) }))} /> : <p className="mb-helper">Nenhum site será atingido nas próximas três horas.</p>}</Section>
    <Section title="AÇÕES SUGERIDAS"><ul className="mb-actions">{atRisk.length ? [`Pré-posicionar equipes de energia na zona ${atRisk[0]!.properties.regiao}.`, without ? `Verificar geradores: ${without} site(s) com autonomia de bateria abaixo de 4 h.` : 'Autonomia de bateria adequada nos sites afetados.', 'Notificar clientes corporativos dos POPs sob influência de células fortes.'].map((a) => <li key={a}><Icon name="check" size={12} />{a}</li>) : <li><Icon name="check" size={12} />Sem ações preventivas necessárias neste horário.</li>}</ul>{atRisk[0] && <Button size="sm" icon="target" onPress={() => { const [lo, la] = centroid(atRisk[0]!); onFly(lo, la, 12); }}>Ver sites afetados</Button>}</Section>
  </>;
}

export function MapInsights(props: InsightProps) {
  const body = props.id === 'network' ? <NetworkInsights {...props} /> : props.id === 'theft' ? <TheftInsights {...props} /> : props.id === 'lights' ? <LightsInsights {...props} /> : props.id === 'incidents' ? <IncidentInsights {...props} />
    : props.id === 'coverage' ? <CoverageInsights {...props} /> : props.id === 'expansion' ? <ExpansionInsights {...props} /> : props.id === 'weather' ? <WeatherInsights {...props} /> : null;
  return <div className="mb-insights">{body}</div>;
}
