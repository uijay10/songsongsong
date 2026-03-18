import { Link, useLocation } from "wouter";
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useWeb3Auth } from "@/lib/web3";
import { Box, Search, Plus, LogOut, User as UserIcon } from "lucide-react";
import { cn, truncateAddress, generateGradient } from "@/lib/utils";
import { useState } from "react";

const NAV_SECTIONS: { label: string; href: string }[] = [
  { label: "测试网",        href: "/section/testnet" },
  { label: "IDO/Launchpad", href: "/section/ido" },
  { label: "安全审计",      href: "/section/security" },
  { label: "集成公告",      href: "/section/integration" },
  { label: "空投计划",      href: "/section/airdrop" },
  { label: "活动奖励",      href: "/section/events" },
  { label: "融资公告",      href: "/section/funding" },
  { label: "招聘人才",      href: "/section/jobs" },
  { label: "节点招募",      href: "/section/nodes" },
  { label: "项目展示",      href: "/showcase" },
  { label: "生态系统",      href: "/section/ecosystem" },
  { label: "伙伴招募",      href: "/section/partners" },
  { label: "黑客松",        href: "/section/hackathon" },
  { label: "AMA",           href: "/section/ama" },
  { label: "漏洞赏金",      href: "/section/bugbounty" },
  { label: "社区聊天",      href: "/community" },
  { label: "KOL 合作",      href: "/kol" },
  { label: "开发者",        href: "/developer" },
  { label: "KOL",           href: "/kol" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { open } = useWeb3Modal();
  const { address, isConnected, user, disconnect } = useWeb3Auth();
  const [location] = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Box className="w-6 h-6 text-primary" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight">Web3Hub</span>
            </Link>

            <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="搜索项目、需求或 KOL..."
                className="block w-full pl-10 pr-3 py-2 border border-border rounded-full leading-5 bg-muted/50 placeholder-muted-foreground focus:outline-none focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all sm:text-sm"
              />
            </div>

            <div className="flex items-center gap-4">
              <Link 
                href="/apply" 
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-4 h-4" />
                申请创建空间
              </Link>
              
              {!isConnected ? (
                <button
                  onClick={() => open()}
                  className="px-6 py-2.5 rounded-full font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow transition-all active:scale-95"
                >
                  连接钱包
                </button>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 p-1 pr-3 rounded-full border border-border hover:border-primary/50 hover:bg-muted/30 transition-all"
                  >
                    <div 
                      className="w-8 h-8 rounded-full shadow-inner" 
                      style={{ background: user?.avatar ? `url(${user.avatar})` : generateGradient(address) }}
                    />
                    <span className="text-sm font-medium font-mono">{truncateAddress(address)}</span>
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl shadow-xl border border-border/50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <Link 
                        href="/profile" 
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4" />
                        个人资料
                      </Link>
                      <button 
                        onClick={() => {
                          disconnect();
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        退出登录
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Navigation Categories */}
        <div className="border-t border-border/30 bg-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground justify-center">
              {NAV_SECTIONS.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    "hover:text-primary transition-colors cursor-pointer whitespace-nowrap py-0.5 px-1 rounded",
                    location === href ? "text-primary font-semibold" : ""
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      
      <footer className="border-t border-border py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Web3Hub. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
