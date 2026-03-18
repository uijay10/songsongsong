import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

const router: IRouter = Router();

function generateInviteCode(): string {
  return randomBytes(5).toString("hex").toUpperCase();
}

router.get("/me", async (req, res) => {
  const wallet = req.query.wallet as string;
  if (!wallet) return res.status(400).json({ error: "wallet required" });

  const users = await db.select().from(usersTable).where(eq(usersTable.wallet, wallet.toLowerCase())).limit(1);
  if (users.length === 0) return res.status(404).json({ error: "User not found" });

  const u = users[0];
  res.json({
    id: u.id,
    wallet: u.wallet,
    username: u.username,
    avatar: u.avatar,
    points: u.points,
    energy: u.energy,
    spaceStatus: u.spaceStatus,
    spaceType: u.spaceType,
    inviteCode: u.inviteCode,
    inviteCount: u.inviteCount,
    lastCheckin: u.lastCheckin?.toISOString() ?? null,
    twitter: u.twitter,
    telegram: u.telegram,
    discord: u.discord,
    language: u.language,
    createdAt: u.createdAt.toISOString(),
  });
});

router.post("/upsert", async (req, res) => {
  const { wallet, username, avatar, twitter, telegram, discord, language } = req.body;
  if (!wallet) return res.status(400).json({ error: "wallet required" });

  const lw = wallet.toLowerCase();
  const existing = await db.select().from(usersTable).where(eq(usersTable.wallet, lw)).limit(1);

  if (existing.length === 0) {
    const inviteCode = generateInviteCode();
    const inserted = await db.insert(usersTable).values({
      wallet: lw,
      username: username ?? null,
      avatar: avatar ?? null,
      points: 0,
      energy: 0,
      inviteCode,
      inviteCount: 0,
      twitter: twitter ?? null,
      telegram: telegram ?? null,
      discord: discord ?? null,
      language: language ?? "en",
    }).returning();
    const u = inserted[0];
    return res.json({
      id: u.id,
      wallet: u.wallet,
      username: u.username,
      avatar: u.avatar,
      points: u.points,
      energy: u.energy,
      spaceStatus: u.spaceStatus,
      spaceType: u.spaceType,
      inviteCode: u.inviteCode,
      inviteCount: u.inviteCount,
      lastCheckin: u.lastCheckin?.toISOString() ?? null,
      twitter: u.twitter,
      telegram: u.telegram,
      discord: u.discord,
      language: u.language,
      createdAt: u.createdAt.toISOString(),
    });
  }

  const updateData: Record<string, unknown> = {};
  if (username !== undefined) updateData.username = username;
  if (avatar !== undefined) updateData.avatar = avatar;
  if (twitter !== undefined) updateData.twitter = twitter;
  if (telegram !== undefined) updateData.telegram = telegram;
  if (discord !== undefined) updateData.discord = discord;
  if (language !== undefined) updateData.language = language;

  const updated = Object.keys(updateData).length > 0
    ? await db.update(usersTable).set(updateData).where(eq(usersTable.wallet, lw)).returning()
    : existing;

  const u = updated[0];
  res.json({
    id: u.id,
    wallet: u.wallet,
    username: u.username,
    avatar: u.avatar,
    points: u.points,
    energy: u.energy,
    spaceStatus: u.spaceStatus,
    spaceType: u.spaceType,
    inviteCode: u.inviteCode,
    inviteCount: u.inviteCount,
    lastCheckin: u.lastCheckin?.toISOString() ?? null,
    twitter: u.twitter,
    telegram: u.telegram,
    discord: u.discord,
    language: u.language,
    createdAt: u.createdAt.toISOString(),
  });
});

router.post("/checkin", async (req, res) => {
  const { wallet } = req.body;
  if (!wallet) return res.status(400).json({ error: "wallet required" });

  const lw = wallet.toLowerCase();
  const users = await db.select().from(usersTable).where(eq(usersTable.wallet, lw)).limit(1);
  if (users.length === 0) return res.status(404).json({ error: "User not found" });

  const u = users[0];
  const now = new Date();
  const last = u.lastCheckin;

  if (last) {
    const diff = now.getTime() - last.getTime();
    if (diff < 24 * 60 * 60 * 1000) {
      const next = new Date(last.getTime() + 24 * 60 * 60 * 1000);
      return res.json({ success: false, points: u.points, nextCheckin: next.toISOString(), message: "Already checked in today" });
    }
  }

  const updated = await db.update(usersTable)
    .set({ points: u.points + 1000, lastCheckin: now })
    .where(eq(usersTable.wallet, lw))
    .returning();

  const nextCheckin = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  res.json({ success: true, points: updated[0].points, nextCheckin: nextCheckin.toISOString(), message: "+1000 points!" });
});

export default router;
