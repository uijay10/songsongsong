import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Heart, Share2, MoreHorizontal } from "lucide-react";
import type { Post } from "@workspace/api-client-react";
import { cn, generateGradient, truncateAddress } from "@/lib/utils";
import { useLikePost } from "@workspace/api-client-react";
import { useWeb3Auth } from "@/lib/web3";

interface PostTimelineProps {
  posts: Post[];
  avatarBorderColor?: string;
  emptyMessage?: string;
}

export function PostTimeline({ posts, avatarBorderColor = "border-border", emptyMessage = "暂无内容" }: PostTimelineProps) {
  const { address } = useWeb3Auth();
  const likeMutation = useLikePost();

  if (!posts || posts.length === 0) {
    return (
      <div className="py-20 text-center border border-dashed border-border rounded-2xl bg-card/50">
        <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground font-medium">{emptyMessage}</p>
      </div>
    );
  }

  const handleLike = (postId: number) => {
    if (!address) return alert("请先连接钱包");
    likeMutation.mutate({ id: postId, data: { wallet: address } });
  };

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-all">
          <div className="flex gap-4">
            <div className="shrink-0">
              <div 
                className={cn("w-12 h-12 rounded-full border-2 p-0.5", avatarBorderColor)}
              >
                <div 
                  className="w-full h-full rounded-full bg-muted"
                  style={{ background: post.authorAvatar ? `url(${post.authorAvatar})` : generateGradient(post.authorWallet) }}
                />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground truncate">
                    {post.authorName || truncateAddress(post.authorWallet)}
                  </span>
                  {post.authorType && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground uppercase tracking-wider">
                      {post.authorType}
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground hover:underline cursor-pointer">
                    {formatDistanceToNow(new Date(post.createdAt))}
                  </span>
                </div>
                <button className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mt-2">
                <h4 className="font-bold text-lg mb-1">{post.title}</h4>
                <p className="text-foreground/90 whitespace-pre-wrap text-sm leading-relaxed">
                  {post.content}
                </p>
                <div className="mt-3">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    #{post.section}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-8 text-muted-foreground">
                <button 
                  onClick={() => handleLike(post.id)}
                  className="flex items-center gap-1.5 text-sm hover:text-accent group transition-colors"
                >
                  <div className="p-1.5 rounded-full group-hover:bg-accent/10 transition-colors">
                    <Heart className="w-4 h-4" />
                  </div>
                  <span>{post.likes}</span>
                </button>
                <button className="flex items-center gap-1.5 text-sm hover:text-primary group transition-colors">
                  <div className="p-1.5 rounded-full group-hover:bg-primary/10 transition-colors">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span>{post.comments}</span>
                </button>
                <button className="flex items-center gap-1.5 text-sm hover:text-green-500 group transition-colors ml-auto">
                  <div className="p-1.5 rounded-full group-hover:bg-green-500/10 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
