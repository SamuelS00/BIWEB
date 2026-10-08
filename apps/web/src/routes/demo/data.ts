import { frac } from '../maps/base';

/* ───────────── Anomaly Explorer ───────────── */
export const REGIONS = ['Oeste', 'Centro', 'Leste', 'Norte', 'Sul'] as const;
export type Region = typeof REGIONS[number];
export type Measure = 'Latência' | 'Perda de pacotes' | 'Disponibilidade';
export const MEASURES: Record<Measure, { unit: string; digits: number; higherIsWorse: boolean }> = {
  'Latência': { unit: 'ms', digits: 0, higherIsWorse: true },
  'Perda de pacotes': { unit: '%', digits: 2, higherIsWorse: true },
  'Disponibilidade': { unit: '%', digits: 3, higherIsWorse: false },
};
/** Incident bursts per region, positioned on an absolute 5-minute index so the live window keeps meeting new ones. */
const BURSTS: Record<Region, [number, number, number][]> = {
  Oeste: [[58, 7, 58], [128, 5, 34], [214, 9, 66], [300, 6, 40]], Centro: [[44, 5, 24], [150, 8, 30], [236, 6, 28]],
  Leste: [[86, 6, 22], [182, 7, 36], [270, 5, 26]], Norte: [[112, 4, 18], [248, 8, 44]], Sul: [[70, 5, 20], [166, 6, 32], [286, 7, 38]],
};
export function observed(region: Region, measure: Measure, i: number, refresh = 0): number {
  const r = REGIONS.indexOf(region), noise = (frac(i * 1.7 + r * 11 + refresh * 3.1) - .5) * 2, slow = Math.sin(i / 17 + r) * 3;
  const burst = BURSTS[region].reduce((s, [c, w, a]) => s + a * Math.exp(-((i - c) ** 2) / (2 * w * w)), 0);
  const latency = 44 + r * 2 + slow + noise * 3 + burst;
  if (measure === 'Latência') return latency;
  if (measure === 'Perda de pacotes') return Math.max(.02, .14 + Math.max(0, latency - 48) * .035 + noise * .03);
  return Math.min(99.999, 99.985 - Math.max(0, latency - 52) * .0016 + noise * .002);
}
export interface Point { i: number; value: number; mean: number; sigma: number; z: number; flagged: boolean }
/** Rolling robust baseline and z-score; sensitivity is the z threshold. */
export function analyse(region: Region, measure: Measure, start: number, length: number, k: number, refresh: number): Point[] {
  const pts: Point[] = [], dir = MEASURES[measure].higherIsWorse ? 1 : -1;
  for (let i = start; i < start + length; i++) {
    // Robust baseline: median and MAD of the previous 8 hours, so a burst does not inflate its own reference.
    const hist = Array.from({ length: 96 }, (_, j) => observed(region, measure, i - 4 - j, refresh)).sort((a, b) => a - b), mean = hist[48]!;
    const mad = Array.from(hist, (v) => Math.abs(v - mean)).sort((a, b) => a - b)[48]!, sigma = Math.max(1.4826 * mad, Math.abs(mean) * 1e-5, 1e-6), value = observed(region, measure, i, refresh), z = dir * (value - mean) / sigma;
    pts.push({ i, value, mean, sigma, z, flagged: z > k });
  }
  return pts;
}
export interface Anomaly { id: string; start: number; end: number; peak: Point; duration: number; score: number; level: 'Crítica' | 'Alta' | 'Média' }
export function anomalies(points: Point[]): Anomaly[] {
  const out: Anomaly[] = []; let run: Point[] = [];
  const flush = () => {
    if (run.length >= 2) {
      const peak = run.reduce((a, b) => b.z > a.z ? b : a), duration = run.length * 5, score = Math.min(99, Math.round(peak.z * 7 + duration * .5));
      out.push({ id: `A${run[0]!.i}`, start: run[0]!.i, end: run.at(-1)!.i, peak, duration, score, level: score >= 78 ? 'Crítica' : score >= 55 ? 'Alta' : 'Média' });
    }
    run = [];
  };
  for (const p of points) { if (p.flagged) run.push(p); else flush(); }
  flush();
  return out.sort((a, b) => b.score - a.score);
}
export const clockAt = (i: number) => { const m = 6 * 60 + i * 5; return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };

