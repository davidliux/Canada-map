/**
 * Vercel API: 数据备份管理
 * GET /api/backup - 获取备份列表
 * POST /api/backup - 创建新备份
 */

import { kvStorage } from '../../lib/kv-storage.js';

// 通用响应格式
const createResponse = (data, status = 200, message = 'Success') => {
  return new Response(JSON.stringify({
    success: status < 400,
    message,
    data,
    timestamp: new Date().toISOString()
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
};

const createErrorResponse = (message, status = 500, details = null) => {
  return createResponse({ error: message, details }, status, message);
};

export default async function handler(request) {
  // 处理CORS预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  try {
    switch (request.method) {
      case 'GET':
        return await handleGetBackups(request);
      case 'POST':
        return await handleCreateBackup(request);
      default:
        return createErrorResponse(`方法 ${request.method} 不被支持`, 405);
    }
  } catch (error) {
    console.error('备份API错误:', error);
    return createErrorResponse('服务器内部错误', 500, error.message);
  }
}

/**
 * 获取备份列表
 */
async function handleGetBackups(request) {
  try {
    const url = new URL(request.url);
    const includeData = url.searchParams.get('includeData') === 'true';
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    
    const backupList = await kvStorage.getBackupList();
    
    // 按时间倒序排列
    const sortedBackups = backupList
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    let responseData = sortedBackups;

    if (includeData && sortedBackups.length > 0) {
      // 如果需要包含数据，获取最新备份的详细信息
      const latestBackup = sortedBackups[0];
      const backupKey = `data:backups:${latestBackup.id}`;
      const backupData = await kvStorage.kv.get(backupKey);
      
      responseData = {
        backups: sortedBackups,
        latestBackupData: backupData
      };
    }

    return createResponse(responseData);
  } catch (error) {
    console.error('获取备份列表失败:', error);
    return createErrorResponse('获取备份列表失败', 500, error.message);
  }
}

/**
 * 创建新备份
 */
async function handleCreateBackup(request) {
  try {
    const body = await request.json();
    const { name, type = 'manual' } = body || {};

    if (!name) {
      return createErrorResponse('备份名称不能为空', 400);
    }

    // 验证备份类型
    const validTypes = ['manual', 'auto', 'migration'];
    if (!validTypes.includes(type)) {
      return createErrorResponse('无效的备份类型', 400);
    }

    const backup = await kvStorage.createBackup(name, type);
    
    return createResponse(backup, 201, '备份创建成功');
  } catch (error) {
    console.error('创建备份失败:', error);
    return createErrorResponse('创建备份失败', 500, error.message);
  }
}
