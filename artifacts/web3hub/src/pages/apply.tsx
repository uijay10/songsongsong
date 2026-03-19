import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWeb3Auth } from "@/lib/web3";
import { useApplySpace } from "@workspace/api-client-react";
import { ApplySpaceRequestType } from "@workspace/api-client-react";
import { Building2, Code2, Megaphone, CheckCircle2, Copy, Check } from "lucide-react";
import { useLocation } from "wouter";
import { useLang } from "@/lib/i18n";

const schema = z.object({
  type: z.nativeEnum(ApplySpaceRequestType),
  twitter: z.string().optional(),
  tweetLink: z.string().optional(),
  projectName: z.string().optional(),
  projectTwitter: z.string().optional(),
  docsLink: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function Field({ label, note, error, children }: {
  label: string; note?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5 text-foreground">{label}</label>
      {note && <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{note}</p>}
      {children}
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );
}

function ArticleTemplate({ template, xLinkLabel, register }: { template: string; xLinkLabel: string; register: any }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(template).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="space-y-3">
      <div className="relative bg-muted/60 dark:bg-slate-800/60 border border-border dark:border-slate-700 rounded-xl p-4 pr-10">
        <p className="text-sm text-foreground dark:text-slate-200 leading-relaxed break-words">{template}</p>
        <button type="button" onClick={copy}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-background dark:bg-slate-700 hover:bg-muted dark:hover:bg-slate-600 border border-border/50 transition-colors"
          title="Copy template">
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>
      </div>
      <input
        {...register("tweetLink")}
        className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground placeholder:text-muted-foreground"
        placeholder="https://x.com/..."
      />
      <p className="text-xs text-muted-foreground">← {xLinkLabel}</p>
    </div>
  );
}

export default function ApplySpace() {
  const { address, isConnected } = useWeb3Auth();
  const applyMutation = useApplySpace();
  const [success, setSuccess] = useState(false);
  const [_, setLocation] = useLocation();
  const { t } = useLang();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: ApplySpaceRequestType.project },
  });

  const selectedType = watch("type");

  const onSubmit = (data: FormValues) => {
    if (!address) return alert(t("applyNeedWallet"));
    applyMutation.mutate({ data: { wallet: address, ...data } }, {
      onSuccess: () => {
        setSuccess(true);
        setTimeout(() => setLocation("/"), 3000);
      }
    });
  };

  const inputCls = "w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground placeholder:text-muted-foreground";

  if (!isConnected) {
    return (
      <div className="py-32 text-center max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4">{t("applyNeedWallet")}</h2>
        <p className="text-muted-foreground mb-8">{t("applyNeedWalletDesc")}</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="py-32 text-center max-w-md mx-auto animate-in zoom-in">
        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold mb-4">{t("applySuccess")}</h2>
        <p className="text-muted-foreground mb-8">{t("applySuccessMsg")}</p>
      </div>
    );
  }

  const typeCards = [
    { value: ApplySpaceRequestType.project,   icon: <Building2 className="w-8 h-8" />, labelKey: "applyProject" },
    { value: ApplySpaceRequestType.kol,       icon: <Megaphone className="w-8 h-8" />, labelKey: "applyKol" },
    { value: ApplySpaceRequestType.developer, icon: <Code2 className="w-8 h-8" />,     labelKey: "applyDeveloper" },
  ];

  const articleTemplate = t("applyPostArticleTemplate");
  const articleInstr = t("applyPostArticleInstr");
  const xLinkLabel = t("applyPostXLink");

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-3">{t("applyTitle")}</h1>
        <p className="text-muted-foreground">{t("applySubtitle")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-card p-8 rounded-3xl border border-border shadow-sm">

        {/* Type Selection */}
        <div className="space-y-3">
          <label className="text-sm font-semibold">{t("applyTypeLabel")}</label>
          <div className="grid grid-cols-3 gap-4">
            {typeCards.map(({ value, icon, labelKey }) => {
              const active = selectedType === value;
              return (
                <label
                  key={value}
                  className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-3 transition-all ${
                    active
                      ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                      : "border-border hover:border-green-400/60 hover:bg-green-50/30"
                  }`}
                >
                  <input type="radio" value={value} {...register("type")} className="sr-only" />
                  <span className={active ? "text-green-500" : "text-muted-foreground"}>{icon}</span>
                  <span className={`font-bold text-sm ${active ? "text-green-600" : ""}`}>{t(labelKey)}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Dynamic fields */}
        <div className="space-y-5 pt-4 border-t border-border">

          {/* Project fields */}
          {selectedType === ApplySpaceRequestType.project && (
            <>
              <Field label={`${t("applyProjectName")} *`} error={errors.projectName?.message}>
                <input {...register("projectName")} className={inputCls} placeholder="Web3Hub" />
              </Field>
              <Field label={`${t("applyProjectTwitter")} *`}>
                <input {...register("projectTwitter")} className={inputCls} placeholder="@YourProject" />
              </Field>
              <Field label={`${t("applyPersonalTwitter")} *`}>
                <input {...register("twitter")} className={inputCls} placeholder="@YourHandle" />
              </Field>
              <Field label={t("applyPostArticle")} note={articleInstr}>
                <ArticleTemplate template={articleTemplate} xLinkLabel={xLinkLabel} register={register} />
              </Field>
              <Field label={t("applyDocs")}>
                <input {...register("docsLink")} className={inputCls} placeholder="https://..." />
              </Field>
            </>
          )}

          {/* KOL fields */}
          {selectedType === ApplySpaceRequestType.kol && (
            <>
              <Field label={`${t("applyPersonalTwitter")} *`}>
                <input {...register("twitter")} className={inputCls} placeholder="@YourHandle" />
              </Field>
              <Field label={t("applyPostArticle")} note={articleInstr} error={errors.tweetLink?.message}>
                <ArticleTemplate template={articleTemplate} xLinkLabel={xLinkLabel} register={register} />
              </Field>
            </>
          )}

          {/* Developer fields */}
          {selectedType === ApplySpaceRequestType.developer && (
            <>
              <Field label={`${t("applyPersonalTwitter")} *`}>
                <input {...register("twitter")} className={inputCls} placeholder="@YourHandle" />
              </Field>
              <Field label={t("applyPostArticle")} note={articleInstr}>
                <ArticleTemplate template={articleTemplate} xLinkLabel={xLinkLabel} register={register} />
              </Field>
              <Field label={`${t("applyGithub")} *`} error={errors.github?.message}>
                <input {...register("github")} className={inputCls} placeholder="https://github.com/..." />
              </Field>
              <Field label={t("applyLinkedin")}>
                <input {...register("linkedin")} className={inputCls} placeholder="https://linkedin.com/in/..." />
              </Field>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={applyMutation.isPending}
          className="w-full py-4 rounded-xl font-bold text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {applyMutation.isPending ? t("applySubmitting") : t("applySubmit")}
        </button>
      </form>
    </div>
  );
}
