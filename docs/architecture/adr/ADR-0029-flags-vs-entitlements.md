# ADR-0029 — Feature flags (OpenFeature) separadas de entitlements (edições)

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [24](../24-testing-and-cicd.md)

## Context
Lançamentos graduais e edições (Community, Cloud, Enterprise, Embedded, Self-hosted) costumam ser misturados em flags, criando `if`s permanentes e confusão comercial.

## Decision
- **Flags**: OpenFeature + Unleash/flagd (LaunchDarkly opcional), temporárias, com dono e data de remoção; kill switches operacionais.
- **Entitlements**: capabilities e limites por tenant vindos do contexto Tenancy & Entitlements (contrato/licença); um único `entitlements.check`.
- Código enterprise em `ee/`/features Cargo; licença self-hosted assinada offline (Ed25519).

## Alternatives
Flags para tudo; builds diferentes por edição sem capabilities; licenças online obrigatórias.

## Advantages
Separação clara entre risco operacional e licenciamento; suporta air-gapped.

## Disadvantages
Dois sistemas para manter.

## Risks
Flags esquecidas → lint/alertas de flags antigas.

## Consequences
UI e APIs consultam entitlements, nunca flags, para permissões comerciais.

## Emenda 2026-10-06 — IA nativa
- Entitlements novos: `ai.assistant`, `ai.analysis`, `ai.modeling`, `ai.transform`, `ai.byo_model`, `ai.credits`. **Kill switch** da IA (global, por provedor, por ferramenta) via flags operacionais. Trocas de modelo por flag com canário.
