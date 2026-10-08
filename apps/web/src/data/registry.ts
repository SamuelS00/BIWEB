import { create } from 'zustand';
import { generateNetwork, historyOf, NOW, type Network } from '../net/generate';
import { buildVendasDataset } from './vendas';
import type { Dataset, Field, Table } from './types';

let net: Network | null = null;
/** Rede Metropolitana SP (gerada uma vez, determinística). */
export function network(): Network { return (net ??= generateNetwork()); }

const F = (name: string, label: string, kind: Field['kind'], format?: Field['format'], extra?: Partial<Field>): Field => ({ name, label, kind, format, ...extra });
const common = [
  F('status', 'Status', 'dimension', 'text', { description: 'normal · warning · critical · offline (pode ser alterado por regras)' }),
  F('capacidade', 'Capacidade', 'measure', 'gbps'), F('utilizacao', 'Utilização', 'measure', 'pct'), F('disponibilidade', 'Disponibilidade', 'measure', 'pct'),
  F('proprietario', 'Proprietário', 'dimension'), F('tecnologia', 'Tecnologia', 'dimension'), F('criticidade', 'Criticidade', 'dimension'), F('regiao', 'Região', 'geo'),
];

export function buildNetworkDataset(id = 'ds_rede_sp', name = 'Rede Metropolitana SP', imported = false): Dataset {
  const n = network();
  const tables: Table[] = [
    { id: 'enlaces', name: 'Enlaces', description: 'Segmentos de fibra e rádio entre nós', key: 'id', geometry: 'line', rows: n.links as unknown as Table['rows'],
      fields: [F('id', 'ID do enlace', 'dimension'), F('nome', 'Nome', 'dimension'), F('tipo', 'Tipo', 'dimension'), F('camada', 'Camada', 'dimension'), ...common,
        F('atenuacao_dB', 'Atenuação', 'measure', 'db'), F('extensao_km', 'Extensão', 'measure', 'km'), F('fibras', 'Fibras', 'measure', 'int'),
        F('origem', 'Origem', 'dimension'), F('destino', 'Destino', 'dimension'), F('lat', 'Latitude', 'geo', 'dec', { hidden: true }), F('lon', 'Longitude', 'geo', 'dec', { hidden: true }), F('geometria', 'Geometria', 'geo', 'text', { hidden: true })] },
    { id: 'nos', name: 'Nós', description: 'POPs, torres e equipamentos', key: 'id', geometry: 'point', rows: n.nodes as unknown as Table['rows'],
      fields: [F('id', 'ID do nó', 'dimension'), F('nome', 'Nome', 'dimension'), F('tipo', 'Tipo', 'dimension'), F('subtipo', 'Subtipo', 'dimension'), ...common,
        F('altura_m', 'Altura', 'measure', 'int'), F('alarmes', 'Alarmes ativos', 'measure', 'int'), F('pai', 'Instalado em', 'dimension'), F('lat', 'Latitude', 'geo', 'dec', { hidden: true }), F('lon', 'Longitude', 'geo', 'dec', { hidden: true })] },
    { id: 'regioes', name: 'Regiões', description: '42 regiões operacionais (bairros e municípios)', key: 'nome', geometry: 'polygon', rows: n.regions as unknown as Table['rows'],
      fields: [F('nome', 'Região', 'geo'), F('municipio', 'Município', 'dimension'), F('clientes', 'Clientes', 'measure', 'int'), F('poligono', 'Polígono', 'geo', 'text', { hidden: true })] },
    { id: 'rotas', name: 'Rotas', description: '18 rotas lógicas entre POPs', key: 'id', geometry: 'line',
      rows: n.routes.map((r) => ({ ...r, saltos: r.enlaces.length, com_desvio: r.desvio ? 'Sim' : 'Não' })),
      fields: [F('id', 'ID da rota', 'dimension'), F('nome', 'Rota', 'dimension'), F('origem', 'Origem', 'dimension'), F('destino', 'Destino', 'dimension'), F('status', 'Status', 'dimension'),
        F('distancia_km', 'Distância', 'measure', 'km'), F('latencia_ms', 'Latência', 'measure', 'ms'), F('disponibilidade', 'Disponibilidade', 'measure', 'pct'), F('saltos', 'Saltos', 'measure', 'int'), F('com_desvio', 'Com desvio', 'dimension')] },
    { id: 'eventos', name: 'Eventos', description: 'Ocorrências dos últimos 30 dias', key: 'id', geometry: 'point', rows: n.events.map((e) => ({ ...e, data: e.ts, situacao: e.resolvido ? 'Resolvido' : 'Ativo' })),
      fields: [F('id', 'ID do evento', 'dimension'), F('data', 'Data', 'date', 'datetime'), F('tipo', 'Tipo de evento', 'dimension'), F('elementoNome', 'Elemento', 'dimension'), F('severidade', 'Severidade', 'dimension'),
        F('regiao', 'Região', 'geo'), F('duracao_min', 'Duração (min)', 'measure', 'int'), F('situacao', 'Situação', 'dimension'), F('lat', 'Latitude', 'geo', 'dec', { hidden: true }), F('lon', 'Longitude', 'geo', 'dec', { hidden: true })] },
    { id: 'historico', name: 'Histórico diário', description: 'Utilização, atenuação e disponibilidade por enlace, 30 dias', key: 'dia',
      rows: n.links.flatMap((l) => historyOf(l.id, l).map((h) => ({ ...h, enlace: l.id, regiao: l.regiao, camada: l.camada, tecnologia: l.tecnologia }))),
      fields: [F('dia', 'Dia', 'date', 'date'), F('enlace', 'Enlace', 'dimension'), F('regiao', 'Região', 'geo'), F('camada', 'Camada', 'dimension'), F('tecnologia', 'Tecnologia', 'dimension'),
        F('utilizacao', 'Utilização', 'measure', 'pct'), F('atenuacao_dB', 'Atenuação', 'measure', 'db'), F('disponibilidade', 'Disponibilidade', 'measure', 'pct')] },
  ];
  return {
    id, name, imported, owner: 'Paula Teixeira', certified: !imported,
    description: imported ? 'Importado de rede_sp.kmz — nós, enlaces, regiões e rotas da rede metropolitana.' : 'Inventário e operação da rede metropolitana: nós, enlaces, regiões, rotas, eventos e histórico.',
    source: imported ? { kind: 'KMZ', label: 'rede_sp.kmz', refreshedAt: Date.now(), schedule: 'Manual' } : { kind: 'PostgreSQL', label: 'inventario_rede · netops-db', refreshedAt: NOW - 14 * 60_000, schedule: 'A cada 15 min' },
    tables,
    relationships: [
      { from: 'enlaces.origem', to: 'nos.id', label: 'Enlace → nó de origem' }, { from: 'enlaces.destino', to: 'nos.id', label: 'Enlace → nó de destino' },
      { from: 'nos.regiao', to: 'regioes.nome', label: 'Nó → região' }, { from: 'enlaces.regiao', to: 'regioes.nome', label: 'Enlace → região' },
      { from: 'eventos.elemento', to: 'enlaces.id', label: 'Evento → enlace' }, { from: 'historico.enlace', to: 'enlaces.id', label: 'Histórico → enlace' },
      { from: 'rotas.origem', to: 'nos.id', label: 'Rota → POP de origem' },
    ],
  };
}

