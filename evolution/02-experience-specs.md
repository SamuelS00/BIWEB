# 02 · Especificações das experiências

## 1. AI Copilot
- **Zonas:** cabeçalho do dock, chips de contexto, conversa/status, área de revisão, compositor.
- **Componentes:** o Copilot existente, chips editáveis/removíveis, linha de ferramenta com Interromper, lista de conversas, resumo e lista por objeto/mudança.
- **Estados:** vazio contextual, pensando, interrompido, proposta pronta, item aceito/rejeitado, aplicada, bloqueio de desfazer após edição manual.
- **Interações:** editar contexto antes do envio; anexar visual selecionado; nova conversa/histórico; revisar cada mudança; confirmar aplicação. Aprovar proposta de workflow não inicia execução.
- **Evidência:** chips/status e undo turn (REF-21); staging (REF-25); aprovação separada de execução (REF-23); item a item e “1 de N” (REF-20).
- **Hipótese:** aparência/posição de histórico no dock quando o espaço é limitado.

## 2. Troca de visualização
- **Zonas:** controles na borda do mapa/visual; aviso de perda; nota de limites.
- **Componentes:** toggle Gráfico/Tabela, 2D/3D, seletor de camadas e banner de mudança.
- **Estados:** forma atual, tabela com linhas do modelo, modo 2D, modo 3D, camada ligada/desligada, configuração não compatível.
- **Interações:** alternar preserva os dados/estado original; se a configuração não puder ser transportada, exibe quais itens ficam de fora e exige confirmação.
- **Evidência:** tabela sem perda de configuração (REF-26); modos e limites declarados (REF-29); aviso de perda (REF-27/28).
- **Hipótese:** transição/skeleton e comportamento visual de camadas enquanto carregam (Apêndice A.1).

## 3. Dados e modelo
- **Zonas:** catálogo de fontes, etapas de conexão, catálogo de datasets, canvas por assunto, inspector de relação/métrica, lineage e impacto.
- **Componentes:** formulário manual compartilhado com Copilot, teste, schema/preview, diagram nodes/edges, cardinalidade, editor visual/expressão, autocomplete, validação, grafo/tabela de lineage.
- **Estados:** sem fonte, conectado, desatualizado, teste aprovado/falhou, schema alterado, rascunho válido/inválido, impacto baixo/médio/alto, publicado.
- **Interações:** selecionar fonte→credencial→testar→schema→seleção→preview→agenda; arrastar relação e confirmar no inspector; Visual ⇄ expressão sem converter silenciosamente; prévia→impacto→publicação.
- **Evidência:** REF-55/57/61/62/65/67/70–73.
- **Hipótese:** conectores e validação são demonstrações locais, sem comunicação com serviços.

## 4. Map workspace
- **Zonas:** header integrado ao shell, busca categorizada, canvas OSM, layer manager por domínio, estilos base, toolbar espacial, inspector e timeline recolhível.
- **Estados:** mapa/rede/tabela, seleção, dependências, rota, filtros, layers/opacidade, viewport, 2D/3D, Light/Dark/Terrain, live/pausado/replay, fullscreen e seleção espacial.
- **Interações:** busca por ativo/trecho/incidente/localidade; seleção mantém o id na URL e abre inspector; tabela e mapa compartilham a seleção; zoom usa tiles geográficos; layers controlam a cena; ferramentas demonstram retângulo/polígono/raio/medida; rota e dependências destacam relações.
- **Evidência:** REF-43/44/45; REF-36 para detalhes e arestas; OSM contribui apenas cartografia e não dados operacionais.
- **Limite:** rede, telemetria, incidentes e resultados são fixtures; tiles OSM exigem conexão de rede e têm atribuição exibida. Não há MapLibre/deck.gl/Cesium instalados; a cena e as interações são uma implementação local leve, sem alegar performance de produção.

