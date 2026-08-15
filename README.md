# Meteora Quick Setup

Extension Chrome indépendante pour préparer et créer rapidement des positions DLMM token/SOL sur Meteora à partir de presets.

## Installation rapide

### 1. Télécharger l’extension

Télécharge le fichier prêt à installer :

**[Télécharger Meteora Quick Setup](https://github.com/Nowload21/meteora-quick-setup/releases/latest/download/meteora-quick-setup-v0.1.8.zip)**

### 2. Décompresser le fichier

Double-clique sur le fichier ZIP téléchargé. Un dossier `meteora-quick-setup-v0.1.8` sera créé.

### 3. Charger l’extension dans Chrome ou Brave

1. Ouvre `chrome://extensions` dans la barre d’adresse.
2. Active **Mode développeur** en haut à droite.
3. Clique sur **Charger l’extension non empaquetée**.
4. Sélectionne le dossier `meteora-quick-setup-v0.1.8` décompressé.
5. Épingle **Meteora Quick Setup** dans la barre des extensions.

L’extension est prête. Ouvre ensuite une pool sur `app.meteora.ag/dlmm/...` ou `www.meteora.ag/dlmm/...` avec ton wallet déjà connecté.

Si Chrome affiche une erreur, vérifie que tu sélectionnes bien le dossier décompressé contenant directement `manifest.json`, et non le fichier ZIP.

[Guide d’installation détaillé](docs/INSTALL.md)

## Sécurité

- L’extension ne stocke aucune clé privée.
- Elle utilise uniquement le wallet déjà connecté à `app.meteora.ag` ou `www.meteora.ag`.
- Sélectionner un preset ne déclenche jamais de transaction.
- Seul le bouton `Create Position` construit, fait signer et envoie la création.
- Si le wallet utilise déjà l’auto-approve, ce comportement est respecté. L’extension ne l’active jamais.
- La simulation est active par défaut.
- Les coûts non remboursables de création de bin arrays sont signalés séparément avant validation.

## Installation depuis le code source

Cette méthode est réservée aux développeurs. Pour une installation normale, utilise le ZIP ci-dessus.

```bash
npm install
npm run verify
```

Puis dans Chrome :

1. Ouvrir `chrome://extensions`.
2. Activer le mode développeur.
3. Cliquer sur `Charger l’extension non empaquetée`.
4. Sélectionner le dossier `dist`.
5. Ouvrir une page `https://app.meteora.ag/dlmm/<pool>` ou `https://www.meteora.ag/dlmm/<pool>` avec le wallet connecté.

## Usage

1. Ouvrir le popup de l’extension.
2. Saisir la taille du portfolio en SOL ou USD.
3. Configurer jusqu’à six presets.
4. Sur une page DLMM token/SOL, choisir un preset dans le panneau.
5. Vérifier le récapitulatif.
6. Cliquer sur `Create Position`.

Le premier preset est `SPOT · -90 % · 4 %`. Les cinq autres sont désactivés au premier lancement.

## Vérifications

```bash
npm run check
npm test
npm run build
```

Toujours commencer les essais mainnet avec un petit montant.
