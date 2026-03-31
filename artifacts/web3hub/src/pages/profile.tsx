import { useWeb3Auth } from "@/lib/web3";
import { useUpsertUser, useGetPosts, useGetMe } from "@workspace/api-client-react";
import { generateGradient, truncateAddress } from "@/lib/utils";
import { RoleBadge } from "@/components/role-badge";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Check, Edit2, Trash2, Save, ShieldCheck, PenSquare,
  Globe, ExternalLink, LayoutDashboard, FileText, Bell, Bookmark,
  Handshake, Settings, Phone, ChevronRight, Gift, Twitter,
  MessageCircle, Send, BookOpen, Eye, EyeOff,
  Copy, Users, Megaphone, BarChart3, X, LogOut, Sparkles,
  Clock, AlertCircle,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLang } from "@/lib/i18n";
import { isAdmin } from "@/lib/admin";
import { Link } from "wouter";
import { PostCard } from "@/components/post-card";

function getApiBase() {
  const base = import.meta.env.BASE_URL ?? "/";
  const parts = base.replace(/\/$/, "").split("/");
  parts.pop();
  return parts.join("/") + "/api";
}
const apiBase = getApiBase();

type NavTab = "overview" | "claims" | "subscriptions" | "applications" | "settings" | "contact";

const ALL_TAGS = ["L1","L2","Infrastructure","DePIN","Node","Validator","DeFi","DEX","RWA","SocialFi","NFT","GameFi","AI"];

const ALL_SECTIONS = [
  "测试网","IDO/Launchpad","预售","融资公告","空投",
  "招聘","节点招募","主网上线","代币解锁","交易所上线",
  "链上任务","开发者专区",
];

const SECTION_EN: Record<string, string> = {
  "测试网": "Testnet", "IDO/Launchpad": "IDO/Launchpad", "预售": "Presale",
  "融资公告": "Funding", "空投": "Airdrop", "招聘": "Hiring",
  "节点招募": "Node Recruitment", "主网上线": "Mainnet", "代币解锁": "Token Unlock",
  "交易所上线": "Exchange Listing", "链上任务": "On-chain Quest", "开发者专区": "Dev Zone",
};

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text).then(() => {
        setCopied(true); setTimeout(() => setCopied(false), 2000);
      })}
      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  if (status === "approved" || status === "active")
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400">已认领</span>;
  if (status === "pending")
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">审核中</span>;
  if (status === "rejected")
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">未通过</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">草稿</span>;
}

function SectionLabel({ section }: { section?: string }) {
  const colors: Record<string, string> = {
    testnet: "bg-blue-50 text-blue-600", funding: "bg-purple-50 text-purple-600",
    airdrop: "bg-pink-50 text-pink-600", ido: "bg-orange-50 text-orange-600",
    mainnet: "bg-green-50 text-green-600", nodes: "bg-teal-50 text-teal-600",
  };
  const label: Record<string, string> = {
    testnet: "测试网", funding: "融资", airdrop: "空投",
    ido: "IDO", mainnet: "主网", nodes: "节点",
  };
  const cls = colors[section ?? ""] ?? "bg-gray-100 text-gray-500";
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label[section ?? ""] ?? section ?? "其他"}</span>;
}

function NotifIcon({ type }: { type: string }) {
  if (type === "new_apply" || type === "apply")
    return <Handshake className="w-4 h-4 text-violet-500" />;
  if (type === "new_post" || type === "section_update")
    return <FileText className="w-4 h-4 text-blue-500" />;
  if (type === "like")
    return <Sparkles className="w-4 h-4 text-pink-500" />;
  return <Bell className="w-4 h-4 text-amber-500" />;
}

function timeAgo(iso: string, lang: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return lang === "zh-CN" ? `${mins}分钟前` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return lang === "zh-CN" ? `${hrs}小时前` : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return lang === "zh-CN" ? `${days}天前` : `${days}d ago`;
}

