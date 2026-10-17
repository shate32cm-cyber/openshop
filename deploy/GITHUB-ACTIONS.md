# GitHub Actions 接入

当前上传的是 Next.js + Express + PostgreSQL + Drizzle 原项目，未使用在线体验版的 D1 数据库。

## 已配置的流程

- **Mall CI**：推送 main 或提交 PR 后安装依赖、运行 API 测试并构建前端。
- **Check Oracle Server**：手动启动，只通过 SSH 检查现有 Docker、Node.js、PostgreSQL、监听端口和服务状态。不会安装软件、启动新数据库或修改服务器配置。

## 一次性配置

仓库 Settings → Secrets and variables → Actions → Secrets：

- `SSH_PRIVATE_KEY`：专用部署私钥全文，不是 Windows 文件路径；对应公钥应已添加到服务器 ubuntu 用户的 authorized_keys。不可提交到仓库。
- `SSH_KNOWN_HOSTS`：经过核验的服务器主机公钥记录，格式 `服务器地址 ssh-ed25519 AAAA...`。从你已信任的本地 SSH 连接取得服务器主机公钥，例如 `ssh jiagu 'cat /etc/ssh/ssh_host_ed25519_key.pub'`，将地址加在输出行前。

另外添加 `SSH_HOST`（服务器地址）、`SSH_USER`（SSH 用户名），以及可选的 `SSH_PORT`（默认 22）到 Secrets。工作流不内置实际服务器地址或用户名。

之后打开 Actions → Check Oracle Server → Run workflow。第一次成功运行后，按实际 PostgreSQL 和网站环境编写部署流程。

## 现有数据库

如果服务器已有 PostgreSQL，优先复用并创建商城专用数据库及用户，使用独立 DATABASE_URL。不直接运行 deploy/compose.yaml；该文件是新环境参考配置，会启动独立 PostgreSQL 容器。

仓库连接权限不包含 Actions Secrets 管理权限。不要在 Issue、Actions 日志或代码中粘贴数据库密码和私钥。严格核验主机密钥，不通过关闭 StrictHostKeyChecking 来跳过验证。
