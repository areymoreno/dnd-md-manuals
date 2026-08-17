import { newId } from "./storage";

/**
 * Fragmentos propios. Se guardan en `localStorage` junto a los documentos:
 * son texto y ocupan poco, y así viajan en la copia de seguridad como todo lo
 * demás.
 */

export interface UserSnippet {
  id: string;
  label: string;
  text: string;
  createdAt: number;
}

const KEY = "dnd-markdown.snippets.v1";

const isBrowser = () => typeof window !== "undefined";

export function loadUserSnippets(): UserSnippet[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is UserSnippet =>
        typeof item?.id === "string" &&
        typeof item?.label === "string" &&
        typeof item?.text === "string",
    );
  } catch {
    return [];
  }
}

export function saveUserSnippets(snippets: UserSnippet[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(snippets));
  } catch {
    // Mismo caso que los documentos: si no cabe, quien llama ya avisa.
  }
}

export function createUserSnippet(label: string, text: string): UserSnippet {
  return { id: newId(), label: label.trim(), text, createdAt: Date.now() };
}
