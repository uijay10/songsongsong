import { useState, useEffect, useCallback } from "react";
import { Search, ExternalLink, Pin } from "lucide-react";
import { createPortal } from "react-dom";
import {
  type Web3Event,
  isEventExpired,
  formatRelativeTime,
  formatSourceLabel,
} from "@/lib/events";
import { useEventFilter } from "@/lib/event-filter-context";
import { useLang } from "@/lib/i18n";
import { useWeb3Auth } from "@/lib/web3";
import { isAdmin } from "@/lib/admin";
import { AdminPinModal, PostCard } from "@/components/post-card";

function getApiBase() {
  const base = import.meta.env.BASE_URL ?? "/";
  const parts = base.replace(/\/$/, "").split("/");
  parts.pop();
  return parts.join("/") + "/api";
}

const SECTION_TO_ZH: Record<string, string> = {
  testnet:   "测试网",
  ido:       "IDO/Launchpad",
  presale:   "预售",
  funding:   "融资公告",
  airdrop:   "空投",
  recruiting:"招聘",
  nodes:     "节点招募",
  mainnet:   "主网上线",
  unlock:    "代币解锁",
  exchange:  "交易所上线",
  quest:     "链上任务",
  developer: "开发者专区",
};

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

function EventRow({
  event,
  lang,
  tFn,
  adminUser,
  onPinRequest,
}: {
  event: Web3Event;
  lang: string;
  tFn: (k: string) => string;
  adminUser: boolean;
  onPinRequest: (id: number | string) => void;
}) {
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
    <li className={`py-4 border-b border-slate-200 dark:border-slate-700 last:border-0 group list-none`}>
      <div className="flex items-center mb-1.5 gap-2">
        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono flex-1">{relTime}</span>
        {adminUser && event.id != null && (
          <button
            onClick={() => onPinRequest(event.id!)}
            title={zh ? "管理员置顶" : "Admin pin"}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-violet-100 dark:hover:bg-violet-900/30 text-slate-400 hover:text-violet-500"
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 leading-snug mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {event.title}
      </h3>

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

      {event.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-2.5 line-clamp-2">
          {event.description}
        </p>
      )}

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
  const { address } = useWeb3Auth();
  const adminUser = isAdmin(address);

  const [allEvents, setAllEvents] = useState<Web3Event[]>([]);
  const [pinnedPosts, setPinnedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"time" | "importance">("time");
  const [fetchTick, setFetchTick] = useState(0);

  const [pinTargetId, setPinTargetId] = useState<number | string | null>(null);
  const [pinHours, setPinHours] = useState<number | "">(72);
  const [pinCustom, setPinCustom] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [pinMsg, setPinMsg] = useState("");

  const refetch = useCallback(() => setFetchTick(t => t + 1), []);

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      fetch(`${getApiBase()}/posts?authorType=ai&limit=200`).then(r => r.ok ? r.json() : { posts: [] }),
      fetch(`${getApiBase()}/posts?pinned=1&limit=16`).then(r => r.ok ? r.json() : { posts: [] }),
    ]).then(([aiData, pinnedData]) => {
      const aiPosts: Array<Record<string, unknown>> = Array.isArray(aiData.posts) ? aiData.posts : [];
      const pinned: any[] = Array.isArray(pinnedData.posts) ? pinnedData.posts : [];
      setPinnedPosts(pinned);

      const pinnedIds = new Set(pinned.map((p: any) => p.id));
      const events: Web3Event[] = aiPosts
        .filter(p => !pinnedIds.has(p.id))
        .map((p) => ({
          id: p.id as number,
          title: p.title as string,
          description: p.content as string,
          project_name: p.authorName as string,
          category: p.section ? [SECTION_TO_ZH[p.section as string] ?? (p.section as string)] : [],
          source_url: (p.sourceUrl as string) ?? undefined,
          importance: (p.importance as string) ?? "medium",
          start_time: (p.eventStartTime as string) ?? undefined,
          end_time: (p.eventEndTime as string) ?? undefined,
          crawl_time: p.createdAt as string,
          ai_confidence: p.aiConfidence as number,
          isPinned: p.isPinned as boolean,
          pinnedUntil: p.pinnedUntil as string | null,
        }));
      setAllEvents(events);
      setLoading(false);
    }).catch(() => {
      setError(zh ? "数据加载失败，请刷新重试" : "Failed to load data, please refresh");
      setLoading(false);
    });
  }, [fetchTick]);

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

  const doAdminPin = async () => {
    if (!address || !pinTargetId) return;
    const hours = Number(pinHours);
    if (!hours || hours < 1) return;
    setPinning(true);
    setPinMsg("");
    try {
      const res = await fetch(`${getApiBase()}/posts/${pinTargetId}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address, durationHours: hours }),
      });
      const d = await res.json();
      if (!res.ok) {
        setPinMsg(`❌ ${d.error}`);
      } else {
        setPinMsg(zh
          ? `✅ 置顶成功！有效期 ${hours >= 24 ? Math.round(hours / 24) + " 天" : hours + " 小时"}`
          : `✅ Pinned for ${hours >= 24 ? Math.round(hours / 24) + "d" : hours + "h"}`);
        refetch();
      }
    } finally {
      setPinning(false);
      setPinTargetId(null);
    }
  };

  return (
    <div>
      {/* Pinned posts section */}
      {pinnedPosts.length > 0 && (
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-2">
            <Pin className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">
              {zh ? "置顶公告" : "Pinned Announcements"}
            </span>
            <span className="text-xs text-violet-400/70">({pinnedPosts.length})</span>
          </div>
          {pinnedPosts.map((post: any) => (
            <PostCard key={post.id} post={post} onRefresh={refetch} compact />
          ))}
        </div>
      )}

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
            placeholder={zh ? "搜索项目名称、描述、标签、关键词..." : "Search by project name, description, tags, keywords..."}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 dark:focus:border-blue-600 transition-colors"
          />
        </div>

        {activeCategory !== "全部" && (
          <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-500 dark:text-slate-400">
            <span>{zh ? "筛选：" : "Filter:"}</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium">
              {t(CAT_I18N[activeCategory] as any) || activeCategory}
            </span>
          </div>
        )}

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
              <EventRow
                key={event.id ?? idx}
                event={event}
                lang={lang}
                tFn={(k) => t(k as any)}
                adminUser={adminUser}
                onPinRequest={(id) => {
                  setPinTargetId(id);
                  setPinHours(72);
                  setPinCustom(false);
                  setPinMsg("");
                }}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Admin pin modal (portal) */}
      {pinTargetId != null && createPortal(
        <AdminPinModal
          hours={pinHours}
          setHours={setPinHours}
          custom={pinCustom}
          setCustom={setPinCustom}
          pinning={pinning}
          onConfirm={doAdminPin}
          onClose={() => { setPinTargetId(null); setPinMsg(""); }}
        />,
        document.body
      )}
      {pinMsg && pinTargetId == null && (
        <p className="text-sm mt-3 text-violet-500 font-medium text-center">{pinMsg}</p>
      )}
    </div>
  );
}
