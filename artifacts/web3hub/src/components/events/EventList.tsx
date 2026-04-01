import { useState, useEffect } from "react";
import { Search, ExternalLink } from "lucide-react";
import {
  type Web3Event,
  isEventExpired,
  formatRelativeTime,
  formatSourceLabel,
} from "@/lib/events";
import { useEventFilter } from "@/lib/event-filter-context";
import { useLang } from "@/lib/i18n";

function getEventBase() {
  const base = import.meta.env.BASE_URL ?? "/";
  return base.endsWith("/") ? base : base + "/";
}

/* Map from stored Chinese category key → i18n key */
const CAT_I18N: Record<string, string> = {
  "测试网":     "nav_testnet",
  "IDO/Launchpad": "nav_ido",
  "预售":       "nav_presale",
  "融资公告":   "nav_funding",
  "空投":       "nav_airdrop",
  "招聘":       "nav_recruiting",
  "节点招募":   "nav_nodes",
  "主网上线":   "nav_mainnet",
  "代币解锁":   "nav_unlock",
  "交易所上线": "nav_exchange",
  "链上任务":   "nav_quest",
  "开发者专区": "nav_developer",
};

function importanceDot(importance?: string) {
  switch (importance?.toLowerCase()) {
    case "高": case "high":   return "bg-red-500";
    case "中": case "medium": return "bg-amber-400";
    default:                  return null;
  }
}

function EventRow({ event, lang, tFn }: { event: Web3Event; lang: string; tFn: (k: string) => string }) {
  const zh = lang === "zh-CN";
  const cats = event.category ?? [];
  const srcLabel = formatSourceLabel(event.source_url);
  const relTime = formatRelativeTime(event.crawl_time ?? event.start_time, lang);
  const dot = importanceDot(event.importance);
  const iLabel = event.importance
    ? (event.importance === "高" || event.importance === "high"
        ? (zh ? "重要" : "Hot")
        : event.importance === "中" || event.importance === "medium"
        ? (zh ? "一般" : "Normal")
        : "")
    : "";

  return (
    <li className="py-4 border-b border-slate-200 dark:border-slate-700 last:border-0 group list-none">
      {/* Row 1: crawl time left only */}
      <div className="flex items-center mb-1.5">
        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
          {relTime}
        </span>
      </div>

      {/* Row 2: title */}
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 leading-snug mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {event.title}
      </h3>

      {/* Row 3: categories + importance inline */}
      {(cats.length > 0 || iLabel) && (
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {cats.map(c => (
            <span key={c} className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium">
              {CAT_I18N[c] ? tFn(CAT_I18N[c]) : c}
            </span>
          ))}
          {iLabel && dot && (
            <span className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
              {iLabel}
            </span>
          )}
        </div>
      )}

      {/* Row 4: description */}
      {event.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-2.5 line-clamp-2">
          {event.description}
        </p>
      )}

      {/* Row 5: tags + source */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex flex-wrap gap-1">
          {(event.tags ?? []).map(tag => (
            <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              #{tag}
            </span>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          {event.source_url && event.source_url !== "#" ? (
            <a
              href={event.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              <span>{zh ? "信息来源：" : "Source: "}{srcLabel}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : srcLabel ? (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {zh ? "信息来源：" : "Source: "}{srcLabel}
            </span>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function EventList() {
  const { activeCategory } = useEventFilter();
  const { t, lang } = useLang();
  const zh = lang === "zh-CN";

  const [allEvents, setAllEvents] = useState<Web3Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"time" | "importance">("time");

  useEffect(() => {
    const base = getEventBase();
    fetch(`${base}extraction_result.json`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: Web3Event[]) => { setAllEvents(data); setLoading(false); })
      .catch(() => { setError(zh ? "数据加载失败，请刷新重试" : "Failed to load data, please refresh"); setLoading(false); });
  }, []);

  const importanceOrder: Record<string, number> = { "高": 0, "high": 0, "中": 1, "medium": 1 };

  const filtered = allEvents
    .filter(e => !isEventExpired(e))
    .filter(e => {
      if (activeCategory === "全部") return true;
      return (e.category ?? []).includes(activeCategory);
    })
    .filter(e => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        (e.description ?? "").toLowerCase().includes(q) ||
        (e.tags ?? []).some(tag => tag.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === "importance") {
        const ia = importanceOrder[a.importance ?? ""] ?? 2;
        const ib = importanceOrder[b.importance ?? ""] ?? 2;
        if (ia !== ib) return ia - ib;
      }
      const da = a.crawl_time ? new Date(a.crawl_time).getTime() : (a.start_time ? new Date(a.start_time).getTime() : 0);
      const db = b.crawl_time ? new Date(b.crawl_time).getTime() : (b.start_time ? new Date(b.start_time).getTime() : 0);
      return db - da;
    });

  return (
    <div>
      <div>

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            🔥 {zh ? "AI 事件聚合" : "AI Events"}
            {!loading && (
              <span className="text-xs font-normal text-slate-400">
                {zh ? `共 ${filtered.length} 条` : `${filtered.length} events`}
              </span>
            )}
          </h2>
          <button
            onClick={() => setSortBy(s => s === "time" ? "importance" : "time")}
            className="text-xs px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
          >
            {sortBy === "time"
              ? (zh ? "⏱ 最新" : "⏱ Latest")
              : (zh ? "⭐ 重要" : "⭐ Important")}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={zh ? "搜索标题、描述、标签..." : "Search title, description, tags..."}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 dark:focus:border-blue-600 transition-colors"
          />
        </div>

        {/* Active category hint */}
        {activeCategory !== "全部" && (
          <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-500 dark:text-slate-400">
            <span>{zh ? "筛选：" : "Filter:"}</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium">
              {t(CAT_I18N[activeCategory] as any) || activeCategory}
            </span>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <ul className="space-y-0">
            {[1, 2, 3].map(i => (
              <li key={i} className="py-4 border-b border-slate-200 dark:border-slate-700 space-y-2.5 animate-pulse">
                <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
                <div className="h-5 w-3/4 bg-slate-100 dark:bg-slate-800 rounded" />
                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded" />
                <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded" />
              </li>
            ))}
          </ul>
        )}

        {error && (
          <div className="text-center py-12 text-red-400 text-sm">{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-sm font-medium">{zh ? "暂无相关事件" : "No events found"}</p>
            <p className="text-xs mt-1 opacity-70">
              {zh ? "尝试切换分类或清空搜索条件" : "Try switching category or clearing search"}
            </p>
          </div>
        )}

        {!loading && !error && (
          <ul className="space-y-0">
            {filtered.map((event, idx) => (
              <EventRow key={event.id ?? idx} event={event} lang={lang} tFn={(k) => t(k as any)} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
