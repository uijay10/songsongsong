import { useState, useEffect } from "react";
import { Search, ExternalLink } from "lucide-react";
import {
  type Web3Event,
  isEventExpired,
  formatEventDate,
  formatRelativeTime,
  formatSourceLabel,
} from "@/lib/events";
import { useEventFilter } from "@/lib/event-filter-context";

function getEventBase() {
  const base = import.meta.env.BASE_URL ?? "/";
  return base.endsWith("/") ? base : base + "/";
}

function importanceDot(importance?: string) {
  switch (importance?.toLowerCase()) {
    case "高": case "high":   return "bg-red-500";
    case "中": case "medium": return "bg-amber-400";
    default:                  return "bg-slate-300 dark:bg-slate-600";
  }
}

function importanceLabel(importance?: string) {
  switch (importance?.toLowerCase()) {
    case "高": case "high":   return "重要";
    case "中": case "medium": return "一般";
    default:                  return "";
  }
}

function CategoryPill({ label }: { label: string }) {
  return (
    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium">
      {label}
    </span>
  );
}

function EventRow({ event }: { event: Web3Event }) {
  const cats = event.category ?? [];
  const srcLabel = formatSourceLabel(event.source_url);
  const relTime = formatRelativeTime(event.crawl_time ?? event.start_time);
  const startFmt = formatEventDate(event.start_time);
  const dot = importanceDot(event.importance);
  const iLabel = importanceLabel(event.importance);

  return (
    <div className="py-4 border-b border-slate-100 dark:border-slate-800/80 last:border-0 group">
      {/* Row 1: crawl time left, start time right */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
          {relTime}
        </span>
        <div className="flex items-center gap-2">
          {iLabel && (
            <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${dot}`} />
              {iLabel}
            </span>
          )}
          {startFmt && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {startFmt}
            </span>
          )}
        </div>
      </div>

      {/* Row 2: title */}
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {event.title}
      </h3>

      {/* Row 3: categories */}
      {cats.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {cats.map(c => <CategoryPill key={c} label={c} />)}
        </div>
      )}

      {/* Row 4: description */}
      {event.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-2.5 line-clamp-2">
          {event.description}
        </p>
      )}

      {/* Row 5: tags + source */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-wrap gap-1">
          {(event.tags ?? []).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              #{tag}
            </span>
          ))}
        </div>

        {/* Source bottom-left side */}
        <div className="flex items-center gap-1 ml-auto">
          {event.source_url && event.source_url !== "#" ? (
            <a
              href={event.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              <span>信息来源：{srcLabel}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          ) : (
            srcLabel && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                信息来源：{srcLabel}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export function EventList() {
  const { activeCategory } = useEventFilter();
  const [allEvents, setAllEvents] = useState<Web3Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"time" | "importance">("time");

  useEffect(() => {
    const base = getEventBase();
    fetch(`${base}extraction_result.json`)
      .then(r => { if (!r.ok) throw new Error("加载失败"); return r.json(); })
      .then((data: Web3Event[]) => { setAllEvents(data); setLoading(false); })
      .catch(() => { setError("数据加载失败，请刷新重试"); setLoading(false); });
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
        (e.tags ?? []).some(t => t.toLowerCase().includes(q))
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
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          🔥 AI 事件聚合
          {!loading && (
            <span className="text-xs font-normal text-slate-400">共 {filtered.length} 条</span>
          )}
        </h2>
        <button
          onClick={() => setSortBy(s => s === "time" ? "importance" : "time")}
          className="text-[11px] px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
        >
          {sortBy === "time" ? "⏱ 最新" : "⭐ 重要"}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="搜索标题、描述、标签..."
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 dark:focus:border-blue-600 transition-colors"
        />
      </div>

      {/* Active filter hint */}
      {activeCategory !== "全部" && (
        <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-500 dark:text-slate-400">
          <span>筛选：</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium">
            {activeCategory}
          </span>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="py-4 border-b border-slate-100 dark:border-slate-800/80 space-y-2 animate-pulse">
              <div className="flex justify-between">
                <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
                <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
              <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-3 w-5/6 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-red-400 text-sm">{error}</div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <div className="text-3xl mb-2">📭</div>
          <p className="text-sm font-medium">暂无相关事件</p>
          <p className="text-xs mt-1 opacity-70">尝试切换分类或清空搜索条件</p>
        </div>
      )}

      {!loading && !error && (
        <div>
          {filtered.map((event, idx) => (
            <EventRow key={event.id ?? idx} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