const IMPORTED_KEY = 'biweb.importedDatasets';
const readImported = (): string[] => { try { return JSON.parse(localStorage.getItem(IMPORTED_KEY) ?? '[]') as string[]; } catch { return []; } };

interface DataState { datasets: Dataset[]; addImported: (name: string) => Dataset }
const cache = new Map<string, Dataset>();
const vendas = () => { if (!cache.has('ds_vendas')) cache.set('ds_vendas', buildVendasDataset()); return cache.get('ds_vendas')!; };
const mk = (id: string, name: string, imported: boolean) => { if (!cache.has(id)) cache.set(id, buildNetworkDataset(id, name, imported)); return cache.get(id)!; };

export const useData = create<DataState>((set, get) => ({
  datasets: [mk('ds_rede_sp', 'Rede Metropolitana SP', false), vendas(), ...readImported().map((n, i) => mk(`ds_import_${i + 1}`, n, true))],
  addImported: (name) => {
    const list = readImported();
    const ds = mk(`ds_import_${list.length + 1}`, name, true);
    try { localStorage.setItem(IMPORTED_KEY, JSON.stringify([...list, name])); } catch { /* sem armazenamento */ }
    set({ datasets: [...get().datasets, ds] });
    return ds;
  },
}));

export const getDataset = (id: string) => useData.getState().datasets.find((d) => d.id === id) ?? useData.getState().datasets[0]!;
export const getTable = (ds: string, t: string) => { const d = getDataset(ds); return d.tables.find((x) => x.id === t) ?? d.tables[0]!; };
export const getField = (ds: string, t: string, f: string) => getTable(ds, t).fields.find((x) => x.name === f);
