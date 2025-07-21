/**
 * Vercel API: 区域配置管理
 * GET /api/regions - 获取所有区域配置
 * POST /api/regions - 批量保存区域配置
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
        return await handleGetRegions(request);
      case 'POST':
        return await handleSaveRegions(request);
      default:
        return createErrorResponse(`方法 ${request.method} 不被支持`, 405);
    }
  } catch (error) {
    console.error('API错误:', error);
    return createErrorResponse('服务器内部错误', 500, error.message);
  }
}

/**
 * 获取所有区域配置
 */
async function handleGetRegions(request) {
  try {
    const url = new URL(request.url);
    const regionId = url.searchParams.get('regionId');
    const includeStats = url.searchParams.get('includeStats') === 'true';

    if (regionId) {
      // 获取单个区域配置
      const config = await kvStorage.getRegionConfig(regionId);
      if (!config) {
        return createErrorResponse(`区域 ${regionId} 不存在`, 404);
      }
      return createResponse(config);
    } else {
      // 获取所有区域配置
      const allConfigs = await kvStorage.getAllRegionConfigs();
      
      let responseData = allConfigs;
      
      if (includeStats) {
        const stats = await kvStorage.getCachedStats();
        responseData = {
          regions: allConfigs,
          stats
        };
      }
      
      return createResponse(responseData);
    }
  } catch (error) {
    console.error('获取区域配置失败:', error);
    return createErrorResponse('获取区域配置失败', 500, error.message);
  }
}

/**
 * 保存区域配置
 */
async function handleSaveRegions(request) {
  try {
    const body = await request.json();
    
    if (!body) {
      return createErrorResponse('请求体不能为空', 400);
    }

    // 检查是否是单个区域配置
    if (body.regionId) {
      const { regionId, ...configData } = body;
      const savedConfig = await kvStorage.saveRegionConfig(regionId, configData);
      return createResponse(savedConfig, 200, '区域配置保存成功');
    }
    
    // 检查是否是批量区域配置
    if (typeof body === 'object' && !Array.isArray(body)) {
      const savedConfigs = await kvStorage.saveAllRegionConfigs(body);
      const stats = await kvStorage.calculateStats(savedConfigs);
      
      return createResponse({
        regions: savedConfigs,
        stats,
        count: Object.keys(savedConfigs).length
      }, 200, '批量区域配置保存成功');
    }

    return createErrorResponse('无效的请求格式', 400);
  } catch (error) {
    console.error('保存区域配置失败:', error);
    return createErrorResponse('保存区域配置失败', 500, error.message);
  }
}
