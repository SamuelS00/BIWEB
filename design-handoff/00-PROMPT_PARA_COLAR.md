# 00 — PROMPT PARA COLAR NO CLAUDE DESIGN

> Anexe **todos os arquivos da pasta `design-handoff/`** (ou o `.zip`) e cole o texto abaixo.

```
Você vai criar o design system e um protótipo interativo do BIWEB Studio: uma plataforma web profissional de BI (dashboards, modelo semântico, mapas, IA contextual), usada por horas por analistas e gestores. Não é landing page, nem SaaS genérico, nem chatbot.

Todo o contexto está nos arquivos anexados. Leia na ordem, antes de qualquer decisão:
1. 01-BRIEF.md — o que fazer, em que ordem, o que entregar (§12 lista 10 arquivos obrigatórios).
2. 03-ARCHITECTURE_CONSTRAINTS.md — restrições reais do produto. Não as contradiga.
3. SCREEN_CATALOG_BI.md — escopo e briefs das telas (S00–S15).
4. 02-REFERENCE_DISTILLED.md — princípios das referências (Power BI, Figma, Tableau, Grafana). Aprenda o princípio; NÃO copie nenhuma interface.
5. 04-MOCK_DATA.md — use SOMENTE estes dados (varejo brasileiro, números que fecham).
6. 05-ACCEPTANCE_CHECKLIST.md — critérios de aceite; é a base da sua crítica final.
Consulta opcional: REFERENCE_PACK_BI.md (detalhe das referências) e SKILLS_STACK.md (contexto de processo).

Prioridades: produtividade, clareza, densidade, consistência, identidade. Densidade profissional (linhas de 28 px; 24 px no modo compacto), sem cards por propriedade, sem radius grande, sem sombras pesadas, sem gradiente/glow, sem sparkles ou estética própria para a IA. A identidade vem de tipografia, proporção, grade, componentes de BI e estados.

Comece pelas 3 direções visuais (01-BRIEF §5), recomende uma e siga com ela sem esperar resposta. Depois: tokens → componentes → shell e viewer → builder e inspector → dados e modelo semântico → mapas → IA → protótipo interativo → crítica final com correções.

Fluxos obrigatórios da IA: explicar um widget selecionado ("Por que caiu em setembro?"), propor alteração ("Crie vendas por estado."), preview no canvas e Cancelar/Aplicar, criação assistida de dashboard. Princípio: Sugerir → Pré-visualizar → Confirmar → Aplicar; nada muda em silêncio.

Em conflito entre fontes, vale a ordem de precedência do 01-BRIEF §1 (incluindo as duas exceções: profundidade de tela do BRIEF vence a fase do catálogo; a IA é de profundidade alta). Dúvida que não dá para resolver: registre em 09-decisions-and-open-questions.md e siga com a melhor premissa; não pare para perguntar.

Gere TODOS os 10 arquivos do contrato (01-BRIEF §12), dentro de uma pasta design-output/: 01-visual-direction.md, 02-design-tokens.json, 02-design-tokens.css, 03-foundations.md, 04-component-catalog.html, 05-screen-specs.md, 06-prototype/index.html, 07-ai-copilot-spec.md, 08-design-critique.md, 09-decisions-and-open-questions.md. Se algum formato não for possível, diga explicitamente o que faltou e por quê. Se tempo/contexto acabarem, corte mapas e telas secundárias antes de tokens, componentes, builder, IA e crítica.

Ao terminar, liste os arquivos gerados e o resultado do checklist (✔/✘).
```
