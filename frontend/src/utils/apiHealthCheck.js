/**
 * API健康检查工具
 * 用于检测后端服务可用性
 */

// 获取API基础URL
const getApiUrl = () => {
  const isDev = import.meta.env.DEV;
  return isDev
    ? '/api/v1'  // 开发环境使用相对路径
    : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api/v1');
};

/**
 * 检查后端服务健康状态
 * @returns {Promise<{healthy: boolean, message: string, details: object}>}
 */
export async function checkBackendHealth() {
  const apiUrl = getApiUrl();
  const healthUrl = `${apiUrl}/health`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时

    const response = await fetch(healthUrl, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        healthy: true,
        message: '后端服务正常运行',
        details: {
          status: response.status,
          data: data
        }
      };
    } else {
      return {
        healthy: false,
        message: `后端服务响应异常 (状态码: ${response.status})`,
        details: {
          status: response.status,
          statusText: response.statusText
        }
      };
    }
  } catch (error) {
    // 分析错误类型
    let message = '无法连接到后端服务';
    let suggestion = '';

    if (error.name === 'AbortError') {
      message = '后端服务响应超时';
      suggestion = '请检查网络连接或联系管理员';
    } else if (error.message.includes('Failed to fetch')) {
      message = '无法连接到后端服务';
      suggestion = '请确保后端服务已启动 (端口: 5050)';
    } else if (error.message.includes('NetworkError')) {
      message = '网络错误';
      suggestion = '请检查网络连接';
    }

    return {
      healthy: false,
      message: message,
      suggestion: suggestion,
      details: {
        error: error.message,
        apiUrl: apiUrl
      }
    };
  }
}

/**
 * 检查数据库连接状态
 * @returns {Promise<{connected: boolean, message: string}>}
 */
export async function checkDatabaseConnection() {
  const apiUrl = getApiUrl();

  try {
    // 尝试获取一个简单的数据来验证数据库连接
    const response = await fetch(`${apiUrl}/truck-delivery/cities?includeStats=false&limit=1`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      return {
        connected: true,
        message: '数据库连接正常'
      };
    } else {
      const errorData = await response.json().catch(() => null);
      return {
        connected: false,
        message: errorData?.error?.message || '数据库查询失败',
        details: errorData
      };
    }
  } catch (error) {
    return {
      connected: false,
      message: '无法验证数据库连接',
      error: error.message
    };
  }
}

/**
 * 执行完整的系统健康检查
 * @returns {Promise<{overall: boolean, backend: object, database: object}>}
 */
export async function performSystemHealthCheck() {
  const [backendHealth, databaseStatus] = await Promise.all([
    checkBackendHealth(),
    checkDatabaseConnection()
  ]);

  return {
    overall: backendHealth.healthy && databaseStatus.connected,
    backend: backendHealth,
    database: databaseStatus,
    timestamp: new Date().toISOString()
  };
}

/**
 * 显示健康检查结果的UI提示
 * @param {object} healthStatus - 健康检查结果
 */
export function displayHealthStatus(healthStatus) {
  if (healthStatus.overall) {
    console.log('✅ 系统健康检查通过');
    return null;
  }

  const errors = [];

  if (!healthStatus.backend.healthy) {
    errors.push({
      type: 'backend',
      message: healthStatus.backend.message,
      suggestion: healthStatus.backend.suggestion || '请启动后端服务: cd backend && npm start'
    });
  }

  if (!healthStatus.database.connected) {
    errors.push({
      type: 'database',
      message: healthStatus.database.message,
      suggestion: '请检查PostgreSQL服务是否运行'
    });
  }

  return errors;
}

/**
 * 自动重试机制
 * @param {Function} fn - 要重试的函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} delay - 重试延迟（毫秒）
 */
export async function retryWithBackoff(fn, maxRetries = 3, delay = 1000) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`操作失败，第 ${i + 1} 次重试...`);

      if (i < maxRetries - 1) {
        // 指数退避
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  throw lastError;
}

export default {
  checkBackendHealth,
  checkDatabaseConnection,
  performSystemHealthCheck,
  displayHealthStatus,
  retryWithBackoff
};