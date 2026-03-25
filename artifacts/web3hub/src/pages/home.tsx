import { useState, useEffect } from "react";
import { useGetPosts, useGetMe } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { useWeb3Auth } from "@/lib/web3";
import { Search, PenSquare, ChevronLeft, ChevronRight, CheckCircle2, Eye } from "lucide-react";
import { Link } from "wouter";
import { useLang } from "@/lib/i18n";
import { generateGradient } from "@/lib/utils";
import { TagBadge } from "@/components/post-card";
import { formatDistanceToNow } from "date-fns";
import { enUS, zhCN, de, ru, fr, ja, ko, vi } from "date-fns/locale";

const DATE_LOCALES: Record<string, Locale> = {
  "en": enUS, "zh-CN": zhCN, "de": de, "ru": ru, "fr": fr, "ja": ja, "ko": ko, "vi": vi,
};

const PAGE_SIZE = 20;
const PIN_SLOTS = 16;

function getApiBase() {
  const base = import.meta.env.BASE_URL ?? "/";
  const parts = base.replace(/\/$/, "").split("/");
  parts.pop();
  return parts.join("/") + "/api";
}

function getCountdown(until: string) {
  const ms = new Date(until).getTime() - Date.now();
  if (ms <= 0) return "已到期";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  const ss = String(secs).padStart(2, "0");
  if (days > 0) return `${days}d ${hours}h ${mins}m ${ss}s`;
  if (hours > 0) return `${hours}h ${mins}m ${ss}s`;
  return `${mins}m ${ss}s`;
}

function useCountdownStr(until: string | null | undefined) {
  const [cd, setCd] = useState(() => until ? getCountdown(until) : "");
  useEffect(() => {
    if (!until) return;
    const id = setInterval(() => setCd(getCountdown(until)), 1000);
    return () => clearInterval(id);
  }, [until]);
  return cd;
}

