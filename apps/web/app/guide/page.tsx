import Link from "next/link";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";

export const metadata = {
  title: "Cadre+ — Mode d'emploi",
  description: "Guide d'utilisation complet de la plateforme Cadre+ (données synthétiques de démonstration)",
};

const SECTIONS = [
  ["demarrer", "1. Démarrer"],
  ["interface", "2. Découvrir l'écran"],
  ["icv", "3. L'Indice de Cadre de Vie"],
  ["conception", "4. Conception assistée"],
  ["manuel", "5. Modifier l'aménagement à la main"],
  ["investissements", "6. Arbitrage des investissements"],
  ["ia", "7. L'assistant IA"],
  ["donnees", "8. Données et limites"],
  ["glossaire", "9. Glossaire"],
  ["faq", "10. Questions fréquentes"],
] as const;

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 border-t border-line pt-6">
      <h2 className="mb-3 text-xl font-semibold text-ink">{title}</h2>
      <div className="space-y-3 leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="pt-2 text-base font-semibold text-ink">{children}</h3>;
}

function Note({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" }) {
  const style = tone === "warn" ? "border-amber-400 bg-amber-50" : "border-sky-400 bg-sky-50";
  return <p className={`rounded border-l-4 p-3 text-sm ${style}`}>{children}</p>;
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="no-scrollbar overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="border border-line bg-brand-50 px-2 py-1 text-left text-ink">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              {r.map((c, i) => (
                <td key={i} className="border border-line px-2 py-1 align-top">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Guide() {
  return (
    <>
    <SiteHeader />
    <div className="mx-auto max-w-6xl px-4 py-6 lg:flex lg:gap-10">
      <nav aria-label="Sommaire" className="mb-6 lg:sticky lg:top-6 lg:mb-0 lg:h-fit lg:w-64 lg:shrink-0">
        <Link href="/app" className="btn btn-dark btn-sm mb-4">
          ← Retour à l'application
        </Link>
        <ul className="space-y-1 text-sm">
          {SECTIONS.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="text-sky-800 hover:underline">{label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <main className="max-w-3xl space-y-8 pb-16">
        <header>
          <h1 className="text-4xl font-extrabold tracking-tight text-ink">Cadre+ — Mode d&apos;emploi</h1>
          <p className="mt-2 text-slate-700">
            Cadre+ est un outil d&apos;aide à la décision pour le cadre de vie : il note les quartiers, propose
            où et comment aménager une parcelle, et répartit un budget entre les quartiers. À chaque étape,
            vous pouvez <strong>accepter la proposition automatique ou la corriger à la main</strong> ; un
            assistant IA peut relire vos choix. La décision reste toujours humaine.
          </p>
          <Note tone="warn">
            <strong>Important :</strong> toutes les données affichées sont <strong>synthétiques</strong> (inventées
            pour la démonstration, à partir de noms de quartiers réels d&apos;Abomey-Calavi). Elles ne reflètent
            pas la situation réelle et ne doivent pas être présentées comme des données officielles.
          </Note>
        </header>

        <Section id="demarrer" title="1. Démarrer">
          <Note>
            <strong>Première visite ?</strong> À l&apos;ouverture de l&apos;application, une fenêtre de bienvenue explique
            en trois étapes ce que fait Cadre+. Choisissez « Commencer (2 minutes) » : l&apos;application vous emmène
            d&apos;abord sur le quartier le moins bien noté. Une liste « Premiers pas » (en bas de l&apos;écran) coche
            ensuite vos étapes : <strong>1.</strong> voir un quartier, <strong>2.</strong> voir une parcelle,{" "}
            <strong>3.</strong> répartir un budget. Vous pouvez la masquer, et relancer la visite à tout moment avec le
            bouton « Visite guidée » de l&apos;en-tête.
          </Note>
          <p>
            Depuis le dossier du projet, la commande <code className="rounded bg-gray-100 px-1">npm run dev</code>{" "}
            lance en une fois l&apos;application web (<code className="rounded bg-gray-100 px-1">http://localhost:3000</code>)
            et le serveur de calcul (<code className="rounded bg-gray-100 px-1">http://localhost:8001</code>). Ouvrez
            ensuite la première adresse dans votre navigateur : vous arrivez sur la page d&apos;accueil. Le bouton « Ouvrir la démo » mène à l&apos;application (adresse <code className="rounded bg-gray-100 px-1">/app</code>).
          </p>
          <p>
            Pour activer l&apos;assistant IA, copiez <code className="rounded bg-gray-100 px-1">services/api/.env.example</code>{" "}
            en <code className="rounded bg-gray-100 px-1">.env</code> et renseignez votre clé API ; sans clé, tout
            fonctionne sauf les réponses de l&apos;IA.
          </p>
          <p>
            <strong>Astuce :</strong> partout dans l&apos;application, les petits boutons{" "}
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-400 text-[10px] font-bold">?</span>{" "}
            expliquent la fonction à côté de laquelle ils se trouvent. Survolez-les ou cliquez dessus (Échap pour fermer).
          </p>
        </Section>

        <Section id="interface" title="2. Découvrir l'écran">
          <Table
            head={["Zone", "Contenu"]}
            rows={[
              ["En-tête (haut)", "Navigation (Accueil, Application, Mode d'emploi) et pastille « Données synthétiques » : rappel permanent que les données sont inventées."],
              ["Carte (centre)", "Zones de quartier colorées selon leur ICV, avec une pastille « nom + note ». Molette pour zoomer, glisser pour déplacer. Cliquez sur un quartier pour ouvrir sa fiche ; les pastilles se masquent quand vous zoomez sur un quartier."],
              ["Cadre en haut à gauche", "Légende : l'échelle de couleurs de la note (0 = dégradé, 100 = bon). Le menu « Afficher / masquer des couches » contient les interrupteurs, la légende de l'aménagement se déplie aussi. La fiche du quartier choisi s'affiche juste dessous."],
              ["Panneau de droite", "Trois onglets, dans l'ordre : « Diagnostic » (où le cadre de vie va-t-il le moins bien ?), « Aménager » (où construire sur une parcelle ?) et « Budget » (où investir ?)."],
              ["Liste « Premiers pas » (bas)", "Trois étapes cliquables pour découvrir l'outil ; masquable, et réaffichée par « Visite guidée »."],
              ["Bouton « Assistant IA » (bas à gauche)", "Ouvre la fenêtre de discussion : posez une question en français ou choisissez une suggestion."],
            ]}
          />
        </Section>

        <Section id="icv" title="3. L'Indice de Cadre de Vie (ICV)">
          <p>
            L&apos;ICV est une note de 0 à 100 attribuée à chaque quartier. Rouge = cadre de vie dégradé, vert = bon.
            Cliquez sur un quartier (sur sa zone ou sur sa pastille) : une fiche explique sa note critère par critère, du plus faible au plus fort, avec le poids de chaque critère et les points faibles à traiter en priorité.
          </p>
          <H3>Comment la note est calculée</H3>
          <p>
            Huit critères sont d&apos;abord ramenés à une échelle de 0 à 100, puis pondérés :
          </p>
          <Table
            head={["Critère", "Poids", "Conversion en note 0-100"]}
            rows={[
              ["Accès à l'école", "15 %", "100 × (1 − temps d'accès / 45 min), minimum 0"],
              ["Accès à la santé", "15 %", "100 × (1 − temps d'accès / 60 min), minimum 0"],
              ["Accès à l'eau potable", "15 %", "100 × (1 − temps d'accès / 45 min), minimum 0"],
              ["Électrification", "15 %", "Taux d'électrification en %"],
              ["Drainage", "15 %", "Score sur 10 × 10"],
              ["Collecte des déchets", "10 %", "Taux de couverture en %"],
              ["Espaces verts", "10 %", "100 × (part de surface verte / 25 %), plafonné à 100"],
              ["Risque d'inondation", "5 %", "100 − (risque sur 10 × 10)"],
            ]}
          />
          <Note>
            Les poids sont un choix de méthode, modifiable : ils sont définis une seule fois dans le jeu de
            données et servent à tous les calculs (carte, investissements, assistant).
          </Note>
        </Section>

        <Section id="conception" title="4. Conception assistée">
          <p>
            Ce module répond à la question : <em>« sur cette parcelle, peut-on construire, où placer le bâtiment et
            où mettre le point de collecte des déchets ? »</em> Trois parcelles de démonstration, à Togba, illustrent
            trois situations : un plateau sableux (bon sol), une zone mixte (sol moyen, bâti existant, zone naturelle
            voisine) et un bas-fond (sol saturé, inondable).
          </p>
          <H3>Étape 1 — la constructibilité</H3>
          <p>
            Chaque parcelle reçoit une note de 0 à 100 : 50 % portance du sol, 40 % risque d&apos;inondation,
            10 % pente. Elle détermine la suite :
          </p>
          <Table
            head={["Note", "Verdict", "Conséquence"]}
            rows={[
              ["75 et plus", "Zone prioritaire", "Emprise au sol jusqu'à 40 % de la parcelle."],
              ["de 40 à 75", "Constructible sous conditions", "Emprise jusqu'à 25 % ; fondations renforcées et drainage."],
              ["moins de 40", "Déconseillé", "Pas de bâtiment : l'outil propose un bassin de rétention des eaux et un tampon écologique."],
            ]}
          />
          <H3>Étape 2 — le placement proposé (automatique)</H3>
          <p>L&apos;optimiseur teste toutes les positions possibles et retient celle qui rapproche le bâtiment de la voie d&apos;accès, tout en respectant :</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>un retrait de <strong>3 m</strong> par rapport aux limites de la parcelle ;</li>
            <li>un retrait de <strong>5 m</strong> par rapport à la voie d&apos;accès ;</li>
            <li>une bande tampon de <strong>10 m</strong> le long des zones naturelles (sans construction) ;</li>
            <li>une distance de <strong>3 m</strong> au bâti existant, qui est conservé ;</li>
            <li>le plafond d&apos;emprise (40 % ou 25 %) ; si l&apos;emprise voulue ne tient pas, elle est réduite par paliers.</li>
          </ul>
          <p>
            Le <strong>point de collecte des déchets</strong> est placé côté voie (accessible aux camions), à plus de 3 m du
            bâtiment et hors bande tampon naturelle (pour éviter la pollution des zones sensibles).
          </p>
          <H3>Étape 3 — le coût estimé</H3>
          <Table
            head={["Poste", "Règle"]}
            rows={[
              ["Fondations — portance ≥ 150 kPa", "Semelles isolées : 35 000 FCFA par m² d'emprise"],
              ["Fondations — portance de 90 à 150 kPa", "Semelles filantes profondes ou radier partiel : 60 000 FCFA/m²"],
              ["Fondations — portance < 90 kPa", "Radier général sur sol amélioré : 95 000 FCFA/m²"],
              ["Drainage périphérique", "25 000 FCFA par mètre linéaire du périmètre du bâtiment, si le risque d'inondation n'est pas « faible »"],
            ]}
          />
          <Note tone="warn">Ces prix sont des hypothèses inventées pour la démonstration. Ils doivent être remplacés par des barèmes réels avant tout usage décisionnel.</Note>
          <H3>Utiliser l&apos;écran</H3>
          <p>
            Onglet « Aménager » : chaque parcelle a une fiche avec la proposition automatique. Le bouton{" "}
            <strong>Zoom</strong> centre la carte dessus. Aux niveaux de zoom élevés (15 et plus), la carte montre le bâtiment
            (bleu), le point de collecte (orange), les zones tampons (vert foncé), le bassin de rétention (bleu clair) et le
            bâti existant (gris).
          </p>
        </Section>

        <Section id="manuel" title="5. Modifier l'aménagement à la main">
          <p>
            Vous n&apos;êtes pas obligé de suivre l&apos;optimiseur. Cliquez sur <strong>« Modifier à la main »</strong> sur
            une fiche de parcelle : l&apos;éditeur démarre à partir de la proposition automatique.
          </p>
          <ul className="list-disc space-y-1 pl-6">
            <li><strong>Déplacer le bâtiment</strong> : glissez le marqueur vert <strong>B</strong> sur la carte, ou utilisez les flèches (déplacement de 1 m).</li>
            <li><strong>Changer la taille</strong> : champs « dimension est-ouest » et « dimension nord-sud », en mètres.</li>
            <li><strong>Pivoter</strong> : curseur de rotation de −90° à +90°.</li>
            <li><strong>Point de collecte</strong> : glissez le marqueur orange <strong>D</strong>, ou ajoutez/retirez-le avec le bouton.</li>
          </ul>
          <p>
            À chaque modification, le serveur revérifie tout en direct avec <strong>les mêmes règles</strong> que l&apos;optimiseur.
            Votre tracé apparaît sur la carte : <span className="font-semibold text-green-700">vert</span> s&apos;il est conforme,{" "}
            <span className="font-semibold text-red-700">rouge</span> sinon. Sous les champs, vous voyez :
          </p>
          <ul className="list-disc space-y-1 pl-6">
            <li>le verdict « Conforme » ou « Non conforme (n erreurs) » ;</li>
            <li>la liste des problèmes : <strong>✖ erreur</strong> (règle impérative violée : hors parcelle, retraits, tampon, chevauchement, plafond d&apos;emprise, point de collecte mal placé) et <strong>⚠ avertissement</strong> (recommandation non suivie : parcelle déconseillée, point de collecte éloigné de la voie ou absent) ;</li>
            <li>l&apos;emprise, la distance à la voie, les fondations et le coût estimé ;</li>
            <li>l&apos;écart de coût et de distance avec l&apos;optimum automatique.</li>
          </ul>
          <Note>
            Les avertissements ne bloquent pas : vous pouvez décider d&apos;y passer outre en connaissance de cause (par
            exemple construire malgré un indice faible si vous avez une raison technique). Les erreurs, elles, signalent
            un tracé irréalisable en l&apos;état.
          </Note>
          <p>
            Le bouton <strong>« Demander l&apos;avis de l&apos;IA »</strong> envoie votre aménagement et son évaluation à un
            assistant qui rédige un avis d&apos;ingénieur-conseil : verdict, corrections chiffrées, points de vigilance. Le bouton{" "}
            <strong>« Revenir à l&apos;optimum auto »</strong> ferme l&apos;éditeur et efface votre tracé.
          </p>
        </Section>

        <Section id="investissements" title="6. Arbitrage des investissements">
          <p>
            Question traitée : <em>« avec tel budget, quels chantiers financer dans quels quartiers pour améliorer au maximum
            le cadre de vie ? »</em> Sept leviers existent : drainage, électrification, eau potable, collecte des déchets,
            écoles, centres de santé, espaces verts. Chaque levier améliore le sous-score concerné d&apos;au plus 25 points
            (le drainage réduit aussi le risque d&apos;inondation).
          </p>
          <H3>Les curseurs</H3>
          <ul className="list-disc space-y-1 pl-6">
            <li><strong>Budget</strong> (en millions de FCFA) : l&apos;enveloppe maximale.</li>
            <li><strong>Équité</strong> (0 à 1) : à 0, on cherche le plus grand gain total pour la population (favorise les quartiers très peuplés) ; à 1, les quartiers au plus faible ICV comptent jusqu&apos;à 2,3 fois plus. C&apos;est le réglage politique entre efficacité et équité.</li>
          </ul>
          <H3>Trois façons de travailler</H3>
          <Table
            head={["Mode", "Comment l'obtenir", "Effet"]}
            rows={[
              ["Automatique", "Ne rien imposer", "L'optimiseur calcule le meilleur plan pour le budget et l'équité choisis."],
              ["Mixte", "« Décider moi-même » sur certains quartiers, case « Compléter automatiquement » cochée", "Vos choix sont respectés ; l'optimiseur répartit le budget restant sur les autres quartiers."],
              ["Manuel", "Idem, mais case « Compléter automatiquement » décochée", "Seul ce que vous imposez est financé."],
            ]}
          />
          <p>
            Pour imposer un quartier, cliquez sur <strong>« Décider moi-même »</strong> : la liste des leviers apparaît, déjà
            cochée selon la proposition courante ; cochez/décochez à votre guise. Une liste vide signifie « ne rien financer
            ici ». <strong>« Laisser l&apos;optimiseur »</strong> rend la main. <strong>« Tout remettre en automatique »</strong> efface
            toutes vos décisions.
          </p>
          <H3>Lire les résultats</H3>
          <ul className="list-disc space-y-1 pl-6">
            <li><strong>Barre et coût</strong> : part du budget utilisée ; elle devient rouge si vos choix dépassent le budget (aucun complément automatique n&apos;est alors calculé).</li>
            <li><strong>ICV moyen</strong> avant → après, pondéré par la population.</li>
            <li><strong>Écart avec l&apos;optimum automatique</strong> (modes mixte/manuel) : ce que votre plan perd, ou non, par rapport au meilleur plan possible. Un écart négatif peut être un choix politique assumé.</li>
            <li><strong>Face à une stratégie naïve</strong> : comparaison avec « financer les plus défavorisés d&apos;abord, levier par levier ».</li>
            <li><strong>Économies de coordination</strong> : quand au moins deux réseaux (drainage, électricité, eau) sont réalisés ensemble dans un quartier, la voirie n&apos;est ouverte qu&apos;une fois : 12 % d&apos;économie sur ces postes.</li>
            <li>Pastille <strong>Vous / Optimiseur / Rien</strong> : qui a décidé pour chaque quartier.</li>
          </ul>
          <p>
            Le bouton <strong>« Demander l&apos;avis de l&apos;IA sur ce plan »</strong> fournit une lecture critique : équité entre
            quartiers, risques, ajustements possibles.
          </p>
          <Note tone="warn">
            Les coûts unitaires (par habitant et par point d&apos;amélioration) sont inventés pour la démonstration, avec des
            rendements décroissants (plus un quartier est déjà bien doté, plus le point supplémentaire coûte cher).
          </Note>
        </Section>

        <Section id="ia" title="7. L'assistant IA">
          <p>
            Deux usages : <strong>poser une question</strong> (bouton « Assistant IA » en bas à gauche) et <strong>demander un avis</strong> sur votre
            aménagement ou votre plan (boutons violets). L&apos;assistant ne connaît que les données de l&apos;application
            (quartiers, indicateurs, parcelles, plan d&apos;investissement de référence) et rappelle qu&apos;elles sont synthétiques.
          </p>
          <p>Exemples de questions : « Quel quartier a le plus besoin d&apos;investissement et pourquoi ? », « Pourquoi Zinvié a-t-il un ICV faible ? », « Que recommandes-tu pour la parcelle P3 ? ».</p>
          <Note tone="warn">
            Une IA peut se tromper ou formuler avec trop d&apos;assurance. Ses réponses sont des aides à la réflexion, à
            confronter aux chiffres affichés par l&apos;application. N&apos;envoyez jamais de données personnelles ou sensibles : le
            texte part chez un fournisseur d&apos;IA externe.
          </Note>
          <p>Si l&apos;IA est indisponible (clé absente, panne), un message l&apos;indique ; le reste de l&apos;application continue de fonctionner.</p>
        </Section>

        <Section id="donnees" title="8. Données et limites">
          <ul className="list-disc space-y-1 pl-6">
            <li>Données <strong>synthétiques</strong> : 8 quartiers d&apos;Abomey-Calavi et 3 parcelles à Togba, aux valeurs inventées mais réalistes. Elles seront remplacées par les données officielles (cadastre, recensement, réseaux) quand un partenariat sera signé.</li>
            <li>Les quartiers sont représentés par des <strong>zones illustratives en forme de tache</strong>, centrées sur la position réelle de chaque arrondissement (leur taille croît avec la population) : ce ne sont pas leurs limites administratives. Le fond de carte est celui d&apos;OpenStreetMap ; les trois parcelles sont fictives et posées autour de Togba.</li>
            <li>Les parcelles sont des rectangles orientés nord-sud ; l&apos;optimiseur ne gère pas encore les formes quelconques.</li>
            <li>L&apos;outil <strong>aide</strong> à décider ; il ne remplace ni une étude géotechnique, ni un bureau de contrôle, ni l&apos;avis d&apos;un ingénieur responsable.</li>
            <li>Modules prévus mais <strong>pas encore disponibles</strong> dans l&apos;application : prospective démographique 2050, résilience climatique, mobilité multimodale, transition des quartiers précaires, application citoyenne.</li>
          </ul>
        </Section>

        <Section id="glossaire" title="9. Glossaire">
          <Table
            head={["Terme", "Définition"]}
            rows={[
              ["ICV", "Indice de Cadre de Vie : note de 0 à 100 d'un quartier."],
              ["Portance", "Capacité du sol à supporter une charge, en kilopascals (kPa). Plus elle est élevée, plus les fondations sont simples."],
              ["Emprise / CES", "Surface au sol du bâtiment ; CES = coefficient d'emprise au sol = emprise / surface de la parcelle."],
              ["Retrait", "Distance minimale à respecter entre le bâtiment et une limite (parcelle, voie)."],
              ["Bande tampon", "Zone non constructible le long d'un espace naturel, qui le protège."],
              ["Bassin de rétention", "Espace qui retient temporairement l'eau de pluie pour limiter les inondations."],
              ["Semelle isolée / filante, radier", "Types de fondations, du plus simple (semelles isolées) au plus lourd (radier général)."],
              ["Levier", "Type de chantier finançable (drainage, eau, électricité, déchets, école, santé, espaces verts)."],
              ["Levier réseau", "Drainage, électrification et eau : chantiers qui passent par la voirie et peuvent être coordonnés."],
              ["Équité", "Curseur qui donne plus de poids aux quartiers défavorisés dans l'optimisation."],
              ["FCFA / M FCFA", "Franc CFA / millions de francs CFA."],
            ]}
          />
        </Section>

        <Section id="faq" title="10. Questions fréquentes">
          <H3>La carte reste vide ou le bandeau d&apos;erreur apparaît.</H3>
          <p>Vérifiez que le serveur de calcul tourne (<code className="rounded bg-gray-100 px-1">npm run dev</code>) et ouvrez <code className="rounded bg-gray-100 px-1">http://localhost:8001/health</code> : la réponse doit être « ok ».</p>
          <H3>L&apos;aménagement n&apos;apparaît pas sur la carte.</H3>
          <p>Zoomez au niveau 15 ou plus, vérifiez que la case « Aménagement optimal » est cochée, ou utilisez le bouton Zoom d&apos;une parcelle.</p>
          <H3>« Avis indisponible » ou « clé manquante ».</H3>
          <p>La clé du fournisseur d&apos;IA n&apos;est pas renseignée dans <code className="rounded bg-gray-100 px-1">services/api/.env</code>, ou le fournisseur est injoignable. Redémarrez après avoir ajouté la clé.</p>
          <H3>Les pastilles des quartiers ont disparu.</H3>
          <p>Elles se masquent quand vous zoomez fortement pour ne pas gêner le travail sur une parcelle. Dézoomez pour les retrouver.</p>
          <H3>Mon plan dépasse le budget.</H3>
          <p>Retirez des leviers imposés ou augmentez le budget : l&apos;optimiseur ne complète rien tant que vos choix dépassent l&apos;enveloppe.</p>
          <H3>Puis-je enregistrer mes plans ?</H3>
          <p>Pas encore : vos choix sont conservés tant que la page reste ouverte. L&apos;enregistrement de scénarios fait partie des évolutions prévues.</p>
        </Section>
      </main>
    </div>
    <SiteFooter />
    </>
  );
}
