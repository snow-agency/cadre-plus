import type { StyleSpecification } from "maplibre-gl";

// Fond principal : CARTO Positron (style vectoriel clair, qui laisse ressortir les données).
// Gratuit pour un usage léger/non commercial, attribution obligatoire (© OpenStreetMap, © CARTO).
// Pour la production à grande échelle : fournisseur de tuiles dédié via NEXT_PUBLIC_MAP_STYLE_URL.
const POSITRON = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

// Repli intégré (aucune dépendance à un fichier de style distant) si le style principal ne se charge pas.
export const STYLE_REPLI: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© contributeurs OpenStreetMap",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

export const MAP_STYLE: string | StyleSpecification = process.env.NEXT_PUBLIC_MAP_STYLE_URL || POSITRON;
