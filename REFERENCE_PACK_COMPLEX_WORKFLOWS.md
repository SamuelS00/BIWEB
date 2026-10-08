# BIWEB Studio — Complex Data, GIS, Workflow & AI Interaction Reference Pack

> **Documento complementar.** Não substitui nem reescreve o `REFERENCE_PACK_BI.md` (fundamentos visuais, Power BI, Figma, Tableau, Grafana: REF-01 a REF-17).
> **Pergunta central:** *como produtos profissionais expõem capacidades extremamente complexas através de experiências simples, progressivas e compreensíveis?*
> **Data da pesquisa:** 2026-10-07. **Escopo:** 95 fichas (REF-18 a REF-112) de produtos reais, com imagens de documentação, produto, demos e GitHub oficiais.
> **Uso previsto:** entrada para o Claude Design, junto com `REFERENCE_PACK_BI.md` e `SKILLS_STACK.md` (e `SCREEN_CATALOG_BI.md`, quando houver). Serve para **enriquecer o protótipo existente**, não para recriá-lo.

## 0. Como usar este documento

**Regra de ouro (igual ao pack base):** aprender o **princípio e o comportamento**, nunca copiar a interface. Cada ficha termina com `ADAPT TO BIWEB` (o que aprender) e `DO NOT COPY` (o que é específico demais).

**Este arquivo é grande (≈ 95 fichas). A síntese vem primeiro, de propósito.** Ordem física do arquivo:
1. Seção 0 (este guia) e seção 1 (resumo executivo).
2. **Seções 17 a 22 (síntese):** princípios, padrões, melhores soluções, anti-patterns, recomendações para o Claude Design e matriz de referências. **Bastam para a maior parte das decisões.**
3. Apêndice A (lacunas, limites e alertas de licença). Leia **antes** de tratar qualquer ponto como "evidência".
4. Seção 2 (índice das 95 referências).
5. **Seções 3 a 16 (fichas por área):** use a matriz (seção 22) para abrir primeiro as de prioridade ESSENCIAL da área que você está desenhando.
6. Apêndice B (links úteis adicionais).

Se a ferramenta só consegue ler o começo do arquivo, as partes 1 a 3 já entregam a síntese completa.

**Relação com os outros documentos**
| Documento | Papel | Relação com este |
|---|---|---|
| `REFERENCE_PACK_BI.md` | Fundamentos de design de BI e editor (REF-01 a 17) | Este aprofunda o que o pack base não cobre. Quando uma ficha menciona "REF-06", "REF-14" etc. (dois dígitos), refere-se ao pack base |
| `SKILLS_STACK.md` | Fluxo de skills e restrições de processo | Contexto, sem sobreposição |
| `SCREEN_CATALOG_BI.md` / `docs/architecture` | Capacidades e restrições técnicas | Cada `ADAPT TO BIWEB` foi escrito respeitando-as: modelo semântico obrigatório, sem SQL no frontend, ChangeSets com preview, draft → publicação, IA opcional |

**Convenções**
- **IDs:** REF-18 em diante, para não colidir com REF-01 a 17 do pack base. (O briefing original sugeria REF-01…; foi trocado para evitar IDs duplicados quando os dois documentos forem entregues juntos.)
- **Nomes padronizados de screenshots:** `REF-NN_kk_slug` (ex.: `REF-20_01_cursor_design_mode`). As imagens são **hotlinks** para as fontes oficiais; **nada foi baixado para o projeto**. Hosts podem bloquear hotlink ou expirar URLs. Em cada ficha, `IMAGES` lista a URL, o que se vê e o status de verificação.
- **Status de verificação:** "VERIFICADA" = a URL respondeu HTTP 200 com `image/*` (ou `video/mp4`). "inspecionada" = a imagem foi aberta e a descrição vem do que se vê. "só alt/doc" = a descrição vem da documentação. GIFs e vídeos foram vistos em apenas **1 quadro**; a dinâmica descrita vem do texto da doc.
- **Campos:** `SOURCE`, `PROBLEM`, `SOLUTION`, `OBSERVE`, `INTERACTION`, `WHY IT WORKS`, `ADAPT TO BIWEB`, `DO NOT COPY`.
- **Licenças e números de maturidade** das tabelas de tecnologia open source vêm do GitHub/npm lidos em 2026-10-07; onde a API estava limitada, está escrito **NÃO VERIFICADO**. Nenhuma decisão arquitetural é tomada aqui. Revisão jurídica é necessária antes de qualquer adoção.

---

## 1. Resumo executivo

**Resposta curta à pergunta central.** Os produtos maduros não "simplificam" removendo capacidade: eles **empilham degraus** sobre o mesmo motor. O primeiro degrau tem defaults seguros e poucas decisões; cada degrau seguinte é alcançado por uma ação explícita do usuário no **ponto exato** onde a necessidade surge, e **nunca é um beco**: sempre existe a saída para o modo mais simples ou mais completo, mostrando o mesmo objeto sincronizado.

**As dez conclusões que mais importam**
1. **Um objeto, várias representações sincronizadas** (builder ↔ código ↔ explicação; diagrama ↔ texto; grafo ↔ matriz/Gantt). Evidência: REF-91, REF-94, REF-56, REF-58, REF-84.
2. **A IA mais confiável propõe, mostra e só então aplica.** O mercado está migrando para "aplicar primeiro, desfazer depois" (Power BI, Grafana, VS Code Agent Host, Cursor 3.x). O BIWEB deve ficar no outro grupo, com preview e confirmação (Figma Make, Databricks Quick Fix, Kestra Copilot). Mesmo no grupo "aplicar primeiro", há boas ideias de segurança: "Undo turn" que recusa desfazer após edição manual (Grafana).
3. **Aprovar não é executar.** O Databricks separa "Accept" de "Run"; o Kestra mistura ("Approve & execute"). Para workflows do BIWEB, separar.
4. **Contexto antes da configuração:** chips de contexto, barra de filtros/tempo e seleção visível mostram "o que o sistema sabe" antes de qualquer campo ser preenchido.
5. **Ao vivo é um estado do controle de tempo, não um widget.** Indicador pequeno, uma cor, pausa por interação, honestidade sobre amostragem ("27 events/s, 60% displayed") e carimbo de "última atualização".
6. **Mapas de rede separam intensidade de saúde.** Duas legendas, duas codificações (utilização em escala sequencial; saúde em estados discretos), com link como objeto de primeira classe (REF-36, REF-37).
7. **Experiência geográfica complexa pede workspace próprio**, não um mapa dentro de um grid de dashboard: canvas contínuo, painéis sobre o mapa, painel de camadas, legenda como cartão interativo, escopo de filtro por viewport e gaveta de tabela (comparação na seção 9).
8. **Modelagem: cardinalidade na linha, avançado recolhido; diagramas por assunto; Visual | Código; rascunho → prévia → impacto → publicação.** Lineage em duas representações: grafo para explorar, tabela para agir.
9. **Conectores: a IA preenche o mesmo formulário que o caminho manual.** Toggle Agent ⇄ Form sempre visível; teste de conexão faz parte do "Salvar"; erros com causa + ação e estados com semântica de recuperação (transitório, ação necessária, parcial).
10. **Workflow legível em escala = agrupar, encapsular, colapsar com estado agregado, minimapa colorido e uma segunda vista (Grid/Gantt).** Cor nunca é o único indicador de estado.

**Lacunas que a pesquisa não preencheu (e que viram oportunidade de design original, com validação):** transições e skeletons de troca de view; indicador de saúde da conexão/resync em tempo real; "ghost nodes" e diff visual de grafo em workflows. Detalhes no Apêndice A.

**Alertas de licença/termos** (detalhe no Apêndice A.2): Airbyte (ELv2), n8n (Sustainable Use), Metabase e ChartDB (AGPL), Windmill (mista), Cosmograph (CC-BY-NC), Cesium ion (conteúdo comercial), Mapbox GL JS v2+ (proprietária), dados OSM/Overture (ODbL). Muitos servem como referência de UX, não como dependência.

---


---

## 17. DESIGN PRINCIPLES FOR COMPLEXITY

> **Princípio-mãe:** **COMPLEXITY IN THE ENGINE, SIMPLICITY ON THE SURFACE.**
> Cada princípio abaixo foi derivado das fichas (evidência entre parênteses), não de preferência pessoal. Onde a evidência é só de documentação, ou onde não há evidência, está dito.

| # | Princípio | O que significa na prática | Evidência |
|---|---|---|---|
| 1 | **Progressive disclosure, no máximo 2 níveis, iniciada pelo usuário** | O primeiro nível mostra o essencial; o detalhe abre por uma ação explícita e não aninha outro disclosure. Itens críticos para o fluxo não ficam escondidos | REF-97, REF-98, REF-54 (cardinalidade em "Performance Options"), REF-69/C5 ("Advanced options" recolhido) |
| 2 | **Simple defaults, advanced control** | O caso comum não pede decisão; o avançado fica a um clique do objeto. Valores detectados vêm pré-selecionados (ex.: encoding/delimitador de CSV) | REF-71, REF-54, REF-94 (default visível na barra), REF-96 |
| 3 | **Nenhum modo é um beco (escape hatch nos dois sentidos)** | Todo modo guiado tem saída explícita para o completo e vice-versa; alternar modos não perde dados sem aviso prévio | REF-92 ("View in Explore"), REF-95 (Agent ⇄ Form), REF-89 ("Switch to classic"), REF-91 (aviso antes da troca). Contra-exemplo: REF-90 (Convert to SQL só de ida) |
| 4 | **Um objeto, várias representações sincronizadas** | Visual ↔ código ↔ explicação; diagrama ↔ texto; grafo ↔ matriz/Gantt; tabela ↔ gráfico operam sobre o mesmo estado | REF-91, REF-94, REF-56, REF-58, REF-84, REF-80, REF-26, REF-28 |
| 5 | **Context before configuration** | Mostrar onde o usuário está e o que o sistema sabe (chips de contexto, seleção, filtros/período, objeto aberto) antes de pedir campos | REF-20, REF-21, REF-23, REF-19 (elemento selecionado), REF-36 (barra Filters + Time Range), REF-99…112 (barra de contexto única) |
| 6 | **Preview before commitment** | Cada passo ou proposta mostra resultado parcial e é descartável; persistir é decisão explícita | REF-57 (rascunho → prévia → publicar), REF-58 (diff antes de Apply), REF-90 (preview por passo), REF-25 (staging), REF-85 (selo "Valid"), REF-72 (revisão de mudanças de schema) |
| 7 | **Suggest → Preview → Confirm → Apply, e Aprovar ≠ Executar** | A IA propõe; o usuário revisa por item; aplicar é um passo; executar um efeito externo é outro passo | REF-23 ("Accept ≠ Run"), REF-25, REF-20 (Keep/Undo em 3 níveis). Contra-exemplos: REF-85 ("Approve & execute"), REF-18/REF-21 (aplica primeiro) |
| 8 | **Recoverable actions** | Undo do pedido inteiro, checkpoints e retry granular; recusar desfazer quando houve edição manual posterior | REF-21 ("Undo turn"), REF-20 (checkpoints), REF-24 (máx. 10 checkpoints), REF-88 (Revert), REF-80/REF-79/REF-84 (retry por tarefa) |
| 9 | **Explain system state** | Dizer o que está acontecendo e quão completo é: modo, frescor, amostragem, limites ("27 events/s, 60% displayed"; "631 de 1.930 feições"; "Computed X minutes ago") | REF-31, REF-32, REF-42, REF-43, REF-109, REF-112, REF-29 (limites do modo globo) |
| 10 | **Visible execution** | Estado com cor **e** ícone **e** texto, no próprio nó; progresso, tentativa, duração, falha, retry; timeline além do grafo | REF-80, REF-82, REF-84, REF-79, REF-73 (Error × Action Required × Partially Succeeded) |
| 11 | **Details on demand, no ponto exato** | Hover = dado mínimo + vizinhança; clique = detalhe completo no mesmo lugar (drawer/painel); link e aresta também são objetos | REF-36, REF-37, REF-43, REF-45, REF-91 (tooltip de explicação), REF-92 |
| 12 | **Direct manipulation + painel como alternativa** | Arrastar, apontar e clicar no objeto; o inspector/painel espelha e permite precisão | REF-19 (mini-prompt ancorado ao elemento), REF-55 (relação por arraste confirmada em painel), REF-29, base: REF-02/REF-10 do pack base |
| 13 | **Time is a global key; live is a state of the time control** | Um único controle de tempo; "ao vivo" e "histórico" são modos do mesmo canvas, com filtros preservados; clicar em um evento leva todos os painéis ao mesmo instante | REF-30, REF-31, REF-32, REF-33, REF-34, REF-35 |
| 14 | **Scale through grouping, focus and lenses** | Em vez de mostrar tudo: subject areas, grupos, subflows, clusters/binning, lentes de foco, "esmaecer o irrelevante", expandir colunas sob demanda | REF-55, REF-61, REF-62, REF-77, REF-80, REF-83, REF-36 (clustering), REF-41 |
| 15 | **Summary → detail → evidence** | Badge/contador + frase → drawer/painel → página de detalhe com evidência; separar "onde olhar" de "o que fazer" | REF-99, REF-100, REF-102, REF-103, REF-18…25 (respostas com evidências) |
| 16 | **Two views of the same graph: explore visually, act in a table** | Grafo para entender, lista/tabela filtrável (grau, tipo, exportação) para agir | REF-62, REF-63, REF-80 (Grade), REF-79/REF-84 (Gantt), REF-40 (mapa + tabela) |
| 17 | **Domain layers, not geometry layers** | Camadas por conceito (Links, Utilização, Saúde, Agrupamento) em vez de por tipo geométrico; saúde ≠ intensidade | REF-36, REF-37, REF-38, REF-39 |
| 18 | **Restricted expression surfaces reduce error** | Editor de expressão restrito ao domínio, autocomplete, erro com posição, dependências visíveis, regras de qualidade automáticas | REF-65, REF-57, REF-59, REF-60 |
| 19 | **AI is a mode of filling, not a dependency, and has no aesthetic of its own** | A IA preenche o mesmo objeto que o caminho manual; segredos fora do contexto do modelo; o painel usa os componentes do produto | REF-66, REF-67, REF-95, REF-75, REF-24 (só no modo Edit). Contra-exemplos de estética própria: REF-22, REF-21 (brilho no input) |
| 20 | **Calm motion** | Novidade indicada por destaque que esmaece, não por piscar; uma cor e um glifo para "ao vivo". *Não há evidência verificada* sobre transições/skeletons de troca de view: tratar como hipótese de design a validar | REF-30, REF-32, REF-26; lacuna no Apêndice A |

## 18. Padrões recorrentes (por tema)

**Contexto e estado**
- Barra única de contexto no topo (filtros, período, consulta nomeada) em Kentik, Dynatrace e Datadog Host Map: REF-36, REF-100, REF-104.
- Estado e frescor sempre visíveis ("Last updated", "Showing N of M", "Computed X ago"): REF-42, REF-112, REF-109.
- Facetas com contadores como filtro principal: REF-100, REF-101.

**Camadas de informação**
- Resumo → drawer → página: REF-99 → REF-102.
- Mesmo dado em projeções sincronizadas (tempo + espaço; mapa + lista; swimlane + série): REF-108, REF-42, REF-103.
- Duas representações do mesmo grafo (explorar vs agir): REF-62, REF-63.

**Edição e segurança**
- Revisão em camadas (agregado → por objeto → por bloco), com checkpoints e commit explícito: REF-20, REF-21, REF-24.
- Aprovação com escopos ("Accept ≠ Run"): REF-23.
- Rascunho efêmero → "Save this": REF-96.

**Dados e modelo**
- Cardinalidade na linha, avançado recolhido; vistas por assunto: REF-54, REF-55, REF-56.
- Validação em duas velocidades (tempo real e varredura completa): REF-60, REF-59.
- Diagnóstico: dependências quebradas (urgente) × entidades sem referência (higiene): REF-64.

**Conexão de dados**
- Fluxo em etapas: credenciais → testar → descobrir schema → selecionar → preview → agendar: REF-70, REF-72, REF-68.
- Erros com causa + ação, estados com semântica de recuperação: REF-73.
- Catálogo com busca, categorias e formatos de arquivo no topo; saída para a cauda longa: REF-69.

**Workflow**
- Agrupar × encapsular; cartão colapsado agrega estado; minimapa com cor de estado; auto-layout; alternativa Grid/Gantt: REF-77, REF-80, REF-83, REF-79, REF-84.

**Mapas**
- Camadas por conceito de domínio; legenda como controle; "N de M exibidos": REF-36, REF-43, REF-45.
- Timeline com distribuição (histograma/beeswarm) em vez de slider cego: REF-33, REF-40.
- Seleção por feição não funciona em camada agregada (cluster/bin): REF-42.

## 19. Melhores soluções para simplificar complexidade

| Problema complexo | Solução que funcionou | Onde |
|---|---|---|
| Muitos tipos de objeto e propriedades | Drawer cujo conteúdo muda por tipo de entidade; link também tem drawer | REF-36 |
| Consulta/expressão difícil para iniciantes | Builder ↔ código sincronizado com aviso, "Explain" curto, preview por passo | REF-91, REF-90 |
| Configuração com dezenas de campos | IA preenche o mesmo formulário; toggle Agent ⇄ Form; segredos fora da IA | REF-67, REF-95 |
| Modelo grande demais para um canvas | Diagramas por assunto, expansão por vizinhança, chevron de colunas (todas/chaves/nenhuma) | REF-55 |
| Mudança de modelo arriscada | Rascunho → prévia → impacto graduado (1º/2º/4º grau) → publicar | REF-57, REF-58, REF-62 |
| Fluxo com dezenas de nós | Grupos, subfluxos, cartão colapsado com estado agregado, minimapa colorido, Grid/Gantt | REF-77, REF-80, REF-83 |
| IA que altera o objeto | Staging revisável item a item; "Undo turn"; Accept ≠ Run; checkpoints | REF-25, REF-21, REF-23, REF-20 |
| Tempo real sem distração | Estado do controle de tempo; glifo + cor única; pausa por interação; sampling declarado | REF-30, REF-31, REF-32 |
| "Máquina do tempo" operacional | Mesmo canvas em modo histórico, timeline com histograma, janela deslizante, velocidade separada de zoom | REF-33, REF-34 |
| Muitos pontos no mapa | Camadas de agregação trocáveis (ponto → cluster → heatmap → hexbin), legenda declarando o que não aparece | REF-41, REF-43 |
| Erro de ingestão | Mensagem com causa + ação, detalhe técnico expansível, extraídos × carregados, estados transitório/ação/parcial | REF-73 |
| Decidir entre variantes de gráfico | Sugestões ao vivo e grupos "mais gráficos"; aviso antes de perda de configuração | REF-27, REF-28 |

## 20. Anti-patterns (consolidados)

| # | Anti-pattern | Por que prejudica | Visto em |
|---|---|---|---|
| 1 | **IA que aplica sem preview e só oferece desfazer** | Quebra "nada muda em silêncio"; o usuário descobre a mudança depois | REF-18, REF-21, REF-86, REF-88 (Auto-build) |
| 2 | **IA com identidade visual própria** (fundo estrelado, brilho no input, ícone multicolorido de marca) | Fragmenta o produto e sinaliza "recurso colado" | REF-22, REF-21, REF-18 |
| 3 | **"Auto-approve" sem dizer o que cobre** | Sem semântica documentada, o usuário não sabe o que está concedendo | REF-22 |
| 4 | **Aprovar e executar no mesmo clique** | Mistura revisão com efeito externo | REF-85 |
| 5 | **Revisão só em nível de sessão**, sem aceitar/rejeitar por mudança | Obriga a aceitar tudo ou nada (evidência não oficial) | REF-19 (fórum) |
| 6 | **Conversão unidirecional silenciosa** (builder → código sem volta) | O usuário perde o caminho simples | REF-90 |
| 7 | **Mais de dois níveis de disclosure** ou disclosure dentro de disclosure | Quebra descoberta e orientação | REF-97, REF-98 |
| 8 | **Modos que duplicam interfaces com capacidades divergentes** | Aumenta o custo cognitivo e de manutenção | REF-89, REF-92 |
| 9 | **IA como único caminho de configuração** | Sem alternativa manual, falha vira bloqueio | evitado em REF-67 e REF-95 |
| 10 | **Defaults escondidos** | O usuário não vê filtros aplicados | evitado em REF-94 |
| 11 | **Aplicar mudança direto no modelo vivo sem impacto** | Quebra relatórios dependentes | REF-57 ("Update model"), REF-58 (Apply) |
| 12 | **Expor SQL/DDL como formato do modelo** | O BIWEB não tem SQL no frontend | REF-56, REF-63 |
| 13 | **Grafo completo sem foco/colapso** | "Parede de cartões" ilegível | REF-61, REF-76…84 |
| 14 | **Validação que só acusa depois de quebrar** | Custo alto do erro | contraste com REF-60 |
| 15 | **Cor como única indicação de estado** | Acessibilidade e leitura em daltonismo | REF-80 (mitigado por texto) |
| 16 | **Estados demais para o usuário de negócio** | Ruído | REF-80 |
| 17 | **Métricas em todo nó** (ruído para analista) | Perde hierarquia | REF-83 |
| 18 | **Canvas livre sem agrupamento nativo** | Depende de notas adesivas | REF-76 |
| 19 | **Ícones sem rótulo para ações pouco universais** | Ambiguidade (foguete = velocidade, cubo = 3D) | REF-29 |
| 20 | **Misturar "pausado" com "histórico"** no mesmo visual | Confunde o estado temporal | REF-32 |
| 21 | **Tempo real sem carimbo de "última atualização"** | O usuário não sabe se o dado é fresco | REF-30…32 (evitar) |
| 22 | **Playback com controles demais na mesma barra** | Telas pequenas ficam saturadas | padrão geral da pesquisa de replay (REF-33, REF-34) |
| 23 | **Geração longa sem estimativa de progresso** | Parece travado | REF-68 |
| 24 | **Preview que carrega o arquivo inteiro sem declarar a amostra de inferência** | O usuário não sabe por que o tipo foi detectado assim | risco observado em previews de CSV (REF-71) |
| 25 | **"Error" genérico** | Não diferencia transitório, ação necessária e parcial | REF-73 |
| 26 | **Seleção por feição em camada agregada** | Não funciona; confunde | REF-42 |
| 27 | **Heatmap/force-directed densos sem agrupamento** | Ilegíveis em escala | REF-99…112, REF-36…39 |
| 28 | **Funcionalidade-chave atrás de plano pago** usada como padrão | Não é reproduzível | REF-61 (CLL), REF-65 |
| 29 | **Thumbnails/renders de marketing tratados como evidência de UI** | Não representam o produto | REF-78, REF-76, REF-82 |
| 30 | **Resumo inline desatualizado** | O usuário confia em algo falso | risco geral, sem exemplo observado |

## 21. Recomendações para o Claude Design

**Como aplicar:** o protótipo atual **não deve ser recriado**. Estas recomendações descrevem **enriquecimentos** por área. Para cada decisão, cite a REF-xx de origem e respeite as restrições de `SCREEN_CATALOG_BI.md`/`docs/architecture` (modelo semântico obrigatório, ChangeSets com preview, draft → publicação, IA opcional, sem estética própria para a IA).

**21.1 AI Copilot (enriquecer o dock existente)**
- Chips de contexto acima do input, editáveis; seleção direta no canvas como alternativa ao `@`: REF-20, REF-21, REF-19.
- Linhas compactas de status de ferramenta ("Lendo painéis…", "Executando consulta…") expansíveis, com botão **Interromper**: REF-21, REF-20.
- Revisão em camadas (resumo → por objeto → por mudança) com "1 de N"; aceitar/rejeitar **por item**; aplicar como **um passo de undo**; "Undo turn" que **recusa** se houve edição manual depois: REF-25, REF-20, REF-21.
- Estado vazio com 2–3 ações específicas do objeto selecionado: REF-18, REF-24.
- Histórico e "Nova conversa" como ações do próprio painel; aviso curto de revisão. Sem fundo, brilho ou ícone próprio.
- **Mesmo sendo tendência de mercado, não aplicar primeiro.** Seguir o grupo "propor com diff" (REF-25, REF-23).
- Permissões herdadas do produto (papéis, RLS/CLS); níveis de aprovação documentados, nunca um toggle opaco: REF-23, REF-22.

**21.2 View switching**
- Segmented control **de ícones com tooltip e rótulo** para 2–3 representações do mesmo resultado (Gráfico | Tabela); grade de ícones em popover para 10+ tipos: REF-28, REF-26, REF-27.
- A troca é **de apresentação, não de configuração**: filtros, período e seleção ficam; avisar **antes** do clique quando houver perda: REF-27.
- Declarar limites do modo ("Table view não inclui transformações"; globo não suporta algumas camadas): REF-26, REF-29.
- **Transições/skeletons: sem evidência.** Hipótese a validar: skeleton só no conteúdo (chrome estável), crossfade curto (≈120–200 ms), sem animação de layout, respeitando "reduzir movimento". Marcar no protótipo como suposição.

**21.3 Realtime**
- "Ao vivo" como opção do seletor de tempo, não widget separado: REF-31, REF-30.
- Um glifo + uma cor; novidade com destaque que esmaece; **pausa ao pairar/rolar**; carimbo "atualizado há…": REF-30, REF-32.
- Honestidade de amostragem ("N eventos/s, X% exibidos"): REF-31.
- Pílula de estado Playing/Paused; **não** reutilizar o mesmo cinza para histórico: REF-32.
- *Lacuna:* saúde da conexão/reconexão não tem evidência; projetar com cuidado e validar.

**21.4 Network Intelligence (primeiro relatório da lista de exemplos)**
- Vista **hierárquica não geográfica** (blocos) e vista **geográfica**, alternáveis: REF-36.
- Duas legendas: **Utilização/Tráfego** (escala) e **Saúde** (estados discretos); estado "Unknown" cinza: REF-36.
- **Link como objeto de primeira classe** (tooltip e drawer próprios), direção A→Z: REF-36, REF-39.
- Cores em **degraus discretos**; gradiente contínuo só na legenda de grande volume: REF-36, REF-39.
- Camadas por conceito de domínio; contador de filtros ativos; "N de M exibidos": REF-36, REF-38.
- Seleção **persistida na URL** (compartilhar evidência): REF-37.
- Padrões do relatório completo: REF-99 (frase de problema por regra, badge, drawer).

**21.5 Incident Intelligence**
- Trinca **mapa + timeline + filtros + detalhes**; timeline com **distribuição** (histograma/beeswarm), não slider cego: REF-41, REF-40, REF-100.
- Camadas de agregação trocáveis (ponto, cluster, heatmap, hexbin) com **legenda declarando o que não aparece**; lembrar que seleção por feição não funciona em camada agregada: REF-41, REF-42.
- Mapa como **filtro espacial** dos demais widgets; lista ↔ mapa sincronizados: REF-42.
- "Confirmado × suspeito" separado por toggle/coluna: REF-40.
- Feed com facetas e histograma → detalhe com entidades afetadas e evidência → botão "Explicar": REF-100, REF-102.

**21.6 Map workspace ≠ relatório padrão**
- Canvas de mapa **contínuo** com painéis sobre ele; **painel de camadas** persistente (ordem, visibilidade, agrupamento); legenda como cartão (interativa quando possível); **escopo de filtro por viewport e geometria**; gaveta de tabela "Todas × Visíveis"; atalho Ver × Editar: REF-43, REF-44, REF-45. Tabela comparativa na seção 9.

**21.7 3D urbano**
- Câmera inclinada por padrão (45–70°), cluster pequeno de controles (zoom, bússola/pitch, home, busca) e **2D ↔ 3D como botão** sobre o mesmo dado: REF-47, REF-50, REF-52.
- Prédios por rampa de cor/altura, rótulos acima dos volumes, dado de negócio por cima; popups por `pickable`/clique; **atribuição OSM visível**: REF-46, REF-48.
- Terreno com deck.gl é **parcial/experimental**: prototipar antes de prometer "incidentes sobre o relevo": REF-49.
- Tabelas de tecnologia na seção 10: **sem decisão arquitetural**.

**21.8 Data modeling (enriquecer a tela de dados existente, sem substituí-la)**
- *Visual:* diagramas por assunto; relação criada por arraste e **confirmada em painel**; cardinalidade/direção na linha; avançado recolhido; auto-layout e "ajustar à tela": REF-55, REF-54.
- *Visual | Código (BEL):* editor com autocomplete, erro com posição, dependências visíveis, preview do resultado: REF-56, REF-57, REF-59.
- *Ciclo:* rascunho → prévia → **impacto graduado** → publicar (humano): REF-57, REF-58, REF-62.
- *Lineage:* lentes de foco, colunas sob demanda, **tabela de impacto filtrável/exportável**, proveniência na aresta: REF-61, REF-62, REF-63.
- *Diagnóstico:* "Dependências quebradas" (urgente) × "Sem referência" (higiene): REF-64.
- *Metadata de campo* com preview vivo: REF-65.

**21.9 Conectores**
- Catálogo com busca + categorias + **formatos de arquivo no topo**; saída para a cauda longa ("pedir conector", "criar do zero"): REF-69.
- Fluxo em etapas com **teste fazendo parte do Salvar**, descoberta de schema, seleção, preview, agenda: REF-70, REF-72.
- Upload de arquivo com encoding, delimitador, tipos detectados e preview, **declarando a amostra**: REF-71.
- Erros com causa + ação; estados Error × Action Required × Partially Succeeded; extraídos × carregados: REF-73.
- Copilot: Agent ⇄ Form sempre visível; "Pular e configurar manualmente"; segredos fora do contexto; revisão obrigatória antes de efeito: REF-66, REF-67, REF-75.

**21.10 Intelligent Workflow**
- Canvas com **grupos** (rótulo e cor) e **subfluxos** (encapsulamento); cartão colapsado com **estado e volume agregados**; minimapa com cor de estado; auto-layout; busca: REF-77, REF-83, REF-80.
- **Segunda vista**: Grid (matriz) e Gantt (tempo e recorrência): REF-80, REF-79, REF-84.
- Estado com **ícone + texto + cor**; estados derivados úteis (upstream_failed, Late); tentativa/duração: REF-80, REF-81, REF-82.
- Retry **granular** por nó; "Debug in Editor" com dado fixado: REF-80, REF-76.
- Agendamento como **nó/trigger no grafo** e tela de schedules com próximo disparo: REF-84, REF-79.
- NL → estrutura → preview → confirmar → executar: REF-85 (selo "Valid", Edit/Ask/Plan), REF-87 (estrutura sugerida primeiro), REF-88; **separar Aprovar de Executar**: REF-23.
- *Lacuna:* "ghost nodes" e diff visual de grafo não aparecem em nenhum produto pesquisado. É oportunidade de design original, **não um padrão provado**.

**21.11 Progressive complexity (checklist de mecanismos)**
- Aplicar o catálogo da seção 15: toggle de modo, builder ↔ código com aviso, View-only code, Explain curto, preview por passo, passos opcionais como botões-chip, resumo inline, stepper com escape hatch, defaults inteligentes + sugestões, rascunho efêmero → "Save this", disclosure com Reset | Apply, limite ≤ 2 camadas.

**21.12 Relatórios demonstrativos (ordem sugerida)**
- Network Intelligence (1º) → Incident Intelligence (com painel de dependência) → Anomaly Explorer → SLA & Risk Monitor → Customer Behavior → Street Intelligence 3D (com replay temporal). Matriz e redundâncias na seção 16.
- **Executive Commercial** repete o protótipo de varejo atual: não acrescenta capacidade.
- **Historical Replay** funciona melhor como **controle transversal de timeline** do que como relatório isolado.

**Riscos gerais**
- Tratar densidade de produtos operacionais (NiFi, Airflow) como padrão para analistas de negócio: foque em hierarquia e foco.
- Importar a estética de uma referência (laranja do Grafana, verde do Datadog, roxo do Figma): proibido; ver anti-patterns 2 e 29.
- Prometer comportamento sem evidência (transições, resync, diff de grafo): marcar como hipótese.

## 22. Reference matrix

Prioridade: **ESSENCIAL** (base para o enriquecimento do protótipo), **IMPORTANTE**, **COMPLEMENTAR**. Referências COMPLEMENTARES estão listadas na última linha.

| Referência | Produto | Principal aprendizado | Aplicação no BIWEB | Prioridade |
|---|---|---|---|---|
| REF-21 | Grafana Assistant | Chips de contexto, status de ferramenta, "Undo turn" que recusa após edição manual | Dock de IA: segurança e transparência | ESSENCIAL |
| REF-25 | Figma Make | Edições em staging, revisáveis uma a uma, aplicadas juntas | ChangeSet com preview e aplicar | ESSENCIAL |
| REF-23 | Databricks Genie Code | Níveis de aprovação, "Accept ≠ Run", diff em Quick Fix | Aprovação e execução separadas | ESSENCIAL |
| REF-20 | GitHub Copilot (VS Code) | Keep/Undo em 3 níveis, "1 de N", checkpoints, chips de contexto | Revisão por item e restauração | IMPORTANTE |
| REF-19 | Cursor (Design Mode) | Elemento selecionado vira contexto; mini-prompt ancorado | Seleção como contexto da IA | IMPORTANTE |
| REF-24 | ThoughtSpot SpotterViz | IA como modo do editor (só em Edit), checkpoints, Save/Cancel | Escopo de modo da IA | IMPORTANTE |
| REF-18 | Power BI Copilot | Estado vazio com ações; contraste "aplica primeiro" | Estado vazio do dock | IMPORTANTE |
| REF-26 | Grafana (Table view) | Alternar dado cru ↔ gráfico sem perder a config | "Ver como tabela" por widget | ESSENCIAL |
| REF-28 | Metabase | Segmented tabela/gráfico; tipos em sidebar | Troca de representação | IMPORTANTE |
| REF-29 | kepler.gl | Modos Top/3D/Globe e limites declarados | 2D ↔ 3D no mapa | IMPORTANTE |
| REF-31 | Datadog Live Tail | "Ao vivo" no seletor de tempo; amostragem declarada | Tempo real honesto | ESSENCIAL |
| REF-30 | Grafana Explore | Pausar/Resumir/Sair do modo ao vivo | Controle de live | IMPORTANTE |
| REF-33 | kepler.gl Time Playback | Histograma + janela deslizante + velocidade | Replay temporal | ESSENCIAL |
| REF-34 | Flightradar24 Playback | Live → histórico no mesmo canvas | "Máquina do tempo" | IMPORTANTE |
| REF-35 | Sentry Session Replay | Tempo como chave global entre painéis | Sincronização por instante | IMPORTANTE |
| REF-36 | Kentik Map | Blocos não geográficos, saúde × utilização, drawer por tipo | Network Intelligence | ESSENCIAL |
| REF-37 | Cisco ThousandEyes | Path visualization, seleção persistida na URL | Dependências e rotas | IMPORTANTE |
| REF-38 | Datadog Network Map | Nó = métrica, aresta = largura, legenda com valores | Mapa de rede por métrica | IMPORTANTE |
| REF-41 | kepler.gl | Ponto → cluster → heatmap → hexbin + playback | Incident Intelligence | ESSENCIAL |
| REF-40 | Cloudflare Radar Outage Center | Mapa + beeswarm + tabela; confirmado × suspeito | Incident timeline | IMPORTANTE |
| REF-42 | ArcGIS Dashboards | Mapa, lista e indicador ligados por ações | Filtro espacial e sincronização | IMPORTANTE |
| REF-43 | Felt | Legenda interativa, painel de detalhe, tabela inferior | Map workspace | IMPORTANTE |
| REF-44 | ArcGIS Online Map Viewer | Duas barras de ferramentas; painel de camadas | Map workspace | IMPORTANTE |
| REF-45 | CARTO Builder | Sources/Widgets/Interactions/Legend; escopo por viewport | Filtro por viewport | IMPORTANTE |
| REF-46 | MapLibre (prédios 3D) | Extrusão de prédios, raycast em 3D Tiles | Street Intelligence 3D | ESSENCIAL |
| REF-47 | MapLibre (terreno) | Terreno, céu/neblina, controles de navegação | Câmera e relevo | ESSENCIAL |
| REF-48 | deck.gl | Trips, Arc, Scenegraph, picking | Rotas, ligações, incidentes | ESSENCIAL |
| REF-49 | deck.gl Terrain/Tile3D | Rota drapejada, Google 3D Tiles | Incidentes sobre relevo (experimental) | IMPORTANTE |
| REF-50 | CesiumJS | OSM Buildings, 3D Tiles, SceneModePicker | Alternativa de globo/precisão | IMPORTANTE |
| REF-52 | kepler.gl 3D | UI "campo → altura/cor" | Configuração de extrusão | IMPORTANTE |
| REF-55 | Tabular Editor 3 (Diagram) | Diagramas por assunto; relação por arraste; chevron de colunas | Semantic Model Editor (visual) | ESSENCIAL |
| REF-54 | Tableau Relationships | Cardinalidade em "Performance Options" com default seguro | Relações: avançado recolhido | IMPORTANTE |
| REF-56 | dbdiagram.io / DBML | Diagrama ao vivo sobre texto; notação compacta | Visual \| Código | IMPORTANTE |
| REF-57 | Power BI DAX query view | Rascunho → prévia → "Update model" | Métricas: rascunho e prévia | ESSENCIAL |
| REF-58 | Power BI TMDL view | Modelo como código, diff, Apply, diagnósticos | Diff antes de aplicar | IMPORTANTE |
| REF-59 | Tabular Editor 3 (DAX editor + BPA) | Peek/Define, regras de qualidade automáticas | Editor de BEL | IMPORTANTE |
| REF-60 | Looker LookML | Validação em duas camadas + Project Health | Validação do modelo | IMPORTANTE |
| REF-61 | dbt Catalog | Lineage, lentes, coluna sob demanda | Lineage | ESSENCIAL |
| REF-62 | DataHub | Impact Analysis lista/visual, exportável | Impacto graduado | IMPORTANTE |
| REF-63 | OpenMetadata | Camadas de lineage + tabela de impacto | Lineage com camadas | IMPORTANTE |
| REF-64 | Metabase Dependency graph | Quebradas × sem referência; "Usado por N" | Diagnóstico do modelo | IMPORTANTE |
| REF-65 | Metabase (metadata e medida) | Editor de metadata com preview vivo; expressão restrita | Metadata de campo | ESSENCIAL |
| REF-66 | Airbyte Connector Builder + AI Assist | IA gera, usuário revisa no mesmo formulário | Conector customizado | ESSENCIAL |
| REF-67 | Airbyte Setup Assistant | Agent ⇄ Form, segredos fora do contexto | Copilot de conexão | ESSENCIAL |
| REF-70 | Power Query | Connection → Authentication → Navigator + preview | Fluxo de conexão | ESSENCIAL |
| REF-71 | Power Query / Metabase | Upload de CSV com tipos e preview | Upload de arquivos | ESSENCIAL |
| REF-72 | Fivetran / Airbyte / Hex | Descoberta de schema e revisão de mudanças | Seleção de schema | ESSENCIAL |
| REF-73 | Airbyte / Hex | Estados e erros acionáveis; falha parcial | Status de ingestão | ESSENCIAL |
| REF-68 | Fivetran | Agente de conector + setup form declarativo | Conector via SDK | IMPORTANTE |
| REF-69 | Power Query / Fabric | Catálogo com busca e categorias | Catálogo de conectores | IMPORTANTE |
| REF-75 | Zapier / Fabric | "IA preenche, usuário revisa"; autonomia ajustável | Copilot de configuração | IMPORTANTE |
| REF-80 | Apache Airflow 3 | Grafo + Grid + Task Groups colorido por estado | Execução de workflow | ESSENCIAL |
| REF-84 | Kestra | Editor com Code \| No-code \| Topology, Gantt, dependências | Intelligent Workflow | ESSENCIAL |
| REF-77 | Node-RED | Grupos, subfluxos, navigator, debug sidebar | Agrupar × encapsular | IMPORTANTE |
| REF-79 | Dagster | Asset graph, Run view (Gantt) | Execução em linha do tempo | IMPORTANTE |
| REF-82 | Temporal Web UI | Histórico com timeline | Visão de execução (Temporal está na arquitetura) | IMPORTANTE |
| REF-83 | Apache NiFi | Process groups com estatísticas no cartão | Estado agregado no grupo | IMPORTANTE |
| REF-78 | React Flow | Sub-flows, contextual zoom, minimapa (exemplos) | Canvas de workflow | IMPORTANTE |
| REF-76 | n8n | Canvas, logs, sub-workflows | Referência de UX | IMPORTANTE |
| REF-85 | Kestra AI Copilot | Edit/Ask/Plan, "Proposed flow" com selo Valid | NL → workflow com preview | ESSENCIAL |
| REF-87 | Power Automate Copilot | Estrutura sugerida primeiro, depois conexões | NL → workflow | IMPORTANTE |
| REF-88 | Zapier Copilot | Auto-build × Ask as you build; Revert | Autonomia ajustável | IMPORTANTE |
| REF-90 | Metabase notebook | Preview por passo, "View SQL" (somente leitura) | Consulta visual passo a passo | ESSENCIAL |
| REF-91 | Grafana Builder \| Code | Sincronizados, aviso antes de trocar, Explain | Visual \| BEL | ESSENCIAL |
| REF-95 | Airbyte Agent \| Form | IA opcional com saída para o formulário | Princípio "IA como modo" | ESSENCIAL |
| REF-92 | Grafana Drilldown | Exploração queryless guiada com escape hatch | Exploração guiada | IMPORTANTE |
| REF-93 | Figma Dev Mode | Modo por audiência remove ferramentas | Modos de papel | IMPORTANTE |
| REF-94 | GitHub filter bar | Facetas ↔ query digitada ↔ URL | Filtros serializáveis | IMPORTANTE |
| REF-89 | Kibana Lens / ES\|QL | Quick functions → Formula → consulta | Degraus de expressão | IMPORTANTE |
| REF-97, REF-98 | NN/g, IBM Carbon (conceitual) | Limite ≤ 2 níveis; disclosure iniciado pelo usuário | Regras do sistema | IMPORTANTE |
| REF-99 | Kentik Map (relatório) | Badge de problemas, frase por regra, drawer | Network Intelligence | ESSENCIAL |
| REF-100, REF-102 | Dynatrace Problems; Datadog Watchdog | Feed com facetas → detalhe com evidência | Incident Intelligence | ESSENCIAL |
| REF-103 | Elastic Anomaly Explorer | Banda do esperado, swimlane, Actual × Typical | Anomaly Explorer | ESSENCIAL |
| REF-105, REF-106 | Elastic SLOs; Honeycomb SLO | Meta, orçamento de erro, burn rate, previsão | SLA & Risk Monitor | ESSENCIAL |
| REF-109 | PostHog | Funil, retention, caminhos | Customer Behavior | IMPORTANTE |
| REF-110 | Esri Urban / 3D GIS | Extrusão por medida; painel ↔ cena | Street Intelligence 3D | IMPORTANTE |
| REF-111 | kepler.gl / Foursquare Studio | Playback com sincronização de widgets | Historical Replay (controle) | IMPORTANTE |
| REF-104 | Datadog Host Map | Fill/Group/Size sobre modelo semântico | Capacity & Saturation | IMPORTANTE |
| REF-107 | Esri ArcGIS Dashboards | Composição ao vivo, cross-filter mapa ↔ lista | Operations Command Center | IMPORTANTE |
| COMPLEMENTARES | REF-22, REF-27, REF-32, REF-39, REF-51, REF-53, REF-81, REF-86, REF-96, REF-101, REF-108, REF-112, REF-74 | Contrastes, variações e contexto | Consulta pontual | COMPLEMENTAR |

---

## Apêndice A — Lacunas, limites e alertas

### A.1 Lacunas de evidência (não tratar como padrões provados)
- **Transições animadas e skeletons de troca de view:** nenhuma fonte oficial lida descreve. Vista da pesquisa: feedback por miniatura ao vivo (Lens, Grafana) e metadados de carga ("Showing 193 rows · 135ms").
- **Saúde da conexão / reconexão (resync) em tempo real** e **eventos de mapa em tempo real com destaque temporal:** sem documentação visual lida.
- **"Ghost nodes" e diff visual de grafo em workflows:** nenhum produto pesquisado mostra; os padrões encontrados são YAML/lista ou aplicação direta com Revert. Windmill (aceitar/rejeitar por passo) só tem texto de doc, sem imagem.
- **Smart guides do Figma** continuam sem screenshot oficial (limite herdado do pack base).
- **Não consultados ou bloqueados (403/404/conteúdo JS):** Webflow Style panel, Adobe Contextual Task Bar, Downdetector, TeleGeography Submarine Cable Map, Cloudflare Radar ao vivo, Esri Scene Viewer/Maps SDK, Dynatrace Smartscape, Tableau Agent/Looker/Fabric Copilot (sem imagens utilizáveis), Cube Playground, Omni, DataGrip (imagens só listadas), Zabbix, SolarWinds, QGIS, Mapbox Studio, Kibana Maps, Windy, PagerDuty, Google Earth.
- **Imagens antigas ou de marketing (sinalizadas nas fichas):** Kibana Lens (2019–2020), Flightradar24 (2023), Netdata (2023), Weathermap NG (2022), NiFi 1.x, Salesforce (2019), Cloudflare Radar (2022/2023), n8n README (~2024), Temporal (renders de marketing), Terria (marketing), kepler.gl (UI antiga em algumas), Tableau/DBML (2019–2020).
- **GIFs e vídeos** foram vistos em 1 quadro; a dinâmica descrita vem da doc.
- **Datas:** muitas docs oficiais não trazem data; usamos "lida em out/2026".
- **Toda a evidência é de documentação/produto, não de testes de usabilidade.** Não há métricas de sucesso.
- **Kentik:** as 3 imagens do KB usam URLs assinadas que **expiram em minutos**; imagens duráveis (UI antiga) estão listadas na ficha.

### A.2 Alertas de licença e termos (revisão jurídica obrigatória)
| Item | Alerta |
|---|---|
| Airbyte | Elastic License 2.0 (não OSI; proíbe oferecer como serviço gerenciado) na plataforma; conectores/CDK indicados como MIT |
| n8n | Sustainable Use License + arquivos `.ee` proprietários; **não copiar/embutir código** |
| Metabase | AGPL + licença comercial; Data Studio (Schema viewer, Dependency graph) é Pro/Enterprise |
| ChartDB | AGPL-3.0 |
| Windmill | Mistura Apache-2.0 / AGPLv3 / proprietário |
| Sling CLI | GPL-3.0 (copyleft forte) |
| Dozer | AGPL-3.0, aparentemente sem manutenção |
| Cosmograph | `@cosmograph/*` consta como CC-BY-NC-4.0; o motor `@cosmos.gl/graph` é MIT |
| elkjs | EPL-2.0 (copyleft fraco) |
| bpmn-js | MIT com cláusula de marca d'água não removível |
| dbt column-level lineage | Exige Enterprise |
| Cesium | CesiumJS é Apache-2.0, mas o conteúdo (terreno, OSM Buildings, imagens) vem do **Cesium ion**: plano Community só não comercial; planos pagos |
| Mapbox GL JS v2+ | Proprietária (conta Mapbox; uso com produtos Mapbox) |
| Google Photorealistic 3D Tiles | Termos próprios, atribuição obrigatória, custo por uso |
| OSM / Overture | ODbL (atribuição e share-alike para bancos derivados); places do Overture em CDLA Permissive 2.0 (a revalidar por release) |
| Endpoints públicos (tile.openstreetmap.org, OpenFreeMap, Mapterhorn) | Sem SLA; a política da OSMF proíbe uso pesado: produção exige self-host |
| MapLibre / outros | O GitHub devolve `NOASSERTION` em alguns repositórios; a licença foi confirmada em LICENSE/npm. **Revalidar** |

### A.3 Uso das imagens
Os screenshots são **hotlinks** para documentação, blogs, repositórios e páginas de produto oficiais, usados para estudo interno. Não redistribuir nem reutilizar em produto. Se o Claude Design não abrir URLs, as fichas funcionam em texto.


## 2. Índice das referências

| ID | Seção | Área | Produto / funcionalidade | Imagens (hotlink) |
|---|---|---|---|---|
| REF-18 | 03 | AI Copilot / Contextual Assistant | Power BI Copilot (pane de relatório, Desktop/Service) / criar e editar páginas por linguagem natural | 3 |
| REF-19 | 03 | AI Copilot / Contextual Assistant | Cursor (Agents Window + Design Mode): elemento selecionado vira contexto + revisão de diff | 4 |
| REF-20 | 03 | AI Copilot / Contextual Assistant | GitHub Copilot Chat no VS Code: anexos de contexto, Keep/Undo, checkpoints | 5 |
| REF-21 | 03 | AI Copilot / Contextual Assistant | Grafana Assistant: sidebar contextual → Workspace com canvas + "Undo turn" | 3 |
| REF-22 | 03 | AI Copilot / Contextual Assistant | Datadog Bits Chat (antes Bits Assistant): painel lateral + permissão por papel + "Auto-approve" | 2 |
| REF-23 | 03 | AI Copilot / Contextual Assistant | Databricks Genie Code (Assistant): aprovação de ferramentas, Quick Fix com diff, chip de página, citações | 2 |
| REF-24 | 03 | AI Copilot / Contextual Assistant | ThoughtSpot SpotterViz: agente de edição de Liveboards, só em modo Edit, com checkpoints e painel configurável | 1 |
| REF-25 | 03 | AI Copilot / Contextual Assistant | Figma Make: edições em staging no chat + "Annotate for agent" (apontar e pedir) | 3 |
| REF-26 | 04 | View Switching | Grafana / "Table view" toggle + "Panel styles" no editor de painel | 2 |
| REF-27 | 04 | View Switching | Kibana Lens / seletor de tipo de gráfico + "Suggestions" | 3 |
| REF-28 | 04 | View Switching | Metabase / alternância Visualização ↔ Tabela e seletor de tipo em sidebar | 2 |
| REF-29 | 04 | View Switching | kepler.gl / controle de modo do mapa (Top · 3D · Globe) e Split Map | 3 |
| REF-30 | 05 | Realtime Visualization | Grafana Explore / Live tailing (Pause · Resume · Exit live mode) | 1 |
| REF-31 | 05 | Realtime Visualization | Datadog / Live Tail (badge "Live Tail", Pause, "events/s, % displayed") | 0 |
| REF-32 | 05 | Realtime Visualization | Netdata Cloud / Play · Pause · Force Play (pílula de estado "Playing/Paused") | 2 |
| REF-33 | 06 | Temporal / Historical Replay | kepler.gl / Time Playback (histograma, janela deslizante, velocidade, Y axis) | 3 |
| REF-34 | 06 | Temporal / Historical Replay | Flightradar24 / Global Playback (de ao vivo para histórico) | 3 |
| REF-35 | 06 | Temporal / Historical Replay | Sentry / Session Replay (timeline com eventos, scrubbing, breadcrumbs sincronizados) | 1 |
| REF-36 | 07 | Network / Topology Map | Kentik Map (Weather Map + Topology + Details drawer) | 0 |
| REF-37 | 07 | Network / Topology Map | Cisco ThousandEyes — Path Visualization | 3 |
| REF-38 | 07 | Network / Topology Map | Datadog Network Map (Cloud Network Monitoring) | 2 |
| REF-39 | 07 | Network / Topology Map | Grafana "Network Weathermap NG" (painel de weathermap dentro de um dashboard) + PHP Network Weathermap como origem | 3 |
| REF-40 | 08 | Incident Heatmap & Geographic Analytics | Cloudflare Radar Outage Center (mapa de interrupções + beeswarm timeline + tabela) | 3 |
| REF-41 | 08 | Incident Heatmap & Geographic Analytics | kepler.gl — Time Playback + Heatmap/Hexbin/Cluster + Brush | 4 |
| REF-42 | 08 | Incident Heatmap & Geographic Analytics | ArcGIS Dashboards — Map + List + Indicator ligados por Actions | 3 |
| REF-43 | 09 | Map Workspace vs Standard Report | Felt — Mapa com legenda interativa, painel de detalhe, tabela inferior e "components" dentro da legenda | 3 |
| REF-44 | 09 | Map Workspace vs Standard Report | ArcGIS Online Map Viewer (novo) — duas barras de ferramentas (Contents escura + Settings clara) | 3 |
| REF-45 | 09 | Map Workspace vs Standard Report | CARTO Builder — Sources / Widgets / Interactions / Legend / Settings | 4 |
| REF-46 | 10 | 3D Urban / Street GIS | MapLibre GL JS / prédios 3D (fill-extrusion), extrusão de polígonos e raycast em 3D Tiles | 3 |
| REF-47 | 10 | 3D Urban / Street GIS | MapLibre GL JS / terreno 3D, céu/neblina, controles de navegação e camadas que seguem o relevo | 3 |
| REF-48 | 10 | 3D Urban / Street GIS | deck.gl / camadas de dados 3D: TripsLayer sobre prédios, ScenegraphLayer, ArcLayer | 3 |
| REF-49 | 10 | 3D Urban / Street GIS | deck.gl / TerrainExtension (rota drapejada), Tile3DLayer e Google Photorealistic 3D Tiles | 3 |
| REF-50 | 10 | 3D Urban / Street GIS | CesiumJS / OSM Buildings, 3D Tiles, terreno, SceneModePicker 3D↔2D, flyTo e picking | 3 |
| REF-51 | 10 | 3D Urban / Street GIS | TerriaJS / mapa federado 2D/3D (nav, projetos, histórias) sobre CesiumJS | 3 |
| REF-52 | 10 | 3D Urban / Street GIS | kepler.gl / 3D de polígonos em UI de exploração (open source, deck.gl por baixo) | 3 |
| REF-53 | 10 | 3D Urban / Street GIS | Mapbox Standard (contraste proprietário) / 3D, landmarks e iluminação dinâmica | 1 |
| REF-54 | 11 | Data Modeling (visual, expression, lineage) | Tableau / Relationships (camada lógica "noodles" × camada física, Performance Options) | 4 |
| REF-55 | 11 | Data Modeling (visual, expression, lineage) | Tabular Editor 3 / Diagram view (diagramas por assunto, relação por arraste, chevron de colunas) | 4 |
| REF-56 | 11 | Data Modeling (visual, expression, lineage) | dbdiagram.io + DBML (código ↔ diagrama em tempo real; notação de cardinalidade em texto) | 2 |
| REF-57 | 11 | Data Modeling (visual, expression, lineage) | Power BI / DAX query view (rascunho de medida → preview → "Update model" com CodeLens) | 4 |
| REF-58 | 11 | Data Modeling (visual, expression, lineage) | Power BI / TMDL view (modelo como código: script, Preview com diff, Apply, diagnósticos) | 4 |
| REF-59 | 11 | Data Modeling (visual, expression, lineage) | Tabular Editor 3 / DAX editor (peek/define com dependências) + Best Practice Analyzer | 3 |
| REF-60 | 11 | Data Modeling (visual, expression, lineage) | Looker / LookML IDE: validação em duas camadas (erros em linha + Validate LookML + Project Health) | 3 |
| REF-61 | 11 | Data Modeling (visual, expression, lineage) | dbt Catalog (Explorer) / Lineage graph + Column-level lineage + Lenses | 3 |
| REF-62 | 11 | Data Modeling (visual, expression, lineage) | DataHub / Lineage visual + Impact Analysis (lista filtrável e exportável) | 3 |
| REF-63 | 11 | Data Modeling (visual, expression, lineage) | OpenMetadata / Lineage com camadas (Column, Observability, Service, Domain, Data Product) + Impact Analysis em tabela | 3 |
| REF-64 | 11 | Data Modeling (visual, expression, lineage) | Metabase Data Studio / Dependency graph + Dependency diagnostics (dependências quebradas, entidades sem referência) | 3 |
| REF-65 | 11 | Data Modeling (visual, expression, lineage) | Metabase / Metadata de campos e tabelas + definição de Medida (Data Studio) + Schema viewer | 3 |
| REF-66 | 12 | Connector Experience | Airbyte / Connector Builder (REST/GraphQL) + AI Assist | 4 |
| REF-67 | 12 | Connector Experience | Airbyte / Connector Setup Assistant (modo Agent ⇄ Form) | 1 |
| REF-68 | 12 | Connector Experience | Fivetran / AI Connector Agent + Setup form declarativo do Connector SDK | 2 |
| REF-69 | 12 | Connector Experience | Power Query / Fabric — Catálogo "Choose data source" (busca + categorias) (+ Fivetran, Retool) | 3 |
| REF-70 | 12 | Connector Experience | Power Query — Fluxo Connection settings → Authentication → Navigator (preview e seleção de tabelas) | 4 |
| REF-71 | 12 | Connector Experience | Power Query (+ Databricks, Metabase) — Upload de CSV: encoding, delimitador, detecção de tipos e preview | 3 |
| REF-72 | 12 | Connector Experience | Fivetran + Airbyte + Hex — Descoberta de schema, seleção de tabelas/colunas e revisão de mudanças | 5 |
| REF-73 | 12 | Connector Experience | Airbyte + Hex — Estados de ingestão e erros acionáveis (falha parcial) | 4 |
| REF-74 | 12 | Connector Experience | n8n + Airbyte + Hex — Autenticação e segredos (Managed vs Custom OAuth, "Secret field", segurança da conexão) | 2 |
| REF-75 | 12 | Connector Experience | Zapier + Microsoft Fabric — Padrões Copilot: "AI preenche, usuário revisa" sem esconder o manual | 3 |
| REF-76 | 13 | Workflow Builder | n8n / canvas de workflow, sub-nós de IA, logs de execução e sub-workflows | 2 |
| REF-77 | 13 | Workflow Builder | Node-RED / editor com grupos, subflows, navigator, debug sidebar | 3 |
| REF-78 | 13 | Workflow Builder | React Flow (xyflow) / exemplos oficiais: sub-flows, contextual zoom, expand/collapse, status | 3 |
| REF-79 | 13 | Workflow Builder | Dagster / Global Asset Lineage, Asset overview e Run view (Gantt) | 3 |
| REF-80 | 13 | Workflow Builder | Apache Airflow 3 / Graph, Grid, Task Groups e run com falhas | 3 |
| REF-81 | 13 | Workflow Builder | Prefect / grafo de execução de flow run, assets lineage (beta) e estado "Late" | 3 |
| REF-82 | 13 | Workflow Builder | Temporal Web UI / lista de workflows e histórico com Timeline | 2 |
| REF-83 | 13 | Workflow Builder | Apache NiFi / canvas de fluxo de dados com process groups, filas e estatísticas em cada nó | 3 |
| REF-84 | 13 | Workflow Builder | Kestra / editor com abas Flow Code · No-code · Topology, Gantt de execução e dependências | 3 |
| REF-85 | 14 | AI-Assisted Workflow Creation | Kestra AI Copilot / modos Edit · Ask · Plan, "Proposed flow" com selo Valid e "Approve & execute" | 3 |
| REF-86 | 14 | AI-Assisted Workflow Creation | n8n AI Workflow Builder / "Build with AI", créditos e "Execute and refine" | 1 |
| REF-87 | 14 | AI-Assisted Workflow Creation | Power Automate Copilot / "Describe it to design it" → estrutura sugerida → "Keep it and continue" → designer com Copilot | 2 |
| REF-88 | 14 | AI-Assisted Workflow Creation | Zapier Copilot / Auto-build vs. "Ask as you build", checkpoints e Revert | 2 |
| REF-89 | 15 | Progressive Complexity | Elastic Kibana / Discover ES\|QL + Lens (quick functions → Formula → ES\|QL, com Suggestions) | 2 |
| REF-90 | 15 | Progressive Complexity | Metabase / Query builder "notebook" (passos) + Preview por passo + "View SQL" / Convert to SQL | 3 |
| REF-91 | 15 | Progressive Complexity | Grafana (Loki/Prometheus) / Query editor Builder ↔ Code + "Explain query" | 2 |
| REF-92 | 15 | Progressive Complexity | Grafana Drilldown apps (Metrics/Logs/Traces/Profiles Drilldown): exploração "queryless" guiada | 3 |
| REF-93 | 15 | Progressive Complexity | Figma / Dev Mode vs Design mode (modo por audiência) + Inspect com List \| Code | 3 |
| REF-94 | 15 | Progressive Complexity | GitHub / Barra de filtro de Issues e PRs: dropdowns ↔ query digitada ↔ URL (com content assist e AND/OR aninhado) | 2 |
| REF-95 | 15 | Progressive Complexity | Airbyte / Configuração de conector: "Agent \| Form" (assistente guiado por IA ↔ formulário completo) | 1 |
| REF-96 | 15 | Progressive Complexity | Metabase / X-rays e "Automatic insights" (defaults inteligentes gerando dashboards navegáveis: Zoom in / Zoom out / Related) | 2 |
| REF-97 | 15 | Progressive Complexity | Nielsen Norman Group / Progressive disclosure (ficha conceitual) | 0 |
| REF-98 | 15 | Progressive Complexity | IBM Carbon (Disclosures pattern) + GitHub Primer (Progressive disclosure) — guidelines de design system (ficha conceitual) | 2 |
| REF-99 | 16 | Report Ideas (demonstration reports) | Kentik Map (Kentik Network Observability) (relatório BIWEB relacionado: Network Intelligence) | 2 |
| REF-100 | 16 | Report Ideas (demonstration reports) | Dynatrace Problems app (feed + detalhe do problema) (relatório BIWEB relacionado: Incident Intelligence) | 2 |
| REF-101 | 16 | Report Ideas (demonstration reports) | Datadog Service Catalog / Service Map (relatório BIWEB relacionado: Dependency & Impact) | 1 |
| REF-102 | 16 | Report Ideas (demonstration reports) | Datadog Watchdog Alert + Incident Management (relatório BIWEB relacionado: Incident Intelligence / Anomaly Explorer) | 2 |
| REF-103 | 16 | Report Ideas (demonstration reports) | Elastic Machine Learning: Anomaly Explorer + Single Metric Viewer (relatório BIWEB relacionado: Anomaly Explorer) | 2 |
| REF-104 | 16 | Report Ideas (demonstration reports) | Datadog Host Map (relatório BIWEB relacionado: Capacity & Saturation) | 1 |
| REF-105 | 16 | Report Ideas (demonstration reports) | Elastic Observability SLOs (lista + detalhe) (relatório BIWEB relacionado: SLA & Risk Monitor) | 2 |
| REF-106 | 16 | Report Ideas (demonstration reports) | Honeycomb SLO detail view (relatório BIWEB relacionado: SLA & Risk Monitor) | 2 |
| REF-107 | 16 | Report Ideas (demonstration reports) | Esri ArcGIS Dashboards (Operations Dashboard) (relatório BIWEB relacionado: Operations Command Center) | 2 |
| REF-108 | 16 | Report Ideas (demonstration reports) | Salesforce Field Service Dispatcher Console (Gantt + Mapa) (relatório BIWEB relacionado: Field Operations) | 2 |
| REF-109 | 16 | Report Ideas (demonstration reports) | PostHog Product Analytics: Funnels e Retention (relatório BIWEB relacionado: Customer Behavior) | 2 |
| REF-110 | 16 | Report Ideas (demonstration reports) | Esri ArcGIS Urban e ArcGIS 3D GIS (relatório BIWEB relacionado: Street Intelligence 3D) | 2 |
| REF-111 | 16 | Report Ideas (demonstration reports) | Kepler.gl e Foursquare Studio: Time Playback (relatório BIWEB relacionado: Historical Replay) | 2 |
| REF-112 | 16 | Report Ideas (demonstration reports) | ThoughtSpot Liveboards (relatório BIWEB relacionado: Executive Commercial) | 2 |


---


## 03 — AI Copilot / Contextual Assistant

**Pergunta da área:** como a IA pode agir *sobre* uma aplicação existente (selecionando, propondo e alterando objetos) sem virar um chatbot nem criar uma identidade visual paralela?
**Aprendizados-chave:** contexto visível e editável antes do envio; sidebar como painel entre outros; status de ferramenta em linhas compactas; revisão em camadas; rede de segurança em três formas (undo do pedido, checkpoints, commit explícito); permissões herdadas. **O mercado migra para "aplicar primeiro, desfazer depois"; o BIWEB deve seguir o oposto** (Sugerir → Pré-visualizar → Confirmar → Aplicar).
**Ligação com o pack base:** o `REFERENCE_PACK_BI.md` não cobre IA (REF-01 a 17 tratam de editor, inspector, dados). Produtos de chat puro (ChatGPT, Claude) foram deliberadamente excluídos como referência dominante.

### REF-18 — Power BI Copilot (pane de relatório, Desktop/Service) / criar e editar páginas por linguagem natural

**IMAGES:**
- `pbi_copilot_pane_desktop` — https://learn.microsoft.com/en-us/power-bi/create-reports/media/copilot-create-desktop-report/copilot-create-sales-performance-desktop.png — Power BI Desktop com a página "Sales Performance Across Territories" gerada e o pane Copilot (badge "Preview") à direita, com cartão de sugestões, resposta com outline expansível por tópico, botão "Create" por tópico e, no fim, "Created a Sales Performance Across Territories page." + botão "Undo" — status: VERIFICADA / inspecionada (screenshot provavelmente de 2024–2025; o badge "Preview" indica UI antiga; a página da doc foi atualizada em 2026-07-09)
- `pbi_copilot_pane_edit_pie` — https://learn.microsoft.com/en-us/power-bi/create-reports/media/copilot-create-report/copilot-create-page-edits.png — pane Copilot em modo de edição: usuário pede "change the expenditures by island to a pie chart"; a resposta descreve a mudança e o visual no canvas já virou pizza; pane com ícones de vassoura (nova conversa), "..." e fechar; thumbs up/down — status: VERIFICADA / inspecionada
- `pbi_copilot_pane_empty` — https://learn.microsoft.com/en-us/power-bi/create-reports/media/copilot-create-report/copilot-create-start.png — estado vazio do pane: "What can Copilot help you with today?" com 3 ações (Create a new report page / Suggest content for a new report page / Answer a question about the data), caixa de prompt e aviso "Copilot uses AI. Always review content for mistakes." — status: VERIFICADA / inspecionada


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-18_01_pbi_copilot_pane_desktop`

![REF-18_01_pbi_copilot_pane_desktop](https://learn.microsoft.com/en-us/power-bi/create-reports/media/copilot-create-desktop-report/copilot-create-sales-performance-desktop.png)

`REF-18_02_pbi_copilot_pane_edit_pie`

![REF-18_02_pbi_copilot_pane_edit_pie](https://learn.microsoft.com/en-us/power-bi/create-reports/media/copilot-create-report/copilot-create-page-edits.png)

`REF-18_03_pbi_copilot_pane_empty`

![REF-18_03_pbi_copilot_pane_empty](https://learn.microsoft.com/en-us/power-bi/create-reports/media/copilot-create-report/copilot-create-start.png)

**SOURCE:** https://learn.microsoft.com/en-us/power-bi/create-reports/copilot-create-reports — doc oficial Microsoft Learn, "Last updated 2026-07-09" (conteúdo textual atual; screenshots podem ser mais antigos). Complemento (só via busca, não aberta): https://learn.microsoft.com/en-us/power-bi/create-reports/copilot-introduction

**PROBLEM:** Montar uma página de relatório do zero exige escolher tabelas, medidas, tipos de gráfico e layout. Iniciantes ficam diante de um canvas vazio com dezenas de painéis.

**SOLUTION:** Um único pane lateral com poucas ações iniciais ("criar página", "sugerir conteúdo", "responder pergunta"). A IA propõe um outline por tópico (expansível), o usuário escolhe qual tópico criar, e a página aparece no canvas já com visuais ligados ao modelo semântico. Edições posteriores (adicionar/mudar/excluir visual) são pedidas por texto no mesmo pane.

**OBSERVE:**
- O pane é "um painel entre outros": fica ao lado de Filters / Format / Data (as abas verticais ao lado), não substitui nenhum deles; fecha com X.
- O estado vazio oferece 3 ações curtas em vez de um chat em branco; "Suggest content" gera um outline em cartões expansíveis (Customer Analysis, Product Performance, Sales Territory Evaluation...), cada um com botão "Create" e um lápis para editar o prompt do tópico.
- Depois de criar, a própria conversa mostra um cartão de resultado "Created a ... page." com botão "Undo" explícito (a doc também cita "undo and redo" para ações do Copilot).
- A caixa de entrada tem um ícone de "sugestões/prompt guide" (livro) à esquerda e o rodapé de aviso "sempre revise o conteúdo gerado por IA".
- O botão de nova conversa é a vassoura no cabeçalho do pane (visível na imagem de edição).
- Limitações explícitas na doc: sem alteração de estilo/formatação, sem visuais customizados; ao reabrir um relatório gerado, ele abre em Reading view sem o pane (Copilot só existe em modo de edição).

**INTERACTION:**
1. Abrir o relatório e entrar em modo Edit (no Service); clicar no ícone Copilot na faixa (Ribbon).
2. Clicar "Suggest content for this report" ou digitar um prompt descrevendo a página.
3. Expandir um tópico do outline e clicar "Create" (ou editar o prompt do tópico).
4. A página é criada de uma vez no canvas; o cartão na conversa oferece "Undo".
5. Pedir ajustes ("mude para pizza", "adicione um visual de X", "exclua o visual Y"); salvar o relatório como de costume.

**WHY IT WORKS:** Reduz o espaço de decisão inicial a uma escolha entre 2–4 tópicos legíveis; mantém o resultado como objeto nativo (visuais comuns, editáveis pelos painéis de sempre); o "Undo" no próprio cartão da ação dá segurança sem exigir que o usuário descubra o Ctrl+Z.

**ADAPT TO BIWEB:** Usar o dock de IA como "um painel entre outros", com estado vazio de 3 ações e propostas em cartões por tópico (ChangeSet em blocos). Diferença importante: o Power BI aplica a página direto e oferece Undo depois; no BIWEB o princípio Sugerir→Pré-visualizar→Confirmar→Aplicar pede preview fantasma ANTES de aplicar, e o undo "IA: ..." deve existir também (como o botão Undo do cartão). Manter a IA disponível só em modo de edição, como o Power BI faz.

**DO NOT COPY:** Aplicação direta sem preview (a doc só promete undo/redo); badge "Preview"; dependência de modelo semântico com Q&A ligado; ícone multicolorido do Copilot, que é identidade de marca Microsoft.

---

---

### REF-19 — Cursor (Agents Window + Design Mode): elemento selecionado vira contexto + revisão de diff

**IMAGES:**
- `cursor_design_inline_prompt` — https://image.mux.com/Nt3PRe02XuixxdxNpiISlZVyNIf00CdsY00qBgrtVo43NQ/thumbnail.jpg?time=3 — frame do vídeo do changelog 3.7: navegador dentro do Cursor com modo "Design" ligado (pílula azul "Design x"), um texto selecionado com contorno azul e um mini-prompt flutuante "PopChildMeasure — Describe the change" com microfone — status: VERIFICADA / inspecionada (frame de vídeo; o `time=` escolhe o frame; testei `time=3`)
- `cursor_design_select_heading` — https://image.mux.com/rUjpbB00jg00fKieNpUF00BnOIek01KFSBE00zbxg4yJsLYo/thumbnail.jpg?time=3 — outro frame: título selecionado com caixa azul e popover "SemanticHeading — Describe the change"; à esquerda, o painel de agentes com input "Coordinate parallel tasks...", chip "Multitask x" e seletor de modelo — status: VERIFICADA / inspecionada
- `cursor_hover_element_label` — https://image.mux.com/UMJM00fBs7Y4V2V3LFiwrKHVjjZlZKKpMr2TnfxNp4pI/thumbnail.jpg?time=3 — frame do changelog 3.0: hover sobre um botão "Sign in" mostra um rótulo azul com o nome do componente + elemento ("InnerScrollAndFocusHandlerOld · a 'Sign in'") — status: VERIFICADA / inspecionada
- `cursor_agents_window_changes_diff` — https://image.mux.com/sZQK9gk9ZNqZLeRjCH02QlzVCEeBY5ktQLgkPTmLRjtU/thumbnail.jpg?time=3 — Agents Window (changelog 3.0): lista de agentes à esquerda; resumo do agente ("Worked for 5m 38s", Summary, Testing) no centro; à direita aba "Changes" com "7 Files Changed +93 -28" e diff inline em verde/vermelho; botão "Mark as Ready" — status: VERIFICADA / inspecionada


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-19_01_cursor_design_inline_prompt`

![REF-19_01_cursor_design_inline_prompt](https://image.mux.com/Nt3PRe02XuixxdxNpiISlZVyNIf00CdsY00qBgrtVo43NQ/thumbnail.jpg?time=3)

`REF-19_02_cursor_design_select_heading`

![REF-19_02_cursor_design_select_heading](https://image.mux.com/rUjpbB00jg00fKieNpUF00BnOIek01KFSBE00zbxg4yJsLYo/thumbnail.jpg?time=3)

`REF-19_03_cursor_hover_element_label`

![REF-19_03_cursor_hover_element_label](https://image.mux.com/UMJM00fBs7Y4V2V3LFiwrKHVjjZlZKKpMr2TnfxNp4pI/thumbnail.jpg?time=3)

`REF-19_04_cursor_agents_window_changes_diff`

![REF-19_04_cursor_agents_window_changes_diff](https://image.mux.com/sZQK9gk9ZNqZLeRjCH02QlzVCEeBY5ktQLgkPTmLRjtU/thumbnail.jpg?time=3)

**SOURCE:**
- https://cursor.com/docs/agent/design-mode — doc oficial (lida em 2026-10)
- https://cursor.com/changelog/design-mode-improvements — changelog oficial 3.7, 2026-06-05
- https://cursor.com/changelog/3-0 — changelog oficial 3.0 (Agents Window), 2026-04-02
- https://cursor.com/docs/agent/overview — doc oficial (checkpoints, fila de mensagens, steer)
- https://cursor.com/docs/agent/agent-review — doc oficial (Agent Review rápido/profundo)
- Evidência NÃO oficial (fórum): https://forum.cursor.com/t/bring-back-per-change-apply-inline-diff-review-you-re-throwing-away-your-best-ux-advantage/160856 — usuários reclamando que a revisão por mudança foi rebaixada para revisão por sessão.

**PROBLEM:** Descrever "aquele componente ali" em texto é impreciso; e quando a IA escreve muito código, o usuário perde o controle do que mudou.

**SOLUTION:** (1) Design Mode: o usuário clica no elemento rodando no app, e o agente recebe a identidade do elemento (xpath, componente, atributos, estilos computados, props) mais um screenshot; também permite multisseleção, desenho sobre a página e voz. (2) Revisão: a aba "Changes" agrega diff por arquivo; checkpoints permitem restaurar o estado antes de uma etapa; mensagens podem ser enfileiradas ou "steer" durante a execução.

**OBSERVE:**
- Seleção de elemento aparece como chip/rótulo junto ao prompt ("PopChildMeasure · Describe the change"): o contexto selecionado fica DENTRO do campo, não escondido.
- Hover mostra o nome do componente + tag antes de clicar (feedback de alvo).
- Atalhos para escolher o destino do contexto: "Add element to chat" (Cmd/Ctrl+L) vs "Add element to input" (Alt+clique); Shift+arrastar seleciona uma área.
- Doc diz que a ideia é "mandar edições enquanto vê a próxima": a entrada continua disponível enquanto o agente roda; Enter enfileira, Cmd+Enter envia na hora (steer).
- Painel "Changes" mostra contagem agregada (7 arquivos, +93 −28), diff inline com verde/vermelho e ação final de nível de sessão ("Mark as Ready"); o resumo textual lista o que foi feito e o que foi testado.
- Checkpoints: cada pedido tem ponto de restauração local, separado do Git, que reverte arquivos mas não apaga mensagens (doc oficial).
- Contraponto (fórum, não oficial): na versão 3.x o fluxo padrão passou a "auto-keep" com revisão de sessão; usuários pedem de volta o Keep/Undo por mudança. Configuração mencionada: "Inline Diffs" em Settings > Agents (NÃO verificada na doc oficial).

**INTERACTION:**
1. Abrir o navegador integrado do Agents Window e ligar Design Mode (Cmd/Ctrl+Shift+D).
2. Passar o mouse (rótulo do componente), clicar no elemento (ou Shift+clique/área, ou desenhar).
3. Digitar ou falar a mudança no mini-prompt ancorado ao elemento.
4. O agente edita o código; o app recarrega (hot reload) e a mudança aparece no próprio app.
5. Revisar em "Changes" (diff por arquivo), pedir ajustes, ou restaurar um checkpoint.

**WHY IT WORKS:** Pointing remove ambiguidade: o contexto é a coisa que o usuário está vendo, com tudo que a máquina precisa para localizá-la. A saída é sempre um diff legível e reversível, então o usuário confia em delegar.

**ADAPT TO BIWEB:** "Selecionar widget(s) no canvas → vira chip no input ('Selecionado: 4 gráficos')" com rótulo no hover e multisseleção. O prompt pode ancorar-se ao elemento selecionado (popover curto) e aparecer também no dock. O diff por item (adição/remoção/alteração) deve ser agregado em um resumo ("+2 widgets, −1, ~3 alterados") como a contagem "+93 −28". Adotar ponto de restauração por pedido, mapeado para 1 passo de undo "IA: ...".

**DO NOT COPY:** Identidade do elemento via xpath/fiber/props (específico de código web); modo "auto-keep" por padrão (contradiz "nada muda em silêncio"); voz e desenho livre (escopo grande para o MVP); chaves de modelo e "Run in Cloud".

---

---

### REF-20 — GitHub Copilot Chat no VS Code: anexos de contexto, Keep/Undo, checkpoints

**IMAGES:**
- `vscode_changed_files_keep_undo` — https://code.visualstudio.com/assets/docs/agents/review-code-edits/copilot-edits-changed-files-full.png — VS Code com chat à direita no modo Agent: passos "Read layout.tsx", "Searched text for ...", cartão "layout.tsx +2 −2"; no editor, linhas removidas em vermelho e adicionadas em verde com mini-barra ✓ ↶ por bloco; no rodapé do chat, destacado em vermelho, "1 file changed +6 −6 [Keep] [Undo]"; chip de contexto do arquivo ativo ("layout.tsx +") acima do input com "Add Context...", seletor "Agent" e "Auto" — status: VERIFICADA / inspecionada (UI de 2025, fluxo "extension-host")
- `vscode_file_review_controls` — https://code.visualstudio.com/assets/docs/agents/review-code-edits/copilot-edits-file-review-controls.png — editor com diff inline e barra flutuante azul no canto: "Keep | Undo | 1 of 5 ↑ ↓" para navegar entre mudanças de um arquivo; mini-botões ✓ ↶ no bloco — status: VERIFICADA / inspecionada
- `vscode_restore_checkpoint` — https://code.visualstudio.com/assets/docs/agents/chat-checkpoints/chat-restore-checkpoint.png — linha pontilhada com botão "Restore Checkpoint" (tooltip "Restores workspace and chat to this point") antes de um pedido do usuário; abaixo "2 files changed" com lista — status: VERIFICADA / inspecionada
- `vscode_context_hash_menu` — https://code.visualstudio.com/assets/docs/chat/copilot-chat/copilot-chat-view-chat-variables.png — menu aberto ao digitar "#" no input: #activePullRequest, #changes, #codebase, #editFiles... (ferramentas/variáveis de contexto) — status: VERIFICADA / inspecionada
- `vscode_tool_status_terminal` — https://code.visualstudio.com/assets/docs/agents/chat-tools/terminal-command-output.png — chat com "Used 1 reference" (colapsado) e cartão de ferramenta "✓ Get-Location" com ícone para abrir saída — status: VERIFICADA / inspecionada


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-20_01_vscode_changed_files_keep_undo`

![REF-20_01_vscode_changed_files_keep_undo](https://code.visualstudio.com/assets/docs/agents/review-code-edits/copilot-edits-changed-files-full.png)

`REF-20_02_vscode_file_review_controls`

![REF-20_02_vscode_file_review_controls](https://code.visualstudio.com/assets/docs/agents/review-code-edits/copilot-edits-file-review-controls.png)

`REF-20_03_vscode_restore_checkpoint`

![REF-20_03_vscode_restore_checkpoint](https://code.visualstudio.com/assets/docs/agents/chat-checkpoints/chat-restore-checkpoint.png)

`REF-20_04_vscode_context_hash_menu`

![REF-20_04_vscode_context_hash_menu](https://code.visualstudio.com/assets/docs/chat/copilot-chat/copilot-chat-view-chat-variables.png)

`REF-20_05_vscode_tool_status_terminal`

![REF-20_05_vscode_tool_status_terminal](https://code.visualstudio.com/assets/docs/agents/chat-tools/terminal-command-output.png)

**SOURCE:**
- https://code.visualstudio.com/docs/agents/run/review-code-edits (redireciona de /docs/copilot/chat/review-code-edits) — doc oficial atual (2026)
- https://code.visualstudio.com/docs/chat/copilot-chat-context — doc oficial, atualizada em 2026-10-07 (contexto: #, @, Add Context, Add Element to Chat)
- https://code.visualstudio.com/docs/agents/run/tools — doc oficial (status de ferramentas, aprovação de terminal)
- https://code.visualstudio.com/docs/agents/run/sessions/manage-sessions — doc oficial (lista de sessões)

**PROBLEM:** Um agente que edita vários arquivos precisa ser supervisionável: o usuário precisa ver o contexto que entrou, o que foi executado e poder aceitar/recusar/voltar.

**SOLUTION:** Input com anexos de contexto (chips) e variáveis `#`/`@`; resposta em passos com status de ferramenta; resumo "N arquivos alterados +x −y" com Keep/Undo; diff inline no próprio editor; checkpoints por pedido para restaurar workspace e chat.

**OBSERVE:**
- O arquivo ativo vira chip automático acima do input, com "+" para fixá-lo; "Add Context..." abre o seletor (arquivos, issue, PR, elemento do navegador, screenshot, logs).
- Variáveis `#` listam capacidades/ferramentas (#changes, #codebase...); `@` seleciona participantes; `/` comandos: três gatilhos, um campo.
- Passos como "Read layout.tsx" e "Searched text for ..." aparecem como linhas compactas com ✓; referências usadas ficam colapsadas ("Used 1 reference").
- Resumo "1 file changed +6 −6" tem ação coletiva (Keep / Undo) E o editor tem ações por bloco e navegação "1 of 5" (granularidade em 3 níveis: bloco, arquivo, resposta).
- Comandos de terminal exigem confirmação (Ctrl+Enter) e podem ser editados antes de rodar; URLs externas pedem confirmação (doc).
- Checkpoint: linha pontilhada com botão "Restore Checkpoint" antes de cada pedido.
- Desfazer/refazer no chat desfaz a última edição de arquivo da resposta (doc 2025/2026) sem reverter a resposta inteira.
- ATENÇÃO (evolução): a doc atual diz que em "Agent Host sessions" as edições são aplicadas e salvas direto, sem estado pendente; o fluxo Keep/Undo permanece em sessões "extension-host" antigas. Em vez disso, a revisão é por diff/Source Control, com "Add Feedback" por trecho e "Mark as Reviewed" por arquivo. As imagens acima mostram o fluxo antigo.

**INTERACTION:**
1. Abrir o chat (painel lateral), escolher modo (Ask/Edit/Agent) e opcionalmente anexar contexto (#, @, Add Context, arrastar).
2. Enviar; acompanhar os passos de ferramenta; aprovar comandos sensíveis.
3. No resumo, expandir "N files changed"; abrir diff de cada arquivo.
4. Keep ou Undo (global, por arquivo ou por bloco), ou Restore Checkpoint.
5. No Agents window: selecionar trecho do diff → "Add Feedback" → "Submit Feedback"; o agente resolve cada comentário.

**WHY IT WORKS:** Cada decisão tem um lugar visível: o que a IA sabe (chips), o que fez (passos), o que mudou (diff) e como voltar (Keep/Undo/Checkpoint). Granularidade progressiva: resumo primeiro, detalhe sob demanda.

**ADAPT TO BIWEB:** Replicar a granularidade em 3 níveis no ChangeSet: aceitar tudo / aceitar por widget / aceitar por propriedade (handles de diff), com navegação "1 de 5" entre itens e resumo "N alterações". Um único gatilho `@` no input para anexar contexto (widgets, campos do modelo semântico, filtros). Criar o equivalente de "Restore Checkpoint" como linha no histórico do dock, e feedback por trecho ("comentar neste widget") para pedir revisão sem reescrever o prompt.

**DO NOT COPY:** Os modos Ask/Edit/Agent e a lista de variáveis `#` (jargão de dev); a mudança para "edição aplicada direto" em sessões novas (contraria o princípio Confirmar→Aplicar do BIWEB); nomes e ícones do ecossistema Copilot.

---

---

### REF-21 — Grafana Assistant: sidebar contextual → Workspace com canvas + "Undo turn"

**IMAGES:**
- `grafana_assistant_edit_toolstatus` — https://a-us.storyblok.com/f/1022730/092eb93883/purple-bulk-change.png — dashboard Grafana em modo de edição (botões Add/Settings/Exit edit/Save dashboard) com o painel do Assistant à direita: texto "I'll help you fix the database size panel...", linhas de ferramenta com ✓ ("read dashboard panels", "run Prometheus query", "search for Prometheus metrics", "validate queries") expansíveis por seta; chips de datasource (grafanacloud-...-prom / -logs) acima do input "Ask questions, go places, make changes, anything."; botão "Interrupt"; os painéis do dashboard já com gradiente roxo — status: VERIFICADA / inspecionada (screenshot do blog de maio/2025, versão preview; UI pode ter mudado)
- `grafana_assistant_at_context_menu` — https://a-us.storyblok.com/f/1022730/838bbd5437/data-sources-labels-dashboards-metrics.png — painel lateral com título da conversa ("Configure Users in Grafana"), aviso "During preview, conversations are stored and reviewed...", passo "✓ navigate to URL" e menu aberto ao digitar "@" com Datasources / Labels / Dashboards / Metrics; chips de contexto acima do input — status: VERIFICADA / inspecionada (2025, preview)
- `grafana_assistant_welcome_page_context` — https://a-us.storyblok.com/f/1022730/550672e939/chat-conversation.png — mensagem de boas-vindas ciente da página: "The current page is the Grafana Home, which displays a dashboard..." sugerindo uma pergunta; cabeçalho com título da conversa, seta de histórico e "+" para nova conversa — status: VERIFICADA / inspecionada (2025, preview)


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-21_01_grafana_assistant_edit_toolstatus`

![REF-21_01_grafana_assistant_edit_toolstatus](https://a-us.storyblok.com/f/1022730/092eb93883/purple-bulk-change.png)

`REF-21_02_grafana_assistant_at_context_menu`

![REF-21_02_grafana_assistant_at_context_menu](https://a-us.storyblok.com/f/1022730/838bbd5437/data-sources-labels-dashboards-metrics.png)

`REF-21_03_grafana_assistant_welcome_page_context`

![REF-21_03_grafana_assistant_welcome_page_context](https://a-us.storyblok.com/f/1022730/550672e939/chat-conversation.png)

**SOURCE:**
- https://grafana.com/blog/2025/05/07/llm-grafana-assistant/ — blog oficial 2025-05-07 (curl retorna 403; li via WebFetch; URLs das imagens vieram de WebFetch e foram verificadas por curl)
- https://grafana.com/docs/grafana-cloud/machine-learning/assistant/platform/workspace.md — doc oficial (Workspace, layout de 3 colunas, canvas, modo Dashboarding, Save to Grafana)
- https://grafana.com/docs/grafana-cloud/platform/grafana-assistant/guides/dashboarding.md — doc oficial (seleção de painéis, Cmd/Ctrl-clique múltiplo, ações no menu do painel)
- https://grafana.com/whats-new/2026-07-27-workspace-is-now-generally-available-in-grafana-cloud/ — what's new oficial (Workspace GA em 2026-07-27)
- https://grafana.com/whats-new/2026-09-21-try-dashboard-changes-confidently-with-grafana-assistant-undo/ — what's new oficial, 2026-09-21 (Undo turn)

**PROBLEM:** Observabilidade tem muitas telas, linguagens de consulta e recursos. O usuário não sabe onde ir nem como escrever a query.

**SOLUTION:** Um agente na lateral, ciente da página atual, que também navega, consulta, valida e edita dashboards. Para trabalho longo, um Workspace de 3 colunas (conversas | chat | canvas) em que o dashboard renderiza ao vivo ao lado do chat e só é salvo quando o usuário clica "Save to Grafana".

**OBSERVE:**
- A sidebar acompanha a navegação ("stays open as you navigate") e recebe o contexto da visão atual por prompt de sistema; ao abrir ou criar conversa o contexto é atualizado (blog).
- Chips de contexto (datasource etc.) acima do input; `@` ou "Add context" abre menu categorizado; no Workspace os itens escolhidos viram tags acima do prompt e há indicador de uso da janela de contexto.
- Na doc de dashboards: selecionar um painel (ou vários com Cmd/Ctrl) define o contexto da edição; o picker também inclui variáveis do dashboard e camadas de anotação com valor/escopo atuais.
- Menu do painel tem ações de IA nomeadas ("Explain in Assistant", "Troubleshoot panel", "Analyze data", "Suggest improvements"): IA como ações no objeto, não só chat.
- Passos de ferramenta aparecem como linhas ✓ expansíveis ("read dashboard panels", "run Prometheus query", "validate queries"); erros voltam automaticamente ao modelo (blog); botão "Interrupt" durante a execução.
- Workspace: canvas à direita é rascunho vivo até "Save to Grafana" (diálogo com título, pasta e mensagem de commit); conversas agrupadas por Pinned/Recent/This week/Earlier, com renomear, fixar, arquivar; atalhos Option+S / Option+C; fila de prompts.
- Citações: em investigações, chips numerados "Source 1" no texto abrem o painel de origem em uma aba "Sources" (doc).
- "Undo turn" (2026-09-21): botão abaixo da resposta reverte o dashboard ao estado anterior àquele pedido, desfazendo todos os painéis alterados juntos; só vale para o pedido mais recente com a página aberta e se recusa se o usuário editou manualmente depois.
- A imagem de capa oficial (storyblok `grafanaassistantgeneralmetaimage.png`, inspecionada) mostra o input com borda em gradiente brilhante e a marca "Grafana Assistant": exemplo de IA com identidade visual própria (ver Padrões transversais).

**INTERACTION:**
1. Abrir o Assistant na sidebar (ou "Open in Workspace" no menu da conversa).
2. Ler a saudação ciente da página; digitar `@` para anexar datasource/dashboard/label; ou clicar num painel e escolher "Explain in Assistant".
3. Pedir uma ação ("mude o Error Rate para bar gauge"); acompanhar as linhas de ferramenta.
4. Em Workspace, modo Dashboarding: o canvas à direita atualiza ao vivo; iterar por chat.
5. "Undo turn" se não gostar; ou "Save to Grafana" (título, pasta, commit message).

**WHY IT WORKS:** O contexto é sempre explícito e curto (tags), a IA opera nos mesmos objetos nativos (painéis, variáveis), e a ação perigosa (salvar) fica separada da ação exploratória (editar rascunho). O undo por turno trata uma "resposta da IA" como uma unidade, o que é exatamente o modelo mental do usuário.

**ADAPT TO BIWEB:** Adotar: (a) um "rascunho vivo" no canvas e um único gesto de commit explícito; (b) "Undo" por turno ("IA: <resumo>") que desfaz o lote inteiro e se recusa com explicação quando o usuário editou depois; (c) ações de IA no menu contextual do widget ("Explicar", "Sugerir melhorias") que já abrem o dock com o chip preenchido; (d) citações como chips numerados que apontam para mini-visualizações. Em BIWEB, o dock não deve virar página própria; manter como painel entre outros.

**DO NOT COPY:** Linhas de ferramenta com nomes técnicos (Prometheus, LogQL) — para BI, traduzir para "Consultando Vendas", "Validando campos"; o brilho em gradiente e o ícone de estrelas como marca própria da IA; modos (Investigation, Dashboarding, Learning) como seletor — complexidade excessiva para o BIWEB.

---

---

### REF-22 — Datadog Bits Chat (antes Bits Assistant): painel lateral + permissão por papel + "Auto-approve"

**IMAGES:**
- `datadog_bits_side_panel` — https://docs.dd-static.net/images/bits_ai/getting_started/bits_assistant_side_panel.4c2a971ba32630b14afc48957eb55a0b.png — lista de Dashboards à esquerda; painel "Bits Chat NEW — Search and act across Datadog" à direita (fundo escuro estrelado), 3 sugestões cientes da página ("Look up documentation related to the current page", "Summarize any current high-severity incidents", "What can you do?"), input "Ask, build, and act across your stack" com ícones @ (anexar), câmera, imagem, interruptor "Auto-approve" desligado, microfone e enviar; botão "Ask Bits" no canto superior direito — status: VERIFICADA / inspecionada (doc oficial 2026)
- `datadog_bits_home` — https://web-assets.dd-static.net/42588/1780590876-introducing-bits-chat-feature-announcement-hero.png — tela inicial full-page "Bits Chat — Good morning": input com "@", imagem e "Auto-approve", mais 4 cartões de ação (Investigate an incident, Explore service logs, Check system health, Build a dashboard) e links "Refresh" / "Tailor..." — status: VERIFICADA / inspecionada (blog oficial 2026-06-08)


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-22_01_datadog_bits_side_panel`

![REF-22_01_datadog_bits_side_panel](https://docs.dd-static.net/images/bits_ai/getting_started/bits_assistant_side_panel.4c2a971ba32630b14afc48957eb55a0b.png)

`REF-22_02_datadog_bits_home`

![REF-22_02_datadog_bits_home](https://web-assets.dd-static.net/42588/1780590876-introducing-bits-chat-feature-announcement-hero.png)

**SOURCE:**
- https://docs.datadoghq.com/bits_ai/bits_chat.md — doc oficial (permissões por papel, skills, formas de abrir; Cmd/Ctrl+I)
- https://www.datadoghq.com/blog/introducing-bits-chat.md — blog oficial, 2026-06-08 (GA do Bits Chat)

**PROBLEM:** Encontrar o dashboard/monitor/trace certo e montar a visualização exige conhecer a plataforma inteira.

**SOLUTION:** Um chat que pode ser aberto como página inteira ou como painel lateral dentro da página atual (Cmd/Ctrl+I), com sugestões ligadas à tela e "skills" que criam dashboards, widgets e notebooks nativos. O acesso aos dados e a permissão de edição seguem o papel do usuário.

**OBSERVE:**
- O mesmo componente tem dois formatos (página inteira vs painel lateral), com botão de expandir no painel.
- Sugestões da tela vazia mudam conforme o contexto: no painel sobre a lista de Dashboards aparece "documentação relacionada à página atual"; na home, 4 cartões de tarefa com "Refresh" e "Tailor..." para personalizar.
- Input traz anexos (@, imagem, screenshot) e um interruptor "Auto-approve" visível no rodapé: aprovação de ações é uma escolha do usuário, desligada por padrão na imagem. (A doc oficial NÃO explica a semântica do toggle; NÃO VERIFICADO o que ele cobre.)
- Dashboards/notebooks criados são artefatos nativos e compartilháveis; "o Bits Chat não edita um dashboard que você não tem permissão de editar" (doc, resumida).
- Resultados "aparecem direto na conversa para inspecionar e refinar" (blog), com follow-ups para ajustar filtros e intervalo.
- O painel escuro com fundo estrelado destoa do restante da UI clara (lista de dashboards): exemplo de IA com identidade visual forte.

**INTERACTION:**
1. Cmd/Ctrl+I ou "Ask Bits" abre o painel na página atual.
2. Escolher uma sugestão ou digitar; anexar com @/imagem se necessário.
3. Ler a resposta e os resultados inline (gráficos, listas).
4. Pedir criação ("adicione um widget de CPU") e decidir se aprova ações manualmente (Auto-approve desligado) ou automaticamente.
5. Abrir o dashboard/notebook criado como objeto normal.

**WHY IT WORKS:** Permissões herdadas do papel eliminam uma classe de riscos sem UI extra; sugestões ligadas à página reduzem o "e agora?"; o objeto gerado é nativo, então o usuário continua no mesmo modelo mental.

**ADAPT TO BIWEB:** Herdar o RBAC existente (a IA só vê/edita o que o usuário pode) e dizê-lo em texto curto no dock. Expor um controle de aprovação na própria linha do input, mas com semântica documentada na UI (ex.: "Perguntar antes de aplicar" ligado por padrão, conforme "nada muda em silêncio"). Sugestões vazias devem ser derivadas do contexto da tela (dashboard aberto, widget selecionado).

**DO NOT COPY:** Fundo estrelado/brilho (a IA do BIWEB não tem estética própria); Auto-approve como padrão rápido sem semântica clara; Slack/mobile (fora de escopo).

---

---

### REF-23 — Databricks Genie Code (Assistant): aprovação de ferramentas, Quick Fix com diff, chip de página, citações

**IMAGES:**
- `databricks_quickfix_inline_diff` — https://docs.databricks.com/aws/en/assets/images/assistant-quick-fix-f3fa69897609f69c154aac51bba2df40.png — célula de notebook com erro: linha removida em vermelho e linha proposta em verde (diff inline), botões "Reject Esc" e "Accept & Run ⌘+↵" (com seta de menu), botão "Run suggested", "View Trace", mensagem "Last execution failed", botões "Diagnose error" e "Debug", seletor "Genie Code Quick Fix: ON" — status: VERIFICADA / inspecionada (doc atualizada em 2026-09)
- `databricks_genie_panel_citations` — https://docs.databricks.com/aws/en/assets/images/assistant-suggestions-citations-cc652b2172c42800f779047838e58d47.png — painel "Genie Code" com ícones +, engrenagem, "...", X; chip "Home page" no topo indicando a página atual como contexto; bolha do usuário ("How do I create a notebook?"); blocos "Thoughts", "Searched documentation"; lista numerada e "Sources:" com links; botões thumbs, regenerar, bug — status: VERIFICADA / inspecionada (doc atualizada em 2026-09)


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-23_01_databricks_quickfix_inline_diff`

![REF-23_01_databricks_quickfix_inline_diff](https://docs.databricks.com/aws/en/assets/images/assistant-quick-fix-f3fa69897609f69c154aac51bba2df40.png)

`REF-23_02_databricks_genie_panel_citations`

![REF-23_02_databricks_genie_panel_citations](https://docs.databricks.com/aws/en/assets/images/assistant-suggestions-citations-cc652b2172c42800f779047838e58d47.png)

**SOURCE:**
- https://docs.databricks.com/aws/en/genie-code/agent-mode — doc oficial, "Last updated Sep 25, 2026" (aprovação de ferramentas e modos)
- https://docs.databricks.com/aws/en/genie-code/features-capabilities — doc oficial, 2026-09-25 (citações, Quick Fix)
- https://docs.databricks.com/aws/en/notebooks/code-assistant — doc oficial, 2026-09-11 (Cmd+I inline, slash commands, diff Accept/Reject)

**PROBLEM:** Um agente que executa código, edita notebooks e consulta tabelas pode causar dano real em dados; ao mesmo tempo, aprovar cada passo cansa.

**SOLUTION:** Um modelo explícito de aprovação por ferramenta, com 4 níveis (perguntar sempre, permitir neste chat, sempre permitir, auto-aprovar com classificador que bloqueia o que foge do pedido), e propostas de código como diff com Accept/Reject.

**OBSERVE:**
- O pedido de permissão aparece no próprio fluxo, com botões "Allow" e "Skip" e a opção de ampliar o escopo ("neste chat" / "sempre") no mesmo prompt.
- O modo padrão pode ser mudado nas configurações (engrenagem no cabeçalho do painel); a doc avisa em destaque que auto-approve é "feature de produtividade, não fronteira de segurança" e recomenda desligar com dados de produção.
- Auto-approve usa um classificador que compara cada ação com a intenção do pedido; ações fora do escopo (ex.: DROP em tabela não citada) são bloqueadas e o motivo volta ao agente para ele tentar de novo com escopo menor.
- Quick Fix: diff vermelho/verde inline na célula, com "Reject (Esc)" e "Accept & Run (⌘↵)": atalhos no rótulo.
- Aceitar código não executa automaticamente (doc de /fix e /doc): aceitar e rodar são passos separados, a menos que se use "Accept & Run".
- Chip "Home page" no topo do painel mostra em qual página/contexto o agente está; blocos "Thoughts" e "Searched documentation" explicam o que foi consultado; "Sources:" lista links.
- Ao enviar o prompt, o contexto enviado ao modelo inclui nomes de tabelas/colunas, amostras e saídas de células, respeitando permissões do Unity Catalog (doc).

**INTERACTION:**
1. Abrir o painel (ou Cmd+I na célula para um prompt inline).
2. Pedir a tarefa; o agente planeja e, quando precisa de uma ferramenta, pede Allow/Skip.
3. Escolher o escopo da aprovação (essa vez / neste chat / sempre / auto).
4. Se for edição de código, revisar o diff inline e usar Accept, Reject ou Accept & Run.
5. Consultar fontes e passos de pensamento se quiser verificar.

**WHY IT WORKS:** Troca "confirmar tudo" por um dial claro de confiança, mantendo a confirmação como padrão; separar aceitar de executar evita o erro mais caro; mostrar a fonte da resposta aumenta confiança.

**ADAPT TO BIWEB:** Definir níveis de aprovação simples para o dock ("Perguntar antes de aplicar" / "Aplicar sem perguntar neste painel"), escopo por sessão e por tipo de ação (leitura vs. alteração vs. remoção), com remoções sempre exigindo confirmação. Usar a lição do "Accept ≠ Run": no BIWEB, "Aceitar" altera o rascunho e "Publicar" é outro passo. Mostrar um chip da página/seleção atual e, nas respostas analíticas, o bloco de fontes/evidências.

**DO NOT COPY:** Classificador de IA decidindo o que aprovar (opaco demais para BI e difícil de explicar); "Thoughts" visível como texto longo; slash commands de código (/fix, /doc).

---

---

### REF-24 — ThoughtSpot SpotterViz: agente de edição de Liveboards, só em modo Edit, com checkpoints e painel configurável

**IMAGES:**
- `spotterviz_panel_embed` — https://developers.thoughtspot.com/docs/doc-images/images/spotterviz-embed-mode.png — Liveboard em modo de edição, barra superior escura com botões "Add", "Styling", "SpotterViz" (ativo) e "Cancel / Save"; à direita o painel SpotterViz com avatar, saudação "Hi, there! I'm SpotterViz", 3 prompts iniciais ("Improve overall clarity, structure, and presentation...", "Highlight the most important KPIs...", "Add global filters...") e input "Let me help you build this Liveboard" com um ícone de seleção (cursor em caixa) e rodapé "SpotterViz responses should be reviewed." Rótulo "cluster 26.8" no canto — status: VERIFICADA / inspecionada (screenshot de cluster 26.8; doc 26.10)


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-24_01_spotterviz_panel_embed`

![REF-24_01_spotterviz_panel_embed](https://developers.thoughtspot.com/docs/doc-images/images/spotterviz-embed-mode.png)

**SOURCE:**
- https://docs.thoughtspot.com/cloud/latest/spotter-viz (resolvido para 26.10.0.cl) — doc oficial (fluxo, FAQ de checkpoints/undo, limitações)
- https://developers.thoughtspot.com/docs/spotterViz-agent — doc oficial para desenvolvedores (personalização do painel: marca, estados de loading, tool calls, checkpoints; `Action.SpotterViz`, `Action.SpotterVizCheckpointRestore`)

**PROBLEM:** Montar um Liveboard (dashboard) completo — escolher fonte de dados, perguntas, gráficos, agrupamento e estilo — é um trabalho de várias etapas.

**SOLUTION:** Um agente que, a partir de um prompt, analisa as fontes que o usuário pode acessar, cria respostas (gráficos), agrupa em KPIs/seções, e popula o Liveboard; depois o usuário refina por prompts (adicionar gráfico, estilo, formatação condicional). Tudo acontece em modo Edit e só é persistido com "Save".

**OBSERVE:**
- A IA só existe em modo Edit: o botão "SpotterViz" fica na barra de edição ao lado de "Add" e "Styling", como um modo da barra de ferramentas, não um produto separado.
- Estado vazio com prompts de melhoria específicos do objeto ("destaque os KPIs mais importantes", "adicione filtros globais") em vez de perguntas genéricas.
- Fluxo visível por etapas descrito na doc: analisa fontes → decide perguntas → cria respostas → estrutura e agrupa → popula; o Liveboard recarrega com a nova resposta no grupo certo.
- Checkpoints: toda alteração pode ser revertida para um dos últimos 10 checkpoints; o painel mostra cartões de checkpoint com botão de restaurar (dispensável via action ID).
- Segurança herdada: respeita permissões de edição do Liveboard e RLS/CLS; não há permissão específica da IA (acesso = quem pode editar).
- Pode-se adicionar prompts enquanto o agente trabalha; o painel é redimensionável; botões de feedback e restauração podem ser ocultados via SDK.
- Personalização oficial do painel: marca, texto do loader, dicas, prompts iniciais, e até substituir o termo "Liveboard" por "Dashboard" nas respostas — evidência de que a IA pode vestir a identidade do produto hospedeiro.
- Limitações declaradas: sem suporte a fundos escuros, sem criação confiável de novos parâmetros, notas parciais.

**INTERACTION:**
1. Criar ou abrir um Liveboard, ir em More > Edit (painel SpotterViz aparece).
2. Escolher um prompt inicial ou escrever um prompt detalhado; enviar.
3. Acompanhar a análise e a montagem; adicionar prompts enquanto roda.
4. Refinar ("use latitude/longitude para visualizar localização melhor"; "aplique formatação condicional").
5. Se necessário, restaurar um checkpoint; ao concluir, clicar Save (ou Cancel).

**WHY IT WORKS:** O contexto é o próprio objeto aberto em edição; o agente opera dentro do contrato de permissões do produto; e "Save/Cancel" dá um ponto de commit que todo usuário de BI entende.

**ADAPT TO BIWEB:** Tratar a IA como um modo do editor (ligado só em edição), com prompts iniciais derivados do dashboard atual, checkpoints visíveis no histórico do dock (mapeados para os passos de undo "IA: ..."), e um commit tradicional (Salvar/Cancelar). Seguir o exemplo de embedding: tudo textual (nome do assistente, rótulos, termos como "Dashboard") é configurável e desligável, reforçando que a IA não impõe identidade própria.

**DO NOT COPY:** Avatar/mascote; prompt único que cria o dashboard inteiro de uma vez (sem preview por item); dependência de modelo LLM específico para precisão; ausência de granularidade por item para aceitar/rejeitar (o ThoughtSpot oferece só checkpoints globais — NÃO VERIFICADO se existe aceitar por item).

---

---

### REF-25 — Figma Make: edições em staging no chat + "Annotate for agent" (apontar e pedir)

**IMAGES:**
- `figma_make_annotate_prompt` — https://cdn.sanity.io/images/599r6htc/regionalized/5e1878c7f6f1ae2302da91748fb2450d2653a66c-3840x2160.png — recorte da barra do preview com o botão "Annotate" ativo; três marcadores azuis numerados (1, 2, 3) sobre o logo, o texto e o botão "Menu", e um cartão de prompt flutuante "Create a full-screen navigation overlay when the menu button is clicked." com + (anexo), microfone e enviar — status: VERIFICADA / inspecionada (blog 2026-07-30; imagem de marketing recortada)
- `figma_make_props_and_annotations` — https://cdn.sanity.io/images/599r6htc/regionalized/d1366af0a7f2c9945aa6a7a693f319518f22fc63-3840x2160.png — duas metades: à esquerda o painel de propriedades de um `h1` (Position: Fixed, Typography, peso, tamanho, cor); à direita anotações numeradas 1–3 sobre "Menu", filtros e imagem; barra de ferramentas com ícones de pointer e de anotação — status: VERIFICADA / inspecionada
- `figma_make_properties_panel_gap` — https://cdn.sanity.io/images/599r6htc/regionalized/d303b55838d29404fde4206eb294ee74f8399024-3840x2160.png — elemento `div` selecionado (rótulo "div" azul + contorno) e painel de propriedades com Layout, W/H e campo de "gap" com o valor 24 em edição — status: VERIFICADA / inspecionada


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-25_01_figma_make_annotate_prompt`

![REF-25_01_figma_make_annotate_prompt](https://cdn.sanity.io/images/599r6htc/regionalized/5e1878c7f6f1ae2302da91748fb2450d2653a66c-3840x2160.png)

`REF-25_02_figma_make_props_and_annotations`

![REF-25_02_figma_make_props_and_annotations](https://cdn.sanity.io/images/599r6htc/regionalized/d1366af0a7f2c9945aa6a7a693f319518f22fc63-3840x2160.png)

`REF-25_03_figma_make_properties_panel_gap`

![REF-25_03_figma_make_properties_panel_gap](https://cdn.sanity.io/images/599r6htc/regionalized/d303b55838d29404fde4206eb294ee74f8399024-3840x2160.png)

**SOURCE:**
- https://www.figma.com/blog/properties-panel-and-annotations-now-in-figma-make/ — blog oficial, 2026-07-30
- https://help.figma.com/hc/en-us/articles/31304485164695 — central de ajuda oficial (Point and edit; só aparece em busca; NÃO abri o conteúdo)

**PROBLEM:** Pedir ajustes finos ao agente via texto gasta tempo e créditos, e pequenas mudanças visuais não precisam do modelo.

**SOLUTION:** Três caminhos de edição no mesmo preview: apontar e editar por propriedades (sem IA), anotar elementos (marcadores numerados) e dar um prompt sobre eles, e prompt livre no chat. As edições diretas ficam em staging no chat, sem custo, até o usuário aplicar.

**OBSERVE:**
- Marcadores numerados azuis sobre o canvas ligam cada trecho do prompt a um alvo específico; o cartão do prompt flutua junto ao alvo (mesmo padrão do Cursor).
- O rótulo "div" e o contorno azul mostram o elemento selecionado; o painel de propriedades usa controles familiares do Figma (spacing, tipografia, layout), o que dá continuidade ao produto hospedeiro.
- Segundo o blog: as edições "se acumulam no painel de chat, em staging e sem crédito, até você aplicar"; ao aplicar, o Make atualiza o arquivo para uma nova versão. Direct manipulation "stages every edit in the prompt box so you can review each change before you commit to it, or discard anything that doesn't look right".
- O ícone de gravação de microfone aparece no cartão de prompt (voz como entrada opcional).
- Seleção de todas as instâncias de um elemento de uma vez, e árvore de DOM como camadas.
- (Pergunta em aberto) As imagens públicas mostram só o recorte de seleção/propriedades; a UI exata do staging no chat NÃO foi vista; só a descrição textual do blog.

**INTERACTION:**
1. Clicar em "Edit" (propriedades) ou em "Annotate for agent" na barra superior direita.
2. Selecionar elemento(s); mudar valores no painel (ex.: gap 24) ou marcar áreas e descrever a mudança.
3. As alterações aparecem como itens em staging na caixa de prompt do chat.
4. Revisar/descartar itens individualmente.
5. Aplicar: o agente reescreve o código e gera uma nova versão do arquivo (restaurável pelo histórico de versões).

**WHY IT WORKS:** Separa "manipular direto" (barato, determinístico) de "pedir à IA" (caro, probabilístico), e junta ambos em uma fila revisável antes da aplicação. O usuário sempre sabe o que vai acontecer ao apertar "aplicar".

**ADAPT TO BIWEB:** É o análogo mais direto do ChangeSet: itens em staging (adição/remoção/alteração), revisáveis um a um, aplicados juntos como UMA versão/1 passo de undo "IA: ...". Permitir que edições manuais no inspector entrem no mesmo ChangeSet quando o usuário quiser (sem gastar chamada de IA). Usar marcadores numerados no canvas para ligar partes do prompt a widgets específicos.

**DO NOT COPY:** Créditos por aplicação (modelo comercial); anotações com voz e animações como escopo de MVP; ícones e cores do Figma.

---

---

#### Padrões transversais

**O que se repete (nos 8 produtos):**
1. **Contexto visível e editável antes do envio.** Chips/tags acima do input (Grafana: datasources e dashboards; VS Code: arquivo ativo + "+"; Databricks: chip "Home page"; Cursor/Figma: elemento selecionado no mini-prompt). O usuário sempre pode ver "o que a IA sabe".
2. **Um gatilho único para anexar contexto.** `@` ou "Add context" (Grafana, VS Code, Datadog). Seleção direta no objeto (clique/multisseleção) como alternativa (Cursor, Figma, Grafana).
3. **Sidebar como painel entre outros.** Power BI (ao lado de Filters/Data), Grafana, Datadog (Cmd/Ctrl+I), SpotterViz (botão na barra de edição). Versão "página inteira" é uma expansão opcional (Grafana Workspace, Datadog full page).
4. **Estado de execução como linhas compactas de ferramenta, expansíveis** (Grafana "read dashboard panels", VS Code "Read layout.tsx", Databricks "Searched documentation") e botão de interromper (Grafana "Interrupt"; Cursor Stop).
5. **Granularidade de revisão em camadas**: resumo agregado (+x −y, "N files changed") → por arquivo/objeto → por bloco (VS Code, Cursor).
6. **Rede de segurança em três formas**: undo do pedido (Power BI "Undo", Grafana "Undo turn"), checkpoints (VS Code, Cursor, ThoughtSpot, limite de 10) e commit explícito (Grafana "Save to Grafana", ThoughtSpot "Save", Figma "aplicar").
7. **Permissões herdadas do produto** (Datadog por papel; ThoughtSpot por permissão de edição e RLS/CLS; Databricks Unity Catalog).
8. **Estado vazio com poucas ações específicas ao objeto** (Power BI 3 ações; SpotterViz prompts de melhoria; Datadog sugestões da página).
9. **Aviso curto de revisão** ("Always review AI-generated content", "responses should be reviewed").
10. **Recusa explícita de desfazer quando o usuário editou depois** (Grafana).

**Contrastes entre produtos:**
- **Aplicar primeiro, desfazer depois** (Power BI, Grafana, VS Code Agent Host, Cursor 3.x auto-keep) vs **propor com diff e aceitar/rejeitar** (VS Code antigo Keep/Undo, Databricks Quick Fix, Figma staging). O mercado está migrando para o primeiro por velocidade, com protesto de usuários (fórum do Cursor). O BIWEB deve ficar no segundo.
- **Auto-aprovação**: Databricks documenta níveis com classificador e avisa que não é fronteira de segurança; Datadog mostra um toggle sem semântica documentada. O melhor é a explicitação do Databricks.
- **Identidade visual**: Datadog (fundo estrelado) e Grafana (input com brilho gradiente, ícone de estrelas) usam estética própria de IA; ThoughtSpot oferece API para rebatizar e retematizar o painel; Figma e VS Code reutilizam os componentes do host.

**Melhores soluções observadas (para inspirar BIWEB):**
- Figma Make: edições em staging, revisáveis um a um, aplicadas juntas como nova versão.
- Grafana "Undo turn": desfazer um turno inteiro como uma unidade, com recusa se houve edição manual posterior.
- Databricks: aprovação por ferramenta com escopos e "Accept ≠ Run".
- VS Code: Keep/Undo em 3 níveis + "1 of N" para navegar entre mudanças + checkpoint.
- Cursor Design Mode: mini-prompt ancorado ao elemento e rótulo no hover.
- ThoughtSpot: IA como modo do editor (só em Edit), com Save/Cancel.

**Anti-patterns observados:**
- IA que aplica sem preview e só oferece undo depois (Power BI; Cursor 3.x padrão, segundo fórum): vai contra "nada muda em silêncio".
- Painel de IA com fundo e marca próprios (Datadog); IA com ícone multicolorido de marca (Power BI) e "brilho" no input (Grafana).
- Toggle "Auto-approve" sem explicação do que cobre (Datadog UI).
- Revisão apenas em nível de sessão, sem aceitar/rejeitar por mudança (reclamação sobre Cursor 3.x, evidência não oficial).
- IA disponível só como chat, sem ações no objeto: Grafana mitiga com ações no menu do painel.
- Reabrir o relatório e perder o pane de IA/histórico (Power BI): histórico efêmero sem aviso.

**Lacunas desta pesquisa:**
- Nenhuma imagem do Power BI em modo "Copilot em Desktop" atual 2026 (screenshots da doc parecem de 2024–2025; badge "Preview").
- Cursor: não achei imagem estática do diff inline/Keep-Undo oficial atual; usei frames de vídeo do changelog (mux). A doc `cursor.com/docs/agent/review` agora redireciona para uma página "Learn".
- Tableau Agent, Looker/Gemini, Fabric Copilot, Retool AI: pesquisados superficialmente (docs sem imagens utilizáveis ou só resultados de busca); não viraram ficha. Tableau Agent já está no REFERENCE_PACK_BI.md em outro tema.
- Datadog: semântica do "Auto-approve" não documentada; não vi fluxo de aprovação.
- Figma Make: não vi a UI do "staging" no chat; só o texto do blog.
- ThoughtSpot: não encontrei screenshots do cartão de checkpoint; só descrição na doc.


---

## 04 — View Switching

**Pergunta da área:** como trocar entre representações do mesmo resultado (tabela ↔ gráfico, 2D ↔ 3D, camadas) de forma refinada e previsível?
**Aprendizados-chave:** segmented control de ícones para 2–3 representações; grade de ícones para muitos tipos; a troca é de apresentação (não perde filtro/período/seleção); avisar *antes* do clique quando houver perda; declarar limites do modo. **Lacuna importante:** não há evidência oficial verificada sobre transições animadas ou skeletons de troca.

### REF-26 — Grafana / "Table view" toggle + "Panel styles" no editor de painel
**IMAGES:**
- grafana-tableview-toggle — https://grafana.com/media/docs/grafana/panels-visualizations/screenshot-panel-editor-2-v12.4.png — "Panel editor" (Grafana v12.4, doc "latest" em out/2026) — VERIFICADA/inspecionada (200, image/png). Vejo: toggle "Table view" (off) no canto superior esquerdo do preview; à direita do mesmo cabeçalho, seletor de período "Last 6 hours UTC", botões "‹‹ ››" e zoom-out, botão Refresh com chevron; o painel "Time series" na lateral com link "Change" e seções recolhíveis (Panel options, Tooltip, Legend, Axis...).
- grafana-panel-styles — https://grafana.com/media/docs/grafana/panels-visualizations/screenshot-visualization-presets-v13.0.png — "Panel styles example for time series visualization" (v13.0) — VERIFICADA/inspecionada (200, image/png). Vejo: "Table view" off; na lateral a seção "Panel styles [New!]" com 4 cartões de preview ao vivo (miniaturas do próprio dado), um selecionado com borda azul e tooltip "Line scheme"; um cartão tem badge de ajuste (thresholds); abaixo Tooltip/Legend com segmented "List | Table" e "Bottom | Right".
- grafana-copy-styles-video — https://grafana.com/media/docs/grafana/panels-visualizations/screenrecord-copy-paste-styles.mp4 — screen recording de copiar/colar estilos — VERIFICADA/só alt (200, video/mp4, 0,9 MB; conteúdo não inspecionado).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-26_01_grafana_tableview_toggle`

![REF-26_01_grafana_tableview_toggle](https://grafana.com/media/docs/grafana/panels-visualizations/screenshot-panel-editor-2-v12.4.png)

`REF-26_02_grafana_panel_styles`

![REF-26_02_grafana_panel_styles](https://grafana.com/media/docs/grafana/panels-visualizations/screenshot-visualization-presets-v13.0.png)

**SOURCE:** https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/panel-editor-overview/ — doc oficial (seção "Visualization preview" e "Panel styles"); versões nas imagens: 12.4 e 13.0 (nomes de arquivo). Data exata NÃO VERIFICADA.

**PROBLEM:** Quem monta um painel precisa alternar entre "o que o gráfico mostra" e "os números crus que o alimentam" (debug de query, conferência de valores) sem sair do editor nem perder a configuração visual; e ao trocar tipo/estilo não quer reconfigurar tudo.

**SOLUTION:** Um toggle "Table view" fixo no cabeçalho do preview converte qualquer visualização em tabela dos dados crus, e volta com o mesmo toggle. Separadamente, "Panel styles" oferece presets visuais como cartões com miniatura ao vivo (usando o dado real), aplicados com um clique e mesclados às opções existentes (só os campos definidos pelo preset mudam; overrides ficam intactos).

**OBSERVE:**
- O toggle "Table view" é um switch (não uma aba) alinhado à esquerda do rodapé de controles do preview: baixo peso visual, estado binário claro, e fica na mesma linha do período e do Refresh, ou seja, no mesmo "grupo de contexto de dados".
- A doc avisa o limite: a tabela mostra só os dados crus; não inclui transformações nem formatação da visualização Table. Isso explica por que é "view de depuração", não uma segunda visualização.
- Os cartões de Panel styles usam o dado real do painel como miniatura (ver as séries coloridas dentro de cada cartão), então a troca é "escolher pelo resultado", não por nome.
- A doc diz que um preset "mescla" suas configurações e "não afeta field overrides": a troca é aditiva e reversível. Presets que mexem em thresholds ganham um badge no cartão (sinaliza efeito colateral antes do clique).
- O seletor de tipo fica no topo da lateral ("Time series — Change"), separado dos presets: tipo (o quê) e estilo (como) são dois níveis de decisão.
- O cabeçalho de preview é todo escuro/neutro; o único elemento colorido é o estado selecionado (borda azul do cartão).

**INTERACTION:**
1. No editor de painel, o usuário vê o preview do gráfico.
2. Liga "Table view" no canto superior esquerdo: o preview vira tabela do dado cru (a configuração do gráfico não é descartada).
3. Desliga o switch: volta ao gráfico.
4. Na lateral, abre "Panel styles", passa pelos cartões (tooltip com o nome, ex.: "Line scheme") e clica em um: o preview aplica o preset.
5. Ainda pode afinar opções e overrides depois; o preset não os sobrescreve.

**WHY IT WORKS:** Separa "inspecionar dado" de "configurar aparência" com um controle de custo mínimo (1 clique, reversível, sem modal). A troca por miniaturas com o dado real dá feedback antes do commit. Ser binário e sempre no mesmo lugar cria memória muscular.

**ADAPT TO BIWEB:** O "Ver como tabela" de acessibilidade pode ser o mesmo mecanismo: um switch fixo no cabeçalho do widget (no builder e no modo leitura), com a mesma posição em todos os plugins (ECharts, mapa, KPI). Declare explicitamente na UI o que a tabela representa (dado cru vs. dado após modelo semântico/transformações). Presets de estilo como cartões com miniatura do dado real são uma boa forma de expor opções avançadas de ECharts de modo progressivo.

**DO NOT COPY:** O visual denso de editor "para engenheiro" (inspector com dezenas de seções recolhíveis) e o fato de a Table view ignorar transformações (para um BI semântico, o usuário de negócio espera a tabela que corresponde ao que viu no gráfico).

---

---

### REF-27 — Kibana Lens / seletor de tipo de gráfico + "Suggestions"
**IMAGES:**
- lens-chart-type-menu — https://www.elastic.co/guide/en/kibana/7.9/images/lens_viz_types.png — "lens viz types" (Kibana 7.9, ~2020, ANTIGA) — VERIFICADA/inspecionada (200, image/png). Vejo: botão "Stacked bar chart ⌄" que abre o menu "SELECT A VISUALIZATION" em grade 3 colunas (Bar, Horizontal bar, Stacked bar, Stacked horizontal bar, Line, Area, Stacked area, Data table, Metric, Donut, Pie, Treemap); Metric, Donut, Pie e Treemap trazem um pequeno ícone de alerta (triângulo) no canto.
- lens-suggestions-strip — https://images.contentstack.io/v3/assets/bltefdd0b53724fa2ce/blt5f8f95c9bf6ac638/5dced0b36aec2738d0784231/Lens-release-blog-animated-gifs-lens-smart-suggestions.gif — GIF animado, blog "Introducing Kibana Lens" (nov/2019, ANTIGA) — VERIFICADA/inspecionada em 1 frame (200, image/gif). Vejo: gráfico de área empilhada grande; abaixo, faixa "Suggestions" com 6 miniaturas (a primeira rotulada "Current", uma com número grande "3,944,331", uma tabela); à direita o painel de configuração com X-axis (timestamp), Y-axis (Sum of bytes), Break down by. A animação em si (troca ao clicar) NÃO foi vista, só o frame.
- lens-suggestions-gif-79 — https://www.elastic.co/guide/en/kibana/7.9/images/lens_suggestions.gif — "Visualization suggestions" — VERIFICADA/só alt (200, image/gif, 1,2 MB).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-27_01_lens_chart_type_menu`

![REF-27_01_lens_chart_type_menu](https://www.elastic.co/guide/en/kibana/7.9/images/lens_viz_types.png)

`REF-27_02_lens_suggestions_strip`

![REF-27_02_lens_suggestions_strip](https://images.contentstack.io/v3/assets/bltefdd0b53724fa2ce/blt5f8f95c9bf6ac638/5dced0b36aec2738d0784231/Lens-release-blog-animated-gifs-lens-smart-suggestions.gif)

`REF-27_03_lens_suggestions_gif_79`

![REF-27_03_lens_suggestions_gif_79](https://www.elastic.co/guide/en/kibana/7.9/images/lens_suggestions.gif)

**SOURCE:** https://www.elastic.co/docs/explore-analyze/visualize/lens (doc atual: "click Suggestions at the bottom of the workspace"); https://www.elastic.co/guide/en/kibana/7.9/lens.html (menu de tipos e regra do "!"); https://www.elastic.co/blog/introducing-kibana-lens (2019). Imagens são de 2019–2020; a UI atual é diferente, mas o mecanismo está na doc atual.

**PROBLEM:** O usuário arrasta campos e não sabe qual gráfico representa melhor aquilo; trocar de gráfico em ferramentas tradicionais obriga a refazer a configuração, e alguns tipos não suportam a configuração atual.

**SOLUTION:** Lens gera automaticamente alternativas ("Suggestions") a partir dos campos já colocados e mostra miniaturas clicáveis numa faixa abaixo da área de trabalho; o seletor de tipo continua disponível para escolher qualquer tipo. Quando o tipo escolhido não consegue carregar a configuração atual, o menu avisa com um indicador (!) em vez de bloquear.

**OBSERVE:**
- A faixa de miniaturas fica ABAIXO do gráfico, ocupando a largura, com a opção atual rotulada "Current": o usuário sempre sabe de onde está partindo.
- As miniaturas são renderizações reais dos dados, não ícones genéricos (no frame, cada uma é um mini-gráfico/valor diferente).
- No menu de tipos, o aviso é um pequeno triângulo sobre o ícone dos tipos que não preservam o dado; o item continua clicável ("Lens is unable to transfer your data, but still allows you to make the change", doc 7.9).
- A doc atual informa que a paleta Elastic "line optimized" é aplicada ao criar/trocar para gráfico de linha e volta ao padrão ao trocar de tipo, a menos que o usuário tenha escolhido outra: ajustes automáticos pequenos e reversíveis acompanham a troca.
- A doc atual informa que o número de sugestões não é configurável (decisão deliberada de manter simples).
- Alinhamento visual: o painel de configuração (campos) fica à direita e o gráfico preenche o resto: troca de tipo mexe só no preview.

**INTERACTION:**
1. Usuário arrasta campos para a área; Lens escolhe uma agregação e um gráfico padrão.
2. Abaixo, a faixa Suggestions mostra variações (outro tipo, valor único, tabela).
3. Clica numa miniatura: o gráfico muda para aquela alternativa, e a config à direita acompanha.
4. Se quiser um tipo não sugerido, abre o seletor "tipo ⌄" e escolhe; tipos com (!) avisam que parte do dado não será transferida.
5. Pode voltar ao "Current" para restaurar.

**WHY IT WORKS:** Transforma a escolha de gráfico de "decisão de especialista" em "reconhecimento visual" (clicar no que parece certo). Mostrar o resultado antes do commit e avisar de perdas sem bloquear mantém a sensação de controle.

**ADAPT TO BIWEB:** No builder, ao arrastar medidas/dimensões do modelo semântico, uma faixa de "alternativas" com miniaturas renderizadas pelo próprio ECharts pode substituir uma galeria de tipos genérica; o plugin de visualização deve declarar compatibilidade com o shape de dados e o seletor marcar discretamente os plugins que perderiam mapeamentos. A Copilot opcional poderia reordenar as sugestões, sem ser requisito.

**DO NOT COPY:** O visual de 2019–2020 (cores/ícones desatualizados) e a dependência de uma única faixa horizontal que ocupa altura fixa em telas baixas.

---

---

### REF-28 — Metabase / alternância Visualização ↔ Tabela e seletor de tipo em sidebar
**IMAGES:**
- metabase-viz-sidebar — https://www.metabase.com/docs/latest/questions/images/VisualizeChoices.png — "Visualization options" (doc latest; eixo do gráfico vai até jan/2026, logo captura de 2026) — VERIFICADA/inspecionada (200, image/png). Vejo: sidebar esquerda com grade de 4 colunas de ícones circulares rotulados (Table, Bar, Line, Pie, Row, Area [selecionado, azul], Combo, Pivot Table, Trend, Detail, Map, Scatter, Waterfall) e seção "OTHER CHARTS" (Number, Gauge, Progress, Funnel, Sankey); botão "Done". Na base do gráfico: botão "Visualization" + engrenagem à esquerda; no centro um segmented control de 2 ícones (tabela | gráfico, o gráfico ativo); à direita "Showing 193 rows", "135ms" com ícone de raio, e ícone de download. Acima do rodapé, controles "View [All time] by [Month]".
- metabase-editor-toggle — https://www.metabase.com/docs/latest/questions/images/switch-to-editor.png — "Switch to editor" — VERIFICADA/inspecionada (200, image/png). Vejo: barra superior com botões "Filter", "Summarize", "Editor" (realçado), ícones de refresh e outros.


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-28_01_metabase_viz_sidebar`

![REF-28_01_metabase_viz_sidebar](https://www.metabase.com/docs/latest/questions/images/VisualizeChoices.png)

`REF-28_02_metabase_editor_toggle`

![REF-28_02_metabase_editor_toggle](https://www.metabase.com/docs/latest/questions/images/switch-to-editor.png)

**SOURCE:** https://www.metabase.com/docs/latest/questions/visualizations/visualizing-results — doc oficial. Texto confirma: "toggle between the visualization and the table of results" e "Visualization / Editor button in the top right"; gráficos que não fazem sentido para o dado aparecem na seção "More charts". Doc "latest"; versão exata NÃO VERIFICADA.

**PROBLEM:** Dar resultado de consulta em forma visual sem esconder os dados, e permitir mudar de ideia sobre o tipo de gráfico, sem que o usuário saia do contexto da pergunta.

**SOLUTION:** Quatro "camadas" simples e separadas: (1) um segmented control de 2 ícones (tabela/gráfico) no rodapé do resultado para ver o mesmo resultado em duas formas; (2) botão "Visualization" que abre uma sidebar com grade de tipos, com o selecionado destacado; (3) botão "Editor" no topo para voltar à construção da pergunta; (4) metadados do resultado (linhas, tempo) ao lado.

**OBSERVE:**
- O segmented de 2 ícones fica no rodapé central do resultado, não no topo: é lido como "modo de exibição do resultado", junto de "Showing 193 rows" e do tempo da consulta (135ms), reforçando a ligação entre gráfico e dado.
- A sidebar de tipos usa ícones circulares com rótulo embaixo; o selecionado fica preenchido de azul; tipos que não fazem sentido para o dado vão para "More charts", sem desaparecer.
- Existem dois níveis: o segmented (tabela ↔ gráfico, imediato) e o botão "Visualization" (escolha do tipo, abre sidebar com "Done").
- O gráfico mostra controles contextuais ("View All time by Month") fora do canvas: agrupamento temporal editável sem entrar em configuração.
- O botão "Editor" no topo tem o mesmo peso visual de "Filter" e "Summarize": navegar entre construir e ver é uma ação de primeira classe.

**INTERACTION:**
1. Usuário monta a pergunta e clica "Visualize" (o Metabase escolhe um tipo adequado).
2. No rodapé, alterna o segmented (tabela | gráfico) para conferir os números.
3. Clica "Visualization" no rodapé para abrir a sidebar de tipos; escolhe, vê o preview, clica "Done".
4. Se um tipo for impróprio ao dado, ele aparece em "More charts" mas ainda pode ser escolhido (a doc avisa que pode precisar ajustar opções).
5. Clica "Editor" para voltar à construção.

**WHY IT WORKS:** Ícones universais (tabela/gráfico) no segmented dispensam rótulos; a escolha do tipo é mais rara e por isso fica atrás de um botão. A mesma linha de rodapé informa o volume do dado e o custo da consulta, dando contexto de confiança.

**ADAPT TO BIWEB:** Para "Ver como tabela", usar um segmented de 2 ícones (gráfico | tabela) no rodapé/cabeçalho do widget, com contagem de linhas e horário da última atualização na mesma faixa. A sidebar de tipos do builder pode seguir o padrão "ícone + rótulo, selecionado preenchido, tipos desaconselhados em grupo separado mas acessível".

**DO NOT COPY:** O modelo de "Done" da sidebar de tipos (em um editor com inspector persistente, aplicar ao vivo é melhor) e a dependência de ícones sem rótulo no segmented (adicionar tooltip/aria-label e rótulo acessível "Ver como tabela").

---

---

### REF-29 — kepler.gl / controle de modo do mapa (Top · 3D · Globe) e Split Map
**IMAGES:**
- kepler-map-controls — https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/m-map-settings-0.png — pilha vertical de botões no canto do mapa (doc "Map Settings") — VERIFICADA/inspecionada (200, image/png). Vejo: dois botões quadrados escuros no canto superior direito (Split Map: ícone de livro aberto/duas colunas; e 3D: cubo isométrico), sobre um mapa coroplético de desemprego por condado, com cartão "Layer Legend" abaixo.
- kepler-3d-icon — https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/m-map-settings-3d.png — ícone do botão 3D — VERIFICADA/inspecionada (200, image/png; 7 KB).
- kepler-split-map — https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/image36.png — "Split Maps" — VERIFICADA/inspecionada (200, image/png, 2 MB). Vejo: dois mapas lado a lado (mesma área, San Francisco, camadas diferentes: grid de células vs. círculos sobrepostos), cada um com pilha de botões circulares (fechar X, camadas, 3D, tabela).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-29_01_kepler_map_controls`

![REF-29_01_kepler_map_controls](https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/m-map-settings-0.png)

`REF-29_02_kepler_3d_icon`

![REF-29_02_kepler_3d_icon](https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/m-map-settings-3d.png)

`REF-29_03_kepler_split_map`

![REF-29_03_kepler_split_map](https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/image36.png)

**SOURCE:** https://docs.kepler.gl/docs/user-guides/m-map-settings (doc oficial, GitBook, "Last updated 4 months ago" em out/2026) e https://docs.kepler.gl/docs/user-guides/f-map-styles (camada "3d Building" visível só na vista 3D). Textos: "drag: pan; cmd/ctrl + drag: rotate"; globe a partir do "map view mode control" (leaving only Top/3D se desabilitado). As capturas são anteriores à doc atual (kepler.gl v3.x); data NÃO VERIFICADA.

**PROBLEM:** Mapa 2D é bom para leitura; 3D (inclinação, extrusão, prédios) ajuda em densidade e altura, mas é desorientador e caro. Como oferecer a troca sem forçar o usuário a entender câmera e projeção?

**SOLUTION:** Um controle de "modo de visualização do mapa" ao lado do mapa: Top (2D), 3D e Globe, escolhido por ícone; o 3D vem com uma regra de interação simples (arrastar = mover; ⌘/Ctrl + arrastar = rotacionar). Elementos que só existem em 3D (prédios 3D) são declarados na doc como "visíveis apenas na vista 3D". Split Map é outro botão da mesma pilha, para comparar duas camadas lado a lado com zoom sincronizado.

**OBSERVE:**
- Os controles do mapa são uma pilha vertical de botões quadrados no canto superior direito: cada "modo" é um botão pequeno, com ícone (cubo = 3D; duas colunas = Split), não um menu de texto.
- A doc descreve o globo como uma opção do mesmo controle de modo e documenta restrições (zoom limitado, camadas não suportadas ficam ocultas/desabilitadas): o produto declara os limites do modo em vez de esconder.
- No Split Map, cada painel tem seu próprio botão de "camadas" e o zoom/pan de um espelha no outro (descrito na doc): a comparação não exige configuração.
- Cada painel tem os mesmos ícones circulares (X, camadas, 3D, tabela): a mesma gramática de controles se repete por mapa.
- O gesto de rotação usa modificador (⌘/Ctrl + arrastar), mantendo o arrastar simples como pan.

**INTERACTION:**
1. Vê o mapa em Top (2D) com a pilha de controles no canto.
2. Clica no ícone 3D: o mapa assume perspectiva (o controle é de modo; a transição visual NÃO foi observada).
3. Arrasta para mover; ⌘/Ctrl + arrastar para rotacionar/inclinar.
4. Opcional: Globe pelo mesmo controle de modo (doc: habilitado por padrão).
5. Clica no ícone de Split Map para dois mapas sincronizados; liga/desliga camadas por mapa.

**WHY IT WORKS:** Modos de câmera são tratados como um único eixo de escolha (Top/3D/Globe), com gesto padrão preservado. Declarar limitações por modo evita surpresa.

**ADAPT TO BIWEB:** O widget de mapa (MapLibre/deck.gl) pode expor um segmented pequeno "2D | 3D" (e "Camadas" como botão separado) na pilha de controles do mapa, e a comparação "antes/depois" ou "camada A/B" como Split opcional. Ao voltar do 3D, resetar pitch/bearing e animar com easeTo curto. Elementos extrudados e prédios 3D só aparecem em 3D, sempre com legenda.

**DO NOT COPY:** Os ícones sem rótulo/tooltip textual (cubo e livro aberto exigem aprendizado), o visual escuro único e o globo (desnecessário para dados operacionais locais).

---

---


---

## 05 — Realtime Visualization

**Pergunta da área:** como mostrar que os dados estão sendo atualizados em tempo real sem distrair?
**Aprendizados-chave:** "ao vivo" é um estado do controle de tempo, não um widget; um glifo e uma cor; novidade com destaque que esmaece; pausa por interação; honestidade sobre amostragem. **Lacuna:** saúde da conexão/resync e eventos de mapa em tempo real não têm fonte visual lida.

### REF-30 — Grafana Explore / Live tailing (Pause · Resume · Exit live mode)
**IMAGES:**
- grafana-live-tail-paused — https://grafana.com/static/img/docs/v95/explore_live_tailing.mp4 — vídeo da doc (v9.5, ~2023, ANTIGA; 11,5 MB) — VERIFICADA/inspecionada em 1 frame (200, video/mp4). Vejo: Explore com query Loki, painel "Logs" com linhas coloridas por nível (error/warn/info/debug) e, no rodapé do painel, dois botões: "▷ Resume" e "■ Exit live mode". O frame corresponde ao estado pausado; o scroll ao vivo e o fundo contrastante nas novas linhas NÃO foram vistos.
- grafana-refresh-controls — https://grafana.com/media/docs/grafana/dashboards/screenshot-common-time-controls-11.2.png — "Common time controls" (v11.2) — VERIFICADA/inspecionada (200, image/png, 4 KB). Vejo: pílula escura com "🕒 Last 5 minutes ⌄", botão zoom-out e botão "⟳ Refresh ⌄" (seletor de auto-refresh no chevron).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-30_01_grafana_refresh_controls`

![REF-30_01_grafana_refresh_controls](https://grafana.com/media/docs/grafana/dashboards/screenshot-common-time-controls-11.2.png)

**SOURCE:** https://grafana.com/docs/grafana/latest/explore/logs-integration/ (seção "Live tailing", doc oficial); https://grafana.com/docs/grafana/latest/visualizations/dashboards/use-dashboards/ (controles de tempo e "Auto refresh control"). Vídeo ~v9.5; texto da doc é a versão latest (out/2026).

**PROBLEM:** Como acompanhar logs/eventos chegando sem a tela "pular" enquanto o usuário tenta ler uma linha?

**SOLUTION:** Live tail é um MODO explícito (botão "Live" na barra do Explore) com ações de ciclo de vida: Pause (para o fluxo sem perder a sessão), Resume, Clear logs e Stop/Exit live mode. Novas linhas entram no final com fundo contrastante para destacar o que é novo; ao pausar ou rolar, o usuário lê sem interrupção.

**OBSERVE:**
- Os dois botões no rodapé do painel ("Resume" e "Exit live mode") têm rótulo textual e ícone (▷ e ■): estado do fluxo e saída do modo são ações distintas.
- A doc diz que novos logs aparecem no fim com "contrasting background" (destaque de novidade sem animação chamativa); rolar já pausa (texto: "or simply scroll through the logs view").
- Pause não encerra o modo; "Clear logs" limpa a tela sem sair: o usuário controla o ruído.
- O refresh de dashboards é separado: a pílula de tempo + botão Refresh com chevron para o intervalo; o live tail é outro mecanismo (stream) acessado em Explore.
- Em dashboards, "Last 5 minutes" + Refresh agrupados numa única unidade visual: período e atualização são lidos como um só conceito.

**INTERACTION:**
1. Em Explore (Loki ou similar), clica "Live" na barra de ferramentas.
2. Novos logs aparecem no fim com fundo contrastante.
3. Rola para cima (ou clica Pause) para ler sem ser interrompido.
4. "Resume" retoma; "Clear logs" limpa; "Stop"/"Exit live mode" volta ao Explore padrão.

**WHY IT WORKS:** Separa "ver chegando" de "ler com calma" com um gesto natural (rolar = pausar), e deixa explícito se está no fluxo ou parado. O destaque de linhas novas dispensa animação.

**ADAPT TO BIWEB:** Na barra de contexto sticky do modo leitura, tratar tempo real como um modo com estados nomeados (Ao vivo / Pausado / Histórico) e ações Pausar/Retomar. Nunca animar a tela inteira; destacar apenas o que mudou (fundo sutil que esmaece). Reaproveitar o par "período + atualizar" como unidade visual (já em REF-14 do pack; aqui o novo é o ciclo Live/Pause/Resume).

**DO NOT COPY:** O vídeo de 11 MB/interface densa de Explore e a ausência de indicador de saúde da conexão (a doc não menciona; NÃO VERIFICADO se existe).

---

---

### REF-31 — Datadog / Live Tail (badge "Live Tail", Pause, "events/s, % displayed")
**IMAGES:**
- datadog-live-tail — https://docs.dd-static.net/images/logs/explorer/live_tail/livetail.mp4 — vídeo de doc, Log Explorer (data NÃO VERIFICADA; página com © 2026; log de exemplo "Feb 04") — VERIFICADA/inspecionada em 1 frame (200, video/mp4, 230 KB). Vejo: título "Live Tail"; seletor de período com ícone de raio verde e rótulo "Live Tail" ⌄; botão azul "‖ Pause"; botão de refresh quadrado; barra de busca com chips (Service:web-store, version:2.9.2, ERROR em vermelho); linha "27 events/s, 60% displayed (refine your query to avoid sampling)"; botão "Options"; tabela de logs (DATE, HOST, SERVICE, CONTENT) com marcador vermelho de severidade à esquerda e as mais novas no topo.

**SOURCE:** https://docs.datadoghq.com/logs/explorer/live_tail/ (doc oficial). Texto: "choose the Live Tail option in the timerange"; saída amostrada quando muitos logs chegam, de forma uniformemente aleatória, "statistically representative". Também https://docs.datadoghq.com/dashboards/widgets/configuration/ (full screen do widget: "Pause the graph at the current time or view the live graph").

**PROBLEM:** Mostrar fluxo contínuo de eventos sem sobrecarregar a tela nem enganar sobre completude quando o volume é maior do que o que dá para renderizar.

**SOLUTION:** O "ao vivo" é uma OPÇÃO DO SELETOR DE PERÍODO (não um tipo de gráfico): ao selecioná-la, o seletor ganha um ícone de raio verde e o botão Pause aparece. Um contador honesto ("27 events/s, 60% displayed") informa a taxa e a fração exibida, e sugere refinar a query para evitar amostragem.

**OBSERVE:**
- Live é um valor do mesmo controle de tempo: quem pesquisa já sabe onde fica; trocar entre "Live Tail" e um intervalo histórico é trocar uma opção.
- O ícone de raio em um quadrado verde dentro do seletor é o único elemento colorido do cabeçalho; o resto é neutro. Indicador "vivo" pequeno e persistente.
- Botão Pause é o único botão azul sólido (ação primária do estado): ação de controle do fluxo à vista.
- "27 events/s, 60% displayed" comunica volume + transparência sobre amostragem. A doc justifica: amostragem uniforme "for the sake of readability".
- A ordem é decrescente (mais novo no topo), com marcador de severidade colorido apenas na borda esquerda.
- Na doc de widgets, o modo pausa/volta ao vivo também existe no full screen de gráficos (pause no instante atual vs. live graph).

**INTERACTION:**
1. No Log Explorer, abre o seletor de período e escolhe "Live Tail".
2. Logs entram em fluxo; a linha de status mostra eventos/s e % exibido.
3. Se o volume for alto, adiciona filtros (chips) para reduzir amostragem.
4. Clica Pause para congelar e ler; (retomar volta ao fluxo).
5. Escolhe um intervalo no mesmo seletor para sair de "ao vivo" para histórico.

**WHY IT WORKS:** Reduz estados a um só controle (período) e deixa o estado "ao vivo" legível por um sinal pequeno. A honestidade sobre amostragem evita falsa sensação de completude, e o usuário recebe uma saída (filtrar).

**ADAPT TO BIWEB:** Colocar "Ao vivo" como opção do seletor de período na barra de contexto do modo leitura, com um glifo de raio/ponto discreto; mostrar sempre "atualizado às HH:MM:SS" e, quando o stream for agregado/limitado, uma linha "mostrando X% (refine os filtros)". Pause deve ser o botão primário enquanto estiver ao vivo.

**DO NOT COPY:** A estética de log explorer para dashboards de negócio e o vídeo sem controle de "retomar" visível no frame (o rótulo do botão após pausar NÃO foi verificado).

---

---

### REF-32 — Netdata Cloud / Play · Pause · Force Play (pílula de estado "Playing/Paused")
**IMAGES:**
- netdata-playing-pill — https://user-images.githubusercontent.com/70198089/225850250-1fe12477-23f8-4b4d-b497-79b416963e10.png — "The time control with Play, Pause and Force Play" (17/03/2023, ANTIGA) — VERIFICADA/inspecionada (200, image/png). Vejo: pílula verde "▶ Playing ⌄" com "3/17/23 • 10:01 • last 15min"; menu aberto com Play, Pause, Force Play.
- netdata-paused-picker — https://user-images.githubusercontent.com/70198089/225850611-728936d9-7ca4-49fa-8d37-1ce73dd6f76c.png — "Timeframe Selector" (17/03/2023, ANTIGA) — VERIFICADA/inspecionada (200, image/png). Vejo: pílula cinza "‖ Paused" com data/hora e "15min"; popover com presets (Last 5 minutes…Last day), "Last [15] [minutes]", dois calendários, campos From/To, fuso horário, botões Clear e Apply.


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-32_01_netdata_playing_pill`

![REF-32_01_netdata_playing_pill](https://user-images.githubusercontent.com/70198089/225850250-1fe12477-23f8-4b4d-b497-79b416963e10.png)

`REF-32_02_netdata_paused_picker`

![REF-32_02_netdata_paused_picker](https://user-images.githubusercontent.com/70198089/225850611-728936d9-7ca4-49fa-8d37-1ce73dd6f76c.png)

**SOURCE:** https://learn.netdata.cloud/docs/dashboards-and-charts/visualization-date-and-time-controls — doc oficial. Textos: "Play – the content of the page will be automatically refreshed while this is in the foreground"; "Pause – ... for example, when you're investigating data on a chart (cursor is on top of a chart)"; "Force Play – refreshed even if this is in the background". Objetivo declarado: distinguir se o conteúdo é "live or historical".

**PROBLEM:** Dashboards em tempo real mudam enquanto o usuário investiga um ponto específico; e dashboards em TV precisam atualizar mesmo sem foco. Como diferenciar vivo vs. histórico sem confundir?

**SOLUTION:** Uma única pílula de estado com três modos: Playing (verde; atualiza com a aba em primeiro plano), Paused (cinza; manual OU automática quando o cursor está sobre um gráfico) e Force Play (atualiza também em segundo plano, para TV/monitoramento). O mesmo componente contém o carimbo de data/hora e a janela ("last 15min") e abre o seletor de período.

**OBSERVE:**
- Cor e rótulo mudam juntos: verde "Playing" vs. cinza "Paused": estado legível sem depender só de cor.
- Pausa automática ao pairar sobre um gráfico: evita que o dado "fuja" enquanto o usuário lê o tooltip (comportamento descrito na doc; NÃO testei).
- Force Play existe como modo explícito para casos de "wallboard"/TV, em vez de comportamento implícito.
- A pílula mostra o "agora" do dado ("3/17/23 • 10:01") e a janela, funcionando como carimbo de "última atualização".
- O popover de tempo usa presets à esquerda e calendário à direita, com "Apply/Clear" claros; a janela exibida fica no estado Paused após escolher intervalo histórico.

**INTERACTION:**
1. Dashboard abre em "Playing" (verde) com janela "last 15min".
2. Usuário pousa o cursor num gráfico: atualização pausa; ao sair, volta (conforme doc).
3. Pode escolher Pause manual ou Force Play no menu da pílula.
4. Abre o seletor, escolhe um preset ou intervalo no calendário e clica Apply: a pílula passa a "Paused" (histórico).

**WHY IT WORKS:** O estado vivo/histórico vira um objeto único, sempre visível, com dois estados visualmente distintos. A pausa por hover respeita a intenção de leitura sem exigir clique.

**ADAPT TO BIWEB:** Excelente para a barra de contexto sticky: uma pílula "Ao vivo / Pausado" com carimbo "atualizado há Xs", pausa automática durante hover em gráficos/tooltips (e durante edição de filtros), e "manter atualizando em segundo plano" como opção para modo TV. Escolher um intervalo histórico muda a pílula para "Histórico", o primeiro degrau do "time machine".

**DO NOT COPY:** Os rótulos em inglês/capitalização inconsistente do menu e o fato de o "Paused" cinza também ser usado para histórico (mistura dois significados: pausado no tempo real vs. visão histórica).

---

---


---

## 06 — Temporal / Historical Replay

**Pergunta da área:** como visualizar o estado do sistema em um instante passado (a "máquina do tempo" operacional)?
**Aprendizados-chave:** scrubbing com histograma/marcadores; live ↔ histórico como modo do mesmo canvas; tempo como chave global entre painéis; janela deslizante para dados esparsos; velocidade separada de zoom da timeline.

### REF-33 — kepler.gl / Time Playback (histograma, janela deslizante, velocidade, Y axis)
**IMAGES:**
- kepler-playback-bar — https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/h-playback-1.png — barra de playback sobre mapa de terremotos (doc "Time Playback") — VERIFICADA/inspecionada (200, image/png). Vejo: cápsula escura no topo do mapa com intervalo "01/05/91 03:38:42am — 03/30/11 21:10:05pm"; abaixo, painel inferior com abas "DateTime" e "Y Axis", barras de histograma de distribuição por tempo (as dentro da janela em azul-turquesa, as demais cinza), alça dupla (início/fim) na régua com anos 1970–2010, botões "↺ reiniciar" e "▶ play", ícone de foguete com "1x" e um ícone de "animação/janela" à direita.
- kepler-playback-anim — https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/h-playback-2.gif — GIF (doc "Time Playback") — VERIFICADA/inspecionada em 1 frame (200, image/gif; mostra o cursor de arrastar sobre a janela). A animação NÃO foi vista, só o frame.
- kepler-playback-yaxis — https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/h-playback-3.png — "custom y axis" — VERIFICADA/inspecionada (200, image/png). Vejo: o histograma substituído por série temporal da coluna "Distance", tooltip "03/10/76 / 3" sobre a linha, velocidade "10x" e botão ✕ ao lado do campo.


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-33_01_kepler_playback_bar`

![REF-33_01_kepler_playback_bar](https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/h-playback-1.png)

`REF-33_02_kepler_playback_anim`

![REF-33_02_kepler_playback_anim](https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/h-playback-2.gif)

`REF-33_03_kepler_playback_yaxis`

![REF-33_03_kepler_playback_yaxis](https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/h-playback-3.png)

**SOURCE:** https://docs.kepler.gl/docs/user-guides/h-playback — doc oficial (GitBook, "Last updated 4 months ago" em out/2026); imagens provavelmente de versões anteriores (data NÃO VERIFICADA). Texto: filtro temporal faz a janela de playback aparecer; velocidade 1x/2x/4x ou valor digitado; "Showing" bar com Reset quando o domínio é estreitado; ⌘/Ctrl + roda para zoom da timeline; ⌘/Ctrl + setas para pan.

**PROBLEM:** Ver como dados geoespaciais evoluem no tempo exige tanto uma janela de tempo quanto uma noção da distribuição temporal (onde há atividade).

**SOLUTION:** Um filtro por campo temporal gera automaticamente uma barra de playback no rodapé do mapa: histograma de distribuição de pontos + janela deslizante (alça dupla) que "rola" sobre o tempo com play/pause/reinício e velocidade. A cápsula flutuante sobre o mapa mostra o intervalo atual em texto grande. Opcionalmente, um "Y axis" troca o histograma por uma série temporal de qualquer coluna numérica.

**OBSERVE:**
- A janela é um INTERVALO (alças esquerda/direita), não um ponto: o mapa mostra "o que ocorreu entre A e B" e o intervalo inteiro se move durante o play.
- O histograma dá o "relevo" do tempo: dá para ver onde há atividade antes de dar play, e as barras dentro da janela ficam coloridas, as de fora cinza.
- A cápsula com data/hora grande fica sobre o MAPA (visível sem desviar o olhar da área de dados), e a barra com os controles fica separada na parte de baixo.
- Controles mínimos: ↺, ▶, velocidade (ícone de foguete + "1x") e uma ação à direita (animação da janela); outras opções ficam em menus.
- Zoom/precisão da timeline (doc): roda para redimensionar a janela sob o cursor; barra "Showing" com "Reset" aparece quando o domínio é estreitado (resposta a timelines muito longas).
- Y Axis dá uma segunda leitura do mesmo tempo (ex.: distância x tempo de uma viagem) sem trocar de ferramenta.

**INTERACTION:**
1. Adiciona um filtro por campo de tempo (timestamp); a barra de playback surge embaixo do mapa.
2. Arrasta as alças para definir a janela, ou clica na janela e a move.
3. Clica ▶; a janela avança, o mapa atualiza; a cápsula mostra o intervalo.
4. Escolhe a velocidade (1x/2x/4x ou valor próprio).
5. (Opcional) "Select Y Axis" troca o histograma por série temporal.
6. Zoom com ⌘/Ctrl + rolagem; "Reset" volta ao domínio total.

**WHY IT WORKS:** Um único objeto (a barra) reúne tempo, distribuição, janela e velocidade. A janela deslizante evita o problema de "um instante sem dados" e a distribuição guia a curiosidade.

**ADAPT TO BIWEB:** Para o "time machine" operacional, a barra de playback pode aparecer abaixo de widgets de mapa/linha quando houver um campo temporal no modelo semântico, com histograma de volume (uma consulta agregada barata) + janela deslizante + velocidade; a cápsula de data/hora fica sobre o mapa. Reusar o mesmo componente em gráficos ECharts via brush (dataZoom).

**DO NOT COPY:** Barra cheia de controles técnicos (Y axis, animation) como padrão para usuários de negócio, os ícones sem rótulo (foguete = velocidade), e a falta de teclado/aria evidenciada na doc (NÃO VERIFICADO além do texto de atalhos de zoom/pan).

---

---

### REF-34 — Flightradar24 / Global Playback (de ao vivo para histórico)
**IMAGES:**
- fr24-playback-start — https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/3095007064/original/EJWd_IfYXCXlrDBBgNah8qxk-WbH2fHzeA.png?1681394928 — suporte FR24 (13/04/2023, ANTIGA; setas vermelhas de anotação) — VERIFICADA/inspecionada (200, image/png). Vejo: mapa ao vivo com milhares de aviões; barra inferior com botões Settings · Weather · Filters · Widgets · Playback (este destacado em dourado); painel "Playback" com Date (Apr 12, 2023), Time (UTC) (14 : 05) e botão azul "Start playback"; relógio "11:34 UTC" no topo; controle "VIEW Map ⌄" no canto superior direito.
- fr24-playback-timeline — https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/3095007108/original/xMK3rNMtRYzVhIDSjJLJMUR5dT_0WbO-MQ.png?1681394980 — idem (13/04/2023, ANTIGA) — VERIFICADA/inspecionada (200, image/png). Vejo: barra de playback com "SELECT DATE" (calendário), botão ‖ (pausa), "PLAYBACK TIMELINE" com data "12 Apr, 2023" e hora "14:06:49 UTC", régua com horários (13:00–15:30) preenchida em laranja até o cursor (cabeça vertical branca), setas ‹ ›, slider "ZOOM TIMELINE" (– +) e slider "SPEED" em "20x", ✕ para fechar; na barra de baixo "Weather" aparece esmaecido.
- fr24-playback-settings — https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/3095007161/original/suk_yDzfpPD3Qn-NBlZNhScAEqRc4VHGSg.png?1681395049 — idem (13/04/2023, ANTIGA) — VERIFICADA/inspecionada (200, image/png). Vejo: painel Settings (Map | Visibility | Misc) com seletor de MAP STYLE em miniaturas (Terrain, Roadmap, Greyscale, Radar blue/dark, Aubergine, Satellite, Hybrid, Black/White), Brightness, Day/Night line, sobre a timeline de playback ativa.


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-34_01_fr24_playback_start`

![REF-34_01_fr24_playback_start](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/3095007064/original/EJWd_IfYXCXlrDBBgNah8qxk-WbH2fHzeA.png?1681394928)

`REF-34_02_fr24_playback_timeline`

![REF-34_02_fr24_playback_timeline](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/3095007108/original/xMK3rNMtRYzVhIDSjJLJMUR5dT_0WbO-MQ.png?1681394980)

`REF-34_03_fr24_playback_settings`

![REF-34_03_fr24_playback_settings](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/3095007161/original/suk_yDzfpPD3Qn-NBlZNhScAEqRc4VHGSg.png?1681395049)

**SOURCE:** https://support.fr24.com/support/solutions/articles/3000120423-how-to-view-playback-on-the-flightradar24-website- (artigo de suporte oficial; "Modified on Thu, 23 Jul" sem ano visível; screenshots de abr/2023). Texto: timeline que pode ser arrastada, zoom da timeline, velocidade de 1x a 300x, filtros/widgets/settings aplicáveis ao playback, alternância Map/List, histórico de 7 dias (free) a 3 anos (business) segundo busca (NÃO VERIFICADO diretamente nesta página). Complemento: https://www.flightradar24.com/blog/inside-flightradar24/playback-is-now-available-in-the-flightradar24-app/ (blog; retornou 403, NÃO LIDO).

**PROBLEM:** O mesmo mapa que mostra o "agora" precisa permitir reconstruir como o céu estava em outro momento, mantendo os mesmos filtros e estilos, sem trocar de produto.

**SOLUTION:** Um botão "Playback" na mesma barra de ferramentas do mapa ao vivo abre um seletor simples de data/hora UTC com "Start playback". O mapa entra em modo histórico no MESMO canvas e a barra de ferramentas inferior ganha uma timeline com play/pause, cursor arrastável, zoom da timeline e slider de velocidade (até 300x). Filtros, configurações e widgets continuam valendo.

**OBSERVE:**
- Playback é uma ferramenta da mesma barra (Settings · Weather · Filters · Widgets · Playback): o histórico é um "modo" do mapa, não uma tela diferente.
- O painel de entrada é mínimo: data, hora (UTC) e um botão azul. A timeline só surge depois.
- Na timeline, o trecho já percorrido é laranja, o futuro é cinza, e o cursor é uma linha branca vertical com hora UTC exata: fácil de ler o "onde estou".
- Dois sliders separados e rotulados (ZOOM TIMELINE e SPEED, cada um com "?" de ajuda) em vez de um controle composto.
- "Weather" aparece esmaecido durante o playback (nas imagens 2 e 3), sinalizando uma capacidade indisponível no modo histórico, sem escondê-la.
- O relógio UTC do topo e o rótulo "LIVE AIR TRAFFIC" sob o logo ancoram o contexto "ao vivo"; o seletor "VIEW Map ⌄" permite alternar Map/List também durante o playback (texto da doc).

**INTERACTION:**
1. No mapa ao vivo, clica "Playback" na barra inferior.
2. Escolhe data e hora (UTC) e clica "Start playback".
3. A timeline surge; o mapa anima as posições. Usuário pausa (‖), arrasta a timeline ou usa ‹ ›.
4. Ajusta o zoom da timeline (mais/menos tempo visível) e a velocidade (1x–300x).
5. Aplica filtros/estilos como no ao vivo; troca Map ↔ List se quiser.
6. Fecha (✕) para voltar ao ao vivo.

**WHY IT WORKS:** Preserva o contexto do usuário (mesmo mapa, mesmos filtros) e acrescenta só o controle novo (tempo). O estado histórico fica evidente pela barra extra, e capacidades indisponíveis ficam esmaecidas.

**ADAPT TO BIWEB:** No mapa operacional, "Histórico" pode ser um botão na barra do widget que revela uma timeline no próprio widget (ou na barra de contexto sticky), mantendo filtros, camadas e seleção. Mostrar claramente o que fica indisponível no histórico (ex.: alertas em tempo real) esmaecendo, não removendo.

**DO NOT COPY:** O seletor de hora em UTC obrigatório sem fuso local, o limite de histórico atrelado a plano e as capturas com muitos controles sobrepostos na base (ruído em telas pequenas).

---

---

### REF-35 — Sentry / Session Replay (timeline com eventos, scrubbing, breadcrumbs sincronizados)
**IMAGES:**
- sentry-replay-details — https://docs.sentry.io/mdx-images/replay-details-47JNUK7L.png — "Session Replay details user interface" (doc atual; data NÃO VERIFICADA) — VERIFICADA/inspecionada (200, image/png, 155 KB). Vejo: captura anotada com três regiões: "Replay Player" (página de Checkout reproduzida, com cursor e um círculo roxo de clique), "Additional Components" (abas Summary, Breadcrumbs, Console, Network, Errors, Trace, Memory, Tags; lista com Navigation /cart, User Click, Navigation /checkout, Error: 832314cc..., cada item com ▷ e horário 09:21–09:40) e "Timeline" (barra inferior com botões ⏪10, ▶, ⏭, horário 09:33 / 10:29, trilho com marcadores coloridos de eventos, zoom "– 1× +", engrenagem e tela cheia).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-35_01_sentry_replay_details`

![REF-35_01_sentry_replay_details](https://docs.sentry.io/mdx-images/replay-details-47JNUK7L.png)

**SOURCE:** https://docs.sentry.io/product/explore/session-replay/web/replay-details/ (doc oficial). Texto: "timeline ... illustrates where significant events ... happen over the course of the replay", permite "scrub to key events by dragging across the timeline" e tem zoom; breadcrumbs "synced with the replay player and will auto-scroll as the video plays"; a aba Network tem um indicador que acompanha a reprodução.

**PROBLEM:** Reproduzir o que o usuário viu/fez em uma sessão longa sem assistir tudo; achar rapidamente o momento do erro.

**SOLUTION:** Uma timeline "de eventos" sob o player: marcadores coloridos (erros, cliques, navegações) sobre um trilho com cursor arrastável, mais lista de breadcrumbs sincronizada (cada item tem um ▷ + horário que salta para o instante). Reprodução, velocidade e pulo de 10 s ficam na mesma barra.

**OBSERVE:**
- O trilho da timeline é uma faixa de marcadores coloridos clustered (concentrados perto dos erros no frame), e abaixo dele o slider de posição com horários extremos "09:33" e "10:29": dois níveis de leitura (o que aconteceu / onde estou).
- Cada breadcrumb tem ▷ + horário no canto direito: clique = saltar para o instante; o evento atual segue o vídeo com auto-scroll (texto da doc).
- Controles do player: voltar 10 s, play, avançar para o próximo evento/segmento, velocidade "1×" com – e +, configurações e tela cheia; poucos botões, ícones claros.
- O erro aparece na lista com cor vermelha e na timeline como marcador vermelho; o mesmo código de cor liga as duas visões.
- Os componentes adicionais (abas) ficam num painel lateral que pode ser redimensionado (alça pontilhada visível entre o player e o painel).
- O cabeçalho mostra contadores de Dead Clicks, Rage Clicks, Errors: resumo antes de assistir.

**INTERACTION:**
1. Abre um replay; o player mostra a sessão e a timeline exibe marcadores de eventos.
2. Arrasta o cursor da timeline para um marcador de erro (ou clica no breadcrumb com ▷ e horário).
3. A lista lateral (Breadcrumbs/Console/Network) rola e destaca o item atual.
4. Ajusta velocidade (1×) ou usa "pular 10 s"; pode dar zoom na timeline para eventos próximos.
5. Alterna abas (Errors, Network, Trace) para contexto técnico no mesmo instante.

**WHY IT WORKS:** O "tempo" é a chave que une todos os painéis: um clique em qualquer item move todo o resto. A timeline com marcadores transforma a busca por "o momento importante" em reconhecimento visual.

**ADAPT TO BIWEB:** Para o "time machine", a timeline pode mostrar marcadores de eventos de negócio (alertas disparados, mudanças de estado, deploys de dados) sobre a barra de playback; clicar num evento em uma lista/tabela salta o dashboard para aquele instante e todos os widgets sincronizam (tempo como chave global).

**DO NOT COPY:** Gravação de tela/vídeo (BIWEB reconstrói estado a partir de dados), o excesso de abas técnicas e a captura anotada com rótulos coloridos (é só doc, não UI do produto).

---

---

#### Padrões transversais

**View switching**
- **Segmented vs. ícones:** quando são 2–3 representações do MESMO resultado e a troca é frequente (gráfico | tabela), o padrão dominante é um segmented control de ícones, no rodapé/cabeçalho do resultado (Metabase REF-28), ou um simples switch para estados binários de depuração (Grafana "Table view" REF-26). Para 10+ tipos (gráficos), vira grade de ícones com rótulo em sidebar/popover (Metabase, Lens REF-27). Para modos de câmera do mapa, pilha vertical de botões quadrados com ícone no canto (kepler.gl REF-29).
- **Preservação de estado:** a troca é de apresentação, não de configuração: filtros, período e seleção ficam intactos. Ferramentas sinalizam perdas ANTES do clique (triângulo de aviso no menu do Lens), e tipos impróprios ficam acessíveis em grupo separado (Metabase "More charts"). Presets aplicam por mesclagem e preservam overrides (Grafana).
- **Transições/skeletons:** nas fontes oficiais consultadas NÃO encontrei descrição de transições animadas elaboradas nem de skeletons para a troca; os GIFs/vídeos só foram inspecionados em 1 frame. Fica como lacuna: o que se observa é feedback por miniatura ao vivo (Lens, Grafana) e metadados de carga ao lado ("Showing 193 rows · 135ms", Metabase).
- **Declarar limites do modo:** o globo do kepler.gl lista camadas não suportadas e limites de zoom; o Grafana avisa que a Table view não inclui transformações.

**Realtime**
- **Ao vivo é um estado do controle de tempo**, não um widget à parte: opção "Live Tail" no seletor de período (Datadog REF-31), pílula Playing/Paused (Netdata REF-32), botão Live no Explore (Grafana REF-30).
- **Indicador sem distração:** um glifo pequeno e uma cor única (raio verde, pílula verde) e o resto neutro; novidades indicadas por fundo contrastante que esmaece (Grafana), não por piscar.
- **Pausa como direito do usuário:** rolar ou pairar pausa (Grafana/Netdata); Pause é o botão primário enquanto está ao vivo (Datadog); modo de segundo plano explícito para TV (Netdata Force Play).
- **Honestidade sobre completude:** "27 events/s, 60% displayed" (Datadog) diz que há amostragem e como evitá-la.
- **Lacunas:** não encontrei nas fontes consultadas documentação visual de indicador de saúde da conexão/reconexão (resync) nem de eventos de mapa em tempo real com destaque temporal; NÃO VERIFICADO em Cloudflare Radar, Downdetector, Dynatrace, Honeycomb (não pesquisados a fundo).

**Replay**
- **Scrubbing:** cursor arrastável sobre trilho com marcadores/histograma (kepler.gl, Sentry), horário exato junto ao cursor (FR24 14:06:49 UTC), zoom da timeline separado da velocidade (FR24 e kepler.gl).
- **Live ↔ histórico:** o histórico é um modo do mesmo canvas, com a mesma barra de ferramentas e filtros preservados (FR24); o estado muda visivelmente (barra de timeline, pílula cinza "Paused" no Netdata). Capacidades indisponíveis são esmaecidas, não removidas (FR24 Weather).
- **Tempo como chave global:** em Sentry, clicar num breadcrumb leva todos os painéis ao mesmo instante.
- **Janela vs. ponto:** kepler.gl usa janela deslizante (intervalo) que dá sentido a dados esparsos; FR24 usa ponto + velocidade.

**Anti-patterns observados/evitar**
- Ícones sem rótulo para ações pouco universais (foguete=velocidade, cubo=3D, livro=split no kepler.gl).
- Misturar "pausado" com "histórico" no mesmo visual (Netdata usa cinza para ambos).
- Troca que perde configuração silenciosamente (o Lens avisa com (!), mas o aviso é só um pequeno triângulo).
- Estados de tempo real sem carimbo de "última atualização" visível.
- Playback com controles demais na mesma barra (zoom, velocidade, data, filtros) em telas pequenas.
- Toda a evidência acima é de documentação, não de teste de usabilidade; não há dados de métricas de sucesso.


---

## 07 — Network / Topology Map

**Pergunta da área:** como representar redes (nós, links, rotas, intensidade, capacidade, saúde) em uma experiência central, sem ilegibilidade? (Base do futuro relatório **Network Intelligence**, primeiro da lista de exemplos.)
**Aprendizados-chave:** vista hierárquica não geográfica *e* geográfica; saúde ≠ intensidade (duas legendas); link como objeto de primeira classe; degraus discretos de cor; drawer cujo conteúdo muda por tipo; seleção persistida na URL.

### REF-36 — Kentik Map (Weather Map + Topology + Details drawer)

**IMAGES:**
- `kentik-overview-blocks` — https://cdn.us.document360.io/082e25b5-afce-42d4-8f47-70bd3f1d02b7/Images/Documentation/image(432).png?sv=2026-02-06&spr=https&st=2026-10-07T18%3A01%3A04Z&se=2026-10-07T18%3A44%3A04Z&sr=c&sp=r&sig=P0Jbq2U0SbALwMzt6GcbP2c7FAeZinofhcDVFZQgyn8%3D — "The Kentik Map shows the on-prem, cloud, and Internet elements that handle your network's traffic." (visão geral: blocos Clouds / Internet / On Prem, legenda Gbits/s, contador de saúde) — status: VERIFICADA/inspecionada (URL assinada, expira)
- `kentik-weathermap` — https://cdn.us.document360.io/082e25b5-afce-42d4-8f47-70bd3f1d02b7/Images/Documentation/image(448).png?sv=2026-02-06&spr=https&st=2026-10-07T18%3A01%3A04Z&se=2026-10-07T18%3A44%3A04Z&sr=c&sp=r&sig=P0Jbq2U0SbALwMzt6GcbP2c7FAeZinofhcDVFZQgyn8%3D — "The weather map shows the physical location of network entities." (mapa-múndi com marcadores clusterizados com anel de saúde, arcos roxos de utilização, legendas Utilization & Traffic e Health) — status: VERIFICADA/inspecionada (URL assinada, expira)
- `kentik-site-drawer` — https://cdn.us.document360.io/082e25b5-afce-42d4-8f47-70bd3f1d02b7/Images/Documentation/image(699).png?sv=2026-02-06&spr=https&st=2026-10-07T18%3A01%3A05Z&se=2026-10-07T18%3A36%3A05Z&sr=c&sp=r&sig=N15EyzIENzBfmFKYmzZCf1sTNAETUZJe5J6ytFeS7xw%3D — "The Details drawer shows details about an entity on the Kentik Map." (Site Details: tipo, endereço, mini-topologia interna BORDER/CORE, gráfico de Traffic, resumos Devices/Health) — status: VERIFICADA/inspecionada (URL assinada, expira)
- Extras duráveis (post de release notes de dez/2021 — UI ANTIGA): `https://img.announcekit.app/48a0a0cf16bfe92b05b8591020c0ad50?w=1999&s=6aab81a139f3291f02ea20ba99fdfbda` (Weather Map com link vermelho + drawer "Entities: 3 Sites / 9 Links") e `https://img.announcekit.app/7f6b15e35e44a6d1907fce472470a27f?w=1638&s=d052c79c28601b07c62594a350337537` (cards de Links e Sites com borda colorida por saúde) — VERIFICADA/inspecionada (HTTP 200 image/png).

**SOURCE:** 
- https://kb.kentik.com/docs/kentik-map (doc oficial, atualizada 2025-11-19; versão Markdown: https://kb.kentik.com/docs/kentik-map.md)
- https://kb.kentik.com/docs/kentik-map-details (doc oficial, drawer de detalhes)
- https://new.kentik.com/cloud-december-2021-updates-1RKdt6 (changelog oficial dez/2021: camadas de utilização e saúde no Weather Map)

**PROBLEM:** Uma rede híbrida (data centers, nuvens, Internet/ASNs) tem milhares de interfaces. Mostrar tudo como grafo único gera ruído; esconder tudo atrás de consultas obriga o operador a "saber o que perguntar". A pergunta real é "onde está o problema e quem é afetado?".

**SOLUTION:** Mapa em camadas de abstração: um nível superior com apenas 3 "blocos" (Clouds, Internet, On Prem) ligados por setas com volume agregado por direção; o bloco On Prem alterna entre Weather Map (mapa geográfico) e Topology (arco/camadas). Clique em qualquer elemento abre um menu de ações (View Topology, Show Details, Show Connections, Show Path To) e um drawer lateral "Details" cujo conteúdo muda com o tipo de selecionado (site, device, interface, link, ASN). Saúde (healthy/warning/critical/unknown) vem de SNMP e é avaliada contra faixas esperadas.

**OBSERVE:**
- Nível superior (inspeção visual): 3 blocos cinza com título (Clouds, Internet, On Prem); entre eles, linhas finas com rótulos "6 Mbps ▶ / ◀ 31 Mbps" (um valor por direção, rotacionados nas linhas verticais). Dentro de Internet, uma grade de quadradinhos (um por Origin Network) colorida pela mesma escala sequencial da legenda "0 … > 100 Gbits/s" (azul-acinzentado → roxo → rosa/vermelho).
- Weather Map (inspeção visual): marcadores circulares com número = cluster de sites; o anel ao redor do marcador é segmentado por saúde (verde/laranja/vermelho) quando o switch Health está ligado. Arcos curvos entre sites, em roxo claro → roxo escuro por faixa de utilização (10%…90%) e linhas azuis sólidas mais fortes (a imagem não explica o que distingue as azuis das roxas). Duas legendas embutidas no canto inferior do mapa: "Utilization & Traffic" (escala em degraus 10%–90%) e "Health" (Down/Critical/Degraded/Warning/Healthy), mais ícone de camadas com contador "5".
- Camadas (doc): ícone Layers abre "On Prem Controls": Links (tipo de tráfego; desenhar por Layer 2/3/All), Cloud Regions, Cloud Backbone Traffic, Utilization (colore links por utilização em vez de bytes), Health, Clustering. Links saudáveis são sólidos; links degradados ou caídos viram tracejados amarelos (doc).
- Clustering geográfico (doc): hover no cluster abre popover com breakdown de saúde + lista de sites; zoom divide o cluster; clique abre o drawer com as entidades.
- Drawer Details (inspeção visual): cabeçalho com ícone de pin + "Site Details" + nome do site como link; metadados (Type: Data Center, Address); seções colapsáveis "Internal Map Details" (mini-topologia BORDER/CORE com nós coloridos por saúde), "Traffic" (3 selects: All Traffic / Total / Avg bits/s + série temporal de 24h com valor médio no topo), "Devices" com chips "2 Critical / 1 Healthy", "Health" com chips "5 Critical / 1 Warning". Botão "View Topology" no canto.
- Topologia de site (inspeção visual da imagem de doc): camadas horizontais rotuladas (EDGE, SUPER SPINE, SPINE, LEAF, TOR), cada device um círculo com ponto verde de saúde, arestas cinzas finas com setas nas duas pontas; hover num device destaca todos os links dele (doc).
- Link details (doc): hover deixa a linha em negrito; clique abre drawer "Traffic Details" com as duas pontas do link e painéis de consulta automáticos (respeitam time range e filtros atuais). Link agregado (vários links entre clusters) pede ao usuário que escolha qual link focar (changelog dez/2021).

**INTERACTION:**
1. Abrir Kentik Map: ver 3 blocos + setas de volume; contador de saúde (ícone de coração, ex.: "14") no canto.
2. Clicar no contador de saúde: popup com tipos de problema (alta utilização in/out, memória) → "View Problems" para lista.
3. No bloco On Prem, ficar em Weather Map: hover num link mostra bps nos dois sentidos (e % utilização se ligado); hover num cluster mostra saúde e sites.
4. Clicar num site: menu com View Topology / Show Details / Show Connections. "Show Details" abre o drawer à direita, sem trocar de página.
5. "View Topology" troca o bloco por topologia de site; clicar num device → drawer; "View Device Topology" → vizinhos upstream/paralelos/downstream + interfaces.
6. Filtros (cards removíveis) e Time Range globais continuam valendo para o drawer.
7. Breadcrumbs permitem voltar a qualquer nível.

**WHY IT WORKS:** Progressive disclosure por escala (3 blocos → mapa → site → device → interface) em vez de um único grafo gigante; o mesmo vocabulário visual (cor = utilização, anel = saúde) é reaproveitado em todos os níveis; o drawer é o único lugar de detalhe, então o canvas nunca é coberto por popups pesados. Hover mostra o mínimo, clique abre o detalhe.

**ADAPT TO BIWEB:** O padrão "canvas + legenda embutida + drawer contextual cujo conteúdo depende do tipo selecionado" é diretamente análogo ao inspector contextual do BIWEB; a separação "hover = dado mínimo / clique = drawer" e as duas legendas (intensidade e saúde) com escalas discretas são úteis para o futuro relatório Network Intelligence. A tabela de ações no clique (ver topologia, ver detalhes, ver conexões) pode inspirar o menu contextual de um nó. Cluster com anel de saúde mostra como combinar camada de clusters e estado numa única marca.

**DO NOT COPY:** Layout de 3 blocos Clouds/Internet/On Prem (específico do domínio Kentik); iconografia, paleta roxa/rosa e a marca; textos e nomes de painéis.

---

---

### REF-37 — Cisco ThousandEyes — Path Visualization

**IMAGES:**
- `te-pathviz-overview` — https://1112912342-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F-M4QARF6s57qxMrOHDTZ%2Fuploads%2Fgit-blob-18277d7ed778c50e1f0194df17a0ae8ce705bb27%2Fpathviz-overview.png?alt=media — tela completa: seletor de teste, métrica "Loss", timeline com rounds de 24h/7d/14d, abas Path Visualization/Map/Table, barra de controles e grafo de caminho — status: VERIFICADA/inspecionada (content-type retornado é image/jpeg apesar da extensão .png; screenshot com data "Apr 29" visível, ano não confirmado)
- `te-pathviz-controls` — https://1112912342-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F-M4QARF6s57qxMrOHDTZ%2Fuploads%2Fgit-blob-e4f9ea10148bf02f14e19cc069d55c0cd790a0e7%2Fpathviz-controls.png?alt=media — barra de controles: Show, Group, Highlight, Select (com "2 Nodes And 1 Link", Clear Selection), Undo/Reset To Default — status: VERIFICADA/inspecionada (image/jpeg)
- `te-pathviz-grouped` — https://1112912342-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F-M4QARF6s57qxMrOHDTZ%2Fuploads%2Fgit-blob-6ca310835ddf14cf2ed69e9556880627f3fbee93%2Fproduct-documentation_thousandeyes-basics_using-the-path-visualization-view-2.png?alt=media&token=c274f18f-17fb-49ec-804c-a95622061c24 — "agents grouped by Location, interfaces by Network, destinations by Network & Location" — status: VERIFICADA/inspecionada (image/png)


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-37_01_te_pathviz_overview`

![REF-37_01_te_pathviz_overview](https://1112912342-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F-M4QARF6s57qxMrOHDTZ%2Fuploads%2Fgit-blob-18277d7ed778c50e1f0194df17a0ae8ce705bb27%2Fpathviz-overview.png?alt=media)

`REF-37_02_te_pathviz_controls`

![REF-37_02_te_pathviz_controls](https://1112912342-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F-M4QARF6s57qxMrOHDTZ%2Fuploads%2Fgit-blob-e4f9ea10148bf02f14e19cc069d55c0cd790a0e7%2Fpathviz-controls.png?alt=media)

`REF-37_03_te_pathviz_grouped`

![REF-37_03_te_pathviz_grouped](https://1112912342-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F-M4QARF6s57qxMrOHDTZ%2Fuploads%2Fgit-blob-6ca310835ddf14cf2ed69e9556880627f3fbee93%2Fproduct-documentation_thousandeyes-basics_using-the-path-visualization-view-2.png?alt=media&token=c274f18f-17fb-49ec-804c-a95622061c24)

**SOURCE:** https://docs.thousandeyes.com/product-documentation/internet-and-wan-monitoring/path-visualization (doc oficial; Markdown em `.md`; consultada em 2026-10-07; os screenshots de doc podem ser de versões anteriores da UI). Complementar: https://docs.thousandeyes.com/product-documentation/internet-and-wan-monitoring/viewing-data/getting-started-with-path-visualization

**PROBLEM:** Descobrir em qual salto de um caminho multi-ISP (agente → rede local → trânsito → peering → destino) está a perda ou a latência, e quem é o dono do problema — sem ler centenas de linhas de traceroute.

**SOLUTION:** Um grafo da esquerda (agentes) para a direita (destino), onde cada nó é um salto e a espessura/cor do link carrega a métrica. Em vez de pedir ao usuário que olhe tudo, o produto oferece "Highlight" por limiar (ex.: perda > 10% ou delay > 100 ms) que pinta de vermelho só o suspeito; "Group" agrega agentes/interfaces/destinos por rede ou localização para reduzir ruído; "Select" fixa evidência (com contorno tracejado animado) e o estado inteiro vai na URL/snapshot.

**OBSERVE:**
- Nós (inspeção visual): círculos; número dentro = quantos caminhos/agentes agregados passam por ali; rótulo abaixo com rede/ASN ("Google Inc. (AS 15169)"). Nó da origem em verde (escala verde → vermelho conforme a métrica), nós de trânsito em azul claro, nós na rede de destino em verde-água; destino final com contorno preto.
- Arestas (inspeção visual): curvas suaves tipo Sankey; **espessura** reflete quantas rotas/testes atravessam o link (doc: "when a path splits, the thickness of the line..."); link vermelho = delay acima do limiar; trechos pontilhados com número = hops colapsados (clicar expande) e "?" = hops desconhecidos.
- Legenda (doc, tabela de objetos): nó com perda = anel vermelho; nó selecionado = anel azul tracejado em movimento; nó destacado por busca deixa os demais cinza; link com "X" = alvo não alcançado; laço vermelho = routing loop.
- Controles (inspeção visual): linhas "Show", "Group" (3 dropdowns: Agents by…, Interfaces by…, Destinations by…), "Highlight" (campo de busca por Network/Country/IP/Prefix/Title + dois chips de limiar "Forwarding Loss > 10% (0 Nodes)" e "Link Delay (Avg) > 100ms (0 Links)" com contagem de matches), "Select". Um slider de "hops/complexidade" no canto superior direito colapsa rotas. Barra recolhível (chevron) para maximizar o canvas.
- Timeline acima do grafo (visão geral): um round = uma execução do teste; clicar no round muda o caminho exibido; sobreposição de métrica "Loss" em série temporal.
- Tooltips (doc): agente (nome, IP, prefixo, rede, local, estatísticas), nó (IP, prefixo, rede, local, tempo de resposta médio), link (IPs, número de rotas, MPLS, delay médio).

**INTERACTION:**
1. Escolher teste e métrica (ex.: Loss) → clicar no round em que o problema foi reportado na timeline.
2. "Show": restringir aos agentes com problema (ou manter All para comparar saudável vs. não saudável).
3. "Group": agrupar por Network / Network & Location para colapsar caminhos paralelos.
4. "Highlight": definir limiar; o produto pinta nós/links acima dele. Nó vermelho no meio do caminho = perda de encaminhamento; nó vermelho no destino = perda terminal (doc dá a tabela de "quem é o dono").
5. Clicar num nó/link para fixá-lo em "Select" (dashed animado); duplo clique seleciona todos os caminhos que passam por ele.
6. Compartilhar URL ou salvar snapshot: seleção, highlights e janela de tempo são reproduzidos.

**WHY IT WORKS:** A interface codifica uma pergunta diagnóstica (forward vs. terminal loss) em duas regras visuais simples (anel vermelho no meio vs. no destino) e entrega controles para reduzir complexidade sem perder fidelidade (group + slider de complexidade + highlight por limiar). A seleção persistida na URL transforma a tela em evidência compartilhável.

**ADAPT TO BIWEB:** Para "Network Intelligence", o par "limiar que destaca" + "agrupar para reduzir ruído" mostra uma forma de lidar com muitos nós sem filtrar fora o contexto: o que está fora do limiar fica cinza em vez de sumir. Estado de seleção/tempo em URL/snapshot encaixa com o modo leitura e a barra de contexto sticky do BIWEB. O layout esquerda→direita só faz sentido se houver uma noção de fluxo/caminho no modelo de dados; para mapas geográficos, vale só a ideia de controles (Show/Group/Highlight/Select).

**DO NOT COPY:** Nomenclatura "Forwarding Loss/Terminal Loss", paleta e estilo visual dos nós, a marca Cisco/ThousandEyes e o layout específico de traceroute.

---

---

### REF-38 — Datadog Network Map (Cloud Network Monitoring)

**IMAGES:**
- `dd-network-map` — https://docs.dd-static.net/images/network_performance_monitoring/network_map/network_map_3.4f3aab8df1203b95c98de1114c07a1c6.png — alt "network_map": tela com seletores View/By/Metric, grafo de clusters por Availability Zone, legendas Edge Width/Node Size e toggle "Highlight top traffic" — status: VERIFICADA/inspecionada (screenshot com data "Apr 28", ano não visível)
- `dd-network-map-expanded-cluster` — https://docs.dd-static.net/images/network_performance_monitoring/network_map/expanded_network_cluster.bad398df0d116447ef1d94ecb495963f.png — alt "expanded network cluster map view": um cluster expandido mostrando pods individuais — status: VERIFICADA/inspecionada
- `dd-network-map-highlight-video` — https://docs.dd-static.net/images/network_performance_monitoring/network_map/network_map_highlight.mp4 — vídeo curto "hover num nó destaca e anima a direção do tráfego" — status: VERIFICADA (HTTP 200, content-type video/mp4); NÃO inspecionado (só descrição da doc)


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-38_01_dd_network_map`

![REF-38_01_dd_network_map](https://docs.dd-static.net/images/network_performance_monitoring/network_map/network_map_3.4f3aab8df1203b95c98de1114c07a1c6.png)

`REF-38_02_dd_network_map_expanded_cluster`

![REF-38_02_dd_network_map_expanded_cluster](https://docs.dd-static.net/images/network_performance_monitoring/network_map/expanded_network_cluster.bad398df0d116447ef1d94ecb495963f.png)

**SOURCE:** https://docs.datadoghq.com/network_monitoring/cloud_network_monitoring/network_map/ (doc oficial, consultada em 2026-10-07; versão Markdown via header `Accept: text/markdown`). Blog relacionado citado pela doc: https://www.datadoghq.com/blog/datadog-npm-search-map-updates/ (NÃO lido).

**PROBLEM:** Em ambientes com milhares de containers/pods/serviços, um mapa de dependências de rede vira uma "bola de pelos". É preciso mostrar quem fala com quem, quem sobrecarrega o quê e onde há anomalia, sem quebrar o navegador.

**SOLUTION:** O usuário escolhe três coisas numa barra: o que cada nó representa (View: container_id, pod_name, service…), por qual dimensão agrupar (By: Availability Zone etc.) e qual métrica a aresta mostra (Metric: throughput, retransmits, latência TCP, jitter, conexões). O sistema agrupa automaticamente em clusters expansíveis quando há nós demais e destaca o top de tráfego por percentil.

**OBSERVE:**
- Barra de configuração (inspeção visual): "Search for [client and server tags]" + "Filter Traffic: 956 MB – 84.2 GB" (filtro por faixa da métrica) + selects "View / By / Metric" encadeados com uma linha de hierarquia, e "Find container ids" à direita; contador "0 of 2,848 Container Ids displayed in 17 Availability Zones" que explicita a amostragem.
- Nós (inspeção visual): círculos grandes por cluster com **tamanho = valor da métrica** (legenda "Node Size: Min 956.41M … Max 84.24G"); badge escuro com a contagem de membros ("286", "2k"); borda vermelha = há monitor em alerta cujo tag bate com o agrupamento (doc); nó "N/A" central para tráfego não resolvido.
- Arestas (inspeção visual): setas cinza claras para tráfego normal; setas **roxas e mais grossas** para o "top traffic" (toggle "Highlight top traffic by Volume sent (90p)"); legenda "Edge Width | Value: Min 25.35k … Max 57.52G".
- Cluster expandido (inspeção visual): ao clicar, um polígono cinza envolve os nós internos (pods) com rótulos truncados; o grafo mostra "250 of 2,261 Pod Names displayed" — limite explícito.
- Direcionalidade (doc): hover num nó destaca e anima a direção do tráfego enviado e recebido; menu "Inspect" contextualiza o nó no resto da rede.
- Barra superior: aba Overview / Analytics / **Map** / DNS, seletor de intervalo (15m) com setas anterior/próximo e calendário.

**INTERACTION:**
1. Aba Map → escolher View (o que é um nó) e By (como agrupar).
2. Escolher Metric (ex.: Volume sent) — largura das arestas e tamanho dos nós passam a refletir a métrica.
3. Filtrar por tags (busca com fuzzy match), por ambiente/namespace, mostrar tráfego não resolvido, ocultar tráfego fora de um percentil.
4. Passar o mouse num nó: ele e suas arestas se destacam e a direção anima.
5. Clicar num cluster para expandir; clicar na área cinza em volta para recolher.
6. Clicar num nó → "Inspect" para zoom contextual.

**WHY IT WORKS:** O usuário controla a *semântica* do grafo (o que é nó, o que é aresta, qual métrica) em vez de receber um grafo fixo; clusters automáticos + contadores "X of Y displayed" mantêm honestidade sobre o que não está sendo mostrado; as legendas de tamanho/largura mostram min/max reais.

**ADAPT TO BIWEB:** O trio "View / By / Metric" é um exemplo de como o modelo semântico do BIWEB poderia ser exposto ao usuário de forma compacta (dimensão do nó, dimensão de agrupamento, métrica da aresta). A legenda dupla com min/max reais e o aviso "N of M exibidos" são úteis para qualquer camada densa (clusters/heatmap). Cluster expansível com borda de alerta mostra um jeito de propagar estado para cima na hierarquia.

**DO NOT COPY:** Layout force-directed como único modo; paleta roxa/vermelha; branding Datadog; o vocabulário específico de rede (retransmits, pods) fora desse domínio.

---

---

### REF-39 — Grafana "Network Weathermap NG" (painel de weathermap dentro de um dashboard) + PHP Network Weathermap como origem

**IMAGES:**
- `wm-general-example` — https://grafana.com/api/plugins/tamirsuliman-weathermap-panel/versions/1.6.16/images/img/general-example.png — "General Example 1": nós retangulares claros, links verdes em duas metades (A/Z) com rótulos de valor ("4.88 Mb/s", "235 Kb/s") — status: VERIFICADA/inspecionada (HTTP 200 via GET; HEAD retorna 405)
- `wm-example-01` — https://grafana.com/api/plugins/tamirsuliman-weathermap-panel/versions/1.6.16/images/img/example_01.png — painel escuro "Network Weathermap Demo" com legenda "Traffic Load" (5 faixas 0–20% verde … 75–100% vermelho), 4 links paralelos entre Node A e B, rótulos "n/a" — status: VERIFICADA/inspecionada (timestamp visível Out/2022)
- `wm-example-02` — https://grafana.com/api/plugins/tamirsuliman-weathermap-panel/versions/1.6.16/images/img/example_02.png — roteamento ortogonal com pontos VIA e links paralelos em fileiras — status: VERIFICADA/inspecionada


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-39_01_wm_general_example`

![REF-39_01_wm_general_example](https://grafana.com/api/plugins/tamirsuliman-weathermap-panel/versions/1.6.16/images/img/general-example.png)

`REF-39_02_wm_example_01`

![REF-39_02_wm_example_01](https://grafana.com/api/plugins/tamirsuliman-weathermap-panel/versions/1.6.16/images/img/example_01.png)

`REF-39_03_wm_example_02`

![REF-39_03_wm_example_02](https://grafana.com/api/plugins/tamirsuliman-weathermap-panel/versions/1.6.16/images/img/example_02.png)

**SOURCE:** https://grafana.com/grafana/plugins/tamirsuliman-weathermap-panel/ (página oficial do catálogo Grafana; v1.6.16, atualizado 2026-09-18, Grafana >= 11.0.0, ~9.8 mil downloads, assinatura "community"); repositório: https://github.com/allamiro/grafana-network-weathermap-ng (NG continua o plugin arquivado knightss27/weathermap-plugin, que por sua vez imita o PHP Network Weathermap: https://github.com/howardjones/network-weathermap). Screenshots de catálogo são de 2022; podem não refletir a v1.6.16.

**PROBLEM:** Monitores de rede legados mostram "o mapa do NOC": diagrama fixo com nós posicionados à mão e links coloridos pela utilização, que todo operador entende em 2 segundos. Equipes modernas precisam disso dentro do dashboard atual, alimentado por métricas de qualquer fonte.

**SOLUTION:** Um painel de canvas com nós posicionáveis (grid com guias de alinhamento) e links com lados A e Z independentes, cada lado com sua própria query, capacidade (bandwidth) e rótulo; a cor do link vem de faixas de limiar (verde/amarelo/vermelho) e opcionalmente a largura é dinâmica e há animação de fluxo e gradiente.

**OBSERVE:**
- Link em duas metades (inspeção visual): cada link é uma "seta" gorda que sai de cada nó e termina em ponta no meio; o rótulo (pílula) fica sobre cada metade, mostrando o valor de **cada direção separadamente** ("8.15 Mb/s" ↔ "8.06 Mb/s").
- Legenda (inspeção visual): bloco "Traffic Load" no canto superior esquerdo com 5 faixas fixas coloridas (0–20%, 20–40%, 40–60%, 60–75%, 75–100%) do verde ao vermelho escuro — o mapa se lê só pela legenda.
- Nós (inspeção visual): retângulos arredondados com rótulo; nós "core" (A, B) maiores que os periféricos (C…H), o que comunica hierarquia sem ícones.
- Links paralelos (inspeção visual, `example_01`): 4 linhas empilhadas entre dois nós, cada uma com seu par de rótulos; `example_02`: roteamento ortogonal com pontos "VIA" para evitar cruzar nós.
- Estados sem dado: rótulos "n/a" e cinza escuro (cor neutra quando não há valor).
- Dados (página do plugin): modos de valor last/avg/min/max/p95; fontes Prometheus, InfluxDB, Graphite, Zabbix, MySQL/PostgreSQL; drill-down por nó via link de dashboard; rótulos de porta/interface por lado.
- Rodapé: timestamp do último dado ("Fri Oct 14 2022 17:31:24 GMT-0500") visível no canto inferior direito — sinal de "frescor".

**INTERACTION:**
1. No editor do painel, arrastar nós para a posição (snap em grid, guias).
2. Criar links entre nós; para cada lado (A, Z) escolher a query e a capacidade.
3. Definir faixas de limiar e legenda; opcional: largura dinâmica, animação de fluxo.
4. Em modo de visualização, o painel atualiza com o intervalo do dashboard; clicar num nó leva ao dashboard daquele nó (drill-down).

**WHY IT WORKS:** Um mapa fixo, desenhado pelo operador, tem custo cognitivo baixo: posição estável (memória espacial), cor = utilização, legenda sempre visível. A separação A/Z evita médias que escondem assimetria.

**ADAPT TO BIWEB:** Mostra um tipo de visual "diagrama operacional fixo" que não é nem mapa geográfico nem grafo automático; pode aparecer como um componente dentro do relatório Network Intelligence. O padrão de link com dois lados (valor por direção) e legenda por faixas fixas é aplicável a camadas de linhas no MapLibre/deck.gl. A página do plugin é também exemplo de "painel com editor próprio dentro de um dashboard", relevante para o builder.

**DO NOT COPY:** Visual datado (demo de 2022), pílulas "n/a" por todo lado, e a arquitetura "posicione cada nó manualmente" se o objetivo for dados geográficos reais; marca Grafana.

---

---


---

## 08 — Incident Heatmap & Geographic Analytics

**Pergunta da área:** como combinar mapa + timeline + filtros + detalhes para análise de incidentes (futura tela **Incident Intelligence**)?
**Aprendizados-chave:** camadas de agregação trocáveis (ponto → cluster → heatmap → hexbin); timeline com distribuição (histograma/beeswarm); mapa como filtro espacial dos demais widgets; confirmado × suspeito; seleção por feição não funciona em camada agregada.

### REF-40 — Cloudflare Radar Outage Center (mapa de interrupções + beeswarm timeline + tabela)

**IMAGES:**
- `cf-radar-map-timeline` — https://blog.cloudflare.com/_emdash/api/media/file/01KW466GNVA3EM3BYZ9KQR4T7F.png — "Internet outages and traffic anomalies": mapa-múndi com países sombreados (outage) + círculos laranja numerados (anomalias agrupadas) + switch "Traffic Anomalies", e abaixo uma **linha do tempo em enxame (beeswarm)** com legenda Outage / Location Traffic Anomaly / AS Traffic Anomaly — status: VERIFICADA/inspecionada (post de 2023-09-26; UI ANTIGA, pode ter mudado)
- `cf-radar-anomalies-table` — https://blog.cloudflare.com/_emdash/api/media/file/01KW46V50Y593FD1983D7X0QNT.png — tabela "Traffic anomalies" (Type, Entity, Start, Duration, Verified ✕, Actions) com busca "Search events" e paginação 1 de 33 — status: VERIFICADA/inspecionada
- `cf-radar-outages-table` — https://blog.cloudflare.com/_emdash/api/media/file/01KW451YY3SCZ10EPF3RFE0DWR.png — "Internet Outages Table" (Location, ASN, Type, Scope, Cause "Government Directed", Start, End, More information; paginação 1 de 2; Download CSV) — status: VERIFICADA/inspecionada (post de 2022-09-30; UI de 2022)


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-40_01_cf_radar_map_timeline`

![REF-40_01_cf_radar_map_timeline](https://blog.cloudflare.com/_emdash/api/media/file/01KW466GNVA3EM3BYZ9KQR4T7F.png)

`REF-40_02_cf_radar_anomalies_table`

![REF-40_02_cf_radar_anomalies_table](https://blog.cloudflare.com/_emdash/api/media/file/01KW46V50Y593FD1983D7X0QNT.png)

`REF-40_03_cf_radar_outages_table`

![REF-40_03_cf_radar_outages_table](https://blog.cloudflare.com/_emdash/api/media/file/01KW451YY3SCZ10EPF3RFE0DWR.png)

**SOURCE:** https://blog.cloudflare.com/announcing-cloudflare-radar-outage-center (blog oficial, 2022-09-30); https://blog.cloudflare.com/traffic-anomalies-notifications-radar/ (blog oficial, 2023-09-26); doc oficial de campos/API: https://developers.cloudflare.com/radar/investigate/outages (atualizada 2026-04-20). A UI ao vivo https://radar.cloudflare.com/outage-center retornou 403 ao curl — **UI atual NÃO VERIFICADO**.

**PROBLEM:** Eventos de indisponibilidade são geográficos *e* temporais *e* categorizados (causa, escala, ASN). Um mapa sozinho esconde "quando"; uma tabela sozinha esconde "onde".

**SOLUTION:** Três visões sincronizadas do mesmo conjunto de eventos: um mapa coroplético (países afetados no período), uma linha do tempo em que cada evento é um ponto (e pontos em dia de pico se empilham como enxame) e uma tabela filtrável/exportável. Anomalias ainda não verificadas ficam num toggle separado.

**OBSERVE:**
- Mapa (inspeção visual): país afetado em azul escuro sobre base azul clara, fronteiras finas; **sem escala de gradiente** — é binário (houve outage ou não) no período selecionado; anomalias são círculos laranja numerados; círculo de borda dupla = agregação multi-país (doc do blog); zoom desagrega.
- Timeline beeswarm (inspeção visual): eixo x = datas (domingos rotulados); um ponto por evento, cor por tipo (azul = outage, laranja = anomalia de localização, rosa = anomalia de AS); concentração visível como "nuvem" no pico (início de agosto na imagem). Hover em um ponto mostra detalhes do evento (blog).
- Tabela (inspeção visual): colunas Location/ASN/Type/Scope/Cause/Start/End (outages) e Type/Entity/Start/Duration/Verified/Actions (anomalias); ícones de ação por linha (ver gráfico / assinar notificação); "Download CSV".
- Campos do evento (doc): Location, ASN, Type (nacional/subnacional/rede), Scope, Cause (ex.: government directed, weather, power outage, cable cut), Start, End.
- "Verified" é uma coluna booleana: eventos só são "verificados" se aparecem em mais de uma fonte de dados.

**INTERACTION:**
1. Selecionar o período (controle global da página).
2. Olhar o mapa para ver onde houve eventos; olhar a linha do tempo para ver quando se concentraram.
3. Ligar/desligar "Traffic Anomalies" no canto do mapa para incluir/excluir anomalias não verificadas.
4. Hover em ponto da timeline → detalhes; zoom no mapa para desagregar clusters.
5. Na tabela, buscar, ordenar, abrir "More information", baixar CSV.

**WHY IT WORKS:** Cada visualização responde uma pergunta (onde / quando / quais detalhes) e todas usam o mesmo recorte de tempo. O enxame na linha do tempo evita sobreposição de pontos sem agregar em barras, preservando que cada ponto é um evento individual. Estado de verificação explícito evita falsa certeza.

**ADAPT TO BIWEB:** Direto para a tela Incident Intelligence: mapa + timeline de eventos individuais (beeswarm ou strip) + tabela, todos ligados ao mesmo filtro de período e de severidade. O toggle de camada "anomalias" separa fatos confirmados de suspeitas. A coluna Verified/Cause pode virar facetas de filtro.

**DO NOT COPY:** O estilo do mapa de países sem escala (para o BIWEB convém mostrar intensidade); marca/ilustrações Cloudflare; o rótulo "Traffic Anomalies" fora do domínio.

---

---

### REF-41 — kepler.gl — Time Playback + Heatmap/Hexbin/Cluster + Brush

**IMAGES:**
- `kepler-time-playback` — https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/h-playback-1.png — painel de playback: histograma de distribuição por tempo, janela deslizante com duas alças, rótulo flutuante da janela ("01/05/91 03:38:42am – 03/30/11 21:10:05pm"), botões reset/play, ícone de foguete "1x" (velocidade) e um ícone circular no canto direito (função não confirmada) — status: VERIFICADA/inspecionada (UI antiga de docs; o texto da doc foi atualizado ~4 meses antes da consulta)
- `kepler-heatmap` — https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/layers-heat-map.png — layer Heatmap em base escura (Califórnia): gradiente ciano → amarelo → vermelho/rosa sólido nos picos — status: VERIFICADA/inspecionada
- `kepler-hexbin` — https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/layers-hexbin.png — Hexbin 3D (extrusão) em São Francisco, escala azul-arroxeada → verde-clara, base escura — status: VERIFICADA/inspecionada
- Extra: https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/h-playback-2.gif (GIF de playback; HTTP 200 image/gif, 447 KB) — status: VERIFICADA/só alt (não inspecionado quadro a quadro)


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-41_01_kepler_time_playback`

![REF-41_01_kepler_time_playback](https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/h-playback-1.png)

`REF-41_02_kepler_heatmap`

![REF-41_02_kepler_heatmap](https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/layers-heat-map.png)

`REF-41_03_kepler_hexbin`

![REF-41_03_kepler_hexbin](https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/layers-hexbin.png)

`REF-41_04_img4`

![REF-41_04_img4](https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/h-playback-2.gif)

**SOURCE:** Doc oficial https://docs.kepler.gl/docs/user-guides/h-playback ; https://docs.kepler.gl/docs/user-guides/e-filters ; https://docs.kepler.gl/docs/user-guides/g-interactions ; https://docs.kepler.gl/docs/user-guides/c-types-of-layers/i-heatmap ; .../h-hexbin ; .../f-cluster. Projeto: https://github.com/keplergl/kepler.gl (MIT; npm `kepler.gl` 3.3.0-alpha.15 de 2026-09-28).

**PROBLEM:** Incidentes têm posição e instante. Pontos brutos num mapa de centenas de milhares de eventos saturam a tela; um slider de data sozinho não mostra *quando* há mais incidentes; heatmap sozinho perde o tempo.

**SOLUTION:** Um filtro baseado em campo de timestamp cria automaticamente uma barra de playback ancorada no rodapé do mapa: um histograma de distribuição dos pontos por tempo + janela deslizante de duas alças; o mapa mostra só o que cai na janela; play anima a janela. Os mesmos dados podem ser vistos como pontos, clusters, heatmap ou hexbin (agregações) trocando só o tipo de layer.

**OBSERVE:**
- Timeline (inspeção visual): barras do histograma em cinza fora da janela e **azul-petróleo dentro da janela**; alças quadradas nas pontas; eixo com anos; rótulo flutuante em pílula escura acima do mapa mostrando início – fim da janela com data em cinza e hora em branco.
- Controles (inspeção visual): "DateTime" (campo do filtro) e "Y Axis" (trocar o histograma por uma série de outra coluna — por exemplo distância ao longo do tempo); botão de velocidade (ícone de foguete "1x"/"10x"); botões reset e play; um botão circular no canto (função não confirmada na doc).
- Zoom/precisão (doc): roda do mouse redimensiona a janela sob o cursor; pinça/Ctrl-Cmd+scroll dá zoom na timeline inteira; barra "Showing" com "Reset"; Ctrl/Cmd+setas panoram.
- Heatmap (inspeção visual + doc "intensidade ... ponderável por campo numérico"): sem legenda embutida; cor ciano→amarelo→vermelho; ruído de fundo azul claro mantém visíveis eventos isolados; rótulos de cidades permanecem legíveis acima da camada.
- Hexbin (inspeção visual da imagem + doc): cor e altura podem codificar dados (contagem, média, máx, mín, mediana, soma, moda); o raio do hexágono e o espaçamento são ajustáveis (doc). Na imagem, a extrusão 3D tem escala azul-arroxeada → verde-clara. As páginas de doc das camadas heatmap/hexbin constam como "last updated 6 years ago" (conteúdo antigo).
- Interações (doc): Tooltip (campos configuráveis, clique fixa o tooltip com pin), **Brush** (escurece todas as camadas e ilumina só a área sob o cursor — útil com arcos), Coordinate (lat/long seguindo o mouse); só um entre tooltip e brush ativo.
- Filtros (doc): lista de filtros colorida por dataset; filtro aplicado ao mapa assim que campo e valor são definidos; filtros valem para todas as camadas do mesmo dataset.

**INTERACTION:**
1. Carregar dados → criar layer (ponto, cluster, heatmap, hexbin…).
2. Menu Filters → Add Filter → escolher dataset e campo de tempo → a barra de playback aparece.
3. Arrastar as alças ou a janela inteira; ou apertar play e escolher 1x/2x/4x.
4. Opcional: "Select Y Axis" para trocar o histograma.
5. Trocar o tipo de layer para ver a mesma janela como heatmap ou hexbin.
6. Ligar Brush para explorar localmente.

**WHY IT WORKS:** O histograma na própria timeline antecipa "onde vale olhar" antes de arrastar; filtro temporal e agregação espacial são ortogonais (pode trocar um sem perder o outro); a janela com duas alças permite comparar "agora" vs. "antes" movendo-a.

**ADAPT TO BIWEB:** Para "Incident Intelligence" com replay: barra de tempo com histograma de volume + janela deslizante + velocidade; troca de representação (marcadores → clusters → heatmap → hexbin) mantendo o mesmo filtro. Todas as camadas em deck.gl são conceitualmente equivalentes (o kepler.gl é feito sobre deck.gl). Brush e tooltip fixável são úteis em tela de leitura.

**DO NOT COPY:** Layout de painel esquerdo de configuração do kepler.gl em tela de leitura (é uma ferramenta de autoria); o estilo da timeline escuro/pesado; textos e iconografia do Uber/kepler.

---

---

### REF-42 — ArcGIS Dashboards — Map + List + Indicator ligados por Actions

**IMAGES:**
- `arcgis-dash-redlands` — https://us.v-cdn.net/6038851/uploads/legacyfs/online/389628_pastedImage_1.png — dashboard "Redlands Incidents": indicador "17 incidents" em verde, lista de incidentes à esquerda (tipo + data), mapa com símbolos coloridos por categoria — status: VERIFICADA/inspecionada (post da Esri Community, c. 2017: **UI ANTIGA**, uso apenas do padrão)
- `arcgis-dash-flash` — https://us.v-cdn.net/6038851/uploads/legacyfs/online/394889_Flash.jpg — ação "Flash": seta e halo magenta sobre um ponto no mapa de Belize — status: VERIFICADA/inspecionada
- `arcgis-dash-power-outages` — https://www.esri.com/content/dam/esrisites/en-us/arcgis/products/operations-dashboard/update-2020/assets/arcgis-dashboard-operational-card.jpg — card de produto: "California Statewide Power Outages" (indicadores grandes, mapa, lista por condado/empresa, gráfico de barras) — status: VERIFICADA/inspecionada (miniatura pequena, ~349 px; detalhe ilegível)


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-42_01_arcgis_dash_redlands`

![REF-42_01_arcgis_dash_redlands](https://us.v-cdn.net/6038851/uploads/legacyfs/online/389628_pastedImage_1.png)

`REF-42_02_arcgis_dash_flash`

![REF-42_02_arcgis_dash_flash](https://us.v-cdn.net/6038851/uploads/legacyfs/online/394889_Flash.jpg)

`REF-42_03_arcgis_dash_power_outages`

![REF-42_03_arcgis_dash_power_outages](https://www.esri.com/content/dam/esrisites/en-us/arcgis/products/operations-dashboard/update-2020/assets/arcgis-dashboard-operational-card.jpg)

**SOURCE:** Doc oficial (v12.1) https://doc.arcgis.com/en/dashboards/12.1/create-and-share/configuring-actions-on-dashboard-elements.htm ; novidades (jun/2026) https://doc.arcgis.com/en/dashboards/latest/reference/whats-new.htm ; tutorial: https://community.esri.com/t5/arcgis-dashboards-blog/configure-your-first-dashboard/m-p/888653 ; produto: https://www.esri.com/en-us/arcgis/products/arcgis-dashboards/overview (blog oficial do mesmo tutorial na esri.com retornou 403).

**PROBLEM:** Dar visão situacional de incidentes (quantos, onde, quais, em que estado) a pessoas que não são analistas GIS, com todas as peças conversando entre si.

**SOLUTION:** Painel de elementos (mapa, lista, indicadores, gráficos, seletores de categoria, detalhes) onde cada elemento pode ser *origem* e/ou *alvo* de "ações": Zoom, Pan, Flash, Show Pop-up, Follow Feature e Filter (atributo ou espacial). O autor liga elemento a elemento e o consumidor só clica.

**OBSERVE:**
- Composição (inspeção visual): indicador numérico gigante em verde ("17 incidents") no topo da coluna esquerda, lista scrollável abaixo e o mapa ocupando o restante; legenda por ícones coloridos no próprio mapa; carimbo "Last updated a few seconds ago" abaixo do indicador e da lista.
- Exemplo do card de produto (inspeção visual, baixa resolução): indicadores "2,853 / 2,465" em fundo escuro com tipografia grande, mapa ao centro, listas por condado à direita, gráfico de barras por empresa em baixo (leitura aproximada: a miniatura tem ~349 px).
- Tabela de ações (doc): Mapa pode ser origem de "Set Extent" e "Filter (spatial)" — o extent do mapa filtra lista, indicadores e gráficos; lista seleciona → Zoom/Pan/Flash/Show Pop-up/Follow Feature/Filter no mapa e demais; camada operacional → Flash e Filter; gráficos e tabelas só como origem no desktop.
- Limitações importantes (doc): ações de camada **não** funcionam com camadas com clustering ou binning habilitado; filtro espacial só com geometria polígono como origem.
- Novidades 2026 (release notes de jun/2026): "Focus mode" (usuário expande um elemento), "Show feature menu" (lista completa de feições em elementos orientados a dados), indicador redimensionável, rich text com fonte de dados, mais tipos de elemento como origem de ação.
- Atualização ao vivo: as camadas respeitam intervalo de refresh do mapa; selecionável por padrão (tutorial).

**INTERACTION:**
1. Abrir o dashboard: indicador mostra a contagem total; lista mostra os incidentes recentes.
2. Mover/zoom no mapa → (se configurado) lista e indicador se recalculam só para a área visível.
3. Clicar num incidente na lista → mapa dá Zoom/Pan, "Flash" pisca o ponto e abre o pop-up.
4. Selecionar categoria (seletor) → Filter em todos os elementos.
5. Modo foco para ampliar um elemento (2026).

**WHY IT WORKS:** Contrato simples ("origem → ação → alvo") entre peças pré-fabricadas; o operador não precisa montar consulta. Flash e follow-feature resolvem o problema de "onde está aquilo que acabei de clicar na lista".

**ADAPT TO BIWEB:** A combinação "mapa como filtro espacial dos demais widgets" casa com o filtro geográfico previsto no BIWEB; a lista com "flash/pan" é um bom padrão de ponte lista↔mapa na tela Incident Intelligence. A restrição "ações de camada não funcionam com clustering/binning" é um alerta de projeto: seleção em camadas agregadas precisa de outro caminho (por exemplo, seleção por área/bbox em vez de por feição).

**DO NOT COPY:** Visual 2017 do tutorial; modelo "elementos + ações" configurado por formulário como único caminho de autoria; marca Esri.

---

---


---

## 09 — Map Workspace vs Standard Report

**Pergunta da área:** por que experiências geográficas complexas precisam de uma estrutura diferente de dashboards comerciais?
**Aprendizados-chave:** um canvas contínuo de mapa com painéis flutuantes, painel de camadas persistente, legenda como cartão interativo, escopo de filtro por viewport/geometria, gaveta de tabela "Todas × Visíveis" e atalho Ver × Editar. A tabela comparativa está nos padrões transversais desta seção.

### REF-43 — Felt — Mapa com legenda interativa, painel de detalhe, tabela inferior e "components" dentro da legenda

**IMAGES:**
- `felt-map-parts` — https://217108486-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FmRfGitkyjOEMvVsEyGWN%2Fuploads%2Fgit-blob-c214f3aec183bef9d52576c87e514707e3883e86%2Fmap-parts.png?alt=media — "Felt map with the toolbar at the top, the legend on the left, the detail panel on the right, and the table at the bottom." — status: VERIFICADA/inspecionada
- `felt-legend-components` — https://217108486-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FmRfGitkyjOEMvVsEyGWN%2Fuploads%2Fgit-blob-d78b9a1428a6a9fcb6d0c95b5f448ecb730b20a7%2Fdashboard-legend.webp?alt=media — "A layer in the legend with two statistics, a bar chart, and a time series shown beneath it." — status: VERIFICADA/inspecionada (webp; convertido para PNG com `sips` para abrir)
- `felt-detail-panel` — https://217108486-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FmRfGitkyjOEMvVsEyGWN%2Fuploads%2Fgit-blob-b8920f40fb7ee3bf60690839f66a24bade6db592%2Fstyle-panel-points.webp?alt=media — "Detail panel for a selected layer with the Style, Filter, Components, and Data tabs along the top." — status: VERIFICADA/só alt (HTTP 200 image/webp, 108 KB)


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-43_01_felt_map_parts`

![REF-43_01_felt_map_parts](https://217108486-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FmRfGitkyjOEMvVsEyGWN%2Fuploads%2Fgit-blob-c214f3aec183bef9d52576c87e514707e3883e86%2Fmap-parts.png?alt=media)

`REF-43_02_felt_legend_components`

![REF-43_02_felt_legend_components](https://217108486-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FmRfGitkyjOEMvVsEyGWN%2Fuploads%2Fgit-blob-d78b9a1428a6a9fcb6d0c95b5f448ecb730b20a7%2Fdashboard-legend.webp?alt=media)

`REF-43_03_felt_detail_panel`

![REF-43_03_felt_detail_panel](https://217108486-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FmRfGitkyjOEMvVsEyGWN%2Fuploads%2Fgit-blob-b8920f40fb7ee3bf60690839f66a24bade6db592%2Fstyle-panel-points.webp?alt=media)

**SOURCE:** Doc oficial https://help.felt.com/getting-started/tour-the-interface (Markdown via `.md`), https://help.felt.com/analysis-and-dashboards/dashboards , https://help.felt.com/layers/legend , https://help.felt.com/layers/filters (consultadas em 2026-10-07; imagens sem data).

**PROBLEM:** Mapas feitos por analistas precisam ser compartilhados como produto final para quem não é GIS, mas também editados rápido. Um dashboard de BI separa "relatório" do "mapa"; mapas de trabalho costumam virar telas de formulários.

**SOLUTION:** Um único canvas com cinco partes fixas: barra superior (ferramentas), **legenda** à esquerda (em modo de visualização é o que o leitor vê; em edição ganha a aba List), **painel de detalhe** à direita (abre ao selecionar layer/anotação), **tabela** em gaveta inferior e o próprio mapa. Para mapas-dashboard, **"componentes"** (estatística, barra, histograma, linha, filtro, série temporal) vivem *dentro da legenda*, abaixo de cada layer.

**OBSERVE:**
- Barra superior (inspeção visual): menu Felt + "Drafts > Household income" à esquerda; ferramentas centrais só em edição (7 ícones; a doc lista Add to map, Data sources, Upload Anything, Analysis, Dashboards, Developer Platform e Map settings); à direita: pessoas, basemap, tabela, busca, comentário, Felt AI, Share, **Done**.
- Legenda (inspeção visual): cartão flutuante translúcido sobre o mapa, com abas "Legend | List", título da camada, descrição da fonte e classes coloridas (16,31K – 52,43K …); cor de fundo do cartão adota matiz da camada (rosa claro).
- Detail panel (inspeção visual): cartão flutuante à direita com uma fileira de ícones de ação (funções não confirmadas) e abas Style/Filter/Components/Data; seção General (Type: Color range, Color by, Steps: Jenks 4), fill com rampa de 4 cores, stroke, casing, opacity (90%), position ("Below water and roads").
- Tabela (inspeção visual): gaveta inferior com abas "All | Visible", busca, adicionar coluna, download, expandir, fechar; coluna de rótulo + colunas numéricas alinhadas à direita.
- Controles de mapa (inspeção visual): flutuantes no canto inferior (localizar, −, +, "?"); escala gráfica no canto inferior esquerdo; atribuição "Made with Felt. Data from OpenStreetMap U.S. Census Bureau".
- Componentes na legenda (inspeção visual): "Global Projects" com categorias coloridas (Active, In Progress, Complete, Pending, On Hold), duas estatísticas ("Total Projects 136", "Total Contract Value $3.08b"), barras horizontais "Projects by Market Sector" com contagem e "Show 6 more", e um histograma de "Start date" (Feb 2019 – Apr 2027).
- Filtro por clique (doc): barra → filtra layer clicando; histograma e série temporal filtram arrastando um intervalo; Filter component = dropdown/slider; menu de contagem "631 of 1,930 features".
- Modos (doc): abre em modo de visualização; **Shift+E** entra em edição; "Done" sai e salva.

**INTERACTION:**
1. Abrir mapa em modo visualização: legenda e mapa; clicar numa categoria da legenda/componente filtra o layer.
2. Arrastar no histograma/série temporal para filtrar por intervalo; contagem de feições atualiza.
3. Clicar numa feição: pop-up/painel de detalhe.
4. "Open table" (Shift+4) para ver linhas; alternar All vs. Visible.
5. Shift+E → modo edição: ferramentas e aba List aparecem; selecionar layer → painel de detalhe (Style/Filter/Components/Data).

**WHY IT WORKS:** A legenda deixa de ser decoração e vira o painel de controle do mapa: o mesmo componente explica as cores *e* filtra. Visualização e edição são o mesmo canvas, só mudando o conjunto de ferramentas; painéis flutuam sobre o mapa em vez de empurrá-lo.

**ADAPT TO BIWEB:** O padrão "legenda interativa com estatísticas e gráficos por camada" resolve bem o modo leitura do BIWEB (barra de contexto + inspector) sem precisar de um grid de widgets separado do mapa. A gaveta de tabela "All/Visible" é uma boa forma de ligar o mapa ao modelo semântico (ver os dados da camada visível). A separação view mode × edit mode com atalho único é compatível com o modo leitura.

**DO NOT COPY:** Sistema de cores/tipografia do Felt; ícones; o modelo de "components por layer" exatamente como está (o BIWEB tem relatório e semântica próprios).

---

---

### REF-44 — ArcGIS Online Map Viewer (novo) — duas barras de ferramentas (Contents escura + Settings clara)

**IMAGES:**
- `arcgis-mv-overview` — https://doc.arcgis.com/en/arcgis-online/get-started/GUID-5B48FE78-9CF7-4E48-B201-FC7D1E21470C-web.png — "County health outcomes map in Map Viewer with the Contents and Settings toolbars displayed" (4059×1957) — status: VERIFICADA/inspecionada
- `arcgis-mv-layers-pane` — https://doc.arcgis.com/en/arcgis-online/get-started/GUID-3163FE29-D204-47E6-B3A7-CA6E0A9A153F-web.png — alt "Layers pane": painel "Layers" com grupo "County Health Rankings 2025", camadas Nation/State/County e menu "…" (Zoom to layer, Show properties, Show table, Rename, Save as, Duplicate, Remove, Group, Move) — status: VERIFICADA/inspecionada
- `arcgis-mv-legend-pane` — https://doc.arcgis.com/en/arcgis-online/get-started/GUID-00D39EFD-D709-4FC9-9201-624A1EF45673-web.png — alt "Legend pane" — status: VERIFICADA/só alt


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-44_01_arcgis_mv_overview`

![REF-44_01_arcgis_mv_overview](https://doc.arcgis.com/en/arcgis-online/get-started/GUID-5B48FE78-9CF7-4E48-B201-FC7D1E21470C-web.png)

`REF-44_02_arcgis_mv_layers_pane`

![REF-44_02_arcgis_mv_layers_pane](https://doc.arcgis.com/en/arcgis-online/get-started/GUID-3163FE29-D204-47E6-B3A7-CA6E0A9A153F-web.png)

`REF-44_03_arcgis_mv_legend_pane`

![REF-44_03_arcgis_mv_legend_pane](https://doc.arcgis.com/en/arcgis-online/get-started/GUID-00D39EFD-D709-4FC9-9201-624A1EF45673-web.png)

**SOURCE:** https://doc.arcgis.com/en/arcgis-online/get-started/get-started-with-mv.htm (doc oficial, consultada em 2026-10-07).

**PROBLEM:** GIS completo tem centenas de opções (estilos, filtros, efeitos, agregação, rótulos, análise). Mostrar tudo de uma vez intimida; escondê-lo atrás de menus profundos torna o trabalho lento.

**SOLUTION:** Duas barras verticais com papéis diferentes: **Contents** (escura, à esquerda) cuida do *mapa* (adicionar, camadas, tabelas, basemap, legenda, bookmarks, charts, salvar, compartilhar, imprimir) e **Settings** (clara, à direita) cuida da *camada selecionada* (Properties, Styles, Filter, Effects, Aggregation, Pop-ups, Fields, Labels, Configure charts, Analysis, Add sketch, Map tools). Selecionar uma camada muda as opções disponíveis.

**OBSERVE:**
- (inspeção visual) Barra esquerda escura com 14 itens com rótulo de texto + ícone (Add, Layers, Tables, Basemap, Legend, Bookmarks, Charts, Save and open, Map properties, Review map, Share map, Embed map, Create app, Print), separados em grupos por divisores, e rodapé com "Information" e "Collapse".
- (inspeção visual) Barra direita clara com itens de camada separados por divisores em 4 grupos (configuração da camada; Configure charts/Analysis; Add sketch; Map tools) e rodapé "Collapse"; os painéis (Layers, Legend, Styles…) abrem ao lado das barras, e o mapa ocupa o centro inteiro.
- (inspeção visual) Controles do mapa flutuantes no canto inferior direito, em coluna: 5 ícones sem rótulo (busca, home e um ícone de chevrons são reconhecíveis; os demais não confirmados) e zoom +/−.
- (inspeção visual) Pop-up de feição ancorado no ponto clicado: título "Costilla County, CO", ações em linha (Table, Get directions, Zoom to), texto descritivo, ícones para acoplar/minimizar/fechar.
- (inspeção visual) Mapa coroplético com dois tons: vermelho (pior) vs. cinza-azulado (melhor) sobre basemap escuro.
- (doc) Camadas desenham na ordem do painel; "Exclusive visibility" para grupos; **o botão Clustering só aparece quando uma camada de pontos está selecionada** — opções dependem do tipo de camada; mudanças aparecem instantaneamente no mapa; atalhos de teclado (Alt/Option+?).
- (doc) Botão "Hide interface" recolhe as duas barras de uma vez; cada barra tem Expand/Collapse.

**INTERACTION:**
1. Selecionar uma camada em Layers (barra escura) → a barra clara passa a mostrar opções dessa camada.
2. Styles → escolher estilo inteligente (dot density, heatmap…); Filter; Aggregation/clustering; Pop-ups; Labels.
3. Clicar numa feição no mapa → pop-up.
4. Collapse/Hide interface para maximizar o mapa; compartilhar/imprimir pela barra escura.

**WHY IT WORKS:** Separar "o mapa" de "a camada selecionada" mantém cada barra curta e previsível; opções que só valem para certos tipos de camada aparecem só quando aplicáveis; os painéis laterais deixam o centro livre.

**ADAPT TO BIWEB:** O modelo "barra de conteúdo + barra de propriedades dependente da seleção" é uma versão em GIS do inspector contextual do BIWEB; mostra que um mapa com camadas (marcadores, clusters, heatmap, polígonos) pede um painel de camadas persistente que o relatório padrão não tem. Colapsar toda a UI em um clique ajuda no modo leitura.

**DO NOT COPY:** Barra esquerda com 14 itens de uma vez; a paleta Esri; o menu "Analysis" e a profundidade de configuração GIS (o BIWEB não é um GIS completo).

---

---

### REF-45 — CARTO Builder — Sources / Widgets / Interactions / Legend / Settings

**IMAGES:**
- `carto-builder-widgets-tab` — https://3029946802-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FybPdpmLltPkzGFvz7m8A%2Fuploads%2Fgit-blob-1812fe73640f65bfe957e5c8495d709412795c92%2Fimage.png?alt=media — Builder com abas de ícones (layers, widgets, interactions, legend, map settings) e painel "Widgets" vazio com "New widget"; mapa H3 dos EUA com busca de localização e zoom — status: VERIFICADA/inspecionada
- `carto-builder-widget-config` — https://3029946802-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FybPdpmLltPkzGFvz7m8A%2Fuploads%2Fgit-blob-83e868e979592d9ff0e3720287024e7e691fbbc0%2Fimage.png?alt=media — configuração de "Widget 1": tipos (Formula, Category, Histogram, Range…), seção Data (COUNT), Display options, e o widget "31242" num painel à direita do mapa — status: VERIFICADA/inspecionada
- `carto-popup-vs-infopanel` — https://3029946802-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FybPdpmLltPkzGFvz7m8A%2Fuploads%2Fgit-blob-f7c6e6fb74b8b645dee267ab421a6f7290ca28e3%2Fpopup-vs-infopanel.png?alt=media — comparação "Pop-up window" × "Info panel" (FEATURE DETAILS à direita) — status: VERIFICADA/inspecionada
- Extra: https://3029946802-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FybPdpmLltPkzGFvz7m8A%2Fuploads%2Fgit-blob-22ae821bbc9029273e56fe98e7e739a6d0be1da7%2Fcross-filtering.gif?alt=media — GIF "cross-filtering" (HTTP 200, image/gif, ~3 MB) — status: VERIFICADA/só alt


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-45_01_carto_builder_widgets_tab`

![REF-45_01_carto_builder_widgets_tab](https://3029946802-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FybPdpmLltPkzGFvz7m8A%2Fuploads%2Fgit-blob-1812fe73640f65bfe957e5c8495d709412795c92%2Fimage.png?alt=media)

`REF-45_02_carto_builder_widget_config`

![REF-45_02_carto_builder_widget_config](https://3029946802-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FybPdpmLltPkzGFvz7m8A%2Fuploads%2Fgit-blob-83e868e979592d9ff0e3720287024e7e691fbbc0%2Fimage.png?alt=media)

`REF-45_03_carto_popup_vs_infopanel`

![REF-45_03_carto_popup_vs_infopanel](https://3029946802-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FybPdpmLltPkzGFvz7m8A%2Fuploads%2Fgit-blob-f7c6e6fb74b8b645dee267ab421a6f7290ca28e3%2Fpopup-vs-infopanel.png?alt=media)

`REF-45_04_img4`

![REF-45_04_img4](https://3029946802-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FybPdpmLltPkzGFvz7m8A%2Fuploads%2Fgit-blob-22ae821bbc9029273e56fe98e7e739a6d0be1da7%2Fcross-filtering.gif?alt=media)

**SOURCE:** Doc oficial https://docs.carto.com/carto-user-manual/maps/widgets , https://docs.carto.com/carto-user-manual/maps/interactions , https://docs.carto.com/carto-user-manual/maps/layers , https://docs.carto.com/carto-user-manual/maps/legend (Markdown via `.md`; consultadas em 2026-10-07; screenshots podem ser de versões anteriores, a doc cita captura de 2025-10 na página de AI Agents).

**PROBLEM:** Analistas de dados que vêm de um data warehouse precisam criar mapas analíticos interativos e publicá-los; um GIS desktop é pesado e um dashboard BI comum não entende viewport.

**SOLUTION:** Um editor com abas verticais por responsabilidade (fontes+camadas, widgets, interações, legenda, configurações) e um painel lateral de widgets que *agregam dados no viewport* ou globalmente, e que *filtram o mapa* (cross-filtering). Cada fonte vira camada na hora.

**OBSERVE:**
- (inspeção visual) Barra superior escura: nome do mapa "H3 Spatial Features – USA", "Updated", Share; segunda barra: 5 ícones de abas à esquerda; centro: "Map view" com dois ícones (2D/3D, inferido), um ícone de painéis divididos e um ícone de polígono com dropdown (funções inferidas, não confirmadas no texto); direita: info e alternar painel de widgets.
- (inspeção visual) Mapa com campo "Search location", botão localizar-me, zoom +/− com nível exibido ("3") e botão de camadas de basemap no canto; atribuição CARTO/OSM.
- (inspeção visual) Widget Formula "31242" como cartão com título e número grande no painel direito (colapsável); configuração do widget no painel esquerdo com um seletor horizontal de tipos de widget.
- (doc) Tipos: Formula, Category, Pie, Histogram, Range, Time Series (também anima o mapa), Table. Modos: **Global** (dado inteiro) × **Viewport** (recalcula conforme o mapa se move). Cross-filtering: filtra uma ou várias fontes que compartilham propriedade.
- (doc) Interações por camada: Click (**Filter by feature**, pop-up/info panel) e Hover; "Filter by feature" tem escopo "só esta camada" ou "todas as camadas nas áreas selecionadas" (máscara espacial; só polígono/H3/Quadbin); Shift+clique adiciona seleção; Esc limpa; filtros afetam widgets, exportação de PDF e de dados.
- (inspeção visual) Pop-up (cartão sobre o mapa com tag "TOP 10%", valor grande, endereço, tamanho) vs. Info panel (painel lateral "FEATURE DETAILS" com pares campo-valor e a feição contornada em azul no mapa).
- (doc) Camadas: grupos, visibilidade por zoom, agregação por geometria (H3, quadbin), 3D; legenda editável com toggle por camada.

**INTERACTION:**
1. Adicionar fonte de dados → camada criada automaticamente → estilizar.
2. Aba Widgets → New widget → escolher fonte → tipo (Formula/Category/Histogram/Range/Time Series/Table) → agregação (COUNT/AVG/MAX/MIN/SUM).
3. Marcar o widget como Viewport ou Global; ligar cross-filtering.
4. Aba Interactions → habilitar clique/hover por camada → escolher pop-up ou info panel; opcionalmente "Filter by feature".
5. Publicar/compartilhar; o consumidor usa widgets, hover e clique.

**WHY IT WORKS:** Cada aba tem uma responsabilidade clara, então o autor sempre sabe onde mexer; widgets que seguem o viewport transformam *navegação no mapa* em *consulta analítica*, sem exigir que o usuário construa filtros.

**ADAPT TO BIWEB:** O "Viewport vs. Global" é um conceito diretamente reaproveitável no filtro geográfico do BIWEB (cards de KPI que respondem ao mapa visível). A escolha pop-up × info panel por camada mostra como o inspector contextual pode ter dois modos. "Filter by feature" com escopo (esta camada × todas) é um modelo concreto para filtro cruzado em mapas.

**DO NOT COPY:** O fluxo "fonte → camada automática" (depende de warehouse), a paleta/ícones e as 5 abas verticais como estrutura final.

---

---

#### Open-source technology notes (network viz & map)

Licença e estrelas vêm da API do GitHub (`stargazers_count`, `pushed_at`, `releases/latest`) consultada em 2026-10-07 após reset do rate limit; versões/datas de pacote vêm do registro npm (`registry.npmjs.org`). Onde o campo está "—" a API não retornou (NÃO VERIFICADO). Sem decisão arquitetural. Repositório do código do TeleGeography Submarine Cable Map: nome não confirmado (404 no nome tentado) — NÃO VERIFICADO.

| Biblioteca | Finalidade | Licença | Maturidade (GitHub stars / último push / release; npm) | URL | Por que pode interessar ao BIWEB |
|---|---|---|---|---|---|
| Cytoscape.js | Grafos/redes interativos (nós, arestas, layouts, estilos por dados) | MIT | 11.234 stars; push 2026-10-06; release v3.34.3 (2026-09-07); npm cytoscape 3.34.3 (2026-09-07); licença npm MIT | https://js.cytoscape.org | Estilos de nó/aresta dirigidos por dados e eventos de seleção prontos; útil para um modo "topologia" sem mapa. |
| Sigma.js (+ graphology) | Renderização WebGL de grafos grandes; graphology = estrutura de grafo | MIT | 12.181 stars; push 2026-10-05; release sigma@4.0.0-beta.8 (2026-10-05); npm sigma 3.0.3 (2026-04-30); licença npm MIT | https://www.sigmajs.org | WebGL para milhares de nós e arestas; graphology (0.26.0) é a base de dados do grafo. Nota: o GitHub mostra 4.0.0-beta.8 como release mais recente (pré-release); o npm latest é 3.0.3. |
| cosmos.gl (Cosmograph engine) | Force graph 100% GPU (layout + render) | MIT | 1.289 stars; push 2026-10-07; release v3.5.0 (2026-10-05); npm @cosmos.gl/graph 3.5.0 (2026-10-05); licença npm MIT | https://github.com/cosmosgl/graph | Escala de dezenas de milhares a milhões de nós; atenção: o toolset @cosmograph/* é CC-BY-NC-4.0 (ver observações). |
| deck.gl | Camadas WebGL2/WebGPU sobre mapas (Arc, Trips, Heatmap, Hexagon, Scatterplot) | MIT | 14.632 stars; push 2026-10-07; release v9.4.0 (2026-09-05); npm deck.gl 9.4.0 (2026-09-05); licença npm MIT | https://deck.gl | Arcos para links com intensidade, TripsLayer para replay, Heatmap/Hexagon para densidade de incidentes — já previsto na arquitetura. |
| MapLibre GL JS | Mapa vetorial WebGL (base, fontes GeoJSON, clusters nativos) | NOASSERTION (GitHub) / BSD-3-Clause (npm) | 11.816 stars; push 2026-10-07; release v6.13.0 (2026-10-06); npm maplibre-gl 6.13.0 (2026-10-06); licença npm BSD-3-Clause | https://maplibre.org | Base de mapa já prevista; clusters nativos de GeoJSON e camada heatmap. |
| kepler.gl | Aplicação/biblioteca React de exploração geoespacial sobre deck.gl | MIT | 12.036 stars; push 2026-10-06; release v3.3.0-alpha.15 (2026-09-28); npm kepler.gl 3.3.0-alpha.15 (2026-09-28); licença npm MIT | https://kepler.gl | Referência de implementação de filtros de tempo, playback, brush e tooltips sobre deck.gl; também reutilizável como componente. |
| supercluster | Clustering geográfico rápido de pontos | ISC | 2.382 stars; push 2026-09-03; release v9.1.0 (2026-09-03); npm supercluster 9.1.0 (2026-09-03); licença npm ISC | https://github.com/mapbox/supercluster | Clusters com contagem e zoom-to-expand para marcadores de incidentes/sites. |
| h3-js | Índice hexagonal H3 (agregação espacial) | Apache-2.0 | 1.089 stars; push 2026-08-24; release v4.5.0 (2026-07-01); npm h3-js 4.5.0 (2026-07-01); licença npm Apache-2.0 | https://h3geo.org | Base para agregação hexagonal de incidentes por resolução/zoom. |
| AntV G6 | Biblioteca de grafos/redes (layouts, combos, comportamentos) | MIT | 12.324 stars; push 2026-09-23; release 5.1.1 (2026-04-17); npm @antv/g6 5.1.1 (2026-05-08); licença npm MIT | https://g6.antv.antgroup.com | Combos (agrupamento/expansão de clusters) como o padrão do Datadog; layouts hierárquicos. |
| vis-network | Grafos em canvas com física e clustering | Apache-2.0 (GitHub) / Apache-2.0 OR MIT (npm) | 3.629 stars; push 2026-10-07; release v10.1.2 (2026-08-19); npm vis-network 10.1.2 (2026-08-19); licença npm Apache-2.0 OR MIT | https://github.com/visjs/vis-network | Clustering interativo de nós simples; API enxuta. |
| elkjs | Layout em camadas (Eclipse Layout Kernel) em JS | NOASSERTION (GitHub) / EPL-2.0 OR GPL-3.0-or-later (npm) | 2.804 stars; push 2026-10-06; release 0.12.0 (2026-07-17); npm elkjs 0.12.0 (2026-07-17); licença npm EPL-2.0 OR GPL-3.0-or-later | https://github.com/kieler/elkjs | Layout em camadas/esquerda→direita como o do path visualization e das topologias spine-leaf. |
| d3-force | Simulação de forças para layout de grafos | ISC | 2.004 stars; push 2023-12-30; release v3.0.0 (2021-06-05); npm d3-force 3.0.0 (2021-06-05); licença npm ISC | https://d3js.org/d3-force | Bloco básico de layout force-directed; sem renderização. |
| Network Weathermap NG (Grafana) | Painel Grafana de weathermap (nós/links A-Z, limiares, animação) | Apache-2.0 | 13 stars; push 2026-10-06; release v1.6.19 (2026-10-06) | https://grafana.com/grafana/plugins/tamirsuliman-weathermap-panel/ | Exemplo vivo de um editor de diagrama operacional dentro de painel; links com dois lados e limiares. Projeto pequeno (poucas estrelas); GitHub tem v1.6.19, o catálogo Grafana v1.6.16. |
| knightss27 weathermap-plugin (arquivado) | Plugin de weathermap original que o NG continua | — | stars: NÃO VERIFICADO (HTTP Error 404: Not Found); release: HTTP Error 404: Not Found | https://github.com/knightss27/weathermap-plugin | Histórico; a busca/página do Grafana o descreve como depreciado/arquivado, mas o repositório com este nome não foi encontrado na API (404) — NÃO VERIFICADO. |
| PHP Network Weathermap | Weathermap clássico (setas por utilização, escala de cores) | MIT | 428 stars; push 2024-06-07; release version-0.98a (2019-05-04) | https://github.com/howardjones/network-weathermap | Origem do idioma visual "seta meio-a-meio + escala"; sem atualização desde 2024. |
| NetBox Topology Views | Plugin NetBox: topologia a partir de cabos | Apache-2.0 | 1.100 stars; push 2026-09-24; release v4.7.0 (2026-09-18) | https://github.com/netbox-community/netbox-topology-views | Exemplo de topologia gerada de um inventário (filtros por nome/site/tag/role; export draw.io/PNG). |

Observações de licença relevantes:
- `@cosmograph/cosmograph` e `@cosmograph/react` (toolset de alto nível) e `@cosmograph/cosmos` (versões 3.x no npm) constam como **CC-BY-NC-4.0** (uso não comercial) no registro npm; o motor GPU foi movido para `cosmosgl/graph` (`@cosmos.gl/graph`) com licença MIT. Ler o LICENSE de cada pacote antes de qualquer uso comercial.
- `maplibre-gl`: o GitHub devolve `NOASSERTION` por conta do arquivo de licença; o npm indica BSD-3-Clause. Revalidar no repositório.
- `elkjs`: EPL-2.0 OR GPL-3.0-or-later (dual) — precisa de análise jurídica antes de bundle comercial.
- `d3-force`: sem release desde 2021 (estável, mas sem manutenção recente).

---

#### Padrões transversais

##### Nós, arestas, intensidade e saúde
| Pergunta de design | Evidência nas fichas |
|---|---|
| O que muda de tamanho? | Nó = valor da métrica (Datadog "Node Size" min/max, N3); contagem de membros em badge (N3, N2); marcador de cluster com número (N1) |
| O que muda de largura/cor na aresta? | Datadog: largura = métrica e roxo = top percentil 90 (N3). Kentik: cor sequencial por utilização 10%–90% (N1). ThousandEyes: espessura = nº de rotas que passam; vermelho = acima do limiar de delay (N2). Weathermap NG: 5 faixas fixas verde→vermelho (N4) |
| Direcionalidade | Kentik: rótulos por direção nas setas entre blocos e setas nas duas pontas nos links (N1); Weathermap NG: A e Z separados (N4); Datadog: animação de direção no hover (N3) |
| Saúde ≠ intensidade | Kentik separa em duas legendas: "Utilization & Traffic" (escala sequencial) e "Health" (Down/Critical/Degraded/Warning/Healthy), com anel segmentado no marcador (N1). ThousandEyes: anel vermelho em nó = perda; link vermelho = delay (N2) |
| Estado sem dados | Kentik: cinza "Unknown"; Weathermap NG: "n/a" em cinza |
| Escala visual | Cores discretas em degraus (Kentik, Weathermap) são lidas mais rápido que gradientes contínuos; gradiente contínuo só na legenda de grande volume (Kentik "0 … > 100 Gbits/s") |
| Tempo real | Kentik: saúde "no momento em que o mapa é acessado" + time range; Weathermap NG: carimbo de hora no rodapé; ArcGIS Dashboards: "Last updated a few seconds ago" (I3) |

##### Inspeção
- Hover = dado mínimo + destaque do vizinho; clique = detalhe completo no mesmo lugar (Kentik drawer, Felt painel, CARTO info panel).
- Drawer cujo conteúdo muda por tipo: site/device/interface/link/ASN (Kentik N1).
- Menu de ações curto no clique (Kentik: View Topology / Show Details / Show Connections / Show Path To; Datadog: Inspect).
- Fixar/selecionar (ThousandEyes "Select" com contorno tracejado animado; kepler.gl pin de tooltip) e **persistir na URL** (ThousandEyes) para compartilhar evidência.
- Link como objeto de primeira classe: tem seu próprio drawer ("Traffic Details", Kentik) e tooltip (ThousandEyes).

##### Legendas
- Legenda dentro do canvas e com valores reais (min/max) — Datadog "Edge Width | Value", Kentik, Weathermap NG.
- Legenda como controle (Felt: categorias da legenda filtram; CARTO: toggle por camada, legenda editável).
- Declarar o que não aparece: "0 of 2,848 displayed" (Datadog), "631 of 1,930 features" (Felt).

##### Camadas
- Camadas por *conceito de domínio* (Kentik: Links, Utilization, Health, Clustering, Cloud Regions) em vez de por tipo geométrico; ícone com contador no canto do mapa.
- Camadas de agregação trocáveis sobre os mesmos dados (kepler.gl: ponto → cluster → heatmap → hexbin).
- Atenção: seleção por feição não funciona em camada agregada (ArcGIS: "layer actions não suportadas com clustering/binning").
- Visibilidade por zoom e agrupamento de camadas (CARTO; ArcGIS Map Viewer).

##### Timeline + filtros + detalhes
- Linha do tempo com *distribuição* (histograma kepler.gl; beeswarm Cloudflare) em vez de slider cego.
- Janela deslizante com duas alças + velocidade (kepler.gl) + opção de trocar o eixo Y.
- Filtros viram "cards" removíveis (Kentik) e valem para o drawer de detalhe.
- Mapa como filtro espacial dos demais widgets (ArcGIS Dashboards "Filter (spatial)", CARTO "Viewport" mode).
- Lista ↔ mapa: zoom, pan, flash e pop-up (ArcGIS Dashboards).
- Estado confirmado × suspeito separado por toggle e coluna Verified (Cloudflare Radar).

##### Map workspace vs. relatório padrão

| Dimensão | Dashboard/relatório padrão (referência BI do REFERENCE_PACK_BI) | Map workspace / GIS (evidência nas fichas) |
|---|---|---|
| Unidade de composição | Grade de visuais (cards) de tamanho fixo | Um canvas contínuo de mapa; os painéis flutuam sobre ele (Felt, ArcGIS MV) |
| Painel de camadas | Não existe; cada visual tem seus campos | Painel de camadas persistente com ordem de desenho, visibilidade, agrupamento (ArcGIS "Layers", Felt "List", CARTO "Layers") |
| Legenda | Legenda do gráfico dentro do visual | Legenda do mapa como painel/cartão próprio, às vezes interativa (Felt) |
| Escopo de filtro | Página/relatório/visual | **Viewport** e geometria (CARTO Viewport/Global; ArcGIS Filter spatial) além de atributo |
| Seleção | Cross-highlight entre visuais | Seleção por feição, por área desenhada, shift+clique, máscara espacial (CARTO) |
| Inspeção | Tooltip do visual / drill | Pop-up ancorado na feição *ou* painel de detalhe (CARTO, ArcGIS, Felt) |
| Navegação | Paginação/abas | Pan/zoom, busca de localização, bookmarks, home, localizar-me |
| Tempo | Filtro de data / slicer | Barra de playback com janela deslizante e histograma (kepler.gl) |
| Controles flutuantes | Raros | Zoom, busca, home, camadas de basemap, expandir (todos) |
| Estados de uso | Editar × ler | Ver × editar no mesmo canvas, com atalho (Felt Shift+E; ArcGIS "Hide interface") |
| Densidade de dados | Dezenas a milhares de linhas agregadas | Milhares–milhões de feições: agregação (cluster/bin/H3/heatmap), tiles, "N de M exibidos" |
| Tabela | Visual de tabela na página | Gaveta de tabela "All × Visible" ligada ao mapa (Felt); ArcGIS "Show table" por camada |

---


---

## 10 — 3D Urban / Street GIS

**Pergunta da área:** que abordagens modernas, principalmente open source, permitem um mapa urbano 3D (ruas, prédios, terreno, infraestrutura, caminhos de rede, incidentes, sites, tilt, popups)? Não se busca Street View fotográfico.
**Aprendizados-chave:** MapLibre entrega base vetorial + extrusão de prédios + terreno; deck.gl entrega camadas de dados em GPU (colunas, arcos, trips, scenegraph, picking); CesiumJS entrega globo, 3D Tiles e precisão, mas depende de conteúdo Cesium ion. **Esta seção apresenta trade-offs, não decide arquitetura.** Atenção a ODbL/atribuição e a endpoints públicos sem SLA.

### REF-46 — MapLibre GL JS / prédios 3D (fill-extrusion), extrusão de polígonos e raycast em 3D Tiles
**IMAGES:**
- ml-buildings-3d — https://maplibre.org/maplibre-gl-js/docs/assets/examples/display-buildings-in-3d.webp — Exemplo oficial "Display buildings in 3D": Manhattan com prédios extrudados, rótulos e ícones de metrô — status: VERIFICADA (HTTP 200, image/webp), inspecionada
- ml-extrude-indoor — https://maplibre.org/maplibre-gl-js/docs/assets/examples/extrude-polygons-for-3d-indoor-mapping.webp — Exemplo oficial "Extrude polygons for 3D indoor mapping": planta de museu com salas extrudadas em cores distintas, translúcidas, sobre mapa OSM — status: VERIFICADA (HTTP 200, image/webp), inspecionada
- ml-raycast-3dtiles — https://maplibre.org/maplibre-gl-js/docs/assets/examples/raycast-3d-tiles-using-threejs.webp — Exemplo oficial "Raycast 3D Tiles using Three.js": malha fotogramétrica de um prédio, seta amarela no ponto de impacto e painel superior com lon/lat/alt e ECEF — status: VERIFICADA (HTTP 200, image/webp), inspecionada


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-46_01_ml_buildings_3d`

![REF-46_01_ml_buildings_3d](https://maplibre.org/maplibre-gl-js/docs/assets/examples/display-buildings-in-3d.webp)

`REF-46_02_ml_extrude_indoor`

![REF-46_02_ml_extrude_indoor](https://maplibre.org/maplibre-gl-js/docs/assets/examples/extrude-polygons-for-3d-indoor-mapping.webp)

`REF-46_03_ml_raycast_3dtiles`

![REF-46_03_ml_raycast_3dtiles](https://maplibre.org/maplibre-gl-js/docs/assets/examples/raycast-3d-tiles-using-threejs.webp)

**SOURCE:**
- https://maplibre.org/maplibre-gl-js/docs/examples/display-buildings-in-3d/ (docs oficiais, exemplo) — código lido em https://raw.githubusercontent.com/maplibre/maplibre-gl-js/main/test/examples/display-buildings-in-3d.html (criado 2025-06-25 segundo meta do arquivo)
- https://maplibre.org/maplibre-gl-js/docs/examples/extrude-polygons-for-3d-indoor-mapping/ (docs oficiais, exemplo)
- https://maplibre.org/maplibre-gl-js/docs/examples/raycast-3d-tiles-using-threejs/ (docs oficiais, exemplo; meta "created" 2026-10-05, ou seja, recentíssimo)
- Versão MapLibre GL JS v6.13.0 (release 2026-10-03; npm 2026-10-06).

**PROBLEM:** Dar noção de volume urbano (altura dos edifícios, massa construída) a um mapa vetorial leve, sem baixar modelos 3D pesados, e permitir que o usuário incline a câmera para "ler" a cidade.

**SOLUTION:** Camada de estilo `fill-extrusion` sobre a source vetorial `building` (OpenFreeMap, derivada de OSM/OpenMapTiles). Altura vem dos atributos `render_height` e `render_min_height`; cor é rampa por altura (cinza claro, azul royal, azul claro). A camada é inserida abaixo da primeira camada de rótulo para o texto ficar legível. No exemplo de indoor, um GeoJSON simples (propriedades `color`, `height`) vira salas extrudadas. No exemplo de raycast, o plugin `maplibre-gl-three` + `3d-tiles-renderer` (versão 0.5.3, via CDN) carrega um tileset 3D Tiles e o clique devolve o ponto de impacto em WGS84 e ECEF.

**OBSERVE:**
- Câmera inicial inclinada: `pitch: 45`, `bearing: -17.6`, `zoom: 15.5` (valores do código). O primeiro frame já "vende" o 3D.
- Prédios só aparecem a partir de `minzoom: 15` e a altura é interpolada de 0 a `render_height` entre zoom 15 e 16, então eles "crescem" ao dar zoom (transição, sem pop-in brusco).
- Rampa de cor por altura codifica um atributo de dado (altura) em cor: arranha-céus azuis, edifícios baixos cinza (visto na imagem inspecionada).
- Rótulos de estações e vias ficam por cima dos volumes (camada inserida antes do primeiro `symbol` com `text-field`).
- No indoor, as extrusões são translúcidas, deixando ver o mapa embaixo; cores por sala/uso vêm do dado, não do estilo.
- No raycast, o painel de texto fixo no topo mostra coordenadas do ponto clicado; a UI do exemplo diz apenas "Click the 3D model to raycast".

**INTERACTION:**
1. Abrir o exemplo: mapa já aparece inclinado sobre o Lower Manhattan.
2. Arrastar com botão principal para pan; botão direito/ctrl+arrastar (ou dois dedos no toque) para girar e inclinar (handlers DragRotate / TwoFingersTouchPitch listados na API).
3. Dar zoom até 15–16 e ver as alturas crescerem.
4. (Raycast) Clicar no modelo 3D; aparece seta no ponto e as coordenadas no painel.
   Popup e seleção de feature de prédio NÃO fazem parte do exemplo de prédios; a API tem `Popup` e `queryRenderedFeatures` (classe `Popup` listada em docs/API), mas isso não foi demonstrado nestes exemplos.

**WHY IT WORKS:** O 3D é só "um estilo a mais" no mesmo motor do mapa 2D: sem nova biblioteca, sem formato novo, com dados que já existem (altura de OSM). A transição por zoom evita o custo visual de desenhar milhares de prédios em zoom baixo.

**ADAPT TO BIWEB:** Um toggle "2D/3D" em um mapa de camadas poderia apenas mudar `pitch` e ligar uma camada `fill-extrusion` ligada ao semantic layer (ex.: cor por KPI do bairro, altura por contagem de clientes). A mesma base MapLibre já citada nos docs de arquitetura serviria; o raycast/3D Tiles é um passo adicional separado, não necessário para prédios.

**DO NOT COPY:** O estilo "Bright" de terceiros e o endpoint público OpenFreeMap sem plano de contingência; as cores `royalblue/lightgray` como paleta de dados (não são acessíveis para daltônicos nem seguem tokens de marca); o CDN `jsdelivr` do 3d-tiles-renderer em produção.

---

---

### REF-47 — MapLibre GL JS / terreno 3D, céu/neblina, controles de navegação e camadas que seguem o relevo
**IMAGES:**
- ml-terrain3d — https://maplibre.org/maplibre-gl-js/docs/assets/examples/3d-terrain.webp — Exemplo "3D Terrain": Innsbruck com relevo sombreado em 3D, controles zoom (+/-), bússola com pitch e botão de terreno à direita — status: VERIFICADA (HTTP 200, image/webp), inspecionada
- ml-sky-fog — https://maplibre.org/maplibre-gl-js/docs/assets/examples/sky-fog-terrain.webp — Exemplo "Sky, Fog, Terrain": painel de ajuste (enabled, sky-color, horizon-color, fog-color, três sliders de mistura) sobre terreno com céu em gradiente; controles incluem globo — status: VERIFICADA (HTTP 200, image/webp), inspecionada
- ml-custom-terrain — https://maplibre.org/maplibre-gl-js/docs/assets/examples/add-custom-layers-that-follow-the-terrain.webp — Exemplo "Add custom layers that follow the terrain": grade vermelha drapejada sobre relevo alpino e pontos azuis "em pé" sobre o terreno — status: VERIFICADA (HTTP 200, image/webp), inspecionada


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-47_01_ml_terrain3d`

![REF-47_01_ml_terrain3d](https://maplibre.org/maplibre-gl-js/docs/assets/examples/3d-terrain.webp)

`REF-47_02_ml_sky_fog`

![REF-47_02_ml_sky_fog](https://maplibre.org/maplibre-gl-js/docs/assets/examples/sky-fog-terrain.webp)

`REF-47_03_ml_custom_terrain`

![REF-47_03_ml_custom_terrain](https://maplibre.org/maplibre-gl-js/docs/assets/examples/add-custom-layers-that-follow-the-terrain.webp)

**SOURCE:**
- https://maplibre.org/maplibre-gl-js/docs/examples/3d-terrain/ (docs oficiais; código em test/examples/3d-terrain.html, criado 2023-06-27)
- https://maplibre.org/maplibre-gl-js/docs/examples/sky-fog-terrain/ (docs oficiais)
- https://maplibre.org/maplibre-gl-js/docs/examples/add-custom-layers-that-follow-the-terrain/ (docs oficiais; arquivo com data 2026-09-30)
- MapLibre GL JS v6.13.0.

**PROBLEM:** Mostrar relevo real (morros, vales) e a "sensação de horizonte" sem Cesium, e manter sobre o terreno os elementos de dados (linhas, pontos, grade) em vez de flutuarem ou ficarem enterrados.

**SOLUTION:** Source `raster-dem` (tiles de elevação; no exemplo `https://tiles.mapterhorn.com/tilejson.json`, formato Terrarium/webp) ligada a `terrain: {source, exaggeration}` no estilo; uma segunda source DEM separada alimenta a camada `hillshade` (o código comenta que usar fontes separadas melhora a qualidade de render). `sky: {}` ativa céu/horizonte; `map.setSky()` ajusta cores e mistura. `NavigationControl({visualizePitch: true})` e `TerrainControl` dão os botões. `maxPitch: 85` libera câmera quase horizontal. O exemplo mais recente usa camadas custom com `renderToTerrainTile` (grade desenhada no tile de terreno, drapejada) e pontos com `renderingMode: '3d'` elevados por shader com o heightmap.

**OBSERVE:**
- A bússola do NavigationControl com `visualizePitch` mostra o ângulo de inclinação visualmente (ícone muda), serve de feedback de câmera.
- Botão dedicado de terreno (ícone de montanha) liga/desliga o relevo: toggle 2D plano ↔ 3D com relevo sem trocar de mapa.
- Painel de sliders no exemplo de sky/fog expõe literalmente os parâmetros do estilo (sky-color, horizon-color, fog-color, blends): bom modelo de "painel de propriedades" para um tema 3D.
- Pitch inicial alto (70 no terreno, 77 no sky) com `hash: true` (câmera na URL, compartilhável).
- A grade drapejada acompanha o relevo (linhas "deitam" na encosta), enquanto os pontos azuis ficam "plantados" sobre as cristas: duas estratégias (drape vs. elevação por ponto) visíveis na mesma imagem.
- O mesmo exemplo usa o estilo Liberty do OpenFreeMap como base e `maxPitch: 85`.

**INTERACTION:**
1. Abrir o exemplo de terreno com pitch alto: já se vê relevo.
2. Usar +/- para zoom; clicar na bússola para voltar ao norte; arrastar o ícone/rotacionar para inclinar.
3. Clicar no botão de terreno para ligar/desligar a elevação.
4. No exemplo de sky/fog, mover cor e sliders e ver o horizonte mudar em tempo real; marcar/desmarcar "enabled" desliga o céu.
5. No exemplo custom, orbitar a câmera e conferir que grade e pontos continuam "colados" no relevo.

**WHY IT WORKS:** O relevo é o que dá "escala geográfica" ao pitch: sem terreno, uma câmera inclinada só mostra um plano. Fog e sky ocultam o limite de carregamento de tiles no horizonte, o que também reduz custo de renderização.

**ADAPT TO BIWEB:** Para cenários como rede de telecom/utilities em região acidentada, MapLibre com terreno permitiria mostrar torres e rotas já sobre o relevo, reaproveitando MapLibre do plano de arquitetura. Os controles (bússola com pitch, botão de terreno) são um vocabulário de câmera pronto e pequeno para um mapa 3D "progressivo": começa 2D, o usuário revela o 3D.

**DO NOT COPY:** O tile server `a.tile.openstreetmap.org` do exemplo (a política da OSMF proíbe uso pesado/produção e não há SLA); a dependência de um endpoint público gratuito de terreno sem plano de self-host; cores berrantes (azul/verde/vermelho) do exemplo de sky; camadas custom em WebGL cru (alto custo de manutenção, preferir deck.gl/TerrainExtension quando possível).

---

---

### REF-48 — deck.gl / camadas de dados 3D: TripsLayer sobre prédios, ScenegraphLayer, ArcLayer
**IMAGES:**
- deck-trips — https://deck.gl/images/examples/trips-layer.jpg — Exemplo oficial "TripsLayer": Manhattan à noite, prédios extrudados cinza sobre fundo azul-marinho, trilhas de viagens em laranja/branco/azul pelas vias, sombras longas — status: VERIFICADA (HTTP 200, image/jpeg), inspecionada
- deck-scenegraph — https://deck.gl/images/examples/scenegraph-layer.jpg — Exemplo oficial "ScenegraphLayer": dezenas de modelos 3D (aviões glTF) orientados sobre base escura inclinada — status: VERIFICADA (HTTP 200, image/jpeg), inspecionada
- deck-arc — https://deck.gl/images/examples/arc-layer.jpg — Exemplo oficial "ArcLayer": feixe de arcos coloridos saindo de um ponto na América do Norte, base clara — status: VERIFICADA (HTTP 200, image/jpeg), inspecionada


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-48_01_deck_trips`

![REF-48_01_deck_trips](https://deck.gl/images/examples/trips-layer.jpg)

`REF-48_02_deck_scenegraph`

![REF-48_02_deck_scenegraph](https://deck.gl/images/examples/scenegraph-layer.jpg)

`REF-48_03_deck_arc`

![REF-48_03_deck_arc](https://deck.gl/images/examples/arc-layer.jpg)

**SOURCE:**
- https://deck.gl/examples (galeria oficial; páginas individuais como https://deck.gl/examples/trips-layer são renderizadas por JS, por isso a interação ao vivo NÃO foi testada em navegador)
- Código lido: https://raw.githubusercontent.com/visgl/deck.gl/master/examples/website/trips/app.tsx
- Docs: https://deck.gl/docs/api-reference/geo-layers/trips-layer e https://deck.gl/docs/api-reference/layers/column-layer e https://deck.gl/docs/api-reference/mapbox/overview
- deck.gl v9.4.0 (release 2026-09-03).

**PROBLEM:** Mostrar milhares/milhões de eventos, rotas e entidades 3D (veículos, equipes, incidentes, ligações de rede) sobre a cidade sem quebrar a fluidez, e com leitura temporal.

**SOLUTION:** Camadas em GPU sobre um base map (MapLibre ou standalone). No exemplo de trips: `PolygonLayer` extrudado para prédios com `LightingEffect` (luz ambiente + luz pontual) e `TripsLayer` com `getPath`/`getTimestamps`; a animação é um `currentTime` avançando em loop (`loopLength: 1800`), com `trailLength: 180` e fade. `ScenegraphLayer` instancia modelos glTF. `ArcLayer` liga origem e destino. `ColumnLayer` (docs) faz barras 3D por site com `getElevation`, `radius`, `extruded`, `pickable`.

**OBSERVE:**
- Estado inicial: `pitch: 45`, `zoom: 13`, `bearing: 0` (código do exemplo), base escura "dark-matter-nolabels" da CARTO sem rótulos para o dado dominar.
- Tempo é parâmetro explícito: a rota "se desenha" e some em um rastro (cometa), comunica movimento direção e idade do dado.
- Sombras e luz dão profundidade ao bloco urbano, mas o exemplo precisa de uma camada "ground" invisível só para as sombras funcionarem (comentário no código).
- Os modelos 3D de aviões mantêm orientação (heading) e não escalam como ícone: mostram que o objeto é um ativo real.
- Arcos coloridos por destino: um padrão para "caminhos de rede / dependências" entre sites, mesmo sem relevo.
- Docs do TripsLayer alertam: timestamps são float32; não usar epoch longo, subtrair uma base (armadilha de precisão real).

**INTERACTION:**
1. Abrir o exemplo; a animação roda sozinha em loop.
2. Arrastar para pan; rotacionar/inclinar com o controle padrão de view do deck/MapLibre.
3. Em camadas com `pickable: true`, hover/clique devolve o objeto (`info.object`) para tooltip ou popup (padrão da API; no exemplo de trips o picking NÃO está habilitado).
4. Em `MapboxOverlay` com `interleaved: true`, as camadas deck entram na pilha do MapLibre e respeitam z-buffer e ordem de rótulos (`beforeId`); picking via `pickObject`, `pickObjects`, `pickMultipleObjects` documentados no overlay.

**WHY IT WORKS:** Separa "base map" de "camada de dados". O desenho é todo na GPU a partir de arrays de dados, então escala. O tempo vira primitivo visual (rastro) em vez de um controle externo.

**ADAPT TO BIWEB:** Alinha com o plano de MapLibre + deck.gl (Fase 3): um mapa de "incidentes e caminhos" poderia usar `ColumnLayer` para sites, `ArcLayer`/`PathLayer` para rotas de rede e `TripsLayer` para equipes em campo, todos alimentados por consultas do semantic layer filtradas por viewport. Interleaved resolve o encaixe com prédios extrudados do MapLibre.

**DO NOT COPY:** O tema escuro neon como padrão de produto corporativo; o base map CARTO do exemplo (verificar termos; NÃO VERIFICADO); animações infinitas sem pausa/controle (acessibilidade e `prefers-reduced-motion`); ignorar o aviso de antialias em modo interleaved (os docs dizem que linhas ficam serrilhadas; precisa de `antialiasing: true` ou MSAA).

---

---

### REF-49 — deck.gl / TerrainExtension (rota drapejada), Tile3DLayer e Google Photorealistic 3D Tiles
**IMAGES:**
- deck-terrain — https://deck.gl/images/examples/terrain-extension.jpg — Exemplo oficial "TerrainExtension": etapa do Tour de France, linha amarela espessa drapejada sobre vales alpinos/pirenaicos com satélite e relevo, rótulo "Cauterets" — status: VERIFICADA (HTTP 200, image/jpeg), inspecionada
- deck-tile3d — https://deck.gl/images/examples/tile-3d-layer.jpg — Exemplo oficial "Tile3DLayer": cidade em visão oblíqua com nuvem de pontos (pontos esparsos coloridos formando prédios e rio) — status: VERIFICADA (HTTP 200, image/jpeg), inspecionada
- deck-google3d — https://deck.gl/images/examples/google-3d-tiles.jpg — Exemplo oficial "Google 3D Tiles": malha fotorrealística de Praga com polígonos de edifícios destacados em rosa — status: VERIFICADA (HTTP 200, image/jpeg), inspecionada


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-49_01_deck_terrain`

![REF-49_01_deck_terrain](https://deck.gl/images/examples/terrain-extension.jpg)

`REF-49_02_deck_tile3d`

![REF-49_02_deck_tile3d](https://deck.gl/images/examples/tile-3d-layer.jpg)

`REF-49_03_deck_google3d`

![REF-49_03_deck_google3d](https://deck.gl/images/examples/google-3d-tiles.jpg)

**SOURCE:**
- https://deck.gl/examples/terrain-extension, https://deck.gl/examples/tile-3d-layer, https://deck.gl/examples/google-3d-tiles (galeria oficial; interação ao vivo NÃO testada)
- Código: https://raw.githubusercontent.com/visgl/deck.gl/master/examples/website/terrain-extension/app.tsx
- Docs: https://deck.gl/docs/api-reference/extensions/terrain-extension
- deck.gl v9.4.0.

**PROBLEM:** Colocar dados 2D (rotas, polígonos, pontos) sobre relevo ou sobre malhas 3D reais, com picking e sem "afundar" no chão.

**SOLUTION:** `TerrainLayer` (elevação RGB + textura de satélite) com `operation: 'terrain+draw'`; camadas de dados recebem `TerrainExtension`, que ajusta geometrias na GPU: modo drape (textura sobre o terreno, ignora altitude/extrusão) ou offset (move objetos na vertical conforme o relevo no ponto âncora, bom para ícones). A rota é `GeoJsonLayer` com `pickable: true` e `getTooltip` mostrando dia, origem/destino e km. `Tile3DLayer` (via loaders.gl) carrega 3D Tiles (nuvem de pontos, malhas, Google Photorealistic).

**OBSERVE:**
- O exemplo expõe `MapView`/`GlobeView` por prop (`view`): troca plano ↔ globo mantendo o dado drapejado.
- Câmera inicial `pitch: 55`, `maxPitch: 89`; `getTooltip` formata texto do trecho ao passar o mouse.
- Ícones e rótulos de largada/chegada têm `depthCompare: 'always'` para nunca serem ocultados pelo relevo (decisão de legibilidade explícita).
- A linha amarela tem largura mínima em pixels (`lineWidthMinPixels: 6`), continuando visível mesmo com zoom afastado.
- O exemplo de Google 3D Tiles usa realce rosa sobre footprints para destacar prédios na malha fotográfica (inspecionado): "dado de negócio por cima de realidade".
- O exemplo de nuvem de pontos mostra o custo: a cidade fica "pontilhada" e pouco legível; o ganho é dado real, a perda é limpeza visual.
- O próprio exemplo de terreno usa `mapbox.terrain-rgb` e `mapbox.satellite` com token Mapbox (código lido), ou seja, tiles proprietários de terceiros.

**INTERACTION:**
1. Abrir o exemplo de terreno; a rota está drapejada no relevo.
2. Orbitar com o controle padrão de câmera; passar o mouse na linha: tooltip com dia/km (via `getTooltip`).
3. Alternar a vista (MapView ↔ GlobeView) por configuração.
4. No exemplo de Google 3D Tiles/Tile3D, orbitar entre prédios reais; os realces se mantêm alinhados.

**WHY IT WORKS:** O drape separa a geometria do dado (2D, simples, vem do banco) da superfície (3D, vem do terreno). O mesmo GeoJSON serve em 2D e em 3D.

**ADAPT TO BIWEB:** Cobre "caminhos de rede sobre terreno" e "sites sobre prédios reais" sem trocar o motor de dados: a camada de negócio continua deck.gl, e a superfície 3D é plugável (relevo MapLibre, terrain-RGB próprio, 3D Tiles de município). Útil para uma futura fase 3D opcional.

**DO NOT COPY:** O pacote `_TerrainExtension` é marcado como experimental na doc ("Use with caution"); usar tiles Mapbox sob token no exemplo; usar Google 3D Tiles fora dos termos (exige API key, faturamento e exibição de atribuição, ver seção técnica); a nuvem de pontos como visual padrão para executivos.

---

---

### REF-50 — CesiumJS / OSM Buildings, 3D Tiles, terreno, SceneModePicker 3D↔2D, flyTo e picking
**IMAGES:**
- cesium-osm-nyc — https://images.prismic.io/cesium/c622e73d-6e0d-45a1-934f-623138cf62f1_nyc_closeup.jpg?auto=compress%2Cformat&w=1200 — Cesium OSM Buildings em Nova York: prédios extrudados com formas de topo, texturas de fachada simples, fotos de satélite ao fundo — status: VERIFICADA (HTTP 200, image/jpeg), inspecionada
- cesium-flight-path — https://images.prismic.io/cesium/tutorials-flight-tracker-path.jpeg?auto=compress%2Cformat&w=1200 — Tutorial "Flight Tracker": viewer Cesium com barra de ferramentas (busca, home, modo de cena, base layer, ajuda), pontos vermelhos de trajetória sobre o aeroporto SFO em 3D Tiles e relevo — status: VERIFICADA (HTTP 200, image/jpeg), inspecionada
- cesium-2d3d — https://images.prismic.io/cesium/tutorials-flight-tracker-side_by_side.jpeg?auto=compress%2Cformat&w=1200 — Mesmo trajeto em globo 3D (esquerda) e em mapa plano 2D (direita) — status: VERIFICADA (HTTP 200, image/jpeg), inspecionada


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-50_01_cesium_osm_nyc`

![REF-50_01_cesium_osm_nyc](https://images.prismic.io/cesium/c622e73d-6e0d-45a1-934f-623138cf62f1_nyc_closeup.jpg?auto=compress%2Cformat&w=1200)

`REF-50_02_cesium_flight_path`

![REF-50_02_cesium_flight_path](https://images.prismic.io/cesium/tutorials-flight-tracker-path.jpeg?auto=compress%2Cformat&w=1200)

`REF-50_03_cesium_2d3d`

![REF-50_03_cesium_2d3d](https://images.prismic.io/cesium/tutorials-flight-tracker-side_by_side.jpeg?auto=compress%2Cformat&w=1200)

**SOURCE:**
- https://cesium.com/platform/cesium-ion/content/cesium-osm-buildings/ (página oficial do produto de conteúdo)
- https://cesium.com/learn/cesiumjs-learn/cesiumjs-flight-tracker/ (tutorial oficial)
- Docs de API: https://cesium.com/learn/cesiumjs/ref-doc/Viewer.html, https://cesium.com/learn/cesiumjs/ref-doc/Scene.html
- Sandcastle (galeria interativa): https://sandcastle.cesium.com/ (a página existe; os nomes exatos das amostras "OSM Buildings"/"3D Tiles Feature Picking" NÃO foram confirmados porque os caminhos testados no GitHub deram 404)
- CesiumJS 1.146 (release 2026-09-15; npm 1.146.0 em 2026-10-01).

**PROBLEM:** Ter globo 3D de precisão geoespacial com terreno, prédios e malhas 3D de cidade, e interação por entidade (selecionar, voar até, mostrar info) pronta, incluindo troca para 2D.

**SOLUTION:** Widget `Viewer` com barra pronta: `SceneModePicker` (3D, 2D e Columbus View), `HomeButton`, `NavigationHelpButton`, `Geocoder`, `BaseLayerPicker`, `InfoBox` e `SelectionIndicator` (tudo `true` por padrão, segundo a doc do Viewer). Terreno e imagem vêm do Cesium ion (CesiumJS é Apache-2.0, ion tem camada gratuita não comercial). `createOsmBuildingsAsync` carrega Cesium OSM Buildings como 3D Tiles; `createGooglePhotorealistic3DTileset` existe na API (confirmado no índice da doc). `scene.pick`/`drillPick`/`pickPosition` fazem seleção e posição 3D a partir do buffer de profundidade; `morphTo2D/3D/ColumbusView` animam a troca de modo (padrão 2 s).

**OBSERVE:**
- Barra de ferramentas no canto superior direito com ícones pequenos (busca, home, modo de cena, camadas base, ajuda): conjunto mínimo e previsível (visto na imagem do tutorial).
- Compasso de navegação no canto inferior esquerdo (cortado na imagem): controle visível de heading/pitch.
- Imagem lado a lado: o mesmo dado em globo e em plano 2D mostra o 2D como projeção opcional, não como outro produto.
- OSM Buildings em NYC mostra volumes com variação de topo (pirâmides, coroas), mais rico que extrusão pura, mas ainda esquemático: "dado de OSM" visível (imagem inspecionada).
- Ao clicar em entidade, o InfoBox aparece sem configuração (doc), e `SelectionIndicator` marca o objeto.
- Trilhas de pontos vermelhos no tutorial mostram trajetória discreta com marcadores, não linha contínua.

**INTERACTION:**
1. Abrir o viewer: globo com navegação padrão (arrastar gira/pan, scroll zoom, botão direito ou ctrl+arrastar inclina).
2. Clicar no ícone de modo de cena para alternar 3D/2D/Columbus; a transição é animada.
3. Clicar em prédio ou entidade: seleção + InfoBox.
4. Usar Home para retornar à vista inicial; Geocoder para buscar e voar até o local (`camera.flyTo`, confirmado na API).
5. Ligar camadas via ion/assets; trocar base layer pelo seletor.

**WHY IT WORKS:** O Cesium traz o "kit de navegação 3D" completo, então o usuário nunca fica perdido (home, ajuda, geocoder, modo). A precisão (elipsoide WGS84, ECEF) importa para altitude e distâncias reais.

**ADAPT TO BIWEB:** Cesium seria a opção "pesada" para um futuro gêmeo digital urbano: 3D Tiles de município, terreno real e câmera de voo. Fica fora do pipeline MapLibre/deck.gl, então haveria dois motores; a integração Cesium + deck.gl existe (via `Tile3DLayer`/loaders.gl em deck, ou camadas próprias), mas NÃO foi avaliada aqui em profundidade.

**DO NOT COPY:** O visual padrão "globo espacial" (estrelas, atmosfera) em contexto de BI; todos os widgets por padrão ligados (BIWEB provavelmente quer só os 3–4 essenciais); a dependência de ion/Bing/Google com créditos por assinatura (Community é só não comercial; planos Commercial citados de US$149 a US$524/mês na página de preços lida em 2026-10-07).

---

---

### REF-51 — TerriaJS / mapa federado 2D/3D (nav, projetos, histórias) sobre CesiumJS
**IMAGES:**
- terria-3d-buildings — https://images.squarespace-cdn.com/content/v1/67148c40549d320e9f7c61ac/f8ba60ba-e59b-4236-a901-04d23a37b7b1/2d3d.jpg — Imagem marketing "2d3d": centro urbano em 3D com prédios extrudados coloridos (amarelo, azul, rosa) sobre mapa escuro, botões "About" e "Related Maps" no topo — status: VERIFICADA (HTTP 200, content-type image/webp servido para a URL .jpg), inspecionada
- terria-nav — https://images.squarespace-cdn.com/content/v1/67148c40549d320e9f7c61ac/14ee175e-8a7b-4afd-94af-3243f4d77d95/Screenshot+2025-08-13+at+11.15.02%E2%80%AFam.png — Captura de malha urbana 3D densa (aparentemente Tóquio; local NÃO VERIFICADO pela fonte) com coluna de controles à direita: ajuda, bússola/anel de rotação, zoom +/-, home, localizar, modos de vista/pedestre e outros — status: VERIFICADA (HTTP 200, image/webp), inspecionada
- terria-story — https://images.squarespace-cdn.com/content/v1/67148c40549d320e9f7c61ac/ac9cf1c0-220e-4c44-954d-4f77b597bcf7/ViewStory.png — Mapa de satélite com caixa "This map contains a Story!" (No thanks / View story) e painel inferior "Annual coastlines" com Prev/2 de 2/Restart e Share — status: VERIFICADA (HTTP 200, image/webp), inspecionada


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-51_01_terria_3d_buildings`

![REF-51_01_terria_3d_buildings](https://images.squarespace-cdn.com/content/v1/67148c40549d320e9f7c61ac/f8ba60ba-e59b-4236-a901-04d23a37b7b1/2d3d.jpg)

`REF-51_02_terria_nav`

![REF-51_02_terria_nav](https://images.squarespace-cdn.com/content/v1/67148c40549d320e9f7c61ac/14ee175e-8a7b-4afd-94af-3243f4d77d95/Screenshot+2025-08-13+at+11.15.02%E2%80%AFam.png)

`REF-51_03_terria_story`

![REF-51_03_terria_story](https://images.squarespace-cdn.com/content/v1/67148c40549d320e9f7c61ac/ac9cf1c0-220e-4c44-954d-4f77b597bcf7/ViewStory.png)

**SOURCE:**
- https://terria.io/ (site oficial; texto: federar mapas 2D, modelos 3D e dados IoT em gêmeos digitais no navegador, sem instalar, sem código, assentos ilimitados)
- Repo: https://github.com/TerriaJS/terriajs (Apache-2.0; 1.367 stars; push 2026-10-07; release v8.13.0, GH 2026-07-28, npm 2026-09-11)
- Data de captura das imagens: arquivos nomeados com datas de 2025-08 e 2025-09; páginas lidas em 2026-10-07.

**PROBLEM:** Permitir que usuários não técnicos montem, vejam e compartilhem mapas com muitas camadas (inclusive 3D) sem programar, e ainda contem uma história com a câmera.

**SOLUTION:** Aplicação web (TerriaJS) construída em cima de CesiumJS (a relação com Cesium é conhecida do projeto; NÃO foi reconfirmada em fonte lida nesta sessão) com catálogo de dados, painel de camadas, controles de navegação padronizados, "Stories" (sequência de vistas de câmera + texto), compartilhamento e projetos com edição de modelos (a captura "Your Project" mostra "Add model", mover/duplicar/apagar e "Done").

**OBSERVE:**
- Controles de navegação num bloco vertical único (compass ring, zoom, home, localizar, modos) em vez de espalhados: o usuário sempre sabe onde está o controle (imagem inspecionada).
- Overlay de convite "This map contains a Story! Would you like to view it now?" com dois botões claros (secundário "No thanks", primário "View story"): permite experiência guiada opcional.
- Painel de história no rodapé com texto curto, indicador "2 / 2", Prev, ir à localização (pin) e Restart, mais Share: narrativa ligada a posições de câmera.
- No modo projeto, a barra flutuante de edição de modelo (Add model, centralizar, duplicar, excluir, desfazer/refazer, Done) aparece só quando necessário.
- O mapa escuro com extrusões multicoloridas usa cor por categoria (3 cores + variantes) sobre fundo quase preto, boa separação figura/fundo.
- Botões "About" e "Related Maps" no topo esquerdo para contexto da camada, discretos.

**INTERACTION:**
1. Abrir um mapa compartilhado; se existir história, aparece o convite.
2. Clicar "View story": a câmera voa para a primeira posição; usar Prev/Next, ícone de pin para voltar à posição, Restart.
3. Usar a coluna direita para zoom, home, rotação (anel) e alternar vistas.
4. Para editar: abrir "Your Project" e usar Add model e a barra de edição (com seleção de modelo e caixa delimitadora com alças vermelhas, vista na captura).
   A troca explícita 2D/3D e os popups por feature NÃO foram verificados nas imagens; consultar a doc do Terria antes de assumir.

**WHY IT WORKS:** Controles consistentes + narrativa guiada baixam a barreira para o 3D: o "storytelling" faz o trabalho de orientar a câmera por quem não sabe navegar.

**ADAPT TO BIWEB:** O padrão "Story" (passos com câmera salva + texto + indicador n/N) combina com relatórios do BIWEB: um relatório poderia ter "vistas de mapa" fixadas (pitch/bearing/zoom + camadas ativas). A coluna única de controles do mapa também serve de referência de agrupamento.

**DO NOT COPY:** O gêmeo digital completo como escopo inicial; o catálogo de dados aberto (BIWEB tem semantic layer); estilos de marketing (as imagens são de página comercial, não do produto em uso; cuidado ao tratá-las como UI real).

---

---

### REF-52 — kepler.gl / 3D de polígonos em UI de exploração (open source, deck.gl por baixo)
**IMAGES:**
- kepler-buildings — https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/layers-polygon-buildings.png — Doc oficial do layer Polygon: footprints de prédios extrudados (altura e cor por campo numérico) com paleta rosa/laranja/azul escuro sobre base clara inclinada — status: VERIFICADA (HTTP 200, image/png), inspecionada
- kepler-interactions — https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/g-interactions-0.png — Painel lateral "Interactions" com toggles Tooltip, Brush e Coordinate (UI v1.1.9 antiga, 2020) — status: VERIFICADA (HTTP 200, image/png), inspecionada
- kepler-3d-icon — https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/m-map-settings-3d.png — Ícone de cubo isométrico do botão "3D map" — status: VERIFICADA (HTTP 200, image/png), inspecionada (imagem minúscula, só o ícone)


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-52_01_kepler_buildings`

![REF-52_01_kepler_buildings](https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/layers-polygon-buildings.png)

`REF-52_02_kepler_interactions`

![REF-52_02_kepler_interactions](https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/g-interactions-0.png)

`REF-52_03_kepler_3d_icon`

![REF-52_03_kepler_3d_icon](https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/m-map-settings-3d.png)

**SOURCE:**
- https://docs.kepler.gl/docs/user-guides/c-types-of-layers/e-polygon (docs oficiais; lido via fetch)
- https://docs.kepler.gl/docs/user-guides/m-map-settings, https://docs.kepler.gl/docs/user-guides/f-map-styles, https://docs.kepler.gl/docs/user-guides/g-interactions
- Repo https://github.com/keplergl/kepler.gl (MIT; 12.036 stars; push 2026-10-06; prerelease v3.3.0-alpha.15 de 2026-09-25; npm kepler.gl 3.3.0-alpha.15).

**PROBLEM:** Usuário analista quer explorar dados geoespaciais em 3D sem programar: carregar arquivo, escolher cor/altura por campo, ver a legenda e filtrar.

**SOLUTION:** UI em quatro painéis (camadas, filtros, interações, mapa base) sobre deck.gl + MapLibre/Mapbox. Camada Polygon: altura e cor mapeadas a campos numéricos (choropleth em 3D). Botão 3D no canto superior direito ativa a vista inclinada e (segundo a doc) arrastar faz pan, cmd/ctrl+arrastar gira. "3D Buildings" (toggle em Map Styles) desenha prédios só em vista 3D com cor configurável. "Split map" compara camadas lado a lado com zoom sincronizado, "Globe view" projeta em esfera.

**OBSERVE:**
- Uma única coluna de configuração por camada: "Fill Color", "Height", "Extrude" ligados a campos do dataset (conceito semelhante a semantic layer).
- Painel Interactions com 3 toggles simples (Tooltip, Brush, Coordinate): poucos controles, cada um com uma função clara.
- Legenda automática por camada visível (doc de Map Settings).
- 3D é um modo (botão) e não o estado padrão: usuário entra no 3D quando quer.
- Globe view documentado com limitações explícitas (zoom ~2–12, algumas camadas não funcionam, câmera não centra nos polos), honestidade de produto.
- Paleta de cor do exemplo de footprints tem lacunas de contraste nas áreas baixas (inspeção visual), lembrando que extrusão com transparência afeta legibilidade.

**INTERACTION:**
1. Carregar CSV/GeoJSON.
2. Criar layer Polygon e atribuir cor/altura por campo; ativar extrusão.
3. Clicar no botão 3D (cubo) para inclinar; arrastar para pan; cmd/ctrl+arrastar para girar (doc).
4. Ligar Tooltip em Interactions e passar o mouse nas extrusões.
5. Opcional: Split map para comparar camadas.

**WHY IT WORKS:** A UI traduz parâmetros de renderização em perguntas de análise ("qual campo vira altura?"), sem expor código. 3D e legenda caminham juntos.

**ADAPT TO BIWEB:** Referência direta para um painel de propriedades de uma camada de mapa no builder: "campo → altura/cor" ligado ao modelo semântico, com toggle 3D separado do toggle de camada. Como kepler é MIT e baseado em deck.gl, serve também como código de estudo (não necessariamente dependência).

**DO NOT COPY:** O fluxo de 4 abas denso para quem não é analista; o visual de UI de 2020 (v1.1.9 na imagem); features instáveis (v3.3 ainda em alpha). Extrusão semitransparente com paleta de baixa saturação sem rótulos pode induzir leitura errada de altura.

---

---

### REF-53 — Mapbox Standard (contraste proprietário) / 3D, landmarks e iluminação dinâmica
**IMAGES:**
- mapbox-std-london — https://cdn.prod.website-files.com/609ed46055e27a02ffc0749b/668ed88b0d1cb50a971bf2e9_64d2310b77a293e18725a871_London_Day%2520-Mapbox%2520Standard-2023-MKTG-approved%2520(rounded).png — Mapbox Standard "London Day": City of London em 3D, prédios bege, arranha-céus azuis com fachadas, POIs coloridos por categoria, shields de rodovias — status: VERIFICADA (HTTP 200, image/png), inspecionada
- mapbox-std-eiffel — https://cdn.prod.website-files.com/609ed46055e27a02ffc0749b/668ed88b0d1cb50a971bf2a8_64d399e0fb64663c5c4b8118_eiffel%2520dark%2520-Mapbox%2520Standard-2023-MKTG-approved.png — Mapbox Standard no preset noturno: Torre Eiffel em modelo 3D detalhado, árvores 3D, sombras, rótulos em rosa/azul — status: VERIFICADA (HTTP 200, image/png), inspecionada


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-53_01_mapbox_std_eiffel`

![REF-53_01_mapbox_std_eiffel](https://cdn.prod.website-files.com/609ed46055e27a02ffc0749b/668ed88b0d1cb50a971bf2a8_64d399e0fb64663c5c4b8118_eiffel%2520dark%2520-Mapbox%2520Standard-2023-MKTG-approved.png)

**SOURCE:**
- https://www.mapbox.com/blog/standard-core-style (blog oficial; imagens marcadas "MKTG-approved", ou seja, marketing)
- https://raw.githubusercontent.com/mapbox/mapbox-gl-js/main/LICENSE.txt (licença)
- Mapbox GL JS v3.33.0-rc.1 (release GH 2026-10-06; npm estável 3.32.0 em 2026-09-29).

**PROBLEM:** Entregar "bonito por padrão" um mapa 3D urbano, sem o desenvolvedor desenhar estilo, com orientação por marcos e hora do dia.

**SOLUTION:** Estilo único "Standard" com prédios 3D, marcos 3D (centenas de landmarks), árvores, iluminação dinâmica (presets Dia, Noite, Entardecer e Amanhecer, segundo o blog) e configuração por parâmetros (`lightPreset`, `show3dObjects` citados no blog), com "slots" para inserir camadas próprias por baixo/entre os elementos do estilo.

**OBSERVE:**
- Hierarquia visual: prédios comuns em tom neutro, edifícios icônicos com cor e textura, o que guia o olhar (imagem de Londres, inspecionada).
- POIs com cor por categoria (laranja comida, azul transporte, rosa turismo) e rótulos que respeitam o 3D.
- Preset noturno muda sombras, cor de volumes e luz, mantendo legibilidade dos rótulos (imagem de Paris).
- O estilo é configurável por poucas chaves, não por reedição de dezenas de camadas.
- Deck.gl documenta `slot` para interoperar com Mapbox Standard (docs do overlay), indicando que dados próprios entram em posições definidas da pilha.
- A licença não é open source: GL JS v2.0+ exige conta Mapbox e uso apenas com produtos Mapbox (resumo do LICENSE.txt lido).

**INTERACTION:**
1. Abrir mapa com Standard; inclinar com arrastar com botão direito/ctrl.
2. Alternar o preset de luz (por configuração) e ligar/desligar objetos 3D.
3. Adicionar camada de dados em um `slot` (bottom, middle, top) para ela ficar no lugar certo.
   Interação ao vivo do Standard NÃO foi testada em navegador nesta sessão.

**WHY IT WORKS:** O 3D está embutido no estilo e a hierarquia (landmarks vs. massa) foi projetada. É a prova de que "menos configuração do dev" é possível.

**ADAPT TO BIWEB:** Como contraste: mostra o nível de acabamento que usuários esperam, e que o equivalente open source (MapLibre + estilo próprio + deck.gl) precisa ser montado. Útil como régua de qualidade para o estilo de mapa 3D do BIWEB, não como dependência.

**DO NOT COPY:** O código GL JS (proprietário), os dados/landmarks do Mapbox, e a marca de imagens de marketing; preços e termos do Mapbox NÃO foram verificados.

---

---

#### Open-source technology notes (GIS & 3D)

Dados de maturidade: stars e pushed_at via `api.github.com/search/repositories` (2026-10-07); última release via `github.com/<repo>/releases.atom` (monorepos como Martin e MapLibre Native publicam tags por componente) e `registry.npmjs.org`. "Licença" é lida do arquivo LICENSE/package.json quando indicado; o campo `NOASSERTION` do GitHub significa que o GitHub não classificou. Todas as licenças e termos devem ser revalidados por jurídico antes de adoção.

##### Tabela de bibliotecas, servidores e dados

| Tecnologia | Finalidade | Licença | Maturidade | URL | Por que pode interessar ao BIWEB | Limitações / risco conhecidos |
|---|---|---|---|---|---|---|
| MapLibre GL JS | Base map vetorial WebGL, terreno, fill-extrusion, sky, globo | BSD-3-Clause (LICENSE.txt e npm; GitHub: NOASSERTION) | 11.817 stars; push 2026-10-07; v6.13.0 (2026-10-03) | https://github.com/maplibre/maplibre-gl-js | Já está nos docs de arquitetura; entrega prédios extrudados, terreno e pitch no mesmo motor do mapa 2D. Permite toggle 2D/3D sem outro runtime. | Extrusão de prédios é volume simples, sem texturas; terreno e deck.gl só têm suporte parcial (z=0 no nível do mar sem TerrainExtension); MSAA depende de configuração. |
| deck.gl | Camadas de dados em GPU (Column, Path, Trips, Arc, Scenegraph, Tile3D), picking | MIT (API e npm) | 14.632 stars; push 2026-10-07; v9.4.0 (2026-09-03) | https://github.com/visgl/deck.gl | Já previsto no plano; faz sites (ColumnLayer), rotas (Path/Trips), ligações (Arc), modelos glTF e picking com tooltip. Modo interleaved com MapLibre. | Interleaved sem antialias por padrão; `TerrainExtension` experimental; onDrag/onInteractionStateChange indisponíveis via MapboxOverlay (doc); curva de aprendizado de props de GPU. |
| CesiumJS | Globo 3D, 3D Tiles, terreno, entidades, tempo, 2D/3D/Columbus | Apache-2.0 (LICENSE.md, API, npm) | 15.807 stars; push 2026-10-07; 1.146 (2026-09-15) | https://github.com/CesiumGS/cesium | Precisão geoespacial e 3D Tiles de cidade; `SceneModePicker`, `flyTo`, picking. Opção pesada para gêmeo digital. | Segundo runtime a manter; conteúdo (terreno, imagens, OSM Buildings, Google) vem de Cesium ion com cotas; Community free só não comercial (preços lidos na página de pricing). |
| Cesium ion | Plataforma de conteúdo/hospedagem 3D (terreno, OSM Buildings, 3D Tiles) | Serviço comercial (não OSS) | Tiers: Community free (10 GB storage, 15 GB/mês streaming), Commercial US$149–524/mês, Premium US$499–874/mês, Custom (pricing page 2026-10-07) | https://cesium.com/platform/cesium-ion/pricing/ | Acesso rápido a terreno global e a OSM Buildings prontos. | Lock-in e custo por uso; termos NÃO lidos na íntegra. |
| Cesium for Unreal | Cesium em Unreal Engine (apenas citado) | Apache-2.0 (API GitHub) | 1.247 stars; push 2026-10-07; v2.30.0 (2026-09-29) | https://github.com/CesiumGS/cesium-unreal | Fora do escopo web; só referência de ecossistema. | Não é web. |
| OSM Buildings (lib e viewer) | Viewer 3D de prédios OSM em JS (v4.1.1 no CDN do site) | Lib: texto BSD-style no LICENSE.md (variante exata NÃO VERIFICADA); dados OSM sob ODbL | Repo OSMBuildings/OSMBuildings: 1.009 stars; push 2021-04-29 (parado); site osmbuildings.org ativo ("Powered by ONEGEO") | https://osmbuildings.org/ | Referência histórica de prédios OSM 3D leves. | Biblioteca do GitHub sem push desde 2021; dependência de serviço de terceiros; NÃO VERIFICADO o modelo comercial de dados/tiles. |
| iTowns | Visualização 3D geoespacial em Three.js (CeCILL-B ou MIT) | CeCILL-B OR MIT (LICENSE.md e npm) | 1.273 stars; push 2026-10-07; v2.46.0 (release GH 2025-03-31; npm 2025-10-03) | https://github.com/iTowns/itowns | Alternativa acadêmica/europeia a Cesium com foco em dados oficiais (OGC, 3D Tiles). | Comunidade menor; releases mais espaçadas; UI pronta mínima. |
| Giro3D | 3D geoespacial em Three.js (INRAE/Oslandia) | MIT (npm) | GitLab (não GitHub): 50 stars; última atividade 2026-10-07; npm 2.0.5 (2026-10-06) | https://gitlab.com/giro3d/giro3d (site https://giro3d.org/) | Alternativa Three.js moderna, com releases frequentes. | Repo no GitLab (GitHub API devolveu 404); comunidade pequena (50 stars no GitLab); arquivo LICENSE.md não foi localizado no caminho testado (licença vem do npm). |
| kepler.gl | App/biblioteca de exploração geoespacial (deck.gl) | MIT (LICENSE e API) | 12.036 stars; push 2026-10-06; v3.3.0-alpha.15 (2026-09-25) | https://github.com/keplergl/kepler.gl | Referência de UI "campo → altura/cor"; código estudável. | Versão atual ainda alpha; acopla Redux e UI própria; integração em produto exige trabalho. |
| TerriaJS | Plataforma de mapas 2D/3D no navegador (Stories, catálogos) | Apache-2.0 (API e npm) | 1.367 stars; push 2026-10-07; 8.13.0 (GH 2026-07-28; npm 2026-09-11) | https://github.com/TerriaJS/terriajs | Referência de histórias com câmera e compartilhamento; pode ser lido como exemplo de produto. | Projeto grande/monolítico; assume Cesium; adoção como biblioteca dentro de outro produto é difícil. |
| Mapbox GL JS v2/v3 | Mapa vetorial WebGL com Standard style (contraste) | Proprietária (LICENSE.txt: uso com produtos Mapbox, conta exigida; GitHub NOASSERTION) | 12.436 stars; push 2026-10-07; v3.33.0-rc.1 (2026-10-06) | https://github.com/mapbox/mapbox-gl-js | Régua de acabamento (Standard, landmarks, luz). | Não open source desde v2; lock-in e preços NÃO VERIFICADOS. |
| Google Photorealistic 3D Tiles | Malha 3D fotorrealística de cidades (contraste/proprietário) | Termos de serviço Google (Map Tiles API: chave, faturamento, atribuição obrigatória) | n/a (serviço) | https://developers.google.com/maps/documentation/tile/3d-tiles | Cobertura mundial de malha real sem processamento próprio. | Exige renderizador que exiba atribuição (ex.: CesiumJS 1.91+); sem cache offline segundo o modelo de sessão (root tileset válido ≥ 3 h); custo por uso; não é "GIS de infra". |
| Esri ArcGIS Maps SDK / Scene Viewer | SDK e viewer 3D proprietários (contraste) | Proprietária | NÃO VERIFICADO (páginas do SDK e do Scene Viewer carregaram como casca JS ou 404; nada de conteúdo foi extraído) | https://www.esri.com/en-us/arcgis/products/arcgis-maps-sdk/overview | Referência de produto GIS corporativo. | Pesquisa não concluída para Esri; sem imagens verificadas. |
| three.js | Motor 3D genérico | MIT (API e npm) | 116.322 stars; push 2026-10-07; r186 (2026-09-04) | https://github.com/mrdoob/three.js | Base de iTowns, Giro3D, threebox e plugins MapLibre-Three. | Não é GIS; precisa de camada de coordenadas. |
| Threebox | Three.js sobre Mapbox/MapLibre (modelos 3D, tooltips) | MIT (package.json; GitHub NOASSERTION) | 690 stars; push 2026-09-29; v2.2.7 (GH release 2022-01-12; npm 2022-06-03) | https://github.com/jscastro76/threebox | Atalho para colocar modelos glTF em mapa. | Última release há mais de 4 anos; foco em Mapbox GL v1/v2. |
| maplibre-gl-three | Plugin Three.js para MapLibre (usado no exemplo de raycast 3D Tiles) | MIT (npm) | npm 3.0.2 (2026-10-07); repo https://github.com/safwat-halaby/maplibre-gl-three (stars NÃO VERIFICADO) | https://www.npmjs.com/package/maplibre-gl-three | Mostra o caminho "MapLibre + 3D Tiles + picking". | Plugin de terceiro, sem estatísticas verificadas. |
| 3DTilesRendererJS | Renderizador 3D Tiles para three.js (NASA-AMMOS) | Apache-2.0 (API) | 2.477 stars; push 2026-10-07; v0.5.3 (2026-08-24) | https://github.com/NASA-AMMOS/3DTilesRendererJS | Alternativa leve ao Cesium para consumir 3D Tiles. | Pré-1.0 (0.5.x); API pode mudar. |
| loaders.gl | Loaders de geodados (3D Tiles, glTF, MVT, Parquet etc.) | MIT (LICENSE; GitHub NOASSERTION) | 855 stars; push 2026-10-07; v4.5.3 (2026-10-04) | https://github.com/visgl/loaders.gl | Usado por deck.gl (Tile3DLayer). | Superfície grande; precisa escolher módulos. |
| OpenStreetMap (dados) | Base global de ruas, prédios, uso do solo | ODbL (licença de dados; atribuição e share-alike para bancos derivados) | Dados vivos | https://www.openstreetmap.org/copyright | Fonte gratuita de footprints e alturas parciais. | Atribuição obrigatória; derivados do banco devem seguir ODbL; cobertura de altura irregular (NÃO VERIFICADO por país, em especial Brasil). |
| Overture Maps | Dados abertos (buildings, transportation, places, base) em GeoParquet | Por tema: buildings, transportation, base e admin em ODbL; places em CDLA Permissive 2.0 (conforme páginas de release do overturemaps.org via busca; revalidar por release); repo OvertureMaps/data MIT | Repo: 1.170 stars; push 2026-09-21; sem release GH | https://overturemaps.org/ | Footprints de prédios com altura derivada em parte; formato GeoParquet fácil de consultar. | Misturar dados com ODbL aciona share-alike; qualidade varia por região. |
| OpenMapTiles | Schema de tiles vetoriais + toolchain | Código BSD-3-Clause, design CC BY 4.0 (LICENSE.md e README do OpenFreeMap); dados OSM em ODbL | 3.186 stars; push 2026-07-29; v3.16 (2024-04-29) | https://github.com/openmaptiles/openmaptiles | Define camadas padrão (`building` com `render_height`) que estilos MapLibre usam. | Pouco ativo (release 2024); licença cobre o schema, não os dados. |
| Protomaps / PMTiles | Arquivo único de tiles com HTTP Range, sem servidor | Implementações BSD-3-Clause; especificação em domínio público/CC0 (LICENSE; GitHub NOASSERTION) | PMTiles: 3.073 stars; push 2026-09-16; npm 4.5.0 (2026-08-10); GH sem release (atom vazio) | https://github.com/protomaps/PMTiles | Hospedar mapa e terreno em storage barato, ótimo para self-host/privacidade. | Somente leitura (regenerar o arquivo ao atualizar); não substitui banco para dados dinâmicos. |
| Protomaps basemaps | Estilos e schema de base map para PMTiles | BSD-3-Clause (LICENSE.md) + dados/atribuição de terceiros | 749 stars; push 2026-09-11; release atom mostra 2.1.0 de 2020 (não confiável, NÃO VERIFICADO) | https://github.com/protomaps/basemaps | Base map autônoma sem tile server. | Schema próprio; cobertura de 3D limitada (NÃO VERIFICADO). |
| Planetiler | Gera MBTiles/PMTiles de OSM em minutos | Apache-2.0 (LICENSE e API) | 2.197 stars; push 2026-10-05; v0.10.2 (2026-03-10) | https://github.com/onthegomap/planetiler | Gerar tiles próprios (prédios com altura) para um país/região. | Java 21+, RAM ≈ 0,5× o tamanho do .pbf; processamento batch. |
| Martin | Tile server em Rust (PostGIS, MBTiles, PMTiles; sprites, fontes) | Apache-2.0 OR MIT (README; API: Apache-2.0) | 3.976 stars; push 2026-10-07; última tag vista: mbtiles-v0.20.2 (2026-10-01) | https://github.com/maplibre/martin | Servir camadas dinâmicas do Postgres/PostGIS como MVT. | Monorepo com tags por componente (versão do servidor principal NÃO identificada). |
| pg_tileserv | MVT direto de tabelas PostGIS | Apache-2.0 | 1.062 stars; push 2025-12-11; v1.0.11 (2023-07-14) | https://github.com/CrunchyData/pg_tileserv | Mínimo para servir tabelas como tiles. | Releases paradas desde 2023. |
| pg_featureserv | API OGC Features sobre PostGIS | Apache-2.0 | 541 stars; push 2025-09-17; "Version 1.3.1" (2023-07-11) | https://github.com/CrunchyData/pg_featureserv | Entregar features por BBOX/filtros em GeoJSON. | Baixa atividade; só PostGIS. |
| OpenFreeMap | Tiles vetoriais OSM públicos e gratuitos (estilos Positron, Bright, Liberty, Dark, Fiord, 3D) | MIT (README); dados OSM em ODbL; schema OpenMapTiles | 6.153 stars; push 2026-10-04; releases GH NÃO VERIFICADO (só tag antiga no atom) | https://openfreemap.org/ | Usado pelos exemplos oficiais de MapLibre; permite prototipar 3D sem chave. | Endpoint público sem SLA (doado); "sem limites" é promessa do mantenedor; exige atribuição; para produção, self-host. |
| Mapterhorn | Terreno global em PMTiles (Terrarium/webp 512px), baseado em Copernicus GLO-30 e levantamentos nacionais | Código BSD-3-Clause (API); dados de várias fontes (lista em mapterhorn.com/attribution, NÃO lido) | 408 stars; push 2026-09-16; v0.0.13 (2026-08-20) | https://github.com/mapterhorn/mapterhorn (endpoint https://tiles.mapterhorn.com/tilejson.json) | Terreno aberto já usado em exemplos MapLibre; pode ser subconjunto baixado e auto-hospedado. | Projeto jovem (0.0.x); sem limites declarados na página de acesso (NÃO é garantia); cobertura global só até z12, alta resolução só onde há lidar nacional. |
| MapLibre Native | Mesma engine em iOS/Android/desktop | BSD-2-Clause (API) | 2.253 stars; push 2026-10-07; ios-v7.0.0-pre0 (2026-09-29) | https://github.com/maplibre/maplibre-native | Cita-se para futuro app móvel com o mesmo estilo. | Não é web; paridade de features 3D parcial (NÃO VERIFICADO). |
| MapLibre Tile (MLT) | Formato de tile vetorial de nova geração | Apache-2.0 (API) | 557 stars; push 2026-10-07; rust-mlt-wasm-v0.1.40 (2026-10-04) | https://github.com/maplibre/maplibre-tile-spec | Emergente; menor tamanho de tile. | Em evolução (v0.1.x); suporte em clientes NÃO VERIFICADO. |
| h3-js | Grade hexagonal H3 | Apache-2.0 (API) | 1.089 stars; push 2026-08-24; v4.5.0 (2025-12-12) | https://github.com/uber/h3-js | Já citado no plano (H3 + choropleth); hexágonos extrudados em deck.gl. | n/a |

##### Formatos e dados

| Formato / dado | Finalidade | Licença/spec | URL | Por que pode interessar | Limitações |
|---|---|---|---|---|---|
| 3D Tiles | Streaming de malhas, BIM, nuvens de pontos e prédios 3D em LOD | OGC Community Standard (1.0 aprovado em dez/2018; 1.1 atual; 2.0 em desenvolvimento, conforme README); licença do texto da spec NÃO VERIFICADA | https://github.com/CesiumGS/3d-tiles (2.614 stars; push 2026-10-06) | Formato padrão para cidade 3D (Cesium, deck.gl, iTowns). | Pipeline de geração é separado (ion, reality capture); arquivos pesados. |
| glTF | Modelos 3D (base do 3D Tiles; ScenegraphLayer) | Spec CC-BY-4.0 (cabeçalho SPDX do README) | https://github.com/KhronosGroup/glTF (7.851 stars; push 2026-10-02) | Ícones/modelos 3D de equipamentos e torres. | Precisa de otimização (Draco/meshopt) para web. |
| PMTiles | Contêiner de tiles em arquivo único | Spec CC0/domínio público; código BSD-3 | https://docs.protomaps.com/pmtiles/ | Self-host em S3/R2. | Somente leitura. |
| MVT (Mapbox Vector Tile) | Tiles vetoriais (prédios, vias) | Spec aberta (github.com/mapbox/vector-tile-spec); licença da spec NÃO VERIFICADA | https://github.com/mapbox/vector-tile-spec | Formato universal do MapLibre/deck.gl (`building` com altura). | Geometria simplificada por zoom; atributos limitados. |
| GeoParquet | Parquet com geometria; formato do Overture | Apache-2.0 (repo) | https://github.com/opengeospatial/geoparquet (1.097 stars; push 2026-09-21) | Consultar footprints em lote (DuckDB) e alimentar o modelo semântico. | Não é formato de tile; precisa de conversão para exibição. |
| Terrain-RGB / Terrarium | PNG/WebP com elevação codificada nos canais RGB | Encodings abertos; dados têm licença própria | Mapterhorn usa Terrarium (webp 512); exemplo deck.gl usa decoder terrain-rgb (-10000 + 0.1 × valor RGB) | https://mapterhorn.com/data-access/ | Terreno via raster-dem em MapLibre. | Cuidado com o encoding correto; a precisão vertical depende do DEM de origem. |
| Copernicus GLO-30 / SRTM | DEMs globais de origem | Termos de uso NÃO VERIFICADOS por esta pesquisa (Mapterhorn lista Copernicus GLO-30 como base global) | https://mapterhorn.com/attribution (não lido) | Fonte de terreno gratuito. | Resolução ~30 m; DSM inclui copas/prédios (NÃO VERIFICADO). |

##### Matriz curta: o que cada biblioteca faz melhor

| Capacidade | MapLibre GL JS | deck.gl | CesiumJS | kepler.gl | TerriaJS | iTowns / Giro3D | Mapbox GL JS (contraste) |
|---|---|---|---|---|---|---|---|
| Base map vetorial 2D | Melhor | Não (usa base) | Fraco | Via MapLibre/Mapbox | Via Cesium | Parcial | Melhor (proprietário) |
| Prédios extrudados de MVT | Melhor | PolygonLayer (dado próprio) | OSM Buildings (3D Tiles) | Polygon/3D buildings | Via Cesium | Sim | Melhor (Standard) |
| Terreno e sky | Bom (raster-dem, sky, fog) | TerrainExtension (experimental) | Melhor (terreno e atmosfera) | Parcial | Via Cesium | Sim | Bom |
| Camadas de dados massivas (colunas, arcos, trips) | Limitado | Melhor | Primitivas e entidades | Via deck.gl | Catálogo | Limitado | Limitado |
| 3D Tiles / malhas reais | Via plugins (Three.js) | Tile3DLayer | Melhor | Não | Sim (Cesium) | Sim | Via plugins |
| Precisão geoespacial / globo | Globo básico | GlobeView | Melhor | Globe view | Cesium | Sim | Globo |
| UI pronta de navegação 3D | NavigationControl, TerrainControl | Mínima | Viewer completo | UI completa | UI completa | Mínima | NavigationControl |
| Picking / popups | queryRenderedFeatures + Popup | `pickable`, `getTooltip`, `pickObject` | `scene.pick`, InfoBox | Tooltip | InfoBox | Raycaster | queryRenderedFeatures |
| Licença / lock-in | BSD-3, aberta | MIT, aberta | Apache-2.0, conteúdo via ion | MIT | Apache-2.0 | MIT / dual | Proprietária |

(Células "Fraco/Parcial/Limitado" são avaliação qualitativa da pesquisa a partir dos docs lidos, não benchmark medido.)

##### Trade-offs (sem decidir)
- Motor único (MapLibre + deck.gl) é mais simples de manter e alinha com a arquitetura citada, mas dá volume esquemático; malha fotográfica exige 3D Tiles + Tile3DLayer (deck) ou outro motor.
- Cesium dá precisão e ecossistema de 3D Tiles, mas é um segundo runtime e traz dependência de conteúdo ion/Google.
- Dados OSM/Overture exigem atribuição e atenção a ODbL; hospedar tiles e terreno próprios (Planetiler, PMTiles, Martin, Mapterhorn) reduz risco de endpoint público, mas aumenta operação.
- Terreno com deck.gl ainda é parcial/experimental: avaliar com protótipo antes de prometer "incidentes sobre o relevo".

#### Padrões transversais

Controles de câmera: o vocabulário que se repete é bússola com visualização de pitch/bearing, zoom +/-, botão de home, geocoder/busca e uma barra pequena (3–5 ícones), com pitch inicial já inclinado (45–70°) para "vender" o 3D; `hash`/estado de câmera na URL permite compartilhar. 2D↔3D: aparece como botão (kepler, Cesium SceneModePicker, TerrainControl do MapLibre), nunca como outro produto; o 3D é opt-in e o dado é o mesmo. Camadas urbanas: base escura ou neutra com prédios por rampa de cor/altura, rótulos acima dos volumes (`beforeId`/`slot`), marcos destacados (Mapbox) e dado de negócio por cima. Popups/picking: `pickable` + `getTooltip`/`onClick` no deck.gl, `scene.pick` + InfoBox no Cesium, `queryRenderedFeatures` + `Popup` no MapLibre; em 3D, rótulos e ícones precisam de tratamento de oclusão (`depthCompare: 'always'` no exemplo de terreno). Performance e LOD: extrusão só a partir de minzoom (15), altura animada por zoom, fog/sky para esconder o horizonte, 3D Tiles para LOD de malha, tiles PMTiles estáticos; deck.gl interleaved sem MSAA exige atenção. Atribuição e licenças de dados: dados OSM e derivados (Overture em vários temas, OpenMapTiles/OpenFreeMap) exigem atribuição visível (© OpenStreetMap contributors e fornecedor do tile) e, se houver banco derivado, regras de ODbL (share-alike); tiles públicos gratuitos (tile.openstreetmap.org, OpenFreeMap, Mapterhorn) não oferecem SLA e a política da OSMF proíbe uso pesado, portanto produção pede self-host; Google Photorealistic 3D Tiles e Mapbox têm termos próprios (atribuição obrigatória, chave, faturamento); conferir licença de cada dado de terreno (Copernicus/SRTM não verificados aqui).


---

## 11 — Data Modeling (visual, expression, lineage)

**Pergunta da área:** como interfaces maduras expõem modelagem relacional/semântica, relacionamentos, cardinalidade, PK/FK, métricas, dimensões, cálculos e lineage?
**Estrutura:** (A) **Visual modeling** (canvas de relações), (B) **Expression/calculation** (editor avançado, autocomplete, validação, preview) e (C) **Lineage e impacto**. *Nota:* DAX é linguagem de expressão/cálculo, não editor de relacionamento; aqui foi tratado só na dimensão B (DAX query view, TMDL view). O Power BI Model view (REF-06 do pack base) **não foi repetido**.
**Objetivo:** enriquecer a tela de dados existente, sem substituí-la.

### REF-54 — Tableau / Relationships (camada lógica "noodles" × camada física, Performance Options)

**IMAGES:**
- tableau-layers — https://help.tableau.com/current/pro/desktop/en-us/Img/data_model_layers_sm.png — "A data model diagram displays a logical layer with two tables linked by a relationship, and a physical layer that illustrates how the logical tables are constructed from physical tables." — VERIFICADA/inspecionada (diagrama conceitual: plano "Logical Layer" com Logical Table A —Relationship— Logical Table B; abaixo, planos "Physical Layer" mostrando A composta por 4 tabelas físicas com joins e B por 1 tabela).
- tableau-perfopts — https://help.tableau.com/current/pro/desktop/en-us/Img/data_model_perfoptions.png — "Performance option settings for editing a relationship, including cardinality and referential integrity." — VERIFICADA/inspecionada (diálogo "Edit Relationship": campos Orders.State ↔ States.State Name, "+ Add more fields", seção recolhível "Performance Options" com selects de Cardinality [Many/Many] e Referential Integrity [Some records match], botão "Revert to Default").
- tableau-create-gif — https://help.tableau.com/current/pro/desktop/en-us/Img/data_model_createrelationship.gif — "Process of dragging tables to canvas" — VERIFICADA/inspecionada (1º frame: painel Sheets à esquerda, canvas vazio "Drag tables here"; a animação mostra tabelas arrastadas e noodle aparecendo — comportamento por doc).
- tableau-edit-gif — https://help.tableau.com/current/pro/desktop/en-us/Img/data_model_editfields.gif — "Process of editing the default relationship to a different one" — VERIFICADA/inspecionada (1º frame: Orders ligada a Cities e States por duas linhas curvas "noodle", grid de dados abaixo).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-54_01_tableau_layers`

![REF-54_01_tableau_layers](https://help.tableau.com/current/pro/desktop/en-us/Img/data_model_layers_sm.png)

`REF-54_02_tableau_perfopts`

![REF-54_02_tableau_perfopts](https://help.tableau.com/current/pro/desktop/en-us/Img/data_model_perfoptions.png)

`REF-54_03_tableau_create_gif`

![REF-54_03_tableau_create_gif](https://help.tableau.com/current/pro/desktop/en-us/Img/data_model_createrelationship.gif)

`REF-54_04_tableau_edit_gif`

![REF-54_04_tableau_edit_gif](https://help.tableau.com/current/pro/desktop/en-us/Img/data_model_editfields.gif)

**SOURCE:** https://help.tableau.com/current/pro/desktop/en-us/relate_tables.htm ; https://help.tableau.com/current/pro/desktop/en-us/datasource_relationships_perfoptions.htm ; https://help.tableau.com/current/pro/desktop/en-us/datasource_relationships_learnmorepage.htm — docs oficiais Tableau Desktop (versão "current", data não informada). AVISO: os screenshots/GIFs têm aparência de UI antiga (estilo 2019–2020, Data Model introduzido no Tableau 2020.2); a lógica do produto segue vigente.

**PROBLEM:** Joins tradicionais exigem escolher tipo (inner/left/outer) antes de saber a pergunta; escolhas erradas duplicam linhas ou perdem dados, e o autor precisa entender granularidade e fan-out de antemão.

**SOLUTION:** Duas camadas. Na camada lógica o usuário apenas arrasta tabelas e liga com um "noodle" (linha curva sem tipo de join); o Tableau escolhe o join por visualização e só combina as tabelas necessárias à pergunta. Quem precisa de controle clica duas vezes na tabela lógica e entra na camada física (joins/unions explícitos). Cardinalidade e integridade referencial são "Performance Options" opcionais, recolhidas, com defaults seguros.

**OBSERVE:**
- Relação é uma linha fina SEM glifos de cardinalidade na superfície; a cardinalidade vive num painel recolhido dentro do diálogo (divulgação progressiva: o caso comum não exige decidir nada).
- Default conservador documentado: sem constraint detectada, vira muitos-para-muitos com "Some records match" ("safe choice").
- Auto-match de campos ao soltar a tabela; se falhar, o usuário escolhe pares de campos; "+ Add more fields" permite chave composta.
- Hierarquia de abstração explícita: duplo clique na tabela lógica abre a camada física (drill-down de complexidade, não um modo separado).
- Botão "Revert to Default" no diálogo: reversibilidade explícita para configuração avançada.
- Painel de dados (grid) abaixo do canvas dá feedback imediato dos dados das tabelas selecionadas.

**INTERACTION:** (1) Arrastar a 1ª tabela da lista Sheets para o canvas. (2) Arrastar a 2ª tabela perto da 1ª; surge o noodle com campos casados automaticamente. (3) Se os campos estiverem errados, clicar no noodle → Edit Relationship → trocar campos ou adicionar mais pares. (4) Opcional: expandir "Performance Options" e ajustar Cardinality/Referential Integrity. (5) Hover em tabelas mostra tooltip de como se relacionam. (6) Duplo clique numa tabela lógica abre a camada física para joins/unions. (7) Ao construir a viz, o Tableau escolhe o join conforme os campos usados.

**WHY IT WORKS:** Adia a decisão cara (tipo de join/cardinalidade) até haver contexto de pergunta; o caso comum é "arrastar e soltar", e o caso especial tem uma escotilha nomeada e reversível. O modelo mental "uma tabela lógica = um nível de detalhe" evita duplicação silenciosa.

**ADAPT TO BIWEB:** VISUAL MODELING. Para a tela de dados enriquecida, tratar Relação como linha única entre Entidades com defaults seguros (cardinalidade inferida a partir das chaves; direção e ativa/inativa como propriedades colapsadas num painel "Avançado") e mostrar a cardinalidade só ao selecionar a linha. A noção de "camada física" não se aplica (BIWEB não expõe SQL no frontend); o equivalente é Entidade (lógica) com "ver origem" somente leitura. Mostrar mensagens de impacto (ex.: "afeta N métricas") antes de salvar a relação.

**DO NOT COPY:** Join resolvido dinamicamente por viz sem registro visível (para BIWEB a relação deve ser determinística e auditável, com rascunho→impacto→publicação); noodle sem indicação alguma de cardinalidade na superfície; a estética antiga dos GIFs.

---

---

### REF-55 — Tabular Editor 3 / Diagram view (diagramas por assunto, relação por arraste, chevron de colunas)

**IMAGES:**
- te3-add-related — https://docs.tabulareditor.com/en/images/add-related-tables.png — "Add Related Tables" — VERIFICADA/inspecionada (cartão "Invoices" com colunas tipadas por ícone: abc, 123, 1.2, calendário; menu contextual: "Add tables…", "Add tables that filter this table", "Add all related tables", "Fit to page", "Auto-arrange" [desabilitado], "Remove from diagram").
- te3-edit-relationship-menu — https://docs.tabulareditor.com/en/images/edit-relationship-diagram.png — "Edit Relationship Diagram" — VERIFICADA/inspecionada (duas tabelas, Budget e Date; linha preta com "*" no lado muitos e triângulo/seta no lado um; menu contextual na linha: Edit Relationship, Invert relationship, Deactivate Relationship, Fit to page, Auto-arrange, Delete relationship).
- te3-create-relationship — https://docs.tabulareditor.com/en/images/create-relationship.png — "Create Relationship" — VERIFICADA/inspecionada (diálogo: From Table/Column, To Table/Column, From Cardinality [One/Many], To Cardinality, checkboxes "Use bi-directional filtering", "Propagate row-level security in both directions", "Enabled").
- te3-chevron — https://docs.tabulareditor.com/en/images/diagram-chevron-toggle.png — "Diagram Chevron Toggle" — VERIFICADA/inspecionada (cartão "Orders" com chevron no cabeçalho destacado por seta verde; colunas com ícones de tipo).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-55_01_te3_add_related`

![REF-55_01_te3_add_related](https://docs.tabulareditor.com/en/images/add-related-tables.png)

`REF-55_02_te3_edit_relationship_menu`

![REF-55_02_te3_edit_relationship_menu](https://docs.tabulareditor.com/en/images/edit-relationship-diagram.png)

`REF-55_03_te3_create_relationship`

![REF-55_03_te3_create_relationship](https://docs.tabulareditor.com/en/images/create-relationship.png)

`REF-55_04_te3_chevron`

![REF-55_04_te3_chevron](https://docs.tabulareditor.com/en/images/diagram-chevron-toggle.png)

**SOURCE:** https://docs.tabulareditor.com/en/features/views/diagram-view.html (docs oficiais Tabular Editor 3; versão/data não informadas na página; changelog oficial cita melhorias do Diagram View em 2023–2025, ex.: https://tabulareditor.com/blog/tabular-editor-3-april-2025-release — NÃO VERIFICADO em detalhe).

**PROBLEM:** Modelos com dezenas de tabelas viram "macarrão" no canvas; criar/entender relações exige ver só o subconjunto relevante e ter controle fino (direção, ativa/inativa) sem poluir.

**SOLUTION:** Diagramas nomeados e múltiplos (arquivos .te3diag reaproveitáveis), compostos por adição incremental de tabelas ("Add related tables", "Add tables that filter this table"), cartões com chevron de 3 níveis (todas as colunas / só colunas-chave / só cabeçalho), relação criada arrastando coluna do lado muitos para o lado um e confirmada num diálogo; edição/inversão/desativação por menu contextual na linha.

**OBSERVE:**
- Glifos de cardinalidade na própria linha: "*" no lado muitos e seta no lado um (direção do filtro visível), sem abrir painel.
- Chevron do cartão alterna All Columns / Key Columns Only / No Columns: densidade controlada por tabela.
- Menu contextual contextual: no cartão (add related/auto-arrange/remove from diagram) e na linha (edit/invert/deactivate/delete) — ações coerentes com o objeto clicado.
- Diálogo de relação expõe propriedades avançadas apenas como checkboxes explícitos (bi-direcional, RLS, Enabled), com defaults desmarcados.
- Boa prática documentada: vários diagramas pequenos em vez de um grande (20+ tabelas fica ingerível) — "diagrama = subject area".
- "Add tables that filter this table" usa a semântica de filtro, não só FK, para escolher vizinhos.

**INTERACTION:** (1) Criar novo diagrama; arrastar tabelas do explorador para o canvas. (2) Clicar com botão direito no cartão → "Add tables that filter this table" ou "Add all related tables". (3) "Auto-arrange" organiza em formato estrela. (4) Arrastar a coluna chave do lado muitos até a coluna da dimensão. (5) Confirmar no diálogo (cardinalidade, filtro bidirecional, Enabled). (6) Clique direito na linha → Edit/Invert/Deactivate/Delete. (7) Chevron do cartão para reduzir colunas. (8) Salvar o diagrama (.te3diag), reutilizável para outros modelos.

**WHY IT WORKS:** Separa "o modelo" de "a vista do modelo": o usuário monta vistas focadas (subject areas) sem alterar o modelo. Densidade ajustável por cartão e expansão por vizinhança evitam carregar o grafo inteiro. Ações destrutivas ficam num menu, não em botões soltos.

**ADAPT TO BIWEB:** VISUAL MODELING. Mapear "diagrama" para subject areas/vistas salvas do modelo semântico (ex.: "Vendas", "Financeiro") com expansão por vizinhança (entidades que filtram esta entidade) e chevron Todas/Só chaves/Cabeçalho para os cartões de Entidade. Relação ativa/inativa e direção apresentadas como ícone/pontilhado na linha; edição no painel lateral de propriedades da relação em vez de diálogo modal, já que o protótipo tem painel de propriedades. Complementa (não repete) o Model view do Power BI REF-06 com a ideia de vistas por vizinhança e diagramas reutilizáveis.

**DO NOT COPY:** Estética desktop Windows/menus densos; exposição de "Propagate row-level security in both directions" no mesmo diálogo (em BIWEB RLS é governança separada); salvar diagramas como arquivos locais.

---

---

### REF-56 — dbdiagram.io + DBML (código ↔ diagrama em tempo real; notação de cardinalidade em texto)

**IMAGES:**
- dbml-editor-gif — https://i.imgur.com/8T1tIZp.gif — "img" (alt genérico; usada na página oficial dbml.dbdiagram.io/home) — VERIFICADA/inspecionada (1º frame: editor de código escuro à esquerda com `Table merchants {...}`, `Ref { orders.user_id > users.id }`; à direita diagrama com cartões azuis orders, order_items, users, merchants, products, countries ligados por linhas; barra superior New/Save/Share/Export; controle de zoom com "Focus/Highlight"). AVISO: UI antiga (visual ~2019–2020), hospedada em imgur.
- dbml-cli-gif — https://dbml.dbdiagram.io/assets/images/dbml-cli-ea4591e2ddcb712dbfd9953aea1d3755.gif — "img" (demo do CLI) — VERIFICADA/só 1º frame (frame inicial é só um terminal vazio "~/ecommerce"; conteúdo restante por doc).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-56_01_dbml_editor_gif`

![REF-56_01_dbml_editor_gif](https://i.imgur.com/8T1tIZp.gif)

`REF-56_02_dbml_cli_gif`

![REF-56_02_dbml_cli_gif](https://dbml.dbdiagram.io/assets/images/dbml-cli-ea4591e2ddcb712dbfd9953aea1d3755.gif)

**SOURCE:** https://dbml.dbdiagram.io/home/ ; https://dbml.dbdiagram.io/docs/ ; https://dbdiagram.io/home — docs oficiais DBML/dbdiagram (Holistics). Versão/data não informadas nas páginas; repo `holistics/dbml` ativo (ver tabela OSS).

**PROBLEM:** Desenhar esquemas arrastando caixas é lento e não versionável; SQL DDL é verboso, específico de banco e sem diagrama.

**SOLUTION:** Uma DSL declarativa mínima (DBML) em que cada relação é uma linha (`Ref: orders.user_id > users.id`) e o diagrama é renderizado ao vivo ao lado do texto; mesmo documento gera SQL, docs (dbdocs) e importa de SQL via CLI.

**OBSERVE:**
- Painel dividido código | diagrama com sincronia imediata: digitar um `Ref` desenha a linha.
- Cardinalidade em 1 caractere: `>` muitos-para-um, `<` um-para-muitos, `-` um-para-um, `<>` muitos-para-muitos (por doc).
- `TableGroup` agrupa tabelas logicamente (subject areas) e `[note: '...']`, `[primary key]` são metadata inline.
- Controles de visualização simples no diagrama: zoom em % e modos "Focus"/"Highlight" para destacar vizinhança de uma tabela.
- Barra superior reduzida a New/Save/Share/Export; sem painel de propriedades pesado.

**INTERACTION:** (1) Digitar `Table users { id int [pk] }`. (2) Digitar `Ref: orders.user_id > users.id`. (3) Ver a linha surgir no diagrama. (4) Arrastar cartões para reorganizar (layout independente do texto). (5) Usar Focus/Highlight para inspecionar uma tabela. (6) Exportar (SQL/PDF/PNG) ou compartilhar link.

**WHY IT WORKS:** O texto é a fonte da verdade (diff, revisão, versionamento) e o diagrama é uma projeção instantânea; usuários avançados escrevem rápido, iniciantes leem o desenho. A notação de cardinalidade em símbolo único é aprendida em minutos.

**ADAPT TO BIWEB:** VISUAL MODELING (modo Visual | Código). Inspiração para o toggle "Visual | Código" do modelo semântico: um painel de código somente-leitura (ou editável com validação) mostrando a Relação em notação compacta enquanto o canvas é editado, e vice-versa. Não implica expor SQL: o "código" seria a definição declarativa do modelo BIWEB (entidades/relações), com PK/FK e cardinalidade explícitas. Serve também para colar/importar definições e gerar rascunho.

**DO NOT COPY:** Layout manual sem persistência semântica; dependência de SQL/DDL como formato de saída (BIWEB não expõe SQL no frontend); GIF antigo como referência visual de estilo; ausência de impacto/governança (diagrama não sabe de métricas dependentes).

---

---

### REF-57 — Power BI / DAX query view (rascunho de medida → preview → "Update model" com CodeLens)

**IMAGES:**
- pbi-dqv-layout — https://learn.microsoft.com/en-us/power-bi/transform-model/media/dax-query-view/dax-query-view-layout.png — "Diagram that shows the DAX query view layout." — VERIFICADA/inspecionada (anotação: Ribbon, Command bar, Data pane, DAX query editor, Results grid, Quick queries, Query tabs).
- pbi-dqv-intellisense — https://learn.microsoft.com/en-us/power-bi/transform-model/media/dax-query-view/dax-query-view-intellisense.png — "Screenshot of the DAX query editor intellisense." — VERIFICADA/inspecionada (editor com `EVALUATE SUMMARIZECOLUMNS(`; calltip "SUMMARIZECOLUMNS([GroupBy_ColumnName1], ..., [FilterTable1]...)" com paginação 1/4 e descrição; lista de funções com ícone fx abaixo).
- pbi-dqv-update-model — https://learn.microsoft.com/en-us/power-bi/transform-model/media/dax-query-view/update-model-with-changes-button.png — "Screenshot of the Update model with changes button available in DAX query view." — VERIFICADA/inspecionada (bloco `DEFINE MEASURE 'Pick a measure'[Sales] = SUM(...)` etc. com CodeLens "Update model: Overwrite measure" acima de cada medida; botão "Update model with changes (4)" em destaque; grade de resultados com Sales/Costs/Profit/Profit Margin; barra inferior "Success (489.5 ms)").
- pbi-dqv-error — https://learn.microsoft.com/en-us/power-bi/transform-model/media/dax-query-view/dax-query-view-results-grid-error.png — "Screenshot of the error message in the results grid." — VERIFICADA/inspecionada (painel de resultados com caixa vermelha "Resolve the error to see results: Query (4, 23) The value for 'Sales 2' cannot be determined…" e botão Copy; abas de query com ícones de status verde/vermelho).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-57_01_pbi_dqv_layout`

![REF-57_01_pbi_dqv_layout](https://learn.microsoft.com/en-us/power-bi/transform-model/media/dax-query-view/dax-query-view-layout.png)

`REF-57_02_pbi_dqv_intellisense`

![REF-57_02_pbi_dqv_intellisense](https://learn.microsoft.com/en-us/power-bi/transform-model/media/dax-query-view/dax-query-view-intellisense.png)

`REF-57_03_pbi_dqv_update_model`

![REF-57_03_pbi_dqv_update_model](https://learn.microsoft.com/en-us/power-bi/transform-model/media/dax-query-view/update-model-with-changes-button.png)

`REF-57_04_pbi_dqv_error`

![REF-57_04_pbi_dqv_error](https://learn.microsoft.com/en-us/power-bi/transform-model/media/dax-query-view/dax-query-view-results-grid-error.png)

**SOURCE:** https://learn.microsoft.com/en-us/power-bi/transform-model/dax-query-view — doc oficial Microsoft Learn, ms.date 2025-09-29, atualizada em 2026-07-22 (lida em 2026-10-07).

**PROBLEM:** Escrever/ajustar uma medida na barra de fórmulas obriga a criar visual de tabela, alternar entre telas e não permite testar várias medidas lado a lado antes de alterar o modelo publicado.

**SOLUTION:** Um espaço de rascunho (DAX query view) onde a medida é definida no escopo da consulta (`DEFINE MEASURE`), avaliada com `EVALUATE` e só depois promovida ao modelo por CodeLens ("Update model: Add new measure / Overwrite measure") ou pelo botão "Update model with changes". Quick queries geram consultas prontas a partir de qualquer tabela/coluna/medida.

**OBSERVE:**
- Separação clara "definir × avaliar × promover": o mesmo editor mostra fórmula e resultado, e o commit é um clique explícito por medida (CodeLens) ou em lote (botão com contagem "(4)").
- Quick queries no menu de contexto do painel de dados: "Evaluate", "Define and evaluate", "Define with references and evaluate" (traz também as medidas referenciadas — dependências visíveis).
- IntelliSense com calltip paginado (1/4 sobrecargas) e lista de funções; Enter/Tab confirmam, Esc fecha.
- Erro mostrado na grade de resultados com posição "Query (linha, coluna)" e botão Copy; abas de query com status (✓ ok, ✗ erro, ■ cancelado, relógio rodando).
- Hover numa medida mostra fórmula, nome e descrição; descrições podem ser escritas com `///` e salvas junto da medida.
- Limites explícitos na doc (15 MB, 1.000.000 valores por consulta) comunicam o custo do preview.

**INTERACTION:** (1) No painel de dados, clicar com botão direito numa medida → Quick queries → "Define with references and evaluate". (2) A consulta aparece em nova aba e roda automaticamente. (3) Editar a fórmula no bloco DEFINE; usar IntelliSense/calltips. (4) Executar (Run); ler a grade de resultados ou o erro com linha/coluna. (5) Quando o resultado estiver correto, clicar no CodeLens "Update model: Overwrite measure" ou em "Update model with changes (N)". (6) Opcional: Format (Shift+Alt+F) e comentários `///` como descrição.

**WHY IT WORKS:** Transforma edição de cálculo em ciclo seguro e curto: rascunhar → ver resultado → promover. A promoção é uma ação explícita e rastreável, e as dependências podem ser trazidas para o contexto de edição sem sair do editor.

**ADAPT TO BIWEB:** EXPRESSION. Para campos calculados em BEL (CodeMirror 6 + WASM), reproduzir o ciclo "Rascunho → Prévia → Publicar": editor BEL com autocomplete/calltip de funções e campos do modelo, painel de resultado/erros inline com posição (linha:coluna) e "Definir com dependências" para trazer medidas referenciadas. A ação "Publicar" deve passar pela análise de impacto do BIWEB (rascunho→impacto→publicação humana) e não ser um clique silencioso como "Update model". Sem SQL: a prévia roda no backend via modelo semântico.

**DO NOT COPY:** Atualização direta do modelo sem análise de impacto/aprovação; UI de ribbon densa; limitação de recursos por abas descartáveis na web; a mistura de linguagem de consulta (EVALUATE/DEFINE) na mesma superfície do campo calculado — manter BEL simples.

---

---

### REF-58 — Power BI / TMDL view (modelo como código: script, Preview com diff, Apply, diagnósticos)

**IMAGES:**
- pbi-tmdl-preview-diff — https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-tabular-model-definition-language-view/tmdl-view-16.png — "Screenshot of preview view pane for pending script changes." — VERIFICADA/inspecionada (à esquerda editor TMDL com `createOrReplace`, `ref table Sales`, medidas e `lineageTag`; à direita, painel destacado em vermelho com diff lado a lado: linhas removidas em vermelho e adicionadas em verde, "249 hidden lines", ex.: `formatString: $ #,##0` → `€ #,##0`, `-12, MONTH` → `-9, MONTH`; botões Apply e Preview no topo; painel Data à direita).
- pbi-tmdl-diagnostics — https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-tabular-model-definition-language-view/tmdl-view-08.png — "Screenshot of error diagnostics in the code editor." — VERIFICADA/inspecionada (squiggle vermelho com tooltip "'summarizeBy' is not a valid property under isHidden — No quick fixes available — View Problem (Alt+F8)"; painel Problems (4) com mensagens por linha/coluna; botão Apply).
- pbi-tmdl-codeaction — https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-tabular-model-definition-language-view/tmdl-view-21.png — "…light bulb icon next to a squiggle, indicating available Code Actions like generating lineage tags." — VERIFICADA/inspecionada (lâmpada na margem; Quick Fix "Replace with new LineageTag").
- pbi-tmdl-script — https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-tabular-model-definition-language-view/tmdl-view-03.png — "Screenshot of the T-M-D-L metadata being created automatically." — VERIFICADA/inspecionada (ícone TMDL na barra lateral; `createOrReplace table Sales` com `measure 'Sales Qty' = sum(...)`, `formatString`, `lineageTag`; minimapa; painel Data com Tables/Model).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-58_01_createorreplace`

![REF-58_01_createorreplace](https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-tabular-model-definition-language-view/tmdl-view-16.png)

`REF-58_02_pbi_tmdl_diagnostics`

![REF-58_02_pbi_tmdl_diagnostics](https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-tabular-model-definition-language-view/tmdl-view-08.png)

`REF-58_03_pbi_tmdl_codeaction`

![REF-58_03_pbi_tmdl_codeaction](https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-tabular-model-definition-language-view/tmdl-view-21.png)

`REF-58_04_formatstring`

![REF-58_04_formatstring](https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-tabular-model-definition-language-view/tmdl-view-03.png)

**SOURCE:** https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-tmdl-view — doc oficial Microsoft Learn, ms.date 2026-07-07, atualizada em 2026-09-29. Status declarado: TMDL view no Desktop = Generally Available; na web = Preview.

**PROBLEM:** A UI gráfica não expõe todas as propriedades do modelo, edição em lote (renomear 100 colunas, prefixos dim_/fact_) é manual e é difícil revisar o efeito de um script antes de aplicá-lo.

**SOLUTION:** Um editor de código para metadata do modelo: arrastar objeto do painel de dados gera o script TMDL (`createOrReplace`), o editor oferece autocomplete, tooltips, diagnósticos e code actions; "Preview" mostra o diff do modelo antes/depois; "Apply" executa. Na web há modo View (script/preview) separado de Edit (aplicar).

**OBSERVE:**
- Entrada sem digitação: arrastar um objeto do painel de dados gera o código correspondente ("script this object").
- Preview = diff semântico do modelo inteiro (não do texto da aba), com vermelho/verde, alternância inline/side-by-side e navegação entre diffs.
- Diagnósticos em três camadas: squiggle com tooltip, lâmpada com quick fix e painel Problems clicável.
- Salvaguardas explícitas: aviso de upgrade de compatibility level, nota de que renomear campo pode quebrar visuais, "não refaz refresh de dados".
- `lineageTag` é metadata de identidade gerada por code action — rastreabilidade de renomeações.
- Abas de script salvas com o projeto; na web, modos View/Edit para "experimentar com segurança".

**INTERACTION:** (1) Abrir TMDL view. (2) Arrastar tabela/medida do painel Data para o editor. (3) Editar (Ctrl+Space autocomplete; Ctrl+F com regex para renomear em massa). (4) Corrigir erros pelo painel Problems/lâmpada. (5) Clicar em Preview e revisar o diff vermelho/verde. (6) Clicar em Apply; ler banner de sucesso/falha e detalhes no Output.

**WHY IT WORKS:** Dá poder máximo a quem precisa (todas as propriedades, edição em massa) sem forçar quem não precisa; o Preview-diff transforma "executar script" em decisão informada.

**ADAPT TO BIWEB:** EXPRESSION (modelo declarativo/metadata, não relações). Útil para um painel "Código" do modelo semântico no modo rascunho: ver a definição declarativa da Entidade/Medida/Relação, editar em lote (renomear, adicionar sinônimos, classificação PII) e antes de publicar mostrar o diff entre rascunho e publicado (equivalente ao Preview) integrado à análise de impacto. Um identificador estável (como lineageTag) por objeto sustenta lineage e renomeações sem quebrar dependentes.

**DO NOT COPY:** Aplicar direto no modelo vivo; expor propriedades de engine (compatibility level, IsAvailableInMDX) a usuários finais; dependência de VS Code/PBIP/Git para o fluxo.

---

---

### REF-59 — Tabular Editor 3 / DAX editor (peek/define com dependências) + Best Practice Analyzer

**IMAGES:**
- te3-peek-definition — https://docs.tabulareditor.com/en/images/peek-definition.png — "Peek Definition" — VERIFICADA/inspecionada (editor com `KpiStatusExpression = IF(ISBLANK([Internet Current Quarter Sales Performance]), BLANK(), IF(...` e, inline abaixo da linha 92, um painel flutuante com a definição da medida referenciada: `IFERROR([Internet Current Quarter Sales] / [Internet Last Quarter Sales Proportion to QTD], BLANK())`).
- te3-define-deps — https://docs.tabulareditor.com/en/images/define-measure-with-deps.png — "Define Measure With Deps" — VERIFICADA/inspecionada (aba "DAX Script 1", seletor de objeto e campo "fx Expression"; `MEASURE '__Demo Measures'[Sales] = CALCULATE(...)`; menu: Peek Definition Alt+F12, Go To Definition F12, Inline measure, Define measure, "Define measure with dependencies" selecionado, List Objects Ctrl+Space).
- te3-bpa — https://docs.tabulareditor.com/en/images/common/BPAOverview.png — "BPA Overview" — VERIFICADA/inspecionada (janela "Best Practice Analyzer": tabela com Object/Type/Sev./Category; grupos expansíveis como "[Formatting] Do not summarize numeric columns (14 objects)", "Hide foreign keys (2 objects)", "Visible measures with no description (49 objects)"; severidade 1–3; categorias Formatting/Maintenance/Performance).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-59_01_te3_peek_definition`

![REF-59_01_te3_peek_definition](https://docs.tabulareditor.com/en/images/peek-definition.png)

`REF-59_02_te3_define_deps`

![REF-59_02_te3_define_deps](https://docs.tabulareditor.com/en/images/define-measure-with-deps.png)

`REF-59_03_te3_bpa`

![REF-59_03_te3_bpa](https://docs.tabulareditor.com/en/images/common/BPAOverview.png)

**SOURCE:** https://docs.tabulareditor.com/en/features/dax-editor.html ; https://docs.tabulareditor.com/en/features/using-bpa.html — docs oficiais Tabular Editor 3 (recursos disponíveis nas edições Desktop/Business/Enterprise; data/versão da doc não informada).

**PROBLEM:** Medidas encadeadas (uma referencia a outra, que referencia outra) são difíceis de entender e depurar numa barra de fórmula de uma linha; qualidade do modelo (descrições faltando, chaves visíveis, formatos) degrada sem checagem automática.

**SOLUTION:** Editor de expressões com Code Assist (autocomplete contextual, calltips alternando sobrecargas com ↑/↓), Peek/Go To Definition, "Define measure with dependencies" (traz toda a cadeia de medidas para o editor), "Inline measure", formatação e Refactor (renomear variáveis). Em paralelo, o Best Practice Analyzer varre o modelo em segundo plano a cada mudança e lista violações agrupadas por regra, severidade e categoria.

**OBSERVE:**
- Peek Definition abre a definição da dependência INLINE, sem sair da posição (Alt+F12); Go To Definition navega (F12) e volta (Alt+←).
- "Define measure with dependencies" é a forma explícita de materializar o grafo de dependências de um cálculo como código.
- "Inline measure" substitui a referência pela expressão, embrulhando em CALCULATE quando necessário para preservar contexto de linha — o editor protege semântica.
- BPA agrupa violações por regra com contagem de objetos, severidade numérica e categoria; regras customizáveis (JSON) e ativadas por padrão.
- Autoformatação ao digitar (caixa de funções, indentação) e F6 para formatar.

**INTERACTION:** (1) Cursor sobre a referência de medida → Alt+F12 para espiar a definição. (2) Botão direito → "Define measure with dependencies" para ver a cadeia completa. (3) Editar e formatar (F6). (4) Abrir o BPA; expandir regra → lista de objetos violadores; corrigir ou ignorar. (5) BPA reexecuta em segundo plano após alterações.

**WHY IT WORKS:** Torna a dependência navegável no próprio editor (menos troca de contexto) e institucionaliza qualidade com regras listadas, agrupadas e priorizadas em vez de revisão manual.

**ADAPT TO BIWEB:** EXPRESSION + validação. No editor BEL: "espiar definição" de campo/medida referenciada num popover e "mostrar dependências" (cadeia de medidas/campos calculados) a partir do cursor. Para o rascunho do modelo, um painel "Verificações" estilo BPA com regras agrupadas por severidade/categoria (ex.: métrica publicada sem descrição, campo PII sem classificação, entidade sem chave, medida sem semântica de aditividade, sinônimos ausentes) alimentando a análise de impacto antes da publicação.

**DO NOT COPY:** Menus/atalhos de aplicativo desktop Windows; regras BPA genéricas de Power BI (ex.: IsAvailableInMDX) — BIWEB define regras próprias do seu modelo; edição ilimitada de expressões em SQL/DAX para usuário final.

---

---

### REF-60 — Looker / LookML IDE: validação em duas camadas (erros em linha + Validate LookML + Project Health)

**IMAGES:**
- looker-ide-validate — https://docs.cloud.google.com/static/looker/docs/images/dev-validate-lookml-2402.png — (sem alt) — VERIFICADA/inspecionada (IDE com arquivo `aircraft.view`, dimensões com `sql: ${TABLE}.address1`; faixa verde na margem de gutter; cabeçalho com branch pessoal "dev-jon-allen-rhbc", "Recheck Errors" e botão laranja "Validate LookML"; painel "Project Health" à direita com "General Warnings: Unbuilt PDTs" e "LookML validation: Errors out of date. Click the test button…"). Imagem com aparência de IDE de ~2021–2024.
- looker-row-error — https://docs.cloud.google.com/static/looker/docs/images/lookml-row-error-720.png — "Example of an error that appears upon hover for a type parameter definition with no value…" — VERIFICADA/inspecionada (linha 6 com ícone "x" vermelho na margem e squiggle sob `type:`; tooltip escuro "Must provide a value for "type"").
- looker-warnings-list — https://docs.cloud.google.com/static/looker/docs/images/lookml-warnings-expanded-list-720.png — (sem alt) — VERIFICADA/inspecionada (cabeçalhos "LookML Errors (9)" e "LookML Warnings (3)" com setas de expandir; texto explicativo; itens como "LookML file … not found — 43 occurrences", "Unknown view … referenced by explore — 18 occurrences", cada um expansível).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-60_01_aircraft_view`

![REF-60_01_aircraft_view](https://docs.cloud.google.com/static/looker/docs/images/dev-validate-lookml-2402.png)

`REF-60_02_looker_row_error`

![REF-60_02_looker_row_error](https://docs.cloud.google.com/static/looker/docs/images/lookml-row-error-720.png)

`REF-60_03_looker_warnings_list`

![REF-60_03_looker_warnings_list](https://docs.cloud.google.com/static/looker/docs/images/lookml-warnings-expanded-list-720.png)

**SOURCE:** https://docs.cloud.google.com/looker/docs/lookml-validation — doc oficial Google Cloud/Looker (existem versões datadas 2604/2608 da doc; imagens de UI anteriores). Sem data específica na página.

**PROBLEM:** Erros num modelo semântico só aparecem quando alguém consulta (e quebra); quem edita precisa saber, antes de publicar, se referências a campos/views/joins continuam válidas.

**SOLUTION:** Duas camadas: (1) checagem de sintaxe em tempo real por arquivo (squiggle + ícone na margem + tooltip); (2) "Validate LookML" valida o projeto todo (referências entre arquivos, joins ausentes), separando Errors (podem impedir consultas) de Warnings (comportamento inesperado) e agrupando por tipo com contagem de ocorrências expansível; o botão de Project Health mostra o estado e se os resultados estão desatualizados.

**OBSERVE:**
- Estado de validade explícito: "Errors out of date. Click the test button to validate your most recently saved LookML" — o sistema admite quando o resultado está velho.
- Erros agrupados por mensagem com "N occurrences" expansível: colapsa 43 erros iguais em uma linha.
- Distinção semântica: Errors vs Warnings com ícones distintos (vermelho x / amarelo !).
- Branch de desenvolvimento pessoal visível no cabeçalho: validação ocorre em rascunho antes de deploy.
- Ícone verde de "no errors" como estado positivo claro.
- Itens expansíveis linkam para o ponto do código (navegação por clique).

**INTERACTION:** (1) Editar LookML; erros de sintaxe aparecem em linha (hover). (2) Clicar "Validate LookML" (ou ícone Project Health → validar). (3) Ler "LookML Errors (n)" e "Warnings (n)"; expandir grupos e ocorrências. (4) Clicar na ocorrência para ir à linha. (5) Corrigir e "Recheck Errors". (6) Só então commit/deploy para produção.

**WHY IT WORKS:** Validação proporcional ao custo: barata e contínua para sintaxe, sob demanda para o grafo inteiro; agrupar por causa-raiz reduz ruído; nomear estados "desatualizado/ok" evita falsa confiança.

**ADAPT TO BIWEB:** EXPRESSION + validação. Aplicar ao rascunho do modelo semântico: validação de BEL em tempo real no editor (squiggle + tooltip) e "Validar rascunho" que varre o modelo inteiro (campos/medidas/relações quebradas, entidade sem chave, ciclos), com painel Erros × Avisos agrupados por causa e contagem de ocorrências, estado "resultado desatualizado" e bloqueio de "Enviar para análise de impacto" enquanto houver erros. Complementa D11 (dependências quebradas pós-fato) com o antes-da-publicação.

**DO NOT COPY:** Dependência de Git/branches como único meio de rascunho; mensagens técnicas sobre PDTs/includes; IDE de código-fonte como interface padrão para analistas.

---

---

### REF-61 — dbt Catalog (Explorer) / Lineage graph + Column-level lineage + Lenses

**IMAGES:**
- dbt-lineage-graph — https://docs.getdbt.com/img/docs/collaborate/dbt-explorer/example-project-lineage-graph.png?v=2 — "Example of full lineage graph" — VERIFICADA/inspecionada (barra superior com fechar, seletor de projeto "Jaffle Shop Snowflake", busca "Search with selectors (e.g. model_name+)", botão refresh; grafo da esquerda p/ direita: nós SRC (verde-água) → MDL (azul) → customers selecionado; nós fora do caminho esmaecidos; legenda de tipos "Model, Source, Snapshot, Seed, Metric, Semantic Model, Saved Query, Exposure"; botão "Lenses: Resource type"; painel lateral "customers" com tabs General/Columns, Description, Project, Owner "No owner. Learn how to define.", Tags, Relation, Model access (mesh) Protected, Contract enforced, Materialization).
- dbt-test-status-lens — https://docs.getdbt.com/img/docs/collaborate/dbt-explorer/example-test-status.png?v=2 — "Example of the Test Status lens" — VERIFICADA/inspecionada (mesmo grafo com selos PASS/UNKNOWN sobre cada nó; busca `resource_type:model`; seletor "Lenses: Test status"; legenda Pass/Error/Fail/Warn/Skipped/Reused).
- dbt-column-evolution — https://docs.getdbt.com/img/docs/collaborate/dbt-explorer/example-evolution-lens.png?v=2 — "Example of the Column evolution lens" — VERIFICADA/inspecionada (card de coluna COUNT_LIFETIME_ORDERS com descrição e tags, botão "CLL"; cadeia de colunas: ID (RAW, source) → ORDER_ID PK (RENAME) → ORDER_ID PK (PASSTHROUGH) → COUNT_LIFETIME_ORDERS (TRANSFORMATION, expressão `COALESCE(COUNT(DISTINCT ORDERS.OR…`); aviso "Column lineage may be missing columns ⓘ"; botão "Full Lineage"; legenda Unknown/Raw/Parse Error/Passthrough/Transformation/Rename).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-61_01_dbt_lineage_graph`

![REF-61_01_dbt_lineage_graph](https://docs.getdbt.com/img/docs/collaborate/dbt-explorer/example-project-lineage-graph.png?v=2)

`REF-61_02_dbt_test_status_lens`

![REF-61_02_dbt_test_status_lens](https://docs.getdbt.com/img/docs/collaborate/dbt-explorer/example-test-status.png?v=2)

`REF-61_03_dbt_column_evolution`

![REF-61_03_dbt_column_evolution](https://docs.getdbt.com/img/docs/collaborate/dbt-explorer/example-evolution-lens.png?v=2)

**SOURCE:** https://docs.getdbt.com/docs/explore/explore-projects ; https://docs.getdbt.com/docs/explore/column-level-lineage — docs oficiais dbt (plataforma dbt, "Catalog"; CLL requer plano Enterprise/Enterprise+ por doc; também local via dbt v2). Lidas em 2026-10-07; datas de páginas não informadas.

**PROBLEM:** Com centenas de modelos, o DAG completo é ilegível; analistas precisam responder "de onde vem?", "o que depende disto?" e "esta coluna é só repassada ou transformada?".

**SOLUTION:** Grafo navegável com busca por seletores (`+orders`, `resource_type:model`), painel de detalhes do nó, "Lenses" (camadas visuais que recolorem o mesmo grafo: tipo, materialização, status de testes, camada), e lineage de coluna com lente "Evolution" que classifica cada salto como Raw/Passthrough/Rename/Transformation.

**OBSERVE:**
- Foco por esquecimento: nós fora do caminho do selecionado ficam esmaecidos (não removidos), mantendo contexto.
- Lenses trocam a semântica de cor sem mudar o layout — uma pergunta por vez (status de teste, tipo, evolução).
- Painel lateral com owner, tags, descrição, contrato e relações; "No owner. Learn how to define." transforma lacuna de governança em chamada para ação.
- Menu de contexto do nó: refocar em upstream/downstream/ambos.
- Aviso honesto de limitação ("Column lineage may be missing columns ⓘ"; erros de parse tipados).
- Descrições se propagam por colunas Passthrough/Rename (documentar uma vez).

**INTERACTION:** (1) Abrir Overview → Explore Lineage. (2) Digitar seletor na busca (ex.: `+customers`). (3) Clicar num nó → painel lateral General/Columns. (4) Escolher lente (Test status). (5) Aba Columns → clicar na coluna → "CLL" → ver cadeia de colunas com lente Evolution. (6) "Full Lineage" para expandir. (7) Botão direito no nó → refocar upstream/downstream.

**WHY IT WORKS:** Reduz o grafo a uma pergunta por vez (seletor + lente + esmaecimento), e leva o usuário de visão ampla (projeto) a estreita (coluna) sem trocar de ferramenta.

**ADAPT TO BIWEB:** LINEAGE. Para lineage de métricas/dimensões do modelo semântico: grafo Entidade → Dimensão/Medida → Métrica publicada → Dashboard/relatório, com seletor de busca (ex.: `+Receita`), lente "Certificação" (certificada/depreciada/rascunho), lente "Classificação PII" e lente "Owner ausente". Na lineage de campo calculado BEL, mostrar saltos Raw/Passthrough/Transformação com a expressão BEL resumida. Painel lateral reutiliza o painel de propriedades do modelo (owners, sinônimos, certificação).

**DO NOT COPY:** Lineage somente de pipelines SQL/dbt (BIWEB é modelo semântico, não DAG de transformação); dependência de jobs/ambientes de produção; busca por seletor como única via (oferecer filtros visuais equivalentes).

---

---

### REF-62 — DataHub / Lineage visual + Impact Analysis (lista filtrável e exportável)

**IMAGES:**
- datahub-lineage-view — https://raw.githubusercontent.com/datahub-project/static-assets/main/imgs/lineage/lineage-view-v3.png — (sem alt) — VERIFICADA/inspecionada (grafo horizontal: tabelas HUMAN_PROFILES/PET_PROFILES/PETS (Snowflake) → nós dbt (ícone laranja) → PET_DETAILS (com "Home" e check verde) → view pet_details (Looker) → quatro Explores; cada nó com contador "Columns 16" expansível; setas < > nas bordas para carregar mais upstream/downstream; alerta vermelho em PET_PROFILES).
- datahub-column-lineage — https://raw.githubusercontent.com/datahub-project/static-assets/main/imgs/lineage/column-level-lineage-v3.png — (sem alt) — VERIFICADA/inspecionada (nó PET_DETAILS expandido com busca "Find column" e lista de colunas paginada (1,2); coluna `species` destacada com arestas roxas até pet_details.species e aos quatro Explores; resto das arestas esmaecido; minimapa no canto).
- datahub-impact-filters — https://raw.githubusercontent.com/datahub-project/static-assets/main/imgs/impact-analysis-filter-dependencies.png — (sem alt) — VERIFICADA/inspecionada (página de dataset dog_breeds, tab Lineage; botões Downstream/Upstream e "Visualize Lineage"; painel Filters: "Degree of Dependencies" 1/2/3+, Type (Charts 65, Dashboards 17, Datasets 2), Tag, Domain; lista com "1st", "2nd", "4th" grau; ao lado owners/tags/glossary terms).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-62_01_datahub_lineage_view`

![REF-62_01_datahub_lineage_view](https://raw.githubusercontent.com/datahub-project/static-assets/main/imgs/lineage/lineage-view-v3.png)

`REF-62_02_species`

![REF-62_02_species](https://raw.githubusercontent.com/datahub-project/static-assets/main/imgs/lineage/column-level-lineage-v3.png)

`REF-62_03_datahub_impact_filters`

![REF-62_03_datahub_impact_filters](https://raw.githubusercontent.com/datahub-project/static-assets/main/imgs/impact-analysis-filter-dependencies.png)

**SOURCE:** https://docs.datahub.com/docs/features/feature-guides/lineage ; https://docs.datahub.com/docs/act-on-metadata/impact-analysis — docs oficiais DataHub (OSS + Cloud); screenshots "v3" de UI; versão/data exata NÃO VERIFICADO.

**PROBLEM:** Antes de mudar ou depreciar um ativo é preciso saber quem depende dele (incluindo dashboards a vários graus), e o grafo visual não escala para listas longas ou para ações em lote.

**SOLUTION:** Duas visões do mesmo dado: (a) Lineage visual com colunas expansíveis e destaque por hover/clique em coluna; (b) Impact Analysis como lista (tab Lineage) com toggle Upstream/Downstream, grau de dependência (1/2/3+) e filtros por tipo/owner/domínio/tag, exportável para CSV (até 10.000 registros, por doc).

**OBSERVE:**
- Cada nó mostra "Columns N" colapsado; expandir revela busca e paginação; clique numa coluna ilumina só seu caminho e esmaece o resto.
- Bordas do grafo com setas < > numeradas para carregar mais vizinhos — carregamento sob demanda.
- Impact Analysis usa por padrão 1 grau (performance) e mostra "1st/2nd/4th" por linha: o impacto é graduado.
- A lista reutiliza os mesmos facets de busca (tipo, tag, domínio, owner), então responde "quais dashboards certificados dependem?".
- Contador "1 upstream, 2 downstream" ao lado do tab dá resumo antes de abrir.
- Tab Lineage fica desabilitado (cinza) quando não há metadado ingerido — estado vazio explícito.

**INTERACTION:** (1) Abrir a página do ativo → "Lineage". (2) Alternar Downstream/Upstream; abrir "Filters" e escolher grau 1/2/3+ e tipos. (3) Opcional: "Visualize Lineage" para o grafo. (4) No grafo, expandir "Columns" e clicar numa coluna para isolar seu caminho. (5) Exportar a lista completa para CSV.

**WHY IT WORKS:** O mesmo grafo tem uma visão exploratória (visual) e uma operacional (lista filtrável/exportável); graduar o impacto por grau evita tratar todas as dependências como equivalentes.

**ADAPT TO BIWEB:** LINEAGE + impacto. Na análise de impacto antes da publicação, mostrar lista "Afetados por esta mudança" (métricas, painéis, relatórios, campos calculados BEL) com grau 1/2/3+, filtros por tipo/owner/certificação e exportação; no grafo, expandir Entidade para ver Dimensões/Medidas e destacar o caminho de um campo ao clicar. Estado vazio explícito quando um campo não tem dependentes.

**DO NOT COPY:** Dependência de ingestão de metadados externos e SQL parsing; complexidade de facets de catálogo geral (plataformas, domínios) em excesso; grafo como única forma de ver impacto.

---

---

### REF-63 — OpenMetadata / Lineage com camadas (Column, Observability, Service, Domain, Data Product) + Impact Analysis em tabela

**IMAGES:**
- om-column-layer — https://mintcdn.com/openmetadata/ukveY9QLJfPEF8DI/public/images/how-to-guides/lineage/column-layer.png?fit=max&auto=format&n=ukveY9QLJfPEF8DI&q=85&s=23e9cf3048210dd65f61df9660452f3f — "Column Layer in Lineage" — VERIFICADA/inspecionada (barra superior com filtro, busca "Search Lineage", segmentado "Lineage | Impact Analysis", seletor de período "All time", ícones de editar/download/config/tela cheia; grafo com cartões de tabela (ORGANIZATIONS, USERS, API_REQUESTS → STG_* → DAILY_USAGE com selo "Base" → EXEC_DASHBOARD), cada um com lista de colunas e busca interna, arestas coluna-a-coluna; barra inferior "Layers: Column (selecionada), Observability, Service, Domain"; minimapa e controles de zoom).
- om-impact-analysis — https://mintcdn.com/openmetadata/ukveY9QLJfPEF8DI/public/images/how-to-guides/lineage/impact-analysis.png?fit=max&auto=format&n=ukveY9QLJfPEF8DI&q=85&s=2f190afc98d404651861d243d72246c9 — "Impact Analysis table view" — VERIFICADA/inspecionada (tab "Impact Analysis" destacado; sub-tabs Upstream (5)/Downstream; "Impact On: Table"; botão Customize; tabela com Name, Node Depth, Description, Domains, Owners, Tier, Tags, Glossary Terms — linhas API_REQUESTS, USERS, ORGANIZATIONS (depth 2), STG_API_REQUESTS, STG_USERS (depth 1); vários "No Owners/No Domains").
- om-edge-info — https://mintcdn.com/openmetadata/ukveY9QLJfPEF8DI/public/images/how-to-guides/lineage/edge.png?fit=max&auto=format&n=ukveY9QLJfPEF8DI&q=85&s=6f5183924725ff75a1a9dee38de339ab — "Edge Information: Source and Target" — VERIFICADA/inspecionada (drawer "Edge Information": Description editável, Overview com Source API_REQUESTS e Target STG_API_REQUESTS, Created By/Updated by "ingestion-bot", bloco "SQL Query" com `CREATE OR REPLACE VIEW STAGING.STG_API_REQUESTS AS SELECT r.request_id…`, seção "Source of Lineage").


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-63_01_om_column_layer`

![REF-63_01_om_column_layer](https://mintcdn.com/openmetadata/ukveY9QLJfPEF8DI/public/images/how-to-guides/lineage/column-layer.png?fit=max&auto=format&n=ukveY9QLJfPEF8DI&q=85&s=23e9cf3048210dd65f61df9660452f3f)

`REF-63_02_om_impact_analysis`

![REF-63_02_om_impact_analysis](https://mintcdn.com/openmetadata/ukveY9QLJfPEF8DI/public/images/how-to-guides/lineage/impact-analysis.png?fit=max&auto=format&n=ukveY9QLJfPEF8DI&q=85&s=2f190afc98d404651861d243d72246c9)

`REF-63_03_om_edge_info`

![REF-63_03_om_edge_info](https://mintcdn.com/openmetadata/ukveY9QLJfPEF8DI/public/images/how-to-guides/lineage/edge.png?fit=max&auto=format&n=ukveY9QLJfPEF8DI&q=85&s=6f5183924725ff75a1a9dee38de339ab)

**SOURCE:** https://docs.open-metadata.org/latest/how-to-guides/data-lineage/explore (redireciona para docs v2.0.x; menções a v2.1.x na página). Doc oficial OpenMetadata.

**PROBLEM:** Lineage de um catálogo grande mistura níveis (coluna, tabela, serviço, domínio) e preocupações (qualidade, governança); o usuário se perde em um único grafo.

**SOLUTION:** Um único grafo com "layers" (Column, Observability, Service, Domain, Data Product) que mudam o que é visível/anotado, mais configuração de profundidade/nós por camada e um tab "Impact Analysis" que mostra o mesmo conjunto em tabela (asset-level ou column-level) com owner, tier, domínio, tags e glossário. Cada aresta abre um drawer com origem, destino, quem criou e o SQL.

**OBSERVE:**
- Segmentado "Lineage | Impact Analysis" no topo troca a representação sem mudar de página.
- "Impact On: Table/Column" na tabela — mesma pergunta em dois níveis de granularidade.
- Coluna "Node Depth" e colunas de governança (Owners, Tier, Domains, Glossary Terms): impacto + responsabilidade na mesma linha.
- Aresta clicável com proveniência: quem criou, quando, e a transformação (SQL) — a lineage "se explica".
- Configuração de profundidade e "nodes per layer" evita explosão do grafo; excedentes paginam.
- Layers de governança (Domain, Data Product) reaproveitam o mesmo grafo para visão de negócio.

**INTERACTION:** (1) Abrir o ativo → Lineage. (2) Escolher camada na barra inferior (Column, Observability, …). (3) Clicar em aresta → drawer com origem/destino/SQL. (4) Alternar para "Impact Analysis"; escolher Upstream/Downstream e "Impact On". (5) Customize colunas; exportar. (6) Engrenagem para ajustar profundidade/nós por camada.

**WHY IT WORKS:** Layers permitem "uma pergunta por vez" sobre o mesmo grafo, e a visão em tabela atende quem precisa agir (atribuir owner, notificar) em vez de explorar.

**ADAPT TO BIWEB:** LINEAGE. Camadas para o grafo do modelo semântico: "Campos", "Certificação/Qualidade" e "Domínio/Owner"; na análise de impacto, tabela com profundidade e colunas de governança (owner, certificação, classificação). Aresta clicável para campo calculado BEL: mostrar a expressão BEL (em vez de SQL) e quem a publicou/quando — proveniência do cálculo.

**DO NOT COPY:** Exposição de SQL bruto na aresta (BIWEB não tem SQL no frontend; mostrar BEL/expressão do modelo); camadas de infraestrutura (Service) irrelevantes ao usuário de BI; densidade de colunas em todos os nós por padrão.

---

---

### REF-64 — Metabase Data Studio / Dependency graph + Dependency diagnostics (dependências quebradas, entidades sem referência)

**IMAGES:**
- metabase-dependency-graph — https://www.metabase.com/docs/latest/data-studio/images/dependency-graph.png — "Dependency graph" — VERIFICADA/inspecionada (cartões da esquerda p/ direita: Tables (Products, Orders, Customers) → Transform sales_data_transform → Table Sales → Questions/SQL question → Dashboard "Business performance"; cada cartão com tipo no topo e "Used by 7 questions / 1 metric / 2 segments / 3 measures" como chips; "Nothing uses this" no nó final; linhas finas conectando pontos).
- metabase-broken-dependencies — https://www.metabase.com/docs/latest/data-studio/images/broken-dependencies.png — "Broken dependencies" — VERIFICADA/inspecionada (página "Dependency diagnostics" com abas "Broken dependencies | Unreferenced entities", busca e Filter; tabela com Dependency, Location, Problems ("Missing column sum", "2 missing columns"); painel lateral do modelo "Marketing Attribution": descrição, criado/editado por Admin em Feb 13, 2026, "2 Missing columns" (Conversion rate, source) e "4 Broken dependents" com "9 views", "7 views").
- metabase-unreferenced — https://www.metabase.com/docs/latest/data-studio/images/unreferenced-entities.png — "Unreferenced entities" — VERIFICADA/inspecionada (lista de itens não usados com ícones de tipo — métrica, segmento, medida (Σ), snippet — e Location; painel lateral "Customers by tier" com descrição e criador).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-64_01_metabase_dependency_graph`

![REF-64_01_metabase_dependency_graph](https://www.metabase.com/docs/latest/data-studio/images/dependency-graph.png)

`REF-64_02_metabase_broken_dependencies`

![REF-64_02_metabase_broken_dependencies](https://www.metabase.com/docs/latest/data-studio/images/broken-dependencies.png)

`REF-64_03_metabase_unreferenced`

![REF-64_03_metabase_unreferenced](https://www.metabase.com/docs/latest/data-studio/images/unreferenced-entities.png)

**SOURCE:** https://www.metabase.com/docs/latest/data-studio/dependencies/graph ; https://www.metabase.com/docs/latest/data-studio/dependencies/diagnostics — docs oficiais Metabase (Data Studio; Pro/Enterprise por doc; screenshots com datas de fev/2026; releases: metabase 59).

**PROBLEM:** Renomear/excluir uma coluna ou medida quebra silenciosamente perguntas e dashboards; o time só descobre quando alguém reclama, e itens órfãos se acumulam.

**SOLUTION:** Um grafo de dependências entre conteúdo (tabelas, models, questions, métricas, segmentos, medidas, dashboards, snippets) com contagem "Used by" por tipo em cada cartão, e uma página de diagnóstico com duas abas: "Broken dependencies" (o que referencia coluna que não existe, com quem quebra e quantas views tem) e "Unreferenced entities" (candidatos a limpeza).

**OBSERVE:**
- Cada cartão agrega dependentes por tipo em chips ("7 questions", "1 metric", "3 measures") — impacto resumido sem desenhar centenas de arestas.
- "Nothing uses this" como estado explícito de nó folha.
- Painel de problema detalha colunas ausentes e dependentes quebrados com views (peso do dano = nº de visualizações).
- Aviso honesto: alguns itens aparecem "quebrados" mesmo retornando resultado (campos Unknown) e itens "não referenciados" podem ter dependentes invisíveis por permissão.
- Duas perguntas separadas: "o que está quebrado?" (urgência) e "o que sobra?" (higiene).
- Grafo acessível a partir da aba "Dependencies" de cada item (ex.: Medida: Definition | Revision history | Dependencies).

**INTERACTION:** (1) Data Studio → Dependency graph; ou abrir um item → aba Dependencies. (2) Ler os chips "Used by" antes de alterar. (3) Data Studio → Dependency diagnostics → Broken dependencies; filtrar e clicar na linha. (4) No painel, ver colunas ausentes e dependentes quebrados; ir ao item para consertar. (5) Aba Unreferenced entities para arquivar o que não é usado.

**WHY IT WORKS:** Resume o impacto como contagens por tipo e traz a pior notícia (quebrado) para uma lista acionável, com número de views como priorização.

**ADAPT TO BIWEB:** LINEAGE + validação/impacto. Na tela de dados enriquecida: em cada Medida/Métrica/Dimensão exibir chips "Usado por: N métricas · N painéis · N relatórios" e aba "Dependências"; página "Diagnóstico do modelo" com "Dependências quebradas" (campos referenciados que não existem mais) e "Sem uso" (métricas/medidas órfãs, candidatas à depreciação). A lista de quebrados alimenta o bloqueio/aviso na análise de impacto do rascunho.

**DO NOT COPY:** Grafo geral de conteúdo sem foco (pode virar parede de cartões); limitar a feature a planos pagos; deixar a descoberta de quebra para depois do fato (BIWEB checa no rascunho antes de publicar).

---

---

### REF-65 — Metabase / Metadata de campos e tabelas + definição de Medida (Data Studio) + Schema viewer

**IMAGES:**
- metabase-table-metadata — https://www.metabase.com/docs/latest/data-modeling/images/table-metadata-settings.png — "Table metadata settings" — VERIFICADA/inspecionada (Admin → "Table Metadata": coluna 1 árvore de tabelas com busca e "Segments"; coluna 2 cartões de campos (ID, Ean, Title, Category, Vendor, Price, Rating, Created At) com ícone de tipo e descrição editável, botões "Sorting" e "Sync options"; coluna 3 "Field settings" com seções Data (Field name, Data type, "Cast to a specific data type"), Metadata ("Semantic type: Category"), Behavior (Visibility, Filtering, Display values) e botões "Preview" e "Field values"; coluna 4 "Field preview" com abas Table/Detail/Filtering mostrando a coluna renderizada).
- metabase-measure-definition — https://www.metabase.com/docs/latest/data-studio/images/measure-definition.png — "Measure definition" — VERIFICADA/inspecionada (medida "Net Promoter Score" com abas Definition | Revision history | Dependencies; editor "Custom Expression" `(CountIf([Score] >= 9) - CountIf([Score] <= 6)) / Count() * 100` com realce de campos [Score] e números; ícones ƒ (funções) e {} (referências); botões Cancel/Update).
- metabase-schema-viewer — https://www.metabase.com/docs/latest/data-studio/images/schema-viewer.png — "Schema viewer" — VERIFICADA/inspecionada (canvas com seletor de schema "public", busca "Jump to table"; cartões orders, people, products, reviews com colunas tipadas (ícones: chave/FK/texto/#/data/localização) e tipos int8/varchar; FKs `user_id`, `product_id` em azul; linhas tracejadas ligando FK à PK da outra tabela; botão "Auto-layout"; minimapa no canto inferior direito).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-65_01_metabase_table_metadata`

![REF-65_01_metabase_table_metadata](https://www.metabase.com/docs/latest/data-modeling/images/table-metadata-settings.png)

`REF-65_02_metabase_measure_definition`

![REF-65_02_metabase_measure_definition](https://www.metabase.com/docs/latest/data-studio/images/measure-definition.png)

`REF-65_03_user_id`

![REF-65_03_user_id](https://www.metabase.com/docs/latest/data-studio/images/schema-viewer.png)

**SOURCE:** https://www.metabase.com/docs/latest/data-modeling/metadata-editing ; https://www.metabase.com/docs/latest/data-studio/measures ; https://www.metabase.com/docs/latest/data-studio/schema-viewer ; https://www.metabase.com/docs/latest/data-studio/managing-tables — docs oficiais Metabase ("latest"; Data Studio/Schema viewer são Pro/Enterprise por doc). A imagem de Table Metadata é da página de metadata-editing (UI v0.5x, anterior ao Data Studio; ainda no "latest"). Data exata NÃO VERIFICADO.

**PROBLEM:** Modelo semântico utilizável por não técnicos exige curadoria: descrições, tipos semânticos, visibilidade, owners e definições únicas de cálculo; e o usuário precisa ver o efeito da edição em tempo real.

**SOLUTION:** Um editor de metadata em colunas (lista de campos → configurações do campo → preview do campo) em que cada propriedade é um select/toggle com texto de ajuda ("What this data represents"), mais atributos de tabela (Owner, Visibility layer: Hidden/Internal/Final, Entity type, Source) e "Publish" para o Library; medidas definidas num editor de expressão restrito a agregações com revisão de histórico e aba de dependências; e um Schema viewer (ER) em modo leitura que mostra FKs e chaves.

**OBSERVE:**
- Preview vivo de 3 abas (Table/Detail/Filtering) mostra como o campo aparecerá — a edição de metadata tem feedback imediato.
- Propriedades agrupadas em Data / Metadata / Behavior: separam "o que é fisicamente" de "o que significa" e "como se comporta".
- Cada controle vem com legenda de uma linha ("Where this field should be displayed").
- Medida = editor "abreviado" focado em agregação (não SQL livre), com abas Definition | Revision history | Dependencies.
- "Visibility layer" (Hidden/Internal/Final) e "Published" (check verde) modelam o ciclo de curadoria na própria lista.
- Schema viewer: Jump to table, Auto-layout, mini-mapa, clique em campo FK navega até a tabela relacionada; mostra relações definidas na semântica do Metabase, não constraints brutas do banco.

**INTERACTION:** (1) Admin → Table Metadata → escolher tabela. (2) Selecionar um campo; editar descrição inline. (3) Em Field settings, definir Semantic type, Visibility, Filtering, Display values; conferir "Field preview". (4) Data Studio → Tables → selecionar tabela → definir Owner/Visibility/Entity type; "Publish" para o Library. (5) Aba Measures → "+New measure" → escrever expressão → Update. (6) Schema viewer: escolher schema, "Jump to table", clicar FK para navegar, "Auto-layout".

**WHY IT WORKS:** Substitui "editar configuração" por "editar o que o usuário final verá", com preview imediato e linguagem de domínio; definir cálculos em um lugar único e versionado evita métricas divergentes.

**ADAPT TO BIWEB:** VISUAL MODELING (metadata) + EXPRESSION (medida). Painel de propriedades da Entidade/Dimensão/Medida em 3 grupos (Dados / Significado / Comportamento) com preview ao vivo "como aparecerá no builder" e legendas de uma linha; campos de governança do BIWEB (owner, sinônimos, classificação PII, certificação/depreciação, semântica de aditividade da métrica) como select/toggle com ajuda. Editor de medida/métrica com abas Definição | Histórico de revisões | Dependências. Schema viewer inspira o canvas de leitura para usuários não editores.

**DO NOT COPY:** Dois lugares separados para metadata (Admin legado × Data Studio); "Hidden/Internal/Final" como único eixo de governança (BIWEB tem certificação/PII/depreciação distintos); measures restritas a tabelas primárias sem joins (BIWEB deve permitir medidas sobre o modelo relacionado).

---

---

#### Open-source technology notes (data modeling & lineage)

Fonte dos números de licença/estrelas/último push: shields.io lendo dados do GitHub em 2026-10-07 (a API REST do GitHub estava com rate limit; números arredondados pelo shields). LICENSE lidas direto do repositório quando indicado.

| Projeto | Finalidade | Licença | Maturidade | URL | Por que pode interessar |
|---|---|---|---|---|---|
| dbt-core | Transformações SQL + docs + lineage | Apache-2.0 | ~14k★, push "today" | https://github.com/dbt-labs/dbt-core | Referência de grafo DAG/lineage e docs de modelo; não é editor visual |
| MetricFlow | Motor de Semantic Layer (entidades, dimensões, medidas, métricas em YAML) | Apache-2.0 | ~1,8k★, push "september" | https://github.com/dbt-labs/metricflow | Modelo conceitual muito próximo do BIWEB (entities PK/FK, dimensions, measures, metrics) |
| dbt-semantic-interfaces | Esquema/validação do YAML semântico | Apache-2.0 | ~107★, push "april" (baixa atividade) | https://github.com/dbt-labs/dbt-semantic-interfaces | Taxonomia de entity types (primary/unique/foreign/natural) e validações |
| DataHub | Catálogo de metadados + lineage (coluna) + impact analysis | Apache-2.0 | ~13k★, push "today" | https://github.com/datahub-project/datahub | UI de lineage com colunas expansíveis e Impact Analysis exportável |
| OpenMetadata | Catálogo, lineage, qualidade, governança | Apache-2.0 | ~15k★, push "today" | https://github.com/open-metadata/OpenMetadata | Layers de lineage + tabela de impacto com governança |
| OpenLineage | Padrão aberto de eventos de lineage | Apache-2.0 | ~2,7k★, push "today" | https://github.com/OpenLineage/OpenLineage | Formato de intercâmbio de lineage (se BIWEB for exportar/ingerir) |
| Apache Atlas | Metadados/governança/lineage (ecossistema Hadoop) | Apache-2.0 | ~2,1k★, push "today" | https://github.com/apache/atlas | Referência histórica de classificação/lineage; UI datada (NÃO VERIFICADO visualmente) |
| DBML (holistics/dbml) | DSL de esquema + parser/CLI/conversão SQL | Apache-2.0 | ~3,7k★, push "today" | https://github.com/holistics/dbml | Notação de cardinalidade compacta; parser JS reutilizável para Visual↔Código |
| ChartDB | Editor de diagramas ER na web | AGPL-3.0 (copyleft forte — avaliar antes de reuso) | ~23k★, push "april" | https://github.com/chartdb/chartdb | Referência de UX de ER leve/importação; licença AGPL impede incorporar sem cuidado. Docs visuais NÃO VERIFICADO (fetch redirecionou) |
| Metabase | BI open source (Data Studio/Schema viewer/Dependency graph em planos pagos) | AGPL (fora de /enterprise) + Metabase Commercial License (LICENSE.txt lida) | ~50k★, push "today" | https://github.com/metabase/metabase | Referência de UX; funcionalidades Data Studio citadas são Pro/Enterprise |
| Cube | Semantic layer headless (data model em YAML/JS, Playground) | Apache-2.0 por padrão, com MIT em alguns pacotes (LICENSE lida) | ~21k★, push "today" | https://github.com/cube-js/cube | Modelo de métricas/joins/pre-aggregations; Playground NÃO analisado visualmente (página de docs de Workspace/Playground retornou 404 na URL tentada) |
| Apache Superset | BI open source com editor de dataset (métricas/colunas calculadas SQL) | Apache-2.0 | ~75k★, push "today" | https://github.com/apache/superset | Contraexemplo: métricas como SQL livre (BIWEB evita); docs sem imagens relevantes extraídas |
| CodeMirror 6 / WASM | Editor de BEL (já decidido no BIWEB) | NÃO VERIFICADO nesta sessão | — | https://codemirror.net/ | Base de autocomplete/diagnósticos/lint inline (comparável a D4/D6/D7) |
| Tabular Editor 2 | Editor de modelo tabular (versão livre do TE) | NÃO VERIFICADO nesta sessão (TE3 é comercial) | — | https://github.com/TabularEditor/TabularEditor | Origem das regras BPA (JSON) |

#### Padrões transversais

##### A) Visual Modeling (canvas/ER/relações)
- **Cardinalidade e direção na linha, propriedades avançadas recolhidas.** TE3 mostra "*" e seta na linha (D2); Tableau esconde cardinalidade em "Performance Options" com default seguro (D1); DBML usa um símbolo (`>`,`<`,`-`,`<>`) (D3). Padrão: o caso comum não pede decisão; o avançado é um clique no objeto selecionado.
- **Vistas por assunto (subject areas) e expansão por vizinhança.** TE3: diagramas nomeados, "Add tables that filter this table", chevron Todas/Só chaves/Nenhuma (D2); DBML `TableGroup` (D3); Metabase Schema viewer com "Jump to table" e mini-mapa (D12). Evitar renderizar o modelo inteiro.
- **Criação por arraste confirmada em diálogo/painel** (TE3: coluna muitos → coluna um; Tableau: tabela → canvas com auto-match). Auto-layout e Fit-to-page sempre disponíveis.
- **Visual | Código**: DBML (diagrama ao vivo sobre texto) e TMDL (modelo-como-código com diff) mostram que ter as duas vistas atende iniciantes e especialistas; o texto é a fonte de versionamento.
- **Metadata em colunas com preview vivo** (Metabase D12) para curadoria de campos, com legenda de uma linha por controle.

##### B) Expression / Calculation experience
- **Ciclo Rascunho → Prévia → Publicar** (DAX query view D4; TMDL Preview D5): fórmula definida no escopo do rascunho, resultado imediato, promoção explícita por medida ou em lote.
- **Autocomplete + calltip paginado + erro com posição** ("Query (4, 23)…") e estado por aba (✓/✗) (D4); squiggle + tooltip + lâmpada de quick fix + painel Problems (D5, D7).
- **Dependências como cidadão de primeira classe no editor**: "Define with references/dependencies", Peek/Go To Definition (D4, D6); "Dependencies" como aba da própria medida (D12).
- **Editor restrito por domínio** (Metabase Custom Expression só de agregação, D12) reduz superfície de erro versus SQL livre.
- **Regras de qualidade automáticas** (BPA, D6) rodando em segundo plano com agrupamento por regra/severidade.

##### C) Lineage e impacto
- **Foco por esquecimento + lentes**: dbt esmaece nós irrelevantes e troca lentes (tipo, status de teste, evolução de coluna) sem mudar layout (D8); OpenMetadata usa "layers" (D10).
- **Coluna sob demanda**: nós colapsados "Columns N" que expandem com busca e iluminam só o caminho clicado (D9, D10).
- **Duas representações do mesmo grafo**: visual para explorar, tabela/lista (grau 1/2/3+, filtros, export CSV) para agir (D9, D10); chips "Used by N" por tipo no cartão (D11).
- **Proveniência na aresta** (quem criou, quando, qual transformação) em D10; classificação Raw/Passthrough/Rename/Transformation em D8.
- **Diagnóstico**: "Dependências quebradas" (urgente) × "Sem referência" (higiene) (D11).

##### D) Progressão simples → avançado
1. Arrastar/soltar com defaults seguros (Tableau). 2. Painel de propriedades contextual ao selecionar (Metabase, TE3). 3. Vista de código/diff para lote e auditoria (TMDL, DBML). 4. Regras e diagnósticos automáticos (BPA, LookML validator, Dependency diagnostics). 5. Exportação/API para automação (DataHub CSV/GraphQL).

##### E) Validação, preview e impacto
- Validar em duas velocidades: tempo real por arquivo/expressão e varredura completa sob demanda, com estado "desatualizado" (Looker D7).
- Preview antes de aplicar: diff semântico antes/depois (TMDL D5), resultado de medida em rascunho (D4), preview de campo (Metabase D12).
- Impacto graduado (1º/2º/4º grau) e agregado por tipo (D9, D11) antes de mudar/depreciar.

##### F) Anti-patterns observados
- Aplicar mudança direto no modelo vivo sem análise de impacto (DAX "Update model"; TMDL Apply) — BIWEB deve exigir rascunho→impacto→publicação humana.
- Resolver join dinamicamente sem registro visível (Tableau) — pouco auditável para métricas certificadas.
- Metadata espalhada em dois lugares (Metabase Admin legado × Data Studio).
- Expor SQL/DDL como formato de modelo (DBML→SQL; dbt/LookML SQL em campos) e SQL cru nas arestas de lineage (OpenMetadata) — BIWEB não tem SQL no frontend.
- Grafos completos sem foco/colapso (parede de cartões); validação que só acusa depois de quebrar.
- Funcionalidades-chave atrás de planos pagos ou de infraestrutura (CLL em dbt Enterprise; Data Studio Pro/Enterprise) — não são padrões a copiar, só a observar.
- Screenshots antigos como referência de estilo (Tableau/DBML GIFs; IDE do Looker): usar a lógica, não a estética.


---

## 12 — Connector Experience

**Pergunta da área:** como produtos com excelente conexão de dados fazem catálogo, autenticação, teste, descoberta de schema, preview, erros e opções avançadas, e como um Copilot ajuda sem esconder o caminho manual?
**Aprendizados-chave:** fluxo em etapas com teste dentro do Salvar; "IA preenche o mesmo formulário"; toggle Agent ⇄ Form; erros com causa + ação; estados de recuperação; segredos fora do contexto do modelo.

### REF-66 — Airbyte / Connector Builder (REST/GraphQL) + AI Assist

**IMAGES:**
- `airbyte-ai-assist-form` — https://docs.airbyte.com/assets/images/generate-connector-config-514fbdf436f89ae3cda73ac443d39e85.png — "Use AI Assist": Name, Documentation URL, Open API Specification URL (Optional), First Data Stream, botões "Skip and start manually" e "Create" — VERIFICADA (200, image/png; 1148x1202), INSPECIONADA
- `airbyte-ai-stream-suggestions` — https://docs.airbyte.com/assets/images/stream-list-5f47d944e8f725433960408e49ea92e4.png — modal "New stream" com combobox "Type to add…" e sugestões (episodes, locations) marcadas com ícone de estrela AI — VERIFICADA (200, image/png; 1066x584), INSPECIONADA
- `airbyte-builder-incremental-form` — https://docs.airbyte.com/assets/images/tutorial-incremental-sync-8b64d9e23fa6c6b535d7cc34ce41adc2.png — formulário "Incremental Sync" (Cursor Field, formatos, Start Datetime com dropdown de modo, "Advanced" colapsado) — VERIFICADA (200, image/png; 2900x2022), INSPECIONADA
- (bônus, não inspecionada) `airbyte-ai-stream-result-gif` — https://docs.airbyte.com/assets/images/stream-result-6e9676e1656a0744270012a263cade2c.gif — GIF do resultado da stream gerada — VERIFICADA (200, image/gif, 3,4 MB), só alt/doc


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-66_01_airbyte_ai_assist_form`

![REF-66_01_airbyte_ai_assist_form](https://docs.airbyte.com/assets/images/generate-connector-config-514fbdf436f89ae3cda73ac443d39e85.png)

`REF-66_02_airbyte_ai_stream_suggestions`

![REF-66_02_airbyte_ai_stream_suggestions](https://docs.airbyte.com/assets/images/stream-list-5f47d944e8f725433960408e49ea92e4.png)

`REF-66_03_airbyte_builder_incremental_form`

![REF-66_03_airbyte_builder_incremental_form](https://docs.airbyte.com/assets/images/tutorial-incremental-sync-8b64d9e23fa6c6b535d7cc34ce41adc2.png)

`REF-66_04_airbyte_ai_stream_result_gif`

![REF-66_04_airbyte_ai_stream_result_gif](https://docs.airbyte.com/assets/images/stream-result-6e9676e1656a0744270012a263cade2c.gif)

**SOURCE:**
- https://docs.airbyte.com/platform/connector-development/connector-builder-ui/ai-assist — docs oficiais (AI Assistant, Beta), acessado 2026-10-07
- https://docs.airbyte.com/platform/connector-development/connector-builder-ui/overview — docs oficiais
- https://docs.airbyte.com/platform/connector-development/connector-builder-ui/tutorial — tutorial oficial (inputs, test panel, publish)

**PROBLEM:** Construir um conector para uma API REST/GraphQL "da cauda longa" exige ler a documentação, descobrir auth, paginação, seletor de registros e sincronização incremental. É um conjunto enorme de decisões técnicas, e a maioria dos usuários não é engenheiro de integração.

**SOLUTION:** O Builder é um formulário guiado por schema (Global Configuration, Inputs, Streams) que gera um manifesto declarativo (YAML). O "AI Assist" pré-preenche esse mesmo formulário a partir de uma URL de documentação (e opcionalmente uma OpenAPI): endpoint, autenticação (API key/OAuth/basic), paginação, chave primária, seletor de registros, headers, incremental e lista de streams. O usuário pode "Skip and start manually" a qualquer momento, testa cada stream no painel de teste e corrige manualmente o que a IA errou.

**OBSERVE:**
- A IA não é um chat separado: o resultado é o próprio formulário do Builder, com os mesmos campos que o caminho manual (docs: "AI Assistant ... prefill and configure fields"). Não há dois produtos, há um formulário com um atalho.
- O modal de entrada tem só 4 campos (Name, Documentation URL, OpenAPI URL opcional, First Data Stream) e o botão secundário "Skip and start manually" tem o mesmo peso visual de uma saída legítima.
- Sugestões da IA são marcadas com o ícone de estrela no combobox de streams ("Type to add…"): o usuário distingue "sugerido" de "digitado", e ainda pode digitar livremente.
- O formulário de Incremental Sync mostra campos opcionais com rótulo "Optional", dicas "(i)" e uma seção "Advanced" recolhida em cada bloco (imagem inspecionada): progressive disclosure em todo nível.
- Valores secretos de teste (API key) são "Testing Values", não ficam salvos no conector; o usuário final fornece o seu depois (tutorial). Inputs têm toggles "Required / Secret / Hidden / Enable default" (ver REF-74).
- O painel de teste tem abas Request, Response e Schema; o schema detectado vira o schema declarado da stream. Para streams com partições, o teste mostra só as 5 primeiras (tutorial).
- Docs avisam: "Human Oversight Required"; funciona melhor com REST/JSON, mas também aceita GraphQL (ex.: usado como exemplo). Erros específicos para URL inalcançável ou formato não suportado.

**INTERACTION:**
1. Builder > "Start from scratch" (ou "New custom connector").
2. Modal "Use AI Assist": informa Name, Documentation URL (ou OpenAPI URL), First Data Stream; clica "Create". Alternativa: "Skip and start manually".
3. A IA cria o projeto com global config, inputs e streams pré-preenchidos.
4. O usuário abre uma stream, revisa endpoint/auth/paginação/incremental no formulário, adiciona streams (combobox com sugestões AI).
5. Clica Test: lê Request/Response/Schema/Records; ajusta o que faltou (headers, paginação) e testa de novo.
6. Publish (workspace/organização) ou exporta o YAML; depois configura um Source normal usando o conector.

**WHY IT WORKS:** A IA só preenche o estado do mesmo formulário que o usuário manual usaria, então revisar e corrigir é a mesma ação em ambos os caminhos. O botão de teste fecha o ciclo "gerar → verificar com dados reais", e o "Skip" evita que a IA seja porta obrigatória.

**ADAPT TO BIWEB:** Para o Connector SDK e para conectores REST/GraphQL, um builder em formulário declarativo (auth, paginação, incremental) com um assistente que apenas preenche esse formulário e marca sugestões. O mesmo painel de teste (request/response/schema detectado) pode alimentar a classificação de campos na descoberta. Na S02, o entrypoint seria "Conector customizado" ao lado do catálogo, não um fluxo separado.

**DO NOT COPY:** Identidade visual roxa/gradiente do Airbyte e o ícone de estrela como marca; o termo "Builder" e a UX de YAML exposta; a dependência de "crawl" de documentação pública como único insumo (NÃO VERIFICADO se funciona com docs autenticadas).

---

---

### REF-67 — Airbyte / Connector Setup Assistant (modo Agent ⇄ Form)

**IMAGES:**
- `airbyte-setup-assistant` — https://docs.airbyte.com/assets/images/connector-setup-agent-e34de08fd388f0ab44c2b675b894d1ee.png — tela Sources > New source com "Connector Setup Assistant (BETA)", mensagem do assistente pedindo o nome do bucket S3, campo "Type your response…" e toggle "Agent | Form" no canto superior direito — VERIFICADA (200, image/png; 2834x2486), INSPECIONADA


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-67_01_airbyte_setup_assistant`

![REF-67_01_airbyte_setup_assistant](https://docs.airbyte.com/assets/images/connector-setup-agent-e34de08fd388f0ab44c2b675b894d1ee.png)

**SOURCE:**
- https://docs.airbyte.com/platform/using-airbyte/getting-started/add-a-source — docs oficiais (seção "Set up connectors with AI (BETA)"), acessado 2026-10-07; disponível no Airbyte Cloud

**PROBLEM:** Formulários de conectores têm dezenas de campos, jargão ("streams", "bucket", "glob patterns") e credenciais difíceis de achar. Quem não conhece o sistema de origem trava no meio.

**SOLUTION:** Um assistente conversacional que pergunta primeiro os campos obrigatórios, explica cada um e onde achar o valor, trata OAuth por botão e recolhe segredos num "secret mode" que não envia o valor ao modelo. O toggle Agent/Form permite alternar a qualquer momento: o formulário reflete o progresso do agente.

**OBSERVE:**
- Toggle "Agent | Form" sempre visível no topo (imagem inspecionada). Docs: "It's safe to switch back and forth"; o formulário mostra o que o agente preencheu.
- O subtítulo da tela diz explicitamente "Select 'Form' in the top-right to switch back to manual configuration".
- O agente primeiro lista o que precisa ("two essential pieces of information") e pergunta um item por vez; "required fields first" para conectores com muitas opções.
- Secret mode: banner acima do input avisando que as credenciais são guardadas com segurança e NÃO são enviadas à IA; campo mascarado; botão Cancel para sair do modo e voltar a conversar. Aviso: se um segredo for digitado fora do modo, rotacioná-lo.
- OAuth: o agente exibe um botão que abre popup; ao autorizar, o agente recebe as credenciais e continua.
- Ao concluir, roda o teste de conexão; se falhar, o agente explica o erro e sugere correção; ou o usuário muda para Form e edita.
- Limitação declarada: pode não conhecer mudanças recentes da API; casos complexos exigem Form. Conectores sem suporte de IA mostram só o formulário + painel de docs ao lado.

**INTERACTION:**
1. Sources > New source > escolhe conector (ou aba Marketplace > Sample Data).
2. Em Cloud, abre no modo Agent: responde em linguagem natural.
3. Para segredos, o chat entra em secret mode; o usuário digita só o segredo.
4. Para OAuth, clica no botão e autoriza no popup.
5. Agente sinaliza "setup complete"; Airbyte roda "Test and save".
6. Sucesso → página New Connection; falha → explicação + ajuste via chat ou Form.

**WHY IT WORKS:** A IA é uma segunda "camada de visualização" do mesmo estado de configuração; nada fica preso no chat. O modo secreto resolve a objeção principal (credenciais na IA) de forma visível. O toggle torna o modo manual sempre a um clique.

**ADAPT TO BIWEB:** Na S02, o assistente seria um painel/aba "Assistente | Formulário" dentro do mesmo wizard de conexão (SQL live e SaaS/API), com campos secretos fora do contexto do LLM e com o formulário como fonte de verdade. O copiloto BIWEB opcional apenas guia (onde achar a credencial, qual porta/SSL) e dispara o teste de conexão.

**DO NOT COPY:** O estilo de chat que ocupa a tela inteira como padrão (para BIWEB, o formulário deve continuar sendo a visão primária); o gradiente e a estrela como marca de IA; o título "Beta" permanente.

---

---

### REF-68 — Fivetran / AI Connector Agent + Setup form declarativo do Connector SDK

**IMAGES:**
- `fivetran-catalog-ai-banner` — https://fivetran.com/static-assets-docs/_next/static/media/image-1.3aupyp_j1fb5t.webp — catálogo "Search all connectors…", banner "Generate connectors for REST API data sources with AI. Get started", "781 connectors", ordenação "Popularity", linhas com tag "Hybrid" — VERIFICADA COM RESSALVA (200, `application/octet-stream`; conteúdo é WebP 645x300 válido), INSPECIONADA
- `fivetran-setup-field-description` — https://fivetran.com/static-assets-docs/_next/static/media/input-field-description.0gqjlm9eg1aye.webp — campo "Access Token" com texto de ajuda abaixo explicando como gerar o token e escopos — VERIFICADA COM RESSALVA (200, `application/octet-stream`; WebP 680x182 válido), INSPECIONADA


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-68_01_fivetran_catalog_ai_banner`

![REF-68_01_fivetran_catalog_ai_banner](https://fivetran.com/static-assets-docs/_next/static/media/image-1.3aupyp_j1fb5t.webp)

`REF-68_02_fivetran_setup_field_description`

![REF-68_02_fivetran_setup_field_description](https://fivetran.com/static-assets-docs/_next/static/media/input-field-description.0gqjlm9eg1aye.webp)

**SOURCE:**
- https://fivetran.com/docs/connectors/ai-connector-agent/setup-guide — docs oficiais (AI Connector Agent, Beta), acessado 2026-10-07
- https://fivetran.com/docs/connector-sdk/technical-reference/connector-sdk-setup-form — docs oficiais (Setup Form do Connector SDK), acessado 2026-10-07

**PROBLEM:** Gerar um conector de API que não está no catálogo e, ao mesmo tempo, dar a quem escreve um conector custom (SDK) uma UI de configuração decente sem construir frontend.

**SOLUTION:** (a) AI Connector Agent: usuário dá nome + URL da documentação e/ou OpenAPI/Postman/PDF; o agente gera o conector em segundo plano (minutos a mais de 1 hora), e apresenta uma etapa "Review endpoints" (lista de entidades/endpoints com tabela de destino e checkboxes), depois o formulário de setup normal com "Save & Test". (b) Connector SDK: o autor declara em código `ConfigurationForm` com campos (`TextField` plain/password, `DropdownField` com label+descrição, `ToggleField`) e testes (`add_test` → success/failure com mensagem). A Fivetran renderiza o formulário e executa os testes em "Save & Test".

**OBSERVE:**
- A IA é um ponto de entrada no catálogo (banner "Get started" acima da lista) e não substitui o catálogo (imagem inspecionada).
- Geração assíncrona: "After you click Generate, you can leave the page"; retoma por "Resume setup"; link "Review endpoints" aparece na coluna Last synced.
- Etapa explícita de revisão: todas as entidades vêm selecionadas por padrão e o usuário desmarca as que não quer; coluna Table mostra onde cada endpoint vira tabela.
- Campos do formulário têm texto de ajuda abaixo do input com instrução passo a passo (imagem 2 inspecionada); URL de redirect OAuth exibida antes de "Authorize" com aviso "adicione ao seu app antes".
- Após os testes: três caminhos de início ("Start syncing all my data now", "I need to customize data before syncing", "I'll sync later"), o do meio abre a revisão de schema (bloquear tabelas/colunas, hash).
- Setup form do SDK: campo `description` aparece como help text abaixo; `required`, `placeholder`; dropdown permite label + descrição por opção; testes retornam mensagem de falha legível.
- Nome do schema de destino é gerado automaticamente, editável, e "não pode ser alterado depois" — aviso antes de Save & Test.

**INTERACTION:**
1. Connections > + Add connection > banner "AI-generated connectors" > Get started > Set up for AI Connector Agent > escolhe destino.
2. Informa nome da fonte + URL da documentação (homepage da API, não endpoint) e/ou arquivo (OpenAPI/Postman/PDF); aceita termos; Generate.
3. Sai da página; volta por "Review endpoints".
4. Desmarca entidades; Continue.
5. Formulário de conexão: confere schema de destino, preenche campos (cada um com instrução), OAuth se houver; Save & Test.
6. Testes passam → escolhe início imediato, customizar schema ou depois.

**WHY IT WORKS:** Trabalho longo e incerto (descobrir endpoints) vira etapa assíncrona com checkpoint humano obrigatório (Review endpoints) antes de qualquer ação com efeito. O formulário declarativo do SDK dá consistência a conectores de terceiros: autor descreve campos, a plataforma entrega UX uniforme, help text e teste.

**ADAPT TO BIWEB:** O Connector SDK do BIWEB pode declarar `fields` (texto, secret, dropdown com descrição, toggle) e `tests` que o frontend renderiza igual para todos os conectores, com "Testar conexão" e mensagens de falha do autor. Para o assistente de IA, usar a ideia "gerar → revisar lista de entidades/streams → continuar" antes de criar tabelas, e as três opções pós-teste (sincronizar tudo / customizar / depois) para ligar com agendamento e S02.

**DO NOT COPY:** Nomenclatura "Hybrid", o modelo "destino = warehouse Fivetran" e o paywall/trial na barra; API de Python específica da Fivetran; o tempo "até mais de 1 hora" sem estimativa de progresso (anti-pattern a evitar: mostrar progresso real).

---

---

### REF-69 — Power Query / Fabric — Catálogo "Choose data source" (busca + categorias) (+ Fivetran, Retool)

**IMAGES:**
- `pq-choose-source-service-all` — https://learn.microsoft.com/en-us/power-query/media/where-to-get-data/power-bi-service-view-more.png — "Choose data source": caixa Search, chips de categorias (All, File, Database, Microsoft Fabric, Power Platform, Azure, Online services, Other), grade de cartões 4 colunas com tipo/categoria sob o nome (ex.: "Parquet / File", "Snowflake / Database", "Datamarts / Microsoft Fabric — BETA") — VERIFICADA (200, image/png; 1939x1145), INSPECIONADA
- `pq-choose-source-dataflow` — https://learn.microsoft.com/en-us/power-query/media/where-to-get-data/data-factory-view-more.png — mesma tela em Data Factory, com menos categorias visíveis (seta de "mais") — VERIFICADA (200, image/png; 1779x966), INSPECIONADA
- `retool-select-resource-type` — https://docs.retool.com/assets/images/797f87a1-90a7-46a9-9f40-00a4c3dd2f8a-aa86e72856f0155f00ea7783f7b37c55.jpg — "Connect a resource > Select a resource type": stepper lateral (Select a resource type → Configure resource), grupos DATABASES e APIS (REST API, GraphQL, Amazon S3, Stripe…), link "Can't find your database type? Let us know" — VERIFICADA (200, image/jpeg; 1600x956), INSPECIONADA. Data da UI NÃO INFORMADA na página; ícone "Upgrade" e logo sugerem versão possivelmente anterior ao redesign atual.
- (reuso) ver `fivetran-catalog-ai-banner` em REF-68 (contador "781 connectors", ordenação por popularidade).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-69_01_pq_choose_source_service_all`

![REF-69_01_pq_choose_source_service_all](https://learn.microsoft.com/en-us/power-query/media/where-to-get-data/power-bi-service-view-more.png)

`REF-69_02_pq_choose_source_dataflow`

![REF-69_02_pq_choose_source_dataflow](https://learn.microsoft.com/en-us/power-query/media/where-to-get-data/data-factory-view-more.png)

`REF-69_03_retool_select_resource_type`

![REF-69_03_retool_select_resource_type](https://docs.retool.com/assets/images/797f87a1-90a7-46a9-9f40-00a4c3dd2f8a-aa86e72856f0155f00ea7783f7b37c55.jpg)

**SOURCE:**
- https://learn.microsoft.com/en-us/power-query/where-to-get-data — docs oficiais, ms.date 2026-04-08 (atualizada 2026-05-07)
- https://docs.retool.com/data-sources/quickstarts/resources — docs oficiais (sem data)
- https://fivetran.com/docs/connectors/ai-connector-agent/setup-guide — imagem do catálogo

**PROBLEM:** Centenas de fontes (arquivos, bancos, SaaS, cloud). O usuário precisa achar a sua em segundos, sem decorar nomes de conectores nem ver 400 ícones de uma vez.

**SOLUTION:** Um único diálogo/página com busca no topo, chips de categoria e cartões que mostram nome + categoria. Arquivos e bancos mais comuns aparecem primeiro. Alguns catálogos agrupam por tipo (Retool: DATABASES / APIS), outros mostram contador e ordenação (Fivetran: 781 connectors, Popularity).

**OBSERVE:**
- Busca como primeiro elemento, depois chips de categoria horizontais (Power Query, imagem inspecionada). "All" selecionado por padrão, estilo pill escuro.
- Cada cartão mostra nome em destaque e a categoria em cinza abaixo; selo BETA no próprio cartão para conectores em prévia.
- Os formatos que o BIWEB precisa suportar já estão visíveis no topo: Excel workbook, Text/CSV, JSON, Parquet, PostgreSQL, MySQL, SQL Server, Snowflake, BigQuery.
- O mesmo diálogo aparece em Power BI (serviço), Dataflow Gen2, Power Apps e Customer Insights (docs mostram 4 variantes): consistência entre produtos.
- Retool: stepper lateral de duas etapas ("Select a resource type" concluída em verde → "Configure resource") e rodapé "Can't find your database type? Let us know" (saída para a cauda longa).
- Fivetran: contador de conectores e filtro "Sort by: Popularity", tag "Hybrid" por cartão (fonte atual do conector).
- Em Power Query Desktop, a docs descreve um painel esquerdo (Home, New, Recent data, OneLake catalog, Blank table, Blank query); busca global na Home e navegação por categoria em New (texto da docs, não inspecionado em imagem).

**INTERACTION:**
1. Usuário abre "Get data" (Power BI Desktop: botão na Home) ou "+ Add connection".
2. Digita no Search ou clica num chip (File, Database, …).
3. Clica no cartão; o fluxo avança para configurar o conector (REF-70).
4. Se não achar: "Let us know" / conector custom / Blank query.

**WHY IT WORKS:** Dois eixos de descoberta (texto e categoria) e rótulo de categoria em todo cartão eliminam ambiguidade entre "SQL Server database" (banco) e "SQL Server Analysis Services". Itens frequentes primeiro reduzem a busca para a maioria.

**ADAPT TO BIWEB:** A S02 pode ganhar um catálogo com busca e chips alinhados às duas famílias (SQL live, SaaS/API sync) mais "Arquivo" e "Conector customizado" — os formatos de upload ficam no topo como no Power Query. Selos "Beta"/"Sync"/"Live" nos cartões, contagem de conectores e uma saída "Não achei meu conector" levando ao SDK/builder.

**DO NOT COPY:** Ícones de produtos Microsoft (Fabric, Dataverse, OneLake) e a taxonomia "Power Platform/Azure/Microsoft Fabric"; o estilo de cartões com sombra pesada; a lista de 4 colunas rolável sem indicador de quantidade.

---

---

### REF-70 — Power Query — Fluxo Connection settings → Authentication → Navigator (preview e seleção de tabelas)

**IMAGES:**
- `pq-connection-settings-advanced` — https://learn.microsoft.com/en-us/power-query/media/get-data-experience/connection-settings-pqo-advanced.png — "Connection settings": Server*, Database, e seção "Advanced options" expandida (Command timeout, SQL statement opcional, checkboxes "Include relationship columns" marcado e três outros desmarcados) — VERIFICADA (200, image/png; 658x817), INSPECIONADA
- `pq-authentication` — https://learn.microsoft.com/en-us/power-query/media/get-data-experience/authentication.png — diálogo "SQL Server database": abas laterais Windows / Database / Microsoft account, campos User name e Password, dropdown "Select which level to apply these settings to", botões Back / Connect / Cancel — VERIFICADA (200, image/png; 1052x570), INSPECIONADA
- `pq-navigator-preview` — https://learn.microsoft.com/en-us/power-query/media/get-data-experience/pqo-navigator-window.png — "Get data > Choose data": árvore (SQL Server database > AdventureWorks2019 [103] com checkboxes), busca, "Display options", botão "Select related tables", preview à direita com ícones de tipo por coluna (123, ABC, calendário-relógio), botões Back / Cancel / Transform data — VERIFICADA (200, image/png; 1846x984), INSPECIONADA
- (bônus, só alt/doc) `pq-flow-diagram` — https://learn.microsoft.com/en-us/power-query/media/get-data-experience/getting-data-flow-diagram.png — diagrama das quatro etapas — VERIFICADA (200, image/png; 1154x276)


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-70_01_pq_connection_settings_advanced`

![REF-70_01_pq_connection_settings_advanced](https://learn.microsoft.com/en-us/power-query/media/get-data-experience/connection-settings-pqo-advanced.png)

`REF-70_02_pq_authentication`

![REF-70_02_pq_authentication](https://learn.microsoft.com/en-us/power-query/media/get-data-experience/authentication.png)

`REF-70_03_pq_navigator_preview`

![REF-70_03_pq_navigator_preview](https://learn.microsoft.com/en-us/power-query/media/get-data-experience/pqo-navigator-window.png)

`REF-70_04_pq_flow_diagram`

![REF-70_04_pq_flow_diagram](https://learn.microsoft.com/en-us/power-query/media/get-data-experience/getting-data-flow-diagram.png)

**SOURCE:**
- https://learn.microsoft.com/en-us/power-query/get-data-experience — docs oficiais, ms.date 2026-08-10
- https://learn.microsoft.com/en-us/power-query/connectors/postgresql — docs oficiais (opções avançadas por conector)

**PROBLEM:** Conectar a um banco envolve parâmetros de servidor, autenticação por tipo, escopo da credencial, descoberta de objetos e escolha do que carregar — tudo sem sobrecarregar o caso simples (servidor + banco).

**SOLUTION:** Fluxo em etapas curtas com um conceito por tela. Docs descrevem 4 estágios no Desktop (Connection settings → Authentication → Data preview → Query destination) e 3 no Online (conexão/credencial na mesma página). Parâmetros obrigatórios aparecem primeiro; opções avançadas ficam sob "Advanced options". Credencial por tipo de autenticação em abas laterais. O Navigator lista objetos descobertos com preview imediato antes de carregar.

**OBSERVE:**
- Diálogo de conexão mostra apenas 2 campos por padrão (Server obrigatório com asterisco, Database opcional); o resto fica sob "Advanced options", com checkbox padrão marcado ("Include relationship columns") e SQL statement opcional "requires database" (texto da imagem inspecionada).
- Autenticação como menu lateral (Windows / Database / Microsoft account), com texto auto-descritivo do recurso (ícone + servidor;banco) no topo.
- Escopo da credencial em dropdown explícito ("Select which level to apply these settings to"): evita reuso acidental.
- Navigator: árvore por servidor > banco > objetos com contador [103] e [2]; busca e "Display options"; botão "Select related tables" desabilitado até selecionar algo.
- Preview vem em 2 camadas: tabela com ícones de tipo por coluna (123, ABC, data-hora) antes de "Transform data" — o tipo inferido já está visível antes do carregamento.
- Online: conexões nomeadas e reutilizáveis — a docs mostra o campo Connection com dropdown para escolher uma conexão existente (imagem pqo-pick-connection citada na docs; não baixada).
- Botão Back em todas as etapas; ação principal muda de rótulo conforme o destino (Load / Transform data).

**INTERACTION:**
1. Escolhe o conector (REF-69) → abre "Connection settings".
2. Preenche Server (e Database); opcionalmente expande Advanced options.
3. Next → diálogo de autenticação: escolhe aba (Windows/Database/Account), preenche, escolhe o nível de aplicação, Connect.
4. Navigator: expande árvore, marca tabelas, vê o preview à direita; "Select related tables" se necessário.
5. Transform data (ou Load) → dados vão para o editor.

**WHY IT WORKS:** Cada decisão tem um lugar: o caso simples é 2 campos; o raro é "Advanced options". A credencial é separada da configuração, o que também permite reutilizar conexão. O preview mostra os tipos antes de comprometer o carregamento.

**ADAPT TO BIWEB:** O wizard de conexão SQL da S02 pode seguir: Parâmetros essenciais → Credencial (aba por método: usuário/senha, service account, SSH) → Descoberta de schema com árvore + preview + tipos → destino/agendamento. "Advanced options" recolhido para timeout, SSL e filtros; árvore com contadores; preview com tipo e classificação de campos (dimensão/medida) visíveis na descoberta.

**DO NOT COPY:** O "Navigate using full hierarchy / SQL Server failover" (específico de SQL Server); a dupla Desktop/Online com fluxos diferentes; o modal de aviso de criptografia ("Azure SQL encryption support") como interrupção sem contexto.

---

---

### REF-71 — Power Query (+ Databricks, Metabase) — Upload de CSV: encoding, delimitador, detecção de tipos e preview

**IMAGES:**
- `pq-csv-preview` — https://learn.microsoft.com/en-us/power-query/connectors/media/text-csv/text-csv-navigator.png — diálogo "Financial Sample.csv": três selects (File Origin = 1252: Western European (Windows), Delimiter = Comma, Data Type Detection = Based on first 200 rows), tabela de preview alinhando números à direita, botões "Extract Table Using Examples" / Load / Transform Data / Cancel — VERIFICADA (200, image/png; 1312x714), INSPECIONADA
- `pq-csv-delimiter-dropdown` — https://learn.microsoft.com/en-us/power-query/connectors/media/text-csv/csv-delimiter-dropdown.png — lista de delimitadores (None, Colon, Comma, Equals sign, Semicolon, Space, Tab, Custom, Fixed width) — VERIFICADA (200, image/png; 386x436), INSPECIONADA
- `metabase-upload-entrypoint` — https://www.metabase.com/docs/latest/databases/images/upload-to-collection.png — tooltip "Upload data to Example collection / .csv (50 MB max)" no cabeçalho de uma coleção (só mostra o ponto de entrada; não mostra preview) — VERIFICADA (200, image/png; 1952x330), INSPECIONADA


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-71_01_pq_csv_preview`

![REF-71_01_pq_csv_preview](https://learn.microsoft.com/en-us/power-query/connectors/media/text-csv/text-csv-navigator.png)

`REF-71_02_pq_csv_delimiter_dropdown`

![REF-71_02_pq_csv_delimiter_dropdown](https://learn.microsoft.com/en-us/power-query/connectors/media/text-csv/csv-delimiter-dropdown.png)

`REF-71_03_metabase_upload_entrypoint`

![REF-71_03_metabase_upload_entrypoint](https://www.metabase.com/docs/latest/databases/images/upload-to-collection.png)

**SOURCE:**
- https://learn.microsoft.com/en-us/power-query/connectors/text-csv — docs oficiais, ms.date 2026-06-29
- https://learn.microsoft.com/en-us/azure/databricks/ingestion/create-or-modify-table — docs oficiais (Databricks, sem screenshots acessíveis), ms.date 2026-09-11 — só texto
- https://www.metabase.com/docs/latest/databases/uploads — docs oficiais Metabase

**PROBLEM:** CSV/Excel/Parquet de usuários finais têm encoding errado, delimitadores variados, cabeçalho ausente e tipos ambíguos. Quem faz upload precisa ver como o sistema entendeu o arquivo e corrigir antes de criar um dataset.

**SOLUTION:** Mostrar o preview real do arquivo com três decisões acessíveis ao lado (encoding, delimitador, detecção de tipos) e recalcular o preview ao mudar. Databricks (docs) acrescenta: "First row contains the header", detecção automática de tipos ligada por padrão (desligar → tudo STRING), edição de nome e tipo por coluna no preview, preview de 50 linhas, "Overwrite existing table" vs "Create new table".

**OBSERVE:**
- Três controles no cabeçalho do preview (File Origin, Delimiter, Data Type Detection) com valores já detectados — o usuário corrige só se algo parecer errado (imagem inspecionada).
- Data Type Detection tem escopo explícito: "Based on first 200 rows" (a docs do conector tem outras opções neste select; NÃO VERIFICADO quais além de "first 200 rows"); o limite da amostra fica visível.
- Preview formata números com separador de milhar e alinha à direita, texto à esquerda: sinal imediato de tipo.
- Botões distintos: Load (direto), Transform Data (editar antes) e "Extract Table Using Examples" (para arquivos de texto não estruturados) — três níveis de profundidade.
- Delimitador oferece Custom e Fixed width (opções raras, no fim da lista).
- Databricks (texto): nomes de coluna não aceitam vírgula/backslash/emoji; mudar tipo "pode virar NULL" e a docs avisa; recomenda criar tabela primeiro e transformar depois.
- Metabase: o upload fica como ícone na coleção; tooltip comunica formato e limite (".csv (50 MB max)") sem abrir nada.

**INTERACTION:**
1. Usuário escolhe o arquivo (Text/CSV, Excel, Parquet no catálogo).
2. O diálogo abre com preview (primeiras linhas) e valores detectados nos 3 selects.
3. Ajusta File Origin / Delimiter / Data Type Detection; o preview recalcula.
4. Decide: Load (aceita tal qual) ou Transform Data (ajustar tipos/colunas).
5. (Databricks) edita nome/tipo na própria coluna do preview e escolhe criar/sobrescrever tabela.

**WHY IT WORKS:** O preview é a única fonte de verdade: o usuário não precisa saber o que é "1252", só vê se os acentos e colunas ficaram certos. Os valores detectados estão pré-selecionados, então o caso feliz é um clique em Load.

**ADAPT TO BIWEB:** O fluxo de upload (CSV → pipeline, Parquet) pode ter uma etapa "Revisar arquivo" com preview, 3 selects de encoding/delimitador/tipos, edição por coluna (nome, tipo, papel: dimensão/medida/data) e classificação de campos já sugerida na descoberta. Sinalizar a amostra usada para inferência e avisar sobre cast para NULL antes de aplicar. Metabase mostra que o limite (50 MB) deve estar visível antes do upload.

**DO NOT COPY:** O vocabulário Power Query (File Origin "1252", "Extract Table Using Examples"); o botão "Load" que descarta a etapa de classificação de campos; o ícone isolado de upload sem destino claro.

---

---

### REF-72 — Fivetran + Airbyte + Hex — Descoberta de schema, seleção de tabelas/colunas e revisão de mudanças

**IMAGES:**
- `fivetran-schema-pending-changes` — https://fivetran.com/static-assets-docs/_next/static/media/schema_review_changes.35bpaxcss79r2.webp — aba Schema com tabela hierárquica (public > 9/9 tables selected > customer/district > 11/11 columns selected, ícones de chave nas PKs), badges "Changes" e "Re-sync", coluna Sync mode (History/Soft delete), painel direito "Pending changes to 2 tables" (soft delete → history mode; unhashed → hashed) e botões Discard / Save changes — VERIFICADA COM RESSALVA (200, `application/octet-stream`; WebP 2398x1287 válido), INSPECIONADA
- `fivetran-schema-tab-main` — https://fivetran.com/static-assets-docs/_next/static/media/schema_tab_main.2u8oznzcu8gnn.webp — aba Schema completa: busca por tabela, Filter, ERD, "Schema change settings", colunas Sync mode / Row filtering / Data type / Column hashing; "15/76 tables selected" — VERIFICADA COM RESSALVA (200, `application/octet-stream`; WebP 1196x810 válido), INSPECIONADA
- `airbyte-schema-streams-sync-mode` — https://docs.airbyte.com/assets/images/field-selection-4aa7d2366badd80da0d9859285f34654.png — aba Schema do Airbyte: busca "stream or field name", abas All/Enabled/Disabled, "3 / 846 streams", stream expandida com campos e tipos (String, Datetime), campo desmarcado em linha vermelha, botões Discard changes / Save changes — VERIFICADA (200, image/png; 1171x611), INSPECIONADA
- `airbyte-schema-propagation` — https://docs.airbyte.com/assets/images/schema-propagation-options-4813765222f90b075af6eff724412265.png — dropdown "Detect and propagate schema changes": Propagate field changes only / all field and stream changes / Approve all changes myself / Stop future syncs — VERIFICADA (200, image/png; 693x224), INSPECIONADA
- `hex-schema-filtering` — https://learn.hex.tech/assets/img/data-connection-schema-browsing-settings.95d313be.png — "SCHEMA FILTERING": Databases / Schemas / Tables com Include + Exact Match e chips (dwh, prod_core, dim_customers…) — VERIFICADA (200, image/png; 584x429), INSPECIONADA


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-72_01_fivetran_schema_pending_changes`

![REF-72_01_fivetran_schema_pending_changes](https://fivetran.com/static-assets-docs/_next/static/media/schema_review_changes.35bpaxcss79r2.webp)

`REF-72_02_fivetran_schema_tab_main`

![REF-72_02_fivetran_schema_tab_main](https://fivetran.com/static-assets-docs/_next/static/media/schema_tab_main.2u8oznzcu8gnn.webp)

`REF-72_03_airbyte_schema_streams_sync_mode`

![REF-72_03_airbyte_schema_streams_sync_mode](https://docs.airbyte.com/assets/images/field-selection-4aa7d2366badd80da0d9859285f34654.png)

`REF-72_04_airbyte_schema_propagation`

![REF-72_04_airbyte_schema_propagation](https://docs.airbyte.com/assets/images/schema-propagation-options-4813765222f90b075af6eff724412265.png)

`REF-72_05_hex_schema_filtering`

![REF-72_05_hex_schema_filtering](https://learn.hex.tech/assets/img/data-connection-schema-browsing-settings.95d313be.png)

**SOURCE:**
- https://fivetran.com/docs/using-fivetran/fivetran-dashboard/connectors/schema — docs oficiais Fivetran
- https://docs.airbyte.com/platform/using-airbyte/configuring-schema e https://docs.airbyte.com/platform/using-airbyte/schema-change-management — docs oficiais Airbyte
- https://learn.hex.tech/docs/connect-to-data/data-connections/data-connections-introduction — docs oficiais Hex (sem data na página; acessado 2026-10-07)

**PROBLEM:** Após conectar, a plataforma descobre centenas de tabelas/streams/campos. O usuário precisa escolher o que sincronizar, entender o modo de sincronização e saber o que acontece quando a origem muda, sem ser inundado.

**SOLUTION:** Uma visão de schema em árvore/tabela: seleção por checkbox em tabela e coluna, contadores ("15/76 tables selected"), busca/filtro, modo de sync por linha e uma etapa explícita de revisão de mudanças pendentes antes de salvar. Política de mudanças futuras de schema escolhida por dropdown. Hex adiciona filtragem de schema por inclusão/exclusão para reduzir tempo de refresh e foco de IA.

**OBSERVE:**
- Contadores nos grupos ("11/11 columns selected", "4 / 846 streams") dão noção de escala e estado do conjunto (checkbox em estado indeterminado quando parcial).
- Colunas de configuração ficam na própria linha (Sync mode, Row filtering, Column hashing, Data type): configuração onde o dado está, sem navegar para outra tela.
- Fivetran: painel lateral "Pending changes to 2 tables" lista antes → depois (soft delete → history mode; unhashed → hashed) com links "View"; botões Discard e Save changes só aqui. A barra inferior "Pending changes to 1 table / Review changes / Save changes" (schema_block_column, inspecionada) aparece ao marcar/desmarcar.
- Badges "Changes" e "Re-sync" avisam o custo de uma mudança (re-sync) antes de aplicar.
- Chaves primárias têm ícone e não são desmarcáveis (campos com ícone de chave sem checkbox na imagem inspecionada).
- Airbyte: sync mode por stream em dropdown com 5 combinações legíveis ("Incremental | Append + Deduped", "Full refresh | Overwrite"…); Hashing por coluna.
- Airbyte: política de mudanças de schema — "Propagate field changes only", "Propagate all field and stream changes", "Approve all changes myself", "Stop future syncs" — mais notificação e backfill como opções separadas.
- Hex: filtro de schema com Include/Exclude + Exact Match por nível, descrito como "speeds up schema refreshes"; aviso de que filtrar não altera permissões do banco.

**INTERACTION:**
1. Após o teste de conexão, abre a aba Schema (ou etapa de customizar schema).
2. Busca/filtra; marca ou desmarca tabelas/streams/colunas; expande para ver campos e tipos.
3. Muda o sync mode por tabela; opcionalmente hash/bloqueio de coluna ou row filtering.
4. Barra/painel "Pending changes" mostra o que muda; Review changes → Save changes (ou Discard).
5. Define como tratar mudanças futuras de schema na origem.

**WHY IT WORKS:** Revisão antes de commit e ícones de impacto (re-sync) transformam uma tabela grande e arriscada em uma lista de mudanças legível. Padrão seguro: tudo selecionado por padrão (Fivetran) ou nada habilitado (Airbyte, 4/846), com a política de mudanças escolhida de forma explícita.

**ADAPT TO BIWEB:** Na descoberta de schema da S02, usar tabela hierárquica fonte → tabela → campo com contadores, tipo, papel/classificação do campo (capturada na descoberta) e modo (live/sync, incremental) por linha, mais o painel "Mudanças pendentes" antes de salvar. Incluir política de mudança de schema (aprovar manualmente / propagar campos / pausar) e filtro de schema Include/Exclude para bancos grandes.

**DO NOT COPY:** Terminologia específica de warehouse (History mode, Soft delete, Hashing) fora do contexto do BIWEB; a tabela horizontalmente rolável com colunas cortadas ("Column hasl…") visível na imagem do Fivetran; coluna "Row filtering" no mesmo nível sem explicação.

---

---

### REF-73 — Airbyte + Hex — Estados de ingestão e erros acionáveis (falha parcial)

**IMAGES:**
- `airbyte-connection-status` — https://docs.airbyte.com/assets/images/cloud-status-page-88407100afc2debe348e30ef21f75959.png — aba Status: gráficos "Streams status" e "Records loaded" (30 syncs / 8 syncs), "Active Streams — Next sync in 6 hours", tabela Status/Stream name/"Latest sync in records"/"Data fresh as of" com "Synced", "200 loaded" e "25 minutes ago", botão "Sync now" e toggle ENABLED — VERIFICADA (200, image/png; 1602x1026), INSPECIONADA
- `airbyte-error-config` — https://docs.airbyte.com/assets/images/configuration-error-d48004584d4f0756f695aa4f22700f80.png — linha "Sync Failed — 0 Bytes | no records extracted | no records loaded | 1m 39s" com "Failure in source: Could not connect to the source. Please re-verify the connector configuration and re-attempt the sync." — VERIFICADA (200, image/png; 2142x152), INSPECIONADA
- `airbyte-error-partial` — https://docs.airbyte.com/assets/images/warning-error-112a83ed60f4247be50ee20bf1093c55.png — linha "Sync Partially Succeeded — 2.16 MB | 876 records extracted | 487 records loaded | 1h 56m 26s" com "Warning from source…" e bloco monoespaçado com URL, "Response Code: 429, … Too Many Requests" — VERIFICADA (200, image/png; 2144x220), INSPECIONADA (exemplo de junho de 2024)
- `hex-schema-refresh-history` — https://learn.hex.tech/assets/img/schema-refresh-history.74d97587.png — tabela "Schema refresh history": busca por conexão, filtros Status e Outcome, colunas Data connection / Requested at / Trigger / Triggered by / Status / Outcome (chip verde Success) / Queued time / Refresh time / Total time / Error / Partial failures — VERIFICADA (200, image/png; 1241x651), INSPECIONADA


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-73_01_airbyte_connection_status`

![REF-73_01_airbyte_connection_status](https://docs.airbyte.com/assets/images/cloud-status-page-88407100afc2debe348e30ef21f75959.png)

`REF-73_02_airbyte_error_config`

![REF-73_02_airbyte_error_config](https://docs.airbyte.com/assets/images/configuration-error-d48004584d4f0756f695aa4f22700f80.png)

`REF-73_03_airbyte_error_partial`

![REF-73_03_airbyte_error_partial](https://docs.airbyte.com/assets/images/warning-error-112a83ed60f4247be50ee20bf1093c55.png)

`REF-73_04_hex_schema_refresh_history`

![REF-73_04_hex_schema_refresh_history](https://learn.hex.tech/assets/img/schema-refresh-history.74d97587.png)

**SOURCE:**
- https://docs.airbyte.com/platform/cloud/managing-airbyte-cloud/review-connection-status — docs oficiais Airbyte
- https://learn.hex.tech/docs/connect-to-data/data-connections/data-connections-introduction — docs oficiais Hex (seção Schema refresh history)

**PROBLEM:** Ingestões longas falham de formas diferentes: erro de configuração, limite de taxa, falha de uma stream entre muitas, perda parcial. Se tudo é "erro", o usuário não sabe se deve corrigir credenciais, esperar ou ignorar.

**SOLUTION:** Estados em dois níveis (conexão e stream) com vocabulário claro, e linhas de histórico que combinam estado + métricas (bytes, registros extraídos × carregados, duração) + mensagem de causa. Falha parcial é um estado próprio (aviso amarelo, não erro vermelho) com a evidência técnica expansível. Hex expõe "Outcome" (success, failure, partial success, cancelled, skipped) e uma coluna "Partial failures".

**OBSERVE:**
- Conexão: Healthy / Failed / Running / Paused / Queued; stream: Synced / Syncing / Queued / Queued for next sync / Error ("expects to recover next sync") / Action Required (breaking change) — tabela de status do doc.
- "Error" na stream tem semântica: Airbyte espera recuperação no próximo sync; "Action Required" é o que o usuário precisa agir (diferenciação entre transitório e acionável).
- Falha de configuração: mensagem em vermelho "Failure in source:" + instrução direta ("re-verify the connector configuration and re-attempt") — causa + ação na mesma linha, mesmo com "0 Bytes".
- Falha parcial: "876 records extracted | 487 records loaded", ícone de alerta amarelo, "Warning from source" e bloco com URL e HTTP 429 — a quantidade extraída ≠ carregada é a pista central.
- Colunas de frescor: "Latest sync in records" e "Data fresh as of 25 minutes ago" (alternável para data/hora exata) — o estado é sobre o dado, não só sobre o job.
- Ações por stream (menu ⋮): a docs cita "Show in replication table" (leva à aba Schema com a stream destacada); outras ações NÃO VERIFICADAS.
- Hex: histórico filtrável por Status e Outcome, com tempos separados (Queued, Refresh, Total) e colunas Error e Partial failures — falha parcial como cidadã de primeira classe.

**INTERACTION:**
1. Usuário abre a conexão > aba Status; vê gráficos e a lista de streams com estado.
2. Identifica a stream com Error/Action Required; abre o menu ⋮ (ex.: ir ao schema).
3. Em Timeline/histórico, expande a linha com falha: lê mensagem + bloco técnico.
4. Corrige (credencial, limite de taxa, schema) e dispara "Sync now".
5. (Hex) filtra histórico por Outcome = partial success e abre os erros por conexão.

**WHY IT WORKS:** Separar "falhou", "falhou parcialmente" e "precisa de ação" evita alarmes falsos e deixa claro o próximo passo. Mostrar contagens (extraídos × carregados) dá evidência objetiva sem exigir abrir logs.

**ADAPT TO BIWEB:** Estados de ingestão da S02 (progresso, falha parcial) podem seguir esse modelo: estado por conexão e por tabela/stream, mensagem "causa + ação" em linha, contagens extraídas × carregadas, "dados frescos há…", e histórico filtrável por resultado (success/failed/partial/skipped/cancelled). Incremental/agendamento exibem "próxima execução em…".

**DO NOT COPY:** O vocabulário de "streams" e "Data worker capacity"/Queued por plano; a tabela de eventos sem agrupamento por stream; mensagens técnicas cruas como única explicação (o exemplo 429 só tem a URL, sem sugestão de espera).

---

---

### REF-74 — n8n + Airbyte + Hex — Autenticação e segredos (Managed vs Custom OAuth, "Secret field", segurança da conexão)

**IMAGES:**
- `n8n-managed-oauth` — https://docs.n8n.io/~gitbook/image?url=https%3A%2F%2F139179334-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FBKcbOzIWja8NfqKDcqHc%252Fuploads%252Fgit-blob-8df4e7b21b6c4c4ac5fee78cc0a0be53c32d6ea5%252Fmanaged-oauth.png%3Falt%3Dmedia&width=768&dpr=3&quality=100&sign=9fd9f80fb835cb8fe491139c6ae8e244&sv=3 — credencial Google: dropdown "Setup credential" com "Managed OAuth2 (recommended)" e "Custom OAuth2", campo "Allowed HTTP Request Domains = All", botão "Sign in with Google" — VERIFICADA (200, image/png; 1148x510), INSPECIONADA. URL assinada (proxy GitBook com `sign=`): pode expirar.
- `airbyte-user-input-form` — https://docs.airbyte.com/assets/images/tutorial-start-date-input-d996c48be337ced33d38ca7f80f05e94.png — modal "Edit user input": Input name, Field ID, Hint, Type (Date), Pattern (regex), toggles Required / Secret / Hidden / Enable default value, Default value com datepicker, botões Delete / Cancel / Save changes — VERIFICADA (200, image/png; 492x1001), INSPECIONADA
- `hex-data-sources-security-column` — https://learn.hex.tech/assets/img/add-workspace-connection.9772002c.png — Settings > Data sources: tabela de conexões com colunas Name/Type/Access ("Can query / Can view")/Usage/Security (SSL/TLS), botão "+ Connection" — VERIFICADA (200, image/png; 1428x520), INSPECIONADA


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-74_01_airbyte_user_input_form`

![REF-74_01_airbyte_user_input_form](https://docs.airbyte.com/assets/images/tutorial-start-date-input-d996c48be337ced33d38ca7f80f05e94.png)

`REF-74_02_hex_data_sources_security_column`

![REF-74_02_hex_data_sources_security_column](https://learn.hex.tech/assets/img/add-workspace-connection.9772002c.png)

**SOURCE:**
- https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/ e https://docs.n8n.io/credentials/add-edit-credentials/ — docs oficiais n8n (2026)
- https://docs.airbyte.com/platform/connector-development/connector-builder-ui/tutorial — docs oficiais
- https://learn.hex.tech/docs/connect-to-data/data-connections/data-connections-introduction — docs oficiais Hex (SSH/SSL/TLS, allowlist de IP, drafts, permissões)

**PROBLEM:** Credenciais são a parte mais assustadora: OAuth exige criar app no console da nuvem, bancos pedem SSL/SSH e liberar IP no firewall, e quem configura precisa saber onde guardar segredo sem expor.

**SOLUTION:** Oferecer o caminho curto por padrão (OAuth gerenciado pela plataforma, "Sign in with Google") e o caminho avançado no mesmo seletor ("Custom OAuth2"). Marcar segredos como tal no esquema do conector (toggle "Secret field"), controlar escopo de uso (Allowed HTTP Request Domains, níveis de credencial) e mostrar a segurança da conexão em coluna de lista (SSL/TLS) com permissões "Can query/Can view".

**OBSERVE:**
- Um dropdown no topo do bloco de credencial escolhe o tipo de OAuth: "Managed OAuth2 (recommended)" vs "Custom OAuth2" (imagem inspecionada); o botão principal muda para "Sign in with Google" sem pedir Client ID/Secret.
- n8n: ao salvar a credencial, o produto testa ("n8n tests it to confirm it works", docs); nome padrão é renomeável; OAuth pode ser "Fixed" ou "End-user" (cada pessoa usa a sua).
- "Allowed HTTP Request Domains" restringe onde a credencial pode ser usada (default "All").
- Custom OAuth2 no n8n implica cinco passos externos no Google Cloud Console (projeto, APIs, consent, client, voltar ao n8n) — por isso o gerenciado é o recomendado; Managed OAuth2 não está disponível em self-hosted (docs).
- Airbyte: "Secret field" é toggle por input no esquema do conector; "Hidden field" e "Required field" ao lado; defaults opcionais; pattern/regex para validação.
- Hex: conexão de workspace pode ser salva como rascunho (draft); IPs do Hex precisam ser liberados no firewall (texto da docs); SSL/TLS exibido na coluna Security; SSH configurável por conexão.
- Fivetran (REF-68): URL de redirect OAuth mostrada antes do botão Authorize.

**INTERACTION:**
1. Usuário cria credencial (menu Create ou direto do node/conector).
2. Escolhe o tipo: "Managed OAuth2" (padrão) → "Sign in with Google" → popup → pronto.
3. Se precisar, troca no dropdown para Custom OAuth2 e segue passos com Client ID/Secret.
4. A plataforma testa ao salvar; mostra sucesso ou erro.
5. Em bancos: informa host, credenciais, SSL/SSH, libera o IP da plataforma e salva (ou salva como rascunho).

**WHY IT WORKS:** O caminho seguro e curto é o padrão; o complexo existe, mas está um dropdown abaixo. Marcar segredo no esquema permite que a UI mascare, que o log nunca imprima e que a IA/assistente não os receba (REF-67).

**ADAPT TO BIWEB:** O seletor de autenticação do conector (usuário/senha, API key, OAuth, service account, SSH/SSL) deve ser guiado pelo esquema do SDK, com um método recomendado e os demais atrás de um dropdown. Campos secretos declarados no SDK, mascarados e fora do contexto do copiloto. Mostrar a lista de IPs de saída do BIWEB para allowlist e uma coluna "Segurança" (SSL/TLS, SSH) na lista de conexões da S02.

**DO NOT COPY:** O fluxo de 5 passos externos do Google Cloud mostrado como texto de documentação; a marca "Sign in with Google" como único botão; o nome "Managed OAuth2" (depende de a plataforma operar o app OAuth — decisão de produto/negócio).

---

---

### REF-75 — Zapier + Microsoft Fabric — Padrões Copilot: "AI preenche, usuário revisa" sem esconder o manual

**IMAGES:**
- `zapier-copilot-prompt-modes` — https://cdn.zappy.app/78f70c6473539151c79fdd690c37f1b3.png — caixa "Copilot — AI beta" sobre o canvas de um Zap vazio, prompt "New Google Sheets row > Send Gmail email.", seletor de modo "Auto-build" e botão "Start Building"; abaixo, os cartões manuais "Trigger" e "Action" ainda visíveis (separador "or") — VERIFICADA (200, image/png; 1324x690), INSPECIONADA
- `zapier-copilot-sidebar-review` — https://cdn.zappy.app/28b2abee8b9da40b5fd9dca77e7038a3.png — Copilot como sidebar esquerda (log de ações "Update Zap Steps", "Checkpoint added – Revert", testes), canvas com os passos, painel direito de configuração do passo "Send Email" com campos, "Search fields", e botão desabilitado "To continue, finish required fields"; barra do topo Undo/Test run/Publish; rodapé do sidebar "Chat with Copilot / Auto-build" — VERIFICADA (200, image/png; 1351x801), INSPECIONADA. Selo de versão da UI no rodapé: "ver. 2025-07-29".
- `fabric-copilot-get-data-pane` — https://learn.microsoft.com/en-us/fabric/data-factory/media/dataflow-gen2-copilot-explain/explain-query.png — Dataflow Gen2: menu de contexto da query com "Explain this query" e painel Copilot "What would you like to do?" com três ações iniciais: "Get data from…", "Add a step that…", "Describe this query" — VERIFICADA (200, image/png; 1674x622), INSPECIONADA


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-75_01_zapier_copilot_prompt_modes`

![REF-75_01_zapier_copilot_prompt_modes](https://cdn.zappy.app/78f70c6473539151c79fdd690c37f1b3.png)

`REF-75_02_zapier_copilot_sidebar_review`

![REF-75_02_zapier_copilot_sidebar_review](https://cdn.zappy.app/28b2abee8b9da40b5fd9dca77e7038a3.png)

`REF-75_03_fabric_copilot_get_data_pane`

![REF-75_03_fabric_copilot_get_data_pane](https://learn.microsoft.com/en-us/fabric/data-factory/media/dataflow-gen2-copilot-explain/explain-query.png)

**SOURCE:**
- https://help.zapier.com/hc/en-us/articles/15703650952077 — help center oficial Zapier (Copilot), acessado 2026-10-07
- https://learn.microsoft.com/en-us/fabric/data-factory/copilot-fabric-data-factory-get-started e https://learn.microsoft.com/en-us/fabric/data-factory/copilot-fabric-data-factory — docs oficiais Microsoft, ms.date 2026-08-31
- Relacionados no pack: REF-66 (Airbyte AI Assist), REF-67 (Airbyte Setup Assistant), REF-68 (Fivetran AI Connector Agent)

**PROBLEM:** Como um copiloto pode ajudar a configurar uma conexão (escolher conector, preencher campos, mapear) sem virar caixa-preta, sem escolher conta errada ou aplicar mudanças sem consentimento?

**SOLUTION:** Três padrões complementares. (1) Zapier: modo "Auto-build" (a IA constrói o que puder) vs "Ask as you build" (sugere e pede confirmação para cada ação); a IA seleciona uma conta conectada por regra e, se não houver, pede para o usuário conectar; checkpoints permitem reverter. (2) Fabric Dataflow Copilot: painel com ações iniciais; "Get data from…" abre a MESMA janela "Get data" do fluxo manual (busca OData, informa URL, navegador de tabelas); cada resposta gera um passo visível em "Applied steps", com botão Undo. (3) Fabric Pipelines: "Error message assistant" explica erros com orientação acionável.

**OBSERVE:**
- A IA convive com o fluxo manual: o prompt box aparece acima dos cartões "Trigger/Action" vazios, com "or" entre eles (imagem inspecionada).
- Seletor de modo ao lado do botão: Auto-build vs Ask as you build — o usuário decide o quanto a IA age sozinha.
- O sidebar registra cada ação da IA ("Update Zap Steps", "Test … ") e permite "Show reasoning" (docs) — rastro auditável.
- Checkpoint adicionado no chat com ação "Revert"; docs descrevem comparar a versão do checkpoint com a atual antes de reverter.
- Campos requeridos ainda bloqueiam o avanço ("To continue, finish required fields"): a IA não contorna validação; a docs diz que o sidebar lista itens que ela não pode fazer em nome do usuário.
- Regra de seleção de conta: conta do mesmo e-mail → conta mais usada → qualquer acessível → se nada, pede para conectar (docs).
- Fabric: três atalhos iniciais ("Get data from…", "Add a step that…", "Describe this query"); a docs recomenda revisar cada passo em "Applied steps" e usar Undo; limitações declaradas (não faz operações em várias queries; "Copilot doesn't produce a message for skills that it doesn't support").
- Fabric: Copilot exige capacidade paga (F2+/P1+) e habilitação por admin (docs) — disponibilidade condicionada, explícita.

**INTERACTION:**
1. Usuário abre um novo Zap/Dataflow; vê prompt do Copilot e o caminho manual.
2. Descreve o objetivo em linguagem natural (ou clica "Get data from…").
3. Escolhe modo (Auto-build ou Ask as you build).
4. A IA monta passos; o usuário vê o log, abre cada passo, revisa campos; completa o que faltou (conectar conta, valores).
5. Testa; usa Undo/Revert (checkpoint); publica/carrega.

**WHY IT WORKS:** A IA age sobre os mesmos objetos editáveis (passos, campos) e deixa registro; o usuário calibra o grau de autonomia e pode desfazer. Rotear "Get data from…" para a janela manual garante que a parte mais sensível (credenciais, URL) acontece no fluxo padrão e auditável.

**ADAPT TO BIWEB:** O copiloto opcional do BIWEB pode oferecer ações iniciais na S02 ("Conectar a…", "Descrever este dataset") que abrem o wizard padrão pré-preenchido; um seletor "Preencher sozinho / Perguntar antes"; log de ações da IA; Undo e checkpoints; validação de campos obrigatórios intacta. Selecionar conexão existente por regra previsível e pedir para o usuário criar uma nova se não houver.

**DO NOT COPY:** O visual de sidebar com chat longo ocupando 1/3 da tela; "Auto-build" como padrão para operações com credenciais (para BIWEB, recomendar começar em "perguntar antes" para ações de conexão); gating por capacidade paga como no Fabric.

---

---

#### Open-source technology notes (connectors)

Verificação: API do GitHub foi consultada para os 11 primeiros (licença, stars, `pushed_at` em 2026-10-07) antes do rate limit (60 req/h) bloquear novas consultas; os demais vêm de leitura da página do repositório (WebFetch) e estão marcados "página GitHub, aproximado".

| Projeto | Finalidade | Licença | Maturidade | URL | Por que pode interessar |
|---|---|---|---|---|---|
| Airbyte (plataforma) | ELT: catálogo de conectores, Builder, sync | **Elastic License 2.0 (ELv2)** no repo principal (API retorna NOASSERTION; arquivo LICENSE confirma ELv2); README indica MIT para conectores/CDK e ELv2 para a plataforma. **NÃO é OSI**: proíbe oferecer como serviço gerenciado | 22.185 stars; push 2026-10-07 (API) | https://github.com/airbytehq/airbyte | Melhor referência de Builder + AI Assist + schema/status UX; licença exige cuidado para reuso de código |
| Airbyte Python CDK | Framework para conectores low-code/Python | MIT (página GitHub; NÃO VERIFICADO via API) | página GitHub; stars baixos reportados (27, NÃO VERIFICADO) | https://github.com/airbytehq/airbyte-python-cdk | Base declarativa (manifest YAML) para um Connector SDK |
| n8n | Automação com credenciais/OAuth/nodes | **Sustainable Use License** (fair-code, não OSI; arquivos `.ee.` sob licença enterprise) — LICENSE.md confirmado | 206.813 stars; push 2026-10-07 (API) | https://github.com/n8n-io/n8n | Referência de credenciais/OAuth managed vs custom; não adotar código |
| Meltano | Orquestração ELT baseada em Singer + Hub | MIT (API) | 2.647 stars; push 2026-10-07 | https://github.com/meltano/meltano | Hub com variantes/status de manutenção por conector (sem screenshots acessíveis) |
| Meltano Singer SDK | SDK para taps/targets Singer | Apache-2.0 (página GitHub) | ~119 stars (página GitHub; NÃO VERIFICADO via API) | https://github.com/meltano/sdk | Modelo de SDK com esquema de settings e catálogo de streams |
| dlt | Biblioteca Python de ingestão; REST API source declarativo | Apache-2.0 (API) | 5.938 stars; push 2026-10-07 | https://github.com/dlt-hub/dlt | Inferência de schema/tipos e fonte REST declarativa para o pipeline SaaS/API |
| Supabase Wrappers (Wasm FDW) | Foreign Data Wrappers para consultar APIs/Stripe/S3 via SQL | Apache-2.0 (API) | 890 stars; push 2026-09-29 | https://github.com/supabase/wrappers | Conectores "live" para a família SQL com isolamento Wasm |
| Metabase | BI open source: Add database, upload CSV, sync/scan | **AGPL + Metabase Commercial License** (LICENSE.txt confirmado; API NOASSERTION) | 49.563 stars; push 2026-10-07 | https://github.com/metabase/metabase | Referência de "sync & scan" e drivers; AGPL exige cuidado |
| Apache Superset | BI open source; conexão por SQLAlchemy URI | Apache-2.0 (API) | 75.062 stars; push 2026-10-07 | https://github.com/apache/superset | Fluxo de conexão por URI + "Test connection" (NÃO pesquisado em detalhe) |
| DuckDB | Engine analítica local; leitura de CSV/Parquet | MIT (API) | 41.963 stars; push 2026-10-07 | https://github.com/duckdb/duckdb | Inferência de tipos/dialeto de CSV e leitura de Parquet para o pipeline de upload (capacidade de "CSV sniffer" NÃO VERIFICADA nesta pesquisa; conhecimento prévio) |
| Sling CLI | EL arquivo/DB → DB | GPL-3.0 (página GitHub) | ~912 stars (página GitHub, NÃO VERIFICADO via API) | https://github.com/slingdata-io/sling-cli | Referência de replicação de arquivos e DBs; GPL-3.0 é copyleft forte |
| CloudQuery | ELT de fontes cloud/SaaS para SQL | MPL-2.0 (página GitHub; plugins variam) | ~6,5k stars (página GitHub, NÃO VERIFICADO via API) | https://github.com/cloudquery/cloudquery | Modelo de plugins de fonte com schema explícito |
| Dozer (getdozer) | Data API em tempo real | AGPL-3.0 (API) | 1.577 stars; último push 2024-06-18 (aparentemente sem manutenção) | https://github.com/getdozer/dozer | Apenas contexto; evitar |

Observação de licenciamento: Airbyte (ELv2), n8n (SUL) e Metabase (AGPL) NÃO são permissivas — usar como referência de UX/ideias, não como dependência embutida, sem análise jurídica.

---

#### Padrões transversais

##### 1. Catálogo + busca + categorias
- Busca no topo e chips de categoria (File, Database, Online services, Other); cartões com nome + categoria + selo Beta (REF-69).
- Contador de conectores e ordenação (popularidade) e etiquetas de tipo (Hybrid); grupos DATABASES/APIS como alternativa (Retool).
- Saída para a cauda longa em todo catálogo: "Let us know" (Retool), "AI-generated connectors" (Fivetran), "Start from scratch" no Builder (Airbyte).
- Formatos de arquivo no topo do catálogo (Excel, Text/CSV, JSON, Parquet) como cidadãos de primeira classe.

##### 2. Fluxo em etapas: credenciais → testar → descobrir schema → selecionar → preview → agendar
- Power Query: Connection settings → Authentication → Navigator (preview) → destino (REF-70).
- Fivetran: formulário → Save & Test → opções "sincronizar tudo / customizar schema / depois" → schema → Start Initial Sync (REF-68, REF-72).
- Airbyte: Source (Test and save) → New Connection → Schema (streams, sync mode) → agenda (Every 24 hours) → Status (REF-67, REF-72, REF-73).
- Hex: nova conexão dispara refresh de schema automático e agenda de refresh; agentes só analisam após o refresh (REF-73, texto da docs).
- Teste de conexão é parte do Save, não uma etapa opcional em Airbyte/Fivetran/n8n.

##### 3. Erros acionáveis
- Mensagem = causa + ação na mesma linha ("re-verify the connector configuration…") com detalhe técnico expansível (REF-73).
- Estados com semântica de recuperação: Error (transitório) vs Action Required (humano) vs Partially Succeeded.
- Métricas objetivas junto da mensagem: extraídos × carregados, duração, frescor.
- Setup tests definidos pelo autor do conector retornam mensagem legível (Fivetran SDK, REF-68).
- Cuidado: o exemplo 429 do Airbyte mostra URL e código sem recomendação de espera (lacuna a melhorar).

##### 4. Opções avançadas colapsadas
- "Advanced options" recolhido dentro do diálogo de conexão (Power Query); "Advanced" por bloco no Builder (Airbyte); botão de configurações no canto da tabela de schema.
- Defaults seguros e valores detectados pré-selecionados (CSV: encoding/delimitador/tipos).
- Campos opcionais marcados "Optional" e com help text embaixo do campo.
- Itens raros no fim de listas (Custom, Fixed width).

##### 5. AI-assisted com revisão manual
- A IA preenche o MESMO formulário que o caminho manual (Airbyte Builder/Setup Assistant) ou chama a MESMA janela (Fabric "Get data from…").
- Toggle Agent ⇄ Form sempre visível; "Skip and start manually" no modal de entrada (REF-66, REF-67).
- Etapa de revisão obrigatória antes de efeito (Fivetran Review endpoints; Airbyte teste de stream; Fabric "Applied steps").
- Segredos em modo seguro, fora do contexto do modelo; OAuth por botão (Airbyte).
- Autonomia ajustável (Zapier Auto-build vs Ask) + log de ações + checkpoints/Undo (REF-75).
- Sugestões marcadas visualmente (estrela no combobox) e avisos de "Human Oversight Required".
- Disponibilidade e limites declarados (beta, capacidade paga, não suporta N queries).

##### 6. Anti-patterns observados / a evitar
- Geração assíncrona longa sem estimativa de progresso ("de alguns minutos a mais de 1 hora", Fivetran).
- Tabela de schema com colunas cortadas na horizontal (Fivetran) em telas médias.
- Modal de aviso técnico (encryption) no meio do fluxo sem contexto (Power Query).
- IA como único caminho / chat em tela cheia substituindo o formulário.
- Preview que carrega o arquivo inteiro sem declarar a amostra usada para inferir tipos.
- "Error" genérico sem distinguir transitório/acionável/parcial.
- Copiloto sem rastro (sem log do que mudou) ou sem Undo.
- Copiar copy de marca de terceiros (Hybrid, Managed OAuth2, Sign in with Google).

---


---

## 13 — Workflow Builder

**Pergunta da área:** como visualizar e (futuramente) montar fluxos Source → Import → Transform → Validate → Join → Semantic Model → Dashboard sem deixar o canvas ilegível? (Base da futura área **Intelligent Workflow**.)
**Aprendizados-chave:** agrupar × encapsular; cartão colapsado agregando estado; minimapa com cor de estado; zoom semântico; segunda vista (Grid/Gantt); estado com cor + ícone + texto; retry granular; logs por nó; agendamento como trigger no grafo.

### REF-76 — n8n / canvas de workflow, sub-nós de IA, logs de execução e sub-workflows

**IMAGES:**
- n8n-canvas-agent — https://raw.githubusercontent.com/n8n-io/n8n/master/assets/n8n-screenshot-readme.png — "Canvas n8n com AI Agent, Chat Model/Memory/Tool como sub-nós, nó If com saídas true/false e dois Slack" — OK 200 image/png; inspeção visual. ATENÇÃO: UI antiga (contador "Star 51,309" no canto ⇒ ~2024); serve para anatomia de nós/portas, não para o visual atual.
- n8n-logs-panel — https://n8niostorageaccount.blob.core.windows.net/n8nio-strapi-blobs-prod/assets/Logs_Sltantit_Still_686caef6ca.png — "Painel Logs: árvore de execução, INPUT/OUTPUT, 'Success in 2.676s', tokens" — OK 200 image/png; inspeção visual. Still de marketing de n8n.io/ai (2026), renderizado com perspectiva inclinada; dados de exemplo.


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-76_01_n8n_canvas_agent`

![REF-76_01_n8n_canvas_agent](https://raw.githubusercontent.com/n8n-io/n8n/master/assets/n8n-screenshot-readme.png)

`REF-76_02_n8n_logs_panel`

![REF-76_02_n8n_logs_panel](https://n8niostorageaccount.blob.core.windows.net/n8nio-strapi-blobs-prod/assets/Logs_Sltantit_Still_686caef6ca.png)

**SOURCE:**
- https://docs.n8n.io/workflows/components/nodes/ (docs oficial, consultado 2026-10)
- https://docs.n8n.io/workflows/executions/debug/ (docs oficial: "Debug in Editor"/"Copy to Editor")
- https://docs.n8n.io/flow-logic/subworkflows/ e https://docs.n8n.io/flow-logic/error-handling/ (docs oficial)
- https://n8n.io/ai/ (marketing oficial, imagens 2026)
- https://github.com/n8n-io/n8n/blob/master/packages/frontend/editor-ui/package.json (editor-ui v2.43.0 no master em 2026-10-07: usa @vue-flow/core 1.48.0, minimap, controls, background, node-resizer)

**PROBLEM:** Em automações, o usuário precisa ver o fluxo como um mapa, mas também precisa inspecionar o dado que passou por cada passo, sem abrir logs de infraestrutura. Fluxos com agentes de IA acrescentam dependências "laterais" (modelo, memória, ferramentas) que poluem o fluxo principal.

**SOLUTION:** Canvas de nós com portas laterais para o fluxo principal e portas de "sub-nó" (losangos, aresta tracejada) para dependências de IA, assim o eixo horizontal continua sendo a história do dado. Execução e inspeção ficam acopladas: logs em árvore + painel INPUT/OUTPUT por nó; execuções passadas podem ser carregadas de volta no editor (Debug in Editor) com dado "fixado" (pin) no primeiro nó para iterar sem re-executar a origem.

**OBSERVE:**
- Nó principal é um quadrado arredondado com ícone grande e rótulo FORA do nó (embaixo, com subtítulo cinza tipo "Send message"); porta de saída é um círculo cinza à direita, porta de entrada é um retângulo à esquerda; um "+" quadrado aparece na ponta de saída livre para encadear o próximo passo (inspeção visual).
- Nó If tem duas portas de saída rotuladas "true"/"false" no próprio nó; arestas curvas (bezier) partem de cada uma (inspeção visual).
- Nó AI Agent é um retângulo largo; abaixo dele, portas em losango rotuladas "Chat Model *" (asterisco = obrigatório), "Memory", "Tool" ligadas por arestas TRACEJADAS a nós circulares menores (OpenAI Chat Model, Window Buffer Memory, SerpAPI, Call n8n Workflow Tool) — dependência opcional/obrigatória codificada na porta (inspeção visual).
- Barra inferior esquerda: ajustar à tela, zoom +, zoom −, reset; botão "+" no canto superior direito para abrir o seletor de nós; abas "Editor | Executions" centradas no topo; botão laranja "Chat" para disparar o agente; toggle Inactive/Share/Saved no cabeçalho (inspeção visual da imagem antiga).
- Painel de logs (still 2026): coluna esquerda com árvore de execução (nó "Budget agent" expandido com filhos Simple Memory, OpenAI Chat Model1, "Ask more info from user"), ícone de status por linha, resumo "Success in 2m 20.23…" e "4.873 Tokens"; coluna central INPUT em JSON com alternância Schema/Tabela/JSON e busca; coluna OUTPUT à direita (inspeção visual).
- No canvas do still, nós executados ganham borda/ícone verde com check e contador (ex. "✓5"); nó de ferramenta com anel verde (inspeção visual, parcialmente cortado).
- Menu de contexto do nó (só doc): abrir, executar, renomear, desativar, fixar (pin), copiar, duplicar, "tidy workflow" (auto-layout), "convert to sub-workflow", selecionar tudo.
- Configurações por nó (só doc): Retry On Fail, Always Output Data, Execute Once e modos de erro (parar workflow / continuar / continuar com saída de erro). Workflow de erro separado começa com nó "Error Trigger" (só doc).

**INTERACTION:**
1. Usuário adiciona o primeiro passo pelo "+" (ou arrasta da porta de saída para abrir o seletor).
2. Conecta saída → entrada; nós com ramificação mostram portas rotuladas.
3. Executa um nó isolado ("Execute step") ou o fluxo todo; o canvas colore/marca os nós executados.
4. Abre um nó para ver INPUT/OUTPUT; pode fixar (pin) o dado de saída para testar passos seguintes.
5. Se uma execução em produção falhou, abre Executions → "Debug in Editor": o dado da execução é carregado no editor e fixado no primeiro nó; corrige e reexecuta.
6. Para reduzir o canvas: seleciona nós → "Convert to sub-workflow"; o nó "Execute Sub-workflow" passa a ter o link "View sub-execution" para seguir a execução filha.

**WHY IT WORKS:** Mantém a mesma metáfora (nó = passo com dado de entrada e saída) do desenho à depuração; a inspeção é local ao nó e o dado real vira "fixture" de edição, o que torna o ciclo editar→testar curto. Portas de sub-nó separam "o que flui" de "do que o passo depende".

**ADAPT TO BIWEB:** Cada etapa do pipeline (Import, Transform, Validate, Join) poderia ter um painel INPUT/OUTPUT mostrando amostra de linhas e esquema antes/depois, já usando o resultado da última execução do Temporal. O padrão "Debug in Editor" (carregar uma execução falha como contexto de edição) casa com o princípio de ações recuperáveis. Sub-workflow como "Convert selection to subflow" é um caminho para o Transformation DAG não virar um canvas ilegível.

**DO NOT COPY:** Branding/ícones coloridos de integrações; o canvas livre sem agrupamento nativo (n8n depende de sticky notes/sub-workflows para organizar); a contagem de créditos e a licença (Sustainable Use). Não copiar o still de marketing com distorção de perspectiva como referência de layout.

---

---

### REF-77 — Node-RED / editor com grupos, subflows, navigator, debug sidebar

**IMAGES:**
- nr-editor-default — https://nodered.org/docs/user-guide/editor/images/editor-default.png — "Editor padrão do Node-RED com Explorer, Palette, canvas, Information e Debug messages" — OK 200 image/png; inspeção visual. UI atual (inclui painel "Explorer" com busca de flows, Subflows e Global Configuration Nodes; as capturas de debug no mesmo site têm data 02/06/2026).
- nr-group — https://nodered.org/docs/user-guide/editor/images/editor-group.png — "Grupo 'Timeout Handling' com 3 nós dentro, entre inject e debug" — OK 200 image/png; inspeção visual.
- nr-subflow-selection — https://nodered.org/docs/user-guide/editor/images/editor-subflow-create-selection.png — "Seleção tracejada de split→function→join (acima) vs. nó único 'Subflow' (abaixo)" — OK 200 image/png; inspeção visual.


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-77_01_nr_editor_default`

![REF-77_01_nr_editor_default](https://nodered.org/docs/user-guide/editor/images/editor-default.png)

`REF-77_02_nr_group`

![REF-77_02_nr_group](https://nodered.org/docs/user-guide/editor/images/editor-group.png)

`REF-77_03_nr_subflow_selection`

![REF-77_03_nr_subflow_selection](https://nodered.org/docs/user-guide/editor/images/editor-subflow-create-selection.png)

**SOURCE:**
- https://nodered.org/docs/user-guide/editor/workspace/groups
- https://nodered.org/docs/user-guide/editor/workspace/subflows
- https://nodered.org/docs/user-guide/editor/sidebar/debug
- https://github.com/node-red/node-red (Apache-2.0; package.json do master = v5.0.7 em 2026-10-07)

**PROBLEM:** Fluxos IoT/integração crescem para dezenas de abas e centenas de nós; sem estrutura, vira "espaguete". É preciso agrupar visualmente, reutilizar trechos e achar rapidamente onde está o nó/mensagem relevante.

**SOLUTION:** Três mecanismos complementares: (1) grupos visuais coloridos e nomeados que continuam mostrando os nós, (2) subflows que colapsam um conjunto em UM nó reutilizável com portas de entrada/saída próprias, (3) painéis laterais para navegação (Explorer/busca), documentação (Information) e depuração (Debug messages), mais o Navigator (minimapa) no canvas.

**OBSERVE:**
- Paleta à esquerda com nós coloridos por categoria (inject azul, debug verde, catch vermelho, status azul-claro, link cinza) e ícone/"alça" lateral; porta = pequeno retângulo cinza nas laterais; arestas são curvas grossas cinzas (inspeção visual).
- Barra inferior do canvas: ícone de mapa (navigator), −, círculo (reset), +, ajustar, lupa (busca); à direita, ícones de sidebar (inspeção visual).
- Painel "Explorer" lista Flows, Subflows e Global Configuration Nodes como árvore com campo "Search flows"; painel "Information" mostra id do flow selecionado (inspeção visual).
- Grupo = retângulo de fundo azul-claro com título no canto superior esquerdo ("Timeout Handling"); arestas atravessam a borda do grupo sem interrupção; nós dentro mantêm aparência normal (inspeção visual).
- Seleção para subflow aparece como contorno laranja tracejado; após converter, três nós viram um único nó cor salmão "Subflow" com as mesmas entradas/saída (inspeção visual).
- Subflow abre em aba própria com nós "input"/"output" cinza e um nó de "status" opcional que atualiza o estado exibido em cada instância (só doc); propriedades do subflow viram variáveis de ambiente por instância (só doc).
- Debug sidebar (inspeção visual, imagem separada): lista cronológica com timestamp, "node: debug 1", tipo da propriedade (msg.payload : Object), árvore expansível; botões Pause, filtro "all nodes", limpar "all".
- Navigator em miniatura/minimapa: botão de mapa na barra do canvas (visível); não consegui abrir o navigator expandido numa imagem atual (NÃO VERIFICADO visualmente).

**INTERACTION:**
1. Seleciona nós → Ctrl/⌘-Shift-G (ou menu Groups → Group selection) para agrupar; duplo clique no grupo para nome, cor e descrição Markdown (mostrada no painel Information).
2. Arrasta nó para dentro do grupo para incluí-lo; Alt+arrastar para tirar.
3. Para reduzir complexidade: seleciona nós → Subflows → "Selection to Subflow" (exige uma única entrada); a seleção vira um nó na paleta.
4. Duplo clique no subflow abre a aba com portas; alterações propagam para todas as instâncias.
5. Debug: coloca um nó "debug" na aresta; vê as mensagens no painel Debug, filtra por nó, pausa o stream.

**WHY IT WORKS:** Dois níveis de organização — agrupamento "leve" (mantém tudo visível, só dá contexto) e encapsulamento "forte" (esconde detalhes e vira bloco reutilizável) — deixam o usuário escolher quanto detalhe esconder. O nó de debug põe a inspeção dentro do mesmo canvas.

**ADAPT TO BIWEB:** O mesmo dilema aparece no Transformation DAG: grupo visual para "Limpeza de clientes" e subflow reutilizável para "Normalizar cadastro". Os níveis "agrupar sem esconder" vs. "encapsular" poderiam ser duas ações distintas, com a segunda marcada como recuperável. O painel Explorer (lista hierárquica + busca de flows) é referência para navegar um pipeline grande sem depender só do canvas.

**DO NOT COPY:** Paleta de cores por categoria do Node-RED (não tem relação com estados de execução); o modelo "fluxo de mensagens" (msg.payload) — no BIWEB o contrato é dataset/esquema; a estética de grade e de nós em estilo "paleta de cores por tipo".

---

---

### REF-78 — React Flow (xyflow) / exemplos oficiais: sub-flows, contextual zoom, expand/collapse, status

**IMAGES:**
- rf-subflows — https://example-apps.xyflow.com/react/examples/grouping/sub-flows/preview.jpg?v=17 — "Exemplo Sub Flows: Node 0/1 soltos; Group A com Node A.1; Group B com Node B.1 e subgrupo B.A com B.A.1/B.A.2" — OK 200 image/jpeg; inspeção visual. Thumbnail estático (v17 do site 2026).
- rf-contextual-zoom — https://example-apps.xyflow.com/react/examples/interaction/contextual-zoom/preview.jpg?v=17 — "Três nós conectados por arestas tracejadas: 'Zoom to toggle content and placeholder'..." — OK 200 image/jpeg; inspeção visual.
- rf-expand-collapse-pro — https://example-apps.xyflow.com/react/pro/expand-collapse/thumbnail.jpg?v=18 — "Thumbnail abstrato: nó pai selecionado (borda rosa) com seta e 3 filhos empilhados" — OK 200 image/jpeg; inspeção visual. Exemplo Pro (assinatura).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-78_01_rf_subflows`

![REF-78_01_rf_subflows](https://example-apps.xyflow.com/react/examples/grouping/sub-flows/preview.jpg?v=17)

`REF-78_02_rf_contextual_zoom`

![REF-78_02_rf_contextual_zoom](https://example-apps.xyflow.com/react/examples/interaction/contextual-zoom/preview.jpg?v=17)

`REF-78_03_rf_expand_collapse_pro`

![REF-78_03_rf_expand_collapse_pro](https://example-apps.xyflow.com/react/pro/expand-collapse/thumbnail.jpg?v=18)

**SOURCE:**
- https://reactflow.dev/examples/interaction/contextual-zoom, /examples/layout/expand-collapse (Pro), /examples/grouping/sub-flows, /examples/layout/elkjs (docs/exemplos oficiais)
- https://reactflow.dev/ui/components/node-status-indicator, /data-edge, /labeled-group-node, /node-search, /placeholder-node, /zoom-slider (React Flow UI, componentes shadcn)
- https://reactflow.dev/ui/templates/workflow-editor e /ai-workflow-editor (templates Pro)
- https://github.com/xyflow/xyflow (MIT, @xyflow/react 12.12.0)

**PROBLEM:** Equipes que vão construir o próprio canvas de workflow precisam de primitivas comprovadas para "não deixar o canvas ilegível": agrupar, colapsar, mudar o nível de detalhe com zoom, buscar nós, mostrar estado e dado nas arestas.

**SOLUTION:** Biblioteca de nós/arestas customizáveis + exemplos oficiais de cada padrão de escala: sub-flows (nós filhos dentro de nós-grupo), contextual zoom (o nó escolhe o conteúdo conforme o zoom via `useStore`), expand/collapse (grafo completo no estado, só o visível renderizado, layout recalculado com Dagre/ELK), e componentes de estado (Node Status Indicator: success/loading/error/initial) e de aresta com dado (Data Edge).

**OBSERVE:**
- Sub-flows: grupos aninhados com cores diferentes (roxo-claro e rosa/magenta no subgrupo), nós filhos presos ao grupo; arestas ligam nós de grupos diferentes (inspeção visual).
- Cada nó tem alças (handles) circulares pequenas no topo/base ou esquerda/direita; no exemplo de contextual zoom as alças estão nas laterais e as arestas são tracejadas (inspeção visual).
- Contextual zoom: o próprio texto do nó ("Zoom to toggle content and placeholder") descreve o comportamento — em zoom baixo o nó vira placeholder, em zoom alto mostra o conteúdo; a decisão é feita lendo o zoom do store (confirmado em doc).
- Expand/collapse (Pro): clicar no nó pai alterna a visibilidade dos filhos; o grafo completo permanece no estado, só o visível é renderizado; layout hierárquico com Dagre recalculado a cada mudança (só doc; imagem é thumbnail).
- Node Status Indicator: estados `success`, `loading`, `error`, `initial`; variante "border" (borda girando) ou "overlay" (spinner sobre o nó) (só doc).
- Data Edge: mostra um campo do `data` do nó de origem como rótulo na aresta (ex.: contagem) (só doc).
- Template "Workflow Editor" (Pro): sidebar drag-and-drop, auto-layout com ELKjs, runner que executa nós em sequência com indicadores de status, minimapa e controles, modo escuro (só doc; sem imagem na página).
- Template "AI Workflow Editor" (Pro): Next.js + AI SDK + shadcn + Zustand (só doc; sem detalhe de UI de geração).

**INTERACTION:**
1. Desenvolvedor registra tipos de nó/aresta customizados e o grafo (nodes[], edges[]) no estado.
2. Para escala: usa nó do tipo grupo (`parentId`) para sub-flows; usa `useStore` para ler o zoom e trocar para um placeholder abaixo de um limite; usa `useExpandCollapse` (Pro) para ocultar filhos.
3. Para execução: embrulha cada nó em `NodeStatusIndicator` e altera `status` conforme eventos do runner.
4. Para legibilidade: roda ELK/Dagre no carregamento e após mudanças estruturais.

**WHY IT WORKS:** Separa "modelo do grafo" (completo, em memória) de "o que é desenhado" (filtrado por zoom/colapso), permitindo grafos grandes sem renderizar tudo e sem esconder estrutura. Componentes pequenos e composáveis (status, rótulo de dado, grupo rotulado) evitam um monolito.

**ADAPT TO BIWEB:** Fornece vocabulário para o Transformation DAG da Fase 3: zoom semântico (nível "pipeline" → "etapa" → "operação"), grupos rotulados por etapa e rótulo de aresta com contagem de linhas. Se o BIWEB escolher uma lib, os exemplos oficiais funcionam como checklist de requisitos de legibilidade, mas exemplos "Pro" exigiriam assinatura ou reimplementação.

**DO NOT COPY:** Os thumbnails abstratos (não mostram UI de produto); exemplos Pro como código (proprietários); não tratar o template "AI Workflow Editor" como referência de UX — a página não traz imagem nem detalha o fluxo de geração (NÃO VERIFICADO além da stack).

---

---

### REF-79 — Dagster / Global Asset Lineage, Asset overview e Run view (Gantt)

**IMAGES:**
- dagster-global-lineage — https://dagster.io/docs/assets/images/global-asset-lineage-c9b969c55b869a10ce716808b12094d3.png — "Global Asset Lineage com árvore de grupos à esquerda e grafo de grupos colapsados à direita" — OK 200 image/png (a URL docs.dagster.io redireciona 308 para dagster.io); inspeção visual. UI Dagster+ atual (docs 2025–2026).
- dagster-asset-overview — https://dagster.io/docs/assets/images/asset-details-b147f4fbd7a776ae10c8f721f4915cd4.png — "Página de asset ANALYTICS/company_perf: Status, Recent updates, Description, Columns, Metadata" — OK 200 image/png; inspeção visual.
- dagster-run-gantt — https://dagster.io/docs/assets/images/run-details-c4808224aed98c5e9e7e2fd68a583efc.png — "Run details: Gantt de passos, lista Succeeded (14), seletor de subconjunto, logs de eventos" — OK 200 image/png; inspeção visual.


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-79_01_dagster_global_lineage`

![REF-79_01_dagster_global_lineage](https://dagster.io/docs/assets/images/global-asset-lineage-c9b969c55b869a10ce716808b12094d3.png)

`REF-79_02_dagster_asset_overview`

![REF-79_02_dagster_asset_overview](https://dagster.io/docs/assets/images/asset-details-b147f4fbd7a776ae10c8f721f4915cd4.png)

`REF-79_03_dagster_run_gantt`

![REF-79_03_dagster_run_gantt](https://dagster.io/docs/assets/images/run-details-c4808224aed98c5e9e7e2fd68a583efc.png)

**SOURCE:**
- https://dagster.io/docs/guides/operate/webserver (docs oficial; imagens vêm daqui)
- https://github.com/dagster-io/dagster (Apache-2.0, 16,2k estrelas, push em 2026-10-07)
- Versão/data: NÃO VERIFICADO número de versão; a página do asset mostra datas "4/18/2025 – 8/2/2025".

**PROBLEM:** Um grafo de ativos de dados de toda a empresa (dezenas de projetos, centenas de assets) é ilegível se mostrado nó a nó; ao mesmo tempo é preciso saber saúde, frescor e última execução de cada ativo.

**SOLUTION:** O grafo é centrado em ATIVOS (dados), não em tarefas. Em escala, mostra primeiro grupos colapsados (caixas rotuladas por grupo/camada), com árvore lateral para navegar por código/namespace, busca/filtro por seleção, e expande para o detalhe conforme zoom/clique. A página do asset consolida status, histórico, qualidade e metadados; a página da run mostra tempo (Gantt) + lista por estado + logs.

**OBSERVE:**
- Global Asset Lineage: coluna esquerda com campo "Jump to…" e árvore de pastas (basics, batch_enrichment, data-eng-pipeline, hooli_airlift…); no canvas, grupos aparecem como caixas de uma linha (RAW_DATA, CLEANED, ANALYTICS, MARKETING, BI…) conectadas por linhas finas em colunas por camada (inspeção visual).
- Barra do canvas: botão de tela cheia, "Search and filter assets", atualizar, e botão preto "Materialize all (51)…" com seta; à direita, controles de zoom vertical (slider), configurações e filtros (inspeção visual).
- Sidebar principal: Home, Timeline, Runs, Catalog, Jobs, Automation, Lineage, Insights, Deployment (inspeção visual).
- Asset overview: breadcrumb "Catalog / All assets / ANALYTICS / company_perf" com selos "Healthy" e "Unsynced (1)"; bloco Status com "Latest materialization 42 hours ago", "Check results 1", "Freshness policy Passing", "Row count 4"; faixa "Recent updates" com barrinhas verdes/vermelhas (últimas 100 atualizações) (inspeção visual).
- Painel direito do asset: Definition (Group, Code location, Kinds dbt/Snowflake, Storage, Tags), Automation details (2 sensors), Freshness policy ("Fails if more than 7 days…"), Alert policies (inspeção visual).
- Abas do asset: Overview, Events, Checks, Lineage, Automation, Insights, Change history (inspeção visual).
- Run details: cabeçalho com id, selo "Success", "Run of run_etl_pipeline @ 562f39bc", "Launched by run_assets_30min", "2 assets", duração; três botões de visão (lista/Gantt/…); slider de tempo; checkbox "Hide not started steps"; botão "Re-execute all (*)" com dropdown (conteúdo do dropdown NÃO VISÍVEL na imagem) (inspeção visual).
- Gantt: barras horizontais por passo sobre eixo de tempo (5s…55s), barras tracejadas azuis = tempo de preparação/espera, verdes = execução; lado direito agrupa por estado "Preparing (0), Executing (0), Errored (0), Succeeded (14)" com duração por linha; caixa flutuante "Type a step subset (ex: enriched_data.split_rows+)" com checkbox "Hide unselected steps" (inspeção visual).
- Doc (só doc): filtros por asset key, grupo, code location, kind, owner e tags; "asset selection syntax"; seleções salvas compartilháveis; páginas Schedules/Sensors com próximo tick e histórico; aba Backfills.

**INTERACTION:**
1. Abre Lineage; vê grupos colapsados; usa "Jump to…" ou a árvore para chegar em um grupo; expande para ver os assets.
2. Filtra com a barra "Search and filter assets" (sintaxe de seleção) e pode materializar todos ou só a seleção.
3. Clica um asset → página Overview: avalia saúde/frescor, abre Events/Lineage/Checks.
4. Abre a run: lê o Gantt; filtra logs digitando um subconjunto de passos; usa "Re-execute" (todo ou subconjunto).

**WHY IT WORKS:** O modelo de dados do grafo (ativos, grupos, camadas) já fornece uma hierarquia natural para colapsar; a saúde está no próprio ativo, não escondida em logs. A run mostra tempo e estado em um só lugar, separado do grafo lógico.

**ADAPT TO BIWEB:** O grafo de datasets gerenciados → modelo semântico → dashboards poderia usar o mesmo padrão: grupos colapsados por camada/etapa com árvore lateral e busca, e uma página de dataset com Status (última carga, qualidade, frescor). Barra "Recent updates" de sucesso/falha por execução é um jeito compacto de mostrar histórico no dataset. Gantt da run ajuda a explicar "execução visível" do pipeline Temporal.

**DO NOT COPY:** Rótulos técnicos (op, asset key, materialize); a dependência da sintaxe de seleção por texto como único meio de filtro; layout de "caixas de uma linha" sem contagens ou estado no grafo global (a imagem não mostra cor de estado nos grupos).

---

---

### REF-80 — Apache Airflow 3 / Graph, Grid, Task Groups e run com falhas

**IMAGES:**
- airflow-run-graph — https://airflow.apache.org/docs/apache-airflow/stable/_images/dag_run_graph.png — "Dag Run view: grafo com nós verdes (success), vermelho (failed) e laranja (upstream_failed); painel Task Instances à direita; minimapa" — OK 200 image/png; inspeção visual. UI Airflow 3 (docs stable 3.3.2 em 2026-10-07; screenshot de run de 2025-09-23).
- airflow-grid — https://airflow.apache.org/docs/apache-airflow/stable/_images/dag_overview_grid.png — "Grid view: colunas = runs com barras de duração; linhas = tasks; células por estado" — OK 200 image/png; inspeção visual.
- airflow-task-group — https://airflow.apache.org/docs/apache-airflow/stable/_images/task_group.gif — "GIF: nós 'section_1 (+3 tasks)' e 'section_2 (+2 tasks)' do tipo Task Group entre start e end" — OK 200 image/gif; inspeção visual do primeiro quadro (a animação completa de expandir/colapsar não foi vista; descrição do comportamento vem da doc).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-80_01_airflow_run_graph`

![REF-80_01_airflow_run_graph](https://airflow.apache.org/docs/apache-airflow/stable/_images/dag_run_graph.png)

`REF-80_02_airflow_grid`

![REF-80_02_airflow_grid](https://airflow.apache.org/docs/apache-airflow/stable/_images/dag_overview_grid.png)

`REF-80_03_airflow_task_group`

![REF-80_03_airflow_task_group](https://airflow.apache.org/docs/apache-airflow/stable/_images/task_group.gif)

**SOURCE:**
- https://airflow.apache.org/docs/apache-airflow/stable/ui.html
- https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dags.html (seção TaskGroups)
- https://github.com/apache/airflow (Apache-2.0, 47k estrelas; airflow-core/src/airflow/ui/package.json usa @xyflow/react ^12.12.0 e elkjs ^0.12.0; imagem mostra marca "React Flow" no minimapa)

**PROBLEM:** DAGs grandes são ilegíveis e ao mesmo tempo é preciso uma visão de "como foi nas últimas N execuções" para achar padrões de falha, não só da última.

**SOLUTION:** Duas visões complementares da mesma estrutura: Graph (dependências lógicas, com task groups colapsáveis) e Grid (matriz tasks × execuções, cada célula colorida por estado, barras de duração no topo). A visão de uma run combina grafo colorido + lista de task instances filtrável.

**OBSERVE:**
- Grafo: nós retangulares escuros com nome em negrito e tipo ("@task") em cinza; arestas ortogonais finas e claras (inspeção visual).
- Run com falha: cada nó traz um selo de estado abaixo do nome — verde "success", vermelho "failed" (nó `empty_1`), laranja "upstream_failed" nos nós a jusante — e a borda do nó muda para a mesma cor (inspeção visual).
- Painel direito da run: data da run + selo "Failed", metadados (Logical Date, Run Type, Start/End Date, Duration, Triggering User, Dag Version v11), abas Task Instances | Asset Events | Audit Log | Code | Details; tabela com busca "Search Tasks", filtro "All States", colunas Map Index, State, Start/End, Try Number, Pool (inspeção visual).
- Minimapa no canto inferior direito mostra o grafo em miniatura com as cores dos estados (verde/vermelho) — dá visão de onde está a falha mesmo com zoom alto; controles +/−/ajustar no canto inferior esquerdo; ícone de download do grafo (inspeção visual).
- Grid: topo com barras de duração por run (verde sucesso, vermelho falha, ícone de gatilho manual), colunas selecionáveis, linha = task, célula = estado (verde check, vermelho X, laranja upstream failed) (inspeção visual).
- Barra lateral esquerda com Home, Dags, Assets, Browse, Admin, Docs; busca global "Search Dags ⌘+K" e botão "Trigger" no topo (inspeção visual).
- Task Group (GIF, primeiro quadro): nó com título, subtítulo "Task Group" e rótulo azul "+ 3 tasks"; a "pilha" sob o nó indica conteúdo colapsado (inspeção visual).
- Doc (só doc): clicar na célula permite marcar success/failed/cleared; aba Logs da task é "o primeiro lugar para olhar"; Graph pode mostrar "All Dag Dependencies"/"External Conditions" e Asset Graph (produtores/consumidores).

**INTERACTION:**
1. Abre a DAG: alterna entre Grid e Graph pelos dois botões no canto superior esquerdo.
2. Em Grid, vê coluna a coluna quais runs falharam e em quais tasks; clica na célula.
3. Em Graph, expande/colapsa Task Groups; usa o minimapa para localizar vermelhos.
4. Na run, usa o filtro de estado/busca na lista para isolar tasks falhas, abre logs, marca como sucesso ou limpa (re-executa).
5. Dispara nova execução com "Trigger" ou backfill (só doc).

**WHY IT WORKS:** O mesmo estado aparece em três escalas (cor da célula no histórico, selo no nó, linha na tabela), com cores consistentes. Task Groups reduzem ruído sem perder o acoplamento de dependências.

**ADAPT TO BIWEB:** Para a visão de execução do pipeline: grade de histórico por etapa (linhas = etapas Import/Transform/Validate/Join; colunas = últimas cargas) e o grafo pintado com o estado da execução selecionada. O estado derivado "upstream_failed" (etapa não rodou porque a anterior falhou) é um estado que costuma faltar em UIs simples e é útil para dashboards que dependem do pipeline.

**DO NOT COPY:** Terminologia (Dag, Logical Date, Pool); a densidade de colunas/cores só funciona para equipes técnicas; os 7+ estados de task do Airflow como vocabulário para usuário de BI.

---

---

### REF-81 — Prefect / grafo de execução de flow run, assets lineage (beta) e estado "Late"

**IMAGES:**
- prefect-run-graph — https://mintcdn.com/prefect-bd373955/rm4-_dTLtkmSX6eG/v3/img/concepts/narrative-encapsulation.png — "Grafo de flow run: 3 tarefas verdes conectadas (GET orders…, crunch_the_numbers-fc4, save_data-883)" — OK 200 image/png; inspeção visual. Imagem pequena (684×367), tema escuro, UI Prefect 3 (docs v3).
- prefect-assets-lineage — https://mintcdn.com/prefect-bd373955/rm4-_dTLtkmSX6eG/v3/img/guides/assets-1.png — "Assets (Beta): painel de busca/agrupamento (File 1, S3 1) e dois cartões raw-data.csv → clean-data.csv" — OK 200 image/png; inspeção visual.
- prefect-late-run — https://mintcdn.com/prefect-bd373955/dwD6EJObIjtIzwSC/v3/img/ui/flow-run-cancellation-ui.png — "Flow Run 'super-hippo' com selo Late, 'Scheduled for … (2h 8m late)', botão Cancel, abas Logs/Details/Parameters" — OK 200 image/png; inspeção visual. Captura de 2023 (data visível "2023/09/07").


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-81_01_prefect_run_graph`

![REF-81_01_prefect_run_graph](https://mintcdn.com/prefect-bd373955/rm4-_dTLtkmSX6eG/v3/img/concepts/narrative-encapsulation.png)

`REF-81_02_prefect_assets_lineage`

![REF-81_02_prefect_assets_lineage](https://mintcdn.com/prefect-bd373955/rm4-_dTLtkmSX6eG/v3/img/guides/assets-1.png)

`REF-81_03_prefect_late_run`

![REF-81_03_prefect_late_run](https://mintcdn.com/prefect-bd373955/dwD6EJObIjtIzwSC/v3/img/ui/flow-run-cancellation-ui.png)

**SOURCE:**
- https://docs.prefect.io/v3/concepts/tasks.md , https://docs.prefect.io/v3/how-to-guides/workflows/assets.md , https://docs.prefect.io/v3/advanced/cancel-workflows.md (docs oficiais)
- https://github.com/PrefectHQ/prefect (Apache-2.0, 24k estrelas, push em 2026-10-07)
- Changelog secundário (pyup/safetycli, não oficial) menciona flow run graph reescrito com 3 layouts novos (2 de dependência, 1 de comparação de duração) — versão exata NÃO VERIFICADO.

**PROBLEM:** Mostrar execuções de workflows em Python onde as tarefas são descobertas em tempo de execução (grafo dinâmico), sem exigir que o usuário desenhe o DAG.

**SOLUTION:** O grafo da run é construído a partir da execução: cada tarefa executada aparece como nó, a seta mostra a dependência de dados, a cor mostra o estado. Para ativos de dados há um grafo separado de lineage por URI, agrupado por tipo (File, S3) com painel de busca, e estados de agendamento ("Late") exibidos no cabeçalho da run.

**OBSERVE:**
- Nós do run graph são barras horizontais arredondadas preenchidas de verde (sucesso), com rótulo dentro ou ao lado; seta curva fina liga saída → próxima; o primeiro nó tem contorno azul (selecionado) (inspeção visual).
- Controles do canto inferior direito: "centralizar", "tela cheia" e engrenagem de configurações do grafo (inspeção visual).
- Assets: painel flutuante com cadeado, "+", busca e lista agrupada por tipo com contadores (File 1, S3 1); cada asset é um cartão com ícone do tipo, nome em negrito, URI em monoespaçada, e rodapé com ícone de status (✓ verde) + "26s ago" para materialização e outro ícone para "referenciado" (inspeção visual).
- Aresta de asset termina em porta quadrada cinza → seta → próximo cartão (inspeção visual).
- Cabeçalho da run: "Flow Runs / super-hippo" + tag "auto-scheduled", selo laranja "Late", texto "Scheduled for 2023/09/07 01:50 PM (2h 8m late)", links para Flow, Deployment, Work Pool, Work Queue (com ícone de alerta vermelho), botão "Cancel" vermelho + menu "⋮", abas Logs | Details | Parameters, filtros "Level: all" e "Oldest to newest"; corpo mostra "This run is scheduled and hasn't generated logs" (inspeção visual).
- Doc (só doc): retry manual re-executa o flow run inteiro com o mesmo ID e `run_count` incrementado; para runs de deployment volta ao estado Scheduled; seleção de tarefas individuais não está descrita (NÃO VERIFICADO).

**INTERACTION:**
1. Executa o flow; abre a UI e vê o grafo da run formado dinamicamente.
2. Seleciona nó → vê logs/detalhes da task run.
3. Em runs agendadas atrasadas, vê o estado Late com tempo de atraso; pode cancelar.
4. No grafo de assets, busca/agrupa por tipo e abre o histórico de materialização.

**WHY IT WORKS:** O estado "Late" separa "ainda não rodou por falha de capacidade" de "falhou"; rótulos de tempo relativo ("26s ago") dão confiança de frescor sem abrir logs. Dois grafos diferentes (execução vs. dados) evitam misturar perguntas distintas.

**ADAPT TO BIWEB:** O BIWEB pode separar claramente "grafo de execução do pipeline" (o que rodou, quando, estado) do "grafo de linhagem de datasets" (de onde vem cada dado). O estado "atrasado/Late" é útil para agendamentos de importação ("Carregue vendas todos os dias"). A linha de frescor com tempo relativo por ativo também serve ao dashboard.

**DO NOT COPY:** Nomes aleatórios de runs ("super-hippo"); o grafo minimalista sem contagem de dados nas arestas; o rótulo "Beta" e a estética ainda imatura do painel de assets; atenção: duas das três imagens são pequenas/de 2023, não representam o grafo completo atual.

---

---

### REF-82 — Temporal Web UI / lista de workflows e histórico com Timeline

**IMAGES:**
- temporal-workflow-detail — https://images.ctfassets.net/0uuz8ydxyd9p/6SI3KL8ctPLvTvHzFjKUDX/5ac9e8303f076637a663afe690381ac6/workflow-details-page-how-it-works.png — "Detalhe do workflow 'Customer Order': abas History/Workers/Pending Activities/Stack Trace/Queries, Timeline e Event History" — OK 200 image/png; inspeção visual. Render de marketing com dados de exemplo (datas fictícias "2063"), UI 2025–2026 (versão de UI no rodapé "1.2.3" aparece na imagem; não confundir com a versão do pacote).
- temporal-workflow-list — https://images.ctfassets.net/0uuz8ydxyd9p/2GhMSMGhTMcyDUJrySy0Lg/e78cb7702a758b689a4e189e3b9856fc/recent-workflows.png — "Recent Workflows: busca por query, filtro de tempo, tabela com status, ID, tipo, início/fim" — OK 200 image/png; inspeção visual. Datas fictícias (2022); UI mais antiga que a anterior.


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-82_01_temporal_workflow_detail`

![REF-82_01_temporal_workflow_detail](https://images.ctfassets.net/0uuz8ydxyd9p/6SI3KL8ctPLvTvHzFjKUDX/5ac9e8303f076637a663afe690381ac6/workflow-details-page-how-it-works.png)

`REF-82_02_temporal_workflow_list`

![REF-82_02_temporal_workflow_list](https://images.ctfassets.net/0uuz8ydxyd9p/2GhMSMGhTMcyDUJrySy0Lg/e78cb7702a758b689a4e189e3b9856fc/recent-workflows.png)

**SOURCE:**
- https://docs.temporal.io/web-ui (docs oficial)
- https://temporal.io/product (marketing oficial; origem das imagens)
- https://github.com/temporalio/ui (MIT, UI em Svelte, package.json v2.55.0) e https://github.com/temporalio/temporal (MIT, 23,5k estrelas)

**PROBLEM:** Workflows duráveis não têm um "desenho" fixo: o que importa é a história de eventos (activities, timers, signals), estados parciais, retries e relação pai/filho. Precisa ser inspecionável sem ler JSON bruto.

**SOLUTION:** A UI é centrada na execução: lista filtrável (status, tipo, ID, atributos de busca), e a página do workflow organiza o mesmo evento em níveis — Summary, Relationships (árvore pai/filho), Input and Results, Timeline (Gantt de activities) e Event History em modos Compact/History/JSON. Há ações operacionais (cancelar, reset, terminate, "Start Workflow Like This One").

**OBSERVE:**
- Cabeçalho: nome "Customer Order" com botão copiar, selo azul "Running", "Next version: 3.12 / Last used version: 3.11", WorkflowID/RunId/TaskQueue copiáveis, toggle "Auto refresh", botão primário "Request Cancelation" com dropdown (inspeção visual).
- Abas com contadores em chip: History 25, Workers 1, Pending Activities 0, Stack Trace 0, Queries 0 (inspeção visual).
- Seções colapsáveis em cartões: Summary, Relationships, Input and Results; Timeline expandida (inspeção visual).
- Timeline: eixo de tempo com Start/15/16/17/18/End; barras pílula por activity — verde "5 Check Fraud", roxo "11 Prepare Shipment", "17 Charge Consumer", "21 Send Goods" — o número é o id do evento; controles +/−/Fit (inspeção visual).
- Event History: tabela escura (Date & Time, Event Type com filtro) com resultado em chip monoespaçado ("fraud check passed") e botão copiar; alternância "History | Compact | JSON | Download" e "Expand all" (inspeção visual).
- Lista: status como chips coloridos (Running azul, Completed verde, Cont. as New roxo, Cancelled/Timed Out laranja, Terminated cinza), campo "Enter a query" + "Search", seletor "Last 24 hours" e fuso UTC, paginação "1-100 of 12,000" (inspeção visual).
- Doc (só doc): "Saved Views" (até 20 por usuário, compartilháveis via URL), visão pré-definida "Task Failures" (5+ falhas consecutivas), aba Relationships com árvore de child workflows, página Schedules com frequência e próximas runs.

**INTERACTION:**
1. Na lista, escreve uma query ou usa filtros; salva como "Saved View".
2. Abre um workflow; lê Summary e o Timeline para ver onde o tempo foi gasto.
3. Expande Event History (Compact) e filtra por tipo de evento para achar a falha.
4. Verifica Pending Activities (retry em andamento) e Stack Trace (se em execução).
5. Se necessário: Request Cancelation, reset ou "Start Workflow Like This One".

**WHY IT WORKS:** O Timeline traduz um log de eventos em algo que se lê de relance; os contadores nas abas mostram onde há conteúdo (ex.: Pending Activities > 0 = algo em retry) sem abrir cada aba; "Compact" resolve o excesso de eventos.

**ADAPT TO BIWEB:** O BIWEB já usa Temporal no pipeline de ingestão; esta é a referência de como expor a execução durável para o usuário final em versão simplificada: a linha do tempo de etapas (Import → Validate → …) com resultado resumido por etapa e modo "detalhes técnicos" opcional. As abas com contadores e o chip de status único por execução são diretamente aplicáveis. Saved Views sugerem filtros salvos para a lista de execuções.

**DO NOT COPY:** Vocabulário (Workflow ID, Run ID, Task Queue, Signal/Query); a tabela de eventos como visão principal (é para engenheiro); os dados de exemplo e as datas fictícias. As imagens são renders de marketing, não capturas de produção — não usar como evidência de pixel exato.

---

---

### REF-83 — Apache NiFi / canvas de fluxo de dados com process groups, filas e estatísticas em cada nó

**IMAGES:**
- nifi-process-group — https://nifi.apache.org/docs/nifi-docs/html/images/process-group-anatomy.png — "Anatomia de um Process Group: nome, contagens de componentes, estatísticas de 5 min (Queued/In/Read-Write/Out), contadores de estado de versão, indicador de boletim" — OK 200 image/png; inspeção visual. UI ANTIGA (NiFi 1.x, a doc ainda usa estas capturas; o NiFi 2.x trocou a UI).
- nifi-processor — https://nifi.apache.org/docs/nifi-docs/html/images/processor-anatomy.png — "Anatomia de um Processor: indicador de status, nome, tipo, tarefas ativas, estatísticas In/Read-Write/Out/Tasks-Time (5 min)" — OK 200 image/png; inspeção visual. UI antiga.
- nifi-navigation — https://nifi.apache.org/docs/nifi-docs/html/images/nifi-navigation.png — "Navigate palette com Bird's Eye View, Operate palette e breadcrumbs 'NiFi Flow » Process Group A » Inner Group » Another Process Group'" — OK 200 image/png; inspeção visual. UI antiga.


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-83_01_nifi_process_group`

![REF-83_01_nifi_process_group](https://nifi.apache.org/docs/nifi-docs/html/images/process-group-anatomy.png)

`REF-83_02_nifi_processor`

![REF-83_02_nifi_processor](https://nifi.apache.org/docs/nifi-docs/html/images/processor-anatomy.png)

`REF-83_03_nifi_navigation`

![REF-83_03_nifi_navigation](https://nifi.apache.org/docs/nifi-docs/html/images/nifi-navigation.png)

**SOURCE:**
- https://nifi.apache.org/docs/nifi-docs/html/user-guide.html (docs oficial; capturas da UI 1.x — data exata NÃO VERIFICADO)
- https://github.com/apache/nifi (Apache-2.0, 6,25k estrelas, push em 2026-10-07)

**PROBLEM:** Fluxos de dados de produção com centenas de componentes precisam ser operados, não só desenhados: o operador precisa ver volumes, filas, gargalos e contrapressão no próprio diagrama.

**SOLUTION:** O próprio elemento do canvas é um painel de estatísticas: processors e process groups mostram, em janela de 5 minutos, bytes/objetos lidos, escritos e enfileirados. Aninhamento ilimitado de Process Groups com breadcrumbs; barra de navegação com minimapa ("Bird's Eye View"); conexões são filas com contador e indicadores de contrapressão.

**OBSERVE:**
- Process Group (cartão): título "Process Group ABC"; linha de contagens com ícones (transmitindo, não transmitindo, rodando, parado, inválido, desabilitado); tabela Queued 26 (12.7 MB) / In 8 (800 KB) → 2 / Read/Write 14.72 MB / 14.8 MB / Out 3 → 16 (78.57 KB), cada linha com "5 min" à direita; rodapé com contadores de versão (sincronizado, desatualizado, modificado…); indicador de boletim vermelho no canto; contador de tarefas ativas (inspeção visual).
- Processor (cartão): ícone de status (▶ verde = rodando), nome ("Copy to /review"), tipo ("PutFile 1.2.0"), contador de tarefas ativas; linhas In/Read-Write/Out/Tasks-Time com valores em vermelho-escuro e janela de 5 min; indicador de boletim (erro/aviso) (inspeção visual).
- Barra de ferramentas superior com ícones de componentes (processor, input port, output port, process group, remote group, funnel, template, label) e linha de status global (threads, queued, contadores) (inspeção visual).
- Painel "Navigate" com zoom +/−, ajustar, tamanho real e miniatura retangular ("Bird's Eye View"); painel "Operate" abaixo mostrando o componente selecionado e botões (configurar, iniciar, parar, copiar, excluir) (inspeção visual).
- Breadcrumbs no rodapé: "NiFi Flow » Process Group A » Inner Group » Another Process Group" — navegação entre níveis (inspeção visual).
- Contrapressão: tooltip de conexão "Name success / Queued 44 (206 bytes)" com duas barras (objetos e tamanho de dados) que mudam de cor conforme o limite (imagem back_pressure_indicators vista; não incluída na lista) (inspeção visual).
- Doc (só doc): "Find parents", busca, "Data Provenance" (linhagem de cada FlowFile), versionamento de flows via Registry, controle por contexto de parâmetros.

**INTERACTION:**
1. Arrasta componentes da barra para o canvas; conecta com setas; cada conexão cria uma fila.
2. Seleciona um grupo e usa "Enter group" (duplo clique) para descer um nível; breadcrumb para voltar.
3. Observa filas e barras de contrapressão para achar gargalo; para/inicia componentes pelo painel Operate.
4. Usa o Bird's Eye View para navegar por canvas grande.
5. Consulta Data Provenance para o caminho de um item específico.

**WHY IT WORKS:** Resolve "canvas ilegível" por aninhamento (Process Groups) + resumo agregado no cartão do grupo, de forma que o nível de cima ainda diz se algo está errado lá dentro (contagem de inválidos, boletim, fila). Estatísticas "no diagrama" evitam trocar de tela para saber o que está acontecendo.

**ADAPT TO BIWEB:** O cartão do grupo/etapa é um modelo para colapsar "Limpeza e validação" mostrando, ainda colapsado: linhas de entrada → saída, linhas rejeitadas, última execução e falhas — "agregados por grupo" em vez de esconder tudo. Breadcrumbs para navegar entre pipeline → grupo → etapa e minimapa para canvas grande. Contrapressão/fila é provavelmente irrelevante para o MVP, mas a ideia de "contagem na conexão" é direta.

**DO NOT COPY:** A estética 1.x (skeuomorfismo, ícones minúsculos), o vocabulário (FlowFile, Funnel, Provenance), a densidade numérica em cada nó (adequada a operadores de infra, não a analistas de BI), e a configuração por árvore de menus.

---

---

### REF-84 — Kestra / editor com abas Flow Code · No-code · Topology, Gantt de execução e dependências

**IMAGES:**
- kestra-topology — https://kestra.io/_astro/topology-editor.B3OdRoEi.png — "Editor de flow: YAML à esquerda e Topology à direita (grupo Triggers → task Python → log)" — OK 200 image/png; inspeção visual. UI Kestra 2.x (rodapé do menu mostra "v.2.0"; datas do conteúdo 2026).
- kestra-gantt — https://kestra.io/_astro/execution-gantt-view.WoBN6eV4.png — "Execução com aba Gantt: consume_events, transform, load com 'Attempt 1/1 · Success' e logs" — OK 200 image/png; inspeção visual.
- kestra-dependencies — https://kestra.io/_astro/executions-dependencies-1-0.QWtLXHgX.png — "Aba Dependencies: dois flows (pipeline_with_subflow → http_metrics_demo) como nós verdes ligados por aresta, lista à direita com Success" — OK 200 image/png; inspeção visual.


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-84_01_kestra_topology`

![REF-84_01_kestra_topology](https://kestra.io/_astro/topology-editor.B3OdRoEi.png)

`REF-84_02_kestra_gantt`

![REF-84_02_kestra_gantt](https://kestra.io/_astro/execution-gantt-view.WoBN6eV4.png)

`REF-84_03_kestra_dependencies`

![REF-84_03_kestra_dependencies](https://kestra.io/_astro/executions-dependencies-1-0.QWtLXHgX.png)

**SOURCE:**
- https://kestra.io/docs/ui/flows , https://kestra.io/docs/ui/executions (docs oficiais)
- https://github.com/kestra-io/kestra (Apache-2.0, 29,4k estrelas, push em 2026-10-07; ui/package.json usa @vue-flow/core ^1.48.2 e dagre ^0.8.5)

**PROBLEM:** Workflows declarativos (YAML) precisam de uma forma visual de entender a estrutura e a execução sem perder a fidelidade do código; usuários não técnicos precisam de edição guiada.

**SOLUTION:** Três visões do MESMO fluxo, sincronizadas: código YAML, "No-code" (blocos com formulário/Source) e "Topology" (DAG). Para execuções: abas Overview/Gantt/Logs/Input-Output/Metrics/Dependencies/Audit Logs; subflows aparecem como dependências entre flows.

**OBSERVE:**
- Barra de abas do editor: Flow Code · No-code · Topology · Docs · Files · Blueprints · Context; no topo direito, selo "Valid" (verde) e contadores "3 Revision(s)", "1 Dependencies", "1 Error(s)" (inspeção visual).
- Topology: grupo "Triggers" (retângulo verde-escuro com rótulo) contendo o nó "schedule"; setas pontilhadas levam a nós com ícone da tarefa e badge "CORE Process" no `check_if_business...` e depois a `log`; pontos brancos nas conexões marcam entrada/saída; bolinha verde no canto do grupo; controles +/−/ajustar/travar/baixar no canto inferior esquerdo (inspeção visual).
- Gantt: cabeçalho "Total duration 0.40s / Tasks 3 Succeeded" com selo Success; cada task é uma linha com ícone, nome, barra proporcional (verde sobre trilho cinza) e duração (0.21s); expandida mostra "Attempt 1/1" (seletor de tentativa), selo "Success 0.02s" e log INFO com timestamp (inspeção visual).
- Filtros no topo da execução: "Add filters", busca, chip "Log Level at or above INFO", "Clear all", "Refresh data", "Saved filters" (inspeção visual).
- Tela de falha com IA (imagem fix-with-ai-logs): task `fetch_flows` com selo "Failed", botão "Restart", menu com "Fix with AI", Metrics, Outputs, Replay, Change state, Show task source, Download logs, Worker Information; botões "Collapse all" e "Temporal view" nos logs (inspeção visual; usada na ficha G1).
- Dependencies: grafo force-like com dois nós circulares verdes e aresta curva; painel direito com busca "Search by flow or namespace…", seletor de namespace e lista com selo de estado por flow (inspeção visual).
- Doc (só doc): No-code usa blocos Triggers/Tasks/Errors/Finally/After Execution; abrir um bloco mostra formulário (Form/Source) com "Upstream Outputs" e "Execution Context" de referência; Topology permite exportar PNG.

**INTERACTION:**
1. Abre o flow em Flow Code; edita YAML (autocomplete) e vê Topology atualizar.
2. Alterna para No-code para adicionar tarefa por "+ Add task" ou "/", preenchendo formulário; erros de validação aparecem no topo ("1 Error(s)").
3. Salva (nova revisão); executa; vai à Execução → Gantt para ver tempo e estado por task.
4. Em falha, abre Logs, escolhe tentativa (Attempt), usa Restart/Replay.
5. Em Dependencies vê quais flows chamam/são chamados.

**WHY IT WORKS:** Não força escolher "visual vs. código": cada público usa a visão preferida e há uma fonte da verdade. Estado de validação sempre visível (selo Valid/Error) evita surpresa ao salvar.

**ADAPT TO BIWEB:** O pipeline de transformação poderia manter "visão em lista de operações do catálogo", "visão em grafo" e "visão de detalhe" sincronizadas, com selo de validação sempre visível. Para execução, Gantt por etapa com tentativas (retry) numeradas reforça "execução visível". A visão Dependencies sugere um mapa dataset→dataset/dashboard.

**DO NOT COPY:** YAML como superfície primária para usuário de BI; a sensação de "página de infraestrutura"; o grafo de dependências com pouca informação (só nós e arestas, sem contagem de dados).

---

---


---

## 14 — AI-Assisted Workflow Creation

**Pergunta da área:** como linguagem natural pode gerar ou alterar workflows com preview e confirmação antes de executar?
**Aprendizados-chave:** Kestra Copilot é o análogo mais próximo de Sugerir → Pré-visualizar → Confirmar → Executar (selo "Valid"; Edit/Ask/Plan), porém mistura "Approve & execute". **Lacuna:** nenhum produto pesquisado mostra "ghost nodes" ou diff visual de grafo.

### REF-85 — Kestra AI Copilot / modos Edit · Ask · Plan, "Proposed flow" com selo Valid e "Approve & execute"

**IMAGES:**
- kestra-copilot-plan — https://kestra.io/_astro/plan-mode.Bx2ZoLaO.png — "Modo Plan: plano numerado em 4 passos com 'Pending approval', botões 'Reply to revise' e 'Approve & execute'" — OK 200 image/png; inspeção visual. UI Kestra v2.0 (2026).
- kestra-copilot-edit — https://kestra.io/_astro/edit-step-1-build.BCAyOcJr.png — "Modo Edit: chat gera 'Proposed flow' (Valid) enquanto o YAML aparece no editor" — OK 200 image/png; inspeção visual.
- kestra-fix-with-ai — https://kestra.io/_astro/fix-with-ai-logs.DRGBU7uZ.png — "Menu da task falha com 'Fix with AI' destacado" — OK 200 image/png; inspeção visual.


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-85_01_kestra_copilot_plan`

![REF-85_01_kestra_copilot_plan](https://kestra.io/_astro/plan-mode.Bx2ZoLaO.png)

`REF-85_02_kestra_copilot_edit`

![REF-85_02_kestra_copilot_edit](https://kestra.io/_astro/edit-step-1-build.BCAyOcJr.png)

`REF-85_03_kestra_fix_with_ai`

![REF-85_03_kestra_fix_with_ai](https://kestra.io/_astro/fix-with-ai-logs.DRGBU7uZ.png)

**SOURCE:**
- https://kestra.io/docs/ai-tools/ai-copilot (docs oficial, consultado 2026-10)
- https://github.com/kestra-io/kestra (Apache-2.0; OSS limitado a Gemini, mais provedores no Enterprise — doc)

**PROBLEM:** Gerar um workflow a partir de linguagem natural só é aceitável se o usuário puder revisar a estrutura antes de aplicar, e se o sistema não "inventar" plugins ou configurações inválidas. Também é preciso corrigir execuções que falharam.

**SOLUTION:** Copilot com três modos explícitos: Edit (constrói/edita o flow), Ask (responde dúvidas e diagnostica falhas com logs) e Plan (propõe um plano multi-etapas que exige aprovação antes de executar). O YAML proposto só aparece marcado "Valid" (validado pelo sistema); o usuário escolhe "Apply" ou "Open in editor". O contexto (flows, execuções, namespaces, plugins) é anexado automaticamente; falhas oferecem "Fix with AI" direto no menu da task.

**OBSERVE:**
- Painel de chat à direita do editor, com abas "AI · News · Docs · Help · Create an issue" e botões "New chat +" e "Recents"; rodapé com seletor de modo ("Edit" com ícone de ferramenta; no outro, "Plan"), modelo ("GEMINI"), microfone e enviar (inspeção visual).
- O chat mostra chamadas de ferramenta como linhas colapsáveis ("Running search-plugins" → "search-plugins completed → Details", "Running author-flow") — passos intermediários visíveis (inspeção visual).
- Cartão "Proposed flow" com selo verde "Valid", bloco de YAML rolável e ícone de copiar; ao final, botões "Open in editor" e "Apply" (inspeção visual).
- Modo Plan: mensagem do usuário ("Build an ELT pipeline: extract from Salesforce, transform with dbt on DuckDB, load into Snowflake, and send a Slack summary…") → cartão com 4 passos numerados (pesquisar plugins, desenhar estrutura, usar `author-flow`, apresentar YAML) → cartão "Proposed plan · Pending approval" com "Reply to revise" e "Approve & execute" (destacados em roxo tracejado na doc) (inspeção visual).
- No segundo passo de Edit (edit-step-2-errors, vista mas não listada): o usuário pede tratamento de falha e o Copilot propõe um bloco `errors:` com Slack webhook no YAML, mostrando o delta dentro do cartão Proposed flow; "Apply" e "Open in editor" permanecem (inspeção visual).
- Editor ao lado mostra o código atual (22 linhas: download S3 → load Postgres) e o selo "Valid" no canto; a topologia/No-code continuam disponíveis nas abas (inspeção visual).
- Doc (só doc): diffs, confirmação para ações que alteram recursos, histórico de revisões, integração com Git, anexos de contexto (flows, execuções, namespaces, dashboards, apps, test suites, blueprints, plugins).

**INTERACTION:**
1. Usuário abre o painel AI e escolhe modo: Edit/Ask/Plan.
2. Descreve (texto ou voz): "Create a flow that downloads a CSV from S3 and loads it into Postgres".
3. O Copilot busca plugins, gera o YAML e o valida → "Proposed flow (Valid)".
4. Usuário lê; "Open in editor" para revisar/editar ou "Apply" para aplicar ao flow aberto.
5. Para tarefas grandes: modo Plan → lê o plano numerado → "Reply to revise" ou "Approve & execute".
6. Após uma falha, abre a task → "Fix with AI" com a execução anexada como contexto.

**WHY IT WORKS:** A separação de modos torna explícito o nível de autonomia (perguntar × construir × planejar com aprovação). Validar antes de mostrar ("Valid") evita que erro de sintaxe/esquema chegue ao usuário. As chamadas de ferramenta visíveis (pesquisa de plugins) tornam a geração auditável.

**ADAPT TO BIWEB:** Casa quase 1:1 com Sugerir → Pré-visualizar → Confirmar → Aplicar: o "Proposed flow" validado + "Apply/Open in editor" é o ChangeSet com preview; o modo Plan com "Approve & execute" é o ponto de confirmação antes de rodar um pipeline com várias etapas. No BIWEB, o "YAML" seria substituído por uma pré-visualização do grafo de operações do catálogo (e amostra de dados). "Fix with AI" a partir da etapa que falhou é um bom gancho de IA contextual.

**DO NOT COPY:** O artefato de revisão em YAML (não serve para analista de BI); o seletor de provedores/modelos exposto ao usuário; o "Approve & execute" que combina aprovar e executar num único clique sem mostrar o diff do grafo (no BIWEB separar "aplicar ao rascunho" de "executar").

---

---

### REF-86 — n8n AI Workflow Builder / "Build with AI", créditos e "Execute and refine"

**IMAGES:**
- n8n-ai-builder — https://n8niostorageaccount.blob.core.windows.net/n8nio-strapi-blobs-prod/assets/AIWB_still_3356dc1b38.png — "Painel 'n8n AI Beta': campo 'What would you like to automate?', contador '49/50 monthly credits left', chips de exemplos; canvas com '+ Add first step' e 'Build with AI'" — OK 200 image/png; inspeção visual. Still de marketing de n8n.io/ai (2026), com perspectiva distorcida; só a abertura do fluxo, sem o grafo gerado.


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-86_01_n8n_ai_builder`

![REF-86_01_n8n_ai_builder](https://n8niostorageaccount.blob.core.windows.net/n8nio-strapi-blobs-prod/assets/AIWB_still_3356dc1b38.png)

**SOURCE:**
- https://docs.n8n.io/build/ways-of-building-workflows/ai-workflow-builder (docs oficial, consultado 2026-10)
- https://n8n.io/ai/ (marketing oficial)
- https://github.com/n8n-io/n8n (licença "Sustainable Use License" + arquivos .ee proprietários; GitHub API devolve NOASSERTION)

**PROBLEM:** Montar manualmente um workflow de 8–15 nós, com credenciais e parâmetros, é lento; ao mesmo tempo, gerar "de uma vez" sem revisão produz fluxos que parecem prontos mas não funcionam.

**SOLUTION:** Linguagem natural cria e modifica o workflow no editor; o sistema reporta fases em tempo real, o usuário revisa credenciais e parâmetros pendentes e refina por prompts; "Execute and refine" testa e continua iterando. O envio ao LLM inclui prompts, definições de nós e dados mock, mas NÃO credenciais nem execuções passadas.

**OBSERVE:**
- Ponto de entrada duplo no canvas vazio: botão tracejado "+ Add first step…" ao lado de "Build with AI" (varinha mágica), separados por "or" — a geração é alternativa ao método manual, no mesmo lugar (inspeção visual).
- Painel "n8n AI Beta" à direita, com ícone de brilho roxo (sparkle) também na barra lateral do canvas (abaixo de +, busca, nota e painel) (inspeção visual).
- Campo grande "What would you like to automate?" com botão de enviar; abaixo, "49/50 monthly credits left" com ícone de info e link "Get more" — o custo da interação é visível antes de enviar (inspeção visual).
- Chips de exemplos clicáveis ("Invoice processing pipeline", "RAG knowledge assistant", "Daily AI news digest", "Lead qualification and call scheduling", "Daily weather report", "YouTube video chapters", "Multi-agent research workflow", "Summarize…") (inspeção visual).
- Abas do editor visíveis: Editor · Executions · Evaluations; botão "Publish" (inspeção visual).
- Doc (só doc): três etapas — descrever, acompanhar "feedback em tempo real em várias fases", revisar "credenciais e outros parâmetros" e refinar por chat; comando `/clear` limpa o contexto do LLM; cada mensagem de criar/modificar e cada clique em "Execute and refine" consome 1 crédito; mensagens com falha ou interrompidas não contam. Nome das fases, forma de exibição dos nós gerados e eventual undo NÃO VERIFICADO (a doc não detalha).

**INTERACTION:**
1. Em workflow vazio, clica "Build with AI" ou usa o ícone de IA.
2. Escolhe um exemplo ou descreve em linguagem natural.
3. Acompanha as fases de geração; os nós aparecem no canvas (detalhe visual NÃO VERIFICADO).
4. Revisa credenciais e parâmetros que faltam; refina com novos prompts.
5. Clica "Execute and refine" para testar e iterar.
6. Publica quando satisfeito.

**WHY IT WORKS:** Mantém o resultado no mesmo canvas editável (não um artefato separado); chips de exemplo reduzem o "problema da página em branco"; créditos visíveis dão previsibilidade; a etapa de revisão de credenciais/parâmetros reconhece que "gerar" ≠ "pronto para executar".

**ADAPT TO BIWEB:** Para o Flow J ("Separe nome e sobrenome e remova duplicados"), os chips de exemplo podem ser sugestões contextuais do dataset aberto. A etapa "revisar credenciais e parâmetros" equivale a revisar mapeamentos de colunas e fonte. O contador de custo/uso só faz sentido se o BIWEB tiver modelo de cobrança por IA (provavelmente opcional).

**DO NOT COPY:** O modelo de créditos como parte da UI central; o fato de a doc não mostrar um diff/preview antes de aplicar (n8n gera diretamente no canvas — o BIWEB exige Pré-visualizar → Confirmar); o still de marketing distorcido como referência de layout.

---

---

### REF-87 — Power Automate Copilot / "Describe it to design it" → estrutura sugerida → "Keep it and continue" → designer com Copilot

**IMAGES:**
- pa-describe — https://learn.microsoft.com/en-us/power-automate/media/create-cloud-flow-using-copilot/describe-in-detail.png — "Tela 'Describe it to design it' (Step 1 of 2: What will your flow do?) com prompt e exemplos" — OK 200 image/png; inspeção visual. Doc atualizada em 2026-09-18 (ms.date); screenshot pode ser anterior.
- pa-designer — https://learn.microsoft.com/en-us/power-automate/media/create-cloud-flow-using-copilot/designer-with-copilot.png — "Designer de cloud flows com painel Copilot: dois cartões (trigger com 'Invalid parameters' e ação) e checklist 'Connected to…'" — OK 200 image/png; inspeção visual.


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-87_01_pa_describe`

![REF-87_01_pa_describe](https://learn.microsoft.com/en-us/power-automate/media/create-cloud-flow-using-copilot/describe-in-detail.png)

`REF-87_02_pa_designer`

![REF-87_02_pa_designer](https://learn.microsoft.com/en-us/power-automate/media/create-cloud-flow-using-copilot/designer-with-copilot.png)

**SOURCE:**
- https://learn.microsoft.com/en-us/power-automate/get-started-with-copilot (alias create-cloud-flow-using-copilot; doc oficial, ms.date 2026-09-18, ciclo de 180 dias)
- https://learn.microsoft.com/en-us/power-automate/copilot-cloud-flows-tips (doc oficial)

**PROBLEM:** Usuários de negócio sabem o que querem ("quando X acontecer, faça Y") mas não conhecem triggers/ações/conectores; o risco é gerar algo que o usuário não entende ou não consegue corrigir.

**SOLUTION:** Experiência em dois estágios: (1) tela de intenção "Describe it to design it" (Step 1 of 2) gera apenas a ESTRUTURA — um trigger e uma ou mais ações — para o usuário aceitar ("Keep it and continue") ou pedir mudanças em "Add more details…" (a estrutura é regerada); (2) verificação de conexões (check verde / exclamação vermelha) e só então "Create flow", que abre o designer com o painel Copilot para completar parâmetros e editar por conversa.

**OBSERVE:**
- Tela de entrada com título "Describe it to design it", "Step 1 of 2", cabeçalho "What will your flow do?", texto de apoio com link "How it works", campo de prompt com botão enviar (destacado em vermelho na doc) e lista "Or try one of these examples to get started" com três exemplos + "View more examples" (inspeção visual).
- Designer (novo): barra superior com Back, nome do flow (= o prompt: "When a new item is created in SharePoint, send me a mobile notification"), Undo/Redo, Save, Test (desabilitado), botão Copilot e toggle "New designer" (inspeção visual).
- Canvas vertical simples: cartão "When an item is created" com aviso "Invalid parameters" (triângulo vermelho) e borda esquerda preta; cartão "Send me a mobile notification" com borda esquerda vermelha; "+" entre os cartões; controles de zoom e minimapa à esquerda (inspeção visual).
- Painel Copilot à direita: mensagem do usuário em balão, linhas "✓ Connected to SharePoint" e "✓ Connected to Notifications", cartão "To get this flow ready, finish setting up this action:" com a ação pendente e ícone de alerta, paginação "1 of 3" com botão "Next" para percorrer as pendências, aviso "AI-generated content may be incorrect", campo "Ask a question or describe how you want to change this flow" com limite 0/2000 (inspeção visual).
- Doc (só doc): Copilot também edita fluxos existentes, responde "What does my flow do?", sugere descrição e tem "Troubleshoot in Copilot" para erros de teste/histórico; só disponível no designer novo, não no clássico; Home → "Create with Copilot".

**INTERACTION:**
1. Home → "Create with Copilot" (ou "Describe it to design it").
2. Escreve a intenção ("When X happens, do Y") e envia.
3. Vê a estrutura sugerida (trigger + ações); "Keep it and continue" ou acrescenta detalhes e regenera.
4. Verifica conexões (verde/vermelho) e corrige as pendentes.
5. "Create flow" → designer com Copilot; completa parâmetros pendentes via checklist "1 of 3"; edita por chat.
6. Save → Test.

**WHY IT WORKS:** O usuário aprova a ESTRUTURA antes de configurar detalhes (checkpoint barato). As pendências ficam em checklist no painel e como avisos nos próprios cartões (erro localizado), em vez de uma mensagem genérica de falha.

**ADAPT TO BIWEB:** O desenho em duas etapas — "estrutura sugerida" antes de "configurar detalhes" — é um bom padrão para "Carregue vendas todos os dias, normalize clientes e atualize meu dashboard": primeiro um esboço Source → Import → Transform → Dashboard, depois a configuração de cada etapa com um checklist de pendências ("falta mapear coluna", "falta conexão") com navegação "1 de 3". Indicar o erro no próprio nó do grafo (borda/aviso) é compatível com o canvas do BIWEB.

**DO NOT COPY:** Canvas estritamente linear (não suporta a complexidade do DAG de transformação); estética do designer; o limite de caracteres e a dependência de "connectors" do ecossistema Microsoft.

---

---

### REF-88 — Zapier Copilot / Auto-build vs. "Ask as you build", checkpoints e Revert

**IMAGES:**
- zapier-copilot-prompt — https://cdn.zappy.app/78f70c6473539151c79fdd690c37f1b3.png — "Caixa de prompt do Copilot sobre o esboço de Zap vazio (Trigger/Action), modo Auto-build, botão 'Start Building'" — OK 200 image/png; inspeção visual. Versão do app visível no rodapé: 2025-07-29 (UI de jul/2025).
- zapier-copilot-sidebar — https://cdn.zappy.app/28b2abee8b9da40b5fd9dca77e7038a3.png — "Copilot em barra lateral, 'Checkpoint added · Revert', 'Update Zap Steps ✓', toast 'Updated zap steps · Revert', passo Gmail com campos pendentes" — OK 200 image/png; inspeção visual. Data aproximada (versão rodapé 2025); doc oficial atualizada em 2026-05-29.


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-88_01_zapier_copilot_prompt`

![REF-88_01_zapier_copilot_prompt](https://cdn.zappy.app/78f70c6473539151c79fdd690c37f1b3.png)

`REF-88_02_zapier_copilot_sidebar`

![REF-88_02_zapier_copilot_sidebar](https://cdn.zappy.app/28b2abee8b9da40b5fd9dca77e7038a3.png)

**SOURCE:**
- https://help.zapier.com/hc/en-us/articles/15703650952077 (Help Center oficial, "Updated May 29, 2026")
- https://help.zapier.com/hc/en-us/articles/45327353705997 (Best practices for Zapier Copilot) e https://help.zapier.com/hc/en-us/articles/46177795420045 (The new builder)

**PROBLEM:** Usuários querem escolher quanto controle ceder à IA: alguns querem o fluxo pronto, outros querem aprovar cada passo; e precisam poder desfazer a ação de uma IA que altera várias partes do fluxo de uma vez.

**SOLUTION:** Dois modos explícitos: "Auto-build" (Copilot configura o máximo que puder, sem pedir confirmação por passo) e "Ask as you build" (sugere cada passo e espera aprovação). Mudanças feitas pelo Copilot aparecem como ações listadas ("Update Zap Steps"), com notificação "Updated zap steps · Revert" e checkpoints (ícone de relógio) para restaurar versões anteriores.

**OBSERVE:**
- Entrada: caixa "Copilot · AI beta" em destaque sobre o esboço do Zap (cartões tracejados "1. Trigger — Select the event that starts your Zap" e "2. Action — Select the event for your Zap to run"); texto de exemplo "New Google Sheets row > Send Gmail email."; ícones de microfone e anexo; seletor "Auto-build ⌄"; botão "Start Building" (inspeção visual).
- Barra superior do editor: Search (⌘⇧F), Undo, histórico (relógio), "Test run", "Publish" (inspeção visual).
- Barra lateral do Copilot: histórico de ações em linhas — "Update Zap Steps ✓", "Test '1. New Spreadsheet Row in Google Sheets'" com ícone ✗ para testes que falharam/cancelaram — e texto explicando o que está fazendo ("Let me configure the Gmail action with sample data…") (inspeção visual).
- "Checkpoint added · Revert" em pílula no meio do chat; toast verde "Updated zap steps · Revert" no topo do canvas (inspeção visual).
- Cartão de passo no canvas: "1. New Spreadsheet Row" (Google Sheets, com ✗ vermelho e raio) e "2. Send Email" (Gmail, selecionado, ícone de aviso amarelo); painel direito do passo com abas Setup ✓ → Configure → Test, campos "To", "Cc", "Bcc" e a mensagem "To continue, finish required fields" (botão desabilitado) (inspeção visual).
- Doc (só doc): checkpoints pelo ícone de relógio; depois de reverter só é possível reverter de novo após criar novo checkpoint; limites de 100 passos por Zap (30 em trial); Copilot escolhe conexões por e-mail/uso/acesso; pode editar Zaps já publicados, sugerir valores de campos e explicar campos; voz e anexos.

**INTERACTION:**
1. Abre um Zap novo; descreve o que quer na caixa do Copilot; escolhe Auto-build ou Ask as you build.
2. "Start Building": o Copilot cria trigger e ações, preenche campos e conecta contas.
3. No modo "Ask", aprova/recusa cada passo sugerido.
4. O Copilot testa os passos ("Test run"); o usuário vê resultados e ajusta.
5. Se algo sair errado: "Revert" no toast ou em um checkpoint.
6. Publica.

**WHY IT WORKS:** O usuário controla o grau de autonomia por modo, e a recuperação é de primeira classe (toast com Revert, checkpoints). As ações da IA ficam registradas como linhas no chat, não só como mudanças silenciosas no canvas.

**ADAPT TO BIWEB:** A combinação "modo de autonomia + Revert imediato + checkpoints" cumpre o princípio de ações recuperáveis para ChangeSets de IA no rascunho do pipeline. Mostrar no chat uma lista de "o que a IA mudou" (por etapa) ao lado do canvas ajuda a revisar por nó. Auto-build só faria sentido no rascunho (nunca em execução).

**DO NOT COPY:** O fluxo linear de lista de passos (limitado para DAGs); o botão "Publish" imediato após Auto-build sem tela de revisão do grafo; o rótulo "AI beta"; o uso de microfone/anexos como diferencial.

---

---

#### Open-source technology notes (workflow canvas)

Estrelas/licença/push: GitHub API em 2026-10-07 (onde indicado); licença confirmada também pelo arquivo LICENSE quando a API devolveu NOASSERTION. "NÃO VERIFICADO" = rate limit da API ou arquivo não encontrado.

| Biblioteca / projeto | Finalidade | Licença | Maturidade | URL | Por que pode interessar |
|---|---|---|---|---|---|
| React Flow / xyflow (@xyflow/react 12.12.0) | Canvas de nós/arestas em React | MIT (API: MIT) | 38,6k estrelas; push 2026-10-07; usado pelo UI do Airflow 3 | https://github.com/xyflow/xyflow · https://reactflow.dev | Sub-flows, contextual zoom, minimapa, controles; componentes UI (status, data edge, group node) são MIT; exemplos/templates Pro são pagos |
| Svelte Flow (@xyflow/svelte 1.7.0) | Mesma ideia para Svelte | MIT (package.json) | Mantido pelo mesmo time (xyflow); estrelas do pacote NÃO VERIFICADO | https://svelteflow.dev | Só relevante se o front do BIWEB usar Svelte |
| Vue Flow | Canvas para Vue | MIT (LICENSE: Burak Cakmakoglu) | Usado em produção por n8n (editor-ui) e Kestra; estrelas/push NÃO VERIFICADO (rate limit) | https://github.com/bcakmakoglu/vue-flow | Prova de que o padrão escala em dois produtos de workflow open source |
| Rete.js | Framework de editor visual/dataflow (framework-agnóstico) | MIT | 12,3k estrelas; push 2026-09-27 | https://github.com/retejs/rete · https://retejs.org | Foco em dataflow/engine de execução no próprio grafo; alternativa ao React Flow |
| Cytoscape.js | Grafos/redes (análise e visualização) | MIT | 11,2k estrelas; push 2026-10-06 | https://github.com/cytoscape/cytoscape.js · https://js.cytoscape.org | Melhor para grafos grandes/de linhagem (milhares de nós) do que editor de workflow; interação de edição é mais manual |
| ELK / elkjs | Auto-layout em camadas (portas, grupos, hierarquia) | EPL-2.0 (LICENSE; API devolve NOASSERTION) | 2,8k estrelas (elkjs); push 2026-10-06; usado pelo Airflow 3 UI e templates React Flow | https://github.com/kieler/elkjs · https://eclipse.dev/elk/ | Suporta portas e nós compostos (grupos) — mais adequado a "etapas" aninhadas que o dagre; EPL-2.0 é copyleft fraco, rever com jurídico |
| dagre | Auto-layout de DAG simples | MIT | 5,8k estrelas; último push 2026-08-08 (manutenção lenta) | https://github.com/dagrejs/dagre | Fácil e leve; usado pelo Kestra UI (dagre ^0.8.5) e no expand/collapse do React Flow; sem portas nem hierarquia |
| Node-RED | Ferramenta de fluxo (editor + runtime); referência de UX | Apache-2.0 | 23,7k estrelas; push 2026-10-07; package.json 5.0.7 | https://github.com/node-red/node-red | Padrões de grupo/subflow/debug; editor-client é jQuery (não reutilizável como lib moderna — NÃO VERIFICADO em profundidade) |
| n8n | Plataforma de automação (editor Vue Flow) | Sustainable Use License + Enterprise License nos arquivos ".ee" (API: NOASSERTION) — NÃO é OSI-open source | 206,8k estrelas; push 2026-10-07; editor-ui 2.43.0 | https://github.com/n8n-io/n8n | Referência de produto; código do editor NÃO deve ser copiado/embutido (restrições de uso comercial) |
| Kestra | Orquestração declarativa (YAML) + UI | Apache-2.0 (edição Enterprise separada; mais provedores de IA no Enterprise) | 29,4k estrelas; push 2026-10-07; UI v2.0 | https://github.com/kestra-io/kestra | UI com Vue Flow + dagre; boa referência de Topology + Gantt + Copilot |
| Windmill | Scripts/flows/apps com editor de flow e AI Flow Chat | Mistura: Apache-2.0, AGPLv3 e proprietário para recursos enterprise (LICENSE do repo; API: NOASSERTION) | 18,1k estrelas; push 2026-10-07 | https://github.com/windmill-labs/windmill | AI Flow Chat com aceitar/rejeitar por passo (só doc; sem imagem encontrada); AGPL exige cautela |
| Temporal (server) / Temporal UI | Execução durável / UI de histórico | MIT (ambos) | Server 23,5k estrelas; UI 439 estrelas (Svelte, package 2.55.0); push 2026-10-07 | https://github.com/temporalio/temporal · https://github.com/temporalio/ui | Já é parte da arquitetura do BIWEB; UI MIT pode servir de referência (ou até base) para a visão de execução |
| Apache Airflow | Orquestração; UI 3 com Graph/Grid | Apache-2.0 | 47,1k estrelas; push 2026-10-07; docs stable 3.3.2 | https://github.com/apache/airflow | UI em React + @xyflow/react + elkjs: arquitetura de referência para grafo colorido por estado |
| Dagster | Orquestração orientada a assets | Apache-2.0 | 16,2k estrelas; push 2026-10-07 | https://github.com/dagster-io/dagster | Grafo de ativos e Gantt; biblioteca de grafo usada no UI NÃO VERIFICADO |
| Prefect | Orquestração Python, UI de runs | Apache-2.0 | 24k estrelas; push 2026-10-07 | https://github.com/PrefectHQ/prefect | O package.json do ui-v2 lista pixi.js; uso no grafo de runs NÃO VERIFICADO |
| Apache NiFi | Fluxo de dados com canvas e Process Groups | Apache-2.0 | 6,25k estrelas; push 2026-10-07 | https://github.com/apache/nifi | Padrão de estatísticas no cartão e aninhamento; UI 2.x redesenhada (não vista) |
| bpmn-js (bpmn.io) | Modelagem/visualização BPMN | MIT-like com cláusula: marca d'água "bpmn.io" não pode ser removida/alterada (LICENSE do repo) | Estrelas/push NÃO VERIFICADO (rate limit) | https://bpmn.io/toolkit/bpmn-js/ | Só se o BIWEB adotar BPMN; a marca d'água é restrição relevante |
| Argo Workflows | Workflows de containers em Kubernetes; UI com grafo de status | Apache-2.0 (LICENSE do repo) | Estrelas/push NÃO VERIFICADO (rate limit) | https://argo-workflows.readthedocs.io/en/latest/ | Referência para estado em grafo de pods; não adotei ficha (sem imagem verificada) |

#### Padrões transversais

**Como evitar canvas ilegível (evidências nas fichas)**
- Agrupar com rótulo e cor mantendo conteúdo visível (Node-RED groups) versus encapsular em um nó (Node-RED subflow, n8n "convert to sub-workflow", Airflow Task Group "+3 tasks", NiFi Process Group). Dois níveis distintos de "esconder" parecem importar: "agrupar" e "encapsular".
- Colapsado mas informativo: o cartão do grupo agrega estado/volume do que está dentro (NiFi: Queued/In/Out e contadores; Airflow: selo de estado do grupo; Dagster: grupos como caixas por camada).
- Zoom semântico: o nó escolhe o que mostrar pelo zoom (React Flow contextual zoom); em Dagster o grafo global começa em grupos e desce para assets.
- Minimapa/Navigator com cor de estado (Airflow run graph; NiFi Bird's Eye View; Node-RED botão de mapa) para localizar o vermelho sem perder o contexto.
- Auto-layout (n8n "tidy workflow"; ELK em Airflow/React Flow; dagre no Kestra) e busca/filtro (Dagster "Search and filter assets"; Airflow ⌘K; Node-RED Explorer + "Search flows"; React Flow `node-search`).
- Alternativa ao canvas para o histórico: matriz Grid (Airflow) e Gantt (Dagster/Kestra/Temporal) — o grafo mostra estrutura, a matriz/linha do tempo mostra tempo e recorrência.
- Navegação hierárquica com breadcrumbs (NiFi) e árvore lateral (Node-RED Explorer, Dagster).

**Estado de execução visível**
- Cor + ícone + texto, nunca só cor: Airflow (verde success, vermelho failed, laranja upstream_failed com texto no selo), Temporal (chips Running/Completed/Cancelled/Timed Out), Kestra (Success/Failed), Prefect (Late).
- Estados "derivados" úteis: upstream_failed (Airflow), Late (Prefect), Cont. as New (Temporal).
- Estado no próprio nó do canvas: Node Status Indicator do React Flow (success/loading/error/initial; borda girando ou overlay), nós n8n com check verde, ícone ▶ do NiFi.
- Dado na aresta: Data Edge do React Flow (rótulo vindo do nó de origem); contagem/volume em arestas só foi confirmada no NiFi (fila com contador e barras de contrapressão). Contagem de itens nas arestas do n8n NÃO VERIFICADO nas fontes lidas.
- Seletor de tempo/tentativas: Attempt 1/1 (Kestra), Try Number (Airflow).

**Retry / falha**
- Retry granular por tarefa (Airflow: marcar/limpar célula; Dagster: Re-execute com subconjunto de passos na caixa flutuante; Kestra: Restart/Replay/Change state) versus retry da run inteira (Prefect, via CLI na doc).
- Carregar a execução falha no editor com dado fixado (n8n Debug in Editor).
- Falhas encadeadas: workflow de erro dedicado (n8n Error Trigger), bloco `errors:` no YAML (Kestra) — a IA do Kestra propõe esse bloco.

**Logs / inspeção**
- Inspeção local ao nó: INPUT/OUTPUT (n8n), debug sidebar com filtro por nó e pausa (Node-RED), logs por task com seletor de tentativa (Kestra), filtro de logs por subconjunto de passos (Dagster).
- Timeline + histórico de eventos com modos Compact/JSON (Temporal); nível de detalhe progressivo (resumo → eventos → JSON).

**Aninhamento / subfluxos**
- Subflow reutilizável (Node-RED), sub-workflow com link "View sub-execution" (n8n), flows chamando flows com aba Dependencies (Kestra), child workflows em aba Relationships (Temporal), Process Group aninhado (NiFi), TaskGroup (Airflow).

**Agendamento**
- Tela dedicada de schedules/sensors com próximo tick e histórico (Dagster, Temporal Schedules); trigger como bloco no próprio grafo (Kestra: grupo "Triggers" no Topology; n8n: nó trigger com raio laranja); estado "Late" quando o agendado não rodou (Prefect).

**NL → estrutura → preview → confirmar → executar**
- Kestra: modos Edit/Ask/Plan; "Proposed flow" validado ("Valid") + "Apply"/"Open in editor"; Plan com "Approve & execute"; "Fix with AI" a partir da task falha.
- Power Automate: estrutura sugerida primeiro ("Keep it and continue"), depois checagem de conexões, depois designer com checklist de pendências.
- Zapier: Auto-build vs. "Ask as you build"; toast "Revert" e checkpoints.
- n8n: geração no canvas com fases em tempo real; revisão de credenciais/parâmetros; "Execute and refine"; créditos visíveis.
- Windmill (só doc, sem imagem): passos gerados aparecem no grafo e podem ser aceitos, rejeitados ou revertidos individualmente — o único padrão encontrado de revisão por nó; não vi a UI.
- Analogia Cursor Plan Mode (doc oficial): perguntas → plano em markdown editável → aprovação → execução; se o resultado errar, voltar ao plano em vez de remendar.
- Lacuna: não encontrei evidência visual de "ghost nodes" (nós fantasmas pré-confirmação) nem de diff de GRAFO (nós/arestas adicionados/removidos destacados) em nenhum produto; os padrões encontrados mostram YAML/lista ou aplicam direto no canvas com Revert.
- Validação antes de executar: o selo "Valid" no Kestra, o aviso "Invalid parameters" no cartão do Power Automate e o checklist "finish required fields" no Zapier.

**Anti-patterns (observados ou inferidos das fontes)**
- Aplicar a mudança da IA direto no canvas sem pré-visualização separada (n8n, Zapier Auto-build) — depende de Revert; no BIWEB exigiria um estado "rascunho".
- Cor como única indicação de estado; estados demais para o usuário de negócio (Airflow).
- Canvas livre sem agrupamento nativo, dependendo de notas/sticky notes (n8n).
- Preencher a tela com métricas em todo nó (NiFi) — útil para operador, ruidoso para analista.
- Combinar "aprovar" e "executar" no mesmo clique (Kestra Plan: "Approve & execute").
- Tratar thumbnails ou renders de marketing como evidência de UI real (várias imagens aqui: React Flow, n8n still, Temporal).

---


---

## 15 — Progressive Complexity

**Pergunta da área (seção importante):** como ferramentas profissionais implementam progressive disclosure, defaults simples, modos avançados, configuração contextual, inspectors, detalhe sob demanda e modo guiado × avançado? Formaliza **COMPLEXITY IN THE ENGINE, SIMPLICITY ON THE SURFACE**.
**Conteúdo:** 8 fichas de produtos reais, 2 fichas conceituais (NN/g, IBM Carbon/GitHub Primer), um catálogo de 17 mecanismos, 14 princípios candidatos e anti-patterns.

### REF-89 — Elastic Kibana / Discover ES|QL + Lens (quick functions → Formula → ES|QL, com Suggestions)

**IMAGES:**
- `p1-esql-in-app-help` — https://www.elastic.co/guide/en/kibana/8.18/images/esql-in-app-help.png — Discover em modo ES|QL: editor de código com autocomplete (parâmetros nomeados, campos, funções) e flyout "ES|QL quick reference" à direita; botão "Switch to classic" no topo — VERIFICADA + INSPECIONADA (HTTP 200, image/png, 3270x1276). Doc Kibana 8.18 (screenshot com datas nov/2024); UI do 8.x, pode ter evoluído.
- `p1-esql-full-query` — https://www.elastic.co/guide/en/kibana/8.18/images/esql-full-query.png — mesmo modo: consulta de 5 linhas, barra de status "5 lines · LIMIT 10 rows", e logo abaixo um **gráfico gerado automaticamente** a partir do resultado (Lens suggestion) com lápis (editar) e disquete (salvar); lista de campos Selected/Available — VERIFICADA + INSPECIONADA (HTTP 200, image/png, 2522x1438). Kibana 8.18.


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-89_01_p1_esql_in_app_help`

![REF-89_01_p1_esql_in_app_help](https://www.elastic.co/guide/en/kibana/8.18/images/esql-in-app-help.png)

`REF-89_02_p1_esql_full_query`

![REF-89_02_p1_esql_full_query](https://www.elastic.co/guide/en/kibana/8.18/images/esql-full-query.png)

**SOURCE:**
- https://www.elastic.co/docs/explore-analyze/visualize/lens — doc oficial (versão atual; sem data na página; lida via WebFetch/curl em out/2026). Descreve quick functions, formulas, ES|QL/PromQL em Lens e botão "Suggestions".
- https://www.elastic.co/guide/en/kibana/8.18/esql.html — doc oficial Kibana 8.18 (modo ES|QL em Discover, ajuda in-app, "Lens suggestions in Discover").
- https://www.elastic.co/guide/en/kibana/8.18/try-esql.html — doc oficial 8.18.
- Limitação: as imagens do Lens atual (docs/explore-analyze/images/...) são só ícones/pequenos recortes; não encontrei screenshot oficial atual da tela completa do Lens com abas "Quick functions / Formula". A evidência visual aqui é do modo ES|QL do Discover (mesmo ecossistema). NÃO VERIFICADO visualmente: layout exato do editor de camada do Lens.

**PROBLEM:** Analistas iniciantes precisam de um gráfico em segundos, mas analistas avançados precisam de agregações customizadas, razões entre séries e consultas cross-index. Um só modelo de UI não serve aos dois.

**SOLUTION:** Três "degraus" no mesmo produto. (1) Arrastar campo e o Lens escolhe a agregação e propõe gráficos alternativos ("Suggestions"). (2) Dentro da camada, trocar entre *Quick functions* e *Formula* para cálculos (a doc usa o exemplo de dividir dois valores para obter percentual). (3) Modo de consulta (ES|QL/PromQL), indicado pela doc para cross-index, filtros complexos e cálculos customizados. No Discover, há interruptor de modo no topo ("Switch to classic") e o resultado da query vira visualização automaticamente.

**OBSERVE:**
- O botão de troca de modo ("Switch to classic") fica no cabeçalho global, não escondido em menu: o modo é uma decisão de primeira classe, reversível.
- Editor de código com autocomplete contextual (parâmetros nomeados `?_tstart/?_tend`, campos do índice, funções) e um **flyout de referência embutido** que pesquisa por tópico ("WHERE") sem sair da tela.
- Resultado da query alimenta **automaticamente** um gráfico (histograma/barras) acima da tabela; o lápis ao lado do gráfico abre a configuração visual: a consulta é fonte, o gráfico é derivado.
- Barra de status sob o editor resume a query de forma legível ("5 lines · LIMIT 10 rows"), servindo de resumo inline do que o código faz.
- Lista de campos lateral separada em "Selected fields" e "Available fields" com contagem: o estado da seleção é visível e colapsável.
- Doc de Lens: "Suggestions" aparece como botão no rodapé do workspace; a escolha de uma sugestão é "Save and return" (não troca de modo).

**INTERACTION:**
1. Usuário arrasta um campo para o workspace do Lens; a agregação padrão é escolhida automaticamente (ex.: date histogram, top values).
2. Se quiser outra forma, clica em "Suggestions" e escolhe; se quiser outra agregação, abre o campo na camada e troca em "Quick functions".
3. Se precisar de cálculo, muda para "Formula" no mesmo painel (há ícone de referência da fórmula).
4. Se precisar de cross-index ou lógica complexa, vai para modo ES|QL (no Discover: alternar modo no topo; no Lens: visualização baseada em query).
5. Digita a query com autocomplete; abre "ES|QL help" para consultar sintaxe sem sair do editor.
6. Vê o gráfico gerado do resultado; edita tipo/opções com o lápis; salva ou envia ao dashboard.

**WHY IT WORKS:** O caminho simples e o avançado compartilham a mesma tela, o mesmo resultado e o mesmo destino (dashboard). A pessoa não precisa "sair do produto" para crescer; escolhe o degrau pelo problema, não por papel. O motor continua único (consulta ES); a superfície é que escala.

**ADAPT TO BIWEB:** Mapeia diretamente para o seletor "Visual | BEL": o modo BEL deve manter o painel de resultado/preview idêntico ao Visual, com autocomplete de campos do modelo semântico e um flyout de ajuda embutido. "Suggestions" corresponde aos "field wells sugerir": o motor propõe alternativas, o usuário aplica sem trocar de modo. A barra de status com resumo legível da expressão pode virar o "resumo inline" de campos/medidas recolhidos.

**DO NOT COPY:** O jargão e a densidade do Kibana (muitos modos: Lens, Discover, ES|QL, TSVB, Vega); a existência de vários editores com capacidades divergentes confunde (a própria doc precisa de tabela "visualization types"). O BIWEB deve ter um único motor e um único painel de resultado. Não copiar a dependência de sintaxe específica do vendor como único caminho avançado.

---

---

### REF-90 — Metabase / Query builder "notebook" (passos) + Preview por passo + "View SQL" / Convert to SQL

**IMAGES:**
- `p2-notebook-editor` — https://www.metabase.com/docs/latest/questions/images/notebook-editor.png — Notebook com blocos coloridos: Data (Orders), Filter ("Created At is in the previous 3 months"), Summarize (Count by Created At: Month), botões "Filter / Summarize / Join data / Sort / Row limit / Custom column" no rodapé e botão "Visualize"; cada bloco tem seta ▶ à direita (preview do passo) — VERIFICADA + INSPECIONADA (HTTP 200, image/png, 2058x1146). Doc "latest" (screenshots com dados até 2026).
- `p2-preview-step` — https://www.metabase.com/docs/latest/questions/images/preview-table.png — o mesmo notebook com um painel "Preview" aberto sob "Summarize" (tabela Product→Category x Count com 4 linhas) e botão ✕ para fechar; "Sort" já aparece abaixo — VERIFICADA + INSPECIONADA (HTTP 200, image/png, 2366x1544).
- `p2-view-sql` — https://www.metabase.com/docs/latest/questions/images/view-the-sql.png — notebook à esquerda e painel "SQL for this question" à direita (SELECT DATE_TRUNC('month', ...) ... GROUP BY ... ORDER BY), botão "Hide SQL" no topo — VERIFICADA + INSPECIONADA (HTTP 200, image/png, 2670x1476).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-90_01_p2_notebook_editor`

![REF-90_01_p2_notebook_editor](https://www.metabase.com/docs/latest/questions/images/notebook-editor.png)

`REF-90_02_p2_preview_step`

![REF-90_02_p2_preview_step](https://www.metabase.com/docs/latest/questions/images/preview-table.png)

`REF-90_03_p2_view_sql`

![REF-90_03_p2_view_sql](https://www.metabase.com/docs/latest/questions/images/view-the-sql.png)

**SOURCE:**
- https://www.metabase.com/docs/latest/questions/query-builder/editor — doc oficial (versão "latest", lida em out/2026; sem data na página).
- (referência geral) https://www.metabase.com/docs/latest/questions/query-builder/introduction — retornou página mínima ao curl; não usada para fatos.

**PROBLEM:** Usuário de negócio quer pergunta a dados sem escrever SQL, mas precisa entender o que o sistema fez e, depois, poder sair para SQL quando o builder não alcançar.

**SOLUTION:** O "notebook" transforma uma consulta em passos nomeados e coloridos (Data → Join → Custom column → Filter → Summarize → Sort → Limit → Visualize). Passos opcionais só aparecem como botões no rodapé até serem adicionados. Cada passo tem **preview** do resultado parcial. Um botão "View SQL" mostra o SQL real que será executado; a doc também permite "Convert to SQL", mas a conversão é **só de ida** (não há volta ao notebook).

**OBSERVE:**
- Passos vazios não ocupam espaço: "Join data / Sort / Row limit / Custom column" são botões-chip no rodapé, que viram blocos quando acionados (detalhe sob demanda por adição, não por colapso).
- Frase de ação em linguagem natural dentro dos blocos: "Created At is in the previous 3 months", "Count … by Created At: Month".
- Cada bloco tem seta ▶ para pré-visualizar o resultado **até aquele passo**, abrindo painel inline com tabela limitada e ✕ para fechar.
- Código gerado fica ao lado, somente leitura, com botão "Hide SQL": transparência sem obrigar a ler.
- Placeholder instrutivo em passo vazio: "Add filters to narrow your answer".
- Cores por tipo de passo (azul dados, roxo filtro, verde sumarização, cinza ordenação): ajudam a escanear a estrutura sem ler.

**INTERACTION:**
1. Escolhe a fonte em Data (tabela, modelo, métrica ou pergunta salva).
2. Clica em um botão do rodapé (ex.: Filter) para adicionar o passo; escolhe campo e condição em popover.
3. Em Summarize, escolhe métrica (Count) e agrupamento ("by Created At: Month").
4. Clica em ▶ do passo para ver o preview parcial; fecha com ✕.
5. Clica em "Visualize" para ver gráfico/tabela.
6. Se quiser, abre "View SQL" para conferir; se precisar de mais, converte para SQL (sem volta).

**WHY IT WORKS:** O modelo mental é "uma receita em passos", que mapeia a ordem real de execução de uma consulta, então iniciantes constroem e avançados auditam. O preview por passo dá feedback imediato e localiza erros. "View SQL" reduz a ansiedade de "o que isso faz por baixo".

**ADAPT TO BIWEB:** Pode inspirar a visão "Visual | BEL" de uma medida/consulta: o modo Visual mostra passos (fonte → filtros → agregação → ordenação) com resumo em linguagem natural e preview parcial; o BEL aparece como painel ao lado, somente leitura, com "Ver expressão". Defina desde o início se a conversão Visual→BEL é reversível; se não for, avise ANTES (a Metabase não avisa de forma proeminente nas imagens). O padrão de botões-chip para passos opcionais é bom para o inspector gerado por schema (seções que só "nascem" quando adicionadas).

**DO NOT COPY:** A conversão unidirecional sem caminho de volta para quem começou no builder; o BIWEB tem a vantagem de BEL poder ser reversível parcialmente (ou ter modo "somente leitura que explica"). Também não copiar o layout de formulário vertical largo do notebook para telas densas de BI; é pensado para consultas simples.

---

---

### REF-91 — Grafana (Loki/Prometheus) / Query editor Builder ↔ Code + "Explain query"

**IMAGES:**
- `p3-explain-results` — https://grafana.com/static/img/docs/prometheus/explain-results.png — resultado do "Explain": lista numerada de blocos (1 `counters_logins` "Fetch all series matching metric name and label filters", 2 `rate(<expr>[$__rate_interval])` com descrição, 3 `avg(<expr>)`) acima da query final `avg(rate(counters_logins[$__rate_interval]))`; no topo, os cartões de operação "Rate → Avg" com botão "+ Operations" e "+ By label" — VERIFICADA + INSPECIONADA (HTTP 200, image/png, 1673x366). Imagem referenciada na doc do Loki (e descrita na doc do Prometheus); captura é de Prometheus.
- `p3-loki-label-browser` — https://grafana.com/static/img/docs/explore/Loki_label_browser.png — modal "Label browser" em 3 passos numerados ("1. Select labels to search in", "2. Find values for the selected labels", "3. Resulting selector" com botões Show logs / Show logs rate / Validate selector / Clear). Ao fundo (escurecido) aparece o editor com abas **Builder | Code** à direita, "Label filters", "Line contains" e uma seção "Options" colapsada — VERIFICADA + INSPECIONADA (HTTP 200, image/png, 1628x589).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-91_01_p3_explain_results`

![REF-91_01_p3_explain_results](https://grafana.com/static/img/docs/prometheus/explain-results.png)

`REF-91_02_p3_loki_label_browser`

![REF-91_02_p3_loki_label_browser](https://grafana.com/static/img/docs/explore/Loki_label_browser.png)

**SOURCE:**
- https://raw.githubusercontent.com/grafana/grafana/main/docs/sources/datasources/loki/query-editor/index.md — fonte oficial da doc do Loki (GitHub oficial, branch main; lida em out/2026). Confirma: abas Builder/Code, "Each mode is synchronized", aviso ao voltar de Code para Builder com query complexa, "Explain query" toggle, ícones de operação (replace, description tooltip, remove), "Switch to Code mode at any time to view or refine the generated query".
- https://grafana.com/docs/grafana/latest/datasources/prometheus/query-editor/ — doc oficial (Prometheus): Builder para quem tem pouca experiência com PromQL, Code para experientes, modos sincronizados, avisos em transição, Explain, e "Options" (Legend, Format, Type, Min step, Exemplars).
- Limitação: o texto sobre sincronização e aviso foi verificado nas docs; **NÃO VERIFICADO** visualmente o texto exato do aviso de perda.

**PROBLEM:** Linguagens de consulta (PromQL/LogQL) são poderosas e inacessíveis a quem não as domina; mas ocultar totalmente a linguagem frustra quem sabe.

**SOLUTION:** Duas abas **Builder | Code** no mesmo editor, sincronizadas. O Builder compõe a query com seletores de métrica/labels e "operações" encadeáveis; o Code oferece editor com autocomplete e realce. O toggle **Explain** traduz cada parte da query em linguagem natural passo a passo. Opções secundárias (Legend, Format, Type…) ficam num bloco "Options" colapsado cujo resumo aparece inline. O navegador de labels é um assistente de 3 passos em modal.

**OBSERVE:**
- Abas Builder/Code na barra do editor, lado a lado (não menu), com **mesmo estado**: trocar não perde trabalho "exceto limitações", e há aviso explícito quando a query não cabe no Builder.
- "Explain": cada operação ganha número, a sintaxe correspondente e uma frase descrevendo o efeito; a query final aparece embaixo. Funciona como tooltip "por que isto?" expandido.
- Cartões de operação encadeados com seta ("Rate → Avg") e botão "+ Operations": o grafo de operações é visual.
- Cada cartão de operação tem três ações pequenas: trocar por operação do mesmo tipo, abrir descrição (tooltip) e remover.
- Seção "Options" recolhida por padrão no editor (visível no fundo do screenshot).
- Label browser em 3 passos numerados com instrução curta em cada, e resultado ("Resulting selector") atualizado em tempo real.

**INTERACTION:**
1. No editor da query, selecionar a aba Builder (modo iniciante).
2. Escolher métrica/labels (ou abrir Label browser e seguir os passos 1-2-3).
3. Adicionar operações (+ Operations) como Rate, Avg, By label.
4. Ligar o toggle "Explain" para ler o que cada parte faz.
5. Alternar para Code para ver/editar o PromQL/LogQL gerado; se for complexo demais para o Builder, o retorno exibe aviso.
6. Ajustar "Options" (Legend, Format, Type…) apenas se necessário.

**WHY IT WORKS:** O Builder funciona como "treinamento" para a linguagem: ver a query nascer do clique ensina Code. A sincronização torna a escolha reversível e reduz o medo de "ficar preso". Explain vira documentação contextual ligada ao objeto real do usuário.

**ADAPT TO BIWEB:** O seletor Visual | BEL pode adotar a regra "sincronizado, com aviso quando uma expressão BEL não puder ser representada no Visual", e um toggle "Explicar" que gera frases por trecho de expressão (reaproveitando a IA contextual, mas funcionando sem ela via descrição das funções do catálogo). Reservar um bloco "Opções" colapsado com resumo inline (ex.: "Legenda: auto · Formato: série temporal") no inspector gerado por schema.

**DO NOT COPY:** Dependência de conhecer o domínio (labels, rate intervals) para qualquer uso do Builder: o BIWEB parte do modelo semântico (nomes de negócio), não de séries/labels técnicos. Também evitar a limitação "Builder não suporta consultas complexas" como beco sem aviso prévio.

---

---

### REF-92 — Grafana Drilldown apps (Metrics/Logs/Traces/Profiles Drilldown): exploração "queryless" guiada

**IMAGES:**
- `p4-traces-breakdown` — https://a-us.storyblok.com/f/1022730/24bd4d4890/breakdown.png — Traces Drilldown, aba **Breakdown** (outras abas: Root cause latency, Comparison, Slow traces 200). Controles: "Scope: Resource | Span", "Group by" com chips (service.name, service.namespace, service.version, deployment.environment) + dropdown "Other attributes", "View: Single | Grid | Rows", busca, cartões por serviço com link "Add to filters" e tooltip de exemplar com botão "View trace" — VERIFICADA + INSPECIONADA (HTTP 200, image/png, 1999x966). Do post oficial de 20-21/fev/2025.
- `p4-profiles-all-services` — https://a-us.storyblok.com/f/1022730/99103e95ff/all-services.png — Profiles Drilldown "All services": **stepper em pílulas** (All services → Profile types → Labels → Flame graph, "Diff flame graph", "Favorites"), filtros (Data source, Profile type, busca por regex com contador 6, Grid|Rows), cartões por serviço com links "Profile types · Labels · Flame graph" e estrela de favorito — VERIFICADA + INSPECIONADA (HTTP 200, image/png, 1999x1069). Post de fev/2025.
- `p4-start-page` — https://a-us.storyblok.com/f/1022730/bfe39c1dca/start-page.png — página inicial do Drilldown (retomar explorações / iniciar nova) — VERIFICADA (só alt/doc; HTTP 200, image/png, 1999x1913; baixada mas não inspecionada visualmente).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-92_01_p4_traces_breakdown`

![REF-92_01_p4_traces_breakdown](https://a-us.storyblok.com/f/1022730/24bd4d4890/breakdown.png)

`REF-92_02_p4_profiles_all_services`

![REF-92_02_p4_profiles_all_services](https://a-us.storyblok.com/f/1022730/99103e95ff/all-services.png)

`REF-92_03_p4_start_page`

![REF-92_03_p4_start_page](https://a-us.storyblok.com/f/1022730/bfe39c1dca/start-page.png)

**SOURCE:**
- https://grafana.com/blog/2025/02/20/grafana-drilldown-apps-the-improved-queryless-experience-formerly-known-as-the-explore-apps/ — blog oficial Grafana Labs (publicado 20-21/fev/2025; imagens desse post).
- https://grafana.com/docs/grafana/latest/visualizations/simplified-exploration/metrics.md — doc oficial Metrics Drilldown ("queryless experience… without needing to write a PromQL query"; escolhe visualização ideal por tipo de métrica; "Apply advanced filters"; "View the metric in Explore").
- https://grafana.com/docs/learning-hub/explore-your-data/00-intro/02-what-is-drilldown/ — Learning Hub.
- Limitação: o blog afirma que o editor de queries clássico/Explore continua disponível; as imagens são de Traces/Profiles Drilldown (não Metrics), mas ilustram o mesmo padrão.

**PROBLEM:** Quem investiga um incidente não quer escrever PromQL/LogQL/TraceQL; precisa ir de "algo está errado" para "onde e por quê" por cliques.

**SOLUTION:** Apps "queryless" que oferecem **navegação guiada**: visão geral de todos os serviços → escolha de tipo → quebra por atributo → detalhe (flame graph/trace). O produto escolhe a visualização apropriada por tipo de dado e permite "Add to filters" a partir de qualquer gráfico. Quando o usuário quer a query, há atalho "View in Explore" (a doc tem a seção correspondente).

**OBSERVE:**
- Stepper em pílulas conectadas no topo ("All services — Profile types — Labels — Flame graph"), que funciona como breadcrumb e como guia de próxima etapa.
- Cada cartão repete os próximos passos como links de texto (Profile types · Labels · Flame graph): a navegação ocorre **no objeto**, não numa barra global.
- "Group by" usa chips para os atributos mais úteis e coloca o resto atrás de "Other attributes" (divulgação progressiva do catálogo longo de atributos).
- Seletores de **escopo** (Resource | Span) e **View** (Single | Grid | Rows) são segmented controls compactos e rotulados.
- "Add to filters" em cada cartão transforma uma observação em filtro persistente (a "query" é construída como efeito colateral).
- Tooltip de exemplar mostra traceId, valor e botão "View trace": detalhe sob demanda no ponto exato.
- Abas de análise com contador ("Slow traces 200") antecipam o tamanho do que vem.

**INTERACTION:**
1. Abre o app Drilldown (ex.: Profiles); vê todos os serviços em grid.
2. Pesquisa serviços (regex permitido) ou escolhe tipo de perfil.
3. Clica em "Labels" num cartão para ver a quebra por atributo; usa "Add to filters" onde há anomalia.
4. Passa ao "Flame graph" ou "View trace" pelo tooltip do exemplar.
5. Quando precisa de mais controle, usa "View in Explore" para continuar com query manual.

**WHY IT WORKS:** Ao invés de pedir ao usuário que construa a pergunta, o produto apresenta a pergunta seguinte mais provável. O custo de aprender é amortizado pela exploração e o "escape hatch" para o modo avançado preserva o poder.

**ADAPT TO BIWEB:** Aplicável ao "Explorar dados" do BIWEB: um stepper de camadas do modelo (Tabela/Entidade → Medida → Dimensão → Detalhe) com "Adicionar ao filtro" nos cartões, alimentando o mesmo estado do builder. "Group by" com chips dos atributos principais + "Outros atributos" é um bom padrão para listas de dimensões longas no inspector. A IA, quando ativa, sugere o próximo passo; sem IA, o stepper é determinístico.

**DO NOT COPY:** O conjunto fragmentado de quatro apps separados (Metrics/Logs/Traces/Profiles) que o usuário precisa descobrir; no BIWEB o modo guiado deve ser parte do mesmo editor. Também não depender de convenções de observabilidade (exemplars, flame graphs).

---

---

### REF-93 — Figma / Dev Mode vs Design mode (modo por audiência) + Inspect com List | Code

**IMAGES:**
- `p5-devmode-inspect-annotated` — https://help.figma.com/hc/article_attachments/32233541075479 — Painel Inspect em três colunas com legendas A–J: A cabeçalho do componente, B "Compare with main component", C link Storybook, D "Component information" (variantes com "4 more" colapsado), E "Explore component behavior", F "Recommended code" (seletor "React" + copiar), G **Layer properties** com diagrama box-model, abas **List | Code** e seletor CSS, H blocos de código Layout/Style, aviso "Layer changes: This layer has been edited since this code was generated", I Assets, J Export com "Preview" colapsável — VERIFICADA + INSPECIONADA (HTTP 200, image/png, 3060x1972).
- `p5-devmode-canvas` — https://help.figma.com/hc/article_attachments/24382888520855 — Dev Mode no canvas: guias de medição azuis com valores (326, 105), barra inferior só com 4 ferramentas (mover, medir, anotar, comentar), aba "Inspect | Plugins", "Compare changes", "Code Connect – Connect to codebase", "Open in playground", "Dev resources", seletores "Code" e "CSS" — VERIFICADA + INSPECIONADA (HTTP 200, image/png, 1920x1080).
- `p5-devmode-ready-sidebar` — https://help.figma.com/hc/article_attachments/26975834817175 — barra lateral esquerda do Dev Mode: botão verde "Ready for dev 12", lista de páginas com marcador `</>`, seção "Ready for development" com miniaturas e "Edited N days ago", e Layers abaixo — VERIFICADA + INSPECIONADA (HTTP 200, image/png, 1098x1894).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-93_01_p5_devmode_inspect_annotated`

![REF-93_01_p5_devmode_inspect_annotated](https://help.figma.com/hc/article_attachments/32233541075479)

`REF-93_02_p5_devmode_canvas`

![REF-93_02_p5_devmode_canvas](https://help.figma.com/hc/article_attachments/24382888520855)

`REF-93_03_p5_devmode_ready_sidebar`

![REF-93_03_p5_devmode_ready_sidebar](https://help.figma.com/hc/article_attachments/26975834817175)

**SOURCE:**
- https://help.figma.com/hc/en-us/articles/15023124644247 — "Guide to Dev Mode", Help Center oficial (sem data na página; screenshots rotulados "Dev Mode 2024"). Dev Mode lançado em 2023.
- Não repete REF-09 do pacote existente (Properties inspector do modo Design); aqui o foco é o **mecanismo de modo** e List|Code.

**PROBLEM:** O mesmo arquivo serve a designers (que editam) e desenvolvedores (que inspecionam). Uma UI única mistura ferramentas de edição com informação técnica e sobrecarrega ambos.

**SOLUTION:** Um **interruptor de modo** (toggle na barra / Shift+D) troca toda a "pele" do produto: Design mostra ferramentas e propriedades de edição; Dev Mode esconde edição e mostra especificações, código gerado, ativos e estado "Ready for dev". O mesmo dado (propriedades do layer) é apresentado em **duas representações** (List e Code), com seletor de linguagem/unidade.

**OBSERVE:**
- O toggle muda barra lateral esquerda (prioriza "Ready for development"), barra inferior (apenas 4 ferramentas de leitura/medição) e painel direito (Inspect + Plugins).
- No painel: **List | Code** são abas da mesma seção "Layer properties": mesmos valores como lista copiável ou como trecho de código; seletor de linguagem (CSS, React…) e de unidades em dropdowns pequenos.
- "4 more" colapsa propriedades de variantes: resumo inline do que está escondido.
- Aviso contextual no ponto exato ("This layer has been edited since this code was generated"), em vez de modal ou toast.
- Estado de ciclo de vida visível como filtro de primeira classe: "Ready for dev 12".
- Seções recolhíveis (Component information, Recommended code, Assets, Export) com chevron e Export com "Preview" recolhida.
- Marcação `</>` verde nas páginas da lista: sinaliza onde existe conteúdo pronto.

**INTERACTION:**
1. Designer marca frames como "Ready for dev".
2. Dev alterna para Dev Mode (toggle ou Shift+D); sidebar mostra apenas o que está pronto.
3. Seleciona um layer; o Inspect exibe propriedades; alterna List ↔ Code e escolhe linguagem/unidade.
4. Mede distâncias por hover/Alt no canvas; copia trechos; abre "Compare changes" para ver mudanças.
5. Exporta assets em Export.

**WHY IT WORKS:** O modo **remove** o que não é relevante para o papel atual em vez de apenas recolher; isso reduz ruído mais que um accordion. A dupla List/Code atende dois níveis de fluência sem mudar de tela.

**ADAPT TO BIWEB:** O BIWEB tem papéis claros (Construtor, Consumidor, Admin/Modelador). Um "modo de visualização" por papel — ex.: modo "Revisar/Inspecionar" que expõe consulta resultante, linhagem e BEL somente leitura, em contraste com o modo "Construir" — alinha com Auto × Livre por container e com o inspector por schema. List | Code é um bom modelo para o painel "propriedade do widget" (valores amigáveis vs. JSON/BEL).

**DO NOT COPY:** Exigir licença/assento por papel como barreira de acesso (limitação comercial do Figma); esconder edição por completo no modo avançado quando o BIWEB quer fluxo contínuo construir ↔ inspecionar sem perder contexto. Não copiar o excesso de painéis/abas de Dev Mode (Plugins, Code Connect, playground) fora do que BI precisa.

---

---

### REF-94 — GitHub / Barra de filtro de Issues e PRs: dropdowns ↔ query digitada ↔ URL (com content assist e AND/OR aninhado)

**IMAGES:**
- `p6-issues-search-bar` — https://docs.github.com/assets/cb-50768/images/help/issues/issues-search-bar.png — barra de busca preenchida com `is:issue is:open` (destaque laranja na doc), botão "Filters ▾" à esquerda, "Labels 7" e "Milestones 1" à direita, cabeçalho de lista com "17 Open / 18 Closed" e dropdowns Author, Label, Projects, Milestones, Assignee, Sort — VERIFICADA + INSPECIONADA (HTTP 200, image/png, 2010x488). Docs atuais (out/2026).
- `p6-issues-filter-dropdown` — https://docs.github.com/assets/cb-49430/images/help/issues/issues-filter-dropdown.png — mesma tela com o botão "Filters ▾" destacado (o menu aberto não aparece nesta captura) — VERIFICADA + INSPECIONADA (HTTP 200, image/png, 2010x488).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-94_01_p6_issues_search_bar`

![REF-94_01_p6_issues_search_bar](https://docs.github.com/assets/cb-50768/images/help/issues/issues-search-bar.png)

`REF-94_02_p6_issues_filter_dropdown`

![REF-94_02_p6_issues_filter_dropdown](https://docs.github.com/assets/cb-49430/images/help/issues/issues-filter-dropdown.png)

**SOURCE:**
- https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/filtering-and-searching-issues-and-pull-requests — doc oficial GitHub (lida via WebFetch em out/2026; sem data específica).
- https://docs.github.com/en/search-github/getting-started-with-searching-on-github/understanding-the-search-syntax — doc oficial da sintaxe (operadores `>`, ranges `n..n`, exclusão `-`, `NOT`, `@me`).
- Limitações: as capturas são simples e mostram só a barra; o comportamento de content assist/AND-OR vem do texto da doc (lido via WebFetch), **NÃO VERIFICADO visualmente**. O "advanced search" com formulário (github.com/search/advanced) não foi encontrado em doc oficial acessível; só achei userscript de terceiros, descartado.

**PROBLEM:** Filtragem poderosa (booleana, aninhada) vs. usuário comum que só quer "meus issues abertos". Se só houver sintaxe, é inacessível; se só houver formulário, não escala.

**SOLUTION:** Uma única barra de busca com **sintaxe de qualificadores** (`is:open label:bug assignee:@me`) acompanhada de **dropdowns** (Filters, Author, Label, Assignee, Sort) que manipulam o **mesmo** estado. Ao digitar, **content assist** sugere qualificadores e valores e **avisa** problemas. O estado é refletido na **URL**, tornando visões compartilháveis. A doc descreve AND/OR e agrupamento por parênteses (até cinco níveis).

**OBSERVE:**
- A barra de busca é o **modo avançado** e o botão "Filters ▾" é o **modo simples** do mesmo componente, lado a lado.
- O valor padrão da barra (`is:issue is:open`) é visível: o default é transparente e editável, não um estado escondido.
- Contadores "17 Open / 18 Closed" funcionam como filtros de estado de 1 clique.
- Dropdowns de coluna (Author, Label, Projects, Milestones, Assignee, Sort) repetem as facetas mais usadas no cabeçalho da lista.
- Espaço = AND por padrão; OR e parênteses só aparecem para quem digitar (sintaxe como camada).
- URL atualizada automaticamente: "o estado da superfície é o estado da consulta".

**INTERACTION:**
1. Usuário abre a lista; a barra já mostra o filtro padrão.
2. Clica em Filters ou em um dropdown; escolhe valor; a barra de texto é atualizada.
3. Usuário avançado digita `(type:Bug AND assignee:octocat) OR …`; o content assist sugere qualificadores/valores e alerta problemas.
4. Copia a URL para compartilhar a visão.

**WHY IT WORKS:** Há **uma fonte da verdade**; os dropdowns são atalhos para texto. Quem começa clicando aprende a sintaxe por observação do texto resultante (training wheels sem modo separado). A sintaxe é a "API" do filtro.

**ADAPT TO BIWEB:** Excelente para a barra de filtros do dashboard e do inspector (campo "Filtro" por widget): chips/dropdowns à esquerda, linha BEL à direita, sincronizados, com content assist baseado no modelo semântico e estado serializável na URL. Também serve de base para "views" salvas.

**DO NOT COPY:** Sintaxe de qualificadores "mágicos" não descobríveis sem a doc (limite de 5 níveis, regras por tipo); o BIWEB deve oferecer descoberta por autocomplete e mensagens de erro em português. Não depender só de texto: o menu de filtros precisa expor operadores comuns de dados (comparações, datas relativas) nativamente.

---

---

### REF-95 — Airbyte / Configuração de conector: "Agent | Form" (assistente guiado por IA ↔ formulário completo)

**IMAGES:**
- `p7-connector-setup-assistant` — https://docs.airbyte.com/assets/images/connector-setup-agent-e34de08fd388f0ab44c2b675b894d1ee.png — tela "Sources / New source": título "Connector Setup Assistant" com selo BETA, subtítulo "Our AI assistant will help configure your connector. Select 'Form' in the top-right to switch back to manual configuration."; **toggle segmentado "Agent | Form"** no canto superior direito; mensagem do assistente "Welcome to the S3 Connector Configuration" pedindo duas informações essenciais (S3 Bucket Name; Streams Configuration) e a pergunta "What is the name of your S3 bucket?"; caixa "Type your response…" — VERIFICADA + INSPECIONADA (HTTP 200, image/png, 2834x2486). Doc atual do Airbyte (out/2026); recurso em beta.


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-95_01_p7_connector_setup_assistant`

![REF-95_01_p7_connector_setup_assistant](https://docs.airbyte.com/assets/images/connector-setup-agent-e34de08fd388f0ab44c2b675b894d1ee.png)

**SOURCE:**
- https://docs.airbyte.com/platform/using-airbyte/getting-started/add-a-destination — doc oficial (lida via curl/WebFetch em out/2026): "Two setup interfaces are possible" (Cloud: Connector Setup Assistant com IA; self-managed ou preferência: formulário + painel de documentação), seção "Set up connectors with AI (BETA)" e "Handle secrets securely" (modo secreto no chat).
- https://docs.airbyte.com/platform/cloud/managing-airbyte-cloud/configuring-connections — doc oficial de conexões (configurações de conexão vs. de stream; campos opcionais; field selection opcional).
- Limitação: **não encontrei** seção "Advanced" colapsada documentada para o formulário do Airbyte; só a distinção conexão (Settings) vs stream (Schema) e campos marcados como opcionais.

**PROBLEM:** Cada conector tem dezenas de campos; a maioria dos usuários precisa de 2–3 para o primeiro sync, mas formulários completos assustam.

**SOLUTION:** Oferecer **dois modos de preenchimento** do mesmo objeto: "Agent" (conversa guiada: pergunta o essencial, dá contexto, trata segredos em "secret mode") e "Form" (formulário tradicional com painel de documentação à direita). A transição é um toggle visível, e a mensagem de abertura diz como voltar.

**OBSERVE:**
- A mensagem do assistente começa listando **"duas informações essenciais"** antes de qualquer outra configuração: defaults e mínimo viável antes do restante.
- O toggle **Agent | Form** fica no cabeçalho da página, sempre visível, com o texto "Select 'Form'… to switch back to manual configuration".
- Selo **BETA** discreto e honesto no título.
- Doc: no modo Form há **painel de documentação ao lado** do formulário para preencher cada campo (ajuda contextual lateral).
- Segredos (senha/API key) entram em "secret mode" e não são expostos ao agente: a IA não vê dados sensíveis.
- Config de conexão separa nível de conexão e de stream, com campos "(Optional)" explícitos (prefixo de stream, seleção de campos).

**INTERACTION:**
1. Usuário vai a Sources/Destinations → New; escolhe o conector.
2. No Cloud, abre o Assistente: responde perguntas (ex.: nome do bucket) uma a uma.
3. Pode alternar para "Form" a qualquer momento para ver/editar todos os campos.
4. Segredos são digitados em modo secreto; ao final, "Test and save".
5. Configurações de stream (sync mode, cursor, primary key, campos) ficam em etapa posterior da conexão.

**WHY IT WORKS:** Troca "formulário gigante" por "uma pergunta de cada vez" para iniciantes, mas **sem aprisionar**: o formulário permanece como fonte de verdade acessível. A IA aqui é um *modo de preenchimento*, não um substituto do produto.

**ADAPT TO BIWEB:** Direto ao ponto "IA propõe com preview": o assistente (opcional) preenche o schema do inspector/conexão, mas o resultado é sempre o formulário/inspector normal (editável). Replicar o toggle "Guiado | Avançado" para assistentes de criação (nova fonte de dados, novo modelo) com segredos tratados fora do contexto da IA.

**DO NOT COPY:** Tornar o modo conversacional o padrão quando o usuário domina o formulário; deve ser opt-in e, se possível, lembrar a última escolha. Também não depender de IA para o caminho essencial: o BIWEB declara IA opcional.

---

---

### REF-96 — Metabase / X-rays e "Automatic insights" (defaults inteligentes gerando dashboards navegáveis: Zoom in / Zoom out / Related)

**IMAGES:**
- `p8-xray-example` — https://www.metabase.com/docs/latest/exploration-and-organization/images/x-ray-example.png — página "Here's a quick look at Products": botão verde "Save this", filtros (Created At, Category), seção "Summary" com 3 KPIs (200 Total Products, 5 added in last 30 days, 42 Products Doohickey), "How these Products are distributed" com histograma; **painel lateral "More X-rays"** com grupos "ZOOM IN" (Category fields, Created At fields, Avg Product Rating metrics, Products Doohickey metrics) e "RELATED" (Reviews, Orders, People, Accounts) — VERIFICADA + INSPECIONADA (HTTP 200, image/png, 2966x1648).
- `p8-automatic-insights` — https://www.metabase.com/docs/latest/exploration-and-organization/images/automatic-insights.png — gráfico de linhas com menu de drill-through: "See these Orders", "See this month by week", "Break out by…", **"Automatic insights…"** (destacado), "Filter by this value" com `< > = ≠` — VERIFICADA + INSPECIONADA (HTTP 200, image/png, 2064x1220).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-96_01_p8_xray_example`

![REF-96_01_p8_xray_example](https://www.metabase.com/docs/latest/exploration-and-organization/images/x-ray-example.png)

`REF-96_02_p8_automatic_insights`

![REF-96_02_p8_automatic_insights](https://www.metabase.com/docs/latest/exploration-and-organization/images/automatic-insights.png)

**SOURCE:**
- https://www.metabase.com/docs/latest/exploration-and-organization/x-rays — doc oficial (versão "latest", out/2026; screenshots com dados até 2026). Lida via WebFetch/curl. Edições/limites por plano: **NÃO VERIFICADO**.

**PROBLEM:** Usuário não sabe por onde começar com uma tabela desconhecida; criar o primeiro dashboard do zero é caro.

**SOLUTION:** "X-ray" gera automaticamente um dashboard exploratório a partir dos campos e tipos de uma tabela/modelo (ou de um ponto de um gráfico), com navegação "Zoom out / Zoom in / Related" e botão "Save this" para promover o resultado a dashboard real.

**OBSERVE:**
- Pontos de entrada **contextuais**: menu de drill-through no gráfico ("Automatic insights…"), ícone de raio ao passar o mouse sobre tabelas no Browse Data, "X-ray this" em modelos (segundo a doc).
- O resultado já vem estruturado: título amigável, filtros úteis do contexto, bloco "Summary" de KPIs e blocos nomeados por pergunta ("How these Products are distributed").
- Painel "More X-rays" com três direções semânticas (Zoom in, Zoom out, Related): a profundidade é navegada por **relação**, não por menus.
- "Save this" (verde, primário) separa **explorar (efêmero)** de **persistir (dashboard salvo)**.
- Defaults inteligentes por tipo de dado (histograma para numérico, tempo para datas) sem configuração.
- Administradores podem desativar X-rays e personalizar sugestões na home (doc).

**INTERACTION:**
1. Clica num ponto/série do gráfico (ou passa o mouse numa tabela) e escolhe "Automatic insights…".
2. Metabase gera a página de X-ray com KPIs e gráficos.
3. Navega por "Zoom in" (um campo/dimensão) ou "Related" (outra tabela).
4. Quando gosta do resultado, clica "Save this" para criar dashboard em "Automatically generated dashboards".

**WHY IT WORKS:** Defaults gerados a partir do **modelo de dados** dão ao iniciante um ponto de partida confiável e ensinam por exemplo; salvar é uma decisão posterior e explícita.

**ADAPT TO BIWEB:** O motor de "template por tipo de campo" combina com modelo semântico em camadas: "Gerar visão inicial" a partir de uma entidade, produzindo um dashboard rascunho (Auto) que o usuário converte em Livre ao editar. Ótimo uso de IA com preview: a IA propõe, o usuário vê o rascunho e decide "Salvar".

**DO NOT COPY:** Página de rascunho que parece um dashboard final mas tem pouco controle de layout; no BIWEB o rascunho deve abrir direto no editor (com "Auto" ativo) para evitar um segundo ambiente. Não copiar nomes da doc ("Doohickey" etc.).

---

---

### REF-97 — Nielsen Norman Group / Progressive disclosure (ficha conceitual)

**IMAGES:** n/a (ficha conceitual). As únicas imagens das páginas são miniaturas de vídeo e foto de autor; não úteis.

**SOURCE:**
- https://www.nngroup.com/articles/progressive-disclosure/ — Jakob Nielsen, 3/dez/2006 (artigo clássico; lido via WebFetch).
- https://www.nngroup.com/videos/managing-visual-complexity/ — Raluca Budiu, 28/out/2022, vídeo de 5 min "3 Strategies for Managing Visual Complexity in Applications and Websites" (posicionamento previsível, hierarquia visual clara, progressive disclosure). Só resumo da página lido; **conteúdo do vídeo NÃO VERIFICADO**.

**PROBLEM:** Funcionalidades avançadas prejudicam aprendizado e aumentam erros quando competem com as essenciais.

**SOLUTION:** Mostrar inicialmente poucas opções mais importantes e oferecer um conjunto maior sob demanda, melhorando **aprendizado, eficiência e taxa de erro**. Exemplo clássico no artigo: caixa de impressão com opções básicas e diálogo secundário para avançadas.

**OBSERVE:**
- Dois elementos precisam estar certos: **divisão** entre frequente/raro e **progressão** óbvia (botão/link visível com rótulo que anuncia o que há depois). Frase-chave: "show users only a few of the most important options".
- A divisão deve ser baseada em **uso real**: tudo que é frequente fica na primeira camada; o raro vai para a segunda.
- **Mais de dois níveis** de divulgação costuma piorar a usabilidade (desorientação); se precisar de três, simplifique ou reagrupe.
- Várias telas secundárias acomodam mais recursos, mas **complicam a primeira camada**.
- Defende que priorizar recursos ajuda a formar modelos mentais melhores.
- O vídeo complementa: previsibilidade de posição e hierarquia visual são pré-requisitos da divulgação progressiva.

**INTERACTION:** (guideline) 1) Listar tarefas por frequência/importância. 2) Definir camada 1 com o essencial. 3) Mover o restante para camada 2 com ponto de entrada rotulado ("Avançado…"). 4) Evitar camada 3. 5) Medir uso e ajustar a divisão.

**WHY IT WORKS:** Reduz carga cognitiva para novatos sem tirar poder dos experts (custo: 1 clique). Os limites explícitos (≤2 níveis, rótulo claro) evitam que o padrão vire labirinto.

**ADAPT TO BIWEB:** Use como regra de projeto do inspector por schema: cada seção do schema declara `tier: essential | advanced` (máx. 2 camadas), com rótulo explícito ("Mais opções · 6"). Derive o split de telemetria de uso e do modelo mental do papel (Construtor vs Consumidor). Resumo inline do que está recolhido reduz a necessidade de abrir.

**DO NOT COPY:** O exemplo do print dialog como se "avançado" fosse sempre um diálogo separado; no BIWEB o avançado deve ser inline (seção expansível/painel lateral) para manter contexto. Ressalva: artigo de 2006; complementar com evidências de produtos modernos (REF-89…P8).

---

---

### REF-98 — IBM Carbon (Disclosures pattern) + GitHub Primer (Progressive disclosure) — guidelines de design system (ficha conceitual)

**IMAGES:**
- `p10-carbon-settings-menu` — https://s3.us-south.cloud-object-storage.appdomain.cloud/cxp-prod-payload-cms/disclosures-settings-functionality.png — fechado: botão de funil (filtro); aberto: popover "Filter" com Location / Resource group / Type e rodapé **Reset | Apply** — VERIFICADA + INSPECIONADA (HTTP 200, image/png, 1216x1558).
- `p10-carbon-one-at-a-time` — https://s3.us-south.cloud-object-storage.appdomain.cloud/cxp-prod-payload-cms/disclosure-one-at-a-time-do.png — wireframe "Do": uma única disclosure aberta (popover verde sob o ícone de engrenagem) em formulário com ícones de ajuda "?" — VERIFICADA + INSPECIONADA (HTTP 200, image/png, 576x576).


**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-98_01_p10_carbon_settings_menu`

![REF-98_01_p10_carbon_settings_menu](https://s3.us-south.cloud-object-storage.appdomain.cloud/cxp-prod-payload-cms/disclosures-settings-functionality.png)

`REF-98_02_p10_carbon_one_at_a_time`

![REF-98_02_p10_carbon_one_at_a_time](https://s3.us-south.cloud-object-storage.appdomain.cloud/cxp-prod-payload-cms/disclosure-one-at-a-time-do.png)

**SOURCE:**
- https://carbondesignsystem.com/patterns/disclosures-pattern/ — IBM Carbon Design System, página oficial do padrão (lida em out/2026; sem data na página).
- https://primer.style/product/ui-patterns/progressive-disclosure — GitHub Primer Design System, padrão "Progressive disclosure" (sem data; trata de ícones/rótulos, pouco sobre estratégia de camadas).
- Observação: a página Carbon "overflow content" também cobre "Show more" e truncamento, mas não é sobre disclosure estratégica.

**PROBLEM:** Equipes inventam controles de "mostrar mais" inconsistentes (ícones, comportamento, aninhamento), o que prejudica a previsibilidade.

**SOLUTION:** Carbon define "disclosure" como gatilho + container acionado **pelo usuário** (nunca automático), com variantes (menu de perfil, **menu de configurações/filtros** com controles interativos, combo button) e regras: **um aberto por vez**, **sem aninhar disclosures**, largura limitada (até 6 colunas), fechar com ícone no canto superior direito, e **não esconder informação crítica do fluxo**. Primer padroniza ícones: chevron (expandir/recolher), fold/unfold (código/diff), reticências (texto truncado), sempre pareados com texto quando possível e **mantendo o contexto** do usuário.

**OBSERVE:**
- Diferença Carbon: tooltips só mostram texto; **disclosures podem conter controles interativos** (filtros, configurações) — adequado a inspectors e menus de formatação.
- Popover de filtros com **Reset | Apply** no rodapé: edição em lote com saída segura (reverter/aplicar).
- Regra "só uma disclosure aberta por vez" e "nada de disclosure dentro de disclosure": limite objetivo de profundidade (convergente com NN/g).
- Gatilho sempre iniciado pelo usuário; nada de abrir automático.
- Primer: ícone **+ texto** ("Show more") melhor que texto sozinho ou ícone sozinho; não confundir reticências (truncar texto) com kebab (menu); chevron não serve para dropdown.
- Primer: princípio de **manter contexto**: evitar interações que desorientem o usuário em relação ao ponto de foco.

**INTERACTION:** (padrão) 1) Usuário aciona o gatilho (botão/ícone). 2) Container abre ancorado ao gatilho, com título/seções. 3) Usuário interage (filtra, configura) e aplica ou reseta. 4) Fecha pelo ícone ✕ ou clicando fora; abrir outro fecha o atual.

**WHY IT WORKS:** Regras simples e verificáveis (um aberto, sem aninhar, ação pelo usuário) impedem o acúmulo de camadas e garantem comportamento previsível entre telas. Conectam-se a NN/g (≤2 níveis).

**ADAPT TO BIWEB:** Incorporar essas regras como *contrato* do design system do BIWEB: popovers de configuração com Reset | Apply onde edição em lote for arriscada; seções do inspector que expandem inline (accordion) sem aninhar; apenas um painel avançado aberto por vez em contexto de widget; ícone + rótulo nos gatilhos; "Redefinir" por seção como em Reset.

**DO NOT COPY:** Valores específicos de Carbon (6 colunas, tamanhos) e a estética IBM; e a restrição "um aberto por vez" aplicada ao inspector pode atrapalhar comparação entre seções (para accordions de propriedades, permitir múltiplas seções abertas, ao contrário do popover). Primer foca em ícones de UI de código/repo, não em UI de BI.

---

---

#### Catálogo de mecanismos de progressive complexity

| Mecanismo | Como funciona | Produtos que usam | Quando usar | Risco |
|---|---|---|---|---|
| Toggle simples/avançado de **modo** (global ou por seção) | Segmented control no cabeçalho alterna a representação (Visual/Code, Agent/Form, Design/Dev) | Grafana Builder\|Code (P3), Elastic "Switch to classic" (P1), Figma Dev Mode (P5), Airbyte Agent\|Form (P7) | Quando existem dois públicos/habilidades sobre o mesmo objeto | Modos divergentes (perda de dados na troca) e duplicação de lógica |
| **Builder ↔ code sincronizado** com aviso | O código é gerado do builder e vice-versa; alerta se não for representável | Grafana (P3), GitHub filtros↔query (P6) | Linguagem de consulta/expressão (BEL) | Round-trip incompleto; usuário "preso" |
| **Código somente leitura / "View SQL"** | Painel ao lado mostra o código real, sem editar | Metabase (P2), Figma List\|Code (P5) | Dar transparência sem expor risco | Conversão unidirecional que bloqueia o retorno (Metabase) |
| **Explain / tooltip "por que isto?"** | Toggle que traduz cada parte do código em frase | Grafana Explain (P3) | Ensinar linguagem e depurar | Texto genérico e longo; manter curto e acionável |
| **Preview por passo / estado de preview** | Cada etapa mostra resultado parcial, descartável | Metabase notebook (P2) | Pipelines de transformação, filtros encadeados | Preview caro (consultas pesadas); limitar linhas |
| **Passos opcionais como botões-chip** | Passos só aparecem ao serem adicionados | Metabase (P2) | Muitas etapas raras (join, sort, limit) | Descoberta: usuários não sabem que existem |
| **Seção "Options" recolhida com resumo inline** | Bloco fechado exibe valor atual em uma linha | Grafana Options (P3), Figma "4 more" (P5) | Parâmetros secundários com bons defaults | Resumo desatualizado ou ambíguo |
| **Navegação guiada (stepper/breadcrumb) queryless** | Pílulas conectadas indicam etapa e próximo passo | Grafana Drilldown (P4) | Investigação, exploração sem consulta | Fluxo rígido; sair dele precisa de escape hatch ("View in Explore") |
| **Escape hatch para modo avançado** | Atalho explícito para o editor completo no ponto onde o guiado termina | Grafana "View in Explore" (P4), Airbyte "Form" (P7) | Sempre que houver modo guiado | Ocultar o atalho vira frustração |
| **Defaults inteligentes / geração automática** | Sistema escolhe visualização/agregação por tipo de dado | Lens (P1), Metabase X-ray (P8), Drilldown (P4) | Primeiro contato, tabelas desconhecidas | Defaults errados parecem "verdade"; permitir ver o porquê |
| **Sugestões alternativas** | Botão "Suggestions" apresenta variantes da mesma configuração | Lens (P1) | Escolha de visual a partir de campos | Poluir o canvas; limitar a 3–6 |
| **Rascunho efêmero → "Save this"** | Exploração não persiste até ação explícita | Metabase X-ray (P8), Lens/Discover (P1) | Exploração e IA que propõe | Perder trabalho se não houver autosave temporário |
| **Modo por audiência (remoção, não só colapso)** | O modo troca barras e painéis inteiros | Figma Dev Mode (P5) | Papéis distintos no mesmo arquivo | Duplicar documentação; confusão sobre onde editar |
| **Query textual ↔ facetas UI ↔ URL** | Um estado serializável editado de duas formas | GitHub (P6) | Filtros, views salvas, compartilhamento | Sintaxe oculta sem content assist |
| **Assistente conversacional com saída para formulário** | IA pergunta o essencial; formulário permanece | Airbyte (P7) | Configuração com muitos campos | IA como obrigatória; segredos expostos |
| **Disclosure por gatilho com Reset \| Apply** | Popover ancorado com controles e saída segura | Carbon (P10) | Menus de filtro/configuração | Aninhamento e múltiplos abertos |
| **Limite de ≤2 camadas** | Regra de projeto | NN/g (P9), Carbon (P10) | Sempre | Esconder demais e quebrar descoberta |

#### Candidatos a princípios

1. **Complexity in the engine, simplicity on the surface:** o motor (consulta ES, PromQL, SQL) permanece único; a superfície oferece degraus. (P1: Lens/ES|QL; P2: View SQL; P3: Builder\|Code.)
2. **Um objeto, duas (ou três) representações sincronizadas:** Visual ↔ código ↔ explicação operam sobre o mesmo estado. (P3 "Each mode is synchronized"; P5 List\|Code; P6 facetas↔query↔URL.)
3. **Nenhum modo avançado é beco:** todo modo guiado tem escape hatch claro para o completo, e vice-versa. (P4 "View in Explore"; P7 "Select 'Form'…"; P1 "Switch to classic".)
4. **Mostrar o código sem obrigar a escrevê-lo:** transparência somente-leitura é o primeiro degrau do avançado. (P2 View SQL; P5 Code view.)
5. **Default visível e editável:** o valor padrão aparece na própria superfície (ex.: `is:issue is:open`), nunca em estado oculto. (P6.)
6. **Um mínimo viável antes do resto:** perguntar/mostrar primeiro o essencial; o restante aparece sob demanda. (P7 "duas informações essenciais"; P9 split frequente/raro.)
7. **Detalhe sob demanda no ponto exato:** tooltips/popovers no objeto (exemplar → View trace; descrição de operação), não painéis distantes. (P3 descrição de operação; P4 tooltip de exemplar.)
8. **Resumo inline do que está recolhido:** o bloco fechado diz o que contém. (P5 "4 more"; P3 Options; P1 barra "5 lines · LIMIT 10 rows".)
9. **Preview antes de comprometer:** cada passo/proposta mostra resultado parcial e permite descartar; persistir é decisão explícita. (P2 Preview; P8 "Save this".)
10. **Defaults inteligentes derivados do modelo de dados, com alternativas:** o sistema propõe e o usuário pode trocar. (P1 Suggestions; P8 X-ray; P4 visualização ótima por tipo.)
11. **IA como modo de preenchimento, não como dependência:** a IA propõe, o resultado é sempre o objeto editável normal; segredos fora do contexto. (P7.)
12. **Limite de profundidade ≤2 níveis e uma ação do usuário para abrir:** sem aninhar disclosures; gatilho iniciado pelo usuário. (P9, P10.)
13. **O modo remove o irrelevante por papel:** quando o público muda, esconder ferramentas inteiras (não só recolher) reduz ruído. (P5.)
14. **Navegar por relação, não por menu:** "Zoom in / Zoom out / Related" e steppers dão o próximo passo provável. (P8, P4.)

#### Anti-patterns

- **Conversão unidirecional silenciosa** do builder para código (sem volta nem aviso prévio): usuário perde o caminho simples. (Metabase "Convert to SQL", P2.)
- **Builder que não representa a consulta complexa sem avisar** antes da troca de modo. (P3 mitiga com aviso; evitar o oposto.)
- **Mais de dois níveis de disclosure** ou disclosure dentro de disclosure. (P9, P10.)
- **Esconder informação crítica do fluxo** dentro de disclosures (Carbon proíbe). (P10.)
- **Modos que duplicam interfaces com capacidades divergentes** (vários editores no mesmo produto). (P1: Lens/Discover/ES|QL; P4: quatro apps Drilldown.)
- **IA como único caminho** de configuração, sem formulário ou BEL equivalente. (P7 evita; documentar.)
- **Defaults escondidos** (filtros aplicados que o usuário não vê). (P6 evita deixando o default na barra.)
- **Sintaxe só descobrível via documentação** (qualificadores sem autocomplete). (P6: depende de content assist.)
- **Gatilhos só com ícone ou só com texto ambíguo**; ícone igual para ações diferentes (chevron em dropdown, reticências × kebab). (P10/Primer.)
- **Auto-gerar páginas finais sem rota de edição** (rascunho que não vira editável). (P8.)
- **Resumo inline que mente** (valor recolhido desatualizado). (Risco geral; sem exemplo observado.)


---

## 16 — Report Ideas (demonstration reports)

**Pergunta da área:** que dashboards reais inspiram relatórios demonstrativos adicionais, e quais demonstram **capacidades realmente diferentes** da plataforma?
**Conclusão resumida:** conjunto mínimo recomendado, em ordem de impacto: Network Intelligence → Incident Intelligence (com painel de dependência) → Anomaly Explorer → SLA & Risk Monitor → Customer Behavior → Street Intelligence 3D (com replay temporal). Executive Commercial é redundante com o protótipo de varejo atual; Historical Replay funciona melhor como controle transversal.

### REF-99 — Kentik Map (Kentik Network Observability) (relatório BIWEB relacionado: Network Intelligence)
**IMAGES:**
- kentik-map-problems — https://images.ctfassets.net/6yom6slo28h2/4Paz01GG6V7ZT8DvDVbn9B/783b26b188ec1f9d8ae14d6c6673c282/kentik-map-see-your-network.png — "Kentik Map com três blocos (Clouds, Internet, On Prem) e popover '18 problemas em 6 sites'" (2450x1587) — VERIFICADA (200, image/png; inspecionada)
- kentik-map-site-drill — https://images.ctfassets.net/6yom6slo28h2/1GSrO9auAq00tOeviRokHu/8f7906ab03618eee6b7c11ec665fbc2b/map-azure-and-ashburn-site-view.png — "Seleção de Azure/Ashburn: caminho destacado no mapa + drawer Site Details (Traffic, Devices, Health)" (2500x1405) — VERIFICADA (200, image/png; inspecionada)

**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-99_01_kentik_map_problems`

![REF-99_01_kentik_map_problems](https://images.ctfassets.net/6yom6slo28h2/4Paz01GG6V7ZT8DvDVbn9B/783b26b188ec1f9d8ae14d6c6673c282/kentik-map-see-your-network.png)

`REF-99_02_kentik_map_site_drill`

![REF-99_02_kentik_map_site_drill](https://images.ctfassets.net/6yom6slo28h2/1GSrO9auAq00tOeviRokHu/8f7906ab03618eee6b7c11ec665fbc2b/map-azure-and-ashburn-site-view.png)

**SOURCE:** https://www.kentik.com/product/core/ (página de produto, imagens oficiais) e https://kb.kentik.com/docs/kentik-map (doc oficial; front matter indica atualização em 2025-11-19). Data da captura das imagens: NÃO VERIFICADA (eixo mostra 29 mai–19 jun, sem ano). Observação: as imagens dentro do próprio KB usam URLs Document360 assinadas e temporárias; por isso uso as do site de produto (ctfassets, estáveis).
**PROBLEM:** Engenheiros de rede precisam entender como nuvens, internet e sites on-prem se conectam e onde o tráfego ou a saúde estão degradados, sem montar consultas.
**SOLUTION:** Um "mapa" que não é geográfico: três zonas fixas (Clouds, Internet, On Prem) com fluxos agregados entre elas, um contador de problemas no topo e um drawer lateral que abre os detalhes só quando se seleciona um nó. A complexidade (milhares de interfaces) fica atrás de um desenho de 3 blocos.
**OBSERVE:**
- Barra superior mínima: nome do módulo, `Filters (0)`, `Time Range (UTC)` com valor legível ("Last 2 weeks"), à direita o badge de saúde com contagem (coração + "18") e uma escala de cor contínua 0 → >100 Gbits/s.
- Três blocos cinza-claros com título: Clouds (Amazon, Google, Azure, IBM como ícones), Internet (grade de tiles quadrados, um por rede de origem, coloridos de azul-escuro a rosa conforme tráfego; abas "Origin Networks / Providers / Next-Hop Networks") e On Prem (abas "Weather Map / Topology", arcos radiais com sites como segmentos verdes ou vermelhos).
- Valores agregados escritos sobre as arestas entre blocos (ex.: "467 Mbps ▶ / ◀ 2145 Mbps"), em vez de rótulos em cada linha.
- Popover do badge: frase em linguagem natural ("Your network has 18 problems across 6 sites") com lista de 3 causas e botão `View Problems`.
- Na segunda imagem, o caminho selecionado vira linha azul destacada e o resto esmaece; no drawer: Site Details (tipo, endereço), seções recolhíveis Internal Map Details, Traffic (seletores + série 30 dias + tabela de aplicações), Devices (badge "4 Critical"), Health (badge "6 Critical", gráfico "Ingress Interface Capacity" com linha de capacidade e valor 241% em vermelho).
**INTERACTION:** Pela doc e pelo screenshot: blocos expansíveis/colapsáveis (ícone no canto), seleção de nó destaca o caminho e abre o drawer Details, alternância Weather Map/Topology, atalho "View Problems" a partir do badge. O comportamento exato de hover/animação NÃO VERIFICADO (só imagens estáticas).
**WHY IT WORKS:** Abstração fixa (3 zonas) que um leigo entende; problema resumido em 1 número + 1 frase; detalhe sob demanda no drawer; cor reservada para tráfego (escala) e estado (vermelho/verde), nunca decorativa.
**ADAPT TO BIWEB:** Demonstra o primeiro relatório (Network Intelligence) com topologia hierárquica + mapa de calor de utilização + painel lateral, alimentado por modelo semântico (site → dispositivo → interface) e por insights determinísticos (a frase "N problemas em M sites" é gerável por regra, sem IA). Capacidade distinta: visual não geográfico/topológico com agregação por camada e drill progressivo, mais threshold sobre escala contínua.
**DO NOT COPY:** Marca/ícones de AWS/Google/Azure/IBM, o nome "Weather Map", a paleta roxo-rosa de Kentik e o desenho radial exato; não replicar a nomenclatura de produto de rede (ASN, BGP) se o dataset for outro.

---

---

### REF-100 — Dynatrace Problems app (feed + detalhe do problema) (relatório BIWEB relacionado: Incident Intelligence)
**IMAGES:**
- dynatrace-problems-feed — https://dt-cdn.net/images/problem-feed-latest-3840-3cde469692.png — "Problems app: filtros por faceta à esquerda, histograma de problemas no tempo e tabela de problemas" (3840x2160) — VERIFICADA (200, image/png; inspecionada)
- dynatrace-problem-detail — https://dt-cdn.net/images/problems-details-view-page-1920-3d5f2bb781.png — "Detalhe de problema: tiles de impacto, entidades afetadas com causa raiz e evento selecionado" (1920x934) — VERIFICADA (200, image/png; inspecionada)

**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-100_01_dynatrace_problems_feed`

![REF-100_01_dynatrace_problems_feed](https://dt-cdn.net/images/problem-feed-latest-3840-3cde469692.png)

`REF-100_02_dynatrace_problem_detail`

![REF-100_02_dynatrace_problem_detail](https://dt-cdn.net/images/problems-details-view-page-1920-3d5f2bb781.png)

**SOURCE:** https://docs.dynatrace.com/docs/dynatrace-intelligence/davis-problems-app (doc oficial, consultada em 2026-10-07). Datas visíveis nas imagens: feed com problemas de 1–4 set 2026 (rótulos em polonês, "wrz" = set); detalhe com problema de 22 dez 2025. Ou seja, UI atual.
**PROBLEM:** Em ambientes grandes, centenas de alertas viram ruído; o operador precisa saber o que está ativo, o que é causa e o que é consequência.
**SOLUTION:** Alertas correlacionados em "problemas", com causa raiz e impacto calculados pela plataforma; o feed prioriza triagem (filtros + histograma + tabela) e o detalhe organiza a investigação em tiles de impacto, entidades afetadas e eventos.
**OBSERVE:**
- Feed: coluna esquerda de filtros por faceta com radio/checkbox (Status, Category, Impact, Severity); cabeçalho com contagem em chip vermelho "14 active / 26"; histograma por tempo (barras vermelhas = ativos, cinza = total) que também serve de contexto temporal; barra de filtro por texto + seletor "Last 2 hours" + setas + Refresh.
- Tabela do feed: ID, Name, Status (chip Active/Closed), Category (ícone + texto), Affected, Affected entity (chip com ícone), Root cause (preenchido só quando conhecido), Started, Duration, Impact; "7 columns hidden" e exportar CSV; faixa vermelha na borda esquerda das linhas ativas.
- Detalhe: título + chips (Closed, ID, categoria "Slowdown", início e duração); 8 tiles de contagem (Affected frontends 1, services 7, infrastructure, synthetic monitors, users, sessions, business flows, Events 46) com "—" quando não há impacto; abas Overview/Deployment/Events/Logs/Troubleshooting.
- Na aba Events: lista mestre-detalhe: à esquerda "Affected entities" com a linha raiz marcada "(Root cause)" em vermelho; à direita descrição do evento selecionado e gráfico com faixa vermelha no intervalo do problema; botões "Explain problem" (IA) e "Send" no topo.
**INTERACTION:** Clicar numa linha abre o detalhe em tela cheia; clicar em entidade troca o painel direito; filtros por faceta e por texto combinam; Explain problem aciona assistente de IA (comportamento detalhado NÃO VERIFICADO além do botão visível).
**WHY IT WORKS:** Hierarquia clara triagem → causa → evidência; tiles zerados deixam explícito o que não foi afetado; a causa raiz é um rótulo na lista, não uma conclusão escondida.
**ADAPT TO BIWEB:** Base do relatório Incident Intelligence: feed filtrável de eventos/alertas derivados de regras, histograma temporal, painel de detalhe com entidades afetadas e evento com banda de anomalia. Demonstra insights/anomalias determinísticos + "IA com evidências" (botão Explain que cita os eventos listados) e cross-filtering sobre modelo semântico (categoria, impacto, severidade).
**DO NOT COPY:** Terminologia/IDs "P-26…", ícones de entidades Dynatrace, o nome "Davis"; não prometer causa raiz automática sem regras de topologia (BIWEB só pode afirmar o que as regras e o modelo permitem).

---

---

### REF-101 — Datadog Service Catalog / Service Map (relatório BIWEB relacionado: Dependency & Impact)
**IMAGES:**
- datadog-service-map — https://docs.dd-static.net/images/tracing/visualization/services_map/service_map_overview_3.3b80f55bde2fa4baefdb2bdbdb92d7fb.png?fit=max&auto=format — "Service Catalog em modo Map: grafo de serviços agrupado por time/cluster, com painel lateral do serviço web-store" (2754x1340) — VERIFICADA (200, image/png; inspecionada)

**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-101_01_datadog_service_map`

![REF-101_01_datadog_service_map](https://docs.dd-static.net/images/tracing/visualization/services_map/service_map_overview_3.3b80f55bde2fa4baefdb2bdbdb92d7fb.png?fit=max&auto=format)

**SOURCE:** https://docs.datadoghq.com/tracing/services/services_map/ (doc oficial, consultada em 2026-10-07). Data da captura: NÃO VERIFICADA; a imagem exibe aviso de "novo layout do Service Map", sugerindo UI recente.
**PROBLEM:** Descobrir "o que depende de quê" e qual o raio de impacto quando um serviço degrada.
**SOLUTION:** Grafo de dependências com cor de estado nos nós (anel vermelho/verde segundo monitores), agrupamento por equipe/cluster e painel lateral que agrega, para o nó escolhido, monitores, deploys, erros, SLOs e incidentes.
**OBSERVE:**
- Barra de contexto no topo: alternância `List | Map`, busca, filtros `env:prod`, `cluster-name:*` e frase "Showing 116 APM services across 19 teams".
- Facetas à esquerda com contadores (Service Origin, Telemetry Type, Type, Infra Type), checkboxes marcadas por padrão.
- Grafo: nós circulares com ícone de tipo (engrenagem, globo, banco), anel vermelho = em alerta, verde = ok; setas direcionais finas; polígonos cinza agrupando serviços do mesmo time; bolhas de cluster com contagem (3, 5, 48) para colapsar nós periféricos.
- Painel direito "web-store": barra segmentada de monitores (ALERT 41 / WARN 9 / NO DATA 9 / OK 113), Team, Contacts, Source code; 4 tiles (Deployments, Error Tracking "Issues: 316", SLOs "22 BREACHED / 9 OK", Incidents "24 ACTIVE") e popover com lista de incidentes por severidade; abaixo gráficos Requests/Errors e Latency (p50–p99).
**INTERACTION:** Hover/seleção destaca vizinhos; clique abre o painel lateral; filtros por faceta reduzem o grafo; clusters expandem (doc lista inspect menu e collapsed view). Animações exatas NÃO VERIFICADAS.
**WHY IT WORKS:** O grafo mostra só estado e relação; as métricas ficam no painel; contagens agregadas (monitores, SLOs, incidentes) dão contexto de risco sem abrir outras telas.
**ADAPT TO BIWEB:** Introduz o widget de grafo/dependência (ausente na lista atual de widgets) e a ideia de "blast radius": selecionar um nó e ver quem é afetado. Capacidade distinta: relações do modelo semântico (entidade → entidade) como visualização, com painel de detalhe reutilizando KPI/linha/tabela existentes. Recomendo implementá-lo como painel dentro de Incident Intelligence, não como relatório separado (ver redundâncias).
**DO NOT COPY:** Layout force-directed ilegível acima de ~100 nós (a própria imagem tem sobreposição de rótulos); ícones/cores Datadog; a densidade de 4 facetas + 4 tiles + 3 gráficos no painel.

---

---

### REF-102 — Datadog Watchdog Alert + Incident Management (relatório BIWEB relacionado: Incident Intelligence / Anomaly Explorer)
**IMAGES:**
- datadog-watchdog-alert — https://docs.dd-static.net/images/watchdog/alerts/alerts_overview.db3ef881bd05e9f274be666fe5bcf461.png?auto=format&fit=max&w=850 — "Cartão de alerta Watchdog: erro elevado no endpoint send-sms do sms-service; numeração 1–6 explica cada parte" (2898x936) — VERIFICADA (200, image/png; inspecionada). Observação: a URL com `?fit=max&auto=format` também responde 200; usei a forma do doc.
- datadog-incident-overview — https://docs.dd-static.net/images/incident_response/incident_management/investigate/incidents_overview_tab.be98c713078bba11adbf0e3769b54d69.png?fit=max&auto=format — "Detalhe de incidente IR-4328: status, severidade, integrações, aba Overview" (2908x1452) — VERIFICADA (200, image/png; inspecionada)

**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-102_01_datadog_watchdog_alert`

![REF-102_01_datadog_watchdog_alert](https://docs.dd-static.net/images/watchdog/alerts/alerts_overview.db3ef881bd05e9f274be666fe5bcf461.png?auto=format&fit=max&w=850)

`REF-102_02_datadog_incident_overview`

![REF-102_02_datadog_incident_overview](https://docs.dd-static.net/images/incident_response/incident_management/investigate/incidents_overview_tab.be98c713078bba11adbf0e3769b54d69.png?fit=max&auto=format)

**SOURCE:** https://docs.datadoghq.com/watchdog/alerts/ e https://docs.datadoghq.com/service_management/incident_management/investigate/ (docs oficiais, consultadas em 2026-10-07). Datas: incidente declarado "Oct 23, 2024" (visível na imagem); alerta "Apr 26" sem ano.
**PROBLEM:** Transformar um desvio estatístico em algo acionável: o que aconteceu, desde quando, o que mais é afetado e quem responde.
**SOLUTION:** O cartão de alerta Watchdog descreve a anomalia em uma frase, mostra o gráfico com a janela destacada e um bloco de IMPACT; quando vira incidente, a tela organiza status, severidade, comandante, linha do tempo e integrações.
**OBSERVE:**
- Cartão de alerta (doc enumera as 6 partes): status ONGOING (chip vermelho), linha do tempo "Since Apr 26, 11:00 am · 3h", mensagem em frase com negrito nos entes ("Error rate has been up on POST /send-sms in sms-service with 2 other services impacted"), gráfico de taxa de erro com retângulo rosa na janela ativa, tag `env:prod`, bloco amarelo IMPACT ("3 services incl. notification-service").
- Incidente: chips STABLE (laranja) e SEV-4 (Low), "Declared 6 hours ago", botões de integração (Slack, Zoom, ServiceNow, Statuspage, Generate Postmortem), abas Overview/Timeline/Remediation/Response Team/Notifications.
- Coluna esquerda: mini-linha do tempo DECLARED → STABLE com "Time to mitigation: 15 minutes", últimas notificações, tarefas pendentes. Centro: What happened / Impacts / Why it happened. Direita: Incident Commander, Responders, Attributes (Teams, Services, Application, Availability Zone).
- Campos vazios com placeholder ("Select values") em vez de ocultos: o formulário é a própria página.
**INTERACTION:** Clicar no cartão abre painel de detalhes (doc); status e severidade aparecem como dropdowns na imagem do incidente. Edição inline e demais comportamentos NÃO VERIFICADOS.
**WHY IT WORKS:** Anomalia em linguagem natural + janela destacada + impacto; incidente com ciclo de vida visível e métricas de resposta (time to mitigation) calculadas.
**ADAPT TO BIWEB:** Alimenta Incident Intelligence e Anomaly Explorer: cartões de insight determinístico (frase gerada por regra + gráfico com janela + escopo por tags + bloco de impacto) e uma tela de caso com linha do tempo. Capacidade distinta: insights com evidência anexada (gráfico + entidades) e transição de insight para caso/workflow (pipelines/DAG).
**DO NOT COPY:** Rótulos/escala de severidade SEV-1…4 e integrações específicas (Zoom/ServiceNow/Statuspage); "Watchdog" como marca; o amarelo de IMPACT idêntico.

---

---

### REF-103 — Elastic Machine Learning: Anomaly Explorer + Single Metric Viewer (relatório BIWEB relacionado: Anomaly Explorer)
**IMAGES:**
- elastic-anomaly-swimlane — https://www.elastic.co/docs/explore-analyze/images/machine-learning-influencers.png — "Top influencers (esquerda) e Anomaly timeline em swimlanes por categoria (direita)" (2282x934) — VERIFICADA (200, image/png; inspecionada)
- elastic-single-metric — https://www.elastic.co/docs/explore-analyze/images/machine-learning-detailed-single-metric.png — "Single Metric Viewer: série com banda esperada, marcadores de anomalia e tabela com explicação" (2722x2026) — VERIFICADA (200, image/png; inspecionada)

**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-103_01_elastic_anomaly_swimlane`

![REF-103_01_elastic_anomaly_swimlane](https://www.elastic.co/docs/explore-analyze/images/machine-learning-influencers.png)

`REF-103_02_elastic_single_metric`

![REF-103_02_elastic_single_metric](https://www.elastic.co/docs/explore-analyze/images/machine-learning-detailed-single-metric.png)

**SOURCE:** https://www.elastic.co/docs/explore-analyze/machine-learning/anomaly-detection/ml-ad-view-results e .../ml-ad-explain (docs oficiais, consultadas em 2026-10-07). Datas visíveis nas imagens: jul/2025 (eixo 2025-07-09…17 e "July 19th 2025") => UI recente. Dados da amostra e-commerce do Kibana (categorias de roupa).
**PROBLEM:** Em muitas séries, achar onde e quando o comportamento fugiu do normal, e entender por que a plataforma considera isso anômalo.
**SOLUTION:** Duas visões encadeadas: um mapa de calor temporal (swimlane) que prioriza onde olhar, e um visualizador de série única com banda do esperado, marcadores e uma tabela que explica cada anomalia.
**OBSERVE:**
- Swimlane: linhas "Overall" + uma por categoria (ordenadas por pontuação máxima: "Sorted by max anomaly score"), células por intervalo de tempo coloridas por severidade em 5 faixas (0–3, 3–25, 25–50, 50–75, 75–100) com legenda no topo; seletor `View by`; linha "Annotations".
- Painel "Top influencers": barras horizontais com badge numérico colorido (93 vermelho, 35/29/28 amarelo, 24/11 azul) e ícones de filtrar/excluir em cada valor.
- Single Metric: linha preta (real) sobre banda cinza (esperado); círculos azuis/vermelhos nos pontos anômalos (tamanho e cor = severidade); mini-overview abaixo com brush para zoom; "Zoom: auto 12h 1d 1w".
- Tabela "Anomalies": Time, Score (ponto colorido + número), Detector, Found for, Influenced by, Actual, Typical, Description ("2x higher"); linha expandida com "Details on highest severity anomaly" e "Anomaly explanation" (Single bucket impact em 5 quadrados azuis, High variance interval).
**INTERACTION:** Clicar numa célula do swimlane filtra o viewer e a tabela; `+/−` em influenciadores adiciona/exclui filtro; brush no overview muda a janela; expandir linha mostra a explicação (doc e screenshot). Comportamento fino NÃO VERIFICADO.
**WHY IT WORKS:** O swimlane responde "onde olhar"; a banda esperada responde "o que é normal"; a tabela mostra Actual vs Typical em números, tornando a anomalia auditável.
**ADAPT TO BIWEB:** O Anomaly Explorer demonstra a capacidade de insights/anomalias com evidência: matriz de calor (widget heatmap/matriz já previstos) + série com banda + tabela Actual vs Typical. Como o BIWEB usa anomalias determinísticas, a banda pode vir de mediana móvel/MAD ou sazonalidade simples, e a "explicação" listar as regras acionadas, sem ML.
**DO NOT COPY:** O score 0–100 de "probabilidade" (exige modelo estatístico real) e a terminologia ML (influencers, bucket); os rótulos de categoria de varejo dos exemplos.

---

---

### REF-104 — Datadog Host Map (relatório BIWEB relacionado: Capacity & Saturation)
**IMAGES:**
- datadog-host-map — https://docs.dd-static.net/images/infrastructure/hostmap/host-map-landing.9492cfb845cb2ec1b62ecb4b57c72809.png?fit=max&auto=format — "Host Map: hosts agrupados por availability zone e coloridos por uso de CPU" (2550x1254) — VERIFICADA (200, image/png; inspecionada)

**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-104_01_datadog_host_map`

![REF-104_01_datadog_host_map](https://docs.dd-static.net/images/infrastructure/hostmap/host-map-landing.9492cfb845cb2ec1b62ecb4b57c72809.png?fit=max&auto=format)

**SOURCE:** https://docs.datadoghq.com/infrastructure/hostmap/ (doc oficial, consultada em 2026-10-07; versão .md acessível). Captura mostra "May 7" sem ano: data NÃO VERIFICADA, UI atual (consultas sugeridas e recurso/secundário).
**PROBLEM:** Ver, de uma vez, a saturação de milhares de recursos e achar quais grupos estão perto do limite.
**SOLUTION:** Cada recurso é um hexágono; a cor codifica uma métrica (fill by), o agrupamento por tag cria "ilhas" e a pergunta é formulada em linguagem natural ("What is the CPU usage across my infrastructure?").
**OBSERVE:**
- Barra de contexto: título "Host Map ▾", seletor de consulta com pergunta pronta, janela "15m + intervalo" à direita.
- Linha de controles com rótulos flutuantes: `Main resource` (Host), `Fill by` (CPU usage) com escala verde → laranja e extremos numéricos (0.065% – 98.05%), `Group by` (tags.availability-zone), `Filter`, botão `Edit`.
- Canvas: retângulos com fundo pastel e nome + contagem ("us-east-1b 49"), hexágonos dentro; cores semafóricas só nos extremos (laranja-vermelho alto), verde claro para o normal para reduzir ruído.
- Controles de zoom verticais à direita (+, −, ajustar, engrenagem). Doc: Main/Secondary resource (Host, Pod, Container, Cluster), `Fill by`, `Size by`, vários `Group by`.
**INTERACTION:** Clique em hexágono abre painel do recurso; zoom e filtro; consultas salvas/sugeridas (doc). O fluxo exato do painel NÃO VERIFICADO.
**WHY IT WORKS:** Troca-se "tabela de 1.000 linhas" por um mapa de calor onde o outlier se vê pela cor; os controles são quatro verbos (recurso, preencher, agrupar, filtrar).
**ADAPT TO BIWEB:** Demonstra o conceito de "fill by / group by / size by" aplicado ao modelo semântico (qualquer dimensão como agrupamento, qualquer medida como cor) com threshold sobre escala contínua. Na prática, uma variante do widget heatmap/treemap; a projeção de esgotamento (ver REF-106) completa o relatório Capacity & Saturation. É redundante com Network Intelligence se ambos mostrarem apenas utilização atual (ver matriz).
**DO NOT COPY:** O hexágono como forma única (identidade visual do produto Datadog) e as pastilhas pastel arbitrárias por grupo que aumentam ruído sem codificar dados.

---

---

### REF-105 — Elastic Observability SLOs (lista + detalhe) (relatório BIWEB relacionado: SLA & Risk Monitor)
**IMAGES:**
- elastic-slo-list — https://www.elastic.co/docs/solutions/images/observability-slo-dashboard.png — "Página SLOs com cartões: valor observado vs meta, sparkline e budget remaining" (1102x815) — VERIFICADA (200, image/png; inspecionada)
- elastic-slo-detail — https://www.elastic.co/docs/solutions/images/serverless-slo-detailed-view.png — "Detalhe de SLO: burn rate com limiares, SLI histórico e error budget burn down" (2940x2070) — VERIFICADA (200, image/png; inspecionada)

**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-105_01_elastic_slo_list`

![REF-105_01_elastic_slo_list](https://www.elastic.co/docs/solutions/images/observability-slo-dashboard.png)

`REF-105_02_elastic_slo_detail`

![REF-105_02_elastic_slo_detail](https://www.elastic.co/docs/solutions/images/serverless-slo-detailed-view.png)

**SOURCE:** https://www.elastic.co/docs/solutions/observability/incident-management/service-level-objectives-slos (doc oficial, consultada em 2026-10-07). AVISO: a imagem de detalhe é antiga (datas visíveis "Oct 12, 2023", "Burn rate — Technical preview"); a de lista não tem data visível (botão "Tell us what you think" indica fase beta). UI pode ter mudado.
**PROBLEM:** Comunicar, a quem não é especialista, se um compromisso de nível de serviço está em risco e com que velocidade o orçamento de erro está sendo consumido.
**SOLUTION:** Cada SLO vira um cartão com 3 números (observado, meta, orçamento restante), status por cor e sparkline; o detalhe abre burn rate com limiares múltiplos, histórico e burn-down.
**OBSERVE:**
- Lista: barra superior com busca, filtros `Status` e `Tags`; título + "Create SLO"; "Showing 1–4 of 4 SLOs", ordenação ("Sort by SLO status"), agrupamento ("Group by None") e alternador de visualização (grade, lista, tabela compacta).
- Cartão: nome (link), badges "Violated" (vermelho) / "Healthy" (verde) / "1 alert", tags e janela ("7 days", "30 days"); à direita o número grande ("78.672%" vermelho, "85% target") com sparkline e o orçamento restante ("-42%") com sparkline em área.
- Detalhe: abas Overview/Alerts (badge 0); linha de metadados (Observed value 96.916% com objetivo 99%, Indicator type, Time window "30 days rolling", Budgeting method).
- Painel Burn rate: seletor de janela 1h/6h/24h/72h, caixa verde "Acceptable value … Threshold is 14.4x · 1.06x" e gráfico com linhas horizontais vermelhas nos limiares (14.4x, 6x, 3x, 1x).
- Historical SLI (30 dias) com objetivo tracejado e Error budget burn down ("-208.42% Remaining").
**INTERACTION:** Ordenar/agrupar/filtrar a lista; alternar janela do burn rate; clicar no cartão abre o detalhe; alertas por limiar. Detalhes de hover NÃO VERIFICADOS.
**WHY IT WORKS:** O mesmo trio (observado/meta/orçamento) em todo cartão permite varrer 50 SLOs rápido; texto de interpretação ("no risk of error budget exhaustion") traduz o gráfico.
**ADAPT TO BIWEB:** Relatório SLA & Risk Monitor: cartões KPI com meta (threshold), sparkline, orçamento restante e lista ordenável por status; demonstra regras de threshold e alertas determinísticos sem precisar de mapa. Esforço baixo, sobretudo com widgets existentes (KPI, linha, tabela).
**DO NOT COPY:** Terminologia SLI/SLO se o público for negócio (usar "meta de SLA", "folga"); o botão de feedback beta; a escala de múltiplos de burn (14.4x/6x/3x) é convenção SRE específica.

---

---

### REF-106 — Honeycomb SLO detail view (relatório BIWEB relacionado: SLA & Risk Monitor)
**IMAGES:**
- honeycomb-slo-detail — https://mintcdn.com/honeycomb/43K0N5kGXUhKPs19/_assets/images/slos/slo-fullscreen-display.png?fit=max&auto=format&n=43K0N5kGXUhKPs19&q=85&s=33b2c40a768e2c2689d10ae1129ced1e — "SLO 'User Latency': burn alerts, Budget Burndown, Historical Compliance e BubbleUp" (1840x1626) — VERIFICADA (200, image/png; inspecionada)
- honeycomb-exhaustion — https://mintcdn.com/honeycomb/43K0N5kGXUhKPs19/_assets/images/slos/slo-exhaustion-prediction.png?fit=max&auto=format&n=43K0N5kGXUhKPs19&q=85&s=65bcc82760d3faae70210509b27b765d — "Previsão de esgotamento: interpolação (1h passada) e extrapolação (4h) com marcador 'Predicted exhaustion'" (1712x542) — VERIFICADA (200, image/png; inspecionada)

**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-106_01_honeycomb_slo_detail`

![REF-106_01_honeycomb_slo_detail](https://mintcdn.com/honeycomb/43K0N5kGXUhKPs19/_assets/images/slos/slo-fullscreen-display.png?fit=max&auto=format&n=43K0N5kGXUhKPs19&q=85&s=33b2c40a768e2c2689d10ae1129ced1e)

`REF-106_02_honeycomb_exhaustion`

![REF-106_02_honeycomb_exhaustion](https://mintcdn.com/honeycomb/43K0N5kGXUhKPs19/_assets/images/slos/slo-exhaustion-prediction.png?fit=max&auto=format&n=43K0N5kGXUhKPs19&q=85&s=65bcc82760d3faae70210509b27b765d)

**SOURCE:** https://docs.honeycomb.io/reference/honeycomb-ui/slos/slo-detail-view e https://docs.honeycomb.io/notify/slos/monitor (docs oficiais, consultadas em 2026-10-07). Datas visíveis: "edited Sep 26, 2025" e janela Dec 8–9 2025 => UI atual (2025).
**PROBLEM:** Prever quando um orçamento de erro vai acabar e descobrir o que difere entre eventos que cumprem e que falham.
**SOLUTION:** Tela de SLO com status de alertas por tipo (tempo de esgotamento e taxa de orçamento), burndown, conformidade histórica e uma seção de investigação (BubbleUp) que compara dimensões entre eventos bons e ruins.
**OBSERVE:**
- Cabeçalho: serviço "frontend", título "User Latency", autor/data de edição; metadados em linha (Target 99.5%, Time Period 14 days, SLI `sli.latency`); botões "Configure Burn Alerts" e "Manage".
- Tabela de alertas: Exhaustion Time (4h e 24h) e Budget Rate (4h, 5%) com status "Normal" em pílula verde.
- "Status details": dois cartões lado a lado, Budget Burndown ("24.6%", linha descendente 100% → 24.6%) e Historical Compliance ("99.62%"), com uma janela laranja marcando o intervalo analisado; frase de síntese ("burned through 0.8x of expected budget over the last 4 hrs") com campo numérico editável.
- Investigação: dois heatmaps (SLO Success Rate x SLO Failure Rate) sobre o mesmo eixo de tempo e cartões de dimensões (http.route, name, http.method…) com barras azul (sucesso) vs laranja (falha) para achar a dimensão que difere.
- Previsão: linha verde (histórico) + linha tracejada roxa (extrapolação de 4h) com marcador laranja "Predicted exhaustion" e rótulo "Now (alert)".
**INTERACTION:** Alterar a janela de horas atualiza a sentença; selecionar intervalo nos heatmaps atualiza BubbleUp; "Reset Budget" reinicia o orçamento (doc). Demais NÃO VERIFICADO.
**WHY IT WORKS:** A previsão (quando vai acabar) é mais acionável que o estado atual; a seção de investigação evita trocar de ferramenta.
**ADAPT TO BIWEB:** Complementa Elastic (REF-105) com projeção linear de consumo e comparação "bom vs ruim" por dimensão (tabela/barras do modelo semântico). Demonstra forecast simples e drill-down analítico. Também serve para Capacity & Saturation (tempo até saturar).
**DO NOT COPY:** O nome "BubbleUp" e o heatmap logarítmico de latência (requer dados de alta cardinalidade); o conjunto de alertas de burn (jargão SRE).

---

---

### REF-107 — Esri ArcGIS Dashboards (Operations Dashboard) (relatório BIWEB relacionado: Operations Command Center)
**IMAGES:**
- esri-dashboards-banner — https://www.esri.com/content/dam/esrisites/en-us/arcgis/products/operations-dashboard/update-2020/assets/arcgis-dashboard-banner-fg.jpg — "Dashboard escuro 'Actividades | Ayuntamiento de Madrid' (mapa, KPI, histograma, donut) e versão mobile" (940x576) — VERIFICADA (200, image/jpeg; inspecionada). Imagem de marketing com dashboards reais.
- esri-dashboards-operational — https://www.esri.com/content/dam/esrisites/en-us/arcgis/products/operations-dashboard/update-2020/assets/arcgis-dashboard-operational-card.jpg — "Dashboard operacional: California Statewide Power Outages (alt do site: dashboard com mapa da Califórnia cercado de métricas de apagão)" (342x192, baixa resolução) — VERIFICADA (200, image/jpeg; inspecionada)

**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-107_01_esri_dashboards_banner`

![REF-107_01_esri_dashboards_banner](https://www.esri.com/content/dam/esrisites/en-us/arcgis/products/operations-dashboard/update-2020/assets/arcgis-dashboard-banner-fg.jpg)

`REF-107_02_esri_dashboards_operational`

![REF-107_02_esri_dashboards_operational](https://www.esri.com/content/dam/esrisites/en-us/arcgis/products/operations-dashboard/update-2020/assets/arcgis-dashboard-operational-card.jpg)

**SOURCE:** https://www.esri.com/en-us/arcgis/products/arcgis-dashboards/overview (página de produto oficial, consultada em 2026-10-07; a página lista 4 tipos de dashboard: Strategic, Tactical, Operational, Informational). Pasta "update-2020" indica assets de 2020: UI pode estar defasada. Blog e docs da Esri retornam 403 para curl/WebFetch (limitação).
**PROBLEM:** Equipes de operação precisam de uma visão única do que está acontecendo e onde, com filtros compartilhados entre mapa, listas e indicadores.
**SOLUTION:** Dashboard de grade rígida: mapa como elemento central, indicadores e listas laterais, gráficos embaixo; a seleção no mapa ou na lista filtra os demais elementos (ações entre elementos).
**OBSERVE:**
- Tema escuro com acento único amarelo-âmbar em barras/donut; mapa ocupa ~40% da área central.
- KPI grande ("667 Actividades y Eventos" no Madrid; "5,318 Total Customers Without Power" no California) com legenda "Last update: a few seconds ago".
- Colunas laterais de lista com os itens (condado/concessionária) mostrando número de clientes sem energia; seletor de condado/categoria no topo ("Select Counties", "Select Utility Co.").
- Gráficos de barras inferiores com eixo categórico e controles de zoom no eixo (Madrid); donut com percentual ("De pago 15.29%").
- Versão mobile do mesmo dashboard (telefone) mostra mapa + tabela, ou seja, layout responsivo declarado.
**INTERACTION:** Pela descrição da Esri: seleção no mapa/lista filtra os demais elementos; dados atualizam em tempo quase real. Mecânica detalhada NÃO VERIFICADA (sem acesso à doc).
**WHY IT WORKS:** Padrão estável (mapa + KPI + lista + gráfico) que uma equipe de plantão reconhece; indicador de "last update" dá confiança no tempo real.
**ADAPT TO BIWEB:** Demonstra tempo real (fase posterior) e cross-filtering mapa↔lista↔KPI num único canvas. Como Network Intelligence e Incident Intelligence já exploram partes do mesmo padrão, recomendo que este relatório só entre se o foco for a "composição de painel com seleção compartilhada" e atualização ao vivo.
**DO NOT COPY:** Paleta escura amarelo-âmbar da Esri e o logotipo/identidade; baixa resolução da imagem 2 (usar só como referência de composição).

---

---

### REF-108 — Salesforce Field Service Dispatcher Console (Gantt + Mapa) (relatório BIWEB relacionado: Field Operations)
**IMAGES:**
- salesforce-gantt — https://res.cloudinary.com/hy4kyit2a/f_auto/fl_lossy/q_70/learn/modules/field-service-dispatcher-console-for-dispatchers/explore-the-dispatcher-console/images/2c6ed715b055f9d842544663cb03e56d_kix.dzfk4x8wd7h0.png — "Gantt do dispatcher: recursos por território, compromissos, intervalos e KPIs de saúde da agenda (anotações 1–5)" (1449x700; a URL serve JPEG, content-type image/jpeg) — VERIFICADA (200, image/jpeg; inspecionada)
- salesforce-map — https://res.cloudinary.com/hy4kyit2a/f_auto/fl_lossy/q_70/learn/modules/field-service-dispatcher-console-for-dispatchers/explore-the-dispatcher-console/images/4530e74a1fde5fbf8bc05f16e24cfbd5_kix.u55784lphydg.png — "Aba Map com camada de tráfego, polígonos de território e ícones de técnicos e visitas" (1417x777; image/jpeg) — VERIFICADA (200, image/jpeg; inspecionada)

**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-108_01_salesforce_gantt`

![REF-108_01_salesforce_gantt](https://res.cloudinary.com/hy4kyit2a/f_auto/fl_lossy/q_70/learn/modules/field-service-dispatcher-console-for-dispatchers/explore-the-dispatcher-console/images/2c6ed715b055f9d842544663cb03e56d_kix.dzfk4x8wd7h0.png)

`REF-108_02_salesforce_map`

![REF-108_02_salesforce_map](https://res.cloudinary.com/hy4kyit2a/f_auto/fl_lossy/q_70/learn/modules/field-service-dispatcher-console-for-dispatchers/explore-the-dispatcher-console/images/4530e74a1fde5fbf8bc05f16e24cfbd5_kix.u55784lphydg.png)

**SOURCE:** https://trailhead.salesforce.com/content/learn/modules/field-service-dispatcher-console-for-dispatchers/explore-the-dispatcher-console (Trailhead, treinamento oficial). AVISO: screenshots de setembro de 2019 (datas visíveis "Tue, September 10, 2019"); UI Lightning antiga, útil só como padrão conceitual.
**PROBLEM:** Despachantes precisam alocar e acompanhar equipes de campo ao longo do dia, vendo carga, deslocamentos e riscos.
**SOLUTION:** Console com abas Gantt e Mapa sobre o mesmo conjunto de dados: o Gantt mostra o tempo por técnico; o mapa mostra onde cada técnico/visita está; KPIs da agenda ficam no topo.
**OBSERVE:**
- Barra de KPIs no canto superior direito (tempo agendado "58h 0m", deslocamento "0h 42m", ratio "0/46", alertas "3", sinos "0") atua como resumo de saúde.
- Linhas = técnicos agrupados por território ("Los Angeles — Utilization: 87%") com foto, nome e função; colunas = horas (7 AM–6 PM); blocos amarelos = compromissos, quadrados escuros = pausas, linhas pretas = deslocamentos, triângulo amarelo = risco (jeopardy).
- Controles: busca de recursos, filtro, navegação Today/setas, seletor de calendário e visão Daily.
- Painel de lista separado (550x847) com política ("Customer First"), horizonte de datas, ações em lote (Schedule/Dispatch) e itens com alertas destacados em amarelo.
- Mapa: camada de tráfego, polígonos coloridos por território, marcadores em formato de pin com check (concluído), caminhão (técnico) e casa (visita), e legendas "Map Layers", "Traffic".
**INTERACTION:** Arrastar e soltar compromissos no Gantt (doc de Trailhead); popout do mapa ao lado do Gantt; filtros por habilidade e tipo de recurso; layers do mapa. Mecânica de arraste NÃO VERIFICADA visualmente.
**WHY IT WORKS:** O mesmo recurso é visível em duas projeções (tempo e espaço), com saúde da agenda resumida em 4 números.
**ADAPT TO BIWEB:** Demonstra a atribuição de capacidade (recurso × tempo) e o par tempo+mapa, com utilização por território. O Gantt seria um widget novo (esforço alto). Se o BIWEB não quiser criar Gantt, a versão mínima é matriz recurso × hora (widget matriz existente) com mapa de marcadores.
**DO NOT COPY:** Visual Lightning de 2019, o Google Maps com camada de tráfego e a paleta amarela de compromissos; ícones de pin com check/caminhão idênticos.

---

---

### REF-109 — PostHog Product Analytics: Funnels e Retention (relatório BIWEB relacionado: Customer Behavior)
**IMAGES:**
- posthog-funnel — https://res.cloudinary.com/dmukukwp6/image/upload/posthog.com/contents/images/docs/user-guides/funnels/funnel-steps-breakdown-light-mode.png — "Funil View Product → Add to cart → Checkout com breakdown por sistema operacional e tabela 'Detailed results'" (2514x1640) — VERIFICADA (200, image/png; inspecionada)
- posthog-retention — https://res.cloudinary.com/dmukukwp6/image/upload/retention_light_805120c74c.png — "Insight 'New user retention': curva por coorte + tabela de coortes semana 0–6, anotada A–D" (3145x2788) — VERIFICADA (200, image/png; inspecionada)

**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-109_01_posthog_funnel`

![REF-109_01_posthog_funnel](https://res.cloudinary.com/dmukukwp6/image/upload/posthog.com/contents/images/docs/user-guides/funnels/funnel-steps-breakdown-light-mode.png)

`REF-109_02_posthog_retention`

![REF-109_02_posthog_retention](https://res.cloudinary.com/dmukukwp6/image/upload/retention_light_805120c74c.png)

**SOURCE:** https://posthog.com/docs/product-analytics/funnels e https://posthog.com/docs/product-analytics/retention (docs oficiais, consultadas em 2026-10-07; produto open source em github.com/PostHog/posthog). Data das capturas NÃO VERIFICADA (nome de arquivo do funil sugere captura de 2024 em outras imagens da mesma página; não é garantia).
**PROBLEM:** Entender como usuários avançam, abandonam e voltam, a partir de eventos brutos.
**SOLUTION:** Insights especializados (funil, retenção, caminhos) com os mesmos hábitos: título, "Computed X minutes ago • Refresh", gráfico principal e tabela de detalhes logo abaixo.
**OBSERVE:**
- Funil: barras agrupadas por passo, uma barra por segmento do breakdown; a parte hachurada de cada barra é o abandono; abaixo de cada coluna, "297 persons (100%)", seta verde para quem converteu, seta vermelha para quem abandonou (29 persons, 9.76%).
- Topo: "Total conversion rate: 30.98% · Average time to convert", status "Computed 3 minutes ago • Refresh" (cache explícito).
- Tabela "Detailed results": colunas por passo (Entered, Converted, Dropped off, Conversion so far, Conversion from previous, Median/Average time) e linhas por segmento com cor de legenda na borda e checkbox por linha.
- Retention: seletor "% Overall cohort", checkbox "Show mean across cohorts"; gráfico de linhas por coorte com final tracejado para períodos incompletos (evita ler queda falsa); tabela com heatmap azul/roxo (Week 0 = 100%) e linha "Mean", células incompletas em cinza claro.
- Barra lateral de navegação com ícones e abas laterais (Notebooks, Docs, Help…) mostrando o insight inserido num produto maior.
**INTERACTION:** Breakdown por propriedade, janelas de conversão, filtro global, alternar entre percentual e contagem; células de coorte clicáveis para ver a lista de pessoas (doc, NÃO VERIFICADO visualmente). Paths (sankey) também documentado em https://posthog.com/docs/product-analytics/paths (ver Links úteis).
**WHY IT WORKS:** Mesmo esqueleto de tela para análises diferentes; marcações de "incompleto" e "computed X ago" tratam honestamente dados parciais e cache.
**ADAPT TO BIWEB:** Relatório Customer Behavior demonstra widgets novos (funil e matriz de coorte, ambos derivados de eventos no modelo semântico) e a convenção "computed at + refresh". Capacidade distinta: análise de sequência de eventos/retorno (série temporal por coorte), diferente do varejo atual de vendas por categoria.
**DO NOT COPY:** O visual hachurado e a paleta azul/roxa e o layout de sidebar; evitar dados de e-commerce (replicariam o protótipo de varejo): usar eventos de uso de produto ou jornada de cliente em outro setor.

---

---

### REF-110 — Esri ArcGIS Urban e ArcGIS 3D GIS (relatório BIWEB relacionado: Street Intelligence 3D)
**IMAGES:**
- esri-urban-3d — https://www.esri.com/content/dam/esrisites/en-us/arcgis/products/arcgis-urban/assets/arcgis-urban-ss.jpg — "Cena 3D urbana com edifícios extrudados coloridos por uso e barra lateral de KPIs (unidades, população, empregos, custo)" (1200x630) — VERIFICADA (200, image/jpeg; inspecionada). Imagem de marketing (monitor mockup) com UI real dentro.
- esri-3d-powerline — https://www.esri.com/content/dam/esrisites/en-us/arcgis/products/arcgis-3d-mapping/3d-gis-overview-mg-3.jpg — "Nuvem de pontos 3D classificada com linhas de transmissão e corredor de risco vermelho; volumes verdes de vegetação" (1536x854) — VERIFICADA (200, image/jpeg; inspecionada)

**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-110_01_esri_urban_3d`

![REF-110_01_esri_urban_3d](https://www.esri.com/content/dam/esrisites/en-us/arcgis/products/arcgis-urban/assets/arcgis-urban-ss.jpg)

`REF-110_02_esri_3d_powerline`

![REF-110_02_esri_3d_powerline](https://www.esri.com/content/dam/esrisites/en-us/arcgis/products/arcgis-3d-mapping/3d-gis-overview-mg-3.jpg)

**SOURCE:** https://www.esri.com/en-us/arcgis/products/arcgis-urban/overview e https://www.esri.com/en-us/arcgis/3d-gis/overview (páginas de produto oficiais, consultadas em 2026-10-07). Captura: NÃO VERIFICADA. A Esri informou ao menos desde out/2023 suporte a web scenes 3D em ArcGIS Dashboards (resultado de busca; blog oficial retornou 403: NÃO VERIFICADO diretamente).
**PROBLEM:** Mostrar a rua/quarteirão como espaço 3D (altura, uso, risco) e acoplar métricas à geometria.
**SOLUTION:** Cena 3D com atributos nos volumes (cor por categoria) e painel lateral de KPIs que se recalcula conforme o que está na cena; análises de proximidade/risco desenhadas como volumes translúcidos.
**OBSERVE:**
- Edifícios extrudados com altura proporcional ao atributo e cor por uso (azul residencial, ciano escritórios, roxo outro); vegetação e malha cinza ao fundo como contexto neutro.
- Sidebar de KPIs à direita sobre fundo branco: barras horizontais por uso (Residential/Office/Parking/Retail/Amenities), cartões numéricos ("Residential Units 3,354", "Total Jobs 19,868", "Total Development Cost 2.17B"), um indicador de balanço de estacionamento.
- Cena de risco: linhas amarelas finas (rede elétrica), corredor vermelho translúcido (zona de segurança) e caixas verdes (vegetação invadindo) sobre nuvem de pontos cinza classificada.
- Contraste forte entre cena (baixa saturação) e achados (cores vivas): só o que importa tem cor.
**INTERACTION:** Navegação orbital 3D e seleção de edifício (descrita na página de produto; interação exata NÃO VERIFICADA). Cálculo dinâmico do painel conforme escolhas (descrição de marketing).
**WHY IT WORKS:** O 3D fica como contexto espacial e o dado vive no painel ao lado: o usuário não precisa ler números sobre volumes.
**ADAPT TO BIWEB:** Demonstra mapas 3D (deck.gl: ExtrudedGeometry/ColumnLayer/PolygonLayer com elevação por medida, MapLibre por baixo) e vínculo painel↔cena com filtros do dashboard. Capacidade distinta: dimensão vertical e polígonos extrudados por medida. Esforço alto e valor visual alto; deve usar dados abertos de edificações, não imagens fotogramétricas.
**DO NOT COPY:** Malha fotogramétrica/photorealistic (licença Google/Esri), paleta da Esri e o desenho do painel; evitar 3D decorativo sem medida mapeada na altura.

---

---

### REF-111 — Kepler.gl e Foursquare Studio: Time Playback (relatório BIWEB relacionado: Historical Replay)
**IMAGES:**
- kepler-playback — https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/h-playback-1.png — "Barra de playback do Kepler.gl: janela de tempo, histograma de contagem, play, velocidade 1x" (2122x488) — VERIFICADA (200, image/png; inspecionada)
- foursquare-timeline — https://files.readme.io/79219e1-timeline-page-updated.png — "Foursquare Studio: configuração da timeline (X axis, intervalo, Y axis, janela de animação) e histograma 'Count of Rows over Time'" (2054x938) — VERIFICADA (200, image/png; inspecionada)

**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-111_01_kepler_playback`

![REF-111_01_kepler_playback](https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/documentation/h-playback-1.png)

`REF-111_02_foursquare_timeline`

![REF-111_02_foursquare_timeline](https://files.readme.io/79219e1-timeline-page-updated.png)

**SOURCE:** https://docs.kepler.gl/docs/user-guides/h-playback (doc oficial do projeto open source vis.gl/Uber) e https://docs.foursquare.com/studio/docs/maps-time-playback (doc oficial). Data: imagem do Kepler de documentação antiga (estilo anterior a ~2021; NÃO VERIFICADA); Foursquare Studio sem data visível.
**PROBLEM:** Ver o histórico como um filme: o que aconteceu antes, durante e depois de um evento, em mapa e gráficos sincronizados.
**SOLUTION:** Um filtro temporal com controles de reprodução embutido no mapa: histograma de contagem por tempo, janela deslizante (brush) e botão play/velocidade.
**OBSERVE:**
- Barra escura no rodapé do mapa com abas "DateTime" e "Y Axis" (alterna histograma de contagem por série de uma coluna) e ícones de velocidade ("1x") e visualização.
- Histograma em barras com a janela atual colorida e o resto em cinza; dois handles quadrados nas pontas da janela e eixo com rótulos de década.
- Etiqueta flutuante com intervalo atual ("01/05/91 03:38:42am — 03/30/11 21:10:05pm") sobre o mapa, mostrando o que está visível sem ler o eixo.
- Foursquare: painel de configuração com X Axis (campo `time`, intervalo "1 week", fuso UTC), Y Axis (Count/Sum), Animation window (3 modos: janela deslizante, incremental, trilha) e controles play, rocket (velocidade), repetir, gravar vídeo.
- O playback não troca de tela; os pontos do mapa filtram conforme a janela.
**INTERACTION:** Play anima a janela; arrastar handles define o intervalo; velocidade 1x/2x/4x (doc); camada Trip anima caminhos com trilha (doc k-trip). Gravação de vídeo no Studio visível em ícone.
**WHY IT WORKS:** Histograma = contexto; janela = foco; play = narrativa. O mesmo controle serve para explorar e para apresentar.
**ADAPT TO BIWEB:** Demonstra o replay temporal desejado como capacidade transversal: um controle de timeline que filtra todos os widgets da página (mapa, linha, tabela). Eu o implementaria como recurso de Network Intelligence ou Street Intelligence 3D, não como relatório isolado (ver redundâncias). Estrutura mínima: série pré-agregada por passo de tempo e estado de playback no cliente.
**DO NOT COPY:** O visual escuro da Uber/Foursquare e os ícones de foguete; o conjunto de modos de janela para um MVP (começar com janela deslizante).

---

---

### REF-112 — ThoughtSpot Liveboards (relatório BIWEB relacionado: Executive Commercial)
**IMAGES:**
- thoughtspot-kpi-tabs — https://docs.thoughtspot.com/cloud/latest/_images/liveboard-tabs.png — "Liveboard 'Sales' com abas KPIs / Detailed charts e cartões de KPI com delta WoW/MoM e sparkline" (958x486) — VERIFICADA (200, image/png; inspecionada)
- thoughtspot-liveboard — https://docs.thoughtspot.com/cloud/latest/_images/business-user-sample-pinboard-new-experience.png — "Liveboard 'Retail Sales': KPI, barras empilhadas por produto/região, tabela com total, linha por trimestre fiscal" (1423x677) — VERIFICADA (200, image/png; inspecionada)

**IMAGE NAMES + PREVIEW (hotlinks oficiais):**

`REF-112_01_thoughtspot_kpi_tabs`

![REF-112_01_thoughtspot_kpi_tabs](https://docs.thoughtspot.com/cloud/latest/_images/liveboard-tabs.png)

`REF-112_02_thoughtspot_liveboard`

![REF-112_02_thoughtspot_liveboard](https://docs.thoughtspot.com/cloud/latest/_images/business-user-sample-pinboard-new-experience.png)

**SOURCE:** https://docs.thoughtspot.com/cloud/latest/liveboards (doc oficial, consultada em 2026-10-07). Data da captura: NÃO VERIFICADA (dados "Week of 08/29/2022"; UI possivelmente de 2022–2023).
**PROBLEM:** Dar à liderança uma visão executiva do comercial com KPIs comparados com o período anterior e caminho para explorar.
**SOLUTION:** Liveboard em abas: aba curta de KPIs e aba de gráficos detalhados; cada KPI traz delta, sparkline e ações contextuais (explorar, criar alerta).
**OBSERVE:**
- Título com estrela de favorito, descrição curta ("Our sales by date, region, city, and product") e ações Edit / compartilhar / mais.
- Abas realçadas (KPIs, Detailed charts) separando resumo de detalhe.
- KPI card: valor grande (882.41K), subtítulo de período ("Week of 08/29/2022"), delta em vermelho com seta ("↓ 72.54% (3.21M) WoW"), sparkline em área com último ponto tracejado para período incompleto; no hover aparecem "Explore" e ícone de sino de alerta.
- Cartão com tabela inclui linha de totais ("UNIQUE COU… / TOTAL") e rodapé "Showing 30 of 30 rows"; gráfico de barras tem rodapé "Showing 1,725 of 1,725 data points" (transparência de amostragem).
- Observação crítica: o gráfico de barras empilhadas por produto e região tem rótulos cortados e escala ilegível; o dashboard padrão não é um bom exemplo de legibilidade.
**INTERACTION:** Hover revela Explore (abre análise ad hoc a partir do cartão) e alerta; abas trocam o conjunto de cartões; filtros adicionados ao Liveboard (doc). Busca em linguagem natural é o diferencial do produto (NÃO exibida nestas imagens).
**WHY IT WORKS:** Resumo antes do detalhe; delta padronizado; ações contextuais no próprio KPI.
**ADAPT TO BIWEB:** Esse relatório é o mais redundante: o protótipo de varejo atual já demonstra KPI, barras, linha e tabela. Só vale como relatório próprio se acrescentar "Explore a partir do KPI" (drill para análise ad hoc) e "alerta no KPI", capacidades já cobertas por SLA & Risk Monitor. Recomendação: COMPLEMENTAR; reaproveitar o protótipo de varejo em vez de criar outro.
**DO NOT COPY:** O conteúdo de varejo (já presente), o gráfico de barras com rótulos cortados e a paleta multicolor; a marca ThoughtSpot.

---

---

#### Matriz de relatórios demonstrativos

Escala de esforço relativo (dado o que o BIWEB tem hoje: KPI, barras, linha, área, dispersão, tabela, matriz, mapa MapLibre/deck.gl, heatmap, filtros): Baixo = só widgets existentes; Médio = 1 widget/estilo novo ou lógica de regra; Alto = widget novo complexo ou 3D/tempo real.

| Relatório | Capacidade distinta demonstrada | Referências | Esforço | Prioridade | Observação / redundância |
|---|---|---|---|---|---|
| **Network Intelligence** (1º) | Topologia hierárquica não geográfica; escala de utilização com threshold; drawer de detalhe; frase de problema por regra; mapa/hierarquia + modelo semântico (site → dispositivo → interface) | REF-99 | Médio-Alto (topologia nova; mapa geográfico opcional) | **ESSENCIAL** | Capacity & Saturation se sobrepõe se ambos mostrarem só utilização atual |
| **Incident Intelligence** | Feed de eventos com facetas, histograma temporal, detalhe com entidades afetadas e evidência, botão "Explain" (IA com evidências), insights determinísticos | REF-100, REF-102 | Médio | **ESSENCIAL** | Absorve Dependency & Impact como painel "blast radius" |
| **Anomaly Explorer** | Anomalias determinísticas com banda esperada, swimlane/heatmap, tabela Actual vs Typical, explicação | REF-103, REF-102 (cartão Watchdog) | Médio | **ESSENCIAL** | Parcialmente redundante com Incident Intelligence se este também listar anomalias: separar "onde olhar" (Anomaly) de "o que fazer" (Incident) |
| **SLA & Risk Monitor** | Thresholds/metas, orçamento de erro, burn rate, previsão de esgotamento, regras de alerta | REF-105, REF-106 | Baixo | **ESSENCIAL** (melhor custo/benefício; só usa widgets existentes) | Cobre também o "alerta no KPI" que justificaria Executive Commercial |
| **Customer Behavior** | Funil, coorte/retention (matriz), caminhos (sankey), análise por eventos no modelo semântico | REF-109 | Médio-Alto (funil e sankey são widgets novos; coorte usa matriz) | **IMPORTANTE** | Não usar e-commerce, para não repetir o varejo atual |
| **Street Intelligence 3D** | Mapas 3D (deck.gl) com extrusão por medida, vínculo painel↔cena | REF-110 | Alto | **IMPORTANTE** (alto impacto visual) | Replay temporal pode viver aqui como controle |
| **Historical Replay** | Timeline com play, histograma, janela deslizante sincronizando widgets | REF-111 | Médio (como controle de página) / Alto (como relatório com trips animados) | **IMPORTANTE** como **capacidade transversal**, não como relatório isolado | Redundante como relatório: o mesmo controle serve a Network Intelligence e Street 3D |
| **Capacity & Saturation** | Fill/group/size-by sobre modelo semântico, heatmap, previsão de esgotamento | REF-104, REF-106 | Baixo-Médio | **IMPORTANTE** | Muito próximo de Network Intelligence: sugerido como aba dentro dele, ou relatório próprio focado em projeção |
| **Operations Command Center** | Composição de painel ao vivo, cross-filter mapa↔lista↔KPI, tempo real (fase posterior) | REF-107 | Médio (sem tempo real) / Alto (com streaming) | **IMPORTANTE** (se for a vitrine de tempo real); **COMPLEMENTAR** antes disso | Redundante com Network Intelligence + Incident Intelligence, que já usam o mesmo padrão |
| **Dependency & Impact** | Widget de grafo de dependências, raio de impacto | REF-101 | Alto (widget de grafo novo) | **COMPLEMENTAR** como relatório; **IMPORTANTE** como painel de Incident Intelligence | Subconjunto de Incident Intelligence |
| **Field Operations** | Atribuição de capacidade recurso × tempo (Gantt), utilização por território, par tempo + mapa | REF-108 | Alto (Gantt novo); Médio com matriz | **COMPLEMENTAR** | Parte do mapa/lista já aparece em Operations Command Center |
| **Executive Commercial** | KPI + delta + drill ("Explore") + alerta no KPI | REF-112 | Baixo | **COMPLEMENTAR** | Redundante com o protótipo de varejo atual: não acrescenta capacidade nova |

Conjunto mínimo recomendado de demos (capacidades distintas, sem repetir): Network Intelligence → Incident Intelligence (com painel de dependência) → Anomaly Explorer → SLA & Risk Monitor → Customer Behavior → Street Intelligence 3D (com replay temporal opcional). Ordem de esforço crescente para entrega incremental: SLA & Risk Monitor, Anomaly Explorer, Incident Intelligence, Network Intelligence, Customer Behavior, Street Intelligence 3D.

#### Sugestões adicionais (somente se acrescentam capacidade)

Não pesquisei referências visuais para estas duas por falta de tempo; ficam como hipóteses NÃO VERIFICADAS e sem imagem:
1. **Pipeline & Data Health (workflows em DAG)**: nenhum relatório candidato demonstra workflows/pipelines em DAG com estado por nó e linhagem. Referências a pesquisar: visão de grade/DAG de orquestradores (Airflow, Dagster) e lineage (já há páginas de DataHub/dbt no scratchpad, de outra frente de pesquisa; não analisadas aqui).
2. **Embedded Customer Report (embed/white-label)**: a capacidade de embed não é demonstrada por nenhum candidato; uma demo simples seria um relatório existente servido com tema e filtro fixos por locatário. Sem referência pesquisada.

#### Padrões transversais

- **Resumo antes do detalhe, detalhe sob demanda:** badge/contador + frase (Kentik, Datadog Watchdog) → drawer/painel lateral (Kentik, Datadog) → página de detalhe (Dynatrace, Datadog Incident). Útil para os modos de relatório do BIWEB.
- **Barra de contexto única** no topo (tempo, filtros, consulta nomeada): Kentik (Filters + Time Range), Dynatrace (filtro + Last 2 hours + Refresh), Datadog Host Map (pergunta + Fill/Group/Filter).
- **Frases em linguagem natural geradas por regra** para estados e anomalias ("N problemas em M sites", "Error rate has been up on…"): casam com insights determinísticos do BIWEB e são mais legíveis que um gráfico solto.
- **Banda do esperado + marcador de anomalia** (Elastic Single Metric, Datadog expected bounds) e **previsão com intervalo** (Honeycomb extrapolação 4h): padrão para threshold e forecast.
- **Mesmo trio de números em tudo comparável:** valor observado, meta, folga (Elastic SLO); delta com sparkline (ThoughtSpot).
- **Honestidade sobre dados parciais:** "Computed X minutes ago • Refresh" e finais tracejados em coortes incompletas (PostHog), "Showing 1,725 of 1,725" (ThoughtSpot), "7 columns hidden" (Dynatrace).
- **Cor com semântica fixa e contida:** vermelho = problema; escala contínua só para uma métrica; resto neutro (Datadog Host Map, Kentik, Esri 3D).
- **Facetas com contadores** à esquerda como filtro principal (Dynatrace, Datadog Service Catalog).
- **Mesmo dado em duas projeções sincronizadas:** tempo + espaço (Salesforce Gantt/Mapa), mapa + lista (Esri), swimlane + série (Elastic).
- **Controles como verbos curtos:** `Main resource / Fill by / Group by / Filter` (Datadog) mapeiam diretamente para o modelo semântico do BIWEB.
- **Armadilha comum:** grafo force-directed e heatmaps densos perdem legibilidade em escala; todas as referências mitigam com agrupamento/colapso (clusters, hexágonos, swimlane ordenado por severidade).


---

## Apêndice B — Links úteis adicionais (da pesquisa)


### AI Copilot — Links úteis adicionais

Verificados por curl (HTTP 200, image/*) mas NÃO inspecionados visualmente, salvo onde indicado:
- `vscode_agents_window_hero` — https://code.visualstudio.com/assets/docs/agents/agents-overview/agents-window-hero.png (só HTTP; Agents Window do VS Code)
- `vscode_agents_diff_view` — https://code.visualstudio.com/assets/docs/agents/review-code-edits/agents-window-diff-view.png (só HTTP; painel Changes do Agents Window)
- `vscode_add_feedback` — https://code.visualstudio.com/assets/docs/agents/review-code-edits/agents-window-add-feedback.png (só HTTP; botão "Add Feedback" por trecho do diff)
- `vscode_sessions_list` — https://code.visualstudio.com/assets/docs/agents/chat-sessions/chat-view-sessions-list.png (só HTTP; lista/histórico de sessões)
- `grafana_assistant_hero_meta` — https://a-us.storyblok.com/f/1022730/1386x780/b92a0db445/grafanaassistantgeneralmetaimage.png (inspecionada; exemplo de input com brilho gradiente = IA com identidade própria; contra-exemplo)
- `grafana_assistant_error_box` — https://a-us.storyblok.com/f/1022730/1157856cc7/error-box.png (só HTTP; erros mostrados no painel)
- `grafana_assistant_cpu_analysis` — https://a-us.storyblok.com/f/1022730/cdefe3a9ca/cpu-analysis.png (só HTTP; análise de CPU ao lado do dashboard)
- `datadog_bits_full_page_doc` — https://docs.dd-static.net/images/bits_ai/getting_started/bits_assistant_full_page.46229f6497408151b6eb6d09e20236b0.png (só HTTP; alt: tela cheia com tarefas sugeridas)
- `cursor_changelog_3_0_thumb_2` — https://image.mux.com/UMJM00fBs7Y4V2V3LFiwrKHVjjZlZKKpMr2TnfxNp4pI/thumbnail.jpg?time=3 (usada acima em A2)

Páginas úteis (lidas, sem imagens aproveitáveis):
- Cursor, checkpoints/fila/steer: https://cursor.com/docs/agent/overview
- Cursor, Agent Review (rápido vs profundo): https://cursor.com/docs/agent/agent-review
- Grafana Workspace, texto completo: https://grafana.com/docs/grafana-cloud/machine-learning/assistant/platform/workspace.md
- Grafana dashboards e Assistant, texto completo: https://grafana.com/docs/grafana-cloud/platform/grafana-assistant/guides/dashboarding.md
- Databricks, aprovação de ferramentas: https://docs.databricks.com/aws/en/genie-code/agent-mode
- Tableau Agent (doc oficial; sem imagens; sugestões de ação, indexação de metadados e camada de confiança): https://help.tableau.com/current/online/en-us/web_author_einstein.htm
- ThoughtSpot SpotterViz (doc; checkpoints máx. 10): https://docs.thoughtspot.com/cloud/latest/spotter-viz
- Looker Visualization Assistant (SÓ resultado de busca; página NÃO aberta; menu "Ask anything" que gera JSON de formatação e depois "apply suggestions"): https://docs.cloud.google.com/looker/docs/custom-looker-visualization-gemini
- Fórum Cursor (evidência não oficial; revisão por mudança vs sessão): https://forum.cursor.com/t/bring-back-per-change-apply-inline-diff-review-you-re-throwing-away-your-best-ux-advantage/160856

### View switching, realtime e replay — Links úteis adicionais

- Grafana, painel/time controls: https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/panel-editor-overview/ e https://grafana.com/docs/grafana/latest/visualizations/dashboards/use-dashboards/
- Grafana Explore, Live tailing: https://grafana.com/docs/grafana/latest/explore/logs-integration/
- Datadog Live Tail: https://docs.datadoghq.com/logs/explorer/live_tail/ ; full screen de widgets (pause/live graph): https://docs.datadoghq.com/dashboards/widgets/configuration/ ; custom time frames: https://docs.datadoghq.com/dashboards/guide/custom_time_frames/
- Kibana Lens (atual): https://www.elastic.co/docs/explore-analyze/visualize/lens
- Metabase visualização: https://www.metabase.com/docs/latest/questions/visualizations/visualizing-results
- kepler.gl docs: https://docs.kepler.gl/docs/user-guides/h-playback ; https://docs.kepler.gl/docs/user-guides/m-map-settings ; trip layer: https://docs.kepler.gl/docs/user-guides/c-types-of-layers/k-trip
- deck.gl TripsLayer: https://deck.gl/docs/api-reference/geo-layers/trips-layer
- MapLibre GL JS Map API (pitch/bearing/easeTo): https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/
- ArcGIS Time Slider (Play/Pause, Previous/Next, velocidade; intervalo e dados cumulativos): https://doc.arcgis.com/en/web-appbuilder/latest/create-apps/widget-time-slider.htm (só doc textual, imagens NÃO extraídas)
- Netdata, controles de tempo: https://learn.netdata.cloud/docs/dashboards-and-charts/visualization-date-and-time-controls
- Sentry Replay: https://docs.sentry.io/product/explore/session-replay/web/replay-details/
- Flightradar24 suporte (playback global/individual): https://support.fr24.com/support/solutions/articles/3000120423-how-to-view-playback-on-the-flightradar24-website- ; https://support.fr24.com/support/solutions/articles/3000118472-how-to-view-a-single-flight-playback-from-the-flightradar24-app-
- Guidelines de segmented controls (apoio, não lidas em detalhe): https://developer.apple.com/design/human-interface-guidelines/segmented-controls ; https://m3.material.io/components/segmented-buttons/overview
- Não cobertos (sem fonte lida): Power BI "Show as a table"/Focus mode, Tableau View Data, Google Maps tilt, Observable, Windy, Honeycomb, Cloudflare Radar, Chrome DevTools Performance.

### Rede, incidentes e map workspace — Links úteis adicionais

Verificados em 2026-10-07 com HTTP 200 (curl), salvo indicação:
- deck.gl: ArcLayer https://deck.gl/docs/api-reference/layers/arc-layer ; TripsLayer https://deck.gl/docs/api-reference/geo-layers/trips-layer ; HeatmapLayer https://deck.gl/docs/api-reference/aggregation-layers/heatmap-layer ; HexagonLayer https://deck.gl/docs/api-reference/aggregation-layers/hexagon-layer
- MapLibre GL JS docs: https://maplibre.org/maplibre-gl-js/docs/
- kepler.gl: arcos https://docs.kepler.gl/docs/user-guides/c-types-of-layers/b-arc ; clusters .../f-cluster ; trips .../k-trip
- Grafana: Geomap (layers Markers/Heatmap/Route/Photos/Network) https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/visualizations/geomap/ ; Node graph .../node-graph/ (consultadas; já cobertas parcialmente no REFERENCE_PACK_BI)
- NetBox Topology Views (plugin; filtros por nome/site/tag/role; export draw.io/PNG): https://github.com/netbox-community/netbox-topology-views
- Zabbix maps (doc oficial): https://www.zabbix.com/documentation/current/en/manual/config/visualization/maps/map (HTTP 200; conteúdo NÃO lido)
- PHP Network Weathermap: https://github.com/howardjones/network-weathermap
- TeleGeography Submarine Cable Map: https://www.submarinecablemap.com (HTTP 200, mas é app JS — **interface NÃO VERIFICADO**; resultado de busca diz que clicar num cabo mostra nome, RFS, extensão, donos, site e landing points, e clicar num landing point lista os cabos)
- Elastic Maps (Kibana): https://www.elastic.co/docs/explore-analyze/visualize/maps (HTTP 200; NÃO lido em detalhe)
- Downdetector: https://downdetector.com (403 ao curl; **NÃO VERIFICADO**); descrições secundárias falam de mapa de calor de relatórios nas últimas 24h e detecção quando o volume excede o normal para a hora do dia
- Windy (controles de camadas/tempo): https://www.windy.com (HTTP 200; NÃO inspecionado)
- Dynatrace Smartscape: o link `docs.dynatrace.com/docs/observe/dynatrace-intelligence/smartscape` retornou 404; resultados de busca citam topologia automática com camadas (aplicações → serviços → processos → hosts → data centers) — **NÃO VERIFICADO**, não virou ficha
- Esri Community "Configure your first dashboard": https://community.esri.com/t5/arcgis-dashboards-blog/configure-your-first-dashboard/m-p/888653
- Kentik: changelog dez/2021 https://new.kentik.com/cloud-december-2021-updates-1RKdt6

---

### Rede, incidentes e map workspace — Lacunas e avisos

- **Kentik (N1):** imagens da doc oficial são URLs SAS que expiram (~35-45 min). Imagens duráveis do changelog de 2021 estão em SOURCE/IMAGES (UI antiga).
- **ThousandEyes (N2) e Datadog (N3):** as imagens de doc têm data (Apr 29 / Apr 28 / May 2) mas sem ano visível; tratadas como "recentes, não datadas".
- **Weathermap NG (N4):** screenshots de catálogo datados de 2022; não foi possível instalar/rodar o plugin para ver a UI atual do editor.
- **Cloudflare Radar (I1):** UI ao vivo bloqueada (403); imagens de 2022/2023.
- **Downdetector:** bloqueia curl/WebFetch (403); sem imagem verificada; não virou ficha. **TeleGeography Submarine Cable Map:** app JS, não inspecionado.
- **ArcGIS Dashboards (I3):** tutorial de 2017; blog oficial na esri.com retorna 403; imagens do produto de baixa resolução.
- **Dynatrace Smartscape, Zabbix, SolarWinds, Observium/LibreNMS, Esri Utility Network, Google Earth, QGIS, Mapbox Studio, Foursquare Studio, Kibana Maps, Waze/Google traffic, PagerDuty/Opsgenie:** não fichados (limite de 10 fichas e prioridade a produtos com imagens verificáveis); marcar NÃO VERIFICADO.
- Nenhum arquivo foi gravado no diretório do projeto; imagens inspecionadas ficaram em `scratchpad/cw_img/`.

### 3D urbano / GIS — Links úteis adicionais

- MapLibre exemplos: https://maplibre.org/maplibre-gl-js/docs/examples/ (lista inclui 3D buildings, 3D terrain, sky/fog, globe, fly-to, quantized mesh, 3D tiles com Three.js, custom layers que seguem o terreno)
- MapLibre exemplos adicionais não inspecionados: display-a-globe-with-an-atmosphere, fill-extrusion-rounded-corners, elevate-symbols-above-the-terrain, display-a-hybrid-satellite-map-with-terrain-elevation, create-a-heatmap-layer-on-a-globe-with-terrain-elevation, add-3d-terrain-from-quantized-mesh-tiles, add-a-3d-model-with-babylonjs (todas em https://maplibre.org/maplibre-gl-js/docs/examples/<slug>/)
- deck.gl galeria: https://deck.gl/examples (imagens `https://deck.gl/images/examples/<nome>.jpg`; outros nomes disponíveis: globe-view, terrain-layer, point-cloud-layer, hexagon-layer, multi-view, mapbox, maplibre, google-maps)
- deck.gl + MapLibre: https://deck.gl/docs/api-reference/mapbox/overview
- deck.gl TerrainExtension: https://deck.gl/docs/api-reference/extensions/terrain-extension
- Cesium Sandcastle: https://sandcastle.cesium.com/ ; Cesium ion pricing: https://cesium.com/platform/cesium-ion/pricing/
- Google Photorealistic 3D Tiles: https://developers.google.com/maps/documentation/tile/3d-tiles
- OSM tile policy: https://operations.osmfoundation.org/policies/tiles/ ; atribuição ODbL: https://osmfoundation.org/wiki/Licence/Attribution_Guidelines
- Overture Maps: https://overturemaps.org/ ; docs: https://docs.overturemaps.org/
- Mapterhorn: https://mapterhorn.com/ ; acesso a dados: https://mapterhorn.com/data-access/
- OpenFreeMap: https://openfreemap.org/ ; OSM Buildings: https://osmbuildings.org/
- PMTiles docs: https://docs.protomaps.com/pmtiles/ ; Planetiler: https://github.com/onthegomap/planetiler ; Martin: https://github.com/maplibre/martin
- Mapbox Standard (blog): https://www.mapbox.com/blog/standard-core-style
- kepler.gl docs: https://docs.kepler.gl/
- Cobertura não concluída: Felt (felt.com) e ArcGIS Scene Viewer / Maps SDK (conteúdo não extraído); Cesium ion Stories (não pesquisado como produto; nenhuma imagem verificada); OSM Buildings viewer (sem imagens estáticas oficiais; apenas viewer ao vivo).

### Data modeling — Links úteis adicionais

- Omni — Model IDE, relationships e workbook modeling: https://docs.omni.co/modeling/develop/guides/model-ide ; https://docs.omni.co/modeling/develop/guides/workbook-modeling (texto lido via busca; imagens NÃO extraídas — páginas Mintlify sem `<img>` estáticos no HTML).
- JetBrains DataGrip — Database diagrams (ER a partir do banco, toolbar Key Columns/Columns/Comments, virtual foreign keys): https://www.jetbrains.com/help/datagrip/diagrams.html (HTML mostra imagens de 2026.2, ex.: https://resources.jetbrains.com/help/img/idea/2026.2/db_diagrams_settings.png — URL NÃO VERIFICADA com curl, apenas listada no HTML da página; a imagem é do menu Diagrams, não do canvas).
- Tableau — Performance Options: https://help.tableau.com/current/pro/desktop/en-us/datasource_relationships_perfoptions.htm ; "Don't Be Scared of Relationships": https://help.tableau.com/current/pro/desktop/en-us/datasource_dont_be_scared.htm
- Looker — Project files/estrutura LookML: https://docs.cloud.google.com/looker/docs/lookml-project-files
- dbt — Semantic models: https://docs.getdbt.com/docs/build/semantic-models ; MetricFlow: https://docs.getdbt.com/docs/build/about-metricflow ; Multi-project lineage: https://docs.getdbt.com/docs/explore/explore-multiple-projects
- DataHub — demo pública (UI de impact analysis nas imagens): https://demo.datahubproject.io ; docs de lineage/impact: https://docs.datahub.com/docs/features/feature-guides/lineage ; https://docs.datahub.com/docs/act-on-metadata/impact-analysis
- OpenMetadata — docs v2: https://docs.open-metadata.org/latest/how-to-guides/data-lineage/explore
- TMDL extension para VS Code: https://marketplace.visualstudio.com/items?itemName=CPIM.TMDL-language-support
- Imagens extras VERIFICADAS por HTTP 200 image/* (apenas a do Metabase data-structure-publish foi também inspecionada visualmente; as demais só alt), úteis se faltar material:
  - Metabase tabela/atributos + Publish: https://www.metabase.com/docs/latest/data-studio/images/data-structure-publish.png (inspecionada: lista de tabelas com coluna Published ✓ e painel "Table details" com Owner, Visibility layer, Entity type, Source, botões Publish/Sync settings).
  - dbt multi-project lineage: https://docs.getdbt.com/img/docs/collaborate/dbt-explorer/cross-project-lineage-parent.png?v=2 (só alt: "View your cross-project lineage in a parent project…").
  - dbt exposures a jusante: https://docs.getdbt.com/img/docs/platform-integrations/auto-exposures/explorer-lineage2.png?v=2 (só alt: "Example of downstream exposure details for Tableau.").
  - TE3 DAX Script/locals: https://docs.tabulareditor.com/en/images/dax-script.png (só alt).
  - Tableau tooltips/relação: https://help.tableau.com/current/pro/desktop/en-us/Img/data_model_tooltips.gif (só alt).
  - Power BI TMDL (tooltip de hover): https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-tabular-model-definition-language-view/tmdl-view-20.png (VERIFICADA/só alt: "context tooltip shown on mouse hover…").
- URLs descartadas por falha na verificação (HTTP 200 mas content-type text/html, tratadas como inexistentes): `.../transform-model/media/desktop-tabular-model-definition-language-view/tmdl-view-01.png` e `.../transform-model/media/dax-query-view/dax-query-view-measure.png` (as imagens existem na doc, mas a URL de media direta retornou HTML).
- Lacunas: Cube Playground/Data Model (docs de Workspace retornaram 404 na URL tentada; não analisado), Omni (sem imagens extraídas), ChartDB/drawSQL/pgModeler/pgAdmin/DBeaver (sem docs visuais verificadas), Superset dataset editor (sem imagens), Hex/Mode, Apache Atlas UI, Power BI "DAX formula bar" (tratada via DAX query view; a barra de fórmula em si não foi pesquisada com imagens).

### Conectores — Links úteis adicionais

- Airbyte Connector Builder (overview): https://docs.airbyte.com/platform/connector-development/connector-builder-ui/overview
- Airbyte — schema change management: https://docs.airbyte.com/platform/using-airbyte/schema-change-management
- Airbyte — configuring schema: https://docs.airbyte.com/platform/using-airbyte/configuring-schema
- Fivetran — Connection Schemas: https://fivetran.com/docs/using-fivetran/fivetran-dashboard/connectors/schema
- Fivetran — Connector SDK setup form: https://fivetran.com/docs/connector-sdk/technical-reference/connector-sdk-setup-form
- Fivetran — executar setup tests via REST: https://fivetran.com/docs/rest-api/interactive-api-reference/connectors/run-setup-tests
- Power Query — get data experience: https://learn.microsoft.com/en-us/power-query/get-data-experience
- Power Query — Text/CSV: https://learn.microsoft.com/en-us/power-query/connectors/text-csv
- Fabric — Copilot in Dataflow Gen2 (explain): https://learn.microsoft.com/en-us/fabric/data-factory/dataflow-gen2-copilot-explain
- Databricks — create or modify table (file upload): https://learn.microsoft.com/en-us/azure/databricks/ingestion/create-or-modify-table
- Hex — data connections: https://learn.hex.tech/docs/connect-to-data/data-connections/data-connections-introduction
- n8n — adicionar/editar credenciais: https://docs.n8n.io/credentials/add-edit-credentials/
- Zapier — Copilot best practices: https://help.zapier.com/hc/en-us/articles/45327353705997-Best-practices-for-using-Zapier-Copilot
- Metabase — conectar bancos: https://www.metabase.com/docs/latest/databases/connecting (sem screenshots atuais)
- Metabase — sync/scan: https://www.metabase.com/docs/latest/databases/sync-scan
- Supabase — Wrappers/FDW: https://supabase.com/docs/guides/database/extensions/wrappers/overview
- Meltano Hub: https://hub.meltano.com/ (catálogo sem screenshots; selos de manutenção por conector via badges)
- Retool — resources: https://docs.retool.com/data-sources/quickstarts/resources
- Looker Studio (gallery de conectores Google/Partner; Authorize): https://support.google.com/looker-studio/answer/12388266 (sem imagens úteis acessíveis; NÃO coletado)

### Conectores — Lacunas conhecidas

- Não encontrei screenshots acessíveis/atuais de: Tableau (Connect pane, Web Data Connector), Looker Studio (galeria de conectores), Zapier (app directory), Segment, Census/Hightouch, Power Automate, Supabase (UI de Wrappers/Integrations e Assistant), n8n AI, Metabase (formulário atual "Add database"), Databricks (UI de upload de tabela), Meltano Hub.
- Fivetran setup tests: documentação existe (SDK e REST) mas sem imagem do estado "tests running/failed" na UI.
- Airbyte: catálogo de conectores na UI (aba Marketplace) descrito só em texto.
- GitHub API atingiu rate limit; stars de Singer SDK, Airbyte Python CDK, Sling e CloudQuery vêm de leitura de página (não confiáveis a ponto de decisão).
- Retool: data da UI do screenshot não informada.
- Fivetran: arquivos `.webp` entregues como `application/octet-stream` (conteúdo WebP válido).

### Workflow — Links úteis adicionais

- Kestra Copilot (modos, validação, providers): https://kestra.io/docs/ai-tools/ai-copilot
- n8n AI Workflow Builder: https://docs.n8n.io/build/ways-of-building-workflows/ai-workflow-builder
- Zapier Copilot (best practices): https://help.zapier.com/hc/en-us/articles/45327353705997-Best-practices-for-using-Zapier-Copilot
- Power Automate Copilot — dicas de prompt: https://learn.microsoft.com/en-us/power-automate/copilot-cloud-flows-tips
- Make Maia (cria/modifica/depura cenários; versão com "Revert to this version"; sem imagem de canvas verificada): https://help.make.com/introduction-to-maia-by-make
- Windmill AI flow chat / generation: https://www.windmill.dev/docs/core_concepts/ai_generation e https://www.windmill.dev/changelog/ai-flow-chat
- Node-RED + IA (FlowFuse Expert/assistant, plugin @flowfuse/nr-assistant): https://flowfuse.com/docs/user/expert
- Cursor Plan Mode (analogia plano → aprovação → execução): https://cursor.com/docs/agent/planning
- React Flow UI componentes de workflow (status, data edge, group, search): https://reactflow.dev/ui/components
- React Flow templates Workflow Editor (Pro) e AI Workflow Editor (Pro): https://reactflow.dev/ui/templates/workflow-editor · https://reactflow.dev/ui/templates/ai-workflow-editor
- Airflow Task Groups: https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dags.html
- Temporal Web UI: https://docs.temporal.io/web-ui
- Azure Data Factory — monitoramento visual de pipelines (não aprofundado nesta rodada): https://learn.microsoft.com/en-us/azure/data-factory/monitor-visually
- GitHub Actions — gráfico de visualização do run (não aprofundado): https://docs.github.com/en/actions/how-tos/monitor-workflows/use-the-visualization-graph
- Databricks Jobs (Lakeflow) (não aprofundado): https://docs.databricks.com/aws/en/jobs/
- dbt — visibilidade de runs (não aprofundado): https://docs.getdbt.com/docs/deploy/run-visibility
- KNIME docs (não aprofundado): https://docs.knime.com/
- Alteryx Designer docs (não aprofundado): https://help.alteryx.com/current/en/designer.html
- Argo Workflows (UI de grafo de estados; não aprofundado): https://argo-workflows.readthedocs.io/en/latest/
- Camunda/bpmn.io toolkit (atenção à cláusula de marca d'água): https://bpmn.io/toolkit/bpmn-js/
- Mage (pipelines em blocos; não aprofundado): https://docs.mage.ai/introduction/overview
- Retool Workflows (não aprofundado): https://docs.retool.com/workflows/
- Eclipse ELK (auto-layout com portas e hierarquia): https://eclipse.dev/elk/

### Progressive complexity — Links úteis adicionais

Verificados quanto ao acesso (HTTP 200) e lidos, mas não transformados em ficha:
- Looker Studio — Properties panel e "Configure report components" (aba **SETUP** para dados × **STYLE** para aparência; barra "Search settings"; Default date range Auto/Custom; seção de opções opcionais). Sobrepõe o Power BI Format pane já coberto. https://docs.cloud.google.com/looker/docs/studio/configure-report-components ; imagens verificadas (HTTP 200, image/png, não inspecionadas): https://docs.cloud.google.com/static/data-studio/images/search-settings.png e https://docs.cloud.google.com/static/data-studio/images/data-panel-v2-simple-numbers-2022-06-01.png
- Retool — SQL mode × GUI mode: GUI mode recomendado para escrita/ações destrutivas (preview em SQL mode executa de verdade). https://docs.retool.com/queries/guides/sql/writes ; imagem (HTTP 200, image/png; só alt "Configure the changeset", não inspecionada): https://docs.retool.com/assets/images/retool-000023@2x-18b4bef356d70e511fd2eeaba998f1e0.png
- Excel — Insert Function dialog (descrever a tarefa → lista de funções), Function Arguments wizard e tooltip de sintaxe no autocomplete: https://support.microsoft.com/en-us/office/insert-function-74474114-7c7f-43f5-bec3-096c56e2fb13 (imagens relativas `media/excel-insertfunctiondialog.png`; URL absoluta NÃO VERIFICADA).
- Grafana Metrics Drilldown (docs): https://grafana.com/docs/grafana/latest/visualizations/simplified-exploration/metrics/ e Learning journey: https://grafana.com/docs/learning-journeys/drilldown-metrics/
- Elastic — formulas/Lens docs: https://www.elastic.co/docs/explore-analyze/visualize/lens ; ES|QL em Discover: https://www.elastic.co/guide/en/kibana/8.18/try-esql.html
- Primer (GitHub) — Progressive disclosure: https://primer.style/product/ui-patterns/progressive-disclosure
- Carbon — Overflow content ("Show more", truncamento): https://carbondesignsystem.com/patterns/overflow-content/
- NN/g — Progressive disclosure (artigo e vídeo): https://www.nngroup.com/articles/progressive-disclosure/ ; https://www.nngroup.com/videos/progressive-disclosure/
- Figma Help — Guide to Dev Mode: https://help.figma.com/hc/en-us/articles/15023124644247
- GitHub — filtrando issues e PRs: https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/filtering-and-searching-issues-and-pull-requests

**Lacunas e itens NÃO cobertos (honestidade):**
- Webflow Style panel (indicadores laranja/azul de herança, seletores, estados): as páginas oficiais (university.webflow.com, help.webflow.com) retornaram **HTTP 403** a curl e WebFetch; só obtive o resumo via busca ("orange indicator = estilo herdado de ancestral; blue = vem do seletor atual"). Sem imagens verificadas. Seria excelente para o par Auto × Livre / "Redefinir"; recomendo captura manual por navegador.
- Photoshop Contextual Task Bar (Adobe): helpx.adobe.com retornou 403; apenas resumo de busca sobre Photoshop Elements (barra contextual adapta-se à seleção, pode ser fixada/ocultada). Sem imagens.
- Stripe Dashboard/Developers, Tableau Ask Data, Power BI Copilot, Airtable Interfaces e Looker Explore: não pesquisados em profundidade por tempo/redundância (Tableau Show Me já está no REFERENCE_PACK_BI.md REF-13).
- Apache Superset (popover de métrica com abas "Simple | Custom SQL | Saved"): a doc oficial pesquisada **não confirmou** esse padrão; NÃO VERIFICADO. Candidato forte para checar diretamente na UI/GitHub.
- Lens: sem screenshot oficial atual da tela completa com abas Quick functions/Formula; a ficha P1 usa o modo ES|QL do Discover (Kibana 8.18).
- Datas: a maioria das docs oficiais (Metabase, GitHub, Airbyte, Grafana "latest") não traz data de publicação; informei "latest, lida em out/2026".

### Relatórios — Links úteis adicionais

Imagens extras já verificadas (200 + image/*), úteis se algum item acima for trocado:
- Kentik Network Explorer (KPI strip por tipo de tráfego, menu de dimensões "Explore Top Talkers…", cartões por cloud/site com sparklines): https://images.ctfassets.net/6yom6slo28h2/374pCGhUYgaub7l7sP7wSm/2942296e76e875d419ca07c449cc0164/network-explorer-know-your-network.png (2693x1483; inspecionada). Útil como exemplo de seletor semântico de dimensões.
- PostHog Paths (sankey de 5 passos, "Last 7 days"): https://res.cloudinary.com/dmukukwp6/image/upload/v1710055416/posthog.com/contents/images/docs/user-guides/paths/example-light-mode.png (2534x1492; inspecionada). Doc: https://posthog.com/docs/product-analytics/paths
- Elastic APM Service Map com popover de anomalias (alternativa a REF-101, mesma capacidade): https://www.elastic.co/docs/solutions/images/observability-apm-service-map-anomaly.png (2410x1572; inspecionada). Doc: https://www.elastic.co/docs/solutions/observability/apm/service-map
- Datadog SLO com tooltip de burn rate: https://docs.dd-static.net/images/service_level_objectives/slo_burn_rate_indicator.5dcfb0541cc7e89e3566f7693a2e8a72.png?fit=max&auto=format (1340x700; inspecionada). Doc: https://docs.datadoghq.com/service_management/service_level_objectives/
- Esri 3D GIS, análise de inundação em porto com medidas 3D: https://www.esri.com/content/dam/esrisites/en-us/arcgis/products/arcgis-3d-mapping/3d-gis-overview-mg-1.jpg (1536x854; inspecionada).
- Esri Dashboards tipos Tactical e Strategic (baixa resolução): https://www.esri.com/content/dam/esrisites/en-us/arcgis/products/operations-dashboard/update-2020/assets/arcgis-dashboard-card-tactical.jpg (342x192) e .../arcgis-dashboards-strategic.png (464x261).
- Foursquare Studio, intervalo da timeline: https://files.readme.io/9220818-timeline-interval.png (842x716; baixada, não inspecionada em detalhe).
- Documentação adicional (texto): https://kb.kentik.com/docs/kentik-map.md, https://docs.datadoghq.com/infrastructure/hostmap.md, https://docs.datadoghq.com/watchdog/alerts.md (Datadog e Kentik oferecem versão .md das páginas), https://docs.kepler.gl/docs/user-guides/c-types-of-layers/k-trip (camada Trip), https://docs.honeycomb.io/notify/slos, https://docs.dynatrace.com/docs/platform/smartscape (Smartscape: imagens de baixa resolução e antigas, não usadas).

##### Lacunas e limitações desta pesquisa
- **Cloudflare Radar:** radar.cloudflare.com responde 403 a curl e a doc (developers.cloudflare.com/radar) não tem screenshots da UI. NÃO VERIFICADO; sem ficha.
- **Esri blog e doc.arcgis.com:** 403 para curl/WebFetch; usei apenas páginas de produto (imagens de marketing, baixa resolução em dois casos). Faltam dashboards reais maiores de Operations Command Center; sugiro captura direta de galeria pública da Esri em navegador.
- **Tableau (Accelerators/Gallery):** 403. **Fabric Real-Time Dashboards:** docs mostram só telas de criação (não dashboards finais); descartado. **Looker Studio, Splunk, ServiceNow, Amplitude, Mixpanel, PagerDuty (páginas de doc retornaram 404):** não pesquisados em profundidade.
- **deck.gl:** a galeria oficial (deck.gl/gallery) é interativa; não achei imagens estáveis (API do GitHub com rate limit). Para Street Intelligence 3D usei Esri como referência de composição, não de implementação.
- **Datas de captura:** NÃO VERIFICADAS para Kentik, Datadog Service Map, Datadog Host Map, Esri, PostHog, ThoughtSpot, Kepler e Foursquare; confirmadas por datas visíveis nas imagens para Dynatrace (2025–2026), Elastic anomalia (2025), Honeycomb (2025), Datadog Incident (2024); antigas e sinalizadas: Salesforce (2019), Elastic SLO detalhe (2023), Kepler (antiga).
- Interações descritas como NÃO VERIFICADAS vêm só de docs/imagens estáticas; não testei produtos ao vivo.

