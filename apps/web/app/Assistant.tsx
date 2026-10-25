"use client";

import { useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import HelpTip from "../components/HelpTip";
import { postJson } from "../lib/api";

const SUGGESTIONS = [
  "Quel quartier a le plus besoin d'investissement et pourquoi ?",
  "Pourquoi Zinvié a-t-il un ICV faible ?",
  "Que recommandes-tu pour la parcelle P3 ?",
];

export default function Assistant() {
  const [ouvert, setOuvert] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(texte = question) {
    if (!texte.trim() || loading) return;
    setQuestion(texte);
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const data = await postJson<{ answer: string }>("/api/assistant", { question: texte });
      setAnswer(data.answer);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="absolute bottom-3 left-3 z-20 flex flex-col items-start gap-3">
      {ouvert && (
        <section
          aria-label="Assistant de décision"
          className="glass w-[min(24rem,calc(100vw-1.5rem))] p-4 shadow-pop"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="label-caps flex items-center gap-1.5 text-ai-700">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> IA
              </p>
              <h2 className="text-base font-bold text-ink">
                Assistant de décision
                <HelpTip
                  title="Assistant de décision"
                  text="Posez une question en français sur les quartiers, les parcelles ou le plan d'investissement (ex. « Pourquoi Zinvié a-t-il un ICV faible ? »). L'assistant répond uniquement à partir des données de l'application, qui sont synthétiques. Il conseille : la décision vous appartient."
                />
              </h2>
            </div>
            <button
              onClick={() => setOuvert(false)}
              aria-label="Fermer l'assistant"
              className="rounded-full p-1.5 text-muted hover:bg-brand-50 hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <input
              className="field"
              placeholder="Ex : quel quartier a le plus besoin d'investissement ?"
              aria-label="Votre question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask()}
            />
            <button onClick={() => ask()} disabled={loading} className="btn btn-ai shrink-0" aria-label="Demander">
              {loading ? "…" : <Send className="h-4 w-4" aria-hidden="true" />}
              <span className="sr-only">Demander</span>
            </button>
          </div>

          {!answer && !loading && !error && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border border-line bg-white px-3 py-1 text-left text-xs text-body hover:border-ai-600 hover:bg-ai-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {loading && <p className="mt-3 text-sm text-muted">L&apos;assistant réfléchit… (la première réponse peut prendre quelques secondes)</p>}
          {error && (
            <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
          {answer && (
            <div className="mt-3 max-h-64 overflow-auto rounded-xl bg-ai-50 px-3.5 py-3 text-sm leading-relaxed text-ink">
              <p className="whitespace-pre-wrap">{answer}</p>
              <p className="mt-2 text-xs text-muted">Réponse générée par IA à partir de données synthétiques.</p>
            </div>
          )}
        </section>
      )}

      <button
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        className="btn btn-ai h-12 rounded-full px-5 shadow-pop"
      >
        <Sparkles className="h-5 w-5" aria-hidden="true" />
        Assistant IA
      </button>
    </div>
  );
}
