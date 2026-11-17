export async function fetchApi<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = (await res.json().catch(() => null)) as any;

  if (!res.ok) {
    throw new Error(data?.error || `网络请求错误 (${res.status})`);
  }

  return data as T;
}
