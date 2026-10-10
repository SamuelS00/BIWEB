import { NOW } from '../net/generate';

/** Tempo relativo em pt-BR (âncora determinística das demos). Fora do ReportView para evitar ciclo com routes/gallery. */
export const ago = (ts: number) => { const m = Math.round(((ts <= NOW ? NOW : Date.now()) - ts) / 60_000); return m < 1 ? 'agora' : m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.round(m / 60)} h` : m < 2880 ? 'ontem' : new Date(ts).toLocaleDateString('pt-BR'); };
