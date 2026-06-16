# Référence API Wiki ↔ Multitool (Blueprints)

Documentation du mapping entre l’API [Star Citizen Wiki](https://api.star-citizen.wiki/developers) et les champs utilisés par le module Blueprints.

## Endpoints principaux

| Endpoint | Usage Multitool | Fichier |
|----------|-----------------|---------|
| `GET /api/blueprints` | Cache catalogue local (`wiki_catalog.json`) | `blueprints_catalog.rs` |
| `GET /api/blueprints/{uuid}` | Fiche détail + missions | `blueprints_catalog.rs` |
| `GET /api/blueprints/filters` | Facettes `output.type`, ingrédients | `blueprints_wiki_extended.rs` |
| `GET /api/items/{uuid}` | `description_data`, grade, classe (détail + index meta) | `blueprints_item_profile.rs` |
| `GET /api/items/filters?filter[category]=…` | Labels canoniques par famille | `blueprints_wiki_extended.rs` |

## Champs blueprint → `BlueprintSummary`

| Champ Wiki | Champ Multitool | Badges liste |
|------------|-----------------|--------------|
| `output.type` | `outputType` | Filtre type d’objet |
| `output.type_label` | `outputTypeLabel` | Badge `output_type` |
| `output.grade` | `grade` (A–G) | Badge `grade` |
| `output_class` + global.ini | `classCode` (civi/indu/…) | Badge `component_class` |
| `output.uuid` | (item crafté) | Index meta si incomplet |
| ID `bp_craft_*` | `size`, `manufacturer` | Badge `size`, `manufacturer` |

Les badges catalogue liste sont construits par `build_summary_badges` (`blueprint_family.rs`) à partir de ces champs, sans appel item. L’index `wiki_item_meta_index.json` complète les cas où `output.grade` ou la classe manquent.

## Famille craft → catégorie items/filters

| `BlueprintFamily` | Catégorie Wiki items |
|-------------------|----------------------|
| `ship_component` | `vehicle-components` |
| `ship_weapon` | `vehicle-weapons` |
| `fps_weapon` | `weapons` |
| `armor` | `armor` |
| `mining` | `mining-modifiers` |

## Garde-fous / tests

- Rust : `ship_component_summary_badges_citadel_like` — ordre et contenu badges liste.
- Rust : `list_badges_match_detail_when_description_data_present` — parité liste vs détail avec `description_data`.
- TS : `blueprints.catalog.badges.test.ts` — filtres clic badge `component_class` / `grade`.

## Cache local

| Fichier | TTL | Contenu |
|---------|-----|---------|
| `wiki_catalog.json` | 7 j | Liste blueprints |
| `item_{uuid}.json` | 7 j | Profil item |
| `wiki_item_meta_index.json` | — | Meta compacte par `blueprintId` |
| `wiki_items_filters_{category}.json` | 7 j | Facettes items Wiki |
