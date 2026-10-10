/** Regras de fronteira (docs/architecture/04 §7.2 e 25 §39.3). Falham o CI. */
module.exports = {
  forbidden: [
    { name: 'core-sem-react-ou-dom', severity: 'error', comment: 'dashboard-core é headless e isomórfico (roda no Node).',
      from: { path: '^packages/(dashboard-core|layout-engine|schema|viz-sdk|viz-recommender|data-runtime)/' },
      to: { path: 'node_modules/(react|react-dom|react-aria-components)/' } },
    { name: 'runtime-nao-importa-builder', severity: 'error', comment: 'Embed e modo leitura carregam só o runtime.',
      from: { path: '^packages/dashboard-runtime/' }, to: { path: '^packages/dashboard-builder/|@biweb/dashboard-builder' } },
    { name: 'plugins-so-dependem-do-viz-sdk', severity: 'error',
      from: { path: '^packages/viz-(core|geo)/' }, to: { path: '^packages/(dashboard-core|dashboard-runtime|dashboard-builder|data-runtime)/' } },
    { name: 'data-runtime-nao-conhece-widgets', severity: 'error',
      from: { path: '^packages/data-runtime/' }, to: { path: '^packages/(dashboard-core|dashboard-runtime|dashboard-builder|viz-)' } },
    { name: 'core-nao-importa-ia', severity: 'error', comment: 'A plataforma funciona com a IA desligada (ADR-0033).',
      from: { path: '^packages/(?!assistant-ui)', pathNot: '^packages/test-utils/' },
      to: { path: '^packages/assistant-ui/|^apps/control-plane/src/modules/(assistant|model-gateway)/' } },
    { name: 'sdk-de-modelo-so-no-gateway', severity: 'error',
      from: { pathNot: '^apps/control-plane/src/modules/model-gateway/adapters/' },
      to: { path: 'node_modules/(openai|@anthropic-ai|@google/generative-ai|@aws-sdk/client-bedrock)' } },
    { name: 'core-nao-importa-ee', severity: 'error', from: { pathNot: '^ee/' }, to: { path: '^ee/' } },
    { name: 'sem-ciclos', severity: 'error', from: {}, to: { circular: true } },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    // false: imports só de tipos (apagados na compilação) não contam como dependência nem como ciclo.
    tsPreCompilationDeps: false,
    tsConfig: { fileName: 'tsconfig.base.json' },
    exclude: { path: '(dist|node_modules|\\.turbo)/' },
  },
};
