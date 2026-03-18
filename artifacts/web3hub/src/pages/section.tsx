import { useGetPosts } from "@workspace/api-client-react";
import { PostTimeline } from "@/components/post-timeline";
import { useParams } from "wouter";

const SECTION_META: Record<string, { label: string; description: string; icon: string; color: string }> = {
  testnet: {
    label: "测试网",
    description: "测试网相关公告、任务与活动，参与最新协议测试获得早期奖励。",
    icon: "🧪",
    color: "from-blue-50 to-cyan-50 border-blue-100",
  },
  ido: {
    label: "IDO / Launchpad",
    description: "首次代币发行与 Launchpad 项目公告，第一时间获取参与资格。",
    icon: "🚀",
    color: "from-purple-50 to-pink-50 border-purple-100",
  },
  security: {
    label: "安全审计",
    description: "智能合约安全审计报告、漏洞披露与安全公告。",
    icon: "🔐",
    color: "from-red-50 to-orange-50 border-red-100",
  },
  integration: {
    label: "集成公告",
    description: "协议集成、跨链桥接与生态合作公告。",
    icon: "🔗",
    color: "from-indigo-50 to-blue-50 border-indigo-100",
  },
  airdrop: {
    label: "空投计划",
    description: "最新空投资格查询、领取教程与快照时间公告。",
    icon: "🪂",
    color: "from-green-50 to-teal-50 border-green-100",
  },
  events: {
    label: "活动奖励",
    description: "交易竞赛、流动性挖矿与社区活动奖励发布。",
    icon: "🎁",
    color: "from-yellow-50 to-amber-50 border-yellow-100",
  },
  funding: {
    label: "融资公告",
    description: "Web3 项目融资轮次、投资机构与估值公告。",
    icon: "💰",
    color: "from-emerald-50 to-green-50 border-emerald-100",
  },
  jobs: {
    label: "招聘人才",
    description: "Web3 全职、兼职与远程招聘岗位，寻找区块链顶尖人才。",
    icon: "💼",
    color: "from-sky-50 to-blue-50 border-sky-100",
  },
  nodes: {
    label: "节点招募",
    description: "验证节点、超级节点与质押合作招募公告。",
    icon: "⚙️",
    color: "from-slate-50 to-gray-50 border-slate-100",
  },
  ecosystem: {
    label: "生态系统",
    description: "生态项目展示、Grant 申请与生态资助计划。",
    icon: "🌍",
    color: "from-teal-50 to-cyan-50 border-teal-100",
  },
  partners: {
    label: "伙伴招募",
    description: "战略合作、市场推广与渠道伙伴合作招募。",
    icon: "🤝",
    color: "from-violet-50 to-purple-50 border-violet-100",
  },
  hackathon: {
    label: "黑客松",
    description: "全球及区域性黑客松赛事、奖金与参赛报名。",
    icon: "🏆",
    color: "from-orange-50 to-red-50 border-orange-100",
  },
  ama: {
    label: "AMA",
    description: "Ask Me Anything —— 项目方与社区的实时问答互动。",
    icon: "🎤",
    color: "from-fuchsia-50 to-pink-50 border-fuchsia-100",
  },
  bugbounty: {
    label: "漏洞赏金",
    description: "白帽黑客专区，漏洞悬赏与安全研究员招募。",
    icon: "🐛",
    color: "from-rose-50 to-red-50 border-rose-100",
  },
};

export default function SectionPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const meta = SECTION_META[slug];
  const sectionLabel = meta?.label ?? slug;

  const { data, isLoading } = useGetPosts({ section: sectionLabel, limit: 50 });

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Section Header */}
      <div className={`rounded-2xl p-8 border bg-gradient-to-br ${meta?.color ?? "from-gray-50 to-white border-gray-100"}`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">{meta?.icon ?? "📋"}</span>
          <h1 className="text-3xl font-bold text-foreground">{sectionLabel}</h1>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {meta?.description ?? `浏览 ${sectionLabel} 板块的最新帖子。`}
        </p>
      </div>

      {/* Posts */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <PostTimeline
          posts={data?.posts ?? []}
          emptyMessage={`${sectionLabel} 板块暂无内容，成为第一个发布的人吧！`}
        />
      )}
    </div>
  );
}
