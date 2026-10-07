import { useNavigate } from '@tanstack/react-router';
import { Copilot } from '@biweb/assistant-ui';
import { Banner } from '@biweb/ui';
import { mockCopilot } from '../copilot/engine';
import { networkCopilot } from '../copilot/network';
import { WORKSPACES } from './gallery';
import { user } from '../fixtures/lume-varejo';
import { asset, useUi } from '../state/ui-store';

/** Copilot em tela cheia: mesma conversa do painel lateral. */
export function CopilotPage() {
  const ui = useUi();
  const navigate = useNavigate();
  if (!ui.aiEnabled) return <div className="pg"><Banner tone="info">O Copilot está desligado. Ligue em Exibição e preferências.</Banner></div>;
  return (
    <div className="cp-page">
      <Copilot variant="page" engine={ui.workspace === 'rede' ? networkCopilot : mockCopilot} context={{ label: `Workspace ${WORKSPACES[ui.workspace].label}` }} userName={user.name} brandMark={asset('brand/mark.webp')} dashTheme={ui.dashTheme}
        messages={ui.copilotMessages} setMessages={ui.setCopilotMessages} prompt={ui.copilotPrompt}
        onOpenReport={(id) => navigate({ to: '/reports/$reportId', params: { reportId: id } })}
        onAction={(id) => { if (id === 'create-analysis') navigate({ to: '/reports/$reportId', params: { reportId: 'rpt_analise_queda' } }); if (id === 'open-model') navigate({ to: '/models/$modelId', params: { modelId: 'sem_vendas_varejo' } }); }} />
    </div>
  );
}
