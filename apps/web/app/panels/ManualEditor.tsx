"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { AlertTriangle, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CheckCircle2, Sparkles, XCircle } from "lucide-react";
import HelpTip from "../../components/HelpTip";
import { isAbort, postJson } from "../../lib/api";
import { fcfa, signed } from "../../lib/format";
import type { BatimentParam, Evaluation, LonLat, Resume } from "../../lib/types";

const M_PER_DEG_LAT = 110_574;
const mPerDegLon = (lat: number) => 111_320 * Math.cos((lat * Math.PI) / 180);

function createMarker(map: maplibregl.Map, lngLat: LonLat, label: string, title: string, type: string, classes: string) {
  const el = document.createElement("div");
  el.className = `flex cursor-grab items-center justify-center border-2 border-white text-xs font-bold text-white shadow-pop ${classes}`;
  el.textContent = label;
  el.title = title;
  el.dataset.editorMarker = type;
  return new maplibregl.Marker({ element: el, draggable: true }).setLngLat(lngLat).addTo(map);
}

export default function ManualEditor({
  resume,
  map,
  onExit,
}: {
  resume: Resume;
  map: maplibregl.Map | null;
  onExit: () => void;
}) {
  const [bat, setBat] = useState<BatimentParam>(
    resume.batiment_param ?? { centre: resume.centre, dim_est_ouest_m: 12, dim_nord_sud_m: 10, angle_deg: 0 },
  );
  const [point, setPoint] = useState<LonLat | null>(resume.point_collecte_param ?? null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avis, setAvis] = useState<string | null>(null);
  const [avisLoading, setAvisLoading] = useState(false);
  const batMarker = useRef<maplibregl.Marker | null>(null);
  const pointMarker = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    map?.flyTo({ center: resume.centre, zoom: 18, duration: 1200 });
  }, [map, resume.centre]);

  useEffect(() => {
    if (!map) return;
    const marker = createMarker(map, bat.centre, "B", "Glisser pour déplacer le bâtiment", "batiment", "h-8 w-8 rounded-lg bg-emerald-600");
    marker.on("drag", () => {
      const { lng, lat } = marker.getLngLat();
      setBat((b) => ({ ...b, centre: [lng, lat] }));
    });
    batMarker.current = marker;
    return () => {
      marker.remove();
      batMarker.current = null;
    };
    // le marqueur n'est créé qu'une fois ; sa position suit ensuite l'état via l'effet ci-dessous
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    if (!map || !point) return;
    const marker = createMarker(map, point, "D", "Glisser pour déplacer le point de collecte des déchets", "collecte", "h-7 w-7 rounded-full bg-amber-500");
    marker.on("drag", () => {
      const { lng, lat } = marker.getLngLat();
      setPoint([lng, lat]);
    });
    pointMarker.current = marker;
    return () => {
      marker.remove();
      pointMarker.current = null;
    };
    // créé à l'ajout du point seulement (point passe de null à une valeur)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, point === null]);

  useEffect(() => {
    batMarker.current?.setLngLat(bat.centre);
  }, [bat.centre]);

  useEffect(() => {
    if (point) pointMarker.current?.setLngLat(point);
  }, [point]);

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      postJson<Evaluation>(
        "/api/conception-assistee/evaluer",
        { parcelle_id: resume.parcelle_id, batiment: bat, point_collecte: point },
        ctrl.signal,
      )
        .then((ev) => {
          setEvaluation(ev);
          setError(null);
          map?.getSource<maplibregl.GeoJSONSource>("manuel")?.setData(ev.features);
        })
        .catch((e) => !isAbort(e) && setError(e.message));
    }, 150);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [bat, point, resume.parcelle_id, map]);

  useEffect(
    () => () => {
      map?.getSource<maplibregl.GeoJSONSource>("manuel")?.setData({ type: "FeatureCollection", features: [] });
    },
    [map],
  );

  const nudge = (dxM: number, dyM: number) =>
    setBat((b) => ({
      ...b,
      centre: [b.centre[0] + dxM / mPerDegLon(b.centre[1]), b.centre[1] + dyM / M_PER_DEG_LAT],
    }));

  const setDim = (key: "dim_est_ouest_m" | "dim_nord_sud_m", raw: string) => {
    const v = Number(raw);
    if (Number.isFinite(v) && v > 1 && v <= 200) setBat((b) => ({ ...b, [key]: v }));
  };

  const demanderAvis = async () => {
    if (!evaluation) return;
    setAvisLoading(true);
    setAvis(null);
    try {
      const { answer } = await postJson<{ answer: string }>("/api/assistant/avis", {
        type: "amenagement",
        payload: {
          parcelle: resume.nom,
          indice_constructibilite: resume.indice_constructibilite,
          batiment: bat,
          point_collecte: point,
          valide: evaluation.valide,
          violations: evaluation.violations,
          metriques: evaluation.metriques,
          comparaison_optimum: evaluation.comparaison_optimum,
        },
      });
      setAvis(answer);
    } catch (e) {
      setAvis(`Avis indisponible : ${e instanceof Error ? e.message : "erreur inconnue"}`);
    } finally {
      setAvisLoading(false);
    }
  };

  const erreurs = evaluation?.violations.filter((v) => v.severite === "erreur").length ?? 0;
  const cmp = evaluation?.comparaison_optimum;
  const fleches = [
    { Icone: ArrowLeft, label: "←", dx: -1, dy: 0 },
    { Icone: ArrowUp, label: "↑", dx: 0, dy: 1 },
    { Icone: ArrowDown, label: "↓", dx: 0, dy: -1 },
    { Icone: ArrowRight, label: "→", dx: 1, dy: 0 },
  ];

  return (
    <div className="mt-3 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-sm text-emerald-900">
          Mode manuel
          <HelpTip
            align="right"
            title="Mode manuel"
            text="Vous décidez : glissez le marqueur B (bâtiment) et D (point de collecte) sur la carte, ou utilisez les champs et flèches. Chaque changement est vérifié par le serveur avec les mêmes règles que l'optimiseur automatique."
          />
        </strong>
        <button onClick={onExit} className="btn btn-dark btn-sm">
          Revenir à l&apos;optimum auto
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block font-medium text-ink">
          Dimension est-ouest (m)
          <input type="number" min={2} max={200} step={0.5} value={bat.dim_est_ouest_m}
            onChange={(e) => setDim("dim_est_ouest_m", e.target.value)} className="field mt-1" />
        </label>
        <label className="block font-medium text-ink">
          Dimension nord-sud (m)
          <input type="number" min={2} max={200} step={0.5} value={bat.dim_nord_sud_m}
            onChange={(e) => setDim("dim_nord_sud_m", e.target.value)} className="field mt-1" />
        </label>
      </div>

      <label className="block font-medium text-ink">
        Rotation : {bat.angle_deg}°
        <HelpTip title="Rotation" text="Fait pivoter le bâtiment autour de son centre. Un bâtiment pivoté dépasse plus facilement les retraits : le serveur le signale." />
        <input type="range" min={-90} max={90} step={5} value={bat.angle_deg}
          onChange={(e) => setBat((b) => ({ ...b, angle_deg: Number(e.target.value) }))}
          className="mt-1 w-full accent-brand-600" />
      </label>

      <div className="flex items-center gap-1.5">
        <span className="font-medium text-ink">Déplacer de 1 m :</span>
        {fleches.map(({ Icone, label, dx, dy }) => (
          <button key={label} onClick={() => nudge(dx, dy)} aria-label={`Déplacer le bâtiment de 1 m (${label})`}
            className="btn btn-ghost h-8 w-8 !p-0">
            <Icone className="h-4 w-4" aria-hidden="true" />
          </button>
        ))}
        <HelpTip align="right" title="Déplacement fin" text="Alternative au glisser-déposer, pour ajuster au mètre près (←: ouest, →: est, ↑: nord, ↓: sud)." />
      </div>

      <div className="flex items-center gap-2">
        {point ? (
          <button onClick={() => setPoint(null)} className="btn btn-ghost btn-sm">Retirer le point de collecte</button>
        ) : (
          <button onClick={() => setPoint([bat.centre[0], bat.centre[1] + 12 / M_PER_DEG_LAT])} className="btn btn-ghost btn-sm">
            Ajouter un point de collecte (D)
          </button>
        )}
        <HelpTip align="right" title="Point de collecte" text="Emplacement où les déchets sont déposés avant ramassage. Il doit être à plus de 3 m du bâtiment, hors bande tampon naturelle, et idéalement à moins de 10 m de la voie." />
      </div>

      {error && <p role="alert" className="text-red-700">{error}</p>}

      {evaluation && (
        <div className="space-y-2">
          <div
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
              evaluation.valide ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-900"
            }`}
          >
            {evaluation.valide ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <XCircle className="h-4 w-4" aria-hidden="true" />}
            <span>{evaluation.valide ? "Conforme aux contraintes" : `Non conforme (${erreurs} erreur${erreurs > 1 ? "s" : ""})`}</span>
            <HelpTip align="right" title="Conformité" text="« Conforme » signifie qu'aucune règle impérative n'est violée (limites de parcelle, retraits, tampon naturel, bâti existant, plafond d'emprise). Les avertissements sont des recommandations que vous pouvez choisir de passer outre." />
          </div>
          {evaluation.violations.length > 0 && (
            <ul className="space-y-1">
              {evaluation.violations.map((v) => (
                <li key={v.code} className={`flex gap-1.5 ${v.severite === "erreur" ? "text-red-700" : "text-amber-700"}`}>
                  {v.severite === "erreur"
                    ? <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-label="Erreur" />
                    : <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-label="Avertissement" />}
                  <span>{v.message}</span>
                </li>
              ))}
            </ul>
          )}
          {evaluation.metriques.emprise_m2 !== undefined && (
            <ul className="grid grid-cols-2 gap-2 text-ink">
              <li className="rounded-xl bg-white px-3 py-2">Emprise <strong className="block text-sm">{evaluation.metriques.emprise_m2} m² ({evaluation.metriques.ces_pct} %)</strong></li>
              <li className="rounded-xl bg-white px-3 py-2">Distance à la voie <strong className="block text-sm">{evaluation.metriques.distance_voie_m} m</strong></li>
              <li className="rounded-xl bg-white px-3 py-2">Fondations <strong className="block text-xs">{evaluation.metriques.fondation}</strong></li>
              <li className="rounded-xl bg-white px-3 py-2">Coût estimé <strong className="block text-sm">{fcfa(evaluation.metriques.cout_total_estime_fcfa ?? 0)}</strong></li>
            </ul>
          )}
          {cmp && (
            <p className="rounded-xl bg-white px-3 py-2 leading-relaxed">
              Par rapport à l&apos;optimum automatique : coût {signed(Math.round(cmp.ecart_cout_fcfa / 1000), " kFCFA")},
              distance à la voie {signed(cmp.ecart_distance_voie_m, " m")}, emprise {evaluation.metriques.emprise_m2} m²
              contre {cmp.emprise_optimale_m2} m².
              <HelpTip align="right" title="Comparaison" text="L'optimum automatique maximise l'emprise autorisée en la plaçant au plus près de la voie. Un coût plus faible n'est pas forcément meilleur : il peut venir d'une emprise plus petite." />
            </p>
          )}
        </div>
      )}

      <div>
        <button onClick={demanderAvis} disabled={!evaluation || avisLoading} className="btn btn-ai btn-sm">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {avisLoading ? "Analyse en cours…" : "Demander l'avis de l'IA"}
        </button>
        <HelpTip align="right" title="Avis de l'IA" text="Un assistant IA relit votre aménagement (contraintes, coûts, comparaison avec l'optimum) et propose des corrections. Il conseille, mais la décision reste la vôtre. Données synthétiques : démonstration uniquement." />
        {avis && <p className="mt-2 whitespace-pre-wrap rounded-xl bg-ai-50 px-3 py-2.5 text-ink">{avis}</p>}
      </div>
    </div>
  );
}
