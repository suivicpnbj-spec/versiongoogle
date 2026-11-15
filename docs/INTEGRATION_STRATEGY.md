# Plan d'intégration — prototype commerce & services de proximité

## Décision d'architecture

Cette branche assemble progressivement les deux prototypes sans écraser leurs dépôts d'origine.

- **Socle fonctionnel :** `suivicpnbj-spec/versiongoogle`
- **Référence UX/UI :** `suivicpnbj-spec/PlateformeLocaleTout-en-un`
- **Branche de travail :** `integration/figma-ui-google-core`

La branche principale n'est pas modifiée. Le dépôt Figma reste intact.

## Ce qu'on conserve du socle Google

- `AppContext` et les modèles métier centralisés.
- Les vues modulaires client, professionnel et livraison.
- Les actions de création de commandes et de demandes d'intervention.
- La gestion des prix, des offres, des disponibilités et des statuts.
- Les données de démonstration de Parakou.

## Ce qu'on reprend de Figma

- Direction artistique vert forêt / citron / ivoire.
- Typographies Manrope et DM Sans.
- Hiérarchie visuelle et principes de cartes.
- Parcours et compositions d'écrans comme références UX.
- Traitement visuel du panier, de la découverte, des services et du suivi.

## Règle d'intégration

Ne pas remplacer l'application Google par le composant monolithique Figma. Les interactions Figma doivent être raccordées aux fonctions métier du contexte Google. Une action présentée comme réelle doit modifier l'état partagé et rester cohérente entre les espaces client, professionnel et livreur.

## Écarts fonctionnels à corriger pendant l'intégration

1. Le bouton de validation Figma doit appeler la vraie action de création de commande.
2. Le point de livraison sélectionné doit être transmis et enregistré dans la commande.
3. Le suivi doit lire les statuts partagés, et non afficher une progression décorative.
4. Les demandes de professionnels doivent être créées via le contexte partagé.
5. Les données et statuts doivent rester explicitement en mode démonstration tant qu'aucun backend ou fournisseur externe n'est connecté.
6. Les données de localisation what3words restent simulées tant que l'API officielle n'est pas intégrée.
7. La ville et les exemples par défaut restent centrés sur Parakou.

## Vérifications requises avant fusion

- Installation des dépendances.
- Vérification TypeScript.
- Build Vite de production.
- Test des parcours : comparaison/achat, commande restaurant, demande de professionnel, livraison précise, gestion du commerce.
- Vérification responsive mobile et desktop.
- Vérification qu'aucun secret ou identifiant privé n'est commité.

## État

- [x] Branche d'intégration isolée.
- [x] Premier rapprochement des tokens visuels Figma dans le socle Google.
- [x] Stratégie d'intégration documentée.
- [x] Première harmonisation visuelle des vues Découvrir, Comparateur, Services, Suivi et Panier (palette Figma, surfaces ivoire, textes et états cohérents).
- [ ] Reprise plus poussée des compositions Figma (grilles, cartes éditoriales, vues détaillées et espaces métier).
- [ ] Raccordement de chaque interaction à l'état métier partagé.
- [ ] Build et tests de parcours (GitHub Actions échoue actuellement avant l'exécution des étapes ; aucun runner/étape de build n'est remonté).
- [ ] Pull request prête à revue.
