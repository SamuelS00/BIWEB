import { useParams } from '@tanstack/react-router';
import { useLibrary } from '../editor/library';
import { ReportView } from '../editor/ReportView';
import { ReportPage } from './report';
import { DemoReportView } from './demo-reports';
import { MapWorkspace } from './map-workspace';

/** Relatórios do workspace de rede são documentos do editor; os do Comercial (Lume Varejo) seguem no visualizador anterior. */
export function ReportRoute() {
  const { reportId } = useParams({ from: '/reports/$reportId' });
  const isDoc = useLibrary((s) => s.docs.some((d) => d.id === reportId));
  if (reportId === 'geo_dependency') return <MapWorkspace dependencyMode/>;
  if (reportId === 'geo_replay') return <MapWorkspace replay/>;
  if (reportId.startsWith('demo_')) return <DemoReportView id={reportId} />;
  return isDoc ? <ReportView id={reportId} /> : <ReportPage />;
}
