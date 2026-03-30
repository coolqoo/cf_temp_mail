const buildHeaders = (secret: string) => ({
  'Authorization': `Bearer ${secret}`,
  'Content-Type': 'application/json'
});

export const fetchEmails = async (
  baseUrl: string,
  secret: string,
  page: number,
  pageSize: number,
  toAddress?: string,
  unreadOnly?: boolean
) => {
  const url = new URL(`${baseUrl}/api/emails`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('pageSize', String(pageSize));
  if (toAddress) url.searchParams.set('to_address', toAddress);
  if (unreadOnly) url.searchParams.set('unread', '1');

  const res = await fetch(url.toString(), {
    headers: buildHeaders(secret)
  });
  
  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized');
    throw new Error(`Failed to fetch: ${res.statusText}`);
  }
  return res.json();
};

export const getEmailDetail = async (baseUrl: string, secret: string, id: string) => {
  const res = await fetch(`${baseUrl}/api/emails/${id}`, {
    headers: buildHeaders(secret)
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to load detail');
  }
  return res.json();
};

export const updateEmailStatus = async (baseUrl: string, secret: string, id: string, isRead: boolean) => {
  const res = await fetch(`${baseUrl}/api/emails/${id}/status`, {
    method: 'PATCH',
    headers: buildHeaders(secret),
    body: JSON.stringify({ isRead })
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to update status');
  }
  return res.json();
};

export const deleteEmail = async (baseUrl: string, secret: string, id: string) => {
  const res = await fetch(`${baseUrl}/api/emails/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(secret)
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to delete email');
  }
};
