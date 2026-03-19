import { useState, useEffect } from "react";
import { useWeb3Auth } from "@/lib/web3";
import { isAdmin } from "@/lib/admin";
import { useLang } from "@/lib/i18n";
import { useLocation } from "wouter";
import {
  Users, ClipboardList, Zap, Star, Ban, Download,
  CheckCircle, XCircle, RefreshCw, Pin, Send,
  ChevronDown, AlertCircle, ShieldOff
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

async function adminGet(path: string, wallet: string) {
  const sep = path.includes("?") ? "&" : "?";
  return fetch(`${apiBase}/admin${path}${sep}adminWallet=${encodeURIComponent(wallet)}`).then(r => r.json());
}

type Tab = "applications" | "users" | "send";

interface DialogState {
  type: "approve" | "reject";
  appId: number;
}

interface SendState {
  wallet: string;
  field: "points" | "energy" | "pinCount";
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
  const [sendAll, setSendAll] = useState<{ field: "points" | "energy"; amount: string } | null>(null);
  const [revokeDialog, setRevokeDialog] = useState<string | null>(null);

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

  useEffect(() => {
    if (!admin || !address) return;
    if (tab === "applications") loadApps();
    else if (tab === "users" || tab === "send") loadUsers();
  }, [tab, statusFilter, admin, address]);

  const approve = async (id: number) => {
    if (!address) return;
    await adminPost(`/applications/${id}/approve`, address, {});
    flash("✓ " + t("adminConfirm")); loadApps(); setDialog(null);
  };

  const reject = async (id: number) => {
    if (!address) return;
    await adminPost(`/applications/${id}/reject`, address, { reason: rejectReason });
    flash("✓ " + t("adminRejectMsg")); setRejectReason(""); loadApps(); setDialog(null);
  };

  const banUser = async (wallet: string, ban: boolean) => {
    if (!address) return;
    await adminPost(`/users/${wallet}/ban`, address, { ban });
    flash(ban ? "Banned" : "Unbanned"); loadUsers();
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
    flash("✓ Sent!"); setSendState(null); loadUsers();
  };

  const sendAllPoints = async () => {
    if (!address || !sendAll?.amount) return;
    await adminPost("/users/all/points", address, { op: "add", value: Number(sendAll.amount) });
    flash("✓ Sent to all!"); setSendAll(null); loadUsers();
  };

  const downloadCsv = (type: "points-summary" | "bills") => {
    if (!address) window.open(`${apiBase}/admin/${type}?adminWallet=${encodeURIComponent(address!)}`, "_blank");
    else window.open(`${apiBase}/admin/${type}?adminWallet=${encodeURIComponent(address)}`, "_blank");
  };

  if (!admin) {
    return (
      <div className="py-32 text-center">
        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-destructive">Access Denied</h2>
        <p className="text-muted-foreground mt-2">Admin wallets only.</p>
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

  const appTypeLabel = (app: any) => {
    if (app.type === "project") return t("applyProject");
    if (app.type === "kol") return t("adminKol");
    if (app.type === "developer") return t("applyDeveloper");
    return app.type;
  };

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">🛡️ Admin Panel</h1>
        {msg && (
          <div className="px-4 py-2 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-semibold">
            {msg}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button className={tabCls(tab === "applications")} onClick={() => setTab("applications")}>
          <ClipboardList className="w-4 h-4 inline mr-1" />{t("myPosts").replace("我的", "申请")} Applications
        </button>
        <button className={tabCls(tab === "users")} onClick={() => setTab("users")}>
          <Users className="w-4 h-4 inline mr-1" />Users
        </button>
        <button className={tabCls(tab === "send")} onClick={() => setTab("send")}>
          <Send className="w-4 h-4 inline mr-1" />{t("adminSend")} / CSV
        </button>
      </div>

      {/* ─── Applications Tab ─── */}
      {tab === "applications" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            {(["pending","approved","rejected",""] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`${btnCls} ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}>
                {s === "pending" ? "Pending" : s === "approved" ? "Approved" : s === "rejected" ? "Rejected" : "All"}
              </button>
            ))}
            <button onClick={loadApps} className={`${btnCls} bg-muted hover:bg-muted/80 ml-auto`}>
              <RefreshCw className="w-4 h-4 inline mr-1" />Refresh
            </button>
          </div>

          {loading ? <div className="h-48 rounded-2xl bg-muted animate-pulse" /> : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="divide-y divide-border/40">
                {applications.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">No applications</div>
                ) : applications.map(app => (
                  <div key={app.id} className="p-5 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      {/* Left: all submitted info */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusBadge(app.status)}`}>
                            {app.status}
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
                            <span className="text-muted-foreground shrink-0 w-20">Wallet</span>
                            <span className="font-mono text-xs">{app.wallet?.slice(0,10)}...{app.wallet?.slice(-4)}</span>
                          </div>
                          {app.twitter && <div className="flex gap-2"><span className="text-muted-foreground shrink-0 w-20">{t("applyPersonalTwitter")}</span><span className="text-xs truncate">{app.twitter}</span></div>}
                          {app.projectName && <div className="flex gap-2"><span className="text-muted-foreground shrink-0 w-20">{t("applyProjectName")}</span><span className="text-xs truncate">{app.projectName}</span></div>}
                          {app.projectTwitter && <div className="flex gap-2"><span className="text-muted-foreground shrink-0 w-20">{t("applyProjectTwitter")}</span><span className="text-xs truncate">{app.projectTwitter}</span></div>}
                          {app.tweetLink && <div className="flex gap-2"><span className="text-muted-foreground shrink-0 w-20">Tweet</span><a href={app.tweetLink} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate">{app.tweetLink}</a></div>}
                          {app.docsLink && <div className="flex gap-2"><span className="text-muted-foreground shrink-0 w-20">{t("applyDocs")}</span><a href={app.docsLink} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate">{app.docsLink}</a></div>}
                          {app.github && <div className="flex gap-2"><span className="text-muted-foreground shrink-0 w-20">GitHub</span><a href={app.github} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate">{app.github}</a></div>}
                          {app.linkedin && <div className="flex gap-2"><span className="text-muted-foreground shrink-0 w-20">LinkedIn</span><a href={app.linkedin} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate">{app.linkedin}</a></div>}
                        </div>
                      </div>
                      {/* Right: actions */}
                      <div className="flex gap-2 shrink-0">
                        {app.status === "pending" && (<>
                          <button onClick={() => setDialog({ type: "approve", appId: app.id })}
                            className="px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-semibold hover:bg-green-200 transition-colors">
                            ✓ {t("adminConfirm")}
                          </button>
                          <button onClick={() => { setDialog({ type: "reject", appId: app.id }); setRejectReason(""); }}
                            className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-semibold hover:bg-red-200 transition-colors">
                            ✗ {t("adminRejectReason")}
                          </button>
                        </>)}
                        {app.status === "approved" && (
                          <button onClick={() => setRevokeDialog(app.wallet)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-semibold hover:bg-orange-200 transition-colors">
                            <ShieldOff className="w-3.5 h-3.5" /> 撤销
                          </button>
                        )}
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
          {/* Category sub-tabs */}
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
              <RefreshCw className="w-4 h-4 inline mr-1" />Refresh
            </button>
          </div>

          {/* Send points/energy/pinCount panel */}
          {sendState && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-sm">{t("adminSendTo")}: {sendState.wallet.slice(0,12)}... ({sendState.field})</h3>
              <div className="flex gap-2 items-center">
                <input type="number" value={sendState.amount} onChange={e => setSendState({ ...sendState, amount: e.target.value })}
                  placeholder={t("adminSendAmount")} className="border border-border rounded-xl px-3 py-2 text-sm bg-background w-32" />
                <button onClick={sendValue} className={`${btnCls} bg-primary text-primary-foreground`}>{t("adminConfirm")}</button>
                <button onClick={() => setSendState(null)} className={`${btnCls} bg-muted`}>{t("adminCancel")}</button>
              </div>
            </div>
          )}

          {loading ? <div className="h-48 rounded-2xl bg-muted animate-pulse" /> : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left">Wallet</th>
                    <th className="p-3 text-left">Username</th>
                    <th className="p-3 text-right">{t("points")}</th>
                    <th className="p-3 text-right">{t("energy")}</th>
                    <th className="p-3 text-right">{t("pinCount")}</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={8} className="p-10 text-center text-muted-foreground">No users</td></tr>
                  ) : filteredUsers.map(u => (
                    <tr key={u.id} className={`hover:bg-muted/20 ${u.isBanned ? "opacity-50" : ""}`}>
                      <td className="p-3 font-mono text-xs">{u.wallet.slice(0,8)}...{u.wallet.slice(-4)}</td>
                      <td className="p-3 text-xs">{u.username ?? "-"}</td>
                      <td className="p-3 text-right font-semibold">{u.points?.toLocaleString()}</td>
                      <td className="p-3 text-right">{u.energy?.toLocaleString()}</td>
                      <td className="p-3 text-right">{u.pinCount ?? 0}</td>
                      <td className="p-3 text-xs">{u.spaceType ? <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">{u.spaceType}</span> : "-"}</td>
                      <td className="p-3 text-xs">
                        {u.isBanned ? <span className="text-red-500 font-semibold">Banned</span> : <span className="text-green-500">Active</span>}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1.5 flex-wrap">
                          <button onClick={() => setSendState({ wallet: u.wallet, field: "points", amount: "" })}
                            className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs hover:bg-amber-200 transition-colors">
                            {t("adminSendPoints").replace("发送", "").replace("Send ", "")} Pts
                          </button>
                          <button onClick={() => setSendState({ wallet: u.wallet, field: "energy", amount: "" })}
                            className="px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs hover:bg-blue-200 transition-colors">
                            Nrg
                          </button>
                          <button onClick={() => setSendState({ wallet: u.wallet, field: "pinCount", amount: "" })}
                            className="px-2 py-1 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs hover:bg-violet-200 transition-colors">
                            Pin
                          </button>
                          <button onClick={() => banUser(u.wallet, !u.isBanned)}
                            className={`px-2 py-1 rounded-lg text-xs transition-colors ${u.isBanned ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200"}`}>
                            {u.isBanned ? "Unban" : "Ban"}
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
            <h3 className="font-bold">{t("adminSendTo")}</h3>
            {(["points","energy","pinCount"] as const).map(field => {
              const key = `send_${field}`;
              return (
                <div key={field} className="space-y-2">
                  <label className="text-sm font-semibold">
                    {field === "points" ? t("adminSendPoints") : field === "energy" ? t("adminSendEnergy") : t("adminSendPin")}
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    <input
                      id={`wallet_${field}`}
                      type="text"
                      placeholder={`${t("adminSendTo")}...`}
                      className="flex-1 min-w-[220px] border border-border rounded-xl px-3 py-2 text-sm bg-background"
                    />
                    <input
                      id={`amount_${field}`}
                      type="number"
                      placeholder={t("adminSendAmount")}
                      className="w-28 border border-border rounded-xl px-3 py-2 text-sm bg-background"
                    />
                    <button
                      onClick={async () => {
                        const wallet = (document.getElementById(`wallet_${field}`) as HTMLInputElement)?.value?.toLowerCase();
                        const amount = (document.getElementById(`amount_${field}`) as HTMLInputElement)?.value;
                        if (!wallet || !amount || !address) return;
                        const endpoint = field === "pinCount" ? "pin-count" : field;
                        await adminPost(`/users/${wallet}/${endpoint}`, address, { op: "add", value: Number(amount) });
                        flash(`✓ Sent ${amount} ${field} to ${wallet.slice(0,8)}...`);
                        (document.getElementById(`wallet_${field}`) as HTMLInputElement).value = "";
                        (document.getElementById(`amount_${field}`) as HTMLInputElement).value = "";
                        loadUsers();
                      }}
                      className={`${btnCls} bg-primary text-primary-foreground hover:bg-primary/90`}
                    >
                      <Send className="w-4 h-4 inline mr-1" />{t("adminSend")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bulk points to all users */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" />Bulk Points (All Users)</h3>
            <div className="flex gap-2 flex-wrap">
              <input id="bulk_amt" type="number" placeholder={t("adminSendAmount")}
                className="w-28 border border-border rounded-xl px-3 py-2 text-sm bg-background" />
              <button onClick={async () => {
                const v = (document.getElementById("bulk_amt") as HTMLInputElement)?.value;
                if (!v || !address) return;
                await adminPost("/users/all/points", address, { op: "add", value: Number(v) });
                flash(`✓ Added ${v} points to all`);
                (document.getElementById("bulk_amt") as HTMLInputElement).value = "";
              }} className={`${btnCls} bg-green-500 text-white hover:bg-green-600`}>
                + {t("adminSend")} to All
              </button>
              <button onClick={async () => {
                if (!confirm("Clear ALL users' points?") || !address) return;
                await adminPost("/users/all/points", address, { op: "clear" });
                flash("✓ Cleared all points");
              }} className={`${btnCls} bg-red-500 text-white hover:bg-red-600`}>
                Clear All
              </button>
            </div>
          </div>

          {/* CSV export */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2"><Download className="w-5 h-5 text-blue-500" />Export CSV</h3>
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => downloadCsv("points-summary")}
                className={`${btnCls} bg-blue-500 text-white hover:bg-blue-600`}>
                <Download className="w-4 h-4 inline mr-1" />Points Summary
              </button>
              <button onClick={() => downloadCsv("bills")}
                className={`${btnCls} bg-violet-500 text-white hover:bg-violet-600`}>
                <Download className="w-4 h-4 inline mr-1" />Bills
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirm/Reject Dialog ─── */}
      {dialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setDialog(null)}>
          <div className="bg-card border border-border rounded-2xl p-7 max-w-sm w-full mx-4 shadow-2xl space-y-5"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold">
              {dialog.type === "approve" ? "✓ " + t("adminApproveMsg") : "✗ " + t("adminRejectMsg")}
            </h2>

            {dialog.type === "reject" && (
              <div>
                <label className="text-sm font-semibold block mb-2">{t("adminRejectReason")}</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder={t("adminRejectPlaceholder")}
                  rows={3}
                  className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm resize-none"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setDialog(null)}
                className="flex-1 py-3 rounded-xl border border-border font-semibold text-sm hover:bg-muted transition-colors">
                {t("adminCancel")}
              </button>
              <button
                onClick={() => dialog.type === "approve" ? approve(dialog.appId) : reject(dialog.appId)}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${dialog.type === "approve" ? "bg-green-500 text-white hover:bg-green-600" : "bg-red-500 text-white hover:bg-red-600"}`}>
                {t("adminConfirm")}
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
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
