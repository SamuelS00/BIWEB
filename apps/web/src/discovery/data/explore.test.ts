import { describe, expect, it } from 'vitest';
import { bandCounts, classifyQuery, clusterGeo, resultEntities } from './explore';
import { MESSAGES } from '../../i18n/catalog';
import type { Locale } from '../../i18n/locales';
import { DATASETS, EXPLORE_DEEP, EXPLORE_EXAMPLES, PROPOSALS } from './seed';
import { schemaOf } from './datasets';

describe('explore', () => {
  it.each(['pt-BR', 'en', 'es'] as Locale[])('classifica as consultas de exemplo em %s', (loc) => {
    const text = (id: (typeof EXPLORE_EXAMPLES)[number]) => MESSAGES[loc][id];
    expect(EXPLORE_EXAMPLES.map((id) => classifyQuery(text(id)).kind)).toEqual(['fiber', 'competitors', 'public', 'sp', 'changes']);
    expect(classifyQuery(text(EXPLORE_DEEP))).toEqual({ kind: 'bi', plan: true });
  });
  it('consulta desconhecida não classifica', () => {
    expect(classifyQuery('xyz').kind).toBe('none');
  });
  it('resultado de fibra: 27 = 18 + 7 + 2', () => {
    const c = bandCounts(resultEntities('fiber'));
    expect(c).toEqual({ found: 27, high: 18, medium: 7, review: 2 });
  });
  it('agrupa pontos próximos e o esquema bate com o número de campos', () => {
    const list = resultEntities('fiber');
    expect(clusterGeo(list).reduce((s, c) => s + c.members.length, 0)).toBe(27);
    for (const d of DATASETS) expect(schemaOf(d)).toHaveLength(d.fields);
    expect(PROPOSALS.filter((p) => p.status === 'proposed')).toHaveLength(8);
  });
});
