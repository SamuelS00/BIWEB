# ADR-0018 — Identidade federada via broker externo

- **Status:** Proposto (escolha do fornecedor pendente) · **Data:** 2026-10-06 · **Relacionados:** [17 §24.1](../17-security-and-permissions.md)

## Context
SSO (OIDC/SAML), MFA/passkeys, SCIM e políticas de senha são commodities com alto risco de segurança se implementadas internamente; enterprise exige todos.

## Decision
- A plataforma consome **OIDC** de um broker que federa IdPs dos clientes: **Zitadel** ou **Keycloak** (self-hostable, necessários para self-hosted) ou **WorkOS** (gerenciado, SaaS).
- A plataforma mantém usuários/grupos/atributos espelhados (para autorização) e faz **toda a autorização**.
- Sessões web por cookie HttpOnly; JWT curto apenas entre planos.

## Alternatives
Implementar SAML/OIDC próprio; Auth0/Okta CIC; Ory (Kratos/Hydra); Cognito.

## Advantages
Menos superfície de risco; time-to-market de SSO enterprise; padrões abertos permitem troca.

## Disadvantages
Dependência adicional; custo por MAU em opções gerenciadas.

## Risks
Lock-in de fornecedor gerenciado → manter fronteira OIDC/SCIM padrão.

## Consequences
Decisão Zitadel vs Keycloak vs WorkOS listada em "decisões agora" ([30](../30-roadmap.md)).
