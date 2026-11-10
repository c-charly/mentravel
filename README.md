# MEN TRAVEL - réservation de bus

Application web de réservation de billets de bus entre Yaoundé, Douala et Kribi.
Nuxt 4, Vue 3, Tailwind CSS 4, DaisyUI 5, Pinia, i18n (FR et EN), PWA. Gestionnaire de paquets: pnpm 12.

Le site source observé est https://booking-mentravel.cm (audit dans `docs/audit-source.md`).

## Démarrer

```bash
corepack enable            # ou: npm i -g pnpm@12
pnpm install
pnpm dev                   # http://localhost:3000
pnpm test                  # tests unitaires et tests de parcours dans un runtime Nuxt
pnpm typecheck             # vue-tsc sur l'application et sur le serveur
pnpm lint
pnpm build && pnpm start   # production locale
```

Aucune base de données à installer. Les réservations, colis et devis sont enregistrés dans un fichier JSON
(`NUXT_DATA_DIR/db.json`, `.data/` par défaut). Les services sont isolés dans `server/services`: brancher une vraie
API ou une base SQL revient à réécrire ces fichiers, sans toucher aux routes ni à l'interface.

## Docker et Dokploy

Le `Dockerfile` produit une image Node 22 Alpine en trois étapes (dépendances, build, exécution).
Il n'y a pas de serveur web (nginx, Caddy): Dokploy gère le proxy et le TLS. Le conteneur écoute sur le port 3000.

Dans Dokploy (type Application, build Dockerfile):

| Réglage | Valeur |
|---|---|
| Port du conteneur | `3000` |
| Volume persistant | monter un volume sur `/data` (réservations, colis, devis) |
| Build arg | `NUXT_PUBLIC_SITE_URL=https://votre-domaine` |
| Variables | voir `.env.example` (toutes optionnelles, sauf l'URL publique en production) |
| Santé | `GET /api/health` (déjà déclaré dans le `HEALTHCHECK` de l'image) |

Essai local avec Docker:

```bash
docker compose up --build        # http://localhost:3000 (via le port exposé par votre outil, ou ajoutez ports: ["3000:3000"])
```

Instance unique: la limitation de débit et les retenues de sièges vivent en mémoire du processus.
Pour plusieurs répliques, déplacer `holds` et `rateLimit` vers Redis.

## Données de démonstration

Quatre billets sont recréés à chaque démarrage (`server/services/demo.ts`):

| PNR | État | Pièce d'identité du titulaire |
|---|---|---|
| `MT-K7N2QX-4HDM` | payé, départ dans 3 jours, Yaoundé - Douala, Business 3A 3B | `112233445` |
| `MT-P5R8WZ-9CTE` | payé, départ dans 6 jours, Douala - Kribi, MasterClass Plus 1A | `CE123456` |
| `MT-B3F6HM-2VKP` | déjà utilisé, Kribi - Yaoundé hier, MasterClass S 2B 2C | `998877665` |
| `MT-C9L4TS-6WJN` | annulé | `554433221` |

Essayez `/verifier/MT-K7N2QX-4HDM` (billet masqué) puis `/mon-voyage` avec le numéro de pièce (billet complet).

Le paiement est simulé. Il réussit par défaut après 4 secondes. Pour tester les cas limites, ajoutez
`?sim=fail` ou `?sim=timeout` à l'URL de la réservation (désactivable avec `NUXT_ALLOW_SIM=false`).

## Parcours de réservation

Une page, six étapes, l'URL reflète l'état (jamais de donnée personnelle dedans):

1. **Date**: la phrase "Je pars de Yaoundé vers Douala" et le calendrier code-barres (une barre par départ, hauteur = places restantes, motif = classe). Interrupteur "Ajouter le retour".
2. **Horaire**: frise verticale, une voie par classe disponible, jauges de places.
3. **Sièges**: plan du bus (Business 2+2, MasterClass 2+1, couchettes en Plus). Retenue de 10 minutes dès le premier siège, compte à rebours, reprise possible.
4. **Titulaire**: un seul titulaire (nom, prénom, téléphone, pièce d'identité) quel que soit le nombre de sièges (maximum 5).
5. **Paiement**: Orange Money ou MTN MoMo, opérateur détecté, repli USSD, échecs récupérables sans perdre la sélection.
6. **Billet**: PDF, image, WhatsApp, lien, agenda, lisible hors ligne.

Vérification publique: `/verifier` et `/verifier/[pnr]` affichent trajet, horaire, sièges, nombre de passagers, montant et tampon de statut.
Nom, prénom, téléphone et pièce d'identité sont **masqués par le serveur** avant l'envoi. Le billet complet exige le jeton du lien signé
ou le numéro de la pièce d'identité (blocage après 5 essais, pendant 15 minutes). Le téléphone n'ouvre jamais le billet.

## API

| Route | Rôle |
|---|---|
| `GET /api/calendar?from&to` | 60 jours de départs avec places restantes par classe |
| `GET /api/departures?from&to&date` | départs d'un jour, offres par classe |
| `GET /api/departures/:id/seats?class&hold` | plan et état des sièges |
| `POST /api/holds`, `DELETE /api/holds/:id` | retenue de sièges |
| `POST /api/bookings` | crée une ou deux réservations (aller-retour) pour un titulaire |
| `POST /api/payments`, `GET /api/payments/:id` | paiement Mobile Money simulé |
| `GET /api/verify/:pnr` | billet masqué (public) |
| `POST /api/tickets/unlock`, `GET /api/tickets/:pnr?t=` | billet complet |
| `POST /api/parcels`, `GET /api/parcels/:id` | colis et suivi |
| `POST /api/quotes` | devis de location |
| `GET /api/health` | santé |

## Organisation

```
app/            pages, composants, layouts, store Pinia, composables
content/        réseau (villes, lignes, horaires, tarifs, classes), textes éditoriaux FR/EN, visuels
i18n/locales/   fr.json et en.json (interface)
shared/         types, prix, validation, temps, plans de sièges (utilisés par l'app et le serveur)
server/         routes API, services métier, stockage JSON, limitation de débit, masquage
tests/          unit/ (logique serveur et partagée), nuxt/ (composants et parcours complets)
docs/           audit du site source, décisions
```

## Personnaliser

- **Tarifs, horaires, villes, classes**: `content/network.ts`.
- **Textes**: `content/editorial.ts` (FR et EN côte à côte) et `i18n/locales/*.json`.
- **Photos**: `content/media.ts`. Renseignez `src` (WebP ou AVIF dans `public/images`) et le visuel de remplacement disparaît.
- **Couleurs et thèmes**: `app/assets/css/main.css` (thèmes DaisyUI `mentravel` et `mentravel-night`, couleurs de villes).
