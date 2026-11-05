import { OPENING, FOLLOWUPS, intent } from "@/lib/config";
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("after") || "";
  return Response.json({ suggestions: q ? (FOLLOWUPS[intent(q)] || FOLLOWUPS.default) : OPENING });
}
