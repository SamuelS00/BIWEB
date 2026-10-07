import { useMemo } from 'react';
import { coverFor } from '../editor/covers';
import { useLibrary } from '../editor/library';
import { ago } from '../editor/ReportView';
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
  return useMemo(() => (ws === 'rede'
    ? docs.map((d) => ({ id: d.id, name: d.name, description: d.description, category: d.category, type: d.kind, status: d.status, version: d.version ? `v${d.version}` : undefined, certified: d.certified,
      owner: d.owner, updated: ago(d.updatedAt), updatedOrder: -d.updatedAt, cover: (small?: boolean) => coverFor(d, small ? { width: 224, height: 126 } : undefined), views: d.views, origin: d.origin, pages: d.pages.length }))
    : legacy.map((r) => ({ ...r, version: r.version, cover: (small?: boolean) => coverUrl(r.cover, small), pages: r.pages.length }))), [ws, docs]);
}
