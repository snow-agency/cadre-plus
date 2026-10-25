// MapLibre v6 déduit l'URL de son worker de l'emplacement de son propre fichier, que le bundler
// de Next.js déplace : le worker ne se charge alors pas et aucune donnée GeoJSON ne s'affiche.
// On héberge donc le worker nous-mêmes dans public/maplibre/ (voir lib/maplibre.ts).
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const dist = path.join(path.dirname(require.resolve("maplibre-gl/package.json")), "dist");
const target = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "maplibre");

mkdirSync(target, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(path.join(dist, file), path.join(target, file));
}
console.log(`MapLibre : worker copié dans ${target}`);
