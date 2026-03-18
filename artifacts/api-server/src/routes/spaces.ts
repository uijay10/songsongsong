import { Router, type IRouter } from "express";
import { db, spaceApplicationsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/apply", async (req, res) => {
  const { wallet, type, twitter, tweetLink, projectName, projectTwitter, docsLink, github, linkedin } = req.body;
  if (!wallet || !type) return res.status(400).json({ error: "wallet and type required" });

  const lw = wallet.toLowerCase();

  await db.insert(spaceApplicationsTable).values({
    wallet: lw,
    type,
    twitter: twitter ?? null,
    tweetLink: tweetLink ?? null,
    projectName: projectName ?? null,
    projectTwitter: projectTwitter ?? null,
    docsLink: docsLink ?? null,
    github: github ?? null,
    linkedin: linkedin ?? null,
    status: "pending",
  });

  await db.update(usersTable)
    .set({ spaceStatus: "pending" })
    .where(eq(usersTable.wallet, lw));

  res.json({ message: "Application submitted. Review will be completed within 24 hours." });
});

export default router;
