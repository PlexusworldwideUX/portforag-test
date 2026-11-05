// Builds data/index.json from projects.json (README, portfolio.json, live page text).
import fs from "node:fs";
const KEYS = (process.env.GEMINI_KEYS || "").split(",").map(s => s.trim()).filter(Boolean);
if (!KEYS.length) { console.error("GEMINI_KEYS missing"); process.exit(1); }
const GH = process.env.GITHUB_TOKEN;
const gh = (p) => fetch(`https://api.github.com/${p}`, { headers: { Accept: "application/vnd.github+json", ...(GH ? { Authorization: `Bearer ${GH}` } : {}) } });
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#\d+;|&\w+;/g, " ").replace(/\s+/g, " ").trim();
async function text(url, ms = 10000) { try { const r = await fetch(url, { signal: AbortSignal.timeout(ms) }); return r.ok ? await r.text() : ""; } catch { return ""; } }
function chunk(s, head, size = 1200, overlap = 150) {
  const out = [];
  for (const sec of s.split(/\n(?=#{1,3} )/)) for (let i = 0; i < sec.length && out.length < 16; i += size - overlap) { const t = sec.slice(i, i + size).trim(); if (t.length > 40) out.push(head + "\n" + t); }
  return out.length ? out : [head];
}
let ki = 0;
async function embed(texts) {
  for (let attempt = 0; attempt < KEYS.length * 2; attempt++) {
    const key = KEYS[ki % KEYS.length];
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents", {
      method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ requests: texts.map(t => ({ model: "models/gemini-embedding-001", content: { parts: [{ text: t }] }, taskType: "RETRIEVAL_DOCUMENT", outputDimensionality: 768 })) }) });
    if (r.ok) return (await r.json()).embeddings.map(e => e.values.map(v => +v.toFixed(5)));
    console.warn(`embed: key ${ki % KEYS.length + 1} -> ${r.status}`); ki++;
    if (r.status === 429) await new Promise(s => setTimeout(s, 3000));
  }
  throw new Error("all keys failed");
}
const { projects } = JSON.parse(fs.readFileSync("projects.json", "utf8"));
const outProjects = [], chunks = [];
for (const p of projects.filter(p => p.allowed)) {
  const meta = { ...p }; let body = "";
  if (p.local_file) body = fs.readFileSync(p.local_file, "utf8");
  if (p.repo) {
    const info = await gh(`repos/${p.repo}`).then(r => r.ok ? r.json() : null);
    if (info) { meta.live_url ||= info.homepage || null; meta.source_urls = [info.html_url]; meta.summary ||= info.description || null; }
    const br = info?.default_branch || "main";
    const pj = await text(`https://raw.githubusercontent.com/${p.repo}/${br}/portfolio.json`);
    if (pj) { try { Object.assign(meta, Object.fromEntries(Object.entries(JSON.parse(pj)).filter(([, v]) => v != null))); } catch {} }
    const readme = await text(`https://raw.githubusercontent.com/${p.repo}/${br}/README.md`);
    if (readme && !/^# Create Next App|This is a \[Next\.js\]/.test(readme)) body += "\n" + readme;
  }
  if (meta.live_url) { const page = strip(await text(meta.live_url)); if (page) body += "\nLive page text: " + page.slice(0, 4000); }
  meta.summary ||= body.replace(/[#*`>\[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 220) || null;
  delete meta.local_file; delete meta.allowed;
  outProjects.push(meta);
  const head = `Project: ${meta.title}. Company: ${meta.company || "personal"}. Type: ${meta.type}. Skills: ${(meta.skills || []).join(", ")}.`;
  const parts = chunk(body.trim(), head);
  const vecs = await embed(parts);
  parts.forEach((t, i) => chunks.push({ project_id: meta.id, text: t, v: vecs[i] }));
  console.log(`${meta.id}: ${parts.length} chunks`);
}
fs.writeFileSync("data/index.json", JSON.stringify({ built_at: new Date().toISOString(), model: "gemini-embedding-001", dims: 768, projects: outProjects, chunks }));
console.log(`index: ${outProjects.length} projects, ${chunks.length} chunks`);