export default function Profile() {
  const { address, isConnected, disconnect } = useWeb3Auth() as any;
  const upsertMutation = useUpsertUser();
  const queryClient = useQueryClient();
  const { data: meData } = useGetMe(
    { wallet: address ?? "" },
    { query: { enabled: !!address } }
  );
  const { data: postsData, refetch: refetchPosts } = useGetPosts(
    { authorWallet: address ?? "" } as any,
    { query: { enabled: !!address } }
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const admin = isAdmin(address);
  const me = (meData as any)?.user ?? meData;
  const posts: any[] = (postsData as any)?.posts ?? postsData ?? [];

  const [activeTab, setActiveTab] = useState<NavTab>("overview");

  /* ── Form state ── */
  const [twitter, setTwitter] = useState("");
  const [website, setWebsite] = useState("");
  const [discord, setDiscord] = useState("");
  const [telegram, setTelegram] = useState("");
  const [whitepaper, setWhitepaper] = useState("");
  const [contact, setContact] = useState("");
  const [contactPublic, setContactPublic] = useState(false);
  const [username, setUsername] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle"|"saving"|"saved">("idle");
  const [deletingId, setDeletingId] = useState<number|null>(null);
  const { t, lang } = useLang();
  const zh = lang === "zh-CN";

  /* ── Real data state ── */
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifUnread, setNotifUnread] = useState(0);

  /* ── Slot pull state ── */
  const [slotState, setSlotState] = useState<"idle"|"pulling"|"done"|"already">("idle");
  const [slotResult, setSlotResult] = useState<{earned?: number; tokens?: number; message?: string} | null>(null);

  /* ── Modals ── */
  const [showSubModal, setShowSubModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  /* ── Edit modal local state ── */
  const [editTwitter, setEditTwitter] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editDiscord, setEditDiscord] = useState("");
  const [editTelegram, setEditTelegram] = useState("");
  const [editWhitepaper, setEditWhitepaper] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const isSpaceOwner = me?.spaceStatus === "approved" || me?.spaceStatus === "active";
  const spaceType = me?.spaceType;
  const isProjectOwner = isSpaceOwner && spaceType === "project";
  const displayUsername = me?.username || truncateAddress(address ?? "");

  /* ── Populate from server ── */
  useEffect(() => {
    if (!me) return;
    setTwitter(me.twitter ?? "");
    setWebsite(me.website ?? "");
    setContact((me as any).contact ?? "");
    setContactPublic((me as any).contactPublic ?? false);
    setUsername(me.username ?? "");
    setSelectedTags(me.tags ?? []);
    setDiscord((me as any).discord ?? "");
    setTelegram((me as any).telegram ?? "");
    setWhitepaper((me as any).whitepaper ?? "");
    setSubscriptions((me as any).subscriptions ?? []);
  }, [me]);

  /* ── Fetch real notifications ── */
  const fetchNotifs = useCallback(async () => {
    if (!address) return;
    try {
      const res = await fetch(`${apiBase}/notifications?wallet=${address}`);
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setNotifUnread(data.unread ?? 0);
    } catch {}
  }, [address]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  /* ── Mark notifications read ── */
  const markRead = async () => {
    if (!address || notifUnread === 0) return;
    try {
      await fetch(`${apiBase}/notifications/mark-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address }),
      });
      setNotifUnread(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  /* ── Toggle subscription ── */
  const toggleSubscription = async (section: string) => {
    if (!address) return;
    const next = subscriptions.includes(section)
      ? subscriptions.filter(s => s !== section)
      : [...subscriptions, section];
    setSubscriptions(next);
    try {
      await fetch(`${apiBase}/users/upsert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address, subscriptions: next }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    } catch {}
  };

  /* ── Slot pull ── */
  const handleSlotPull = async () => {
    if (!address || slotState === "pulling") return;
    setSlotState("pulling");
    setSlotResult(null);
    try {
      const res = await fetch(`${apiBase}/users/slot-pull`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address }),
      });
      const data = await res.json();
      if (data.success) {
        setSlotState("done");
        setSlotResult({ earned: data.earned, tokens: data.tokens });
        queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      } else {
        setSlotState("already");
        setSlotResult({ message: zh ? "今日已抽取，明天再来！" : "Already drawn today, come back tomorrow!" });
      }
      setTimeout(() => { setSlotState("idle"); setSlotResult(null); }, 4000);
    } catch {
      setSlotState("idle");
    }
  };

  /* ── Save settings ── */
  const markDirty = (fn: (v: string) => void) => (v: string) => { fn(v); setDirty(true); };

  const handleSave = () => {
    if (!address || !dirty) return;
    setSaveStatus("saving");
    upsertMutation.mutate(
      { data: { wallet: address, username, twitter, website, language: lang, tags: selectedTags,
          contact, contactPublic, discord, telegram, whitepaper } as any },
      {
        onSuccess: () => {
          setSaveStatus("saved");
          setDirty(false);
          queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
          setTimeout(() => setSaveStatus("idle"), 3000);
        },
        onError: () => setSaveStatus("idle"),
      }
    );
  };

  /* ── Avatar upload ── */
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

  /* ── Delete post ── */
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
    } finally { setDeletingId(null); }
  };

  /* ── Edit modal save ── */
  const openEditModal = () => {
    setEditTwitter(twitter); setEditWebsite(website);
    setEditDiscord(discord); setEditTelegram(telegram);
    setEditWhitepaper(whitepaper);
    setShowEditModal(true);
  };

  const saveEditModal = async () => {
    if (!address) return;
    setEditSaving(true);
    try {
      await fetch(`${apiBase}/users/upsert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: address,
          twitter: editTwitter, website: editWebsite,
          discord: editDiscord, telegram: editTelegram,
          whitepaper: editWhitepaper,
        }),
      });
      setTwitter(editTwitter); setWebsite(editWebsite);
      setDiscord(editDiscord); setTelegram(editTelegram);
      setWhitepaper(editWhitepaper);
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      setShowEditModal(false);
    } catch {} finally { setEditSaving(false); }
  };

  /* ── Not connected ── */
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle className="w-16 h-16 text-muted-foreground/30" />
        <h2 className="text-xl font-bold">{zh ? "连接钱包" : "Connect Wallet"}</h2>
        <p className="text-sm text-muted-foreground">{zh ? "请连接钱包以查看个人中心。" : "Please connect your wallet to view your profile."}</p>
      </div>
    );
  }

  /* ── Nav items ── */
  const NAV_ITEMS: { tab: NavTab; icon: React.ReactNode; label: string }[] = [
    { tab: "overview",      icon: <LayoutDashboard className="w-4 h-4" />, label: zh ? "概览" : "Overview" },
    { tab: "claims",        icon: <FileText className="w-4 h-4" />,        label: zh ? "我的认领公告" : "My Claims" },
    { tab: "subscriptions", icon: <Bookmark className="w-4 h-4" />,        label: zh ? "我的订阅" : "Subscriptions" },
    { tab: "applications",  icon: <Handshake className="w-4 h-4" />,       label: zh ? "我的匹配申请" : "Applications" },
    { tab: "settings",      icon: <Settings className="w-4 h-4" />,        label: zh ? "项目设置" : "Settings" },
    { tab: "contact",       icon: <Phone className="w-4 h-4" />,           label: zh ? "联系方式" : "Contact" },
  ];

  /* ══════════════════════════════════════════════════════
     TAB CONTENT
  ══════════════════════════════════════════════════════ */
  const renderMain = () => {
    switch (activeTab) {

      /* ── OVERVIEW ── */
      case "overview": return (
        <div className="space-y-4">

          {/* 1 ── Welcome Card */}
          <div className="rounded-2xl px-7 py-6 text-white"
            style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #6d28d9 100%)" }}>
            <div className="mb-5">
              <div className="flex items-center gap-2.5 mb-1">
                <p className="text-white/70 text-sm">{zh ? "欢迎回来 👋" : "Welcome back 👋"}</p>
                <RoleBadge spaceType={isSpaceOwner ? spaceType : null} size="xs" />
                {admin && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">Admin</span>}
              </div>
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight">{displayUsername}</h1>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="font-mono text-xs text-white/50">{truncateAddress(address ?? "")}</span>
                {address && (
                  <button onClick={() => navigator.clipboard.writeText(address)}
                    className="p-1 rounded hover:bg-white/10 transition-colors text-white/40 hover:text-white/70">
                    <Copy className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {isProjectOwner && (
                <>
                  <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm transition-all border border-white/20">
                    <Megaphone className="w-3.5 h-3.5" />
                    {zh ? "认领新公告" : "Claim Announcement"}
                  </Link>
                  <Link href="/post/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold text-sm transition-all">
                    <PenSquare className="w-3.5 h-3.5" />
                    {zh ? "发布需求" : "Post Demand"}
                  </Link>
                </>
              )}
              {!isProjectOwner && (
                <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm transition-all border border-white/20">
                  <Globe className="w-3.5 h-3.5" />
                  {zh ? "浏览最新公告" : "Browse Announcements"}
                </Link>
              )}
              {admin && (
                <Link href="/admin" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 font-semibold text-sm transition-all border border-amber-400/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {zh ? "管理后台" : "Admin Panel"}
                </Link>
              )}
            </div>
          </div>

          {/* 2 ── My Claims */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                {zh ? `我的认领记录（共 ${posts.length} 条）` : `My Claims (${posts.length})`}
              </h2>
              <button onClick={() => setActiveTab("claims")}
                className="text-xs text-primary hover:underline flex items-center gap-1">
                {zh ? "查看全部" : "View All"} <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {posts.length === 0 ? (
              <div className="py-8 text-center">
                <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">
                  {zh ? "暂无认领记录，赶快去认领第一条公告吧！" : "No claims yet — go claim your first announcement!"}
                </p>
                <Link href="/" className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
                  <Megaphone className="w-3.5 h-3.5" />
                  {zh ? "浏览公告" : "Browse Announcements"}
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {posts.slice(0, 4).map((post: any) => (
                  <Link key={post.id} href={`/post/${post.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{post.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <SectionLabel section={post.section} />
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={post.status ?? "approved"} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 3 ── Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <FileText className="w-5 h-5 text-slate-500" />, label: zh ? "已认领公告" : "Claims", value: posts.length },
              { icon: <Users className="w-5 h-5 text-slate-500" />,    label: zh ? "收到申请" : "Applications", value: me?.inviteCount ?? 0 },
              { icon: <BarChart3 className="w-5 h-5 text-slate-500" />, label: zh ? "本月曝光" : "Monthly Views", value: "—" },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/40 rounded-2xl p-4 text-center">
                <div className="flex justify-center mb-2">{stat.icon}</div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* 4 ── Subscriptions */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-500" />
                {zh ? "我的订阅" : "My Subscriptions"}
              </h2>
              <button onClick={() => setShowSubModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                <Settings className="w-3 h-3" />
                {zh ? "管理订阅" : "Manage"}
              </button>
            </div>
            {subscriptions.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">{zh ? "还没有订阅任何栏目" : "No subscriptions yet"}</p>
                <button onClick={() => setShowSubModal(true)}
                  className="text-xs text-primary hover:underline">
                  {zh ? "去订阅 →" : "Subscribe now →"}
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {subscriptions.slice(0, 6).map(s => (
                  <button key={s} onClick={() => toggleSubscription(s)}
                    className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all group"
                    title={zh ? "点击取消订阅" : "Click to unsubscribe"}>
                    <span className="group-hover:hidden">{zh ? s : (SECTION_EN[s] ?? s)}</span>
                    <span className="hidden group-hover:inline">✕ {zh ? s : (SECTION_EN[s] ?? s)}</span>
                  </button>
                ))}
                {subscriptions.length > 6 && (
                  <button onClick={() => setShowSubModal(true)}
                    className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium hover:text-foreground transition-colors">
                    +{subscriptions.length - 6}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 5 ── Notifications */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-500" />
                {zh ? "最近通知" : "Recent Notifications"}
                {notifUnread > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">{notifUnread}</span>
                )}
              </h2>
              {notifUnread > 0 && (
                <button onClick={markRead}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {zh ? "全部已读" : "Mark all read"}
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="py-6 text-center">
                <Bell className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{zh ? "暂无通知" : "No notifications yet"}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 5).map((n: any) => (
                  <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${!n.isRead ? "bg-primary/5 border border-primary/10" : "bg-muted/30"}`}>
                    <div className="shrink-0 mt-0.5"><NotifIcon type={n.type} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">
                        {n.fromName && <span className="font-semibold">{n.fromName} </span>}
                        {n.postTitle
                          ? (zh ? `对「${n.postTitle}」进行了互动` : `interacted with "${n.postTitle}"`)
                          : (n.type === "new_apply" ? (zh ? "向您发起了匹配申请" : "sent you a match request") : n.type)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.createdAt, lang)}</p>
                    </div>
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6 ── Daily Bonus */}
          <div className="bg-muted/30 border border-dashed border-border rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-muted-foreground/60" />
              <div>
                <p className="text-sm font-medium">{zh ? "每日福利" : "Daily Bonus"}</p>
                {slotResult ? (
                  <p className={`text-xs font-semibold ${slotState === "done" ? "text-green-600" : "text-amber-600"}`}>
                    {slotState === "done" ? `🎉 +${slotResult.earned} tokens!` : slotResult.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground/70">
                    {zh ? "当前代币：" : "Tokens: "}
                    <span className="font-semibold text-foreground">{me?.tokens ?? 0}</span>
                  </p>
                )}
              </div>
            </div>
            <button onClick={handleSlotPull} disabled={slotState === "pulling" || slotState === "already"}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                slotState === "pulling" ? "bg-muted text-muted-foreground cursor-not-allowed"
                : slotState === "done" ? "bg-green-100 text-green-700 border border-green-200"
                : slotState === "already" ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
              }`}>
              {slotState === "pulling" ? "..." : slotState === "done" ? (zh ? "已抽取" : "Claimed!") : slotState === "already" ? (zh ? "明天再来" : "Tomorrow") : (zh ? "立即抽取" : "Draw")}
            </button>
          </div>
        </div>
      );

      /* ── CLAIMS ── */
      case "claims": return (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              {zh ? `我的认领公告（共 ${posts.length} 条）` : `My Claims (${posts.length})`}
            </h2>
            {isSpaceOwner && (
              <Link href="/post/new" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
                <PenSquare className="w-3 h-3" /> {zh ? "发新帖" : "New Post"}
              </Link>
            )}
          </div>
          {posts.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">{zh ? "暂无认领记录，赶快去认领第一条公告吧！" : "No claims yet — go claim your first!"}</p>
              <Link href="/" className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
                <Megaphone className="w-3.5 h-3.5" />
                {zh ? "浏览公告" : "Browse Announcements"}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post: any) => (
                <div key={post.id} className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <PostCard post={post} onRefresh={refetchPosts} showPin compact />
                  </div>
                  <button onClick={() => handleDeletePost(post.id)} disabled={deletingId === post.id}
                    className="shrink-0 mt-1 p-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-500 hover:bg-red-100 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );

      /* ── SUBSCRIPTIONS ── */
      case "subscriptions": return (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-500" />
              {zh ? "我的订阅" : "My Subscriptions"}
            </h2>
            <span className="text-xs text-muted-foreground">{zh ? `已订阅 ${subscriptions.length} 个栏目` : `${subscriptions.length} subscribed`}</span>
          </div>
          <p className="text-sm text-muted-foreground">{zh ? "点击标签可切换订阅状态，订阅后将第一时间收到该栏目的新内容推送。" : "Click a section to toggle subscription. You'll get notified for new posts."}</p>
          <div className="flex flex-wrap gap-2">
            {ALL_SECTIONS.map(s => {
              const active = subscriptions.includes(s);
              return (
                <button key={s} onClick={() => toggleSubscription(s)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted/50 text-muted-foreground border-border hover:border-primary hover:text-primary"
                  }`}>
                  {active && <Check className="w-3 h-3 inline mr-1.5" />}
                  {zh ? s : (SECTION_EN[s] ?? s)}
                </button>
              );
            })}
          </div>
          {subscriptions.length > 0 && (
            <div className="pt-2 border-t border-border/60">
              <p className="text-xs text-muted-foreground mb-2">{zh ? "当前已订阅：" : "Currently subscribed:"}</p>
              <div className="flex flex-wrap gap-1.5">
                {subscriptions.map(s => (
                  <span key={s} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {zh ? s : (SECTION_EN[s] ?? s)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );

      /* ── APPLICATIONS ── */
      case "applications": return (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Handshake className="w-4 h-4 text-violet-500" />
            {zh ? "我的匹配申请" : "My Match Applications"}
          </h2>
          <div className="py-16 text-center">
            <Handshake className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">{zh ? "暂无匹配申请" : "No applications yet"}</p>
            <Link href="/" className="mt-3 inline-block text-xs text-primary hover:underline">
              {zh ? "浏览公告并发起申请 →" : "Browse announcements →"}
            </Link>
          </div>
        </div>
      );

      /* ── SETTINGS ── */
      case "settings": return (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-500" />
              {zh ? "基本信息" : "Basic Info"}
            </h2>
            <div className="flex items-center gap-4 mb-5">
              <div className="relative group cursor-pointer shrink-0" onClick={() => fileRef.current?.click()}>
                <div className="w-16 h-16 rounded-xl border-2 border-border"
                  style={me?.avatar
                    ? { backgroundImage: `url(${me.avatar})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : { background: generateGradient(address) }} />
                <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Edit2 className="w-4 h-4 text-white" />
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">{zh ? "显示名称" : "Display Name"}</label>
                <input value={username} onChange={e => { setUsername(e.target.value); setDirty(true); }}
                  placeholder={truncateAddress(address)} maxLength={32}
                  className="w-full text-sm bg-muted/40 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: zh ? "X (Twitter) 链接" : "X (Twitter) URL", icon: <Twitter className="w-4 h-4 text-sky-500" />, val: twitter, set: (v: string) => markDirty(setTwitter)(v), ph: "https://x.com/yourhandle" },
                { label: zh ? "官网" : "Website", icon: <Globe className="w-4 h-4 text-green-500" />, val: website, set: (v: string) => markDirty(setWebsite)(v), ph: "https://yourproject.xyz" },
                { label: "Discord", icon: <MessageCircle className="w-4 h-4 text-indigo-500" />, val: discord, set: (v: string) => markDirty(setDiscord)(v), ph: "https://discord.gg/..." },
                { label: "Telegram", icon: <Send className="w-4 h-4 text-blue-400" />, val: telegram, set: (v: string) => markDirty(setTelegram)(v), ph: "https://t.me/..." },
                { label: zh ? "白皮书" : "Whitepaper", icon: <BookOpen className="w-4 h-4 text-amber-500" />, val: whitepaper, set: (v: string) => markDirty(setWhitepaper)(v), ph: "https://docs.yourproject.xyz" },
              ].map(({ label, icon, val, set, ph }) => (
                <div key={label}>
                  <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">{icon}{label}</label>
                  <input type="url" value={val} onChange={e => set(e.target.value)} placeholder={ph}
                    className="w-full text-sm bg-muted/40 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              ))}
            </div>
          </div>

          {isSpaceOwner && spaceType === "project" && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold mb-3 text-sm">{zh ? "项目标签（最多选2个）" : "Project Tags (max 2)"}</h2>
              <div className="flex flex-wrap gap-2">
                {ALL_TAGS.map(tag => {
                  const active = selectedTags.includes(tag);
                  const disabled = !active && selectedTags.length >= 2;
                  return (
                    <button key={tag} disabled={disabled}
                      onClick={() => {
                        const next = active ? selectedTags.filter(t => t !== tag) : [...selectedTags, tag];
                        setSelectedTags(next); setDirty(true);
                      }}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                        active ? "bg-blue-600 text-white border-blue-600"
                          : disabled ? "opacity-30 cursor-not-allowed bg-muted text-muted-foreground border-border"
                          : "bg-muted/50 text-muted-foreground border-border hover:border-blue-400 hover:text-blue-500"
                      }`}>{tag}</button>
                  );
                })}
              </div>
            </div>
          )}

          <button onClick={handleSave} disabled={!dirty || saveStatus === "saving"}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              dirty ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}>
            <Save className="w-4 h-4" />
            {saveStatus === "saving" ? (zh ? "保存中..." : "Saving...")
              : saveStatus === "saved" ? "✓ " + (zh ? "已保存" : "Saved")
              : zh ? "保存更改" : "Save Changes"}
          </button>
        </div>
      );

      /* ── CONTACT ── */
      case "contact": return (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-500" />
              {zh ? "联系方式" : "Contact Info"}
            </h2>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {zh ? "联系方式（Telegram / WeChat / Email）" : "Contact (Telegram / WeChat / Email)"}
              </label>
              <input type="text" value={contact} onChange={e => markDirty(setContact)(e.target.value)}
                placeholder="Telegram / WeChat / Email..."
                className="w-full text-sm bg-muted/40 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                {zh ? "联系方式可见性" : "Contact Visibility"}
              </label>
              <div className="flex gap-3">
                {[
                  { val: true,  label: zh ? "公开可见" : "Public",     icon: <Eye className="w-4 h-4" /> },
                  { val: false, label: zh ? "仅匹配用户可见" : "Match-only", icon: <EyeOff className="w-4 h-4" /> },
                ].map(opt => (
                  <button key={String(opt.val)} onClick={() => { setContactPublic(opt.val); setDirty(true); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      contactPublic === opt.val
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}>
                    {opt.icon}{opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={handleSave} disabled={!dirty || saveStatus === "saving"}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              dirty ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}>
            <Save className="w-4 h-4" />
            {saveStatus === "saving" ? (zh ? "保存中..." : "Saving...")
              : saveStatus === "saved" ? "✓ " + (zh ? "已保存" : "Saved")
              : zh ? "保存" : "Save"}
          </button>
        </div>
      );

      default: return null;
    }
  };

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  return (
    <>
      {/* ── Three-column Layout ── */}
      <div className="flex gap-5 items-start">

        {/* Left Nav */}
        <aside className="w-44 shrink-0 sticky top-24">
          <div className="bg-card border border-border rounded-2xl p-2 space-y-0.5">
            {NAV_ITEMS.map(({ tab, icon, label }) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all ${
                  activeTab === tab
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                }`}>
                {icon}
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">{renderMain()}</main>

        {/* Right Sidebar */}
        <aside className="w-64 shrink-0 sticky top-24 space-y-4">

          {/* Project Info Card */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                {zh ? "项目链接" : "Project Links"}
              </h3>
              <button onClick={openEditModal}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5">
              {[
                { icon: <Twitter className="w-3.5 h-3.5 text-sky-500" />, val: twitter, ph: "X / Twitter" },
                { icon: <Globe className="w-3.5 h-3.5 text-green-500" />, val: website, ph: zh ? "官网" : "Website" },
                { icon: <MessageCircle className="w-3.5 h-3.5 text-indigo-500" />, val: discord, ph: "Discord" },
                { icon: <Send className="w-3.5 h-3.5 text-blue-400" />, val: telegram, ph: "Telegram" },
                { icon: <BookOpen className="w-3.5 h-3.5 text-amber-500" />, val: whitepaper, ph: zh ? "白皮书" : "Whitepaper" },
              ].map(({ icon, val, ph }, i) => (
                <div key={i} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors group">
                  <span className="shrink-0">{icon}</span>
                  {val ? (
                    <a href={val} target="_blank" rel="noreferrer"
                      className="text-xs text-foreground/80 hover:text-primary truncate flex-1 flex items-center gap-1 font-medium">
                      <span className="truncate">{val.replace(/^https?:\/\/(www\.)?/, "")}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground/40 italic flex-1">{ph}</span>
                  )}
                </div>
              ))}
            </div>

            <button onClick={openEditModal}
              className="w-full py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors flex items-center justify-center gap-1.5">
              <Edit2 className="w-3 h-3" />
              {zh ? "编辑项目信息" : "Edit Project Info"}
            </button>
          </div>

          {/* Tags */}
          {selectedTags.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">{zh ? "项目标签" : "Tags"}</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedTags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact Visibility */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground">{zh ? "联系可见性" : "Contact Visibility"}</p>
              <button onClick={() => setActiveTab("contact")} className="text-xs text-primary hover:underline">
                {zh ? "修改" : "Edit"}
              </button>
            </div>
            <button onClick={() => { setContactPublic(p => !p); setDirty(true); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                contactPublic
                  ? "bg-green-50 dark:bg-green-950/20 text-green-700 hover:bg-green-100"
                  : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 hover:bg-amber-100"
              }`}>
              {contactPublic ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="flex-1 text-left">{contactPublic ? (zh ? "公开可见" : "Public") : (zh ? "仅匹配用户可见" : "Match-only")}</span>
              <span className="text-[10px] opacity-60">{zh ? "点击切换" : "click to toggle"}</span>
            </button>
          </div>

          {/* Disconnect */}
          <button onClick={() => disconnect?.()}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900 transition-all">
            <LogOut className="w-3 h-3" />
            {zh ? "断开钱包" : "Disconnect"}
          </button>
        </aside>
      </div>

      {/* ══════════════════════════════════════════════════════
          SUBSCRIPTION MANAGEMENT MODAL
      ══════════════════════════════════════════════════════ */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowSubModal(false); }}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-lg">{zh ? "管理订阅" : "Manage Subscriptions"}</h3>
              <button onClick={() => setShowSubModal(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">{zh ? "点击栏目切换订阅状态" : "Click to toggle subscription"}</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {ALL_SECTIONS.map(s => {
                const active = subscriptions.includes(s);
                return (
                  <button key={s} onClick={() => toggleSubscription(s)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-border hover:border-primary hover:text-primary"
                    }`}>
                    {active && <Check className="w-3 h-3 inline mr-1.5" />}
                    {zh ? s : (SECTION_EN[s] ?? s)}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowSubModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors">
                {zh ? `完成（已选 ${subscriptions.length} 个）` : `Done (${subscriptions.length} selected)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          EDIT PROJECT INFO MODAL
      ══════════════════════════════════════════════════════ */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowEditModal(false); }}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{zh ? "编辑项目信息" : "Edit Project Info"}</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: "X (Twitter)", icon: <Twitter className="w-4 h-4 text-sky-500" />, val: editTwitter, set: setEditTwitter, ph: "https://x.com/yourhandle" },
                { label: zh ? "官网" : "Website", icon: <Globe className="w-4 h-4 text-green-500" />, val: editWebsite, set: setEditWebsite, ph: "https://yourproject.xyz" },
                { label: "Discord", icon: <MessageCircle className="w-4 h-4 text-indigo-500" />, val: editDiscord, set: setEditDiscord, ph: "https://discord.gg/..." },
                { label: "Telegram", icon: <Send className="w-4 h-4 text-blue-400" />, val: editTelegram, set: setEditTelegram, ph: "https://t.me/..." },
                { label: zh ? "白皮书" : "Whitepaper", icon: <BookOpen className="w-4 h-4 text-amber-500" />, val: editWhitepaper, set: setEditWhitepaper, ph: "https://docs.yourproject.xyz" },
              ].map(({ label, icon, val, set, ph }) => (
                <div key={label}>
                  <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">{icon}{label}</label>
                  <input type="url" value={val} onChange={e => set(e.target.value)} placeholder={ph}
                    className="w-full text-sm bg-muted/40 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowEditModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
                {zh ? "取消" : "Cancel"}
              </button>
              <button onClick={saveEditModal} disabled={editSaving}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60">
                {editSaving ? (zh ? "保存中..." : "Saving...") : (zh ? "保存" : "Save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
