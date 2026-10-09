import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Icon } from '@biweb/ui';
import { applyRootPrefs, asset, useUi } from '../../state/ui-store';
import { AuthError, useAuth, type SignInMethod } from '../../state/auth';
import { BiwebMark, Chain, ProductPulse, useReducedMotion, type PulseMode } from './pulse';
import './login.css';

type Phase = 'idle' | 'authenticating' | 'connecting' | 'connected';
const EMAIL_KEY = 'biweb.login.email';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const remembered = () => { try { return localStorage.getItem(EMAIL_KEY) ?? ''; } catch { return ''; } };
const LABEL: Record<Phase, string> = { idle: 'Entrar', authenticating: 'Autenticando…', connecting: 'Conectando workspace…', connected: 'Conectado' };

export function LoginPage() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const ui = useUi();
  const signIn = useAuth((s) => s.signIn);
  const [email, setEmail] = useState(remembered);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(() => remembered() !== '');
  const [showPw, setShowPw] = useState(false);
  const [caps, setCaps] = useState(false);
  const [errs, setErrs] = useState<{ email?: string; password?: string }>({});
  const [authError, setAuthError] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [leaving, setLeaving] = useState(false);
  const [mode, setMode] = useState<'signin' | 'forgot'>('signin');
  const [sent, setSent] = useState(false);
  const [sso, setSso] = useState(false);
  const [org, setOrg] = useState('');
  const [orgErr, setOrgErr] = useState('');
  const emailRef = useRef<HTMLInputElement>(null), pwRef = useRef<HTMLInputElement>(null), orgRef = useRef<HTMLInputElement>(null);
  const alive = useRef(true);
  const ids = { email: useId(), pw: useId(), emailErr: useId(), pwErr: useId(), pwHint: useId(), sso: useId(), org: useId(), orgErr: useId() };
  const busy = phase !== 'idle';

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => applyRootPrefs({ appTheme: ui.appTheme, density: ui.density }), [ui.appTheme, ui.density]);
  useEffect(() => { const t = document.title; document.title = 'Entrar · BIWEB Studio'; return () => { document.title = t; }; }, []);
  useEffect(() => { (email ? pwRef : emailRef).current?.focus(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Depois da autenticação: conecta o workspace e deixa a tela convergir para o Início. Só espera o necessário para a transição ler. */
  async function enter() {
    setPhase('connecting'); await sleep(reduced ? 250 : 750); if (!alive.current) return;
    setPhase('connected'); await sleep(reduced ? 150 : 800); if (!alive.current) return;
    setLeaving(true); await sleep(reduced ? 80 : 300); if (!alive.current) return;
    navigate({ to: '/' });
  }

  async function submit(e: FormEvent) {
    e.preventDefault(); if (busy) return;
    const next = { ...(EMAIL_RE.test(email.trim()) ? {} : { email: email.trim() ? 'Informe um e-mail válido, como nome@empresa.com.' : 'Informe seu e-mail.' }), ...(password ? {} : { password: 'Informe sua senha.' }) };
    setErrs(next); setAuthError(false);
    if (next.email) { emailRef.current?.focus(); return; }
    if (next.password) { pwRef.current?.focus(); return; }
    setPhase('authenticating');
    try { await signIn('password', { email: email.trim(), password }); }
    catch (err) {
      if (!alive.current) return;
      setPhase('idle'); if (err instanceof AuthError) { setAuthError(true); pwRef.current?.focus(); pwRef.current?.select(); } return;
    }
    try { if (remember) localStorage.setItem(EMAIL_KEY, email.trim()); else localStorage.removeItem(EMAIL_KEY); } catch { /* armazenamento indisponível */ }
    await enter();
  }

  async function federated(method: SignInMethod) {
    if (busy) return;
    setPhase('authenticating'); await signIn(method); if (alive.current) await enter();
  }
  async function submitOrg(e: FormEvent) {
    e.preventDefault(); if (busy) return;
    if (!/^[a-z0-9-]{2,}$/i.test(org.trim())) { setOrgErr('Informe o identificador da organização, como lume-varejo.'); orgRef.current?.focus(); return; }
    setOrgErr(''); await federated('org');
  }
  const sniffCaps = (e: KeyboardEvent) => setCaps(e.getModifierState?.('CapsLock') ?? false);
  const markDone = (field: 'email' | 'password') => {
    const v = field === 'email' ? (EMAIL_RE.test(email.trim()) ? undefined : email.trim() ? 'Informe um e-mail válido, como nome@empresa.com.' : undefined) : undefined;
    setErrs((p) => ({ ...p, [field]: v }));
  };

  const pulse: PulseMode = phase === 'connected' ? 'connected' : phase === 'connecting' ? 'connecting' : 'idle';

  return (
    <div className={`lp${leaving ? ' is-leaving' : ''}${phase === 'connected' ? ' is-connected' : ''}`}>
      <section className="lp-side">
        <header className="lp-brand">
          <picture className="lp-logo">
            <img className="logo-on-light" src={asset('brand/logo-light.webp')} alt="BIWEB Studio" height={30} />
            <img className="logo-on-dark" src={asset('brand/logo-dark.webp')} alt="" height={30} />
          </picture>
        </header>

        <main className="lp-main">
          <Chain className="lp-chain--ribbon" />
          {mode === 'signin' ? (
            <form className="lp-form" onSubmit={submit} noValidate aria-busy={busy}>
              <div className="lp-head">
                <h1>Bem-vindo de volta</h1>
                <p>Entre no BIWEB Studio.</p>
              </div>

              <div className={`lp-field${errs.email ? ' has-error' : ''}`}>
                <label htmlFor={ids.email}>E-mail</label>
                <input ref={emailRef} id={ids.email} type="email" name="email" autoComplete="username" inputMode="email" placeholder="nome@empresa.com" spellCheck={false} autoCapitalize="none"
                  value={email} onChange={(e) => { setEmail(e.target.value); if (errs.email) setErrs((p) => ({ ...p, email: undefined })); setAuthError(false); }} onBlur={() => markDone('email')}
                  disabled={busy} aria-invalid={!!errs.email} aria-describedby={errs.email ? ids.emailErr : undefined} />
                {errs.email && <p className="lp-err" id={ids.emailErr} role="alert"><Icon name="warning" size={12} />{errs.email}</p>}
              </div>

              <div className={`lp-field${errs.password || authError ? ' has-error' : ''}`}>
                <div className="lp-label-row">
                  <label htmlFor={ids.pw}>Senha</label>
                  <button type="button" className="lp-link" onClick={() => { setMode('forgot'); setSent(false); setAuthError(false); }} disabled={busy}>Esqueci a senha</button>
                </div>
                <div className="lp-pw">
                  <input ref={pwRef} id={ids.pw} type={showPw ? 'text' : 'password'} name="password" autoComplete="current-password" value={password}
                    onChange={(e) => { setPassword(e.target.value); if (errs.password) setErrs((p) => ({ ...p, password: undefined })); setAuthError(false); }}
                    onKeyDown={sniffCaps} onKeyUp={sniffCaps} onBlur={() => setCaps(false)} disabled={busy}
                    aria-invalid={!!errs.password || authError} aria-describedby={[errs.password ? ids.pwErr : '', authError ? ids.pwErr : '', caps ? ids.pwHint : ''].filter(Boolean).join(' ') || undefined} />
                  <button type="button" className="lp-eye" aria-pressed={showPw} aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'} title={showPw ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPw((v) => !v)} disabled={busy}>
                    <Icon name={showPw ? 'eyeOff' : 'eye'} size={16} />
                  </button>
                </div>
                {caps && <p className="lp-hint" id={ids.pwHint} role="status"><Icon name="warning" size={12} />Caps Lock está ativado.</p>}
                {errs.password && <p className="lp-err" id={ids.pwErr} role="alert"><Icon name="warning" size={12} />{errs.password}</p>}
                {authError && (
                  <div className="lp-err lp-err--auth" id={ids.pwErr} role="alert">
                    <Icon name="warning" size={12} /><span><b>Não foi possível entrar.</b> Confira seu e-mail e senha e tente novamente.</span>
                  </div>
                )}
              </div>

              <label className="lp-check">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} disabled={busy} />
                <span className="lp-box" aria-hidden="true"><svg viewBox="0 0 10 10"><path d="M1.5 5.2l2.3 2.3L8.5 2.8" /></svg></span>
                Manter e-mail neste dispositivo
              </label>

              <button type="submit" className={`lp-submit is-${phase}`} aria-disabled={busy} onClick={(e) => { if (busy) e.preventDefault(); }}>
                <span className="lp-submit-fill" aria-hidden="true" />
                <span className="lp-submit-in">
                  {busy && <BiwebMark state={phase === 'connected' ? 'done' : 'loading'} />}
                  <span key={phase} className="lp-submit-label" role="status" aria-live="polite">{LABEL[phase]}</span>
                </span>
              </button>

              <div className="lp-or" role="separator" aria-label="ou"><span>ou</span></div>

              <button type="button" className="lp-alt" aria-expanded={sso} aria-controls={ids.sso} onClick={() => { setSso((v) => !v); }} disabled={busy}>
                <Icon name="key" size={16} />Continuar com SSO<Icon name="chevronDown" size={12} />
              </button>
              <div className="lp-sso" id={ids.sso} hidden={!sso} onKeyDown={(e) => { if (e.key === 'Escape') setSso(false); }}>
                <div className="lp-sso-in">
                  <div className="lp-providers">
                    <button type="button" className="lp-alt lp-alt--sm" onClick={() => federated('microsoft')} disabled={busy}>
                      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="currentColor"><path d="M0 0h6.5v6.5H0zM7.5 0H14v6.5H7.5zM0 7.5h6.5V14H0zM7.5 7.5H14V14H7.5z" opacity=".85" /></svg>Microsoft
                    </button>
                    <button type="button" className="lp-alt lp-alt--sm" onClick={() => federated('google')} disabled={busy}>
                      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 4.2A5.4 5.4 0 107 12.4c2.6 0 4-1.7 4.2-3.7H7.2" /></svg>Google
                    </button>
                  </div>
                  <form className="lp-org" onSubmit={submitOrg} noValidate>
                    <label htmlFor={ids.org}>Entrar com a organização</label>
                    <div className={`lp-org-row${orgErr ? ' has-error' : ''}`}>
                      <div className="lp-org-input">
                        <input ref={orgRef} id={ids.org} value={org} onChange={(e) => { setOrg(e.target.value); setOrgErr(''); }} placeholder="sua-organização" autoComplete="organization" spellCheck={false} autoCapitalize="none"
                          aria-invalid={!!orgErr} aria-describedby={orgErr ? ids.orgErr : undefined} disabled={busy} />
                        <span aria-hidden="true">.biweb.app</span>
                      </div>
                      <button type="submit" className="lp-go" aria-label="Continuar com a organização" disabled={busy}><Icon name="arrowRight" size={16} /></button>
                    </div>
                    {orgErr && <p className="lp-err" id={ids.orgErr} role="alert"><Icon name="warning" size={12} />{orgErr}</p>}
                  </form>
                </div>
              </div>
            </form>
          ) : (
            <form className="lp-form" noValidate onSubmit={(e) => { e.preventDefault(); if (!EMAIL_RE.test(email.trim())) { setErrs({ email: 'Informe um e-mail válido, como nome@empresa.com.' }); emailRef.current?.focus(); return; } setErrs({}); setSent(true); }}>
              <div className="lp-head"><h1>Redefinir senha</h1><p>Enviaremos um link para o seu e-mail.</p></div>
              <div className={`lp-field${errs.email ? ' has-error' : ''}`}>
                <label htmlFor={ids.email}>E-mail</label>
                <input ref={emailRef} id={ids.email} type="email" autoComplete="username" inputMode="email" placeholder="nome@empresa.com" value={email} autoFocus
                  onChange={(e) => { setEmail(e.target.value); setErrs({}); setSent(false); }} aria-invalid={!!errs.email} aria-describedby={errs.email ? ids.emailErr : undefined} />
                {errs.email && <p className="lp-err" id={ids.emailErr} role="alert"><Icon name="warning" size={12} />{errs.email}</p>}
              </div>
              {sent && <p className="lp-ok" role="status"><Icon name="check" size={12} />Se houver uma conta para este e-mail, o link chegará em instantes.</p>}
              <button type="submit" className="lp-submit"><span className="lp-submit-fill" aria-hidden="true" /><span className="lp-submit-in"><span className="lp-submit-label">Enviar link</span></span></button>
              <button type="button" className="lp-alt lp-back" onClick={() => { setMode('signin'); setErrs({}); }}><Icon name="arrowLeft" size={16} />Voltar para o login</button>
            </form>
          )}
        </main>

        <footer className="lp-foot">
          <span className="lp-ok-dot" aria-hidden="true" /><span>Todos os serviços operando</span>
          <span className="lp-sp" />
          <a href="#privacidade" onClick={(e) => e.preventDefault()}>Privacidade</a><a href="#termos" onClick={(e) => e.preventDefault()}>Termos</a>
        </footer>
      </section>

      <section className="lp-visual"><ProductPulse mode={pulse} /></section>
    </div>
  );
}
