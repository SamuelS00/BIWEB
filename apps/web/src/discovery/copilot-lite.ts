import type { CopilotBlock, CopilotContext, CopilotEngine } from '@biweb/assistant-ui';

/** Leve o bastante para o shell: o motor com os dados do BDE só carrega quando o usuário pergunta algo. */
export const discoveryCopilot: CopilotEngine = {
  suggestions: (ctx: CopilotContext) => (ctx.label.includes('Entities') || ctx.label.includes('entities')
    ? ['Compare com Company B', 'De onde veio essa informação?', 'Existem informações conflitantes sobre essa empresa?', 'Crie um mapa das unidades encontradas']
    : ['O que mudou nos concorrentes esta semana?', 'Qual concorrente adicionou mais integrações?', 'Qual evidência temos desse preço?', 'Enriqueça nossos clientes usando fontes públicas']),
  reply: async (input: string, ctx: CopilotContext): Promise<CopilotBlock[]> => (await import('./copilot')).reply(input, ctx),
};

/** Ids de links e ações do Copilot do Discovery → rota. `go:/caminho` navega direto. */
export function discoveryPath(id: string): string | null {
  const [k, ...rest] = id.split(':'); const v = rest.join(':');
  const map: Record<string, string> = { ev: 'evidence', ch: 'changes', en: 'entities', ds: 'datasets', ob: 'observations', cf: 'conflicts', ms: 'missions', src: 'sources', wl: 'watchlists' };
  if (k === 'go') return v;
  return map[k!] ? `/discovery/${map[k!]}/${encodeURIComponent(v)}` : null;
}
