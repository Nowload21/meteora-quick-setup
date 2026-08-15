## Problème

L’utilisateur ouvre régulièrement des positions DLMM SOL-side sur Meteora avec des configurations répétitives. Il doit recalculer manuellement la taille de sa position, choisir la stratégie, régler la range puis vérifier chaque valeur. Ce parcours est lent et augmente le risque d’erreur lors d’une entrée rapide.

## Solution

Meteora Quick Setup ajoute un panneau directement dans l’interface Meteora. L’utilisateur prépare jusqu’à six presets basés sur la taille déclarée de son portfolio.

Sur un pool token/SOL, il sélectionne un preset, vérifie le montant et la range calculés, puis crée une nouvelle position avec un bouton dédié. Le wallet déjà connecté à Meteora signe la transaction, avec ou sans demande de confirmation selon ses réglages.

## Utilisateur cible

Trader crypto expérimenté utilisant régulièrement les pools DLMM token/SOL de Meteora depuis Chrome desktop. Il maîtrise les risques des stratégies SPOT, CURVE et BID-ASK et cherche à exécuter rapidement des configurations répétitives sans confier ses clés à un service tiers.

## User Stories

1. **US-1** : En tant que trader, je veux saisir la taille de mon portfolio en SOL, afin de calculer automatiquement mes tailles de position.
2. **US-2** : En tant que trader, je veux pouvoir saisir mon portfolio en USD, afin d’utiliser une unité alternative.
3. **US-3** : En tant que trader, je veux créer et modifier jusqu’à six presets, afin d’enregistrer plusieurs configurations.
4. **US-4** : En tant que trader, je veux définir la stratégie, la borne basse et le pourcentage du portfolio de chaque preset, afin de contrôler chaque position.
5. **US-5** : En tant que trader, je veux reconnaître les stratégies grâce à des icônes, afin de sélectionner rapidement le bon preset.
6. **US-6** : En tant que trader, je veux voir la range et l’allocation directement sur chaque preset, afin de les distinguer sans nom.
7. **US-7** : En tant que trader, je veux que le pool ouvert soit détecté automatiquement, afin de ne pas saisir son adresse.
8. **US-8** : En tant que trader, je veux que l’outil refuse les pools incompatibles, afin d’éviter une position incorrecte.
9. **US-9** : En tant que trader, je veux qu’un clic sur un preset prépare seulement la position, afin qu’un miss clic n’envoie aucune transaction.
10. **US-10** : En tant que trader, je veux consulter un récapitulatif complet, afin de contrôler la position avant sa création.
11. **US-11** : En tant que trader, je veux créer la position avec un bouton dédié, afin d’éviter les réglages manuels dans Meteora.
12. **US-12** : En tant que trader, je veux utiliser le wallet déjà connecté à Meteora, afin de ne pas refaire la connexion.
13. **US-13** : En tant que trader, je veux que l’auto-approve existant soit respecté, afin de conserver mon workflow rapide.
14. **US-14** : En tant que trader, je veux que la création soit bloquée si mon solde est insuffisant, afin d’éviter une transaction vouée à échouer.
15. **US-15** : En tant que trader, je veux conserver assez de SOL pour les frais et le rent, afin de ne pas vider mon wallet.
16. **US-16** : En tant que trader, je veux empêcher une double création pendant une transaction, afin d’éviter deux positions identiques.
17. **US-17** : En tant que trader, je veux voir le résultat et le lien Solscan, afin de vérifier la transaction.
18. **US-18** : En tant que trader, je veux conserver ma configuration après fermeture du navigateur, afin de ne pas la ressaisir.
19. **US-19** : En tant que trader, je veux déplacer, replier et épingler le panneau, afin de l’adapter à mon interface.
20. **US-20** : En tant que trader, je veux configurer mon accès réseau et mes frais prioritaires, afin d’adapter la vitesse et le coût d’exécution.
21. **US-21** : En tant que trader, je veux obtenir une erreur lisible sans perdre le preset sélectionné, afin de pouvoir corriger ou réessayer.
22. **US-22** : En tant que trader, je veux que la range soit recalculée juste avant la création, afin d’utiliser le prix actif du pool.

