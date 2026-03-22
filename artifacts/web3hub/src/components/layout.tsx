import { Link, useLocation } from "wouter";
import { useWeb3Auth } from "@/lib/web3";
import { WalletPickerModal } from "@/components/wallet-modal";
import { useGetMe } from "@workspace/api-client-react";
import { useLang, type LangCode } from "@/lib/i18n";
import { isAdmin } from "@/lib/admin";
import { LogOut, Mail, ChevronDown, LayoutDashboard, ShieldCheck, PenSquare } from "lucide-react";
import { cn, truncateAddress, generateGradient } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

const NAV_ROW1_KEYS = [
  { key: "nav_testnet",     href: "/section/testnet" },
  { key: "nav_ido",         href: "/section/ido" },
  { key: "nav_security",    href: "/section/security" },
  { key: "nav_integration", href: "/section/integration" },
  { key: "nav_airdrop",     href: "/section/airdrop" },
  { key: "nav_events",      href: "/section/events" },
  { key: "nav_funding",     href: "/section/funding" },
  { key: "nav_jobs",        href: "/section/jobs" },
  { key: "nav_nodes",       href: "/section/nodes" },
];

const NAV_ROW2_KEYS = [
  { key: "nav_showcase",   href: "/members" },
  { key: "nav_ecosystem",  href: "/section/ecosystem" },
  { key: "nav_partners",   href: "/section/partners" },
  { key: "nav_hackathon",  href: "/section/hackathon" },
  { key: "nav_ama",        href: "/section/ama" },
  { key: "nav_bugbounty",  href: "/section/bugbounty" },
  { key: "nav_community",  href: "/community" },
  { key: "nav_developer",  href: "/developer" },
];

const LANGUAGES: { value: LangCode; label: string }[] = [
  { value: "en",    label: "English" },
  { value: "zh-CN", label: "中文简体" },
  { value: "de",    label: "Deutsch" },
  { value: "ru",    label: "Русский" },
  { value: "fr",    label: "Français" },
  { value: "ja",    label: "日本語" },
  { value: "ko",    label: "한국어" },
  { value: "vi",    label: "Tiếng Việt" },
];

const DONATE_ADDR = "0xbe4548c1458be01838f1faafd69d335f0567399a";

