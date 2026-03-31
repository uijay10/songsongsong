import { useWeb3Auth } from "@/lib/web3";
import { useCheckin, useUpsertUser, useGetPosts, useGetMe } from "@workspace/api-client-react";
import { generateGradient, truncateAddress } from "@/lib/utils";
import { RoleBadge } from "@/components/role-badge";
import { useState, useEffect, useRef } from "react";
import {
  Check, AlertCircle, Edit2, Trash2, Save, ShieldCheck, PenSquare,
  Globe, ExternalLink, LayoutDashboard, FileText, Bell, Bookmark,
  Handshake, Settings, Phone, ChevronRight, Gift, Twitter,
  MessageCircle, Send, BookOpen, CalendarDays, Eye, EyeOff,
  Copy, TrendingUp, Users, Megaphone, BarChart3,
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

const SUBSCRIBED_SECTIONS = ["测试网","融资公告","空投","IDO/Launchpad","主网上线"];

const MOCK_NOTIFICATIONS = [
  { id: 1, text: "您认领的公告「Layer2 测试网招募」收到 3 条新申请", time: "2小时前", unread: true },
  { id: 2, text: "您订阅的「融资公告」栏目有 2 条新内容发布", time: "5小时前", unread: true },
  { id: 3, text: "您的匹配申请已被项目方查看", time: "昨天", unread: false },
];

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  if (status === "approved" || status === "active") return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">已认领</span>;
  if (status === "pending") return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">审核中</span>;
  if (status === "rejected") return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">未通过</span>;
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

export default function Profile() {
  const { address, isConnected, isLoading: userLoading } = useWeb3Auth();
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

  const [activeTab, setActiveTab] = useState<NavTab>("overview");
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
  const isSpaceOwner = me?.spaceStatus === "approved" || me?.spaceStatus === "active";
  const spaceType = me?.spaceType;
  const isProjectOwner = isSpaceOwner && spaceType === "project";

  useEffect(() => {
    if (me) {
      setTwitter(me.twitter ?? "");
      setWebsite(me.website ?? "");
      setContact((me as any).contact ?? "");
      setContactPublic((me as any).contactPublic ?? false);
      setUsername(me.username ?? "");
      setSelectedTags(me.tags ?? []);
      setDiscord((me as any).discord ?? "");
      setTelegram((me as any).telegram ?? "");
      setWhitepaper((me as any).whitepaper ?? "");
    }
  }, [me]);

  const markDirty = (setter: (v: string) => void) => (v: string) => { setter(v); setDirty(true); };
  const markDirtyBool = (setter: (v: boolean) => void) => (v: boolean) => { setter(v); setDirty(true); };

  const handleSave = () => {
    if (!address || !dirty) return;
    setSaveStatus("saving");
    upsertMutation.mutate(
      { data: { wallet: address, twitter: twitter || null, website: website || null, contact: contact || null, contactPublic, username: username.trim() || undefined, tags: selectedTags, discord: discord || null, telegram: telegram || null, whitepaper: whitepaper || null } as any },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
          setDirty(false);
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2500);
        },
        onError: () => setSaveStatus("idle"),
      }
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
  const posts = (userPosts as any)?.posts ?? [];

  /* ── ADMIN VIEW ─────────────────────────────────────── */
  if (admin) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
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
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-bold mb-4">{t("myPostsLabel")}</h2>
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t("noPost")}</p>
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
      </div>
    );
  }

  /* ── NAV ITEMS ──────────────────────────────────────── */
  const NAV_ITEMS: { tab: NavTab; icon: React.ReactNode; label: string }[] = [
    { tab: "overview",      icon: <LayoutDashboard className="w-4 h-4" />, label: lang === "zh-CN" ? "概览" : "Overview" },
    { tab: "claims",        icon: <FileText className="w-4 h-4" />,        label: lang === "zh-CN" ? "我的认领公告" : "My Claims" },
    { tab: "subscriptions", icon: <Bookmark className="w-4 h-4" />,        label: lang === "zh-CN" ? "我的订阅" : "Subscriptions" },
    { tab: "applications",  icon: <Handshake className="w-4 h-4" />,       label: lang === "zh-CN" ? "我的匹配申请" : "Applications" },
    { tab: "settings",      icon: <Settings className="w-4 h-4" />,        label: lang === "zh-CN" ? "项目设置" : "Settings" },
    { tab: "contact",       icon: <Phone className="w-4 h-4" />,           label: lang === "zh-CN" ? "联系方式" : "Contact" },
  ];

  /* ── TAB CONTENT ──────────────────────────────────── */
  const renderMain = () => {
    switch (activeTab) {

      /* ── OVERVIEW ── */
      case "overview": return (
        <div className="space-y-4">

          {/* 1. Welcome Card */}
          <div className="rounded-2xl p-8 text-white"
            style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #6d28d9 100%)" }}>
            <div className="flex items-center gap-5 mb-7">
              <div className="w-18 h-18 rounded-2xl border-2 border-white/30 shrink-0 bg-transparent"
                style={{ width: 72, height: 72, ...(me?.avatar
                  ? { backgroundImage: `url(${me.avatar})`, backgroundSize: "cover", backgroundPosition: "center" }
                  : { background: generateGradient(address) }) }} />
              <div>
                <p className="text-white/60 text-sm mb-1">{lang === "zh-CN" ? "欢迎回来 👋" : "Welcome back 👋"}</p>
                <h1 className="text-2xl font-extrabold leading-tight">{displayUsername}</h1>
                <div className="mt-1.5">
                  <RoleBadge spaceType={isSpaceOwner ? spaceType : null} size="sm" />
                </div>
              </div>
            </div>
            {isProjectOwner ? (
              <div className="flex flex-wrap gap-3">
                <Link href="/" className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm transition-all border border-white/25 backdrop-blur-sm">
                  <Megaphone className="w-4 h-4" />
                  {lang === "zh-CN" ? "一键认领新公告" : "Claim Announcement"}
                </Link>
                <Link href="/post/new" className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-bold text-sm transition-all shadow-lg shadow-green-900/40">
                  <PenSquare className="w-4 h-4" />
                  {lang === "zh-CN" ? "发布新需求" : "Post New Demand"}
                </Link>
              </div>
            ) : (
              <Link href="/" className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm transition-all border border-white/25">
                <Globe className="w-4 h-4" />
                {lang === "zh-CN" ? "浏览最新公告" : "Browse Announcements"}
              </Link>
            )}
          </div>

          {/* 2. My Claims */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                {lang === "zh-CN" ? "我的认领记录" : "My Claims"}
              </h2>
              <button onClick={() => setActiveTab("claims")}
                className="text-xs text-primary hover:underline flex items-center gap-1">
                {lang === "zh-CN" ? "查看全部" : "View All"} <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {posts.length === 0 ? (
              <div className="py-8 text-center">
                <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">
                  {lang === "zh-CN" ? "暂无认领记录，赶快去认领第一条公告吧！" : "No claims yet — go claim your first announcement!"}
                </p>
                <Link href="/" className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
                  <Megaphone className="w-3.5 h-3.5" />
                  {lang === "zh-CN" ? "浏览公告" : "Browse Announcements"}
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {posts.slice(0, 5).map((post: any) => (
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

          {/* 3. Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <FileText className="w-5 h-5 text-slate-500" />, label: lang === "zh-CN" ? "已认领公告" : "Claims", value: posts.length },
              { icon: <Users className="w-5 h-5 text-slate-500" />, label: lang === "zh-CN" ? "收到申请" : "Applications", value: me?.inviteCount ?? 0 },
              { icon: <BarChart3 className="w-5 h-5 text-slate-500" />, label: lang === "zh-CN" ? "本月曝光" : "Monthly Views", value: "—" },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/40 rounded-2xl p-4 text-center">
                <div className="flex justify-center mb-2">{stat.icon}</div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* 4. Subscriptions */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-500" />
                {lang === "zh-CN" ? "我的订阅" : "My Subscriptions"}
              </h2>
              <button onClick={() => setActiveTab("subscriptions")}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                <Settings className="w-3 h-3" />
                {lang === "zh-CN" ? "管理订阅" : "Manage"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUBSCRIBED_SECTIONS.slice(0, 6).map(s => (
                <span key={s} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  {s}
                </span>
              ))}
              {SUBSCRIBED_SECTIONS.length > 6 && (
                <button onClick={() => setActiveTab("subscriptions")}
                  className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium hover:text-foreground transition-colors">
                  +{SUBSCRIBED_SECTIONS.length - 6}
                </button>
              )}
            </div>
          </div>

          {/* 5. Notifications */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-500" />
                {lang === "zh-CN" ? "最近通知" : "Recent Notifications"}
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  {MOCK_NOTIFICATIONS.filter(n => n.unread).length}
                </span>
              </h2>
            </div>
            <div className="space-y-2">
              {MOCK_NOTIFICATIONS.map(n => (
                <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl ${n.unread ? "bg-primary/5" : "bg-muted/30"}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.unread ? "bg-primary" : "bg-muted-foreground/30"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{n.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Daily Bonus */}
          <div className="bg-muted/30 border border-dashed border-border rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-muted-foreground/60" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">{lang === "zh-CN" ? "每日福利" : "Daily Bonus"}</p>
                <p className="text-xs text-muted-foreground/70">
                  {lang === "zh-CN" ? "今日剩余抽奖次数：1 次 · 可兑换代币：" : "Draws left today: 1 · Redeemable tokens: "}
                  <span className="font-semibold text-foreground">{me?.tokens ?? 0}</span>
                </p>
              </div>
            </div>
            <button className="px-4 py-1.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-muted/60 transition-colors">
              {lang === "zh-CN" ? "立即抽取" : "Draw"}
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
              {lang === "zh-CN" ? "我的认领公告" : "My Claims"}
            </h2>
            {isSpaceOwner && (
              <Link href="/post/new" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
                <PenSquare className="w-3 h-3" /> {lang === "zh-CN" ? "发新帖" : "New Post"}
              </Link>
            )}
          </div>
          {posts.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">{lang === "zh-CN" ? "暂无认领记录" : "No claims yet"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post: any) => (
                <div key={post.id} className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <PostCard post={post} onRefresh={refetchPosts} showPin compact />
                  </div>
                  <button onClick={() => handleDeletePost(post.id)} disabled={deletingId === post.id}
                    className="shrink-0 mt-1 p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
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
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-amber-500" />
            {lang === "zh-CN" ? "我的订阅" : "My Subscriptions"}
          </h2>
          <p className="text-sm text-muted-foreground">{lang === "zh-CN" ? "选择您感兴趣的栏目，获取第一时间推送通知。" : "Select sections to receive instant notifications."}</p>
          <div className="flex flex-wrap gap-2">
            {["测试网","IDO/Launchpad","预售","融资公告","空投","招聘","节点招募","主网上线","代币解锁","交易所上线","链上任务","开发者专区"].map(s => {
              const active = SUBSCRIBED_SECTIONS.includes(s);
              return (
                <button key={s} className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground border-border hover:border-primary hover:text-primary"
                }`}>
                  {active && <Check className="w-3 h-3 inline mr-1" />}{s}
                </button>
              );
            })}
          </div>
        </div>
      );

      /* ── APPLICATIONS ── */
      case "applications": return (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Handshake className="w-4 h-4 text-violet-500" />
            {lang === "zh-CN" ? "我的匹配申请" : "My Match Applications"}
          </h2>
          <div className="py-16 text-center">
            <Handshake className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">{lang === "zh-CN" ? "暂无匹配申请" : "No applications yet"}</p>
            <Link href="/" className="mt-3 inline-block text-xs text-primary hover:underline">
              {lang === "zh-CN" ? "浏览公告并发起申请 →" : "Browse announcements →"}
            </Link>
          </div>
        </div>
      );

      /* ── SETTINGS ── */
      case "settings": return (
        <div className="space-y-4">
          {/* Avatar + Name */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-500" />
              {lang === "zh-CN" ? "基本信息" : "Basic Info"}
            </h2>
            <div className="flex items-center gap-4 mb-5">
              <div className="relative group cursor-pointer shrink-0" onClick={() => fileRef.current?.click()}>
                <div className="w-16 h-16 rounded-xl border-2 border-border bg-transparent"
                  style={me?.avatar
                    ? { backgroundImage: `url(${me.avatar})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : { background: generateGradient(address) }} />
                <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Edit2 className="w-4 h-4 text-white" />
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">{lang === "zh-CN" ? "显示名称" : "Display Name"}</label>
                <input
                  value={username}
                  onChange={e => { setUsername(e.target.value); setDirty(true); }}
                  placeholder={truncateAddress(address)}
                  maxLength={32}
                  className="w-full text-sm bg-muted/40 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: lang === "zh-CN" ? "X (Twitter) 链接" : "X (Twitter) URL", icon: <Twitter className="w-4 h-4 text-sky-500" />, val: twitter, set: (v: string) => markDirty(setTwitter)(v), ph: "https://x.com/yourhandle" },
                { label: lang === "zh-CN" ? "官网" : "Website", icon: <Globe className="w-4 h-4 text-green-500" />, val: website, set: (v: string) => markDirty(setWebsite)(v), ph: "https://yourproject.xyz" },
                { label: "Discord", icon: <MessageCircle className="w-4 h-4 text-indigo-500" />, val: discord, set: (v: string) => markDirty(setDiscord)(v), ph: "https://discord.gg/..." },
                { label: "Telegram", icon: <Send className="w-4 h-4 text-blue-400" />, val: telegram, set: (v: string) => markDirty(setTelegram)(v), ph: "https://t.me/..." },
                { label: lang === "zh-CN" ? "白皮书" : "Whitepaper", icon: <BookOpen className="w-4 h-4 text-amber-500" />, val: whitepaper, set: (v: string) => markDirty(setWhitepaper)(v), ph: "https://docs.yourproject.xyz" },
              ].map(({ label, icon, val, set, ph }) => (
                <div key={label}>
                  <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">{icon}{label}</label>
                  <input type="url" value={val} onChange={e => set(e.target.value)} placeholder={ph}
                    className="w-full text-sm bg-muted/40 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {isSpaceOwner && spaceType === "project" && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold mb-3 text-sm">{lang === "zh-CN" ? "项目标签（最多选2个）" : "Project Tags (max 2)"}</h2>
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
                      }`}
                    >{tag}</button>
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
            {saveStatus === "saving" ? (lang === "zh-CN" ? "保存中..." : "Saving...") : saveStatus === "saved" ? "✓ " + (lang === "zh-CN" ? "已保存" : "Saved") : lang === "zh-CN" ? "保存更改" : "Save Changes"}
          </button>
        </div>
      );

      /* ── CONTACT ── */
      case "contact": return (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-500" />
              {lang === "zh-CN" ? "联系方式" : "Contact Info"}
            </h2>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {lang === "zh-CN" ? "联系方式（Telegram / WeChat / Email）" : "Contact (Telegram / WeChat / Email)"}
              </label>
              <input type="text" value={contact} onChange={e => markDirty(setContact)(e.target.value)}
                placeholder="Telegram / WeChat / Email..."
                className="w-full text-sm bg-muted/40 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                {lang === "zh-CN" ? "联系方式可见性" : "Contact Visibility"}
              </label>
              <div className="flex gap-3">
                {[
                  { val: true, label: lang === "zh-CN" ? "公开可见" : "Public", icon: <Eye className="w-4 h-4" /> },
                  { val: false, label: lang === "zh-CN" ? "仅匹配用户可见" : "Match-only", icon: <EyeOff className="w-4 h-4" /> },
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
              <p className="text-xs text-muted-foreground mt-2">
                {contactPublic
                  ? (lang === "zh-CN" ? "所有人均可在您的主页看到联系方式。" : "Everyone can see your contact on your profile.")
                  : (lang === "zh-CN" ? "仅与您成功匹配的用户可看到联系方式。" : "Only matched users can see your contact.")}
              </p>
            </div>
          </div>
          <button onClick={handleSave} disabled={!dirty || saveStatus === "saving"}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              dirty ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}>
            <Save className="w-4 h-4" />
            {saveStatus === "saving" ? (lang === "zh-CN" ? "保存中..." : "Saving...") : saveStatus === "saved" ? "✓ " + (lang === "zh-CN" ? "已保存" : "Saved") : lang === "zh-CN" ? "保存" : "Save"}
          </button>
        </div>
      );

      default: return null;
    }
  };

  /* ── LAYOUT ─────────────────────────────────────────── */
  return (
    <div className="flex gap-5 items-start">

      {/* ── Left Sidebar ── */}
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

      {/* ── Main Content ── */}
      <main className="flex-1 min-w-0">
        {renderMain()}
      </main>

      {/* ── Right Sidebar ── */}
      <aside className="w-64 shrink-0 sticky top-24 space-y-4">

        {/* Project Info Card */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{lang === "zh-CN" ? "项目基本信息" : "Project Info"}</h3>
            <button onClick={() => setActiveTab("settings")}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border border-border shrink-0 bg-transparent"
              style={me?.avatar
                ? { backgroundImage: `url(${me.avatar})`, backgroundSize: "cover", backgroundPosition: "center" }
                : { background: generateGradient(address) }} />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{displayUsername}</p>
              <div className="mt-0.5"><RoleBadge spaceType={isSpaceOwner ? spaceType : null} size="xs" /></div>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { icon: <Twitter className="w-3.5 h-3.5 text-sky-500" />, val: twitter, ph: lang === "zh-CN" ? "X / Twitter" : "X / Twitter" },
              { icon: <Globe className="w-3.5 h-3.5 text-green-500" />, val: website, ph: lang === "zh-CN" ? "官网" : "Website" },
              { icon: <MessageCircle className="w-3.5 h-3.5 text-indigo-500" />, val: discord, ph: "Discord" },
              { icon: <Send className="w-3.5 h-3.5 text-blue-400" />, val: telegram, ph: "Telegram" },
              { icon: <BookOpen className="w-3.5 h-3.5 text-amber-500" />, val: whitepaper, ph: lang === "zh-CN" ? "白皮书" : "Whitepaper" },
            ].map(({ icon, val, ph }, i) => (
              <div key={i} className="flex items-center gap-2">
                {icon}
                {val ? (
                  <a href={val} target="_blank" rel="noreferrer"
                    className="text-xs text-primary hover:underline truncate flex-1 flex items-center gap-1">
                    <span className="truncate">{val.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground/50 italic">{ph}</span>
                )}
              </div>
            ))}
          </div>

          {/* Key Milestones */}
          <div className="border-t border-border/60 pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              {lang === "zh-CN" ? "重要时间节点" : "Key Milestones"}
            </p>
            <div className="space-y-1.5">
              {[
                { label: lang === "zh-CN" ? "测试网" : "Testnet", val: "—" },
                { label: "TGE", val: "—" },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{val}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => setActiveTab("settings")}
            className="w-full py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors flex items-center justify-center gap-1.5">
            <Edit2 className="w-3 h-3" />
            {lang === "zh-CN" ? "编辑项目信息" : "Edit Project Info"}
          </button>
        </div>

        {/* Tags */}
        {selectedTags.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">{lang === "zh-CN" ? "项目标签" : "Tags"}</p>
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
            <p className="text-xs font-semibold text-muted-foreground">{lang === "zh-CN" ? "联系可见性" : "Contact Visibility"}</p>
            <button onClick={() => setActiveTab("contact")} className="text-xs text-primary hover:underline">
              {lang === "zh-CN" ? "修改" : "Edit"}
            </button>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
            contactPublic ? "bg-green-50 dark:bg-green-950/20 text-green-700" : "bg-amber-50 dark:bg-amber-950/20 text-amber-700"
          }`}>
            {contactPublic ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {contactPublic
              ? (lang === "zh-CN" ? "公开可见" : "Public")
              : (lang === "zh-CN" ? "仅匹配用户可见" : "Match-only")}
          </div>
        </div>

        {/* Wallet */}
        <div className="bg-muted/40 border border-border/60 rounded-2xl p-3">
          <p className="text-[10px] text-muted-foreground mb-1">{lang === "zh-CN" ? "钱包地址" : "Wallet"}</p>
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs text-muted-foreground flex-1 truncate">{truncateAddress(address ?? "")}</span>
            {address && <CopyBtn text={address} />}
          </div>
        </div>
      </aside>
    </div>
  );
}
