import { Link, useLocation } from "wouter";
import { useWeb3Auth } from "@/lib/web3";
import { WalletPickerModal } from "@/components/wallet-modal";
import { useGetMe } from "@workspace/api-client-react";
import { useLang, type LangCode } from "@/lib/i18n";
import { isAdmin } from "@/lib/admin";
import { LogOut, ChevronDown, LayoutDashboard, ShieldCheck, PenSquare, FileText, X } from "lucide-react";
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
  { key: "nav_about",      href: "/about" },
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
  const [whitepaperOpen, setWhitepaperOpen] = useState(false);
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
    "relative px-3.5 py-1.5 rounded-full text-base font-normal whitespace-nowrap transition-all duration-200 group",
    location === href
      ? "text-white bg-white/15"
      : "text-white/90 hover:text-white"
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
                    <div className="absolute right-0 mt-2 w-52 rounded-xl shadow-2xl py-1 z-50 overflow-hidden"
                      style={{ background: "#2563eb", border: "1px solid #3b82f6" }}>
                      <Link href="/profile" onClick={() => setIsDropdownOpen(false)}
                        className="group flex items-center gap-2.5 px-4 py-3 text-sm text-white hover:bg-blue-700 transition-colors cursor-pointer">
                        <LayoutDashboard className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" /> {t("dashboard")}
                      </Link>
                      {admin && (
                        <Link href="/admin" onClick={() => setIsDropdownOpen(false)}
                          className="group flex items-center gap-2.5 px-4 py-3 text-sm text-white hover:bg-blue-700 transition-colors cursor-pointer">
                          <ShieldCheck className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" /> Admin Panel
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
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground dark:text-slate-400 font-semibold">{t("contact")}：</span>
            <a href="https://x.com/Web3Release" target="_blank" rel="noreferrer" title="X / Twitter"
              className="w-10 h-10 rounded-full bg-muted/60 dark:bg-slate-700 hover:bg-sky-50 dark:hover:bg-sky-900/40 flex items-center justify-center transition-colors group">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-muted-foreground dark:fill-slate-400 group-hover:fill-sky-500 transition-colors">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="https://discord.gg/jZpQvAhEmF" target="_blank" rel="noreferrer" title="Discord"
              className="w-10 h-10 rounded-full bg-muted/60 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 flex items-center justify-center transition-colors group">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-muted-foreground dark:fill-slate-400 group-hover:fill-indigo-500 transition-colors">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.12 18.116a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
            <a href="https://t.me/Web3Release" target="_blank" rel="noreferrer" title="Telegram"
              className="w-10 h-10 rounded-full bg-muted/60 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/40 flex items-center justify-center transition-colors group">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-muted-foreground dark:fill-slate-400 group-hover:fill-blue-500 transition-colors">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </a>
            <button onClick={() => setWhitepaperOpen(true)} title="Whitepaper"
              className="w-10 h-10 rounded-full bg-muted/60 dark:bg-slate-700 hover:bg-violet-50 dark:hover:bg-violet-900/40 flex items-center justify-center transition-colors group">
              <FileText className="w-5 h-5 text-muted-foreground dark:text-slate-400 group-hover:text-violet-500 transition-colors" />
            </button>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="text-sm text-muted-foreground dark:text-slate-400 font-semibold">{t("donate")}</span>
            <button onClick={copyAddr}
              className="font-mono text-sm bg-muted/60 dark:bg-slate-700 hover:bg-muted dark:hover:bg-slate-600 px-3 py-1.5 rounded-full border border-border/50 dark:border-slate-600 transition-colors text-muted-foreground dark:text-slate-300">
              {addrCopied ? "✓ Copied!" : `${DONATE_ADDR.slice(0,10)}...${DONATE_ADDR.slice(-6)}`}
            </button>
            <span className="text-sm text-muted-foreground dark:text-slate-400">Thank you so much 🙏</span>
          </div>
        </div>
      </footer>

      {/* ── Whitepaper Modal ── */}
      {whitepaperOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setWhitepaperOpen(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-border" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-500" />
                <span className="font-bold text-base text-foreground">Web3 Release Whitepaper</span>
                <span className="text-xs text-muted-foreground ml-1">v1.0 · March 22, 2026</span>
              </div>
              <button onClick={() => setWhitepaperOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-6 py-5 text-sm text-foreground leading-relaxed space-y-5">
              <section>
                <h2 className="text-base font-bold mb-2">1. Abstract</h2>
                <p className="text-muted-foreground">Web3 Release is a decentralized, community-driven Web3 collaboration platform designed to connect <strong>crypto teams</strong>, <strong>KOLs (Key Opinion Leaders)</strong>, and <strong>developers</strong>, building a transparent and efficient hub for blockchain ecosystem publishing and collaboration.</p>
                <p className="text-muted-foreground mt-2">The platform enables real identity verification through wallet connections, allowing seamless interactions for crypto team needs, talent matching, knowledge sharing, and community engagement. Its core goal is to address long-standing issues in the Web3 ecosystem—fragmentation, lack of trust, and insufficient incentives—accelerating healthier and faster real-world adoption of blockchain innovation.</p>
              </section>

              <section>
                <h2 className="text-base font-bold mb-2">2. Current Pain Points in the Web3 Ecosystem</h2>
                <ul className="list-disc list-inside space-y-1.5 text-muted-foreground">
                  <li>Crypto teams struggle to efficiently find reliable developers, security auditors, node operators, or community partners. Information is scattered across Twitter, Discord, Telegram, and other channels, resulting in extremely high screening costs.</li>
                  <li>KOLs frequently receive numerous low-quality collaboration requests, making it difficult to assess project legitimacy, while high-quality content creators lack sustained incentive mechanisms.</li>
                  <li>Developers face unequal opportunities in on-chain projects, remaining invisible and struggling to match with truly valuable tasks (e.g., bug bounties, hackathons, node recruitment).</li>
                  <li>The overall ecosystem suffers from information asymmetry, trust barriers, redundant development, low-quality collaborations, rampant scams, and reduced efficiency in genuine innovation.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-bold mb-2">3. Core Solutions</h2>
                <p className="text-muted-foreground mb-2">Web3 Release offers a unified, permissionless collaboration space where all interactions are based on wallet addresses, ensuring pseudonymity with traceability. The main user roles:</p>
                <div className="space-y-3">
                  <div className="bg-muted/40 rounded-xl p-4">
                    <h3 className="font-semibold text-sm mb-1">3.1 Crypto Teams</h3>
                    <p className="text-muted-foreground text-xs">Can publish testnet recruitment, IDO/Launchpad collaborations, security audit requests, integration announcements, airdrop plans, funding/recruitment/node recruitment, hackathons/bug bounties, and more. All content appears in the homepage "Project Showcase" area and corresponding sections.</p>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-4">
                    <h3 className="font-semibold text-sm mb-1">3.2 KOLs (Key Opinion Leaders)</h3>
                    <p className="text-muted-foreground text-xs">Can publish collaboration intentions, project reviews, market insights, AMAs, and more. Dedicated KOL section + KOL leaderboard, automatically ranked based on real engagement metrics. The top 200 most active KOLs each month receive ecosystem airdrop rewards.</p>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-4">
                    <h3 className="font-semibold text-sm mb-1">3.3 Developers</h3>
                    <p className="text-muted-foreground text-xs">Can publish technical shares, job intentions, open-source contributions, bug bounty tasks, etc. Dedicated "Developers" section where all developer posts are vertically displayed, making it easy for crypto teams to quickly screen talent.</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-base font-bold mb-2">4. Points System (Core Incentive Mechanism)</h2>
                <p className="text-muted-foreground mb-2">Web3 Release features a built-in points system to incentivize high-quality content creation and community participation. The total points supply is unlimited and can be used for future airdrop redemptions or other ecosystem benefits.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1.5">General User Points</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Daily check-in: <strong>+1,000 pts</strong></li>
                      <li>• Likes: <strong>+100 pts</strong> per like</li>
                      <li>• Comments: <strong>+100 pts</strong> per comment (first 10/day)</li>
                      <li>• Referral: 20% of referred user's daily points</li>
                    </ul>
                  </div>
                  <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl p-3">
                    <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 mb-1.5">KOL-Exclusive Points</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Post liked: <strong>+10 pts</strong> per like</li>
                      <li>• Post commented: <strong>+10 pts</strong> per comment</li>
                      <li>• Per 1,000 post views: <strong>+50 pts</strong></li>
                      <li>• Referral: same 20% as above</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-base font-bold mb-2">5. Contributions to the Blockchain Field</h2>
                <div className="space-y-2">
                  {[
                    ["Reduces Collaboration Friction", "Crypto team demands and developer/KOL supply are matched in real time on a single platform, minimizing cross-platform searches and trust costs."],
                    ["Verifiable Reputation System", "Based on wallet addresses + engagement data (likes, comments, views), it forms a decentralized reputation system that reduces scam risks."],
                    ["Incentivizes Genuine Contributions", "Points are earned from real interactions, enabling KOLs and developers to receive ongoing rewards through high-quality content."],
                    ["Promotes Multi-Chain Collaboration", "Unified display of cross-chain information such as testnets, airdrops, audits, and hackathons accelerates ecosystem interconnectivity."],
                    ["Empowers Developers and Mid-Tier KOLs", "Provides zero-barrier exposure channels, allowing truly capable individuals to be discovered without relying on centralized platform algorithms or paid promotions."],
                  ].map(([title, desc]) => (
                    <div key={title} className="flex gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0 mt-1.5" />
                      <div><span className="font-semibold">{title}</span> — <span className="text-muted-foreground">{desc}</span></div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950/20 dark:to-blue-950/20 border border-violet-100 dark:border-violet-900 rounded-2xl p-5">
                <h2 className="text-base font-bold mb-2">6. Vision</h2>
                <p className="text-muted-foreground">Web3 Release aims to become the <strong>"Twitter + LinkedIn + Gitcoin"</strong> of the Web3 era—a truly decentralized, community self-driven collaboration and publishing hub.</p>
                <p className="text-muted-foreground mt-2">We believe that when crypto teams, KOLs, and developers can freely publish and collaborate in an environment of trust, traceability, and sufficient incentives, the next wave of genuine blockchain innovation will accelerate.</p>
                <p className="mt-3 font-bold text-violet-600 dark:text-violet-400">Web3 Release – Connecting Demands, Unleashing Innovation.</p>
              </section>
            </div>
          </div>
        </div>
      )}

      <WalletPickerModal open={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
    </div>
  );
}
