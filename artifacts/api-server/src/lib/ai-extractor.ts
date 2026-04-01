import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "dummy",
});

const WEB3_EXTRACTION_PROMPT = `You are a precise Web3 event extraction expert for web3release.com.

The platform has exactly 15 fixed sections. You MUST choose 1–2 strictly from this list. Read each definition carefully:

- 测试网: Project launches/upgrades a testnet. ONLY testnet — not mainnet, not presale, not quest.
- IDO/Launchpad: Token IDO or launchpad listing (Binance Launchpad, Bybit, Gate Startup, Polkastarter). NOT general news.
- 预售: Token/NFT presale (private sale, public sale, whitelist) on CoinList, Seedify, DAO Maker, PinkSale, Legion. NOT airdrop.
- 融资公告: ONLY confirmed VC funding events — must explicitly state a dollar amount raised AND name of investors OR round type (seed, Series A/B, angel). STRICT EXCLUSIONS — never use for: regulatory news, government policy, laws, bills, court rulings, partnership announcements, protocol integrations, market expansions, testnet launches, presales, IDO, or any content without a confirmed investment round and amount.
- 空投: Airdrop campaign (free tokens to users). NOT staking rewards or liquidity mining.
- 招聘: Web3 job openings or hiring announcements.
- 节点招募: Validator/miner node recruitment programs.
- 主网上线: ONLY when a blockchain/protocol officially launches its mainnet for the first time, or a bridge/protocol goes live on mainnet. Must use language like "mainnet launch", "launches mainnet", "mainnet goes live", "mainnet activation". STRICT EXCLUSIONS: never use for testnets, funding, partnerships, integrations, feature updates, or upgrades that are not a mainnet launch.
- 代币解锁: Scheduled token unlock or vesting cliff. Must have specific date or amount.
- 交易所上线: ONLY confirmed token listings on a named exchange — "listed on Binance", "will list on OKX", "Coinbase listing", "Upbit listing". STRICT EXCLUSIONS: never use for testnet, funding, presale, IDO, node recruitment, or general project news without an explicit exchange listing.
- 链上任务: ONLY campaigns requiring users to complete specific on-chain actions to earn rewards (Galxe, Layer3, QuestN, Zealy, TaskOn). NOT partnerships or feature announcements.
- 开发者专区: Developer tools, SDKs, APIs, hackathons, smart contract news, technical upgrades, developer tutorials.
- 漏洞赏金: Bug bounty programs, security audit competitions (Immunefi, Code4rena, HackenProof, Sherlock).
- 项目捐赠/赞助: Grant programs, ecosystem funds, accelerators, incubators (Gitcoin, Web3/Ethereum/Solana Foundation, Arbitrum Grants, Optimism RPGF, Binance Labs, a16z).

Strict routing — apply in this priority order:
1. Testnet content → 测试网 (never 融资公告 or 主网上线)
2. Presale / whitelist sale → 预售 (never 融资公告)
3. Regulatory news / government policy / laws → SKIP entirely (do not classify)
4. Explicitly states "raised $X" + named investor/round → 融资公告
5. Explicitly states "mainnet launch" / "mainnet goes live" → 主网上线
6. Partnership / integration / protocol update → 开发者专区 (NOT 融资公告 or 交易所上线)
7. Named exchange listing announcement → 交易所上线
8. On-chain user quest → 链上任务
9. Bug bounty / security reward → 漏洞赏金
10. Grant / ecosystem fund → 项目捐赠/赞助
11. Job posting → 招聘
12. Ambiguous / does not clearly fit any section → SKIP (return nothing)

Task: Extract valid, upcoming or ongoing Web3 events from the content below. Ignore events that ended more than 7 days ago.

Output rules:
- Return ONLY a raw JSON array [] — no explanations, no markdown, no code blocks
- Return [] if nothing qualifies

Format for each qualifying event:
{
  "title": "Concise, action-oriented title, max 12 words — keep the original source language",
  "project_name": "Official project name",
  "description": "80–150 word description — clearly explain the opportunity, who it is for, key dates, and what action to take. Keep the original source language.",
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
3. Keep all text in the original source language — do NOT translate.
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
