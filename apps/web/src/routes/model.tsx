import { useState, type DragEvent } from 'react';
import { Link } from '@tanstack/react-router';
import { Badge, Banner, Button, FieldTypeIcon, Icon, SegmentedControl } from '@biweb/ui';
import { model } from '../fixtures/lume-varejo';

/** Modelo semântico: diagrama, catálogo de medidas e fluxo draft → preview → impact → publish. */
export function ModelPage() {
  const [view, setView] = useState<'diagram' | 'lineage'>('diagram');
  const [expressionMode, setExpressionMode] = useState<'visual' | 'expression'>('visual');
  const [expression, setExpression] = useState('SUM(vendas_itens.valor_liquido)');
  const [preview, setPreview] = useState(false);
  const [impact, setImpact] = useState(false);
  const [published, setPublished] = useState(false);
  const [relation, setRelation] = useState('vendas_itens → produtos');
  const receiveEntity = (event: DragEvent<HTMLElement>, target: string) => { event.preventDefault(); const source = event.dataTransfer.getData('text/plain'); if (source && source !== target) { setRelation(`${source} → ${target}`); setPreview(false); } };
  return (
    <div className="pg model-page">
      <header className="pg-head"><div><h1 className="pg-title">Modelo semântico · Vendas Varejo</h1><p className="pg-sub">V{model.published} publicado · rascunho {model.draft} · alterações não afetam relatórios até publicar</p></div><span className="flex-1"/><Badge tone="warning">Rascunho v{model.draft}</Badge><Button icon="share" onPress={() => setImpact((v) => !v)}>Analisar impacto</Button><Button variant="primary" icon="check" onPress={() => setPublished(true)}>Publicar modelo</Button></header>
      {published && <Banner tone="success">Versão demonstrativa publicada. Relatórios dependentes: 4 · métricas atualizadas: 1.</Banner>}
      <div className="model-view-toolbar"><SegmentedControl label="Representação do modelo" value={view} onChange={setView} options={[{ id: 'diagram', label: 'Diagrama' }, { id: 'lineage', label: 'Lineage e impacto' }]} /><span className="bw-cap bw-muted">{view === 'diagram' ? 'Arraste uma relação para inspecionar e confirmar.' : 'Explore visualmente ou aja pela tabela filtrável.'}</span></div>
      {view === 'diagram' ? <div className="model-diagram-layout">
        <section className="model-diagram" aria-label="Diagrama do assunto Vendas">
          <div className="model-subject-label">Assunto · Vendas</div>
          <article draggable className="model-entity model-entity--orders" onDragStart={(e) => e.dataTransfer.setData('text/plain', 'vendas_pedidos')} onDragOver={(e) => e.preventDefault()} onDrop={(e) => receiveEntity(e, 'vendas_pedidos')}><header><Icon name="table" size={12}/><b>vendas_pedidos</b><small>42.381 linhas</small></header><span><Icon name="key" size={12}/> pedido_id</span><span>cliente_id</span><span>loja_id</span><span>data_pedido</span></article>
          <article draggable className="model-entity model-entity--items" onDragStart={(e) => e.dataTransfer.setData('text/plain', 'vendas_itens')} onDragOver={(e) => e.preventDefault()} onDrop={(e) => receiveEntity(e, 'vendas_itens')}><header><Icon name="table" size={12}/><b>vendas_itens</b><small>86.204 linhas</small></header><span><Icon name="key" size={12}/> item_id</span><span>pedido_id</span><span>produto_id</span><span>valor_liquido</span></article>
          <article draggable className="model-entity model-entity--products" onDragStart={(e) => e.dataTransfer.setData('text/plain', 'produtos')} onDragOver={(e) => e.preventDefault()} onDrop={(e) => receiveEntity(e, 'produtos')}><header><Icon name="table" size={12}/><b>produtos</b><small>2.164 linhas</small></header><span><Icon name="key" size={12}/> produto_id</span><span>categoria</span><span>marca</span><span>custo_unitario</span></article>
          <article draggable className="model-entity model-entity--customers" onDragStart={(e) => e.dataTransfer.setData('text/plain', 'clientes')} onDragOver={(e) => e.preventDefault()} onDrop={(e) => receiveEntity(e, 'clientes')}><header><Icon name="table" size={12}/><b>clientes</b><small>31.502 linhas</small></header><span><Icon name="key" size={12}/> cliente_id</span><span>segmento</span><span>estado</span></article>
          <svg className="model-links" viewBox="0 0 800 410" aria-hidden="true"><path d="M330 142 C350 142 350 210 370 210"/><path d="M550 210 C570 210 570 145 590 145"/><path d="M210 195 C215 260 595 275 590 300"/></svg>
          <button className="model-relation relation-one" onClick={() => setRelation('vendas_itens → vendas_pedidos')}>1 ─── *<small>pedido_id</small></button>
          <button className="model-relation relation-two" onClick={() => setRelation('vendas_itens → produtos')}>* ─── 1<small>produto_id</small></button>
          <button className="model-relation relation-three" onClick={() => setRelation('vendas_pedidos → clientes')}>* ─── 1<small>cliente_id</small></button>
        </section>
        <aside className="model-inspector"><span className="bw-label">Relação selecionada</span><h2>{relation}</h2><label>Campos correspondentes<select defaultValue="id"><option value="id">produto_id = produto_id</option></select></label><label>Cardinalidade<select defaultValue="many-one"><option value="many-one">Muitos para um (*:1)</option><option value="many-many">Muitos para muitos (*:*)</option></select></label><details><summary>Opções avançadas</summary><p>Integridade referencial: alguns registros correspondem.</p></details><Button size="sm" variant="primary" onPress={() => setPreview(true)}>Confirmar relação</Button>{preview && <small className="model-valid">Prévia validada · sem duplicação de linhas detectada.</small>}</aside>
      </div> : <div className="model-lineage-layout"><div className="model-lineage-graph"><span>Fonte · ERP</span><Icon name="arrowRight" size={16}/><span>Dataset · vendas_itens</span><Icon name="arrowRight" size={16}/><span>Métrica · Receita líquida</span><Icon name="arrowRight" size={16}/><span>Relatórios · 4</span></div><table className="bw-table w-full"><thead><tr><th>Entidade dependente</th><th>Tipo</th><th>Impacto</th><th>Estado</th></tr></thead><tbody>{[['Visão Executiva','Relatório','Direto · 2 widgets','Publicado'],['Receita por região','Relatório','Direto · 1 widget','Publicado'],['Margem por categoria','Métrica','2º grau · 3 relatórios','Rascunho'],['Operação diária','Relatório','4º grau · 1 página','Publicado']].map((r) => <tr key={r[0]}><td>{r[0]}</td>{r.slice(1).map((x) => <td key={x}>{x}</td>)}</tr>)}</tbody></table></div>}
      {impact && <Banner tone="warning" action={<Button size="sm" onPress={() => setImpact(false)}>Fechar impacto</Button>}>Impacto de publicação: 4 relatórios · 2 métricas derivadas · nenhuma dependência quebrada. Veja lineage para revisar cada entidade.</Banner>}
      <div className="model-lower-grid">
        <section className="home-card model-metrics"><div className="sec-head"><h2 className="sec-title">Métricas publicadas</h2><Button size="sm" icon="plus" onPress={() => { setPreview(false); setExpression('SUM(vendas_itens.valor_liquido)'); }}>Nova métrica</Button></div><ul className="model-list">{model.metrics.map((m) => <li key={m.id}><FieldTypeIcon kind="metric"/><span>{m.name}</span><span className="flex-1"/>{m.certified ? <Badge tone="success" icon="check">Certificada</Badge> : <Badge tone="warning">Rascunho</Badge>}</li>)}</ul></section>
        <section className="home-card model-expression"><div className="sec-head"><h2 className="sec-title">Receita líquida · editor de métrica</h2><SegmentedControl label="Editor da métrica" value={expressionMode} onChange={setExpressionMode} options={[{ id: 'visual', label: 'Visual' }, { id: 'expression', label: 'Expressão' }]} /></div>
          {expressionMode === 'visual' ? <div className="metric-visual-builder"><label>Função<select defaultValue="sum"><option value="sum">Somar</option><option value="avg">Média</option></select></label><label>Campo<select defaultValue="valor_liquido"><option value="valor_liquido">vendas_itens.valor_liquido</option><option value="custo_unitario">produtos.custo_unitario</option></select></label><span className="metric-formula">Resultado · Receita líquida = Soma de valor líquido</span></div> : <><textarea aria-label="Expressão da métrica" value={expression} onChange={(e) => setExpression(e.target.value)} /><small>Autocomplete · SUM · AVG · COUNT · campos do modelo</small></>}
          <div className="metric-preview"><span>Prévia da métrica</span><b>R$ 18,42 mi</b><small>42.381 pedidos · modelo semântico v{model.draft}</small></div><div className="metric-actions"><Button size="sm" onPress={() => setPreview(true)}>Validar e pré-visualizar</Button><Button size="sm" variant="primary" isDisabled={!preview} onPress={() => setImpact(true)}>Revisar impacto e publicar</Button></div>{preview && <p className="model-valid"><Icon name="check" size={12}/> Expressão válida · campo publicado · sem SQL no cliente.</p>}
        </section>
      </div>
      <p className="bw-cap bw-muted"><Link to="/connections" className="bw-link">Voltar a Dados e conexões</Link> · agregações disponíveis vêm de métricas publicadas no modelo semântico.</p>
    </div>
  );
}
