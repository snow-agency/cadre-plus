import { API_URL } from "./config";

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body?.detail;
    throw new Error(typeof detail === "string" ? detail : `Requête refusée (${res.status})`);
  }
  return res.json();
}

export function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  return fetch(`${API_URL}${path}`, { signal }).then((r) => parse<T>(r));
}

export function postJson<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  return fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  }).then((r) => parse<T>(r));
}

export const isAbort = (e: unknown) => e instanceof DOMException && e.name === "AbortError";
