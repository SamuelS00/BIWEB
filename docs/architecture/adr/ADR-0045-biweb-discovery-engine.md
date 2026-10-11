# ADR-0045 — BIWEB Discovery Engine (BDE) como motor independente de inteligência externa

- **Status:** Aceito · **Data:** 2026-10-11 · **Relacionados:** ADR-0042, 0043, 0044, 22 (governança), [docs/bde](../../bde/01-biweb-discovery-engine.md)

## Context
O LDE entende dados internos. Não há um lugar no ecossistema para descobrir, verificar e monitorar informação **externa** (mercado, concorrentes, dados abertos, publicações regulatórias) com proveniência, nem para entregá-la com segurança ao conhecimento interno.

## Decision
- Criar o **BIWEB Discovery Engine (BDE)**, exposto como **Discovery Studio**, no mesmo nível do LDE e do BCE, como serviço independente (consistente com ADR-0043).
- O BDE **descobre**; o **LDE confia depois de validar**; o **BCE constrói a partir de contratos**; o **Copilot explica e orquestra**.
- Unidade de inteligência: **Observation** com source, evidence, confidence **decomposta** (authority, freshness, corroboration, extraction, entity match, contradictions) e histórico imutável. O BDE não armazena páginas.
- Fluxo obrigatório **DISCOVER → PROPOSE → REVIEW → LDE VALIDATION → APPLY**: o BDE nunca altera o modelo do LDE; entrega **EnrichmentProposal**.
- Opera só sobre fontes **públicas ou autorizadas**; respeita robots, rate limit, licença e retenção; **não há bypass** de autenticação, CAPTCHA ou rate limit. Bloqueios são exibidos com motivo.
- Handoffs, sem duplicar módulos: Data Workspace (dados confiáveis), Map Builder (geografia), Report Builder (tabelas e comparações), Workflow Builder (eventos), via contratos do BCE.
- Contratos: ResearchSpec, ResearchMission, SourceDescriptor, SourcePolicy, FetchSnapshot, ExternalDocument, Observation, Evidence, EvidencePack, EntityCandidate, ChangeEvent, Conflict, EnrichmentProposal, ResearchDataset, DiscoveryResult.

## Alternatives
Estender o LDE com "fontes web" (mistura inteligência interna e externa e enfraquece a fronteira de confiança); tratar como scraper dentro dos Builders (sem proveniência nem governança).

## Advantages
Fronteira de confiança clara; rastreabilidade total; mudança semântica em vez de diff de HTML; cada motor evolui sozinho.

## Disadvantages
Mais um serviço a operar; custo de curadoria de políticas e de extração.

## Risks
Aquisição em desacordo com termos de uso ou privacidade (mitigado por políticas por fonte, retenção e revisão humana); falsa certeza (mitigado por confiança decomposta e "Needs verification").

## Consequences
O protótipo (`apps/web/src/discovery`) roda sobre dados demonstrativos e determinísticos, sem backend. Motor real, aquisição e persistência ficam para fases futuras.
