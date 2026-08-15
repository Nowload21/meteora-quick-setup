# Plan : Meteora Quick Setup

> PRD source : `docs/PRD.md`

## Décisions architecturales

Décisions durables qui s’appliquent à toutes les phases :

- **Pages ciblées** : uniquement les pages de pools DLMM sous `app.meteora.ag` ; toute autre page laisse la création indisponible.
- **Stockage** : une configuration locale unique contient le portfolio, jusqu’à six presets, les préférences réseau et l’état du panneau.
- **Modèles clés** : `Configuration`, `Preset`, `PoolContext`, `PositionPreview` et `CreationResult`.
- **Wallet** : le wallet injecté et déjà connecté à Meteora reste l’unique autorité de signature ; aucune clé n’est détenue par l’extension.
- **Frontières externes** : Meteora fournit les données du pool et la création de position, Solana fournit les soldes et confirmations, Jupiter fournit uniquement la cotation SOL/USDC.
- **Séparation des contextes** : l’expérience et la signature vivent dans la page Meteora ; les réglages locaux et les appels réseau autorisés passent par l’extension.
- **Sécurité d’action** : sélectionner un preset ne construit ni ne signe une transaction ; seul le bouton `Create Position` déclenche le flux.

---

## Phase 1 : Création SPOT de bout en bout

**User stories** : US-1, US-7, US-9, US-10, US-11, US-12, US-13, US-16, US-17, US-22

### Ce qu’on livre

Un premier parcours complet sur un pool token/SOL : saisie du portfolio en SOL, sélection du preset initial `SPOT · -90 % · 4 %`, détection du pool et du wallet, prévisualisation puis création d’une nouvelle position. Le résultat confirmé expose la position et la transaction sur Solscan.

### Critères d’acceptation

- [ ] Le panneau détecte automatiquement un pool DLMM depuis la page ouverte.
- [ ] Le preset initial calcule 4 % du portfolio saisi et une range de -90 % à 0 %.
- [ ] La sélection du preset n’envoie aucune transaction.
- [ ] Le clic sur `Create Position` recalcule la range et demande la signature au wallet connecté.
- [ ] L’auto-approve du wallet est respecté sans être activé par l’extension.
- [ ] Le bouton reste bloqué pendant la création.
- [ ] Le succès affiche la position, la signature et un lien Solscan.

## Bloquée par

Aucune, démarrable immédiatement.

---

## Phase 2 : Éditeur des six presets

**User stories** : US-3, US-4, US-5, US-6, US-18

### Ce qu’on livre

Le popup permet d’activer et modifier jusqu’à six presets. Chaque preset expose sa stratégie, sa borne basse et son allocation. Le panneau les représente par des icônes et libellés compacts, puis conserve leur configuration localement.

### Critères d’acceptation

- [ ] Le premier lancement propose un preset initial et cinq emplacements vides.
- [ ] Chaque emplacement peut être activé, modifié ou désactivé.
- [ ] Les trois stratégies SPOT, CURVE et BID-ASK sont disponibles.
- [ ] Les bornes et allocations invalides sont refusées.
- [ ] Les boutons affichent l’icône de stratégie, la borne basse et l’allocation.
- [ ] Les réglages survivent à la fermeture du navigateur.

## Bloquée par

- Phase 1 : Création SPOT de bout en bout

---

## Phase 3 : Garde-fous et erreurs

**User stories** : US-8, US-14, US-15, US-21

### Ce qu’on livre

Le parcours refuse les pages et pools incompatibles, vérifie le SOL nécessaire au dépôt et aux frais, simule la création lorsque demandé et transforme les échecs en messages exploitables sans perdre la sélection courante.

### Critères d’acceptation

- [ ] Les pools sans paire token/SOL sont refusés avant toute signature.
- [ ] Le solde disponible est comparé au dépôt, au rent et aux frais estimés.
- [ ] Un solde insuffisant désactive la création et affiche le requis et le disponible.
- [ ] La simulation interrompt le flux lorsqu’elle échoue.
- [ ] Un décalage supérieur à un bin interrompt la création.
- [ ] Une erreur conserve le preset et permet un nouvel essai.
- [ ] Une navigation vers un autre pool invalide les anciennes données avant recalcul.

## Bloquée par

- Phase 1 : Création SPOT de bout en bout
- Phase 2 : Éditeur des six presets

---

## Phase 4 : Portfolio en USD

**User stories** : US-2

### Ce qu’on livre

Le portfolio peut être exprimé en USD. Le panneau obtient une cotation SOL/USDC actuelle, convertit l’allocation en SOL et empêche la création lorsqu’aucun prix fiable n’est disponible.

### Critères d’acceptation

- [ ] Le popup permet de choisir SOL ou USD.
- [ ] Une valeur USD produit une allocation SOL visible dans le récapitulatif.
- [ ] Le prix utilisé et son état sont affichés.
- [ ] Une cotation indisponible ou invalide bloque la création.
- [ ] Le passage SOL/USD actualise le panneau sans rechargement manuel.

## Bloquée par

- Phase 1 : Création SPOT de bout en bout
- Phase 3 : Garde-fous et erreurs

---

## Phase 5 : Panneau et exécution personnalisables

**User stories** : US-19, US-20

### Ce qu’on livre

Le panneau peut être déplacé, replié et épinglé. Le popup expose le RPC, les frais prioritaires, leur plafond et l’activation de la simulation. Ces préférences sont conservées localement et appliquées au prochain calcul ou envoi.

### Critères d’acceptation

- [ ] Le panneau peut être déplacé lorsqu’il est désépinglé.
- [ ] Un panneau épinglé ne bouge pas.
- [ ] La position, l’état replié et l’épinglage survivent au rechargement.
- [ ] Le RPC et les frais prioritaires sont modifiables et validés.
- [ ] La simulation est active par défaut et peut être désactivée.
- [ ] Les changements du popup atteignent un onglet Meteora déjà ouvert.

## Bloquée par

- Phase 2 : Éditeur des six presets
- Phase 3 : Garde-fous et erreurs
