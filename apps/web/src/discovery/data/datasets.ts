/** Dados auxiliares demonstrativos dos Discovery Datasets: esquema, histórico de versões, locais e sugestões de handoff. Determinístico. */
import { CHANGES, ENTITIES } from './seed';
import type { MessageId } from '../../i18n/catalog';
import type { ResearchDataset } from './types';

export interface FieldRow { name: string; group: string; type: string; coverage: number; sources: number }

const GROUPS: Record<string, Record<string, string[]>> = {
  ds1: {
    Company: ['company_name', 'website', 'hq_city', 'hq_country', 'founded_year', 'employee_range', 'legal_entity'],
    Product: ['product_names', 'product_category', 'release_channel', 'latest_release', 'deprecated_features', 'is_cloud_native', 'deployment_models'],
    Pricing: ['pricing_plan', 'price_amount', 'price_unit', 'currency', 'has_free_tier', 'price_changed_at', 'pricing_page_url'],
    Capabilities: ['has_ai_assistant', 'has_realtime', 'has_embedded', 'has_self_service', 'semantic_layer', 'api_version', 'capability_notes'],
    Integrations: ['integration_snowflake', 'integration_postgres', 'integration_bigquery', 'integration_salesforce', 'integration_excel', 'connector_count', 'integration_list'],
    Presence: ['office_count', 'offices_brazil', 'regions_served', 'partner_count', 'last_announcement', 'announcement_url', 'last_confirmed_at'],
  },
  ds2: {
    Company: ['company_name', 'website', 'hq_city', 'hq_state', 'legal_entity', 'founded_year'],
    Services: ['service_names', 'fiber_monitoring', 'backhaul', 'ftth', 'dark_fiber', 'managed_wavelength', 'noc_24x7'],
    Network: ['route_km', 'regional_hubs', 'coverage_states', 'cities_served', 'latest_expansion', 'expansion_km'],
    Presence: ['location_count', 'location_type', 'latitude', 'longitude', 'address', 'last_confirmed_at'],
    Evidence: ['source_count', 'primary_source_url', 'evidence_ids', 'confidence_score', 'needs_review', 'license', 'attribution'],
  },
  ds3: { Regulation: ['regulation_id', 'title', 'issuer', 'published_at', 'effective_from', 'deadline', 'status', 'scope', 'penalty_range', 'summary', 'source_url', 'document_ref', 'last_confirmed_at', 'attribution'] },
  ds4: {
    Technology: ['technology_name', 'category', 'maturity', 'license', 'latest_version', 'release_date', 'repository_url'],
    Adoption: ['vendors_using', 'integration_count', 'is_open_source', 'community_size', 'trend', 'first_observed_at', 'last_confirmed_at'],
    Evidence: ['source_count', 'primary_source_url', 'evidence_ids', 'confidence_score', 'needs_review', 'attribution', 'notes', 'snapshot_id'],
  },
};
const typeOf = (n: string) => (/_(price|amount)$|^price_/.test(n) ? 'Currency' : /(_year|_count|_km|_at$|^route_km)/.test(n) ? (n.endsWith('_at') ? 'Date' : 'Integer') : /^(has_|is_|needs_|noc_|ftth|backhaul|dark_|fiber_|managed_)/.test(n) ? 'Boolean' : /(names|list|ids|states|regions|models)$/.test(n) ? 'List' : /(latitude|longitude)/.test(n) ? 'Decimal' : /url$/.test(n) ? 'URL' : 'Text');

export function schemaOf(d: ResearchDataset): FieldRow[] {
  const rows: FieldRow[] = [];
  const groups = GROUPS[d.id] ?? { Fields: [] };
  for (const [group, names] of Object.entries(groups)) for (const name of names) rows.push({ name, group, type: typeOf(name), coverage: 0, sources: 0 });
  while (rows.length < d.fields) rows.push({ name: `extra_field_${rows.length + 1}`, group: 'Other', type: 'Text', coverage: 0, sources: 0 });
  return rows.slice(0, d.fields).map((r, i) => ({ ...r, coverage: Math.max(52, Math.min(100, d.coverage + ((i * 37) % 17) - 7 + (r.group === 'Evidence' ? 5 : 0))), sources: 1 + ((i * 5) % 6) + (d.id === 'ds2' ? 2 : 0) }));
}

