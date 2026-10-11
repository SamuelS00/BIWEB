# BIWEB Discovery Engine (BDE) · Discovery Studio

> **Evidence-Driven External Intelligence Engine.** Ciclo: DISCOVER → ACQUIRE → EXTRACT → UNDERSTAND → VERIFY → CONNECT → MONITOR → DELIVER.
> Estado: **protótipo de front-end** (`apps/web/src/discovery/`, rota `/discovery`), com dados demonstrativos e determinísticos. Nada consulta a web de verdade; o motor, a aquisição e a persistência são arquitetura aprovada ([ADR-0045](../architecture/adr/ADR-0045-biweb-discovery-engine.md)), ainda não implementada.
> Plano e auditoria da implementação: [00-audit-and-plan.md](00-audit-and-plan.md). Como o protótipo está organizado: [`PROJETO.md` §5.10](../PROJETO.md).

## 1. Purpose

O LDE entende os dados que a organização já tem. O BDE responde à outra metade: **o que está acontecendo fora da organização**. Ele explora fontes **públicas ou autorizadas**, encontra informação relevante, transforma conteúdo não estruturado em observações estruturadas, preserva evidências, identifica entidades, acompanha mudanças e alimenta os demais motores.

O BDE **não é** um web scraper e **não armazena páginas**. Páginas web, documentos, APIs públicas, open data, notícias, dados regulatórios, páginas de produto, release notes e registros públicos viram **observations, entities, relationships, changes, evidence, conflicts, enrichment proposals e research datasets**.

A pergunta central do módulo não é "o que existe nessa página?", e sim:

> **O que descobrimos, de onde veio, o quanto confiamos nisso e o que mudou?**

Vocabulário comercial: Discovery, Research, External Intelligence, Evidence, Monitoring, Enrichment. "Scraping" só aparece em contexto técnico.

## 2. Ecossistema e fronteiras de confiança

| Camada | Tipo de inteligência | Pergunta |
|---|---|---|
| **LDE** · Living Data Engine | Internal Intelligence | "What does our data mean?" |
| **BDE** · BIWEB Discovery Engine | External Intelligence | "What is happening outside the organization?" |
| **BCE** · BIWEB Composition Engine | Application Intelligence | "How should this intelligence become an application?" |
| **Analytics Migration Engine** | Reconstruction Intelligence | "What does this existing analytical application do?" |
| **BIWEB Copilot** (Intelligence Core) | Contextual / Operational Intelligence | "What does all of this mean, and what can we do with it?" |

```
                    BIWEB COPILOT
              (Intelligence Core: contexto global)
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
       LDE              BDE              BCE
  INTERNAL DATA    EXTERNAL WORLD     APPLICATIONS
        │                │                │
        └────────────────┼────────────────┘
                         │
              ANALYTICS MIGRATION
                         │
                         ▼
        REPORT / MAP / WORKFLOW BUILDERS
                         │
                         ▼
                  BIWEB OPERATIONS
```

O LDE entende os dados internos; o BDE entende o mundo externo; ambos geram **Trusted Knowledge**, que alimenta o BCE (contratos de aplicação), que alimenta Report, Map e Workflow Builders, que alimentam Operations. O Migration Engine também usa LDE + BCE para reconstruir aplicações existentes. O Copilot atravessa todas as camadas. Os motores são independentes, porém muito mais poderosos combinados; **BDE e LDE não são o mesmo sistema**.

**Fronteiras de confiança** (visíveis na UI, na documentação e na apresentação):

| Motor | Papel |
|---|---|
| **BDE** | **DESCOBRE** |
| **LDE** | **CONFIA, APÓS VALIDAR** |
| **BCE** | **CONSTRÓI A PARTIR DE CONTRATOS** |
| **Copilot** | **EXPLICA E ORQUESTRA** |

Nota de nomes: o contexto global do Copilot chama-se **BIWEB Intelligence Core** ([ADR-0044](../architecture/adr/ADR-0044-copilot-intelligence-core.md)), que substitui o termo provisório "Super Brain" usado em rascunhos.

## 3. Core Concepts

