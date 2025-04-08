import { z } from 'zod';
import { pgTable, serial, text, timestamp, integer, date } from 'drizzle-orm/pg-core';

export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  userType: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Product description is required"),
  price: z.number().min(0, "Price must be a positive number"),
  imageUrl: z.string().url("Invalid image URL"),
  category: z.string().min(1, "Category is required"),
  status: z.string().min(1).default("active"),
  currentBid: z.number().nullable().default(null),
  biddingEndTime: z.date().nullable().default(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  userId: z.number()
});

export const insertPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  userId: z.number(),
  videoUrl: z.string().nullable().optional()
});

export const insertBidSchema = z.object({
  amount: z.number(),
  productId: z.number()
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: integer('price').notNull(),
  imageUrl: text('image_url').notNull(),
  category: text('category').notNull(),
  status: text('status').notNull().default('active'),
  currentBid: integer('current_bid'),
  biddingEndTime: date('bidding_end_time'),
  userId: integer('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}); 