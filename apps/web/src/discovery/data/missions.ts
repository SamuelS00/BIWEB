/** Dados e estado locais de Missions, Watchlists e Changes (demonstrativos). Nada aqui é dado real. */
import { create } from 'zustand';
import { CHANGES, NOW } from './seed';
import { entityById, inWeek } from './derive';
import type { MessageId } from '../../i18n/catalog';
import { activeLocale, tx } from './tx';
import type { ChangeEvent, Frequency, Watchlist } from './types';

/** Termos de UI (fontes, extrações, monitores): ids do catálogo; o valor guardado na ResearchSpec continua sendo o token em inglês. */
/* Ids literais (o teste de chaves mortas procura cada id como string neste arquivo). */
const TERM = {
  officialWebsites: 'discovery.missions.term.officialWebsites', officialWebsite: 'discovery.missions.term.officialWebsite', documentation: 'discovery.missions.term.documentation', pricing: 'discovery.missions.term.pricing',
  releaseNotes: 'discovery.missions.term.releaseNotes', openData: 'discovery.missions.term.openData', news: 'discovery.missions.term.news', regulatorySources: 'discovery.missions.term.regulatorySources',
  publicRepositories: 'discovery.missions.term.publicRepositories', publicApi: 'discovery.missions.term.publicApi', officialPublications: 'discovery.missions.term.officialPublications', research: 'discovery.missions.term.research',
  government: 'discovery.missions.term.government', products: 'discovery.missions.term.products', features: 'discovery.missions.term.features', integrations: 'discovery.missions.term.integrations', locations: 'discovery.missions.term.locations',
  announcements: 'discovery.missions.term.announcements', technologies: 'discovery.missions.term.technologies', partnerships: 'discovery.missions.term.partnerships', website: 'discovery.missions.term.website', industry: 'discovery.missions.term.industry',
  headquarters: 'discovery.missions.term.headquarters', newRegulations: 'discovery.missions.term.newRegulations', deadlines: 'discovery.missions.term.deadlines', affectedEntities: 'discovery.missions.term.affectedEntities',
  vendors: 'discovery.missions.term.vendors', fields: 'discovery.missions.term.fields', license: 'discovery.missions.term.license', freshness: 'discovery.missions.term.freshness', coverage: 'discovery.missions.term.coverage',
  jobs: 'discovery.missions.term.jobs', partners: 'discovery.missions.term.partners', organizations: 'discovery.missions.term.organizations', relationships: 'discovery.missions.term.relationships', segments: 'discovery.missions.term.segments',
  evidence: 'discovery.missions.term.evidence', projects: 'discovery.missions.term.projects', source: 'discovery.missions.term.source', description: 'discovery.missions.term.description', coverageEstimate: 'discovery.missions.term.coverageEstimate',
  access: 'discovery.missions.term.access', country: 'discovery.missions.term.country', regulatoryWebsites: 'discovery.missions.term.regulatoryWebsites', publicInfo: 'discovery.missions.term.publicInfo',
  geographicContext: 'discovery.missions.term.geographicContext', recentEvents: 'discovery.missions.term.recentEvents', changes: 'discovery.missions.term.changes',
  competitorProfiles: 'discovery.missions.out.competitorProfiles', featureMatrix: 'discovery.missions.out.featureMatrix', changeTimeline: 'discovery.missions.out.changeTimeline', evidencePacks: 'discovery.missions.out.evidencePacks',
  competitiveDataset: 'discovery.missions.out.competitiveDataset', enrichmentProposal: 'discovery.missions.out.enrichmentProposal', table: 'discovery.missions.out.table', map: 'discovery.missions.out.map', graph: 'discovery.missions.out.graph',
  publicDataCatalog: 'discovery.missions.out.publicDataCatalog', technologyLandscape: 'discovery.missions.out.technologyLandscape', triggerWorkflow: 'discovery.missions.deliver.workflow',
} as const satisfies Record<string, MessageId>;

/** Token da ResearchSpec (inglês, minúsculo) → rótulo. Fontes e extrações compartilham o mesmo dicionário. */
const TOKEN_LABEL: Record<string, MessageId> = {
  official: TERM.officialWebsites, documentation: TERM.documentation, pricing: TERM.pricing, 'release notes': TERM.releaseNotes, 'open data': TERM.openData, news: TERM.news, regulatory: TERM.regulatorySources,
  'public repositories': TERM.publicRepositories, 'public api': TERM.publicApi, 'official publications': TERM.officialPublications, research: TERM.research, government: TERM.government,
  products: TERM.products, features: TERM.features, integrations: TERM.integrations, locations: TERM.locations, announcements: TERM.announcements, technologies: TERM.technologies, partnerships: TERM.partnerships,
  website: TERM.website, industry: TERM.industry, headquarters: TERM.headquarters, 'new regulations': TERM.newRegulations, deadlines: TERM.deadlines, 'affected entities': TERM.affectedEntities, vendors: TERM.vendors,
  fields: TERM.fields, license: TERM.license, freshness: TERM.freshness, coverage: TERM.coverage, jobs: TERM.jobs,
};
/** Rótulo de um token de fonte ou extração no idioma ativo; token desconhecido aparece como veio. */
export const tokenLabel = (tok: string): string => (TOKEN_LABEL[tok] ? tx(TOKEN_LABEL[tok]) : tok.charAt(0).toUpperCase() + tok.slice(1));
/** Mesmo rótulo em minúsculas, para frases corridas. */
export const tokenLower = (tok: string): string => tokenLabel(tok).toLocaleLowerCase(activeLocale());

