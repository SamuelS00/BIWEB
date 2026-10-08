import { rng } from '../routes/maps/base';
import type { Dataset, Field, Row, Table } from './types';

/**
 * Lume Varejo · Vendas: 24 months of daily revenue by region, channel and category, store-level monthly
 * results (with a Region › State › City › Store hierarchy) and a customer base. Deterministic.
 */
const DAY = 86_400_000;
export const VENDAS_END = Date.UTC(2026, 9, 6);
const START = VENDAS_END - 729 * DAY;
export const REGIOES = [
  { nome: 'Sudeste', peso: .42, estados: [['SP', 'São Paulo', -23.55, -46.63], ['RJ', 'Rio de Janeiro', -22.91, -43.17], ['MG', 'Belo Horizonte', -19.92, -43.94], ['ES', 'Vitória', -20.32, -40.34]] },
  { nome: 'Sul', peso: .18, estados: [['PR', 'Curitiba', -25.43, -49.27], ['RS', 'Porto Alegre', -30.03, -51.22], ['SC', 'Florianópolis', -27.6, -48.55]] },
  { nome: 'Nordeste', peso: .22, estados: [['BA', 'Salvador', -12.97, -38.51], ['PE', 'Recife', -8.05, -34.88], ['CE', 'Fortaleza', -3.73, -38.52]] },
  { nome: 'Centro-Oeste', peso: .1, estados: [['DF', 'Brasília', -15.79, -47.88], ['GO', 'Goiânia', -16.68, -49.25]] },
  { nome: 'Norte', peso: .08, estados: [['PA', 'Belém', -1.46, -48.5], ['AM', 'Manaus', -3.12, -60.02]] },
] as const;
export const CANAIS = [{ nome: 'Loja física', peso: .5, cresc: .04 }, { nome: 'E-commerce', peso: .35, cresc: .26 }, { nome: 'Marketplace', peso: .15, cresc: .31 }] as const;
export const CATEGORIAS = [{ nome: 'Eletrônicos', peso: .34, margem: .19 }, { nome: 'Casa e decoração', peso: .24, margem: .31 }, { nome: 'Moda', peso: .26, margem: .42 }, { nome: 'Beleza', peso: .16, margem: .38 }] as const;
const SEASON = [.86, .82, .9, .93, 1.02, .96, .94, .97, 1, 1.05, 1.34, 1.52]; // Jan..Dez
const WEEKDAY = [.9, .94, .96, 1, 1.04, 1.18, 1.1]; // Dom..Sáb

const F = (name: string, label: string, kind: Field['kind'], format?: Field['format'], extra?: Partial<Field>): Field => ({ name, label, kind, format, ...extra });

