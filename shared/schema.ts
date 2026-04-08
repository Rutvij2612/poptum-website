import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email").unique(),
  phone: text("phone"),
  username: text("username").notNull().unique(),
  password: text("password_hash").notNull(),
  role: text("role").notNull().default("user"), // user or admin
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  username: true,
  password: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const ORDER_STATUSES = [
  "Ordered",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: text("order_id").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  language: varchar("language", { length: 5 }).notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: numeric("tax", { precision: 10, scale: 2 }).notNull(),
  delivery: numeric("delivery", { precision: 10, scale: 2 }).notNull(),
  shipping: numeric("shipping", { precision: 10, scale: 2 }).notNull(),
  grandTotal: numeric("grand_total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("Ordered"),
  issueNote: text("issue_note"),
});

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
});

export const siteRatings = pgTable("site_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rating: integer("rating").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});
