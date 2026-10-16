# Changesets

Use Changesets para documentar e versionar alterações nos pacotes públicos.

```bash
pnpm changeset
```

Escolha o pacote afetado, o nível semver e descreva a mudança. O workflow
`release.yml` abre uma pull request de versões e changelog. Após sua aprovação,
crie e envie uma tag `vX.Y.Z`; o workflow `github-release.yml` publica a GitHub
Release correspondente.

Pacotes marcados como `private` são ignorados. Publicação em npm não é ativada
até que a organização defina o escopo/registro e disponibilize o token próprio.
