/**
 * 智能环境配置 - 自动适应各种部署环境
 * 
 * 工作原理：
 * 1. 自动检测运行环境（Vercel/本地/其他）
 * 2. 智能选择 API 模式（serverless/local/disabled）
 * 3. 无需手动修改代码，自动适配
 */

// 检测是否在 Vercel 环境
const isVercel = () => {
  return window.location.hostname.includes('vercel.app') || 
         window.location.hostname.includes('vercel.sh');
};

// 检测是否在本地开发环境
const isLocalhost = () => {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1';
};

// API 模式缓存
let apiModeCache = null;
let backendCheckPromise = null;

// 检测后端服务是否可用
export const checkBackendAvailability = async () => {
  // 避免重复检测
  if (backendCheckPromise) return backendCheckPromise;
  
  backendCheckPromise = (async () => {
    // 使用 Supabase 后，禁用本地后端 API
    // 直接返回 disabled 模式，避免无用的 API 调用
    apiModeCache = 'disabled';
    console.log('📦 使用 Supabase 存储，禁用本地后端 API');
    return 'disabled';
    
    /* 原有的后端检测逻辑 - 已禁用
    // Vercel 环境直接使用 Serverless
    if (isVercel()) {
      apiModeCache = 'serverless';
      return 'serverless';
    }
    
    // 本地环境检测后端
    if (isLocalhost()) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        
        const response = await fetch('http://localhost:5050/api/v1/health', {
          signal: controller.signal,
          method: 'GET',
          mode: 'cors'
        }).catch(() => null);
        
        clearTimeout(timeoutId);
        
        if (response && response.ok) {
          apiModeCache = 'local';
          console.log('✅ 本地后端服务已连接');
          return 'local';
        }
      } catch (error) {
        // 继续到 fallback
      }
      
      // 本地环境，后端不可用，使用纯前端模式
      apiModeCache = 'disabled';
      console.log('📦 使用本地存储模式（无后端）');
      return 'disabled';
    }
    
    // 其他环境默认禁用
    apiModeCache = 'disabled';
    return 'disabled';
    */
  })();
  
  return backendCheckPromise;
};

// 获取 API 模式（同步方法）
export const getApiMode = () => {
  // 使用 Supabase，始终返回 disabled
  return 'disabled';
  
  /* 原有逻辑 - 已禁用
  // 优先使用缓存
  if (apiModeCache) return apiModeCache;
  
  // 检查环境变量（允许强制指定）
  const envMode = import.meta.env.VITE_API_MODE;
  if (envMode && envMode !== 'auto') {
    apiModeCache = envMode;
    return envMode;
  }
  
  // 基于环境的默认值
  if (isVercel()) {
    apiModeCache = 'serverless';
    return 'serverless';
  }
  
  if (isLocalhost()) {
    // 本地环境默认先用 disabled，异步检测后会更新
    return apiModeCache || 'disabled';
  }
  
  apiModeCache = 'disabled';
  return 'disabled';
  */
};

// 获取 API 基础 URL
export const getApiBaseUrl = () => {
  const mode = getApiMode();
  
  switch (mode) {
    case 'serverless':
      // Vercel Serverless Functions
      return '/api';
      
    case 'local':
      // 本地 Express 后端
      return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api/v1';
      
    case 'disabled':
    default:
      // API 禁用，返回 null
      return null;
  }
};

// 统一的 API 请求方法
export const apiRequest = async (endpoint, options = {}) => {
  const baseUrl = getApiBaseUrl();
  
  // 如果 API 被禁用，直接返回 null
  if (!baseUrl) {
    throw new Error('API_DISABLED');
  }
  
  const url = `${baseUrl}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  return response.json();
};

// 环境配置对象
export const environmentConfig = {
  // 环境检测
  isProduction: () => !isLocalhost(),
  isDevelopment: () => isLocalhost(),
  isVercel: isVercel,
  isLocalhost: isLocalhost,
  
  // API 配置
  get apiMode() { return getApiMode(); },
  get apiBaseUrl() { return getApiBaseUrl(); },
  apiEnabled: () => getApiMode() !== 'disabled',
  apiRequest,
  
  // 功能开关
  features: {
    // Supabase 仅在配置了且在 Vercel 上启用
    get supabase() { 
      return isVercel() && !!import.meta.env.VITE_SUPABASE_URL;
    },
    // 本地存储始终可用
    localStorage: true,
    // 开发工具仅在本地显示
    get devTools() {
      return isLocalhost();
    },
  },
  
  // 刷新配置（用于动态更新）
  async refresh() {
    apiModeCache = null;
    await checkBackendAvailability();
    return this;
  },
  
  // 获取当前状态的描述
  getStatus() {
    const mode = this.apiMode;
    const env = isVercel() ? 'Vercel' : isLocalhost() ? '本地' : '未知';
    
    return {
      environment: env,
      apiMode: mode,
      apiUrl: this.apiBaseUrl,
      features: this.features,
      description: mode === 'serverless' 
        ? '使用 Vercel Serverless Functions'
        : mode === 'local'
        ? '使用本地 Express 后端'
        : '仅使用浏览器本地存储'
    };
  }
};

// 初始化时自动检测（不阻塞应用启动）
if (typeof window !== 'undefined') {
  checkBackendAvailability().then(() => {
    const status = environmentConfig.getStatus();
    console.log('🌍 环境配置已就绪:', status);
    
    // 触发自定义事件，通知其他模块
    window.dispatchEvent(new CustomEvent('environment-ready', { 
      detail: status 
    }));
  });
}

export default environmentConfig;