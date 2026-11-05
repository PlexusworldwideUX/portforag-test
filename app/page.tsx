import { readFileSync } from "node:fs";
import { join } from "node:path";
import Landing from "@/components/Landing";
import { getRecentWork } from "@/lib/recent-work";

export default function Page() {
  const resumeMarkdown = readFileSync(join(process.cwd(), "data/resume.md"), "utf8");
  const recentWork = getRecentWork();
  return <Landing resumeMarkdown={resumeMarkdown} recentWork={recentWork} />;
}
