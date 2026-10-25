import SiteHeader from "../../components/SiteHeader";
import CadreMap from "../CadreMap";

export const metadata = { title: "Application" };

export default function ApplicationPage() {
  return (
    <div className="flex h-screen flex-col">
      <SiteHeader compact />
      <main className="relative min-h-0 flex-1">
        <CadreMap />
      </main>
    </div>
  );
}
