# Installer Meteora Quick Setup

L’installation prend environ une minute et ne demande aucune commande technique.

## Télécharger

Télécharge la dernière version ici :

**[meteora-quick-setup-v0.1.9.zip](https://github.com/Nowload21/meteora-quick-setup/releases/latest/download/meteora-quick-setup-v0.1.9.zip)**

N’essaie pas d’ouvrir directement l’extension depuis le fichier ZIP.

## Décompresser

### macOS

Double-clique sur le fichier ZIP dans le dossier Téléchargements.

### Windows

Clique droit sur le fichier ZIP, choisis **Extraire tout**, puis confirme.

## Ajouter à Chrome ou Brave

1. Ouvre `chrome://extensions`.
2. Active **Mode développeur** en haut à droite.
3. Clique sur **Charger l’extension non empaquetée**.
4. Choisis le dossier décompressé `meteora-quick-setup-v0.1.9`.
5. Le dossier sélectionné doit contenir directement le fichier `manifest.json`.

Sur Brave, `brave://extensions` fonctionne également.

## Démarrer

1. Connecte ton wallet sur Meteora.
2. Ouvre le popup de l’extension et renseigne la taille de ton portfolio.
3. Ouvre une page `app.meteora.ag/dlmm/<pool>` ou `www.meteora.ag/dlmm/<pool>`.
4. Choisis un preset dans Quick Setup.
5. Vérifie le récapitulatif avant de cliquer sur **Create Position**.

## Mettre à jour sans perdre ses presets

1. Télécharge et décompresse le nouveau ZIP.
2. Retrouve le dossier de l’ancienne version que tu avais chargé dans Chrome.
3. Remplace les fichiers de ce dossier par ceux de la nouvelle version. Garde exactement le même dossier et le même chemin.
4. Ouvre `chrome://extensions`.
5. Clique sur l’icône **Recharger** de Meteora Quick Setup.
6. Actualise la page Meteora.

Le numéro affiché sur la carte de l’extension doit maintenant être `0.1.9`. Cette méthode conserve normalement le portfolio et les presets enregistrés.

Si tu ne retrouves plus l’ancien dossier, note d’abord tes réglages, supprime l’ancienne extension, puis charge le nouveau dossier décompressé. Une réinstallation complète peut effacer les réglages.

## Problèmes fréquents

### Chrome indique que `manifest.json` est absent

Tu as sélectionné le mauvais dossier. Choisis celui qui contient directement `manifest.json`.

### Le panneau n’apparaît pas

Vérifie que tu es sur une URL `/dlmm/<pool>`, puis actualise la page Meteora.

### Le wallet n’est pas détecté

Connecte d’abord le wallet directement dans Meteora, puis actualise la page.
