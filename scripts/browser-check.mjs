import { mkdir } from 'node:fs/promises';
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:3000");
await page
  .getByRole("button", { name: "查看日常 · 陶瓷马克杯", exact: true })
  .waitFor();
await page.screenshot({ path: "artifacts/store-desktop.png", fullPage: true });
await page
  .getByRole("button", { name: "查看日常 · 陶瓷马克杯", exact: true })
  .click();
await page
  .getByRole("dialog")
  .getByRole("button", { name: "加入购物袋", exact: true })
  .click();
await page.keyboard.press("Escape");
await page
  .getByRole("button", { name: "购物袋，1件商品", exact: true })
  .click();
await page.getByRole("button", { name: "去结算" }).click();
await page
  .getByRole("textbox", { name: "收货人", exact: true })
  .fill("演示用户");
await page.getByRole("textbox", { name: "手机号码" }).fill("13800000000");
await page
  .getByRole("textbox", { name: "收货地址" })
  .fill("测试省测试市测试路 1 号");
await page.getByRole("button", { name: "提交模拟订单" }).click();
await page.getByRole("heading", { name: "订单已创建" }).waitFor();
assert.match(await page.getByRole("dialog").innerText(), /¥89.00/);
await page.getByRole("button", { name: "继续逛逛" }).click();
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "artifacts/store-mobile.png", fullPage: true });
assert.ok(
  await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  ),
  "mobile horizontal overflow",
);
await page.getByRole("textbox", { name: "搜索商品" }).fill("小夜灯");
assert.equal(await page.locator(".product").count(), 1);
await page.goto("http://localhost:3000/admin");
await page.getByRole("textbox", { name: "管理密钥" }).fill("wrong-token");
await page.getByRole("button", { name: "进入管理后台" }).click();
await page.getByRole("alert").waitFor();
assert.equal(errors.length, 0, errors.join("\n"));
console.log(
  "Browser passed: product detail, cart, checkout, mobile layout, search, admin access rejection.",
);
await browser.close();
