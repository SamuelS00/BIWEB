import { Navigate, useNavigate, useParams } from '@tanstack/react-router';
import { MapBuilder } from './maps/MapBuilder';
import { REPORTS } from './maps/model';
import type { ReportId } from './maps/model';

/** `/maps/:mapId` — the shared workspace. Switching maps inside it only rewrites the address. */
export function MapRoute() {
  const { mapId } = useParams({ from: '/maps/$mapId' });
  const navigate = useNavigate();
  if (!REPORTS.some((r) => r.id === mapId)) return <Navigate to="/maps" replace />;
  return <MapBuilder initial={mapId as ReportId} onNavigate={(next) => { void navigate({ to: '/maps/$mapId', params: { mapId: next }, replace: true }); }} />;
}
