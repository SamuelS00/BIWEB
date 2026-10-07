import { useMemo, useState } from 'react';
import { Badge, Button, Checkbox, Icon, IconButton, SegmentedControl, Select, Switch, TextField } from '@biweb/ui';
import { distinct, labelOf, OP_LABEL, ruleMatches, STATUS_LABEL } from '../../data/query';
import { getTable, useData } from '../../data/registry';
import type { FilterOp, Rule, RuleAction, RuleCondition, RuleStatus } from '../../data/types';
import { DS, uid } from '../doc';
import { useEditor } from '../store';
import { StatusDot } from '../../viz/common';
import { Section } from './shared';

const NUM_OPS: FilterOp[] = ['>', '>=', '<', '<=', '=', '!='];
const CAT_OPS: FilterOp[] = ['=', '!=', 'contains'];
const TEMPLATES: { label: string; rule: Omit<Rule, 'id'> }[] = [
  { label: 'Atenuação acima do limite', rule: { name: 'Atenuação acima do limite', enabled: true, dataset: DS, table: 'enlaces', conditions: [{ id: 'a', field: 'atenuacao_dB', op: '>', value: 18 }, { id: 'b', field: 'status', op: '!=', value: 'offline', join: 'AND' }], actions: [{ kind: 'status', value: 'critical' }, { kind: 'alert' }, { kind: 'highlight' }] } },
  { label: 'Capacidade crítica (> 80%)', rule: { name: 'Capacidade crítica', enabled: true, dataset: DS, table: 'enlaces', conditions: [{ id: 'a', field: 'utilizacao', op: '>', value: 80 }], actions: [{ kind: 'label', value: 'Capacidade crítica' }, { kind: 'status', value: 'warning' }, { kind: 'highlight' }] } },
  { label: 'Backbone sem redundância', rule: { name: 'Backbone degradado', enabled: true, dataset: DS, table: 'enlaces', conditions: [{ id: 'a', field: 'camada', op: '=', value: 'Backbone' }, { id: 'b', field: 'disponibilidade', op: '<', value: 99.9, join: 'AND' }], actions: [{ kind: 'status', value: 'critical' }, { kind: 'alert' }] } },
];

/** Linhas afetadas por uma regra (sem outras regras), para a contagem ao vivo. */
export function affected(rule: Rule) {
  const t = getTable(rule.dataset, rule.table);
  return t.rows.filter((r) => ruleMatches(rule, r));
}