/** Rótulos de UI de grupo, tipo e tipo de local: ids literais por valor. */
export const GROUP_ID: Record<string, MessageId> = {
  Company: 'discovery.datasets.group.company', Product: 'discovery.datasets.group.product', Pricing: 'discovery.datasets.group.pricing', Capabilities: 'discovery.datasets.group.capabilities',
  Integrations: 'discovery.datasets.group.integrations', Presence: 'discovery.datasets.group.presence', Services: 'discovery.datasets.group.services', Network: 'discovery.datasets.group.network',
  Evidence: 'discovery.datasets.group.evidence', Regulation: 'discovery.datasets.group.regulation', Technology: 'discovery.datasets.group.technology', Adoption: 'discovery.datasets.group.adoption',
  Fields: 'discovery.datasets.group.fields', Other: 'discovery.datasets.group.other',
};
export const TYPE_ID: Record<string, MessageId> = {
  Currency: 'discovery.datasets.type.currency', Date: 'discovery.datasets.type.date', Integer: 'discovery.datasets.type.integer', Boolean: 'discovery.datasets.type.boolean',
  List: 'discovery.datasets.type.list', Decimal: 'discovery.datasets.type.decimal', URL: 'discovery.datasets.type.url', Text: 'discovery.datasets.type.text',
};
export const LOC_TYPE_ID: Record<string, MessageId> = { Headquarters: 'discovery.datasets.loc.hq', 'Regional hub': 'discovery.datasets.loc.hub' };

export const VERSION_NOTES: Record<string, MessageId[]> = {
  ds1: ['discovery.datasets.versions.ds1v1', 'discovery.datasets.versions.ds1v2', 'discovery.datasets.versions.ds1v3', 'discovery.datasets.versions.ds1v4'],
  ds2: ['discovery.datasets.versions.ds2v1', 'discovery.datasets.versions.ds2v2'],
  ds3: ['discovery.datasets.versions.ds3v1', 'discovery.datasets.versions.ds3v2', 'discovery.datasets.versions.ds3v3'],
  ds4: ['discovery.datasets.versions.ds4v1'],
};
export function versionsOf(d: ResearchDataset) {
  const notes = VERSION_NOTES[d.id] ?? [];
  return Array.from({ length: d.version }, (_, i) => ({ v: d.version - i, note: notes[d.version - 1 - i] ?? ('discovery.datasets.versions.minor' as MessageId), current: i === 0 })).map((r) => r);
}
export const changesOfDataset = (d: ResearchDataset) => CHANGES.filter((c) => c.missionId === d.missionId).sort((a, b) => a.detectedMin - b.detectedMin).slice(0, 5);

export interface LocRow { id: string; company: string; location: string; type: string; entityId: string; lastMin: number }
export function locationsOf(d: ResearchDataset): LocRow[] {
  if (!d.geo) return [];
  const f = ENTITIES.filter((e) => e.id.startsWith('f') && e.geo);
  const rows: LocRow[] = f.map((e) => ({ id: e.id, company: e.name, location: e.hq ?? '', type: 'Headquarters', entityId: e.id, lastMin: e.lastConfirmedMin }));
  const first = f[0];
  if (first) rows.push({ id: `${first.id}-hub`, company: first.name, location: 'Campinas, SP', type: 'Regional hub', entityId: first.id, lastMin: first.lastConfirmedMin });
  return rows;
}

export const REPORT_SUGGESTIONS: MessageId[] = ['discovery.datasets.report.s1', 'discovery.datasets.report.s2', 'discovery.datasets.report.s3', 'discovery.datasets.report.s4', 'discovery.datasets.report.s5'];
export const REPORT_CHAIN: MessageId[] = ['discovery.datasets.chain.r1', 'discovery.datasets.chain.r2', 'discovery.datasets.chain.r3', 'discovery.datasets.chain.r4', 'discovery.datasets.chain.r5'];
export const WORKFLOW_CHAIN: MessageId[] = ['discovery.datasets.chain.w1', 'discovery.datasets.chain.w2', 'discovery.datasets.chain.w3', 'discovery.datasets.chain.w4', 'discovery.datasets.chain.w5'];