function buildVendas(): Row[] {
  const r = rng(2026), rows: Row[] = [], total = 730;
  let id = 1;
  for (let d = 0; d < total; d++) {
    const ts = START + d * DAY, dt = new Date(ts), month = dt.getUTCMonth(), dow = dt.getUTCDay(), year = d / 365;
    const bf = dt.getUTCMonth() === 10 && dt.getUTCDate() >= 24 && dt.getUTCDate() <= 30 ? 1.55 : 1;
    for (const reg of REGIOES) for (const can of CANAIS) for (const cat of CATEGORIAS) {
      const base = 1_950_000 * reg.peso * can.peso * cat.peso * (1 + can.cresc * year) * (1 + .03 * year) * SEASON[month]! * WEEKDAY[dow]! * bf * (can.nome === 'E-commerce' && dow === 1 ? 1.08 : 1);
      const noise = 1 + (r() - .5) * .22, receita = Math.round(base * noise);
      const meta = Math.round(base * 1.04 * (1 + (year > .5 ? .01 : 0)));
      const mgPct = cat.margem * (1 + (r() - .5) * .16) - (can.nome === 'Marketplace' ? .035 : 0) + (can.nome === 'Loja física' ? .01 : 0);
      const ticket = (cat.nome === 'Eletrônicos' ? 640 : cat.nome === 'Casa e decoração' ? 310 : cat.nome === 'Moda' ? 190 : 120) * (1 + (r() - .5) * .1);
      const pedidos = Math.max(1, Math.round(receita / ticket));
      rows.push({ id: id++, data: ts, regiao: reg.nome, canal: can.nome, categoria: cat.nome, receita, meta, margem: Math.round(receita * mgPct), custo: Math.round(receita * (1 - mgPct)), pedidos, itens: Math.round(pedidos * (1.6 + r() * .5)) });
    }
  }
  return rows;
}
function buildLojas(): Row[] {
  const r = rng(77), rows: Row[] = [], lojas: { loja: string; cidade: string; uf: string; regiao: string; lat: number; lon: number; porte: number; m2: number }[] = [];
  let n = 1;
  for (const reg of REGIOES) for (const [uf, cidade, lat, lon] of reg.estados) {
    const count = Math.max(2, Math.round(reg.peso * 60 / reg.estados.length * (uf === 'SP' ? 1.6 : 1)));
    for (let i = 0; i < count; i++) lojas.push({ loja: `Lume ${cidade.split(' ')[0]} ${String(n++).padStart(2, '0')}`, cidade, uf, regiao: reg.nome, lat: lat + (r() - .5) * .22, lon: lon + (r() - .5) * .22, porte: .5 + r() * 1.1, m2: Math.round(600 + r() * 2400) });
  }
  let id = 1;
  for (let m = 0; m < 24; m++) {
    const ts = Date.UTC(2024, 9 + m, 1), month = new Date(ts).getUTCMonth(), growth = 1 + .04 * (m / 12);
    for (const l of lojas) {
      const base = 3_200_000 * l.porte * SEASON[month]! * growth, receita = Math.round(base * (1 + (r() - .5) * .2)), meta = Math.round(base * 1.05), mg = .27 + (r() - .5) * .08;
      rows.push({ id: id++, data: ts, loja: l.loja, cidade: l.cidade, estado: l.uf, regiao: l.regiao, receita, meta, margem: Math.round(receita * mg), pedidos: Math.round(receita / (260 + r() * 60)), area_m2: l.m2, lat: l.lat, lon: l.lon });
    }
  }
  return rows;
}
const SEGMENTOS = ['Campeões', 'Leais', 'Potenciais', 'Em risco', 'Hibernando'] as const;
function buildClientes(): Row[] {
  const r = rng(515), rows: Row[] = [];
  for (let i = 0; i < 2600; i++) {
    const seg = SEGMENTOS[Math.min(4, Math.floor(r() ** 1.4 * 5))]!, k = SEGMENTOS.indexOf(seg);
    const freq = Math.max(1, Math.round([14, 8, 4, 5, 2][k]! * (.6 + r() * .9))), rec = Math.round([6, 22, 40, 120, 260][k]! * (.4 + r() * 1.3)), ticket = Math.round((120 + r() * 420) * (k < 2 ? 1.25 : 1));
    const reg = REGIOES[Math.floor(r() * 5 * (r() < .45 ? .4 : 1))]!, can = r() < .45 ? 'E-commerce' : r() < .75 ? 'Loja física' : 'Marketplace';
    rows.push({ id: i + 1, segmento: seg, regiao: reg.nome, canal: can, coorte: Date.UTC(2024, 9 + Math.floor(r() * 24), 1), recencia_dias: rec, frequencia: freq, ticket_medio: ticket, valor_total: freq * ticket, idade: Math.round(19 + r() ** .8 * 52), nps: Math.round(Math.max(-100, Math.min(100, [62, 48, 25, -12, -30][k]! + (r() - .5) * 70))), prob_churn: Math.round(Math.max(1, Math.min(99, [6, 14, 30, 68, 84][k]! + (r() - .5) * 26))) });
  }
  return rows;
}
const DRE_LINES = ['Receita bruta', 'Deduções', 'Receita líquida', 'CMV', 'Despesas comerciais', 'Despesas administrativas', 'Logística', 'EBITDA'] as const;
function buildDre(): Row[] {
  const r = rng(909), rows: Row[] = []; let id = 1;
  for (let m = 0; m < 24; m++) {
    const ts = Date.UTC(2024, 9 + m, 1), month = new Date(ts).getUTCMonth(), bruta = 61_000_000 * SEASON[month]! * (1 + .045 * m / 12) * (1 + (r() - .5) * .04);
    const ded = -bruta * .162, liq = bruta + ded, cmv = -liq * (.585 + (r() - .5) * .02), com = -liq * .105, adm = -liq * (.062 + (r() - .5) * .006), log = -liq * .046, ebitda = liq + cmv + com + adm + log;
    const vals = [bruta, ded, liq, cmv, com, adm, log, ebitda];
    DRE_LINES.forEach((linha, i) => rows.push({ id: id++, data: ts, ano: String(new Date(ts).getUTCFullYear()), trimestre: `T${Math.floor(month / 3) + 1}/${String(new Date(ts).getUTCFullYear()).slice(2)}`, linha, ordem: i, valor: Math.round(vals[i]!), orcado: Math.round(vals[i]! * (i === 7 ? 1.06 : i === 3 || i > 3 ? .985 : 1.03)), total: i === 2 || i === 7 || i === 0 ? 'Sim' : 'Não' }));
  }
  return rows;
}

