import { useState } from "react";
import { filterContent, filterErrorMessage } from "@/lib/content-filter";
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

const NORMAL_SECTIONS: typeof ALL_SECTIONS[number][] = ["jobs"];

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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !validateForm()) return;
    // Normal users (no approved space type) skip the energy requirement — they have a 24h posting limit instead
    if (!isAdminUser && !isNormalPoster && energy <= 0) { setShowRecharge(true); return; }
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
            const next = body?.nextPost ? new Date(body.nextPost).toLocaleString() : "";
            setError(`普通用户每24小时只能发布一次，下次可发：${next}`);
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
      {showRecharge && address && (
        <RechargeModal walletAddress={address} onClose={() => setShowRecharge(false)} />
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

      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <PenSquare className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">{t("createPostTitle")}</h1>
          </div>
          {!isAdminUser && !isNormalPoster && (
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
                energy <= 0 ? "bg-red-100 dark:bg-red-950/30 text-red-600" :
                energy <= 5 ? "bg-amber-100 dark:bg-amber-950/30 text-amber-600" :
                "bg-green-100 dark:bg-green-950/30 text-green-600"}`}>
                <Zap className="w-3.5 h-3.5" />{energy} {t("energyUnit")}
              </div>
              {pinCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-violet-100 dark:bg-violet-950/30 text-violet-600">
                  <Pin className="w-3.5 h-3.5" />{pinCount} {t("pinUnit")}
                </div>
              )}
              {energy <= 0 && (
                <button onClick={() => setShowRecharge(true)} className="text-xs text-primary hover:underline font-semibold">{t("recharge")}</button>
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
                普通用户每24小时可发布一次，仅限个人求职信息。
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
            {t("postFormSubmit")}
          </button>
        </form>
      </div>
    </>
  );
}
