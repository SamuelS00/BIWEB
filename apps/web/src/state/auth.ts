import { create } from 'zustand';

/** Sessão de demonstração (sem backend): guardada na aba, não no disco. A tela de login é a única consumidora hoje. */
export type SignInMethod = 'password' | 'microsoft' | 'google' | 'org';
interface AuthState {
  signedIn: boolean;
  signIn: (method: SignInMethod, cred?: { email: string; password: string }) => Promise<void>;
  signOut: () => void;
}
const KEY = 'biweb.session';
const read = () => { try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; } };
const write = (on: boolean) => { try { if (on) sessionStorage.setItem(KEY, '1'); else sessionStorage.removeItem(KEY); } catch { /* armazenamento indisponível */ } };

export class AuthError extends Error { constructor(public code: 'invalid_credentials') { super(code); } }

/** Credenciais de demonstração: qualquer e-mail válido com senha de 6+ caracteres, exceto senhas óbvias. */
const WEAK = new Set(['123456', '12345678', 'password', 'senha123', 'incorreta']);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const useAuth = create<AuthState>((set) => ({
  signedIn: read(),
  signIn: async (method, cred) => {
    await sleep(method === 'password' ? 650 : 450);
    if (method === 'password' && (!cred || cred.password.length < 6 || WEAK.has(cred.password.toLowerCase()))) throw new AuthError('invalid_credentials');
    write(true); set({ signedIn: true });
  },
  signOut: () => { write(false); set({ signedIn: false }); },
}));
