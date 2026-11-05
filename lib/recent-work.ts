import catalog from "@/data/recent-work.json";

export type RecentWorkItem = {
  id: string;
  path: string;
  url: string;
  title: string;
  blurb: string;
};

export function getRecentWork(): RecentWorkItem[] {
  return catalog.items as RecentWorkItem[];
}
