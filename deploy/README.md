# Node.js + PostgreSQL 部署配置

保留 Next.js、Express、PostgreSQL 与 Drizzle。需要一台支持 Docker Compose 的服务器和 HTTPS 反向代理。这份配置尚未实际部署和验证 Docker 构建。

1. 将完整项目上传到服务器。
2. 复制 `deploy/.env.example` 为 `deploy/.env`，填写两项随机长密钥。数据库密码仅使用 URL 安全字符（字母、数字、短横线、下划线），避免数据库连接字符串转义问题。
3. 在项目根目录运行 `docker compose --env-file deploy/.env -f deploy/compose.yaml up -d --build`。
4. 通过服务器 HTTPS 反向代理转发至 `127.0.0.1:3000`。不要直接公开数据库或 API 端口。
5. 访问站点 `/admin`，输入管理密钥。

数据库使用独立持久化卷，API 启动执行 Drizzle 迁移和幂等样例数据初始化。不要运行 `docker compose down -v`，它会删除数据库卷。上线前配置备份、HTTPS，并检查真实订单与支付要求。
