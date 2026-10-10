import { Switch } from '@biweb/ui';
import { useDw } from './store';

export function PrivacyBlock() {
  const ai = useDw((s) => s.ai), setAi = useDw((s) => s.setAi);
  return (
    <div className="dw-priv" aria-label="Privacidade da IA">
      <b>Somente metadados</b>
      <ul><li className="is-ok">✓ Nomes</li><li className="is-ok">✓ Tipos</li><li className="is-ok">✓ Estatísticas</li><li className="is-ok">✓ Padrões</li><li className="is-no">✕ Valores brutos</li></ul>
      <Switch isSelected={ai.samples} isDisabled={ai.mode === 'off'} onChange={(v) => setAi({ samples: v, mode: v ? 'masked' : 'metadata' })}>Amostras mascaradas (requer aprovação)</Switch>
      <label className="dw-field"><span>Documentos</span>
        <select value={ai.docs} disabled={ai.mode === 'off'} onChange={(e) => setAi({ docs: e.target.value as 'none' | 'masked' | 'allowed' })}><option value="none">Nenhum</option><option value="masked">Mascarados</option><option value="allowed">Permitidos</option></select></label>
    </div>
  );
}
