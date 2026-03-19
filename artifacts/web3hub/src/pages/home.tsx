import { useState, useEffect } from "react";
import { useGetPosts, useGetMe } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { useWeb3Auth } from "@/lib/web3";
import { Search, Flame, PenSquare, ChevronLeft, ChevronRight, CheckCircle2, Pin, Eye } from "lucide-react";
import { Link } from "wouter";
import { useLang } from "@/lib/i18n";
import { generateGradient } from "@/lib/utils";

const PAGE_SIZE = 20;

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

function AuthorAvatar({ post, size = "sm" }: { post: any; size?: "sm" | "md" }) {
  const initials = ((post.authorName ?? post.authorWallet ?? "??").slice(0, 2)).toUpperCase();
  const cls = size === "md"
    ? "w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white overflow-hidden"
    : "w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden";
  return (
    <div className={cls} style={{ background: generateGradient(post.authorWallet ?? "0") }}>
      {post.authorAvatar
        ? <img src={post.authorAvatar} className="w-full h-full object-cover" alt="" />
        : initials}
    </div>
  );
}

function PostPinnedCard({ post }: { post: any }) {
  const cd = post.pinnedUntil ? countdown(post.pinnedUntil) : "";
  return (
    <Link href={`/post/${post.id}`}
      className="relative aspect-square rounded-xl bg-card border border-amber-200 dark:border-amber-700/50 overflow-hidden flex flex-col items-center justify-center p-2.5 text-center hover:border-primary hover:shadow-md transition-all group">
      <Pin className="absolute top-1.5 right-1.5 w-2.5 h-2.5 text-amber-400" />
      <AuthorAvatar post={post} size="md" />
      <p className="text-[9px] text-muted-foreground truncate w-full mt-1">{post.authorName ?? post.authorWallet?.slice(0, 6)}</p>
      <p className="text-[10px] font-semibold line-clamp-2 leading-snug text-foreground mt-0.5">{post.title}</p>
      {cd && <span className="text-[9px] text-amber-500 font-bold mt-1 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-full">{cd}</span>}
    </Link>
  );
}

function PostRegularCard({ post }: { post: any }) {
  return (
    <Link href={`/post/${post.id}`}
      className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors group">
      <AuthorAvatar post={post} />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground truncate leading-none mb-0.5">
          {post.authorName ?? `${post.authorWallet?.slice(0, 6)}...`}
        </p>
        <p className="text-sm font-semibold text-foreground truncate leading-tight">{post.title}</p>
        {post.content && (
          <p className="text-[10px] text-muted-foreground truncate leading-none mt-0.5">
            {post.content.slice(0, 60)}
          </p>
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
  const spaceStatus = meData?.user?.spaceStatus;
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

  // Pinned posts (direct fetch since `pinned` param not in generated types)
  const { data: pinnedData } = useQuery({
    queryKey: ["/api/posts", "pinned"],
    queryFn: async () => {
      const res = await fetch(`${getApiBase()}/posts?pinned=1&limit=14`);
      return res.json() as Promise<{ posts: any[] }>;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // Regular posts
  const { data: postsData, isLoading } = useGetPosts({ page, limit: PAGE_SIZE });

  // Hot rank posts (top 10 most recent, for now)
  const { data: hotData } = useGetPosts({ page: 1, limit: 10 });

  const pinnedPosts = pinnedData?.posts ?? [];
  const posts = postsData?.posts ?? [];
  const totalPages = postsData?.totalPages ?? 1;
  const total = postsData?.total ?? 0;
  const hotPosts = hotData?.posts ?? [];

  return (
    <div className="space-y-6 pb-4">
      {/* ── Header row ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pt-2">
        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-foreground">Web3Hub</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("tagline")}</p>
        </div>
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

      {/* ── Encouragement + Search ────────── */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-900/50 rounded-2xl px-6 py-5 space-y-4">
        <p className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 leading-snug">
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

      {/* ── Pinned Zone ─────────────────────────────────── */}
      <section className="pt-6">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t("pinned")}</h2>
          <span className="w-2 h-2 rounded-full bg-[#00FF9F] shadow-[0_0_8px_#00FF9F] animate-pulse" />
          <span className="text-xs text-muted-foreground ml-1">置顶帖子（3天倒计时）</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {pinnedPosts.length > 0
            ? pinnedPosts.map(post => <PostPinnedCard key={post.id} post={post} />)
            : Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl border border-dashed border-border/40 bg-muted/10" />
              ))
          }
        </div>
      </section>

      {/* ── Regular Zone + Hot Rank sidebar ─────────────── */}
      <section className="pt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t("regular")}</h2>
          {total > 0 && (
            <span className="text-xs text-muted-foreground">{t("total")} {total} {t("projects")}</span>
          )}
        </div>

        <div className="flex gap-4 items-start">
          {/* ── Left: 2-col numbered post list ── */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-lg border border-dashed border-border/40 bg-muted/10" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-3 gap-y-0">
                {posts.map((post, idx) => {
                  const globalNum = (page - 1) * PAGE_SIZE + idx + 1;
                  return (
                    <div key={post.id} className="flex items-start gap-1.5 border-b border-border/20 last:border-0">
                      <span className="text-xs font-bold text-muted-foreground w-5 shrink-0 text-right pt-2.5">{globalNum}</span>
                      <div className="flex-1 min-w-0 py-1">
                        <PostRegularCard post={post} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Pagination ── */}
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
                </div>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-muted hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* ── Right: Hot Rank sidebar ── */}
          <div className="w-64 shrink-0 hidden lg:block">
            <div className="bg-card dark:bg-slate-800 border border-border dark:border-slate-700 rounded-2xl overflow-hidden sticky top-48">
              <div className="flex items-center gap-2 px-4 py-4 border-b border-border/50 dark:border-slate-700">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-bold text-foreground">{t("hotRank")}</span>
              </div>
              <div className="divide-y divide-border/30 dark:divide-slate-700">
                {hotPosts.length === 0
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-2.5 px-4 py-3">
                        <div className="w-5 h-5 rounded-full bg-muted animate-pulse shrink-0" />
                        <div className="h-3 bg-muted animate-pulse rounded flex-1" />
                      </div>
                    ))
                  : hotPosts.map((post, idx) => (
                      <Link key={post.id} href={`/post/${post.id}`}
                        className="flex items-center gap-2.5 px-4 py-3 hover:bg-muted/50 dark:hover:bg-slate-700/50 transition-colors group">
                        <span className={`text-xs font-bold w-5 shrink-0 text-center ${idx < 3 ? "text-orange-600 dark:text-orange-400 font-extrabold" : "text-muted-foreground"}`}>
                          {idx + 1}
                        </span>
                        <AuthorAvatar post={post} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-muted-foreground truncate">{post.authorName ?? post.authorWallet?.slice(0, 8)}</p>
                          <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {post.title}
                          </p>
                        </div>
                      </Link>
                    ))
                }
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
