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
        <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col sm:flex-row items-center justify-between gap-4">
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
            <button onClick={() => setWhitepaperOpen(true)}
              className="px-3 py-1.5 rounded-full bg-muted/60 dark:bg-slate-700 hover:bg-violet-50 dark:hover:bg-violet-900/40 text-xs font-medium text-muted-foreground dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors border border-border/50 dark:border-slate-600">
              免责声明
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

      {/* ── Disclaimer Modal ── */}
      {whitepaperOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setWhitepaperOpen(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-border" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-500" />
                <span className="font-bold text-base text-foreground">Web3 Release 免责声明</span>
                <span className="text-xs text-muted-foreground ml-1">版本 1.0 · 2026年3月23日</span>
              </div>
              <button onClick={() => setWhitepaperOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-6 py-5 text-sm text-foreground leading-relaxed space-y-4">
              {[
                ["1. 平台性质", "Web3 Release 是一个去中心化、社区驱动的 Web3 协作平台，仅提供信息发布、展示和匹配服务。平台不参与任何交易、投资、融资、代币发行或法律行为，仅作为用户间信息交流的中介工具。平台上所有内容（包括但不限于需求发布、合作意向、测试网招募、IDO 信息、空投计划、招聘、节点招募等）均由用户自行发布，平台不拥有、不控制、不担保其真实性、合法性、完整性或安全性。"],
                ["2. 用户责任", "用户在使用平台时，应自行判断内容的真实性、可信度和风险。用户之间的一切互动、合作、交易、转账、投资等行为均为双方自愿、私下达成，与 Web3 Release 平台无关。用户因基于平台信息产生的任何损失、纠纷、法律责任，均由用户自行承担，平台不承担任何连带责任。"],
                ["3. 无投资建议", "平台上出现的任何项目信息、代币、空投、IDO、Launchpad、融资公告、节点招募等内容，不构成任何形式的投资建议、金融建议、法律建议或商业承诺。平台不提供投资咨询服务，用户参与任何项目均需自行评估风险，并遵守当地法律法规。投资有风险，入市需谨慎。"],
                ["4. 代币与积分声明", "平台当前积分系统仅用于记录用户贡献与活跃度，是未来 $W3R 代币空投分配的重要凭证，但不保证任何兑换价值或收益。未来 $W3R 代币（如发行）仅用于平台内能量消耗、发帖门槛等实用功能，不构成证券、金融衍生品或投资工具。平台不承诺任何代币升值、回报、分红或流动性。代币相关事宜以最终白皮书、DAO 治理决议为准。"],
                ["5. 技术与安全风险", "平台基于区块链和钱包连接技术运行，可能存在智能合约漏洞、网络攻击、钱包安全问题、DNS 解析延迟、DDoS 等技术风险。用户需自行保护钱包私钥、助记词等信息，避免钓鱼、诈骗。平台不对因用户操作失误、技术故障导致的资产损失负责。"],
                ["6. 第三方链接与内容", "平台可能链接外部网站、社交媒体、项目官网等第三方资源，这些链接仅供参考，平台不控制、不审核、不担保其内容。用户访问第三方链接产生的任何后果，由用户自行承担。"],
                ["7. 法律适用与管辖", "本免责声明受新加坡法律管辖（如有争议，以新加坡法院为第一审管辖）。平台保留随时修改本声明的权利，修改后继续使用即视为同意。"],
              ].map(([title, body]) => (
                <section key={title}>
                  <h2 className="font-bold text-foreground mb-1.5">{title}</h2>
                  <p className="text-muted-foreground">{body}</p>
                </section>
              ))}

              <section className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mt-2">
                <p className="font-bold text-amber-700 dark:text-amber-400 mb-1">重要提醒</p>
                <p className="text-muted-foreground text-sm">使用 Web3 Release 即表示您已阅读、理解并完全同意本免责声明。平台不向任何用户提供任何明示或默示的担保或承诺。参与 Web3 生态存在高风险，请用户理性判断、谨慎行事。如不同意本声明，请立即停止使用平台。</p>
              </section>

              <p className="text-right text-xs text-muted-foreground pt-1">Web3 Release 团队 · 2026年3月23日</p>
            </div>
          </div>
        </div>
      )}

      <WalletPickerModal open={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
    </div>
  );
}
