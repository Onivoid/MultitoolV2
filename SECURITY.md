# Politique de sécurité

Multitool est open-source (AGPL). Le code est public ; les binaires distribués sur GitHub ne sont pas signés numériquement (coût des certificats). Vous pouvez auditer le dépôt, rebuilder vous-même, ou vérifier les checksums publiés à chaque release.

## Signaler une vulnérabilité

**Ne pas ouvrir d’issue publique** pour un problème de sécurité.

Contactez le mainteneur en privé :

- GitHub : [Onivoid](https://github.com/Onivoid)
- Discord : [serveur Multitool](https://discord.com/invite/aUEEdMdS6j)

Indiquez : description, étapes de reproduction, impact estimé, version concernée.

Délai visé de première réponse : 7 jours ouvrés.

## Vérifier un binaire

Chaque release GitHub inclut `checksums.txt` (SHA256). Exemple PowerShell :

```powershell
Get-FileHash .\Multitool-Portable.exe -Algorithm SHA256
```

Comparez avec la valeur publiée sur la release.

Rebuild local :

```powershell
.\scripts\build-release.ps1 -Type standard
# ou portable
.\scripts\build-release.ps1 -Type portable
```

## Bonnes pratiques utilisateur

- Téléchargez uniquement depuis [Releases](https://github.com/Onivoid/MultitoolV2/releases) officielles
- Vérifiez les checksums avant exécution si vous avez un doute
- Ne partagez pas vos clés API ou chemins sensibles dans les issues

## Développement

- Valider les entrées côté Rust avant toute opération fichier ou réseau
- Ne pas committer de secrets (`.env`, clés de signature Tauri)
- Les secrets CI (`TAURI_SIGNING_PRIVATE_KEY`, etc.) restent dans GitHub Actions

## Limites connues

- Pas de signature Authenticode / SmartScreen peut afficher un avertissement
- L’application accède aux dossiers Star Citizen locaux (cache, personnages, logs) — comportement attendu, documenté dans le code
