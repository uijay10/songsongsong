import { useState } from "react";
import { filterContent, filterErrorMessage } from "@/lib/content-filter";
import { useWeb3Auth } from "@/lib/web3";
import { useCreatePost, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLang } from "@/lib/i18n";
import { useLocation } from "wouter";
import { AlertCircle, CheckCircle2, PenSquare, Zap, X, Pin, Sparkles, Copy, Check } from "lucide-react";

function getApiBase() {
  const base = import.meta.env.BASE_URL ?? "/";
  const parts = base.replace(/\/$/, "").split("/");
  parts.pop();
  return parts.join("/") + "/api";
}

const ALL_SECTIONS = [
  "recruiting",
  "testnet", "ido", "security", "integration", "airdrop",
  "events", "funding", "jobs", "nodes",
  "ecosystem", "partners", "hackathon", "ama", "bugbounty",
  "community", "developer",
] as const;

const PROJECT_SECTIONS: typeof ALL_SECTIONS[number][] = [
  "recruiting",
  "testnet", "ido", "security", "integration", "airdrop",
  "events", "funding", "nodes",
  "ecosystem", "partners", "hackathon", "ama", "bugbounty",
  "community", "developer",
];

const KOL_SECTIONS: typeof ALL_SECTIONS[number][] = [
  "testnet", "events", "ecosystem", "partners", "hackathon", "ama", "bugbounty", "community", "jobs",
];

const DEV_SECTIONS: typeof ALL_SECTIONS[number][] = [
  "developer", "hackathon", "bugbounty", "security", "integration", "jobs", "community",
];

const NORMAL_SECTIONS: typeof ALL_SECTIONS[number][] = ["jobs", "community"];

const SECTION_LABEL_KEYS: Record<string, string> = {
  testnet: "sTestnetLabel", ido: "sIdoLabel", security: "sSecurityLabel",
  integration: "sIntegrationLabel", airdrop: "sAirdropLabel", events: "sEventsLabel",
  funding: "sFundingLabel", jobs: "sJobsLabel", recruiting: "sRecruitingLabel", nodes: "sNodesLabel",
  ecosystem: "sEcosystemLabel", partners: "sPartnersLabel",
  hackathon: "sHackathonLabel", ama: "sAmaLabel", bugbounty: "sBugbountyLabel",
  community: "nav_community", developer: "nav_developer",
};

