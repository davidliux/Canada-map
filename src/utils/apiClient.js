/**
 * 获取 API 基础 URL
 * 根据环境自动切换：
 * - 生产环境 (Vercel): 使用相对路径 /api
 * - 开发环境: 使用 localhost:5050 或环境变量配置
 */
function getApiBaseUrl() {
  // 检查是否在 Vercel 环境
  const isVercel = window.location.hostname.includes('vercel.app') || 
                   window.location.hostname.includes('vercel.sh');
  
  // 检查环境变量配置
  const envUrl = import.meta?.env?.VITE_API_BASE_URL;
  const apiMode = import.meta?.env?.VITE_API_MODE; // 'serverless', 'local', 'disabled'
  
  // 如果明确禁用 API，返回 null
  if (apiMode === 'disabled') {
    return null;
  }
  
  // 生产环境或 serverless 模式，使用相对路径
  if (isVercel || apiMode === 'serverless') {
    return '/api';
  }
  
  // 开发环境，使用配置的 URL 或默认值
  if (envUrl) {
    return envUrl;
  }
  
  // 默认使用本地后端
  return 'http://localhost:5050/api/v1';
}

export async function apiGet(path, params = {}) {
  const base = getApiBaseUrl();
  
  // 如果 API 被禁用，抛出特定错误
  if (!base) {
    throw new Error('API_DISABLED');
  }
  
  // 构建完整 URL
  const fullUrl = base.startsWith('http') ? base + path : window.location.origin + base + path;
  const url = new URL(fullUrl);
  
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
  const base = getApiBaseUrl();
  
  if (!base) {
    throw new Error('API_DISABLED');
  }
  
  const fullUrl = base.startsWith('http') ? base + path : window.location.origin + base + path;
  
  const res = await fetch(fullUrl, {
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
  const base = getApiBaseUrl();
  
  if (!base) {
    throw new Error('API_DISABLED');
  }
  
  const fullUrl = base.startsWith('http') ? base + path : window.location.origin + base + path;
  
  const res = await fetch(fullUrl, {
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
  const base = getApiBaseUrl();
  
  if (!base) {
    throw new Error('API_DISABLED');
  }
  
  const fullUrl = base.startsWith('http') ? base + path : window.location.origin + base + path;
  
  const res = await fetch(fullUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`);
  const data = await res.json();
  if (data && data.success) return data.data;
  throw new Error(data?.error?.message || 'Unknown API error');
}

/**
 * 检查 API 是否可用
 */
export function isApiEnabled() {
  return getApiBaseUrl() !== null;
}

/**
 * 获取当前 API 模式
 */
export function getApiMode() {
  const isVercel = window.location.hostname.includes('vercel.app') || 
                   window.location.hostname.includes('vercel.sh');
  const apiMode = import.meta?.env?.VITE_API_MODE;
  
  if (apiMode === 'disabled') return 'disabled';
  if (isVercel || apiMode === 'serverless') return 'serverless';
  return 'local';
}
