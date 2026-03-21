import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Heart, MessageCircle, ArrowLeft, Pin, Clock, User, Eye } from "lucide-react";
import { useState } from "react";
import { useWeb3Auth } from "@/lib/web3";
import { generateGradient, truncateAddress } from "@/lib/utils";
import { RoleBadge } from "@/components/role-badge";
import { formatDistanceToNow } from "date-fns";
import { useLang } from "@/lib/i18n";

function getApiBase() {
  const base = import.meta.env.BASE_URL ?? "/";
  const parts = base.replace(/\/$/, "").split("/");
  parts.pop();
  return parts.join("/") + "/api";
}

const SECTION_KEY_MAP: Record<string, string> = {
  testnet: "sTestnetLabel", ido: "sIdoLabel", security: "sSecurityLabel",
  integration: "sIntegrationLabel", airdrop: "sAirdropLabel", events: "sEventsLabel",
  funding: "sFundingLabel", jobs: "sJobsLabel", nodes: "sNodesLabel",
  showcase: "sShowcaseLabel", ecosystem: "sEcosystemLabel", partners: "sPartnersLabel",
  hackathon: "sHackathonLabel", ama: "sAmaLabel", bugbounty: "sBugbountyLabel",
  community: "nav_community", developer: "nav_developer",
};

