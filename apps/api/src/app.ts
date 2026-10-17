import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { timingSafeEqual, randomUUID } from "node:crypto";
import { z } from "zod";
import { and, eq, gte, sql, desc } from "drizzle-orm";
import { db } from "./db.js";
import { products, orders } from "./schema.js";
export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "32kb" }));
app.get("/api/health", (_, res) => res.json({ ok: true }));
app.get("/api/products", async (_, res) => {
  res.json(await db.select().from(products).where(eq(products.active, true)));
});
const checkout = z.object({
  customer: z.object({
    name: z.string().trim().min(1).max(60),
    phone: z.string().regex(/^1[3-9]\d{9}$/, "请填写有效的中国大陆手机号"),
    address: z.string().trim().min(5).max(300),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().max(80),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(50),
});
app.post(
  "/api/orders",
  rateLimit({
    windowMs: 60_000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
  async (req, res, next) => {
    const parsed = checkout.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    try {
      const order = await db.transaction(async (tx) => {
        const merged = new Map<string, number>();
        for (const i of parsed.data.items)
          merged.set(i.productId, (merged.get(i.productId) || 0) + i.quantity);
        const items = [];
        let merchantId = "";
        for (const [id, quantity] of [...merged].sort((a, b) =>
          a[0].localeCompare(b[0]),
        )) {
          if (quantity > 99) throw new Error("每件商品最多购买 99 件");
          const [p] = await tx
            .update(products)
            .set({ stock: sql`${products.stock} - ${quantity}` })
            .where(
              and(
                eq(products.id, id),
                eq(products.active, true),
                gte(products.stock, quantity),
              ),
            )
            .returning();
          if (!p) throw new Error("商品已下架或库存不足");
          if (merchantId && merchantId !== p.merchantId)
            throw new Error("暂不支持跨商家下单");
          merchantId = p.merchantId;
          items.push({
            productId: p.id,
            merchantId: p.merchantId,
            name: p.name,
            price: p.price,
            quantity,
          });
        }
        const [saved] = await tx
          .insert(orders)
          .values({
            id: randomUUID(),
            merchantId,
            customer: parsed.data.customer,
            items,
            total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
            status: "pending",
          })
          .returning();
        return saved;
      });
      res
        .status(201)
        .json({ id: order.id, total: order.total, status: order.status });
    } catch (error) {
      if (
        error instanceof Error &&
        [
          "每件商品最多购买 99 件",
          "商品已下架或库存不足",
          "暂不支持跨商家下单",
        ].includes(error.message)
      ) {
        res.status(409).json({ error: error.message });
        return;
      }
      next(error);
    }
  },
);
app.use("/api/admin", (req, res, next) => {
  const expected = process.env.ADMIN_TOKEN;
  const supplied = req.headers.authorization?.replace(/^Bearer /, "") || "";
  if (
    !expected ||
    Buffer.byteLength(expected) !== Buffer.byteLength(supplied) ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))
  ) {
    res.status(401).json({ error: "管理密钥无效或尚未配置" });
    return;
  }
  next();
});
app.get("/api/admin/products", async (_, res) =>
  res.json(await db.select().from(products)),
);
app.get("/api/admin/orders", async (_, res) =>
  res.json(await db.select().from(orders).orderBy(desc(orders.createdAt))),
);
const productInput = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(1000),
  category: z.enum(["餐厨器皿", "家居生活", "随身好物"]),
  price: z.number().int().min(1).max(100000000),
  stock: z.number().int().min(0).max(100000),
  image: z.string().regex(/^\/products\/[a-z]+\.svg$/),
  active: z.boolean(),
});
app.post("/api/admin/products", async (req, res) => {
  const p = productInput.safeParse(req.body);
  if (!p.success) {
    res.status(400).json({ error: "商品资料格式不正确" });
    return;
  }
  const [saved] = await db
    .insert(products)
    .values({ ...p.data, id: randomUUID(), merchantId: "default" })
    .returning();
  res.status(201).json(saved);
});
app.patch("/api/admin/products/:id", async (req, res) => {
  const p = productInput.partial().safeParse(req.body);
  if (!p.success) {
    res.status(400).json({ error: "商品资料格式不正确" });
    return;
  }
  if (!Object.keys(p.data).length) {
    res.status(400).json({ error: "没有需要更新的字段" });
    return;
  }
  const [saved] = await db
    .update(products)
    .set(p.data)
    .where(eq(products.id, req.params.id as string))
    .returning();
  if (!saved) {
    res.status(404).json({ error: "商品不存在" });
    return;
  }
  res.json(saved);
});
app.patch("/api/admin/orders/:id", async (req, res) => {
  const status = z.enum(["shipped", "completed"]).safeParse(req.body.status);
  if (!status.success) {
    res.status(400).json({ error: "订单状态无效" });
    return;
  }
  const from = status.data === "shipped" ? "pending" : "shipped";
  const [saved] = await db
    .update(orders)
    .set({ status: status.data })
    .where(and(eq(orders.id, req.params.id as string), eq(orders.status, from)))
    .returning();
  if (!saved) {
    res.status(409).json({ error: "订单不存在或状态不能转换" });
    return;
  }
  res.json(saved);
});
app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(error);
    res.status(500).json({ error: "服务暂时不可用，请稍后重试" });
  },
);