function getSlotCountdown(lastPull: string): string {
  const next = new Date(new Date(lastPull).getTime() + 24 * 60 * 60 * 1000);
  const diff = next.getTime() - Date.now();
  if (diff <= 0) return "";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2,"0")}.${String(m).padStart(2,"0")}.${String(s).padStart(2,"0")}`;
}

function DailyLuckyBtn({ lastSlotPull, label }: { lastSlotPull: string | null; label: string }) {
  const { t } = useLang();
  const [cd, setCd] = useState(() => lastSlotPull ? getSlotCountdown(lastSlotPull) : "");

  useEffect(() => {
    if (!lastSlotPull) { setCd(""); return; }
    const tick = () => setCd(getSlotCountdown(lastSlotPull));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastSlotPull]);

  const canPull = !lastSlotPull || Date.now() - new Date(lastSlotPull).getTime() >= 24 * 60 * 60 * 1000;

  if (!canPull && cd) {
    return (
      <span className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm select-none cursor-default"
        style={{
          background: "rgba(0,0,0,0.04)",
          border: "1px solid rgba(0,0,0,0.1)",
          color: "#555",
          fontVariantNumeric: "tabular-nums",
          fontWeight: 400,
          letterSpacing: "0.02em",
        }}>
        {t("slotCooldown")} · {cd}
      </span>
    );
  }

  return (
    <a href="/web3hub/profile"
      className="daily-lucky-btn shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-all"
      style={{
        background: "rgba(239,68,68,0.08)",
        color: "#dc2626",
        border: "1px solid rgba(239,68,68,0.3)",
        textDecoration: "none",
        fontWeight: 600,
      }}>
      {t("slotPull")}
    </a>
  );
}

function AuthorAvatar({ wallet, name, avatar, size = "sm" }: {
  wallet: string; name?: string | null; avatar?: string | null; size?: "sm" | "md" | "lg" | "xl";
}) {
  const initials = ((name ?? wallet ?? "?").slice(0, 2)).toUpperCase();
  const cls = size === "xl"
    ? "w-20 h-20 rounded-full shrink-0 flex items-center justify-center text-base font-bold text-white overflow-hidden bg-transparent"
    : size === "lg"
    ? "w-14 h-14 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white overflow-hidden bg-transparent"
    : size === "md"
    ? "w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white overflow-hidden bg-transparent"
    : "w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden bg-transparent";
  return (
    <div className={cls} style={avatar ? undefined : { background: generateGradient(wallet ?? "0") }}>
      {avatar ? <img src={avatar} className="w-full h-full object-cover" alt="" /> : initials}
    </div>
  );
}

const SECTION_LABELS: Record<string, string> = {
  testnet: "测试网", ido: "IDO", security: "安全", integration: "集成",
  airdrop: "空投", events: "活动", funding: "融资", jobs: "求职/招聘",
  nodes: "节点", showcase: "展示", ecosystem: "生态", partners: "合作",
  hackathon: "黑客松", ama: "AMA", bugbounty: "漏洞赏金", community: "社区",
  developer: "开发者", kol: "KOL",
};

// ── Pinned card: structured layout ───────────────────────
function PostPinnedCard({ post, idx = 0 }: { post: any; idx?: number }) {
  const { t, lang } = useLang();
  const cd = useCountdownStr(post.pinnedUntil);
  const sectionLabel = t(`nav_${post.section}` as any) || post.section;
  const dateLocale = DATE_LOCALES[lang] ?? enUS;
  const timeAgo = post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: false, locale: dateLocale }) : "";
  const displayName = post.authorName ?? `${post.authorWallet?.slice(0, 6)}...`;
  return (
    <Link href={`/section/${post.section}`}
      className="pinned-card relative rounded-2xl bg-white dark:bg-slate-800 overflow-hidden flex flex-col hover:scale-[1.03] hover:brightness-105 transition-all duration-300 group cursor-pointer h-full"
      style={{ animationDelay: `${(idx % 8) * 0.6}s` }}>
      <span className="absolute inset-0 rounded-2xl pointer-events-none" />

      {/* Row 1: 标签 (left) | 时间 (right) */}
      <div className="flex items-center justify-between px-3 pt-2 mb-1 gap-1">
        <div className="flex items-center gap-1 flex-wrap">
          {post.authorTags?.map((tag: string) => <TagBadge key={tag} tag={tag} />)}
        </div>
        <span className="text-xs text-muted-foreground shrink-0">{timeAgo}</span>
      </div>

      {/* Row 2: LOGO | 名字 (left) | 分区 (right) */}
      <div className="flex items-center mb-2 pl-3 gap-1.5">
        <AuthorAvatar wallet={post.authorWallet} name={post.authorName} avatar={post.authorAvatar} size="lg" />
        <p className="ml-1 text-sm font-bold text-foreground leading-snug truncate flex-1">{displayName}</p>
        <span className="text-xs text-primary font-semibold px-2 py-0.5 rounded-full bg-primary/10 shrink-0 mr-2">{sectionLabel}</span>
      </div>

      {/* Row 3: 主题 (post title) */}
      <p className="text-sm font-bold text-foreground line-clamp-2 leading-snug px-3 mb-1">{post.title}</p>

      <div className="flex-1" />

      {/* 倒计时 — bottom-left */}
      {cd && (
        <span className="self-start mt-auto mx-3 mb-2 text-xs text-red-500 font-bold bg-red-50 dark:bg-red-950/30 px-2.5 py-0.5 rounded-full">{cd}</span>
      )}
    </Link>
  );
}

function PinnedSlotEmpty({ idx = 0 }: { idx?: number }) {
  return (
    <div
      className="shimmer-cell rounded-xl bg-white/30 dark:bg-slate-800/30 h-full"
      style={{ animationDelay: `${(idx % 8) * 1}s`, opacity: 0.4 }}
    />
  );
}

// ── Regular post card (2-col split layout) ───────────────
function PostRegularCard({ post, num }: { post: any; num: number }) {
  const { t } = useLang();
  const displayName = post.authorName ?? `${post.authorWallet?.slice(0, 6)}...`;
  const sectionLabel = t(`nav_${post.section}` as any) || post.section;
  return (
    <Link href={`/post/${post.id}`}
      className="flex items-center gap-3 px-5 py-5 rounded-2xl border border-border/30 bg-card hover:border-primary/40 hover:bg-primary/5 transition-all group cursor-pointer">
      {/* 序号 */}
      <span className={`text-base font-bold w-9 shrink-0 text-center ${num <= 3 ? "text-red-500" : "text-muted-foreground/50"}`}>{num}</span>
      {/* 头像 */}
      <div className="shrink-0">
        <AuthorAvatar wallet={post.authorWallet} name={post.authorName} avatar={post.authorAvatar} size="lg" />
      </div>
      {/* 名字 */}
      <p className="w-28 shrink-0 text-base font-semibold text-foreground truncate">{displayName}</p>
      {/* 主题 */}
      <p className="flex-1 min-w-0 text-sm text-muted-foreground truncate">{post.title}</p>
      {/* 标签 */}
      {post.authorTags?.length > 0 && (
        <div className="shrink-0 flex items-center gap-1">
          {post.authorTags.map((tag: string) => <TagBadge key={tag} tag={tag} />)}
        </div>
      )}
      {/* 区域 */}
      <span className="shrink-0 text-sm font-semibold px-3.5 py-1.5 rounded-full bg-primary/10 text-primary">{sectionLabel}</span>
      {/* 查看帖子详情 */}
      <span className="shrink-0 flex items-center gap-1 text-base text-primary font-semibold group-hover:underline whitespace-nowrap">
        <Eye className="w-4 h-4" /> {t("view")}
      </span>
    </Link>
  );
}

export default function Home() {
  const { t, lang } = useLang();
  const { address, isConnected } = useWeb3Auth();
  const { data: meData } = useGetMe({ wallet: address ?? "" }, { query: { enabled: !!address && isConnected } });
  const me = (meData as any)?.user ?? meData;
  const spaceStatus = me?.spaceStatus;
  const isSpaceOwner = spaceStatus === "approved" || spaceStatus === "active";
  const hasJoined = isSpaceOwner;
  const isPending = spaceStatus === "pending";
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  // Pinned posts (project-type only)
  const { data: pinnedData } = useQuery({
    queryKey: ["/api/posts", "pinned-home"],
    queryFn: async () => {
      const res = await fetch(`${getApiBase()}/posts?pinned=1&authorType=project&limit=${PIN_SLOTS}`);
      return res.json() as Promise<{ posts: any[] }>;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // Regular posts — when searching: all types; when browsing: project-type only
  const { data: postsData, isLoading } = useQuery({
    queryKey: ["/api/posts", "home-regular", page, debouncedSearch],
    queryFn: async () => {
      if (debouncedSearch) {
        // Search across ALL post types so nothing is missed
        const res = await fetch(
          `${getApiBase()}/posts?page=${page}&limit=${PAGE_SIZE}&q=${encodeURIComponent(debouncedSearch)}`
        );
        return res.json() as Promise<{ posts: any[]; total: number; totalPages: number; page: number }>;
      }
      // Normal home feed: project posts only
      const res = await fetch(`${getApiBase()}/posts?authorType=project&page=${page}&limit=${PAGE_SIZE}`);
      return res.json() as Promise<{ posts: any[]; total: number; totalPages: number; page: number }>;
    },
    staleTime: 30_000,
  });

  const pinnedPosts = pinnedData?.posts ?? [];
  const allPosts = postsData?.posts ?? [];
  const totalPages = postsData?.totalPages ?? 1;
  const total = postsData?.total ?? 0;

  // Only hide the exact posts already shown in pinned zone (not ALL posts from same user)
  const pinnedIds = new Set(pinnedPosts.map((p: any) => p.id));
  const posts = allPosts.filter((p: any) => !pinnedIds.has(p.id));

  // Build fixed 16-slot grid
  const pinnedSlots = Array.from({ length: PIN_SLOTS }, (_, i) => pinnedPosts[i] ?? null);

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-end gap-3 pt-2">
        <DailyLuckyBtn lastSlotPull={me?.lastSlotPull ?? null} label={t("dailyLucky")} />
        {hasJoined ? (
          <span className="shrink-0 inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700/60 cursor-default select-none pointer-events-none">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />{t("alreadyJoined")}
          </span>
        ) : isPending ? (
          <span className="shrink-0 inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 cursor-default select-none pointer-events-none">
            {t("spacePending")}
          </span>
        ) : (
          <Link href="/apply" className="shrink-0 inline-flex items-center gap-1 px-5 py-2 rounded-full text-sm font-bold bg-[#FF69B4] text-white hover:bg-[#ff4fa8] shadow-sm hover:shadow transition-all">
            {t("register")}
          </Link>
        )}
      </div>

      {/* Encouragement + Search */}
      <div className="rounded-2xl px-6 py-5 space-y-4 border border-blue-200/60" style={{background: "linear-gradient(135deg, #dbeafe 0%, #eff6ff 50%, #e0f2fe 100%)"}}>
        <p className="text-lg sm:text-xl font-bold leading-snug" style={{ color: "#FF69B4" }}>
          {t("encouragement")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
            <input type="search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-11 pr-4 py-2.5 rounded-full border border-blue-200 bg-white/80 text-sm text-gray-700 placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all shadow-sm" />
          </div>
          {hasJoined ? (
            <div className="shrink-0 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full font-bold text-sm bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700/60 cursor-default select-none pointer-events-none">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />{t("alreadyJoined")}
              </span>
              <Link href="/post/new"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-300 transition-all">
                <PenSquare className="w-4 h-4" /> {t("postNow")}
              </Link>
            </div>
          ) : isPending ? (
            <span className="shrink-0 inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full font-bold text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 cursor-default select-none pointer-events-none">
              {t("spacePending")}
            </span>
          ) : (
            <Link href="/apply"
              className="shrink-0 inline-flex items-center justify-center gap-1 px-6 py-2.5 rounded-full font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-300 transition-all">
              🚀 {t("joinNow")}
            </Link>
          )}
        </div>
      </div>

      {/* ── Pinned Zone: 16 uniform 2:1 landscape slots ── */}
      <section className="pt-6" style={{ display: debouncedSearch ? "none" : undefined }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base animate-pulse">✦</span>
          <h2 className="pinned-title-glow text-sm font-extrabold uppercase tracking-widest">{t("pinned")}</h2>
          <span className="w-2 h-2 rounded-full bg-[#fbbf24] shadow-[0_0_8px_#fbbf24,0_0_16px_#fbbf24] animate-pulse" />
          <span className="text-xs text-muted-foreground ml-1">
            （{pinnedPosts.length}/{PIN_SLOTS} {t("slotsUsed")} · {t("threeDayCountdown")}）
          </span>
        </div>
        <div className="pinned-zone-wrapper">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {pinnedSlots.map((post, i) => (
              <div key={post ? `post-${post.id}` : `empty-${i}`} className="aspect-[3/2]">
                {post ? <PostPinnedCard post={post} idx={i} /> : <PinnedSlotEmpty idx={i} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Regular Zone: 20/page, no cap ── */}
      <section className={debouncedSearch ? "pt-4" : "pt-48"}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {debouncedSearch ? (
              <>
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary">{lang === "zh-CN" ? "搜索结果" : "Search Results"}</h2>
                <span className="text-xs text-muted-foreground">「{debouncedSearch}」</span>
              </>
            ) : (
              <>
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t("regular")}</h2>
                <span className="text-xs text-muted-foreground">（{t("regularDesc")}）</span>
              </>
            )}
          </div>
          {total > 0 && (
            <span className="text-xs text-muted-foreground">{t("total")} {total}{t("itemUnit") ? " " + t("itemUnit") : ""}</span>
          )}
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            debouncedSearch ? (
              <div className="py-16 text-center">
                <p className="text-muted-foreground text-sm">{lang === "zh-CN" ? `未找到「${debouncedSearch}」相关内容` : `No results found for "${debouncedSearch}"`}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => {
                  const num = (page - 1) * PAGE_SIZE + i + 1;
                  return (
                    <div key={i} className="h-24 rounded-2xl border border-border/40 bg-muted/5 flex items-center px-5">
                      <span className="text-base text-border/40 font-mono font-bold">{num}</span>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => {
                const post = posts[i];
                const globalNum = (page - 1) * PAGE_SIZE + i + 1;
                if (post) return <PostRegularCard key={post.id} post={post} num={globalNum} />;
                return (
                  <div key={`empty-${i}`} className="h-24 rounded-2xl border border-border/40 bg-muted/5 flex items-center px-5">
                    <span className="text-base text-border/40 font-mono font-bold">{globalNum}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination — unlimited pages */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-border/30">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-muted hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let p: number;
                  if (totalPages <= 7) p = i + 1;
                  else if (page <= 4) p = i + 1;
                  else if (page >= totalPages - 3) p = totalPages - 6 + i;
                  else p = page - 3 + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-full text-sm font-semibold transition-colors ${p === page ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-foreground"}`}>
                      {p}
                    </button>
                  );
                })}
                {totalPages > 7 && page < totalPages - 3 && (
                  <span className="text-muted-foreground px-1">...</span>
                )}
                {totalPages > 7 && page < totalPages - 3 && (
                  <button onClick={() => setPage(totalPages)}
                    className="w-8 h-8 rounded-full text-sm font-semibold bg-muted hover:bg-muted/80 text-foreground">
                    {totalPages}
                  </button>
                )}
              </div>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-muted hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
