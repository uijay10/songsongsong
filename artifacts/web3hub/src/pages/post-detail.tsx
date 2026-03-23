import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Heart, MessageCircle, ArrowLeft, Pin, Eye, User, Share2 } from "lucide-react";
import { filterContent, filterErrorMessage } from "@/lib/content-filter";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useWeb3Auth } from "@/lib/web3";
import { generateGradient, truncateAddress } from "@/lib/utils";
import { RoleBadge } from "@/components/role-badge";
import { formatDistanceToNow, format } from "date-fns";
import { zhCN, enUS, de, ru, fr, ja, ko, vi } from "date-fns/locale";
import { useLang } from "@/lib/i18n";
import { isAdmin } from "@/lib/admin";
import { AdminPinModal } from "@/components/post-card";

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

const DATE_LOCALES: Record<string, Locale> = {
  "zh-CN": zhCN, "en": enUS, "de": de, "ru": ru, "fr": fr, "ja": ja, "ko": ko, "vi": vi,
};

const DATE_FORMATS: Record<string, string> = {
  "zh-CN": "yyyy年M月d日 HH:mm",
  "ja": "yyyy年M月d日 HH:mm",
  "ko": "yyyy년 M월 d일 HH:mm",
  "de": "d. MMMM yyyy, HH:mm 'Uhr'",
  "ru": "d MMMM yyyy, HH:mm",
  "fr": "d MMMM yyyy 'à' HH:mm",
  "vi": "HH:mm, d MMMM yyyy",
  "en": "h:mm a · MMM d, yyyy",
};

