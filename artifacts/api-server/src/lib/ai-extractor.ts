import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "dummy",
});

const WEB3_EXTRACTION_PROMPT = `你是一个精准的 Web3 项目事件提取专家，只处理真实有效的 Web3 机会信息。

平台共有以下 12 个固定栏目，必须严格从里面选择（可以选 1 个或最多 2 个）：
测试网、IDO/Launchpad、预售、融资公告、空投、招聘、节点招募、主网上线、代币解锁、交易所上线、链上任务、开发者专区

任务：
从下面提供的内容中，提取符合以上栏目的有效事件。只提取即将发生、正在进行，或结束不超过7天的事件。已经完全过时的事件一律忽略。

输出要求：
- 只返回纯 JSON 数组 []，不要任何解释、文字、代码块或 markdown。
- 如果没有有效事件，返回空数组: []
- 每条事件必须是以下完整格式：

{
  "title": "简洁有力的标题，优先用中文",
  "project_name": "项目官方名称",
  "description": "150-200字以内的自然流畅中文描述，清晰说明是什么机会和关键时间点",
  "category": ["测试网"] 或 ["空投", "测试网"],
  "start_time": "2026-04-15T00:00:00Z 或 null",
  "end_time": "2026-04-20T23:59:59Z 或 null",
  "source_url": "原始链接地址",
  "importance": "high 或 medium 或 low",
  "ai_confidence": 0.92,
  "tags": ["Solana", "Layer2", "DeFi"]
}

首页展示规则（后端会按此规则排序展示，类似金色财经一条一条垂直列表）：
- 优先展示 importance = "high" 的项目。
- 默认按 start_time 从最近到最远排序（即将开始的事件排最前面）。
- 同等 importance 时，按 ai_confidence 从高到低排序。
- 每条在首页显示时包含标题、简短描述、时间、category、tags。

严格规则：
1. category 必须从上面12个栏目中严格选择，不能自己发明新栏目。
2. 过时事件（结束超过7天或公告超过14天且没有未来时间）直接忽略。
3. description 必须用自然流畅的中文。
4. 时间必须用 ISO 8601 格式（UTC时区），不确定就填 null。
5. 后端会自动把 expires_at 设置为抓取时间 + 60 天。

现在开始处理以下网页内容：
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
