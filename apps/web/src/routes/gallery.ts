import { useMemo } from 'react';
import { coverFor } from '../editor/covers';
import { useLibrary } from '../editor/library';
import { ago } from '../editor/time';
import { coverUrl, reports as legacy } from '../fixtures/lume-varejo';
import { useUi } from '../state/ui-store';

/** Item da galeria, comum aos dois workspaces (documentos do editor e relatórios do Comercial). */
export interface GalleryItem {
  id: string; name: string; description: string; category: string; type: string; status: 'Publicado' | 'Rascunho' | 'Depreciado';
  version?: string; certified?: boolean; owner: string; updated: string; updatedOrder: number; cover: (small?: boolean) => string; views: number; origin?: 'copilot'; pages: number;
}
export const WORKSPACES = { rede: { label: 'Operações de Rede', company: 'Virtsel Telecom' }, comercial: { label: 'Comercial', company: 'Lume Varejo' } } as const;

export function useGallery(): GalleryItem[] {
  const ws = useUi((s) => s.workspace);
  const docs = useLibrary((s) => s.docs);
  const rede = docs.filter((d) => !d.datasets.includes('ds_vendas')), comercial = docs.filter((d) => d.datasets.includes('ds_vendas'));
  return useMemo(() => (ws === 'rede'
    ? [...rede.map((d) => ({ id: d.id, name: d.id === 'net_operacoes' ? 'Network Intelligence' : d.id === 'net_incidentes' ? 'Incident Intelligence' : d.id === 'net_gemeo' ? 'Street Intelligence 3D' : d.name, description: d.description, category: d.category, type: d.kind, status: d.status, version: d.version ? `v${d.version}` : undefined, certified: d.certified,
      owner: d.owner, updated: ago(d.updatedAt), updatedOrder: d.id === 'net_operacoes' ? -Infinity : -d.updatedAt, cover: (small?: boolean) => coverFor(d, small ? { width: 224, height: 126 } : undefined), views: d.views, origin: d.origin, pages: d.pages.length })), ...[
        { id: 'demo_anomaly', name: 'Anomaly Explorer', description: 'Desvios observados e esperados por região, serviço e janela temporal.', category: 'Confiabilidade', type: 'Relatório', status: 'Publicado' as const, owner: 'BIWEB Demo', updated: 'há 3 min', updatedOrder: -3, views: 328, pages: 3 },
        { id: 'demo_sla', name: 'SLA & Risk Monitor', description: 'SLOs, orçamento de erro, taxa de consumo e riscos de esgotamento.', category: 'Confiabilidade', type: 'Relatório', status: 'Publicado' as const, owner: 'BIWEB Demo', updated: 'há 8 min', updatedOrder: -8, views: 216, pages: 3 },
        { id: 'demo_customer', name: 'Customer Behavior', description: 'Jornada de onboarding, retenção por coorte e caminhos de ativação.', category: 'Experiência', type: 'Relatório', status: 'Publicado' as const, owner: 'BIWEB Demo', updated: 'há 12 min', updatedOrder: -12, views: 184, pages: 3 },
        { id: 'geo_dependency', name: 'Dependency & Impact', description: 'Visualize os ativos conectados, serviços dependentes e o raio de impacto de uma falha.', category: 'Engenharia', type: 'Mapa operacional', status: 'Publicado' as const, owner: 'BIWEB Demo', updated: 'há 15 min', updatedOrder: -15, views: 126, pages: 1 },
        { id: 'geo_replay', name: 'Historical Replay', description: 'Reconstrua estados, incidentes e utilização da rede no tempo.', category: 'Operações', type: 'Mapa operacional', status: 'Publicado' as const, owner: 'BIWEB Demo', updated: 'há 18 min', updatedOrder: -18, views: 91, pages: 1 },
      ].map((demo) => ({ ...demo, version: 'v1.0', certified: false, cover: (small?: boolean) => { const doc = docs.find((d) => d.id === 'net_operacoes') ?? docs[0]; return doc ? coverFor(doc, small ? { width: 224, height: 126 } : undefined) : ''; } }))]
    : [...comercial.map((d) => ({ id: d.id, name: d.name, description: d.description, category: d.category, type: d.kind, status: d.status, version: `v${d.version}`, certified: d.certified, owner: d.owner, updated: ago(d.updatedAt), updatedOrder: -d.updatedAt, cover: (small?: boolean) => coverFor(d, small ? { width: 224, height: 126 } : undefined), views: d.views, origin: d.origin, pages: d.pages.length })),
      ...legacy.map((r) => ({ ...r, version: r.version, cover: (small?: boolean) => coverUrl(r.cover, small), pages: r.pages.length }))]), [ws, docs]);
}