## Critères de succès

- Le panneau apparaît sur une page DLMM token/SOL valide de Meteora.
- Le panneau peut être déplacé, replié et épinglé, puis retrouve sa position après rechargement.
- L’utilisateur peut enregistrer entre un et six presets.
- Le premier lancement contient `SPOT · -90 % · 4 %` et cinq emplacements vides.
- Chaque preset reste entièrement modifiable.
- Un clic sur un preset ne déclenche jamais de transaction.
- Le récapitulatif affiche le pool, le token, l’adresse raccourcie, la stratégie, l’allocation, le montant en SOL, la range réelle, le nombre de bins, les frais estimés et le SOL restant.
- Le bouton de création reste indisponible lorsque la page, le wallet, le preset ou le solde est invalide.
- La transaction utilise le wallet déjà connecté à Meteora.
- Avec l’auto-approve actif, aucune confirmation supplémentaire n’est imposée par l’extension.
- Sans auto-approve, le wallet affiche sa confirmation habituelle.
- Une seule nouvelle position peut être créée par validation.
- Une création en cours bloque tout nouvel envoi.
- Après confirmation, le panneau affiche la position et un lien Solscan.
- Après échec, le preset reste sélectionné et une erreur lisible apparaît.
- Les presets et la taille du portfolio restent stockés uniquement sur l’appareil.
- L’extension ne s’active pas en dehors de Meteora.

## Hors périmètre

- Pools qui ne sont pas token/SOL.
- Entrées token-side ou mixtes.
- Ranges au-dessus du prix actif ou traversant celui-ci.
- Lecture automatique de la valeur totale du portfolio.
- Prise en compte du WSOL existant.
- Swap automatique pour financer une position.
- Ajout de liquidité à une position existante.
- Fusion avec Meteora Close Express.
- Plus de six presets.
- Firefox, Safari et mobile.
- Déclenchement d’une transaction par simple clic sur un preset.
- Gestion ou stockage des clés privées.
- Télémétrie et suivi du comportement utilisateur.

## Décisions d’implémentation

- Le produit prend la forme d’une extension Chrome desktop séparée nommée Meteora Quick Setup.
- Le panneau est flottant, repliable, déplaçable et épinglable.
- Les réglages sont modifiés depuis le popup de l’extension.
- La taille du portfolio est saisie manuellement en SOL par défaut, avec USD comme alternative.
- Le mode USD utilise une cotation SOL/USDC actuelle. La création est bloquée si cette cotation est indisponible.
- Chaque preset contient une stratégie SPOT, CURVE ou BID-ASK, une borne basse et un pourcentage du portfolio.
- La borne haute reste fixée à `0 %`.
- La borne basse accepte les valeurs de `-99,9 %` à `-0,1 %`.
- L’allocation accepte les valeurs supérieures à `0 %` et inférieures ou égales à `100 %`.
- Toutes les créations sont financées uniquement avec du SOL natif.
- La range affichée lors de la sélection est estimative puis recalculée au clic sur **Create Position**.
- Le décalage maximal accepté au moment de la création est d’un bin.
- La simulation avant envoi est active par défaut et peut être désactivée.
- Le solde disponible doit couvrir le dépôt, les frais et le rent.
- Le pool affiché doit être un pool DLMM token/SOL valide.
- Solflare est le wallet prioritaire. Jupiter Wallet et les wallets compatibles avec la connexion Solana standard sont secondaires.
- Une navigation vers un autre pool conserve le preset sélectionné mais invalide et recalcule le récapitulatif.
- Chaque validation crée une nouvelle position.
- Les réglages réseau et les frais prioritaires sont configurables.
- Les données de configuration restent locales à l’appareil.

## Notes complémentaires

- Une fusion future avec Meteora Close Express pourra être évaluée après validation du MVP.
- Le fonctionnement dépend des évolutions de Meteora, des wallets compatibles et du service de cotation SOL/USDC.
- Le produit devra être testé avec de petits montants avant un usage normal.
