# KpiCard

Indicador único em WidgetFrame: rótulo → valor → variação; o consumidor fornece a métrica, o valor formatado e a comparação (valor e base).

- Valor em `kpi-value` (28 px, tabular), o único tamanho acima de 16 px no produto.
- Variação em `kpi-delta` com seta, sinal e base ("▲ +9,6% vs 2025"); cor `dash-positive`/`dash-negative` só reforça. Para métricas em que alta é ruim (custo, ruptura), o plugin inverte a cor, não a seta.
- Faixa de KPIs = container `stack` horizontal; sem ícones decorativos nem sparkline obrigatória.