/** Destinos de entrega: token da ResearchSpec (snake_case) → rótulo. Tokens de conjuntos de exemplo (seed) caem no texto sem sublinhados. */
const DELIVER_LABEL: Record<string, MessageId> = {
  discovery_dataset: 'discovery.missions.deliver.dataset', enrichment_proposals_to_lde: 'discovery.missions.deliver.enrichLde', notify_copilot: 'discovery.missions.deliver.copilot',
  update_dashboard: 'discovery.missions.deliver.dashboard', workflow_trigger: 'discovery.missions.deliver.workflow',
};
export const deliverLabel = (tok: string): string => (DELIVER_LABEL[tok] ? tx(DELIVER_LABEL[tok]) : tok.replace(/_/g, ' '));
export const deliverText = (d: string): string => d.split(/,\s*/).filter(Boolean).map(deliverLabel).join(', ');

export const PREF_LABEL: Record<string, MessageId> = { Official: 'discovery.missions.pref.official', Secondary: 'discovery.missions.pref.secondary', Any: 'discovery.missions.pref.any' };
export const prefLabel = (p: string): string => (PREF_LABEL[p] ? tx(PREF_LABEL[p]) : p);

export interface MissionTemplate {
  id: string;
  /** Nome em inglês guardado em `ResearchMission.template` (dado semeado). */
  key: string;
  nameId: MessageId; taglineId: MessageId; inputsId: MessageId; objectiveId: MessageId;
  monitors: MessageId[]; outputs: MessageId[];
  /** Nomes próprios (não traduzem) e rótulos genéricos (traduzem). */
  entities: string[]; entityIds: MessageId[];
  discover: string[]; extract: string[]; frequency: Frequency; deliver: string[];
}
export const DISCOVER_OPTS = ['official', 'documentation', 'pricing', 'release notes', 'open data', 'news', 'regulatory', 'public repositories'] as const;
export const EXTRACT_OPTS = ['products', 'features', 'pricing', 'integrations', 'locations', 'announcements', 'technologies', 'partnerships'] as const;
export const OUTPUT_OPTS = ['discovery_dataset', 'enrichment_proposals_to_lde', 'notify_copilot', 'update_dashboard', 'workflow_trigger'] as const;
export const FREQUENCIES: Frequency[] = ['One time', 'Daily', 'Weekly', 'Monthly'];
export const FREQ_LABEL: Record<Frequency, MessageId> = { 'One time': 'discovery.missions.freq.once', Daily: 'discovery.missions.freq.daily', Weekly: 'discovery.missions.freq.weekly', Monthly: 'discovery.missions.freq.monthly' };
export const WATCH_MONITORS = ['Pricing', 'Products', 'Features', 'Release Notes', 'Documentation', 'Integrations', 'Announcements', 'Locations'] as const;

