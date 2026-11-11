# Décisions et écarts par rapport au cahier des charges

Le cahier des charges était modifiable pour de meilleures expériences. Voici ce qui a changé, et pourquoi.

## Demandes explicites du commanditaire

| Sujet | Réalisation |
|---|---|
| Titulaire unique | Nom, prénom, téléphone et numéro de pièce d'identité pour une seule personne, quel que soit le nombre de sièges (1 à 5). |
| Vérification par PNR | Billet affiché avec nom, prénom, téléphone et pièce masqués par le serveur. Trajet, sièges choisis, date, horaires, lieux, classe, nombre de passagers et montant payé restent visibles. |
| Hypothèses 7 et 10 | Aucun marquage dans le code, les contenus ou l'interface: les valeurs sont posées comme si elles étaient vraies (remboursements, conservation des données, billets de démonstration, tarifs). Elles se corrigent dans `content/`. |
| Caractères | Aucun tiret long, aucune flèche texte, aucun guillemet français, aucun point médian ni trait de dessin dans le code, les contenus ou la documentation. Caractères simples (- _ <) dans les commentaires, icônes Lucide dans l'interface. |
| pnpm, Docker | pnpm 12 (dernière version), Dockerfile multi-étapes sans serveur web. |

## Direction visuelle

Le premier jet (bordures épaisses, grain de papier, billet façon carton) a été abandonné. La refonte vise le minimalisme doux des meilleurs services de transport européens et américains (FlixBus, Omio, Airbnb):

- fond blanc et surfaces gris très clair, traits fins, grands arrondis, ombres très légères;
- une seule famille de police (Plus Jakarta Sans), titres serrés, texte secondaire en gris froid;
- couleur de marque marine pour les actions, ambre réservé aux accents; vert, orange et turquoise réservés aux trois villes;
- barre de navigation classique (liens, langue, thème, bouton Réserver), pied de page sobre en quatre colonnes;
- accueil structuré comme un moteur de recherche (départ, arrivée, date), puis lignes, classes, étapes, engagements, FAQ;
- billet en carte blanche épurée avec pastille d'état, sans perforation ni effet de papier;
- ombres presque absentes, la hiérarchie vient des traits fins et de l'espace;
- illustrations originales en SVG (route, trois villes, trois classes), remplaçables par des photos dans `content/media.ts`;
- billet papier d'origine (encoches, tirets, tampon incliné), rendu compact pour tenir entier à l'écran;
- thème nuit complet, mouvement réduit respecté.

## Réservation repensée

Le calendrier à barres de disponibilité était illisible: il est remplacé par une bande de jours à code couleur et texte (vert, orange, "Complet") et un calendrier mensuel. Date et horaire tiennent sur un seul écran, ce qui ramène le parcours à quatre étapes. La barre de progression pleine largeur laisse place à un stepper centré. L'écran des sièges propose "Choisir pour moi".

## Stack

- **Nuxt 4** au lieu de Nuxt 3: Nuxt 3 n'est plus maintenu depuis début 2026 et Nuxt 4 est la version courante. Tailwind 4 et DaisyUI 5 sont aussi les versions courantes.
- Polices auto-hébergées via Fontsource (pas de requête vers Google Fonts, plus rapide sur 3G).
- Icônes Lucide embarquées dans le bundle (aucun appel réseau).
- Pas de `@nuxt/image` (dépendance native `sharp`, fragile en conteneur): les visuels passent par `content/media.ts`.

## Parcours de réservation

- **Paiement**: le site source passe par un code USSD puis l'envoi d'un justificatif, validé à la main. Le cahier prévoyait une demande de validation sur le téléphone. La refonte garde la demande de validation (simulée) comme chemin principal, avec le code USSD réel (`#150#` Orange, `*126#` MTN) en repli.
- **Aller-retour**: le site source affiche des tarifs aller-retour par classe. Ils sont repris: deux billets liés, un seul titulaire, un seul paiement. Le tarif aller-retour s'applique si les deux trajets ont la même classe et le même nombre de sièges.
- **Retenue de sièges**: côté serveur, 10 minutes, identifiée par un jeton secret (et non par l'adresse IP, qui change entre 4G et Wi-Fi).
- **Vente**: fermée 30 minutes avant le départ.
- **Classes par départ**: le site source ne publie jamais Business et MasterClass au même horaire, alors que son bus double-étage compte 59 sièges (35 + 15 + 9). Les départs MasterClass proposent donc aussi la Business, ce qui rend la règle "plusieurs classes sur un même horaire" réelle.
- **URL profondes**: `/reserver?de=douala&vers=kribi&d=2026-12-15&etape=horaire`.

## Cohérence des données source

| Sujet | Décision |
|---|---|
| Prix d'appel | "Dès 5 000 FCFA" partout (plancher réel de la grille) |
| Flotte | 12 bus, 6 lignes |
| Aller-retour Yaoundé - Kribi en MasterClass S | 18 000 FCFA (le site affichait le même prix que la Business) |

## Limites connues

- Le comportement visuel a été validé par le rendu serveur, 36 tests (dont trois parcours complets dans un runtime Nuxt) et la vérification de types. Il n'a pas été examiné dans un vrai navigateur, ni sur un vrai appareil: un passage sur téléphone est recommandé avant la mise en ligne.
- Le Dockerfile a été validé par une simulation de ses étapes (installation figée, build, exécution de `.output` seul), pas par `docker build`.
- La page `/booking` du site source interdit l'accès automatisé: ses champs de paiement n'ont pas pu être observés directement.
- Stockage JSON et mémoire du processus: une seule instance. Aucun SMS ni e-mail réel n'est envoyé.
- Le suivi de colis avance automatiquement d'après la date d'envoi (aucune interface de contrôle dans ce périmètre).
- Les visuels sont des motifs graphiques de remplacement, aucune photo n'est fournie.
