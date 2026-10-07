# design-handoff — pacote para o Claude Design

**Como usar:** anexe todos os arquivos desta pasta (ou `design-handoff.zip`) e cole o conteúdo do bloco de `00-PROMPT_PARA_COLAR.md`.

| Arquivo | Papel | Prioridade de leitura |
|---|---|---|
| `00-PROMPT_PARA_COLAR.md` | Prompt curto para colar na conversa | — (você cola) |
| `01-BRIEF.md` | Brief completo: visão, plano, componentes, telas, IA, entregáveis | 1 |
| `03-ARCHITECTURE_CONSTRAINTS.md` | Restrições reais da arquitetura (síntese de 04, 06 e ADR-0032) | 2 |
| `SCREEN_CATALOG_BI.md` | Cruzamento arquitetura × referências + briefs das telas S00–S15 | 3 |
| `02-REFERENCE_DISTILLED.md` | Princípios das referências, medidas de partida, anti-patterns, inventário | 4 |
| `04-MOCK_DATA.md` | Dados de exemplo consistentes (varejo, pt-BR) | 5 |
| `05-ACCEPTANCE_CHECKLIST.md` | Critérios binários para a crítica final | 6 |
| `REFERENCE_PACK_BI.md` | Pack completo (17 fichas, ~63 imagens por link) — consulta | opcional |
| `SKILLS_STACK.md` | Fluxo de skills — contexto de processo | opcional |

**Precedência em conflito:** 03 > SCREEN_CATALOG > 01 > 02 > pack completo > SKILLS_STACK.

**Saída esperada do Claude Design:** pasta `design-output/` com 10 arquivos: `01-visual-direction.md`, `02-design-tokens.json`, `02-design-tokens.css`, `03-foundations.md`, `04-component-catalog.html`, `05-screen-specs.md`, `06-prototype/index.html`, `07-ai-copilot-spec.md`, `08-design-critique.md`, `09-decisions-and-open-questions.md`. A pasta separada evita confusão com os arquivos de entrada, que também começam com números.

**Notas**
- As imagens das referências são **links** para documentação oficial; nada foi baixado. Se a ferramenta não abre URLs, `02-REFERENCE_DISTILLED.md` basta em texto.
- Os docs `docs/architecture/*` completos **não** estão no pacote; `03-ARCHITECTURE_CONSTRAINTS.md` os resume. Anexe `04-frontend-architecture.md`, `06-dashboard-builder.md` e `adr/ADR-0032-design-system.md` se a ferramenta aceitar mais arquivos.
