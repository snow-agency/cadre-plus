"use client";

import { useState } from "react";
import HelpTip from "../components/HelpTip";
import { API_URL } from "../lib/config";

export default function Assistant() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = API_URL;

  async function ask() {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch(`${apiUrl}/api/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? `Erreur ${res.status}`);
      }
      const data = await res.json();
      setAnswer(data.answer);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="absolute bottom-2.5 left-2.5 z-10 w-80 rounded-lg bg-white p-3 text-sm shadow-lg">
      <div className="mb-1.5 font-semibold">
        Assistant de décision (IA)
        <HelpTip
          title="Assistant de décision"
          text="Posez une question en français sur les quartiers, les parcelles ou le plan d'investissement (ex. « Pourquoi Zinvié a-t-il un ICV faible ? »). L'assistant répond uniquement à partir des données de l'application, qui sont synthétiques. Il conseille : la décision vous appartient."
        />
      </div>
      <div className="flex gap-1.5">
        <input
          className="flex-1 rounded border border-gray-300 px-2 py-1"
          placeholder="Ex: quel quartier a le plus besoin d'investissement ?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
        />
        <button
          onClick={ask}
          disabled={loading}
          className="rounded bg-slate-800 px-3 py-1 text-white disabled:opacity-50"
        >
          {loading ? "…" : "Demander"}
        </button>
      </div>
      {error && <p className="mt-2 text-red-700">{error}</p>}
      {answer && <p className="mt-2 whitespace-pre-wrap">{answer}</p>}
    </div>
  );
}
