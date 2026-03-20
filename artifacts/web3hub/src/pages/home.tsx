import { useState, useEffect } from "react";
import { useGetPosts, useGetMe } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { useWeb3Auth } from "@/lib/web3";
import { Search, PenSquare, ChevronLeft, ChevronRight, CheckCircle2, Eye } from "lucide-react";
import { Link } from "wouter";
import { useLang } from "@/lib/i18n";
import { generateGradient } from "@/lib/utils";
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

function countdown(until: string) {
  const ms = new Date(until).getTime() - Date.now();
  if (ms <= 0) return "已到期";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function AuthorAvatar({ wallet, name, avatar, size = "sm" }: {
  wallet: string; name?: string | null; avatar?: string | null; size?: "sm" | "md" | "lg" | "xl";
}) {
  const initials = ((name ?? wallet ?? "?").slice(0, 2)).toUpperCase();
  const cls = size === "xl"
    ? "w-20 h-20 rounded-full shrink-0 flex items-center justify-center text-base font-bold text-white overflow-hidden"
    : size === "lg"
    ? "w-14 h-14 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white overflow-hidden"
    : size === "md"
    ? "w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white overflow-hidden"
    : "w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden";
  return (
    <div className={cls} style={{ background: generateGradient(wallet ?? "0") }}>
      {avatar ? <img src={avatar} className="w-full h-full object-cover" alt="" /> : initials}
    </div>
  );
}

const SECTION_LABELS: Record<string, string> = {
  testnet: "测试网", ido: "IDO", security: "安全", integration: "集成",
  airdrop: "空投", events: "活动", funding: "融资", jobs: "招聘",
  nodes: "节点", showcase: "展示", ecosystem: "生态", partners: "合作",
  hackathon: "黑客松", ama: "AMA", bugbounty: "漏洞赏金", community: "社区",
  developer: "开发者", kol: "KOL",
};

// ── Pinned card: structured layout ───────────────────────
function PostPinnedCard({ post }: { post: any }) {
  const { t, lang } = useLang();
  const cd = post.pinnedUntil ? countdown(post.pinnedUntil) : "";
  const sectionLabel = t(`nav_${post.section}` as any) || post.section;
  const dateLocale = DATE_LOCALES[lang] ?? enUS;
  const timeAgo = post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: false, locale: dateLocale }) : "";
  const displayName = post.authorName ?? `${post.authorWallet?.slice(0, 6)}...`;
  return (
    <Link href={`/section/${post.section}`}
      className="relative rounded-2xl bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800/50 overflow-hidden flex flex-col p-4 hover:shadow-lg hover:shadow-rose-100 dark:hover:shadow-rose-950/30 hover:border-red-400 dark:hover:border-red-600 transition-all group cursor-pointer h-full shadow-sm shadow-rose-100/50 dark:shadow-rose-950/20">
      <span className="absolute inset-0 rounded-2xl ring-1 ring-rose-300/30 dark:ring-rose-700/20 pointer-events-none" />
      {/* 时间 — top-right */}
      <div className="flex justify-end mb-1">
        <span className="text-xs text-muted-foreground">{timeAgo}</span>
      </div>
      {/* LOGO left + 名字 & 分区 right */}
      <div className="flex items-center gap-3 mb-2">
        <AuthorAvatar wallet={post.authorWallet} name={post.authorName} avatar={post.authorAvatar} size="xl" />
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-foreground leading-snug break-words">{displayName}</p>
          <span className="inline-block mt-1 text-xs text-primary font-semibold px-2.5 py-0.5 rounded-full bg-primary/10">{sectionLabel}</span>
        </div>
      </div>
      {/* 标题 */}
      <p className="text-sm font-bold text-foreground line-clamp-1 leading-snug mb-1">{post.title}</p>
      {/* 内容 */}
      {post.content && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-snug flex-1">{post.content}</p>
      )}
      {/* flex-1 spacer if no content */}
      {!post.content && <div className="flex-1" />}
      {/* 倒计时 — bottom-left */}
      {cd && (
        <span className="self-start mt-2 text-xs text-red-500 font-bold bg-red-50 dark:bg-red-950/30 px-2.5 py-1 rounded-full">{cd}</span>
      )}
    </Link>
  );
}

