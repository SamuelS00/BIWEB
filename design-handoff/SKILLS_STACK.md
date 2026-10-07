# SKILLS STACK — Design da Plataforma de BI

> Skills que pretendemos usar junto com o [REFERENCE_PACK_BI.md](REFERENCE_PACK_BI.md).
> Este arquivo registra **papel, momento de uso e entradas/saídas** de cada skill. Ele não projeta a interface.

**Estado da pesquisa:** nenhuma dessas skills está instalada neste ambiente hoje (verificado em `~/.claude/skills` e `~/.claude/plugins`). Os campos **Fonte / instalação** estão marcados `A CONFIRMAR` e devem ser preenchidos quando cada skill for instalada. Nada aqui foi inferido sobre o funcionamento interno das skills; os papéis vêm da sua descrição.

---

## 1. Stack em uma linha

| # | Skill | Papel | Etapa |
|---|---|---|---|
| 1 | **Anthropic frontend-design** | Gerar o design | Criação |
| 2 | **Impeccable** | Impedir "AI slop" | Controle de qualidade |
| 3 | **Figma official skills** | Transformar em design system real | Sistematização |
| 4 | **Taste Skill** | Inspiração / revisão | Revisão |

**Insumo comum a todas:** o Reference Pack (princípios das seções 07–11, anti-patterns da seção 13, inventário de componentes da seção 12).

---

## 2. Ficha de cada skill

### 2.1 Anthropic frontend-design — *Gerar o design*
- **Papel:** produzir a interface (telas, componentes, código front-end).
- **Entradas do pack:** seções 07 (layout), 08 (densidade), 09 (canvas), 10 (inspector), 11 (dados) e as fichas ESSENCIAIS (REF-01 a 06, 08, 09).
- **Instrução de uso (colar no prompt):** *"Use o pack como referência de comportamento e organização. Não copie aparência de nenhuma referência. Aplique os princípios e crie identidade própria. Respeite a seção 13 (anti-patterns)."*
- **Saída esperada:** tokens iniciais, shell do editor (3 zonas), inspector, DatasetTree, FieldWells, overlay de seleção.
- **Risco a vigiar:** tendência a estética "SaaS genérico" (cards, radius grande, espaço sobrando). Mitigação: passar pelo Impeccable.
- **Fonte / instalação:** `A CONFIRMAR`

### 2.2 Impeccable — *Impedir AI slop*
- **Papel:** barreira contra o visual genérico de produto gerado por IA.
- **Entradas do pack:** seção 13 (19 anti-patterns) como checklist de reprovação; seção 08 (densidade) como critério.
- **Quando rodar:** **depois de cada geração** do frontend-design, antes de aceitar a tela.
- **Checklist mínimo a exigir (derivado do pack):**
  - Sem "card para tudo", sombras excessivas, gradientes/glow, radius enorme.
  - Controles com 24–32 px, fonte 11–13 px, separação por filete 1 px.
  - Sem sparkles/ícones de IA, sem layout de chatbot, sem títulos gigantes.
  - Cor só com significado (seleção, tipo de campo, estado, dado).
- **Saída esperada:** lista de problemas por tela + correções.
- **Fonte / instalação:** `A CONFIRMAR`

### 2.3 Figma official skills — *Transformar em design system real*
- **Papel:** converter o design aprovado em design system no Figma (variáveis/tokens, componentes, estados).
- **Entradas do pack:** seção 12 (Component inventory: Foundations → Primitives → Application → BI-specific) como ordem de construção; estados da seção 06.03.
- **Quando rodar:** depois que o visual passar pelo Impeccable.
- **Ordem sugerida:**
  1. Foundations (grid, espaçamento, tipografia curta, neutros, cor semântica, estados)
  2. Primitives (Input, Toggle, Segmented, Tabs, Chip, Menu…)
  3. Application (Sidebar, Inspector, PropertySection, TreeView, PageTabs, StatusBar)
  4. BI-specific (WidgetFrame, FieldWell, FieldChip, DatasetTree, KpiCard, ModelEntityCard, ModelRelationship…)
- **Saída esperada:** biblioteca Figma com variáveis e componentes nomeados conforme o inventário.
- **Fonte / instalação:** `A CONFIRMAR` (requer acesso ao Figma do time)

### 2.4 Taste Skill — *Inspiração / revisão*
- **Papel:** segunda opinião de gosto e coerência; apoio de inspiração e revisão crítica.
- **Entradas do pack:** matriz de referências (seção 14) e a regra "aprender o princípio, não copiar a interface".
- **Quando rodar:** em revisões de marco (shell pronto, inspector pronto, dashboard final) e quando travar em uma decisão visual.
- **Cuidado:** inspiração só vinda de **produtos reais de trabalho** (como no pack); evitar referências de landing pages, chat/IA, Dribbble conceitual.
- **Saída esperada:** comentários de revisão com prioridade (bloqueia / ajusta / opcional).
- **Fonte / instalação:** `A CONFIRMAR`

---

## 3. Fluxo de trabalho

```
Reference Pack ──► frontend-design (gera)
                        │
                        ▼
                   Impeccable (barra AI slop)  ◄──┐
                        │                          │ corrige e repete
                        ▼                          │
                   Taste Skill (revisão) ──────────┘
                        │
                        ▼
              Figma official skills (design system)
```

1. **Gerar** com frontend-design usando o pack.
2. **Filtrar** com Impeccable; repetir até passar.
3. **Revisar** com Taste Skill nos marcos.
4. **Sistematizar** no Figma (tokens → componentes).
5. Voltar ao passo 1 para a próxima tela, já usando o design system como restrição.

---

## 4. Regras do conjunto

- **O pack manda no comportamento; a identidade visual é nossa.** Nenhuma skill deve importar cor, ícone, nome ou marca das referências.
- **Anti-patterns da seção 13 são critério de reprovação**, não sugestão.
- **Medidas do pack são estimativas** (ordem de grandeza); calibrar em protótipo.
- **Decisões abertas** (tema claro/escuro, grade 12/24 colunas, DAX, IA, tempo real, densidade padrão) estão na seção 15 do pack e devem ser fechadas **antes** de rodar o frontend-design.

---

## 5. Pendências

- [ ] Confirmar fonte e instalar cada skill (preencher "Fonte / instalação").
- [ ] Fechar as decisões abertas da seção 15 do pack.
- [ ] Definir quem aprova cada marco (Taste Skill + revisão humana).
- [ ] Definir arquivo/biblioteca Figma de destino do design system.
