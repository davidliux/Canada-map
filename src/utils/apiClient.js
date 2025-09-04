/**
 * 通用 API 客户端
 * 使用智能环境配置，自动适应不同部署环境
 */
import environmentConfig from '../config/environment.js';

// 使用环境配置获取 API 基础 URL
function getApiBaseUrl() {
  return environmentConfig.apiBaseUrl;
}

// 通用的 API 请求处理
async function handleApiResponse(response, method, path) {
  if (!response.ok) {
    throw new Error(`${method} ${path} failed: ${response.status}`);
  }
  
  const data = await response.json();
  
  // 兼容不同的响应格式
  if (data && typeof data === 'object') {
    // 如果有 success 字段，使用标准格式
    if ('success' in data) {
      if (data.success) {
        return data.data;
      }
      throw new Error(data?.error?.message || 'API request failed');
    }
    // 否则直接返回数据
    return data;
  }
  
  return data;
}

export async function apiGet(path, params = {}) {
  const base = getApiBaseUrl();
  
  // 如果 API 被禁用，抛出特定错误
  if (!base) {
    throw new Error('API_DISABLED');
  }
  
  // 构建完整 URL
  const fullUrl = base.startsWith('http') 
    ? base + path 
    : window.location.origin + base + path;
  const url = new URL(fullUrl);
  
  // 添加查询参数
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v));
    }
  });
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });
  
  return handleApiResponse(response, 'GET', path);
}

export async function apiPost(path, body = {}) {
  const base = getApiBaseUrl();
  
  if (!base) {
    throw new Error('API_DISABLED');
  }
  
  const fullUrl = base.startsWith('http') 
    ? base + path 
    : window.location.origin + base + path;
  
  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  return handleApiResponse(response, 'POST', path);
}

export async function apiPut(path, body = {}) {
  const base = getApiBaseUrl();
  
  if (!base) {
    throw new Error('API_DISABLED');
  }
  
  const fullUrl = base.startsWith('http') 
    ? base + path 
    : window.location.origin + base + path;
  
  const response = await fetch(fullUrl, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  return handleApiResponse(response, 'PUT', path);
}

export async function apiPatch(path, body = {}) {
  const base = getApiBaseUrl();
  
  if (!base) {
    throw new Error('API_DISABLED');
  }
  
  const fullUrl = base.startsWith('http') 
    ? base + path 
    : window.location.origin + base + path;
  
  const response = await fetch(fullUrl, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  return handleApiResponse(response, 'PATCH', path);
}

export async function apiDelete(path) {
  const base = getApiBaseUrl();
  
  if (!base) {
    throw new Error('API_DISABLED');
  }
  
  const fullUrl = base.startsWith('http') 
    ? base + path 
    : window.location.origin + base + path;
  
  const response = await fetch(fullUrl, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
    },
  });
  
  // DELETE 可能返回空响应
  if (response.status === 204) {
    return true;
  }
  
  return handleApiResponse(response, 'DELETE', path);
}

/**
 * 检查 API 是否可用
 */
export function isApiEnabled() {
  return environmentConfig.apiEnabled();
}

/**
 * 获取当前 API 模式
 */
export function getApiMode() {
  return environmentConfig.apiMode;
}

/**
 * 获取环境状态
 */
export function getEnvironmentStatus() {
  return environmentConfig.getStatus();
}

/**
 * 刷新环境配置（重新检测后端）
 */
export async function refreshEnvironment() {
  return environmentConfig.refresh();
}

// 导出环境配置（便于其他模块使用）
export { environmentConfig };