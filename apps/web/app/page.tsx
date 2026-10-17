"use client";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ShoppingBag,
  X,
  Minus,
  Plus,
  Search,
  Check,
  Truck,
  ShieldCheck,
  Leaf,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useDialogFocus } from "./use-dialog-focus";
type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  image: string;
};
type Cart = Record<string, number>;
const money = (n: number) => `¥${(n / 100).toFixed(2)}`;
export default function Store() {
  const [products, setProducts] = useState<Product[]>([]),
    [cart, setCart] = useState<Cart>({}),
    [ready, setReady] = useState(false),
    [category, setCategory] = useState("全部好物"),
    [query, setQuery] = useState(""),
    [detail, setDetail] = useState<Product | null>(null),
    [drawer, setDrawer] = useState(false),
    [checkout, setCheckout] = useState(false),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [order, setOrder] = useState<{ id: string; total: number } | null>(null);
  useDialogFocus(Boolean(detail || drawer));
  async function load() {
    try {
      const r = await fetch("/api/products");
      if (!r.ok) throw Error("商品加载失败，请稍后重试");
      setProducts(await r.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
    try {
      const saved = JSON.parse(localStorage.getItem("mall-cart") || "{}");
      if (saved && typeof saved === "object" && !Array.isArray(saved))
        setCart(
          Object.fromEntries(
            Object.entries(saved).filter(
              ([, v]) =>
                Number.isInteger(v) && Number(v) > 0 && Number(v) <= 99,
            ),
          ) as Cart,
        );
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem("mall-cart", JSON.stringify(cart));
  }, [cart, ready]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 2200);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    if (!(detail || drawer)) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) {
        setDetail(null);
        setDrawer(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [detail, drawer, busy]);
  const lines = products.filter((p) => cart[p.id]),
    total = lines.reduce((s, p) => s + p.price * cart[p.id], 0),
    count = Object.values(cart).reduce((s, n) => s + n, 0),
    visible = products.filter(
      (p) =>
        (category === "全部好物" || p.category === category) &&
        p.name.includes(query),
    );
  function change(p: Product, n: number) {
    setCart((c) => {
      const next = { ...c };
      const v = Math.min(p.stock, 99, Math.max(0, (c[p.id] || 0) + n));
      if (v) next[p.id] = v;
      else delete next[p.id];
      return next;
    });
  }
  function add(p: Product) {
    if ((cart[p.id] || 0) >= Math.min(p.stock, 99)) {
      setNotice("已达到可购买数量");
      return;
    }
    change(p, 1);
    setNotice("已加入购物袋");
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: f.get("name"),
            phone: f.get("phone"),
            address: f.get("address"),
          },
          items: Object.entries(cart).map(([productId, quantity]) => ({
            productId,
            quantity,
          })),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error || "下单失败");
      setOrder(data);
      setCart({});
      setCheckout(false);
      void load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="announcement">
        把日子过成喜欢的样子 <span>·</span> 精选好物，用心相伴
      </div>
      <header className="header">
        <Link href="/" className="brand">
          日常<span>好物</span>
          <small>EVERYDAY GOODS</small>
        </Link>
        <nav>
          <a className="nav-active" href="#collection">
            所有好物
          </a>
          <button
            onClick={() => {
              setCategory("家居生活");
              document
                .getElementById("collection")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            家居生活
          </button>
          <a href="#about">关于我们</a>
        </nav>
        <button
          className="bag-button"
          onClick={() => {
            setDrawer(true);
            setOrder(null);
            setError("");
          }}
          aria-label={`购物袋，${count}件商品`}
        >
          <ShoppingBag size={21} />
          <span>购物袋</span>
          <b>{count}</b>
        </button>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">LESS, BUT BETTER / 日常精选</p>
            <h1>
              好好生活，
              <br />
              从一件好物开始。
            </h1>
            <p className="hero-desc">
              不追逐繁复，只留住喜欢。
              <br />
              发现设计与实用兼具的好物，让平凡日常多一点美好。
            </p>
            <a className="primary" href="#collection">
              探索日常好物 <ArrowRight size={18} />
            </a>
            <div className="hero-note">
              <span /> 为生活而选，为日常而生
            </div>
          </div>
          <div className="hero-art">
            <div className="art-label">
              THE ART OF
              <br />
              EVERYDAY LIVING
            </div>
            <div className="sun" />
            <img
              className="hero-cup"
              src="/products/cup.svg"
              alt="温润的陶瓷马克杯"
            />
            <img
              className="hero-lamp"
              src="/products/lamp.svg"
              alt="柔光桌面灯"
            />
            <div className="art-caption">
              <span>01 — 慢享日常</span>
              <span>2026 COLLECTION</span>
            </div>
          </div>
        </section>
        <section className="benefits">
          <div>
            <Leaf size={20} />
            <span>
              用心甄选<small>设计与品质，恰到好处</small>
            </span>
          </div>
          <div>
            <Truck size={20} />
            <span>
              全国包邮<small>每一份喜欢，安心送达</small>
            </span>
          </div>
          <div>
            <ShieldCheck size={20} />
            <span>
              安心体验<small>演示商城，模拟下单</small>
            </span>
          </div>
        </section>
        <section className="collection" id="collection">
          <div className="section-top">
            <div>
              <p className="eyebrow">CURATED FOR YOU</p>
              <h2>值得拥有的日常</h2>
              <p>一点实用，一点美感，一点生活的温度。</p>
            </div>
            <span className="collection-count">
              {products.length} 件精选好物
            </span>
          </div>
          <div className="filters">
            <div className="tabs">
              {["全部好物", "家居生活", "餐厨器皿", "随身好物"].map((c) => (
                <button
                  className={category === c ? "selected" : ""}
                  key={c}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <label className="search">
              <Search size={17} />
              <input
                aria-label="搜索商品"
                placeholder="寻找心仪的好物"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>
          {loading ? (
            <div className="empty">
              <Loader2 className="spin" /> 正在挑选好物…
            </div>
          ) : error && !drawer ? (
            <div className="empty">
              {error}
              <button
                onClick={() => {
                  setError("");
                  void load();
                }}
              >
                重新加载
              </button>
            </div>
          ) : (
            <div className="grid">
              {visible.map((p, i) => (
                <article className="product" key={p.id}>
                  <button
                    className={`product-image tone-${i % 3}`}
                    onClick={() => setDetail(p)}
                    aria-label={`查看${p.name}`}
                  >
                    <img src={p.image} alt={p.name} />
                    {i === 0 && <span className="badge">人气好物</span>}
                    <span className="view-detail">
                      探索好物 <ArrowRight size={15} />
                    </span>
                  </button>
                  <div className="product-info">
                    <div>
                      <small>{p.category}</small>
                      <button
                        className="product-title"
                        onClick={() => setDetail(p)}
                      >
                        {p.name}
                      </button>
                      <strong>{money(p.price)}</strong>
                    </div>
                    <button
                      className="add"
                      disabled={!p.stock}
                      onClick={() => add(p)}
                      aria-label={`加入购物袋：${p.name}`}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {!loading && !error && !visible.length && (
            <div className="empty">还没有找到这件好物，换个关键词试试。</div>
          )}
        </section>
        <section className="story" id="about">
          <span className="story-symbol">日常</span>
          <div>
            <p className="eyebrow">OUR PHILOSOPHY</p>
            <h2>生活的美好，藏在日常里。</h2>
            <p>
              一只喜欢的杯子，一盏温暖的灯，一本记录灵感的笔记。
              <br />
              我们相信，好的物件让生活简单，也让每一天更值得期待。
            </p>
          </div>
        </section>
      </main>
      <footer>
        <div>
          <b>日常好物</b>
          <p>少一点将就，多一点喜欢。</p>
        </div>
        <span>© 2026 日常好物 · 演示商城</span>
        <Link href="/admin">管理后台 ↗</Link>
      </footer>
      {notice && (
        <div className="toast" role="status">
          <Check size={18} />
          {notice}
        </div>
      )}
      {detail && (
        <div className="overlay" onClick={() => setDetail(null)}>
          <section
            className="detail modal"
            role="dialog"
            aria-modal="true"
            aria-label={detail.name}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              autoFocus
              className="close"
              onClick={() => setDetail(null)}
              aria-label="关闭"
            >
              <X />
            </button>
            <img src={detail.image} alt={detail.name} />
            <div>
              <p className="eyebrow">{detail.category}</p>
              <h2>{detail.name}</h2>
              <p>{detail.description}</p>
              <strong className="detail-price">{money(detail.price)}</strong>
              <p className="muted">库存 {detail.stock} 件 · 全国包邮</p>
              <button
                className="primary"
                disabled={!detail.stock}
                onClick={() => add(detail)}
              >
                {detail.stock ? "加入购物袋" : "暂时售罄"}
                <ShoppingBag size={18} />
              </button>
            </div>
          </section>
        </div>
      )}
      {drawer && (
        <div
          className="overlay drawer-overlay"
          onClick={() => {
            if (!busy) setDrawer(false);
          }}
        >
          <section
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="购物袋"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-header">
              <h2>
                {order
                  ? "订单已创建"
                  : checkout
                    ? "填写收货信息"
                    : "我的购物袋"}{" "}
                <small>{!order && !checkout && `${count} 件好物`}</small>
              </h2>
              <button
                autoFocus
                onClick={() => {
                  if (!busy) {
                    setDrawer(false);
                    setCheckout(false);
                  }
                }}
                aria-label="关闭购物袋"
              >
                <X />
              </button>
            </div>
            {order ? (
              <div className="success">
                <div className="success-icon">
                  <Check size={36} />
                </div>
                <h2>把喜欢，带回家。</h2>
                <p>模拟订单已创建，未收取任何费用。</p>
                <p>订单号</p>
                <code>{order.id}</code>
                <h3>{money(order.total)}</h3>
                <button className="primary" onClick={() => setDrawer(false)}>
                  继续逛逛 <ArrowRight size={18} />
                </button>
              </div>
            ) : checkout ? (
              <form className="checkout-form" onSubmit={submit}>
                <p className="demo-note">
                  演示结算：不会发起真实支付或发货。请使用测试收货信息。
                </p>
                <label>
                  收货人
                  <input
                    name="name"
                    required
                    maxLength={60}
                    placeholder="收货人姓名"
                    autoComplete="name"
                  />
                </label>
                <label>
                  手机号码
                  <input
                    name="phone"
                    required
                    pattern="1[3-9][0-9]{9}"
                    title="11 位中国大陆手机号"
                    placeholder="11 位手机号码"
                    autoComplete="tel"
                  />
                </label>
                <label>
                  收货地址
                  <textarea
                    name="address"
                    required
                    minLength={5}
                    maxLength={300}
                    placeholder="省、市、区及详细地址"
                    autoComplete="street-address"
                  />
                </label>
                <div className="summary">
                  <span>应付金额（模拟）</span>
                  <strong>{money(total)}</strong>
                </div>
                {error && (
                  <p role="alert" className="error">
                    {error}
                  </p>
                )}
                <button className="primary wide" disabled={busy}>
                  {busy ? "正在创建订单…" : "提交模拟订单"}
                  <ArrowRight size={18} />
                </button>
                <button
                  type="button"
                  className="text-button"
                  disabled={busy}
                  onClick={() => setCheckout(false)}
                >
                  返回购物袋
                </button>
              </form>
            ) : (
              <>
                <div className="cart-lines">
                  {!lines.length ? (
                    <div className="empty">
                      <ShoppingBag size={40} />
                      <h3>购物袋还空着</h3>
                      <p>为日常挑一件喜欢的好物吧。</p>
                      <button
                        className="primary"
                        onClick={() => setDrawer(false)}
                      >
                        去逛逛 <ArrowRight size={18} />
                      </button>
                    </div>
                  ) : (
                    lines.map((p) => (
                      <div className="cart-line" key={p.id}>
                        <img src={p.image} alt={p.name} />
                        <div>
                          <h3>{p.name}</h3>
                          <p>{money(p.price)}</p>
                          <div className="quantity">
                            <button
                              aria-label={`减少${p.name}`}
                              onClick={() => change(p, -1)}
                            >
                              <Minus size={14} />
                            </button>
                            <span>{cart[p.id]}</span>
                            <button
                              aria-label={`增加${p.name}`}
                              disabled={cart[p.id] >= Math.min(p.stock, 99)}
                              onClick={() => change(p, 1)}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                        <button
                          className="remove"
                          aria-label={`移除${p.name}`}
                          onClick={() =>
                            setCart((c) => {
                              const next = { ...c };
                              delete next[p.id];
                              return next;
                            })
                          }
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                {lines.length > 0 && (
                  <div className="cart-bottom">
                    <div className="summary">
                      <span>商品合计</span>
                      <strong>{money(total)}</strong>
                    </div>
                    <p className="muted">运费：包邮 · 当前为模拟结算</p>
                    <button
                      className="primary wide"
                      onClick={() => {
                        setCheckout(true);
                        setError("");
                      }}
                    >
                      去结算 <ArrowRight size={18} />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
