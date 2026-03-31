# 个人临时邮箱 (Personal Temp Mail)

基于 Cloudflare 生态系统（**Email Routing**、**Workers**、**D1 Database** 和 **Pages**）构建的全栈通配符临时邮箱系统。

## 功能特性

- **通配符邮箱 (Catch-all)**: 无论用户发送到 `abc@yourdomain.com` 还是 `test-123@yourdomain.com`，都能在你的后台看到。
- **全栈解决方案**:
  - **后端 (Backend)**: 由 Cloudflare Worker 提供邮件接收处理和 REST API。
  - **前端 (Admin UI)**: 基 React 开发的现代化管理后台，部署在 Cloudflare Pages。
- **安全保障**: 所有的 API 端点和后台登录都由一个共享密钥（Secret）保护。
- **高效存储**: 邮件结构化存储在 D1 数据库中，为了节省存储空间，目前默认忽略附件。
- **管理功能**: 支持邮件列表分页查询、内容阅读、已读/未读状态切换及永久删除。

## 项目结构

```text
.
├── admin/          # 管理后台前端 (React)
├── schema/         # 数据库初始化脚本 (D1 SQL)
├── src/            # 后端 Worker 源代码 (TypeScript)
├── wrangler.toml.example
└── .dev.vars.example
```

## 前期准备

- 拥有一个在 Cloudflare 管理的域名。
- 在该域名下开启 Cloudflare Email Routing 功能。
- 本地安装 Node.js 20+ 环境。

---

## 安装与部署步骤

### 1. 后端 (Cloudflare Worker & D1)

#### 安装依赖
```bash
npm install
```

#### 创建数据库
```bash
npx wrangler d1 create temp_mail
```
请记下命令返回的 `database_id`。

#### 配置文件
复制示例配置文件：
```bash
cp wrangler.toml.example wrangler.toml
```
打开 `wrangler.toml` 文件，将其中的 `YOUR_DATABASE_ID` 替换为你刚才创建的 ID。

#### 初始化数据库表结构
```bash
# 本地开发环境下初始化
npx wrangler d1 execute temp_mail --local --file=./schema/init.sql

# 远程线上环境下初始化
npx wrangler d1 execute temp_mail --remote --file=./schema/init.sql
```

#### 设置 API 密钥
```bash
npx wrangler secret put API_SECRET
```
*请设置一个高强度的密钥，这将作为你登录管理后台的唯一凭证。*

#### 部署后端
```bash
npm run deploy
```

---

### 2. 前端管理后台 (Admin UI)

#### 进入目录并安装依赖
```bash
cd admin
npm install
```

#### 部署至 Cloudflare Pages
```bash
# 执行构建与自动化部署
npm run deploy
```
*首次运行此命令时，请根据 Wrangler 的提示流程创建一个新的 Pages 项目。*

---

### 3. 配置 Cloudflare 邮箱路由

1. 登录 Cloudflare 控制台 -> 点击你的域名 -> 选择 **Email** -> **Email Routing**。
2. 创建一个 **Catch-all address** 路由。
3. 将操作设置为 **Send to Worker**，并选择你刚才部署的 `temp-mail` Worker。

---

## 常用 API

所有的请求都需要在 Header 中携带以下之一：
- `Authorization: Bearer <your-secret>`
- `x-api-key: <your-secret>`

| 方法 | 端点 | 描述 |
| :--- | :--- | :--- |
| `GET` | `/api/emails` | 获取邮件列表 (支持分页)。返回 `verificationCode` 和 `verificationLink`。 |
| `GET` | `/api/emails/:id` | 获取邮件详情内容。返回 `verificationCode` 和 `verificationLink`。 |
| `PATCH` | `/api/emails/:id/status` | 设置已读/未读状态 |
| `DELETE` | `/api/emails/:id` | 删除特定邮件 |

**关于验证信息提取：**
获取邮件列表或详情时，接口会自动从邮件主题或正文中提取并返回验证码 (`verificationCode`) 及验证链接 (`verificationLink`)，方便进行自动化任务（如自动注册等）。

---

## 许可证

MIT
