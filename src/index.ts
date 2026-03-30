import PostalMime, { type Address, type Email } from 'postal-mime';

interface Env {
  DB: D1Database;
  API_SECRET: string;
  APP_NAME?: string;
}

interface EmailRecord {
  id: string;
  to_address: string;
  sender: string;
  subject: string;
  text_body: string | null;
  html_body: string | null;
  received_at: string;
  is_read: number;
}

interface EmailListItem {
  id: string;
  toAddress: string;
  sender: string;
  subject: string;
  receivedAt: string;
  isRead: boolean;
}

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
};

export default {
  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(storeIncomingEmail(message, env));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: corsHeaders(request),
        });
      }

      if (!isAuthorized(request, env.API_SECRET)) {
        return json({ error: 'Unauthorized' }, 401, request);
      }

      const url = new URL(request.url);
      const pathname = url.pathname.replace(/\/+$/, '') || '/';

      if (request.method === 'GET' && pathname === '/api/emails') {
        return handleListEmails(request, env, url);
      }

      const detailMatch = pathname.match(/^\/api\/emails\/([^/]+)$/);
      if (request.method === 'GET' && detailMatch) {
        return handleGetEmail(request, env, detailMatch[1]);
      }

      const statusMatch = pathname.match(/^\/api\/emails\/([^/]+)\/status$/);
      if (request.method === 'PATCH' && statusMatch) {
        return handleUpdateStatus(request, env, statusMatch[1]);
      }

      if (request.method === 'DELETE' && detailMatch) {
        return handleDeleteEmail(request, env, detailMatch[1]);
      }

      return json({ error: 'Not Found' }, 404, request);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal Server Error';
      return json({ error: message }, 500, request);
    }
  },
};

async function storeIncomingEmail(message: ForwardableEmailMessage, env: Env): Promise<void> {
  const rawEmail = await new Response(message.raw).arrayBuffer();
  const parsed = await PostalMime.parse(rawEmail);
  const record = normalizeIncomingEmail(message, parsed);

  await env.DB.prepare(
    `INSERT INTO emails (id, to_address, sender, subject, text_body, html_body, received_at, is_read)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 0)`
  )
    .bind(
      record.id,
      record.to_address,
      record.sender,
      record.subject,
      record.text_body,
      record.html_body,
      record.received_at,
    )
    .run();
}

function normalizeIncomingEmail(message: ForwardableEmailMessage, parsed: Email): EmailRecord {
  return {
    id: crypto.randomUUID(),
    to_address: message.to,
    sender: stringifyAddress(parsed.from) || message.from,
    subject: parsed.subject?.trim() || '(no subject)',
    text_body: normalizeBody(parsed.text),
    html_body: normalizeBody(parsed.html),
    received_at: normalizeDate(parsed.date),
    is_read: 0,
  };
}

async function handleListEmails(request: Request, env: Env, url: URL): Promise<Response> {
  const page = clampInteger(url.searchParams.get('page'), 1, 1);
  const pageSize = clampInteger(url.searchParams.get('pageSize'), 20, 1, 100);
  const offset = (page - 1) * pageSize;

  const rowsResult = await env.DB.prepare(
    `SELECT id, to_address, sender, subject, received_at, is_read
     FROM emails
     ORDER BY received_at DESC
     LIMIT ?1 OFFSET ?2`
  )
    .bind(pageSize, offset)
    .all<Pick<EmailRecord, 'id' | 'to_address' | 'sender' | 'subject' | 'received_at' | 'is_read'>>();

  const countResult = await env.DB.prepare('SELECT COUNT(*) AS total FROM emails').first<{ total: number | string }>();
  const total = Number(countResult?.total ?? 0);
  const items = (rowsResult.results ?? []).map(mapListItem);

  return json(
    {
      page,
      pageSize,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
      items,
    },
    200,
    request,
  );
}

async function handleGetEmail(request: Request, env: Env, id: string): Promise<Response> {
  const record = await env.DB.prepare(
    `SELECT id, to_address, sender, subject, text_body, html_body, received_at, is_read
     FROM emails
     WHERE id = ?1`
  )
    .bind(id)
    .first<EmailRecord>();

  if (!record) {
    return json({ error: 'Email not found' }, 404, request);
  }

  return json(
    {
      id: record.id,
      toAddress: record.to_address,
      sender: record.sender,
      subject: record.subject,
      textBody: record.text_body,
      htmlBody: record.html_body,
      receivedAt: record.received_at,
      isRead: Boolean(record.is_read),
    },
    200,
    request,
  );
}

async function handleUpdateStatus(request: Request, env: Env, id: string): Promise<Response> {
  const payload = (await request.json().catch(() => null)) as { isRead?: unknown } | null;
  if (!payload || typeof payload.isRead !== 'boolean') {
    return json({ error: 'Body must include boolean `isRead`.' }, 400, request);
  }

  const result = await env.DB.prepare('UPDATE emails SET is_read = ?1 WHERE id = ?2')
    .bind(payload.isRead ? 1 : 0, id)
    .run();

  if (!result.meta.changes) {
    return json({ error: 'Email not found' }, 404, request);
  }

  return json({ id, isRead: payload.isRead }, 200, request);
}

async function handleDeleteEmail(request: Request, env: Env, id: string): Promise<Response> {
  const result = await env.DB.prepare('DELETE FROM emails WHERE id = ?1').bind(id).run();

  if (!result.meta.changes) {
    return json({ error: 'Email not found' }, 404, request);
  }

  return new Response(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}

function mapListItem(row: Pick<EmailRecord, 'id' | 'to_address' | 'sender' | 'subject' | 'received_at' | 'is_read'>): EmailListItem {
  return {
    id: row.id,
    toAddress: row.to_address,
    sender: row.sender,
    subject: row.subject,
    receivedAt: row.received_at,
    isRead: Boolean(row.is_read),
  };
}

function normalizeBody(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeDate(value?: string): string {
  if (!value) {
    return new Date().toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function stringifyAddress(address?: Address): string {
  if (!address) {
    return '';
  }

  if ('group' in address && Array.isArray(address.group)) {
    return address.group.map((member) => formatMailbox(member.name, member.address)).join(', ');
  }

  return formatMailbox(address.name, address.address);
}

function formatMailbox(name?: string, email?: string): string {
  if (!name && !email) {
    return '';
  }

  if (name && email) {
    return `${name} <${email}>`;
  }

  return name || email || '';
}

function clampInteger(value: string | null, fallback: number, min: number, max = Number.MAX_SAFE_INTEGER): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
}

function isAuthorized(request: Request, secret: string | undefined): boolean {
  if (!secret) {
    return false;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim() === secret;
  }

  const apiKey = request.headers.get('x-api-key');
  return apiKey === secret;
}

function json(payload: unknown, status: number, request: Request): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      ...JSON_HEADERS,
      ...corsHeaders(request),
    },
  });
}

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('origin') ?? '*';
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, PATCH, DELETE, OPTIONS',
    'access-control-allow-headers': 'Content-Type, Authorization, x-api-key',
    'access-control-max-age': '86400',
    vary: 'Origin',
  };
}
