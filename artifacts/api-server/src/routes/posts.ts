import { Router, type IRouter } from "express";
import { db, postsTable, usersTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";

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
  const page = Math.max(1, parseInt(req.query.page as string ?? "1"));
  const limit = Math.min(50, parseInt(req.query.limit as string ?? "20"));
  const offset = (page - 1) * limit;

  const conditions = [];
  if (section) conditions.push(eq(postsTable.section, section));
  if (authorType) conditions.push(eq(postsTable.authorType, authorType));
  if (authorWallet) conditions.push(eq(postsTable.authorWallet, authorWallet.toLowerCase()));

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
  const user = users[0];

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

  res.status(201).json(formatPost(inserted[0]));
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

  const pinnedUntil = new Date(Date.now() + (hours ?? 24) * 3600_000);
  await db.update(postsTable).set({ isPinned: true, pinnedUntil }).where(eq(postsTable.id, id));
  await db.update(usersTable).set({ pinCount: (user.pinCount ?? 0) - 1 }).where(eq(usersTable.wallet, lw));

  res.json({ ok: true, pinnedUntil: pinnedUntil.toISOString() });
});

export default router;
