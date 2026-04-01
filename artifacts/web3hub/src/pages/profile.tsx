import { useWeb3Auth } from "@/lib/web3";
import { useUpsertUser, useGetMe } from "@workspace/api-client-react";
import { generateGradient, truncateAddress } from "@/lib/utils";
import { RoleBadge } from "@/components/role-badge";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Check, Edit2, Save, ShieldCheck, Globe, ExternalLink,
  LayoutDashboard, Bell, Bookmark, Settings, LogOut,
  Twitter, MessageCircle, Send, BookOpen, Copy,
  AlertCircle, ChevronRight,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLang } from "@/lib/i18n";
import { isAdmin } from "@/lib/admin";
import { ClaimsPanel } from "@/components/admin/ClaimsPanel";

function getApiBase() {
  const base = import.meta.env.BASE_URL ?? "/";
  const parts = base.replace(/\/$/, "").split("/");
  parts.pop();
  return parts.join("/") + "/api";
}
const apiBase = getApiBase();

type NavTab = "overview" | "subscriptions" | "notifications" | "admin";

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

function NotifIcon({ type }: { type: string }) {
  if (type === "like") return <span>❤️</span>;
  if (type === "new_apply" || type === "apply") return <span>🤝</span>;
  if (type === "new_post" || type === "section_update") return <span>📄</span>;
  return <span>🔔</span>;
}

function timeAgo(iso: string, zh: boolean): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return zh ? `${mins}分钟前` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return zh ? `${hrs}小时前` : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return zh ? `${days}天前` : `${days}d ago`;
}