export function Layout({ children }: { children: React.ReactNode }) {
  const { address, isConnected, user, disconnect } = useWeb3Auth();
  const { data: meData } = useGetMe({ wallet: address ?? "" }, { query: { enabled: !!address } });
  const [location] = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [addrCopied, setAddrCopied] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("web3hub_dark");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const { t, lang, setLang } = useLang();
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const admin = isAdmin(address);
  const meLoading = !address || (!!address && meData === undefined);
  const isSpaceOwner = meData?.user?.spaceStatus === "approved" || meData?.user?.spaceStatus === "active";

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

  const navLinkClass = (href: string) => cn(
    "relative px-3.5 py-1.5 rounded-full text-base font-semibold whitespace-nowrap transition-all duration-200 group",
    location === href
      ? "text-white bg-white/15"
      : "text-white/70 hover:text-white"
  );

  return (
    <div className="min-h-screen flex flex-col dark:bg-background" style={isDark ? {} : {background: "#EEF5FF"}}>
      {/* ── Top Navbar ──────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full glass-panel !border-l-0 !border-r-0 !border-t-0 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo — 1.5× bigger */}
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/" className="flex items-center gap-2.5 group">
                <img src="/logo.png" alt="Web3 Release" className="w-10 h-10 rounded-xl object-cover" />
                <span className="font-display font-bold text-2xl tracking-tight text-blue-600">Web3 Release</span>
              </Link>
              <Link href="/"
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all",
                  location === "/"
                    ? "bg-blue-600 text-white border-blue-600 shadow"
                    : "bg-white dark:bg-slate-800 text-blue-600 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                )}
              >
                {t("navHome")}
              </Link>
            </div>

            <div className="flex items-center gap-3 ml-auto">
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
                      className="w-7 h-7 rounded-full"
                      style={{ background: user?.avatar ? `url(${user.avatar}) center/cover` : generateGradient(address) }}
                    />
                    <span className="text-sm font-medium font-mono">{truncateAddress(address)}</span>
                    {admin && <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />}
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 rounded-xl shadow-2xl border border-border dark:border-slate-700 py-1 z-50"
                      style={{ background: "var(--card)", opacity: 1 }}>
                      <Link href="/profile" onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-foreground dark:text-slate-100 hover:bg-muted dark:hover:bg-slate-700 transition-colors cursor-pointer">
                        <LayoutDashboard className="w-4 h-4 text-blue-500" /> {t("dashboard")}
                      </Link>
                      {admin && (
                        <Link href="/admin" onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-3 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer">
                          <ShieldCheck className="w-4 h-4" /> Admin Panel
                        </Link>
                      )}
                      <div className="border-t border-border/40 dark:border-slate-700 my-1" />
                      <button onClick={() => { disconnect(); setIsDropdownOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-destructive dark:text-red-400 hover:bg-destructive/10 dark:hover:bg-red-950/30 transition-colors text-left">
                        <LogOut className="w-4 h-4" /> {t("logout")}
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
          <div className="max-w-7xl mx-auto px-2 py-1.5 space-y-1">
            {/* Row 1 */}
            <div className="flex items-center justify-center gap-0.5 overflow-x-auto scrollbar-none">
              {NAV_ROW1_KEYS.map(({ key, href }) => (
                <Link key={key} href={href} className={navLinkClass(href)}>
                  {location !== href && (
                    <span className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/10 group-hover:scale-105 transition-all duration-200 origin-center" />
                  )}
                  <span className="relative z-10">{t(key)}</span>
                </Link>
              ))}
            </div>

            {/* Row 2 */}
            <div className="flex items-center justify-center gap-0.5 overflow-x-auto scrollbar-none">
              {NAV_ROW2_KEYS.map(({ key, href }) => (
                <Link key={key} href={href} className={navLinkClass(href)}>
                  {location !== href && (
                    <span className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/10 group-hover:scale-105 transition-all duration-200 origin-center" />
                  )}
                  <span className="relative z-10">{t(key)}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-44">
        {children}
      </main>

      {/* ── Fixed Bottom Footer ──────────────────────── */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-border/50 dark:border-slate-800 shadow-[0_-2px_16px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground dark:text-slate-400 font-semibold">{t("contact")}：</span>
            <a href="#" title="X / Twitter"
              className="w-9 h-9 rounded-full bg-muted/60 dark:bg-slate-700 hover:bg-sky-50 dark:hover:bg-sky-900/40 flex items-center justify-center transition-colors group">
              <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-muted-foreground dark:fill-slate-400 group-hover:fill-sky-500 transition-colors">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="mailto:" title="Email"
              className="w-9 h-9 rounded-full bg-muted/60 dark:bg-slate-700 hover:bg-pink-50 dark:hover:bg-pink-900/40 flex items-center justify-center transition-colors group">
              <Mail className="w-4.5 h-4.5 text-muted-foreground dark:text-slate-400 group-hover:text-pink-500 transition-colors" />
            </a>
            <a href="#" title="Telegram"
              className="w-9 h-9 rounded-full bg-muted/60 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/40 flex items-center justify-center transition-colors group">
              <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-muted-foreground dark:fill-slate-400 group-hover:fill-blue-500 transition-colors">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </a>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="text-sm text-muted-foreground dark:text-slate-400 font-semibold">{t("donate")} EVM：</span>
            <button onClick={copyAddr}
              className="font-mono text-sm bg-muted/60 dark:bg-slate-700 hover:bg-muted dark:hover:bg-slate-600 px-3 py-1.5 rounded-full border border-border/50 dark:border-slate-600 transition-colors text-muted-foreground dark:text-slate-300">
              {addrCopied ? "✓ Copied!" : `${DONATE_ADDR.slice(0,10)}...${DONATE_ADDR.slice(-6)}`}
            </button>
            <span className="text-sm text-muted-foreground dark:text-slate-400">Thank you so much 🙏</span>
          </div>
        </div>
      </footer>

      <WalletPickerModal open={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
    </div>
  );
}
