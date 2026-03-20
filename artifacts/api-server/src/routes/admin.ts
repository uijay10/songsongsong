import { Router, type IRouter } from "express";
import { db, usersTable, spaceApplicationsTable, postsTable } from "@workspace/db";
import { eq, desc, asc, sql, and, gte, lte } from "drizzle-orm";

const router: IRouter = Router();

const ADMIN_WALLETS = new Set([
  "0xbe4548c1458be01838f1faafd69d335f0567399a",
  "0x65fc40db57e872720294b7acbb2cdd88ca401929",
  "0xf9ba6e907e252de62d563db41bcdea7a37ea03c6",
  "0xc1a420c0ac06d16dfb17c5ebd61caecd93840afd",
  "0x246104d684b52e87c3e1e5b1cfbd274451e421bc",
  "0xd9520bd2592529fa5bd34643c57c08bdc0c9a6b0",
  "0xf3c14704107b4fee7384fa1bfba9a82975a3c12c",
  "0xf49a301350a2665e9150e8d9b2686a25a39ffecf",
  "0x8ce881fd733879e419e7d78248c4e41f48c5b3b2",
  "0x46cfbb9407eddf3954ca027bd7ac802402b61b95",
  "0x5de63ba702c04906d368f6c17fc78acff06094fe",
  "0x8818aa3fbc1c2963651bc604554f7f4725a51704",
  "0x4b0b18f3f51d860b46d05229591e450a6a4850f9",
  "0x394cf5ff2a1bffff5e475ff2ab6566a63a8258d10",
  "0xa0adb22151b7555c2d9c178e6da0e975d65b6013",
]);

function requireAdmin(req: any, res: any, next: any) {
  const wallet = (req.query.adminWallet ?? req.body?.adminWallet ?? "") as string;
  if (!wallet || !ADMIN_WALLETS.has(wallet.toLowerCase())) {
    return res.status(403).json({ error: "Forbidden: admin only" });
  }
  next();
}

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
    const energyGrant = approvedType === "project" ? 50 : 1000;
    const pinGrant = approvedType === "project" ? 3 : 0;
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
    const app = await db.select().from(spaceApplicationsTable).where(eq(spaceApplicationsTable.id, id)).limit(1);
    await db.update(spaceApplicationsTable).set({ status: "rejected" }).where(eq(spaceApplicationsTable.id, id));
    if (app.length) {
      await db.update(usersTable)
        .set({ spaceStatus: "rejected", spaceRejectedAt: new Date() } as any)
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
          const bEnergyGrant = batchType === "project" ? 50 : 1000;
          const bPinGrant = batchType === "project" ? 3 : 0;
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
    const users = await db.select({
      wallet: usersTable.wallet,
      username: usersTable.username,
      points: usersTable.points,
      energy: usersTable.energy,
      pinCount: usersTable.pinCount,
      createdAt: usersTable.createdAt,
    }).from(usersTable).orderBy(desc(usersTable.points));

    const fmt = (v: unknown) => (v == null ? "" : String(v));
    const csv = [
      ["Wallet","Username","Points","Energy","PinCount","Joined"].join(","),
      ...users.map(u => [
        fmt(u.wallet), fmt(u.username), fmt(u.points), fmt(u.energy), fmt(u.pinCount), fmt(u.createdAt)
      ].join(","))
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=points-summary.csv");
    res.send(csv);
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

export default router;
