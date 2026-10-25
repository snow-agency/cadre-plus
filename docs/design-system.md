# Design system Cadre+

Un système volontairement petit, qui mélange trois styles du dépôt *awesome-design-skills* (installés dans `.agents/skills/`) :

| Style | Ce qu'on en retient |
|---|---|
| **Sleek** | Fondations : police Inter, libellés en police mono, grille de 8 pt, boutons en pilule, contrastes AA, états de focus visibles, titres serrés en deux tons. |
| **Bento** | Composition : cartes arrondies de tailles variées sur une grille, ombres douces, hiérarchie claire. |
| **Enterprise** | Lecture des données : gros chiffres + libellé discret, panneaux « verre » posés sur la carte, section sombre pour l'appel à l'action, héros avec liste de points. |

Ce qui est propre à Cadre+ : palette bleue institutionnelle, **violet réservé à l'IA**, échelle de couleurs de l'ICV, pastilles de quartier sur la carte.

## Principes
1. **Un seul endroit par décision** : jetons dans `apps/web/app/globals.css` (`@theme`), échelle ICV dans `apps/web/lib/couleurs.ts`. Pas de couleur « en dur » ailleurs, sauf calques cartographiques.
2. **La couleur ne porte jamais seule l'information** : une note chiffrée accompagne toujours une couleur d'ICV.
3. **L'IA se voit** : tout ce qui vient de l'IA est violet (bouton, encart de réponse) et s'ouvre à la demande.
4. **Calme** : peu de couleurs, beaucoup d'espace, une ombre douce. La carte reste le héros.

## Jetons
- **Texte** : `ink` #0b2545 (titres), `body` #1f2a3c, `muted` #566780 (≥ 5,5:1 sur blanc). Fond `canvas` #f4f8fd, filets `line` #e2e9f3.
- **Marque** : `brand-600` #2563eb (actions), `brand-700` survol, `brand-900` #0b2545 (sections sombres). **IA** : `ai-600` #7c3aed.
- **États** : `good` #10b981, `warn` #f59e0b, `bad` #ef4444 (les mêmes que l'échelle ICV).
- **Typographie** : Inter Variable (corps, titres) ; JetBrains Mono (libellés `label-caps`, nombres secondaires). Échelle 12/14/16/20/24/32, titres de page 48–72 avec interlignage 1,05.
- **Espacement** : multiples de 4, rythme de 8 (`gap-2/4/6`). **Rayons** : cartes `1.25rem`, pilules `9999px`, champs `0.75rem`. **Ombres** : `shadow-card` (repos), `shadow-pop` (fenêtres flottantes).

## Composants (classes dans `globals.css`)
| Besoin | Classe / composant |
|---|---|
| Carte de contenu | `.card` ; sur la carte géographique `.glass` |
| Bouton | `.btn` + `.btn-primary` (action principale), `.btn-ghost` (secondaire), `.btn-dark`, `.btn-good` (validation), `.btn-ai` (IA) ; `.btn-sm` |
| Pastille d'information | `.chip` (+ couleurs Tailwind) |
| Champ | `.field` |
| Libellé de section | `.label-caps` |
| Aide contextuelle | `components/HelpTip.tsx` (le petit « ? ») |
| Logo, en-tête, pied de page | `components/Logo.tsx`, `SiteHeader.tsx`, `SiteFooter.tsx` |

États obligatoires : repos, survol, `focus-visible` (anneau bleu 2 px, global), actif, désactivé. Aucune interaction ne repose sur le survol seul.

## Langage de la carte
- Fond : CARTO Positron (clair). Zones de quartier en **taches organiques** (illustratives, taille ∝ √population), couleur = ICV, contour blanc, contour marine pour le quartier choisi.
- Une **pastille** « point coloré · nom · note » par quartier (visible à l'échelle de la commune, masquée au fort zoom).
- Au fort zoom la zone s'estompe pour laisser voir le fond (travail sur parcelle). Votre tracé manuel : vert = conforme, rouge = non conforme.

## À ne pas faire
- Plus d'un bouton principal par zone ; des ombres ou des bordures épaisses empilées ; du texte jaune pur sur blanc (utiliser `couleurIcvTexte`).
- Écraser l'attribut `class` d'un marqueur MapLibre (utiliser `classList`) ; mettre `position: absolute` sur le conteneur de la carte (MapLibre le remet en `relative`).

## Liste de contrôle avant fusion
- [ ] Navigation entièrement au clavier, focus visible partout
- [ ] Contraste ≥ 4,5:1 pour le texte courant
- [ ] Aucun libellé ambigu ; chaque nouvelle fonction a son « ? » et son paragraphe dans le mode d'emploi
- [ ] Rendu vérifié en capture d'écran (accueil, application, un panneau ouvert) et tests e2e verts
