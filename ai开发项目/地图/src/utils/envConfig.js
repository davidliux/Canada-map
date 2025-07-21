/**
 * 环境配置工具
 * 统一处理环境变量和配置检测
 */

// 检测是否在浏览器环境
export const isBrowser = typeof window !== 'undefined';

// 检测是否在开发环境
export const isDevelopment = () => {
  if (!isBrowser) return false;
  
  // 检查多种开发环境指标
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
  const isDevPort = window.location.port === '5173' || window.location.port === '3000';
  const isViteMode = import.meta.env?.MODE === 'development';
  
  return isLocalhost || isDevPort || isViteMode;
};

// 检测是否在生产环境
export const isProduction = () => {
  if (!isBrowser) return false;
  
  const hostname = window.location.hostname;
  const isVercelDomain = hostname.includes('vercel.app') || hostname.includes('canada-map');
  const isViteMode = import.meta.env?.MODE === 'production';
  
  return isVercelDomain || isViteMode || !isDevelopment();
};

// 检测是否强制使用API
export const shouldForceAPI = () => {
  if (!isBrowser) return false;
  
  // 检查环境变量
  const envForce = import.meta.env?.VITE_USE_API === 'true';
  
  // 检查localStorage设置
  const localStorageForce = localStorage.getItem('forceUseAPI') === 'true';
  
  return envForce || localStorageForce;
};

// 获取API基础URL
export const getAPIBaseURL = () => {
  if (!isBrowser) return '/api';
  
  if (isProduction()) {
    return 'https://canada-map-oyu1.vercel.app/api';
  } else {
    return '/api';
  }
};

// 决定是否使用API存储
export const shouldUseAPIStorage = () => {
  if (!isBrowser) return false;
  
  // 开发环境默认使用localStorage，除非强制使用API
  if (isDevelopment()) {
    return shouldForceAPI();
  }
  
  // 生产环境默认使用API
  return true;
};

// 获取完整的环境配置
export const getEnvironmentConfig = () => {
  return {
    isBrowser: isBrowser,
    isDevelopment: isDevelopment(),
    isProduction: isProduction(),
    shouldForceAPI: shouldForceAPI(),
    shouldUseAPIStorage: shouldUseAPIStorage(),
    apiBaseURL: getAPIBaseURL(),
    hostname: isBrowser ? window.location.hostname : 'unknown',
    port: isBrowser ? window.location.port : 'unknown',
    viteMode: import.meta.env?.MODE || 'unknown'
  };
};

// 调试函数
export const logEnvironmentConfig = () => {
  const config = getEnvironmentConfig();
  console.log('🔧 环境配置:', config);
  return config;
};

// 设置强制使用API（用于测试）
export const setForceAPI = (force = true) => {
  if (isBrowser) {
    localStorage.setItem('forceUseAPI', force.toString());
    console.log(`🔧 ${force ? '启用' : '禁用'}强制API模式`);
  }
};

export default {
  isBrowser,
  isDevelopment,
  isProduction,
  shouldForceAPI,
  getAPIBaseURL,
  shouldUseAPIStorage,
  getEnvironmentConfig,
  logEnvironmentConfig,
  setForceAPI
};
