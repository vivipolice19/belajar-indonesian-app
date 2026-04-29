const DEFAULT_API_BASE = "https://belajar-indonesian-app.onrender.com";

function sanitizeApiBase(input?: string): string {
  const raw = input?.trim();
  if (!raw) return DEFAULT_API_BASE;

  // Metro/Web dev server accidentally set as API target -> returns HTML (e.g. /@vite/client).
  if (
    raw.includes("localhost:8081") ||
    raw.includes("127.0.0.1:8081") ||
    raw.includes("localhost:5173") ||
    raw.includes("127.0.0.1:5173")
  ) {
    return DEFAULT_API_BASE;
  }
  return raw;
}

export const API_BASE = sanitizeApiBase(process.env.EXPO_PUBLIC_API_BASE_URL);

/** Same keys as web `client` (useGameProgress / useLearner) */
export const PROGRESS_STORAGE_KEY = "belajar_progress";
export const LEARNER_MODE_STORAGE_KEY = "belajar_learner_mode";

/** Legacy Expo-only keys — migrated once into web keys */
export const LEGACY_PROGRESS_STORAGE_KEY = "belajar_expo_progress_v1";
export const LEGACY_LEARNER_MODE_STORAGE_KEY = "belajar_expo_learner_mode_v1";
