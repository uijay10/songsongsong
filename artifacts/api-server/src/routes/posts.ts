import { Router, type IRouter } from "express";
import { db, postsTable, usersTable } from "@workspace/db";
import { eq, and, desc, sql, gte } from "drizzle-orm";

const router: IRouter = Router();

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatPost(p: typeof postsTable.$inferSelect & { authorNameLive?: string | null; authorAvatarLive?: string | null }) {
  return {
    id: p.id,
    title: p.title,
    content: p.content,
    section: p.section,
    authorWallet: p.authorWallet,
    authorName: p.authorNameLive ?? p.authorName,
    authorAvatar: p.authorAvatarLive ?? p.authorAvatar,
    authorType: p.authorType,
    likes: p.likes,
    comments: p.comments,
    kolLikePoints: p.kolLikePoints,
    kolCommentPoints: p.kolCommentPoints,
    isPinned: p.isPinned,
    pinnedUntil: p.pinnedUntil ? p.pinnedUntil.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const section = req.query.section as string | undefined;
  const authorType = req.query.authorType as string | undefined;
  const authorWallet = req.query.authorWallet as string | undefined;
  const pinnedOnly = req.query.pinned === "1" || req.query.pinned === "true";
  const page = Math.max(1, parseInt(req.query.page as string ?? "1"));
  const limit = Math.min(50, parseInt(req.query.limit as string ?? "20"));
  const offset = (page - 1) * limit;

  // Auto-expire pinned posts (pinnedUntil has passed)
  await db.update(postsTable)
    .set({ isPinned: false, pinnedUntil: null })
    .where(and(eq(postsTable.isPinned, true), sql`${postsTable.pinnedUntil} < now()`));

  const conditions = [];
  if (section) conditions.push(eq(postsTable.section, section));
  if (authorType) conditions.push(eq(postsTable.authorType, authorType));
  if (authorWallet) conditions.push(eq(postsTable.authorWallet, authorWallet.toLowerCase()));
  if (pinnedOnly) conditions.push(eq(postsTable.isPinned, true));

  const all = await db.select().from(postsTable).where(conditions.length ? and(...conditions) : undefined);
  const posts = await db.select().from(postsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(postsTable.isPinned), desc(postsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const wallets = [...new Set(posts.map(p => p.authorWallet))];
  const users = wallets.length
    ? await db.select({ wallet: usersTable.wallet, username: usersTable.username, avatar: usersTable.avatar })
        .from(usersTable).where(sql`${usersTable.wallet} = ANY(ARRAY[${sql.join(wallets.map(w => sql`${w}`), sql`, `)}]::text[])`)
    : [];
  const userMap = Object.fromEntries(users.map(u => [u.wallet, u]));

  res.json({
    posts: posts.map(p => formatPost({ ...p, authorNameLive: userMap[p.authorWallet]?.username ?? null, authorAvatarLive: userMap[p.authorWallet]?.avatar ?? null })),
    total: all.length,
    page,
    totalPages: Math.ceil(all.length / limit),
  });
});

router.post("/", async (req, res) => {
  const { title, content, section, authorWallet } = req.body;
  if (!title || !content || !section || !authorWallet) {
    return res.status(400).json({ error: "title, content, section, authorWallet required" });
  }

  const lw = authorWallet.toLowerCase();
  const users = await db.select().from(usersTable).where(eq(usersTable.wallet, lw)).limit(1);
  let user = users[0];
  if (!user) return res.status(404).json({ error: "User not found" });

  const spaceType = user.spaceType ?? "";
  const isAdmin = (user.energy ?? 0) >= 99_000_000_000_000;

  if (!isAdmin) {
    // Check energy
    if ((user.energy ?? 0) <= 0) {
      return res.status(402).json({ error: "INSUFFICIENT_ENERGY" });
    }

    // KOL 48h inactivity penalty (check before daily limit so penalty applies first)
    if (spaceType === "kol") {
      const lastPostRows = await db.select({ createdAt: postsTable.createdAt })
        .from(postsTable).where(eq(postsTable.authorWallet, lw)).orderBy(desc(postsTable.createdAt)).limit(1);
      if (lastPostRows.length > 0) {
        const hoursSinceLast = (Date.now() - new Date(lastPostRows[0].createdAt).getTime()) / 3_600_000;
        if (hoursSinceLast > 48) {
          const penalty = Math.min(user.energy ?? 0, 100);
          const penaltyEnergy = (user.energy ?? 0) - penalty;
          await db.update(usersTable).set({ energy: penaltyEnergy }).where(eq(usersTable.wallet, lw));
          user = { ...user, energy: penaltyEnergy };
          if (penaltyEnergy <= 0) {
            return res.status(402).json({ error: "INSUFFICIENT_ENERGY", penaltyApplied: penalty });
          }
        }
      }
    }

    // Daily post limit (KOL: 20, developer: 10, project: unlimited)
    const dailyLimit = spaceType === "kol" ? 20 : spaceType === "developer" ? 10 : 0;
    if (dailyLimit > 0) {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayRows = await db.select({ count: sql<number>`count(*)` })
        .from(postsTable).where(and(eq(postsTable.authorWallet, lw), gte(postsTable.createdAt, todayStart)));
      const todayCount = Number(todayRows[0]?.count ?? 0);
      if (todayCount >= dailyLimit) {
        return res.status(429).json({ error: "DAILY_LIMIT", limit: dailyLimit });
      }
    }

    // Deduct 1 energy
    await db.update(usersTable).set({ energy: (user.energy ?? 1) - 1 }).where(eq(usersTable.wallet, lw));
  }

  const inserted = await db.insert(postsTable).values({
    title,
    content,
    section,
    authorWallet: lw,
    authorName: user?.username ?? null,
    authorAvatar: user?.avatar ?? null,
    authorType: user?.spaceType ?? null,
    likes: 0,
    comments: 0,
    kolLikePoints: 0,
    kolCommentPoints: 0,
    isPinned: false,
  }).returning();

  res.status(201).json(formatPost({
    ...inserted[0],
    authorNameLive: user?.username ?? null,
    authorAvatarLive: user?.avatar ?? null,
  }));
});

router.post("/:id/like", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const { wallet } = req.body;

  const posts = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (posts.length === 0) return res.status(404).json({ error: "Post not found" });
  const post = posts[0];

  const updated = await db.update(postsTable)
    .set({ likes: post.likes + 1 })
    .where(eq(postsTable.id, id))
    .returning();

  if (wallet) {
    const lw = wallet.toLowerCase();
    const today = todayStr();
    const userRows = await db.select().from(usersTable).where(eq(usersTable.wallet, lw)).limit(1);
    const user = userRows[0];

    if (user) {
      const isToday = user.lastInteractionDate === today;
      const currentLikes = isToday ? (user.dailyLikeCount ?? 0) : 0;
      const MAX_DAILY = 5;
      const PTS_PER_LIKE = 100;

      if (currentLikes < MAX_DAILY) {
        await db.update(usersTable).set({
          points: (user.points ?? 0) + PTS_PER_LIKE,
          dailyLikeCount: currentLikes + 1,
          lastInteractionDate: today,
        }).where(eq(usersTable.wallet, lw));
      } else {
        if (!isToday) {
          await db.update(usersTable).set({ dailyLikeCount: 0, lastInteractionDate: today }).where(eq(usersTable.wallet, lw));
        }
      }

      if (post.authorType === "kol") {
        const MAX_KOL_POINTS = 10000;
        const KOL_PTS = 10;
        const currentKol = post.kolLikePoints ?? 0;
        const canAdd = Math.min(KOL_PTS, MAX_KOL_POINTS - currentKol);
        if (canAdd > 0) {
          await db.update(postsTable).set({ kolLikePoints: currentKol + canAdd }).where(eq(postsTable.id, id));
          const kolRows = await db.select().from(usersTable).where(eq(usersTable.wallet, post.authorWallet)).limit(1);
          const kol = kolRows[0];
          if (kol) {
            await db.update(usersTable).set({ points: (kol.points ?? 0) + canAdd }).where(eq(usersTable.wallet, post.authorWallet));
          }
        }
      }
    }
  }

  res.json({ likes: updated[0].likes });
});

router.post("/:id/comment", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const { wallet, content } = req.body;
  if (!content) return res.status(400).json({ error: "content required" });

  const posts = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (posts.length === 0) return res.status(404).json({ error: "Post not found" });
  const post = posts[0];

  const updated = await db.update(postsTable)
    .set({ comments: post.comments + 1 })
    .where(eq(postsTable.id, id))
    .returning();

  if (wallet) {
    const lw = wallet.toLowerCase();
    const today = todayStr();
    const userRows = await db.select().from(usersTable).where(eq(usersTable.wallet, lw)).limit(1);
    const user = userRows[0];

    if (user) {
      const isToday = user.lastInteractionDate === today;
      const currentComments = isToday ? (user.dailyCommentCount ?? 0) : 0;
      const MAX_DAILY = 5;
      const PTS_PER_COMMENT = 100;

      if (currentComments < MAX_DAILY) {
        await db.update(usersTable).set({
          points: (user.points ?? 0) + PTS_PER_COMMENT,
          dailyCommentCount: currentComments + 1,
          lastInteractionDate: today,
        }).where(eq(usersTable.wallet, lw));
      } else {
        if (!isToday) {
          await db.update(usersTable).set({ dailyCommentCount: 0, lastInteractionDate: today }).where(eq(usersTable.wallet, lw));
        }
      }

      if (post.authorType === "kol") {
        const MAX_KOL_POINTS = 10000;
        const KOL_PTS = 10;
        const currentKol = post.kolCommentPoints ?? 0;
        const canAdd = Math.min(KOL_PTS, MAX_KOL_POINTS - currentKol);
        if (canAdd > 0) {
          await db.update(postsTable).set({ kolCommentPoints: currentKol + canAdd }).where(eq(postsTable.id, id));
          const kolRows = await db.select().from(usersTable).where(eq(usersTable.wallet, post.authorWallet)).limit(1);
          const kol = kolRows[0];
          if (kol) {
            await db.update(usersTable).set({ points: (kol.points ?? 0) + canAdd }).where(eq(usersTable.wallet, post.authorWallet));
          }
        }
      }
    }
  }

  res.json({ comments: updated[0].comments, content });
});

