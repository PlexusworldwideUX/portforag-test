import { embedQuery, search, answer, index } from "@/lib/rag";
import { NoKeyError } from "@/lib/keys";
import { FOLLOWUPS, LOADING, intent } from "@/lib/config";
export const runtime = "nodejs";
export const maxDuration = 30;
const hits = new Map<string, number[]>(); // per-instance rate limit
function limited(ip: string) { const now = Date.now(); const a = (hits.get(ip) || []).filter(t => now - t < 60_000); a.push(now); hits.set(ip, a); return a.length > 12; }
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "x";
  if (limited(ip)) return Response.json({ error: "rate_limited", message: "Easy there — try again in a minute." }, { status: 429 });
  let body: any; try { body = await req.json(); } catch { body = null; }
  const q = typeof body?.message === "string" ? body.message.trim() : "";
  if (!q || q.length > 500) return Response.json({ error: "bad_request", message: "Please ask a question under 500 characters." }, { status: 400 });
  const history = Array.isArray(body.history) ? body.history.filter((h: any) => typeof h?.text === "string").slice(-6) : [];
  const it = intent(q);
  try {
    const found = search(await embedQuery(q));
    let text = await answer(q, history, found);
    const m = text.match(/IDS:\s*(.*)\s*$/i);
    text = text.replace(/IDS:.*$/is, "").trim();
    const known = new Set(index().projects.map(p => p.id));
    let ids = (m?.[1] || "").split(",").map(s => s.trim()).filter(id => known.has(id));
    if (!ids.length) ids = [...new Set(found.filter(f => f.s > 0.6).map(f => f.c.project_id))].slice(0, 3);
    return Response.json({ answer: text, project_ids: [...new Set(ids)].slice(0, 4), sources: [...new Set(found.map(f => f.c.project_id))], suggestions: FOLLOWUPS[it] || FOLLOWUPS.default, loading: LOADING[it] });
  } catch (e) {
    if (e instanceof NoKeyError) return Response.json({ error: "all_keys_busy", message: "I’m catching my breath — the AI is busy right now. Try a suggestion below or open the resume." }, { status: 503 });
    console.error(e);
    return Response.json({ error: "server_error", message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
