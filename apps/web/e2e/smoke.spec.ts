import { expect, test, type Page } from "@playwright/test";

const SHOTS = process.env.E2E_SHOTS_DIR;
const shot = async (page: Page, name: string) => {
  await page.waitForFunction(() => !(window as any).__cadreMap?.isMoving());
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` });
};

const parcelle = (page: Page, id: string) => page.getByTestId(`parcelle-${id}`);

// Attend que la carte soit immobile et que les 8 pastilles soient posées sur leur quartier.
async function pastillesPretes(page: Page) {
  await page.waitForFunction(() => {
    const m = (window as any).__cadreMap;
    if (!m || m.isMoving() || document.querySelectorAll("[data-quartier]").length !== 8) return false;
    const el = document.querySelector('[data-quartier="quartier-godomey"]') as HTMLElement;
    const b = el.getBoundingClientRect();
    const c = m.getCanvas().getBoundingClientRect();
    const p = m.project([2.3432, 6.3854]);
    return Math.hypot(b.x + b.width / 2 - (c.x + p.x), b.y + b.height / 2 - (c.y + p.y)) < 4;
  });
}

test.describe("page d'accueil", () => {
  test("présente le produit et mène à l'application", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("avant de construire");
    await expect(page.getByText("ICV moyen, pondéré par la population")).toBeVisible();
    await expect(page.getByText("4 / 8")).toBeVisible();
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/00-accueil.png`, fullPage: true });
    await page.getByRole("link", { name: /Ouvrir la démo/ }).first().click();
    await expect(page).toHaveURL(/\/app$/);
  });
});

const CLE_ONBOARDING = "cadre-plus:onboarding:v1";

async function ouvrirApp(page: Page) {
  await page.goto("/app");
  await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible();
  await page.waitForFunction(() => !!(window as any).__cadreMap);
}

const ongletAmenager = (page: Page) => page.getByRole("tab", { name: "Aménager" }).click();

