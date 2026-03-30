# Personal Temp Mail

Personal catch-all temporary mailbox built on Cloudflare Email Routing, Workers, and D1.

This repository covers **Phase 1** and **Phase 2** only:
- inbound email capture via Cloudflare Email Routing -> Worker `email()` handler
- message parsing with `postal-mime`
- structured email storage in D1
- authenticated admin REST API for listing, reading, marking read/unread, and deleting emails

Frontend admin UI is intentionally **not** included yet.

## Features

- Catch-all mailbox for any address under your domain
- Stores `to`, `from`, `subject`, `date`, `text`, and `html`
- Ignores attachments to reduce storage use
- Token-protected API using either:
  - `Authorization: Bearer <secret>`
  - `x-api-key: <secret>`
- Pagination for inbox listing
- Read/unread state updates
- Hard delete support
- D1 indexes optimized for reverse chronological reads

## Project Structure

```text
.
├── schema/init.sql
├── src/index.ts
├── .dev.vars.example
├── package.json
├── tsconfig.json
└── wrangler.toml
```

## Requirements

- Node.js 20+
- Cloudflare account
- A domain managed in Cloudflare
- Cloudflare Email Routing enabled for that domain
- Wrangler authenticated (`npx wrangler login`)

## Install

```bash
npm install
```

## Local Development

Create your local env file:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` and set a strong API secret.

Start local worker dev server:

```bash
npm run dev
```

## Create D1 Database

Create a D1 database:

```bash
npx wrangler d1 create temp_mail
```

Copy the returned `database_id` into `wrangler.toml`.

Initialize schema remotely:

```bash
npx wrangler d1 execute temp_mail --remote --file=./schema/init.sql
```

Initialize schema locally for dev:

```bash
npm run db:init:local
```

## Set Worker Secret

Set the API secret used by all REST endpoints:

```bash
npx wrangler secret put API_SECRET
```

## Email Routing Setup

1. Open Cloudflare Dashboard.
2. Go to your domain -> **Email** -> **Email Routing**.
3. Enable Email Routing for the domain if it is not already enabled.
4. Create a **catch-all** rule.
5. For the action target, route the catch-all to this Worker.
6. Deploy the Worker after your D1 binding and secret are configured.

Result: any address like `abc@yourdomain.com`, `test123@yourdomain.com`, or `shop_apple@yourdomain.com` will be delivered to the Worker and stored in D1.

## API

All endpoints require one of these headers:

```http
Authorization: Bearer <secret>
```

or

```http
x-api-key: <secret>
```

### List Emails

`GET /api/emails?page=1&pageSize=20&to_address=<recipient>&unread=true`

Response includes metadata only, ordered by `received_at DESC`.
When `to_address` is provided, only emails whose `to_address` exactly matches this value are returned.
When `unread=true` (also supports `1`, `yes`, `on`), only unread emails are returned.

Example:

```bash
curl -H "Authorization: Bearer $API_SECRET" \
  "http://127.0.0.1:8787/api/emails?page=1&pageSize=20"
```

Filter by recipient:

```bash
curl -H "Authorization: Bearer $API_SECRET" \
  "http://127.0.0.1:8787/api/emails?page=1&pageSize=20&to_address=user@example.com"
```

Filter by unread:

```bash
curl -H "Authorization: Bearer $API_SECRET" \
  "http://127.0.0.1:8787/api/emails?page=1&pageSize=20&unread=true"
```

### Get Email Detail

`GET /api/emails/:id`

Example:

```bash
curl -H "x-api-key: $API_SECRET" \
  "http://127.0.0.1:8787/api/emails/<email-id>"
```

### Update Read Status

`PATCH /api/emails/:id/status`

Body:

```json
{
  "isRead": true
}
```

Example:

```bash
curl -X PATCH \
  -H "Authorization: Bearer $API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"isRead":true}' \
  "http://127.0.0.1:8787/api/emails/<email-id>/status"
```

### Delete Email

`DELETE /api/emails/:id`

Example:

```bash
curl -X DELETE \
  -H "Authorization: Bearer $API_SECRET" \
  "http://127.0.0.1:8787/api/emails/<email-id>"
```

## Build and Validation

Type check:

```bash
npm run typecheck
```

Dry-run build:

```bash
npm run build
```

## Deployment

After D1 and secrets are configured:

```bash
npm run deploy
```

## Notes

- `received_at` is normalized to ISO 8601 before writing into D1.
- Attachments are parsed by `postal-mime` but intentionally not stored.
- The Worker currently exposes only the admin API and email ingestion path.
- Phase 3 (frontend admin UI) is still missing by design.
