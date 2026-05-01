import type { Request, Response, NextFunction } from "express";

type Bucket = { count: number; windowStart: number };

const buckets = new Map<string, Bucket>();

function clientIp(req: Request): string {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length > 0) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const r = req.socket?.remoteAddress;
  return typeof r === "string" && r.length > 0 ? r.slice(0, 64) : "unknown";
}

/**
 * Sliding window lite: per IP, max N AI calls within windowMs.
 * Env: AI_RATE_LIMIT_MAX (default 52), AI_RATE_LIMIT_WINDOW_MS (default 10 min).
 */
export function aiRateLimitMiddleware() {
  const max =
    Number.isFinite(Number(process.env.AI_RATE_LIMIT_MAX)) && Number(process.env.AI_RATE_LIMIT_MAX) > 0
      ? Number(process.env.AI_RATE_LIMIT_MAX)
      : 52;
  const windowMs =
    Number.isFinite(Number(process.env.AI_RATE_LIMIT_WINDOW_MS)) &&
    Number(process.env.AI_RATE_LIMIT_WINDOW_MS) > 0
      ? Number(process.env.AI_RATE_LIMIT_WINDOW_MS)
      : 10 * 60 * 1000;

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = clientIp(req);
    const key = ip;
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || now - b.windowStart >= windowMs) {
      b = { count: 0, windowStart: now };
      buckets.set(key, b);
    }
    b.count += 1;

    if (buckets.size > 12000) {
      const old = now - windowMs * 3;
      for (const [k, v] of buckets) {
        if (v.windowStart < old) buckets.delete(k);
      }
    }

    if (b.count > max) {
      const retrySec = Math.max(1, Math.ceil((windowMs - (now - b.windowStart)) / 1000));
      res.setHeader("Retry-After", String(retrySec));
      res.status(429).json({
        messageJa: `リクエストが多すぎます。しばらく（約${retrySec}秒〜）お待ちください。`,
        messageId: `Terlalu banyak permintaan. Tunggu sekitar ${retrySec} dtk lalu coba lagi.`,
      });
      return;
    }
    next();
  };
}
