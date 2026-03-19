import { useState } from "react";
import { useWeb3Auth } from "@/lib/web3";
import { useCreatePost, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLang } from "@/lib/i18n";
import { useLocation } from "wouter";
import { AlertCircle, CheckCircle2, PenSquare, Zap, X, Pin } from "lucide-react";
import { RechargeModal } from "@/components/recharge-modal";

function getApiBase() {
  const base = import.meta.env.BASE_URL ?? "/";
  const parts = base.replace(/\/$/, "").split("/");
  parts.pop();
  return parts.join("/") + "/api";
}

const ALL_SECTIONS = [
  "testnet", "ido", "security", "integration", "airdrop",
  "events", "funding", "jobs", "nodes", "showcase",
  "ecosystem", "partners", "hackathon", "ama", "bugbounty",
  "community", "kol", "developer",
] as const;

const KOL_SECTIONS: typeof ALL_SECTIONS[number][] = [
  "testnet", "events", "ecosystem", "partners", "hackathon", "ama", "bugbounty", "community",
];

const DEV_SECTIONS: typeof ALL_SECTIONS[number][] = [
  "developer", "hackathon", "bugbounty", "security", "integration", "nodes", "community",
];

const SECTION_LABEL_KEYS: Record<string, string> = {
  testnet: "sTestnetLabel", ido: "sIdoLabel", security: "sSecurityLabel",
  integration: "sIntegrationLabel", airdrop: "sAirdropLabel", events: "sEventsLabel",
  funding: "sFundingLabel", jobs: "sJobsLabel", nodes: "sNodesLabel",
  showcase: "sShowcaseLabel", ecosystem: "sEcosystemLabel", partners: "sPartnersLabel",
  hackathon: "sHackathonLabel", ama: "sAmaLabel", bugbounty: "sBugbountyLabel",
  community: "nav_community", kol: "nav_kol", developer: "nav_developer",
};

function getSections(spaceType: string): string[] {
  if (spaceType === "kol") return KOL_SECTIONS as unknown as string[];
  if (spaceType === "developer") return DEV_SECTIONS as unknown as string[];
  return ALL_SECTIONS as unknown as string[]; // project / admin
}

type Step = "form" | "confirm" | "done";

