# Contribuer à MultitoolV2

Merci de votre intérêt pour le projet. Ce guide décrit le minimum pour proposer une modification.

## Prérequis

- Windows 10/11 (cible principale)
- [Node.js](https://nodejs.org/) 22+, [pnpm](https://pnpm.io/) 10+
- [Rust](https://rustup.rs/) stable
- [Git](https://git-scm.com/) avec Git Bash (requis pour les hooks sur Windows)

## Installation

```bash
git clone https://github.com/Onivoid/MultitoolV2.git
cd MultitoolV2
pnpm install
pnpm tauri dev
```

Les hooks Git s’activent via `pnpm install` (`prepare` → `scripts/setup-hooks.sh`). Sinon :

```powershell
.\scripts\setup-githooks.ps1
```

## Branches

- **`master`** : branche de référence et releases
- Travaillez sur une branche dédiée (`feature/…`, `fix/…`, etc.) puis ouvrez une PR vers `master`

## Commandes utiles

| Commande                        | Rôle                                         |
| ------------------------------- | -------------------------------------------- |
| `pnpm tauri dev`                | Dev local                                    |
| `pnpm typecheck`                | Vérification TypeScript                      |
| `pnpm lint`                     | ESLint                                       |
| `pnpm format:check`             | Prettier (CI)                                |
| `pnpm format`                   | Formater le code                             |
| `pnpm lint:rust`                | `cargo fmt`, clippy, tests                   |
| `pnpm tauri build`              | Build production                             |
| `node scripts/check-version.js` | Cohérence `package.json` / `tauri.conf.json` |

La CI (`.github/workflows/ci.yml`) exécute typecheck, lint, format et les checks Rust sur les PR vers `master`.

## Structure du code

```
src/
  app/           Routes
  features/      Pages et logique par domaine (hook + service + composants)
  shared/        API Tauri, composants transverses
  components/    UI shadcn, layout, navigation
  stores/        Zustand
src-tauri/src/scripts/   Commands Rust par domaine
```

Règles frontend :

- Pas d’`invoke()` dans les fichiers `.tsx` — passer par un service dans `features/*/`
- Une page = composant de rendu + hook d’orchestration

## Commits et version

Sur les branches de travail, commitez normalement. **Le bump de version interactif ne s’exécute que sur `master`** (hooks `pre-commit` / `post-commit`).

Pour un commit sans bump (docs, WIP) :

```bash
git commit --no-verify -m "docs: …"
```

Voir [VERSIONING.md](VERSIONING.md) pour le processus de release.

## Pull requests

1. Rebasez sur `master` à jour
2. Vérifiez localement : `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm lint:rust`
3. Testez la fonctionnalité avec `pnpm tauri dev`
4. Décrivez le changement et comment le tester

## Bugs et idées

- Bug : [issue bug](https://github.com/Onivoid/MultitoolV2/issues/new?template=bug_report.md)
- Feature : [issue feature](https://github.com/Onivoid/MultitoolV2/issues/new?template=feature_request.md)
- Vulnérabilité : voir [SECURITY.md](SECURITY.md) (pas d’issue publique)

## Ressources

- [BUILD.md](BUILD.md) — compilation et scripts
- [VERSIONING.md](VERSIONING.md) — releases et tags
- [Discord](https://discord.com/invite/aUEEdMdS6j)
