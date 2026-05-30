# Instructions de développement — Multitool

Référence interne pour l’architecture V3 (feature-based).

## Stack

- **Backend** : Tauri 2, Rust, Tokio, reqwest, serde
- **Frontend** : React 18, TypeScript, Vite, React Router, Zustand, Tailwind, shadcn/ui

## Structure

```
src/
  app/              AppRouter, routes
  features/         Un dossier par domaine (Page, hook, service, lib, components)
  shared/           tauriClient, composants transverses
  components/       UI shadcn, layout (components/custom/), navigation
  stores/           Zustand
src-tauri/src/scripts/   Modules Rust + #[command]
```

## Conventions frontend

- **Service** : seul endroit des `invoke()` — `features/<domaine>/*.service.ts`
- **Hook** : état, effets, toasts — `use*.ts`
- **Page** : rendu JSX uniquement — `*Page.tsx`
- Pas d’`invoke()` dans les `.tsx`

Exemple :

```typescript
// features/cache/cache.service.ts
import { invokeCommand } from "@/shared/api/tauriClient";
export const cacheService = {
  clear: () => invokeCommand<boolean>("clear_cache"),
};
```

## Conventions Rust

- Un module par domaine dans `src-tauri/src/scripts/`
- Déclarer dans `mod.rs`, enregistrer dans `lib.rs` via `generate_handler!`
- Commands : `Result<T, String>`, messages d’erreur en français

## Ajouter une feature

1. Module Rust + command dans `src-tauri/src/scripts/`
2. Entrée dans `TAURI_COMMANDS` + service frontend
3. Hook + Page dans `src/features/<nom>/`
4. Route dans `src/app/`

## Commandes

```bash
pnpm tauri dev          # dev
pnpm typecheck          # tsc --noEmit
pnpm lint               # eslint
pnpm format:check       # prettier (CI)
pnpm lint:rust          # fmt + clippy + test
pnpm tauri build        # build prod
cd src-tauri && cargo test
```

Pas de suite de tests frontend configurée pour l’instant.

## Versioning et release

- Branche `master` uniquement pour le bump interactif (hooks)
- Commit release avec message multiligne → tag `vX.Y.Z` → notes GitHub = message du commit
- Voir [VERSIONING.md](../VERSIONING.md)

## Checklist PR

- [ ] `pnpm typecheck` + `pnpm lint` + `pnpm format:check`
- [ ] `pnpm lint:rust` si Rust touché
- [ ] Test manuel Windows (`pnpm tauri dev`)
- [ ] Textes UI en français

Dernière mise à jour : 2026-05-30
