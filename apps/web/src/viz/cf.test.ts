import { describe, it, expect } from 'vitest';
import { evalCf, MARGIN_RULES } from './cf';
const range = { min: 0, max: 100 };
describe('conditional formatting', () => {
  it('maps margin thresholds to tones in order', () => {
    const cf = { id: 'a', field: 'm', kind: 'rules' as const, rules: MARGIN_RULES };
    expect(evalCf(cf, 6, range).tone).toBe('critical'); expect(evalCf(cf, 14, range).tone).toBe('warning'); expect(evalCf(cf, 31, range).tone).toBe('healthy'); expect(evalCf(cf, 10, range).tone).toBe('warning');
  });
  it('builds scales (optionally reversed), bars and icons', () => {
    expect(evalCf({ id: 'a', field: 'm', kind: 'scale' }, 25, range).heat).toBe(0.25); expect(evalCf({ id: 'a', field: 'm', kind: 'scale', reverse: true }, 25, range).heat).toBe(0.75);
    expect(evalCf({ id: 'a', field: 'm', kind: 'bars' }, 40, range).pct).toBe(0.4); expect(evalCf({ id: 'a', field: 'm', kind: 'icons', rules: MARGIN_RULES }, 5, range).icon).toBe('▼');
  });
  it('ignores empty and non-numeric values', () => { expect(evalCf({ id: 'a', field: 'm', kind: 'scale' }, null, range)).toEqual({}); expect(evalCf(undefined, 5, range)).toEqual({}); expect(evalCf({ id: 'a', field: 'm', kind: 'scale' }, 'x', range)).toEqual({}); });
});
