// Ordered Gemini key rotation. State: ready | cooling(until) | exhausted(until midnight PT) | disabled.
// Shared store: Upstash/Vercel KV REST if KV_REST_API_URL+TOKEN (or UPSTASH_REDIS_REST_*) set; else per-instance memory.
type St = { s: "cooling" | "exhausted" | "disabled"; until: number };
const KEYS = (process.env.GEMINI_KEYS || "").split(",").map(s => s.trim()).filter(Boolean);
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const mem = new Map<number, St>();
async function kv(cmd: (string | number)[]) {
  const r = await fetch(KV_URL!, { method: "POST", headers: { Authorization: `Bearer ${KV_TOK}` }, body: JSON.stringify(cmd), cache: "no-store" });
  return (await r.json()).result;
}
async function getState(i: number): Promise<St | null> {
  if (KV_URL && KV_TOK) { try { const v = await kv(["GET", `gk:${i}`]); return v ? JSON.parse(v) : null; } catch { /* fall through */ } }
  return mem.get(i) || null;
}
async function setState(i: number, st: St) {
  mem.set(i, st);
  if (KV_URL && KV_TOK) { const ttl = Math.max(1, Math.ceil((st.until - Date.now()) / 1000)); try { await kv(["SET", `gk:${i}`, JSON.stringify(st), "EX", ttl]); } catch {} }
}
export function nextMidnightPT(now = Date.now()) {
  const pt = new Date(new Date(now).toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const offset = new Date(now).getTime() - pt.getTime();
  const m = new Date(pt); m.setHours(24, 0, 0, 0);
  return m.getTime() + offset;
}
export class NoKeyError extends Error { code = "all_keys_busy"; }
/** Calls fn with keys in order (primary first), skipping non-ready keys; up to 3 attempts. */
export async function withKey<T>(fn: (key: string) => Promise<Response>, parse: (r: Response) => Promise<T>): Promise<T> {
  let attempts = 0;
  for (let i = 0; i < KEYS.length && attempts < 3; i++) {
    const st = await getState(i);
    if (st && (st.s === "disabled" || st.until > Date.now())) continue;
    attempts++;
    const r = await fn(KEYS[i]);
    if (r.ok) return parse(r);
    const body = await r.text();
    if (r.status === 429) {
      const daily = /per ?day|PerDay|daily/i.test(body);
      await setState(i, daily ? { s: "exhausted", until: nextMidnightPT() } : { s: "cooling", until: Date.now() + 60_000 });
    } else if (r.status === 400 && /API key|API_KEY_INVALID/i.test(body) || r.status === 401 || r.status === 403) {
      await setState(i, { s: "disabled", until: Date.now() + 86_400_000 });
      console.error(`gemini key ${i + 1} disabled (${r.status})`);
    } else if (r.status >= 500) {
      continue; // transient; try next key
    } else {
      throw new Error(`gemini ${r.status}`);
    }
  }
  throw new NoKeyError("no key ready");
}
