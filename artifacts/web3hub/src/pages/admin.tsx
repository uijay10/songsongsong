import { useState, useEffect } from "react";
import { useWeb3Auth } from "@/lib/web3";
import { isAdmin } from "@/lib/admin";
import { useLang } from "@/lib/i18n";
import { useLocation } from "wouter";
import {
  Users, ClipboardList, Zap, Star, Ban, Download,
  CheckCircle, XCircle, RefreshCw, Pin, Send,
  ChevronDown, AlertCircle, ShieldOff, Cpu, Trash2, Calendar,
  Globe, Sparkles, ExternalLink
} from "lucide-react";

function getApiBase() {
  const base = import.meta.env.BASE_URL ?? "/";
  const parts = base.replace(/\/$/, "").split("/");
  parts.pop();
  return parts.join("/") + "/api";
}

const apiBase = getApiBase();

async function adminPost(path: string, wallet: string, body: object) {
  return fetch(`${apiBase}/admin${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminWallet: wallet, ...body }),
  }).then(r => r.json());
}

async function adminDelete(path: string, wallet: string) {
  return fetch(`${apiBase}/admin${path}?adminWallet=${encodeURIComponent(wallet)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminWallet: wallet }),
  }).then(r => r.json());
}

async function adminGet(path: string, wallet: string) {
  const sep = path.includes("?") ? "&" : "?";
  return fetch(`${apiBase}/admin${path}${sep}adminWallet=${encodeURIComponent(wallet)}`).then(r => r.json());
}

type Tab = "applications" | "users" | "send" | "system" | "ai";

interface DialogState {
  type: "approve" | "reject";
  appId: number;
}

interface SendState {
  wallet: string;
  field: "tokens" | "energy" | "pinCount";
  amount: string;
}

