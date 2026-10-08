# 05 · Rastreabilidade

| Experiência/decisão | REF | Tipo | Decisão no BIWEB |
|---|---|---|---|
| Contexto visível, status de ferramenta, undo guard | REF-21 | EVIDÊNCIA | Evoluir o dock e a seleção como contexto; desfazer pedido somente se sem edição manual posterior. |
| Mudanças em staging e revisão | REF-25 | EVIDÊNCIA | Não alterar canvas sem confirmação; mostrar resumo e detalhe por objeto. |
| Aprovação separada da execução | REF-23 | EVIDÊNCIA | Botões distintos para Aprovar proposta e Executar workflow. |
| “1 de N”, checkpoints e revisão individual | REF-20 | EVIDÊNCIA | Navegação item a item e aceitar/rejeitar individualmente. |
| Gráfico e tabela mantendo configuração | REF-26 | EVIDÊNCIA | Alternância contextual preserva configuração publicada. |
| Modo 2D/3D e limites por modo | REF-29 | EVIDÊNCIA | Controles rotulados e limite textual no mapa. |
| Live como estado temporal e sampling | REF-31 | EVIDÊNCIA | Estado ao vivo dentro do controle global; carimbo demonstrativo. |
| Histograma + janela deslizante de replay | REF-33 | EVIDÊNCIA | Linha temporal com distribuição e intervalo selecionável. |
| Mapa de rede com saúde ≠ utilização e aresta | REF-36 | EVIDÊNCIA | Legendas separadas; detalhe para nó e enlace. |
| Agregação ponto/cluster/heatmap/hexbin | REF-41 | EVIDÊNCIA | Quatro modos da mesma layer de eventos. |
| Busca geoespacial e localização | Solicitação BIWEB Geo | IMPLEMENTAÇÃO | Resultados locais categorizados para POP, trecho, localidade e incidente. |
| Camadas, opacidade e estilos de base | Solicitação BIWEB Geo | IMPLEMENTAÇÃO | Manager agrupado, legenda atualizada, tiles OSM e estilos BIWEB. |
| Dependências, rotas e fluxo | REF-36 + solicitação BIWEB Geo | IMPLEMENTAÇÃO | Realce de adjacências, gargalo/alternativa e fluxo animado sem backend. |
| Seleção espacial e resumo | Solicitação BIWEB Geo | IMPLEMENTAÇÃO | Retângulo, polígono, raio e distância exemplificados em overlays locais. |
| Tabela e seleção compartilhada | REF-26 + solicitação BIWEB Geo | IMPLEMENTAÇÃO | Mapa e tabela preservam o identificador selecionado. |
| Dependency & Impact / Historical Replay | Solicitação BIWEB Geo | IMPLEMENTAÇÃO | Relatórios da galeria abrem o mesmo workspace em modo de dependência ou replay. |
| Anomaly Explorer, SLA & Risk Monitor e Customer Behavior | REF-103/105/106 | EVIDÊNCIA | Três relatórios da galeria, com visuais e controles no cliente usando fixtures locais. |
| Protótipo sem backend | Plano de evolução | EVIDÊNCIA | Dados e efeitos estão explicitamente simulados e sinalizados na interface. |
| Modelagem visual por assunto/relação | REF-55 | EVIDÊNCIA | Diagrama visual com confirmação de relação no inspector. |
| Métrica em rascunho, prévia e publicação | REF-57/65 | EVIDÊNCIA | Valor/validação preview antes de publicar. |
| Grafo + tabela de lineage/impacto | REF-61/62 | EVIDÊNCIA | Vista visual e tabela de entidades atingidas. |
| Conector Agent ⇄ Form e sequência de setup | REF-67/70 | EVIDÊNCIA | Mesmo formulário com modo assistido; teste/schema/preview/agendamento. |
| Erros acionáveis | REF-73 | EVIDÊNCIA | Causa e próxima ação junto ao estado da fonte. |
| Workflow com grupo, grade/Gantt, retry | REF-80/84 | EVIDÊNCIA | Três projeções do mesmo fluxo, execução por nó. |
| Proposta NL validada | REF-85 | EVIDÊNCIA | Rascunho mostra validação antes da aprovação; execução separada segue REF-23. |
| Transição/skeleton durante troca | Apêndice A.1 | HIPÓTESE A VALIDAR | Sem alegar evidência; feedback imediato com estado simples. |
| Saúde/resync de conexão | Apêndice A.1 | HIPÓTESE A VALIDAR | Não mostrar indicador de resync como telemetria real. |
| Diff visual/ghost nodes no grafo | Apêndice A.1 | HIPÓTESE A VALIDAR | Não adotar ghost nodes; mudança da proposta descrita em lista. |
| Dados e resultados das demos | REF-99/100/102/110/111 | HIPÓTESE | Todas as entidades, métricas e resultados são fictícios/simulados; apenas a cartografia de ruas usa OSM. |
