# ADR-0003 — Schemas autorados em TypeBox, JSON Schema canônico e migrations no servidor

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** ADR-0002, [25-repository](../25-repository.md)

## Context
Os mesmos contratos (dashboard, semantic model, QDL, plugin manifest) são usados em TS (browser, control plane) e Rust (data plane). Precisamos de validação idêntica, tipos gerados e evolução controlada.

## Decision
- Autoria em **TypeBox** (`packages/schema`) → **JSON Schema 2020-12** versionado em `schemas/` (artefato canônico publicado).
- Codegen: tipos TS (nativos do TypeBox), tipos Rust (`typify`), validadores (Ajv no TS, `jsonschema` no Rust).
- `schemaVersion` inteiro no envelope; migrations puras `vN→vN+1` em `dashboard-core`, executadas **no servidor** na leitura (lazy), sem reescrever revisões; cliente recebe sempre a versão corrente; config de plugin migrada pelo próprio plugin (`configVersion` + `migrateConfig`).
- Corpus de documentos reais anonimizados por versão como suíte de testes de migração.

## Alternatives
Zod (TS-only, conversão para JSON Schema com perdas); Protobuf para documentos (ruim para extensões/JSON); JSON Schema escrito à mão; TypeSpec.

## Advantages
Uma fonte de verdade; JSON Schema é padrão aberto consumível por terceiros (plugins, SDKs, Terraform futuro); validação idêntica nos dois lados.

## Disadvantages
TypeBox é menos expressivo que Zod para refinamentos; codegen Rust de JSON Schema tem limitações (uniões complexas) → manter schemas "codegen-friendly".

## Risks
Migrations acumuladas → consolidação periódica controlada.

## Consequences
CI verifica que artefatos gerados estão atualizados; mudanças incompatíveis exigem ADR e bump de `schemaVersion`.

## Emenda 2026-10-06 — IA nativa
- Novos tipos em `packages/schema`: `ChangeOrigin`, `DataClassification`, `ChangeSet`, `UIContextSnapshot`, `ToolDefinition`, `AIPolicy`, `InsightRequest/Result`. Regra nova: **toda propriedade de schema público tem `description`** (usada por inspector, documentação e IA). Todas as extensões são aditivas.
