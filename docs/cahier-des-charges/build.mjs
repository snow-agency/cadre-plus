// Génère docs/Cahier-des-charges-Cadre-plus.docx à partir de contenu.mjs.
// Usage : npm install (une fois), npm run figures, npm run build — dans ce dossier.
import {
  AlignmentType, BorderStyle, Document, Footer, Header, ImageRun, LevelFormat, Packer, PageNumber,
  Paragraph, ShadingType, Table, TableCell, TableLayoutType, TableOfContents, TableRow, TabStopType,
  TextRun, VerticalAlign, WidthType,
} from "docx";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { blocs, meta } from "./contenu.mjs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(dir, "..", "Cahier-des-charges-Cadre-plus.docx");

const COLOR = { titre: "1F3A5F", texte: "1E293B", gris: "64748B", bordure: "CBD5E1", zebre: "F5F8FC", entete: "1F3A5F" };
const PAGE_W = 11906, PAGE_H = 16838, MARGE = 1134;
const LARGEUR = PAGE_W - 2 * MARGE; // 9638 DXA

const runs = (texte, base = {}) =>
  texte.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((part) =>
    part.startsWith("**")
      ? new TextRun({ ...base, text: part.slice(2, -2), bold: true })
      : new TextRun({ ...base, text: part }));

const para = (texte, opts = {}) => new Paragraph({
  spacing: { after: 120, line: 288 },
  ...opts.paragraph,
  children: runs(texte, opts.run),
});

const titre = (niveau, texte) => new Paragraph({
  heading: niveau,
  children: [new TextRun({ text: texte })],
});

const BORD = { style: BorderStyle.SINGLE, size: 4, color: COLOR.bordure };
const BORDS = { top: BORD, bottom: BORD, left: BORD, right: BORD };

const ETATS = {
  "Fait": { fill: "DCFCE7", color: "166534" }, "À faire": { fill: "F1F5F9", color: "475569" },
  "Partiel": { fill: "FEF3C7", color: "92400E" }, "Élevée": { fill: "FEE2E2", color: "991B1B" },
  "Moyenne": { fill: "FEF3C7", color: "92400E" }, "Faible": { fill: "DCFCE7", color: "166534" },
  "En place": { fill: "DCFCE7", color: "166534" },
};

function tableau({ head, widths, rows }) {
  const total = widths.reduce((a, b) => a + b, 0);
  const cols = widths.map((w) => Math.round((LARGEUR * w) / total));
  cols[cols.length - 1] += LARGEUR - cols.reduce((a, b) => a + b, 0);
  const marges = { top: 70, bottom: 70, left: 100, right: 100 };
  const entete = new TableRow({
    tableHeader: true, cantSplit: true,
    children: head.map((h, i) => new TableCell({
      width: { size: cols[i], type: WidthType.DXA }, borders: BORDS, margins: marges,
      shading: { type: ShadingType.CLEAR, fill: COLOR.entete, color: "auto" }, verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 19 })] })],
    })),
  });
  const lignes = rows.map((r, ri) => new TableRow({
    cantSplit: true,
    children: r.map((cell, i) => {
      const etat = ["État", "Gravité", "Statut"].includes(head[i]) ? ETATS[cell] : undefined;
      const fill = etat?.fill ?? (ri % 2 ? COLOR.zebre : "FFFFFF");
      return new TableCell({
        width: { size: cols[i], type: WidthType.DXA }, borders: BORDS, margins: marges,
        shading: { type: ShadingType.CLEAR, fill, color: "auto" },
        children: [new Paragraph({
          spacing: { line: 252 },
          children: runs(cell, etat ? { size: 19, bold: true, color: etat.color } : { size: 19, color: COLOR.texte }),
        })],
      });
    }),
  }));
  return [
    new Table({ width: { size: LARGEUR, type: WidthType.DXA }, columnWidths: cols, layout: TableLayoutType.FIXED, rows: [entete, ...lignes] }),
    new Paragraph({ spacing: { after: 160 }, children: [] }),
  ];
}

function dimensionsPng(buf) {
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function figure({ file, caption, widthPx }) {
  const data = readFileSync(path.join(dir, "img", file));
  const { w, h } = dimensionsPng(data);
  const height = Math.round((widthPx * h) / w);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 120, after: 60 },
      children: [new ImageRun({ type: "png", data, transformation: { width: widthPx, height }, altText: { title: caption, description: caption, name: file } })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 200 },
      children: [new TextRun({ text: caption, italics: true, size: 18, color: COLOR.gris })],
    }),
  ];
}

const formule = (lines) => lines.map((l, i) => new Paragraph({
  spacing: { before: i === 0 ? 60 : 0, after: i === lines.length - 1 ? 160 : 0, line: 264 },
  indent: { left: 284 },
  shading: { type: ShadingType.CLEAR, fill: "EEF2F7", color: "auto" },
  border: { left: { style: BorderStyle.SINGLE, size: 18, color: COLOR.titre, space: 8 } },
  children: [new TextRun({ text: l, font: "Consolas", size: 20 })],
}));