function Editor({ rule }: { rule: Rule }) {
  const st = useEditor.getState();
  const t = getTable(rule.dataset, rule.table);
  const datasets = useData((s) => s.datasets);
  const edit = (label: string, fn: (r: Rule) => void) => st.commit(label, (d) => { const r = d.rules.find((x) => x.id === rule.id); if (r) fn(r as Rule); }, { tx: `rule:${rule.id}:${label}` });
  const hits = useMemo(() => affected(rule), [rule]);
  const fields = t.fields.filter((f) => !f.hidden && f.name !== 'id' && f.name !== 'nome');
  const has = (k: RuleAction['kind']) => rule.actions.find((a) => a.kind === k);
  const setAction = (k: RuleAction['kind'], a: RuleAction | null) => edit(a ? 'Alterar ação da regra' : 'Remover ação da regra', (r) => { r.actions = [...r.actions.filter((x) => x.kind !== k), ...(a ? [a] : [])]; });
  const statusA = has('status') as Extract<RuleAction, { kind: 'status' }> | undefined;
  const labelA = has('label') as Extract<RuleAction, { kind: 'label' }> | undefined;
  return (
    <div className="ed-rule-edit">
      <TextField label="Nome da regra" value={rule.name} onChange={(v) => edit('Renomear regra', (r) => { r.name = v; })} />
      <div className="ed-rule-src">
        <Select label="Aplicar em" value={rule.table} onChange={(v: string) => edit('Trocar tabela da regra', (r) => { r.table = v; r.conditions = []; })} options={datasets.find((d) => d.id === rule.dataset)!.tables.filter((x) => ['enlaces', 'nos', 'rotas', 'eventos'].includes(x.id)).map((x) => ({ id: x.id, label: x.name }))} />
      </div>
      <div className="ed-rule-block">
        <span className="ed-rule-kw">SE</span>
        {rule.conditions.map((c, i) => {
          const f = fields.find((x) => x.name === c.field);
          const numeric = f?.kind === 'measure';
          const vals = f && !numeric ? distinct(rule.dataset, rule.table, f.name).slice(0, 80) : [];
          return (
            <div key={c.id} className="ed-cond">
              {i > 0 && <SegmentedControl label="Junção" value={c.join ?? 'AND'} onChange={(v) => edit('Trocar junção', (r) => { r.conditions[i]!.join = v; })} options={[{ id: 'AND', label: 'E' }, { id: 'OR', label: 'OU' }]} />}
              <div className="ed-cond-row">
                <Select label="Campo" hideLabel value={c.field} onChange={(v: string) => edit('Trocar campo da condição', (r) => { const nf = fields.find((x) => x.name === v); r.conditions[i] = { ...r.conditions[i]!, field: v, op: nf?.kind === 'measure' ? '>' : '=', value: nf?.kind === 'measure' ? 0 : String(distinct(rule.dataset, rule.table, v)[0] ?? '') }; })} options={fields.map((x) => ({ id: x.name, label: x.label }))} />
                <Select label="Operador" hideLabel value={c.op} onChange={(v: FilterOp) => edit('Trocar operador', (r) => { r.conditions[i]!.op = v; })} options={(numeric ? NUM_OPS : CAT_OPS).map((o) => ({ id: o, label: OP_LABEL[o] }))} />
                {numeric || c.op === 'contains' ? <TextField label="Valor" hideLabel value={String(c.value)} onChange={(v) => edit('Alterar valor da condição', (r) => { r.conditions[i]!.value = v; })} />
                  : <Select label="Valor" hideLabel value={String(c.value)} onChange={(v: string) => edit('Alterar valor da condição', (r) => { r.conditions[i]!.value = v; })} options={vals.map((v) => ({ id: String(v), label: labelOf(v, f) }))} />}
                <IconButton icon="close" size="sm" label="Remover condição" onPress={() => edit('Remover condição', (r) => { r.conditions.splice(i, 1); if (r.conditions[0]) delete r.conditions[0].join; })} />
              </div>
            </div>
          );
        })}
        <Button size="sm" icon="plus" onPress={() => edit('Adicionar condição', (r) => { r.conditions.push({ id: uid('cd'), field: 'atenuacao_dB', op: '>', value: 15, ...(r.conditions.length ? { join: 'AND' as const } : {}) } as RuleCondition); })}>Adicionar condição</Button>
      </div>
      <div className="ed-rule-block">
        <span className="ed-rule-kw">ENTÃO</span>
        <div className="ed-act">
          <Checkbox isSelected={!!statusA} onChange={(v) => setAction('status', v ? { kind: 'status', value: 'critical' } : null)}>Marcar como</Checkbox>
          {statusA && <Select label="Status" hideLabel value={statusA.value} onChange={(v: RuleStatus) => setAction('status', { kind: 'status', value: v })} options={(['warning', 'critical', 'offline'] as RuleStatus[]).map((s) => ({ id: s, label: STATUS_LABEL[s]! }))} />}
        </div>
        <div className="ed-act">
          <Checkbox isSelected={!!labelA} onChange={(v) => setAction('label', v ? { kind: 'label', value: rule.name } : null)}>Rótulo</Checkbox>
          {labelA && <TextField label="Rótulo" hideLabel value={labelA.value} onChange={(v) => setAction('label', { kind: 'label', value: v })} />}
        </div>
        <div className="ed-act"><Checkbox isSelected={!!has('alert')} onChange={(v) => setAction('alert', v ? { kind: 'alert' } : null)}>Gerar alerta</Checkbox></div>
        <div className="ed-act"><Checkbox isSelected={!!has('highlight')} onChange={(v) => setAction('highlight', v ? { kind: 'highlight' } : null)}>Destacar no mapa e nas tabelas</Checkbox></div>
      </div>
      <div className={`ed-rule-live${hits.length ? ' has-hits' : ''}`} role="status" aria-live="polite">
        <b className="bw-num">{hits.length.toLocaleString('pt-BR')}</b> de {t.rows.length.toLocaleString('pt-BR')} {t.name.toLowerCase()} atendem à regra
        {hits.length > 0 && <div className="ed-rule-hits">{hits.slice(0, 5).map((r) => <span key={String(r.id)}><StatusDot s={String(r.status)} />{String(r.id)}{r.atenuacao_dB != null && <em>{Number(r.atenuacao_dB).toLocaleString('pt-BR')} dB</em>}{r.utilizacao != null && <em>{String(r.utilizacao)}%</em>}</span>)}{hits.length > 5 && <span className="bw-muted">+{hits.length - 5}</span>}</div>}
      </div>
    </div>
  );
}

