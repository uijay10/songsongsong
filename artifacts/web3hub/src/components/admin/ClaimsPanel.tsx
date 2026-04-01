import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, Download, Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface ClaimApplication {
  id: string;
  eventTitle: string;
  projectName: string;
  contact: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  submitTime: string;
  reviewTime?: string;
  reviewNote?: string;
}

const CLAIM_STORAGE_KEY = "projectApplications";

function loadClaims(): ClaimApplication[] {
  try {
    const raw = localStorage.getItem(CLAIM_STORAGE_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as ClaimApplication[];
    return all.filter(c => c.id && String(c.id).startsWith("claim_"));
  } catch { return []; }
}

function saveClaims(claims: ClaimApplication[]): void {
  localStorage.setItem(CLAIM_STORAGE_KEY, JSON.stringify(claims));
}

function StatusBadge({ status }: { status: ClaimApplication["status"] }) {
  if (status === "pending")
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">待审核</span>;
  if (status === "approved")
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">已通过</span>;
  return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">已拒绝</span>;
}

export function ClaimsPanel() {
  const { toast } = useToast();
  const [claims, setClaims] = useState<ClaimApplication[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ClaimApplication["status"]>("all");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const reload = useCallback(() => {
    const data = loadClaims();
    setClaims(data);
    const n: Record<string, string> = {};
    data.forEach(c => { n[c.id] = c.reviewNote ?? ""; });
    setNotes(n);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const persist = useCallback((updated: ClaimApplication[]) => {
    saveClaims(updated);
    setClaims(updated);
  }, []);

  const approve = useCallback((id: string) => {
    const updated = claims.map(c =>
      c.id === id ? { ...c, status: "approved" as const, reviewTime: new Date().toLocaleString("zh-CN") } : c
    );
    persist(updated);
    toast({ title: "✅ 已通过申请" });
  }, [claims, persist, toast]);

  const reject = useCallback((id: string) => {
    const updated = claims.map(c =>
      c.id === id ? { ...c, status: "rejected" as const, reviewTime: new Date().toLocaleString("zh-CN") } : c
    );
    persist(updated);
    toast({ title: "❌ 已拒绝申请" });
  }, [claims, persist, toast]);

  const saveNote = useCallback((id: string) => {
    const note = notes[id] ?? "";
    const updated = claims.map(c => c.id === id ? { ...c, reviewNote: note } : c);
    persist(updated);
    toast({ title: "✅ 备注已保存" });
  }, [claims, notes, persist, toast]);

  const batchApprove = useCallback(() => {
    const pending = claims.filter(c => c.status === "pending");
    if (pending.length === 0) { toast({ title: "没有待审核的申请" }); return; }
    const updated = claims.map(c =>
      c.status === "pending"
        ? { ...c, status: "approved" as const, reviewTime: new Date().toLocaleString("zh-CN") }
        : c
    );
    persist(updated);
    toast({ title: `✅ 批量通过 ${pending.length} 条申请` });
  }, [claims, persist, toast]);

  const batchReject = useCallback(() => {
    const pending = claims.filter(c => c.status === "pending");
    if (pending.length === 0) { toast({ title: "没有待审核的申请" }); return; }
    const updated = claims.map(c =>
      c.status === "pending"
        ? { ...c, status: "rejected" as const, reviewTime: new Date().toLocaleString("zh-CN") }
        : c
    );
    persist(updated);
    toast({ title: `❌ 批量拒绝 ${pending.length} 条申请` });
  }, [claims, persist, toast]);

  const exportCSV = useCallback(() => {
    if (claims.length === 0) { toast({ title: "没有可导出的数据" }); return; }
    const BOM = "\uFEFF";
    const statusMap: Record<string, string> = { pending: "待审核", approved: "已通过", rejected: "已拒绝" };
    let csv = BOM + "申请ID,事件标题,项目名称,联系方式,状态,提交时间,审核时间,审核备注\n";
    claims.forEach(c => {
      csv += [
        `"${c.id}"`,
        `"${(c.eventTitle ?? "").replace(/"/g, '""')}"`,
        `"${(c.projectName ?? "").replace(/"/g, '""')}"`,
        `"${(c.contact ?? "").replace(/"/g, '""')}"`,
        `"${statusMap[c.status] ?? c.status}"`,
        `"${c.submitTime ?? ""}"`,
        `"${c.reviewTime ?? ""}"`,
        `"${(c.reviewNote ?? "").replace(/"/g, '""')}"`,
      ].join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `认领申请_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast({ title: "✅ 已导出 CSV" });
  }, [claims, toast]);

  const pending  = claims.filter(c => c.status === "pending").length;
  const approved = claims.filter(c => c.status === "approved").length;
  const rejected = claims.filter(c => c.status === "rejected").length;

  const filtered = claims
    .filter(c => statusFilter === "all" || c.status === statusFilter)
    .filter(c => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        (c.projectName ?? "").toLowerCase().includes(q) ||
        (c.eventTitle ?? "").toLowerCase().includes(q)
      );
    });

  return (
    <div className="space-y-6">
      {/* Stats + actions */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div className="flex gap-4">
          {[
            { label: "待审核", value: pending,  color: "text-amber-600",   onClick: () => setStatusFilter("pending") },
            { label: "已通过", value: approved, color: "text-emerald-600", onClick: () => setStatusFilter("approved") },
            { label: "已拒绝", value: rejected, color: "text-red-600",     onClick: () => setStatusFilter("rejected") },
          ].map(({ label, value, color, onClick }) => (
            <button key={label} onClick={onClick}
              className="bg-card border border-border rounded-2xl px-5 py-4 text-center hover:shadow-md transition-shadow min-w-[90px]">
              <div className={`text-xs font-medium ${color}`}>{label}</div>
              <div className="text-3xl font-bold text-foreground mt-1">{value}</div>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={reload}
            className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-xl text-sm hover:bg-muted transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> 刷新
          </button>
          <button onClick={batchApprove}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700 transition-colors">
            <CheckCircle className="w-3.5 h-3.5" /> 批量通过
          </button>
          <button onClick={batchReject}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition-colors">
            <XCircle className="w-3.5 h-3.5" /> 批量拒绝
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 text-white rounded-xl text-sm hover:bg-slate-800 transition-colors">
            <Download className="w-3.5 h-3.5" /> 导出 CSV
          </button>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="搜索项目名称或事件标题..."
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        {(["all", "pending", "approved", "rejected"] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:bg-muted text-muted-foreground"
            }`}>
            {s === "all" ? "全部" : s === "pending" ? "待审核" : s === "approved" ? "已通过" : "已拒绝"}
          </button>
        ))}
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <div className="text-5xl mb-3">📭</div>
          <p className="font-medium">暂无认领申请</p>
          <p className="text-sm mt-1">前端用户提交项目方认领后将在此显示</p>
        </div>
      )}

      {/* Claim cards */}
      <div className="space-y-4">
        {filtered.map(claim => (
          <div key={claim.id} className="bg-card border border-border rounded-2xl p-6 space-y-4 hover:border-primary/30 transition-colors">
            <div className="flex flex-wrap justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{claim.id}</span>
                  <StatusBadge status={claim.status} />
                </div>
                <h3 className="font-semibold text-base text-foreground">{claim.eventTitle}</h3>
                <p className="text-sm text-foreground/80 mt-1"><strong>申请方：</strong>{claim.projectName}</p>
                <p className="text-sm text-muted-foreground"><strong>联系方式：</strong>{claim.contact}</p>
                <div className="flex flex-wrap gap-3 mt-1">
                  <span className="text-xs text-muted-foreground">提交：{claim.submitTime}</span>
                  {claim.reviewTime && <span className="text-xs text-muted-foreground">审核：{claim.reviewTime}</span>}
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-xl p-4 text-sm text-foreground/80">
              <strong className="text-foreground">认领理由：</strong><br />
              {claim.reason}
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">审核备注</label>
              <textarea
                value={notes[claim.id] ?? ""}
                onChange={e => setNotes(prev => ({ ...prev, [claim.id]: e.target.value }))}
                rows={2}
                placeholder="填写审核意见（可选）..."
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary/50 resize-none transition-colors"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {claim.status === "pending" && (
                <>
                  <button onClick={() => approve(claim.id)}
                    className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
                    <CheckCircle className="w-3.5 h-3.5" /> 通过
                  </button>
                  <button onClick={() => reject(claim.id)}
                    className="flex items-center gap-1.5 px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors">
                    <XCircle className="w-3.5 h-3.5" /> 拒绝
                  </button>
                </>
              )}
              <button onClick={() => saveNote(claim.id)}
                className="flex items-center gap-1.5 px-5 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">
                保存备注
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
