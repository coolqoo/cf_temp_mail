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

All endpoints require one of these headers:
- `Authorization: Bearer <secret>`
- `x-api-key: <secret>`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/emails` | List emails (paginated) |
| `GET` | `/api/emails/:id` | Get email content |
| `PATCH` | `/api/emails/:id/status` | Mark as read/unread |
| `DELETE` | `/api/emails/:id` | Delete an email |

---

## License

MIT
