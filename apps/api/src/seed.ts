import { db, initialize } from "./db.js";
import { merchants, products } from "./schema.js";
import { catalog } from "./catalog.js";
export async function seed() {
  await db
    .insert(merchants)
    .values({ id: "default", name: "日常好物" })
    .onConflictDoNothing();
  await db.insert(products).values(catalog).onConflictDoNothing();
}
if (process.argv[1]?.endsWith("seed.ts")) {
  await initialize();
  await seed();
  console.log("商品初始化完成");
  process.exit(0);
}
