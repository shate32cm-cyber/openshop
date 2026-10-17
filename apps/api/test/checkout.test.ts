import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import type { Server } from "node:http";
let server: Server,
  base: string,
  dir: string,
  db: typeof import("../src/db.js");
before(async () => {
  dir = await mkdtemp(`${tmpdir()}/mall-test-`);
  process.env.DATA_DIR = dir;
  delete process.env.DATABASE_URL;
  process.env.ADMIN_TOKEN = "test-only-token";
  db = await import("../src/db.js");
  await db.initialize();
  await (await import("../src/seed.js")).seed();
  const { app } = await import("../src/app.js");
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
after(async () => {
  await new Promise<void>((r, j) => server.close((e) => (e ? j(e) : r())));
  await db.embedded?.close();
  await rm(dir, { recursive: true, force: true });
});
const customer = {
  name: "测试用户",
  phone: "13800000000",
  address: "测试省测试市测试路 1 号",
};
async function order(items: unknown) {
  return fetch(base + "/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customer, items, total: 1 }),
  });
}
test("server prices, stock decrement and immutable order snapshot", async () => {
  const r = await order([{ productId: "p1", quantity: 2 }]);
  assert.equal(r.status, 201);
  const data = await r.json();
  assert.equal(data.total, 17800);
  const products = await (await fetch(base + "/api/products")).json();
  assert.equal(products.find((p: { id: string }) => p.id === "p1").stock, 40);
  const list = await (
    await fetch(base + "/api/admin/orders", {
      headers: { Authorization: "Bearer test-only-token" },
    })
  ).json();
  assert.equal(list[0].items[0].price, 8900);
  assert.equal(list[0].id, data.id);
});
test("invalid quantity and customer rejected", async () => {
  assert.equal((await order([{ productId: "p1", quantity: -1 }])).status, 400);
  assert.equal(
    (
      await fetch(base + "/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { ...customer, phone: "invalid" },
          items: [{ productId: "p1", quantity: 1 }],
        }),
      })
    ).status,
    400,
  );
});
test("insufficient stock rolls back all products", async () => {
  const r = await order([
    { productId: "p1", quantity: 1 },
    { productId: "p2", quantity: 99 },
  ]);
  assert.equal(r.status, 409);
  const products = await (await fetch(base + "/api/products")).json();
  assert.equal(products.find((p: { id: string }) => p.id === "p1").stock, 40);
});
test("admin requires authentication", async () => {
  assert.equal((await fetch(base + "/api/admin/orders")).status, 401);
});
test("concurrent orders cannot oversell", async () => {
  const results = await Promise.all([
    order([{ productId: "p2", quantity: 12 }]),
    order([{ productId: "p2", quantity: 12 }]),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  const products = await (await fetch(base + "/api/products")).json();
  assert.equal(products.find((p: { id: string }) => p.id === "p2").stock, 6);
});
test("duplicates are merged and limited", async () => {
  assert.equal(
    (
      await order([
        { productId: "p3", quantity: 60 },
        { productId: "p3", quantity: 60 },
      ])
    ).status,
    409,
  );
});
test("order status follows allowed transitions", async () => {
  const list = await (
    await fetch(base + "/api/admin/orders", {
      headers: { Authorization: "Bearer test-only-token" },
    })
  ).json();
  const id = list[0].id;
  const patch = (status: string) =>
    fetch(base + `/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: "Bearer test-only-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
  assert.equal((await patch("completed")).status, 409);
  assert.equal((await patch("shipped")).status, 200);
  assert.equal((await patch("completed")).status, 200);
  assert.equal((await patch("shipped")).status, 409);
});
