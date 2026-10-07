import { Badge, Banner, Button } from '@biweb/ui';
import { model } from '../fixtures/lume-varejo';

/** S07 · Modelo semântico: barra de rascunho/publicado. Diagrama: épico do editor de modelo (Fase 1–3). */
export function ModelPage() {
  return (
    <div style={{ minHeight: '100%' }}>
      <div className="flex items-center gap-2 px-3 bg-surface-app" style={{ height: 40, borderBottom: '1px solid var(--border-subtle)' }}>
        <Badge tone="warning">Rascunho {model.draft}</Badge><span className="bw-cap bw-secondary">Publicado: {model.published} · alterações só valem após publicar</span>
        <span className="flex-1" /><Button>Analisar impacto</Button><Button variant="primary">Publicar…</Button>
      </div>
      <div className="p-6"><Banner tone="info">O diagrama do modelo (ModelEntityCard, relações 1/*) está desenhado em docs/design/components e no protótipo.</Banner></div>
    </div>
  );
}
