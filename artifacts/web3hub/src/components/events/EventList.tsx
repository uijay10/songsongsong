import { useState, useEffect, useCallback } from "react";
import { Search, Star, Building2, CheckCircle, ExternalLink, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  type Web3Event,
  CATEGORIES,
  isEventExpired,
  formatEventDate,
  submitClaim,
  isAlreadySubmitted,
  isProjectClaimed,
  setProjectClaimed,
  loadWatched,
  toggleWatched,
} from "@/lib/events";

function getEventBase() {
  const base = import.meta.env.BASE_URL ?? "/";
  return base.endsWith("/") ? base : base + "/";
}

function importanceColor(importance?: string) {
  switch (importance?.toLowerCase()) {
    case "高": case "high": return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
    case "中": case "medium": return "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
    default: return "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
  }
}

function EventCard({
  event,
  isWatched,
  isClaimed,
  isSubmitted,
  onWatch,
  onClaim,
}: {
  event: Web3Event;
  isWatched: boolean;
  isClaimed: boolean;
  isSubmitted: boolean;
  onWatch: (event: Web3Event) => void;
  onClaim: (event: Web3Event) => void;
}) {
  const cats = event.category ?? [];

  return (
    <div className="bg-card border border-border/40 rounded-2xl p-5 hover:border-primary/30 hover:shadow-md transition-all group">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {cats.map((c) => (
          <span key={c} className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium">
            {c}
          </span>
        ))}
        {event.importance && (
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${importanceColor(event.importance)}`}>
            {event.importance === "高" || event.importance === "high" ? "重要" :
             event.importance === "中" || event.importance === "medium" ? "一般" : event.importance}
          </span>
        )}
        {event.start_time && (
          <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatEventDate(event.start_time)}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-bold text-base text-foreground leading-snug mb-2 group-hover:text-primary transition-colors">
        {event.title}
      </h3>

      {/* Description */}
      {event.description && (
        <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">
          {event.description}
        </p>
      )}

      {/* Tags */}
      {event.tags && event.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {event.tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/30">
        {/* Watch button */}
        <button
          onClick={() => onWatch(event)}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            isWatched
              ? "bg-blue-600 text-white"
              : "border border-border hover:border-blue-400 hover:text-blue-600 text-muted-foreground"
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${isWatched ? "fill-white" : ""}`} />
          {isWatched ? "已关注" : "我要关注"}
        </button>

        {/* Project claim button */}
        {isClaimed || isSubmitted ? (
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
            <CheckCircle className="w-3.5 h-3.5" />
            {isClaimed ? "项目方已认领" : "申请已提交"}
          </span>
        ) : (
          <button
            onClick={() => onClaim(event)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-purple-300 text-purple-600 hover:bg-purple-600 hover:text-white dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-700 dark:hover:text-white transition-all"
          >
            <Building2 className="w-3.5 h-3.5" />
            项目方认领
          </button>
        )}

        {/* Source link */}
        {event.source_url && event.source_url !== "#" && (
          <a
            href={event.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            来源 <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function ClaimModal({
  event,
  open,
  onClose,
  onSubmitted,
}: {
  event: Web3Event | null;
  open: boolean;
  onClose: () => void;
  onSubmitted: (eventTitle: string) => void;
}) {
  const { toast } = useToast();
  const [projectName, setProjectName] = useState("");
  const [contact, setContact] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = useCallback(() => {
    setProjectName(""); setContact(""); setReason(""); setLoading(false);
  }, []);

  useEffect(() => { if (!open) reset(); }, [open, reset]);

  const handleSubmit = () => {
    if (!event) return;
    if (!projectName.trim()) { toast({ title: "请填写项目名称", variant: "destructive" }); return; }
    if (!contact.trim())     { toast({ title: "请填写联系方式", variant: "destructive" }); return; }
    setLoading(true);
    setTimeout(() => {
      submitClaim({
        eventTitle: event.title,
        projectName: projectName.trim(),
        contact: contact.trim(),
        reason: reason.trim() || "未填写",
        reviewNote: "",
      });
      setProjectClaimed(event.title);
      onSubmitted(event.title);
      toast({ title: "✅ 申请已提交", description: "我们将尽快审核您的认领申请" });
      onClose();
      setLoading(false);
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">项目方认领申请</DialogTitle>
          {event && (
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-1 truncate">{event.title}</p>
          )}
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              项目 / 团队名称 <span className="text-red-500">*</span>
            </label>
            <input
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="您的项目名称"
              className="w-full px-4 py-3 border border-border rounded-2xl text-sm bg-background focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              联系方式 <span className="text-red-500">*</span>
            </label>
            <input
              value={contact}
              onChange={e => setContact(e.target.value)}
              placeholder="Telegram / Email / Twitter"
              className="w-full px-4 py-3 border border-border rounded-2xl text-sm bg-background focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">认领理由 / 合作意向</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="请简要说明认领理由..."
              className="w-full px-4 py-3 border border-border rounded-2xl text-sm bg-background focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-border rounded-2xl text-sm font-medium hover:bg-muted transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 bg-purple-600 text-white rounded-2xl text-sm font-medium hover:bg-purple-700 disabled:opacity-60 transition-colors"
            >
              {loading ? "提交中..." : "提交认领申请"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EventList() {
  const [allEvents, setAllEvents] = useState<Web3Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"time" | "importance">("time");
  const [showWatchedOnly, setShowWatchedOnly] = useState(false);
  const [watched, setWatched] = useState<string[]>([]);
  const [claimedMap, setClaimedMap] = useState<Record<string, boolean>>({});
  const [submittedMap, setSubmittedMap] = useState<Record<string, boolean>>({});
  const [claimTarget, setClaimTarget] = useState<Web3Event | null>(null);
  const [claimOpen, setClaimOpen] = useState(false);

  useEffect(() => {
    setWatched(loadWatched());
  }, []);

  useEffect(() => {
    const base = getEventBase();
    fetch(`${base}extraction_result.json`)
      .then(r => { if (!r.ok) throw new Error("加载失败"); return r.json(); })
      .then((data: Web3Event[]) => {
        setAllEvents(data);
        const cm: Record<string, boolean> = {};
        const sm: Record<string, boolean> = {};
        data.forEach(e => {
          cm[e.title] = isProjectClaimed(e.title);
          sm[e.title] = isAlreadySubmitted(e.title);
        });
        setClaimedMap(cm);
        setSubmittedMap(sm);
        setLoading(false);
      })
      .catch(() => { setError("数据加载失败，请刷新重试"); setLoading(false); });
  }, []);

  const handleWatch = useCallback((event: Web3Event) => {
    const nowWatched = toggleWatched(event.title);
    setWatched(loadWatched());
    return nowWatched;
  }, []);

  const handleClaim = useCallback((event: Web3Event) => {
    setClaimTarget(event);
    setClaimOpen(true);
  }, []);

  const handleClaimSubmitted = useCallback((eventTitle: string) => {
    setSubmittedMap(prev => ({ ...prev, [eventTitle]: true }));
    setClaimedMap(prev => ({ ...prev, [eventTitle]: true }));
  }, []);

  const importanceOrder: Record<string, number> = { "高": 0, "high": 0, "中": 1, "medium": 1 };

  const filtered = allEvents
    .filter(e => !isEventExpired(e))
    .filter(e => {
      if (showWatchedOnly) return watched.includes(e.title);
      if (activeCategory === "全部") return true;
      return (e.category ?? []).includes(activeCategory);
    })
    .filter(e => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        (e.description ?? "").toLowerCase().includes(q) ||
        (e.tags ?? []).some(t => t.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === "importance") {
        const ia = importanceOrder[a.importance ?? ""] ?? 2;
        const ib = importanceOrder[b.importance ?? ""] ?? 2;
        if (ia !== ib) return ia - ib;
      }
      const da = a.start_time ? new Date(a.start_time).getTime() : 0;
      const db = b.start_time ? new Date(b.start_time).getTime() : 0;
      return db - da;
    });

  return (
    <div className="space-y-5">
      {/* Section title */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          🔥 AI 事件聚合
          {!loading && (
            <span className="text-sm font-normal text-muted-foreground">共 {filtered.length} 条</span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortBy(sortBy === "time" ? "importance" : "time")}
            className="text-xs px-3 py-1.5 border border-border rounded-full hover:bg-muted transition-colors text-muted-foreground"
          >
            {sortBy === "time" ? "⏱ 最新时间" : "⭐ 重要程度"}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="搜索标题、描述、标签..."
          className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Category nav */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setShowWatchedOnly(false); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeCategory === cat && !showWatchedOnly
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border hover:border-primary/50 hover:text-primary text-muted-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
        <button
          onClick={() => { setShowWatchedOnly(true); setActiveCategory("全部"); }}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            showWatchedOnly
              ? "bg-blue-600 text-white shadow-sm"
              : "border border-border hover:border-blue-400 hover:text-blue-600 text-muted-foreground"
          }`}
        >
          ⭐ 我已关注 {watched.length > 0 ? `(${watched.length})` : ""}
        </button>
      </div>

      {/* Content */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-36 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-red-500">{error}</div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-4xl mb-3">📭</div>
          <p className="font-medium">暂无相关事件</p>
          <p className="text-sm mt-1">尝试切换分类或清空搜索条件</p>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {filtered.map((event, idx) => (
            <EventCard
              key={event.id ?? idx}
              event={event}
              isWatched={watched.includes(event.title)}
              isClaimed={claimedMap[event.title] ?? false}
              isSubmitted={submittedMap[event.title] ?? false}
              onWatch={handleWatch}
              onClaim={handleClaim}
            />
          ))}
        </div>
      )}

      <ClaimModal
        event={claimTarget}
        open={claimOpen}
        onClose={() => setClaimOpen(false)}
        onSubmitted={handleClaimSubmitted}
      />
    </div>
  );
}