## Anomaly Explorer, SLA & Risk Monitor e Customer Behavior
- **Zonas:** contexto de filtros, faixa de KPIs, visuais de análise, evidências e observações explicativas.
- **Estados:** região/medida para anomalias; serviço/janela para SLO; jornada/coorte/caminhos e segmento para comportamento.
- **Interações:** filtros recalculam os dados mockados no cliente; alertas e linhas de tabela abrem contexto relevante; atualização representa uma nova execução simulada.
- **Evidência × hipótese:** valores, contagens e eventos são evidências do conjunto sintético; leituras causais são explicitamente rotuladas como hipóteses.
- **Limite:** não há serviço real, telemetria, envio de alertas ou execução remota; os controles demonstram a experiência do produto.

## 5. Network Intelligence
- **Zonas:** barra de filtros/tempo, resumo, grafo hierárquico, legenda dupla, drawer contextual, tabela de enlaces.
- **Estados:** visão geral, nó selecionado, enlace selecionado, saúde crítica, foco por região.
- **Interações:** selecionar links como objetos; drawer muda por tipo de entidade; utilização sequencial e saúde discreta separadas.
- **Evidência:** REF-36/37/38/99.
- **Hipótese:** dados e thresholds da Rede Metropolitana são ficcionais.

## 6. Incident Intelligence
- **Zonas:** filtros/facetas, KPIs compactos, mapa agregável, histograma/timeline, feed e drawer de evidência.
- **Estados:** ponto/cluster/heatmap/hexbin, confirmado/suspeito, selecionado, vazio, explicação sem IA.
- **Interações:** clicar no evento sincroniza mapa/tabela/instante; “Explicar” lista regra, campos e dados de origem usados.
- **Evidência:** REF-41/40/100/102.
- **Hipótese:** explicação determinística demonstrativa; nenhuma inferência generativa real.

## 7. Tempo real e replay
- **Zonas:** controle global no contexto do mapa/relatório, carimbo de atualização, densidade temporal e janela deslizante.
- **Estados:** ao vivo, pausado por interação, replay, histórico, dados amostrados.
- **Interações:** selecionar tempo sai de live; Play avança; ao voltar para live preserva filtros e seleção.
- **Evidência:** REF-30/31/32/33/34/35.
- **Hipótese:** taxa de atualização simulada por fixture; saúde de conexão/resync não é evidência (Apêndice A.1).

## 8. Intelligent Workflow
- **Zonas:** toolbar/status, canvas e minimapa, logs/detalhes, alternância Grafo/Grade/Gantt, painel de proposta.
- **Estados:** rascunho, válido, pendente de aprovação, aprovado, executando, sucesso/falha/parcial; grupo colapsado.
- **Interações:** retry por nó; logs; agendamento; proposta natural com diff e selo de validação; Aprovar cria versão aprovada, Executar é ação separada.
- **Evidência:** REF-80/84/85/77/79.
- **Hipótese:** ghost nodes/diff visual não são evidência no pack; qualquer comparação usa lista textual e deve ser validada. Execução é simulada.

## 9. Street Intelligence 3D
- **Zonas:** cena OSM urbana, controls 2D/3D, edificações, sites e caminhos de infraestrutura, popup/inspector e atribuição da cartografia.
- **Estados:** 2D, 3D inclinado, prédio selecionado, camada desligada.
- **Interações:** altura por utilização mockada; painel/cena sincronizados; volta para 2D mantém filtros; estilos e zoom continuam disponíveis.
- **Evidência:** REF-46/47/48/110.
- **Hipótese:** edifícios extrudidos e caminhos são dados locais demonstrativos, não um gêmeo urbano medido.

## 10. Dependency & Impact e Historical Replay
- **Dependency & Impact:** entra com um POP selecionado; reduz a opacidade de itens não relacionados e destaca vizinhos, enlaces e serviços dependentes.
- **Historical Replay:** abre a mesma cena e preserva camadas; a janela e o cursor alteram a simulação temporal; playback, velocidade, passo anterior/próximo e retorno a live são locais.