export default function AdminPage() {
  const { address, isConnected } = useWeb3Auth();
  const { t } = useLang();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("applications");
  const [applications, setApplications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [userCat, setUserCat] = useState<"space" | "kol" | "developer" | "regular">("space");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [sendState, setSendState] = useState<SendState | null>(null);
  const [revokeDialog, setRevokeDialog] = useState<string | null>(null);
  const [deleteAppDialog, setDeleteAppDialog] = useState<number | null>(null);

  const [memInfo, setMemInfo] = useState<any>(null);
  const [cleanupMode, setCleanupMode] = useState<"percent" | "date">("percent");
  const [cleanupPct, setCleanupPct] = useState(10);
  const [cleanupFrom, setCleanupFrom] = useState("");
  const [cleanupTo, setCleanupTo] = useState("");
  const [cleanupConfirm, setCleanupConfirm] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string>("");

  const [aiUrl, setAiUrl] = useState("");
  const [aiEvents, setAiEvents] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMsg, setAiMsg] = useState("");
  const [aiSelected, setAiSelected] = useState<Set<number>>(new Set());
  const [aiPublishing, setAiPublishing] = useState(false);

  const admin = isAdmin(address);
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  useEffect(() => {
    if (isConnected !== undefined && !isConnected) { setLocation("/"); return; }
    if (isConnected && address && !admin) setLocation("/");
  }, [admin, address, isConnected]);

  const loadApps = async () => {
    if (!address) return;
    setLoading(true);
    const d = await adminGet(`/applications?status=${statusFilter}`, address);
    setApplications(d.applications ?? []);
    setLoading(false);
  };

  const loadUsers = async () => {
    if (!address) return;
    setLoading(true);
    const d = await adminGet("/users?limit=200", address);
    setUsers(d.users ?? []);
    setLoading(false);
  };

  const loadMemory = async () => {
    if (!address) return;
    const d = await adminGet("/memory", address);
    setMemInfo(d);
  };

  const doCleanup = async () => {
    if (!address) return;
    setCleanupLoading(true);
    setCleanupResult("");
    try {
      const body: any = { adminWallet: address, mode: cleanupMode };
      if (cleanupMode === "percent") body.percent = cleanupPct;
      else { body.from = cleanupFrom; body.to = cleanupTo; }
      const res = await fetch(`${apiBase}/admin/posts/cleanup`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setCleanupResult(`✓ 成功清除 ${data.deletedCount} 条帖子`);
        loadMemory();
      } else {
        setCleanupResult(`错误: ${data.error}`);
      }
    } catch (e) {
      setCleanupResult(`错误: ${String(e)}`);
    }
    setCleanupLoading(false);
    setCleanupConfirm(false);
  };

  useEffect(() => {
    if (!admin || !address) return;
    if (tab === "applications") loadApps();
    else if (tab === "users" || tab === "send") loadUsers();
    else if (tab === "system") loadMemory();
  }, [tab, statusFilter, admin, address]);

  const approve = async (id: number) => {
    if (!address) return;
    await adminPost(`/applications/${id}/approve`, address, {});
    flash("✓ 审核已通过"); loadApps(); setDialog(null);
  };

  const reject = async (id: number) => {
    if (!address) return;
    await adminPost(`/applications/${id}/reject`, address, { reason: rejectReason });
    flash("✓ 已拒绝"); setRejectReason(""); loadApps(); setDialog(null);
  };

  const deleteApp = async (id: number) => {
    if (!address) return;
    const res = await fetch(`${apiBase}/admin/applications/${id}?adminWallet=${encodeURIComponent(address)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminWallet: address }),
    });
    await res.json();
    flash("✓ 记录已删除"); setDeleteAppDialog(null); loadApps();
  };

  const banUser = async (wallet: string, ban: boolean) => {
    if (!address) return;
    await adminPost(`/users/${wallet}/ban`, address, { ban });
    flash(ban ? "✓ 已封禁" : "✓ 已解禁"); loadUsers();
  };

  const revokeUser = async (wallet: string) => {
    if (!address) return;
    await adminPost(`/users/${wallet}/revoke`, address, {});
    flash("✓ 已撤销身份"); setRevokeDialog(null); loadUsers(); loadApps();
  };

  const sendValue = async () => {
    if (!address || !sendState || !sendState.wallet || !sendState.amount) return;
    const endpoint = sendState.field === "pinCount" ? "pin-count" : sendState.field;
    await adminPost(`/users/${sendState.wallet}/${endpoint}`, address, { op: "add", value: Number(sendState.amount) });
    flash("✓ 发送成功！"); setSendState(null); loadUsers();
  };

  const downloadCsv = (type: "points-summary" | "bills") => {
    if (!address) window.open(`${apiBase}/admin/${type}?adminWallet=${encodeURIComponent(address!)}`, "_blank");
    else window.open(`${apiBase}/admin/${type}?adminWallet=${encodeURIComponent(address)}`, "_blank");
  };

  if (!admin) {
    return (
      <div className="py-32 text-center">
        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-destructive">无访问权限</h2>
        <p className="text-muted-foreground mt-2">仅限管理员钱包。</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    if (userCat === "space") return u.spaceStatus === "approved" || u.spaceStatus === "active";
    if (userCat === "kol") return u.spaceType === "kol";
    if (userCat === "developer") return u.spaceType === "developer";
    if (userCat === "regular") return !u.spaceStatus || u.spaceStatus === "none";
    return true;
  });

  const btnCls = "px-4 py-2 rounded-xl font-semibold text-sm transition-all";
  const tabCls = (active: boolean) =>
    `px-5 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition-all ${active ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground"}`;

  const statusBadge = (status: string) => {
    if (status === "approved") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    if (status === "rejected") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
  };

  const statusLabel = (s: string) => {
    if (s === "approved") return "已通过";
    if (s === "rejected") return "已拒绝";
    if (s === "pending") return "待审核";
    return s;
  };

  const appTypeLabel = (app: any) => {
    if (app.type === "project") return t("applyProject");
    if (app.type === "kol") return t("adminKol");
    if (app.type === "developer") return t("applyDeveloper");
    return app.type;
  };

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">🛡️ 管理员面板</h1>
        {msg && (
          <div className="px-4 py-2 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-semibold">
            {msg}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button className={tabCls(tab === "applications")} onClick={() => setTab("applications")}>
          <ClipboardList className="w-4 h-4 inline mr-1" />申请管理
        </button>
        <button className={tabCls(tab === "users")} onClick={() => setTab("users")}>
          <Users className="w-4 h-4 inline mr-1" />用户管理
        </button>
        <button className={tabCls(tab === "send")} onClick={() => setTab("send")}>
          <Send className="w-4 h-4 inline mr-1" />发送 / CSV
        </button>
        <button className={tabCls(tab === "system")} onClick={() => setTab("system")}>
          <Cpu className="w-4 h-4 inline mr-1" />系统维护
        </button>
        <button className={tabCls(tab === "ai")} onClick={() => setTab("ai")}>
          <Sparkles className="w-4 h-4 inline mr-1" />AI 抓取
        </button>
      </div>

      {/* ─── Applications Tab ─── */}
      {tab === "applications" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            {(["pending","approved","rejected",""] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`${btnCls} ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}>
                {s === "pending" ? "待审核" : s === "approved" ? "已通过" : s === "rejected" ? "已拒绝" : "全部"}
              </button>
            ))}
            <button onClick={loadApps} className={`${btnCls} bg-muted hover:bg-muted/80 ml-auto`}>
              <RefreshCw className="w-4 h-4 inline mr-1" />刷新
            </button>
          </div>

          {loading ? <div className="h-48 rounded-2xl bg-muted animate-pulse" /> : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="divide-y divide-border/40">
                {applications.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">暂无申请记录</div>
                ) : applications.map(app => (
                  <div key={app.id} className="p-5 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusBadge(app.status)}`}>
                            {statusLabel(app.status)}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                            {appTypeLabel(app)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                          <div className="flex gap-2">
                            <span className="text-muted-foreground shrink-0 w-20">钱包</span>
                            <span className="font-mono text-xs">{app.wallet?.slice(0,10)}...{app.wallet?.slice(-4)}</span>
                          </div>
                          {app.twitter && <div className="flex gap-2"><span className="text-muted-foreground shrink-0 w-20">{t("applyPersonalTwitter")}</span><span className="text-xs truncate">{app.twitter}</span></div>}
                          {app.projectName && <div className="flex gap-2"><span className="text-muted-foreground shrink-0 w-20">{t("applyProjectName")}</span><span className="text-xs truncate">{app.projectName}</span></div>}
                          {app.projectTwitter && <div className="flex gap-2"><span className="text-muted-foreground shrink-0 w-20">{t("applyProjectTwitter")}</span><span className="text-xs truncate">{app.projectTwitter}</span></div>}
                          {app.tweetLink && <div className="flex gap-2"><span className="text-muted-foreground shrink-0 w-20">推文链接</span><a href={app.tweetLink} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate">{app.tweetLink}</a></div>}
                          {app.docsLink && <div className="flex gap-2"><span className="text-muted-foreground shrink-0 w-20">{t("applyDocs")}</span><a href={app.docsLink} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate">{app.docsLink}</a></div>}
                          {app.github && <div className="flex gap-2"><span className="text-muted-foreground shrink-0 w-20">GitHub</span><a href={app.github} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate">{app.github}</a></div>}
                          {app.linkedin && <div className="flex gap-2"><span className="text-muted-foreground shrink-0 w-20">LinkedIn</span><a href={app.linkedin} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate">{app.linkedin}</a></div>}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0 flex-wrap">
                        {app.status === "pending" && (<>
                          <button onClick={() => setDialog({ type: "approve", appId: app.id })}
                            className="px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-semibold hover:bg-green-200 transition-colors">
                            ✓ 通过
                          </button>
                          <button onClick={() => { setDialog({ type: "reject", appId: app.id }); setRejectReason(""); }}
                            className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-semibold hover:bg-red-200 transition-colors">
                            ✗ 拒绝
                          </button>
                        </>)}
                        {app.status === "approved" && (
                          <button onClick={() => setRevokeDialog(app.wallet)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-semibold hover:bg-orange-200 transition-colors">
                            <ShieldOff className="w-3.5 h-3.5" /> 撤销
                          </button>
                        )}
                        <button onClick={() => setDeleteAppDialog(app.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-semibold hover:bg-red-200 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" /> 删除记录
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Users Tab ─── */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {([
              { key: "space", label: t("adminSpaceUsers") },
              { key: "kol", label: t("adminKol") },
              { key: "developer", label: t("adminDev") },
              { key: "regular", label: t("adminRegular") },
            ] as const).map(({ key, label }) => (
              <button key={key} onClick={() => setUserCat(key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${userCat === key ? "bg-primary text-primary-foreground shadow" : "bg-muted hover:bg-muted/80"}`}>
                {label}
                <span className="ml-1.5 text-xs opacity-70">
                  ({users.filter(u => {
                    if (key === "space") return u.spaceStatus === "approved" || u.spaceStatus === "active";
                    if (key === "kol") return u.spaceType === "kol";
                    if (key === "developer") return u.spaceType === "developer";
                    return !u.spaceStatus || u.spaceStatus === "none";
                  }).length})
                </span>
              </button>
            ))}
            <button onClick={loadUsers} className={`${btnCls} bg-muted hover:bg-muted/80 ml-auto`}>
              <RefreshCw className="w-4 h-4 inline mr-1" />刷新
            </button>
          </div>

          {sendState && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-sm">
                发送至：{sendState.wallet.slice(0,12)}...（
                {sendState.field === "tokens" ? "代币" : sendState.field === "energy" ? "能量" : "置顶次数"}
                ）
              </h3>
              <div className="flex gap-2 items-center">
                <input type="number" value={sendState.amount} onChange={e => setSendState({ ...sendState, amount: e.target.value })}
                  placeholder="数量" className="border border-border rounded-xl px-3 py-2 text-sm bg-background w-32" />
                <button onClick={sendValue} className={`${btnCls} bg-primary text-primary-foreground`}>确认发送</button>
                <button onClick={() => setSendState(null)} className={`${btnCls} bg-muted`}>取消</button>
              </div>
            </div>
          )}

          {loading ? <div className="h-48 rounded-2xl bg-muted animate-pulse" /> : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left">钱包地址</th>
                    <th className="p-3 text-left">用户名</th>
                    <th className="p-3 text-right">代币</th>
                    <th className="p-3 text-right">{t("energy")}</th>
                    <th className="p-3 text-right">置顶次数</th>
                    <th className="p-3 text-left">身份类型</th>
                    <th className="p-3 text-left">状态</th>
                    <th className="p-3 text-left">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={8} className="p-10 text-center text-muted-foreground">暂无用户</td></tr>
                  ) : filteredUsers.map(u => (
                    <tr key={u.id} className={`hover:bg-muted/20 ${u.isBanned ? "opacity-50" : ""}`}>
                      <td className="p-3 font-mono text-xs">{u.wallet.slice(0,8)}...{u.wallet.slice(-4)}</td>
                      <td className="p-3 text-xs">{u.username ?? "-"}</td>
                      <td className="p-3 text-right font-semibold">{(u.tokens ?? 0).toLocaleString()}</td>
                      <td className="p-3 text-right">{u.energy?.toLocaleString()}</td>
                      <td className="p-3 text-right">{u.pinCount ?? 0}</td>
                      <td className="p-3 text-xs">{u.spaceType ? <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">{u.spaceType}</span> : "-"}</td>
                      <td className="p-3 text-xs">
                        {u.isBanned ? <span className="text-red-500 font-semibold">已封禁</span> : <span className="text-green-500">正常</span>}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1.5 flex-wrap">
                          <button onClick={() => setSendState({ wallet: u.wallet, field: "tokens", amount: "" })}
                            className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs hover:bg-amber-200 transition-colors">
                            代币
                          </button>
                          <button onClick={() => setSendState({ wallet: u.wallet, field: "energy", amount: "" })}
                            className="px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs hover:bg-blue-200 transition-colors">
                            能量
                          </button>
                          <button onClick={() => setSendState({ wallet: u.wallet, field: "pinCount", amount: "" })}
                            className="px-2 py-1 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs hover:bg-violet-200 transition-colors">
                            置顶
                          </button>
                          <button onClick={() => banUser(u.wallet, !u.isBanned)}
                            className={`px-2 py-1 rounded-lg text-xs transition-colors ${u.isBanned ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200"}`}>
                            {u.isBanned ? "解禁" : "封禁"}
                          </button>
                          {u.spaceType && (
                            <button onClick={() => setRevokeDialog(u.wallet)}
                              className="px-2 py-1 rounded-lg text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 transition-colors flex items-center gap-1">
                              <ShieldOff className="w-3 h-3" /> 撤销
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Send & CSV Tab ─── */}
      {tab === "send" && (
        <div className="space-y-5">
          {/* Send to specific wallet */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <h3 className="font-bold">发送至指定钱包</h3>
            {(["tokens","energy","pinCount"] as const).map(field => (
              <div key={field} className="space-y-2">
                <label className="text-sm font-semibold">
                  {field === "tokens" ? "发送代币" : field === "energy" ? "发送能量" : "发送置顶次数"}
                </label>
                <div className="flex gap-2 flex-wrap">
                  <input
                    id={`wallet_${field}`}
                    type="text"
                    placeholder="目标钱包地址..."
                    className="flex-1 min-w-[220px] border border-border rounded-xl px-3 py-2 text-sm bg-background"
                  />
                  <input
                    id={`amount_${field}`}
                    type="number"
                    placeholder="数量"
                    className="w-28 border border-border rounded-xl px-3 py-2 text-sm bg-background"
                  />
                  <button
                    onClick={async () => {
                      const wallet = (document.getElementById(`wallet_${field}`) as HTMLInputElement)?.value?.toLowerCase();
                      const amount = (document.getElementById(`amount_${field}`) as HTMLInputElement)?.value;
                      if (!wallet || !amount || !address) return;
                      const endpoint = field === "pinCount" ? "pin-count" : field;
                      const res = await adminPost(`/users/${wallet}/${endpoint}`, address, { op: "add", value: Number(amount) });
                      if (res.error) {
                        flash(`✗ 失败：${res.error}`);
                      } else {
                        flash(`✓ 已向 ${wallet.slice(0,8)}... 发送 ${amount} ${field === "tokens" ? "代币" : field === "energy" ? "能量" : "置顶次数"}`);
                      }
                      (document.getElementById(`wallet_${field}`) as HTMLInputElement).value = "";
                      (document.getElementById(`amount_${field}`) as HTMLInputElement).value = "";
                      loadUsers();
                    }}
                    className={`${btnCls} bg-primary text-primary-foreground hover:bg-primary/90`}
                  >
                    <Send className="w-4 h-4 inline mr-1" />发送
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bulk tokens to all users */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" />批量发送代币（全部用户）</h3>
            <div className="flex gap-2 flex-wrap">
              <input id="bulk_amt" type="number" placeholder="数量"
                className="w-28 border border-border rounded-xl px-3 py-2 text-sm bg-background" />
              <button onClick={async () => {
                const v = (document.getElementById("bulk_amt") as HTMLInputElement)?.value;
                if (!v || !address) return;
                await adminPost("/users/all/tokens", address, { op: "add", value: Number(v) });
                flash(`✓ 已向所有用户发送 ${v} 代币`);
                (document.getElementById("bulk_amt") as HTMLInputElement).value = "";
              }} className={`${btnCls} bg-green-500 text-white hover:bg-green-600`}>
                + 批量发送
              </button>
              <button onClick={async () => {
                if (!confirm("确认清空所有用户的代币余额？") || !address) return;
                await adminPost("/users/all/tokens", address, { op: "clear" });
                flash("✓ 已清空所有代币");
              }} className={`${btnCls} bg-red-500 text-white hover:bg-red-600`}>
                清空全部
              </button>
            </div>
          </div>

          {/* CSV export */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2"><Download className="w-5 h-5 text-blue-500" />导出 CSV</h3>
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => downloadCsv("points-summary")}
                className={`${btnCls} bg-blue-500 text-white hover:bg-blue-600`}>
                <Download className="w-4 h-4 inline mr-1" />总积分（全用户+代币详情）
              </button>
              <button onClick={() => downloadCsv("bills")}
                className={`${btnCls} bg-violet-500 text-white hover:bg-violet-600`}>
                <Download className="w-4 h-4 inline mr-1" />用户账单
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── System Tab ─── */}
      {tab === "system" && (
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2"><Cpu className="w-5 h-5 text-blue-500" />实时系统状态</h3>
              <button onClick={loadMemory} className={`${btnCls} bg-muted hover:bg-muted/80`}>
                <RefreshCw className="w-4 h-4 inline mr-1" />刷新
              </button>
            </div>
            {memInfo ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "堆内存已用", value: `${(memInfo.heapUsed / 1024 / 1024).toFixed(1)} MB`, warn: memInfo.heapUsed / memInfo.heapTotal > 0.7 },
                  { label: "堆内存总量", value: `${(memInfo.heapTotal / 1024 / 1024).toFixed(1)} MB`, warn: false },
                  { label: "进程内存(RSS)", value: `${(memInfo.rss / 1024 / 1024).toFixed(1)} MB`, warn: memInfo.rss > 500 * 1024 * 1024 },
                  { label: "帖子总数", value: `${memInfo.postCount} 条`, warn: memInfo.postCount > 50000 },
                  { label: "用户总数", value: `${memInfo.userCount} 人`, warn: false },
                  { label: "堆使用率", value: `${((memInfo.heapUsed / memInfo.heapTotal) * 100).toFixed(0)}%`, warn: memInfo.heapUsed / memInfo.heapTotal > 0.7 },
                ].map(({ label, value, warn }) => (
                  <div key={label} className={`rounded-xl border p-4 ${warn ? "border-orange-300 bg-orange-50 dark:bg-orange-950/20" : "border-border bg-muted/20"}`}>
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className={`text-lg font-bold ${warn ? "text-orange-600 dark:text-orange-400" : "text-foreground"}`}>{value}</p>
                    {warn && <p className="text-[10px] text-orange-500 mt-1">⚠ 建议清理</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <h3 className="font-bold flex items-center gap-2"><Trash2 className="w-5 h-5 text-red-500" />帖子清理工具</h3>
            <p className="text-sm text-muted-foreground">清理将永久删除最旧的帖子，操作不可恢复，请谨慎操作。</p>

            <div className="flex gap-3">
              <button onClick={() => setCleanupMode("percent")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${cleanupMode === "percent" ? "bg-red-500 text-white shadow" : "bg-muted hover:bg-muted/80"}`}>
                按比例清除
              </button>
              <button onClick={() => setCleanupMode("date")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${cleanupMode === "date" ? "bg-red-500 text-white shadow" : "bg-muted hover:bg-muted/80"}`}>
                <Calendar className="w-4 h-4" />按时间段清除
              </button>
            </div>

            {cleanupMode === "percent" && (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <input type="range" min={1} max={80} value={cleanupPct}
                    onChange={e => setCleanupPct(Number(e.target.value))}
                    className="flex-1 accent-red-500" />
                  <span className="text-2xl font-bold text-red-500 w-16 text-right">{cleanupPct}%</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  将删除最旧的 <strong className="text-foreground">{cleanupPct}%</strong> 的帖子
                  {memInfo?.postCount ? `（约 ${Math.floor(memInfo.postCount * cleanupPct / 100)} 条）` : ""}
                </p>
                <div className="flex gap-2 flex-wrap text-xs text-muted-foreground">
                  {[10, 20, 30, 50, 80].map(p => (
                    <button key={p} onClick={() => setCleanupPct(p)}
                      className={`px-2.5 py-1 rounded-lg border transition-colors ${cleanupPct === p ? "border-red-400 text-red-500 font-bold" : "border-border hover:border-muted-foreground"}`}>
                      {p}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            {cleanupMode === "date" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1">起始日期</label>
                    <input type="date" value={cleanupFrom} onChange={e => setCleanupFrom(e.target.value)}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1">结束日期</label>
                    <input type="date" value={cleanupTo} onChange={e => setCleanupTo(e.target.value)}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background" />
                  </div>
                </div>
                {cleanupFrom && cleanupTo && (
                  <p className="text-sm text-muted-foreground">
                    将删除 <strong className="text-foreground">{cleanupFrom}</strong> 至 <strong className="text-foreground">{cleanupTo}</strong> 之间的所有帖子
                  </p>
                )}
              </div>
            )}

            {!cleanupConfirm ? (
              <button onClick={() => setCleanupConfirm(true)}
                disabled={cleanupMode === "date" && (!cleanupFrom || !cleanupTo)}
                className="px-5 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                <Trash2 className="w-4 h-4" />执行清理
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-700/50 text-sm text-red-700 dark:text-red-300 font-semibold">
                  ⚠ 确认要永久删除这些帖子吗？此操作不可撤销！
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setCleanupConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border font-semibold text-sm hover:bg-muted transition-colors">
                    取消
                  </button>
                  <button onClick={doCleanup} disabled={cleanupLoading}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 disabled:opacity-60 transition-colors">
                    {cleanupLoading ? "清理中..." : "确认删除"}
                  </button>
                </div>
              </div>
            )}

            {cleanupResult && (
              <div className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${cleanupResult.startsWith("✓") ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"}`}>
                {cleanupResult}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── AI 抓取 Tab ─── */}
      {tab === "ai" && (
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Globe className="w-5 h-5 text-violet-500" />
              从网页提取 Web3 事件
            </h3>
            <p className="text-sm text-muted-foreground">粘贴任意 Web3 资讯页面的 URL，AI 将自动识别并提取有效事件（测试网、空投、IDO 等）。</p>
            <div className="flex gap-2 flex-col sm:flex-row">
              <input
                type="url"
                value={aiUrl}
                onChange={e => setAiUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-violet-400/30"
                onKeyDown={async e => {
                  if (e.key === "Enter" && !aiLoading) {
                    if (!aiUrl.startsWith("http") || !address) return;
                    setAiLoading(true); setAiMsg(""); setAiEvents([]); setAiSelected(new Set());
                    try {
                      const res = await fetch(`${apiBase}/ai/extract`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ adminWallet: address, url: aiUrl }),
                      });
                      const d = await res.json();
                      if (!res.ok) { setAiMsg(`❌ 错误: ${d.error}`); return; }
                      setAiEvents(d.events ?? []);
                      if ((d.events ?? []).length === 0) setAiMsg("⚠ 未从该页面提取到有效事件");
                      else { setAiSelected(new Set((d.events ?? []).map((_: any, i: number) => i))); }
                    } catch (e) { setAiMsg(`❌ 请求失败: ${String(e)}`); }
                    finally { setAiLoading(false); }
                  }
                }}
              />
              <button
                onClick={async () => {
                  if (!aiUrl.startsWith("http") || !address || aiLoading) return;
                  setAiLoading(true); setAiMsg(""); setAiEvents([]); setAiSelected(new Set());
                  try {
                    const res = await fetch(`${apiBase}/ai/extract`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ adminWallet: address, url: aiUrl }),
                    });
                    const d = await res.json();
                    if (!res.ok) { setAiMsg(`❌ 错误: ${d.error}`); return; }
                    setAiEvents(d.events ?? []);
                    if ((d.events ?? []).length === 0) setAiMsg("⚠ 未从该页面提取到有效事件");
                    else { setAiSelected(new Set((d.events ?? []).map((_: any, i: number) => i))); }
                  } catch (e) { setAiMsg(`❌ 请求失败: ${String(e)}`); }
                  finally { setAiLoading(false); }
                }}
                disabled={aiLoading || !aiUrl.startsWith("http")}
                className="px-5 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shrink-0">
                {aiLoading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" />提取中...</>
                ) : (
                  <><Sparkles className="w-4 h-4" />开始提取</>
                )}
              </button>
            </div>
            {aiMsg && (
              <div className={`px-4 py-2.5 rounded-xl text-sm font-medium ${aiMsg.startsWith("❌") ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400" : "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"}`}>
                {aiMsg}
              </div>
            )}
          </div>

          {aiEvents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold">提取到 {aiEvents.length} 条事件</h3>
                  <button
                    onClick={() => setAiSelected(aiSelected.size === aiEvents.length ? new Set() : new Set(aiEvents.map((_, i) => i)))}
                    className="text-xs text-violet-600 dark:text-violet-400 hover:underline">
                    {aiSelected.size === aiEvents.length ? "全不选" : "全选"}
                  </button>
                </div>
                <button
                  onClick={async () => {
                    if (!address || aiSelected.size === 0 || aiPublishing) return;
                    setAiPublishing(true);
                    const toPublish = [...aiSelected].map(i => aiEvents[i]).filter(Boolean);
                    try {
                      const res = await fetch(`${apiBase}/ai/publish`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ adminWallet: address, events: toPublish }),
                      });
                      const d = await res.json();
                      if (!res.ok) { flash(`❌ 发布失败: ${d.error}`); return; }
                      flash(`✓ 成功发布 ${d.inserted} 条事件！`);
                      setAiEvents([]); setAiSelected(new Set()); setAiUrl("");
                    } catch (e) { flash(`❌ ${String(e)}`); }
                    finally { setAiPublishing(false); }
                  }}
                  disabled={aiSelected.size === 0 || aiPublishing}
                  className="px-5 py-2.5 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
                  {aiPublishing ? <><RefreshCw className="w-4 h-4 animate-spin" />发布中...</> : <>✓ 发布选中 {aiSelected.size} 条</>}
                </button>
              </div>

              <div className="space-y-3">
                {aiEvents.map((ev, i) => {
                  const isChecked = aiSelected.has(i);
                  const importanceCls = ev.importance === "high"
                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                    : ev.importance === "medium"
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
                  return (
                    <div
                      key={i}
                      onClick={() => setAiSelected(prev => {
                        const next = new Set(prev);
                        if (next.has(i)) next.delete(i); else next.add(i);
                        return next;
                      })}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${isChecked ? "border-violet-400 bg-violet-50 dark:bg-violet-950/20" : "border-border bg-card hover:border-violet-200"}`}>
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${isChecked ? "border-violet-500 bg-violet-500" : "border-border"}`}>
                          {isChecked && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start gap-2 flex-wrap">
                            <p className="font-semibold text-sm leading-snug flex-1">{ev.title}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${importanceCls}`}>
                              {ev.importance === "high" ? "高" : ev.importance === "medium" ? "中" : "低"}
                            </span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {(ev.ai_confidence * 100).toFixed(0)}% 置信
                            </span>
                          </div>
                          {ev.project_name && (
                            <p className="text-xs text-violet-600 dark:text-violet-400 font-semibold">{ev.project_name}</p>
                          )}
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{ev.description}</p>
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{ev.section}</span>
                            {ev.tags?.slice(0, 4).map((tag: string) => (
                              <span key={tag} className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                            ))}
                            {ev.start_time && (
                              <span className="text-muted-foreground">
                                {ev.start_time ? new Date(ev.start_time).toLocaleDateString("zh-CN") : ""}
                                {ev.end_time ? ` → ${new Date(ev.end_time).toLocaleDateString("zh-CN")}` : ""}
                              </span>
                            )}
                            {ev.source_url && (
                              <a href={ev.source_url} target="_blank" rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="flex items-center gap-0.5 text-blue-500 hover:underline">
                                <ExternalLink className="w-3 h-3" />原文
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Approve / Reject Dialog ─── */}
      {dialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setDialog(null)}>
          <div className="bg-card border border-border rounded-2xl p-7 max-w-sm w-full mx-4 shadow-2xl space-y-5"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold">
              {dialog.type === "approve" ? "✓ 确认通过此申请？" : "✗ 确认拒绝此申请？"}
            </h2>
            {dialog.type === "reject" && (
              <div>
                <label className="text-sm font-semibold block mb-2">{t("adminRejectReason")}</label>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  placeholder={t("adminRejectPlaceholder")} rows={3}
                  className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm resize-none" />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setDialog(null)}
                className="flex-1 py-3 rounded-xl border border-border font-semibold text-sm hover:bg-muted transition-colors">
                取消
              </button>
              <button onClick={() => dialog.type === "approve" ? approve(dialog.appId) : reject(dialog.appId)}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${dialog.type === "approve" ? "bg-green-500 text-white hover:bg-green-600" : "bg-red-500 text-white hover:bg-red-600"}`}>
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete App Record Dialog ─── */}
      {deleteAppDialog !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setDeleteAppDialog(null)}>
          <div className="bg-card border border-border rounded-2xl p-7 max-w-sm w-full mx-4 shadow-2xl space-y-5"
            onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="text-lg font-bold">删除申请记录</h2>
              <p className="text-sm text-muted-foreground">此操作将永久删除该申请记录，不可恢复。</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteAppDialog(null)}
                className="flex-1 py-3 rounded-xl border border-border font-semibold text-sm hover:bg-muted transition-colors">
                取消
              </button>
              <button onClick={() => deleteApp(deleteAppDialog)}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors">
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Revoke Confirmation Dialog ─── */}
      {revokeDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setRevokeDialog(null)}>
          <div className="bg-card border border-border rounded-2xl p-7 max-w-sm w-full mx-4 shadow-2xl space-y-5"
            onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <ShieldOff className="w-7 h-7 text-orange-500" />
              </div>
              <h2 className="text-lg font-bold">撤销用户身份</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                要撤销此用户的身份吗？
                <br />
                <span className="font-mono text-xs text-foreground">{revokeDialog.slice(0, 10)}...{revokeDialog.slice(-4)}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRevokeDialog(null)}
                className="flex-1 py-3 rounded-xl border border-border font-semibold text-sm hover:bg-muted transition-colors">
                取消
              </button>
              <button onClick={() => revokeUser(revokeDialog)}
                className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-colors">
                确定撤销
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
