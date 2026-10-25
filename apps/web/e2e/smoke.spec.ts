import { expect, test, type Page } from "@playwright/test";

const SHOTS = process.env.E2E_SHOTS_DIR;
const shot = async (page: Page, name: string) => {
  await page.waitForFunction(() => !(window as any).__cadreMap?.isMoving());
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` });
};

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("P1 — Plateau sableux").first()).toBeVisible();
  await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible();
  await page.waitForFunction(() => !!(window as any).__cadreMap);
});

test("la page affiche le bandeau synthétique, la carte et les panneaux", async ({ page }) => {
  await expect(page.getByText(/Données synthétiques à des fins de démonstration/)).toBeVisible();
  await expect(page.getByRole("tab", { name: "Conception assistée" })).toHaveAttribute("aria-selected", "true");
  await shot(page, "01-accueil");
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
  expect(erreurs.filter((e) => /Worker failed/.test(e))).toEqual([]);
  await shot(page, "01b-carte-quartiers");
});

test("les petits « ? » ouvrent une explication", async ({ page }) => {
  await page.getByRole("button", { name: "Aide : Indice de Cadre de Vie (ICV)" }).click();
  await expect(page.getByRole("tooltip")).toContainText("Note de 0 à 100 par quartier");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});

test("le mode d'emploi est accessible et complet", async ({ page }) => {
  await page.getByRole("link", { name: "Mode d'emploi" }).click();
  await expect(page).toHaveURL(/\/guide$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Mode d'emploi");
  for (const titre of ["1. Démarrer", "4. Conception assistée", "5. Modifier l'aménagement à la main", "6. Arbitrage des investissements"]) {
    await expect(page.getByRole("heading", { name: titre })).toBeVisible();
  }
  await shot(page, "02-guide");
  await page.getByRole("link", { name: "← Retour à la carte" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("éditeur manuel : conforme au départ, non conforme si on recule trop vers la voie", async ({ page }) => {
  const carte = page.locator("div.rounded.border", { hasText: "P1 — Plateau sableux" }).first();
  await carte.getByRole("button", { name: "Modifier à la main" }).click();
  await expect(page.getByText("Mode manuel")).toBeVisible();
  await expect(page.getByText("Conforme aux contraintes")).toBeVisible();
  await expect(page.locator(".maplibregl-marker")).toHaveCount(2);
  await page.waitForFunction(() => (window as any).__cadreMap.getZoom() > 17.5);
  await shot(page, "03-manuel-conforme");

  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: "Déplacer le bâtiment de 1 m (↑)" }).click();
  }
  await expect(page.getByText(/Non conforme/)).toBeVisible();
  await expect(page.getByText(/Retrait inférieur à 5 m/)).toBeVisible();
  await shot(page, "04-manuel-non-conforme");

  for (let i = 0; i < 8; i++) {
    await page.getByRole("button", { name: "Déplacer le bâtiment de 1 m (↑)" }).click();
  }
  await expect(page.getByText(/dépasse les limites de la parcelle/)).toBeVisible();

  await page.getByRole("button", { name: "Revenir à l'optimum auto" }).click();
  await expect(page.getByText("Mode manuel")).toHaveCount(0);
  await expect(page.locator(".maplibregl-marker")).toHaveCount(0);
});

test("éditeur manuel : le glisser-déposer du marqueur met à jour l'évaluation", async ({ page }) => {
  const carte = page.locator("div.rounded.border", { hasText: "P1 — Plateau sableux" }).first();
  await carte.getByRole("button", { name: "Modifier à la main" }).click();
  await expect(page.getByText("Conforme aux contraintes")).toBeVisible();
  await page.waitForTimeout(1500); // fin du zoom animé
  const marqueur = page.locator(".maplibregl-marker", { hasText: "B" });
  const box = (await marqueur.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y - 400, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByText(/Non conforme/)).toBeVisible();
});

test("investissements : décider soi-même un quartier passe en mode mixte", async ({ page }) => {
  await page.getByRole("tab", { name: "Investissements" }).click();
  await expect(page.getByText(/Mode :/)).toContainText("automatique");
  const ouedo = page.locator("li", { hasText: "Ouèdo" });
  await ouedo.getByRole("button", { name: "Décider moi-même" }).click();
  await expect(page.getByText(/Mode :/)).toContainText("mixte");
  await expect(ouedo.getByText("Vous")).toBeVisible();
  await ouedo.getByLabel(/Accès à l'eau potable/).check();
  await expect(page.getByText(/Écart avec l'optimum automatique/)).toBeVisible();
  await shot(page, "05-investissements-mixte");

  await page.getByRole("button", { name: "Tout remettre en automatique" }).click();
  await expect(page.getByText(/Mode :/)).toContainText("automatique");
});

test("investissements : mode 100 % manuel ne finance que les choix imposés", async ({ page }) => {
  await page.getByRole("tab", { name: "Investissements" }).click();
  await page.getByRole("checkbox", { name: /Compléter automatiquement/ }).uncheck();
  await expect(page.getByText(/Mode :/)).toContainText("manuel");
  await expect(page.getByText(/Coût : 0 M FCFA/)).toBeVisible();
});

test("assistant : la réponse (simulée) s'affiche, et l'erreur aussi", async ({ page }) => {
  await page.route("**/api/assistant", async (route) => {
    await route.fulfill({ json: { answer: "Réponse de test sur Ouèdo." } });
  });
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
