export const catalog = [
  {
    id: "p1",
    name: "日常 · 陶瓷马克杯",
    category: "餐厨器皿",
    price: 8900,
    stock: 42,
    image: "/products/cup.svg",
    description:
      "温润的哑光釉面，恰到好处的握感。350ml 容量，陪你享受每一个慢下来的早晨。",
  },
  {
    id: "p2",
    name: "柔光 · 桌面小夜灯",
    category: "家居生活",
    price: 25900,
    stock: 18,
    image: "/products/lamp.svg",
    description:
      "柔和暖光与简洁造型，为床头或书桌留一盏温暖的灯。三档亮度，USB 供电。",
  },
  {
    id: "p3",
    name: "自然 · 棉麻托特包",
    category: "随身好物",
    price: 12900,
    stock: 35,
    image: "/products/bag.svg",
    description:
      "轻盈耐用的棉麻材质，能装下书本、电脑与一天的灵感。内置小口袋，日常通勤好伙伴。",
  },
  {
    id: "p4",
    name: "留白 · 精装笔记本",
    category: "随身好物",
    price: 5900,
    stock: 66,
    image: "/products/book.svg",
    description:
      "细腻纸张与平摊装订，记录想法也收藏日常。A5 尺寸，160 页，适合书写与速写。",
  },
  {
    id: "p5",
    name: "山野 · 木质香薰",
    category: "家居生活",
    price: 15900,
    stock: 24,
    image: "/products/scent.svg",
    description:
      "雪松与柑橘交织的清新气息，让忙碌的房间安静下来。100ml，无火扩香。",
  },
  {
    id: "p6",
    name: "晨间 · 玻璃水壶",
    category: "餐厨器皿",
    price: 11900,
    stock: 30,
    image: "/products/pitcher.svg",
    description:
      "高硼硅玻璃搭配天然竹盖，盛放清水也盛放四季。容量 1L，耐冷耐热。",
  },
].map((p) => ({ ...p, merchantId: "default", active: true }));
