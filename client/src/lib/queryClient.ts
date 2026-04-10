import { QueryClient, QueryFunction } from "@tanstack/react-query";

export type ApiErrorI18n = { ja: string; id: string };

export function apiErrorMessage(
  err: unknown,
  mode: "ja" | "id",
): string {
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

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: { retries?: number; retryDelayMs?: number },
): Promise<Response> {
  const retries = options?.retries ?? 0;
  const retryDelayMs = options?.retryDelayMs ?? 700;
  const shouldRetryStatus = (status: number) =>
    status === 408 || status === 425 || status === 429 || (status >= 500 && status <= 599);

  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method,
        headers: data ? { "Content-Type": "application/json" } : {},
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
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

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
