import { useState } from 'react';
import { Button, Icon, IconButton, Switch } from '@biweb/ui';
import { useLocale, useT } from '../../i18n/intl';
import type { MessageId } from '../../i18n/catalog';
import { DISCOVER_OPTS, EXTRACT_OPTS, FREQUENCIES, FREQ_LABEL, OUTPUT_OPTS, PREF_LABEL, TEMPLATES, deliverLabel, specText, tokenLabel, tokenLower, useMissionDraft, type MissionTemplate } from '../data/missions';
import type { Frequency, ResearchSpec } from '../data/types';
import { useDs } from '../store';
import { Chip, dpath, useGo } from '../ui';
import './missions.css';

const STEPS: MessageId[] = ['discovery.wizard.step.objective', 'discovery.wizard.step.entities', 'discovery.wizard.step.discover', 'discovery.wizard.step.extract', 'discovery.wizard.step.verify', 'discovery.wizard.step.frequency', 'discovery.wizard.step.output', 'discovery.wizard.step.review'];
const FREQ_NOTE: Record<Frequency, MessageId> = { 'One time': 'discovery.wizard.freqNote.once', Daily: 'discovery.wizard.freqNote.daily', Weekly: 'discovery.wizard.freqNote.weekly', Monthly: 'discovery.wizard.freqNote.monthly' };
const PREF_CLAUSE: Record<string, MessageId> = { Official: 'discovery.wizard.pref.official', Secondary: 'discovery.wizard.pref.secondary', Any: 'discovery.wizard.pref.any' };

function Toggles({ opts, on, set, label, text }: { opts: readonly string[]; on: string[]; set: (v: string[]) => void; label: string; text: (o: string) => string }) {
  return (
    <div className="ds-mw-grid" role="group" aria-label={label}>
      {opts.map((o) => { const sel = on.includes(o); return <div key={o} className={`ds-mw-opt${sel ? ' is-on' : ''}`}><Switch isSelected={sel} onChange={(v) => set(v ? [...on, o] : on.filter((x) => x !== o))}>{text(o)}</Switch></div>; })}
    </div>
  );
}
const tplEntities = (tpl: MissionTemplate, t: (id: MessageId) => string) => [...tpl.entityIds.map((id) => t(id)), ...tpl.entities];

