import { useEffect, useMemo, useState } from "react";

export type LearnerMode = "ja" | "id";

const STORAGE_KEY = "belajar_learner_mode";

function readStoredMode(): LearnerMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "ja" || raw === "id") return raw;
  } catch {
    // ignore
  }
  return "ja";
}

export function useLearner() {
  const [mode, setMode] = useState<LearnerMode>(() => readStoredMode());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
      window.dispatchEvent(new CustomEvent("belajar:learner-mode", { detail: mode }));
    } catch {
      // ignore
    }
  }, [mode]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      if (e.newValue === "ja" || e.newValue === "id") setMode(e.newValue);
    };
    const onCustom = (e: Event) => {
      const ce = e as CustomEvent;
      const next = ce.detail;
      if (next === "ja" || next === "id") setMode(next);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("belajar:learner-mode", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("belajar:learner-mode", onCustom as EventListener);
    };
  }, []);

  const label = useMemo(() => {
    return mode === "ja" ? "日本人（ID学習）" : "インドネシア人（JP学習）";
  }, [mode]);

  return {
    mode,
    setMode,
    label,
  };
}