const note = ({ text, tone }) => new Paragraph({
  spacing: { before: 60, after: 160, line: 276 },
  indent: { left: 200, right: 200 },
  shading: { type: ShadingType.CLEAR, fill: tone === "warn" ? "FEF3C7" : "E0F2FE", color: "auto" },
  border: { left: { style: BorderStyle.SINGLE, size: 24, color: tone === "warn" ? "B45309" : "0369A1", space: 8 } },
  children: runs(text, { size: 21 }),
});

// listes numérotées : une référence par liste pour que la numérotation redémarre
const listesOrdonnees = blocs.filter((b) => b.t === "ol").map((_, i) => `ol-${i}`);
let compteurOl = 0;

function rendre(b) {
  switch (b.t) {
    case "h1": return [titre("Heading1", b.text)];
    case "h2": return [titre("Heading2", b.text)];
    case "h3": return [titre("Heading3", b.text)];
    case "p": return [para(b.text)];
    case "ul": return b.items.map((it) => new Paragraph({ numbering: { reference: "puces", level: 0 }, spacing: { after: 80, line: 276 }, children: runs(it) }));
    case "ol": {
      const ref = listesOrdonnees[compteurOl++];
      return b.items.map((it) => new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 80, line: 276 }, children: runs(it) }));
    }
    case "table": return tableau(b);
    case "fig": return figure(b);
    case "formula": return formule(b.lines);
    case "note": return [note(b)];
    default: throw new Error(`bloc inconnu : ${b.t}`);
  }
}

const couverture = [
  new Paragraph({ spacing: { before: 2600 }, children: [] }),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: meta.titre.toUpperCase(), size: 30, bold: true, color: COLOR.gris, characterSpacing: 60 })] }),
  new Paragraph({
    spacing: { after: 240 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: COLOR.titre, space: 12 } },
    children: [new TextRun({ text: meta.nom, size: 96, bold: true, color: COLOR.titre })],
  }),
  new Paragraph({ spacing: { after: 1400 }, children: [new TextRun({ text: meta.sousTitre, size: 34, color: COLOR.texte })] }),
  ...[["Version", meta.version], ["Date", meta.date], ["Auteur", meta.auteur], ["Statut", meta.statut]].map(([k, v]) =>
    new Paragraph({
      spacing: { after: 100, line: 276 }, indent: { left: 1700, hanging: 1700 },
      tabStops: [{ type: TabStopType.LEFT, position: 1700 }],
      children: [new TextRun({ text: k, bold: true, color: COLOR.gris }), new TextRun({ text: `\t${v}` })],
    })),
];

const sommaire = [
  new Paragraph({ heading: "Heading1", pageBreakBefore: true, children: [new TextRun({ text: "Sommaire" })] }),
  new TableOfContents("Sommaire", { hyperlink: true, headingStyleRange: "1-2" }),
];

const corps = blocs.flatMap(rendre);

const enTete = new Header({
  children: [new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: LARGEUR }],
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR.bordure, space: 4 } },
    children: [
      new TextRun({ text: "Cadre+ — Cahier des charges", size: 18, color: COLOR.gris }),
      new TextRun({ text: `\t${meta.version.split(" — ")[0]} · ${meta.date}`, size: 18, color: COLOR.gris }),
    ],
  })],
});

const piedDePage = new Footer({
  children: [new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: LARGEUR }],
    children: [
      new TextRun({ text: "Données synthétiques de démonstration — document de travail", size: 18, color: COLOR.gris }),
      new TextRun({ children: ["\tPage ", PageNumber.CURRENT, " sur ", PageNumber.TOTAL_PAGES], size: 18, color: COLOR.gris }),
    ],
  })],
});

const page = { size: { width: PAGE_W, height: PAGE_H }, margin: { top: 1304, bottom: 1304, left: MARGE, right: MARGE } };

const doc = new Document({
  creator: meta.auteur,
  title: `${meta.titre} — ${meta.nom}`,
  description: meta.sousTitre,
  styles: {
    default: { document: { run: { font: "Calibri", size: 22, color: COLOR.texte }, paragraph: { spacing: { line: 288 } } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 34, bold: true, color: COLOR.titre },
        paragraph: { spacing: { before: 420, after: 160 }, keepNext: true, outlineLevel: 0,
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR.titre, space: 4 } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, color: COLOR.titre },
        paragraph: { spacing: { before: 280, after: 120 }, keepNext: true, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 23, bold: true, color: COLOR.texte },
        paragraph: { spacing: { before: 200, after: 80 }, keepNext: true, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "puces", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 567, hanging: 283 } } } }] },
      ...listesOrdonnees.map((reference) => ({
        reference,
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 567, hanging: 340 } } } }],
      })),
    ],
  },
  sections: [
    { properties: { page, titlePage: true }, children: couverture },
    { properties: { page }, headers: { default: enTete }, footers: { default: piedDePage }, children: [...sommaire, ...corps] },
  ],
});

writeFileSync(OUT, await Packer.toBuffer(doc));
console.log("écrit :", OUT);
