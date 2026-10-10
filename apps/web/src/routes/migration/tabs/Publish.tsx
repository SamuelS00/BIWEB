import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Banner, Button, Dialog, Icon } from '@biweb/ui';
import { readiness, useMig } from '../store';
import type { TabId } from '../store';
import { Progress } from '../ui';

export function Publish({ onGo }: { onGo: (t: TabId, sel?: string) => void }) {
  const st = useMig(), ps = st.cur(), r = readiness(ps), navigate = useNavigate(), [dlg, setDlg] = useState(false), [prev, setPrev] = useState(false);
  const rows: { label: string; ready: number; total: number; go?: TabId }[] = [{ label: 'Relatórios', ...r.reports, go: 'reconstruct' }, { label: 'Mapas', ...r.maps, go: 'reconstruct' }, { label: 'Fluxos de trabalho', ...r.workflows, go: 'reconstruct' }, { label: 'Modelos de dados', ...r.models, go: 'data' }];
  const ready = rows.reduce((a, x) => a + x.ready, 0), total = rows.reduce((a, x) => a + x.total, 0), allReady = ready === total && r.pending === 0;
  const link = (label: string, to: string, params: Record<string, string>) => <Button size="sm" onPress={() => { void navigate({ to, params } as never); }}>{label}</Button>;
  return <div className="ms-pub">
    {ps.published ? <Banner tone="success">Publicado no BIWEB como v{ps.version}. O Bridge Mode continua acompanhando a origem.</Banner> : !allReady ? <Banner tone="warning" action={<Button size="sm" onPress={() => onGo('validation')}>Abrir fila de revisão</Button>}>{r.pending} {r.pending === 1 ? 'item' : 'itens'} em revisão e {r.failed} comparações com falha. Você pode publicar só o que está pronto.</Banner> : null}
    <section className="ms-pub-head"><div><span className="ms-kind">{ps.published ? 'Publicado' : allReady ? 'Pronto para publicar' : 'Publicação parcial'}</span><h2>{ps.published ? `v${ps.version} no ar` : 'READY TO PUBLISH'}</h2></div><span className="flex-1" />
      <Button onPress={() => setPrev(!prev)} icon="eye">Preview</Button><Button variant="primary" icon="upload" isDisabled={ps.published || ready === 0} onPress={() => setDlg(true)}>{allReady ? 'Publish to BIWEB' : `Publicar ${ready} itens prontos`}</Button></section>
    <ul className="ms-ready">{rows.map((x) => <li key={x.label} className={x.ready === x.total ? 'is-ok' : ''}><span><b>{x.label}</b><Progress value={(x.ready / Math.max(1, x.total)) * 100} tone={x.ready === x.total ? 'success' : undefined} /></span><strong>{x.ready}/{x.total}</strong>{x.ready < x.total && x.go && <Button size="sm" variant="ghost" onPress={() => onGo(x.go!)}>Ver</Button>}</li>)}
      <li className={r.pending === 0 ? 'is-ok' : 'is-warn'}><span><b>Itens em revisão</b></span><strong>{r.pending}</strong>{r.pending > 0 && <Button size="sm" variant="ghost" onPress={() => onGo('validation')}>Decidir</Button>}</li></ul>
    {prev && <div className="ms-prev"><Icon name="info" size={12} />Prévia da publicação: {ps.excluded.length ? `${ps.excluded.length} itens fora do escopo ficam de fora. ` : ''}Ao publicar, os relatórios entram em Relatórios, os mapas em Mapas, os fluxos em Fluxos e os modelos em Dados. Nada é sobrescrito: cada item vira uma versão nova.</div>}
    {ps.published && <section className="ms-pub-links"><h3>Abrir no BIWEB</h3><div className="ms-row-actions">{link('Open Dashboard', '/reports/$reportId', { reportId: 'rpt_visao_executiva' })}{link('Open Map', '/maps/$mapId', { mapId: 'network' })}{link('Open Workflow', '/workflows/$workflowId', { workflowId: 'relatorio' })}{link('Open Data Model', '/models/$modelId', { modelId: 'sem_vendas_varejo' })}</div></section>}
    <Dialog title="Publicar no BIWEB" isOpen={dlg} onOpenChange={setDlg} footer={<><Button onPress={() => setDlg(false)}>Cancelar</Button><Button variant="primary" icon="check" onPress={() => { st.publish(); setDlg(false); }}>Publicar v{ps.version + 1}</Button></>}>
      <div className="ms-pub-dlg"><p>{ready} de {total} itens serão publicados como <b>v{ps.version + 1}</b>.{!allReady && ` ${total - ready} ficam fora até a revisão.`}</p><ul>{rows.map((x) => <li key={x.label}><Icon name="check" size={12} />{x.ready} {x.label.toLowerCase()}</li>)}</ul><p className="ms-hint">É reversível: a versão anterior continua no histórico. A origem não é alterada.</p></div></Dialog>
  </div>;
}
