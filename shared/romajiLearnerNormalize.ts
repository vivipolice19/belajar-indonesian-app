/**
 * Learner-oriented romaji touch-ups: Hepburn / AI output often writes particles
 * は・を・へ as ha / wo / he. For Indonesian learners we prefer wa / o / e when
 * those appear as separate tokens (spaced romaji).
 */
function normalizeTokenCore(core: string, tokenIndex: number): string {
  const lower = core.toLowerCase();
  if (tokenIndex === 0) return lower;
  if (lower === "ha") return "wa";
  if (lower === "he") return "e";
  if (lower === "wo") return "o";
  return lower;
}

export function normalizeLearnerRomaji(romaji: string): string {
  const s = romaji.trim();
  if (!s) return romaji;
  const tokens = s.split(/\s+/);
  return tokens
    .map((token, i) => {
      const m = /^([a-zA-Z]+)([.,;:!?'"]*)$/.exec(token);
      if (!m) return token.toLowerCase();
      return normalizeTokenCore(m[1], i) + m[2];
    })
    .join(" ");
}