export default function Profile() {
  const { address, isConnected, disconnect } = useWeb3Auth() as any;
  const upsertMutation = useUpsertUser();
  const queryClient = useQueryClient();
  const { data: meData } = useGetMe(
    { wallet: address ?? "" },
    { query: { enabled: !!address } }
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const admin = isAdmin(address);
  const me = (meData as any)?.user ?? meData;
  const { t, lang } = useLang();
  const zh = lang === "zh-CN";

  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifUnread, setNotifUnread] = useState(0);

  const [twitter, setTwitter]       = useState("");
  const [website, setWebsite]       = useState("");
  const [discord, setDiscord]       = useState("");
  const [telegram, setTelegram]     = useState("");
  const [whitepaper, setWhitepaper] = useState("");
  const [username, setUsername]     = useState("");
  const [dirty, setDirty]           = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle"|"saving"|"saved">("idle");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editTwitter, setEditTwitter]     = useState("");
  const [editWebsite, setEditWebsite]     = useState("");
  const [editDiscord, setEditDiscord]     = useState("");
  const [editTelegram, setEditTelegram]   = useState("");
  const [editWhitepaper, setEditWhitepaper] = useState("");
  const [editSaving, setEditSaving]       = useState(false);

  const isSpaceOwner = me?.spaceStatus === "approved" || me?.spaceStatus === "active";
  const spaceType = me?.spaceType;
  const displayUsername = me?.username || truncateAddress(address ?? "");

  useEffect(() => {
    if (!me) return;
    setTwitter(me.twitter ?? "");
    setWebsite(me.website ?? "");
    setUsername(me.username ?? "");
    setDiscord((me as any).discord ?? "");
    setTelegram((me as any).telegram ?? "");
    setWhitepaper((me as any).whitepaper ?? "");
    setSubscriptions((me as any).subscriptions ?? []);
  }, [me]);

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

  const handleSave = () => {
    if (!address || !dirty) return;
    setSaveStatus("saving");
    upsertMutation.mutate(
      { data: { wallet: address, username, twitter, website, language: lang, discord, telegram, whitepaper } as any },
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

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle className="w-16 h-16 text-muted-foreground/30" />
        <h2 className="text-xl font-bold">{zh ? "连接钱包" : "Connect Wallet"}</h2>
        <p className="text-sm text-muted-foreground">{zh ? "请连接钱包以查看个人中心。" : "Please connect your wallet to view your profile."}</p>
      </div>
    );
  }

  const NAV_ITEMS: { tab: NavTab; icon: React.ReactNode; label: string }[] = [
    { tab: "overview",       icon: <LayoutDashboard className="w-4 h-4" />, label: zh ? "概览" : "Overview" },
    { tab: "subscriptions",  icon: <Bookmark className="w-4 h-4" />,        label: zh ? "我的订阅" : "Subscriptions" },
    { tab: "notifications",  icon: <Bell className="w-4 h-4" />,            label: zh ? "最近通知" : "Notifications" },
    ...(admin ? [{ tab: "admin" as NavTab, icon: <ShieldCheck className="w-4 h-4" />, label: "管理员面板" }] : []),
  ];

  const renderMain = () => {
    switch (activeTab) {

      case "overview": return (
        <div className="space-y-4">

          {/* Welcome Card */}
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
          </div>

          {/* Subscriptions preview */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-500" />
                {zh ? "我的订阅" : "My Subscriptions"}
              </h2>
              <button onClick={() => setActiveTab("subscriptions")}
                className="text-xs text-primary hover:underline flex items-center gap-0.5">
                {zh ? "管理订阅" : "Manage"} <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {subscriptions.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">{zh ? "还没有订阅任何栏目" : "No subscriptions yet"}</p>
                <button onClick={() => setActiveTab("subscriptions")} className="text-xs text-primary hover:underline">
                  {zh ? "去订阅 →" : "Subscribe now →"}
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {subscriptions.slice(0, 8).map(s => (
                  <span key={s} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                    {zh ? s : (SECTION_EN[s] ?? s)}
                  </span>
                ))}
                {subscriptions.length > 8 && (
                  <span className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                    +{subscriptions.length - 8}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Notifications preview */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-500" />
                {zh ? "最近通知" : "Notifications"}
                {notifUnread > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">{notifUnread}</span>
                )}
              </h2>
              <button onClick={() => { setActiveTab("notifications"); markRead(); }}
                className="text-xs text-primary hover:underline flex items-center gap-0.5">
                {zh ? "查看全部" : "View all"} <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {notifications.length === 0 ? (
              <div className="py-6 text-center">
                <Bell className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{zh ? "暂无通知" : "No notifications yet"}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 4).map((n: any) => (
                  <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${!n.isRead ? "bg-primary/5 border border-primary/10" : "bg-muted/30"}`}>
                    <div className="shrink-0 mt-0.5 text-base"><NotifIcon type={n.type} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">
                        {n.fromName && <span className="font-semibold">{n.fromName} </span>}
                        {n.postTitle
                          ? (zh ? `对「${n.postTitle}」进行了互动` : `interacted with "${n.postTitle}"`)
                          : (n.type === "new_apply" ? (zh ? "向您发起了匹配申请" : "sent you a match request") : n.type)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.createdAt, zh)}</p>
                    </div>
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );

      case "subscriptions": return (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-500" />
              {zh ? "我的订阅" : "My Subscriptions"}
            </h2>
            <span className="text-xs text-muted-foreground">{zh ? `已订阅 ${subscriptions.length} 个栏目` : `${subscriptions.length} subscribed`}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {zh ? "点击标签切换订阅状态，订阅后将收到该栏目的新内容推送。" : "Click a section to toggle subscription."}
          </p>
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

      case "notifications": return (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4 text-rose-500" />
              {zh ? "最近通知" : "Notifications"}
              {notifUnread > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">{notifUnread}</span>
              )}
            </h2>
            {notifUnread > 0 && (
              <button onClick={markRead} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {zh ? "全部已读" : "Mark all read"}
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">{zh ? "暂无通知" : "No notifications yet"}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">{zh ? "订阅栏目后将第一时间收到推送" : "Subscribe to sections to receive updates"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n: any) => (
                <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${!n.isRead ? "bg-primary/5 border border-primary/10" : "hover:bg-muted/40"}`}>
                  <div className="shrink-0 mt-0.5 text-base"><NotifIcon type={n.type} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">
                      {n.fromName && <span className="font-semibold">{n.fromName} </span>}
                      {n.postTitle
                        ? (zh ? `对「${n.postTitle}」进行了互动` : `interacted with "${n.postTitle}"`)
                        : (n.type === "new_apply" ? (zh ? "向您发起了匹配申请" : "sent you a match request") : n.type)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.createdAt, zh)}</p>
                  </div>
                  {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                </div>
              ))}
            </div>
          )}
        </div>
      );

      case "admin": return admin ? (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-5 py-3 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">{zh ? "管理员面板" : "Admin Panel"}</p>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70">{zh ? "仅管理员可见" : "Visible to admins only"}</p>
            </div>
          </div>
          <ClaimsPanel />
        </div>
      ) : null;

      default: return null;
    }
  };

  return (
    <>
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

          {/* Avatar + settings */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative group cursor-pointer shrink-0" onClick={() => fileRef.current?.click()}>
                <div className="w-12 h-12 rounded-xl border-2 border-border"
                  style={me?.avatar
                    ? { backgroundImage: `url(${me.avatar})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : { background: generateGradient(address) }} />
                <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Edit2 className="w-3.5 h-3.5 text-white" />
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div className="flex-1 min-w-0">
                <input value={username} onChange={e => { setUsername(e.target.value); setDirty(true); }}
                  placeholder={truncateAddress(address)} maxLength={32}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/40 mb-1" />
                {dirty && (
                  <button onClick={handleSave} disabled={saveStatus === "saving"}
                    className="w-full flex items-center justify-center gap-1 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
                    <Save className="w-3 h-3" />
                    {saveStatus === "saving" ? (zh ? "保存中..." : "Saving...") : saveStatus === "saved" ? "✓" : (zh ? "保存" : "Save")}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Project Links */}
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
          </div>

          {/* Disconnect */}
          <button onClick={() => disconnect?.()}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900 transition-all">
            <LogOut className="w-3 h-3" />
            {zh ? "断开钱包" : "Disconnect"}
          </button>
        </aside>
      </div>

      {/* Edit Links Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)}>
          <div className="bg-background border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-base">{zh ? "编辑项目链接" : "Edit Project Links"}</h3>
            {[
              { label: "X / Twitter", val: editTwitter, set: setEditTwitter, ph: "https://x.com/yourhandle" },
              { label: zh ? "官网" : "Website",  val: editWebsite, set: setEditWebsite, ph: "https://yourproject.xyz" },
              { label: "Discord",  val: editDiscord, set: setEditDiscord, ph: "https://discord.gg/..." },
              { label: "Telegram", val: editTelegram, set: setEditTelegram, ph: "https://t.me/..." },
              { label: zh ? "白皮书" : "Whitepaper", val: editWhitepaper, set: setEditWhitepaper, ph: "https://docs.yourproject.xyz" },
            ].map(({ label, val, set, ph }) => (
              <div key={label}>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
                <input type="url" value={val} onChange={e => set(e.target.value)} placeholder={ph}
                  className="w-full text-sm bg-muted/40 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowEditModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                {zh ? "取消" : "Cancel"}
              </button>
              <button onClick={saveEditModal} disabled={editSaving}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60">
                {editSaving ? (zh ? "保存中..." : "Saving...") : (zh ? "保存" : "Save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