| Conceito | Significado |
|---|---|
| **Observation** | Unidade de inteligência: um fato com `subject`, `claim`, `observedAt`, `source`, `evidence`, `confidence` e `status`. Mantém histórico (Aug $1,999 → Sep $2,199 → Oct $2,500); nunca é sobrescrita. |
| **Evidence** | O trecho/registro concreto que sustenta a observation, com origem, momento da captura e localização (seção, página + região, registro/campo). |
| **Confidence** | Sempre **decomposta**: source authority, freshness, corroboration, extraction, entity match e contradictions. 92% = Official source High · Freshness High · Corroboration Medium · Extraction High · Conflict None. O agregado é derivado dos componentes. |
| **Source** | Origem com tipo, autoridade (PRIMARY, SECONDARY, REFERENCE, DISCOVERY), saúde, política e snapshots. Sem "score único de qualidade". |
| **Entity** | Organization, Product, Service, Technology, Location, Market, Regulation, Publication, Event. Person só quando permitido e relevante. |
| **Semantic Change** | Mudança descrita pelo significado ("Pricing disclosed: Contact Sales → Starting at $2,500/month"), nunca por diff de HTML. |
| **Research Mission / Watchlist** | Investigação com objetivo (Mission) e acompanhamento contínuo (Watchlist). |
| **Discovery Dataset** | Resultado versionado e entregável a LDE, Reports, Maps e Workflows. |

Fontes duplicadas não são evidências independentes: um artigo sindicado em 12 domínios é **1 original + 11 espelhos**.

## 4. Research Missions

O usuário não configura seletores; cria uma **Research Mission**: WHAT (o que descobrir) · WHERE (onde buscar) · WHO (entidades) · EXTRACT (informações) · VERIFY (como validar) · WHEN (quando executar) · DELIVER (onde usar). O wizard tem 8 passos (Objective, Entities, Discover, Extract, Verify, Frequency, Output, Review) e termina na **ResearchSpec**, o contrato legível da missão:

```
Objective: Monitor BI competitors
Entities:  Power BI, Tableau, Qlik
Sources:   official, documentation, news
Extract:   pricing, features, integrations
Frequency: daily
Deliver:   competitive_intelligence_dataset
```

Templates: Competitive Intelligence, Company Enrichment, Market Exploration, Find Public Data, Regulatory Intelligence, Technology Landscape. Vocabulário técnico (CSS selector, XPath, browser context, proxy, DOM, HTTP headers) existe só em **Advanced** (Settings e a aba Policy de cada fonte).

## 5. Discovery

A pesquisa em **Explore** inicia uma investigação, não devolve uma lista de links: *Understanding intent → Expanding search concepts → Discovering candidate sources → Evaluating relevance → Extracting entities → Cross-checking evidence → Building result*. As fontes candidatas são classificadas como Relevant, Low relevance, Duplicate, Blocked ou Policy restricted. Buscas amplas ("analise profundamente o mercado de BI") geram primeiro um **Research Plan** com [Run Research]. O resultado aparece em Overview, Table, Entities, Relationships, Map, Evidence e Sources.

## 6. Acquisition

Estratégias de aquisição (Auto, API, HTTP, Browser, Document) e renderização (Auto, Static, Dynamic) são detalhes de **Advanced**. Todo objeto adquirido (HTML, JSON, PDF, API, RSS, Open Data) converge para **Normalized Documents**; o que importa ao usuário é a fonte, não o transporte. Respeita robots, rate limit, licença e retenção; quando uma fonte é bloqueada (robots, policy, rate limit, auth required, indisponível, removida) a UI **mostra o bloqueio e o motivo e não o contorna**.

## 7. Extraction

Web pages, PDFs, APIs e registros viram observations por regras ou assistidas por IA, com **Extraction Schemas** que normalizam sites diferentes na mesma estrutura (ex.: *Product Intelligence*: `product_name`, `pricing_model`, `starting_price`, `features[]`, `integrations[]`, `availability`, `last_updated`). **Custom Extractors** ("Create Extraction Template") mostram uma prévia antes de salvar. A interpretação de IA fica visualmente separada da evidência.

