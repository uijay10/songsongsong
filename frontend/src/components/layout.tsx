import { Link, useLocation } from "wouter";
import { useWeb3Auth } from "@/lib/web3";
import { WalletPickerModal } from "@/components/wallet-modal";
import { useGetMe } from "@workspace/api-client-react";
import { useLang, type LangCode } from "@/lib/i18n";
import { isAdmin } from "@/lib/admin";
import { DISCLAIMER_CONTENT } from "@/lib/disclaimer-content";
import { LogOut, ChevronDown, LayoutDashboard, ShieldCheck, PenSquare, FileText, X, Bell } from "lucide-react";
import { cn, truncateAddress, generateGradient } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { useEventFilter, NAV_KEY_TO_CATEGORY } from "@/lib/event-filter-context";
import { formatDistanceToNow } from "date-fns";
import { enUS, zhCN } from "date-fns/locale";

function getApiBase() {
  const base = import.meta.env.BASE_URL ?? "/";
  const parts = base.replace(/\/$/, "").split("/");
  parts.pop();
  return parts.join("/") + "/api";
}

const DATE_LOCALES_LAYOUT: Record<string, Locale> = {
  "en": enUS, "zh-CN": zhCN,
};

const NAV_KEYS = [
  { key: "nav_testnet",   href: "/section/testnet" },
  { key: "nav_ido",       href: "/section/ido" },
  { key: "nav_presale",   href: "/section/presale" },
  { key: "nav_funding",   href: "/section/funding" },
  { key: "nav_airdrop",   href: "/section/airdrop" },
  { key: "nav_recruiting",href: "/section/recruiting" },
  { key: "nav_nodes",     href: "/section/nodes" },
  { key: "nav_mainnet",   href: "/section/mainnet" },
  { key: "nav_unlock",    href: "/section/unlock" },
  { key: "nav_exchange",  href: "/section/exchange" },
  { key: "nav_quest",     href: "/section/quest" },
  { key: "nav_developer",  href: "/developer" },
  { key: "nav_grant",      href: "/section/grant" },
  { key: "nav_bugbounty",  href: "/section/bugbounty" },
];

const LANGUAGES: { value: LangCode; label: string }[] = [
  { value: "en",    label: "English" },
  { value: "zh-CN", label: "中文简体" },
];

const DONATE_ADDR = "0xbe4548c1458be01838f1faafd69d335f0567399a";

