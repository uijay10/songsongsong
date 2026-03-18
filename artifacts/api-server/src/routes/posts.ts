import { Router, type IRouter } from "express";
import { db, postsTable, usersTable, projectsTable } from "@workspace/db";
import { eq, and, desc, ilike } from "drizzle-orm";

const router: IRouter = Router();

function formatPost(p: typeof postsTable.$inferSelect) {
  return {
    id: p.id,
    title: p.title,
    content: p.content,
    section: p.section,
    authorWallet: p.authorWallet,
    authorName: p.authorName,
    authorAvatar: p.authorAvatar,
    authorType: p.authorType,
    likes: p.likes,
    comments: p.comments,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const section = req.query.section as string | undefined;
  const authorType = req.query.authorType as string | undefined;
  const page = Math.max(1, parseInt(req.query.page as string ?? "1"));
  const limit = Math.min(50, parseInt(req.query.limit as string ?? "20"));
  const offset = (page - 1) * limit;

  const conditions = [];
  if (section) conditions.push(eq(postsTable.section, section));
  if (authorType) conditions.push(eq(postsTable.authorType, authorType));

  const all = await db.select().from(postsTable).where(conditions.length ? and(...conditions) : undefined);
  const posts = await db.select().from(postsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(postsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({
    posts: posts.map(formatPost),
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
  }).returning();

  await db.update(projectsTable)
    .set({ latestPostTitle: title, latestPostAt: new Date() })
    .where(eq(projectsTable.ownerWallet, lw));

  res.status(201).json(formatPost(inserted[0]));
});

router.post("/:id/like", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const posts = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (posts.length === 0) return res.status(404).json({ error: "Post not found" });

  const updated = await db.update(postsTable)
    .set({ likes: posts[0].likes + 1 })
    .where(eq(postsTable.id, id))
    .returning();

  res.json({ likes: updated[0].likes });
});

export default router;