## 8. Entities

Catálogo de entidades externas com aliases, site oficial, conhecimento (HQ, indústria, produtos, integrações, localizações, cobertura de evidência), **Entity Resolution** (Microsoft Corp. / Microsoft Corporation / MSFT / microsoft.com → Microsoft, 99%, com as evidências do casamento e revisão quando ambíguo), **Relationship Graph** (offers, integrates, operates in, announced, competes with) e **Compare** (cada célula com evidence count, confidence e last confirmed).

## 9. Observations e Evidence

Cada observation traz claim, valor, origem, evidências, tipo de extração, corroboração e histórico. O **Evidence Pack** reúne a evidência de uma afirmação (Primary/Secondary, High/Medium), primeira observação, última confirmação e contradições. **Source Provenance** abre a origem: trecho destacado (web), página e região (PDF) ou registro e campo (dado estruturado); "Verify" conecta uma segunda evidência e a confiança sobe (72% → 91% → 97%). Sem evidência suficiente a UI mostra **Needs verification**.

## 10. Changes e Watchlists

Uma **Watchlist** acompanha entidades continuamente (ex.: "BI Competitors": 5 entidades, 72 fontes, diária) e lista as mudanças relevantes por categoria (Pricing, Product, Documentation, News). Cada **Semantic Change** tem Before/After estruturado (Removed/Added/Modified; Feature removed/added, Price changed, Location changed, Product renamed), evidências, fonte e **snapshots** que provam quando a mudança apareceu. Há linha do tempo por entidade.

## 11. Conflicts

Quando fontes discordam (site oficial 12 escritórios × dataset aberto 10) o **Conflict Review** recomenda um lado e explica o motivo (fonte primária + observação mais recente); a pessoa decide: aceitar, escolher a alternativa ou manter aberto. Aceitar atualiza o estado visível em todo o módulo.

## 12. Research Datasets

Um **Discovery Dataset** é versionado (ex.: *Competitive Intelligence v4*: 6 empresas, 42 campos, 91% de cobertura de evidência, 12 mudanças desde a v3) e se entrega por handoff, sem duplicar outros módulos:

| Destino | Ação | Responsabilidade do destino |
|---|---|---|
| LDE / Data Workspace | Send to LDE · Open in Data Workspace | organiza e confia em dados validados |
| Map Builder | Open in Map Builder | constrói aplicações geográficas |
| Report Builder | Create Report | constrói dashboards |
| Workflow Builder | Create Workflow | define automação a partir de eventos |

## 13. LDE Integration

Fluxo obrigatório: **DISCOVER → PROPOSE → REVIEW → LDE VALIDATION → APPLY.** O BDE nunca altera o modelo interno do LDE.

```
External Observation → Enrichment Proposal → LDE (Match · Validate · Normalize · Relate) → Review → Trusted Internal Data
```

No protótipo: a entidade interna "Nova Telecom Ltda." (CNPJ, Company Name, Revenue) casa com a descoberta externa (match 98%) e gera a proposta "Add 5 external attributes" (Website, Industry, Headquarters, Locations, Product categories), cada campo com Source, Confidence, Last observed e Privacy/policy. **Send to LDE** entrega a proposta à tela de Enriquecimento do Data Workspace (bloco "Externo · BDE"), onde só é aplicada depois da revisão.

## 14. BCE Integration

O BCE constrói a partir de contratos. Um pedido como "Crie um dashboard para acompanhar esses concorrentes" segue: Competitive Intelligence Dataset → Copilot interpreta → BCE gera o ReportSpec → Report Builder → Competitive Dashboard. O BDE entrega o dataset; quem constrói é o BCE.

## 15. Copilot Integration

O Copilot existente (sem outro chatbot) entende Research Missions, Sources, Entities, Observations, Changes, Evidence, Conflicts, Watchlists e Discovery Datasets. Ao selecionar uma entidade ele herda o contexto dela. Respostas citam evidência clicável que abre o Evidence Pack. Ações: Research, Explain, Compare, Find evidence, Expand search, Create watchlist, Enrich with LDE, Build report. Como todo o Copilot, respeita `aiEnabled` e propõe, não aplica.

