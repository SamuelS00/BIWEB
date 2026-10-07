# ADR-0013 — MapLibre + deck.gl + PMTiles + agregação H3 no servidor

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [08-geospatial](../08-geospatial.md)

## Context
Mapas com choropleth, pontos, clusters, heatmaps, rotas, 3D e milhões de pontos, com filtros e seleção espacial, em SaaS e self-hosted (incluindo air-gapped).

## Decision
- **MapLibre GL** (basemap/vetores) + **deck.gl** (camadas de dados, interleaved).
- Basemaps e fronteiras em **PMTiles** servidos do object storage/CDN (sem tile server); choropleth por join de chave no cliente.
- **H3** (e geohash) para agregação no servidor com resolução por zoom e viewport queries; pontos crus só abaixo do orçamento.
- Seleção espacial vira filtro QDL compilado por dialeto; Martin/PostGIS para MVT dinâmico quando necessário.

## Alternatives
Mapbox GL (licença), Leaflet/OpenLayers, CesiumJS, tile servers tradicionais, GeoJSON para tudo.

## Advantages
Licenças abertas, custo previsível, escala de GPU, poucos bytes trafegados, funciona offline.

## Disadvantages
Manter pipeline de geração de PMTiles e catálogo de fronteiras.

## Risks
WebGPU no deck.gl amadurecendo → WebGL2 como padrão.

## Consequences
Dimensões geo no modelo semântico com `role` e `boundarySet`; geocoding no pipeline, não em query.
