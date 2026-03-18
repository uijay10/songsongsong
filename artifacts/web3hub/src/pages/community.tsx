import { useGetPosts } from "@workspace/api-client-react";
import { PostTimeline } from "@/components/post-timeline";

export default function Community() {
  const { data, isLoading } = useGetPosts({ section: "社区聊天", limit: 50 });

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">社区交流</h1>
        <p className="text-muted-foreground">
          畅所欲言，结识志同道合的 Web3 建设者。
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
          avatarBorderColor="border-border"
          emptyMessage="社区很安静，来发第一条消息吧！"
        />
      )}
    </div>
  );
}
