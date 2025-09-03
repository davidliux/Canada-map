export async function apiGet(path, params = {}) {
  const base = (import.meta?.env?.VITE_API_BASE_URL) || 'http://localhost:5050/api/v1';
  const url = new URL(base + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  const data = await res.json();
  if (data && data.success) return data.data;
  throw new Error(data?.error?.message || 'Unknown API error');
}

export async function apiPost(path, body = {}) {
  const base = (import.meta?.env?.VITE_API_BASE_URL) || 'http://localhost:5050/api/v1';
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  const data = await res.json();
  if (data && data.success) return data.data;
  throw new Error(data?.error?.message || 'Unknown API error');
}

export async function apiPut(path, body = {}) {
  const base = (import.meta?.env?.VITE_API_BASE_URL) || 'http://localhost:5050/api/v1';
  const res = await fetch(base + path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
  const data = await res.json();
  if (data && data.success) return data.data;
  throw new Error(data?.error?.message || 'Unknown API error');
}

export async function apiPatch(path, body = {}) {
  const base = (import.meta?.env?.VITE_API_BASE_URL) || 'http://localhost:5050/api/v1';
  const res = await fetch(base + path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`);
  const data = await res.json();
  if (data && data.success) return data.data;
  throw new Error(data?.error?.message || 'Unknown API error');
}
