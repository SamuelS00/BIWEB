import { useState } from 'react';
import { Button, Icon, IconButton, Switch } from '@biweb/ui';
import { DISCOVER_OPTS, EXTRACT_OPTS, FREQUENCIES, OUTPUT_OPTS, TEMPLATES, specText, useMissionDraft } from '../data/missions';
import type { Frequency, ResearchSpec } from '../data/types';
import { useDs } from '../store';
import { Chip, dpath, useGo } from '../ui';
import './missions.css';

const STEPS = ['Objective', 'Entities', 'Discover', 'Extract', 'Verify', 'Frequency', 'Output', 'Review'];
const FREQ_NOTE: Record<Frequency, string> = { 'One time': 'Run once and stop', Daily: 'Every morning at 08:00', Weekly: 'Mondays at 07:00', Monthly: 'First day of the month' };

function Toggles({ opts, on, set, label }: { opts: readonly string[]; on: string[]; set: (v: string[]) => void; label: string }) {
  return (
    <div className="ds-mw-grid" role="group" aria-label={label}>
      {opts.map((o) => { const sel = on.includes(o); return <div key={o} className={`ds-mw-opt${sel ? ' is-on' : ''}`}><Switch isSelected={sel} onChange={(v) => set(v ? [...on, o] : on.filter((x) => x !== o))}>{o}</Switch></div>; })}
    </div>
  );
}

