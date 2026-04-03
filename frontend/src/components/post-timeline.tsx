import { MessageSquare } from "lucide-react";
import type { Post } from "@workspace/api-client-react";
import { PostCard } from "@/components/post-card";
import { useWeb3Auth } from "@/lib/web3";
import { isAdmin } from "@/lib/admin";

interface PostTimelineProps {
  posts: Post[];
  emptyMessage?: string;
  onRefresh?: () => void;
  /** Tailwind border color class for avatar ring, e.g. `border-border` or `border-primary/50` */
  avatarBorderColor?: string;
}

export function PostTimeline({
  posts,
  emptyMessage = "暂无内容",
  onRefresh,
  avatarBorderColor,
}: PostTimelineProps) {
  const { address } = useWeb3Auth();
  const admin = isAdmin(address);

  if (!posts || posts.length === 0) {
    return (
      <div className="py-20 text-center border border-dashed border-border rounded-2xl bg-card/50">
        <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post as any}
          onRefresh={onRefresh}
          showPin={admin}
          avatarBorderClass={avatarBorderColor}
        />
      ))}
    </div>
  );
}
