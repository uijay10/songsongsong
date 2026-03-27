import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const commentsTable = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  wallet: text("wallet").notNull(),
  authorName: text("author_name"),
  authorAvatar: text("author_avatar"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Comment = typeof commentsTable.$inferSelect;
