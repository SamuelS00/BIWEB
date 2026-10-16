# Política de segurança

## Reportar uma vulnerabilidade

Não abra uma issue pública para vulnerabilidades que possam afetar usuários,
dados ou infraestrutura. Use uma [GitHub Security Advisory privada](https://github.com/SamuelS00/BIWEB/security/advisories/new), incluindo passos de reprodução, impacto esperado e versão/commit afetado.

O mantenedor confirma o recebimento em até cinco dias úteis, avalia o impacto e
coordena a correção antes de qualquer divulgação pública. Não há recompensa
financeira (bug bounty) estabelecida neste momento.

## Escopo

São considerados em escopo o front-end, pacotes publicados do monorepo,
workflows GitHub Actions, imagem Docker e infraestrutura versionada. Serviços
de terceiros e credenciais nunca devem ser incluídos no relatório.

## Boas práticas para contribuidores

- Nunca registre segredos, tokens, chaves ou dados de clientes.
- Use dependências com versões travadas pelo `pnpm-lock.yaml` e mantenha as
  atualizações revisáveis via Dependabot.
- Execute `pnpm lint`, `pnpm typecheck` e `pnpm test` antes de enviar uma PR.
