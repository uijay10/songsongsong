import { useGetPosts } from "@workspace/api-client-react";
import { PostTimeline } from "@/components/post-timeline";
import { useParams } from "wouter";
import { useLang } from "@/lib/i18n";

const SECTION_ICONS: Record<string, string> = {
  testnet: "🧪",
  ido: "🚀",
  security: "🔐",
  integration: "🔗",
  airdrop: "🪂",
  events: "🎁",
  funding: "💰",
  jobs: "💼",
  nodes: "⚙️",
  ecosystem: "🌍",
  partners: "🤝",
  hackathon: "🏆",
  ama: "🎤",
  bugbounty: "🐛",
  showcase: "✨",
};

const SECTION_COLORS: Record<string, string> = {
  testnet:     "from-blue-50 to-cyan-50 border-blue-100 dark:from-blue-950/30 dark:to-cyan-950/30 dark:border-blue-900/50",
  ido:         "from-purple-50 to-pink-50 border-purple-100 dark:from-purple-950/30 dark:to-pink-950/30 dark:border-purple-900/50",
  security:    "from-red-50 to-orange-50 border-red-100 dark:from-red-950/30 dark:to-orange-950/30 dark:border-red-900/50",
  integration: "from-indigo-50 to-blue-50 border-indigo-100 dark:from-indigo-950/30 dark:to-blue-950/30 dark:border-indigo-900/50",
  airdrop:     "from-green-50 to-teal-50 border-green-100 dark:from-green-950/30 dark:to-teal-950/30 dark:border-green-900/50",
  events:      "from-yellow-50 to-amber-50 border-yellow-100 dark:from-yellow-950/30 dark:to-amber-950/30 dark:border-yellow-900/50",
  funding:     "from-emerald-50 to-green-50 border-emerald-100 dark:from-emerald-950/30 dark:to-green-950/30 dark:border-emerald-900/50",
  jobs:        "from-sky-50 to-blue-50 border-sky-100 dark:from-sky-950/30 dark:to-blue-950/30 dark:border-sky-900/50",
  nodes:       "from-slate-50 to-gray-50 border-slate-100 dark:from-slate-900/30 dark:to-gray-900/30 dark:border-slate-800",
  ecosystem:   "from-teal-50 to-cyan-50 border-teal-100 dark:from-teal-950/30 dark:to-cyan-950/30 dark:border-teal-900/50",
  partners:    "from-violet-50 to-purple-50 border-violet-100 dark:from-violet-950/30 dark:to-purple-950/30 dark:border-violet-900/50",
  hackathon:   "from-orange-50 to-red-50 border-orange-100 dark:from-orange-950/30 dark:to-red-950/30 dark:border-orange-900/50",
  ama:         "from-fuchsia-50 to-pink-50 border-fuchsia-100 dark:from-fuchsia-950/30 dark:to-pink-950/30 dark:border-fuchsia-900/50",
  bugbounty:   "from-rose-50 to-red-50 border-rose-100 dark:from-rose-950/30 dark:to-red-950/30 dark:border-rose-900/50",
  showcase:    "from-amber-50 to-yellow-50 border-amber-100 dark:from-amber-950/30 dark:to-yellow-950/30 dark:border-amber-900/50",
};

const SECTION_I18N_KEYS: Record<string, { label: string; desc: string }> = {
  testnet:     { label: "sTestnetLabel",     desc: "sTestnetDesc" },
  ido:         { label: "sIdoLabel",         desc: "sIdoDesc" },
  security:    { label: "sSecurityLabel",    desc: "sSecurityDesc" },
  integration: { label: "sIntegrationLabel", desc: "sIntegrationDesc" },
  airdrop:     { label: "sAirdropLabel",     desc: "sAirdropDesc" },
  events:      { label: "sEventsLabel",      desc: "sEventsDesc" },
  funding:     { label: "sFundingLabel",     desc: "sFundingDesc" },
  jobs:        { label: "sJobsLabel",        desc: "sJobsDesc" },
  nodes:       { label: "sNodesLabel",       desc: "sNodesDesc" },
  ecosystem:   { label: "sEcosystemLabel",   desc: "sEcosystemDesc" },
  partners:    { label: "sPartnersLabel",    desc: "sPartnersDesc" },
  hackathon:   { label: "sHackathonLabel",   desc: "sHackathonDesc" },
  ama:         { label: "sAmaLabel",         desc: "sAmaDesc" },
  bugbounty:   { label: "sBugbountyLabel",   desc: "sBugbountyDesc" },
  showcase:    { label: "sShowcaseLabel",    desc: "sShowcaseDesc" },
};

export default function SectionPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const { t } = useLang();

  const keys = SECTION_I18N_KEYS[slug];
  const sectionLabel = keys ? t(keys.label) : slug;
  const sectionDesc = keys ? t(keys.desc) : `${sectionLabel}`;
  const icon = SECTION_ICONS[slug] ?? "📋";
  const color = SECTION_COLORS[slug] ?? "from-gray-50 to-white border-gray-100";

  const { data, isLoading, refetch } = useGetPosts({ section: slug, limit: 50 });

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className={`rounded-2xl p-8 border bg-gradient-to-br ${color}`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">{icon}</span>
          <h1 className="text-3xl font-bold text-foreground">{sectionLabel}</h1>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">{sectionDesc}</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <PostTimeline
          posts={data?.posts ?? []}
          emptyMessage={`${sectionLabel} — ${t("noLatest")}`}
          onRefresh={refetch}
        />
      )}
    </div>
  );
}