test.describe("application", () => {
  test.beforeEach(async ({ page }) => {
    // Visite déjà faite : l'accueil ne masque pas l'interface (il est testé plus bas)
    await page.addInitScript(
      ([cle]) => localStorage.setItem(cle, JSON.stringify({ masque: true, fait: { quartier: true, parcelle: true, budget: true } })),
      [CLE_ONBOARDING],
    );
    await ouvrirApp(page);
    await expect(page.locator("[data-quartier]")).toHaveCount(8);
  });

  test("affiche l'en-tête, la carte et les panneaux", async ({ page }) => {
    await expect(page.getByText("Données synthétiques").first()).toBeVisible();
    await expect(page.getByRole("tab", { name: "Diagnostic" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("heading", { name: "Où le cadre de vie va-t-il le moins bien ?" })).toBeVisible();
    await shot(page, "01-application");
  });

  test("les données se chargent sur la carte (worker MapLibre opérationnel)", async ({ page }) => {
    const erreurs: string[] = [];
    page.on("console", (m) => m.type() === "error" && erreurs.push(m.text()));
    await page.reload();
    await page.waitForFunction(() => {
      const m = (window as any).__cadreMap;
      return m && m.isSourceLoaded("icv") && m.isSourceLoaded("parcelles") && m.isSourceLoaded("amenagement");
    });
    const compte = await page.evaluate(() => {
      const m = (window as any).__cadreMap;
      const ids = (src: string) => new Set(m.querySourceFeatures(src).map((f: any) => f.properties.id)).size;
      return { icv: ids("icv"), parcelles: ids("parcelles"), rendus: m.queryRenderedFeatures({ layers: ["icv-fill"] }).length };
    });
    expect(compte.icv).toBe(8);
    expect(compte.parcelles).toBe(3);
    expect(compte.rendus).toBeGreaterThan(0);
    await expect(page.locator("[data-quartier]")).toHaveCount(8);
    expect(erreurs.filter((e) => /Worker failed/.test(e))).toEqual([]);
  });

  test("les pastilles sont bien positionnées sur la carte", async ({ page }) => {
    await pastillesPretes(page);
    const ecart = await page.evaluate(() => {
      const m = (window as any).__cadreMap;
      const el = document.querySelector('[data-quartier="quartier-godomey"]') as HTMLElement;
      const b = el.getBoundingClientRect();
      const c = m.getCanvas().getBoundingClientRect();
      const p = m.project([2.3432, 6.3854]);
      return Math.hypot(b.x + b.width / 2 - (c.x + p.x), b.y + b.height / 2 - (c.y + p.y));
    });
    expect(ecart).toBeLessThan(4);
  });

  test("cliquer un quartier ouvre sa fiche explicative", async ({ page }) => {
    await pastillesPretes(page);
    await page.locator('[data-quartier="quartier-godomey"]').click();
    const fiche = page.getByRole("region", { name: "Détail du quartier Godomey" });
    await expect(fiche).toBeVisible();
    await expect(fiche).toContainText("Pourquoi cette note");
    await expect(fiche).toContainText("Points faibles");
    await shot(page, "02-quartier");
    await fiche.getByRole("button", { name: "Fermer le détail du quartier" }).click();
    await expect(fiche).toHaveCount(0);
  });

  test("les petits « ? » ouvrent une explication", async ({ page }) => {
    await page.getByRole("button", { name: "Aide : Indice de Cadre de Vie (ICV)" }).click();
    await expect(page.getByRole("tooltip")).toContainText("Note de 0 à 100 par quartier");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("tooltip")).toHaveCount(0);
  });

  test("le mode d'emploi est accessible et complet", async ({ page }) => {
    await page.getByRole("link", { name: "Mode d'emploi", exact: true }).click();
    await expect(page).toHaveURL(/\/guide$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Mode d'emploi");
    for (const titre of ["1. Démarrer", "4. Conception assistée", "5. Modifier l'aménagement à la main", "6. Arbitrage des investissements"]) {
      await expect(page.getByRole("heading", { name: titre })).toBeVisible();
    }
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/03-guide.png` });
    await page.getByRole("link", { name: "← Retour à l'application" }).click();
    await expect(page).toHaveURL(/\/app$/);
  });

  test("éditeur manuel : conforme au départ, non conforme si on recule trop vers la voie", async ({ page }) => {
    await ongletAmenager(page);
    await parcelle(page, "parcelle-togba-01").getByRole("button", { name: "Modifier à la main" }).click();
    await expect(page.getByText("Mode manuel")).toBeVisible();
    await expect(page.getByText("Conforme aux contraintes")).toBeVisible();
    await expect(page.locator("[data-editor-marker]")).toHaveCount(2);
    await page.waitForFunction(() => (window as any).__cadreMap.getZoom() > 17.5);
    await shot(page, "04-manuel-conforme");

    for (let i = 0; i < 2; i++) {
      await page.getByRole("button", { name: "Déplacer le bâtiment de 1 m (↑)" }).click();
    }
    await expect(page.getByText(/Non conforme/)).toBeVisible();
    await expect(page.getByText(/Retrait inférieur à 5 m/)).toBeVisible();
    await shot(page, "05-manuel-non-conforme");

    for (let i = 0; i < 8; i++) {
      await page.getByRole("button", { name: "Déplacer le bâtiment de 1 m (↑)" }).click();
    }
    await expect(page.getByText(/dépasse les limites de la parcelle/)).toBeVisible();

    await page.getByRole("button", { name: "Revenir à l'optimum auto" }).click();
    await expect(page.getByText("Mode manuel")).toHaveCount(0);
    await expect(page.locator("[data-editor-marker]")).toHaveCount(0);
  });

  test("éditeur manuel : le glisser-déposer du marqueur met à jour l'évaluation", async ({ page }) => {
    await ongletAmenager(page);
    await parcelle(page, "parcelle-togba-01").getByRole("button", { name: "Modifier à la main" }).click();
    await expect(page.getByText("Conforme aux contraintes")).toBeVisible();
    await page.waitForTimeout(1500); // fin du zoom animé
    const marqueur = page.locator('[data-editor-marker="batiment"]');
    const box = (await marqueur.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y - 400, { steps: 12 });
    await page.mouse.up();
    await expect(page.getByText(/Non conforme/)).toBeVisible();
  });

  test("voir une parcelle : satellite, étiquettes lisibles, étapes et légende", async ({ page }) => {
    await ongletAmenager(page);
    await expect(page.getByRole("list", { name: "Comment ça marche" })).toBeVisible();
    await page.getByText("Lire la carte (légende)").click();
    await expect(page.getByText("Voie d'accès (la route)")).toBeVisible();
    await expect(parcelle(page, "parcelle-togba-01")).toContainText("Proposition :");

    await parcelle(page, "parcelle-togba-01").getByRole("button", { name: "Voir sur la carte" }).click();
    await expect(page.getByRole("button", { name: "Satellite" })).toHaveAttribute("aria-pressed", "true");
    await page.waitForFunction(() => (window as any).__cadreMap.getZoom() > 17.5);
    const etiquette = (type: string) => page.locator(`[data-etiquette="${type}"]`).first();
    await expect(etiquette("batiment")).toContainText("Bâtiment proposé");
    await expect(etiquette("batiment")).toBeVisible();
    await expect(etiquette("voie_acces")).toContainText("Voie d'accès");
    await expect(etiquette("point_collecte")).toContainText("Collecte des déchets");
    await page.waitForTimeout(1200);
    await shot(page, "10-parcelle-satellite");

    await parcelle(page, "parcelle-togba-01").getByRole("button", { name: "Modifier à la main" }).click();
    await expect(page.getByRole("list", { name: "Comment modifier" })).toBeVisible();
    await expect(etiquette("batiment")).toBeHidden();
    await expect(etiquette("voie_acces")).toBeVisible();
    await page.waitForFunction(() => (window as any).__cadreMap.getPitch() < 1);
    await page.waitForTimeout(1200);
    await shot(page, "11-edition");

    await page.getByRole("button", { name: "Plan", exact: true }).click();
    await expect(page.getByRole("button", { name: "Plan", exact: true })).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => (window as any).__cadreMap.getLayoutProperty("satellite", "visibility"))).toBe("none");
  });

  test("investissements : décider soi-même un quartier passe en mode mixte", async ({ page }) => {
    await page.getByRole("tab", { name: "Budget" }).click();
    await expect(page.getByText(/Mode :/)).toContainText("automatique");
    const ouedo = page.locator("#panel-budget li", { hasText: "Ouèdo" });
    await ouedo.getByRole("button", { name: "Décider moi-même" }).click();
    await expect(page.getByText(/Mode :/)).toContainText("mixte");
    await expect(ouedo.getByText("Vous")).toBeVisible();
    await ouedo.getByLabel(/Accès à l'eau potable/).check();
    await expect(page.getByText(/Écart avec l'optimum automatique/)).toBeVisible();
    await shot(page, "06-investissements-mixte");

    await page.getByRole("button", { name: "Tout remettre en automatique" }).click();
    await expect(page.getByText(/Mode :/)).toContainText("automatique");
  });

  test("investissements : mode 100 % manuel ne finance que les choix imposés", async ({ page }) => {
    await page.getByRole("tab", { name: "Budget" }).click();
    await page.getByRole("checkbox", { name: /Compléter automatiquement/ }).uncheck();
    await expect(page.getByText(/Mode :/)).toContainText("manuel");
    await expect(page.getByText(/Coût : 0 M FCFA/)).toBeVisible();
  });

  test("les interrupteurs de couches cochent et décochent vraiment", async ({ page }) => {
    await page.getByText("Afficher / masquer des couches").click();
    const visibilite = (couche: string) =>
      page.evaluate((c) => (window as any).__cadreMap.getLayoutProperty(c, "visibility"), couche);
    const interrupteur = page.getByRole("switch", { name: "Afficher : Parcelles" });
    await expect(interrupteur).toBeChecked();
    await page.locator("label", { has: interrupteur }).click(); // la piste visible, comme le ferait un utilisateur
    await expect(interrupteur).not.toBeChecked();
    expect(await visibilite("parcelles-fill")).toBe("none");
    await page.getByText("Parcelles", { exact: true }).click(); // un clic sur le libellé fonctionne aussi
    await expect(interrupteur).toBeChecked();
    expect(await visibilite("parcelles-fill")).toBe("visible");
  });

  test("l'info-bulle « ? » n'est pas rognée et ne bloque pas l'interface", async ({ page }) => {
    await page.getByRole("button", { name: "Aide : Indice de Cadre de Vie (ICV)" }).click();
    const bulle = page.getByRole("tooltip");
    await expect(bulle).toBeVisible();
    const b = (await bulle.boundingBox())!;
    const vue = page.viewportSize()!;
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.y).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(vue.width);
    expect(b.y + b.height).toBeLessThanOrEqual(vue.height);
    await page.getByRole("tab", { name: "Budget" }).click(); // la bulle ne capte pas les clics
    await expect(page.getByRole("tab", { name: "Budget" })).toHaveAttribute("aria-selected", "true");
  });

  test("le diagnostic classe les quartiers et propose la suite", async ({ page }) => {
    const liste = page.locator("#panel-diagnostic");
    await expect(liste.getByRole("button", { name: /Ouèdo/ })).toBeVisible();
    await liste.getByRole("button", { name: /Ouèdo/ }).click();
    await expect(page.getByRole("region", { name: "Détail du quartier Ouèdo" })).toBeVisible();
    await shot(page, "07-diagnostic");
  });

  test("assistant : la réponse (simulée) s'affiche, et l'erreur aussi", async ({ page }) => {
    await page.route("**/api/assistant", async (route) => {
      await route.fulfill({ json: { answer: "Réponse de test sur Ouèdo." } });
    });
    await page.getByRole("button", { name: "Assistant IA" }).click();
    await page.getByPlaceholder(/quel quartier/i).fill("Quel quartier ?");
    await page.getByRole("button", { name: "Demander", exact: true }).click();
    await expect(page.getByText("Réponse de test sur Ouèdo.")).toBeVisible();

    await page.unroute("**/api/assistant");
    await page.route("**/api/assistant", (route) =>
      route.fulfill({ status: 503, json: { detail: "RODIUM_API_KEY manquante" } }),
    );
    await page.getByRole("button", { name: "Demander", exact: true }).click();
    await expect(page.getByText("RODIUM_API_KEY manquante")).toBeVisible();
  });
});

test.describe("première visite", () => {
  test("l'accueil guide, puis la liste « Premiers pas » avance", async ({ page }) => {
    await ouvrirApp(page);
    const accueil = page.getByRole("dialog", { name: /Bienvenue sur Cadre\+/ });
    await expect(accueil).toBeVisible();
    await shot(page, "08-accueil-guide");
    await accueil.getByRole("button", { name: /Commencer/ }).click();
    await expect(accueil).toHaveCount(0);

    const premiersPas = page.getByRole("region", { name: "Premiers pas" });
    await expect(premiersPas).toContainText("1/3");
    await expect(page.getByRole("region", { name: /Détail du quartier/ })).toBeVisible();
    await shot(page, "09-premiers-pas");

    await premiersPas.getByRole("button", { name: /Ouvrir le budget/ }).click();
    await expect(page.getByRole("tab", { name: "Budget" })).toHaveAttribute("aria-selected", "true");
    await page.locator("#panel-budget").getByLabel(/Budget/).first().focus();
    await page.getByRole("button", { name: "Masquer les premiers pas" }).click();
    await expect(premiersPas).toHaveCount(0);
  });

  test("« Explorer librement » ferme l'accueil et il ne revient pas, « Visite guidée » le rouvre", async ({ page }) => {
    await ouvrirApp(page);
    const accueil = page.getByRole("dialog", { name: /Bienvenue sur Cadre\+/ });
    await accueil.getByRole("button", { name: "Explorer librement" }).click();
    await expect(accueil).toHaveCount(0);
    await page.reload();
    await page.waitForFunction(() => !!(window as any).__cadreMap);
    await expect(accueil).toHaveCount(0);
    await page.getByRole("button", { name: "Visite guidée" }).click();
    await expect(accueil).toBeVisible();
  });
});
