"use client";
import { useState } from "react";
import Link from "next/link";
import { useDialogFocus } from "../use-dialog-focus";
import { X, Plus, ArrowLeft } from "lucide-react";
type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  active: boolean;
};
type Order = {
  id: string;
  customer: { name: string; phone: string; address: string };
  items: { name: string; quantity: number }[];
  total: number;
  status: string;
  createdAt: string;
};
const money = (n: number) => `¥${(n / 100).toFixed(2)}`;
export default function Admin() {
  const [token, setToken] = useState(""),
    [authorized, setAuthorized] = useState(false),
    [tab, setTab] = useState("products"),
    [products, setProducts] = useState<Product[]>([]),
    [orders, setOrders] = useState<Order[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState<Partial<Product> | null>(null);
  useDialogFocus(Boolean(editing));
  async function request(path: string, method = "GET", body?: unknown) {
    const r = await fetch("/api/admin/" + path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await r.json();
    if (!r.ok) throw Error(data.error || "操作失败");
    return data;
  }
  async function refresh() {
    const [p, o] = await Promise.all([request("products"), request("orders")]);
    setProducts(p);
    setOrders(o);
  }
  async function act(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const price = Number(form.get("price"));
    await act(async () => {
      await request(
        editing?.id ? `products/${editing.id}` : "products",
        editing?.id ? "PATCH" : "POST",
        {
          name: form.get("name"),
          description: form.get("description"),
          category: form.get("category"),
          price: Math.round(price * 100),
          stock: Number(form.get("stock")),
          image: form.get("image"),
          active: form.get("active") === "on",
        },
      );
      await refresh();
      setEditing(null);
    });
  }
  if (!authorized)
    return (
      <main className="admin">
        <Link href="/">← 返回商城</Link>
        <form
          className="admin-login"
          onSubmit={(e) => {
            e.preventDefault();
            void act(async () => {
              await refresh();
              setAuthorized(true);
            });
          }}
        >
          <p className="eyebrow">EVERYDAY / 管理后台</p>
          <h1>欢迎回来。</h1>
          <p className="muted">
            输入服务器配置的 ADMIN_TOKEN。密钥只在当前页面内存中保存。
          </p>
          <input
            aria-label="管理密钥"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            placeholder="管理密钥"
          />
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primary wide" disabled={busy}>
            {busy ? "验证中…" : "进入管理后台"}
          </button>
        </form>
      </main>
    );
  return (
    <main className="admin">
      <div className="admin-head">
        <div>
          <p className="eyebrow">EVERYDAY / WORKSPACE</p>
          <h1>商城管理</h1>
          <p>管理日常好物，照顾每一份订单。</p>
        </div>
        <Link href="/">
          <ArrowLeft size={14} /> 返回商城
        </Link>
        <button
          onClick={() => {
            setToken("");
            setAuthorized(false);
            setProducts([]);
            setOrders([]);
          }}
        >
          退出
        </button>
      </div>
      <div className="admin-nav">
        <button
          className={tab === "products" ? "selected" : ""}
          onClick={() => setTab("products")}
        >
          商品 · {products.length}
        </button>
        <button
          className={tab === "orders" ? "selected" : ""}
          onClick={() => setTab("orders")}
        >
          订单 · {orders.length}
        </button>
        <button disabled={busy} onClick={() => void act(refresh)}>
          刷新
        </button>
        {tab === "products" && (
          <button
            disabled={busy}
            onClick={() =>
              setEditing({
                active: true,
                category: "家居生活",
                image: "/products/cup.svg",
                stock: 10,
              })
            }
          >
            <Plus size={13} /> 新增商品
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="table-wrap">
        {tab === "products" ? (
          <table>
            <thead>
              <tr>
                <th>商品</th>
                <th>分类</th>
                <th>售价</th>
                <th>库存</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>{money(p.price)}</td>
                  <td>{p.stock}</td>
                  <td>{p.active ? "在售" : "下架"}</td>
                  <td>
                    <button disabled={busy} onClick={() => setEditing(p)}>
                      编辑
                    </button>
                    <button
                      disabled={busy}
                      onClick={() =>
                        void act(async () => {
                          await request(`products/${p.id}`, "PATCH", {
                            active: !p.active,
                          });
                          await refresh();
                        })
                      }
                    >
                      {p.active ? "下架" : "上架"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table>
            <thead>
              <tr>
                <th>订单 / 时间</th>
                <th>收货信息</th>
                <th>商品</th>
                <th>金额</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td title={o.id}>
                    {o.id.slice(0, 8)}
                    <br />
                    {new Date(o.createdAt).toLocaleString("zh-CN")}
                  </td>
                  <td>
                    {o.customer.name} · {o.customer.phone}
                    <br />
                    {o.customer.address}
                  </td>
                  <td>
                    {o.items.map((i, n) => (
                      <div key={n}>
                        {i.name} × {i.quantity}
                      </div>
                    ))}
                  </td>
                  <td>{money(o.total)}</td>
                  <td>
                    <span className="status">
                      {{
                        pending: "模拟待发货",
                        shipped: "已发货",
                        completed: "已完成",
                      }[o.status] || o.status}
                    </span>
                  </td>
                  <td>
                    {o.status !== "completed" && (
                      <button
                        disabled={busy}
                        onClick={() =>
                          void act(async () => {
                            await request(`orders/${o.id}`, "PATCH", {
                              status:
                                o.status === "pending"
                                  ? "shipped"
                                  : "completed",
                            });
                            await refresh();
                          })
                        }
                      >
                        {o.status === "pending" ? "模拟发货" : "标记完成"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {tab === "orders" && !orders.length && (
        <div className="empty">还没有订单。可以去商城提交一笔模拟订单。</div>
      )}
      <p className="admin-note">
        当前为单商家演示版本。所有订单均未真实支付，发货操作仅更新演示状态。
      </p>
      {editing && (
        <div className="overlay">
          <form
            className="modal product-form"
            role="dialog"
            aria-modal="true"
            aria-label="商品编辑"
            onSubmit={save}
          >
            <button
              type="button"
              className="close"
              disabled={busy}
              onClick={() => setEditing(null)}
              aria-label="关闭"
            >
              <X />
            </button>
            <h2>{editing.id ? "编辑商品" : "新增商品"}</h2>
            <label>
              商品名称
              <input
                name="name"
                required
                maxLength={100}
                defaultValue={editing.name}
              />
            </label>
            <label>
              商品介绍
              <textarea
                name="description"
                required
                maxLength={1000}
                defaultValue={editing.description}
              />
            </label>
            <div className="form-row">
              <label>
                售价（元）
                <input
                  name="price"
                  type="number"
                  required
                  min="0.01"
                  max="1000000"
                  step="0.01"
                  defaultValue={editing.price ? editing.price / 100 : undefined}
                />
              </label>
              <label>
                库存
                <input
                  name="stock"
                  type="number"
                  required
                  min="0"
                  max="100000"
                  step="1"
                  defaultValue={editing.stock}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                分类
                <select name="category" defaultValue={editing.category}>
                  {["家居生活", "餐厨器皿", "随身好物"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                演示商品图
                <select name="image" defaultValue={editing.image}>
                  {["cup", "lamp", "bag", "book", "scent", "pitcher"].map(
                    (c) => (
                      <option key={c} value={`/products/${c}.svg`}>
                        {
                          {
                            cup: "陶瓷杯",
                            lamp: "小夜灯",
                            bag: "托特包",
                            book: "笔记本",
                            scent: "香薰",
                            pitcher: "玻璃水壶",
                          }[c]
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>
            <label className="check">
              <input
                type="checkbox"
                name="active"
                defaultChecked={editing.active}
              />{" "}
              上架销售
            </label>
            {error && <p className="error">{error}</p>}
            <button className="primary wide" disabled={busy}>
              {busy ? "保存中…" : "保存商品"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
