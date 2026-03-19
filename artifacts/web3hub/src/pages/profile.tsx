import { useWeb3Auth } from "@/lib/web3";
import { useCheckin, useUpsertUser, useGetPosts } from "@workspace/api-client-react";
import { generateGradient, truncateAddress } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import {
  Zap, Star, Copy, Check, AlertCircle, Gift, Clock, Edit2,
  Twitter, Send, Hash, Pin, Trash2, ChevronDown
} from "lucide-react";
import { PostTimeline } from "@/components/post-timeline";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

const LANGUAGES = [
  { value: "ja", label: "日語" },
  { value: "ko", label: "한국어" },
  { value: "hi", label: "हिन्दी" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "it", label: "Italiano" },
  { value: "vi", label: "Tiếng Việt" },
  { value: "ru", label: "Русский" },
  { value: "ar", label: "العربية" },
  { value: "zh-CN", label: "中文简体" },
  { value: "zh-TW", label: "中文繁體" },
];

function useCountdown(targetIso: string | null | undefined) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    if (!targetIso) { setRemaining(""); return; }
    const tick = () => {
      const diff = new Date(targetIso).getTime() - Date.now();
      if (diff <= 0) { setRemaining("可签到"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);
  return remaining;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

export default function Profile() {
  const { address, isConnected, user, isLoading: userLoading } = useWeb3Auth();
  const checkinMutation = useCheckin();
  const upsertMutation = useUpsertUser();
  const queryClient = useQueryClient();
  const { data: userPosts } = useGetPosts(
    { authorType: address ?? "" },
    { query: { enabled: !!address } }
  );

  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [discord, setDiscord] = useState("");
  const [language, setLanguage] = useState("en");
  const [editingSocial, setEditingSocial] = useState(false);
  const [savingSuccess, setSavingSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const nextCheckin = user?.lastCheckin
    ? new Date(new Date(user.lastCheckin).getTime() + 24 * 60 * 60 * 1000).toISOString()
    : null;
  const countdown = useCountdown(nextCheckin);
  const canCheckin = !nextCheckin || new Date(nextCheckin).getTime() <= Date.now();

  useEffect(() => {
    if (user) {
      setTwitter(user.twitter ?? "");
      setTelegram(user.telegram ?? "");
      setDiscord(user.discord ?? "");
      setLanguage(user.language ?? "en");
    }
  }, [user]);

  const handleCheckin = () => {
    if (!address || !canCheckin) return;
    checkinMutation.mutate(
      { data: { wallet: address } },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/users/me"] }),
      }
    );
  };

  const handleSaveSocial = () => {
    if (!address) return;
    upsertMutation.mutate(
      { data: { wallet: address, twitter, telegram, discord, language } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
          setEditingSocial(false);
          setSavingSuccess(true);
          setTimeout(() => setSavingSuccess(false), 2000);
        },
      }
    );
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !address) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      upsertMutation.mutate(
        { data: { wallet: address, avatar: dataUrl } },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/users/me"] }) }
      );
    };
    reader.readAsDataURL(file);
  };

  const spaceStatusDisplay = () => {
    if (!user?.spaceStatus) return { label: "否", color: "text-muted-foreground bg-muted" };
    if (user.spaceStatus === "active") return { label: "是 ✓", color: "text-green-700 bg-green-50" };
    if (user.spaceStatus === "pending") return { label: "审核中", color: "text-amber-700 bg-amber-50" };
    if (user.spaceStatus === "rejected") return { label: "未通过", color: "text-red-700 bg-red-50" };
    if (user.spaceStatus === "banned") return { label: "失去资格", color: "text-red-900 bg-red-100" };
    return { label: user.spaceStatus, color: "text-muted-foreground bg-muted" };
  };

  const isDeveloper = user?.spaceType === "developer";

  if (!isConnected) {
    return (
      <div className="py-32 text-center max-w-md mx-auto">
        <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">未连接钱包</h2>
        <p className="text-muted-foreground">请先通过右上角连接钱包以查看个人资料。</p>
      </div>
    );
  }

  if (userLoading) return <div className="py-32 text-center animate-pulse">加载中...</div>;

  const statusDisplay = spaceStatusDisplay();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <h1 className="text-2xl font-bold">我的资料</h1>

      {/* ── Avatar + Stats ─────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        {/* Avatar row */}
        <div className="flex items-center gap-5">
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            <div
              className="w-20 h-20 rounded-2xl border-2 border-border shadow-sm"
              style={{ background: user?.avatar?.startsWith("data:") || user?.avatar?.startsWith("http") ? `url(${user.avatar}) center/cover` : generateGradient(address) }}
            />
            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Edit2 className="w-5 h-5 text-white" />
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="flex-1">
            <div className="font-bold text-xl font-mono">{user?.username || truncateAddress(address)}</div>
            {user?.spaceType && (
              <span className="inline-block mt-1 px-3 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase">
                {user.spaceType}
              </span>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Points */}
          {!isDeveloper && (
            <div className="bg-muted/40 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <Star className="w-3.5 h-3.5 text-amber-400" /> 积分
              </div>
              <div className="text-2xl font-bold">{user?.points ?? 0}</div>
            </div>
          )}

          {/* Energy */}
          {!isDeveloper && (
            <div className="bg-muted/40 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <Zap className="w-3.5 h-3.5 text-primary" /> 剩余能量
              </div>
              <div className="text-2xl font-bold">{user?.energy ?? 0}</div>
            </div>
          )}

          {/* Pin times (placeholder) */}
          {!isDeveloper && (
            <div className="bg-muted/40 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <Pin className="w-3.5 h-3.5 text-violet-500" /> 置顶次数
              </div>
              <div className="text-2xl font-bold">0</div>
            </div>
          )}

          {/* Invite code */}
          {!isDeveloper && (
            <div className="bg-muted/40 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <Hash className="w-3.5 h-3.5 text-green-500" /> 邀请码
              </div>
              <div className="flex items-center gap-1">
                <span className="font-mono font-bold text-sm tracking-wider">{user?.inviteCode ?? "------"}</span>
                {user?.inviteCode && <CopyButton text={user.inviteCode} />}
              </div>
              <div className="text-xs text-muted-foreground mt-1">已邀 {user?.inviteCount ?? 0} 人</div>
            </div>
          )}
        </div>
      </div>

      {/* ── 每日签到 ─────────────────────────────────── */}
      {!isDeveloper && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-pink-500" /> 我的签到
          </h2>
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={handleCheckin}
              disabled={!canCheckin || checkinMutation.isPending}
              className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all ${
                canCheckin
                  ? "bg-[#FF69B4] text-white hover:bg-[#ff4fa8] shadow-sm hover:shadow"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {checkinMutation.isPending ? "签到中..." : "签到 +1000积分"}
            </button>
            {!canCheckin && nextCheckin && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>下次签到：</span>
                <span className="font-mono font-semibold text-foreground">{countdown}</span>
              </div>
            )}
            {canCheckin && (
              <span className="text-sm text-green-600 font-medium">✓ 今日可签到</span>
            )}
          </div>
          {checkinMutation.data && (
            <p className={`mt-3 text-sm font-medium ${checkinMutation.data.success ? "text-green-600" : "text-amber-600"}`}>
              {checkinMutation.data.message}
            </p>
          )}
        </div>
      )}

      {/* ── 钱包地址 ─────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-bold text-lg mb-4">钱包地址</h2>
        <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-4 py-3">
          <span className="font-mono text-sm text-muted-foreground flex-1 truncate">{address}</span>
          {address && <CopyButton text={address} />}
        </div>
      </div>

      {/* ── 空间用户状态 ─────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-bold text-lg mb-4">空间用户</h2>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${statusDisplay.color}`}>
            {statusDisplay.label}
          </span>
          {(!user?.spaceStatus || user.spaceStatus === "rejected") && (
            <a href="/apply" className="text-sm text-primary hover:underline">申请创建空间 →</a>
          )}
        </div>
      </div>

      {/* ── 社交链接 ─────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">社交链接</h2>
          {!editingSocial ? (
            <button onClick={() => setEditingSocial(true)} className="text-sm text-primary hover:underline flex items-center gap-1">
              <Edit2 className="w-3.5 h-3.5" /> 编辑
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditingSocial(false)} className="text-sm text-muted-foreground hover:underline">取消</button>
              <button onClick={handleSaveSocial} className="text-sm text-primary font-semibold hover:underline">
                {upsertMutation.isPending ? "保存中..." : "保存"}
              </button>
            </div>
          )}
        </div>
        <div className="space-y-3">
          {[
            { icon: <Twitter className="w-4 h-4 text-sky-500" />, label: "X / Twitter", value: twitter, setter: setTwitter, placeholder: "https://x.com/yourhandle" },
            { icon: <Send className="w-4 h-4 text-blue-500" />, label: "Telegram", value: telegram, setter: setTelegram, placeholder: "https://t.me/yourhandle" },
            { icon: <Hash className="w-4 h-4 text-indigo-500" />, label: "Discord", value: discord, setter: setDiscord, placeholder: "https://discord.gg/yourinvite" },
          ].map(({ icon, label, value, setter, placeholder }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-8 flex justify-center shrink-0">{icon}</div>
              <span className="w-24 text-sm text-muted-foreground shrink-0">{label}</span>
              {editingSocial ? (
                <input
                  type="url"
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 text-sm bg-muted/50 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              ) : value ? (
                <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate flex-1">
                  {value}
                </a>
              ) : (
                <span className="text-sm text-muted-foreground italic flex-1">未设置</span>
              )}
            </div>
          ))}
        </div>
        {savingSuccess && <p className="mt-3 text-sm text-green-600 font-medium">✓ 保存成功</p>}
      </div>

      {/* ── 语言设置 ─────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-bold text-lg mb-4">语言设置</h2>
        <div className="relative inline-block">
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              if (address) {
                upsertMutation.mutate({ data: { wallet: address, language: e.target.value } });
              }
            }}
            className="appearance-none bg-muted/50 border border-border rounded-xl px-4 py-2.5 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* ── 我的帖子 ─────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-bold text-lg mb-4">我的帖子</h2>
        {(!userPosts?.posts || userPosts.posts.length === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-8">您还没有发布过任何帖子</p>
        ) : (
          <div className="space-y-3">
            {userPosts.posts.map((post) => (
              <div key={post.id} className="flex items-start justify-between gap-4 p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-border transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">{post.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">#{post.section}</span>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.createdAt))} ago</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {user?.spaceType !== "developer" && (
                    <button className="p-1.5 rounded-lg hover:bg-violet-100 text-muted-foreground hover:text-violet-600 transition-colors" title="置顶">
                      <Pin className="w-4 h-4" />
                    </button>
                  )}
                  <button className="p-1.5 rounded-lg hover:bg-red-100 text-muted-foreground hover:text-red-500 transition-colors" title="删除">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
