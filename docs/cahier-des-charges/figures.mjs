// Génère les schémas du cahier des charges (SVG -> PNG via Chromium/Playwright).
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(dir, "img");
mkdirSync(out, { recursive: true });

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const STYLES = {
  solid: { fill: "#eff6ff", stroke: "#1d4ed8", dash: "" },
  planned: { fill: "#f8fafc", stroke: "#64748b", dash: "10 6" },
  data: { fill: "#ecfdf5", stroke: "#047857", dash: "" },
  dataPlanned: { fill: "#f0fdf4", stroke: "#047857", dash: "10 6" },
  external: { fill: "#fff7ed", stroke: "#c2410c", dash: "" },
  user: { fill: "#f1f5f9", stroke: "#334155", dash: "" },
};

const text = (x, y, s, { size = 20, weight = 400, fill = "#1e293b", anchor = "start" } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`;

function box({ x, y, w, h, title, lines = [], kind = "solid" }) {
  const s = STYLES[kind];
  const body = lines.map((l, i) => text(x + 16, y + 58 + i * 26, l, { size: 19, fill: "#334155" })).join("");
  return (
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${s.fill}" stroke="${s.stroke}" stroke-width="2.5"` +
    `${s.dash ? ` stroke-dasharray="${s.dash}"` : ""}/>` +
    text(x + 16, y + 32, title, { size: 21, weight: 700, fill: "#0f172a" }) +
    body
  );
}

const arrow = (points, { dash = false, both = false } = {}) =>
  `<polyline points="${points.map((p) => p.join(",")).join(" ")}" fill="none" stroke="#334155" stroke-width="2.5"` +
  `${dash ? ' stroke-dasharray="8 6"' : ""} marker-end="url(#a)"${both ? ' marker-start="url(#a)"' : ""}/>`;

