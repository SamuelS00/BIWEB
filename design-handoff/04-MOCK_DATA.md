# 04 — DADOS DE EXEMPLO (universo único e consistente)

> **Use estes dados em todas as telas e no protótipo.** Os números fecham entre si (somas e razões conferidas). Não invente outros. Todos são fictícios e ilustrativos.
> Local e formatos: **pt-BR** — `R$ 18,4 mi`, `42.381`, vírgula decimal, datas `dd/mm/aaaa`, meses `jan`, `fev`…

## 1. Empresa e usuários
- **Empresa:** *Lume Varejo* (rede de varejo omnichannel: eletrônicos, casa, moda, esporte, beleza). Workspace: **Comercial**.
- **Marina Costa** — Analista de BI (editora; usuária principal do builder).
- **Rafael Lima** — Gerente Comercial (leitor; usa o viewer).
- **Paula Teixeira** — Data steward (certifica métricas).
- **Período padrão:** 01/01/2026 a 30/09/2026 (9 meses). Moeda: BRL.

## 2. Dashboards (lista do workspace)
| Nome | Estado | Dono | Atualizado | Certificação |
|---|---|---|---|---|
| **Visão Executiva de Vendas** | Publicado (v12) | Marina Costa | hoje 08:12 | Certificado |
| Desempenho por Região | Publicado | Marina Costa | 02/10/2026 | Certificado |
| Estoque e Ruptura | **Rascunho** | Marina Costa | hoje 09:40 | — |
| Clientes e Retenção | Publicado | Paula Teixeira | 28/09/2026 | — |
| Mapa de Lojas | Publicado | Marina Costa | 15/09/2026 | — |
| Margem por Categoria (antigo) | Depreciado | Rafael Lima | 11/03/2026 | Depreciado |

**Dashboard de referência para o builder/viewer: "Visão Executiva de Vendas"** (páginas: *Visão geral*, *Produtos*, *Regiões*, *Lojas*).

## 3. Conexões e datasets
| Conexão | Tipo | Estado |
|---|---|---|
| `pg-erp-producao` | PostgreSQL (live) | Conectado |
| `bq-ecommerce` | BigQuery (live) | Conectado |
| `metas_2026.csv` | Upload (importado) | Ingestão concluída (1,2 mil linhas) |
| `sap-estoque` | API (sync) | Falha de credencial *(estado de erro)* |

Datasets: `vendas_pedidos` (tabela principal, 42.381 pedidos no período), `vendas_itens`, `produtos`, `clientes`, `lojas`, `calendario`, `metas_2026`.

## 4. Modelo semântico **Vendas Varejo** (rascunho v13, publicado v12)
**Entidades:** Pedido (PK `pedido_id`), ItemPedido, Produto (PK `produto_id`), Cliente (PK `cliente_id`), Loja (PK `loja_id`), Calendário (PK `data`).

**Dimensões:** `Data` (time: dia, mês, trimestre, ano), `Categoria`, `Produto`, `Marca`, `Canal` (Loja física · E-commerce · Marketplace), `Região` (Sudeste · Sul · Nordeste · Centro-Oeste · Norte), `Estado` (geo), `Cidade` (geo), `Loja`, `Segmento do cliente`. **Hierarquias:** Data (ano › trimestre › mês › dia); Geografia (região › estado › cidade); Produto (categoria › marca › produto).

**Medidas:** `soma_valor_liquido`, `soma_custo`, `contagem_pedidos`, `contagem_clientes_distintos`.
**Métricas (publicadas):**
| Métrica | Definição | Certificação |
|---|---|---|
| **Receita** | soma do valor líquido de pedidos pagos | Certificada |
| **Margem %** | (Receita − Custo) / Receita | Certificada |
| **Pedidos** | contagem de pedidos pagos | Certificada |
| **Ticket médio** | Receita / Pedidos | Certificada |
| **Receita vs ano anterior** | Receita com modificador YoY | Rascunho |
| **Taxa de ruptura** | pedidos com item sem estoque / pedidos | Rascunho |
**Campo depreciado (exemplo de estado):** `Margem bruta (legado)` → substituto `Margem %`, 3 dependentes.
**Campo classificado:** `E-mail do cliente` — PII (mascarado para leitores).
**Relações:** Pedido *→1 Cliente; Pedido *→1 Loja; ItemPedido *→1 Pedido; ItemPedido *→1 Produto; Pedido *→1 Calendário (ativa); Pedido *→1 Calendário via `data_envio` (**inativa**).
**Sinônimos (exemplo):** Receita = faturamento, vendas líquidas.

## 5. KPIs do período (jan–set/2026)
| KPI | Valor | Variação vs mesmo período de 2025 |
|---|---|---|
| **Receita** | **R$ 18,4 mi** | +9,6% |
| **Margem** | **27,8%** | −0,4 p.p. |
| **Pedidos** | **42.381** | +7,1% |
| **Ticket médio** | **R$ 434** | +2,4% |

