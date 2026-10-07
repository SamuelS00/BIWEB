/** Strings externalizadas (ICU via react-intl) desde o início (ADR-0032). */
export const messages = {
  'rail.dashboards': 'Dashboards',
  'rail.data': 'Dados e conexões',
  'rail.models': 'Modelos',
  'rail.catalog': 'Catálogo',
  'rail.catalog.disabled': 'Catálogo e lineage: fora do escopo da Fase 2',
  'rail.prefs': 'Exibição e preferências',
  'home.title': 'Dashboards',
  'home.new': 'Novo dashboard',
  'home.count': '{count, plural, one {# dashboard} other {# dashboards}}',
  'data.title': 'Dados e conexões',
  'search.placeholder': 'Buscar ou pedir…',
  'builder.empty.title': 'Página vazia',
  'builder.empty.description': 'Arraste um campo do painel Dados ou comece por uma ação.',
  'builder.pending': 'O canvas renderiza o runtime real (E2.4) com overlays do builder (E2.6). Até lá, esta tela mostra a estrutura.',
} as const;
export type MessageId = keyof typeof messages;
