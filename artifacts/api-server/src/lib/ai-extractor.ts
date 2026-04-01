import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "dummy",
});

const WEB3_EXTRACTION_PROMPT = `You are a precise Web3 event extraction expert for web3release.com.

LANGUAGE RULE — CRITICAL: ALL output text (title, project_name, description, tags) MUST be written in natural, fluent, professional English — regardless of the source language. If content is in Chinese or any other language, translate it into native-sounding English suitable for a global Web3 audience. Keep proper nouns (project names, token symbols, platform names like Galxe, Solana, USDT, etc.) unchanged.

The platform has exactly 15 fixed sections. You MUST choose 1–2 strictly from this list:
测试网, IDO/Launchpad, 预售, 融资公告, 空投, 招聘, 节点招募, 主网上线, 代币解锁, 交易所上线, 链上任务, 开发者专区, 项目捐赠/赞助, 漏洞赏金

Section routing guide:
- Grant, sponsorship, accelerator, incubator, ecosystem fund, Gitcoin → 项目捐赠/赞助
- Bug bounty, security audit, vulnerability reward, Immunefi, Code4rena, HackenProof → 漏洞赏金
- Web3/blockchain job openings → 招聘
- Partnership / strategic collaboration → 融资公告
- Requires active on-chain user action to earn rewards → 链上任务

Task: Extract valid, upcoming or ongoing Web3 events from the content below. Ignore events that ended more than 7 days ago.

Output rules:
- Return ONLY a raw JSON array [] — no explanations, no markdown, no code blocks
- Return [] if nothing qualifies
- Every string field MUST be in English

Format for each qualifying event:
{
  "title": "Concise, action-oriented English title, max 12 words",
  "project_name": "Official project name in English",
  "description": "80–150 word English description — clearly explain the opportunity, who it is for, key dates, and what action to take. Natural, engaging tone.",
  "category": ["测试网"] or ["空投", "测试网"],
  "start_time": "2026-04-15T00:00:00Z or null",
  "end_time": "2026-04-20T23:59:59Z or null",
  "source_url": "original URL",
  "importance": "high or medium or low",
  "ai_confidence": 0.92,
  "tags": ["Solana", "Layer2", "DeFi"]
}

Strict rules:
1. category must be strictly chosen from the 15 sections above — never invent new ones.
2. Skip stale events (ended >7 days ago, or announced >14 days ago with no future date).
3. All text output must be in English.
4. Times must be ISO 8601 (UTC). Use null if unknown.
5. Backend automatically sets expires_at to scrape time + 60 days.

Now process the following web page content:
{{PAGE_CONTENT}}`;

export const CATEGORY_MAP: Record<string, string> = {
  "测试网": "testnet",
  "IDO/Launchpad": "ido",
  "IDO": "ido",
  "Launchpad": "ido",
  "预售": "presale",
  "融资公告": "funding",
  "空投": "airdrop",
  "招聘": "recruiting",
  "节点招募": "nodes",
  "主网上线": "mainnet",
  "代币解锁": "unlock",
  "交易所上线": "exchange",
  "链上任务": "quest",
  "开发者专区": "developer",
  "项目捐赠/赞助": "grant",
  "捐赠/赞助": "grant",
  "捐赠赞助": "grant",
  "Grant": "grant",
  "Grants": "grant",
  "Sponsorship": "grant",
  "漏洞赏金": "bugbounty",
  "Bug Bounty": "bugbounty",
  "BugBounty": "bugbounty",
};

export interface ExtractedEvent {
  title: string;
  project_name: string;
  description: string;
  category: string[];
  start_time: string | null;
  end_time: string | null;
  source_url: string;
  importance: "high" | "medium" | "low";
  ai_confidence: number;
  tags: string[];
  section: string;
}

function mapCategory(categories: string[]): string {
  for (const cat of categories) {
    const key = CATEGORY_MAP[cat];
    if (key) return key;
    for (const [zh, en] of Object.entries(CATEGORY_MAP)) {
      if (cat.includes(zh)) return en;
    }
  }
  return "testnet";
}

export async function fetchPageContent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Failed to fetch URL: ${response.status}`);
  const html = await response.text();

  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length > 12000) text = text.slice(0, 12000);
  return text;
}

export async function extractEvents(url: string): Promise<ExtractedEvent[]> {
  const pageContent = await fetchPageContent(url);
  const prompt = WEB3_EXTRACTION_PROMPT.replace("{{PAGE_CONTENT}}", pageContent);

  const completion = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = completion.choices[0]?.message?.content ?? "[]";

  let parsed: any[];
  try {
    const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
    parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) parsed = [];
  } catch {
    parsed = [];
  }

  return parsed
    .filter((ev: any) => ev && typeof ev.title === "string" && ev.title.trim())
    .map((ev: any) => ({
      title: String(ev.title ?? "").trim(),
      project_name: String(ev.project_name ?? "").trim(),
      description: String(ev.description ?? "").trim(),
      category: Array.isArray(ev.category) ? ev.category : [ev.category ?? "测试网"],
      start_time: ev.start_time ?? null,
      end_time: ev.end_time ?? null,
      source_url: String(ev.source_url ?? url).trim(),
      importance: (["high", "medium", "low"].includes(ev.importance) ? ev.importance : "medium") as "high" | "medium" | "low",
      ai_confidence: typeof ev.ai_confidence === "number" ? Math.min(1, Math.max(0, ev.ai_confidence)) : 0.8,
      tags: Array.isArray(ev.tags) ? ev.tags.map(String) : [],
      section: mapCategory(Array.isArray(ev.category) ? ev.category : [ev.category ?? "测试网"]),
    }));
}
