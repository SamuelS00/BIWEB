# Map Workspace

`/maps` lista os mapas operacionais numa galeria (capas desenhadas com os mesmos dados dos mapas). `/maps/:mapId` abre o workspace compartilhado (`MapBuilder`) para um deles. Os endereços antigos (`/maps/network-intelligence`, `/maps/incident-intelligence`, `/maps/street-intelligence`) redirecionam. `map-workspace.tsx` mantém só as telas de análise **Dependency & Impact** e **Historical Replay**.

| Mapa | Leitura própria |
|---|---|
| `network` Network OPS | Trechos de fibra seguindo as vias, faixas de atenuação, simulação de rompimento com rota alternativa e checagem de capacidade (`network-tools.ts`) |
| `theft` Furto de cabos | Focos de reincidência, delegacias, ferros-velhos e rota de patrulha sugerida |
| `lights` Iluminação pública | 3.200 postes em avenidas e ruas laterais, desenhados em canvas com brilho aditivo; fotocélula e dimerização por hora; circuitos e transformadores; fila de reparo |
| `incidents` Incidentes | Heatmap hora a hora, composição por tipo e região |
| `field` Equipes em campo | Simulação em tempo real: despacho, deslocamento pelas ruas, estados, SLA, feed de atividade |
| `coverage` Cobertura de sinal | Setores por torre: preenchimento = RSRP, contorno = ocupação (PRB) ao longo do dia; zonas de sombra |
| `expansion` Expansão de fibra | Cronograma navegável por semana: rotas ganham avanço, licenças bloqueiam obras, áreas FTTH |
| `weather` Clima e risco | Células de tempestade avançando por hora, previsão de 3 h, sites por tempo até o impacto |

## Arquivos

- `model.ts`: tipos, `REPORTS` (metadados, câmera inicial, categoria), dataset de demonstração, `createDocument`, validação e compactação para armazenamento. `derive.ts`: propriedades que dependem da linha do tempo (hora ou semana).
- `base.ts`, `roads.ts`: geometria, gerador pseudoaleatório determinístico e **trajetos que seguem ruas** (`roadPath`, `routeThrough`, `roundedPath`, `makePath`/`pathAt`). Não há motor de roteamento: o traçado é gerado como uma sequência de quadras com avenidas diagonais, estável para uma mesma semente.
- `data-lights.ts`, `data-extra.ts`: dados de iluminação, cobertura, expansão e clima.
- `GeoCanvas.tsx`: Web Mercator com zoom fracionário (roda, pinça, botões animados, duplo clique, teclado), controles próprios, escala, coordenadas e renderizadores por camada. `renderers.tsx` (setores, radar, progresso de obra), `LightsLayer.tsx` (canvas), `view.ts` (câmera e contexto de visão).
- `field-sim.ts`, `FieldOps.tsx`: simulação semeada e sua interface (central de despacho, camada de veículos e chamados). O relógio simulado avança 1 min por segundo × 1/2/4.
- `Insights.tsx`, `legend.ts`, `labels.ts`: painel de análise, legenda e rótulos de propriedades de cada mapa.
- `MapBuilder.tsx`: visualização/edição, Inspector, filtros, tabela → mapa, relações N:1, importação, Copilot com preview e persistência.
- `import.ts`: CSV, GeoJSON e KML (WGS84, até 10 MB).
- `map-builder.css`, `map-extras.css`: estilos `.mb-*`, usando tokens do BIWEB.

## Tela cheia

Usa a Fullscreen API quando o navegador permite e, caso contrário, uma camada fixa. O `.bw-page` deixa um `transform` da animação de entrada, o que fazia o `position:fixed` ficar preso à página; as telas de mapa desligam essa animação (`.app-page:has(.mb-workspace)`).

## Persistência e limites da demonstração

Salvar guarda os mapas em `biweb.map-builder.v2`. Camadas internas não modificadas são gravadas sem feições e restauradas do código ao abrir (`compactDocument`/`restoreDocument`); camadas importadas ou editadas são gravadas por inteiro. Exportar produz um JSON que o botão Importar reabre.

Todos os dados são simulados. A cartografia depende de serviços externos (OSM, OpenTopoMap, Esri) e avisa quando falham. A vista 2.5D é uma perspectiva CSS. Heatmap é densidade visual, não estimativa estatística. A simulação de campo, a previsão de clima e o roteamento por vias são demonstrativos. Copilot usa ações locais determinísticas.

KMZ, Excel, Parquet, SHP e GeoPackage estão previstos e exigem conversão nesta versão.

## Verificação

```
./node_modules/.bin/tsc -p apps/web/tsconfig.json
./apps/web/node_modules/.bin/vitest run apps/web/src/routes/maps
```

Os testes cobrem rotas por vias, simulação de campo (estados, ciclo de vida, reprodutibilidade, despacho manual), dados de iluminação (3.200 postes, circuitos apagados, fotocélula), cronograma de obras, tempestades, carga de cobertura, rota alternativa, compactação de documentos, importação e validação.