export const TEMPLATES: MissionTemplate[] = [
  { id: 'ci', key: 'Competitive Intelligence', nameId: 'discovery.missions.tpl.ci.name', taglineId: 'discovery.missions.tpl.ci.tagline', inputsId: 'discovery.missions.tpl.ci.inputs', objectiveId: 'discovery.missions.tpl.ci.objective',
    monitors: [TERM.products, TERM.features, TERM.pricing, TERM.integrations, TERM.partners, TERM.locations, TERM.announcements, TERM.jobs, TERM.documentation, TERM.releaseNotes], outputs: [TERM.competitorProfiles, TERM.featureMatrix, TERM.changeTimeline, TERM.evidencePacks, TERM.competitiveDataset],
    entities: ['Power BI', 'Tableau', 'Qlik', 'Looker', 'Domo'], entityIds: [], discover: ['official', 'documentation', 'pricing', 'release notes', 'news'], extract: ['products', 'features', 'pricing', 'integrations', 'announcements'], frequency: 'Daily', deliver: ['discovery_dataset', 'notify_copilot', 'update_dashboard'] },
  { id: 'ce', key: 'Company Enrichment', nameId: 'discovery.missions.tpl.ce.name', taglineId: 'discovery.missions.tpl.ce.tagline', inputsId: 'discovery.missions.tpl.ce.inputs', objectiveId: 'discovery.missions.tpl.ce.objective',
    monitors: [TERM.officialWebsite, TERM.industry, TERM.locations, TERM.products, TERM.publicInfo, TERM.geographicContext, TERM.recentEvents], outputs: [TERM.enrichmentProposal],
    entities: [], entityIds: ['discovery.missions.tpl.ce.entity'], discover: ['official', 'open data', 'news'], extract: ['products', 'locations', 'announcements'], frequency: 'Weekly', deliver: ['enrichment_proposals_to_lde', 'notify_copilot'] },
  { id: 'me', key: 'Market Exploration', nameId: 'discovery.missions.tpl.me.name', taglineId: 'discovery.missions.tpl.me.tagline', inputsId: 'discovery.missions.tpl.me.inputs', objectiveId: 'discovery.missions.tpl.me.objective',
    monitors: [TERM.organizations, TERM.products, TERM.locations, TERM.relationships, TERM.segments, TERM.evidence], outputs: [TERM.table, TERM.map, TERM.graph],
    entities: [], entityIds: ['discovery.missions.tpl.me.entity'], discover: ['official', 'news', 'open data'], extract: ['products', 'locations', 'partnerships'], frequency: 'Weekly', deliver: ['discovery_dataset', 'update_dashboard'] },
  { id: 'fp', key: 'Find Public Data', nameId: 'discovery.missions.tpl.fp.name', taglineId: 'discovery.missions.tpl.fp.tagline', inputsId: 'discovery.missions.tpl.fp.inputs', objectiveId: 'discovery.missions.tpl.fp.objective',
    monitors: [TERM.source, TERM.description, TERM.fields, TERM.coverageEstimate, TERM.license, TERM.access, TERM.country, TERM.freshness], outputs: [TERM.publicDataCatalog],
    entities: [], entityIds: ['discovery.missions.tpl.fp.entity'], discover: ['open data', 'regulatory'], extract: ['locations', 'technologies'], frequency: 'One time', deliver: ['discovery_dataset', 'enrichment_proposals_to_lde'] },
  { id: 'ri', key: 'Regulatory Intelligence', nameId: 'discovery.missions.tpl.ri.name', taglineId: 'discovery.missions.tpl.ri.tagline', inputsId: 'discovery.missions.tpl.ri.inputs', objectiveId: 'discovery.missions.tpl.ri.objective',
    monitors: [TERM.regulatoryWebsites, TERM.officialPublications, TERM.openData], outputs: [TERM.newRegulations, TERM.changes, TERM.deadlines, TERM.affectedEntities, TERM.triggerWorkflow],
    entities: ['Anatel', 'ANPD'], entityIds: [], discover: ['regulatory', 'official', 'open data'], extract: ['announcements'], frequency: 'Daily', deliver: ['workflow_trigger', 'notify_copilot'] },
  { id: 'tl', key: 'Technology Landscape', nameId: 'discovery.missions.tpl.tl.name', taglineId: 'discovery.missions.tpl.tl.tagline', inputsId: 'discovery.missions.tpl.tl.inputs', objectiveId: 'discovery.missions.tpl.tl.objective',
    monitors: [TERM.technologies, TERM.projects, TERM.vendors, TERM.publicRepositories, TERM.documentation, TERM.research, TERM.integrations], outputs: [TERM.technologyLandscape],
    entities: ['Snowflake', 'PostgreSQL'], entityIds: [], discover: ['public repositories', 'documentation', 'release notes'], extract: ['technologies', 'integrations', 'partnerships'], frequency: 'Weekly', deliver: ['discovery_dataset', 'update_dashboard'] },
];
/** Rótulo do modelo a partir do nome em inglês guardado na missão. */
export const templateLabel = (key: string): string => { const t = TEMPLATES.find((x) => x.key === key); return t ? tx(t.nameId) : key; };

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

/** ResearchSpec em texto legível (bloco `ds-spec`), no idioma ativo. */
export function specText(s: import('./types').ResearchSpec) {
  return [`${tx('discovery.missions.spec.objective')}: ${s.objective}`, `${tx('discovery.missions.spec.entities')}: ${s.entities.join(', ')}`, `${tx('discovery.missions.spec.sources')}: ${s.sources.map(tokenLabel).join(', ')}`,
    `${tx('discovery.missions.spec.extract')}: ${s.extract.map(tokenLabel).join(', ')}`, `${tx('discovery.missions.spec.frequency')}: ${tx(FREQ_LABEL[s.frequency])}`, `${tx('discovery.missions.spec.deliver')}: ${deliverText(s.deliver)}`,
    `${tx('discovery.missions.spec.verify')}: ${tx('discovery.missions.spec.verifyValue', { n: s.minEvidence ?? 2, pref: prefLabel(s.preferredSource ?? 'Official').toLocaleLowerCase(activeLocale()), pct: s.confidenceThreshold ?? 80 })}`].join('\n');
}