function PinnedSlotEmpty() {
  return (
    <div className="rounded-xl border border-rose-200/40 dark:border-rose-800/20 bg-rose-50/20 dark:bg-rose-950/5 h-full" />
  );
}

// ── Regular post card (2-col split layout) ───────────────
function PostRegularCard({ post, num }: { post: any; num: number }) {
  const { t } = useLang();
  const displayName = post.authorName ?? `${post.authorWallet?.slice(0, 6)}...`;
  const sectionLabel = t(`nav_${post.section}` as any) || post.section;
  return (
    <Link href={`/section/${post.section}`}
      className="flex items-center gap-3 px-5 py-5 rounded-2xl border border-border/30 bg-card hover:border-primary/40 hover:bg-primary/5 transition-all group cursor-pointer">
      {/* 序号 */}
      <span className={`text-base font-bold w-9 shrink-0 text-center ${num <= 3 ? "text-red-500" : "text-muted-foreground/50"}`}>{num}</span>
      {/* 头像 */}
      <div className="shrink-0">
        <AuthorAvatar wallet={post.authorWallet} name={post.authorName} avatar={post.authorAvatar} size="lg" />
      </div>
      {/* 名字 + 主题 */}
      <div className="w-36 shrink-0 min-w-0">
        <p className="text-base font-semibold text-foreground truncate">{displayName}</p>
        <p className="text-sm text-muted-foreground truncate mt-0.5">{post.title}</p>
      </div>
      {/* 内容 */}
      <div className="flex-1 min-w-0 px-2">
        <p className="text-sm text-muted-foreground truncate">{post.content || ""}</p>
      </div>
      {/* 区域 */}
      <span className="shrink-0 text-sm font-semibold px-3.5 py-1.5 rounded-full bg-primary/10 text-primary">{sectionLabel}</span>
      {/* 查看 */}
      <span className="shrink-0 flex items-center gap-1 text-base text-primary font-semibold group-hover:underline whitespace-nowrap">
        <Eye className="w-4 h-4" /> {t("view")}
      </span>
    </Link>
  );
}

export default function Home() {
  const { t } = useLang();
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

  // Regular posts (project-type only)
  const { data: postsData, isLoading } = useQuery({
    queryKey: ["/api/posts", "home-regular", page],
    queryFn: async () => {
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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-900/50 rounded-2xl px-6 py-5 space-y-4">
        <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 leading-snug">
          {t("encouragement")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-11 pr-4 py-2.5 rounded-full border border-border dark:border-slate-700 bg-white dark:bg-slate-800 text-sm placeholder-muted-foreground dark:placeholder-slate-400 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all shadow-sm" />
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
      <section className="pt-6">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t("pinned")}</h2>
          <span className="w-2 h-2 rounded-full bg-[#00FF9F] shadow-[0_0_8px_#00FF9F] animate-pulse" />
          <span className="text-xs text-muted-foreground ml-1">
            置顶区（项目方专属 · {pinnedPosts.length}/{PIN_SLOTS} 已占用 · 3天倒计时）
          </span>
        </div>
        {/* 4 cols on md+, 2 on mobile — always 16 equal slots, ~3x larger than before */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {pinnedSlots.map((post, i) => (
            <div key={post ? `post-${post.id}` : `empty-${i}`} className="aspect-[3/2]">
              {post ? <PostPinnedCard post={post} /> : <PinnedSlotEmpty />}
            </div>
          ))}
        </div>
      </section>

      {/* ── Regular Zone: 20/page, no cap ── */}
      <section className="pt-48">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t("regular")}</h2>
            <span className="text-xs text-muted-foreground">（项目方帖子 · 最新优先）</span>
          </div>
          {total > 0 && (
            <span className="text-xs text-muted-foreground">{t("total")} {total} 条</span>
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