export function buildVendasDataset(): Dataset {
  const vendas = buildVendas();
  const money = (name: string, label: string, extra?: Partial<Field>) => F(name, label, 'measure', 'brl', extra);
  const tables: Table[] = [
    { id: 'vendas', name: 'Vendas diárias', description: 'Receita, meta, margem e pedidos por dia, região, canal e categoria', key: 'id', rows: vendas,
      fields: [F('id', 'ID', 'dimension', 'int', { hidden: true }), F('data', 'Data', 'date', 'date', { description: 'Dia da venda · agrupe por mês, trimestre ou ano' }), F('regiao', 'Região', 'geo'), F('canal', 'Canal', 'dimension'), F('categoria', 'Categoria', 'dimension'),
        money('receita', 'Receita'), money('meta', 'Meta de receita'), money('margem', 'Margem bruta'), money('custo', 'Custo'), F('pedidos', 'Pedidos', 'measure', 'int'), F('itens', 'Itens vendidos', 'measure', 'int'),
        F('margem_pct', 'Margem %', 'measure', 'pct', { calc: { num: 'margem', den: 'receita', scale: 100 }, description: 'Calculado: margem ÷ receita' }),
        F('ticket_medio', 'Ticket médio', 'measure', 'brl', { calc: { num: 'receita', den: 'pedidos' }, description: 'Calculado: receita ÷ pedidos' }),
        F('atingimento', 'Atingimento da meta', 'measure', 'pct', { calc: { num: 'receita', den: 'meta', scale: 100 }, description: 'Calculado: receita ÷ meta' })] },
    { id: 'lojas', name: 'Lojas · resultado mensal', description: '60 lojas por mês, com hierarquia Região › Estado › Cidade › Loja', key: 'id', geometry: 'point', rows: buildLojas(),
      fields: [F('id', 'ID', 'dimension', 'int', { hidden: true }), F('data', 'Mês', 'date', 'month'), F('regiao', 'Região', 'geo', undefined, { hierarchy: 'geo' }), F('estado', 'Estado', 'geo', undefined, { hierarchy: 'geo' }), F('cidade', 'Cidade', 'geo', undefined, { hierarchy: 'geo' }), F('loja', 'Loja', 'dimension', undefined, { hierarchy: 'geo' }),
        money('receita', 'Receita'), money('meta', 'Meta de receita'), money('margem', 'Margem bruta'), F('pedidos', 'Pedidos', 'measure', 'int'), F('area_m2', 'Área (m²)', 'measure', 'int'),
        F('margem_pct', 'Margem %', 'measure', 'pct', { calc: { num: 'margem', den: 'receita', scale: 100 } }), F('atingimento', 'Atingimento da meta', 'measure', 'pct', { calc: { num: 'receita', den: 'meta', scale: 100 } }),
        F('lat', 'Latitude', 'geo', 'dec', { hidden: true }), F('lon', 'Longitude', 'geo', 'dec', { hidden: true })] },
    { id: 'clientes', name: 'Clientes', description: '2.600 clientes com recência, frequência e valor (RFM)', key: 'id', rows: buildClientes(),
      fields: [F('id', 'ID do cliente', 'dimension', 'int'), F('segmento', 'Segmento', 'dimension'), F('regiao', 'Região', 'geo'), F('canal', 'Canal de aquisição', 'dimension'), F('coorte', 'Coorte (mês de entrada)', 'date', 'month'),
        F('recencia_dias', 'Recência (dias)', 'measure', 'int'), F('frequencia', 'Frequência', 'measure', 'int'), money('ticket_medio', 'Ticket médio'), money('valor_total', 'Valor total'), F('idade', 'Idade', 'measure', 'int'), F('nps', 'NPS', 'measure', 'int'), F('prob_churn', 'Prob. de churn', 'measure', 'pct')] },
    { id: 'dre', name: 'DRE gerencial', description: 'Demonstração de resultado mensal, realizado e orçado', key: 'id', rows: buildDre(),
      fields: [F('id', 'ID', 'dimension', 'int', { hidden: true }), F('data', 'Mês', 'date', 'month'), F('linha', 'Linha da DRE', 'dimension'), F('ordem', 'Ordem', 'dimension', 'int', { hidden: true }), money('valor', 'Realizado'), money('orcado', 'Orçado'), F('total', 'É subtotal', 'dimension'), F('ano', 'Ano', 'dimension'), F('trimestre', 'Trimestre', 'dimension'),
        money('variacao', 'Variação vs orçado', { calc: { num: 'valor', den: 'orcado', op: 'diff' }, description: 'Calculado: realizado − orçado' }), F('variacao_pct', 'Variação %', 'measure', 'pct', { calc: { num: 'valor', den: 'orcado', scale: 100, offset: -100 }, description: 'Calculado: realizado ÷ orçado − 1' })] },
  ];
  return {
    id: 'ds_vendas', name: 'Lume Varejo · Vendas', description: 'Receita, margem, metas, lojas, clientes e DRE de uma rede de varejo omnichannel.', owner: 'Marina Costa', certified: true,
    source: { kind: 'PostgreSQL', label: 'dw_varejo · analytics-db', refreshedAt: VENDAS_END + 5 * 3600_000, schedule: 'Diário às 06:00' },
    tables,
    relationships: [{ from: 'lojas.regiao', to: 'vendas.regiao', label: 'Loja → região' }, { from: 'clientes.regiao', to: 'vendas.regiao', label: 'Cliente → região' }, { from: 'clientes.canal', to: 'vendas.canal', label: 'Cliente → canal' }],
  };
}
export const DRE_ORDER = DRE_LINES as readonly string[];
