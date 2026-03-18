import { useGetPosts } from "@workspace/api-client-react";
import { PostTimeline } from "@/components/post-timeline";

export default function Showcase() {
  const { data, isLoading } = useGetPosts({ section: "项目展示", limit: 50 });

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">项目展示</h1>
        <p className="text-muted-foreground">
          发现最新 Web3 项目动态、产品更新和重要里程碑。
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
          avatarBorderColor="border-primary"
          emptyMessage="暂无项目展示动态"
        />
      )}
    </div>
  );
}
