import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  wallet: text("wallet").notNull().unique(),
  username: text("username"),
  avatar: text("avatar"),
  points: integer("points").notNull().default(0),
  energy: integer("energy").notNull().default(0),
  spaceStatus: text("space_status"),
  spaceType: text("space_type"),
  inviteCode: text("invite_code"),
  inviteCount: integer("invite_count").notNull().default(0),
  lastCheckin: timestamp("last_checkin"),
  twitter: text("twitter"),
  telegram: text("telegram"),
  discord: text("discord"),
  language: text("language").default("en"),
  isBanned: boolean("is_banned").notNull().default(false),
  pinCount: integer("pin_count").notNull().default(0),
  website: text("website"),
  spaceRejectedAt: timestamp("space_rejected_at"),
  invitedBy: text("invited_by"),
  dailyLikeCount: integer("daily_like_count").notNull().default(0),
  dailyCommentCount: integer("daily_comment_count").notNull().default(0),
  lastInteractionDate: text("last_interaction_date"),
  tokens: integer("tokens").notNull().default(0),
  lastSlotPull: timestamp("last_slot_pull"),
  dailyTokensEarned: integer("daily_tokens_earned").notNull().default(0),
  lastTokenDate: text("last_token_date"),
  lastPostAt: timestamp("last_post_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
