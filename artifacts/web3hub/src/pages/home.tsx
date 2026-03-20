import { useState, useEffect } from "react";
import { useGetPosts, useGetMe } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { useWeb3Auth } from "@/lib/web3";
import { Search, PenSquare, ChevronLeft, ChevronRight, CheckCircle2, Eye } from "lucide-react";
import { Link } from "wouter";
import { useLang } from "@/lib/i18n";
import { generateGradient } from "@/lib/utils";

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
  wallet: string; name?: string | null; avatar?: string | null; size?: "sm" | "md";
}) {
  const initials = ((name ?? wallet ?? "?").slice(0, 2)).toUpperCase();
  const cls = size === "md"
    ? "w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white overflow-hidden"
    : "w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden";
  return (
    <div className={cls} style={{ background: generateGradient(wallet ?? "0") }}>
      {avatar ? <img src={avatar} className="w-full h-full object-cover" alt="" /> : initials}
    </div>
  );
}

// ── Pinned card: uniform 2:1 landscape ───────────────────
function PostPinnedCard({ post }: { post: any }) {
  const cd = post.pinnedUntil ? countdown(post.pinnedUntil) : "";
  return (
    <Link href={`/section/${post.section}`}
      className="relative rounded-xl bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800/50 overflow-hidden flex flex-col p-4 hover:shadow-lg hover:shadow-rose-100 dark:hover:shadow-rose-950/30 hover:border-red-400 dark:hover:border-red-600 transition-all group cursor-pointer h-full shadow-sm shadow-rose-100/50 dark:shadow-rose-950/20">
      <span className="absolute inset-0 rounded-xl ring-1 ring-rose-300/30 dark:ring-rose-700/20 pointer-events-none" />
      <div className="flex items-center gap-2.5 mb-2">
        <AuthorAvatar wallet={post.authorWallet} name={post.authorName} avatar={post.authorAvatar} size="md" />
        <p className="text-xs font-semibold text-foreground truncate flex-1 pr-5">{post.authorName ?? `${post.authorWallet?.slice(0, 6)}...`}</p>
      </div>
      <p className="text-sm font-bold text-foreground line-clamp-2 leading-snug flex-1">{post.title}</p>
      {post.content && (
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-snug">{post.content.slice(0, 80)}</p>
      )}
      {cd && (
        <span className="mt-2 self-start text-xs text-red-500 font-bold bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full">{cd}</span>
      )}
    </Link>
  );
}

function PinnedSlotEmpty() {
  return (
    <div className="rounded-xl border border-rose-200/40 dark:border-rose-800/20 bg-rose-50/20 dark:bg-rose-950/5 h-full" />
  );
}

// ── Regular post card ─────────────────────────────────────
function PostRegularCard({ post, num }: { post: any; num: number }) {
  return (
    <Link href={`/section/${post.section}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/30 bg-card hover:border-primary/40 hover:shadow-sm transition-all group cursor-pointer">
      <span className={`text-xs font-bold w-5 shrink-0 text-center ${num <= 3 ? "text-red-500" : "text-muted-foreground"}`}>{num}</span>
      <AuthorAvatar wallet={post.authorWallet} name={post.authorName} avatar={post.authorAvatar} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground truncate leading-none mb-0.5">
          {post.authorName ?? `${post.authorWallet?.slice(0, 6)}...`}
        </p>
        <p className="text-sm font-semibold text-foreground truncate leading-snug">{post.title}</p>
        {post.content && (
          <p className="text-[10px] text-muted-foreground truncate leading-none mt-0.5">{post.content.slice(0, 60)}</p>
        )}
      </div>
      <span className="shrink-0 flex items-center gap-0.5 text-xs text-primary font-semibold group-hover:underline whitespace-nowrap">
        <Eye className="w-3 h-3" /> 查看
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {pinnedSlots.map((post, i) => (
            <div key={post ? `post-${post.id}` : `empty-${i}`} className="aspect-[2/1]">
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

        <div className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => {
                const num = (page - 1) * PAGE_SIZE + i + 1;
                return (
                  <div key={i} className="h-16 rounded-xl border border-border/40 bg-muted/5 flex items-center px-4">
                    <span className="text-xs text-border/40 font-mono font-bold">{num}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => {
                const post = posts[i];
                const globalNum = (page - 1) * PAGE_SIZE + i + 1;
                if (post) return <PostRegularCard key={post.id} post={post} num={globalNum} />;
                return (
                  <div key={`empty-${i}`} className="h-16 rounded-xl border border-border/40 bg-muted/5 flex items-center px-4">
                    <span className="text-xs text-border/40 font-mono font-bold">{globalNum}</span>
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
