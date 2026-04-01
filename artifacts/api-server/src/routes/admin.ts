import { Router, type IRouter } from "express";
import { db, usersTable, spaceApplicationsTable, postsTable } from "@workspace/db";
import { eq, desc, asc, sql, and, gte, lte } from "drizzle-orm";
import { ADMIN_WALLETS, requireAdmin } from "../lib/admin-check";
import { createChallenge, issueAdminToken, verifyChallenge } from "../lib/admin-token";
import * as cheerio from "cheerio";

const router: IRouter = Router();

router.get("/token/challenge", (req, res) => {
  const wallet = String(req.query.wallet ?? "").toLowerCase();
  if (!wallet || !ADMIN_WALLETS.has(wallet)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const challenge = createChallenge(wallet);
  res.json({ challenge });
});

router.post("/token", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const wallet = String(body?.wallet ?? "").toLowerCase();
  const message = String(body?.message ?? "");
  const signature = String(body?.signature ?? "");
  if (!wallet || !message || !signature || !ADMIN_WALLETS.has(wallet)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const valid = await verifyChallenge(wallet, message, signature);
  if (!valid) {
    res.status(403).json({ error: "Invalid or expired signature" });
    return;
  }
  const token = issueAdminToken(wallet);
  res.json({ token });
});

router.get("/users", requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)));
    const offset = (page - 1) * limit;
    const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset);
    const countRes = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
    res.json({ users, total: Number(countRes[0].count), page, limit });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.get("/applications", requireAdmin, async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const query = db.select().from(spaceApplicationsTable).orderBy(desc(spaceApplicationsTable.createdAt));
    const apps = await query;
    const filtered = status ? apps.filter(a => a.status === status) : apps;
    res.json({ applications: filtered, total: filtered.length });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post("/applications/:id/approve", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const app = await db.select().from(spaceApplicationsTable).where(eq(spaceApplicationsTable.id, id)).limit(1);
    if (!app.length) return res.status(404).json({ error: "Not found" });
    await db.update(spaceApplicationsTable).set({ status: "approved" }).where(eq(spaceApplicationsTable.id, id));
    const approvedType = app[0].type as string;
    const energyGrant = 1000; // all types receive 1000 energy on approval
    const pinGrant = approvedType === "project" ? 10 : 0; // project gets 10 pin slots
    const existingUser = await db.select().from(usersTable).where(eq(usersTable.wallet, app[0].wallet)).limit(1);
    const curEnergy = existingUser[0]?.energy ?? 0;
    const curPin = existingUser[0]?.pinCount ?? 0;
    const approvedName =
      approvedType === "project"
        ? (app[0].projectName || app[0].twitter || null)
        : (app[0].twitter || null);
    await db.update(usersTable).set({
      spaceStatus: "approved", spaceType: approvedType,
      energy: curEnergy + energyGrant,
      pinCount: curPin + pinGrant,
      ...(approvedName ? { username: approvedName } : {}),
    }).where(eq(usersTable.wallet, app[0].wallet));
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post("/applications/:id/reject", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const reason = (req.body?.reason ?? "") as string;
    const app = await db.select().from(spaceApplicationsTable).where(eq(spaceApplicationsTable.id, id)).limit(1);
    await db.update(spaceApplicationsTable)
      .set({ status: "rejected", rejectReason: reason || null } as any)
      .where(eq(spaceApplicationsTable.id, id));
    if (app.length) {
      await db.update(usersTable)
        .set({ spaceStatus: "rejected", spaceRejectedAt: new Date(), spaceRejectReason: reason || null } as any)
        .where(eq(usersTable.wallet, app[0].wallet));
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post("/applications/batch", requireAdmin, async (req, res) => {
  try {
    const { ids, action } = req.body as { ids: number[]; action: "approve" | "reject" };
    if (!ids?.length || !["approve","reject"].includes(action)) return res.status(400).json({ error: "Invalid" });
    const status = action === "approve" ? "approved" : "rejected";
    for (const id of ids) {
      const app = await db.select().from(spaceApplicationsTable).where(eq(spaceApplicationsTable.id, id)).limit(1);
      if (app.length) {
        await db.update(spaceApplicationsTable).set({ status }).where(eq(spaceApplicationsTable.id, id));
        if (action === "approve") {
          const batchType = app[0].type as string;
          const bEnergyGrant = 1000; // all types receive 1000 energy on approval
          const bPinGrant = batchType === "project" ? 10 : 0; // project gets 10 pin slots
          const bUser = await db.select().from(usersTable).where(eq(usersTable.wallet, app[0].wallet)).limit(1);
          const bCurEnergy = bUser[0]?.energy ?? 0;
          const bCurPin = bUser[0]?.pinCount ?? 0;
          const batchName =
            batchType === "project"
              ? (app[0].projectName || app[0].twitter || null)
              : (app[0].twitter || null);
          await db.update(usersTable).set({
            spaceStatus: "approved", spaceType: batchType,
            energy: bCurEnergy + bEnergyGrant,
            pinCount: bCurPin + bPinGrant,
            ...(batchName ? { username: batchName } : {}),
          }).where(eq(usersTable.wallet, app[0].wallet));
        }
      }
    }
    res.json({ success: true, count: ids.length });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post("/users/:wallet/energy", requireAdmin, async (req, res) => {
  try {
    const wallet = req.params.wallet.toLowerCase();
    const { op, value } = req.body as { op: "set" | "add" | "sub" | "clear"; value?: number };
    const users = await db.select().from(usersTable).where(eq(usersTable.wallet, wallet)).limit(1);
    if (!users.length) return res.status(404).json({ error: "User not found" });
    const cur = users[0].energy;
    let next = cur;
    if (op === "set") next = Number(value ?? 0);
    else if (op === "add") next = cur + Number(value ?? 0);
    else if (op === "sub") next = Math.max(0, cur - Number(value ?? 0));
    else if (op === "clear") next = 0;
    await db.update(usersTable).set({ energy: next }).where(eq(usersTable.wallet, wallet));
    res.json({ success: true, energy: next });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.delete("/applications/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(spaceApplicationsTable).where(eq(spaceApplicationsTable.id, id));
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post("/users/:wallet/tokens", requireAdmin, async (req, res) => {
  try {
    const wallet = req.params.wallet.toLowerCase();
    const { op, value } = req.body as { op: "set" | "add" | "sub" | "clear"; value?: number };
    const users = await db.select().from(usersTable).where(eq(usersTable.wallet, wallet)).limit(1);
    if (!users.length) return res.status(404).json({ error: "User not found" });
    const cur = users[0].tokens;
    let next = cur;
    if (op === "set") next = Number(value ?? 0);
    else if (op === "add") next = cur + Number(value ?? 0);
    else if (op === "sub") next = Math.max(0, cur - Number(value ?? 0));
    else if (op === "clear") next = 0;
    await db.update(usersTable).set({ tokens: next }).where(eq(usersTable.wallet, wallet));
    res.json({ success: true, tokens: next });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post("/users/all/tokens", requireAdmin, async (req, res) => {
  try {
    const { op, value } = req.body as { op: "add" | "sub" | "clear"; value?: number };
    if (op === "clear") {
      await db.update(usersTable).set({ tokens: 0 });
    } else if (op === "add") {
      await db.execute(sql`UPDATE users SET tokens = tokens + ${Number(value ?? 0)}`);
    } else if (op === "sub") {
      await db.execute(sql`UPDATE users SET tokens = GREATEST(0, tokens - ${Number(value ?? 0)})`);
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post("/users/:wallet/points", requireAdmin, async (req, res) => {
  try {
    const wallet = req.params.wallet.toLowerCase();
    const { op, value } = req.body as { op: "set" | "add" | "sub" | "clear"; value?: number };
    const users = await db.select().from(usersTable).where(eq(usersTable.wallet, wallet)).limit(1);
    if (!users.length) return res.status(404).json({ error: "User not found" });
    const cur = users[0].points;
    let next = cur;
    if (op === "set") next = Number(value ?? 0);
    else if (op === "add") next = cur + Number(value ?? 0);
    else if (op === "sub") next = Math.max(0, cur - Number(value ?? 0));
    else if (op === "clear") next = 0;
    await db.update(usersTable).set({ points: next }).where(eq(usersTable.wallet, wallet));
    res.json({ success: true, points: next });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post("/users/all/points", requireAdmin, async (req, res) => {
  try {
    const { op, value } = req.body as { op: "add" | "sub" | "clear"; value?: number };
    if (op === "clear") {
      await db.update(usersTable).set({ points: 0 });
    } else if (op === "add") {
      await db.execute(sql`UPDATE users SET points = points + ${Number(value ?? 0)}`);
    } else if (op === "sub") {
      await db.execute(sql`UPDATE users SET points = GREATEST(0, points - ${Number(value ?? 0)})`);
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post("/users/:wallet/pin-count", requireAdmin, async (req, res) => {
  try {
    const wallet = req.params.wallet.toLowerCase();
    const { op, value } = req.body as { op: "set" | "add" | "sub" | "clear"; value?: number };
    const users = await db.select().from(usersTable).where(eq(usersTable.wallet, wallet)).limit(1);
    if (!users.length) return res.status(404).json({ error: "User not found" });
    const cur = users[0].pinCount ?? 0;
    let next = cur;
    if (op === "set") next = Number(value ?? 0);
    else if (op === "add") next = cur + Number(value ?? 0);
    else if (op === "sub") next = Math.max(0, cur - Number(value ?? 0));
    else if (op === "clear") next = 0;
    await db.update(usersTable).set({ pinCount: next }).where(eq(usersTable.wallet, wallet));
    res.json({ success: true, pinCount: next });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post("/users/:wallet/ban", requireAdmin, async (req, res) => {
  try {
    const wallet = req.params.wallet.toLowerCase();
    const { ban } = req.body as { ban: boolean };
    await db.update(usersTable).set({ isBanned: ban }).where(eq(usersTable.wallet, wallet));
    res.json({ success: true, isBanned: ban });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post("/users/:wallet/revoke", requireAdmin, async (req, res) => {
  try {
    const wallet = req.params.wallet.toLowerCase();
    await db.update(usersTable).set({
      spaceStatus: "none",
      spaceType: null,
    }).where(eq(usersTable.wallet, wallet));
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.get("/points-summary", requireAdmin, async (req, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(desc(usersTable.tokens));

    const fmt = (v: unknown) => (v == null ? "" : String(v));
    const csv = [
      ["钱包地址","用户名","代币余额","积分","能量","置顶次数","身份类型","身份状态","邀请数","注册时间"].join(","),
      ...users.map(u => [
        fmt(u.wallet), fmt(u.username), fmt(u.tokens), fmt(u.points), fmt(u.energy),
        fmt(u.pinCount), fmt(u.spaceType ?? "普通用户"), fmt(u.spaceStatus ?? "-"),
        fmt(u.inviteCount), fmt(u.createdAt)
      ].join(","))
    ].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=tokens-summary.csv");
    res.send("\uFEFF" + csv);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.get("/bills", requireAdmin, async (req, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
    const fmt = (v: unknown) => (v == null ? "" : String(v));
    const csv = [
      ["ID","Wallet","Username","Points","Energy","SpaceStatus","SpaceType","InviteCount","PinCount","Joined"].join(","),
      ...users.map(u => [
        fmt(u.id), fmt(u.wallet), fmt(u.username), fmt(u.points), fmt(u.energy),
        fmt(u.spaceStatus), fmt(u.spaceType), fmt(u.inviteCount), fmt(u.pinCount), fmt(u.createdAt)
      ].join(","))
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=bills.csv");
    res.send(csv);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ── System memory info ────────────────────────────────────
router.get("/memory", requireAdmin, async (_req, res) => {
  try {
    const mem = process.memoryUsage();
    // Count posts
    const postCount = await db.select({ count: sql<number>`count(*)` }).from(postsTable);
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
    res.json({
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      rss: mem.rss,
      external: mem.external,
      postCount: Number(postCount[0]?.count ?? 0),
      userCount: Number(userCount[0]?.count ?? 0),
    });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ── Cleanup posts ─────────────────────────────────────────
router.delete("/posts/cleanup", requireAdmin, async (req, res) => {
  try {
    const { mode, percent, from, to } = req.body as {
      mode: "percent" | "date";
      percent?: number;
      from?: string;
      to?: string;
    };

    let deletedCount = 0;

    if (mode === "percent") {
      const pct = Math.min(80, Math.max(1, Number(percent ?? 10)));
      // Count total posts
      const countRes = await db.select({ count: sql<number>`count(*)` }).from(postsTable);
      const total = Number(countRes[0]?.count ?? 0);
      const toDelete = Math.floor(total * pct / 100);
      if (toDelete > 0) {
        // Get oldest posts IDs
        const oldest = await db.select({ id: postsTable.id })
          .from(postsTable)
          .orderBy(asc(postsTable.createdAt))
          .limit(toDelete);
        const ids = oldest.map(r => r.id);
        if (ids.length > 0) {
          await db.execute(sql`DELETE FROM posts WHERE id = ANY(ARRAY[${sql.join(ids.map(id => sql`${id}`), sql`, `)}]::int[])`);
          deletedCount = ids.length;
        }
      }
    } else if (mode === "date") {
      if (!from || !to) return res.status(400).json({ error: "from and to required for date mode" });
      const fromDate = new Date(from);
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999); // include full end day
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }
      const result = await db.delete(postsTable)
        .where(and(gte(postsTable.createdAt, fromDate), lte(postsTable.createdAt, toDate)))
        .returning({ id: postsTable.id });
      deletedCount = result.length;
    } else {
      return res.status(400).json({ error: "mode must be percent or date" });
    }

    res.json({ success: true, deletedCount });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ── URL Content Scraper ───────────────────────────────────────────────────────
router.post("/scrape", requireAdmin, async (req, res) => {
  const { url } = req.body as { url?: string };
  if (!url || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: "Valid http(s) URL required" });
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Web3HubBot/1.0)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
    });
    clearTimeout(timeout);
    if (!response.ok) {
      return res.status(502).json({ error: `Remote server returned ${response.status}` });
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    // Title: og:title → twitter:title → <title>
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      $("title").first().text() ||
      "";

    // Description: og:description → meta description → first <p>
    const description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      $('meta[name="twitter:description"]').attr("content") ||
      "";

    // Cover image: og:image → twitter:image → first <img> with src
    const coverImage =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      "";

    // Body text: remove scripts/styles/nav/footer, grab inner text
    $("script, style, nav, footer, header, iframe, noscript").remove();
    const mainEl = $("article").first().length
      ? $("article").first()
      : $("main").first().length
      ? $("main").first()
      : $(".content, .post-content, .article-body, .entry-content").first().length
      ? $(".content, .post-content, .article-body, .entry-content").first()
      : $("body");

    const bodyText = mainEl
      .text()
      .replace(/\s{3,}/g, "\n\n")
      .replace(/\t/g, " ")
      .trim()
      .slice(0, 4000);

    const siteName =
      $('meta[property="og:site_name"]').attr("content") ||
      new URL(url).hostname.replace(/^www\./, "");

    res.json({
      title: title.trim().slice(0, 200),
      description: description.trim().slice(0, 500),
      content: bodyText,
      coverImage: coverImage || null,
      siteName,
      sourceUrl: url,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("abort") || msg.includes("timeout")) {
      return res.status(504).json({ error: "Request timed out (12s). The target URL may be too slow or blocked." });
    }
    res.status(502).json({ error: `Fetch failed: ${msg}` });
  }
});

export default router;
