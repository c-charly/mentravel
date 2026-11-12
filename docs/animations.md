# Animations (GSAP)

Les animations reposent sur GSAP et son plugin ScrollTrigger. Les deux sont chargés à la demande, après le premier rendu, dans deux fichiers séparés (environ 27 Ko et 17 Ko en gzip). Aucune page n'appelle GSAP directement: tout passe par des directives et deux ou trois composants.

## Directives

Elles s'écrivent dans le gabarit, sur n'importe quel élément.

| Directive | Effet |
|---|---|
| `v-reveal` | L'élément apparaît (fondu et glissement) quand il entre dans l'écran. |
| `v-stagger` | Les enfants directs apparaissent l'un après l'autre. Pour un tableau, à poser sur `<tbody>`. |
| `v-parallax` | Le visuel se déplace lentement pendant le défilement. À poser sur une image dans un cadre `overflow-hidden` (`MediaFrame` le fait avec sa propriété `parallax`). |
| `v-accordion` | Ouverture et fermeture douces d'un `<details>`, clavier et lecteurs d'écran conservés. |

Modificateurs de `v-reveal` et `v-stagger`: `.left`, `.right`, `.down`, `.fade`, `.scale`, et `.now` (joue tout de suite, sans attendre le défilement: haut de page, éléments fixes).
Options: `{ x, y, scale, rotate, delay, duration, ease, start }`, plus `each` (écart entre enfants) pour `v-stagger`.

```vue
<h2 v-reveal class="display t-title">Titre</h2>
<ul v-stagger="{ each: 0.12, y: 48 }">...</ul>
<div v-reveal.right.now="{ delay: 0.3 }">...</div>
```

## Composants

- `RevealText`: titre révélé mot par mot (utilisé pour les `h1`). Rejoue l'entrée quand le texte change.
- `Compteur`: nombre qui s'incrémente jusqu'à sa valeur en entrant dans l'écran.
- `ScrollProgress`: barre ambre de progression de lecture sous l'en-tête.

## Pour du sur-mesure

- `useGsapScope(ref, ({ gsap, ScrollTrigger, root }) => { ... })` exécute une animation propre à un composant et la nettoie au démontage (exemples: carte de `/trajets`, pastille flottante de l'accueil).
- `useStepEnter(ref, () => step.value)` rejoue une entrée douce à chaque étape d'un parcours (réservation, location de bus).
- `onceInView(ScrollTrigger, el, 'top 88%', play)` joue une fois à l'arrivée dans l'écran, y compris si l'élément est déjà visible au chargement.

## Garde-fous

L'état initial (élément masqué avant son apparition) est posé en CSS et rendu par le serveur, donc sans clignotement. Le contenu ne reste jamais caché:

- sans JavaScript, rien n'est masqué (la classe `js` est posée par le script du `<head>`);
- avec `prefers-reduced-motion: reduce`, la classe `anim-off` est posée tout de suite et la page s'affiche telle quelle;
- si GSAP n'est pas prêt après 3 secondes (connexion lente), ou ne se charge pas, la classe `anim-off` est posée et tout s'affiche sans animation;
- à l'impression, tout est visible.

## Pièges à éviter

- Ne pas poser `v-reveal` ou `v-stagger` sur un élément qui a déjà une transition CSS sur `transform` (par exemple `.btn`): les deux se disputeraient la propriété. Poser la directive sur un conteneur.
- Ne pas poser ces directives sur un élément qui utilise les classes Tailwind `translate-*`, `scale-*` ou `rotate-*`: GSAP les absorbe puis les efface en fin d'animation.
- Ne pas masquer un état initial avec `transform` en CSS: GSAP relit ce transform comme sa position de départ. Utiliser `opacity` ou `visibility`.
- Sur un élément SVG qui porte un attribut `transform`, n'animer que l'opacité.
- `lenis` (`useSmoothScroll.ts`) n'est pas installé et ce composable n'est branché nulle part: il n'est pas utilisé par ces animations.
