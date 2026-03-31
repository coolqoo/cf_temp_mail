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

所有的请求都需要在 Header 中携带以下之一进行认证：
- `Authorization: Bearer <your-secret>`
- `x-api-key: <your-secret>`

### 1. 获取邮件列表
获取收到的邮件列表，支持搜索和分页。

**请求：** `GET /api/emails`

**查询参数：**
| 参数 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `page` | `number` | 否 | `1` | 当前页码 |
| `pageSize` | `number` | 否 | `20` | 每页数量 (最大 100) |
| `to_address` | `string` | 否 | - | 筛选特定的收件地址 (如 `user@example.com`) |
| `unread` | `boolean` | 否 | `false` | 仅查看未读邮件 (传 `1`, `true`, `yes`, 或 `on`) |

**响应示例：**
```json
{
  "page": 1,
  "pageSize": 20,
  "total": 1,
  "totalPages": 1,
  "items": [
    {
      "id": "a1b2c3d4...",
      "address": "test@yourdomain.com",
      "toAddress": "Recipient Name <test@yourdomain.com>",
      "sender": "Sender <sender@example.com>",
      "subject": "Your Verification Code",
      "receivedAt": "2024-03-31T10:00:00.000Z",
      "isRead": false,
      "verificationCode": "123456",
      "verificationLink": "https://example.com/verify?code=123456"
    }
  ]
}
```

---

### 2. 获取邮件详情
获取特定邮件的完整内容（包括正文）。

**请求：** `GET /api/emails/:id`

**响应示例：**
```json
{
  "id": "a1b2c3d4...",
  "address": "test@yourdomain.com",
  "toAddress": "Recipient Name <test@yourdomain.com>",
  "sender": "Sender <sender@example.com>",
  "subject": "Your Verification Code",
  "textBody": "Hello, your code is 123456...",
  "htmlBody": "<html>...</html>",
  "receivedAt": "2024-03-31T10:00:00.000Z",
  "isRead": true,
  "verificationCode": "123456",
  "verificationLink": null
}
```

---

### 3. 设置已读状态
标记邮件为已读或未读。

**请求：** `PATCH /api/emails/:id/status`

**请求体：**
```json
{
  "isRead": true
}
```

**响应示例：**
```json
{
  "id": "a1b2c3d4...",
  "isRead": true
}
```

---

### 4. 删除邮件
从数据库中永久删除特定邮件。

**请求：** `DELETE /api/emails/:id`

**响应：** `204 No Content`

---

**关于验证信息提取：**
获取邮件列表或详情时，接口会自动从邮件主题或正文中提取并返回验证码 (`verificationCode`) 及验证链接 (`verificationLink`)，方便进行自动化任务（如自动注册等）。

---

## 许可证

MIT
