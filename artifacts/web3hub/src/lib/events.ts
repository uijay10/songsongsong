export interface Web3Event {
  id?: string | number;
  title: string;
  description?: string;
  project_name?: string;
  start_time?: string;
  source_url?: string;
  tags?: string[];
  importance?: string;
  category?: string[];
}

export interface ClaimApplication {
  id: string;
  eventTitle: string;
  projectName: string;
  contact: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  submitTime: string;
  reviewTime?: string;
  reviewNote?: string;
}

const STORAGE_KEY = "projectApplications";
const WATCHED_KEY = "claimedEvents";
const CLAIMED_KEY = "projectClaimed";

export const CATEGORIES = [
  "全部", "测试网", "IDO/Launchpad", "预售", "融资公告",
  "空投", "招聘", "节点招募", "主网上线", "代币解锁",
  "交易所上线", "链上任务", "开发者专区",
];

export function isEventExpired(event: Web3Event): boolean {
  if (!event.start_time) return false;
  const eventDate = new Date(event.start_time);
  const now = new Date();
  const diffDays = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays < -60;
}

export function formatEventDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function loadClaims(): ClaimApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as ClaimApplication[];
    return all.filter(c => c.id && String(c.id).startsWith("claim_"));
  } catch {
    return [];
  }
}

export function saveClaims(claims: ClaimApplication[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
}

export function submitClaim(data: Omit<ClaimApplication, "id" | "status" | "submitTime">): ClaimApplication {
  const newClaim: ClaimApplication = {
    ...data,
    id: `claim_${Date.now()}`,
    status: "pending",
    submitTime: new Date().toLocaleString("zh-CN"),
    reviewNote: "",
  };
  const existing = loadClaims();
  saveClaims([newClaim, ...existing]);
  return newClaim;
}

export function isAlreadySubmitted(eventTitle: string): boolean {
  return loadClaims().some(c => c.eventTitle === eventTitle);
}

export function loadWatched(): string[] {
  try {
    return JSON.parse(localStorage.getItem(WATCHED_KEY) || "[]");
  } catch {
    return [];
  }
}

export function toggleWatched(eventTitle: string): boolean {
  const watched = loadWatched();
  const idx = watched.indexOf(eventTitle);
  if (idx >= 0) {
    watched.splice(idx, 1);
  } else {
    watched.push(eventTitle);
  }
  localStorage.setItem(WATCHED_KEY, JSON.stringify(watched));
  return idx < 0;
}

export function isProjectClaimed(eventTitle: string): boolean {
  try {
    const claimed: string[] = JSON.parse(localStorage.getItem(CLAIMED_KEY) || "[]");
    return claimed.includes(eventTitle);
  } catch {
    return false;
  }
}

export function setProjectClaimed(eventTitle: string): void {
  try {
    const claimed: string[] = JSON.parse(localStorage.getItem(CLAIMED_KEY) || "[]");
    if (!claimed.includes(eventTitle)) {
      claimed.push(eventTitle);
      localStorage.setItem(CLAIMED_KEY, JSON.stringify(claimed));
    }
  } catch {
    localStorage.setItem(CLAIMED_KEY, JSON.stringify([eventTitle]));
  }
}
