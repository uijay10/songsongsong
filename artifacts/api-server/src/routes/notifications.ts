import { Router, type IRouter } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const wallet = (req.query.wallet as string | undefined)?.toLowerCase();
  if (!wallet) return res.status(400).json({ error: "wallet required" });
  const rows = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.recipientWallet, wallet))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  const unread = rows.filter(r => !r.isRead).length;
  res.json({ notifications: rows, unread });
});

router.post("/mark-read", async (req, res) => {
  const { wallet } = req.body;
  if (!wallet) return res.status(400).json({ error: "wallet required" });
  const lw = wallet.toLowerCase();
  await db.update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.recipientWallet, lw), eq(notificationsTable.isRead, false)));
  res.json({ ok: true });
});

export default router;