export default function PostDetail() {
  const [, params] = useRoute("/post/:id");
  const postId = Number(params?.id);
  const { address, isConnected } = useWeb3Auth();
  const { t, lang } = useLang();
  const apiBase = getApiBase();
  const dateLocale = DATE_LOCALES[lang] ?? enUS;

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
  const [adminPinOpen, setAdminPinOpen] = useState(false);
  const [adminPinHours, setAdminPinHours] = useState<number | "">(72);
  const [adminPinCustom, setAdminPinCustom] = useState(false);
  const [copied, setCopied] = useState(false);
  const admin = isAdmin(address);

  const likeCount = likes ?? post?.likes ?? 0;
  const commentCount = comments ?? post?.comments ?? 0;
  const viewCount = post?.views ?? 0;

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
    const filterResult = filterContent(commentText.trim());
    if (!filterResult.ok) { setCommentError(filterErrorMessage(filterResult)); return; }
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
        setPinMsg(d.error === "No pin credits" ? t("pinNoCredits") : `❌ ${d.error}`);
        return;
      }
      if (d.queued) {
        let waitStr = "";
        if (d.estimatedAt) {
          const ms = Math.max(0, new Date(d.estimatedAt).getTime() - Date.now());
          const h = Math.floor(ms / 3_600_000);
          const m = Math.floor((ms % 3_600_000) / 60_000);
          waitStr = h > 0
            ? " " + t("pinWaitHM").replace("{h}", String(h)).replace("{m}", String(m))
            : " " + t("pinWaitM").replace("{m}", String(m));
        }
        setPinMsg(t("pinQueuedMsg") + waitStr);
      } else {
        setPinMsg(t("pinSuccess"));
      }
    } finally {
      setPinning(false);
    }
  };

  const doAdminPin = async () => {
    if (!address || !post) return;
    const hours = Number(adminPinHours);
    if (!hours || hours < 1) return;
    setAdminPinOpen(false);
    setPinning(true);
    setPinMsg("");
    try {
      const res = await fetch(`${apiBase}/posts/${post.id}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address, durationHours: hours }),
      });
      const d = await res.json();
      if (!res.ok) {
        setPinMsg(`❌ ${d.error}`);
        return;
      }
      const successKey = hours >= 24 ? "adminPinSuccessD" : "adminPinSuccessH";
      const n = hours >= 24 ? Math.round(hours / 24) : hours;
      setPinMsg(t(successKey).replace("{n}", String(n)));
    } finally {
      setPinning(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-[620px] mx-auto">
        <div className="flex items-center gap-4 px-4 py-3 border-b border-border/30">
          <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          <div className="h-5 w-16 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="w-11 h-11 rounded-full bg-muted animate-pulse shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="px-4 space-y-3">
          <div className="h-7 w-3/4 bg-muted rounded animate-pulse" />
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-[620px] mx-auto py-16 text-center">
        <p className="text-2xl font-semibold mb-3">{t("postDetailNotFound")}</p>
        <p className="text-muted-foreground mb-6 text-sm">{t("postDetailNotFoundDesc")}</p>
        <Link href="/" className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t("postDetailBackHome")}
        </Link>
      </div>
    );
  }

  const displayName = post.authorName ?? truncateAddress(post.authorWallet);
  const authorHref = `/profile/${post.authorWallet}`;
  const sectionLabel = t(SECTION_KEY_MAP[post.section] ?? post.section) || post.section;
  const postDate = new Date(post.createdAt);
  const isSelfPost = address?.toLowerCase() === post.authorWallet?.toLowerCase();

  return (
    <div className="max-w-[620px] mx-auto">

      {/* ── Top bar ── */}
      <div className="flex items-center gap-5 px-4 py-3 sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border/30">
        <Link href="/"
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted transition-colors text-foreground"
          title={t("back") || "Back"}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="text-lg font-semibold">{t("postDetailTitle")}</span>
      </div>

      {/* ── Admin pin banner ── */}
      {isConnected && admin && (
        <div className="flex items-center gap-3 mx-4 mt-4 px-4 py-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-2xl">
          <Pin className="w-4 h-4 text-violet-500 shrink-0" />
          {pinMsg ? (
            <span className="text-sm text-violet-600 dark:text-violet-400 flex-1">{pinMsg}</span>
          ) : (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <div className="min-w-0">
                <span className="text-sm text-violet-700 dark:text-violet-300 font-medium">
                  {post.isPinned ? t("pinBannerAdminReset") : t("pinBannerAdminNew")}
                </span>
                <span className="ml-2 text-[10px] text-violet-400 bg-violet-100 dark:bg-violet-900/40 px-1.5 py-0.5 rounded-full">{t("pinBannerFree")}</span>
              </div>
              <button onClick={() => { setPinMsg(""); setAdminPinHours(72); setAdminPinCustom(false); setAdminPinOpen(true); }} disabled={pinning}
                className="ml-3 px-4 py-1.5 rounded-lg text-xs bg-violet-500 text-white hover:bg-violet-600 transition-colors disabled:opacity-50 shrink-0">
                {pinning ? t("pinBannerProcessing") : t("pinBannerPin")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Regular pin banner (non-admin, project posts only) ── */}
      {isConnected && !admin && post.authorType === "project" && !post.isPinned && (
        <div className="flex items-start gap-3 mx-4 mt-4 px-4 py-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-2xl">
          <Pin className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
          {pinMsg ? (
            <span className="text-sm text-violet-600 dark:text-violet-400 flex-1">{pinMsg}</span>
          ) : pinConfirmOpen ? (
            <div className="flex-1">
              <p className="text-sm text-violet-800 dark:text-violet-200 mb-2.5">
                {isSelfPost ? t("pinConfirmSelf") : t("pinConfirmOther")}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPinConfirmOpen(false)}
                  className="px-4 py-1.5 rounded-lg text-xs bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">{t("cancel")}</button>
                <button onClick={doPin} disabled={pinning}
                  className="px-4 py-1.5 rounded-lg text-xs bg-violet-500 text-white hover:bg-violet-600 transition-colors disabled:opacity-50">
                  {pinning ? t("pinBannerProcessing") : t("pinOk")}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between flex-1">
              <span className="text-sm text-violet-700 dark:text-violet-300">
                {isSelfPost ? t("pinBannerSelfText") : t("pinBannerOtherText")}
              </span>
              <button onClick={() => { setPinMsg(""); setPinConfirmOpen(true); }} disabled={pinning}
                className="ml-3 px-4 py-1.5 rounded-lg text-xs bg-violet-500 text-white hover:bg-violet-600 transition-colors disabled:opacity-50 shrink-0">
                {t("pinBannerPin")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Admin pin duration modal */}
      {adminPinOpen && createPortal(
        <AdminPinModal
          hours={adminPinHours} setHours={setAdminPinHours}
          custom={adminPinCustom} setCustom={setAdminPinCustom}
          pinning={pinning} onConfirm={doAdminPin} onClose={() => setAdminPinOpen(false)}
        />, document.body
      )}

      {/* ── Author row ── */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={authorHref} className="shrink-0">
            <div
              className="w-11 h-11 rounded-full border border-border/40 overflow-hidden hover:ring-2 hover:ring-primary/40 transition-all bg-background"
              style={post.authorAvatar
                ? { backgroundImage: `url(${post.authorAvatar})`, backgroundSize: "cover", backgroundPosition: "center" }
                : { background: generateGradient(post.authorWallet) }}
            />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link href={authorHref} className="font-semibold text-sm hover:underline truncate">{displayName}</Link>
              <RoleBadge spaceType={post.authorType} size="xs" />
            </div>
            <p className="text-xs text-muted-foreground font-mono truncate">{truncateAddress(post.authorWallet)}</p>
          </div>
        </div>
        <Link href={authorHref}
          className="shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-border text-xs font-medium hover:bg-muted transition-colors">
          <User className="w-3.5 h-3.5" />
          {t("postDetailProfile")}
        </Link>
      </div>

      {/* ── Post content ── */}
      <div className="px-4 pb-4">
        {/* Pinned badge */}
        {post.isPinned && (
          <div className="flex items-center gap-1.5 text-violet-500 text-xs mb-3">
            <Pin className="w-3.5 h-3.5" />
            <span>{t("postDetailPinned")}</span>
            {post.pinnedUntil && (
              <span className="text-muted-foreground">
                · {t("postDetailExpires")} {formatDistanceToNow(new Date(post.pinnedUntil), { locale: dateLocale })}{t("postDetailExpiresSuffix") ? " " + t("postDetailExpiresSuffix") : ""}
              </span>
            )}
          </div>
        )}

        {/* Section tag */}
        <div className="mb-3">
          <span className="text-xs text-primary/80 bg-primary/8 px-2.5 py-1 rounded-full">#{sectionLabel}</span>
        </div>

        {/* Title */}
        <h1 className="text-[1.35rem] font-semibold text-foreground leading-snug mb-3 break-words">{post.title}</h1>

        {/* Body */}
        <p className="text-base text-foreground/85 leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere"
          style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
          {post.content}
        </p>
      </div>

      {/* ── Timestamp ── */}
      <div className="px-4 py-3 border-t border-border/30">
        <span className="text-sm text-muted-foreground">
          {format(postDate, DATE_FORMATS[lang] ?? DATE_FORMATS["en"], { locale: dateLocale })}
        </span>
      </div>

      {/* ── Stats bar ── */}
      <div className="flex items-center gap-5 px-4 py-3 border-t border-border/30">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-semibold">{commentCount.toLocaleString()}</span>
          <span className="text-muted-foreground">{t("postDetailCommentCount")}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-semibold">{likeCount.toLocaleString()}</span>
          <span className="text-muted-foreground">{t("postDetailLikeCount")}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-semibold">{viewCount.toLocaleString()}</span>
          <span className="text-muted-foreground">{t("postDetailViewCount")}</span>
        </div>
      </div>

      {/* ── Action bar ── */}
      <div className="flex items-center justify-around px-4 py-1 border-t border-b border-border/30">
        <button
          onClick={() => isConnected && setCommentOpen(v => !v)}
          title={t("postDetailCommentCount")}
          className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm transition-colors group ${
            commentOpen ? "text-blue-500" : "text-muted-foreground hover:text-blue-500 hover:bg-blue-500/8"
          }`}
        >
          <MessageCircle className="w-5 h-5" />
        </button>
        <button
          onClick={handleLike}
          disabled={liked || !isConnected}
          title={t("postDetailLikeCount")}
          className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm transition-colors group ${
            liked ? "text-pink-500" : "text-muted-foreground hover:text-pink-500 hover:bg-pink-500/8"
          } disabled:cursor-default`}
        >
          <Heart className={`w-5 h-5 ${liked ? "fill-pink-500" : ""}`} />
        </button>
        <button
          onClick={handleCopyLink}
          title={t("copiedLink")}
          className="flex items-center gap-2 px-5 py-3 rounded-full text-sm text-muted-foreground hover:text-green-500 hover:bg-green-500/8 transition-colors"
        >
          {copied
            ? <span className="text-xs text-green-500">{t("copiedLink")}</span>
            : <Share2 className="w-5 h-5" />
          }
        </button>
        <span className="flex items-center gap-2 px-5 py-3 text-sm text-muted-foreground/50">
          <Eye className="w-5 h-5" />
        </span>
      </div>

      {/* ── Comment box ── */}
      {commentOpen && (
        <div className="px-4 py-4 border-b border-border/30">
          {isConnected ? (
            <div className="flex gap-3 items-start">
              <div
                className="w-9 h-9 rounded-full shrink-0 border border-border/40"
                style={{ background: generateGradient(address ?? "") }}
              />
              <div className="flex-1 space-y-2">
                {commentError && <p className="text-sm text-red-500">{commentError}</p>}
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder={t("commentPlaceholder")}
                  rows={3}
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleComment}
                    disabled={commenting || !commentText.trim()}
                    className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm disabled:opacity-50 hover:bg-primary/90 transition-colors"
                  >
                    {commenting ? "…" : t("commentSubmit")}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              {t("commentConnect")}
            </p>
          )}
        </div>
      )}

    </div>
  );
}
