export default function Preview() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-pop">
        <div className="flex items-center gap-2 border-b border-line bg-slate-50 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 flex-1 rounded-full bg-white px-3 py-1 text-center font-mono text-[11px] text-muted ring-1 ring-line">
            cadre-plus / application
          </span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img/apercu-application.jpg"
          width={1440}
          height={844}
          alt="Aperçu de l'application Cadre+ : carte des huit quartiers d'Abomey-Calavi colorés selon leur indice de cadre de vie, avec les panneaux de conception assistée et d'investissements."
          className="block h-auto w-full"
        />
      </div>
    </div>
  );
}
