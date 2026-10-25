import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

export const metadata = {
  title: { default: "Cadre+ — le jumeau numérique du cadre de vie", template: "%s — Cadre+" },
  description:
    "Cadre+ aide l'État à diagnostiquer, aménager et arbitrer ses investissements en cadre de vie avant de construire. Démonstration sur données synthétiques.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
