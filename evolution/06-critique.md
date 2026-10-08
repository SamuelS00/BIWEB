# 06 · Crítica de design e pendências

## Revisão pela seção 17

- **Complexidade no motor, simplicidade na superfície:** cada workspace apresenta estado resumido e detalhes por seleção; configurações avançadas permanecem no ponto de uso.
- **Progressive disclosure e escape hatch:** modos têm controles nomeados e retorno ao modo anterior; não introduzir conversões unidirecionais.
- **Mesmo objeto em vistas sincronizadas:** mapa/tabela, grafo/grade/Gantt e visual/expressão usam os mesmos ids e estado de demonstração.
- **Preview antes de compromisso:** alterações de métrica, modelo, conexão e proposta são rascunhos com preview antes da publicação/aplicação.
- **Aprovar ≠ executar:** preservar dois atos separados em workflow.
- **Estado honesto:** valores da demo, atualização e execução devem ser rotulados como demonstração; falhas usam texto/ícone e não só cor.
- **Tempo global:** live/replay pertence ao mesmo controle e preserva filtros/seleção.
- **IA é opcional e sem identidade própria:** componentes e tokens existentes; IA desligada esconde superfícies de IA.

## Anti-patterns da seção 20 evitados

- Sem aplicar alterações por IA silenciosamente, sem estética paralela de IA e sem aprovação junto com execução.
- Sem SQL no frontend nem agregações livres; métricas citadas são publicadas no modelo semântico.
- Sem depender só de cor; estados incluem texto e/ou ícone.
- Sem grafo completo sem agrupamento; workflow oferece agrupamento, estado agregado e vistas alternativas.
- Sem dados reais inferidos de fixtures; exemplos novos são fictícios.

## Correções realizadas durante a implementação

- Copilot do editor passou a apresentar mudanças item a item e só aplicar depois de “Confirmar e aplicar”; recusar todos os itens não altera o documento.
- O desfazer do pedido permanece acessível após edição manual e recusa a operação com explicação, em vez de parecer uma ação quebrada/desabilitada.
- Copilot de dados ganhou contexto removível, interrupção da resposta, histórico local e nova conversa.
- A alternância Gráfico/Tabela usa as linhas filtradas do modelo semântico e conserva as propriedades do gráfico no estado do componente.
- O workspace saiu do canvas esquemático isolado e agora usa cartografia OSM atribuída, mantendo os overlays de negócio como dados locais sintéticos.
- A seleção de mapa/tabela, a busca categorizada, o inspector e as ferramentas de relação, rota e replay usam os padrões e tokens já existentes no shell.
- A tela de modelo usa rascunho/preview/impacto/publicação; execução de workflow é separada da aprovação.

## Pendências

- Integrações com conectores, execução/agenda do workflow e streaming real não estão implementadas no backend esqueleto.
- Validação com usuários e checagem completa WCAG 2.2 AA em todas as novas telas continuam necessárias.
- Transições de troca de view, estado de resync e diff visual de grafo são hipóteses por falta de evidência no pack.
- O mapa OSM requer internet para carregar a cartografia; sem tiles, overlays e estado local continuam visíveis sobre a superfície de fallback. Verificar a política de tiles/provedor e avaliar MapLibre/deck.gl antes de produção.
- Anomaly Explorer, SLA & Risk Monitor e Customer Behavior foram adicionados como relatórios locais para cobrir confiabilidade e adoção sem exigir serviços reais. Os dados são fixtures sintéticas e precisam continuar rotulados como demonstração.
