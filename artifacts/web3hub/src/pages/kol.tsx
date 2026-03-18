import { useGetPosts } from "@workspace/api-client-react";
import { PostTimeline } from "@/components/post-timeline";

export default function KOLZone() {
  const { data, isLoading } = useGetPosts({ authorType: "kol", limit: 50 });

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/20 rounded-2xl p-8 text-center">
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-purple-600">
          KOL 合作专区
        </h1>
        <p className="text-muted-foreground">
          优质内容创作者与项目方的高效对接平台。发布合作意向，寻找契合机会。
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
          avatarBorderColor="border-amber-400"
          emptyMessage="暂无 KOL 动态"
        />
      )}
    </div>
  );
}
