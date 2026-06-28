# Référence API Wiki ↔ Multitool (Vaisseaux)

Documentation du mapping entre l’API [Star Citizen Wiki](https://api.star-citizen.wiki/developers) et le module **Comparateur vaisseaux** (`src/features/ships/`).

## Endpoints

| Endpoint                          | Usage Multitool                                   | Fichier               |
| --------------------------------- | ------------------------------------------------- | --------------------- |
| `GET /api/vehicles?page[size]=50` | Cache catalogue `vehicles_catalog.json` (TTL 7 j) | `vehicles_catalog.rs` |
| `GET /api/vehicles/{uuid}`        | Fiche détail (stats, ports, prix UEX)             | `vehicles_catalog.rs` |

## Commandes Tauri

| Commande                | Description                                  |
| ----------------------- | -------------------------------------------- |
| `vehicles_catalog_list` | Liste `VehicleSummary[]` depuis cache ou API |
| `vehicle_detail`        | Détail `VehicleDetail` pour un UUID          |

## Champs véhicule → `VehicleSummary`

| Champ Wiki                       | Champ Multitool           | Notes                 |
| -------------------------------- | ------------------------- | --------------------- |
| `uuid`, `name`, `slug`           | id, libellé, slug         |                       |
| `manufacturer.name` / `code`     | fabricant                 |                       |
| `size_class`                     | taille                    |                       |
| `cargo_capacity`                 | fret SCU                  |                       |
| `speed.scm` / `speed.max`        | vitesses                  |                       |
| `crew.max`                       | équipage max              |                       |
| `health`, `shield_hp`            | survie                    |                       |
| `weaponry.pilot_dps`             | DPS pilote                |                       |
| `career`, `role`                 | rôle gameplay             |                       |
| `production_status`              | statut prod.              |                       |
| `images[]`                       | `thumbnailUrl`            | priorité illustration |
| `uex_prices.purchase` / `rental` | prix min achat / location |                       |

## Comparateur VS (frontend)

- Jusqu’à **4** vaisseaux sélectionnés
- Panneau comparatif : stats clés, achat / location, lien détail
- Fiche détail : dimensions, ports, liste prix UEX par terminal

## Cache

- Dossier : `%LOCALAPPDATA%/multitool/vehicles/vehicles_catalog.json`
- Schéma versionné ; invalidation après 7 jours
- Pas d’appel API direct depuis le frontend React

## Garde-fous

- Rust : compilation + tests unitaires mapping summary
- FE : normalisation via `ships.lib.ts` (`normalizeVehicleSummary`, `normalizeVehicleDetail`)
