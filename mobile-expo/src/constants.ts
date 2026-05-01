export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ||
  "https://belajar-indonesian-app.onrender.com";

/** Same keys as web `client` (useGameProgress / useLearner) */
export const PROGRESS_STORAGE_KEY = "belajar_progress";
export const LEARNER_MODE_STORAGE_KEY = "belajar_learner_mode";

/** Legacy Expo-only keys — migrated once into web keys */
export const LEGACY_PROGRESS_STORAGE_KEY = "belajar_expo_progress_v1";
export const LEGACY_LEARNER_MODE_STORAGE_KEY = "belajar_expo_learner_mode_v1";
