# 日常好物商城

Next.js / React / TypeScript + Express + PostgreSQL + Drizzle ORM。前后端 npm workspace 分离，商品和订单均关联商家，当前使用默认单商家。

## 本地启动

需要 Node.js 22 或更高版本。

```sh
npm ci
npm run dev
```

商城：http://localhost:3000，管理后台：http://localhost:3000/admin，API：http://localhost:4000。

默认使用 PGlite（真正的嵌入式 PostgreSQL 引擎）运行开发演示，数据持久化在 `apps/api/data`，第一次启动自动建立表和样例商品，不是内存 Mock。删除该目录会丢失开发数据。

后台需要在 `apps/api/.env` 设置 `ADMIN_TOKEN`，可复制 `.env.example`，并使用密码生成器产生随机长密钥。无密钥时后台接口拒绝访问。密钥不写入浏览器存储。

## 使用正式 PostgreSQL

在 `apps/api/.env` 配置 `DATABASE_URL=postgresql://用户名:密码@主机:5432/mall`，设置管理密钥后：

```sh
npm run db:migrate -w apps/api
npm run db:seed
npm run dev
```

正式 PostgreSQL 不自动创建表，使用版本化 Drizzle 迁移。金额存储为整数分，订单保留商品价格快照，事务内条件扣库存避免超卖。该版本拒绝跨商家购物袋，后续多商家需要拆单、权限隔离与支付分账。

## 验证与构建

```sh
npm test
npm run build
```

API 的 build 执行 TypeScript 检查；启动生产 API 可用 `npm exec -w apps/api -- tsx src/index.ts`，前端使用 `npm run start -w apps/web`。前端通过 Next.js rewrite 调用 Express，远程 API 可在前端环境文件配置 `API_URL`。

## 已实现

- 中文响应式商城、分类筛选、商品搜索、详情弹窗
- 本地保存购物袋、数量调整、测试地址校验
- 模拟结算、持久化订单、库存扣减
- 密钥保护的后台：新增和编辑商品、上下架、库存维护、订单列表及模拟发货
- 自带 SVG 商品插画，无外部图片依赖

## 浏览器检查

另开终端启动 `npm run dev` 后，运行 `npx playwright install chromium` 和 `npm run test:browser`。截图保存在 `artifacts`。检查会生成一笔测试订单并消耗一件样例杯子库存；请仅对开发数据库运行。

已通过 7 项 API 集成测试、前后端生产构建和浏览器流程检查。正式独立 PostgreSQL 连接尚未在此环境实测。

## 当前边界

这是可运行的开发原型，尚未接入真实支付、用户注册登录、买家订单查询、真实物流、文件上传、退款或多商家入驻。模拟订单不扣款也不实际发货。发布前应接入正式身份认证、支付回调与幂等机制、订单取消和库存释放、数据库备份、HTTPS，以及真实库存与合规页面。商城弹窗支持 Escape 关闭、焦点约束和关闭后焦点恢复。

代码和数据库存于当前云环境，请通过 Git 或下载备份，云环境不保证永久保留。

## GitHub Actions

已添加持续集成和只读服务器检查工作流，详见 [GitHub Actions 接入](deploy/GITHUB-ACTIONS.md)。在确认服务器现有 PostgreSQL 和网站配置前，不执行正式部署。