export function RulesTab() {
  const rules = useEditor((s) => s.doc?.rules ?? []);
  const [open, setOpen] = useState<string | null>(rules[0]?.id ?? null);
  const st = useEditor.getState();
  const create = (tpl?: Omit<Rule, 'id'>) => {
    const r: Rule = { id: uid('rule'), ...(tpl ?? { name: 'Nova regra', enabled: true, dataset: DS, table: 'enlaces', conditions: [{ id: uid('cd'), field: 'atenuacao_dB', op: '>', value: 15 }], actions: [{ kind: 'status', value: 'warning' }, { kind: 'highlight' }] }), conditions: (tpl?.conditions ?? [{ id: uid('cd'), field: 'atenuacao_dB', op: '>' as FilterOp, value: 15 }]).map((c) => ({ ...c, id: uid('cd') })) };
    st.commit(`Criar regra ${r.name}`, (d) => { d.rules.push(r); });
    setOpen(r.id);
  };
  return (
    <div className="ed-tab">
      <div className="ed-tab-title">Regras do relatório</div>
      <p className="ed-help">Regras recalculam status, rótulos e alertas sobre o dataset. O efeito aparece na hora no mapa, nas tabelas e nos indicadores, e cada mudança pode ser desfeita.</p>
      <Section title={`Regras · ${rules.length}`} right={<Button size="sm" icon="plus" onPress={() => create()}>Nova regra</Button>}>
        {rules.length === 0 && (
          <div className="ed-rule-empty">
            <span>Comece por um modelo:</span>
            {TEMPLATES.map((t) => <Button key={t.label} size="sm" icon="bolt" onPress={() => create(t.rule)}>{t.label}</Button>)}
          </div>
        )}
        {rules.map((r) => {
          const n = affected(r).length;
          return (
            <div key={r.id} className={`ed-rule${open === r.id ? ' is-open' : ''}${r.enabled ? '' : ' is-off'}`}>
              <div className="ed-rule-head" onClick={() => setOpen(open === r.id ? null : r.id)}>
                <Icon name={open === r.id ? 'chevronDown' : 'chevronRight'} size={12} />
                <Icon name="bolt" size={12} />
                <span className="ed-rule-name">{r.name}</span>
                {r.createdBy === 'copilot' && <Badge tone="accent">IA</Badge>}
                <span className="bw-num bw-muted">{n}</span>
                {r.actions.some((a) => a.kind === 'alert') && r.enabled && n > 0 && <Badge tone="danger" icon="warning">{n} {n === 1 ? 'alerta' : 'alertas'}</Badge>}
                <span onClick={(e) => e.stopPropagation()} className="ed-rule-tg"><Switch isSelected={r.enabled} onChange={(v) => st.commit(v ? `Ativar regra ${r.name}` : `Desativar regra ${r.name}`, (d) => { const x = d.rules.find((y) => y.id === r.id); if (x) x.enabled = v; })} aria-label={`Regra ${r.name} ativa`}>{null}</Switch></span>
                <span onClick={(e) => e.stopPropagation()}><IconButton icon="trash" size="sm" label="Excluir regra" onPress={() => st.commit(`Excluir regra ${r.name}`, (d) => { d.rules = d.rules.filter((y) => y.id !== r.id); })} /></span>
              </div>
              {open === r.id && <Editor rule={r} />}
            </div>
          );
        })}
        {rules.length > 0 && <div className="ed-rule-tpls"><span className="bw-cap bw-muted">Modelos:</span>{TEMPLATES.map((t) => <button key={t.label} type="button" className="bw-link ed-tpl" onClick={() => create(t.rule)}>{t.label}</button>)}</div>}
      </Section>
      <Section title="Linguagem de status">
        <div className="ed-legend-status">
          <span><StatusDot s="normal" />Normal · traço padrão</span><span><StatusDot s="warning" />Atenção · destaque moderado</span>
          <span><StatusDot s="critical" />Crítico · destaque forte e pulso discreto</span><span><StatusDot s="offline" />Offline · linha tracejada</span>
        </div>
      </Section>
    </div>
  );
}