const svgWrap = (w, h, inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="Segoe UI, Arial, sans-serif">` +
  `<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">` +
  `<path d="M0,0 L10,5 L0,10 z" fill="#334155"/></marker></defs>` +
  `<rect width="${w}" height="${h}" fill="#ffffff"/>${inner}</svg>`;

function architecture() {
  const colTitle = (x, s) => text(x, 40, s, { size: 17, weight: 700, fill: "#64748b" });
  const parts = [
    colTitle(30, "UTILISATEURS"), colTitle(450, "INTERFACES"), colTitle(900, "API CADRE+"), colTitle(1500, "DONNÉES ET SERVICES"),
    box({ x: 30, y: 70, w: 330, h: 120, title: "Ministère et mairies", lines: ["Décideurs, urbanistes,", "services techniques"], kind: "user" }),
    box({ x: 30, y: 220, w: 330, h: 120, title: "Ingénieurs, bureaux d'études", lines: ["Conception, contrôle,", "validation"], kind: "user" }),
    box({ x: 30, y: 370, w: 330, h: 120, title: "Citoyens", lines: ["Signalement, consultation", "de l'ICV de leur quartier"], kind: "user" }),
    box({ x: 450, y: 120, w: 360, h: 200, title: "Application web", lines: ["apps/web", "Next.js, Tailwind CSS, MapLibre", "Cartes, modules, aide « ? »,", "mode d'emploi"] }),
    box({ x: 450, y: 370, w: 360, h: 140, title: "Application citoyenne", lines: ["apps/citoyen", "PWA légère, puis WhatsApp / USSD"], kind: "planned" }),
    `<rect x="900" y="70" width="520" height="720" rx="16" fill="#ffffff" stroke="#1d4ed8" stroke-width="3"/>`,
    text(930, 106, "services/api", { size: 21, weight: 700, fill: "#0f172a" }),
    text(930, 130, "Python, FastAPI, Shapely", { size: 17, fill: "#475569" }),
    box({ x: 930, y: 150, w: 460, h: 70, title: "ICV et carte des inégalités" }),
    box({ x: 930, y: 235, w: 460, h: 100, title: "Conception assistée", lines: ["Optimiseur de placement + évaluation manuelle"] }),
    box({ x: 930, y: 350, w: 460, h: 100, title: "Arbitrage des investissements", lines: ["Optimiseur exact (budget, équité)"] }),
    box({ x: 930, y: 465, w: 460, h: 100, title: "Assistant IA", lines: ["Questions et avis d'ingénieur-conseil"] }),
    box({ x: 930, y: 580, w: 460, h: 95, title: "Modules à venir", lines: ["Prospective 2050 · Résilience et climat", "Mobilité · Transition des quartiers"], kind: "planned" }),
    box({ x: 930, y: 690, w: 460, h: 80, title: "Accès aux données (data_access)", lines: [] }),
    box({ x: 1500, y: 120, w: 270, h: 150, title: "Fournisseur IA", lines: ["RodiumAI, API compatible", "OpenAI (modèle Claude)"], kind: "external" }),
    box({ x: 1500, y: 640, w: 270, h: 110, title: "GeoJSON synthétiques", lines: ["(aujourd'hui)"], kind: "data" }),
    box({ x: 1500, y: 790, w: 270, h: 120, title: "Neon", lines: ["PostgreSQL + PostGIS", "(cible : données réelles)"], kind: "dataPlanned" }),
    box({ x: 450, y: 960, w: 560, h: 110, title: "Sources externes", lines: ["ANDF, INStaD, Sentinel-2, OpenStreetMap,", "opérateurs mobiles, gestionnaires de réseaux"], kind: "planned" }),
    box({ x: 1100, y: 960, w: 360, h: 110, title: "Scripts d'import (data/)", lines: ["Génération des données de démo,", "futurs imports réels"] }),
    arrow([[360, 130], [405, 130], [405, 190], [450, 190]]),
    arrow([[360, 280], [405, 280], [405, 250], [450, 250]]),
    arrow([[360, 430], [450, 430]], { dash: true }),
    arrow([[810, 220], [900, 220]], { both: true }),
    arrow([[810, 440], [900, 440]], { both: true, dash: true }),
    text(855, 205, "HTTPS", { size: 15, anchor: "middle", fill: "#475569" }),
    arrow([[1390, 515], [1460, 515], [1460, 195], [1500, 195]], { both: true }),
    arrow([[1390, 730], [1500, 695]]),
    arrow([[1390, 750], [1445, 750], [1445, 850], [1500, 850]], { dash: true }),
    arrow([[1010, 1015], [1100, 1015]], { dash: true }),
    arrow([[1460, 1015], [1635, 1015], [1635, 910]], { dash: true }),
    `<rect x="30" y="960" width="44" height="26" rx="6" fill="#eff6ff" stroke="#1d4ed8" stroke-width="2.5"/>`,
    text(86, 981, "en place", { size: 18 }),
    `<rect x="30" y="1000" width="44" height="26" rx="6" fill="#f8fafc" stroke="#64748b" stroke-width="2.5" stroke-dasharray="10 6"/>`,
    text(86, 1021, "prévu", { size: 18 }),
  ];
  return svgWrap(1800, 1100, parts.join(""));
}

function roadmap() {
  const phases = [
    { x: 30, color: "#047857", name: "Phase 0 — Démonstration", sub: "Fait", items: ["ICV et carte des inégalités", "Conception assistée (auto + manuel)", "Arbitrage des investissements", "Assistant IA et avis", "Données synthétiques étiquetées"] },
    { x: 510, color: "#1d4ed8", name: "Phase 1 — Pilote", sub: "6 à 12 mois · commune pilote", items: ["Données réelles (Neon / PostGIS)", "Comptes, rôles, journal d'audit", "Barèmes de coûts réels", "App citoyenne de signalement", "Formation des agents", "Mesure des indicateurs"] },
    { x: 990, color: "#64748b", name: "Phase 2 — Extension", sub: "plusieurs communes · durée à définir", items: ["Prospective 2050", "Résilience et climat", "Transition des quartiers", "WhatsApp / USSD, langues locales", "Détection du bâti par satellite"] },
    { x: 1470, color: "#64748b", name: "Phase 3 — Échelle nationale", sub: "durée à définir", items: ["Mobilité multimodale interurbaine", "Jumeau numérique national", "Hébergement souverain", "Exploitation et support durables"] },
  ];
  const gates = [
    { cx: 435, name: "G0", crit: ["Accord de principe du ministère", "Commune pilote choisie", "Accès à des données réelles"] },
    { cx: 915, name: "G1", crit: ["Recette technique validée", "Indicateurs du pilote atteints", "Méthode ICV validée (comité)", "Convention de données signée"] },
    { cx: 1395, name: "G2", crit: ["Bilan de l'extension", "Financement du déploiement national"] },
  ];
  const parts = [];
  for (const p of phases) {
    parts.push(
      `<rect x="${p.x}" y="100" width="350" height="400" rx="14" fill="#ffffff" stroke="${p.color}" stroke-width="3"/>`,
      `<path d="M${p.x},114 a14,14 0 0 1 14,-14 h322 a14,14 0 0 1 14,14 v86 h-350 z" fill="${p.color}"/>`,
      text(p.x + 16, 142, p.name, { size: 22, weight: 700, fill: "#ffffff" }),
      text(p.x + 16, 176, p.sub, { size: 17, fill: "#ffffff" }),
      ...p.items.map((it, i) => text(p.x + 20, 240 + i * 44, "• " + it, { size: 18, fill: "#1e293b" })),
    );
  }
  for (const g of gates) {
    parts.push(
      arrow([[g.cx - 56, 300], [g.cx - 38, 300]]),
      arrow([[g.cx + 38, 300], [g.cx + 56, 300]]),
      `<polygon points="${g.cx},264 ${g.cx + 36},300 ${g.cx},336 ${g.cx - 36},300" fill="#fef3c7" stroke="#b45309" stroke-width="3"/>`,
      text(g.cx, 307, g.name, { size: 20, weight: 700, anchor: "middle", fill: "#78350f" }),
      text(g.cx, 545, "Critères de passage", { size: 16, weight: 700, anchor: "middle", fill: "#78350f" }),
      ...g.crit.map((c, i) => text(g.cx, 575 + i * 28, c, { size: 17, anchor: "middle", fill: "#334155" })),
    );
  }
  parts.push(text(30, 50, "Chaque passage de phase est conditionné à une décision (losange) : sans elle, on ne passe pas à la suite.", { size: 20, fill: "#475569" }));
  return svgWrap(1850, 700, parts.join(""));
}

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1.5 });
for (const [name, svg, w, h] of [["architecture", architecture(), 1800, 1100], ["feuille-de-route", roadmap(), 1850, 700]]) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<body style="margin:0">${svg}</body>`);
  await page.screenshot({ path: path.join(out, `${name}.png`), clip: { x: 0, y: 0, width: w, height: h } });
  console.log("figure", name, `${w}x${h}`);
}
await browser.close();
