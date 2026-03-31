import { Router, type IRouter } from "express";
import { db, postsTable } from "@workspace/db";
import { requireAdmin } from "../lib/admin-check";
import { extractEvents, type ExtractedEvent } from "../lib/ai-extractor";

const router: IRouter = Router();

const AI_SYSTEM_WALLET = "ai-system";
const AI_SYSTEM_NAME = "AI精选";
const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

router.post("/extract", requireAdmin, async (req, res) => {
  try {
    const { url } = req.body as { url?: string };
    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      res.status(400).json({ error: "url is required and must start with http" });
      return;
    }
    const events = await extractEvents(url);
    res.json({ events, total: events.length });
  } catch (e: any) {
    console.error("[ai/extract] error:", e);
    res.status(500).json({ error: e?.message ?? String(e) });
  }
});

router.post("/publish", requireAdmin, async (req, res) => {
  try {
    const { events } = req.body as { events?: ExtractedEvent[] };
    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({ error: "events array is required" });
      return;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + SIXTY_DAYS_MS);

    const inserted: number[] = [];
    for (const ev of events) {
      if (!ev?.title || !ev?.section) continue;
      const rows = await db.insert(postsTable).values({
        title: ev.title.slice(0, 200),
        content: ev.description?.slice(0, 2000) ?? "",
        section: ev.section,
        authorWallet: AI_SYSTEM_WALLET,
        authorName: ev.project_name?.slice(0, 100) || AI_SYSTEM_NAME,
        authorType: "ai",
        sourceUrl: ev.source_url ?? null,
        aiConfidence: typeof ev.ai_confidence === "number" ? ev.ai_confidence : null,
        importance: ev.importance ?? null,
        eventStartTime: ev.start_time ? new Date(ev.start_time) : null,
        eventEndTime: ev.end_time ? new Date(ev.end_time) : null,
        expiresAt,
        views: 0,
        likes: 0,
        comments: 0,
        kolLikePoints: 0,
        kolCommentPoints: 0,
        isPinned: false,
        pinQueued: false,
      }).returning({ id: postsTable.id });
      if (rows[0]?.id) inserted.push(rows[0].id);
    }

    res.json({ success: true, inserted: inserted.length, ids: inserted });
  } catch (e: any) {
    console.error("[ai/publish] error:", e);
    res.status(500).json({ error: e?.message ?? String(e) });
  }
});

export default router;
