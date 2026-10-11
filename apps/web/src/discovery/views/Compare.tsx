import { Badge, Button, Select } from '@biweb/ui';
import { useT } from '../../i18n/intl';
import type { MessageId } from '../../i18n/catalog';
import { ENTITIES } from '../data/seed';
import { ago, entityById } from '../data/derive';
import { COMPARE_ROWS, compareCell, type CompareRow } from '../data/records';
import { useDs } from '../store';
import { ConfChip, Empty, TraceBtn, ViewHead, dpath, useGo } from '../ui';
import './records.css';

const ORGS = ENTITIES.filter((e) => e.type === 'Organization');
const PRESETS: [string, string[]][] = [['Power BI × Tableau × Qlik', ['powerbi', 'tableau', 'qlik']], ['Company A × Company B', ['coa', 'cob']]];

const ROW_LABEL: Record<CompareRow, MessageId> = {
  Products: 'discovery.compare.row.products', Features: 'discovery.compare.row.features', AI: 'discovery.compare.row.ai', Maps: 'discovery.compare.row.maps', Automation: 'discovery.compare.row.automation',
  Integrations: 'discovery.compare.row.integrations', 'Pricing model': 'discovery.compare.row.pricing', 'Last relevant change': 'discovery.compare.row.lastChange',
};

export function Compare() {
  const t = useT();
  const go = useGo();
  const ids = useDs((s) => s.compare);
  const set = useDs((s) => s.setCompare);
  const list = ids.filter((i) => entityById(i));
  const options = ORGS.map((e) => ({ id: e.id, label: e.name }));
  const change = (i: number, v: string) => set(ids.map((x, j) => (j === i ? v : x)));
  return (
    <div className="dw-view">
      <ViewHead title={t('discovery.compare.title')} sub={t('discovery.compare.sub')}
        actions={<><Button size="sm" variant="ghost" icon="arrowLeft" onPress={() => go(dpath('entities'))}>{t('discovery.nav.entities')}</Button><Button size="sm" variant="primary" icon="report" onPress={() => go(dpath('datasets', 'ds1'))}>{t('discovery.compare.report')}</Button></>} />
      <div className="ds-rec-pick">
        {ids.map((id, i) => (
          <span key={`${i}-${id}`} className="dw-hyp-a" style={{ alignItems: 'flex-end' }}>
            <Select label={t('discovery.compare.entityN', { n: i + 1 })} options={options} value={id} onChange={(v) => change(i, v)} />
            {ids.length > 2 && <Button size="sm" variant="ghost" icon="close" onPress={() => set(ids.filter((_, j) => j !== i))}>{t('discovery.compare.remove')}</Button>}
          </span>
        ))}
        {ids.length < 4 && <Button size="sm" icon="plus" onPress={() => set([...ids, ORGS.find((o) => !ids.includes(o.id))?.id ?? 'looker'])}>{t('discovery.compare.add')}</Button>}
        <span className="flex-1" />
        {PRESETS.map(([l, v]) => <Button key={l} size="sm" variant="ghost" onPress={() => set(v)}>{l}</Button>)}
      </div>
      {list.length < 2 ? <Empty icon="matrix" title={t('discovery.compare.min.title')} text={t('discovery.compare.min.text')} /> : (
        <div className="ds-rec-mx" role="table" aria-label={t('discovery.compare.aria')} style={{ ['--n' as string]: list.length }}>
          <div className="h" role="columnheader">{t('discovery.compare.dimension')}</div>
          {list.map((id) => <div key={id} className="h" role="columnheader">{entityById(id)?.name}</div>)}
          {COMPARE_ROWS.map((row) => (
            <div key={row} style={{ display: 'contents' }} role="row">
              <div className="r" role="rowheader">{t(ROW_LABEL[row])}</div>
              {list.map((id) => {
                const c = compareCell(id, row), has = c.evidenceIds.length > 0;
                return (
                  <div key={id} role="cell">
                    <div className="ds-rec-cell">
                      <p>{c.value}</p>
                      <div className="row">
                        {has ? <><TraceBtn evidenceId={c.evidenceIds[0]} label={t('discovery.compare.evidenceN', { n: c.evidenceIds.length })} />{c.confidence !== null && <ConfChip v={c.confidence} />}</> : <Badge tone="warning" icon="warning">{t('discovery.common.needsVerification')}</Badge>}
                      </div>
                      <small>{c.confirmedMin !== null ? t('discovery.compare.confirmed', { when: ago(c.confirmedMin) }) : t('discovery.compare.notConfirmed')}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
      <p className="dw-note">{t('discovery.compare.note')}</p>
    </div>
  );
}