export function MissionWizard() {
  const go = useGo();
  const tid = useMissionDraft((s) => s.templateId), setTpl = useMissionDraft((s) => s.setTemplate);
  const base = TEMPLATES.find((t) => t.id === tid) ?? TEMPLATES[0]!;
  const [step, setStep] = useState(0);
  const [objective, setObjective] = useState(base.objective);
  const [entities, setEntities] = useState<string[]>(base.entities);
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
    const t = TEMPLATES.find((x) => x.id === id); if (!t) return;
    setTpl(id); setObjective(t.objective); setEntities(t.entities); setDiscover(t.discover); setExtract(t.extract); setFrequency(t.frequency); setDeliver(t.deliver); setName('');
  };
  const spec: ResearchSpec = { objective: objective.trim(), entities, sources: discover.map((x) => x.toLowerCase()), extract: extract.map((x) => x.toLowerCase()), frequency, deliver: deliver.join(', '), minEvidence, preferredSource: preferred, confidenceThreshold: threshold };
  const finalName = name.trim() || `${base.name}${entities[0] ? ` · ${entities[0]}` : ''}`;
  const addEnt = () => { const v = draftEnt.trim(); if (v && !entities.some((e) => e.toLowerCase() === v.toLowerCase())) setEntities([...entities, v]); setDraftEnt(''); };
  const valid = [objective.trim().length > 3, entities.length > 0, discover.length > 0, extract.length > 0, true, true, deliver.length > 0, true][step] ?? true;
  const cancel = () => go(dpath('missions'));
  const create = () => {
    const id = useDs.getState().addMission(finalName, base.name, spec);
    useDs.getState().toast(`Mission created: ${finalName}`);
    go(dpath('missions', id));
  };
  return (
    <div className="dw-view">
      <div className="ds-mw">
        <header className="dw-wiz-h">
          <div><h2>New research mission</h2><p>{base.name} · {STEPS[step]}</p></div>
          <ol className="dw-wiz-steps" aria-label="Steps">{STEPS.map((s, i) => <li key={s} className={i === step ? 'is-now' : i < step ? 'is-done' : ''} aria-current={i === step ? 'step' : undefined}><i>{i < step ? '✓' : i + 1}</i><span>{s}</span></li>)}</ol>
          <IconButton icon="close" label="Cancel new mission" onPress={cancel} />
        </header>
        <div className="ds-mw-b">
          {step === 0 && (<>
            <h3>What do you want to find out?</h3>
            <p>Describe the objective in your own words. BIWEB turns it into sources, checks and evidence; you never configure a scraper.</p>
            <div className="dw-chips" role="group" aria-label="Template">{TEMPLATES.map((t) => <Chip key={t.id} on={t.id === tid} onClick={() => applyTemplate(t.id)}>{t.name}</Chip>)}</div>
            <textarea value={objective} onChange={(e) => setObjective(e.target.value)} aria-label="Objective" />
            <p>Input: {base.inputs}. Typically monitors {base.monitors.slice(0, 6).join(', ')}.</p>
          </>)}
          {step === 1 && (<>
            <h3>Who is this about?</h3><p>Entities the mission follows. Each one is resolved against evidence before it is accepted.</p>
            <div className="dw-chips" aria-label="Entities">{entities.map((e) => <span key={e} className="ds-mw-chip">{e}<button type="button" aria-label={`Remove ${e}`} onClick={() => setEntities(entities.filter((x) => x !== e))}><Icon name="close" size={12} /></button></span>)}{entities.length === 0 && <span className="dw-muted">No entities yet.</span>}</div>
            <div className="ds-mw-row"><input type="text" className="ds-ms-in" value={draftEnt} onChange={(e) => setDraftEnt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEnt(); } }} placeholder="Add an entity" aria-label="Add an entity" /><Button size="sm" icon="plus" onPress={addEnt}>Add</Button></div>
          </>)}
          {step === 2 && (<><h3>Where should it look?</h3><p>Kinds of public or authorized sources. Sources that block access are skipped and the reason is shown.</p><Toggles opts={DISCOVER_OPTS} on={discover} set={setDiscover} label="Source types" /></>)}
          {step === 3 && (<><h3>What should it extract?</h3><p>Each extracted claim keeps its source, evidence and confidence.</p><Toggles opts={EXTRACT_OPTS} on={extract} set={setExtract} label="Extraction targets" /></>)}
          {step === 4 && (<>
            <h3>How is a claim verified?</h3><p>A claim below these limits is shown as Needs verification instead of being accepted.</p>
            <div className="ds-mw-row">
              <label>Minimum evidence<select value={minEvidence} onChange={(e) => setMinEvidence(Number(e.target.value))} aria-label="Minimum evidence">{[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'source' : 'sources'}</option>)}</select></label>
              <label>Preferred source<select value={preferred} onChange={(e) => setPreferred(e.target.value)} aria-label="Preferred source">{['Official', 'Secondary', 'Any'].map((n) => <option key={n}>{n}</option>)}</select></label>
              <label>Confidence threshold: <b className="bw-num">{threshold}%</b><input type="range" min={50} max={99} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} aria-label="Confidence threshold" /></label>
            </div>
          </>)}
          {step === 5 && (<><h3>How often?</h3><p>Missions only observe on this schedule. You can pause or run now at any time.</p>
            <div className="ds-mw-freq" role="group" aria-label="Frequency">{FREQUENCIES.map((f) => <button key={f} type="button" aria-pressed={f === frequency} onClick={() => setFrequency(f)}><b>{f}</b><small>{FREQ_NOTE[f]}</small></button>)}</div></>)}
          {step === 6 && (<><h3>Where should results go?</h3><p>Results are proposals. LDE validates before anything is trusted; nothing is applied automatically.</p><Toggles opts={OUTPUT_OPTS} on={deliver} set={setDeliver} label="Outputs" /></>)}
          {step === 7 && (<>
            <h3>Review</h3>
            <label className="dw-muted" style={{ display: 'grid', gap: 4 }}>Mission name<input type="text" className="ds-ms-in" value={name} placeholder={finalName} onChange={(e) => setName(e.target.value)} aria-label="Mission name" /></label>
            <p>
              This mission will follow <b>{entities.join(', ') || 'no entities yet'}</b> on {discover.join(', ').toLowerCase() || 'no sources'}, {frequency === 'One time' ? 'one time' : frequency.toLowerCase()}. It extracts {extract.join(', ').toLowerCase() || 'nothing yet'} and accepts a claim only when at least {minEvidence} {minEvidence === 1 ? 'source supports' : 'independent sources support'} it, preferring {preferred.toLowerCase()} sources, with confidence of {threshold}% or more.
              Results go to {deliver.join(', ').toLowerCase() || 'nowhere yet'} as proposals; nothing is applied silently.
            </p>
            <b className="dw-muted">ResearchSpec</b>
            <pre className="ds-spec">{specText(spec)}</pre>
          </>)}
        </div>
        <footer className="dw-wiz-f">
          <span className="dw-muted"><Icon name="lock" size={12} /> Public or authorized sources only. robots.txt, authentication and rate limits are respected.</span>
          <span className="flex-1" />
          <Button size="sm" variant="ghost" onPress={cancel}>Cancel</Button>
          {step > 0 && <Button size="sm" onPress={() => setStep(step - 1)}>Back</Button>}
          {step < 7 ? <Button size="sm" variant="primary" isDisabled={!valid} onPress={() => setStep(step + 1)}>Next</Button> : <Button size="sm" variant="primary" icon="check" isDisabled={!valid} onPress={create}>Create mission</Button>}
        </footer>
      </div>
    </div>
  );
}
