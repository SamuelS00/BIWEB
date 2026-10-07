# ADR-0019 — Envelope encryption para credenciais, decifradas apenas no data plane

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [17 §24.2](../17-security-and-permissions.md)

## Context
A plataforma guarda credenciais de bancos e tokens OAuth de clientes — o ativo mais sensível do sistema.

## Decision
- Segredos cifrados com **DEK por tenant** (AES-256-GCM); DEK cifrada por **KEK** em KMS (nuvem) ou Vault Transit (self-hosted); BYOK no enterprise.
- Control plane grava ciphertext e nunca precisa do plaintext após a criação; **somente o data plane** decifra, em memória, no momento da conexão.
- Redaction obrigatória em logs/erros; segredos nunca retornam pela API.

## Alternatives
Segredos em texto no banco; criptografia com chave única da aplicação; secret manager por segredo (custo/latência).

## Advantages
Comprometimento do banco não expõe credenciais; crypto-shredding por tenant; conformidade.

## Disadvantages
Chamadas ao KMS (mitigadas com cache curto de DEKs decifradas em memória).

## Risks
Perda de KEK → procedimentos de backup/rotação documentados.

## Consequences
Rotação de chaves suportada desde o início (versão da chave no ciphertext).

## Emenda 2026-10-06 — IA nativa
- Garantia reforçada para a IA: o assistente roda no control plane, que **nunca** tem credenciais decifradas. Logo, segredos não podem chegar ao contexto de modelos. Credenciais de BYO model ficam no mesmo cofre e são usadas apenas pelo adapter do Model Gateway.
