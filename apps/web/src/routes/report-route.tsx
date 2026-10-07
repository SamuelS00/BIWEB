import { useParams } from '@tanstack/react-router';
import { useLibrary } from '../editor/library';
import { ReportView } from '../editor/ReportView';
import { ReportPage } from './report';

/** Relatórios do workspace de rede são documentos do editor; os do Comercial (Lume Varejo) seguem no visualizador anterior. */
export function ReportRoute() {
  const { reportId } = useParams({ from: '/reports/$reportId' });
  const isDoc = useLibrary((s) => s.docs.some((d) => d.id === reportId));
  return isDoc ? <ReportView id={reportId} /> : <ReportPage />;
}