export function MissionWizard() {
  const t = useT();
  const locale = useLocale();
  const go = useGo();
  const tid = useMissionDraft((s) => s.templateId), setTpl = useMissionDraft((s) => s.setTemplate);
  const base = TEMPLATES.find((t) => t.id === tid) ?? TEMPLATES[0]!;
  const [step, setStep] = useState(0);
  const [objective, setObjective] = useState(t(base.objectiveId));
  const [entities, setEntities] = useState<string[]>(tplEntities(base, t));
  const [draftEnt, setDraftEnt] = useState('');
  const [discover, setDiscover] = useState<string[]>(base.discover);
  const [extract, setExtract] = useState<string[]>(base.extract);
  const [minEvidence, setMinEvidence] = useState(2);
  const [preferred, setPreferred] = useState('Official');
  const [threshold, setThreshold] = useState(80);
  const [frequency, setFrequency] = useState<Frequency>(base.frequency);
  const [deliver, setDeliver] = useState<string[]>(base.deliver);
  const [name, setName] = useState('');
  const applyTemplate = (id: string) => {
    const tpl = TEMPLATES.find((x) => x.id === id); if (!tpl) return;
    setTpl(id); setObjective(t(tpl.objectiveId)); setEntities(tplEntities(tpl, t)); setDiscover(tpl.discover); setExtract(tpl.extract); setFrequency(tpl.frequency); setDeliver(tpl.deliver); setName('');
  };
  const spec: ResearchSpec = { objective: objective.trim(), entities, sources: discover, extract, frequency, deliver: deliver.join(', '), minEvidence, preferredSource: preferred, confidenceThreshold: threshold };
  const baseName = t(base.nameId);
  const finalName = name.trim() || `${baseName}${entities[0] ? ` · ${entities[0]}` : ''}`;
  const addEnt = () => { const v = draftEnt.trim(); if (v && !entities.some((e) => e.toLowerCase() === v.toLowerCase())) setEntities([...entities, v]); setDraftEnt(''); };
  const valid = [objective.trim().length > 3, entities.length > 0, discover.length > 0, extract.length > 0, true, true, deliver.length > 0, true][step] ?? true;
  const cancel = () => go(dpath('missions'));
  const create = () => {
    const id = useDs.getState().addMission(finalName, base.key, spec);
    useDs.getState().toast(t('discovery.wizard.toast.created', { name: finalName }));
    go(dpath('missions', id));
  };
  return (
    <div className="dw-view">
      <div className="ds-mw">
        <header className="dw-wiz-h">
          <div><h2>{t('discovery.wizard.title')}</h2><p>{baseName} · {t(STEPS[step]!)}</p></div>
          <ol className="dw-wiz-steps" aria-label={t('discovery.wizard.steps')}>{STEPS.map((s, i) => <li key={s} className={i === step ? 'is-now' : i < step ? 'is-done' : ''} aria-current={i === step ? 'step' : undefined}><i>{i < step ? '✓' : i + 1}</i><span>{t(s)}</span></li>)}</ol>
          <IconButton icon="close" label={t('discovery.wizard.cancelNew')} onPress={cancel} />
        </header>
        <div className="ds-mw-b">
          {step === 0 && (<>
            <h3>{t('discovery.wizard.obj.title')}</h3>
            <p>{t('discovery.wizard.obj.text')}</p>
            <div className="dw-chips" role="group" aria-label={t('discovery.wizard.obj.template')}>{TEMPLATES.map((tpl) => <Chip key={tpl.id} on={tpl.id === tid} onClick={() => applyTemplate(tpl.id)}>{t(tpl.nameId)}</Chip>)}</div>
            <textarea value={objective} onChange={(e) => setObjective(e.target.value)} aria-label={t('discovery.wizard.step.objective')} />
            <p>{t('discovery.wizard.obj.inputs', { inputs: t(base.inputsId), monitors: base.monitors.slice(0, 6).map((m) => t(m)).join(', ') })}</p>
          </>)}
          {step === 1 && (<>
            <h3>{t('discovery.wizard.ent.title')}</h3><p>{t('discovery.wizard.ent.text')}</p>
            <div className="dw-chips" aria-label={t('discovery.nav.entities')}>{entities.map((e) => <span key={e} className="ds-mw-chip">{e}<button type="button" aria-label={t('discovery.wizard.ent.remove', { name: e })} onClick={() => setEntities(entities.filter((x) => x !== e))}><Icon name="close" size={12} /></button></span>)}{entities.length === 0 && <span className="dw-muted">{t('discovery.wizard.ent.none')}</span>}</div>
            <div className="ds-mw-row"><input type="text" className="ds-ms-in" value={draftEnt} onChange={(e) => setDraftEnt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEnt(); } }} placeholder={t('discovery.wizard.ent.add')} aria-label={t('discovery.wizard.ent.add')} /><Button size="sm" icon="plus" onPress={addEnt}>{t('discovery.wizard.ent.addBtn')}</Button></div>
          </>)}
          {step === 2 && (<><h3>{t('discovery.wizard.disc.title')}</h3><p>{t('discovery.wizard.disc.text')}</p><Toggles opts={DISCOVER_OPTS} on={discover} set={setDiscover} label={t('discovery.wizard.disc.label')} text={tokenLabel} /></>)}
          {step === 3 && (<><h3>{t('discovery.wizard.ext.title')}</h3><p>{t('discovery.wizard.ext.text')}</p><Toggles opts={EXTRACT_OPTS} on={extract} set={setExtract} label={t('discovery.wizard.ext.label')} text={tokenLabel} /></>)}
          {step === 4 && (<>
            <h3>{t('discovery.wizard.ver.title')}</h3><p>{t('discovery.wizard.ver.text')}</p>
            <div className="ds-mw-row">
              <label>{t('discovery.wizard.ver.min')}<select value={minEvidence} onChange={(e) => setMinEvidence(Number(e.target.value))} aria-label={t('discovery.wizard.ver.min')}>{[1, 2, 3, 4].map((n) => <option key={n} value={n}>{t('discovery.wizard.ver.sources', { n })}</option>)}</select></label>
              <label>{t('discovery.wizard.ver.pref')}<select value={preferred} onChange={(e) => setPreferred(e.target.value)} aria-label={t('discovery.wizard.ver.pref')}>{Object.keys(PREF_LABEL).map((n) => <option key={n} value={n}>{t(PREF_LABEL[n]!)}</option>)}</select></label>
              <label>{t('discovery.wizard.ver.threshold')}: <b className="bw-num">{threshold}%</b><input type="range" min={50} max={99} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} aria-label={t('discovery.wizard.ver.threshold')} /></label>
            </div>
          </>)}
          {step === 5 && (<><h3>{t('discovery.wizard.freq.title')}</h3><p>{t('discovery.wizard.freq.text')}</p>
            <div className="ds-mw-freq" role="group" aria-label={t('discovery.wizard.step.frequency')}>{FREQUENCIES.map((f) => <button key={f} type="button" aria-pressed={f === frequency} onClick={() => setFrequency(f)}><b>{t(FREQ_LABEL[f])}</b><small>{t(FREQ_NOTE[f])}</small></button>)}</div></>)}
          {step === 6 && (<><h3>{t('discovery.wizard.out.title')}</h3><p>{t('discovery.wizard.out.text')}</p><Toggles opts={OUTPUT_OPTS} on={deliver} set={setDeliver} label={t('discovery.wizard.out.label')} text={deliverLabel} /></>)}
          {step === 7 && (<>
            <h3>{t('discovery.wizard.step.review')}</h3>
            <label className="dw-muted" style={{ display: 'grid', gap: 4 }}>{t('discovery.wizard.rev.name')}<input type="text" className="ds-ms-in" value={name} placeholder={finalName} onChange={(e) => setName(e.target.value)} aria-label={t('discovery.wizard.rev.name')} /></label>
            <p>
              {t('discovery.wizard.rev.lead')} <b>{entities.join(', ') || t('discovery.wizard.rev.noEntities')}</b> {t('discovery.wizard.rev.body', {
                sources: discover.map(tokenLower).join(', ') || t('discovery.wizard.rev.noSources'), freq: t(FREQ_LABEL[frequency]).toLocaleLowerCase(locale), extract: extract.map(tokenLower).join(', ') || t('discovery.wizard.rev.nothing'),
                n: minEvidence, pref: t(PREF_CLAUSE[preferred] ?? 'discovery.wizard.pref.any'), pct: threshold })}
              {' '}{t('discovery.wizard.rev.deliver', { deliver: deliver.map((d) => deliverLabel(d).toLocaleLowerCase(locale)).join(', ') || t('discovery.wizard.rev.nowhere') })}
            </p>
            <b className="dw-muted">{t('discovery.wizard.rev.spec')}</b>
            <pre className="ds-spec">{specText(spec)}</pre>
          </>)}
        </div>
        <footer className="dw-wiz-f">
          <span className="dw-muted"><Icon name="lock" size={12} /> {t('discovery.wizard.footer')}</span>
          <span className="flex-1" />
          <Button size="sm" variant="ghost" onPress={cancel}>{t('discovery.wizard.cancel')}</Button>
          {step > 0 && <Button size="sm" onPress={() => setStep(step - 1)}>{t('discovery.wizard.back')}</Button>}
          {step < 7 ? <Button size="sm" variant="primary" isDisabled={!valid} onPress={() => setStep(step + 1)}>{t('discovery.wizard.next')}</Button> : <Button size="sm" variant="primary" icon="check" isDisabled={!valid} onPress={create}>{t('discovery.wizard.create')}</Button>}
        </footer>
      </div>
    </div>
  );
}
