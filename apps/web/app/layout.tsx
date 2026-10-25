import "./globals.css";

export const metadata = {
  title: "Cadre+ — Démo",
  description: "Tableau de bord de démonstration (données synthétiques)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
