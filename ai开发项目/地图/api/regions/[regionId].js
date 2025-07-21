/**
 * Vercel API: 单个区域配置管理
 * GET /api/regions/[regionId] - 获取指定区域配置
 * PUT /api/regions/[regionId] - 更新指定区域配置
 * DELETE /api/regions/[regionId] - 删除指定区域配置
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
    // 从URL中提取regionId
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const regionId = pathParts[pathParts.length - 1];

    if (!regionId || regionId === 'index.js') {
      return createErrorResponse('区域ID不能为空', 400);
    }

    switch (request.method) {
      case 'GET':
        return await handleGetRegion(regionId);
      case 'PUT':
        return await handleUpdateRegion(regionId, request);
      case 'DELETE':
        return await handleDeleteRegion(regionId);
      default:
        return createErrorResponse(`方法 ${request.method} 不被支持`, 405);
    }
  } catch (error) {
    console.error('API错误:', error);
    return createErrorResponse('服务器内部错误', 500, error.message);
  }
}

/**
 * 获取指定区域配置
 */
async function handleGetRegion(regionId) {
  try {
    const config = await kvStorage.getRegionConfig(regionId);
    
    if (!config) {
      return createErrorResponse(`区域 ${regionId} 不存在`, 404);
    }

    return createResponse(config);
  } catch (error) {
    console.error(`获取区域${regionId}配置失败:`, error);
    return createErrorResponse('获取区域配置失败', 500, error.message);
  }
}

/**
 * 更新指定区域配置
 */
async function handleUpdateRegion(regionId, request) {
  try {
    const configData = await request.json();
    
    if (!configData) {
      return createErrorResponse('配置数据不能为空', 400);
    }

    // 验证必要字段
    if (!configData.regionName) {
      return createErrorResponse('区域名称不能为空', 400);
    }

    const savedConfig = await kvStorage.saveRegionConfig(regionId, configData);
    
    return createResponse(savedConfig, 200, '区域配置更新成功');
  } catch (error) {
    console.error(`更新区域${regionId}配置失败:`, error);
    return createErrorResponse('更新区域配置失败', 500, error.message);
  }
}

/**
 * 删除指定区域配置
 */
async function handleDeleteRegion(regionId) {
  try {
    // 检查区域是否存在
    const existingConfig = await kvStorage.getRegionConfig(regionId);
    if (!existingConfig) {
      return createErrorResponse(`区域 ${regionId} 不存在`, 404);
    }

    await kvStorage.deleteRegionConfig(regionId);
    
    return createResponse(
      { regionId, deletedAt: new Date().toISOString() }, 
      200, 
      '区域配置删除成功'
    );
  } catch (error) {
    console.error(`删除区域${regionId}配置失败:`, error);
    return createErrorResponse('删除区域配置失败', 500, error.message);
  }
}