*(18.400.000 ÷ 42.381 = R$ 434,17.)*

## 6. Série mensal (2026)
| Mês | Receita (R$ mi) | Pedidos | Ticket (R$) |
|---|---|---|---|
| jan | 1,85 | 4.390 | 421 |
| fev | 1,92 | 4.480 | 429 |
| mar | 2,10 | 4.810 | 437 |
| abr | 2,05 | 4.700 | 436 |
| mai | 2,18 | 4.980 | 438 |
| jun | 2,25 | 5.140 | 438 |
| jul | 2,31 | 5.290 | 437 |
| ago | 2,22 | 5.150 | 431 |
| **set** | **1,52** | **3.441** | 442 |
| **Total** | **18,40** | **42.381** | **434** |

**Queda de setembro:** receita R$ 1,52 mi vs ago R$ 2,22 mi = **−R$ 0,70 mi (−31,5%)**; pedidos −33,2%.

## 7. Receita por região (R$ mi, total 18,4)
Sudeste **8,1** · Sul **3,9** · Nordeste **3,6** · Centro-Oeste **1,7** · Norte **1,1**.

## 8. Receita por estado (R$ mi)
SP **4,3** · RJ **1,9** · MG **1,6** · RS **1,5** · PR **1,3** · BA **1,2** · SC **1,1** · PE **0,9** · GO **0,8** · CE **0,7** · demais **3,1** (total 18,4).
*(Sudeste = SP + RJ + MG + ES 0,3; Sul = PR + RS + SC.)*

## 9. Receita por categoria (R$ mi, total 18,4)
Eletrônicos **6,2** · Casa e Cozinha **4,3** · Moda **3,5** · Esporte **2,6** · Beleza **1,8**.

## 10. Top produtos (R$ mi)
Smart TV 55" 4K **1,42** · Fritadeira Elétrica 5 L **0,98** · Tênis Corrida Pulse **0,87** · Notebook 15" i5 **0,84** · Cafeteira Expresso **0,71**.

## 11. Canais (participação na receita)
Loja física **48%** · E-commerce **37%** · Marketplace **15%**.

## 12. Fixture da IA — "Por que caiu em setembro?"
Contexto: widget selecionado **"Receita por mês"**; período jan–set/2026.

**Resposta com evidências (valores ilustrativos que fecham em −R$ 0,70 mi):**
- Por categoria: Eletrônicos **−0,41** · Casa e Cozinha **−0,12** · Moda **−0,09** · Esporte **−0,05** · Beleza **−0,03**.
- Por região: Sudeste **−0,38** · Nordeste **−0,13** · Sul **−0,12** · Centro-Oeste **−0,04** · Norte **−0,03**.
- Maior contribuinte individual: **Smart TV 55" 4K** (queda de volume em SP), coincidindo com **ruptura de estoque** (taxa de ruptura 14,2% em set vs 4,8% em ago; *métrica em rascunho — sinalizar*).
- Citações: dados de `vendas_pedidos` (01/08–30/09/2026), métricas Receita e Pedidos (certificadas).

**Ações sugeridas (cada uma é uma proposta com preview):** adicionar "Variação por categoria" (barras divergentes); adicionar filtro "Categoria"; criar métrica "Taxa de ruptura" no rascunho do modelo (publicação humana).

## 13. Fixture da IA — "Crie vendas por estado."
**Proposta:** adicionar visualização **mapa coroplético + barras** "Receita por estado", métrica **Receita**, dimensão **Estado**, posição abaixo dos KPIs na página *Regiões*, 6×4 colunas (grade de 12). Preview com widget fantasma; botões **Cancelar / Aplicar**; após aplicar, 1 passo de undo "IA: Adicionar Receita por estado".

## 14. Fixture da IA — "Criar dashboard a partir de um objetivo"
Objetivo digitado: *"Acompanhar vendas semanais por canal e meta."* Proposta: 1 página, 4 KPIs (Receita, Meta atingida %, Pedidos, Ticket médio), linha "Receita semanal por canal", barras "Atingimento da meta por região", filtros Período e Canal. Exibir como proposta completa para preview (fantasmas).

## 15. Filtros e estados úteis
Filtros globais: **Período** (padrão "Últimos 9 meses"), **Região**, **Canal**, **Categoria**. Filtro ativo exemplo: *Região: Sudeste, Sul* · *Canal: E-commerce*. Cross-filter exemplo: clicar em "Eletrônicos" destaca barras relacionadas nos demais.
**Mapa (Mapa de Lojas):** 312 lojas; camadas: *Lojas* (marcadores com cluster), *Densidade de receita* (heatmap), *Estados* (polígonos coropléticos). Filtro geográfico por seleção de retângulo/estado.
**Estados de erro/vazio para mostrar:** conexão `sap-estoque` com falha; widget sem dados no filtro "Norte + Marketplace + Beleza"; sem permissão em `E-mail do cliente`.