export default function PostNew() {
  const { address, isConnected } = useWeb3Auth();
  const createPost = useCreatePost();
  const queryClient = useQueryClient();
  const { t } = useLang();
  const [, setLocation] = useLocation();

  const { data: meData, refetch: refetchMe } = useGetMe(
    { wallet: address ?? "" },
    { query: { enabled: !!address && isConnected } }
  );
  const me = (meData as any)?.user ?? meData;
  const energy = me?.energy ?? 0;
  const pinCount = me?.pinCount ?? 0;
  const spaceType = me?.spaceType ?? "";
  const isAdminUser = energy >= 99_000_000_000_000;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [section, setSection] = useState("");
  const [wantToPin, setWantToPin] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState("");
  const [showRecharge, setShowRecharge] = useState(false);

  const availableSections = getSections(spaceType);
  const inputCls = "w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground placeholder:text-muted-foreground";

  const validateForm = () => {
    if (!title.trim()) { setError("标题不能为空"); return false; }
    if (!content.trim()) { setError("内容不能为空"); return false; }
    if (!section) { setError("请选择分区"); return false; }
    if (!availableSections.includes(section)) { setError("您没有权限在此分区发帖"); return false; }
    setError(""); return true;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !validateForm()) return;
    if (!isAdminUser && energy <= 0) { setShowRecharge(true); return; }
    setStep("confirm");
  };

  const pinPost = async (postId: number) => {
    const apiBase = getApiBase();
    await fetch(`${apiBase}/posts/${postId}/pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: address }),
    });
  };

  const handleConfirmedPost = () => {
    if (!address) return;
    createPost.mutate(
      { data: { title: title.trim(), content: content.trim(), section, authorWallet: address } },
      {
        onSuccess: async (newPost: any) => {
          if (wantToPin && newPost?.id && pinCount > 0) {
            await pinPost(newPost.id);
          }
          queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
          queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
          refetchMe();
          setStep("done");
          setTimeout(() => setLocation("/"), 2500);
        },
        onError: (e: any) => {
          const body = (e as any)?.response ?? (e as any)?.body ?? {};
          const errCode = body?.error ?? String(e?.message ?? "");
          if (errCode === "INSUFFICIENT_ENERGY") {
            setStep("form"); setShowRecharge(true);
          } else if (errCode === "DAILY_LIMIT") {
            setStep("form"); setError(`今日发帖已达上限（${body?.limit ?? ""}条/天）`);
          } else {
            setStep("form"); setError(errCode || "发布失败，请重试");
          }
        },
      }
    );
  };

  if (!isConnected) {
    return (
      <div className="py-32 text-center max-w-sm mx-auto">
        <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t("connect")}</h2>
        <p className="text-muted-foreground text-sm">请先连接钱包才能发帖。</p>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="py-32 text-center max-w-md mx-auto animate-in zoom-in">
        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold mb-3">{t("postSuccess")}</h2>
        <p className="text-muted-foreground">正在跳回首页...</p>
      </div>
    );
  }

  return (
    <>
      {showRecharge && address && (
        <RechargeModal walletAddress={address} onClose={() => setShowRecharge(false)} />
      )}

      {/* ── Energy Confirmation Overlay ── */}
      {step === "confirm" && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setStep("form")} />
          <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-5">
            <button onClick={() => setStep("form")} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-1">
                <Zap className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold">确认发帖</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isAdminUser
                  ? "管理员发帖不消耗能量，直接确认。"
                  : `这将消耗 1 能量${wantToPin && pinCount > 0 ? " + 1 置顶次数" : ""}。当前剩余：${energy} 能量 / ${pinCount} 置顶次数`}
              </p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 space-y-1.5 text-left">
              <p className="text-xs text-muted-foreground">分区：<span className="font-semibold text-foreground">{t(SECTION_LABEL_KEYS[section] ?? section)}</span>
                {wantToPin && pinCount > 0 && <span className="ml-2 text-amber-500 font-bold">📌 置顶3天</span>}
              </p>
              <p className="text-sm font-bold text-foreground line-clamp-2">{title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{content}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep("form")} className="flex-1 py-3 rounded-xl border border-border font-semibold text-sm hover:bg-muted transition-colors">
                取消
              </button>
              <button onClick={handleConfirmedPost} disabled={createPost.isPending}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-60 shadow-lg shadow-primary/20">
                {createPost.isPending ? "发布中..." : "确认发布"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <PenSquare className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">{t("createPostTitle")}</h1>
          </div>
          {!isAdminUser && (
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
                energy <= 0 ? "bg-red-100 dark:bg-red-950/30 text-red-600" :
                energy <= 5 ? "bg-amber-100 dark:bg-amber-950/30 text-amber-600" :
                "bg-green-100 dark:bg-green-950/30 text-green-600"}`}>
                <Zap className="w-3.5 h-3.5" />{energy} 能量
              </div>
              {pinCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-violet-100 dark:bg-violet-950/30 text-violet-600">
                  <Pin className="w-3.5 h-3.5" />{pinCount} 置顶
                </div>
              )}
              {energy <= 0 && (
                <button onClick={() => setShowRecharge(true)} className="text-xs text-primary hover:underline font-semibold">充值</button>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleFormSubmit} className="bg-card border border-border rounded-2xl p-7 space-y-5 shadow-sm">
          {/* Section */}
          <div>
            <label className="block text-sm font-semibold mb-2">{t("postFormSection")} *</label>
            <select value={section} onChange={e => setSection(e.target.value)} className={inputCls}>
              <option value="">{t("postFormSection")}...</option>
              {availableSections.map(s => (
                <option key={s} value={s}>{t(SECTION_LABEL_KEYS[s] ?? s)}</option>
              ))}
            </select>
            {spaceType === "kol" && (
              <p className="text-xs text-muted-foreground mt-1">KOL 可选分区（8个）</p>
            )}
            {spaceType === "developer" && (
              <p className="text-xs text-muted-foreground mt-1">开发者可选分区（7个）</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-2">{t("postFormTitle")} *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder={t("postFormTitle") + "..."} className={inputCls} maxLength={120} />
            <div className="text-xs text-muted-foreground text-right mt-1">{title.length}/120</div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold mb-2">{t("postFormContent")} *</label>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder={t("postFormContent") + "..."} rows={8}
              className={`${inputCls} resize-y min-h-[160px]`} maxLength={5000} />
            <div className="text-xs text-muted-foreground text-right mt-1">{content.length}/5000</div>
          </div>

          {/* Pin option */}
          {pinCount > 0 && (
            <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors
              hover:border-amber-300 has-[:checked]:border-amber-400 has-[:checked]:bg-amber-50 dark:has-[:checked]:bg-amber-950/20">
              <input type="checkbox" checked={wantToPin} onChange={e => setWantToPin(e.target.checked)}
                className="w-4 h-4 accent-amber-500" />
              <Pin className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">置顶此帖（消耗 1 次置顶次数）</p>
                <p className="text-xs text-muted-foreground">发布后自动置顶3天，显示倒计时。当前剩余：{pinCount} 次</p>
              </div>
            </label>
          )}

          {error && (
            <div className="px-4 py-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
          )}

          {!isAdminUser && energy > 0 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400" />
              提交后将消耗 1 能量{wantToPin && pinCount > 0 ? " + 1 置顶次数" : ""}，当前剩余 {energy} 能量
            </p>
          )}

          <button type="submit" disabled={createPost.isPending}
            className="w-full py-4 rounded-xl font-bold text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-50">
            {t("postFormSubmit")}
          </button>
        </form>
      </div>
    </>
  );
}
