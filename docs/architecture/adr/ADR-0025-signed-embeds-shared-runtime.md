# ADR-0025 — Embedding com tokens assinados e runtime único (iframe, Web Component, React)

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [19-embedded-analytics](../19-embedded-analytics.md)

## Context
ISVs precisam incorporar dashboards com segurança por usuário final, aparência integrada e comunicação bidirecional, sem cookies de terceiros.

## Decision
- ISV assina JWT curto (chave pública registrada ou HMAC) com tenant, `sub` externo, recursos, atributos de RLS, filtros travados, permissões e tema; troca por sessão curta na Embed API (valida assinatura, exp, aud, jti, origem).
- Modos: iframe (padrão), Web Component/JS SDK (Shadow DOM), React SDK, widget individual, headless — **todos sobre o mesmo `dashboard-runtime`**.
- postMessage com allowlist de origens; eventos e comandos versionados.

## Alternatives
Links públicos com segredo na URL; iframe sem token (sessão do usuário); runtime separado para embed.

## Advantages
Segurança aplicada no servidor; sem divergência de runtime; integração flexível.

## Disadvantages
ISV precisa gerenciar chaves (mitigado por endpoint server-to-server opcional).

## Risks
Configuração incorreta de origens → validação e testes de segurança dedicados.

## Consequences
Atributos de embed alimentam o policy injector como qualquer principal.

## Emenda 2026-10-06 — IA nativa
- Claim opcional `assistant: { enabled, tools, dataAccess }` (Fase 5–6), restrito pela `AIPolicy` do tenant ISV. Custo atribuído ao ISV.
