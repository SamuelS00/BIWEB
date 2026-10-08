# 04 · Dados fictícios

Todos os exemplos abaixo são demonstrativos, sem correspondência com rede ou clientes reais.

## Rede
- Workspace: Operações de Rede · Virtsel Telecom.
- Entidades: POP Lapa (normal), POP Barueri (atenção), POP Santo Amaro (normal); enlace `ENL-042` Barueri↔Osasco com 91% de utilização e saúde crítica; enlace `ENL-018` Lapa↔Paulista com 63% e normal.
- Métricas publicadas: Utilização média (%), Disponibilidade (%), Enlaces críticos (contagem), Atenuação (dB). Saúde é estado discreto; utilização é escala sequencial.

## Incidentes
| ID | Tipo | Região | Horário | Estado | Severidade | Evidência |
|---|---|---|---|---|---|---|
| INC-2084 | Rompimento de fibra | Barueri | 07/10/2026 08:14 | Ativo | Crítica | ENL-042, perda de sinal > 18 dB |
| INC-2077 | Degradação de enlace | Osasco | 07/10/2026 06:42 | Em análise | Alta | utilização 91%, latência acima de 40 ms |
| INC-2051 | Alarme de energia | Lapa | 06/10/2026 21:06 | Resolvido | Média | alerta do POP, duração 38 min |

Histograma demonstrativo: 2, 4, 3, 7, 5, 8, 4 eventos em janelas de 4 h. Layer modes compartilham o mesmo conjunto de eventos.

## Workflow
`wf_rede_qualidade`: Fonte netops-db → Importar inventário → Transformar eventos → Validar chaves → Juntar alarmes → Publicar modelo semântico → Atualizar dashboard. Execução de exemplo: 6/7 concluídos, “Validar chaves” com falha de chaves duplicadas; retry demonstrativo. Agendamento: diário 05:30 BRT.
# Dados e comportamento do protótipo

As novas experiências funcionam sem backend. Todos os dados abaixo são fixtures locais, reproduzíveis e rotulados na interface como demonstrativos.

| Experiência | Fixture | Controles locais |
|---|---|---|
| Anomaly Explorer | Série de latência/disponibilidade, baseline, eventos com horário, região e score | Região, medida, seleção de anomalia, leitura de evidência e expansão da hipótese |
| SLA & Risk Monitor | SLO, disponibilidade, orçamento consumido, burn rate e projeção por serviço; políticas de exemplo | Serviço e janela móvel de análise |
| Customer Behavior | Funil de onboarding, coortes de retenção e caminhos de sessão | Segmento e vistas Jornada, Coortes e Caminhos |
| Incident Intelligence | Eventos, sites e enlaces da fixture da rede | Camadas, seleção, agregação ponto/cluster/calor/hexbin e replay temporal |

Os valores não representam clientes, serviços ou telemetria reais. A interface não envia alertas, executa consultas remotas, agenda fluxos ou altera uma fonte externa.

No workspace geoespacial, coordenadas de POPs e ativos são aproximadas para fins de demonstração. Tiles de ruas vêm do OpenStreetMap e aparecem com a atribuição exigida; todos os overlays operacionais continuam locais e sintéticos.
