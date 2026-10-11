import { Badge, Button, Select } from '@biweb/ui';
import { ENTITIES } from '../data/seed';
import { ago, entityById } from '../data/derive';
import { COMPARE_ROWS, compareCell } from '../data/records';
import { useDs } from '../store';
import { ConfChip, Empty, TraceBtn, ViewHead, dpath, useGo } from '../ui';
import './records.css';

const ORGS = ENTITIES.filter((e) => e.type === 'Organization');
const PRESETS: [string, string[]][] = [['Power BI × Tableau × Qlik', ['powerbi', 'tableau', 'qlik']], ['Company A × Company B', ['coa', 'cob']]];

export function Compare() {
  const go = useGo();
  const ids = useDs((s) => s.compare);
  const set = useDs((s) => s.setCompare);
  const list = ids.filter((i) => entityById(i));
  const options = ORGS.map((e) => ({ id: e.id, label: e.name }));
  const change = (i: number, v: string) => set(ids.map((x, j) => (j === i ? v : x)));
  return (
    <div className="dw-view">
      <ViewHead title="Compare entities" sub="Every cell shows its value, how much evidence stands behind it and when it was last confirmed. Empty cells are not filled with guesses."
        actions={<><Button size="sm" variant="ghost" icon="arrowLeft" onPress={() => go(dpath('entities'))}>Entities</Button><Button size="sm" variant="primary" icon="report" onPress={() => go(dpath('datasets', 'ds1'))}>Create report</Button></>} />
      <div className="ds-rec-pick">
        {ids.map((id, i) => (
          <span key={`${i}-${id}`} className="dw-hyp-a" style={{ alignItems: 'flex-end' }}>
            <Select label={`Entity ${i + 1}`} options={options} value={id} onChange={(v) => change(i, v)} />
            {ids.length > 2 && <Button size="sm" variant="ghost" icon="close" onPress={() => set(ids.filter((_, j) => j !== i))}>Remove</Button>}
          </span>
        ))}
        {ids.length < 4 && <Button size="sm" icon="plus" onPress={() => set([...ids, ORGS.find((o) => !ids.includes(o.id))?.id ?? 'looker'])}>Add entity</Button>}
        <span className="flex-1" />
        {PRESETS.map(([l, v]) => <Button key={l} size="sm" variant="ghost" onPress={() => set(v)}>{l}</Button>)}
      </div>
      {list.length < 2 ? <Empty icon="matrix" title="Pick at least two entities" text="Choose 2 to 4 entities to compare." /> : (
        <div className="ds-rec-mx" role="table" aria-label="Entity comparison" style={{ ['--n' as string]: list.length }}>
          <div className="h" role="columnheader">Dimension</div>
          {list.map((id) => <div key={id} className="h" role="columnheader">{entityById(id)?.name}</div>)}
          {COMPARE_ROWS.map((row) => (
            <div key={row} style={{ display: 'contents' }} role="row">
              <div className="r" role="rowheader">{row}</div>
              {list.map((id) => {
                const c = compareCell(id, row), has = c.evidenceIds.length > 0;
                return (
                  <div key={id} role="cell">
                    <div className="ds-rec-cell">
                      <p>{c.value}</p>
                      <div className="row">
                        {has ? <><TraceBtn evidenceId={c.evidenceIds[0]} label={`${c.evidenceIds.length} evidence`} />{c.confidence !== null && <ConfChip v={c.confidence} />}</> : <Badge tone="warning" icon="warning">Needs verification</Badge>}
                      </div>
                      <small>{c.confirmedMin !== null ? `Last confirmed ${ago(c.confirmedMin)}` : 'Not confirmed yet'}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
      <p className="dw-note">Demo data. Values come from observations and detected changes; a cell with no captured evidence stays marked Needs verification.</p>
    </div>
  );
}
