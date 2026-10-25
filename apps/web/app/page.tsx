import Bento from "../components/landing/Bento";
import CtaFinal from "../components/landing/CtaFinal";
import Hero from "../components/landing/Hero";
import LiveStats from "../components/landing/LiveStats";
import Preview from "../components/landing/Preview";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";

export default function Accueil() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Preview />
        <section aria-label="Chiffres de la démonstration" className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
          <LiveStats />
        </section>
        <Bento />
        <CtaFinal />
      </main>
      <SiteFooter />
    </>
  );
}
