import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  userType: text("user_type").notNull(), // 'farmer' or 'consumer'
  name: text("name").notNull(),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow()
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  userId: integer("user_id").notNull(),
  images: text("images").array().notNull(),
  status: text("status").notNull(), // 'active', 'sold'
  createdAt: timestamp("created_at").defaultNow(),
  currentBid: integer("current_bid"),
  biddingEndTime: timestamp("bidding_end_time")
});

export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull(),
  videoUrl: text("video_url"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  userType: true,
  name: true,
  location: true
});

export const insertProductSchema = createInsertSchema(products).pick({
  title: true,
  description: true,
  price: true,
  images: true,
  currentBid: true,
  biddingEndTime: true
});

export const insertBidSchema = createInsertSchema(bids).pick({
  amount: true
});

export const insertPostSchema = createInsertSchema(posts).pick({
  title: true,
  content: true,
  videoUrl: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Bid = typeof bids.$inferSelect;
export type Post = typeof posts.$inferSelect;