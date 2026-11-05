// Retrieval quality check: each question must return the expected project in top 5.
import fs from "node:fs";
const KEYS = (process.env.GEMINI_KEYS || "").split(",").filter(Boolean);
const idx = JSON.parse(fs.readFileSync("data/index.json", "utf8"));
const cases = [["Pull up the resume", "resume"], ["Freeport dashboards", "resume"], ["design language system", "dls"], ["Japan expansion case study", "japan-case-study"], ["alt text AI", "plexus-alt-text-ai"], ["checkout prototype", "plexus-cart-checkout"], ["Payload CMS components", "cms-payload"], ["multi-agent ATS pipeline", "ats-x2"], ["personas research", "plexus-personas"], ["information architecture", "infoarchdesign"]];
const norm = v => Math.hypot(...v);
let fail = 0;
for (const [q, want] of cases) {
  let v;
  for (const k of KEYS) { const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent", { method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": k }, body: JSON.stringify({ content: { parts: [{ text: q }] }, taskType: "RETRIEVAL_QUERY", outputDimensionality: 768 }) }); if (r.ok) { v = (await r.json()).embedding.values; break; } }
  if (!v) { console.error("no key"); process.exit(1); }
  const top = idx.chunks.map(c => [c.project_id, c.v.reduce((a, x, i) => a + x * v[i], 0) / (norm(c.v) * norm(v))]).sort((a, b) => b[1] - a[1]).map(x => x[0]);
  const ok = [...new Set(top)].slice(0, 5).includes(want); if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${q} -> ${want}`);
}
console.log(`${cases.length - fail}/${cases.length} passed`); process.exit(fail > 2 ? 1 : 0);
