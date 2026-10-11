/** Dados e estado locais de Missions, Watchlists e Changes (demonstrativos). Nada aqui é dado real. */
import { create } from 'zustand';
import { CHANGES, NOW } from './seed';
import { entityById, inWeek } from './derive';
import type { ChangeEvent, Frequency, Watchlist } from './types';

export interface MissionTemplate {
  id: string; name: string; tagline: string; inputs: string; monitors: string[]; outputs: string[]; objective: string; entities: string[]; discover: string[]; extract: string[]; frequency: Frequency; deliver: string[];
}
export const DISCOVER_OPTS = ['Official websites', 'Documentation', 'Pricing', 'Release notes', 'Open data', 'News', 'Regulatory sources', 'Public repositories'] as const;
export const EXTRACT_OPTS = ['Products', 'Features', 'Pricing', 'Integrations', 'Locations', 'Announcements', 'Technologies', 'Partnerships'] as const;
export const OUTPUT_OPTS = ['Discovery Dataset', 'Send enrichment proposals to LDE', 'Notify Copilot', 'Update dashboard', 'Trigger workflow'] as const;
export const FREQUENCIES: Frequency[] = ['One time', 'Daily', 'Weekly', 'Monthly'];
export const WATCH_MONITORS = ['Pricing', 'Products', 'Features', 'Release Notes', 'Documentation', 'Integrations', 'Announcements', 'Locations'] as const;

export const TEMPLATES: MissionTemplate[] = [
  { id: 'ci', name: 'Competitive Intelligence', tagline: 'Follow competitors across products, pricing and announcements.', inputs: 'Competitors', monitors: ['Products', 'Features', 'Pricing', 'Integrations', 'Partners', 'Locations', 'Announcements', 'Jobs', 'Documentation', 'Release notes'], outputs: ['Competitor profiles', 'Feature matrix', 'Change timeline', 'Evidence packs', 'Competitive dataset'],
    objective: 'Monitorar concorrentes de Business Intelligence.', entities: ['Power BI', 'Tableau', 'Qlik', 'Looker', 'Domo'], discover: ['Official websites', 'Documentation', 'Pricing', 'Release notes', 'News'], extract: ['Products', 'Features', 'Pricing', 'Integrations', 'Announcements'], frequency: 'Daily', deliver: ['Discovery Dataset', 'Notify Copilot', 'Update dashboard'] },
  { id: 'ce', name: 'Company Enrichment', tagline: 'Turn a CNPJ, name or domain into a verified public profile.', inputs: 'CNPJ, company name, domain', monitors: ['Official website', 'Industry', 'Locations', 'Products', 'Public info', 'Geographic context', 'Recent events'], outputs: ['Enrichment Proposal → LDE'],
    objective: 'Enriquecer clientes com dados públicos de empresas.', entities: ['Customer accounts'], discover: ['Official websites', 'Open data', 'News'], extract: ['Products', 'Locations', 'Announcements'], frequency: 'Weekly', deliver: ['Send enrichment proposals to LDE', 'Notify Copilot'] },
  { id: 'me', name: 'Market Exploration', tagline: 'Who operates in this market?', inputs: 'A market question', monitors: ['Organizations', 'Products', 'Locations', 'Relationships', 'Segments', 'Evidence'], outputs: ['Table', 'Map', 'Graph'],
    objective: 'Quem opera neste mercado?', entities: ['Market players'], discover: ['Official websites', 'News', 'Open data'], extract: ['Products', 'Locations', 'Partnerships'], frequency: 'Weekly', deliver: ['Discovery Dataset', 'Update dashboard'] },
  { id: 'fp', name: 'Find Public Data', tagline: 'Which public datasets can enrich Customer?', inputs: 'An entity or field', monitors: ['Source', 'Description', 'Fields', 'Coverage estimate', 'License', 'Access', 'Country', 'Freshness'], outputs: ['Public data catalog'],
    objective: 'Quais bases públicas podem enriquecer Customer?', entities: ['Customer'], discover: ['Open data', 'Regulatory sources'], extract: ['Locations', 'Technologies'], frequency: 'One time', deliver: ['Discovery Dataset', 'Send enrichment proposals to LDE'] },
  { id: 'ri', name: 'Regulatory Intelligence', tagline: 'Track regulations, deadlines and affected entities.', inputs: 'Regulators and topics', monitors: ['Regulatory websites', 'Official publications', 'Open data'], outputs: ['New regulations', 'Changes', 'Deadlines', 'Affected entities', 'Trigger Workflow'],
    objective: 'Acompanhar regulação do setor e prazos de conformidade.', entities: ['Anatel', 'ANPD'], discover: ['Regulatory sources', 'Official websites', 'Open data'], extract: ['Announcements'], frequency: 'Daily', deliver: ['Trigger workflow', 'Notify Copilot'] },
  { id: 'tl', name: 'Technology Landscape', tagline: 'Map technologies, vendors and projects.', inputs: 'Technologies or vendors', monitors: ['Technologies', 'Projects', 'Vendors', 'Public repositories', 'Documentation', 'Research', 'Integrations'], outputs: ['Technology landscape'],
    objective: 'Mapear tecnologias, projetos e fornecedores de plataformas de dados.', entities: ['Snowflake', 'PostgreSQL'], discover: ['Public repositories', 'Documentation', 'Release notes'], extract: ['Technologies', 'Integrations', 'Partnerships'], frequency: 'Weekly', deliver: ['Discovery Dataset', 'Update dashboard'] },
];

