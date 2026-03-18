import { useGetPosts } from "@workspace/api-client-react";
import { PostTimeline } from "@/components/post-timeline";
import { Terminal } from "lucide-react";

export default function DeveloperColumn() {
  const { data, isLoading } = useGetPosts({ authorType: "developer", limit: 50 });

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-[#0D1117] rounded-2xl p-8 border border-border shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Terminal className="w-8 h-8 text-[#00FF9F]" />
          <h1 className="text-3xl font-mono font-bold text-white">开发者专栏</h1>
        </div>
        <p className="text-gray-400 font-mono text-sm">
          {'>'} 汇聚硬核技术探讨、漏洞赏金、黑客松招募与技术人才对接。
          <br/>
          <span className="text-[#00FF9F] animate-pulse">_</span>
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <PostTimeline 
          posts={data?.posts || []} 
          avatarBorderColor="border-green-500"
          emptyMessage="No output from stdout."
        />
      )}
    </div>
  );
}
