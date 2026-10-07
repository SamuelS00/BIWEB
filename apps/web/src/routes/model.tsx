import { Badge, Banner, Button, FieldTypeIcon } from '@biweb/ui';
import { model } from '../fixtures/lume-varejo';

/** S07 · Modelo semântico: rascunho/publicado e catálogo de entidades e métricas. */
export function ModelPage() {
  return (
    <div className="pg">
      <header className="pg-head"><div><h1 className="pg-title">Vendas Varejo</h1><p className="pg-sub">Modelo semântico · publicado {model.published} · rascunho {model.draft}</p></div><span className="flex-1" /><Badge tone="warning">Rascunho {model.draft}</Badge><Button>Analisar impacto</Button><Button variant="primary">Publicar…</Button></header>
      <Banner tone="info">O diagrama do modelo (entidades e relações 1/*) está desenhado no protótipo em docs/design/prototype.</Banner>
      <div className="model-grid bw-stagger">
        <article className="home-card" style={{ ['--i' as string]: 0 }}>
          <h2 className="sec-title">Métricas</h2>
          <ul className="model-list">{model.metrics.map((m) => <li key={m.id}><FieldTypeIcon kind="metric" /><span>{m.name}</span><span className="flex-1" />{m.certified ? <Badge tone="success" icon="check">Certificada</Badge> : <Badge tone="warning">Rascunho</Badge>}</li>)}</ul>
        </article>
        {model.entities.map((e, i) => (
          <article key={e.id} className="home-card" style={{ ['--i' as string]: i + 1 }}>
            <h2 className="sec-title">{e.name}</h2>
            <ul className="model-list">{e.fields.map(([n, k]) => <li key={n}><FieldTypeIcon kind={k} /><span className={k === 'measure' ? 'bw-mono' : undefined}>{n}</span></li>)}</ul>
          </article>
        ))}
      </div>
    </div>
  );
}