/* ───────────── SLA & Risk ───────────── */
export interface Service { id: string; name: string; slo: number; tier: 'Crítico' | 'Alto' | 'Médio'; owner: string; customers: number; base: number; spikes: [number, number][] }
/** `base` and spike sizes are burn-rate multiples: 1× consumes the budget exactly over the window. */
export const SERVICES: Service[] = [
  { id: 'auth', name: 'API de autenticação', slo: 99.95, tier: 'Crítico', owner: 'Identidade', customers: 120000, base: .8, spikes: [[6, 3.5], [13, 5]] },
  { id: 'catalog', name: 'API de catálogo', slo: 99.9, tier: 'Médio', owner: 'Catálogo', customers: 80000, base: .35, spikes: [[9, 2]] },
  { id: 'checkout', name: 'Checkout', slo: 99.95, tier: 'Crítico', owner: 'Pagamentos', customers: 95000, base: .45, spikes: [[15, 2.5]] },
  { id: 'gateway', name: 'Gateway de pagamentos', slo: 99.99, tier: 'Crítico', owner: 'Pagamentos', customers: 95000, base: .5, spikes: [[4, 5], [11, 4], [16, 6]] },
  { id: 'search', name: 'Busca', slo: 99.5, tier: 'Médio', owner: 'Descoberta', customers: 150000, base: .6, spikes: [[8, 2]] },
  { id: 'notify', name: 'Notificações', slo: 99.9, tier: 'Alto', owner: 'Engajamento', customers: 110000, base: .5, spikes: [[12, 3], [17, 2.5]] },
];
export const WINDOW_DAYS = 30;
export const TODAY = 18;
/** Fraction of the window's error budget consumed on each day (index 0 = day 1). `extra` is a simulated outage today, in burn multiples. */
export function dailyBurn(s: Service, extra = 0): number[] {
  return Array.from({ length: TODAY }, (_, d) => {
    const spike = s.spikes.find(([day]) => day === d + 1)?.[1] ?? 0;
    return (s.base * (.7 + frac(d * 3.3 + s.id.length) * .6) + spike + (d === TODAY - 1 ? extra : 0)) / WINDOW_DAYS;
  });
}
export interface SlaState { consumed: number; remaining: number; burn: number; exhaustDay: number | null; status: 'Saudável' | 'Risco' | 'Crítico' }
export function slaState(s: Service, extra = 0): SlaState {
  const days = dailyBurn(s, extra), consumed = days.reduce((a, b) => a + b, 0), burn = consumed / (TODAY / WINDOW_DAYS), rate = consumed / TODAY;
  const exhaust = consumed >= 1 ? TODAY : TODAY + (1 - consumed) / rate;
  const status = consumed >= 1 || exhaust < WINDOW_DAYS - 6 ? 'Crítico' : burn > 1.1 || consumed > .55 ? 'Risco' : 'Saudável';
  return { consumed, remaining: Math.max(0, 1 - consumed), burn, exhaustDay: exhaust > WINDOW_DAYS ? null : exhaust, status };
}
/** Multi-window burn rates (1 h, 6 h, 3 d) for the alert policy, from an hourly series. */
export function burnWindows(s: Service, extra = 0) {
  const hourly = Array.from({ length: 72 }, (_, h) => s.base * (.7 + frac(h * 2.3 + s.id.length) * .6) + (h > 62 ? (s.spikes.at(-1)?.[1] ?? 0) * .5 * frac(h) : 0) + (h === 71 ? extra * 3 : 0));
  const rate = (n: number) => hourly.slice(-n).reduce((a, b) => a + b, 0) / n;
  return [{ label: '1 hora', limit: 14.4, value: rate(1), page: true }, { label: '6 horas', limit: 6, value: rate(6), page: true }, { label: '3 dias', limit: 1, value: rate(72), page: false }];
}

/* ───────────── Customer Behavior ───────────── */
export const SEGMENTS = ['Todos os clientes', 'Orgânico', 'Campanha paga', 'Parceiros'] as const;
export type Segment = typeof SEGMENTS[number];
const SEG_SIZE: Record<Segment, number> = { 'Todos os clientes': 12840, 'Orgânico': 4200, 'Campanha paga': 6240, 'Parceiros': 2400 };
const SEG_CONV: Record<Segment, number[]> = {
  'Todos os clientes': [1, .8, .56, .4, .3], 'Orgânico': [1, .84, .62, .46, .36], 'Campanha paga': [1, .76, .5, .35, .25], 'Parceiros': [1, .86, .66, .52, .43],
};
export const FUNNEL = ['Conta criada', 'E-mail verificado', 'Primeiro projeto', 'Primeira integração', 'Ativado em 7 dias'];
export const funnelCounts = (seg: Segment, refresh = 0) => SEG_CONV[seg].map((c, i) => Math.round(SEG_SIZE[seg] * c * (1 + (frac(i + refresh * 5) - .5) * (i ? .015 : 0))));
export const COHORTS = ['Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago'];
export function retention(seg: Segment, cohort: number, month: number): number | null {
  if (month > COHORTS.length - 1 - cohort) return null;
  if (month === 0) return 100;
  const shift = { 'Todos os clientes': 0, 'Orgânico': 5, 'Campanha paga': -6, 'Parceiros': 9 }[seg], trend = (cohort - 2) * 2.2;
  return Math.round(Math.max(6, Math.min(99, 100 * Math.exp(-month * .3) * (.6 + .4 * Math.exp(-month * .1)) + shift + trend + (frac(cohort * 7 + month * 3) - .5) * 6)));
}
export const PATHS: { steps: string[]; share: number }[] = [
  { steps: ['Criar conta', 'Verificar e-mail', 'Criar projeto', 'Conectar GitHub', 'Onboarding concluído'], share: 36 },
  { steps: ['Criar conta', 'Verificar e-mail', 'Criar projeto', 'Conectar planilha', 'Onboarding concluído'], share: 24 },
  { steps: ['Criar conta', 'Verificar e-mail', 'Convidar equipe', 'Criar projeto', 'Onboarding concluído'], share: 17 },
  { steps: ['Criar conta', 'Verificar e-mail', 'Explorar exemplos', 'Criar projeto', 'Abandonou'], share: 12 },
  { steps: ['Criar conta', 'Abandonou'], share: 11 },
];
export const DEVICES: Record<string, number[]> = { Desktop: [.62, .5, .42, .36, .3], Mobile: [.28, .21, .15, .1, .07], Tablet: [.1, .08, .06, .05, .04] };
