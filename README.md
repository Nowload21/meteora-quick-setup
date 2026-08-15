# Meteora Quick Setup

Extension Chrome indépendante pour préparer et créer rapidement des positions DLMM token/SOL sur Meteora à partir de presets.

## Sécurité

- L’extension ne stocke aucune clé privée.
- Elle utilise uniquement le wallet déjà connecté à `app.meteora.ag` ou `www.meteora.ag`.
- Sélectionner un preset ne déclenche jamais de transaction.
- Seul le bouton `Create Position` construit, fait signer et envoie la création.
- Si le wallet utilise déjà l’auto-approve, ce comportement est respecté. L’extension ne l’active jamais.
- La simulation est active par défaut.
- Les coûts non remboursables de création de bin arrays sont signalés séparément avant validation.

## Installation locale

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
