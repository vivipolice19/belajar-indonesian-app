import { API_BASE } from "../constants";

export type ApiErrorI18n = { ja: string; id: string };

export function apiErrorMessage(err: unknown, mode: "ja" | "id"): string {
  const i18n = (err as Error & { i18n?: ApiErrorI18n })?.i18n;
  if (i18n) return mode === "ja" ? i18n.ja : i18n.id;
  if (err instanceof Error) return err.message;
  return String(err);
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    try {
      const j = JSON.parse(text) as {
        messageJa?: string;
        messageId?: string;
        error?: string;
      };
      if (typeof j.messageJa === "string" || typeof j.messageId === "string") {
        const ja = j.messageJa ?? j.messageId ?? text;
        const id = j.messageId ?? j.messageJa ?? text;
        const err = new Error(id);
        (err as Error & { i18n?: ApiErrorI18n }).i18n = { ja, id };
        throw err;
      }
      if (typeof j.error === "string") {
        const err = new Error(j.error);
        (err as Error & { i18n?: ApiErrorI18n }).i18n = { ja: j.error, id: j.error };
        throw err;
      }
    } catch (e) {
      if (e instanceof Error && (e as Error & { i18n?: ApiErrorI18n }).i18n) throw e;
    }
    throw new Error(`${res.status}: ${text}`);
  }
}

function resolveUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = API_BASE.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export async function apiRequest(
  method: string,
  path: string,
  data?: unknown,
  options?: { retries?: number; retryDelayMs?: number },
): Promise<Response> {
  const retries = options?.retries ?? 0;
  const retryDelayMs = options?.retryDelayMs ?? 700;
  const shouldRetryStatus = (status: number) =>
    status === 408 || status === 425 || status === 429 || (status >= 500 && status <= 599);

  let lastErr: unknown;
  const url = resolveUrl(path);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method,
        headers: data ? { "Content-Type": "application/json" } : {},
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!res.ok && shouldRetryStatus(res.status) && attempt < retries) {
        await new Promise((r) => setTimeout(r, retryDelayMs * (attempt + 1)));
        continue;
      }

      await throwIfResNotOk(res);
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt >= retries) break;
      await new Promise((r) => setTimeout(r, retryDelayMs * (attempt + 1)));
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error("request failed");
}
