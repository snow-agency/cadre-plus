import { test } from "@playwright/test";

test("captures visuelles", async ({ page }) => {
  test.skip(!process.env.CAPTURE_APERCU, "Régénère l'aperçu de la page d'accueil : CAPTURE_APERCU=1");
  const sh = process.env.E2E_SHOTS_DIR!;
  page.on("console", (m) => m.type() === "error" && console.log("ERR", m.text().slice(0, 200)));
  await page.goto("/app");
  await page.waitForFunction(() => { const m = (window as any).__cadreMap; return m && m.isSourceLoaded("icv") && !m.isMoving(); }, null, { timeout: 60000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${sh}/n-app.png` });
  await page.screenshot({ path: `${process.cwd()}/public/img/apercu-application.jpg`, type: "jpeg", quality: 86, clip: { x: 0, y: 56, width: 1440, height: 844 } });
  await page.goto("/");
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${sh}/n-landing-1.png` });
  await page.screenshot({ path: `${sh}/n-landing-full.png`, fullPage: true });
});
