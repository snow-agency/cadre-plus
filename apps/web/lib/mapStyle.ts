import type { StyleSpecification } from "maplibre-gl";

// Fond OpenStreetMap (raster) défini en ligne : aucune dépendance à un fichier de style distant.
// Pour la production, utiliser un fournisseur de tuiles dédié (la politique d'OSM réserve ses
// serveurs à un usage léger) via NEXT_PUBLIC_MAP_STYLE_URL, qui prend l'URL d'un style MapLibre.
const osm: StyleSpecification = {
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

export const MAP_STYLE: string | StyleSpecification = process.env.NEXT_PUBLIC_MAP_STYLE_URL || osm;