export function Layout({ children }: { children: React.ReactNode }) {
  const { address, isConnected, user, disconnect } = useWeb3Auth();
  const { data: meData } = useGetMe({ wallet: address ?? "" }, { query: { enabled: !!address } });
  const [location, navigate] = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { activeCategory, setActiveCategory } = useEventFilter();
  const isHome = location === "/";
  const [addrCopied, setAddrCopied] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [whitepaperOpen, setWhitepaperOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("web3hub_dark");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const { t, lang, setLang } = useLang();
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const admin = isAdmin(address);
  const meLoading = !address || (!!address && meData === undefined);
  const isSpaceOwner = meData?.user?.spaceStatus === "approved" || meData?.user?.spaceStatus === "active";

  // Notification state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifList, setNotifList] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const apiBase = getApiBase();

  useEffect(() => {
    if (!address) return;
    const fetchNotifs = async () => {
      try {
        const res = await fetch(`${apiBase}/notifications?wallet=${address}`);
        if (!res.ok) return;
        const d = await res.json();
        setNotifList(d.notifications ?? []);
        setUnread(d.unread ?? 0);
      } catch {}
    };
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30000);
    return () => clearInterval(id);
  }, [address]);

  const openBell = async () => {
    setNotifOpen(v => !v);
    if (!notifOpen && unread > 0 && address) {
      try {
        await fetch(`${apiBase}/notifications/mark-read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: address }),
        });
        setUnread(0);
        setNotifList(prev => prev.map(n => ({ ...n, isRead: true })));
      } catch {}
    }
  };

  useEffect(() => {
    function handleClickOutsideBell(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutsideBell);
    return () => document.removeEventListener("mousedown", handleClickOutsideBell);
  }, []);

  const toggleDarkMode = () => {
    setIsDark((prev: boolean) => {
      const next = !prev;
      localStorage.setItem("web3hub_dark", JSON.stringify(next));
      if (next) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      return next;
    });
  };

  if (isDark && typeof window !== "undefined") {
    document.documentElement.classList.add("dark");
  }

  const handleMouseEnter = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setIsDropdownOpen(true);
  };
  const handleMouseLeave = () => {
    hideTimer.current = setTimeout(() => setIsDropdownOpen(false), 1000);
  };
  const toggleDropdown = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setIsDropdownOpen(v => !v);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const copyAddr = () => {
    navigator.clipboard.writeText(DONATE_ADDR).then(() => {
      setAddrCopied(true);
      setTimeout(() => setAddrCopied(false), 2000);
    });
  };

  const navLinkClass = (href: string, navKey?: string) => {
    const cat = navKey ? NAV_KEY_TO_CATEGORY[navKey] : undefined;
    const isActive = isHome
      ? (cat ? activeCategory === cat : false)
      : location === href;
    return cn(
      "relative px-3 py-1 rounded-full text-[13px] font-normal whitespace-nowrap transition-all duration-200 group cursor-pointer",
      isActive
        ? "text-white bg-white/20 ring-1 ring-white/40"
        : "text-white/80 hover:text-white hover:bg-white/10"
    );
  };

  const handleNavClick = (e: React.MouseEvent, href: string, navKey: string) => {
    e.preventDefault();
    const cat = NAV_KEY_TO_CATEGORY[navKey];
    if (isHome && cat) {
      setActiveCategory(cat);
    } else {
      navigate(href);
    }
  };

  return (
    <div className="min-h-screen flex flex-col dark:bg-background" style={isDark ? {} : {background: "#EEF5FF"}}>
      {/* ── Top Navbar ──────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full glass-panel !border-l-0 !border-r-0 !border-t-0 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo — 1.5× bigger */}
            <div className="flex items-center gap-3 shrink-0">
              <a href="/" onClick={e => { e.preventDefault(); setActiveCategory("全部"); navigate("/"); }}
                className="flex items-center gap-2.5 group cursor-pointer">
                <img src="/logo.png" alt="Web3 Release" className="w-10 h-10 rounded-xl object-cover" />
                <span className="font-display font-bold text-2xl tracking-tight text-blue-600">Web3 Release</span>
              </a>
              <a href="/" onClick={e => { e.preventDefault(); setActiveCategory("全部"); navigate("/"); }}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all cursor-pointer",
                  location === "/"
                    ? "bg-blue-600 text-white border-blue-600 shadow"
                    : "bg-white dark:bg-slate-800 text-blue-600 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                )}
              >
                {t("navHome")}
              </a>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* Language selector */}
              <div className="relative hidden sm:block">
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as LangCode)}
                  className="appearance-none bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-full pl-3 pr-7 py-1.5 text-sm font-semibold text-muted-foreground dark:text-slate-200 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground dark:text-slate-400 pointer-events-none" />
              </div>
              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="px-3 py-1.5 rounded-full bg-muted dark:bg-slate-700 border border-border dark:border-slate-600 text-muted-foreground dark:text-slate-300 hover:bg-muted/80 dark:hover:bg-slate-600 transition-all font-semibold text-sm"
                title="Toggle dark mode"
              >
                {isDark ? "☀️" : "🌙"}
              </button>

              {/* ── Notification Bell ── */}
              {isConnected && (
                <div className="relative" ref={bellRef}>
                  <button
                    onClick={openBell}
                    className="relative w-9 h-9 flex items-center justify-center rounded-full border border-border hover:bg-muted/50 transition-colors"
                    title={t("notifTitle") || "通知"}
                  >
                    <Bell className="w-4.5 h-4.5 text-muted-foreground" style={{ width: 18, height: 18 }} />
                    {unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
                        style={{ background: "#FF69B4", lineHeight: 1 }}>
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 max-h-[420px] overflow-y-auto rounded-2xl shadow-2xl z-50 border border-border/50 dark:border-slate-700"
                      style={{ background: "#fff" }}>
                      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
                        <span className="font-semibold text-sm text-foreground">{t("notifTitle") || "通知"}</span>
                        {notifList.length > 0 && (
                          <span className="text-xs text-muted-foreground">{notifList.length} {t("notifCount") || "条"}</span>
                        )}
                      </div>
                      {notifList.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                          {t("notifEmpty") || "暂无通知"}
                        </div>
                      ) : (
                        <div className="divide-y divide-border/20">
                          {notifList.map((n: any) => (
                            <Link key={n.id} href={n.postId ? `/post/${n.postId}` : "#"}
                              onClick={() => setNotifOpen(false)}
                              className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer ${!n.isRead ? "bg-pink-50/60 dark:bg-pink-950/10" : ""}`}>
                              <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base"
                                style={{ background: n.type === "like" ? "#fff0f6" : "#eff6ff" }}>
                                {n.type === "like" ? "❤️" : "💬"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-foreground leading-snug">
                                  <span className="font-semibold">{n.fromName ?? truncateAddress(n.fromWallet ?? "")}</span>
                                  {" "}{n.type === "like" ? (t("notifLiked") || "赞了你的帖子") : (t("notifCommented") || "评论了你的帖子")}
                                </p>
                                {n.postTitle && (
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate">《{n.postTitle}》</p>
                                )}
                                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: DATE_LOCALES_LAYOUT[lang] ?? enUS })}
                                </p>
                              </div>
                              {!n.isRead && (
                                <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: "#FF69B4" }} />
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Space owner → red Post button; loading → hide; not owner → Apply link */}
              {isConnected && isSpaceOwner ? (
                <Link href="/post/new"
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold bg-red-500 hover:bg-red-600 text-white shadow-sm transition-all">
                  <PenSquare className="w-4 h-4" /> {t("postNow")}
                </Link>
              ) : null}

              {!isConnected ? (
                <button
                  onClick={() => setWalletModalOpen(true)}
                  className="px-5 py-2 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"
                >
                  {t("connect")}
                </button>
              ) : (
                <div className="relative" ref={dropdownRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center gap-2 p-1 pr-3 rounded-full border border-border hover:border-primary/50 hover:bg-muted/30 transition-all"
                  >
                    <div
                      className="w-7 h-7 rounded-full bg-transparent overflow-hidden"
                      style={user?.avatar
                        ? { backgroundImage: `url(${user.avatar})`, backgroundSize: "cover", backgroundPosition: "center" }
                        : { background: generateGradient(address) }}
                    />
                    <span className="text-sm font-medium font-mono">{truncateAddress(address)}</span>
                    {admin && <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />}
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 rounded-xl shadow-2xl py-1 z-50 overflow-hidden"
                      style={{ background: "#2563eb", border: "1px solid #3b82f6" }}>
                      <Link href="/profile" onClick={() => setIsDropdownOpen(false)}
                        className="group flex items-center gap-2.5 px-4 py-3 text-sm text-white hover:bg-blue-700 transition-colors cursor-pointer">
                        <LayoutDashboard className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" /> {t("dashboard")}
                      </Link>
                      {admin && (
                        <Link href="/profile" onClick={() => setIsDropdownOpen(false)}
                          className="group flex items-center gap-2.5 px-4 py-3 text-sm text-white hover:bg-blue-700 transition-colors cursor-pointer">
                          <ShieldCheck className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" /> 管理员面板
                        </Link>
                      )}
                      <div className="my-1" style={{ borderTop: "1px solid rgba(255,255,255,0.2)" }} />
                      <button onClick={() => { disconnect(); setIsDropdownOpen(false); }}
                        className="group w-full flex items-center gap-2.5 px-4 py-3 text-sm text-white hover:bg-blue-700 transition-colors text-left">
                        <LogOut className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" /> {t("logout")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Nav rows ── */}
        <div className="border-t border-border/10" style={{background: "#0A0C14"}}>
          <div className="max-w-7xl mx-auto px-2 py-1.5">
            <div className="flex flex-wrap items-center justify-center gap-x-0.5 gap-y-1">
              {/* All events shortcut */}
              {isHome && (
                <button
                  onClick={() => setActiveCategory("全部")}
                  className={cn(
                    "relative px-3 py-1 rounded-full text-[13px] font-normal whitespace-nowrap transition-all duration-200 cursor-pointer",
                    activeCategory === "全部"
                      ? "text-white bg-white/20 ring-1 ring-white/40"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  )}
                >
                  全部
                </button>
              )}
              {NAV_KEYS.map(({ key, href }) => (
                <a
                  key={key}
                  href={isHome ? "#" : href}
                  onClick={(e) => handleNavClick(e, href, key)}
                  className={navLinkClass(href, key)}
                >
                  <span className="relative z-10">{t(key)}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-[32rem]">
        {children}
      </main>

      {/* ── Fixed Bottom Footer ──────────────────────── */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-border/50 dark:border-slate-800 shadow-[0_-2px_16px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground dark:text-slate-400 font-semibold">{t("contact")}：</span>
            <a href="https://x.com/Web3Release" target="_blank" rel="noreferrer" title="X / Twitter"
              className="w-8 h-8 rounded-full bg-muted/60 dark:bg-slate-700 hover:bg-sky-50 dark:hover:bg-sky-900/40 flex items-center justify-center transition-colors group">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-muted-foreground dark:fill-slate-400 group-hover:fill-sky-500 transition-colors">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="https://discord.gg/jZpQvAhEmF" target="_blank" rel="noreferrer" title="Discord"
              className="w-8 h-8 rounded-full bg-muted/60 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 flex items-center justify-center transition-colors group">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-muted-foreground dark:fill-slate-400 group-hover:fill-indigo-500 transition-colors">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.12 18.116a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
            <a href="https://t.me/Web3Release" target="_blank" rel="noreferrer" title="Telegram"
              className="w-8 h-8 rounded-full bg-muted/60 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/40 flex items-center justify-center transition-colors group">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-muted-foreground dark:fill-slate-400 group-hover:fill-blue-500 transition-colors">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </a>
            <button onClick={() => setWhitepaperOpen(true)}
              className="px-3 py-1.5 rounded-full bg-muted/60 dark:bg-slate-700 hover:bg-violet-50 dark:hover:bg-violet-900/40 text-xs font-medium text-muted-foreground dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors border border-border/50 dark:border-slate-600">
              {t("disclaimerBtn")}
            </button>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="text-sm text-muted-foreground dark:text-slate-400 font-semibold">{t("donateLabel")}</span>
            <button onClick={copyAddr}
              className="font-mono text-sm bg-muted/60 dark:bg-slate-700 hover:bg-muted dark:hover:bg-slate-600 px-3 py-1.5 rounded-full border border-border/50 dark:border-slate-600 transition-colors text-muted-foreground dark:text-slate-300">
              {addrCopied ? "✓ Copied!" : `${DONATE_ADDR.slice(0,10)}...${DONATE_ADDR.slice(-6)}`}
            </button>
          </div>
        </div>
      </footer>

      {/* ── Disclaimer Modal ── */}
      {whitepaperOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setWhitepaperOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-border/50 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            {/* Header */}
            {(() => {
              const dc = DISCLAIMER_CONTENT[lang] ?? DISCLAIMER_CONTENT["en"];
              return (
                <>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground leading-tight">{dc.title}</p>
                        <p className="text-xs text-muted-foreground leading-tight">{dc.version}</p>
                      </div>
                    </div>
                    <button onClick={() => setWhitepaperOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted dark:hover:bg-slate-800 transition-colors text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Scrollable content */}
                  <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
                    {dc.clauses.map(({ heading, body }) => (
                      <div key={heading} className="rounded-xl border border-border/40 dark:border-slate-800 bg-muted/30 dark:bg-slate-800/30 px-4 py-3">
                        <p className="font-semibold text-sm text-foreground mb-1">{heading}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                      </div>
                    ))}
                    <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/10 px-4 py-3">
                      <p className="font-semibold text-sm text-amber-700 dark:text-amber-400 mb-1">{dc.warningTitle}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{dc.warning}</p>
                    </div>
                    <p className="text-right text-xs text-muted-foreground pb-1">{dc.footer}</p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      <WalletPickerModal open={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
    </div>
  );
}
