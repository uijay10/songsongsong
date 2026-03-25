import { useWeb3Auth } from "@/lib/web3";
import { useCheckin, useUpsertUser, useGetPosts, useGetMe } from "@workspace/api-client-react";
import { generateGradient, truncateAddress } from "@/lib/utils";
import { RoleBadge } from "@/components/role-badge";
import { useState, useEffect, useRef } from "react";
import {
  Zap, Star, Copy, Check, AlertCircle, Gift, Clock, Edit2,
  Pin, Trash2, Save, ShieldCheck, PenSquare, Globe, ExternalLink,
  Users, ChevronDown, ChevronUp, Hash
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLang } from "@/lib/i18n";
import { isAdmin } from "@/lib/admin";
import { Link } from "wouter";
import { PostCard } from "@/components/post-card";
import { SlotMachine } from "@/components/slot-machine";

function getApiBase() {
  const base = import.meta.env.BASE_URL ?? "/";
  const parts = base.replace(/\/$/, "").split("/");
  parts.pop();
  return parts.join("/") + "/api";
}
const apiBase = getApiBase();

/* ─── Countdown ──────────────────────────────────────── */
function useCountdown(targetIso: string | null | undefined) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    if (!targetIso) { setRemaining(""); return; }
    const tick = () => {
      const diff = new Date(targetIso).getTime() - Date.now();
      if (diff <= 0) { setRemaining(""); return; }
      const d = Math.floor(diff / 86_400_000);
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setRemaining(d > 0 ? `${d}d ${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}` : `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);
  return remaining;
}

/* ─── Copy Button ──────────────────────────────────────── */
function CopyBtn({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
      className={`p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground ${className}`}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

/* ─── Info Row ─────────────────────────────────────────── */
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/40 last:border-0">
      <span className="w-28 shrink-0 text-sm text-muted-foreground font-medium pt-0.5">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

/* ─── Space Status Badge ────────────────────────────────── */
function SpaceStatusBadge({ status, rejectedAt }: { status?: string | null; rejectedAt?: string | null }) {
  const { t } = useLang();
  const reapplyTarget = rejectedAt ? new Date(new Date(rejectedAt).getTime() + 7 * 86_400_000).toISOString() : null;
  const canReapply = reapplyTarget ? new Date(reapplyTarget).getTime() <= Date.now() : true;
  const countdown = useCountdown(canReapply ? null : reapplyTarget);

  if (!status || status === "none") {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground">{t("spaceNo")}</span>
        <Link href="/apply" className="text-xs text-primary hover:underline">{t("applySpace")}</Link>
      </div>
    );
  }
  if (status === "approved" || status === "active") {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
        <Check className="w-3 h-3" /> {t("spaceYes")}
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
        <Clock className="w-3 h-3" /> {t("spacePending")}
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
          {t("spaceRejected")}
        </span>
        {canReapply ? (
          <Link href="/apply" className="text-xs text-primary hover:underline">{t("applySpace")}</Link>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" /> {t("reapplyIn")} <span className="font-mono font-bold text-foreground">{countdown}</span>
          </span>
        )}
      </div>
    );
  }
  if (status === "banned") {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
        {t("spaceBanned")}
      </span>
    );
  }
  return null;
}

/* ─── Main Component ────────────────────────────────────── */
export default function Profile() {
  const { address, isConnected, user, isLoading: userLoading } = useWeb3Auth();
  const checkinMutation = useCheckin();
  const upsertMutation = useUpsertUser();
  const queryClient = useQueryClient();
  const { data: meData, isLoading: meLoading } = useGetMe(
    { wallet: address ?? "" },
    { query: { enabled: !!address } }
  );
  const { data: userPosts, refetch: refetchPosts } = useGetPosts(
    { authorWallet: address ?? "" } as any,
    { query: { enabled: !!address } }
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const admin = isAdmin(address);
  const me = (meData as any)?.user ?? meData;

  const [twitter, setTwitter] = useState("");
  const [website, setWebsite] = useState("");
  const [username, setUsername] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle"|"saving"|"saved">("idle");
  const [invitedUsers, setInvitedUsers] = useState<any[]>([]);
  const [showInvited, setShowInvited] = useState(false);
  const [deletingId, setDeletingId] = useState<number|null>(null);
  const [tokenCount, setTokenCount] = useState<number>(0);
  const [lastSlotPull, setLastSlotPull] = useState<string | null>(null);
  const [energyCount, setEnergyCount] = useState<number | null>(null);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeAmt, setExchangeAmt] = useState(200);
  const [exchanging, setExchanging] = useState(false);
  const [exchangeErr, setExchangeErr] = useState("");

  const { t, lang } = useLang();
  const isSpaceOwner = me?.spaceStatus === "approved" || me?.spaceStatus === "active";
  const spaceType = me?.spaceType;
  const canCheckin = true;

  const nextCheckin = me?.lastCheckin
    ? new Date(new Date(me.lastCheckin).getTime() + 86_400_000).toISOString()
    : null;
  const checkinCountdown = useCountdown(nextCheckin);
  const checkinReady = !nextCheckin || new Date(nextCheckin).getTime() <= Date.now();

  useEffect(() => {
    if (me) {
      setTwitter(me.twitter ?? "");
      setWebsite(me.website ?? "");
      setUsername(me.username ?? "");
      setSelectedTags(me.tags ?? []);
      setTokenCount(me.tokens ?? 0);
      setLastSlotPull(me.lastSlotPull ?? null);
      setEnergyCount(me.energy ?? 0);
    }
  }, [me]);

  useEffect(() => {
    if (!address || !showInvited) return;
    fetch(`${apiBase}/users/invited?wallet=${address}`)
      .then(r => r.json())
      .then(d => setInvitedUsers(d.users ?? []));
  }, [address, showInvited]);

  const markDirty = (setter: (v: string) => void) => (v: string) => { setter(v); setDirty(true); };

  const handleSave = () => {
    if (!address || !dirty) return;
    setSaveStatus("saving");
    upsertMutation.mutate(
      { data: { wallet: address, twitter: twitter || null, website: website || null, username: username.trim() || undefined, tags: selectedTags } as any },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
          setDirty(false);
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2500);
          setEditingName(false);
        },
        onError: () => setSaveStatus("idle"),
      }
    );
  };

  const handleCheckin = () => {
    if (!address || !checkinReady || !canCheckin) return;
    checkinMutation.mutate(
      { data: { wallet: address } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/users/me"] }) }
    );
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !address) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      upsertMutation.mutate(
        { data: { wallet: address, avatar: ev.target?.result as string } },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/users/me"] }) }
      );
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePost = async (postId: number) => {
    if (!address || !window.confirm(t("confirmDelete"))) return;
    setDeletingId(postId);
    try {
      await fetch(`${apiBase}/posts/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address }),
      });
      refetchPosts();
    } finally {
      setDeletingId(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="py-32 text-center max-w-sm mx-auto">
        <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t("connect")}</h2>
        <p className="text-muted-foreground text-sm">{t("connectDesc")}</p>
      </div>
    );
  }

  if (userLoading || meLoading) {
    return <div className="py-32 text-center animate-pulse text-muted-foreground">Loading...</div>;
  }

  const displayUsername = me?.username || truncateAddress(address);
  const inviteCode = me?.inviteCode ?? "—";
  const inviteCount = me?.inviteCount ?? 0;
  const points = me?.points ?? 0;
  const energy = energyCount !== null ? energyCount : (me?.energy ?? 0);
  const isNormalUser = !spaceType;

  const handleExchange = async () => {
    if (!address || exchanging) return;
    setExchanging(true);
    setExchangeErr("");
    try {
      const res = await fetch(`${apiBase}/users/exchange-energy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address, amount: exchangeAmt }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setExchangeErr(data.error === "INSUFFICIENT_TOKENS" ? "代币不足" : "兑换失败，请重试");
      } else {
        setTokenCount(data.tokens);
        setEnergyCount(data.energy);
        setShowExchangeModal(false);
        setExchangeAmt(200);
      }
    } catch {
      setExchangeErr("网络错误，请重试");
    } finally {
      setExchanging(false);
    }
  };
  const pinCount = me?.pinCount ?? 0;

  /* ── ADMIN VIEW ─────────────────────────────────────────── */
  if (admin) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Avatar + Name */}
        <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-5">
          <div className="relative group cursor-pointer shrink-0" onClick={() => fileRef.current?.click()}>
            <div className="w-20 h-20 rounded-2xl border-2 border-amber-300 shadow-lg bg-transparent"
              style={me?.avatar
                ? { backgroundImage: `url(${me.avatar})`, backgroundSize: "cover", backgroundPosition: "center" }
                : { background: generateGradient(address) }} />
            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Edit2 className="w-5 h-5 text-white" />
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-lg truncate">{displayUsername}</span>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold shrink-0">
                <ShieldCheck className="w-3 h-3" /> Admin
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-mono truncate">{address}</p>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/post/new" className="flex items-center justify-center gap-3 p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all group">
            <PenSquare className="w-7 h-7 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-lg font-bold">{t("adminPostBtn")}</div>
              <div className="text-xs text-blue-100">Create a new post</div>
            </div>
          </Link>
          <Link href="/admin" className="flex items-center justify-center gap-3 p-6 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-2xl shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all group">
            <ShieldCheck className="w-7 h-7 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-lg font-bold">{t("adminReviewBtn")}</div>
              <div className="text-xs text-amber-100">Review applications</div>
            </div>
          </Link>
        </div>

        {/* Admin Posts */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2">{t("myPostsLabel")}</h2>
          {(!userPosts?.posts || userPosts.posts.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t("noPost")}</p>
          ) : (
            <div className="space-y-3">
              {(userPosts.posts as any[]).map((post: any) => (
                <div key={post.id} className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <PostCard post={post} onRefresh={refetchPosts} showPin compact />
                  </div>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    disabled={deletingId === post.id}
                    className="shrink-0 mt-1 p-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    title={t("deletePost")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── REGULAR USER VIEW ──────────────────────────────────── */
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* ── Avatar + Name Header ── */}
      <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-5">
        <div className="relative group cursor-pointer shrink-0" onClick={() => fileRef.current?.click()}>
          <div className="w-20 h-20 rounded-2xl border-2 border-border shadow bg-transparent"
            style={me?.avatar
              ? { backgroundImage: `url(${me.avatar})`, backgroundSize: "cover", backgroundPosition: "center" }
              : { background: generateGradient(address) }} />
          <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Edit2 className="w-5 h-5 text-white" />
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div className="flex-1 min-w-0">
          {editingName && !isSpaceOwner ? (
            <div className="flex items-center gap-2 mb-1">
              <input
                value={username}
                onChange={e => { setUsername(e.target.value); setDirty(true); }}
                placeholder={truncateAddress(address)}
                maxLength={32}
                className="flex-1 text-base bg-muted/50 border border-primary/30 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 font-bold"
                autoFocus
                onKeyDown={e => e.key === "Enter" && handleSave()}
              />
              <button onClick={() => setEditingName(false)} className="text-muted-foreground hover:text-foreground p-1">✕</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1 group flex-wrap">
              <span className="font-bold text-lg truncate">{displayUsername}</span>
              <RoleBadge spaceType={isSpaceOwner ? spaceType : null} size="sm" />
              {!isSpaceOwner && (
                <button onClick={() => setEditingName(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground font-mono truncate">{address}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={!dirty || saveStatus === "saving"}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
            dirty ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          {saveStatus === "saving" ? t("saving") : saveStatus === "saved" ? t("saved") : t("save")}
        </button>
      </div>

      {/* ── 我的资料 Card ── */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-foreground">{t("dashboard")}</h2>
          {!admin && (
            <a
              href="https://x.com/Web3Release"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              {t("followSurprise")}！
            </a>
          )}
        </div>

        {/* 1. 空间用户 */}
        <InfoRow label={t("spaceLabel")}>
          <SpaceStatusBadge status={me?.spaceStatus} rejectedAt={me?.spaceRejectedAt} />
        </InfoRow>

        {/* 1b. 展示标签 (仅 project 类型团队可选) */}
        {isSpaceOwner && spaceType === "project" && (
          <InfoRow label={lang === "zh-CN" ? "展示标签" : "Display Tags"}>
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground">
                {lang === "zh-CN" ? "最多选2个，将显示在首页帖子和子页面" : "Select up to 2 tags — shown on homepage and post pages"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["L1","L2","Infrastructure","DePIN","Node","Validator","DeFi","DEX","RWA","SocialFi","NFT","GameFi","AI"].map(tag => {
                  const active = selectedTags.includes(tag);
                  const disabled = !active && selectedTags.length >= 2;
                  return (
                    <button
                      key={tag}
                      disabled={disabled}
                      onClick={() => {
                        const next = active
                          ? selectedTags.filter(t => t !== tag)
                          : [...selectedTags, tag];
                        setSelectedTags(next);
                        setDirty(true);
                      }}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
                        active
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : disabled
                            ? "bg-muted/30 text-muted-foreground/40 border-border/30 cursor-not-allowed"
                            : "bg-muted/50 text-muted-foreground border-border hover:border-blue-400 hover:text-blue-500"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </InfoRow>
        )}

        {/* 2. 每日抽奖老虎机 – 所有用户可见 */}
        {address && (
          <div className="py-2">
            <SlotMachine
              wallet={address}
              tokens={tokenCount}
              lastSlotPull={lastSlotPull}
              onSuccess={(newTokens, _earned) => {
                setTokenCount(newTokens);
                setLastSlotPull(new Date().toISOString());
              }}
            />
          </div>
        )}


        {/* 4. 我的能量 + 置顶次数 + 兑换按钮 */}
        <InfoRow label={t("energyLabel")}>
          <div className="flex items-center gap-4 flex-wrap justify-between">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-base font-bold text-blue-500">
                <Zap className="w-4 h-4" /> {energy.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">{t("energy")}</span>
              </span>
              <span className="flex items-center gap-1.5 text-base font-bold text-violet-500">
                <Pin className="w-4 h-4" /> {pinCount} <span className="text-xs text-muted-foreground font-normal">{t("pinLabel")}</span>
              </span>
            </div>
            {isNormalUser ? (
              <button
                onClick={() => { setExchangeErr(""); setShowExchangeModal(true); }}
                className="px-4 py-1.5 rounded-full text-sm font-semibold bg-green-500 hover:bg-green-600 text-white transition-colors"
              >
                兑换能量
              </button>
            ) : (
              <button disabled
                className="px-4 py-1.5 rounded-full text-sm font-semibold bg-muted text-muted-foreground cursor-not-allowed"
                title="仅普通用户可用"
              >
                兑换能量
              </button>
            )}
          </div>
        </InfoRow>

        {/* 5. X 链接 */}
        <InfoRow label={t("xLink")}>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={twitter}
              onChange={e => markDirty(setTwitter)(e.target.value)}
              placeholder="https://x.com/yourhandle"
              className="flex-1 text-sm bg-muted/40 border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {twitter && (
              <a href={twitter} target="_blank" rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </InfoRow>

        {/* 6. 网站 */}
        <InfoRow label={t("websiteLink")}>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={website}
              onChange={e => markDirty(setWebsite)(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="flex-1 text-sm bg-muted/40 border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {website && (
              <a href={website} target="_blank" rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors">
                <Globe className="w-4 h-4" />
              </a>
            )}
          </div>
        </InfoRow>

        {/* 7. 钱包地址 */}
        <InfoRow label={t("walletLabel")}>
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <span className="font-mono text-xs text-muted-foreground flex-1 truncate select-all">{address}</span>
            {address && <CopyBtn text={address} />}
          </div>
        </InfoRow>

        {/* 8. 我的邀请码 */}
        <InfoRow label={t("inviteLabel")}>
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 bg-muted/60 rounded-lg px-3 py-1.5">
                <Hash className="w-3.5 h-3.5 text-green-500" />
                <span className="font-mono font-bold tracking-widest text-base">{inviteCode}</span>
                {inviteCode !== "—" && <CopyBtn text={inviteCode} />}
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {t("invitedLabel")} <span className="font-bold text-foreground">{inviteCount}</span> {t("people")}
                </span>
              </div>
              <button
                onClick={() => setShowInvited(v => !v)}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {t("invitedList")} {showInvited ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
            {showInvited && (
              <div className="bg-muted/30 rounded-xl p-3 space-y-2">
                {invitedUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">{t("noInvited")}</p>
                ) : (
                  invitedUsers.map(u => (
                    <div key={u.wallet} className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full shrink-0 bg-transparent"
                        style={u.avatar
                          ? { backgroundImage: `url(${u.avatar})`, backgroundSize: "cover", backgroundPosition: "center" }
                          : { background: generateGradient(u.wallet) }} />
                      <span className="text-sm font-medium truncate">{u.username || truncateAddress(u.wallet)}</span>
                      {u.spaceType && (
                        <RoleBadge spaceType={u.spaceType} size="xs" />
                      )}
                      <span className="text-xs text-muted-foreground ml-auto shrink-0">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </InfoRow>
      </div>

      {/* 9. 我要发帖 */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="text-base font-bold mb-3">{t("postBtnActive")}</h2>
        {isSpaceOwner ? (
          <Link href="/post/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500 text-white font-bold text-base hover:bg-green-600 shadow-sm shadow-green-200 dark:shadow-green-900/30 transition-all hover:shadow-md">
            <PenSquare className="w-5 h-5" /> {t("postBtnActive")}
          </Link>
        ) : isNormalUser ? (
          energy > 0 ? (
            <div className="space-y-2">
              <Link href="/post/new"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500 text-white font-bold text-base hover:bg-green-600 shadow-sm shadow-green-200 dark:shadow-green-900/30 transition-all hover:shadow-md">
                <PenSquare className="w-5 h-5" /> 发布求职/招聘
              </Link>
              <p className="text-xs text-muted-foreground">每24小时可发布一次，仅限求职/招聘分区</p>
            </div>
          ) : (
            <div className="space-y-2">
              <button disabled
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-muted text-muted-foreground font-bold text-base cursor-not-allowed opacity-60">
                <PenSquare className="w-5 h-5" /> 发布求职/招聘
              </button>
              <p className="text-xs text-muted-foreground">需先兑换能量才能发帖（兑换能量按钮在上方）</p>
            </div>
          )
        ) : (
          <div className="relative inline-block group">
            <button
              disabled
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-muted text-muted-foreground font-bold text-base cursor-not-allowed opacity-60"
            >
              <PenSquare className="w-5 h-5" /> {t("postBtnActive")}
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {t("activateFirst")}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        )}
      </div>

      {/* 10. 我的帖子 */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="text-base font-bold mb-4">{t("myPostsLabel")}</h2>
        {(!userPosts?.posts || userPosts.posts.length === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t("noPost")}</p>
        ) : (
          <div className="space-y-3">
            {(userPosts.posts as any[]).map((post: any) => (
              <div key={post.id} className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <PostCard post={post} onRefresh={refetchPosts} showPin compact />
                </div>
                <button
                  onClick={() => handleDeletePost(post.id)}
                  disabled={deletingId === post.id}
                  className="shrink-0 mt-1 p-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors border border-red-200 dark:border-red-800/50"
                  title={t("deletePost")}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 兑换能量弹窗 ── */}
      {showExchangeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowExchangeModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border border-border/50 dark:border-slate-800 p-6 space-y-5"
            onClick={e => e.stopPropagation()}>
            <div>
              <h3 className="text-lg font-bold text-foreground">代币兑换能量</h3>
              <p className="text-sm text-muted-foreground mt-1">规则：200 代币 = 1 点能量，每次消耗后立即到账</p>
              <p className="text-sm text-muted-foreground mt-1">
                当前代币余额：<span className="font-bold text-amber-500">{tokenCount.toLocaleString()} $WBR</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[200, 400, 600, 800, 1000, 2000].filter(v => v <= tokenCount || v === 200).map(v => (
                <button key={v}
                  onClick={() => setExchangeAmt(v)}
                  disabled={v > tokenCount}
                  className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    exchangeAmt === v
                      ? "border-green-500 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300"
                      : v > tokenCount
                        ? "border-border/30 bg-muted/30 text-muted-foreground/40 cursor-not-allowed"
                        : "border-border/50 bg-muted/30 text-foreground hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-950/20"
                  }`}>
                  <span className="block text-xs text-muted-foreground mb-0.5">{v} 代币</span>
                  兑换 {v / 200} 点能量
                </button>
              ))}
            </div>

            {exchangeErr && (
              <p className="text-sm text-red-500 font-medium">{exchangeErr}</p>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowExchangeModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted/50 transition-colors">
                取消
              </button>
              <button
                onClick={handleExchange}
                disabled={exchanging || exchangeAmt > tokenCount}
                className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 disabled:bg-muted disabled:text-muted-foreground text-white text-sm font-bold transition-colors">
                {exchanging ? "兑换中…" : `确认兑换 ${exchangeAmt / 200} 点`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
