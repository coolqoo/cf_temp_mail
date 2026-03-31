# Personal Temp Mail

A full-stack catch-all temporary mailbox system built on Cloudflare's ecosystem: **Email Routing**, **Workers**, **D1 Database**, and **Pages**.

## Features

- **Catch-all Mailbox**: Receive emails for any address under your custom domain.
- **Full-Stack Solution**:
  - **Backend**: Cloudflare Worker for email ingestion and REST API.
  - **Frontend**: Modern React-based Admin Dashboard (Cloudflare Pages).
- **Secure**: All API endpoints and the dashboard are protected by a shared secret.
- **Efficient**: Structured email storage in D1, ignoring attachments to save space.
- **Managed**: Built-in support for listing, reading, marking status, and deleting emails.

## Project Structure

```text
.
├── admin/          # React Frontend (Admin Dashboard)
├── schema/         # Database migrations (D1 SQL)
├── src/            # Backend Worker source (TypeScript)
├── wrangler.toml.example
└── .dev.vars.example
```

## Prerequisites

- Cloudflare account with a domain managed on it.
- Cloudflare Email Routing enabled for the domain.
- Node.js 20+ installed locally.

---

## Installation & Deployment

### 1. Backend (Cloudflare Worker & D1)

#### Install Dependencies
```bash
npm install
```

#### Create Database
```bash
npx wrangler d1 create temp_mail
```
Note the `database_id` returned by the command.

#### Configure Wrangler
Copy the example configuration:
```bash
cp wrangler.toml.example wrangler.toml
```
Open `wrangler.toml` and replace `YOUR_DATABASE_ID` with the ID you just created.

#### Initialize Schema
```bash
# For local development
npx wrangler d1 execute temp_mail --local --file=./schema/init.sql

# For production
npx wrangler d1 execute temp_mail --remote --file=./schema/init.sql
```

#### Set API Secret
```bash
npx wrangler secret put API_SECRET
```
*Choose a strong secret. You will need this to log into the Admin panel.*

#### Deploy Backend
```bash
npm run deploy
```

---

### 2. Frontend (Admin Dashboard)

#### Install Dependencies
```bash
cd admin
npm install
```

#### Configure Environment
The Admin UI needs to know your Backend API address. In the `admin` folder, your configuration might vary. (Note: Currently the UI defaults to the deployed worker URL or can be configured in `admin/src/store.tsx`).

#### Build & Deploy to Cloudflare Pages
```bash
npm run deploy
```
*Follow the wrangler prompts to create a new Pages project when running for the first time.*

---

### 3. Cloudflare Email Routing Setup

1. Go to your domain in the Cloudflare Dashboard -> **Email** -> **Email Routing**.
2. Create a **Catch-all address**.
3. Set the action to **Send to Worker** and select your `temp-mail` worker.

---

## Documentation

- [中文说明 (Chinese README)](docs/README_CN.md)
- [API Documentation](README.md#api) (See below)

## API Reference

All requests must include one of the following headers for authentication:
- `Authorization: Bearer <your-secret>`
- `x-api-key: <your-secret>`

### 1. List Emails
Retrieve a list of received emails with search and pagination support.

**Endpoint:** `GET /api/emails`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `page` | `number` | No | `1` | Page number |
| `pageSize` | `number` | No | `20` | Items per page (max 100) |
| `to_address` | `string` | No | - | Filter by a specific recipient address (e.g., `user@example.com`) |
| `unread` | `boolean` | No | `false` | Filter for unread emails only (`1`, `true`, `yes`, or `on`) |

**Response Example:**
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

### 2. Get Email Detail
Retrieve the full content of a specific email, including the message body.

**Endpoint:** `GET /api/emails/:id`

**Response Example:**
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

### 3. Update Read Status
Mark an email as read or unread.

**Endpoint:** `PATCH /api/emails/:id/status`

**Request Body:**
```json
{
  "isRead": true
}
```

**Response Example:**
```json
{
  "id": "a1b2c3d4...",
  "isRead": true
}
```

---

### 4. Delete Email
Permanently delete a specific email from the database.

**Endpoint:** `DELETE /api/emails/:id`

**Response:** `204 No Content`

---

**Note on Verification Extraction:**
The `GET /api/emails` and `GET /api/emails/:id` endpoints automatically extract and include `verificationCode` and `verificationLink` (if found in the email's subject or body) to facilitate automated workflows.

## Acknowledgments

特别感谢 [Linux.do](https://linux.do/) 社区的支持与反馈，你们的建议让这个项目变得更好。

Special thanks to the [Linux.do](https://linux.do/) community for your support and feedback.

---

## License

MIT