router.post("/:id/pin", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const { wallet, hours } = req.body;
  if (!wallet) return res.status(400).json({ error: "wallet required" });

  const lw = wallet.toLowerCase();
  const userRows = await db.select().from(usersTable).where(eq(usersTable.wallet, lw)).limit(1);
  const user = userRows[0];
  if (!user) return res.status(404).json({ error: "User not found" });
  if ((user.pinCount ?? 0) <= 0) return res.status(403).json({ error: "No pin credits" });

  const pinnedUntil = new Date(Date.now() + 72 * 3600_000);
  await db.update(postsTable).set({ isPinned: true, pinnedUntil }).where(eq(postsTable.id, id));
  await db.update(usersTable).set({ pinCount: (user.pinCount ?? 0) - 1 }).where(eq(usersTable.wallet, lw));

  res.json({ ok: true, pinnedUntil: pinnedUntil.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const { wallet } = req.body;
  if (!wallet) return res.status(400).json({ error: "wallet required" });

  const lw = wallet.toLowerCase();
  const posts = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (!posts.length) return res.status(404).json({ error: "Post not found" });

  const ADMIN_WALLETS = new Set([
    "0xbe4548c1458be01838f1faafd69d335f0567399a","0x65fc40db57e872720294b7acbb2cdd88ca401929",
    "0xf9ba6e907e252de62d563db41bcdea7a37ea03c6","0xc1a420c0ac06d16dfb17c5ebd61caecd93840afd",
    "0x246104d684b52e87c3e1e5b1cfbd274451e421bc","0xd9520bd2592529fa5bd34643c57c08bdc0c9a6b0",
    "0xf3c14704107b4fee7384fa1bfba9a82975a3c12c","0xf49a301350a2665e9150e8d9b2686a25a39ffecf",
    "0x8ce881fd733879e419e7d78248c4e41f48c5b3b2","0x46cfbb9407eddf3954ca027bd7ac802402b61b95",
    "0x5de63ba702c04906d368f6c17fc78acff06094fe","0x8818aa3fbc1c2963651bc604554f7f4725a51704",
    "0x4b0b18f3f51d860b46d05229591e450a6a4850f9","0x394cf5ff2a1bffff5e475ff2ab6566a63a8258d10",
    "0xa0adb22151b7555c2d9c178e6da0e975d65b6013",
  ]);

  if (posts[0].authorWallet !== lw && !ADMIN_WALLETS.has(lw)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await db.delete(postsTable).where(eq(postsTable.id, id));
  res.json({ ok: true });
});

export default router;
