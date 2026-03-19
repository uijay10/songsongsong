import { useState } from "react";
import { useWeb3Auth } from "@/lib/web3";
import { useCreatePost } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLang } from "@/lib/i18n";
import { useLocation } from "wouter";
import { AlertCircle, CheckCircle2, PenSquare } from "lucide-react";

const SECTIONS = [
  "testnet", "ido", "security", "integration", "airdrop",
  "events", "funding", "jobs", "nodes", "showcase",
  "ecosystem", "partners", "hackathon", "ama", "bugbounty",
  "community", "kol", "developer",
];

const SECTION_LABEL_KEYS: Record<string, string> = {
  testnet: "sTestnetLabel", ido: "sIdoLabel", security: "sSecurityLabel",
  integration: "sIntegrationLabel", airdrop: "sAirdropLabel", events: "sEventsLabel",
  funding: "sFundingLabel", jobs: "sJobsLabel", nodes: "sNodesLabel",
  showcase: "sShowcaseLabel", ecosystem: "sEcosystemLabel", partners: "sPartnersLabel",
  hackathon: "sHackathonLabel", ama: "sAmaLabel", bugbounty: "sBugbountyLabel",
  community: "nav_community", kol: "nav_kol", developer: "nav_developer",
};

export default function PostNew() {
  const { address, isConnected } = useWeb3Auth();
  const createPost = useCreatePost();
  const queryClient = useQueryClient();
  const { t } = useLang();
  const [, setLocation] = useLocation();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [section, setSection] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const inputCls = "w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground placeholder:text-muted-foreground";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    if (!title.trim()) { setError("标题不能为空"); return; }
    if (!content.trim()) { setError("内容不能为空"); return; }
    if (!section) { setError("请选择分区"); return; }
    setError("");
    createPost.mutate(
      { data: { title: title.trim(), content: content.trim(), section, authorWallet: address } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
          setSuccess(true);
          setTimeout(() => setLocation("/"), 2500);
        },
        onError: (e: any) => setError(String(e?.message ?? "发布失败")),
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

  if (success) {
    return (
      <div className="py-32 text-center max-w-md mx-auto animate-in zoom-in">
        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold mb-3">{t("postSuccess")}</h2>
        <p className="text-muted-foreground">正在跳回首页...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <PenSquare className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">{t("createPostTitle")}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-7 space-y-5 shadow-sm">
        {/* Section */}
        <div>
          <label className="block text-sm font-semibold mb-2">{t("postFormSection")} *</label>
          <select
            value={section}
            onChange={e => setSection(e.target.value)}
            className={inputCls}
          >
            <option value="">{t("postFormSection")}...</option>
            {SECTIONS.map(s => (
              <option key={s} value={s}>
                {t(SECTION_LABEL_KEYS[s] ?? s)}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold mb-2">{t("postFormTitle")} *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={t("postFormTitle") + "..."}
            className={inputCls}
            maxLength={120}
          />
          <div className="text-xs text-muted-foreground text-right mt-1">{title.length}/120</div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-semibold mb-2">{t("postFormContent")} *</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={t("postFormContent") + "..."}
            rows={8}
            className={`${inputCls} resize-y min-h-[160px]`}
            maxLength={5000}
          />
          <div className="text-xs text-muted-foreground text-right mt-1">{content.length}/5000</div>
        </div>

        {error && (
          <div className="px-4 py-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={createPost.isPending}
          className="w-full py-4 rounded-xl font-bold text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {createPost.isPending ? t("postFormSubmitting") : t("postFormSubmit")}
        </button>
      </form>
    </div>
  );
}
