import { useWeb3Auth } from "@/lib/web3";
import { useCheckin, useGetPosts } from "@workspace/api-client-react";
import { generateGradient, truncateAddress } from "@/lib/utils";
import { Zap, Star, Gift, Share2, AlertCircle } from "lucide-react";
import { PostTimeline } from "@/components/post-timeline";
import { useQueryClient } from "@tanstack/react-query";

export default function Profile() {
  const { address, isConnected, user, isLoading: userLoading } = useWeb3Auth();
  const checkinMutation = useCheckin();
  const queryClient = useQueryClient();
  const { data: userPosts } = useGetPosts({ authorType: address }, { query: { enabled: !!address } });

  if (!isConnected) {
    return (
      <div className="py-32 text-center max-w-md mx-auto">
        <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">未连接钱包</h2>
        <p className="text-muted-foreground">请先通过右上角连接钱包以查看您的个人资料。</p>
      </div>
    );
  }

  if (userLoading) {
    return <div className="py-32 text-center animate-pulse">加载中...</div>;
  }

  const handleCheckin = () => {
    if (!address) return;
    checkinMutation.mutate(
      { data: { wallet: address } },
      {
        onSuccess: (data) => {
          if (data.success) {
            alert(`签到成功！获得 ${data.points} 积分`);
            queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
          } else {
            alert(data.message);
          }
        }
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header Card */}
      <div className="bg-card border border-border shadow-sm rounded-3xl overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-accent/20" />
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-6">
            <div className="flex items-end gap-4">
              <div 
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-4 border-card shadow-lg bg-muted"
                style={{ background: user?.avatar ? `url(${user.avatar})` : generateGradient(address) }}
              />
              <div className="pb-2">
                <h1 className="text-2xl sm:text-3xl font-bold font-mono">
                  {user?.username || truncateAddress(address)}
                </h1>
                {user?.spaceType && (
                  <span className="inline-block mt-1 px-3 py-1 bg-primary/10 text-primary font-bold text-xs rounded-full uppercase">
                    {user.spaceType} Space
                  </span>
                )}
              </div>
            </div>
            
            <button 
              onClick={handleCheckin}
              disabled={checkinMutation.isPending}
              className="pink-btn px-6 py-2.5 rounded-full flex items-center justify-center gap-2"
            >
              <Gift className="w-4 h-4" />
              {checkinMutation.isPending ? "签到中..." : "每日签到领积分"}
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y border-border/50">
            <div>
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium">可用积分</span>
              </div>
              <div className="text-2xl font-bold">{user?.points || 0}</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">剩余能量</span>
              </div>
              <div className="text-2xl font-bold">{user?.energy || 0}</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Share2 className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">邀请人数</span>
              </div>
              <div className="text-2xl font-bold">{user?.inviteCount || 0}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">专属邀请码</div>
              <div className="text-lg font-mono font-bold bg-muted px-2 py-0.5 rounded inline-block">
                {user?.inviteCode || "------"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Posts */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold">我的发布</h3>
        <PostTimeline 
          posts={userPosts?.posts || []} 
          emptyMessage="您还没有发布过任何内容"
        />
      </div>
    </div>
  );
}
