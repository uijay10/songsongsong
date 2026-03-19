import { useState } from "react";
import { Heart, MessageCircle, Copy, Check, Pin, User } from "lucide-react";

const SECTION_KEY_MAP: Record<string, string> = {
  testnet: "sTestnetLabel", ido: "sIdoLabel", security: "sSecurityLabel",
  integration: "sIntegrationLabel", airdrop: "sAirdropLabel", events: "sEventsLabel",
  funding: "sFundingLabel", jobs: "sJobsLabel", nodes: "sNodesLabel",
  showcase: "sShowcaseLabel", ecosystem: "sEcosystemLabel", partners: "sPartnersLabel",
  hackathon: "sHackathonLabel", ama: "sAmaLabel", bugbounty: "sBugbountyLabel",
  community: "nav_community", kol: "nav_kol", developer: "nav_developer",
};
import { formatDistanceToNow } from "date-fns";
import { useLikePost } from "@workspace/api-client-react";
import { useWeb3Auth } from "@/lib/web3";
import { generateGradient, truncateAddress } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { Link } from "wouter";
import { isAdmin } from "@/lib/admin";

function getApiBase() {
  const base = import.meta.env.BASE_URL ?? "/";
  const parts = base.replace(/\/$/, "").split("/");
  parts.pop();
  return parts.join("/") + "/api";
}
const apiBase = getApiBase();

interface PostCardPost {
  id: number;
  title: string;
  content: string;
  section: string;
  authorWallet: string;
  authorName?: string | null;
  authorAvatar?: string | null;
  authorType?: string | null;
  likes: number;
  comments: number;
  isPinned?: boolean;
  pinnedUntil?: string | null;
  createdAt: string;
}

interface PostCardProps {
  post: PostCardPost;
  onRefresh?: () => void;
  showPin?: boolean;
  compact?: boolean;
}

