import { useState, useRef } from "react";
import { Download, Send, RefreshCw, Link2, Image, Tag, AlignLeft, Heading, Globe, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function getApiBase() {
  const base = import.meta.env.BASE_URL ?? "/";
  const parts = base.replace(/\/$/, "").split("/");
  parts.pop();
  return parts.join("/") + "/api";
}

const ALL_SECTIONS = [
  "测试网","IDO/Launchpad","预售","融资公告","空投",
  "招聘","节点招募","主网上线","代币解锁","交易所上线",
  "链上任务","开发者专区",
];

interface ScrapeResult {
  title: string;
  description: string;
  content: string;
  coverImage: string | null;
  siteName: string;
  sourceUrl: string;
}

type Phase = "idle" | "loading" | "preview" | "publishing" | "done";

export function ScrapePanel({ adminWallet }: { adminWallet?: string }) {
  const { toast } = useToast();
  const apiBase = getApiBase();
  const inputRef = useRef<HTMLInputElement>(null);

  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ScrapeResult | null>(null);

  // Editable fields after scrape
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCover, setEditCover] = useState<string | null>(null);
  const [section, setSection] = useState("");
  const [officialTag, setOfficialTag] = useState(true);

  async function handleScrape() {
    const trimmed = url.trim();
    if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
      setErrorMsg("请输入有效的 http(s) 开头网址");
      return;
    }
    setPhase("loading");
    setErrorMsg(null);
    setResult(null);
    try {
      const res = await fetch(`${apiBase}/admin/scrape${adminWallet ? `?adminWallet=${adminWallet}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPhase("idle");
        setErrorMsg(data.error ?? "抓取失败，请检查链接是否有效");
        return;
      }
      setResult(data);
      setEditTitle(data.title || "");
      setEditContent(
        data.description
          ? `${data.description}\n\n${data.content}`.trim()
          : data.content
      );
      setEditCover(data.coverImage || null);
      setSection("");
      setPhase("preview");
    } catch (e) {
      setPhase("idle");
      setErrorMsg(`网络错误：${String(e)}`);
    }
  }

  async function handlePublish() {
    if (!editTitle.trim()) { toast({ title: "请填写标题", variant: "destructive" }); return; }
    if (!editContent.trim()) { toast({ title: "请填写正文", variant: "destructive" }); return; }
    if (!section) { toast({ title: "请选择发布分区", variant: "destructive" }); return; }
    if (!adminWallet) { toast({ title: "钱包未连接", variant: "destructive" }); return; }

    setPhase("publishing");
    try {
      const body: Record<string, unknown> = {
        title: editTitle.trim(),
        content: editContent.trim(),
        section,
        authorWallet: adminWallet,
      };
      if (editCover) body.coverImage = editCover;
      if (result?.sourceUrl) body.sourceUrl = result.sourceUrl;
      if (officialTag) body.tags = ["官方抓取"];

      const res = await fetch(`${apiBase}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: `发布失败：${data.error ?? data.message ?? "未知错误"}`, variant: "destructive" });
        setPhase("preview");
        return;
      }
      setPhase("done");
      toast({ title: "✅ 已发布到平台！" });
    } catch (e) {
      toast({ title: `发布失败：${String(e)}`, variant: "destructive" });
      setPhase("preview");
    }
  }

  function reset() {
    setPhase("idle");
    setUrl("");
    setResult(null);
    setErrorMsg(null);
    setEditTitle("");
    setEditContent("");
    setEditCover(null);
    setSection("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div className="space-y-5">
      {/* Description */}
      <p className="text-sm text-muted-foreground">
        请输入外部网页链接，一键抓取内容至平台。支持抓取区块链项目公告、行业新闻、技术文章、研究报告等内容。
      </p>

      {/* URL input */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5" /> 目标链接
        </label>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={url}
            onChange={e => { setUrl(e.target.value); setErrorMsg(null); }}
            onKeyDown={e => e.key === "Enter" && phase === "idle" && handleScrape()}
            placeholder="https://example.com/blockchain-news"
            disabled={phase === "loading" || phase === "publishing"}
            className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary/50 disabled:opacity-60 font-mono"
          />
          {phase === "idle" || phase === "preview" || phase === "done" ? (
            <button
              onClick={phase === "preview" || phase === "done" ? reset : handleScrape}
              disabled={!url.trim()}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 ${
                phase === "preview" || phase === "done"
                  ? "border border-border hover:bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {phase === "preview" || phase === "done" ? (
                <><RefreshCw className="w-3.5 h-3.5" /> 重新抓取</>
              ) : (
                <><Download className="w-3.5 h-3.5" /> 开始抓取</>
              )}
            </button>
          ) : (
            <button disabled
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary/70 text-primary-foreground opacity-80 cursor-not-allowed">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {phase === "loading" ? "正在抓取..." : "发布中..."}
            </button>
          )}
        </div>
        {errorMsg && (
          <div className="flex items-start gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
            <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {errorMsg}
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {phase === "loading" && (
        <div className="bg-muted/40 border border-border rounded-2xl p-6 space-y-4 animate-pulse">
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-3 bg-muted rounded w-5/6" />
          <div className="h-24 bg-muted rounded" />
          <p className="text-center text-sm text-muted-foreground !mt-6">
            正在连接目标网站，解析 HTML 结构...
          </p>
        </div>
      )}

      {/* Done banner */}
      {phase === "done" && (
        <div className="flex items-center gap-3 px-5 py-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-700 rounded-2xl">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">抓取成功！内容已发布到平台</p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/60 mt-0.5">可在首页对应分区查看发布内容，或继续抓取下一篇</p>
          </div>
        </div>
      )}

      {/* Preview & Edit */}
      {(phase === "preview" || phase === "publishing") && result && (
        <div className="space-y-4">
          {/* Source info */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium text-foreground/70">{result.siteName}</span>
            <span>·</span>
            <a href={result.sourceUrl} target="_blank" rel="noreferrer"
              className="truncate max-w-[300px] text-primary hover:underline">
              {result.sourceUrl}
            </a>
          </div>

          {/* Cover image preview */}
          {editCover && (
            <div className="relative group">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <Image className="w-3.5 h-3.5" /> 封面图片
              </label>
              <img src={editCover} alt="封面图"
                className="w-full max-h-48 object-cover rounded-xl border border-border" />
              <button
                onClick={() => setEditCover(null)}
                className="absolute top-8 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                移除
              </button>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Heading className="w-3.5 h-3.5" /> 标题
            </label>
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              placeholder="输入文章标题..."
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5" /> 正文
            </label>
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows={10}
              placeholder="抓取的正文内容，可进行编辑..."
              className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary/50 resize-y leading-relaxed"
            />
            <p className="text-xs text-muted-foreground px-1">
              抓取内容仅供参考，请遵守原内容版权并进行适当编辑
            </p>
          </div>

          {/* Section selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> 发布分区
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_SECTIONS.map(s => (
                <button key={s} onClick={() => setSection(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    section === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
            {!section && (
              <p className="text-xs text-amber-600 dark:text-amber-400 px-1">请选择一个发布分区</p>
            )}
          </div>

          {/* Official tag toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => setOfficialTag(v => !v)}
              className={`w-10 h-5 rounded-full transition-colors relative ${officialTag ? "bg-primary" : "bg-muted border border-border"}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${officialTag ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
            <span className="text-sm text-foreground/80">添加"官方抓取"标签</span>
          </label>

          {/* Publish button */}
          <div className="pt-1">
            <button
              onClick={handlePublish}
              disabled={phase === "publishing"}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60">
              {phase === "publishing"
                ? <><Loader2 className="w-4 h-4 animate-spin" /> 发布中...</>
                : <><Send className="w-4 h-4" /> 发布到平台</>
              }
            </button>
          </div>

          {/* Notice */}
          <div className="text-xs text-muted-foreground/60 space-y-0.5 px-1 border-t border-border pt-3">
            <p>• 如需抓取 Twitter/X 长帖或 Discord 公告，请确保链接有效且公开可访问</p>
            <p>• 抓取内容不代表平台立场，发布前请自行核实信息准确性</p>
          </div>
        </div>
      )}

      {/* Empty hint */}
      {phase === "idle" && (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-2xl">
          <Download className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">粘贴网页 URL 后，点击"开始抓取"即可导入外部内容</p>
          <p className="text-xs mt-1 opacity-60">支持新闻、公告、博客、研究报告等各类网页</p>
        </div>
      )}
    </div>
  );
}
