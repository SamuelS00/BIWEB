/** Contrato entre a UI do Copilot e quem responde (Assistant API via SSE em produção; motor de exemplo no protótipo). */
export type CopilotBlock =
  | { kind: 'text'; text: string }
  | { kind: 'evidence'; title: string; rows: [string, number][]; unit?: string; diverging?: boolean }
  | { kind: 'links'; title?: string; items: { id: string; label: string; meta?: string; thumb?: string }[] }
  | { kind: 'steps'; items: string[] }
  | { kind: 'citation'; text: string }
  | { kind: 'actions'; items: { id: string; label: string }[] }
  | { kind: 'badge'; tone: 'warning' | 'success' | 'accent'; text: string };

export interface CopilotContext {
  /** O que está na tela: relatório aberto, visual selecionado, página. Aparece no chip de contexto. */
  label: string;
  reportId?: string;
}
export interface CopilotMessage { id: string; role: 'user' | 'assistant'; blocks: CopilotBlock[]; context?: string; at: Date }
export interface CopilotEngine {
  reply(input: string, ctx: CopilotContext): Promise<CopilotBlock[]>;
  suggestions(ctx: CopilotContext): string[];
}
