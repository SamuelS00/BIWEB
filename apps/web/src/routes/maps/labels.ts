/** Friendly names and units for the properties shown in the Inspector; unknown fields fall back to their key. */
export const PROP_LABELS: Record<string, { label: string; unit?: string; money?: boolean }> = {
  atenuacao_a: { label: 'Atenuação A', unit: 'dB' }, atenuacao_b: { label: 'Atenuação B', unit: 'dB' }, margem: { label: 'Margem de potência', unit: 'dB' },
  extensao_km: { label: 'Extensão', unit: 'km' }, capacidade_gbps: { label: 'Capacidade', unit: 'Gbps' }, utilizacao_pct: { label: 'Utilização', unit: '%' }, latencia_ms: { label: 'Latência', unit: 'ms' }, fibras: { label: 'Fibras' },
  ultima_manutencao: { label: 'Última manutenção' }, potencia: { label: 'Potência' }, regiao: { label: 'Região' }, vencida: { label: 'SLA vencido' }, via: { label: 'Via' }, circuito: { label: 'Circuito' }, trafo: { label: 'Transformador' },
  tecnologia: { label: 'Tecnologia' }, fluxo_lm: { label: 'Fluxo luminoso', unit: 'lm' }, alcance_m: { label: 'Alcance', unit: 'm' }, lux_medido: { label: 'Luminância medida', unit: 'lux' }, instalacao: { label: 'Instalado em' },
  vida_util_pct: { label: 'Vida útil consumida', unit: '%' }, consumo_kwh_mes: { label: 'Consumo', unit: 'kWh/mês' }, falha: { label: 'Ocorrência' }, chamado: { label: 'Chamado' }, aberto_ha_h: { label: 'Aberto há', unit: 'h' },
  sla_h: { label: 'SLA de reparo', unit: 'h' }, custo_estimado: { label: 'Custo estimado', money: true }, bairro: { label: 'Bairro' }, postes: { label: 'Postes' }, falhas: { label: 'Postes em falha' }, potencia_kw: { label: 'Carga', unit: 'kW' },
  potencia_kva: { label: 'Potência', unit: 'kVA' }, carga_pct: { label: 'Carga', unit: '%' }, circuitos: { label: 'Circuitos' },
  rsrp_dbm: { label: 'RSRP', unit: 'dBm' }, ocupacao_prb: { label: 'Ocupação (PRB)', unit: '%' }, usuarios: { label: 'Usuários' }, qualidade: { label: 'Qualidade do sinal' }, azimute: { label: 'Azimute', unit: '°' }, alcance_km: { label: 'Alcance', unit: 'km' },
  torre: { label: 'Torre' }, altura_m: { label: 'Altura', unit: 'm' }, area_km2: { label: 'Área', unit: 'km²' }, clientes_afetados: { label: 'Clientes afetados' }, rsrp_medio: { label: 'RSRP médio', unit: 'dBm' }, canal: { label: 'Canal' },
  fase: { label: 'Fase' }, pct: { label: 'Avanço', unit: '%' }, licenca: { label: 'Licença' }, equipes: { label: 'Equipes' }, risco: { label: 'Risco' }, hp_previstos: { label: 'Homes passed previstos' }, capex_mil: { label: 'Capex', unit: 'mil R$' },
  inicio_semana: { label: 'Início (semana)' }, duracao_sem: { label: 'Duração', unit: 'semanas' }, atraso_sem: { label: 'Atraso', unit: 'semanas' }, viabilidade: { label: 'Viabilidade' }, taxa_adesao_prev: { label: 'Adesão prevista', unit: '%' }, km: { label: 'Extensão', unit: 'km' },
  chuva_mm_h: { label: 'Chuva', unit: 'mm/h' }, eta_impacto_min: { label: 'Impacto em', unit: 'min' }, celula: { label: 'Célula' }, bateria_h: { label: 'Autonomia de bateria', unit: 'h' }, gerador: { label: 'Gerador' }, historico: { label: 'Alagamentos no ano' }, vigencia: { label: 'Vigência' },
  horario: { label: 'Horário' }, delegacia: { label: 'Delegacia' }, reincidencias: { label: 'Reincidências' }, endereco: { label: 'Endereço' }, extensao_m: { label: 'Extensão afetada', unit: 'm' }, clientes: { label: 'Clientes' }, especialidade: { label: 'Especialidade' }, base: { label: 'Base' }, veiculo: { label: 'Veículo' },
};
export const HIDDEN_PROPS = new Set(['id', 'poste_id', 'nome', 'latitude', 'longitude', 'status', 'tom', 'fotocelula_min', 'potencia_w', 'centro', 'ocupacao_base', 'lon0', 'lat0', 'vx', 'vy', 'r0', 'growth', 'born', 'dies', 'peak', 'bloqueada', 'tipo', 'data']);
export function formatProp(key: string, value: unknown): string {
  const meta = PROP_LABELS[key];
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (value === '' || value == null) return '—';
  if (typeof value === 'number') { const s = Number.isInteger(value) ? value.toLocaleString('pt-BR') : value.toLocaleString('pt-BR', { maximumFractionDigits: 1 }); return meta?.money ? `R$ ${s}` : `${s}${meta?.unit ? ` ${meta.unit}` : ''}`; }
  return String(value);
}
export const propLabel = (key: string) => PROP_LABELS[key]?.label ?? key.replaceAll('_', ' ');
