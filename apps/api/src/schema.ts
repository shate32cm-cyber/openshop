import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
export const merchants = pgTable("merchants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});
export const products = pgTable("products", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  price: integer("price").notNull(),
  stock: integer("stock").notNull(),
  image: text("image").notNull(),
  active: boolean("active").notNull().default(true),
});
export type OrderItem = {
  productId: string;
  merchantId: string;
  name: string;
  price: number;
  quantity: number;
};
export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id),
  customer: jsonb("customer")
    .$type<{ name: string; phone: string; address: string }>()
    .notNull(),
  items: jsonb("items").$type<OrderItem[]>().notNull(),
  total: integer("total").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