## 16. Governance e Segurança

O BDE opera **somente** sobre fontes públicas ou autorizadas.

- Respeita robots, rate limits, licença, atribuição e retenção (padrão do protótipo: acesso Public/Authorized, robots Respected, rate limit configurado, retenção 90 dias, licença registrada, atribuição obrigatória, dados pessoais Restricted).
- **Sem bypass:** não há na UI nem na arquitetura funcionalidade para contornar autenticação, CAPTCHA, rate limit ou acessar fontes privadas não autorizadas.
- **Proveniência e auditabilidade:** toda informação exibida pode ser rastreada até a fonte e o instante da captura.
- **Privacidade:** dados pessoais restritos por política; Person só quando permitido e relevante.
- **Revisão humana:** nada externo entra no conhecimento interno sem Review + validação do LDE.
- **Sem fatos inventados:** toda afirmação mostra Source, Evidence e Confidence ou "Needs verification".

## 17. Contracts

Conceituais (tipos em `discovery/data/types.ts`, sem implementação de motor):

| Contrato | Responsabilidade |
|---|---|
| `ResearchSpec` | descreve o que investigar (objetivo, entidades, fontes, o que extrair, verificação, frequência, entrega) |
| `ResearchMission` | missão em execução: spec, estado, próximas execuções, contagens |
| `SourceDescriptor` / `SourcePolicy` | fonte, tipo, autoridade, saúde e a política que a rege |
| `FetchSnapshot` | captura de uma fonte num instante (prova de quando algo apareceu) |
| `ExternalDocument` | documento normalizado (HTML, PDF, JSON, API, RSS) e seus campos extraídos |
| `Observation` | fato com subject, claim, origem, evidência, confiança decomposta, status e histórico |
| `Evidence` | trecho/registro que sustenta uma observation, com localização |
| `EvidencePack` | evidências de uma afirmação, primeira/última confirmação e contradições |
| `EntityCandidate` | entidade externa com aliases, conhecimento e resolução |
| `ChangeEvent` | mudança semântica (antes/depois, tipo, evidências) |
| `Conflict` | divergência entre fontes, recomendação e razão |
| `EnrichmentProposal` | atributos externos propostos ao LDE, por campo com fonte e confiança |
| `ResearchDataset` | resultado versionado entregável a LDE, Reports, Maps e Workflows |
| `DiscoveryResult` | resultado de uma consulta do Explore |

## 18. Product flows

```
External World → BDE → Observations + Evidence → LDE → Trusted Knowledge → BCE → Applications
BDE Event (ex.: pricing change) → Workflow Builder → Review evidence → Notify team → Update dashboard
```

Cenário ponta a ponta: o LDE entende os dados internos (Oracle, CRM, Excel); o BDE descobre inteligência externa (mercado, concorrentes, publicações regulatórias); o LDE conecta o enriquecimento confiável às entidades internas; o Migration Engine reconstrói os ativos Power BI; o BCE cria especificações validadas de Report/Map/Workflow; os Builders constroem as aplicações; o Copilot entende o ambiente completo.

## 19. Future capabilities

Aquisição e extração reais (hoje simuladas), persistência de observations/snapshots, alertas e Watchlists agendadas de verdade, extratores assistidos por IA com avaliação contínua, políticas por tenant, marketplace de Extraction Schemas, conectores de dados abertos adicionais e Person como entidade sob política explícita.

## Dados demonstrativos

Workspace **NovaLink Operations**. Missions: BI Competitive Intelligence, Fiber Network Market Brazil, Company Enrichment, Regulatory Watch, Technology Landscape (+7 menores, 12 ativas). Preços, mudanças e empresas são **fictícios ou demonstrativos**; os nomes de fornecedores de BI aparecem como no Migration Studio. Os números globais vêm de `discovery/data/seed.ts` e são conferidos por `discovery/data/seed.test.ts`. Detalhes em [`PROJETO.md` §5.10](../PROJETO.md).