export function PostCard({ post, onRefresh, showPin, compact }: PostCardProps) {
  const { address, isConnected } = useWeb3Auth();
  const { t } = useLang();
  const likeMutation = useLikePost();
  const admin = isAdmin(address);

  const [likes, setLikes] = useState(post.likes);
  const [comments, setComments] = useState(post.comments);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [pinning, setPinning] = useState(false);

  const displayName = post.authorName ?? truncateAddress(post.authorWallet);
  const authorHref = `/profile/${post.authorWallet}`;

  const handleLike = () => {
    if (!isConnected || liked) return;
    likeMutation.mutate(
      { id: post.id, data: { wallet: address ?? "" } },
      {
        onSuccess: (res) => {
          setLikes(res.likes);
          setLiked(true);
        },
      }
    );
  };

  const handleComment = async () => {
    if (!isConnected || !commentText.trim()) return;
    setCommenting(true);
    try {
      const res = await fetch(`${apiBase}/posts/${post.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address, content: commentText.trim() }),
      });
      const data = await res.json();
      setComments(data.comments ?? comments + 1);
      setCommentText("");
      setCommentOpen(false);
    } finally {
      setCommenting(false);
    }
  };

  const handlePin = async () => {
    if (!address) return;
    setPinning(true);
    try {
      await fetch(`${apiBase}/posts/${post.id}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address, hours: 24 }),
      });
      onRefresh?.();
    } finally {
      setPinning(false);
    }
  };

  const handleCopy = () => {
    const url = window.location.origin + `/post/${post.id}`;
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  if (compact) {
    return (
      <div className={`bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all ${post.isPinned ? "ring-1 ring-violet-400/50 bg-violet-50/20 dark:bg-violet-950/10" : ""}`}>
        {post.isPinned && (
          <div className="flex items-center gap-1 text-violet-500 text-xs font-semibold mb-2">
            <Pin className="w-3 h-3" /> {t("pinCount")}
          </div>
        )}
        <div className="flex items-start gap-3">
          <Link href={authorHref}>
            <div className="w-8 h-8 rounded-full shrink-0 border border-border overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/40"
              style={{ background: post.authorAvatar ? `url(${post.authorAvatar}) center/cover` : generateGradient(post.authorWallet) }}>
              {!post.authorAvatar && <div className="w-full h-full" />}
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <Link href={authorHref} className="text-xs font-semibold text-foreground hover:text-primary transition-colors">{displayName}</Link>
              {post.authorType && (
                <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">{post.authorType}</span>
              )}
              <span className="text-[10px] text-muted-foreground ml-auto">{formatDistanceToNow(new Date(post.createdAt))} ago</span>
            </div>
            <p className="font-semibold text-sm text-foreground line-clamp-1">{post.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{post.content}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border/40">
          <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">#{t(SECTION_KEY_MAP[post.section] ?? post.section) || post.section}</span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={handleLike} disabled={liked || !isConnected}
              className={`flex items-center gap-1 text-xs transition-colors ${liked ? "text-pink-500" : "text-muted-foreground hover:text-pink-500"}`}>
              <Heart className={`w-3.5 h-3.5 ${liked ? "fill-pink-500" : ""}`} />{likes}
            </button>
            <button onClick={() => setCommentOpen(v => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-blue-500 transition-colors">
              <MessageCircle className="w-3.5 h-3.5" />{comments}
            </button>
            <button onClick={handleCopy} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {(showPin || admin) && (
              <button onClick={handlePin} disabled={pinning} title="Pin post"
                className="text-xs text-muted-foreground hover:text-violet-500 transition-colors">
                <Pin className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        {commentOpen && (
          <div className="mt-3 flex gap-2">
            <input value={commentText} onChange={e => setCommentText(e.target.value)}
              placeholder={t("commentPlaceholder")}
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button onClick={handleComment} disabled={commenting || !commentText.trim()}
              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50">
              {commenting ? "..." : t("commentSubmit")}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all ${post.isPinned ? "ring-1 ring-violet-400/50 bg-violet-50/20 dark:bg-violet-950/10" : ""}`}>
      {post.isPinned && (
        <div className="flex items-center gap-1 text-violet-500 text-xs font-semibold mb-3">
          <Pin className="w-3.5 h-3.5" /> {t("pinned")}
          {post.pinnedUntil && <span className="ml-1 opacity-60 font-normal">(expires {formatDistanceToNow(new Date(post.pinnedUntil))})</span>}
        </div>
      )}

      {/* Author header */}
      <div className="flex items-start gap-3 mb-4">
        <Link href={authorHref}>
          <div className="w-10 h-10 rounded-full shrink-0 border border-border overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/40"
            style={{ background: post.authorAvatar ? `url(${post.authorAvatar}) center/cover` : generateGradient(post.authorWallet) }}>
            {!post.authorAvatar && <div className="w-full h-full" />}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={authorHref} className="font-semibold text-sm hover:text-primary transition-colors">{displayName}</Link>
            {post.authorType && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">{post.authorType}</span>
            )}
            <span className="text-xs text-primary/70 bg-primary/8 px-2 py-0.5 rounded-full ml-auto">#{t(SECTION_KEY_MAP[post.section] ?? post.section) || post.section}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(post.createdAt))} ago</div>
        </div>
      </div>

      {/* Content */}
      <h3 className="font-bold text-base mb-2 text-foreground">{post.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{post.content}</p>

      {/* Actions */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/40">
        <button onClick={handleLike} disabled={liked || !isConnected}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${liked ? "text-pink-500" : "text-muted-foreground hover:text-pink-500"}`}>
          <Heart className={`w-4 h-4 ${liked ? "fill-pink-500" : ""}`} /> {likes}
        </button>
        <button onClick={() => setCommentOpen(v => !v)}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${commentOpen ? "text-blue-500" : "text-muted-foreground hover:text-blue-500"}`}>
          <MessageCircle className="w-4 h-4" /> {comments}
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={handleCopy} title="Copy link"
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
          {(showPin || admin) && (
            <button onClick={handlePin} disabled={pinning} title="Pin post"
              className="p-1.5 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/30 text-muted-foreground hover:text-violet-600 transition-colors">
              <Pin className="w-4 h-4" />
            </button>
          )}
          <Link href={authorHref}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="View profile">
            <User className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Comment box */}
      {commentOpen && (
        <div className="mt-3 flex gap-2">
          <input value={commentText} onChange={e => setCommentText(e.target.value)}
            placeholder={t("commentPlaceholder")}
            className="flex-1 text-sm px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            onKeyDown={e => e.key === "Enter" && handleComment()}
          />
          <button onClick={handleComment} disabled={commenting || !commentText.trim()}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors">
            {commenting ? "..." : t("commentSubmit")}
          </button>
        </div>
      )}
    </div>
  );
}
