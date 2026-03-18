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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
