import { index } from "@/lib/rag";
import { OPENING, SCIFI } from "@/lib/config";
import Chat from "@/components/Chat";
export default function Page() {
  const projects = index().projects;
  return <Chat projects={projects} opening={OPENING} scifi={SCIFI} />;
}
