export const OPENING = ["What’s Christopher working on at Plexus right now?", "Show me the design system work", "Pull up the resume", "Who is this guy?", "Tell me about the Freeport dashboards", "What AI and RAG experience does he have?"];
export const FOLLOWUPS: Record<string, string[]> = {
  resume: ["Which projects used design systems?", "Current role details"],
  plexus: ["What skills did that involve?", "Show the design-to-code pipeline"],
  who: ["Show current work", "Pull up the resume"],
  default: ["Show me the design system work", "What AI and RAG experience does he have?"],
};
export const LOADING: Record<string, string> = { resume: "Assembling the resume just for you!", plexus: "Pulling up Christopher’s latest work at Plexus…", freeport: "Retrieving the operational dashboards…", who: "Let me introduce you…", skills: "Gathering the skills and systems…", default: "Searching the projects…" };
export const SCIFI = ["Don’t panic.", "By Grabthar’s hammer…", "May the Force be with this query.", "These aren’t the droids you’re looking for… wait, yes they are.", "Ludicrous speed, go!", "Make it so.", "Multipass!", "Enhance… 224 to 176.", "There is no spoon.", "Space… the final frontier of this portfolio…"];
export function intent(q: string) {
  const s = q.toLowerCase();
  if (/resume|cv/.test(s)) return "resume";
  if (/plexus|current|now/.test(s)) return "plexus";
  if (/freeport|dashboard/.test(s)) return "freeport";
  if (/who is|who's|about him|this guy/.test(s)) return "who";
  if (/skill|design system/.test(s)) return "skills";
  return "default";
}