export default function PostDetail() {
  const [, params] = useRoute("/post/:id");
  const postId = Number(params?.id);
  const { address, isConnected } = useWeb3Auth();
  const { t } = useLang();
  const apiBase = getApiBase();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/posts", postId],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/posts/${postId}`);
      if (!res.ok) throw new Error("Post not found");
      return res.json();
    },
    enabled: !!postId && !isNaN(postId),
  });

  const post = data?.post ?? data;

  const [likes, setLikes] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentOpen, setCommentOpen] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [pinning, setPinning] = useState(false);
  const [pinMsg, setPinMsg] = useState("");
  const [pinConfirmOpen, setPinConfirmOpen] = useState(false);

  const likeCount = likes ?? post?.likes ?? 0;
  const commentCount = comments ?? post?.comments ?? 0;

  const handleLike = async () => {
    if (!isConnected || liked || !post) return;
    const res = await fetch(`${apiBase}/posts/${post.id}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: address }),
    });
    const d = await res.json();
    setLikes(d.likes);
    setLiked(true);
  };

  const handleComment = async () => {
    if (!isConnected || !commentText.trim() || !post) return;
    setCommenting(true);
    setCommentError("");
    try {
      const res = await fetch(`${apiBase}/posts/${post.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address, content: commentText.trim() }),
      });
      const d = await res.json();
      if (res.status === 403 && d?.error === "BANNED") {
        setCommentError(t("bannedError"));
        return;
      }
      setComments(d.comments ?? commentCount + 1);
      setCommentText("");
      setCommentOpen(false);
    } finally {
      setCommenting(false);
    }
  };

  const doPin = async () => {
    if (!address || !post) return;
    setPinConfirmOpen(false);
    setPinning(true);
    setPinMsg("");
    try {
      const res = await fetch(`${apiBase}/posts/${post.id}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address }),
      });
      const d = await res.json();
      if (!res.ok) {
        setPinMsg(d.error === "No pin credits" ? "❌ 置顶次数不足" : `❌ ${d.error}`);
        return;
      }
      if (d.queued) {
        let waitStr = "";
        if (d.estimatedAt) {
          const ms = Math.max(0, new Date(d.estimatedAt).getTime() - Date.now());
          const h = Math.floor(ms / 3_600_000);
          const m = Math.floor((ms % 3_600_000) / 60_000);
          waitStr = h > 0 ? ` · 等待约 ${h}小时${m}分` : ` · 等待约 ${m}分钟`;
        }
        setPinMsg(`置顶排队中${waitStr}`);
      } else {
        setPinMsg("✅ 置顶成功！");
      }
    } finally {
      setPinning(false);
    }
  };

  const handlePin = () => {
    if (!address || pinning) return;
    setPinMsg("");
    setPinConfirmOpen(true);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center animate-pulse text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-2xl font-bold mb-3">帖子不存在</p>
        <p className="text-muted-foreground mb-6">该帖子可能已被删除或链接无效。</p>
        <Link href="/" className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors">
          <ArrowLeft className="w-4 h-4" /> 返回首页
        </Link>
      </div>
    );
  }

  const displayName = post.authorName ?? truncateAddress(post.authorWallet);
  const authorHref = `/profile/${post.authorWallet}`;
  const sectionLabel = t(SECTION_KEY_MAP[post.section] ?? post.section) || post.section;

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-4">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> 返回首页
      </Link>

      {/* ── Pin banner (project posts, all connected users) ── */}
      {isConnected && post.authorType === "project" && !post.isPinned && (
        <div className="flex items-start gap-3 px-4 py-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-2xl">
          <Pin className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
          {pinMsg ? (
            <span className="text-sm text-violet-600 dark:text-violet-400 font-medium flex-1">{pinMsg}</span>
          ) : pinConfirmOpen ? (
            <div className="flex-1">
              <p className="text-sm text-violet-800 dark:text-violet-200 mb-2.5">
                {address?.toLowerCase() === post.authorWallet?.toLowerCase()
                  ? "你要置顶此帖吗？将消耗 1 次置顶次数"
                  : "你要帮助此帖置顶吗？将消耗 1 次置顶次数"}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPinConfirmOpen(false)}
                  className="px-4 py-1.5 rounded-lg text-xs bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">取消</button>
                <button onClick={doPin} disabled={pinning}
                  className="px-4 py-1.5 rounded-lg text-xs bg-violet-500 text-white hover:bg-violet-600 transition-colors disabled:opacity-50">
                  {pinning ? "处理中..." : "确定"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between flex-1">
              <span className="text-sm text-violet-700 dark:text-violet-300">
                {address?.toLowerCase() === post.authorWallet?.toLowerCase()
                  ? "置顶你的帖子到首页精华区"
                  : "帮助此帖置顶到首页精华区"}
              </span>
              <button onClick={handlePin} disabled={pinning}
                className="ml-3 px-4 py-1.5 rounded-lg text-xs font-semibold bg-violet-500 text-white hover:bg-violet-600 transition-colors disabled:opacity-50 shrink-0">
                置顶
              </button>
            </div>
          )}
        </div>
      )}

      {/* Post card */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">

        {/* Pinned badge */}
        {post.isPinned && (
          <div className="flex items-center gap-1.5 text-violet-500 text-xs font-semibold">
            <Pin className="w-3.5 h-3.5" /> 置顶中
            {post.pinnedUntil && (
              <span className="ml-1 opacity-60 font-normal">
                (到期 {formatDistanceToNow(new Date(post.pinnedUntil))} 后)
              </span>
            )}
          </div>
        )}

        {/* Author */}
        <div className="flex items-start gap-3">
          <Link href={authorHref}>
            <div
              className="w-11 h-11 rounded-full shrink-0 border-2 border-border overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
              style={{ background: post.authorAvatar ? `url(${post.authorAvatar}) center/cover` : generateGradient(post.authorWallet) }}
            />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={authorHref} className="font-semibold text-sm hover:text-primary transition-colors">{displayName}</Link>
              <RoleBadge spaceType={post.authorType} size="xs" />
              <span className="text-xs text-primary/70 bg-primary/8 px-2 py-0.5 rounded-full">#{sectionLabel}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(post.createdAt))} 前
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          <h1 className="text-xl font-bold text-foreground mb-3 leading-snug">{post.title}</h1>
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-border/40">
          <button
            onClick={handleLike}
            disabled={liked || !isConnected}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${liked ? "text-pink-500" : "text-muted-foreground hover:text-pink-500"}`}
          >
            <Heart className={`w-4 h-4 ${liked ? "fill-pink-500" : ""}`} /> {likeCount}
          </button>
          <button
            onClick={() => setCommentOpen(v => !v)}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${commentOpen ? "text-blue-500" : "text-muted-foreground hover:text-blue-500"}`}
          >
            <MessageCircle className="w-4 h-4" /> {commentCount}
          </button>
          <div className="ml-auto flex items-center gap-2">
            <span className="flex items-center gap-1 text-sm text-muted-foreground/60 pr-1">
              <Eye className="w-4 h-4" /> {(post.views ?? 0).toLocaleString()}
            </span>
            <Link
              href={authorHref}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="查看用户主页"
            >
              <User className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Comment box */}
        {commentOpen && (
          <div className="flex flex-col gap-1.5 pt-2">
            {commentError && <p className="text-sm text-red-500">{commentError}</p>}
            <div className="flex gap-2">
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder={t("commentPlaceholder")}
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              onKeyDown={e => e.key === "Enter" && handleComment()}
            />
            <button
              onClick={handleComment}
              disabled={commenting || !commentText.trim()}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {commenting ? "..." : t("commentSubmit")}
            </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
