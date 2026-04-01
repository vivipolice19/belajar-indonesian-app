export type LocalReading = { hiragana: string; romaji: string };

let initPromise: Promise<{
  toHiragana: (text: string) => Promise<string>;
  toRomaji: (text: string) => Promise<string>;
}> | null = null;

async function init() {
  const [{ default: Kuroshiro }, { default: KuromojiAnalyzer }] = await Promise.all([
    import("kuroshiro"),
    import("kuroshiro-analyzer-kuromoji"),
  ]);

  const kuroshiro = new Kuroshiro();
  // This loads kuromoji dictionary in the browser (first time only).
  await kuroshiro.init(
    new KuromojiAnalyzer({
      // Use the CDN-free built-in path; analyzer will fetch dict from its package assets.
      // If hosting blocks these assets, API fallback will still work.
    }) as any,
  );

  const toHiragana = async (text: string) =>
    String(await kuroshiro.convert(text, { to: "hiragana" }));
  const toRomaji = async (text: string) =>
    String(await kuroshiro.convert(text, { to: "romaji" }));

  return { toHiragana, toRomaji };
}

export async function getLocalJapaneseReading(text: string): Promise<LocalReading> {
  if (!initPromise) initPromise = init();
  const api = await initPromise;
  const [hiragana, romaji] = await Promise.all([api.toHiragana(text), api.toRomaji(text)]);
  return { hiragana, romaji };
}

