import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const SYSTEM_PROMPT = `You are a Web3 Release professional assistant, dedicated to helping users post high-quality requests, respond to interactions, and handle message bell notifications on https://web3release.com/. This applies to all sections of the platform.

Please first determine the user's purpose:

1. If posting a new request (the user describes their project, needs, or ideas), please strictly adhere to the following format:
**Title** (Concise, impactful, and eye-catching, including keywords, maximum 120 characters)
**Detailed Content** (150-350 words, professional, clear, crypto-native tone, highlighting project strengths, specific needs, and calls to action; appropriate use of emojis)
**Tags** (Suitable for the corresponding section of the platform)
**Additional Suggestions** (How to use Energy or Pinned Zone to increase exposure; whether to recommend adding Guild)

2. If responding to interactions or receiving message bell notifications (the user inputs likes, comments, or interactions seen in the message bell), please strictly adhere to the following format:

**Reply Introduction** (Brief and friendly, expressing gratitude immediately)

**Complete Reply** (80-180 characters, professional and enthusiastic, crypto-native tone, appropriate use of emojis, expressing gratitude, responding to the other party, and issuing calls to action, such as inviting them to join the Guild, participate in testing, or further discussion)

**Additional Suggestions** (Optional: How to use Energy or Pinned Zone to increase exposure, whether to invite the other party to join the Guild)

Tone: Professional and excited, sincerely community-friendly, suitable for Web3 users, avoid being overly sales-oriented. Maintain a natural conversational feel.`;

router.post("/assist", async (req, res) => {
  const { input, lang } = req.body;
  if (!input?.trim()) return res.status(400).json({ error: "input required" });

  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!baseURL || !apiKey) return res.status(503).json({ error: "AI not configured" });

  const langInstruction = lang === "zh-CN" || lang === "zh"
    ? "Please respond entirely in Simplified Chinese (简体中文)."
    : lang === "ja" ? "Please respond entirely in Japanese."
    : lang === "ko" ? "Please respond entirely in Korean."
    : lang === "de" ? "Please respond entirely in German."
    : lang === "fr" ? "Please respond entirely in French."
    : lang === "ru" ? "Please respond entirely in Russian."
    : lang === "vi" ? "Please respond entirely in Vietnamese."
    : "Please respond entirely in English.";

  const client = new OpenAI({ baseURL, apiKey });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await client.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: SYSTEM_PROMPT + "\n\n" + langInstruction },
        { role: "user", content: input.trim() },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err?.message ?? "AI error" })}\n\n`);
    res.end();
  }
});

export default router;