function getSections(spaceType: string): string[] {
  if (spaceType === "kol") return KOL_SECTIONS as unknown as string[];
  if (spaceType === "developer") return DEV_SECTIONS as unknown as string[];
  if (!spaceType) return NORMAL_SECTIONS as unknown as string[];
  return PROJECT_SECTIONS as unknown as string[];
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
  const [pinQueued, setPinQueued] = useState(false);
  const [pinQueuedEstimate, setPinQueuedEstimate] = useState<string | null>(null);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);

  // AI Assistant
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiCopied, setAiCopied] = useState(false);

  const buildPrompt = (userInput: string, isEn: boolean) => {
    if (isEn) return `You are a professional Web3 Release demand-writing assistant, helping users publish high-quality posts on https://web3release.com/\n\nUser requirement: ${userInput}\n\nPlease output in the following format:\n\n**Title** (Short, impactful, keyword-rich, max 120 chars)\n\n**Detailed Content** (Professional, clear, crypto-native tone, highlight project strengths, specific needs, call-to-action, use emojis where appropriate)\n\n**Recommended Tags** (Suitable for platform sections: Testnet, IDO, Security Audit, Recruiting, Airdrop, Events, Funding, Nodes, Hackathon, etc.)\n\nTone: Professional and exciting, suitable for Web3 users, avoid being overly sales-oriented.`;
    return `你是一个 Web3 Release 专业需求撰写助手，专门帮助用户在 https://web3release.com/ 发布高质量需求帖。\n\n用户的需求：${userInput}\n\n请严格按照以下格式输出：\n\n**标题**（简短有力、吸引眼球，包含关键词，最多 120 字符）\n\n**详细内容**（专业、清晰、crypto-native 语气，突出项目亮点、具体需求、行动号召，适当使用 emoji）\n\n**推荐标签**（适合平台分区：测试网发布、IDO/Launchpad、安全审计、招募、空投、活动奖励、融资轮次、节点招募、黑客松等）\n\n输出语气：专业且兴奋，适合 Web3 用户，避免过于销售化。`;
  };

  const copyAiPrompt = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setAiCopied(true);
      setTimeout(() => setAiCopied(false), 2000);
    });
  };

  const availableSections = getSections(spaceType);
  const inputCls = "w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground placeholder:text-muted-foreground";

  const withPin = wantToPin && pinCount > 0;

  const validateForm = () => {
    if (!title.trim()) { setError(t("postErrNoTitle")); return false; }
    if (!content.trim()) { setError(t("postErrNoContent")); return false; }
    if (!section) { setError(t("postErrNoSection")); return false; }
    if (!availableSections.includes(section)) { setError(t("postErrNoPermission")); return false; }
    const titleCheck = filterContent(title.trim());
    if (!titleCheck.ok) { setError(filterErrorMessage(titleCheck)); return false; }
    const contentCheck = filterContent(content.trim());
    if (!contentCheck.ok) { setError(filterErrorMessage(contentCheck)); return false; }
    setError(""); return true;
  };

  const isNormalPoster = !spaceType || (spaceType !== "project" && spaceType !== "kol" && spaceType !== "developer");
  const normalPostsUsed = isNormalPoster ? (() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const storedDate = me?.normalDailyPostDate ?? null;
    return storedDate === todayStr ? (me?.normalDailyPostCount ?? 0) : 0;
  })() : 0;
  const normalPostsRemaining = Math.max(0, 10 - normalPostsUsed);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !validateForm()) return;
    // All users (including normal users) need energy > 0 to post
    if (!isAdminUser && energy <= 0) { setShowRecharge(true); return; }
    // Show overwrite warning if normal user already posted today
    if (isNormalPoster && normalPostsUsed >= 1) { setShowOverwriteConfirm(true); return; }
    setStep("confirm");
  };

  const pinPost = async (postId: number) => {
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/posts/${postId}/pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: address }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.queued) {
      setPinQueued(true);
      setPinQueuedEstimate(data.estimatedAt ?? null);
    }
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
          if (errCode === "BANNED") {
            setStep("form"); setError(t("bannedError"));
          } else if (errCode === "INSUFFICIENT_ENERGY") {
            setStep("form"); setShowRecharge(true);
          } else if (errCode === "DAILY_LIMIT") {
            setStep("form"); setError(t("postErrDailyLimit").replace("{n}", String(body?.limit ?? "")));
          } else if (errCode === "NORMAL_DAILY_LIMIT") {
            setStep("form");
            setError(`今日发布已达上限（${body?.limit ?? 10}次），请明天再试。`);
          } else if (errCode === "NORMAL_USER_SECTION_RESTRICTED") {
            setStep("form"); setError("普通用户只能发布到求职/招聘分区");
          } else if (errCode === "CONTENT_FILTER") {
            setStep("form"); setError(body?.message || t("postErrContentFilter"));
          } else {
            setStep("form"); setError(errCode || t("postErrGeneral"));
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
        <p className="text-muted-foreground text-sm">{t("postConnectWalletHint")}</p>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="py-24 text-center max-w-md mx-auto animate-in zoom-in space-y-6">
        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto" />
        <div>
          <h2 className="text-3xl font-bold mb-2">{t("postSuccess")}</h2>
          {pinQueued ? (
            <div className="mt-4 px-5 py-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/50 text-left space-y-1.5">
              <p className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <Pin className="w-4 h-4" /> {t("postPinQueued")}
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400/80 leading-relaxed">
                {t("postPinQueuedDesc")}
              </p>
              {pinQueuedEstimate && (
                <p className="text-xs text-muted-foreground">
                  {t("postPinQueuedEta")} {new Date(pinQueuedEstimate).toLocaleString()}
                </p>
              )}
            </div>
          ) : wantToPin ? (
            <p className="text-green-600 text-sm mt-1 font-semibold">{t("postPinned3Days")}</p>
          ) : null}
          <p className="text-muted-foreground text-sm mt-4">{t("postRedirecting")}</p>
        </div>
      </div>
    );
  }

  const confirmEnergyText = isAdminUser
    ? t("postConfirmAdmin")
    : (withPin
        ? t("postConfirmEnergyPin").replace("{energy}", String(energy)).replace("{pin}", String(pinCount))
        : t("postConfirmEnergy").replace("{energy}", String(energy)).replace("{pin}", String(pinCount)));

  return (
    <>
      {showRecharge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ pointerEvents: "auto" }}>
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={() => setShowRecharge(false)} />
          <div
            className="relative w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4"
            style={{ backgroundColor: "#0A0C14", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(245,158,11,0.15)" }}>
                <Zap className="w-5 h-5" style={{ color: "#f59e0b" }} />
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
                {t("noEnergyAlertMsg")}
              </p>
            </div>
            <button
              onClick={() => setShowRecharge(false)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ backgroundColor: "rgba(245,158,11,0.15)", color: "#f59e0b" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(245,158,11,0.25)")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "rgba(245,158,11,0.15)")}
            >
              {t("noEnergyAlertBtn")}
            </button>
          </div>
        </div>
      )}

      {/* ── AI Assistant Modal ── */}
      {aiOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAiOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: "#0A0C14", border: "1px solid rgba(255,215,0,0.25)" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5" style={{ color: "#FFD700" }} />
                <span className="font-bold text-white text-base">{t("aiAssistantTitle")}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(255,215,0,0.12)", color: "#FFD700" }}>
                  {t("aiAssistantFree")}
                </span>
              </div>
              <button onClick={() => setAiOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>
            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                {t("aiAssistantDesc")}
              </p>
              <textarea
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                placeholder={t("aiAssistantPlaceholder")}
                rows={3}
                className="w-full rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", caretColor: "#FFD700" }}
              />
              <div className="flex gap-2.5">
                <button
                  onClick={() => { setAiResult(buildPrompt(aiInput.trim(), false)); setAiCopied(false); }}
                  disabled={!aiInput.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                  style={{ background: "rgba(255,215,0,0.15)", color: "#FFD700", border: "1px solid rgba(255,215,0,0.3)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,215,0,0.25)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,215,0,0.15)")}
                >
                  {t("aiAssistantGenCN")}
                </button>
                <button
                  onClick={() => { setAiResult(buildPrompt(aiInput.trim(), true)); setAiCopied(false); }}
                  disabled={!aiInput.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                  style={{ background: "rgba(100,180,255,0.12)", color: "#60a5fa", border: "1px solid rgba(100,180,255,0.25)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(100,180,255,0.22)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(100,180,255,0.12)")}
                >
                  {t("aiAssistantGenEN")}
                </button>
              </div>
              {aiResult && (
                <div className="relative rounded-xl p-3 text-xs leading-relaxed font-mono max-h-48 overflow-y-auto"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)", whiteSpace: "pre-wrap" }}>
                  {aiResult}
                  <button
                    onClick={() => copyAiPrompt(aiResult)}
                    className="sticky bottom-0 left-0 mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                    style={{ background: aiCopied ? "rgba(34,197,94,0.2)" : "rgba(255,215,0,0.2)", color: aiCopied ? "#22c55e" : "#FFD700" }}
                  >
                    {aiCopied ? <><Check className="w-3 h-3" />{t("aiAssistantCopied")}</> : <><Copy className="w-3 h-3" />{t("aiAssistantCopy")}</>}
                  </button>
                </div>
              )}
              {!aiResult && (
                <p className="text-xs text-center py-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {t("aiAssistantHint")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Energy Confirmation Overlay ── */}
      {step === "confirm" && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setStep("form")} />
          <div className="relative w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 space-y-5">
            <button onClick={() => setStep("form")} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-1">
                <Zap className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{t("postConfirmTitle")}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{confirmEnergyText}</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-1.5 text-left">
              <p className="text-xs text-gray-400">
                {t("postConfirmSectionLabel")} <span className="font-semibold text-gray-700">{t(SECTION_LABEL_KEYS[section] ?? section)}</span>
                {withPin && <span className="ml-2 text-amber-500 font-bold">{t("postPin3Days")}</span>}
              </p>
              <p className="text-sm font-bold text-gray-900 line-clamp-2">{title}</p>
              <p className="text-xs text-gray-500 line-clamp-2">{content}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep("form")}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors">
                {t("cancel")}
              </button>
              <button onClick={handleConfirmedPost} disabled={createPost.isPending}
                className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-all disabled:opacity-60 shadow-lg shadow-green-500/20">
                {createPost.isPending ? t("postFormSubmitting") : t("postConfirmPublish")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overwrite confirmation dialog for normal users re-posting */}
      {showOverwriteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto rounded-2xl p-6 max-w-sm w-full space-y-4"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
            <p className="text-sm leading-relaxed" style={{ color: "#111827" }}>{t("normalOverwriteMsg")}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowOverwriteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
                onMouseOver={e => (e.currentTarget.style.backgroundColor = "#e5e7eb")}
                onMouseOut={e => (e.currentTarget.style.backgroundColor = "#f3f4f6")}>
                {t("cancel")}
              </button>
              <button onClick={() => { setShowOverwriteConfirm(false); setStep("confirm"); }}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors"
                style={{ backgroundColor: "#FF69B4", color: "#ffffff" }}
                onMouseOver={e => (e.currentTarget.style.backgroundColor = "#ff4da6")}
                onMouseOut={e => (e.currentTarget.style.backgroundColor = "#FF69B4")}>
                {t("pinOk")}
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
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
                energy <= 0 ? "bg-red-100 dark:bg-red-950/30 text-red-600" :
                energy <= 5 ? "bg-amber-100 dark:bg-amber-950/30 text-amber-600" :
                "bg-green-100 dark:bg-green-950/30 text-green-600"}`}>
                <Zap className="w-3.5 h-3.5" />{energy} {t("energyUnit")}
              </div>
              {!isNormalPoster && pinCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-violet-100 dark:bg-violet-950/30 text-violet-600">
                  <Pin className="w-3.5 h-3.5" />{pinCount} {t("pinUnit")}
                </div>
              )}
              {energy <= 0 && (
                <button onClick={() => setShowRecharge(true)} className="text-xs text-primary hover:underline font-semibold">{t("noEnergyHint")}</button>
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
            {!spaceType && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
                {t("normalPostHint").replace("{n}", String(normalPostsRemaining))}
              </p>
            )}
            {spaceType === "kol" && (
              <p className="text-xs text-muted-foreground mt-1">{t("postKolSectionNote")}</p>
            )}
            {spaceType === "developer" && (
              <p className="text-xs text-muted-foreground mt-1">{t("postDevSectionNote")}</p>
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold">{t("postFormContent")} *</label>
              <button
                type="button"
                onClick={() => { setAiOpen(true); setAiResult(""); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{ background: "linear-gradient(135deg, #1a1040 0%, #2a1060 100%)", color: "#FFD700", border: "1px solid rgba(255,215,0,0.35)" }}
              >
                <Sparkles className="w-3 h-3" />
                {t("aiAssistantBtn")}
              </button>
            </div>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder={t("postFormContent") + "..."} rows={8}
              className={`${inputCls} resize-y min-h-[160px]`} maxLength={5000} />
            <div className="text-xs text-muted-foreground text-right mt-1">{content.length}/5000</div>
          </div>

          {/* Pin option — project users only */}
          {pinCount > 0 && spaceType === "project" && (
            <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors
              hover:border-amber-300 has-[:checked]:border-amber-400 has-[:checked]:bg-amber-50 dark:has-[:checked]:bg-amber-950/20">
              <input type="checkbox" checked={wantToPin} onChange={e => setWantToPin(e.target.checked)}
                className="w-4 h-4 accent-amber-500" />
              <Pin className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{t("postPinLabel")}</p>
                <p className="text-xs text-muted-foreground">{t("postPinDesc").replace("{n}", String(pinCount))}</p>
              </div>
            </label>
          )}

          {error && (
            <div className="px-4 py-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
          )}

          {!isAdminUser && energy > 0 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400" />
              {(withPin ? t("postEnergyNotePin") : t("postEnergyNote")).replace("{energy}", String(energy))}
            </p>
          )}

          <button type="submit" disabled={createPost.isPending}
            className="w-full py-4 rounded-xl font-bold text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-50">
            {t("aiPublishBtn")}
          </button>
        </form>
      </div>
    </>
  );
}