/** Rascunho transitório: o modelo escolhido na lista abre o assistente já preenchido. */
interface DraftS { templateId: string; setTemplate: (id: string) => void }
export const useMissionDraft = create<DraftS>((set) => ({ templateId: 'ci', setTemplate: (templateId) => set({ templateId }) }));

/** Entidades acrescentadas a watchlists nesta sessão (o store compartilhado só cria watchlists). */
interface WatchS { extra: Record<string, string[]>; add: (wid: string, eid: string) => void }
export const useWatchExtra = create<WatchS>((set) => ({ extra: {}, add: (wid, eid) => set((s) => ({ extra: { ...s.extra, [wid]: [...(s.extra[wid] ?? []), eid] } })) }));

export const watchEntityIds = (w: Watchlist, extra: Record<string, string[]>) => Array.from(new Set([...w.entityIds, ...(extra[w.id] ?? [])]));
/** Mudanças da semana de uma watchlist: pelas entidades seguidas; sem entidades, pela missão. */
export function watchChanges(w: Watchlist, extra: Record<string, string[]>, weekOnly = true): ChangeEvent[] {
  const ids = watchEntityIds(w, extra);
  return CHANGES.filter((c) => (weekOnly ? inWeek(c) : true) && (ids.length ? ids.includes(c.entityId) : c.missionId === w.missionId)).sort((a, b) => a.detectedMin - b.detectedMin);
}
export const entityName = (id: string) => entityById(id)?.name ?? id;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function shortDay(minAgo: number) { const d = new Date(NOW - minAgo * 60000); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`; }
export const CAT_FILTERS = ['All', 'Important', 'Pricing', 'Product', 'Documentation', 'News'] as const;
export type CatFilter = (typeof CAT_FILTERS)[number];
export const matchCat = (c: ChangeEvent, f: CatFilter) => f === 'All' || (f === 'Important' ? c.important : c.category === f);
export const glyphOf = (c: ChangeEvent) => (c.kind === 'Capability added' || c.kind === 'Integration added' ? '+' : c.kind === 'Feature removed' ? '−' : '~');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export { cap };

/** ResearchSpec em texto legível (bloco `ds-spec`). */
export function specText(s: import('./types').ResearchSpec) {
  return [`Objective: ${s.objective}`, `Entities: ${s.entities.join(', ')}`, `Sources: ${s.sources.join(', ')}`, `Extract: ${s.extract.join(', ')}`, `Frequency: ${s.frequency}`, `Deliver: ${s.deliver.replace(/_/g, ' ')}`,
    `Verify: minimum evidence ${s.minEvidence ?? 2} sources · preferred source ${s.preferredSource ?? 'Official'} · confidence threshold ${s.confidenceThreshold ?? 80}%`].join('\n');
}
